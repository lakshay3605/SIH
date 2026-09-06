# Phase 5 — TTS Integration: Santali Speech Synthesis
## Plan + Agent Prompt (Single File)

---

# SECTION A — CONTEXT (READ BEFORE TOUCHING ANY CODE)

## Why Parler-TTS Is Rejected (Do Not Attempt It)
`ai4bharat/indic-parler-tts` benchmark on CPU (from `outputs/tts_results.json`):
- Disk size: **3,589 MB**
- Peak RAM: **3,758 MB** — the target device has 2GB total
- Inference latency: **33–54 seconds** per sentence
- Real-time factor: **13x** — 13 seconds of compute per 1 second of speech

This model is **physically impossible to run on a 2GB Android device.** Do not attempt to use it, find an ONNX version of it, quantize it, or optimize it. It is rejected. Move on.

## The Correct TTS Model: Meta MMS VITS for Santali
Meta's Massively Multilingual Speech (MMS) project covers **1,100+ languages including Santali** (ISO 639-3: `sat`).

- HuggingFace model: `facebook/mms-tts-sat`
- Architecture: VITS (fast end-to-end neural TTS)
- Disk size after ONNX INT8: **~30–60 MB**
- Expected inference latency on Android: **< 2 seconds**
- RAM footprint: **~80 MB**
- Android library needed: **SherpaOnnx** — which is **already in the project** as `sherpa-onnx-1.11.3-patched.aar`

No new Android library dependency is needed. Zero.

## What Already Exists (Do NOT touch these unless the plan explicitly says to)
- `d:\sih2026\HindiSantaliApp\app\libs\sherpa-onnx-1.11.3-patched.aar` — already in build.gradle.kts ✅
- `asr\HindiAsrEngine.kt` — working ✅
- `asr\ModelDownloader.kt` — working ✅
- `translation\HindiSantaliTranslator.kt` — working ✅
- `translation\TranslationModelDownloader.kt` — working ✅
- `ui\main\MainScreen.kt` — complete UI, do NOT rewrite it ✅
- `ui\main\MainScreenViewModel.kt` — has 3 stubs to fill in Phase 5 ✅

## Stubs to Fill in Phase 5
In `MainScreenViewModel.kt`, the following 3 functions are stubs:

**Stub 1** (line ~312):
```kotlin
private fun speakSantali(santaliText: String): String {
    // TODO Phase 5 — TTS synthesis
    return ""
}
```

**Stub 2** (line ~319):
```kotlin
fun playAudio() {
    val path = _uiState.value.audioFilePath ?: return
    // TODO Phase 5: Play the WAV at `path` using MediaPlayer or AudioTrack
    _uiState.update { it.copy(isPlaying = true) }
}
```

**Stub 3** (line ~325):
```kotlin
fun stopAudio() {
    // TODO Phase 5: Stop MediaPlayer
    _uiState.update { it.copy(isPlaying = false) }
}
```

---

# SECTION B — STEP-BY-STEP EXECUTION PLAN

## STEP 1 — Export MMS Santali ONNX Model (Run on PC, Not Android)

Create file: `d:\sih2026\scripts\export_tts_onnx.py`

