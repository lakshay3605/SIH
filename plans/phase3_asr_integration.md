# Phase 3 Execution Plan — Hindi ASR Integration (SherpaOnnx + IndicConformer)

## Project Overview

**App:** Hindi → Santali Offline Translator  
**Package:** `com.example.hindisantali`  
**Project root:** `d:\sih2026\HindiSantaliApp`  
**Min SDK:** 26 (Android 9)  
**Target device constraint:** 2GB RAM — sequential model loading strategy required  
**Goal of Phase 3:** Replace the `transcribeHindi()` stub in `MainScreenViewModel.kt` with real SherpaOnnx IndicConformer INT8 inference so that recorded Hindi PCM audio is converted to Hindi Devanagari text on-device, fully offline.

---

## Context: What Already Exists

| File | State |
|---|---|
| `app/build.gradle.kts` | Exists — needs SherpaOnnx dependency added |
| `gradle/libs.versions.toml` | Exists — needs sherpa-onnx version entry |
| `ui/main/MainScreenViewModel.kt` | Exists — `transcribeHindi()` is a stub returning `"[ASR not yet integrated]"` |
| `ui/main/MainScreen.kt` | Exists — UI complete, no changes needed |
| `MainActivity.kt` | Exists — no changes needed |
| `AndroidManifest.xml` | Exists — INTERNET + RECORD_AUDIO already declared |

---

## Step-by-Step Execution Plan

### STEP 1 — Add SherpaOnnx to Gradle

**File to edit:** `d:\sih2026\HindiSantaliApp\gradle\libs.versions.toml`

Add this entry in the `[versions]` section:
```toml
sherpa-onnx = "1.11.3"
```

Add this entry in the `[libraries]` section:
```toml
sherpa-onnx-android = { group = "com.github.k2-fsa.sherpa-onnx", name = "sherpa-onnx-android", version.ref = "sherpa-onnx" }
```

Add this entry in the `[plugins]` section (if not already there — skip if it conflicts):
```toml
# No plugin needed for sherpa-onnx — library only
```

**File to edit:** `d:\sih2026\HindiSantaliApp\settings.gradle.kts`

Add JitPack repository to `dependencyResolutionManagement` → `repositories` block (SherpaOnnx is distributed via JitPack):
```kotlin
maven { url = uri("https://jitpack.io") }
```

The full `dependencyResolutionManagement` block should look like this after the edit:
```kotlin
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://jitpack.io") }
    }
}
```

**File to edit:** `d:\sih2026\HindiSantaliApp\app\build.gradle.kts`

Add inside the `dependencies { }` block:
```kotlin
// SherpaOnnx — offline Hindi ASR
implementation(libs.sherpa.onnx.android)
```

Also ensure `aaptOptions` is set to not compress `.onnx` and `.bin` files. Add inside the `android { }` block:
```kotlin
aaptOptions {
    noCompress += listOf("onnx", "bin", "vocab")
}
```

---

### STEP 2 — Create the Model Downloader Utility

**Create new file:** `d:\sih2026\HindiSantaliApp\app\src\main\java\com\example\hindisantali\asr\ModelDownloader.kt`

