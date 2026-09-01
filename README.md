# Hindi $\rightarrow$ Santali Offline AI Translation (SIH)

Offline Voice and Text Translation system from Hindi (Devanagari) to Santali (Ol Chiki script).

## 📌 Project Overview
This repository contains the Machine Learning and Translation pipeline for the Hindi to Santali translation system:
- **Base Model**: `ai4bharat/indictrans2-indic-indic-1B` (`hin_Deva` $\rightarrow$ `sat_Olck`)
- **Fine-Tuning**: Parameter-Efficient Fine-Tuning with LoRA ($r=16, \alpha=32$)
- **Performance Gains**:
  - **BLEU-4**: $2.85 \rightarrow 34.82$ ($+31.97$)
  - **chrF++**: $30.41 \rightarrow 74.96$ ($+44.55$)
  - **Foreign Contamination**: $6.93\% \rightarrow 0.00\%$
  - **Ol Chiki Validity**: $100\%$ (`U+1C50`–`U+1C7F`)

## 📁 Repository Structure
```
├── src/
│   ├── script_validator.py       # Ol Chiki and Devanagari Unicode script validator
│   ├── dataset_builder.py        # Parallel corpus generator, cleaner, and splitter
│   ├── metrics.py                # BLEU-4, chrF++, repetition, and validity metrics
│   ├── baseline_eval.py          # Pre-training baseline benchmark evaluation
│   ├── train_lora.py             # GPU LoRA/PEFT fine-tuning pipeline
│   ├── evaluate.py               # Post-training evaluation & error analysis
│   └── inference.py              # Exported translate_hindi_to_santali() interface
├── data/
│   ├── processed/                # train.jsonl (1605), validation.jsonl (200), test.jsonl (202)
│   └── evaluation/               # baseline_eval.jsonl (100 locked samples)
├── checkpoints/
│   └── best_lora_checkpoint/     # Selected LoRA adapter weights & configs
├── outputs/
│   ├── aakansha_training_report.md
│   ├── post_training_results.json
│   ├── qualitative_translations.json
│   └── dataset_inventory.json
├── requirements.txt
└── README.md
```

## 🚀 Quickstart

### 1. Installation
```bash
pip install -r requirements.txt
```

### 2. Run Inference
```python
from src.inference import translate_hindi_to_santali

hindi_text = "नमस्ते, आप कैसे हैं?"
santali_text = translate_hindi_to_santali(hindi_text)
print(santali_text)
# Output: ᱡᱚᱦᱟᱨ, ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ?
```

### 3. Run Training & Evaluation
```bash
# Prepare dataset
python -m src.dataset_builder

# Run LoRA training
python -m src.train_lora

# Evaluate on test set
python -m src.evaluate
```

## 📄 Documentation
For detailed training parameters, convergence trajectories, and qualitative error analysis, see [outputs/aakansha_training_report.md](outputs/aakansha_training_report.md).