```python
"""
Exports facebook/mms-tts-sat (VITS) to SherpaOnnx-compatible ONNX format.
Run once on the developer PC.
Output goes to: d:\sih2026\tts_model\

Requirements:
    pip install transformers torch onnx onnxruntime sherpa-onnx
"""

import os
import sys
import torch
import onnx
from transformers import VitsModel, AutoTokenizer
from onnxruntime.quantization import quantize_dynamic, QuantType

MODEL_ID = "facebook/mms-tts-sat"
OUTPUT_DIR = r"d:\sih2026\tts_model"
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("Loading MMS Santali TTS model...")
model = VitsModel.from_pretrained(MODEL_ID)
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
model.eval()

# Test input — simple Santali greeting
sample_text = "ᱡᱚᱦᱟᱨ"
inputs = tokenizer(sample_text, return_tensors="pt")

print("Exporting to ONNX...")
onnx_path = os.path.join(OUTPUT_DIR, "model.onnx")

with torch.no_grad():
    torch.onnx.export(
        model,
        (inputs["input_ids"],),
        onnx_path,
        opset_version=17,
        input_names=["input_ids"],
        output_names=["waveform"],
        dynamic_axes={
            "input_ids": {0: "batch", 1: "sequence"},
            "waveform":  {0: "batch", 2: "samples"},
        },
        do_constant_folding=True,
    )
print(f"Exported: {onnx_path} ({os.path.getsize(onnx_path) // 1024 // 1024} MB)")

print("Quantizing to INT8...")
int8_path = os.path.join(OUTPUT_DIR, "model.int8.onnx")
quantize_dynamic(onnx_path, int8_path, weight_type=QuantType.QInt8)
os.remove(onnx_path)  # Remove float32 version
print(f"INT8 model: {int8_path} ({os.path.getsize(int8_path) // 1024 // 1024} MB)")

# Save sample rate info
sample_rate = model.config.sampling_rate  # Should be 16000 for MMS
with open(os.path.join(OUTPUT_DIR, "config.txt"), "w") as f:
    f.write(f"sample_rate={sample_rate}\n")
    f.write(f"model_id={MODEL_ID}\n")

print(f"\nDone. Sample rate: {sample_rate}")
print(f"Files saved to: {OUTPUT_DIR}")
print("Upload model.int8.onnx and config.txt to HuggingFace, then update TTS_BASE_URL in TtsModelDownloader.kt")
```

**Run it:**
```powershell
python d:\sih2026\scripts\export_tts_onnx.py
```

**Expected output files in `d:\sih2026\tts_model\`:**
- `model.int8.onnx` — ONNX INT8 VITS model (~30–60MB)
- `config.txt` — sample rate info

**If torch.onnx.export fails** with a `TracerWarning` or dynamic control flow error:
Replace the export block with this alternative using `optimum`:
```python
# Alternative: use optimum export
# pip install optimum[onnxruntime]
from optimum.exporters.onnx import main_export
main_export(MODEL_ID, output=OUTPUT_DIR, task="text-to-audio")
```

**After exporting:** Upload `model.int8.onnx` to a public HuggingFace repo. Note the raw download URL.

---

## STEP 2 — Create TtsModelDownloader.kt

Create new file:
`d:\sih2026\HindiSantaliApp\app\src\main\java\com\example\hindisantali\tts\TtsModelDownloader.kt`

```kotlin
package com.example.hindisantali.tts

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

object TtsModelDownloader {

    private const val TAG = "TtsModelDownloader"
    const val MODEL_DIR_NAME = "tts_model"

    // ⚠️ UPDATE THIS after uploading model.int8.onnx to HuggingFace
    const val TTS_BASE_URL =
        "https://huggingface.co/YOUR_USERNAME/mms-tts-sat-onnx/resolve/main/"

    val REQUIRED_FILES = listOf("model.int8.onnx")

    fun getModelDir(context: Context): File =
        File(context.filesDir, MODEL_DIR_NAME)

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

            val url = "$TTS_BASE_URL$fileName"
            Log.d(TAG, "Downloading $fileName from $url")

            try {
                val conn = URL(url).openConnection() as HttpURLConnection
                conn.connectTimeout = 30_000
                conn.readTimeout    = 60_000
                conn.connect()

                val total = conn.contentLengthLong
                var downloaded = 0L

                conn.inputStream.use { input ->
                    dest.outputStream().use { output ->
                        val buf = ByteArray(32_768)
                        var read: Int
                        while (input.read(buf).also { read = it } != -1) {
                            output.write(buf, 0, read)
                            downloaded += read
                            onProgress(fileName, downloaded / 1_048_576f, total / 1_048_576f)
                        }
                    }
                }
                Log.d(TAG, "Downloaded $fileName")
            } catch (e: Exception) {
                dest.delete()
                Log.e(TAG, "Failed to download $fileName: ${e.message}")
                return@withContext Result.failure(e)
            }
        }
        Result.success(Unit)
    }
}
```

---

## STEP 3 — Create SantaliTtsEngine.kt

Create new file:
`d:\sih2026\HindiSantaliApp\app\src\main\java\com\example\hindisantali\tts\SantaliTtsEngine.kt`

```kotlin
package com.example.hindisantali.tts

