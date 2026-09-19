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
        onProgress: (fileName: String, downloadedMb: Float, totalMb: Float) -> Unit = { _, _, _ -> }
    ): Result<Unit> = withContext(Dispatchers.IO) {
        val dir = getModelDir(context)
        dir.mkdirs()

        for (fileName in REQUIRED_FILES) {
            val dest = File(dir, fileName)
            if (dest.exists()) {
                Log.d(TAG, "Skipping $fileName — already exists")
                continue
            }

            val tmpDest = File(dir, "$fileName.tmp")
            val url = "$TRANSLATION_BASE_URL$fileName"
            Log.d(TAG, "Downloading $fileName")

            try {
                val conn = URL(url).openConnection() as HttpURLConnection
                conn.connectTimeout = 30_000
                conn.readTimeout   = 60_000
                conn.connect()

                val total = conn.contentLengthLong
                var downloaded = 0L

                conn.inputStream.use { input ->
                    tmpDest.outputStream().use { output ->
                        val buf = ByteArray(32768)
                        var read: Int
                        while (input.read(buf).also { read = it } != -1) {
                            output.write(buf, 0, read)
                            downloaded += read
                            onProgress(
                                fileName,
                                downloaded / 1_048_576f,
                                total / 1_048_576f
                            )
                        }
                    }
                }
                
                if (tmpDest.renameTo(dest)) {
                    Log.d(TAG, "Downloaded $fileName (${dest.length()} bytes)")
                } else {
                    throw IOException("Failed to rename temporary file to $fileName")
                }
            } catch (e: Exception) {
                tmpDest.delete()
                dest.delete()
                Log.e(TAG, "Failed to download $fileName: ${e.message}")
                return@withContext Result.failure(e)
            }
        }
        Result.success(Unit)
    }
}
