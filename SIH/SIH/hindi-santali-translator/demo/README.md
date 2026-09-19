# Offline Hindi → Santali Translator — Demo Guide

A fully offline desktop prototype that translates Hindi speech/text into Santali (Ol Chiki script) and synthesizes Santali speech — all running locally with no internet after initial setup.

---

## 1. How to Install

### Prerequisites

- Python 3.10–3.13
- 8+ GB RAM (16 GB recommended)
- ~8 GB free disk space (for model cache)
- No GPU required — runs on CPU

### Install dependencies

```bash
cd d:\Desktop\SIH\hindi-santali-translator
pip install -r requirements.txt
pip install gradio
```

---

## 2. How to Download Models (First Time Only — Requires Internet)

Run the pipeline once in `--online` mode. This downloads all models into the local HuggingFace cache (`~/.cache/huggingface/hub/`):

```bash
python src/demo.py --online
```

This downloads:
| Model | Size | Purpose |
|---|---|---|
| `ai4bharat/indictrans2-indic-indic-1B` | ~4.6 GB | Hindi → Santali translation |
| `ai4bharat/indic-parler-tts` | ~1.5 GB | Santali speech synthesis |
| `google/flan-t5-large` | ~0.8 GB | TTS voice description encoder |

**Total: ~7 GB. Download once, use forever offline.**

---

## 3. How to Run Online (With Internet)

```bash
python src/demo.py --online
```

This uses the local cache if models are already downloaded, or downloads them if not.

---

## 4. How to Enable Offline Mode

Once models are downloaded, **disconnect your internet** and run:

```bash
python src/demo.py --offline
```

The `--offline` flag:
- Sets `local_files_only=True` on every model load
- Verifies the HuggingFace cache before attempting to load
- Fails immediately with a clear error if any model is missing
- Makes **zero network requests** during inference

If a model is missing you will see:

```
[OFFLINE ERROR] Model 'ai4bharat/indictrans2-indic-indic-1B' is NOT found in the local cache.
  Expected at: ~/.cache/huggingface/hub/models--ai4bharat--indictrans2-indic-indic-1B/snapshots
  Run ONCE with --online to download it:
    python src/demo.py --online
```

---

## 5. How to Run the Gradio Web UI

```bash
# Offline mode (recommended after first download)
python demo/app.py --offline

# Online mode (allows model download)
python demo/app.py --online
```

Opens automatically at **http://localhost:7860**

The UI provides:
- Hindi text input with example sentences
- One-click Translate button
- One-click Generate Speech button
- Combined "Translate + Speak" button
- Audio player for synthesized Santali speech
- Visual offline/online status indicator
- Speaker selection (Sumitra / Raju)

---

## 6. Model Sizes

| Model | Disk Size | RAM Usage |
|---|---|---|
| IndicTrans2 1B (translation) | ~4.6 GB | ~4.5 GB during inference |
| Indic Parler-TTS (TTS) | ~1.5 GB | ~1.5 GB during inference |
| Flan-T5-Large (TTS encoder) | ~0.8 GB | included above |
| **Total cache** | **~7 GB** | **~6 GB peak** |

> Note: Models are loaded sequentially. Peak RAM usage is ~4.5 GB when only running translation, or ~6 GB if both models are in memory simultaneously.

---

## 7. Hardware Requirements

| Component | Minimum | Recommended |
|---|---|---|
| RAM | 8 GB | 16 GB |
| Disk | 8 GB free | 10 GB free |
| CPU | Any x86-64 | AMD Ryzen 5+ / Intel i5+ |
| GPU | Not required | NVIDIA GPU (future) |
| Internet | Required once | Not required after download |

### Measured performance (AMD Ryzen 5 5600H, 15.4 GB RAM):

| Operation | Time |
|---|---|
| Model load (both) | ~31s |
| Translation (per sentence) | 4–16s (avg ~7s after warmup) |
| TTS synthesis (per sentence) | 23–36s |
| **End-to-end (per sentence)** | **~40s total** |

---

## 8. Known Limitations

1. **Speed**: Running 1.2B parameter models on CPU is slow (~7s translation, ~30s TTS per sentence). A GPU would reduce this by 10–50×.

2. **Translation quality**: The base IndicTrans2 model was not fine-tuned specifically on Hindi→Santali. BLEU-4 is 2.85 on our evaluation set. Fine-tuning is planned (Phase 4).

3. **Foreign script contamination**: ~7% of base model outputs on the 100-sentence evaluation set contained non-Ol Chiki characters (Urdu, Meitei). The demo uses beam search with repetition penalty to reduce this.

4. **TTS quality**: Indic Parler-TTS generates intelligible audio but may not perfectly render all Ol Chiki phonemes. Quality improves with cleaner, shorter input text.

5. **Android not yet available**: This is a desktop Python prototype only. Mobile conversion is a future phase.

6. **Single sentence at a time**: The demo processes one sentence per call. Batch processing is supported in the underlying API.

7. **`as_target_tokenizer` deprecation**: A benign warning from transformers 4.x. Does not affect correctness.

---

## Pipeline Architecture

```
Hindi text (Devanagari)
        │
        ▼
  IndicProcessor.preprocess_batch()
        │
        ▼
  IndicTrans2 1B  (ai4bharat/indictrans2-indic-indic-1B)
  beam_search, num_beams=4
        │
        ▼
  IndicProcessor.postprocess_batch()
        │
        ▼
  Santali text (Ol Chiki ᱚᱞ ᱪᱤᱠᱤ)
        │
        ▼
  Indic Parler-TTS  (ai4bharat/indic-parler-tts)
  Speaker: Sumitra or Raju
        │
        ▼
  WAV audio (44100 Hz)
```