import android.content.Context
import android.util.Log
import com.k2fsa.sherpa.onnx.OfflineTts
import com.k2fsa.sherpa.onnx.OfflineTtsConfig
import com.k2fsa.sherpa.onnx.OfflineTtsModelConfig
import com.k2fsa.sherpa.onnx.OfflineTtsVitsModelConfig
import java.io.DataOutputStream
import java.io.File

/**
 * Santali TTS using Meta MMS VITS model via SherpaOnnx.
 *
 * Model: facebook/mms-tts-sat (exported to ONNX INT8)
 * Sample rate: 16000 Hz (MMS standard)
 * Output: 16kHz mono WAV file written to cacheDir
 *
 * Lifecycle: initialize() → synthesize() → release()
 * Always call release() after synthesize() to free ~80MB RAM.
 */
class SantaliTtsEngine(private val context: Context) {

    private val TAG = "SantaliTtsEngine"
    private var tts: OfflineTts? = null
    private var isInitialized = false
    private val modelDir: File get() = TtsModelDownloader.getModelDir(context)

    // MMS TTS sample rate is 16000 Hz
    private val sampleRate = 16_000

    fun initialize() {
        if (isInitialized) return

        val modelFile = File(modelDir, "model.int8.onnx")
        check(modelFile.exists()) {
            "TTS model file not found at ${modelFile.absolutePath}. Download it first."
        }

        val config = OfflineTtsConfig(
            model = OfflineTtsModelConfig(
                vits = OfflineTtsVitsModelConfig(
                    model   = modelFile.absolutePath,
                    lexicon = "",   // MMS models do NOT use a lexicon file
                    tokens  = "",   // MMS models do NOT use a tokens file
                    dataDir = "",
                    dictDir = "",
                    noiseScale    = 0.667f,
                    noiseScaleW   = 0.8f,
                    lengthScale   = 1.0f,
                ),
                numThreads = 2,
                debug    = false,
                provider = "cpu",
            )
        )

        tts = OfflineTts(config = config)
        isInitialized = true
        Log.d(TAG, "TTS engine initialized")
    }

    /**
     * Synthesizes Santali Ol Chiki text to a WAV file.
     *
     * @param text  Santali text (Ol Chiki script)
     * @param outFile  Target WAV file path (must be writable)
     * @return Absolute path to the generated WAV file
     */
    fun synthesize(text: String, outFile: File): String {
        check(isInitialized) { "Call initialize() first" }
        val engine = tts ?: throw IllegalStateException("TTS engine is null")

        // SherpaOnnx generate: sid = speaker id (0 for MMS), speed = 1.0
        val audio = engine.generate(text = text, sid = 0, speed = 1.0f)

        // Write float PCM samples to WAV file
        writeWav(audio.samples, audio.sampleRate, outFile)

        Log.d(TAG, "Synthesized ${audio.samples.size} samples at ${audio.sampleRate}Hz → ${outFile.name}")
        return outFile.absolutePath
    }

    fun release() {
        tts?.release()
        tts = null
        isInitialized = false
        Log.d(TAG, "TTS engine released")
    }

    // ── WAV Writer ────────────────────────────────────────────────────────────

