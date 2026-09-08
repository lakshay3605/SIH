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

        // ── School / Teaching / Kids (complete sentences) ──────────────────
        "तुम्हारा नाम क्या है"       to "ᱟᱢᱟᱜ ᱢᱤᱛᱟᱹᱨ ᱪᱮᱫ ᱠᱟᱱᱟ",
        "आपका नाम क्या है"          to "ᱟᱢᱟᱜ ᱢᱤᱛᱟᱹᱨ ᱪᱮᱫ ᱠᱟᱱᱟ",
        "आपका घर कहाँ है"           to "ᱟᱢᱟᱜ ᱚᱲᱟᱜ ᱚᱠᱟᱛᱮ ᱠᱟᱱᱟ",
        "किताब पढ़ रहे हैं"         to "ᱯᱩᱛᱷᱤ ᱯᱟᱲᱦᱟᱣ ᱠᱟᱱᱟ",
        "किताब पढ़ रहा हूँ"         to "ᱯᱩᱛᱷᱤ ᱯᱟᱲᱦᱟᱣ ᱠᱟᱱᱟᱹᱧ",
        "किताब पढ़ रहा है"          to "ᱯᱩᱛᱷᱤ ᱯᱟᱲᱦᱟᱣ ᱠᱟᱱᱟᱭ",
        "किताब पढ़ रही है"          to "ᱯᱩᱛᱷᱤ ᱯᱟᱲᱦᱟᱣ ᱠᱟᱱᱟᱭ",
        "स्कूल जा रहे हैं"          to "ᱤᱥᱠᱩᱞ ᱛᱮ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ",
        "स्कूल जा रहा हूँ"          to "ᱤᱥᱠᱩᱞ ᱛᱮ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟᱹᱧ",
        "स्कूल जा रहा है"           to "ᱤᱥᱠᱩᱞ ᱛᱮ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟᱭ",
        "स्कूल जा रही है"           to "ᱤᱥᱠᱩᱞ ᱛᱮ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟᱭ",

        // ── Questions ──────────────────────────────────────────────────────
        "आप कैसे हैं"               to "ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ",
        "कहाँ जा रहे हैं"           to "ᱚᱠᱟᱛᱮᱢ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ",
        "कितने का है"               to "ᱛᱤᱱᱟᱹᱜ ᱫᱟᱢ",

        // ── काम करना (to work) ─────────────────────────────────────────────
        "काम कर रहे हैं"            to "ᱠᱟᱹᱢᱤ ᱠᱟᱱᱟ",
        "काम कर रहा हूँ"            to "ᱠᱟᱹᱢᱤ ᱠᱟᱱᱟᱹᱧ",
        "काम कर रही है"             to "ᱠᱟᱹᱢᱤ ᱠᱟᱱᱟᱭ",
        "काम कर रहा है"             to "ᱠᱟᱹᱢᱤ ᱠᱟᱱᱟᱭ",

        // ── पढ़ना (to read/study) ───────────────────────────────────────────
        "पढ़ रहे हैं"               to "ᱯᱟᱲᱦᱟᱣ ᱠᱟᱱᱟ",
        "पढ़ रहा हूँ"               to "ᱯᱟᱲᱦᱟᱣ ᱠᱟᱱᱟᱹᱧ",
        "पढ़ रही है"                to "ᱯᱟᱲᱦᱟᱣ ᱠᱟᱱᱟᱭ",
        "पढ़ रहा है"                to "ᱯᱟᱲᱦᱟᱣ ᱠᱟᱱᱟᱭ",

        // ── लिखना (to write) ───────────────────────────────────────────────
        "लिख रहे हैं"               to "ᱚᱞ ᱠᱟᱱᱟ",
        "लिख रहा हूँ"               to "ᱚᱞ ᱠᱟᱱᱟᱹᱧ",
        "लिख रही है"                to "ᱚᱞ ᱠᱟᱱᱟᱭ",
        "लिख रहा है"                to "ᱚᱞ ᱠᱟᱱᱟᱭ",

        // ── खेलना (to play) ────────────────────────────────────────────────
        "खेल रहे हैं"               to "ᱮᱱᱮᱡ ᱠᱟᱱᱟ",
        "खेल रहा हूँ"               to "ᱮᱱᱮᱡ ᱠᱟᱱᱟᱹᱧ",
        "खेल रही है"                to "ᱮᱱᱮᱡ ᱠᱟᱱᱟᱭ",
        "खेल रहा है"                to "ᱮᱱᱮᱡ ᱠᱟᱱᱟᱭ",

        // ── गाना (to sing) ──────────────────────────────────────────────────
        "गा रहे हैं"                to "ᱥᱮᱨᱮᱧ ᱠᱟᱱᱟ",
        "गा रहा हूँ"                to "ᱥᱮᱨᱮᱧ ᱠᱟᱱᱟᱹᱧ",
        "गा रही है"                 to "ᱥᱮᱨᱮᱧ ᱠᱟᱱᱟᱭ",
        "गा रहा है"                 to "ᱥᱮᱨᱮᱧ ᱮᱫᱟᱭ",

        // ── नाचना (to dance) ───────────────────────────────────────────────
        "नाच रहे हैं"               to "ᱮᱱᱮᱡ ᱠᱟᱱᱟ",
        "नाच रहा हूँ"               to "ᱮᱱᱮᱡ ᱠᱟᱱᱟᱹᱧ",
        "नाच रही है"                to "ᱮᱱᱮᱡ ᱠᱟᱱᱟᱭ",
        "नाच रहा है"                to "ᱮᱱᱮᱡ ᱠᱟᱱᱟᱭ",

        // ── जाना (to go) ────────────────────────────────────────────────────
        "जा रहे हैं"                to "ᱠᱚ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ",
        "जा रही हूँ"                to "ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟᱹᱧ",
        "जा रहा हूँ"                to "ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟᱹᱧ",
        "जा रहा है"                 to "ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟᱭ",
        "जा रही है"                 to "ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟᱭ",

        // ── पीना (to drink) ─────────────────────────────────────────────────
        "पी रहे हैं"                to "ᱧᱩ ᱠᱟᱱᱟ",
        "पी रहा हूँ"                to "ᱧᱩ ᱠᱟᱱᱟᱹᱧ",
        "पी रही है"                 to "ᱧᱩ ᱠᱟᱱᱟᱭ",
        "पी रहा है"                 to "ᱧᱩ ᱠᱟᱱᱟᱭ",

        // ── खाना (to eat) ───────────────────────────────────────────────────
        "खा रहे हैं"                to "ᱡᱚᱢ ᱠᱟᱱᱟ",
        "खा रहा हूँ"                to "ᱡᱚᱢ ᱠᱟᱱᱟᱹᱧ",
        "खा रही है"                 to "ᱡᱚᱢ ᱠᱟᱱᱟᱭ",
        "खा रहा है"                 to "ᱡᱚᱢ ᱠᱟᱱᱟᱭ"
    )

    // Word-by-word vocabulary map for partial sentences
    private val vocabMap = mapOf(
        // ── People & Pronouns ───────────────────────────────────────────────
        "नमस्ते"       to "ᱡᱚᱦᱟᱨ",
        "जोहार"        to "ᱡᱚᱦᱟᱨ",
        "आप"           to "ᱟᱢ",
        "तुम"          to "ᱟᱢ",
        "मैं"          to "ᱤᱧ",
        "हम"           to "ᱟᱵᱚ",
        "वह"           to "ᱩᱱᱤ",
        "वे"           to "ᱩᱱᱠᱩ",
        "यह"           to "ᱱᱤ",

        // ── Family ──────────────────────────────────────────────────────────
        "माँ"          to "ᱟᱭᱳ",
        "माता"         to "ᱟᱭᱳ",
        "माताजी"       to "ᱟᱭᱳ",
        "पिता"         to "ᱵᱟᱵᱟ",
        "पिताजी"       to "ᱵᱟᱵᱟ",
        "पापा"         to "ᱵᱟᱵᱟ",
        "भाई"          to "ᱵᱚᱭᱦᱟ",
        "बहन"          to "ᱢᱤᱥᱨᱟ",
        "दादा"         to "ᱫᱟᱫᱟ",
        "दादी"         to "ᱫᱟᱫᱤ",
        "बच्चा"        to "ᱠᱚᱲᱟ",
        "बच्ची"        to "ᱠᱚᱲᱤ",
        "बच्चे"        to "ᱠᱚᱲᱟ ᱠᱚ",

        // ── School / Education ──────────────────────────────────────────────
        "शिक्षक"       to "ᱢᱟᱪᱮᱛ",
        "शिक्षिका"     to "ᱢᱟᱪᱮᱛ",
        "गुरुजी"       to "ᱢᱟᱪᱮᱛ",
        "विद्यार्थी"   to "ᱯᱟᱹᱴᱷᱩᱣᱟᱹ",
        "छात्र"        to "ᱯᱟᱹᱴᱷᱩᱣᱟᱹ",
        "छात्रा"       to "ᱯᱟᱹᱴᱷᱩᱣᱟᱹ",
        "स्कूल"        to "ᱤᱥᱠᱩᱞ",
        "विद्यालय"     to "ᱤᱥᱠᱩᱞ",
        "कक्षा"        to "ᱠᱽᱞᱮᱥ",
        "किताब"        to "ᱯᱩᱛᱷᱤ",
        "पुस्तक"       to "ᱯᱩᱛᱷᱤ",
        "पेन"          to "ᱯᱮᱱ",
        "कलम"          to "ᱯᱮᱱ",
        "पेंसिल"       to "ᱯᱮᱱᱥᱤᱞ",
        "नाम"          to "ᱢᱤᱛᱟᱹᱨ",
        "काम"          to "ᱠᱟᱹᱢᱤ",

        // ── Numbers (1-10) ──────────────────────────────────────────────────
        "एक"           to "ᱢᱤᱫ",
        "दो"           to "ᱵᱟᱨ",
        "तीन"          to "ᱯᱮ",
        "चार"          to "ᱯᱩᱱ",
        "पाँच"         to "ᱢᱚᱬᱮ",
        "छह"           to "ᱛᱩᱨᱩᱭ",
        "सात"          to "ᱮᱭᱟᱭ",
        "आठ"           to "ᱤᱨᱟᱹᱞ",
        "नौ"           to "ᱟᱬᱮ",
        "दस"           to "ᱜᱮᱞ",

        // ── Places & Things ─────────────────────────────────────────────────
        "गाँव"         to "ᱟᱹᱛᱩ",
        "घर"           to "ᱚᱲᱟᱜ",
        "बाज़ार"        to "ᱦᱟᱴ",
        "खेत"          to "ᱠᱷᱮᱛ",
        "पेड़"          to "ᱫᱟᱨᱮ",
        "नदी"          to "ᱜᱟᱰᱟ",
        "पानी"         to "ᱫᱟᱜ",
        "खाना"         to "ᱫᱟᱠᱟ",
        "भात"          to "ᱫᱟᱠᱟ",
        "लोग"          to "ᱦᱚᱲ",
        "दोस्त"        to "ᱜᱟᱛᱮ",
        "रुपये"        to "ᱴᱟᱠᱟ",
        "रुपया"        to "ᱴᱟᱠᱟ",

        // ── Professions ─────────────────────────────────────────────────────
        "किसान"        to "ᱪᱟᱹᱥᱤ",
        "डॉक्टर"       to "ᱰᱟᱠᱛᱚᱨ",
        "दुकानदार"     to "ᱫᱚᱠᱟᱱᱤᱭᱟᱹ",

        // ── Adjectives / Descriptions ───────────────────────────────────────
        "अच्छा"        to "ᱱᱟᱯᱟᱭ",
        "अच्छी"        to "ᱱᱟᱯᱟᱭ",
        "सुंदर"        to "ᱪᱚᱨᱚᱠ",
        "साफ़"         to "ᱯᱷᱟᱨᱪᱟ",
        "ठंडा"         to "ᱨᱮᱭᱟᱲ",
        "गरम"          to "ᱦᱟᱯᱟᱢ",

        // ── Time ────────────────────────────────────────────────────────────
        "सुबह"         to "ᱥᱮᱛᱟᱜ",
        "शाम"          to "ᱟᱹᱭᱩᱵ",
        "रात"          to "ᱧᱤᱫᱟᱹ",
        "आज"           to "ᱱᱤᱫᱟ",
        "कल"           to "ᱦᱚᱞᱚ",

        // ── Common words ────────────────────────────────────────────────────
        "धन्यवाद"      to "ᱥᱟᱨᱦᱟᱣ",
        "मदद"          to "ᱜᱚᱲᱚ",
        "कैसे"         to "ᱪᱮᱫ ᱞᱮᱠᱟ",
        "कहाँ"         to "ᱚᱠᱟᱛᱮ",
        "क्या"         to "ᱪᱮᱫ",
        "कितने"        to "ᱛᱤᱱᱟᱹᱜ",

        // ── Postpositions & Verb forms ───────────────────────────────────────
        "में"          to "ᱨᱮ",
        "से"           to "ᱛᱮ",
        "को"           to "ᱠᱚ",
        "का"           to "ᱨᱮᱭᱟᱜ",
        "की"           to "ᱨᱮᱭᱟᱜ",
        "के"           to "ᱨᱮᱭᱟᱜ",
        "साथ"          to "ᱥᱟᱶ",
        "है"           to "ᱠᱟᱱᱟ",
        "हूँ"          to "ᱢᱮᱱᱟᱹᱧᱟ",
        "हैं"          to "ᱢᱮᱱᱟᱜ-ᱟ"
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
