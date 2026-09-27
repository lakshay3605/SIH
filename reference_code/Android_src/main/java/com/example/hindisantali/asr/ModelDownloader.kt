package com.example.hindisantali.asr

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

/**
 * Downloads the SherpaOnnx IndicConformer INT8 model on first launch.
 * After download, the app works fully offline — no internet needed again.
 *
 * Model: meetsync/indic-conformer-onnx-sherpa (INT8 quantized, ~196MB total)
 * Hosted on: HuggingFace Hub (public, no auth required)
 */
object ModelDownloader {

    private const val TAG = "ModelDownloader"

    // HuggingFace direct download URLs for IndicConformer INT8 SherpaOnnx bundle
    const val BASE_URL =
        "https://huggingface.co/meetsync/indic-conformer-onnx-sherpa/resolve/main/"

    // Model directory name inside app's filesDir
    const val MODEL_DIR_NAME = "asr_model"

    // Required files
    val REQUIRED_FILES = listOf(
        "model.int8.onnx",
        "tokens.txt"
    )

    fun getModelDir(context: Context): File {
        return File(context.filesDir, MODEL_DIR_NAME)
    }

    fun isModelDownloaded(context: Context): Boolean {
        val modelDir = getModelDir(context)
        return REQUIRED_FILES.all { File(modelDir, it).exists() }
    }

    /**
     * Downloads all model files if not already present.
     * Call this from a coroutine on Dispatchers.IO.
     * @param onProgress callback with (downloadedBytes, totalBytes, currentFileName)
     */
    suspend fun downloadIfNeeded(
        context: Context,
        baseUrl: String,
        fileNames: List<String>,
        onProgress: (String, Float, Float) -> Unit = { _, _, _ -> }
    ): Result<Unit> = withContext(Dispatchers.IO) {
        val modelDir = getModelDir(context)
        modelDir.mkdirs()

        for (fileName in fileNames) {
            val destFile = File(modelDir, fileName)
            val tmpDest = File(modelDir, "$fileName.tmp")
            
            if (destFile.exists()) {
                Log.d(TAG, "Skipping $fileName — already exists")
                continue
            }

            val url = "$baseUrl$fileName"
            Log.d(TAG, "Downloading $fileName from $url")

            try {
                val connection = URL(url).openConnection() as HttpURLConnection
                connection.connectTimeout = 30_000
                connection.readTimeout = 60_000
                connection.connect()
                
                val totalBytes = connection.contentLengthLong
                var downloadedBytes = 0L

                connection.inputStream.use { input ->
                    tmpDest.outputStream().use { output ->
                        val buffer = ByteArray(32768)
                        var bytesRead: Int
                        while (input.read(buffer).also { bytesRead = it } != -1) {
                            output.write(buffer, 0, bytesRead)
                            downloadedBytes += bytesRead
                            onProgress(fileName, downloadedBytes / 1_048_576f, totalBytes / 1_048_576f)
                        }
                    }
                }

                // Rename tmp to final only if fully successful
                if (tmpDest.renameTo(destFile)) {
                    Log.d(TAG, "Downloaded $fileName (${destFile.length()} bytes)")
                } else {
                    throw IOException("Failed to rename temporary file to $fileName")
                }
            } catch (e: Exception) {
                tmpDest.delete()
                destFile.delete()
                Log.e(TAG, "Failed to download $fileName: ${e.message}")
                return@withContext Result.failure(e)
            }
        }

        Result.success(Unit)
    }
}