```kotlin
package com.example.hindisantali.asr

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.net.URL

/**
 * Downloads the SherpaOnnx IndicConformer INT8 model on first launch.
 * After download, the app works fully offline — no internet needed again.
 *
 * Model: ai4bharat/indicconformer-stt-hi (INT8 quantized, ~188MB total)
 * Hosted on: HuggingFace Hub (public, no auth required)
 */
object ModelDownloader {

    private const val TAG = "ModelDownloader"

    // HuggingFace direct download URLs for IndicConformer INT8 SherpaOnnx bundle
    // These are the 4 files that make up the complete ASR model package
    private const val BASE_URL =
        "https://huggingface.co/k2-fsa/sherpa-onnx-online-de-0.9-lstm-zh-0.1/resolve/main/"

    // NOTE TO EXECUTING AGENT:
    // The exact HuggingFace repo and file names must be verified at runtime.
    // Use this search URL to find the correct Hindi IndicConformer INT8 model:
    // https://huggingface.co/models?search=sherpa-onnx+indic+hindi
    // The correct repo as of 2024/2025 is likely:
    // https://huggingface.co/csukuangfj/sherpa-onnx-streaming-zipformer-bilingual-zh-en-2023-02-20
    // OR search: https://huggingface.co/models?search=sherpa-onnx+hindi+conformer
    // The model files to download are:
    //   encoder.int8.onnx
    //   decoder.int8.onnx  (or joiner.int8.onnx depending on model type)
    //   joiner.int8.onnx
    //   tokens.txt
    //
    // IMPORTANT: Verify actual URLs before coding this step.
    // Fallback: use the Dolphin multilingual model (also supports Hindi):
    // https://github.com/k2-fsa/sherpa-onnx/releases/tag/asr-models
    // Look for: sherpa-onnx-streaming-zipformer-multi-zh-hans-2023-12-12

    // Model directory name inside app's filesDir
    const val MODEL_DIR_NAME = "asr_model"

    // Required files — adjust filenames after verifying the actual model
    val REQUIRED_FILES = listOf(
        "encoder.int8.onnx",
        "decoder.int8.onnx",
        "joiner.int8.onnx",
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
        baseUrl: String,         // Pass actual verified URL here
        fileNames: List<String>, // Pass actual verified file names here
        onProgress: (Long, Long, String) -> Unit = { _, _, _ -> }
    ): Result<Unit> = withContext(Dispatchers.IO) {
        val modelDir = getModelDir(context)
        modelDir.mkdirs()

        for (fileName in fileNames) {
            val destFile = File(modelDir, fileName)
            if (destFile.exists()) {
                Log.d(TAG, "Skipping $fileName — already exists")
                continue
            }

            val url = "$baseUrl$fileName"
            Log.d(TAG, "Downloading $fileName from $url")

            try {
                val connection = URL(url).openConnection()
                connection.connect()
                val totalBytes = connection.contentLengthLong
                var downloadedBytes = 0L

                connection.getInputStream().use { input ->
                    destFile.outputStream().use { output ->
                        val buffer = ByteArray(8192)
                        var bytesRead: Int
                        while (input.read(buffer).also { bytesRead = it } != -1) {
                            output.write(buffer, 0, bytesRead)
                            downloadedBytes += bytesRead
                            onProgress(downloadedBytes, totalBytes, fileName)
                        }
                    }
                }
                Log.d(TAG, "Downloaded $fileName (${destFile.length()} bytes)")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to download $fileName: ${e.message}")
                destFile.delete() // Clean up partial download
                return@withContext Result.failure(e)
            }
        }

        Result.success(Unit)
    }
}
```

---

### STEP 3 — Create the ASR Engine Wrapper

**Create new file:** `d:\sih2026\HindiSantaliApp\app\src\main\java\com\example\hindisantali\asr\HindiAsrEngine.kt`

```kotlin
package com.example.hindisantali.asr

import android.content.Context
import android.util.Log
import com.k2fsa.sherpa.onnx.*
import java.io.File

/**
 * Wraps SherpaOnnx's OnlineRecognizer for Hindi speech recognition.
 *
 * Lifecycle:
 *   1. Call initialize() once (loads model into RAM, ~220MB)
 *   2. Call transcribe(pcmData) to get Hindi text
 *   3. Call release() when done to free RAM before loading Translation model
 *
 * This sequential load/unload pattern prevents OOM on 2GB RAM devices.
 */
class HindiAsrEngine(private val context: Context) {

    private val TAG = "HindiAsrEngine"
    private var recognizer: OnlineRecognizer? = null
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

        // NOTE TO EXECUTING AGENT:
        // The exact SherpaOnnx API class and constructor depends on the model architecture.
        // For a STREAMING Zipformer-Transducer model, use OnlineRecognizer with OnlineZipformer2CtcModelConfig.
        // For a NON-STREAMING CTC model (like IndicConformer CTC), use OfflineRecognizer.
        //
        // Check which model type you downloaded:
        //   - If model has encoder.onnx + decoder.onnx + joiner.onnx → Transducer → OnlineRecognizer
        //   - If model has model.onnx only → CTC → OfflineRecognizer
        //
        // TRANSDUCER example (OnlineRecognizer):
        val config = OnlineRecognizerConfig(
            featConfig = FeatureConfig(sampleRate = 16000, featureDim = 80),
            modelConfig = OnlineModelConfig(
                transducer = OnlineTransducerModelConfig(
                    encoder = File(modelDir, "encoder.int8.onnx").absolutePath,
                    decoder = File(modelDir, "decoder.int8.onnx").absolutePath,
                    joiner  = File(modelDir, "joiner.int8.onnx").absolutePath,
                ),
                tokens  = File(modelDir, "tokens.txt").absolutePath,
                numThreads = 2,
                debug   = false,
            ),
            endpointConfig = EndpointConfig(),
            enableEndpoint = true,
        )
        recognizer = OnlineRecognizer(config = config)
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

        // Drain all audio by passing a tail padding of silence
        val tailPadding = FloatArray(3200) { 0f } // 0.2s of silence to flush
        stream.acceptWaveform(tailPadding, sampleRate = 16000)

        while (rec.isReady(stream)) {
            rec.decode(stream)
        }

        val result = rec.getResult(stream).text.trim()
        stream.release()

        Log.d(TAG, "ASR result: '$result'")
        return result
    }

    /**
     * Release all native resources. Call this after transcription is complete
     * to free ~220MB of RAM before the Translation model is loaded.
     */
    fun release() {
        recognizer?.release()
        recognizer = null
        isInitialized = false
        Log.d(TAG, "ASR engine released")
    }
}
```