    private fun writeWav(samples: FloatArray, sampleRate: Int, file: File) {
        // Convert float PCM [-1, 1] to 16-bit signed PCM
        val pcmBytes = ByteArray(samples.size * 2)
        for (i in samples.indices) {
            val s = (samples[i].coerceIn(-1f, 1f) * 32767).toInt().toShort()
            pcmBytes[i * 2]     = (s.toInt() and 0xFF).toByte()
            pcmBytes[i * 2 + 1] = (s.toInt() shr 8 and 0xFF).toByte()
        }

        val numChannels   = 1
        val bitsPerSample = 16
        val byteRate      = sampleRate * numChannels * bitsPerSample / 8
        val blockAlign    = numChannels * bitsPerSample / 8
        val dataSize      = pcmBytes.size

        file.parentFile?.mkdirs()
        DataOutputStream(file.outputStream().buffered()).use { out ->
            fun Int.writeLE() {
                out.write(this and 0xFF)
                out.write(this shr 8 and 0xFF)
                out.write(this shr 16 and 0xFF)
                out.write(this shr 24 and 0xFF)
            }
            fun Short.writeLE() {
                out.write(toInt() and 0xFF)
                out.write(toInt() shr 8 and 0xFF)
            }
            out.writeBytes("RIFF")
            (36 + dataSize).writeLE()
            out.writeBytes("WAVE")
            out.writeBytes("fmt ")
            16.writeLE()
            1.toShort().writeLE()                    // PCM format
            numChannels.toShort().writeLE()
            sampleRate.writeLE()
            byteRate.writeLE()
            blockAlign.toShort().writeLE()
            bitsPerSample.toShort().writeLE()
            out.writeBytes("data")
            dataSize.writeLE()
            out.write(pcmBytes)
        }
    }
}
```

---

## STEP 4 — Update MainScreenViewModel.kt

Open: `d:\sih2026\HindiSantaliApp\app\src\main\java\com\example\hindisantali\ui\main\MainScreenViewModel.kt`

### 4a. Add imports at the top (after existing imports):
```kotlin
import android.media.MediaPlayer
import com.example.hindisantali.tts.SantaliTtsEngine
import com.example.hindisantali.tts.TtsModelDownloader
import java.io.File
```

### 4b. Add two new properties in the class body (after `private val translator = ...`):
```kotlin
private val ttsEngine = SantaliTtsEngine(application)
private var mediaPlayer: MediaPlayer? = null
```

### 4c. Update `checkModelsReady()` — add TTS check (3 models now):
Replace the entire `checkModelsReady()` function with:
```kotlin
fun checkModelsReady() {
    viewModelScope.launch(Dispatchers.IO) {
        val asrReady   = ModelDownloader.isModelDownloaded(getApplication())
        val transReady = TranslationModelDownloader.isModelDownloaded(getApplication())
        val ttsReady   = TtsModelDownloader.isModelDownloaded(getApplication())
        val allReady   = asrReady && transReady && ttsReady
        withContext(Dispatchers.Main) {
            _uiState.update { it.copy(modelsReady = allReady) }
            if (!allReady) {
                val msg = buildString {
                    if (!asrReady)   append("ASR model missing. ")
                    if (!transReady) append("Translation model missing. ")
                    if (!ttsReady)   append("TTS model missing. ")
                }
                _uiState.update { it.copy(errorMessage = msg.trim()) }
            }
        }
    }
}
```

### 4d. Update `downloadModels()` — add TTS download as the 3rd step:
After the `transResult` block (which handles Translation model download), add before the closing `}` of the launch block:
```kotlin
// Download TTS model third
val ttsResult = TtsModelDownloader.downloadIfNeeded(
    context = getApplication(),
    onProgress = { fileName, downloadedMb, totalMb ->
        val progress = if (totalMb > 0) downloadedMb / totalMb else 0f
        _uiState.update { it.copy(
            downloadProgress = progress,
            downloadStatusText = "TTS: Downloading $fileName (%.1f/%.1f MB)".format(downloadedMb, totalMb)
        )}
    }
)
withContext(Dispatchers.Main) {
    if (ttsResult.isSuccess) {
        _uiState.update { it.copy(
            modelsReady = true,
            isDownloading = false,
            errorMessage = null,
            downloadStatusText = "All models ready!"
        )}
    } else {
        _uiState.update { it.copy(
            isDownloading = false,
            errorMessage = "TTS download failed: ${ttsResult.exceptionOrNull()?.message}"
        )}
    }
}
```

Also update the `transResult` success block — it should NOT set `modelsReady = true` yet (that happens after TTS downloads). Change it to:
```kotlin
// After transResult.isSuccess, just continue — do NOT set modelsReady yet
if (transResult.isFailure) {
    withContext(Dispatchers.Main) {
        _uiState.update { it.copy(
            isDownloading = false,
            errorMessage = "Translation download failed: ${transResult.exceptionOrNull()?.message}"
        )}
    }
    return@launch
}
```

### 4e. Replace `speakSantali()` stub completely:
```kotlin
private fun speakSantali(santaliText: String): String {
    if (santaliText.isBlank()) return ""
    return try {
        ttsEngine.initialize()
        val outFile = File(getApplication<Application>().cacheDir, "santali_tts_output.wav")
        val path = ttsEngine.synthesize(santaliText, outFile)
        ttsEngine.release()   // Free ~80MB RAM
        path
    } catch (e: Exception) {
        ttsEngine.release()
        throw e
    }
}
```

### 4f. Replace `playAudio()` stub completely:
```kotlin
fun playAudio() {
    val path = _uiState.value.audioFilePath ?: return
    if (_uiState.value.isPlaying) return

    viewModelScope.launch(Dispatchers.IO) {
        withContext(Dispatchers.Main) {
            try {
                mediaPlayer?.release()
                mediaPlayer = MediaPlayer().apply {
                    setDataSource(path)
                    prepare()
                    setOnCompletionListener {
                        _uiState.update { it.copy(isPlaying = false) }
                    }
                    start()
                }
                _uiState.update { it.copy(isPlaying = true) }
            } catch (e: Exception) {
                _uiState.update { it.copy(
                    isPlaying = false,
                    errorMessage = "Audio playback failed: ${e.message}"
                )}
            }
        }
    }
}
```

### 4g. Replace `stopAudio()` stub completely:
```kotlin
fun stopAudio() {
    mediaPlayer?.stop()
    mediaPlayer?.release()
    mediaPlayer = null
    _uiState.update { it.copy(isPlaying = false) }
}
```

### 4h. Update `onCleared()` — add ttsEngine and mediaPlayer release:
```kotlin
override fun onCleared() {
    super.onCleared()
    audioRecord?.release()
    asrEngine.release()
    translator.release()
    ttsEngine.release()
    mediaPlayer?.release()
    mediaPlayer = null
}
```

---

## STEP 5 — Update MainScreen.kt Download Prompt

Open: `d:\sih2026\HindiSantaliApp\app\src\main\java\com\example\hindisantali\ui\main\MainScreen.kt`

Find the `ModelDownloadPrompt` composable. Update only the description text to mention 3 models:
```kotlin
text = "Three AI models need to be downloaded once over WiFi:\n\n" +
       "• Hindi ASR model (~196MB)\n" +
       "• Translation model (~200MB)\n" +
       "• Santali TTS voice model (~50MB)\n\n" +
       "Total: ~450MB. After this, the app works 100% offline.",
