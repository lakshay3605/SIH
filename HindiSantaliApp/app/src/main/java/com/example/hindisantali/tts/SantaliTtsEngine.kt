package com.example.hindisantali.tts

import android.content.Context
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import java.util.Locale
import java.util.concurrent.ConcurrentLinkedQueue

/**
 * Santali TTS using Android's built-in TextToSpeech API.
 * Completely non-blocking and safe for Android UI thread.
 * Queues speech requests if called before initialization finishes.
 */
class SantaliTtsEngine(private val context: Context) {

    private val TAG = "SantaliTtsEngine"
    private var tts: TextToSpeech? = null
    @Volatile private var isReady = false
    private val pendingSpeechQueue = ConcurrentLinkedQueue<Pair<String, Boolean>>()

    init {
        initialize()
    }

    // ── Ol Chiki → Phonetic Latin transliteration map ────────────────────────
    private val olChikiMap = mapOf(
        'ᱚ' to "o", 'ᱛ' to "t", 'ᱜ' to "g", 'ᱝ' to "ng",
        'ᱞ' to "l", 'ᱟ' to "a", 'ᱠ' to "k", 'ᱡ' to "j",
        'ᱢ' to "m", 'ᱣ' to "w", 'ᱤ' to "i", 'ᱥ' to "s",
        'ᱦ' to "h", 'ᱧ' to "ny", 'ᱨ' to "r", 'ᱩ' to "u",
        'ᱪ' to "ch", 'ᱫ' to "d", 'ᱬ' to "nd", 'ᱭ' to "y",
        'ᱮ' to "e", 'ᱯ' to "p", 'ᱰ' to "dd", 'ᱱ' to "n",
        'ᱲ' to "rr", 'ᱳ' to "o", 'ᱴ' to "tt", 'ᱵ' to "b",
        'ᱶ' to "v", 'ᱷ' to "h",
        '᱐' to "0", '᱑' to "1", '᱒' to "2", '᱓' to "3",
        '᱔' to "4", '᱕' to "5", '᱖' to "6", '᱗' to "7",
        '᱘' to "8", '᱙' to "9",
        '᱾' to ".", '᱿' to ","
    )

    fun transliterate(olChikiText: String): String {
        val sb = StringBuilder(olChikiText.length * 2)
        for (ch in olChikiText) {
            sb.append(olChikiMap[ch] ?: ch.toString())
        }
        return sb.toString()
    }

    /**
     * Initializes the Android TTS engine asynchronously without blocking the UI thread.
     */
    fun initialize(): Boolean {
        if (isReady && tts != null) return true

        try {
            tts = TextToSpeech(context.applicationContext) { status ->
                if (status == TextToSpeech.SUCCESS) {
                    val locales = listOf(
                        Locale("hi", "IN"),
                        Locale("en", "IN"),
                        Locale.ENGLISH,
                        Locale.getDefault()
                    )
                    for (locale in locales) {
                        try {
                            val res = tts?.setLanguage(locale)
                            if (res != TextToSpeech.LANG_MISSING_DATA && res != TextToSpeech.LANG_NOT_SUPPORTED) {
                                Log.d(TAG, "TTS language set to $locale")
                                break
                            }
                        } catch (_: Exception) {}
                    }
                    tts?.setSpeechRate(0.85f)
                    tts?.setPitch(1.0f)
                    isReady = true
                    Log.d(TAG, "TTS engine ready! Processing ${pendingSpeechQueue.size} pending speeches")

                    while (!pendingSpeechQueue.isEmpty()) {
                        val item = pendingSpeechQueue.poll() ?: break
                        speakAsync(item.first, item.second)
                    }
                } else {
                    Log.e(TAG, "TTS init returned status $status")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "TTS init error: ${e.message}")
            return false
        }
        return true
    }

    /**
     * Non-blocking speech synthesis. Speaks immediately on device without blocking UI thread.
     */
    fun speakAsync(text: String, isOlChiki: Boolean = true) {
        if (text.isBlank()) return

        if (!isReady || tts == null) {
            Log.d(TAG, "TTS not ready yet, queuing speech: '$text'")
            pendingSpeechQueue.add(Pair(text, isOlChiki))
            initialize()
            return
        }

        try {
            val speechText = if (isOlChiki) transliterate(text) else text
            val utteranceId = "utt_${System.currentTimeMillis()}"
            val params = Bundle().apply {
                putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId)
            }
            tts?.speak(speechText, TextToSpeech.QUEUE_FLUSH, params, utteranceId)
            Log.d(TAG, "TTS speakAsync speaking: '$speechText'")
        } catch (e: Exception) {
            Log.e(TAG, "TTS speakAsync failed: ${e.message}")
        }
    }

    fun speak(santaliText: String) {
        speakAsync(santaliText, isOlChiki = true)
    }

    fun release() {
        try {
            tts?.stop()
            tts?.shutdown()
        } catch (_: Exception) {}
        tts = null
        isReady = false
        Log.d(TAG, "TTS engine released")
    }
}
