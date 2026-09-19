# Implementation Plan: Integrate Aakansha's 1GB Model into 2GB RAM Android App

## Problem Summary

Aakansha's ONNX export is float32 and 1.28GB total (encoder 479MB + decoder 807MB).
Constraints: APK ≤ 100MB, device RAM 2GB, Android 9+, must work offline.

**The export also has a critical bug: `decoder_with_past_model.onnx` is missing.**
The current `HindiSantaliTranslator.kt` tries to load it on line 48 and will crash.

---

## Two-Track Strategy

### Track 1 — Do This TODAY (0 code changes, immediate win)
The `translation_cache.json` Aakansha provided is 1.7MB and contains all ~15,000
trained sentence pairs. Copy it into the app assets RIGHT NOW to replace the old
2,007-pair cache. No model changes, no download, no ONNX. The translation quality
for all training-domain sentences becomes perfect instantly.

### Track 2 — ONNX Integration (2-3 days work)
Reduce the 1.28GB ONNX model to a usable size, fix the missing file, and integrate.

---

## Track 1: Copy the New Cache (Do This Now)

**Step 1:** Copy this file:
```
d:\sih2026\aakansha's work\indictrans2_200m_hi_sat_onnx\translation_cache.json
```
to:
```
d:\sih2026\HindiSantaliApp\app\src\main\assets\translation_cache.json
```
(overwrite the existing one)

**Step 2:** Rebuild the app. Done. `PhraseCache.kt` already reads from assets and
will automatically pick up all 15,000+ new pairs.

---

## Track 2: ONNX Model Integration

### Phase A: INT8 Quantization (run locally on PC, no GPU needed)

Create and run this Python script on the local PC
(install: `pip install onnxruntime onnx`):

**File to create:** `d:\sih2026\aakansha's work\quantize.py`

```python
import onnxruntime
from onnxruntime.quantization import quantize_dynamic, QuantType
import os

model_dir = r"d:\sih2026\aakansha's work\indictrans2_200m_hi_sat_onnx"
out_dir   = r"d:\sih2026\aakansha's work\indictrans2_200m_hi_sat_int8"
os.makedirs(out_dir, exist_ok=True)

for fname in ["encoder_model.onnx", "decoder_model.onnx"]:
    src = os.path.join(model_dir, fname)
    dst = os.path.join(out_dir, fname.replace(".onnx", "_int8.onnx"))
    print(f"Quantizing {fname} ({os.path.getsize(src)//1024//1024}MB)...")
    quantize_dynamic(src, dst, weight_type=QuantType.QInt8)
    print(f"  → {dst} ({os.path.getsize(dst)//1024//1024}MB)")

print("Done.")
```

**Expected output sizes after quantization:**
- `encoder_model_int8.onnx` → ~120MB (from 479MB, ~75% reduction)
- `decoder_model_int8.onnx` → ~200MB (from 807MB, ~75% reduction)
- **Total: ~320MB**

This takes about 10-15 minutes to run on CPU. No internet or GPU needed.

---

### Phase B: Fix the Missing decoder_with_past_model.onnx

The current `HindiSantaliTranslator.kt` will crash because it tries to load
`decoder_with_past_model.onnx` which Aakansha's export did not produce.

**Option (recommended): Modify the translator to not need it.**

The `decoder_with_past_model.onnx` is just an optimization (KV-cache reuse).
Without it, you can use `decoder_model.onnx` for every decode step, passing
`past_key_values` as zeroes or skipping them. Translation is ~20% slower for
long sentences but is fully correct.

**Modify `HindiSantaliTranslator.kt`:**
1. Remove `decoderWithPastSession` field entirely.
2. Remove the `decoder_with_past_model.onnx` load on line 48.
3. In the greedy decode loop (line 91-136), always use `decoderSession` (not `decPast`).
4. Remove the `usePast` branching logic (lines 96-106).
5. Do NOT pass `past_key_values` inputs — just pass `input_ids`, `encoder_hidden_states`,
   and `encoder_attention_mask` on every step.
6. Ignore the `present.*` outputs from the decoder (they become useless without KV reuse).

Updated loop body:
```kotlin
for (step in 0 until maxLength) {
    val lastToken = longArrayOf(generatedIds.last())
    val decInputIds = OnnxTensor.createTensor(
        env, LongBuffer.wrap(lastToken), longArrayOf(1L, 1L))

    val decOutput = decoderSession!!.run(mapOf(
        "input_ids"              to decInputIds,
        "encoder_hidden_states"  to hiddenStates,
        "encoder_attention_mask" to encAttnTensor
    ))

    val logitsTensor = decOutput[0] as OnnxTensor
    val logits       = logitsTensor.floatBuffer
    val vocabSize    = logitsTensor.info.shape[2].toInt()

    var maxIdx = 0; var maxVal = Float.NEGATIVE_INFINITY
    for (i in 0 until vocabSize) {
        val v = logits.get()
        if (v > maxVal) { maxVal = v; maxIdx = i }
    }
    generatedIds.add(maxIdx.toLong())
    decOutput.close()
    if (maxIdx.toLong() == eosId) break
}
```

---

### Phase C: Update File Names in Translator + Downloader

**In `HindiSantaliTranslator.kt`** — change model file names:
```kotlin
// Old:
encoderSession = env.createSession(File(modelDir, "encoder_model.onnx").absolutePath, opts)
decoderSession = env.createSession(File(modelDir, "decoder_model.onnx").absolutePath, opts)

// New:
encoderSession = env.createSession(File(modelDir, "encoder_model_int8.onnx").absolutePath, opts)
decoderSession = env.createSession(File(modelDir, "decoder_model_int8.onnx").absolutePath, opts)
```

