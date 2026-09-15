package com.example.hindisantali.ui.main

import android.app.Application
import android.media.MediaPlayer
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import com.example.hindisantali.R
import com.example.hindisantali.asr.HindiSpeechRecognizerEngine

// --- UI State -----------------------------------------------------------

enum class PipelineStage {
    IDLE, RECORDING, TRANSCRIBING, TRANSLATING, SYNTHESIZING, PLAYING, ERROR
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
    val isOffline: Boolean = true,
    val isPlaying: Boolean = false,
)

// --- ViewModel ----------------------------------------------------------

class MainScreenViewModel(application: Application) : AndroidViewModel(application) {

    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    private val speechRecognizer = HindiSpeechRecognizerEngine(application)

    // Demo mode: always skip the download screen
    fun checkModelsReady() {
        _uiState.update { it.copy(modelsReady = true) }
    }

    // --- Demo data ---------------------------------------------------------
    // Texts loaded from strings.xml (guaranteed UTF-8) to avoid encoding bugs.

    private data class DemoSentence(
        val hindiResId : Int,
        val santaliResId: Int,
        val rawResId    : Int
    )

    private val demos = listOf(
        DemoSentence(R.string.demo_hindi_0, R.string.demo_santali_0, R.raw.demo_2077),
        DemoSentence(R.string.demo_hindi_1, R.string.demo_santali_1, R.raw.demo_00099),
        DemoSentence(R.string.demo_hindi_2, R.string.demo_santali_2, R.raw.demo_00532)
    )

    private var demoIndex  = 0
    private var demoPlayer : MediaPlayer? = null

    // --- Button logic ------------------------------------------------------
    //
    // Flow for the video demo:
    //   1. IDLE  -> press -> RECORDING  (red pulse, looks like it is listening)
    //   2. RECORDING -> press -> TRANSCRIBING (300ms) -> shows Hindi text
    //                         -> TRANSLATING  (600ms) -> shows Santali text
    //                         -> SYNTHESIZING          -> plays MP3
    //                         -> IDLE (after MP3 ends)

    /** Called when button pressed from IDLE. */
    fun startListening() {
        _uiState.update { it.copy(
            stage       = PipelineStage.RECORDING,
            hindiText   = "",
            santaliText = "",
            audioFilePath = null,
            errorMessage  = null,
            latency       = LatencyBreakdown()
        )}
    }

    /** Called when button pressed from RECORDING — runs the fake pipeline. */
    fun stopListening() {
        val ctx   = getApplication<Application>()
        val demo  = demos[demoIndex]
        val hindi   = ctx.getString(demo.hindiResId)
        val santali = ctx.getString(demo.santaliResId)
        demoIndex = (demoIndex + 1) % demos.size

        viewModelScope.launch(Dispatchers.Main) {
            // Step 1: TRANSCRIBING — show Hindi text appearing
            _uiState.update { it.copy(stage = PipelineStage.TRANSCRIBING) }
            kotlinx.coroutines.delay(400)
            _uiState.update { it.copy(hindiText = hindi) }

            // Step 2: TRANSLATING — brief pause then Santali text appears
            kotlinx.coroutines.delay(200)
            _uiState.update { it.copy(stage = PipelineStage.TRANSLATING) }
            kotlinx.coroutines.delay(700)
            _uiState.update { it.copy(
                santaliText   = santali,
                latency       = LatencyBreakdown(asrMs = 380L, translationMs = 680L, ttsMs = 0L)
            )}

            // Step 3: SYNTHESIZING — play MP3
            kotlinx.coroutines.delay(100)
            _uiState.update { it.copy(
                stage         = PipelineStage.SYNTHESIZING,
                audioFilePath = "DEMO"
            )}

            val mp = MediaPlayer.create(ctx, demo.rawResId) ?: run {
                _uiState.update { it.copy(stage = PipelineStage.IDLE) }
                return@launch
            }
            demoPlayer = mp
            mp.setOnCompletionListener {
                it.release()
                demoPlayer = null
                _uiState.update { s -> s.copy(
                    stage = PipelineStage.IDLE,
                    latency = s.latency.copy(ttsMs = 120L)
                )}
            }
            mp.start()
        }
    }

    /** Stop audio if playing (used by the stop-audio button). */
    fun stopAudio() {
        demoPlayer?.stop()
        demoPlayer?.release()
        demoPlayer = null
        _uiState.update { it.copy(stage = PipelineStage.IDLE, isPlaying = false) }
    }

    fun playAudio()     { /* no-op; audio auto-plays after translation */ }
    fun clearError()    { _uiState.update { it.copy(errorMessage = null, stage = PipelineStage.IDLE) } }
    fun downloadModels(){ /* no-op in demo mode */ }

    override fun onCleared() {
        super.onCleared()
        demoPlayer?.release()
        demoPlayer = null
        speechRecognizer.destroy()
    }
}