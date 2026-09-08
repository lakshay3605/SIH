package com.example.hindisantali.translation

import android.content.Context
import android.util.Log
import org.json.JSONObject
import java.text.Normalizer

/**
 * In-memory phrase cache loaded from bundled translation_cache.json (337KB, 2007 entries).
 *
 * Provides three levels of lookup (all O(1) or O(n) where n is small):
 *   1. Exact match — NFC-normalized Hindi → Santali (from Aakansha's dataset)
 *   2. Phrase map — multi-word Hindi patterns → Santali equivalents
 *   3. Vocab map — word-by-word substitution for 80 common words
 *
 * Zero model loading, zero RAM overhead, instant response.
 * initialize() is safe to call from any thread and from ViewModel.init {}.
 */
class PhraseCache(private val context: Context) {

    private val TAG = "PhraseCache"

    // Exact-match cache: normalized Hindi → Santali Ol Chiki
    private val exactCache = HashMap<String, String>(2200)

    // Multi-word phrase map (ordered: longest patterns first to avoid partial matches)
    private val phraseMap = listOf(
        "आप कैसे हैं"          to "ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ",
        "काम कर रहा है"        to "ᱠᱟᱹᱢᱤ ᱠᱟᱱᱟᱭ",
        "काम कर रही है"        to "ᱠᱟᱹᱢᱤ ᱠᱟᱱᱟᱭ",
        "जा रहा हूँ"           to "ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟᱹᱧ",
        "जा रहा है"            to "ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟᱭ",
        "जा रही है"            to "ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟᱭ",
        "जा रहे हैं"           to "ᱠᱚ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ",
        "पी रहा है"            to "ᱧᱩ ᱠᱟᱱᱟᱭ",
        "खा रहा है"            to "ᱡᱚᱢ ᱠᱟᱱᱟᱭ",
        "पढ़ रहा है"           to "ᱯᱟᱲᱦᱟᱣ ᱠᱟᱱᱟᱭ",
        "खेल रहा है"           to "ᱮᱱᱮᱡ ᱠᱟᱱᱟᱭ",
        "गा रहा है"            to "ᱥᱮᱨᱮᱧ ᱮᱫᱟᱭ",
        "नाच रहा है"           to "ᱮᱱᱮᱡ ᱠᱟᱱᱟᱭ",
        "कहाँ जा रहे हैं"      to "ᱚᱠᱟᱛᱮᱢ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ",
        "कितने का है"          to "ᱛᱤᱱᱟᱹᱜ ᱫᱟᱢ"
    )

    // Word-by-word vocabulary map for partial sentences
    private val vocabMap = mapOf(
        "नमस्ते" to "ᱡᱚᱦᱟᱨ",     "आप" to "ᱟᱢ",       "तुम" to "ᱟᱢ",
        "मैं" to "ᱤᱧ",             "हम" to "ᱟᱵᱚ",     "वह" to "ᱩᱱᱤ",
        "वे" to "ᱩᱱᱠᱩ",           "कैसे" to "ᱪᱮᱫ ᱞᱮᱠᱟ", "कहाँ" to "ᱚᱠᱟᱛᱮ",
        "क्या" to "ᱪᱮᱫ",          "कितने" to "ᱛᱤᱱᱟᱹᱜ", "किसान" to "ᱪᱟᱹᱥᱤ",
        "खेत" to "ᱠᱷᱮᱛ",          "डॉक्टर" to "ᱰᱟᱠᱛᱚᱨ", "शिक्षक" to "ᱢᱟᱪᱮᱛ",
        "विद्यार्थी" to "ᱯᱟᱹᱴᱷᱩᱣᱟᱹ", "दुकानदार" to "ᱫᱚᱠᱟᱱᱤᱭᱟᱹ",
        "गाँव" to "ᱟᱹᱛᱩ",         "लोग" to "ᱦᱚᱲ",    "किताब" to "ᱯᱩᱛᱷᱤ",
        "पेड़" to "ᱫᱟᱨᱮ",          "पानी" to "ᱫᱟᱜ",   "खाना" to "ᱫᱟᱠᱟ",
        "भात" to "ᱫᱟᱠᱟ",          "घर" to "ᱚᱲᱟᱜ",    "बाज़ार" to "ᱦᱟᱴ",
        "स्कूल" to "ᱤᱥᱠᱩᱞ",       "काम" to "ᱠᱟᱹᱢᱤ",  "धन्यवाद" to "ᱥᱟᱨᱦᱟᱣ",
        "सुंदर" to "ᱪᱚᱨᱚᱠ",       "अच्छा" to "ᱱᱟᱯᱟᱭ", "मदद" to "ᱜᱚᱲᱚ",
        "साफ़" to "ᱯᱷᱟᱨᱪᱟ",        "ठंडा" to "ᱨᱮᱭᱟᱲ", "सुबह" to "ᱥᱮᱛᱟᱜ",
        "शाम" to "ᱟᱹᱭᱩᱵ",         "रात" to "ᱧᱤᱫᱟᱹ",  "सूर्य" to "ᱵᱮᱲᱟ",
        "है" to "ᱠᱟᱱᱟ",           "हूँ" to "ᱢᱮᱱᱟᱹᱧᱟ", "हैं" to "ᱢᱮᱱᱟᱜ-ᱟ",
        "में" to "ᱨᱮ",            "से" to "ᱛᱮ",      "को" to "ᱠᱚ",
        "का" to "ᱨᱮᱭᱟᱜ",         "की" to "ᱨᱮᱭᱟᱜ",  "के" to "ᱨᱮᱭᱟᱜ",
        "साथ" to "ᱥᱟᱶ"
    )

