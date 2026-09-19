package com.example.hindisantali.tts

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import kotlinx.coroutines.suspendCancellableCoroutine
import java.util.Locale
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Santali TTS using Android's built-in TextToSpeech API.
 *
 * Strategy:
 *   1. Transliterate Ol Chiki script → phonetic Latin (so TTS pronounces correctly)
 *   2. Use the device's on-board TTS engine with the best available language (Hindi/en-IN)
 *   3. 100% offline, zero model download, works on every Android device.
 *
 * Lifecycle: call initialize() once, then speak() as many times as needed, then release().
 */
class SantaliTtsEngine(private val context: Context) {

    private val TAG = "SantaliTtsEngine"
    private var tts: TextToSpeech? = null
    private var isReady = false

    // ── Ol Chiki → Phonetic Latin transliteration map ────────────────────────
    // Based on standard Santali Ol Chiki phoneme chart (ISO 15924: Olck)
    private val olChikiMap = mapOf(
        // Vowels
        'ᱚ' to "o", 'ᱛ' to "t", 'ᱜ' to "g", 'ᱝ' to "ng",
        'ᱞ' to "l", 'ᱟ' to "a", 'ᱠ' to "k", 'ᱡ' to "j",
        'ᱢ' to "m", 'ᱣ' to "w", 'ᱤ' to "i", 'ᱥ' to "s",
        'ᱦ' to "h", 'ᱧ' to "ny", 'ᱨ' to "r", 'ᱩ' to "u",
        'ᱪ' to "ch", 'ᱫ' to "d", 'ᱬ' to "nd", 'ᱭ' to "y",
        'ᱮ' to "e", 'ᱯ' to "p", 'ᱰ' to "dd", 'ᱱ' to "n",
        'ᱲ' to "rr", 'ᱳ' to "o", 'ᱴ' to "tt", 'ᱵ' to "b",
        'ᱶ' to "v", 'ᱷ' to "h",
        // Ol Chiki digits → keep as-is
        '᱐' to "0", '᱑' to "1", '᱒' to "2", '᱓' to "3",
        '᱔' to "4", '᱕' to "5", '᱖' to "6", '᱗' to "7",
        '᱘' to "8", '᱙' to "9",
        // Punctuation
        '᱾' to ".", '᱿' to ","
    )

    /**
     * Transliterates Ol Chiki text to phonetic Latin string.
     * Characters not in the map (spaces, punctuation, already Latin) are kept as-is.
     */
    fun transliterate(olChikiText: String): String {
        val sb = StringBuilder(olChikiText.length * 2)
        for (ch in olChikiText) {
            sb.append(olChikiMap[ch] ?: ch.toString())
        }
        return sb.toString()
    }

    /**
     * Initialises the Android TTS engine (blocking, waits up to 5 seconds).
     * Safe to call multiple times.
     */
    fun initialize(): Boolean {
        if (isReady) return true

        val latch = CountDownLatch(1)
        var initResult = TextToSpeech.ERROR

        tts = TextToSpeech(context) { status ->
            initResult = status
            latch.countDown()
        }

        val completed = latch.await(5, TimeUnit.SECONDS)
        if (!completed || initResult != TextToSpeech.SUCCESS) {
            Log.e(TAG, "TTS init failed (status=$initResult, completed=$completed)")
            return false
        }

        // Try to set Hindi locale for better Indic phoneme coverage
        // Fall back to en-IN, then default
        val preferredLocales = listOf(
            Locale("hi", "IN"),   // Hindi – best for Indic phoneme TTS
            Locale("en", "IN"),   // Indian English
            Locale.ENGLISH
        )
        for (locale in preferredLocales) {
            val result = tts!!.setLanguage(locale)
            if (result != TextToSpeech.LANG_MISSING_DATA && result != TextToSpeech.LANG_NOT_SUPPORTED) {
                Log.d(TAG, "TTS language set to $locale")
                break
            }
        }

        tts!!.setSpeechRate(0.85f)  // Slightly slower for clarity
        tts!!.setPitch(1.0f)

        isReady = true
        Log.d(TAG, "TTS engine initialized successfully")
        return true
    }

    /**
     * Speaks the given Santali (Ol Chiki) text aloud on the device speakers.
     * This is a BLOCKING call — returns only after speech completes.
     *
     * @param santaliText  Ol Chiki Santali text
     */
    fun speak(santaliText: String) {
        if (!isReady) {
            Log.w(TAG, "TTS not ready — call initialize() first")
            return
        }
        val engine = tts ?: return
        val phonetic = transliterate(santaliText)
        Log.d(TAG, "Speaking transliterated: '$phonetic'")

        val latch = CountDownLatch(1)
        val utteranceId = "santali_${System.currentTimeMillis()}"

        engine.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) {}
            override fun onDone(utteranceId: String?) { latch.countDown() }
            @Deprecated("Deprecated in Java")
            override fun onError(utteranceId: String?) { latch.countDown() }
            override fun onError(utteranceId: String?, errorCode: Int) { latch.countDown() }
        })

        val params = Bundle()
        params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId)
        engine.speak(phonetic, TextToSpeech.QUEUE_FLUSH, params, utteranceId)

        latch.await(30, TimeUnit.SECONDS)
    }

    fun release() {
        tts?.stop()
        tts?.shutdown()
        tts = null
        isReady = false
        Log.d(TAG, "TTS engine released")
    }
}
