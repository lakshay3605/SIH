# Phase 3 Cross-Check + Phase 4 Plan + Agent Prompt
## Hindi → Santali Offline Android Translator

---

# PART 1 — PHASE 3 CROSS-CHECK

> Read this section before executing Phase 4. It documents what was written in Phase 3, what is correct, and what has known issues.

## Verified File Status

### ✅ `app/build.gradle.kts`
- SherpaOnnx AAR is correctly linked as a local file: `implementation(files("libs/sherpa-onnx-1.11.3.aar"))`
- `aaptOptions { noCompress += listOf("onnx", "bin", "vocab") }` is in place
- BUILD SUCCESSFUL confirmed

### ✅ `asr/HindiAsrEngine.kt`
- Correctly uses `OfflineRecognizer` + `OfflineNemoEncDecCtcModelConfig` (NeMo CTC architecture)
- Model file: `model.int8.onnx`, Tokens: `tokens.txt`
- `release()` is called after transcription to free RAM ✅
- `initialize()` guard prevents double-loading ✅

### ✅ `asr/ModelDownloader.kt`
- `BASE_URL = "https://huggingface.co/meetsync/indic-conformer-onnx-sherpa/resolve/main/"`
- `REQUIRED_FILES = ["model.int8.onnx", "tokens.txt"]` — matches engine exactly ✅
- Partial download cleanup on failure ✅
- **⚠️ KNOWN ISSUE:** No connection timeout set — could hang on slow networks. Add `connection.connectTimeout = 30_000` and `connection.readTimeout = 60_000` before `connection.connect()`.

### ✅ `ui/main/MainScreenViewModel.kt`
- `transcribeHindi()` stub fully replaced: `initialize() → transcribe() → release()` ✅
- `downloadModels()` uses correct `BASE_URL` and `REQUIRED_FILES` ✅
- `onCleared()` releases engine ✅

### ⚠️ `ui/main/MainScreen.kt` — Known UX Issues (do NOT fix now, move forward)
1. `ModelDownloadPrompt` shows no progress bar during download — user taps button and sees nothing for several minutes
2. `uiState.errorMessage` is not displayed inside `ModelDownloadPrompt` — if download fails, user sees a blank screen with no error feedback
3. These are UX bugs only. Core logic is correct. Fix as time permits, not a Phase 4 blocker.

## Key Discovery from `outputs/translation_results.json`
The existing Lakshay translation code uses `ai4bharat/indictrans2-indic-indic-1B` (1 Billion parameters).

**Benchmark results on CPU (what our phone will do):**
- Init time: 4 seconds
- Avg per sentence: **30.16 seconds** — completely unusable on phone
- Repetition hallucinations observed in 2/5 outputs (sentences with medical and agriculture terms)

**Conclusion for Phase 4:** The 1B model is rejected. We will use the **200M distilled version** (`ai4bharat/indictrans2-indic-indic-dist-200M`) exported to ONNX with INT8 quantization, targeting <5 second translation latency.

---

# PART 2 — PHASE 4 PLAN: TRANSLATION ENGINE

## Goal
Replace the `translateHindi(hindiText: String): String` stub in `MainScreenViewModel.kt` with real on-device Hindi → Santali (Ol Chiki) translation using ONNX Runtime + IndicTrans2 Distilled 200M.

## Project Context
- **Project root:** `d:\sih2026\HindiSantaliApp`
- **Package:** `com.example.hindisantali`
- **Target device:** 2GB RAM, Android 9 (API 26)
- **Stub to fill:** `private fun translateHindi(hindiText: String): String` in `MainScreenViewModel.kt`
- **Sequential model loading:** ASR engine MUST be released before translation engine loads. This is already done in the ViewModel — do not change this pattern.

## Model Choice
| Model | Size | Expected Latency | Decision |
|---|---|---|---|
| indictrans2-indic-indic-1B (PyTorch) | ~4GB | 30s avg | ❌ Rejected |
| indictrans2-indic-indic-dist-200M (PyTorch) | ~800MB | ~8s estimated | ❌ Too large as-is |
| indictrans2-indic-indic-dist-200M (ONNX INT8) | ~200MB | ~3-5s estimated | ✅ Selected |

