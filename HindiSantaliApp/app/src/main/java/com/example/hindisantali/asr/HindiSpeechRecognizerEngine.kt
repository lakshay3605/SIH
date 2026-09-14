package com.example.hindisantali.asr

import android.content.ComponentName
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

    /** Timestamp (ms) when the user stopped speaking. Updated on every recognition. */
    var lastEndOfSpeechTime: Long = 0L
        private set

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
            // Explicitly use Google's recognizer (bypasses Samsung's default which lacks Hindi offline)
            val googleComponent = ComponentName(
                "com.google.android.googlequicksearchbox",
                "com.google.android.voicesearch.serviceapi.GoogleRecognitionService"
            )
            recognizer = try {
                SpeechRecognizer.createSpeechRecognizer(context, googleComponent)
                    .also { Log.d(TAG, "Using Google recognizer") }
            } catch (e: Exception) {
                Log.w(TAG, "Google recognizer unavailable, using default: ${e.message}")
                SpeechRecognizer.createSpeechRecognizer(context)
            }

            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                    RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, "hi-IN")
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "hi-IN")
                putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, false)
                putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)  // Force on-device model
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
                        SpeechRecognizer.ERROR_AUDIO            -> "Audio recording error"
                        SpeechRecognizer.ERROR_CLIENT           -> "Client side error"
                        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
                        SpeechRecognizer.ERROR_NETWORK          -> "Network error"
                        SpeechRecognizer.ERROR_NETWORK_TIMEOUT  -> "Network timeout"
                        SpeechRecognizer.ERROR_NO_MATCH         -> "No speech detected"
                        SpeechRecognizer.ERROR_RECOGNIZER_BUSY  -> "Recognizer busy"
                        SpeechRecognizer.ERROR_SERVER           -> "Server error"
                        SpeechRecognizer.ERROR_SPEECH_TIMEOUT   -> "Speech timeout"
                        else                                    -> "Unknown error ($error)"
                    }
                    Log.e(TAG, "ASR error: $msg")
                    // Network/server/no-match/timeout all return empty string — never crash offline
                    val isRecoverable = error == SpeechRecognizer.ERROR_NO_MATCH ||
                        error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT ||
                        error == SpeechRecognizer.ERROR_NETWORK ||
                        error == SpeechRecognizer.ERROR_NETWORK_TIMEOUT ||
                        error == SpeechRecognizer.ERROR_SERVER
                    if (isRecoverable) {
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
                override fun onEndOfSpeech() {
                    lastEndOfSpeechTime = System.currentTimeMillis()
                    Log.d(TAG, "End of speech detected")
                }
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
