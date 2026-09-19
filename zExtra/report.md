# Technical Report: Hindi → Santali Voice Translator
**Project:** SIH 2026 — Real-Time Hindi to Santali (Ol Chiki) Speech Translation on Android  
**Platform:** Android 9+ (API 28+), 2GB RAM devices

---

## 1. Problem Statement

Santali is a scheduled tribal language spoken by ~8 million people in India, primarily in Jharkhand, Odisha, and West Bengal. It is officially written in the **Ol Chiki script** (Unicode block: 1C50–1C7F). There is a significant language barrier between Hindi-speaking healthcare workers, officials, and the Santali-speaking tribal population. The goal of this project is to bridge this gap with a real-time, offline-capable voice translation app.

---

## 2. System Requirements

| Parameter | Requirement |
|---|---|
| Platform | Android 9.0+ (API Level 28+) |
| RAM | 2GB minimum |
| Storage (APK) | < 10 MB |
| First-launch Download | ~520 MB (models, over WiFi) |
| Internet after setup | Not required (fully offline) |
| Language pair | Hindi (Devanagari) → Santali (Ol Chiki) |

---

## 3. System Architecture (Pipeline)

```
Mic Input
   ↓
[Stage 1] Hindi Speech → Hindi Text     (ASR)
   ↓
[Stage 2] Hindi Text → Santali Text     (Neural Machine Translation)
   ↓
[Stage 3] Santali Text → Santali Speech (TTS — planned)
   ↓
Speaker Output
```

All three stages run on-device with no cloud calls after the initial model download.

---

## 4. Stage 1: Automatic Speech Recognition (ASR)

| Property | Detail |
|---|---|
| Method | Android OS `SpeechRecognizer` API |
| Language | Hindi (`hi-IN`) |
| Latency | 200–600ms |
| Offline | Depends on device (most Android 10+ phones have offline packs) |

**Why we chose this:** We initially used the IndicConformer 200M ONNX model (via SherpaOnnx), but it took 10–11 seconds per utterance on budget devices due to full transformer inference on CPU. The Android SpeechRecognizer API uses hardware-accelerated on-device models (DSP/NPU), achieving sub-1-second latency for free.

---

## 5. Stage 2: Machine Translation

### 5a. Base Model

| Property | Detail |
|---|---|
| Model Name | `ai4bharat/indictrans2-indic-indic-dist-200M` |
| Architecture | Transformer Encoder-Decoder (seq2seq) |
| Parameters | 200 Million (distilled version of the 1B model) |
| Tokenizer | SentencePiece BPE, shared vocabulary across 22 Indian languages |
| Source | AI4Bharat, IIT Madras |

IndicTrans2 is the state-of-the-art multilingual machine translation model for 22 Indian languages. The distilled 200M version was selected because it is the largest model that fits within the 2GB RAM constraint.

### 5b. Fine-Tuning

| Property | Detail |
|---|---|
| Method | LoRA (Low-Rank Adaptation) |
| Framework | PyTorch + HuggingFace `transformers` + `peft` |
| Hardware | Kaggle Notebook, T4 GPU (16GB VRAM) |
| Training pairs | ~4,046 parallel Hindi–Santali sentences |
| Epochs | 10–15 |
| LoRA Rank | r=16, alpha=32 |
| Target modules | `q_proj`, `v_proj` (attention layers) |

### 5c. Dataset

| Source | Pairs | Type |
|---|---|---|
| FLORES-200 (Meta / HuggingFace) | ~1,012 | Curated, high quality |
| Custom generated pairs | ~3,034 | Grammar-template generated, covering daily activities |
| **Total** | **~4,046** | Parallel Hindi–Santali sentences |

**FLORES-200** (`facebook/flores` on HuggingFace) is a multi-way parallel evaluation dataset from Meta covering 200 languages including `hin_Deva` (Hindi) and `sat_Olck` (Santali in Ol Chiki script). It is the primary high-quality source.

### 5d. ONNX Export & Quantization