---

### STEP 4 — Update `MainScreenViewModel.kt` to Use the ASR Engine

**File to edit:** `d:\sih2026\HindiSantaliApp\app\src\main\java\com\example\hindisantali\ui\main\MainScreenViewModel.kt`

**4a.** Add import at the top of the file:
```kotlin
import com.example.hindisantali.asr.HindiAsrEngine
import com.example.hindisantali.asr.ModelDownloader
```

**4b.** Add a property for the ASR engine in the ViewModel class body (after the existing `recordedPcm` declaration):
```kotlin
private val asrEngine = HindiAsrEngine(application)
```

**4c.** Update the `checkModelsReady()` function:
```kotlin
fun checkModelsReady() {
    viewModelScope.launch(Dispatchers.IO) {
        val ready = ModelDownloader.isModelDownloaded(getApplication())
        withContext(Dispatchers.Main) {
            _uiState.update { it.copy(modelsReady = ready) }
            if (!ready) {
                _uiState.update { it.copy(
                    errorMessage = "ASR model not yet downloaded. Connect to WiFi and restart the app."
                )}
            }
        }
    }
}
```

**4d.** Replace the `transcribeHindi()` stub completely:
```kotlin
private fun transcribeHindi(pcmData: ShortArray): String {
    return try {
        asrEngine.initialize()          // Load model (~220MB, ~1-2s first time)
        val result = asrEngine.transcribe(pcmData)
        asrEngine.release()             // Free RAM before translation model loads
        result
    } catch (e: Exception) {
        asrEngine.release()
        throw e
    }
}
```

**4e.** Override `onCleared()` to also release the ASR engine:
```kotlin
override fun onCleared() {
    super.onCleared()
    audioRecord?.release()
    asrEngine.release()
}
```

---

### STEP 5 — Add First-Launch Model Download Screen

**File to edit:** `d:\sih2026\HindiSantaliApp\app\src\main\java\com\example\hindisantali\ui\main\MainScreen.kt`

Add a conditional block at the very top of the `MainScreen()` composable, before the main Column, to show a download screen when `modelsReady == false`:

```kotlin
// Show download prompt if models are not present
if (!uiState.modelsReady) {
    ModelDownloadPrompt(
        onDownload = { viewModel.downloadModels() }
    )
    return
}
```

Create a new composable in the same file:
```kotlin
@Composable
private fun ModelDownloadPrompt(onDownload: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDeep)
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text("🌐 First Launch Setup", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
        Spacer(Modifier.height(12.dp))
        Text(
            text = "The Hindi speech recognition model (~188MB) needs to be downloaded once.\n\nAfter this, the app works 100% offline.",
            color = TextSecondary,
            textAlign = TextAlign.Center,
            lineHeight = 22.sp,
        )
        Spacer(Modifier.height(24.dp))
        Button(
            onClick = onDownload,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = AccentBlue),
        ) {
            Text("⬇  Download ASR Model (188MB)", color = Color.White, fontWeight = FontWeight.Bold)
        }
    }
}
```

