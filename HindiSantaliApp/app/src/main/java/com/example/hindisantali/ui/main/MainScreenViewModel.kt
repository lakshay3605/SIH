package com.example.hindisantali.ui.main

import android.Manifest
import android.app.Application
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import androidx.core.content.ContextCompat
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import com.example.hindisantali.asr.HindiAsrEngine
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

    private var recordingJob: Job? = null
    private var audioRecord: AudioRecord? = null
    private val recordedPcm = mutableListOf<Short>()
    
    private val asrEngine = HindiAsrEngine(application)
    private val translator = HindiSantaliTranslator(application)
    private val ttsEngine = SantaliTtsEngine(application)
    private val phraseCache = PhraseCache(application).also { it.initialize() }

    // Audio recording config
    private val sampleRate = 16000
    private val channelConfig = AudioFormat.CHANNEL_IN_MONO
    private val audioFormat = AudioFormat.ENCODING_PCM_16BIT

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

    // ── Recording lifecycle ──────────────────────────────────────────────────

    fun startRecording() {
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

        recordedPcm.clear()
        _uiState.update { it.copy(
            stage = PipelineStage.RECORDING,
            hindiText = "",
            santaliText = "",
            audioFilePath = null,
            errorMessage = null,
            latency = LatencyBreakdown()
        )}

        val bufferSize = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat)
        audioRecord = AudioRecord(
            MediaRecorder.AudioSource.MIC,
            sampleRate, channelConfig, audioFormat, bufferSize
        )
        audioRecord?.startRecording()

        recordingJob = viewModelScope.launch(Dispatchers.IO) {
            val buffer = ShortArray(bufferSize)
            while (_uiState.value.stage == PipelineStage.RECORDING) {
                val read = audioRecord?.read(buffer, 0, buffer.size) ?: 0
                if (read > 0) recordedPcm.addAll(buffer.take(read).toList())
            }
        }
    }

    fun stopRecordingAndProcess() {
        _uiState.update { it.copy(stage = PipelineStage.TRANSCRIBING) }
        
        val currentJob = recordingJob
        recordingJob = null

        viewModelScope.launch(Dispatchers.IO) {
            currentJob?.join()
            
            audioRecord?.stop()
            audioRecord?.release()
            audioRecord = null

            val pcmData = recordedPcm.toShortArray()
            if (pcmData.isEmpty()) {
                _uiState.update { it.copy(stage = PipelineStage.IDLE, errorMessage = "No audio captured. Try again.") }
                return@launch
            }

            runPipeline(pcmData)
        }
    }

    // ── Full pipeline ────────────────────────────────────────────────────────

    private suspend fun runPipeline(pcmData: ShortArray) {
        try {
            _uiState.update { it.copy(stage = PipelineStage.TRANSCRIBING) }
            val asrStart = System.currentTimeMillis()
            val hindiText = transcribeHindi(pcmData)
            val asrMs = System.currentTimeMillis() - asrStart

            _uiState.update { it.copy(
                hindiText = hindiText,
                latency = it.latency.copy(asrMs = asrMs)
            )}

            if (hindiText.isBlank()) {
                _uiState.update { it.copy(stage = PipelineStage.IDLE, errorMessage = "Could not recognise Hindi speech. Please speak clearly.") }
                return
            }

            _uiState.update { it.copy(stage = PipelineStage.TRANSLATING) }
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
                audioFilePath = santaliText,   // Store santali text so playAudio can re-speak it
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
            asrEngine.initialize()
            val result = asrEngine.transcribe(pcmData)
            asrEngine.release()
            result
        } catch (e: Exception) {
            asrEngine.release()
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

    /** Re-speaks the last Santali translation. The audioFilePath holds the text to re-speak. */
    fun playAudio() {
        val santaliText = _uiState.value.audioFilePath ?: return
        if (_uiState.value.isPlaying) return

        viewModelScope.launch(Dispatchers.IO) {
            _uiState.update { it.copy(isPlaying = true) }
            speakSantali(santaliText)
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
        audioRecord?.release()
        asrEngine.release()
        translator.release()
        ttsEngine.release()
    }
}