## Architecture Overview
IndicTrans2 is an encoder-decoder transformer. For ONNX on Android:
1. Encoder runs once on the input tokens → produces hidden states
2. Decoder runs in a loop, generating one token at a time (greedy decoding)
3. Tokenization uses SentencePiece
4. IndicProcessor handles text normalization + language tags

---

## Step-by-Step Execution Plan

### STEP 1 — Export Model to ONNX (Run on Windows PC, NOT on phone)

**This step runs on the developer machine. Requires Python 3.10+ and ~8GB free disk space.**

Create file: `d:\sih2026\scripts\export_translation_onnx.py`

```python
"""
Export IndicTrans2 Distilled 200M to ONNX INT8 for Android deployment.
Run this ONCE on the developer PC. Output goes to d:\sih2026\translation_model\

Requirements: pip install optimum[onnxruntime] transformers torch sentencepiece
"""

import os
import subprocess
import sys

OUTPUT_DIR = r"d:\sih2026\translation_model"
MODEL_ID = "ai4bharat/indictrans2-indic-indic-dist-200M"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Step 1: Install requirements
subprocess.run([sys.executable, "-m", "pip", "install",
    "optimum[onnxruntime]", "transformers", "torch",
    "sentencepiece", "sacremoses", "mosestokenizer",
    "indic-nlp-library", "IndicTransToolkit"], check=True)

# Step 2: Export to ONNX via optimum-cli
# This exports encoder_model.onnx, decoder_model.onnx, decoder_with_past_model.onnx
subprocess.run([
    "optimum-cli", "export", "onnx",
    "--model", MODEL_ID,
    "--task", "text2text-generation-with-past",
    "--trust-remote-code",
    "--framework", "pt",
    OUTPUT_DIR
], check=True)

# Step 3: Quantize to INT8 to reduce size from ~800MB to ~200MB
from onnxruntime.quantization import quantize_dynamic, QuantType
import os

for onnx_file in ["encoder_model.onnx", "decoder_model.onnx", "decoder_with_past_model.onnx"]:
    src = os.path.join(OUTPUT_DIR, onnx_file)
    dst = os.path.join(OUTPUT_DIR, onnx_file.replace(".onnx", ".int8.onnx"))
    if os.path.exists(src):
        print(f"Quantizing {onnx_file}...")
        quantize_dynamic(src, dst, weight_type=QuantType.QInt8)
        os.remove(src)  # Remove the float32 version to save space
        print(f"Done: {dst}")

print("\nAll done! Files are in:", OUTPUT_DIR)
print("Upload these to HuggingFace or serve from your own server, then update TRANSLATION_BASE_URL in TranslationModelDownloader.kt")
```

**How to run:**
```powershell
python d:\sih2026\scripts\export_translation_onnx.py
```