Add `downloadModels()` function to `MainScreenViewModel`:
```kotlin
fun downloadModels() {
    viewModelScope.launch(Dispatchers.IO) {
        // IMPORTANT: Replace BASE_URL and fileNames with the verified actual values
        // found during Step 2 research above.
        val result = ModelDownloader.downloadIfNeeded(
            context    = getApplication(),
            baseUrl    = "REPLACE_WITH_ACTUAL_HUGGINGFACE_URL",
            fileNames  = ModelDownloader.REQUIRED_FILES,
            onProgress = { downloaded, total, file ->
                // Optionally update UI with download progress
            }
        )
        withContext(Dispatchers.Main) {
            if (result.isSuccess) {
                _uiState.update { it.copy(modelsReady = true, errorMessage = null) }
            } else {
                _uiState.update { it.copy(errorMessage = "Download failed: ${result.exceptionOrNull()?.message}") }
            }
        }
    }
}
```

---

### STEP 6 — Verify the Correct Model URL Before Coding

> [!IMPORTANT]
> Before writing the actual download URL in `ModelDownloader.kt`, the executing agent MUST:
> 1. Visit: https://huggingface.co/models?search=sherpa-onnx+hindi
> 2. Find the IndicConformer INT8 model for Hindi (likely named something like `sherpa-onnx-streaming-indic-conformer-hindi-*`)
> 3. Confirm the exact file names in the repo (`encoder.int8.onnx`, `tokens.txt`, etc.)
> 4. Use the HuggingFace raw download URL format:
>    `https://huggingface.co/{repo_id}/resolve/main/{filename}`
> 5. Update `ModelDownloader.kt` with the correct `baseUrl` and file list
>
> Fallback if IndicConformer Hindi model is not found:
> Use the Dolphin multilingual model (supports Hindi) from:
> https://github.com/k2-fsa/sherpa-onnx/releases/tag/asr-models
> Look for: `sherpa-onnx-streaming-zipformer-multi-zh-hans-2023-12-12` or similar Hindi-capable model.

---

### STEP 7 — Build and Verify

Run the following command from `d:\sih2026\HindiSantaliApp`:
```powershell
.\gradlew.bat assembleDebug --no-daemon 2>&1
```

Expected result: `BUILD SUCCESSFUL`

If build fails with unresolved SherpaOnnx classes, verify:
- JitPack is in `settings.gradle.kts` repositories
- The `sherpa-onnx-android` version in `libs.versions.toml` is correct
- Try version `1.10.30` or `1.10.26` if `1.11.3` is not available on JitPack

---

### STEP 8 — Manual Testing on Phone

1. Enable **Developer Mode** on the Android phone:
   - Settings → About Phone → Tap Build Number 7 times
2. Enable **USB Debugging**:
   - Settings → Developer Options → USB Debugging ON
3. Connect phone via USB cable
4. Run:
   ```powershell
   $env:PATH = $env:PATH + ";C:\Users\sharj\AppData\Local\Android\Sdk\platform-tools"
   adb devices
   ```
   Confirm your device is listed.
5. Install the APK:
   ```powershell
   adb install -r d:\sih2026\HindiSantaliApp\app\build\outputs\apk\debug\app-debug.apk
   ```
6. Open the app on the phone
7. On first launch: tap "Download ASR Model" (needs WiFi, ~188MB)
8. After download: hold the mic button, speak Hindi clearly, release
9. Verify Hindi text appears in the output card

---

## Files Created / Modified Summary

| Action | File | Change |
|---|---|---|
| MODIFY | `gradle/libs.versions.toml` | Add sherpa-onnx version + library entry |
| MODIFY | `settings.gradle.kts` | Add JitPack repository |
| MODIFY | `app/build.gradle.kts` | Add sherpa-onnx dependency + aaptOptions |
| CREATE | `asr/ModelDownloader.kt` | First-launch model download utility |
| CREATE | `asr/HindiAsrEngine.kt` | SherpaOnnx ASR wrapper |
| MODIFY | `ui/main/MainScreenViewModel.kt` | Replace transcribeHindi() stub + add downloadModels() |
| MODIFY | `ui/main/MainScreen.kt` | Add first-launch download prompt screen |

---

## Key Constraints to Respect

- **Sequential loading only:** ASR engine must be `.release()`-d before translation model is loaded in Phase 4. Do NOT hold all models in RAM simultaneously.
- **Target API 26+:** Do not use any API below 26.
- **No cloud APIs:** All inference is local. The only internet use is the one-time model download.
- **Model stored in:** `context.filesDir/asr_model/` — not SD card, not assets — so it survives app updates.
- **SherpaOnnx version:** Use the latest stable from JitPack. As of 2025 this is around `1.10.x` – `1.11.x`. Check https://github.com/k2-fsa/sherpa-onnx/releases for the latest.