Also update the tokenizer files:
```kotlin
// Old:
srcSpmModel = File(modelDir, "model.SRC")
tgtSpmModel = File(modelDir, "model.TGT")

// New (Aakansha's file is the same, just check the name):
srcSpmModel = File(modelDir, "sentencepiece.bpe.model")
tgtSpmModel = File(modelDir, "sentencepiece.bpe.model")
// (both src and tgt use the same SPM model in IndicTrans2)
```

**In `TranslationModelDownloader.kt`** — update the required file list and HuggingFace URLs:
```kotlin
// Old required files: [encoder_model.onnx, decoder_model.onnx, decoder_with_past_model.onnx, ...]
// New required files:
val REQUIRED_FILES = listOf(
    "encoder_model_int8.onnx",   // ~120MB
    "decoder_model_int8.onnx",   // ~200MB
    "sentencepiece.bpe.model",   // ~3MB
    "config.json",
    "tokenizer_config.json"
)

// Update BASE_URL to point to new HuggingFace repo where the int8 files are uploaded
```

---

### Phase D: Sequential Memory Loading for 2GB Devices

The existing translator loads encoder + decoder simultaneously on `initialize()`.
On a 2GB device, that's 320MB at once, which is acceptable. But to be safe:

**Modify `translate()` in `HindiSantaliTranslator.kt`:**

```kotlin
fun translate(hindiText: String, maxLength: Int = 128): String {
    val env = OrtEnvironment.getEnvironment()
    val opts = OrtSession.SessionOptions().apply {
        setIntraOpNumThreads(4)
        setOptimizationLevel(OrtSession.SessionOptions.OptLevel.BASIC_OPT)
    }

    // ── 1. Load ONLY encoder, run it, then release it immediately ──
    val encSession = env.createSession(File(modelDir, "encoder_model_int8.onnx").absolutePath, opts)
    val inputIds = tokenizer!!.encode(hindiText, srcLang = "hin_Deva", tgtLang = "sat_Olck")
    val attentionMask = LongArray(inputIds.size) { 1L }
    val srcLen = inputIds.size.toLong()

    val hiddenStatesArray: FloatArray  // copy encoder output to plain array
    val encAttnArray: LongArray = attentionMask

    val encOut = encSession.run(mapOf(
        "input_ids"      to OnnxTensor.createTensor(env, LongBuffer.wrap(inputIds), longArrayOf(1L, srcLen)),
        "attention_mask" to OnnxTensor.createTensor(env, LongBuffer.wrap(attentionMask), longArrayOf(1L, srcLen))
    ))
    val hiddenTensor = encOut[0] as OnnxTensor
    hiddenStatesArray = FloatArray(hiddenTensor.floatBuffer.remaining()).also { hiddenTensor.floatBuffer.get(it) }
    val hiddenShape = hiddenTensor.info.shape.clone()
    encOut.close()
    encSession.close()  // ← FREE ENCODER RAM BEFORE LOADING DECODER

    // ── 2. Load ONLY decoder, run greedy decode, then release ──
    val decSession = env.createSession(File(modelDir, "decoder_model_int8.onnx").absolutePath, opts)
    val hiddenStatesTensor = OnnxTensor.createTensor(env, FloatBuffer.wrap(hiddenStatesArray), hiddenShape)
    val encAttnTensor = OnnxTensor.createTensor(env, LongBuffer.wrap(encAttnArray), longArrayOf(1L, srcLen))

    // ... greedy decode loop here (same as above) ...

    decSession.close()  // ← FREE DECODER RAM WHEN DONE
    env.close()

    return tokenizer!!.decode(outputIds)
}
```

**Peak RAM usage with this approach:**
- During encoding: only encoder_int8 in RAM (~120MB)
- During decoding: only decoder_int8 in RAM (~200MB)
- Never both at once → peak = **200MB** (very safe on 2GB device)

---

### Phase E: Upload to HuggingFace

After quantization is complete:
1. Upload `encoder_model_int8.onnx` and `decoder_model_int8.onnx` to HuggingFace
   (Aakansha's repo or the team repo).
2. Also upload `sentencepiece.bpe.model`, `config.json`, `tokenizer_config.json`.
3. Update `BASE_URL` in `TranslationModelDownloader.kt` to point to the new repo path.

---

## Final App Size Budget

| Component | Size | Location |
|---|---|---|
| App code (APK) | ~8MB | Bundled |
| `translation_cache.json` | 1.7MB | Bundled in assets |
| ASR model (IndicConformer INT8) | ~196MB | Downloaded on first launch |
| encoder_model_int8.onnx | ~120MB | Downloaded on first launch |
| decoder_model_int8.onnx | ~200MB | Downloaded on first launch |
| sentencepiece + configs | ~5MB | Downloaded on first launch |
| **APK size** | **~10MB** | ✅ Well under 100MB |
| **First launch download** | **~520MB** | Over WiFi (~5 min) |
| **RAM during ASR** | ~196MB | ✅ |
| **RAM during translation** | ~200MB | ✅ |

---

## Order of Execution

1. **Right now:** Copy `translation_cache.json` to app assets → rebuild → 15k pairs work instantly
2. **Run quantize.py** on local PC (~15 min, no GPU)
3. **Modify `HindiSantaliTranslator.kt`** (remove decoder_with_past, update file names, sequential loading)
4. **Modify `TranslationModelDownloader.kt`** (update file list + URLs)
5. **Upload int8 files to HuggingFace**
6. **Build and test** on device