Expected output files in `d:\sih2026\translation_model\`:
- `encoder_model.int8.onnx`
- `decoder_model.int8.onnx`
- `decoder_with_past_model.int8.onnx`
- `tokenizer.json`
- `special_tokens_map.json`
- `tokenizer_config.json`
- `spm.model` (sentencepiece vocab)

**After exporting:** Upload the `*.int8.onnx` and `spm.model` files to a public HuggingFace repo. Note the base URL. Update `TRANSLATION_BASE_URL` in Step 2 below.

**⚠️ If ONNX export fails (model may have custom ops):** Fall back to using `torch.onnx.export()` with `opset_version=17` directly. Ask for help from the main agent if stuck.

---

### STEP 2 — Add ONNX Runtime Android Dependency

**File to edit:** `d:\sih2026\HindiSantaliApp\gradle\libs.versions.toml`

Add to `[versions]`:
```toml
onnxruntime = "1.20.0"
```

Add to `[libraries]`:
```toml
onnxruntime-android = { group = "com.microsoft.onnxruntime", name = "onnxruntime-android", version.ref = "onnxruntime" }
```

**File to edit:** `d:\sih2026\HindiSantaliApp\app\build.gradle.kts`

Add to `dependencies { }` block:
```kotlin
// ONNX Runtime — for translation and TTS inference
implementation(libs.onnxruntime.android)
```

Also add `"json"` to the aaptOptions noCompress list (tokenizer files):
```kotlin
aaptOptions {
    noCompress += listOf("onnx", "bin", "vocab", "json", "model")
}
```

Run `.\gradlew.bat assembleDebug --no-daemon` and confirm no errors before continuing.

---

### STEP 3 — Create TranslationModelDownloader.kt

**Create new file:** `d:\sih2026\HindiSantaliApp\app\src\main\java\com\example\hindisantali\translation\TranslationModelDownloader.kt`

```kotlin
package com.example.hindisantali.translation

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
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

    // ⚠️ UPDATE THIS URL after uploading model files to HuggingFace
    const val TRANSLATION_BASE_URL =
        "https://huggingface.co/YOUR_USERNAME/indictrans2-dist-200m-onnx/resolve/main/"

    val REQUIRED_FILES = listOf(
        "encoder_model.int8.onnx",
        "decoder_model.int8.onnx",
        "decoder_with_past_model.int8.onnx",
        "spm.model"
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
                    dest.outputStream().use { output ->
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
                Log.d(TAG, "Downloaded $fileName (${dest.length()} bytes)")
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

### STEP 4 — Create HindiSantaliTranslator.kt

This is the core translation engine. It runs encoder → greedy decoder loop using ONNX Runtime.

**Create new file:** `d:\sih2026\HindiSantaliApp\app\src\main\java\com\example\hindisantali\translation\HindiSantaliTranslator.kt`

```kotlin
package com.example.hindisantali.translation

import android.content.Context
import android.util.Log
import ai.onnxruntime.*
import com.example.hindisantali.translation.IndicSpmTokenizer
import java.io.File
import java.nio.LongBuffer

/**
 * Hindi → Santali (Ol Chiki) translation using IndicTrans2 Distilled 200M ONNX.
 *
 * Pipeline:
 *   1. Tokenize Hindi text with SentencePiece (+ language tags)
 *   2. Run ONNX encoder session
 *   3. Run ONNX decoder greedily until EOS or max_length
 *   4. Detokenize to Santali Ol Chiki string
 *
 * Lifecycle: initialize() → translate() → release()
 * Release after use to free ~200MB RAM before TTS loads.
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
            File(modelDir, "encoder_model.int8.onnx").absolutePath, opts)
        decoderSession = env.createSession(
            File(modelDir, "decoder_model.int8.onnx").absolutePath, opts)
        decoderWithPastSession = env.createSession(
            File(modelDir, "decoder_with_past_model.int8.onnx").absolutePath, opts)

        tokenizer = IndicSpmTokenizer(File(modelDir, "spm.model"))

        isInitialized = true
        Log.d(TAG, "Translation engine initialized")
    }

    fun translate(hindiText: String, maxLength: Int = 128): String {
        check(isInitialized) { "Call initialize() first" }
        val env = ortEnv ?: return ""
        val enc = encoderSession ?: return ""
        val dec = decoderSession ?: return ""
        val tk = tokenizer ?: return ""

        // 1. Tokenize: prepend src lang tag, append eos
        // IndicTrans2 format: "<2sat_Olck> token1 token2 ... </s>"
        val inputIds = tk.encode(hindiText, srcLang = "hin_Deva", tgtLang = "sat_Olck")
        val attentionMask = LongArray(inputIds.size) { 1L }
        val batchSize = 1L
        val seqLen = inputIds.size.toLong()

        // 2. Run Encoder
        val encoderInputs = mapOf(
            "input_ids"      to OnnxTensor.createTensor(env, LongBuffer.wrap(inputIds),      longArrayOf(batchSize, seqLen)),
            "attention_mask" to OnnxTensor.createTensor(env, LongBuffer.wrap(attentionMask), longArrayOf(batchSize, seqLen))
        )

        val encoderOutput = enc.run(encoderInputs)
        val hiddenStates = encoderOutput[0] as OnnxTensor   // [1, seqLen, hidden]

        // 3. Greedy Decode
        val eosId = tk.eosId.toLong()
        val bosId = tk.bosId.toLong()
        val generatedIds = mutableListOf(bosId)

        var pastKeyValues: Map<String, OnnxTensor>? = null
        var usePast = false

        for (step in 0 until maxLength) {
            val lastToken = longArrayOf(generatedIds.last())
            val decoderInputIds = OnnxTensor.createTensor(
                env, LongBuffer.wrap(lastToken), longArrayOf(1L, 1L))

            val decoderAttMask = LongArray(generatedIds.size) { 1L }
            val decAttn = OnnxTensor.createTensor(
                env, LongBuffer.wrap(decoderAttMask), longArrayOf(1L, generatedIds.size.toLong()))

            val decInputs = mutableMapOf(
                "input_ids"               to decoderInputIds,
                "encoder_hidden_states"   to hiddenStates,
                "encoder_attention_mask"  to (encoderInputs["attention_mask"] as OnnxTensor),
                "attention_mask"          to decAttn
            )

            if (usePast && pastKeyValues != null) {
                decInputs.putAll(pastKeyValues!!)
            }

            val activeSession = if (usePast && pastKeyValues != null) decoderWithPastSession!! else dec
            val decOutput = activeSession.run(decInputs)

            // First output is logits [1, 1, vocab_size]
            val logits = (decOutput[0] as OnnxTensor).floatBuffer
            val vocabSize = (decOutput[0] as OnnxTensor).info.shape[2].toInt()

            // Greedy: argmax over vocab
            var maxIdx = 0
            var maxVal = Float.NEGATIVE_INFINITY
            for (i in 0 until vocabSize) {
                val v = logits.get()
                if (v > maxVal) { maxVal = v; maxIdx = i }
            }
            logits.rewind()

            generatedIds.add(maxIdx.toLong())

            // Cache past key values for next step
            // NOTE: update this logic based on the actual output names from your ONNX model
            // Run with --info and print decOutput keys if needed
            usePast = true

            if (maxIdx.toLong() == eosId) break
        }

        encoderOutput.close()

        // 4. Detokenize
        val outputIds = generatedIds.drop(1).map { it.toInt() }  // drop BOS
        return tk.decode(outputIds)
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
```

---

### STEP 5 — Create SentencePiece Tokenizer Wrapper

IndicTrans2 uses a SentencePiece model for tokenization. We need a Kotlin wrapper.

**Option A (Preferred):** Use the `com.google.cloud.spring:sentencepiece` or similar Java SPM library.

**Option B (Fallback — implement here):** Use SherpaOnnx's built-in SentencePiece support, or ship the SPM model and call it via JNI.

**Create new file:** `d:\sih2026\HindiSantaliApp\app\src\main\java\com\example\hindisantali\translation\IndicSpmTokenizer.kt`

```kotlin
package com.example.hindisantali.translation

import android.util.Log
import java.io.File

/**
 * SentencePiece tokenizer wrapper for IndicTrans2.
 *
 * IndicTrans2 tokenization format:
 *   Input:  "<2sat_Olck> word1 word2 ... </s>"
 *   Where the first token is the TARGET language code
 *   and </s> (EOS) is appended at the end.
 *
 * IMPLEMENTATION NOTE:
 * SentencePiece requires native code. Use one of these approaches:
 *
 * Approach 1 (Recommended): Add sentencepiece-java dependency
 *   implementation("com.github.sonoisa:sentencepiece-java:0.1.3")
 *   Add JitPack to settings.gradle.kts if not already there.
 *   Then implement using com.github.sonoisa.sentencepiece.SentencePieceProcessor
 *
 * Approach 2: Use SherpaOnnx's SentencePiece Java binding
 *   SherpaOnnx bundles SPM for its BPE tokenizer support
 *
 * Approach 3: Bundle spm as assets and call via shell (slow, not recommended)
 *
 * The stub below shows the interface. Fill in using Approach 1.
 */
class IndicSpmTokenizer(private val spmModel: File) {

    // Token IDs (check actual values from your SPM model)
    // Common IndicTrans2 special token IDs:
    val bosId = 2   // <s>
    val eosId = 3   // </s>
    val padId = 1   // <pad>
    val unkId = 0   // <unk>

    // Language tag token IDs - verify from tokenizer_config.json
    private val langCodeMap = mapOf(
        "hin_Deva" to "<2hin_Deva>",
        "sat_Olck" to "<2sat_Olck>"
    )

    // TODO: Initialize actual SentencePiece processor
    // Using sentencepiece-java (Approach 1):
    // private val processor = SentencePieceProcessor()
    // init { processor.load(spmModel.absolutePath) }

    /**
     * Encodes Hindi text to token IDs with language tags.
     * Format: [tgt_lang_id, tok1, tok2, ..., eos_id]
     */
    fun encode(text: String, srcLang: String, tgtLang: String): LongArray {
        // TODO: Implement using real SentencePiece
        // val tgtLangToken = langCodeMap[tgtLang] ?: "<2sat_Olck>"
        // val tokens = processor.encodeAsPieces("$tgtLangToken $text")
        // return LongArray: [tgtLangId, ...pieceIds..., eosId]
        
        // STUB: return dummy encoding for compilation
        // Replace this with real implementation
        Log.w("IndicSpmTokenizer", "Using stub tokenizer — replace with real SPM implementation")
        return longArrayOf(bosId.toLong(), eosId.toLong())
    }

    /**
     * Decodes token IDs back to Santali Ol Chiki text.
     * Skip special tokens (BOS, EOS, PAD).
     */
    fun decode(ids: List<Int>): String {
        // TODO: Implement using real SentencePiece
        // val pieces = ids.filter { it !in listOf(bosId, eosId, padId) }
        //               .map { processor.idToPiece(it) }
        // return processor.decodePieces(pieces)
        
        // STUB:
        Log.w("IndicSpmTokenizer", "Using stub decoder — replace with real SPM implementation")
        return "[Translation stub — SPM not integrated]"
    }
}
```

> [!IMPORTANT]
> **Tokenizer is the hardest part of Phase 4.** The executing agent MUST pick one of these three approaches and implement it fully. The code will compile with the stub but translation will produce garbage output. Choose Approach 1 (sentencepiece-java) and add to Gradle.
>
> Add to `libs.versions.toml`:
> ```toml
> sentencepiece-java = { module = "com.github.sonoisa:sentencepiece-java", version = "0.1.3" }
> ```
> JitPack must be in `settings.gradle.kts` (check if it is already — it was added for SherpaOnnx).

---

### STEP 6 — Update MainScreenViewModel.kt

**File:** `d:\sih2026\HindiSantaliApp\app\src\main\java\com\example\hindisantali\ui\main\MainScreenViewModel.kt`

**6a. Add imports** (at the top of the file):
```kotlin
import com.example.hindisantali.translation.HindiSantaliTranslator
import com.example.hindisantali.translation.TranslationModelDownloader
```

**6b. Add translator property** (in class body, after `asrEngine`):
```kotlin
private val translator = HindiSantaliTranslator(application)
```

**6c. Update `checkModelsReady()`** — must check BOTH ASR and Translation models:
```kotlin
fun checkModelsReady() {
    viewModelScope.launch(Dispatchers.IO) {
        val asrReady    = ModelDownloader.isModelDownloaded(getApplication())
        val transReady  = TranslationModelDownloader.isModelDownloaded(getApplication())
        val bothReady   = asrReady && transReady
        withContext(Dispatchers.Main) {
            _uiState.update { it.copy(modelsReady = bothReady) }
            if (!bothReady) {
                val msg = when {
                    !asrReady && !transReady -> "ASR and Translation models not downloaded."
                    !asrReady  -> "ASR model not downloaded."
                    else       -> "Translation model not downloaded."
                }
                _uiState.update { it.copy(errorMessage = msg) }
            }
        }
    }
}
```

**6d. Update `downloadModels()`** — download both models sequentially:
```kotlin
fun downloadModels() {
    viewModelScope.launch(Dispatchers.IO) {
        // Download ASR model first
        val asrResult = ModelDownloader.downloadIfNeeded(
            context   = getApplication(),
            baseUrl   = ModelDownloader.BASE_URL,
            fileNames = ModelDownloader.REQUIRED_FILES,
        )
        if (asrResult.isFailure) {
            withContext(Dispatchers.Main) {
                _uiState.update { it.copy(errorMessage = "ASR download failed: ${asrResult.exceptionOrNull()?.message}") }
            }
            return@launch
        }

        // Download Translation model second
        val transResult = TranslationModelDownloader.downloadIfNeeded(
            context = getApplication(),
        )
        withContext(Dispatchers.Main) {
            if (transResult.isSuccess) {
                _uiState.update { it.copy(modelsReady = true, errorMessage = null) }
            } else {
                _uiState.update { it.copy(errorMessage = "Translation download failed: ${transResult.exceptionOrNull()?.message}") }
            }
        }
    }
}
```

**6e. Replace `translateHindi()` stub:**
```kotlin
private fun translateHindi(hindiText: String): String {
    return try {
        translator.initialize()          // Load ~200MB translation model
        val result = translator.translate(hindiText)
        translator.release()             // Free RAM before TTS loads
        result
    } catch (e: Exception) {
        translator.release()
        throw e
    }
}
```

**6f. Update `onCleared()`** — release both engines:
```kotlin
override fun onCleared() {
    super.onCleared()
    audioRecord?.release()
    asrEngine.release()
    translator.release()
}
```

---

### STEP 7 — Update ModelDownloadPrompt in MainScreen.kt

Update the download prompt text to mention both models:
```kotlin
// In ModelDownloadPrompt composable, update Text:
text = "Two AI models need to be downloaded once over WiFi:\n\n" +
       "• Hindi ASR model (~196MB)\n" +
       "• Translation model (~200MB)\n\n" +
       "Total: ~400MB. After this, the app works 100% offline.",
```

Update the button text:
```kotlin
Text("⬇  Download Both Models (~400MB)", color = Color.White, fontWeight = FontWeight.Bold)
```

---

### STEP 8 — Build and Verify

```powershell
cd d:\sih2026\HindiSantaliApp
.\gradlew.bat assembleDebug --no-daemon 2>&1
```

Expected: `BUILD SUCCESSFUL`

Common errors and fixes:
- `Unresolved reference: OrtEnvironment` → ONNX Runtime not in build.gradle.kts — check Step 2
- `Unresolved reference: SentencePieceProcessor` → sentencepiece-java not added to Gradle
- `Cannot access class 'ai.onnxruntime'` → check group name: `com.microsoft.onnxruntime` not `ai.onnxruntime`

---

### STEP 9 — Test on Device

1. Install APK: `adb install -r d:\sih2026\HindiSantaliApp\app\build\outputs\apk\debug\app-debug.apk`
2. Open app → tap Download (downloads both models, ~400MB total)
3. Hold mic → speak Hindi → release
4. Verify Hindi text appears (ASR)
5. Verify Santali Ol Chiki text appears (Translation)
6. Record latency breakdown shown in the app's Latency Card

---

## Files Created / Modified Summary

| Action | File |
|---|---|
| CREATE | `scripts/export_translation_onnx.py` (PC script, not Android) |
| MODIFY | `gradle/libs.versions.toml` — add onnxruntime + sentencepiece-java |
| MODIFY | `app/build.gradle.kts` — add onnxruntime-android dependency |
| CREATE | `translation/TranslationModelDownloader.kt` |
| CREATE | `translation/HindiSantaliTranslator.kt` |
| CREATE | `translation/IndicSpmTokenizer.kt` |
| MODIFY | `ui/main/MainScreenViewModel.kt` — replace stub, update download/check logic |
| MODIFY | `ui/main/MainScreen.kt` — update download prompt text |

---

# PART 3 — AGENT PROMPT

---

## Your Task
You are a coding agent. Execute **Phase 4** of the Hindi → Santali offline Android translator: integrate real on-device Hindi → Santali translation using ONNX Runtime + IndicTrans2 Distilled 200M INT8 ONNX.

## Critical Background (Read Before Coding)

**From Phase 3 benchmark data:**
- The 1B model takes **30 seconds per sentence on CPU** — completely rejected
- You will use the **200M distilled model** exported to ONNX INT8 (~200MB)
- Target latency for translation: **<5 seconds** on Android

**From Phase 3 cross-check:**
- `HindiAsrEngine.kt` is correct and working
- `ModelDownloader.kt` is correct
- `MainScreenViewModel.kt` already has the correct sequential pattern (ASR releases before Translation loads)
- `BUILD SUCCESSFUL` was confirmed before this phase started

## Project Location
- **Android project root:** `d:\sih2026\HindiSantaliApp`
- **App package:** `com.example.hindisantali`
- **Min SDK:** 26 (Android 9), **Target:** 2GB RAM device
- **Build command:** `.\gradlew.bat assembleDebug --no-daemon` from project root

## What Already Exists (Do NOT recreate or break)
- `asr/HindiAsrEngine.kt` — working ASR engine
- `asr/ModelDownloader.kt` — working downloader
- `ui/main/MainScreen.kt` — complete UI (only modify the download prompt text)
- `ui/main/MainScreenViewModel.kt` — has `translateHindi()` stub to fill
- All Gradle configs — only add new dependencies, do NOT remove existing ones
- `app/libs/sherpa-onnx-1.11.3.aar` — DO NOT DELETE

## What You Must Do (in order)
1. **Run the Python ONNX export script** — export IndicTrans2 dist-200M to ONNX INT8 on the PC
2. **Upload the model files** to a public HuggingFace repo and record the base URL
3. **Add ONNX Runtime Android** to Gradle dependencies
4. **Add sentencepiece-java** to Gradle dependencies (via JitPack)
5. **Create `translation/TranslationModelDownloader.kt`**
6. **Create `translation/IndicSpmTokenizer.kt`** — implement REAL SPM tokenization (not the stub)
7. **Create `translation/HindiSantaliTranslator.kt`** — ONNX encoder-decoder inference
8. **Update `MainScreenViewModel.kt`** — fill the stub, update download/check functions
9. **Update `MainScreen.kt`** — update the download prompt for two models
10. **Run Gradle build** — must be BUILD SUCCESSFUL
11. **Test on device** — confirm Santali Ol Chiki text appears after speaking Hindi

## Hard Constraints
- **Never load ASR + Translation simultaneously.** Always call `asrEngine.release()` before `translator.initialize()`. This pattern already exists in the ViewModel — do not break it.
- **No cloud APIs.** Only internet use is the one-time model download.
- **Models stored in** `context.filesDir` — not assets, not SD card.
- **Target: <5s translation latency.** Use greedy decoding (not beam search) to keep it fast.
- **Do NOT modify** colours, animations, or layout in MainScreen.kt — only touch the download prompt text and nothing else.
- **The SPM tokenizer MUST be real**, not the stub. The app will compile with the stub but produce garbage output.

## Report Back When Done
1. ✅ or ❌ Build status
2. ONNX model size (encoder + decoder total MB)
3. Measured translation latency on device (milliseconds)
4. Sample: Hindi input → Santali Ol Chiki output screenshot or text
5. Any issues with tokenizer and how they were resolved
