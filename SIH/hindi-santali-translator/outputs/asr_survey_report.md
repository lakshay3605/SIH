# Phase 1 — Offline Hindi ASR Survey Report
**Project:** Hindi → Santali Offline Android App  
**Author:** Sharjil (UI/Speech/Performance)  
**Date:** 2026-09-01  
**Constraint:** 2GB RAM, Android 9 (API 28), fully offline, no cloud APIs

---

## 1. Candidates Evaluated

| Engine | Architecture | Hindi Support | Streaming | Android SDK |
|---|---|---|---|---|
| **Vosk** | Kaldi CTC | ✅ Yes (`vosk-model-small-hi-0.22`) | ✅ Yes | ✅ Maven AAR |
| **Whisper.cpp** | Transformer (encoder-decoder) | ✅ Yes (multilingual) | ❌ No (batch only) | ✅ via JNI |
| **SherpaOnnx — IndicConformer** | CTC Conformer (AI4Bharat) | ✅ Yes (Hindi + 8 Indic langs) | ✅ Yes | ✅ AAR |
| **SherpaOnnx — Dolphin** | CTC multilingual | ✅ Yes | ✅ Yes | ✅ AAR |
| **Meta MMS** | wav2vec2 variant | ✅ Yes | ❌ No | ❌ No native SDK |

---

## 2. Detailed Comparison

### 2.1 Vosk (`vosk-model-small-hi-0.22`)
- **Model size:** ~50 MB
- **RAM usage:** ~80–120 MB at runtime
- **Accuracy:** Moderate. Works for clear speech, struggles with accents, noise, and fast speech. 
- **Streaming:** Yes — real-time word-by-word output
- **Android:** Simple Maven dependency (`org.vosk:vosk-android:0.3.40`), easy to integrate
- **License:** Apache 2.0 ✅
- **Verdict:** Easy to integrate, very lightweight. Accuracy is the weak point — it's a 2019-era Kaldi model.

---

### 2.2 Whisper.cpp (tiny / tiny INT8)
- **Model size:** Whisper tiny = ~75 MB | tiny INT8 ≈ ~42 MB
- **RAM usage:** ~250–400 MB (decoder is memory-hungry)
- **Accuracy:** State-of-the-art. Handles accents, Hinglish, noise. Best accuracy of all options.
- **Streaming:** ❌ NO — processes fixed audio segments. Requires hold-to-speak + full recording before transcription.
- **Android:** JNI via `whisper.cpp`, requires NDK compilation. Complex setup.
- **License:** MIT ✅
- **Verdict:** Best accuracy but NO streaming. Since our UI is hold-to-speak, non-streaming is acceptable for our use case.

---

### 2.3 SherpaOnnx — IndicConformer (AI4Bharat) ⭐ RECOMMENDED
- **Model size:** INT8 quantized = **~188 MB** | FP32 = ~470 MB
- **RAM usage:** ~200–250 MB at runtime (INT8)
- **Accuracy:** High — specifically trained on 8 Indian languages including Hindi. Much better than Vosk.
- **Streaming:** ✅ Yes — chunk-level real-time
- **Android:** Official AAR, Kotlin API, well documented
- **License:** Apache 2.0 ✅
- **Latency:** RTF 0.1–0.3 → ~200–500ms for a 3-second Hindi utterance

---

### 2.4 SherpaOnnx — Dolphin (multilingual CTC)
- **Model size:** INT8 = ~239 MB | FP32 = ~783 MB
- **RAM usage:** ~260–320 MB at runtime (INT8)
- **Accuracy:** Good, but not Hindi-specific
- **Verdict:** Larger than IndicConformer with no Hindi-specific advantage. Skipped.

---

### 2.5 Meta MMS
- **Model size:** >500 MB for Hindi-capable variant
- **Android SDK:** ❌ None — requires Python / PyTorch Mobile
- **Verdict:** Not viable for Android target. Skipped.

---

## 3. Final Recommendation

### ✅ Winner: SherpaOnnx + IndicConformer (INT8)

| Criterion | Score | Reason |
|---|---|---|
| Accuracy | ⭐⭐⭐⭐ | Hindi-specific AI4Bharat model, handles accents |
| Model Size (INT8) | ⭐⭐⭐⭐ | 188 MB — fits comfortably |
| RAM at Runtime | ⭐⭐⭐⭐ | ~200–250 MB |
| Streaming | ⭐⭐⭐⭐⭐ | Real-time chunk streaming |
| Android Integration | ⭐⭐⭐⭐⭐ | Official AAR + Kotlin API |
| License | ✅ Apache 2.0 | Safe for SIH |

### Fallback: Vosk (`vosk-model-small-hi-0.22`)
If IndicConformer + Translation + TTS together crash with OOM on 2GB device, Vosk at 50 MB is the fallback. Accuracy will be lower but it will never crash.

---

## 4. Full Pipeline RAM Budget (2GB Phone)

| Component | Storage Size | Runtime RAM Estimate |
|---|---|---|
| OS + Android System | — | ~900 MB (fixed) |
| App itself | ~10 MB | ~50 MB |
| **ASR: SherpaOnnx IndicConformer INT8** | 188 MB | ~220 MB |
| **Translation: IndicTrans2 200M distilled INT8** | ~360 MB | ~400 MB |
| **TTS: Indic Parler-TTS (ONNX INT8)** | ~200–400 MB (TBD) | ~300–500 MB |
| **TOTAL (estimated)** | — | **~1,870 – 2,070 MB** |

> [!WARNING]
> The pipeline sits right at the edge of 2GB. Simultaneous loading of all three models WILL cause OOM.
> **Mitigation strategy: Sequential model loading**
> Load ASR → transcribe → unload ASR → load Translation → translate → unload Translation → load TTS → synthesize → unload TTS.
> This adds ~1-2 seconds of model loading overhead but prevents crashes. We measure this in Phase 6.

---

## 5. Next Steps (Phase 3 — ASR Integration)

1. Add SherpaOnnx Android dependency to Gradle
2. Download IndicConformer INT8 model on first app launch
3. Implement `transcribeHindi(audioBytes: ByteArray): String`
4. Measure real ASR latency on Hindi speech samples
5. If OOM on device → switch to Vosk fallback

---

## 6. Decision Log

| Decision | Rationale |
|---|---|
| SherpaOnnx over Whisper.cpp | Better Android integration, Hindi-specific accuracy, streaming support |
| SherpaOnnx over Vosk | Much better accuracy for real-world Hindi speech |
| INT8 over FP32 | 2.5x smaller, faster inference on CPU, negligible accuracy drop |
| Sequential model loading | Prevents OOM on 2GB device, trades ~1-2s overhead for stability |
| On-demand model download (first launch) | Keeps APK size small |
