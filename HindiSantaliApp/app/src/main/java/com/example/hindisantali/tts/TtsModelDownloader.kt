package com.example.hindisantali.tts

import android.content.Context
import java.io.File

/**
 * Stub downloader for the TTS component.
 *
 * Since the app now uses Android's built-in TextToSpeech (zero download),
 * this object always reports the TTS as "ready" with no files to download.
 * Kept as a stub so the ViewModel download flow compiles without changes.
 */
object TtsModelDownloader {

    const val MODEL_DIR_NAME = "tts_model"

    fun getModelDir(context: Context): File =
        File(context.filesDir, MODEL_DIR_NAME)

    /** Always returns true — built-in TTS needs no model files. */
    fun isModelDownloaded(context: Context): Boolean = true

    /** No-op download — built-in TTS needs no download. */
    suspend fun downloadIfNeeded(
        context: Context,
        onProgress: (fileName: String, downloadedMb: Float, totalMb: Float) -> Unit = { _, _, _ -> }
    ): Result<Unit> = Result.success(Unit)
}