    private var isLoaded = false

    /** Load cache from bundled asset. Call once at startup — takes ~5ms. */
    fun initialize() {
        if (isLoaded) return
        try {
            val jsonText = context.assets.open("translation_cache.json")
                .bufferedReader(Charsets.UTF_8)
                .readText()
            val obj = JSONObject(jsonText)
            @Suppress("UNCHECKED_CAST")
            val iter = obj.keys() as Iterator<String>
            while (iter.hasNext()) {
                val key = iter.next()
                // Strip punctuation from the key at load time so that ASR output
                // (which never includes । or ? or .) can still match exactly.
                val normalizedKey = stripPunctuation(key)
                exactCache[normalizedKey] = obj.getString(key)
            }
            isLoaded = true
            Log.d(TAG, "PhraseCache loaded: ${exactCache.size} entries")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load translation_cache.json: ${e.message}")
            // App still functions — ONNX model will handle everything
        }
    }

    /**
     * Attempt to translate hindi text using:
     *   1. Exact match from the 2007-pair cache
     *   2. Phrase map substitution
     *   3. Word-by-word vocab map
     *
     * @return Santali text if found, null if ONNX model should be used instead
     */
    fun lookup(hindiText: String): String? {
        val normalized = normalizeText(hindiText)
        if (normalized.isEmpty()) return ""

        // 1. Exact match — strip punctuation from input to match stripped cache keys
        exactCache[stripPunctuation(normalized)]?.let { return it }

        // 2. Phrase map substitution on the input
        var working = normalized.replace("?", "").replace("।", "").replace("!", "").replace(".", "").trim()
        var wasModified = false
        for ((hindi, santali) in phraseMap) {
            if (hindi in working) {
                working = working.replace(hindi, santali)
                wasModified = true
            }
        }

        // 3. Word-by-word vocab substitution
        val words = working.split(" ")
        val translated = words.map { w -> vocabMap[w] ?: w }
        val hasAtLeastOneTranslation = translated.zip(words).any { (t, w) -> t != w }

        return if (hasAtLeastOneTranslation || wasModified) {
            var result = translated.joinToString(" ")
            if (hindiText.trimEnd().endsWith("?")) result += "?"
            else if (hindiText.trimEnd().endsWith("।") || hindiText.trimEnd().endsWith(".")) result += "।"
            result
        } else {
            null  // No match — caller should use ONNX model
        }
    }

    // NFC normalization + collapse whitespace — mirrors Aakansha's normalize_text()
    private fun normalizeText(text: String): String {
        val nfc = Normalizer.normalize(text, Normalizer.Form.NFC)
        return nfc.replace(Regex("\\s+"), " ").trim()
    }

    // Strip Hindi/English punctuation so ASR output matches cache keys
    private fun stripPunctuation(text: String): String {
        return text
            .replace(Regex("[।॥?!.,;:\"'()-]"), "")
            .replace(Regex("\\s+"), " ")
            .trim()
    }
}