```

Update the button text:
```kotlin
Text("⬇  Download All Models (~450MB)", color = Color.White, fontWeight = FontWeight.Bold)
```

Do NOT change anything else in MainScreen.kt.

---

## STEP 6 — Build

Run from `d:\sih2026\HindiSantaliApp`:
```powershell
.\gradlew.bat assembleDebug --no-daemon 2>&1
```

Expected: `BUILD SUCCESSFUL`

### Pre-empted Errors and Exact Fixes

**Error:** `Unresolved reference: OfflineTts` or `OfflineTtsConfig`
- **Fix:** These come from `com.k2fsa.sherpa.onnx.*`. Ensure the import is `import com.k2fsa.sherpa.onnx.*` in `SantaliTtsEngine.kt`. The SherpaOnnx AAR is already in libs — no new Gradle change needed.

**Error:** `Unresolved reference: OfflineTtsVitsModelConfig`
- **Fix:** This class exists in the SherpaOnnx 1.11.3 AAR. If it genuinely doesn't exist in this version, use this alternative constructor pattern:
  ```kotlin
  val vitsConfig = OfflineTtsVitsModelConfig(model = modelFile.absolutePath, lexicon = "", tokens = "")
  ```
  — i.e., try removing the optional named parameters (`noiseScale`, `noiseScaleW`, `lengthScale`, `dataDir`, `dictDir`) until compilation succeeds. These have defaults.

**Error:** `OfflineTtsModelConfig` constructor not matching
- **Fix:** SherpaOnnx Kotlin API wraps C++ structs. If the constructor is positional, use:
  ```kotlin
  OfflineTtsModelConfig(vits = vitsConfig, numThreads = 2, debug = false, provider = "cpu")
  ```

**Error:** `writeBytes` not found on `DataOutputStream` (it's actually a method of `DataOutputStream` from `java.io`)
- **Fix:** Replace `out.writeBytes("RIFF")` with `out.write("RIFF".toByteArray(Charsets.US_ASCII))`. Do this for ALL string literals in `writeWav()`.

**Error:** `MediaPlayer requires WAKE_LOCK permission`
- **Fix:** Add to `AndroidManifest.xml` inside `<manifest>`:
  ```xml
  <uses-permission android:name="android.permission.WAKE_LOCK"/>
  ```

**Error:** Duplicate `libonnxruntime.so` or `libc++_shared.so` during packaging
- **Fix:** These are already handled in `build.gradle.kts` via `jniLibs { pickFirsts.add(...) }`. If a new conflict appears, add the `.so` filename to the existing `pickFirsts` list.

---

## STEP 7 — Install and Test on Device

```powershell
# Set path to adb
$env:PATH = $env:PATH + ";C:\Users\sharj\AppData\Local\Android\Sdk\platform-tools"

