package com.example.hindisantali.translation

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

/**
 * Downloads the IndicTrans2 Distilled 200M INT8 ONNX model on first launch.
 * Model: ai4bharat/indictrans2-indic-indic-dist-200M (ONNX INT8 export)
 *
 * IMPORTANT: Update TRANSLATION_BASE_URL to the actual URL where you uploaded
 * the exported ONNX files after running scripts/export_translation_onnx.py
 */
object TranslationModelDownloader {

    private const val TAG = "TranslationDownloader"
    const val MODEL_DIR_NAME = "translation_model"

    const val TRANSLATION_BASE_URL = "https://huggingface.co/sharjilsharma/indictrans2-hi-sat-int8/resolve/main/"

    val REQUIRED_FILES = listOf(
        "encoder_model_int8.onnx",
        "decoder_model_int8.onnx",
        "sentencepiece.bpe.model",
        "config.json",
        "tokenizer_config.json"
    )

    fun getModelDir(context: Context): File {
        return File(context.filesDir, MODEL_DIR_NAME)
    }

    fun isModelDownloaded(context: Context): Boolean {
        val dir = getModelDir(context)
        return REQUIRED_FILES.all { File(dir, it).exists() }
    }

    suspend fun downloadIfNeeded(
        context: Context,
        baseUrl: String = "",
        fileNames: List<String> = REQUIRED_FILES,
        onProgress: (String, Float, Float) -> Unit = { _, _, _ -> }
    ): Result<Unit> = withContext(Dispatchers.IO) {
        val modelDir = getModelDir(context)
        modelDir.mkdirs()

        try {
            for (fileName in fileNames) {
                val destFile = File(modelDir, fileName)
                
                if (destFile.exists()) {
                    Log.d(TAG, "Skipping $fileName - already exists")
                    continue
                }

                Log.d(TAG, "Extracting $fileName from assets")
                
                context.assets.open("translation_model/$fileName").use { input ->
                    val totalBytes = input.available().toLong()
                    var extractedBytes = 0L
                    
                    destFile.outputStream().use { output ->
                        val buffer = ByteArray(32768)
                        var bytesRead: Int
                        while (input.read(buffer).also { bytesRead = it } != -1) {
                            output.write(buffer, 0, bytesRead)
                            extractedBytes += bytesRead
                            if (totalBytes > 0) {
                                onProgress(fileName, extractedBytes / 1_048_576f, totalBytes / 1_048_576f)
                            }
                        }
                    }
                }
                Log.d(TAG, "Extracted $fileName (${destFile.length()} bytes)")
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to extract models: ${e.message}")
            Result.failure(e)
        }
    }
}
