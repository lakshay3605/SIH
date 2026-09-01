package com.example.hindisantali.asr

import android.content.Context
import android.util.Log
import com.k2fsa.sherpa.onnx.*
import java.io.File

/**
 * Wraps SherpaOnnx's OfflineRecognizer for Hindi speech recognition.
 *
 * Lifecycle:
 *   1. Call initialize() once (loads model into RAM)
 *   2. Call transcribe(pcmData) to get Hindi text
 *   3. Call release() when done to free RAM before loading Translation model
 *
 * This sequential load/unload pattern prevents OOM on 2GB RAM devices.
 */
class HindiAsrEngine(private val context: Context) {

    private val TAG = "HindiAsrEngine"
    private var recognizer: OfflineRecognizer? = null
    private var isInitialized = false

    /**
     * Load the SherpaOnnx IndicConformer INT8 model from local storage.
     * Must be called on a background thread (IO dispatcher).
     * Will throw if model files are not present — call ModelDownloader first.
     */
    fun initialize() {
        if (isInitialized) return

        val modelDir = ModelDownloader.getModelDir(context)
        check(modelDir.exists()) { "Model directory not found: ${modelDir.absolutePath}" }

        val config = OfflineRecognizerConfig(
            featConfig = FeatureConfig(sampleRate = 16000, featureDim = 80),
            modelConfig = OfflineModelConfig(
                nemo = OfflineNemoEncDecCtcModelConfig(
                    model = File(modelDir, "model.int8.onnx").absolutePath
                ),
                tokens = File(modelDir, "tokens.txt").absolutePath,
                numThreads = 2,
                debug = false,
            )
        )
        recognizer = OfflineRecognizer(config = config)
        isInitialized = true
        Log.d(TAG, "ASR engine initialized")
    }

    /**
     * Transcribe Hindi speech from raw 16kHz mono PCM data.
     * @param pcmData ShortArray of 16kHz mono PCM samples
     * @return Recognized Hindi text (Devanagari), or empty string if nothing detected
     */
    fun transcribe(pcmData: ShortArray): String {
        check(isInitialized) { "Engine not initialized. Call initialize() first." }
        val rec = recognizer ?: return ""

        // Convert ShortArray to FloatArray (SherpaOnnx uses float samples in range -1..1)
        val floatSamples = FloatArray(pcmData.size) { i -> pcmData[i] / 32768.0f }

        val stream = rec.createStream()
        stream.acceptWaveform(floatSamples, sampleRate = 16000)

        rec.decode(stream)

        val result = rec.getResult(stream).text.trim()
        stream.release()

        Log.d(TAG, "ASR result: '$result'")
        return result
    }

    /**
     * Release all native resources. Call this after transcription is complete
     * to free RAM before the Translation model is loaded.
     */
    fun release() {
        recognizer?.release()
        recognizer = null
        isInitialized = false
        Log.d(TAG, "ASR engine released")
    }
}
