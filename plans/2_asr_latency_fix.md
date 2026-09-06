# ASR Latency Fix: 10s → <1s
**For:** Agent implementing the fix  
**Codebase:** `d:\sih2026\HindiSantaliApp`

---

## Root Cause (Read This First)

The current ASR uses `OfflineNemoEncDecCtcModelConfig` (IndicConformer INT8, 196MB). This is a batch/offline model designed for server-side use. It receives the ENTIRE audio recording as one giant buffer after the user stops speaking, then runs a full transformer forward pass through 196MB of weights. On mobile (4 cores, ~1.8GHz), this takes 8-12 seconds regardless of optimizations.

**Threading tricks, pre-warming, and numThreads tuning will NOT fix this.** The model is architecturally wrong for real-time mobile use.

---

## Solution: Replace IndicConformer with Android SpeechRecognizer API

Android's `SpeechRecognizer` API streams audio internally, returns results in 200-600ms, uses Google's on-device neural model (no download needed), has excellent Hindi support, and is free. This is the correct tool.

**Latency after fix:** ~200-600ms for 4-10 words in Hindi.

---

## Files to Modify

### 1. [NEW] `HindiSpeechRecognizerEngine.kt`
**Path:** `app/src/main/java/com/example/hindisantali/asr/HindiSpeechRecognizerEngine.kt`

Create this file from scratch. It wraps Android's `SpeechRecognizer` and exposes a coroutine-friendly `suspend fun recognize()`.

```kotlin
package com.example.hindisantali.asr

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import kotlinx.coroutines.CancellableContinuation
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Wraps Android's SpeechRecognizer API for Hindi speech-to-text.
 * Returns results in 200-600ms. Uses Google's on-device neural model.
 * No model download required.
 *
 * IMPORTANT: Android SpeechRecognizer must be created and used on the MAIN thread.
 * The ViewModel must call recognize() from Dispatchers.Main, not Dispatchers.IO.
 */
class HindiSpeechRecognizerEngine(private val context: Context) {

    private val TAG = "HindiSpeechRecognizerEngine"
    private var recognizer: SpeechRecognizer? = null

    /**
     * Check if the device supports speech recognition.
     */
    fun isAvailable(): Boolean =
        SpeechRecognizer.isRecognitionAvailable(context)

    /**
     * Recognize Hindi speech. Starts listening immediately and returns
     * the transcribed text when done. Call this on the MAIN thread.
     *
     * @param timeoutMs max silence timeout before auto-stopping (default 5s)
     * @return Recognized Hindi text, or empty string if nothing detected
     */
    suspend fun recognize(timeoutMs: Int = 5000): String =
        suspendCancellableCoroutine { continuation ->
            // Destroy any previous instance
            recognizer?.destroy()
            recognizer = SpeechRecognizer.createSpeechRecognizer(context)

            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                    RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, "hi-IN")
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "hi-IN")
                putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, false)
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, timeoutMs.toLong())
                putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 1500L)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
            }

            recognizer?.setRecognitionListener(object : RecognitionListener {
                override fun onResults(results: Bundle?) {
                    val matches = results
                        ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    val text = matches?.firstOrNull() ?: ""
                    Log.d(TAG, "ASR result: '$text'")
                    resumeSafely(continuation, text)
                }

                override fun onError(error: Int) {
                    val msg = when (error) {
                        SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
                        SpeechRecognizer.ERROR_CLIENT -> "Client side error"
                        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
                        SpeechRecognizer.ERROR_NETWORK -> "Network error"
                        SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
                        SpeechRecognizer.ERROR_NO_MATCH -> "No speech detected"
                        SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognizer busy"
                        SpeechRecognizer.ERROR_SERVER -> "Server error"
                        SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "Speech timeout"
                        else -> "Unknown error ($error)"
                    }
                    Log.e(TAG, "ASR error: $msg")
                    // On no-match or timeout, return empty string (not an exception)
                    if (error == SpeechRecognizer.ERROR_NO_MATCH ||
                        error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) {
                        resumeSafely(continuation, "")
                    } else {
                        resumeWithExceptionSafely(continuation,
                            RuntimeException("SpeechRecognizer error: $msg"))
                    }
                }

                override fun onReadyForSpeech(params: Bundle?) {
                    Log.d(TAG, "Ready for speech")
                }
                override fun onBeginningOfSpeech() {}
                override fun onRmsChanged(rmsdB: Float) {}
                override fun onBufferReceived(buffer: ByteArray?) {}
                override fun onEndOfSpeech() { Log.d(TAG, "End of speech detected") }
                override fun onPartialResults(partialResults: Bundle?) {}
                override fun onEvent(eventType: Int, params: Bundle?) {}
            })

            recognizer?.startListening(intent)
            Log.d(TAG, "startListening called")

            continuation.invokeOnCancellation {
                recognizer?.cancel()
                recognizer?.destroy()
                recognizer = null
            }
        }

    fun stopListening() {
        recognizer?.stopListening()
    }

    fun destroy() {
        recognizer?.destroy()
        recognizer = null
    }

    private fun resumeSafely(
        cont: CancellableContinuation<String>,
        value: String
    ) {
        if (cont.isActive) cont.resume(value)
    }

    private fun resumeWithExceptionSafely(
        cont: CancellableContinuation<String>,
        ex: Exception
    ) {
        if (cont.isActive) cont.resumeWithException(ex)
    }
}
```

