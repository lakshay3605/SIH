package com.example.hindisantali.asr

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Log
import androidx.core.content.ContextCompat
import kotlinx.coroutines.*
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Push-to-talk offline ASR recorder.
 * Call startRecording() when mic button pressed.
 * Call stopAndTranscribe(engine) when mic button released.
 * Returns Hindi text from SherpaOnnx on-device model.
 */
class OfflineAsrRecorder(private val context: Context) {

    private val TAG = "OfflineAsrRecorder"

    companion object {
        const val SAMPLE_RATE = 16000
        const val CHANNEL = AudioFormat.CHANNEL_IN_MONO
        const val ENCODING = AudioFormat.ENCODING_PCM_16BIT
    }

    private val isRecording = AtomicBoolean(false)
    private val samples = mutableListOf<Short>()
    private var recordJob: Job? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    fun isPermissionGranted(): Boolean =
        ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) ==
                PackageManager.PERMISSION_GRANTED

    /** Call when the mic button is pressed. Starts buffering audio. */
    fun startRecording() {
        if (isRecording.get()) return

        isRecording.set(true)
        synchronized(samples) { samples.clear() }

        recordJob = scope.launch {
            val bufSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL, ENCODING).coerceAtLeast(3200)
            val recorder = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                SAMPLE_RATE, CHANNEL, ENCODING, bufSize
            )

            if (recorder.state != AudioRecord.STATE_INITIALIZED) {
                Log.e(TAG, "AudioRecord failed to initialize")
                isRecording.set(false)
                return@launch
            }

            val chunk = ShortArray(bufSize / 2)
            recorder.startRecording()
            Log.d(TAG, "Push-to-talk recording started")

            try {
                while (isRecording.get() && isActive) {
                    val read = recorder.read(chunk, 0, chunk.size)
                    if (read > 0) {
                        synchronized(samples) {
                            for (i in 0 until read) samples.add(chunk[i])
                        }
                    }
                }
            } finally {
                recorder.stop()
                recorder.release()
                Log.d(TAG, "Recording stopped, got ${samples.size} samples")
            }
        }
    }

    /**
     * Call when the mic button is released.
     * Stops recording and transcribes via HindiAsrEngine.
     * Returns recognized Hindi text or empty string.
     */
    suspend fun stopAndTranscribe(engine: HindiAsrEngine): String {
        isRecording.set(false)
        recordJob?.join()
        recordJob = null

        val pcm = synchronized(samples) { samples.toShortArray() }
        if (pcm.isEmpty()) {
            Log.w(TAG, "No audio recorded")
            return ""
        }

        Log.d(TAG, "Transcribing ${pcm.size} samples (${pcm.size / SAMPLE_RATE}s)...")
        return engine.transcribe(pcm)
    }

    fun release() {
        isRecording.set(false)
        recordJob?.cancel()
        scope.cancel()
    }
}
