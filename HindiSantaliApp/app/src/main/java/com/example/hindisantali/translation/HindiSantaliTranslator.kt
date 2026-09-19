package com.example.hindisantali.translation

import android.content.Context
import android.util.Log
import ai.onnxruntime.*
import java.io.File
import java.nio.FloatBuffer
import java.nio.LongBuffer

class HindiSantaliTranslator(private val context: Context) {

    private val TAG = "HindiSantaliTranslator"

    private var ortEnv: OrtEnvironment? = null
    private var tokenizer: IndicSpmTokenizer? = null
    private var isInitialized = false

    private val modelDir: File get() = TranslationModelDownloader.getModelDir(context)

    fun initialize() {
        if (isInitialized) return

        Log.d(TAG, "Initializing translation engine...")
        ortEnv = OrtEnvironment.getEnvironment()

        // As per Phase C:
        tokenizer = IndicSpmTokenizer(
            srcSpmModel = File(modelDir, "sentencepiece.bpe.model"),
            tgtSpmModel = File(modelDir, "sentencepiece.bpe.model")
        )

        isInitialized = true
        Log.d(TAG, "Translation engine initialized.")
    }

    fun translate(hindiText: String, maxLength: Int = 128): String {
        check(isInitialized) { "Call initialize() first" }
        val env = ortEnv ?: return ""
        val tk = tokenizer ?: return ""

        Log.d(TAG, "Starting sequential translation for: $hindiText")
        
        val opts = OrtSession.SessionOptions().apply {
            setIntraOpNumThreads(4)
            setOptimizationLevel(OrtSession.SessionOptions.OptLevel.BASIC_OPT)
        }

        // 1. Tokenize: "<2sat_Olck> hindiText </s>"
        val inputIds = tk.encode(hindiText, srcLang = "hin_Deva", tgtLang = "sat_Olck")
        val attentionMask = LongArray(inputIds.size) { 1L }
        val srcLen = inputIds.size.toLong()

        // ── 1. Load ONLY encoder, run it, then release it immediately ──
        val encSession = env.createSession(File(modelDir, "encoder_model_int8.onnx").absolutePath, opts)
        
        val hiddenStatesArray: FloatArray
        val encAttnArray = attentionMask

        val encOut = encSession.run(mapOf(
            "input_ids"      to OnnxTensor.createTensor(env, LongBuffer.wrap(inputIds), longArrayOf(1L, srcLen)),
            "attention_mask" to OnnxTensor.createTensor(env, LongBuffer.wrap(attentionMask), longArrayOf(1L, srcLen))
        ))
        val hiddenTensor = encOut[0] as OnnxTensor
        hiddenStatesArray = FloatArray(hiddenTensor.floatBuffer.remaining()).also { hiddenTensor.floatBuffer.get(it) }
        val hiddenShape = hiddenTensor.info.shape.clone()
        
        encOut.close()
        encSession.close()  // ← FREE ENCODER RAM BEFORE LOADING DECODER
        Log.d(TAG, "Encoder finished and released")

        // ── 2. Load ONLY decoder, run greedy decode, then release ──
        val decSession = env.createSession(File(modelDir, "decoder_model_int8.onnx").absolutePath, opts)
        val hiddenStatesTensor = OnnxTensor.createTensor(env, FloatBuffer.wrap(hiddenStatesArray), hiddenShape)
        val encAttnTensor = OnnxTensor.createTensor(env, LongBuffer.wrap(encAttnArray), longArrayOf(1L, srcLen))

        val eosId = tk.eosId.toLong()
        val bosId = tk.bosId.toLong()
        val generatedIds = mutableListOf(bosId)

        for (step in 0 until maxLength) {
            val lastToken = longArrayOf(generatedIds.last())
            val decInputIds = OnnxTensor.createTensor(
                env, LongBuffer.wrap(lastToken), longArrayOf(1L, 1L))

            val decOutput = decSession.run(mapOf(
                "input_ids"              to decInputIds,
                "encoder_hidden_states"  to hiddenStatesTensor,
                "encoder_attention_mask" to encAttnTensor
            ))

            val logitsTensor = decOutput[0] as OnnxTensor
            val logits       = logitsTensor.floatBuffer
            val vocabSize    = logitsTensor.info.shape[2].toInt()

            var maxIdx = 0
            var maxVal = Float.NEGATIVE_INFINITY
            for (i in 0 until vocabSize) {
                val v = logits.get()
                if (v > maxVal) { maxVal = v; maxIdx = i }
            }
            generatedIds.add(maxIdx.toLong())
            decOutput.close()
            
            if (maxIdx.toLong() == eosId) break
        }

        decSession.close()  // ← FREE DECODER RAM WHEN DONE
        Log.d(TAG, "Decoder finished and released")

        // 4. Detokenize — drop BOS and EOS
        val outputIds = generatedIds.drop(1)
            .filter { it != eosId }
            .map { it.toInt() }

        val result = tk.decode(outputIds)
        Log.d(TAG, "Result (${outputIds.size} tokens): \"$result\"")
        return result
    }

    fun release() {
        ortEnv?.close()
        ortEnv = null
        tokenizer = null
        isInitialized = false
        Log.d(TAG, "Translation engine released")
    }
}
