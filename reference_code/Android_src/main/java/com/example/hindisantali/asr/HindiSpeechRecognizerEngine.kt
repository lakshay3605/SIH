package com.example.hindisantali.asr

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import kotlinx.coroutines.CancellableContinuation
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

/**
 * Wraps Android's SpeechRecognizer API for Hindi speech-to-text.
 * Guaranteed to terminate safely via built-in watchdog timer and safe error handling.
 */
class HindiSpeechRecognizerEngine(private val context: Context) {

    private val TAG = "HindiSpeechRecognizerEngine"
    private var recognizer: SpeechRecognizer? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    fun isAvailable(): Boolean =
        SpeechRecognizer.isRecognitionAvailable(context)

    suspend fun recognize(timeoutMs: Int = 4500): String =
        suspendCancellableCoroutine { continuation ->
            try {
                recognizer?.destroy()
                recognizer = SpeechRecognizer.createSpeechRecognizer(context)

                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, "hi-IN")
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "hi-IN")
                    putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, false)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, timeoutMs.toLong())
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 1500L)
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
                }

                // Safety watchdog: auto-terminate after timeout + 1s to prevent stuck microphone
                val watchdog = Runnable {
                    Log.w(TAG, "Watchdog triggered: forcing ASR completion")
                    stopListening()
                    resumeSafely(continuation, "")
                }
                mainHandler.postDelayed(watchdog, (timeoutMs + 1000).toLong())

                recognizer?.setRecognitionListener(object : RecognitionListener {
                    override fun onResults(results: Bundle?) {
                        mainHandler.removeCallbacks(watchdog)
                        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        val text = matches?.firstOrNull() ?: ""
                        Log.d(TAG, "ASR result: '$text'")
                        resumeSafely(continuation, text)
                    }

                    override fun onError(error: Int) {
                        mainHandler.removeCallbacks(watchdog)
                        val msg = when (error) {
                            SpeechRecognizer.ERROR_AUDIO -> "Audio error"
                            SpeechRecognizer.ERROR_CLIENT -> "Client error"
                            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "No permission"
                            SpeechRecognizer.ERROR_NETWORK -> "Network required"
                            SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
                            SpeechRecognizer.ERROR_NO_MATCH -> "No speech detected"
                            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Busy"
                            SpeechRecognizer.ERROR_SERVER -> "Server error"
                            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "Timeout"
                            else -> "Error ($error)"
                        }
                        Log.w(TAG, "ASR error encountered: $msg - safely returning empty string")
                        resumeSafely(continuation, "")
                    }

                    override fun onReadyForSpeech(params: Bundle?) {
                        Log.d(TAG, "Ready for speech")
                    }
                    override fun onBeginningOfSpeech() {}
                    override fun onRmsChanged(rmsdB: Float) {}
                    override fun onBufferReceived(buffer: ByteArray?) {}
                    override fun onEndOfSpeech() {
                        Log.d(TAG, "End of speech detected")
                    }
                    override fun onPartialResults(partialResults: Bundle?) {}
                    override fun onEvent(eventType: Int, params: Bundle?) {}
                })

                recognizer?.startListening(intent)
                Log.d(TAG, "startListening called with watchdog")

                continuation.invokeOnCancellation {
                    mainHandler.removeCallbacks(watchdog)
                    stopListening()
                    destroy()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start speech recognition: ${e.message}")
                resumeSafely(continuation, "")
            }
        }

    fun stopListening() {
        try {
            recognizer?.stopListening()
        } catch (_: Exception) {}
    }

    fun destroy() {
        try {
            recognizer?.destroy()
        } catch (_: Exception) {}
        recognizer = null
    }

    private fun resumeSafely(
        cont: CancellableContinuation<String>,
        value: String
    ) {
        if (cont.isActive) cont.resume(value)
    }
}
