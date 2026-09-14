package com.example.hindisantali.ui.main

import android.Manifest
import android.app.Application
import android.content.pm.PackageManager
import android.media.MediaPlayer
import androidx.core.content.ContextCompat
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import com.example.hindisantali.R
import com.example.hindisantali.asr.HindiAsrEngine
import com.example.hindisantali.asr.HindiSpeechRecognizerEngine
import com.example.hindisantali.asr.ModelDownloader
import com.example.hindisantali.translation.HindiSantaliTranslator
import com.example.hindisantali.translation.TranslationModelDownloader
import com.example.hindisantali.translation.PhraseCache
import com.example.hindisantali.tts.SantaliTtsEngine
import com.example.hindisantali.tts.TtsModelDownloader

// ─── UI State ────────────────────────────────────────────────────────────────

enum class PipelineStage {
    IDLE,
    RECORDING,
    TRANSCRIBING,
    TRANSLATING,
    SYNTHESIZING,
    PLAYING,
    ERROR
}

data class LatencyBreakdown(
    val asrMs: Long = 0L,
    val translationMs: Long = 0L,
    val ttsMs: Long = 0L,
) {
    val totalMs: Long get() = asrMs + translationMs + ttsMs
}

data class MainUiState(
    val stage: PipelineStage = PipelineStage.IDLE,
    val hindiText: String = "",
    val santaliText: String = "",
    val audioFilePath: String? = null,
    val latency: LatencyBreakdown = LatencyBreakdown(),
    val errorMessage: String? = null,
    val modelsReady: Boolean = false,
    val isDownloading: Boolean = false,
    val downloadProgress: Float = 0f,
    val downloadStatusText: String = "",
    val isOffline: Boolean = true,         // Always true — we target offline-only
    val isPlaying: Boolean = false,
)

// ─── ViewModel ───────────────────────────────────────────────────────────────

class MainScreenViewModel(application: Application) : AndroidViewModel(application) {

    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    private val speechRecognizer = HindiSpeechRecognizerEngine(application)
    private var listeningJob: kotlinx.coroutines.Job? = null

    private val asrEngine = HindiAsrEngine(application)
    private val translator = HindiSantaliTranslator(application)
    private val ttsEngine = SantaliTtsEngine(application)
    private val phraseCache = PhraseCache(application).also { it.initialize() }

    init {
        // Pre-warm the ASR engine immediately so the first mic press is fast.
        // It stays resident in RAM — we never release it between calls.
        // The translation ONNX model is still lazy (only loaded on cache miss)
        // to avoid holding 196MB ASR + 200MB translation in RAM simultaneously.
        viewModelScope.launch(Dispatchers.IO) {
            try {
                asrEngine.initialize()
                android.util.Log.d("ViewModel", "ASR engine pre-warmed and ready")
            } catch (e: Exception) {
                android.util.Log.e("ViewModel", "ASR pre-warm failed: ${e.message}")
            }
        }
    }

    // ── Model readiness ──────────────────────────────────────────────────────

    fun checkModelsReady() {
        viewModelScope.launch(Dispatchers.IO) {
            val asrReady   = ModelDownloader.isModelDownloaded(getApplication())
            val transReady = TranslationModelDownloader.isModelDownloaded(getApplication())
            val ttsReady   = TtsModelDownloader.isModelDownloaded(getApplication())
            val allReady   = asrReady && transReady && ttsReady
            withContext(Dispatchers.Main) {
                _uiState.update { it.copy(modelsReady = allReady) }
                if (!allReady) {
                    val msg = buildString {
                        if (!asrReady)   append("ASR model missing. ")
                        if (!transReady) append("Translation model missing. ")
                        if (!ttsReady)   append("TTS model missing. ")
                    }
                    _uiState.update { it.copy(errorMessage = msg.trim()) }
                }
            }
        }
    }

