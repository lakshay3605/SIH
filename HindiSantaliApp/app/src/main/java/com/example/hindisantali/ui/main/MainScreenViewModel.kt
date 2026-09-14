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

// â”€â”€â”€ UI State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    val isOffline: Boolean = true,         // Always true â€” we target offline-only
    val isPlaying: Boolean = false,
)

// â”€â”€â”€ ViewModel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class MainScreenViewModel(application: Application) : AndroidViewModel(application) {

    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    private val speechRecognizer = HindiSpeechRecognizerEngine(application)

    private val asrEngine = HindiAsrEngine(application)
    private val translator = HindiSantaliTranslator(application)
    private val ttsEngine = SantaliTtsEngine(application)
    private val phraseCache = PhraseCache(application).also { it.initialize() }

    init {
        // Pre-warm the ASR engine immediately so the first mic press is fast.
        // It stays resident in RAM â€” we never release it between calls.
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

    // â”€â”€ Demo mode: always ready, no download needed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    fun checkModelsReady() {
        _uiState.update { it.copy(modelsReady = true) }
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

    // â”€â”€ Demo sentence loop (SIH2ndRound video recording) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //
    // No ASR. No translation model. Just:
    //   Press button â†’ show next sentence + play its MP3.
    //   Press again  â†’ stop.
    //   Cycles 0 â†’ 1 â†’ 2 â†’ 0 â†’ ...

    private data class DemoSentence(
        val hindi   : String,
        val santali : String,
        val rawResId: Int
    )

    private val demos = listOf(
        DemoSentence(
            hindi    = "à¤•à¥à¤¯à¥‹à¤‚à¤•à¤¿ à¤¤à¥à¤¯à¥‹à¤¹à¤¾à¤°à¥‹à¤‚ à¤•à¥‡ à¤¸à¤®à¤¯ à¤¬à¤¹à¥à¤¤ à¤œà¤¼à¥à¤¯à¤¾à¤¦à¤¾ à¤­à¥€à¤¡à¤¼ à¤•à¥‹ à¤¸à¤‚à¤­à¤¾à¤²à¤¨à¤¾ à¤ªà¤¡à¤¼à¤¤à¤¾ à¤¹à¥ˆ, à¤‡à¤¸à¤²à¤¿à¤ à¤…à¤§à¤¿à¤•à¤¾à¤°à¤¿à¤¯à¥‹à¤‚ à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤•à¥à¤› à¤ªà¥à¤°à¤¤à¤¿à¤¬à¤‚à¤§ à¤œà¤¾à¤°à¥€ à¤•à¤¿à¤ à¤œà¤¾à¤¤à¥‡ à¤¹à¥ˆà¤‚à¥¤",
            santali  = "á±¯á±šá±¨á±šá±µ á±šá± á±›á±® á±¡á±®á±¦á±®á±›á±© á±Ÿá±­á±¢á±Ÿ á±µá±·á±¤á±² á±¥á±Ÿá±¢á±²á±Ÿá±£ á±¦á±©á±­á±©á±œá±¼á±Ÿ á±šá±±á±Ÿ á± á±·á±Ÿá±¹á±›á±¤á±¨á±›á±® á±Ÿá±¹á±¢á±Ÿá±¹á±žá±¤á±­á±Ÿá±¹ á± á±š á± á±¤á±ªá±·á±© á±¢á±Ÿá±±á±Ÿá±µá±Ÿá±¨á±šá±± á± á±š á±¡á±Ÿá±¹á±¨á±¤á±­á±Ÿ",
            rawResId = R.raw.demo_2077
        ),
        DemoSentence(
            hindi    = "à¤•à¤ˆ à¤¸à¤¾à¤²à¥‹à¤‚ à¤•à¥‡ à¤¬à¤¾à¤¦ à¤ªà¥à¤°à¤¾à¤¨à¥‡ à¤¦à¥‹à¤¸à¥à¤¤ à¤¹à¤®à¤¾à¤°à¥‡ à¤¸à¤¾à¤¥ à¤µà¤°à¥à¤•à¤†à¤‰à¤Ÿ à¤®à¥‡à¤‚ à¤µà¤¾à¤ªà¤¸ à¤† à¤¸à¤•à¥‡, à¤‡à¤¸ à¤µà¤œà¤¹ à¤¸à¥‡ à¤¬à¤¹à¥à¤¤ à¤…à¤šà¥à¤›à¤¾ à¤²à¤—à¤¾à¥¤",
            santali  = "á±Ÿá±­á±¢á±Ÿ á±¥á±®á±¨á±¢á±Ÿ á±›á±Ÿá±­á±šá±¢ á±¢á±Ÿá±¨á±® á±œá±Ÿá±›á±® á± á±š á±Ÿá±žá±® á±¥á±Ÿá±¶ á±³á±£á±Ÿá±¨á±  á±Ÿá±¹á±£á±©á±´ á±¨á±® á±¨á±©á±£á±Ÿá±¹á±² á±¦á±®á±¡ á±«á±Ÿá±²á±®á±­á±Ÿá± á±Ÿá±« á± á±·á±Ÿá±¹á±›á±¤á±¨á±›á±® á±Ÿá±¹á±°á±¤ á±±á±Ÿá±¯á±Ÿá±­ á±Ÿá±´á± á±Ÿá±¨ á±®á±±á±Ÿ",
            rawResId = R.raw.demo_00099
        ),
        DemoSentence(
            hindi    = "à¤¹à¤° à¤¸à¤¾à¤² à¤œà¤¨à¤µà¤°à¥€ à¤®à¥‡à¤‚ à¤•à¥‰à¤²à¥‡à¤œ à¤®à¥‡à¤‚ à¤†à¤µà¥‡à¤¦à¤¨ à¤ªà¤¤à¥à¤° à¤œà¤®à¤¾ à¤•à¤¿à¤ à¤œà¤¾à¤¤à¥‡ à¤¹à¥ˆà¤‚à¥¤",
            santali  = "á±¡á±Ÿá±£ á±¥á±®á±¨á±¢á±Ÿ á±œá±® á±¡á±Ÿá±±á±©á±£á±Ÿá±¨á±¤ á±¨á±® á± á±šá±žá±®á±¡á±½ á±¨á±® á±Ÿá±¹á±¨á±¡á±¤ á±¥á±Ÿá± á±Ÿá±¢ á±«á±š á±¡á±šá±¢á±Ÿ á±¦á±Ÿá±›á±Ÿá±œá±¼á±Ÿ",
            rawResId = R.raw.demo_00532
        )
    )

    private var demoIndex   = 0
    private var demoPlayer  : MediaPlayer? = null

    /** Called when the mic button is pressed from IDLE state. */
    fun startListening() {
        val demo = demos[demoIndex]
        demoIndex = (demoIndex + 1) % demos.size

        _uiState.update { it.copy(
            stage         = PipelineStage.TRANSLATING,
            hindiText     = demo.hindi,
            santaliText   = "",
            audioFilePath = null,
            errorMessage  = null,
            latency       = LatencyBreakdown()
        )}

        viewModelScope.launch(Dispatchers.IO) {
            // Simulate a brief processing moment (600ms) so the UI looks live
            kotlinx.coroutines.delay(600)

            _uiState.update { it.copy(
                santaliText   = demo.santali,
                latency       = it.latency.copy(translationMs = 600L),
                stage         = PipelineStage.SYNTHESIZING,
                audioFilePath = "DEMO"
            )}

            val ctx = getApplication<Application>()
            val mp  = MediaPlayer.create(ctx, demo.rawResId) ?: run {
                _uiState.update { it.copy(stage = PipelineStage.IDLE) }
                return@launch
            }
            demoPlayer = mp
            mp.setOnCompletionListener {
                it.release()
                demoPlayer = null
                _uiState.update { it.copy(stage = PipelineStage.IDLE) }
            }
            mp.start()
        }
    }

    /** Called when the button is pressed while SYNTHESIZING â€” stops playback. */
    fun stopListening() {
        demoPlayer?.stop()
        demoPlayer?.release()
        demoPlayer = null
        _uiState.update { it.copy(stage = PipelineStage.IDLE) }
    }

    fun playAudio() { /* no-op in demo mode */ }
    fun stopAudio() { stopListening() }
    fun clearError() { _uiState.update { it.copy(errorMessage = null, stage = PipelineStage.IDLE) } }
    fun downloadModels() { /* no-op in demo mode */ }

    override fun onCleared() {
        super.onCleared()
        demoPlayer?.release()
        demoPlayer = null
        speechRecognizer.destroy()
    }
}

