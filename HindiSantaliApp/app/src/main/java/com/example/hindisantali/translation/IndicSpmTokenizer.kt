package com.example.hindisantali.translation

import android.util.Log
import com.sentencepiece.Model
import com.sentencepiece.Scoring
import com.sentencepiece.SentencePieceAlgorithm
import java.io.File
import java.nio.file.Paths

/**
 * SentencePiece tokenizer wrapper for IndicTrans2 using sentencepiece4j (pure Java, no native .so).
 *
 * Uses io.github.eix128:sentencepiece4j which is a pure-Java SentencePiece implementation
 * that works on Android without any JNI native library loading.
 *
 * Requires Android API 26+ (minSdk = 26 in this project ✓)
 */
class IndicSpmTokenizer(private val srcSpmModel: File, private val tgtSpmModel: File) {

    private val TAG = "IndicSpmTokenizer"

    val bosId = 2   // <s>
    val eosId = 3   // </s>
    val padId = 1   // <pad>
    val unkId = 0   // <unk>

    private val langCodeMap = mapOf(
        "hin_Deva" to "<2hin_Deva>",
        "sat_Olck" to "<2sat_Olck>"
    )

    private val srcModel: Model by lazy {
        Log.d(TAG, "Loading SRC SentencePiece model from ${srcSpmModel.absolutePath}")
        Model.parseFrom(Paths.get(srcSpmModel.absolutePath))
    }

    private val tgtModel: Model by lazy {
        Log.d(TAG, "Loading TGT SentencePiece model from ${tgtSpmModel.absolutePath}")
        Model.parseFrom(Paths.get(tgtSpmModel.absolutePath))
    }

    private val algorithm = SentencePieceAlgorithm(true, Scoring.HIGHEST_SCORE)

    fun encode(text: String, srcLang: String, tgtLang: String): LongArray {
        val tgtLangToken = langCodeMap[tgtLang] ?: "<2sat_Olck>"
        // IndicTrans2 format: prepend target language tag before encoding
        val inputText = "$tgtLangToken $text"

        val ids: List<Int> = srcModel.encodeNormalized(inputText, algorithm)

        // Append EOS
        val out = LongArray(ids.size + 1)
        for (i in ids.indices) {
            out[i] = ids[i].toLong()
        }
        out[ids.size] = eosId.toLong()
        return out
    }

    fun decode(ids: List<Int>): String {
        return tgtModel.decodeSmart(ids)
    }
}
