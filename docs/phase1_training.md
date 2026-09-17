# Aadivaani — Phase 1: Real Hindi $\rightarrow$ Santali Training Pipeline

**Document**: `docs/phase1_training.md`  
**Version**: 1.0 (Phase 1 Deliverable)  
**Status**: Implemented & Verified  

---

## 1. Executive Summary

In Phase 1, all simulated training loops, hardcoded evaluation metrics, and dictionary-only translation stubs were decommissioned and replaced with a **genuine, reproducible PyTorch + HuggingFace Transformers + PEFT/LoRA pipeline**.

### Core Achievements in Phase 1:
1. **Dataset Pipeline Cleaned & Hardened**:
   - Replaced unvalidated generation with a strict validation pipeline.
   - Enforced script checks (Ol Chiki `U+1C50`–`U+1C7F`, Devanagari `U+0900`–`U+097F`).
   - Removed 2,001 redundant duplicates across sources.
   - Guaranteed **zero train/validation/test leakage**.
   - Output deterministic splits: **3,236 Train (79.98%)**, **404 Validation (9.99%)**, **406 Test (10.03%)**.
2. **Real Training Pipeline (`src/train_lora.py`)**:
   - Built a complete Seq2Seq fine-tuning script with PyTorch and PEFT LoRA.
   - Real forward pass, cross-entropy loss computation, backward backpropagation, gradient accumulation, and learning rate scheduling.
   - Writes genuine model weight files (`adapter_model.safetensors`, `adapter_config.json`, `training_history.json`).
3. **Real Evaluation Suite (`src/evaluate.py`)**:
   - Performs true autoregressive generation (`model.generate()`).
   - Computes actual SacreBLEU and chrF++ using `sacrebleu`.
   - Never feeds reference translations as hypotheses.
   - Generates an inspectable qualitative report with individual sample chrF++ scores.
4. **Real Inference Interface (`src/inference.py`)**:
   - Implements `NeuralHindiSantaliTranslator` executing neural generation.
   - Retains optional phrase cache acceleration for Tier-1 exact matches without replacing the neural core.
5. **Complete Offline Test Suite (`tests/`)**:
   - 14 automated unit tests covering validation, splitting, tokenization, LoRA backprop, checkpoint saving/loading, generation, and metrics.
   - All 14 tests pass cleanly in ~4.4 seconds using a lightweight in-memory model fixture.

---

## 2. Dataset Statistics & Provenance

The verified parallel dataset is cataloged in `outputs/dataset_statistics.json`:

| Split | Sample Count | Percentage | Provenance Distribution | Primary Source |
| :--- | :--- | :--- | :--- | :--- |
| **Train** | 3,236 | 79.98% | 1,601 Human Translation / 1,635 Verified Domain | FLORES-200 + Master Corpus |
| **Validation** | 404 | 9.99% | 200 Human Translation / 204 Verified Domain | FLORES-200 + Master Corpus |
| **Test** | 406 | 10.03% | 200 Human Translation / 206 Verified Domain | FLORES-200 + Master Corpus |
| **Total Valid** | **4,046** | **100.0%** | **2,001 Human / 2,045 Domain** | Zero Duplicate Hindi Sentences |
| **Total Rejected**| **2,001** | — | Redundant duplicates between FLORES & Master | Logged in `rejected_dataset.jsonl` |

### Token Characteristics:
- **Hindi Average Word Length**: 16.13 words (Min: 3, Max: 67)
- **Santali Average Word Length**: 14.69 words (Min: 3, Max: 68)
- **Target Script**: 100% Ol Chiki (`U+1C50`–`U+1C7F`)

---

## 3. Model Architecture & HuggingFace Hub Finding

During Phase 1 research, a critical finding was identified regarding AI4Bharat model identifiers on Hugging Face:
- **`ai4bharat/indictrans2-indic-indic-dist-200M` does NOT exist on Hugging Face**. The 200M models are exclusively En-Indic (`indictrans2-en-indic-dist-200M`) and Indic-En (`indictrans2-indic-en-dist-200M`).
- The official distilled Indic-to-Indic model is **`ai4bharat/indictrans2-indic-indic-dist-320M`**.
- Both `ai4bharat/indictrans2-indic-indic-dist-320M` and `ai4bharat/indictrans2-indic-indic-1B` are gated repositories on Hugging Face that require accepting AI4Bharat terms and authenticating via `huggingface-cli login` or the `HF_TOKEN` environment variable. Anonymous requests return `HTTP 401: Unauthorized`.

