package com.example.hindisantali.translation

import android.content.Context
import android.util.Log
import ai.onnxruntime.*
import java.io.File
import java.nio.LongBuffer

/**
 * Hindi → Santali (Ol Chiki) translation using IndicTrans2 Distilled 200M ONNX.
 *
 *      - Step 0: decoder_model.onnx  (input_ids, encoder_attention_mask, encoder_hidden_states)
 *      - Step 1+: decoder_with_past_model.onnx  (input_ids, encoder_attention_mask, past_key_values.*)
 *      - Output present.N.* tensors are renamed → past_key_values.N.* for the next step
 *
 * Lifecycle: initialize() → translate() → release()
 */
class HindiSantaliTranslator(private val context: Context) {

    private val TAG = "HindiSantaliTranslator"

    private var ortEnv: OrtEnvironment? = null
    private var encoderSession: OrtSession? = null
    private var decoderSession: OrtSession? = null
    private var decoderWithPastSession: OrtSession? = null
    private var tokenizer: IndicSpmTokenizer? = null
    private var isInitialized = false

    private val modelDir: File get() = TranslationModelDownloader.getModelDir(context)

    fun initialize() {
        if (isInitialized) return

        Log.d(TAG, "Initializing translation engine...")
        val opts = OrtSession.SessionOptions().apply {
            setIntraOpNumThreads(2)
            setInterOpNumThreads(1)
            setOptimizationLevel(OrtSession.SessionOptions.OptLevel.BASIC_OPT)
        }

        ortEnv = OrtEnvironment.getEnvironment()
        val env = ortEnv!!

        encoderSession = env.createSession(
            File(modelDir, "encoder_model.onnx").absolutePath, opts)
        decoderSession = env.createSession(
            File(modelDir, "decoder_model.onnx").absolutePath, opts)
        decoderWithPastSession = env.createSession(
            File(modelDir, "decoder_with_past_model.onnx").absolutePath, opts)

        tokenizer = IndicSpmTokenizer(
            srcSpmModel = File(modelDir, "model.SRC"),
            tgtSpmModel = File(modelDir, "model.TGT")
        )

        isInitialized = true
        Log.d(TAG, "Translation engine initialized.")
    }

    fun translate(hindiText: String, maxLength: Int = 128): String {
        check(isInitialized) { "Call initialize() first" }
        val env = ortEnv ?: return ""
        val enc = encoderSession ?: return ""
        val dec = decoderSession ?: return ""
        val decPast = decoderWithPastSession ?: return ""
        val tk  = tokenizer ?: return ""

        // 1. Tokenize: "<2sat_Olck> hindiText </s>"
        val inputIds = tk.encode(hindiText, srcLang = "hin_Deva", tgtLang = "sat_Olck")
        val attentionMask = LongArray(inputIds.size) { 1L }
        val srcLen = inputIds.size.toLong()

        Log.d(TAG, "Encoded ${inputIds.size} tokens for: $hindiText")

        // 2. Run Encoder once
        val encAttnTensor = OnnxTensor.createTensor(
            env, LongBuffer.wrap(attentionMask), longArrayOf(1L, srcLen))
        val encoderOutput = enc.run(mapOf(
            "input_ids"      to OnnxTensor.createTensor(env, LongBuffer.wrap(inputIds), longArrayOf(1L, srcLen)),
            "attention_mask" to encAttnTensor
        ))
        val hiddenStates = encoderOutput[0] as OnnxTensor  // [1, srcLen, hidden]

        // 3. Greedy decode
        val eosId = tk.eosId.toLong()
        val bosId = tk.bosId.toLong()
        val generatedIds = mutableListOf(bosId)

        var pastKeyValues: Map<String, OnnxTensor>? = null

        for (step in 0 until maxLength) {
            val lastToken = longArrayOf(generatedIds.last())
            val decInputIds = OnnxTensor.createTensor(
                env, LongBuffer.wrap(lastToken), longArrayOf(1L, 1L))

            val usePast = pastKeyValues != null
            val activeSession = if (usePast) decPast else dec
            
            val decInputs = mutableMapOf<String, OnnxTensor>()
            for (name in activeSession.inputNames) {
                when {
                    name == "input_ids"              -> decInputs[name] = decInputIds
                    name == "encoder_hidden_states"  -> decInputs[name] = hiddenStates
                    name == "encoder_attention_mask" -> decInputs[name] = encAttnTensor
                    usePast && pastKeyValues!!.containsKey(name) -> decInputs[name] = pastKeyValues!![name]!!
                }
            }

            val decOutput = activeSession.run(decInputs)

            // logits shape: [1, 1, vocabSize]
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

            val newPast = mutableMapOf<String, OnnxTensor>()
            for (entry in decOutput) {
                val key = entry.key
                if (key.startsWith("present.")) {
                    val pastName = key.replace("present.", "past_key_values.")
                    newPast[pastName] = entry.value as OnnxTensor
                }
            }
            pastKeyValues = newPast

            if (maxIdx.toLong() == eosId) break
        }

        encoderOutput.close()

        // 4. Detokenize — drop BOS and EOS
        val outputIds = generatedIds.drop(1)
            .filter { it != eosId }
            .map { it.toInt() }

        val result = tk.decode(outputIds)
        Log.d(TAG, "Result (${outputIds.size} tokens): \"$result\"")
        return result
    }

    fun release() {
        encoderSession?.close()
        decoderSession?.close()
        decoderWithPastSession?.close()
        ortEnv?.close()
        encoderSession = null
        decoderSession = null
        decoderWithPastSession = null
        ortEnv = null
        tokenizer = null
        isInitialized = false
        Log.d(TAG, "Translation engine released")
    }
}