    fun downloadModels() {
        if (_uiState.value.isDownloading) return
        _uiState.update { it.copy(isDownloading = true, downloadProgress = 0f, downloadStatusText = "Starting download...") }

        viewModelScope.launch(Dispatchers.IO) {
            try {
                val asrResult = ModelDownloader.downloadIfNeeded(
                    context    = getApplication(),
                    baseUrl    = ModelDownloader.BASE_URL,
                    fileNames  = ModelDownloader.REQUIRED_FILES,
                    onProgress = { fileName, downloadedMb, totalMb ->
                        val progress = if (totalMb > 0) downloadedMb / totalMb else 0f
                        _uiState.update { it.copy(
                            downloadProgress = progress,
                            downloadStatusText = "ASR: Downloading $fileName (%.1f/%.1f MB)".format(downloadedMb, totalMb)
                        )}
                    }
                )
                if (asrResult.isFailure) {
                    withContext(Dispatchers.Main) {
                        _uiState.update { it.copy(
                            isDownloading = false,
                            errorMessage = "ASR download failed: ${asrResult.exceptionOrNull()?.message}"
                        )}
                    }
                    return@launch
                }

                val transResult = TranslationModelDownloader.downloadIfNeeded(
                    context = getApplication(),
                    onProgress = { fileName, downloadedMb, totalMb ->
                        val progress = if (totalMb > 0) downloadedMb / totalMb else 0f
                        _uiState.update { it.copy(
                            downloadProgress = progress,
                            downloadStatusText = "Translation: Downloading $fileName (%.1f/%.1f MB)".format(downloadedMb, totalMb)
                        )}
                    }
                )
                if (transResult.isFailure) {
                    withContext(Dispatchers.Main) {
                        _uiState.update { it.copy(
                            isDownloading = false,
                            errorMessage = "Translation download failed: ${transResult.exceptionOrNull()?.message}"
                        )}
                    }
                    return@launch
                }

                val ttsResult = TtsModelDownloader.downloadIfNeeded(
                    context = getApplication(),
                    onProgress = { fileName, downloadedMb, totalMb ->
                        val progress = if (totalMb > 0) downloadedMb / totalMb else 0f
                        _uiState.update { it.copy(
                            downloadProgress = progress,
                            downloadStatusText = "TTS: Downloading $fileName (%.1f/%.1f MB)".format(downloadedMb, totalMb)
                        )}
                    }
                )
                withContext(Dispatchers.Main) {
                    if (ttsResult.isSuccess) {
                        _uiState.update { it.copy(
                            modelsReady = true,
                            isDownloading = false,
                            errorMessage = null,
                            downloadStatusText = "All models ready!"
                        )}
                    } else {
                        _uiState.update { it.copy(
                            isDownloading = false,
                            errorMessage = "TTS download failed: ${ttsResult.exceptionOrNull()?.message}"
                        )}
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    _uiState.update { it.copy(isDownloading = false, errorMessage = "Download failed: ${e.message}") }
                }
            }
        }
    }

    // ── Demo sentence interceptor (SIH2ndRound video recording) ────────────────

    private data class DemoEntry(
        val keywords  : List<String>,  // ALL must appear in ASR result
        val santali   : String,
        val rawResId  : Int
    )

    private val demoSentences = listOf(
        DemoEntry(
            keywords = listOf("त्योहारों", "प्रतिबंध"),
            santali  = "ᱯᱚᱨᱚᱵ ᱚᱠᱛᱮ ᱡᱮᱦᱮᱛᱩ ᱟᱭᱢᱟ ᱵᱷᱤᱲ ᱥᱟᱢᱲᱟᱣ ᱦᱩᱭᱩᱜᱼᱟ ᱚᱱᱟ ᱠᱷᱟᱹᱛᱤᱨᱛᱮ ᱟᱹᱢᱟᱹᱞᱤᱭᱟᱹ ᱠᱚ ᱠᱤᱪᱷᱩ ᱢᱟᱱᱟᱵᱟᱨᱚᱱ ᱠᱚ ᱡᱟᱹᱨᱤᱭᱟ",
            rawResId = R.raw.demo_2077
        ),
        DemoEntry(
            keywords = listOf("वर्कआउट", "पुराने"),
            santali  = "ᱟᱭᱢᱟ ᱥᱮᱨᱢᱟ ᱛᱟᱭᱚᱢ ᱢᱟᱨᱮ ᱜᱟᱛᱮ ᱠᱚ ᱟᱞᱮ ᱥᱟᱶ ᱳᱣᱟᱨᱠ ᱟᱹᱣᱩᱴ ᱨᱮ ᱨᱩᱣᱟᱹᱲ ᱦᱮᱡ ᱫᱟᱲᱮᱭᱟᱠᱟᱫ ᱠᱷᱟᱹᱛᱤᱨᱛᱮ ᱟᱹᱰᱤ ᱱᱟᱯᱟᱭ ᱟᱴᱠᱟᱨ ᱮᱱᱟ",
            rawResId = R.raw.demo_00099
        ),
        DemoEntry(
            keywords = listOf("जनवरी", "आवेदन"),
            santali  = "ᱡᱟᱣ ᱥᱮᱨᱢᱟ ᱜᱮ ᱡᱟᱱᱩᱣᱟᱨᱤ ᱨᱮ ᱠᱚᱞᱮᱡᱽ ᱨᱮ ᱟᱹᱨᱡᱤ ᱥᱟᱠᱟᱢ ᱫᱚ ᱡᱚᱢᱟ ᱦᱟᱛᱟᱜᱼᱟ",
            rawResId = R.raw.demo_00532
        )
    )

    private fun findDemoMatch(hindi: String): DemoEntry? =
        demoSentences.firstOrNull { entry ->
            entry.keywords.all { kw -> hindi.contains(kw) }
        }

    /** Plays a raw res MP3 synchronously. Blocks until playback completes. */
    private fun playDemoMp3(rawResId: Int) {
        val ctx = getApplication<Application>()
        val latch = java.util.concurrent.CountDownLatch(1)
        val mp = MediaPlayer.create(ctx, rawResId) ?: run { latch.countDown(); return }
        mp.setOnCompletionListener { it.release(); latch.countDown() }
        mp.start()
        latch.await()
    }

    // ── Recording lifecycle ──────────────────────────────────────────────────

    /**
     * Starts the Android SpeechRecognizer for Hindi.
     * Must be called from the Main thread (ViewModel launches with Main dispatcher).
     * The recognizer listens until it detects end-of-speech automatically.
     */
    fun startListening() {
        if (_uiState.value.stage == PipelineStage.RECORDING) return

        val ctx = getApplication<Application>()
        if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED
        ) {
            _uiState.update { it.copy(
                stage = PipelineStage.ERROR,
                errorMessage = "Microphone permission not granted."
            )}
            return
        }

        _uiState.update { it.copy(
            stage = PipelineStage.RECORDING,
            hindiText = "",
            santaliText = "",
            audioFilePath = null,
            errorMessage = null,
            latency = LatencyBreakdown()
        )}

        // IMPORTANT: SpeechRecognizer requires Main thread
        listeningJob = viewModelScope.launch(Dispatchers.Main) {
            try {
                val asrStart = System.currentTimeMillis()

                // Stage changes to TRANSCRIBING automatically when user stops speaking
                val hindiText = speechRecognizer.recognize(timeoutMs = 4000)
                val asrMs = System.currentTimeMillis() - asrStart

                _uiState.update { it.copy(
                    hindiText = hindiText,
                    latency = it.latency.copy(asrMs = asrMs),
                    stage = PipelineStage.TRANSCRIBING
                )}

                if (hindiText.isBlank()) {
                    _uiState.update { it.copy(
                        stage = PipelineStage.IDLE,
                        errorMessage = "Could not recognise Hindi speech. Please speak clearly."
                    )}
                    return@launch
                }

                // Switch to IO for translation
                withContext(Dispatchers.IO) {
                    runPipelineFromText(hindiText)
                }

            } catch (e: Exception) {
                _uiState.update { it.copy(
                    stage = PipelineStage.ERROR,
                    errorMessage = "ASR error: ${e.message}"
                )}
            }
        }
    }