---

## 4. Hardware Requirements & Environment Audit

### Host System Hardware (Audited):
- **Total Physical RAM**: 15.40 GB
- **Available RAM**: ~2.8 – 5.3 GB
- **CUDA GPU**: `False` (Host environment has CPU execution only)
- **CPU Cores**: 6 physical cores / 12 logical threads

### Hardware Recommendations for Full Training:
| Execution Target | Device | Minimum RAM / VRAM | Estimated Training Time (5 Epochs, 3.2K pairs) |
| :--- | :--- | :--- | :--- |
| **Recommended** | Cloud GPU (NVIDIA T4 / A10 / RTX 3060+) | $\ge$ 8 GB VRAM | ~12 – 18 minutes |
| **Local CPU** | Multi-threaded CPU (6–12 threads) | $\ge$ 8 GB RAM | ~3.5 – 5.0 hours |

---

## 5. Execution Guide & Commands

### 5.1 Dataset Regeneration
To regenerate the validated splits and statistics:
```powershell
$env:PYTHONIOENCODING="utf-8"
python -m src.dataset_builder
```
Outputs generated:
- `data/processed/train.jsonl` (3,236 pairs)
- `data/processed/validation.jsonl` (404 pairs)
- `data/processed/test.jsonl` (406 pairs)
- `outputs/dataset_statistics.json`
- `outputs/rejected_dataset.jsonl`

### 5.2 Real LoRA Fine-Tuning
To run real PyTorch LoRA fine-tuning:
```powershell
$env:PYTHONIOENCODING="utf-8"
python -m src.train_lora `
    --model_id "ai4bharat/indictrans2-indic-indic-dist-320M" `
    --train_path "data/processed/train.jsonl" `
    --val_path "data/processed/validation.jsonl" `
    --output_dir "models/checkpoints/best_lora" `
    --epochs 3 `
    --batch_size 4 `
    --grad_accum 4 `
    --lr 3e-4 `
    --lora_r 16 `
    --lora_alpha 32
```

#### Pipeline Smoke-Test / Dry-Run (Verifies model loading, backprop, & checkpoint saving in <1s):
```powershell
$env:PYTHONIOENCODING="utf-8"
python -m src.train_lora --model_id <local_model_path> --dry_run
```

### 5.3 Real Evaluation
To evaluate a trained checkpoint on the unseen test set:
```powershell
$env:PYTHONIOENCODING="utf-8"
python -m src.evaluate `
    --model_path "models/checkpoints/best_lora" `
    --base_model_id "ai4bharat/indictrans2-indic-indic-dist-320M" `
    --test_path "data/processed/test.jsonl" `
    --output_report "outputs/evaluation_results.json" `
    --batch_size 4
```

### 5.4 Neural Inference
In Python:
```python
from src.inference import translate_hindi_to_santali

# Neural translation
santali_text = translate_hindi_to_santali("नमस्ते, आप कैसे हैं?", model_path="models/checkpoints/best_lora")
print(santali_text)

# High-speed conversational translation with Tier-1 phrase cache enabled:
fast_text = translate_hindi_to_santali("नमस्ते, आप कैसे हैं?", use_phrase_cache=True)
print(fast_text)
```

### 5.5 Unit Test Suite Execution
To execute all 14 unit tests:
```powershell
$env:PYTHONIOENCODING="utf-8"
python tests/run_all_tests.py
```

---

## 6. Known Blockers & Next Steps for Phase 2

1. **Hugging Face Hub Token (`HF_TOKEN`)**:
   - `ai4bharat/indictrans2-indic-indic-dist-320M` requires accepting the license agreement on Hugging Face. Running full base model weights requires setting `$env:HF_TOKEN="hf_..."` or running `huggingface-cli login`.
2. **Compute Acceleration**:
   - The current local workstation lacks a dedicated NVIDIA CUDA GPU for rapid training. Full training of the 320M parameter model on 3,236 pairs is best executed on a GPU instance (Colab T4, Kaggle, or cloud VM), while the trained LoRA adapter (`adapter_model.safetensors` ~35 MB) can be sideloaded directly into `models/checkpoints/best_lora/` for local evaluation and ONNX export.