---

### 2. [MODIFY] `MainScreenViewModel.kt`
**Path:** `app/src/main/java/com/example/hindisantali/ui/main/MainScreenViewModel.kt`

**Overview of changes:**
- Add `HindiSpeechRecognizerEngine` instance.
- Remove the `AudioRecord`, `recordingJob`, `recordedPcm` fields entirely. The new engine handles audio internally.
- Replace `startRecording()` / `stopRecordingAndProcess()` with a single `startListening()` function.
- The `recognize()` call must be on `Dispatchers.Main` (this is a hard Android requirement for SpeechRecognizer).
- Keep `HindiAsrEngine` (IndicConformer) as an offline fallback only.

**Step-by-step changes inside the ViewModel:**

#### A. Add import and field
```kotlin
import com.example.hindisantali.asr.HindiSpeechRecognizerEngine

// Inside MainScreenViewModel class, add field next to asrEngine:
private val speechRecognizer = HindiSpeechRecognizerEngine(application)
```

#### B. Replace startRecording() and stopRecordingAndProcess()

Remove both of these functions entirely. Replace them with a single `startListening()`:

```kotlin
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
    viewModelScope.launch(Dispatchers.Main) {
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
```

#### C. Rename runPipeline() → runPipelineFromText()

The existing `runPipeline(pcmData: ShortArray)` takes PCM audio. Since ASR is now handled by `SpeechRecognizer`, the pipeline starts from Hindi text directly:

```kotlin
// Rename and change signature from:
private suspend fun runPipeline(pcmData: ShortArray)

// To:
private suspend fun runPipelineFromText(hindiText: String) {
    try {
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
```

#### D. Remove AudioRecord fields and cleanup

Remove these fields from the ViewModel (they are no longer needed):
```kotlin
// DELETE these lines:
private var recordingJob: Job? = null
private var audioRecord: AudioRecord? = null
private val recordedPcm = mutableListOf<Short>()
private val sampleRate = 16000
private val channelConfig = AudioFormat.CHANNEL_IN_MONO
private val audioFormat = AudioFormat.ENCODING_PCM_16BIT
```

Remove the following unused imports:
```kotlin
// DELETE:
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import kotlinx.coroutines.Job
```

#### E. Update onCleared()

```kotlin
override fun onCleared() {
    super.onCleared()
    speechRecognizer.destroy()
    asrEngine.release()   // keep IndicConformer cleanup for offline fallback
    translator.release()
    ttsEngine.release()
}
```

---

### 3. [MODIFY] `MainScreen.kt`
**Path:** `app/src/main/java/com/example/hindisantali/ui/main/MainScreen.kt`

The mic button currently calls `startRecording()` on press and `stopRecordingAndProcess()` on release. Both of these are gone. The new API is a single tap: `startListening()`.

Find the mic button composable. It currently looks something like:
```kotlin
// OLD — remove this
.pointerInput(Unit) {
    detectTapGestures(
        onPress = { viewModel.startRecording(); tryAwaitRelease(); viewModel.stopRecordingAndProcess() }
    )
}
```

Replace with a simple `onClick`:
```kotlin
// NEW — single tap starts and auto-ends
.clickable {
    if (uiState.stage == PipelineStage.IDLE || uiState.stage == PipelineStage.ERROR) {
        viewModel.startListening()
    } else if (uiState.stage == PipelineStage.RECORDING) {
        viewModel.stopListening()  // optional: allow manual stop
    }
}
```

Also add `stopListening()` to the ViewModel:
```kotlin
fun stopListening() {
    speechRecognizer.stopListening()
}
```

---

### 4. [MODIFY] `AndroidManifest.xml`

Verify these permissions are already present (they should be). Add the `INTERNET` permission if not already there — Android SpeechRecognizer uses a network call for devices without offline speech packs installed:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
```

---

## What to NOT Change

- `HindiAsrEngine.kt` — keep it, it is used as offline fallback
- `HindiSantaliTranslator.kt` — no changes
- `PhraseCache.kt` — no changes
- `SantaliTtsEngine.kt` — no changes
- `TranslationModelDownloader.kt` — no changes
- All theme/UI files — no changes

---

## Verification

After implementing:
1. Build with `.\gradlew.bat assembleDebug`
2. Install on device
3. Tap mic button once
4. Speak 4 Hindi words
5. The app should auto-detect end-of-speech and return the transcribed text in **200-600ms**
6. Check logcat for `ASR result:` log line — timestamp delta should be <1000ms

---

## Expected Latency After Fix

| Step | Before | After |
|---|---|---|
| Hindi ASR (4 words) | 10-11 seconds | 200-600ms |
| Cache hit translation | <50ms | <50ms (unchanged) |
| ONNX translation (cache miss) | 3-5s | 3-5s (unchanged) |
| **Total (cache hit)** | **~11s** | **<700ms** |