# Confirm device connected
adb devices

# Install APK
adb install -r d:\sih2026\HindiSantaliApp\app\build\outputs\apk\debug\app-debug.apk
```

**Test sequence:**
1. Open app on phone
2. Download prompt appears → tap download button
3. Wait for all 3 models to download (~450MB, needs WiFi)
4. Main screen appears with mic button
5. Hold mic → speak clearly in Hindi (e.g., "नमस्ते, आप कैसे हैं")
6. Release mic
7. Watch: stage goes TRANSCRIBING → TRANSLATING → SYNTHESIZING → IDLE
8. Hindi text appears in Hindi card
9. Santali Ol Chiki text appears in Santali card
10. Play button becomes active (green)
11. Tap Play → audio plays in Santali voice
12. Record the latency breakdown shown on screen

---

## Files Created / Modified

| Action | File |
|---|---|
| CREATE (PC only) | `d:\sih2026\scripts\export_tts_onnx.py` |
| CREATE | `tts\TtsModelDownloader.kt` |
| CREATE | `tts\SantaliTtsEngine.kt` |
| MODIFY | `ui\main\MainScreenViewModel.kt` (4 stub replacements + imports + properties) |
| MODIFY | `ui\main\MainScreen.kt` (download prompt text only) |

---

# SECTION C — AGENT PROMPT

---

## Your Task
You are a coding agent implementing **Phase 5: Santali TTS** in an Android app that already has working Hindi ASR (Phase 3) and Hindi→Santali translation (Phase 4). Phase 5 integrates text-to-speech so the app speaks the Santali translation out loud.

## STOP — Read This Before Writing Any Code

**The original TTS model (`ai4bharat/indic-parler-tts`) is REJECTED.** Do not use it, port it, quantize it, or reference it. Reason: 3.5GB disk, 3.7GB RAM, 54-second latency. The phone has 2GB total RAM. It is physically impossible.

**The correct TTS is `facebook/mms-tts-sat`** (Meta MMS, Santali language). ~30–60MB ONNX, ~1–2 second latency on Android.

## What Already Exists — Do NOT recreate or modify unless instructed

| File | Status |
|---|---|
| `app/libs/sherpa-onnx-1.11.3-patched.aar` | Already in project. Contains `OfflineTts` TTS API. Do NOT add new TTS libraries. |
| `asr/HindiAsrEngine.kt` | Working. Do not touch. |
| `asr/ModelDownloader.kt` | Working. Do not touch. |
| `translation/HindiSantaliTranslator.kt` | Working. Do not touch. |
| `translation/TranslationModelDownloader.kt` | Working. Do not touch. |
| `ui/main/MainScreen.kt` | Working. Only update the download prompt description text and button text. Nothing else. |
| `ui/main/MainScreenViewModel.kt` | Has 3 stubs to fill. Do not change anything except what is listed in Step 4. |

## Ordered Execution Steps (Do them in this exact order)

### Step 1 — Export TTS model on PC
Run `d:\sih2026\scripts\export_tts_onnx.py` (create this file from the plan).
Upload `model.int8.onnx` to a public HuggingFace repo.
Record the raw download URL.

### Step 2 — Create `tts/TtsModelDownloader.kt`
Update `TTS_BASE_URL` with the actual HuggingFace URL from Step 1.

### Step 3 — Create `tts/SantaliTtsEngine.kt`
Uses SherpaOnnx `OfflineTts` API. Generates WAV file to `context.cacheDir`.
The sample rate for MMS TTS is **16000 Hz**.

### Step 4 — Edit `MainScreenViewModel.kt`
Add imports, add 2 new properties, update 5 existing functions.
See the plan for exact code for each change.

### Step 5 — Edit `MainScreen.kt`
Update ONLY the download prompt description text to mention 3 models (~450MB total).

### Step 6 — Build
```powershell
cd d:\sih2026\HindiSantaliApp
.\gradlew.bat assembleDebug --no-daemon 2>&1
```
Must produce `BUILD SUCCESSFUL`. If not, fix errors using the pre-empted error list in the plan.

### Step 7 — Install and test
```powershell
adb install -r d:\sih2026\HindiSantaliApp\app\build\outputs\apk\debug\app-debug.apk
```
Verify: speak Hindi → see Hindi text → see Santali text → tap Play → hear Santali audio.

## Hard Rules — Violating These Will Break the App
1. **Do NOT add any new Android library** for TTS. SherpaOnnx is already present and covers TTS.
2. **Do NOT load ASR + Translation + TTS simultaneously.** Each one must be `release()`-d before the next `initialize()`-s. The existing pattern in `transcribeHindi()` and `translateHindi()` is the model — copy it exactly for `speakSantali()`.
3. **Do NOT rewrite MainScreen.kt.** Only change the 2 text strings in `ModelDownloadPrompt`.
4. **Do NOT change the existing download/check logic for ASR and Translation.** Add TTS as a 3rd step only.
5. **After `speakSantali()` returns, the TTS engine must be released** before `playAudio()` is called. The WAV file in `cacheDir` persists for playback.
6. **MediaPlayer.prepare() must be called before start().** Call both on the Main thread (use `withContext(Dispatchers.Main)` around the entire MediaPlayer block).

## What to Report When Done
1. ✅ or ❌ `BUILD SUCCESSFUL`
2. TTS model file size (MB) after INT8 quantization
3. Measured latency for each stage from the app's Latency Card: ASR / Translation / TTS / Total
4. A sample run: what Hindi text was spoken → what Santali text appeared → did audio play
5. Any SherpaOnnx API changes you discovered (e.g., constructor signature was different)