| Step | Detail |
|---|---|
| Export format | ONNX (Open Neural Network Exchange) |
| Quantization | Dynamic INT8 (via `onnxruntime.quantization`) |
| Size before quantization | 1.28 GB (encoder 479MB + decoder 807MB) |
| Size after INT8 quantization | ~310 MB (encoder 115MB + decoder 194MB) |
| Size reduction | ~75% |

### 5e. On-Device Inference Strategy

To fit within 2GB RAM, the encoder and decoder are **never loaded simultaneously**:
1. Load encoder → run encoding → unload encoder from RAM
2. Load decoder → run greedy decoding → unload decoder from RAM
3. Peak RAM usage: ~200MB (decoder only)

### 5f. Translation Cache (Fast Path)

In addition to the neural model, all 4,046 training pairs are stored as a local JSON file bundled inside the APK. On every query:
- **Cache hit (known sentence):** Returns translation instantly (<5ms), no model needed.
- **Cache miss (novel sentence):** Falls through to the INT8 ONNX model.

---

## 6. Stage 3: Text-to-Speech (TTS) — Planned

| Property | Detail |
|---|---|
| Model | `facebook/mms-tts-sat` (Meta Massively Multilingual Speech) |
| Script | Ol Chiki (Santali) |
| Framework | SherpaOnnx `OfflineTts` |
| Status | Identified, not yet integrated |

MMS-TTS supports Santali natively and is one of the only publicly available neural TTS systems for the language. Integration is the next engineering milestone.

---

## 7. Android App Technical Stack

| Component | Technology |
|---|---|
| Language | Kotlin |
| UI Framework | Jetpack Compose |
| Architecture | MVVM (ViewModel + StateFlow) |
| On-device inference | ONNX Runtime for Android |
| ASR | Android `SpeechRecognizer` API |
| Translation | Custom ONNX encoder-decoder pipeline |
| Model download | HuggingFace (first launch, over WiFi) |
| Font | Google Fonts — Outfit (UI) + Noto Sans Ol Chiki (Santali script) |

---

## 8. Key Challenges & Solutions

| Challenge | Solution |
|---|---|
| ASR takes 10+ seconds on CPU | Switched to Android native SpeechRecognizer API |
| Translation model is 1.28GB | INT8 quantization → 310MB |
| 2GB RAM can't hold all models simultaneously | Sequential encoder/decoder loading |
| APK must be <100MB | Models downloaded at first launch, not bundled |
| Santali script renders incorrectly | Noto Sans Ol Chiki Google Font applied to output text |
| Limited parallel data | FLORES-200 + custom template-generated sentences |

---

## 9. Future Work

1. **TTS Integration:** Add Santali audio output using `facebook/mms-tts-sat` so the full pipeline (voice-in, voice-out) is complete.
2. **Larger Dataset:** Source more parallel data from Jharkhand government documents, Santali Bible corpus, and tribal language research institutions to fine-tune on 15,000+ pairs.
3. **Streaming ASR Fallback:** Integrate a lightweight offline streaming ASR model (e.g., SherpaOnnx streaming Zipformer for Hindi) for environments without internet.
4. **Vocabulary Expansion:** The current fine-tuned model handles daily-life sentences. Expanding to healthcare, legal, and government domains is critical for real-world deployment.
5. **iOS Port:** The ONNX models are cross-platform and can be directly reused in an iOS app via `onnxruntime-objc`.
6. **Speaker Identification:** Add a mode to detect whether the speaker is speaking Hindi or Santali and translate bidirectionally.

---

## 10. References

- IndicTrans2: Gala et al. (2023), AI4Bharat — https://ai4bharat.iitm.ac.in/indic-trans
- FLORES-200: NLLB Team, Meta (2022) — https://huggingface.co/datasets/facebook/flores
- MMS-TTS: Pratap et al., Meta (2023) — https://huggingface.co/facebook/mms-tts-sat
- LoRA: Hu et al. (2021) — "LoRA: Low-Rank Adaptation of Large Language Models"
- ONNX Runtime: https://onnxruntime.ai
- SherpaOnnx: https://github.com/k2-fsa/sherpa-onnx
