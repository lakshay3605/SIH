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

    // ── Ol Chiki → High-Fidelity Phonetic Acoustic Mapping ───────────────────
    private val aspirateMap = mapOf(
        Pair('ᱠ', 'ᱷ') to "ख",
        Pair('ᱜ', 'ᱷ') to "घ",
        Pair('ᱪ', 'ᱷ') to "छ",
        Pair('ᱡ', 'ᱷ') to "झ",
        Pair('ᱴ', 'ᱷ') to "ठ",
        Pair('ᱰ', 'ᱷ') to "ढ",
        Pair('ᱛ', 'ᱷ') to "थ",
        Pair('ᱫ', 'ᱷ') to "ध",
        Pair('ᱯ', 'ᱷ') to "फ",
        Pair('ᱵ', 'ᱷ') to "भ",
        Pair('ᱲ', 'ᱷ') to "ढ़"
    )

    private val vowelMap = mapOf(
        'ᱚ' to Pair("ऑ", "ो"),
        'ᱟ' to Pair("आ", "ा"),
        'ᱤ' to Pair("इ", "ि"),
        'ᱩ' to Pair("उ", "ु"),
        'ᱮ' to Pair("ए", "े"),
        'ᱳ' to Pair("ओ", "ो")
    )

    private val consonantMap = mapOf(
        'ᱛ' to "त", 'ᱜ' to "ग", 'ᱝ' to "ंग", 'ᱞ' to "ल",
        'ᱠ' to "क", 'ᱡ' to "ज", 'ᱢ' to "म", 'ᱣ' to "व",
        'ᱥ' to "स", 'ᱦ' to "ह", 'ᱧ' to "ञ", 'ᱨ' to "र",
        'ᱪ' to "च", 'ᱫ' to "द", 'ᱬ' to "ण", 'ᱭ' to "य",
        'ᱯ' to "प", 'ᱰ' to "ड", 'ᱱ' to "न", 'ᱲ' to "ड़",
        'ᱴ' to "ट", 'ᱵ' to "ब", 'ᱶ' to "व", 'ᱷ' to "ह"
    )

    private val modifierMap = mapOf(
        'ᱸ' to "ं", 'ᱹ' to "", 'ᱺ' to "ँ", 'ᱻ' to "",
        'ᱼ' to "-", '᱾' to "।", '᱿' to "॥"
    )

    /**
     * Converts Ol Chiki script into phonetically accurate Devanagari acoustic text.
     * Devanagari acoustic representation enables Android's native Indian TTS engine
     * to articulate authentic Santali vowels, aspirated stops, retroflex consonants,
     * and glottal nuances with human-level naturalness rather than robotic Latin spellings.
     */
    fun transliterate(olChikiText: String): String {
        val n = olChikiText.length
        val sb = StringBuilder(n * 2)
        var i = 0

        while (i < n) {
            val ch = olChikiText[i]

            // 1. Check aspirate pairs (e.g. ᱛ + ᱷ = थ, ᱠ + ᱷ = ख)
            if (i + 1 < n && aspirateMap.containsKey(Pair(ch, olChikiText[i + 1]))) {
                val aspCons = aspirateMap[Pair(ch, olChikiText[i + 1])]!!
                if (i + 2 < n && vowelMap.containsKey(olChikiText[i + 2])) {
                    val matra = vowelMap[olChikiText[i + 2]]!!.second
                    sb.append(aspCons).append(matra)
                    i += 3
                    continue
                } else {
                    sb.append(aspCons)
                    i += 2
                    continue
                }
            }

            // 2. Check regular consonants
            if (consonantMap.containsKey(ch)) {
                val cons = consonantMap[ch]!!
                if (i + 1 < n && vowelMap.containsKey(olChikiText[i + 1])) {
                    val matra = vowelMap[olChikiText[i + 1]]!!.second
                    if (ch == 'ᱧ') {
                        // Palatal nasal special acoustic handling for 'ny' (e.g., nyutum -> न्यूतुम)
                        sb.append(if (matra == "ु" || matra == "ू") "न्यू" else "न्य$matra")
                    } else {
                        sb.append(cons).append(matra)
                    }
                    i += 2
                    continue
                } else {
                    if (ch == 'ᱧ') {
                        sb.append("ञ")
                    } else {
                        sb.append(cons)
                    }
                    i += 1
                    continue
                }
            }

            // 3. Independent vowels
            if (vowelMap.containsKey(ch)) {
                sb.append(vowelMap[ch]!!.first)
                i += 1
                continue
            }

            // 4. Modifiers and punctuation
            if (modifierMap.containsKey(ch)) {
                sb.append(modifierMap[ch]!!)
                i += 1
                continue
            }

            // 5. Default pass-through
            sb.append(ch)
            i += 1
        }
        return sb.toString().replace(Regex("\\s+"), " ").trim()
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
                    tts?.setSpeechRate(0.88f)
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
            val speechText = if (isOlChiki || text.any { it in '\u1C50'..'\u1C7F' }) transliterate(text) else text
            val utteranceId = "utt_${System.currentTimeMillis()}"
            val params = Bundle().apply {
                putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId)
            }
            tts?.speak(speechText, TextToSpeech.QUEUE_FLUSH, params, utteranceId)
            Log.d(TAG, "TTS speakAsync speaking acoustic text: '$speechText' (original: '$text')")
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