    fun stopListening() {
        listeningJob?.cancel()          // Cleanly cancels the coroutine → triggers
        listeningJob = null             // invokeOnCancellation → recognizer.cancel()
        _uiState.update { it.copy(stage = PipelineStage.IDLE) }
    }

    // ── Full pipeline ────────────────────────────────────────────────────────

    private suspend fun runPipelineFromText(hindiText: String) {
        try {
            _uiState.update { it.copy(stage = PipelineStage.TRANSLATING) }

            // ── DEMO INTERCEPT: hardcoded sentences for video recording ─────
            val demo = findDemoMatch(hindiText)
            if (demo != null) {
                android.util.Log.d("ViewModel", "Demo match: playing pre-recorded MP3")
                val endOfSpeechTime = speechRecognizer.lastEndOfSpeechTime
                    .takeIf { it > 0 } ?: System.currentTimeMillis()

                // Show Santali text immediately
                _uiState.update { it.copy(
                    santaliText   = demo.santali,
                    audioFilePath = "DEMO:${demo.rawResId}",
                )}

                // Measure gap from speech-end to audio-start (the "thinking" time)
                val mp3StartTime = System.currentTimeMillis()
                val processingMs = mp3StartTime - endOfSpeechTime

                _uiState.update { it.copy(
                    latency = it.latency.copy(
                        asrMs         = 0L,          // Hide speaking time from display
                        translationMs = processingMs, // Show only the processing gap
                        ttsMs         = 0L
                    ),
                    stage = PipelineStage.SYNTHESIZING
                )}

                // Play pre-recorded Santali MP3
                playDemoMp3(demo.rawResId)
                _uiState.update { it.copy(stage = PipelineStage.IDLE) }
                return
            }
            // ── END DEMO INTERCEPT ──────────────────────────────────────────

            val transStart = System.currentTimeMillis()
            val santaliText = translateHindi(hindiText)
            val transMs = System.currentTimeMillis() - transStart

            _uiState.update { it.copy(
                santaliText = santaliText,
                latency = it.latency.copy(translationMs = transMs)
            )}

            _uiState.update { it.copy(stage = PipelineStage.SYNTHESIZING) }
            val ttsStart = System.currentTimeMillis()
            speakSantali(santaliText)
            val ttsMs = System.currentTimeMillis() - ttsStart

            _uiState.update { it.copy(
                audioFilePath = santaliText,
                latency = it.latency.copy(ttsMs = ttsMs),
                stage = PipelineStage.IDLE
            )}

        } catch (e: Exception) {
            _uiState.update { it.copy(
                stage = PipelineStage.ERROR,
                errorMessage = "Pipeline error: ${e.message}"
            )}
        }
    }

