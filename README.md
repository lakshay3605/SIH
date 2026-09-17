# Aadivaani — Offline Tribal Translation System (Hindi $\rightarrow$ Santali)

Aadivaani is a high-performance, offline machine translation system targeting tribal languages (Santali, Ho, Mundari) and Hindi for mobile (Android 9+, 2GB RAM budget) and edge computing.

---

## 📌 Phase 1 Status & Architecture

In Phase 1, the pipeline was migrated to a genuine, reproducible PyTorch + Transformers + PEFT/LoRA architecture:
- **Target Edge Model**: `ai4bharat/indictrans2-indic-indic-dist-320M` (Indic-to-Indic Seq2Seq)
- **Script Support**: Devanagari (`hin_Deva`) $\rightarrow$ Ol Chiki (`sat_Olck`, `U+1C50`–`U+1C7F`)
- **Dataset Size**: **4,046** verified parallel pairs (2,001 FLORES-200 human translations + 2,045 verified domain pairs)
  - Train: **3,236** (79.98%)
  - Validation: **404** (9.99%)
  - Test: **406** (10.03%)
  - Zero cross-split data leakage.
- **Inference Strategy**: Dual-Tier Architecture:
  - **Tier 1**: In-memory phrase cache for instant exact-match translations ($<5$ms).
  - **Tier 2**: Neural autoregressive Seq2Seq model (`model.generate()`).

---

## 📁 Repository Structure
```
├── docs/
│   ├── repository_audit.md       # Full Phase 0 audit findings & gap analysis
│   ├── aadivaani_migration_plan.md# System evolution roadmap & file action plans
│   ├── architecture.md           # System architecture, memory budget (<400MB)
│   ├── technical_risks.md        # Technical risks & mitigation matrix
│   └── phase1_training.md        # Phase 1 training pipeline & execution guide
├── src/
│   ├── script_validator.py       # Ol Chiki and Devanagari Unicode validator
│   ├── dataset_builder.py        # Strict dataset cleaner, validator, and splitter
│   ├── metrics.py                # Genuine SacreBLEU, chrF++, and script metrics
│   ├── train_lora.py             # Real PyTorch + Transformers LoRA training pipeline
│   ├── evaluate.py               # Real autoregressive evaluation suite
│   ├── inference.py              # Neural inference engine with optional phrase cache
│   └── *_original.py             # Preserved backups of original legacy scripts
├── tests/
│   ├── test_script_validator.py  # Unicode and transliteration unit tests
│   ├── test_dataset_pipeline.py  # Filtering, deduplication, and leakage tests
│   ├── test_neural_pipeline.py   # LoRA backprop, checkpoints, and generation tests
│   └── run_all_tests.py          # Unified test runner
├── data/
│   ├── processed/                # train.jsonl (3,236), val.jsonl (404), test.jsonl (406)
│   ├── flores_pairs.json         # 2,001 FLORES-200 reference pairs
│   └── master_dataset.csv        # 4,046 master dataset pairs
├── outputs/
│   └── dataset_statistics.json   # Full dataset breakdown & token length metrics
├── requirements.txt
└── README.md
```

---

## 🚀 Quickstart

### 1. Installation
```bash
pip install -r requirements.txt
```

### 2. Run Test Suite
Verify the entire system using the 14 automated unit tests:
```bash
python tests/run_all_tests.py
```

### 3. Dataset Pipeline
Regenerate and validate parallel datasets:
```bash
python -m src.dataset_builder
```

### 4. Real LoRA Training
Run real PyTorch PEFT training on GPU or CPU:
```bash
python -m src.train_lora \
    --model_id "ai4bharat/indictrans2-indic-indic-dist-320M" \
    --train_path "data/processed/train.jsonl" \
    --val_path "data/processed/validation.jsonl" \
    --output_dir "models/checkpoints/best_lora" \
    --epochs 3 \
    --batch_size 4 \
    --grad_accum 4 \
    --lr 3e-4
```
*Note: To verify pipeline mechanics without full multi-hour epoch training, add `--dry_run`.*

### 5. Genuine Model Evaluation
Evaluate trained checkpoints against the locked test set with SacreBLEU:
```bash
python -m src.evaluate \
    --model_path "models/checkpoints/best_lora" \
    --test_path "data/processed/test.jsonl" \
    --output_report "outputs/evaluation_results.json"
```

### 6. Neural Inference
```python
from src.inference import translate_hindi_to_santali

# 1. Neural generation using trained checkpoint:
output = translate_hindi_to_santali("नमस्ते, आप कैसे हैं?", model_path="models/checkpoints/best_lora")
print(output)

# 2. Fast conversational inference with Tier-1 phrase cache:
fast_output = translate_hindi_to_santali("नमस्ते, आप कैसे हैं?", use_phrase_cache=True)
print(fast_output)
```

---

## 📄 Documentation
- For full Phase 1 documentation and commands: [docs/phase1_training.md](docs/phase1_training.md).
- For complete hardware audit and gap analysis: [docs/repository_audit.md](docs/repository_audit.md).
- For system memory budget and mobile architecture: [docs/architecture.md](docs/architecture.md).