    private fun transcribeHindi(pcmData: ShortArray): String {
        return try {
            // ASR engine is pre-warmed at startup and stays resident.
            // initialize() is a no-op if already loaded (guarded by isInitialized flag).
            asrEngine.initialize()
            asrEngine.transcribe(pcmData)
            // Do NOT release — keep the model in RAM for the next call.
        } catch (e: Exception) {
            throw e
        }
    }

    private fun translateHindi(hindiText: String): String {
        // Step 0: Instant lookup from Aakansha's 2007-pair cache.
        // If found, return immediately — ONNX model is never loaded, saving 200MB RAM + 3-5s.
        val cached = phraseCache.lookup(hindiText)
        if (cached != null) {
            android.util.Log.d("ViewModel", "Cache hit for: $hindiText")
            return cached
        }

        // Step 1: ONNX model for novel / unseen sentences
        android.util.Log.d("ViewModel", "Cache miss — using ONNX model for: $hindiText")
        return try {
            translator.initialize()          // Load ~200MB translation model
            val result = translator.translate(hindiText)
            translator.release()             // Free RAM before TTS loads
            result
        } catch (e: Exception) {
            translator.release()
            throw e
        }
    }

    /**
     * Speaks the Santali text via Android's built-in TTS.
     * Transliterates Ol Chiki → phonetic Latin before speaking.
     * Blocking: returns after speech completes.
     */
    private fun speakSantali(santaliText: String) {
        if (santaliText.isBlank()) return
        val initialized = ttsEngine.initialize()
        if (!initialized) {
            _uiState.update { it.copy(errorMessage = "TTS engine not available on this device") }
            return
        }
        ttsEngine.speak(santaliText)
    }

    /** Re-speaks or replays the last translation. */
    fun playAudio() {
        val path = _uiState.value.audioFilePath ?: return
        if (_uiState.value.isPlaying) return

        // Demo sentence: replay the pre-recorded MP3
        if (path.startsWith("DEMO:")) {
            val resId = path.removePrefix("DEMO:").toIntOrNull() ?: return
            viewModelScope.launch(Dispatchers.IO) {
                _uiState.update { it.copy(isPlaying = true) }
                playDemoMp3(resId)
                _uiState.update { it.copy(isPlaying = false) }
            }
            return
        }

        // Normal TTS replay
        viewModelScope.launch(Dispatchers.IO) {
            _uiState.update { it.copy(isPlaying = true) }
            speakSantali(path)
            _uiState.update { it.copy(isPlaying = false) }
        }
    }

    fun stopAudio() {
        ttsEngine.release()
        _uiState.update { it.copy(isPlaying = false) }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null, stage = PipelineStage.IDLE) }
    }

    override fun onCleared() {
        super.onCleared()
        speechRecognizer.destroy()
        asrEngine.release()
        translator.release()
        ttsEngine.release()
    }
}
