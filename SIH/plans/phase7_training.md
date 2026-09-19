# Task Brief: Hindi → Santali Model Training & ONNX Export

> [!CAUTION]
> ## ✅ THIS TASK IS 100% COMPLETE — DO NOT RE-EXECUTE
>
> **Aakansha has already completed every phase of this document.**
> Running this plan again would waste GPU hours and produce an identical result.
>
> ### What Aakansha delivered (already on disk):
> | File | Location | Description |
> |---|---|---|
> | `encoder_model.onnx` | `d:\sih2026\aakansha's work\indictrans2_200m_hi_sat_onnx\` | IndicTrans2 200M encoder (float32, 479MB) |
> | `decoder_model.onnx` | same folder | IndicTrans2 200M decoder (float32, 807MB) |
> | `sentencepiece.bpe.model` | same folder | Tokenizer for Hindi + Santali |
> | `translation_cache.json` | same folder | ~4,000 high-quality Hindi→Santali pairs |
> | `config.json` + `tokenizer_config.json` | same folder | Model configuration |
>
> ### What comes NEXT (the actual remaining work):
> The next step is **`5_quantize_models.md`** — which INT8-quantizes the existing
> ONNX files from 1.28GB → ~320MB so they can be used on Android.
>
> **Do NOT re-run data collection, Kaggle training, or ONNX export.
> Go to `d:\sih2026\plans\5_quantize_models.md` instead.**

---

## Context (Read This First)

The Android app is currently running `ai4bharat/indictrans2-indic-indic-dist-200M` (the 200M distilled model) converted to ONNX format. It runs on 2GB RAM Android 9+ devices. Your 2007-sentence dataset is already integrated as a phrase cache.

**The problem:** The 200M model gives poor translations for anything outside the healthcare domain. The fix is to fine-tune it on a much larger dataset (~15,000 sentences) and re-export it to ONNX.

**Critical constraint:** Do NOT use the 1B model. It does not fit in 2GB RAM. Fine-tune the **200M distilled version only.**

---

## Phase 1: Build the Master Dataset

Collect Hindi-Santali parallel sentence pairs from all available sources below. The final goal is a single clean JSON file mapping every Hindi sentence to its Santali translation.

### Source 1: FLORES-200 (Meta, ~1,012 pairs)

FLORES-200 is a high-quality sentence alignment dataset from Meta. It includes Hindi (`hin_Deva`) and Santali (`sat_Olck`).

**Download:** https://huggingface.co/datasets/facebook/flores

Run the following Python script to extract the Hindi-Santali pairs:

```python
from datasets import load_dataset
import json

# Load both language splits
flores_hi = load_dataset("facebook/flores", "hin_Deva", split="devtest")
flores_sat = load_dataset("facebook/flores", "sat_Olck", split="devtest")

pairs = {}
for hi_row, sat_row in zip(flores_hi, flores_sat):
    hindi = hi_row["sentence"].strip()
    santali = sat_row["sentence"].strip()
    if hindi and santali:
        pairs[hindi] = santali

print(f"Extracted {len(pairs)} FLORES pairs")
# Save
with open("flores_pairs.json", "w", encoding="utf-8") as f:
    json.dump(pairs, f, ensure_ascii=False, indent=2)
```

Also extract the `dev` split for additional sentences by repeating the above with `split="dev"`.

---

### Source 2: AI4Bharat Sangraha (Santali subset)

Sangraha is a massive high-quality Indic corpus. The Santali subset contains web-scraped Santali text. However, **it is monolingual** (only Santali, no Hindi parallel). 

Use it to build a vocabulary map — feed Santali sentences into the IndicTrans2 1B model (via the AI4Bharat API) **in reverse** (Santali → Hindi) to generate Hindi counterparts, creating synthetic Hindi-Santali pairs.

**Sangraha dataset:** https://huggingface.co/datasets/ai4bharat/sangraha

**AI4Bharat Translate API (free):** https://bhashini.gov.in/ulca/model/explore-models

```python
from datasets import load_dataset
import requests, json, time

sangraha = load_dataset("ai4bharat/sangraha", "verified", split="train")
santali_sentences = [row["text"] for row in sangraha if row["lang"] == "sat"][:5000]

def translate_sat_to_hin(text):
    """Call AI4Bharat free translation API: Santali -> Hindi"""
    url = "https://api.dhruva.ai4bharat.org/services/inference/translation"
    headers = {"Authorization": "YOUR_API_KEY"}  # Get free key at https://ai4bharat.org
    payload = {
        "input": [{"source": text}],
        "config": {
            "serviceId": "",
            "language": {"sourceLanguage": "sat", "targetLanguage": "hi"}
        }
    }
    try:
        r = requests.post(url, json=payload, headers=headers, timeout=10)
        return r.json()["output"][0]["target"]
    except:
        return None

# Generate Hindi counterparts (reverse translate)
pairs = {}
for sat_text in santali_sentences:
    hindi = translate_sat_to_hin(sat_text)
    if hindi:
        pairs[hindi] = sat_text
    time.sleep(0.2)  # Rate limit

with open("sangraha_pairs.json", "w", encoding="utf-8") as f:
    json.dump(pairs, f, ensure_ascii=False, indent=2)

print(f"Generated {len(pairs)} Sangraha pairs")
```

> **Note:** To get the free AI4Bharat API key, register at https://ai4bharat.org/indic-trans (it's free for research).

---

### Source 3: Your Existing Dataset (2,007 pairs)

Your original dataset is already formatted correctly and in use by the app. Load it directly from your training files (`data.json` / CSV from your repo).

```python
import json

with open("your_dataset.json", "r", encoding="utf-8") as f:
    existing_pairs = json.load(f)

print(f"Loaded {len(existing_pairs)} existing pairs")
```

---

### Source 4: EnSanCorp (English-Santali, ~5,930 pairs via Pivot)

EnSanCorp is an English-Santali parallel corpus (5,930 sentences). It is not publicly downloadable — contact the authors at GIET University / KIIT University via the paper:  
https://www.researchgate.net/publication/EnSanCorp

If you can get the English-Santali pairs, use this script to pivot through English → Hindi:

```python
from deep_translator import GoogleTranslator
import json, time

# Load your EnSanCorp data as a list of {"en": "...", "sat": "..."} 
with open("ensancorp.json", "r") as f:
    ensancorp = json.load(f)

translator = GoogleTranslator(source="en", target="hi")
pairs = {}
for row in ensancorp:
    try:
        hindi = translator.translate(row["en"])
        santali = row["sat"]
        if hindi and santali:
            pairs[hindi] = santali
        time.sleep(0.1)
    except Exception as e:
        print(f"Error: {e}")

with open("ensancorp_pivoted.json", "w", encoding="utf-8") as f:
    json.dump(pairs, f, ensure_ascii=False, indent=2)
```

Install: `pip install deep-translator`

---

### Step: Merge All Sources into Master Dataset

Run this after all above scripts are complete:

```python
import json
from unicodedata import normalize

def nfc(s): return normalize("NFC", s.strip())

# Load all sources
sources = [
    "flores_pairs.json",
    "sangraha_pairs.json",
    "your_dataset.json",
    "ensancorp_pivoted.json",  # Only if you got EnSanCorp
]

master = {}
for path in sources:
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        for hi, sat in data.items():
            master[nfc(hi)] = nfc(sat)
        print(f"Loaded {path}: {len(data)} pairs")
    except FileNotFoundError:
        print(f"Skipping missing file: {path}")

# Save master cache (for Android phrase cache)
with open("translation_cache.json", "w", encoding="utf-8") as f:
    json.dump(master, f, ensure_ascii=False, indent=2)

# Save as CSV (for model training)
import csv
with open("master_dataset.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["hindi", "santali"])
    writer.writeheader()
    for hi, sat in master.items():
        writer.writerow({"hindi": hi, "santali": sat})

print(f"\nMaster dataset: {len(master)} total pairs")
print("Saved: translation_cache.json and master_dataset.csv")
```

---

## Phase 2: Fine-Tuning on Kaggle (T4 GPU)

Use a **Kaggle Notebook** with **T4 GPU** (free, 16GB VRAM). Upload `master_dataset.csv` to Kaggle as a dataset before starting.

### Setup

```python
# Install dependencies (run this in Kaggle notebook first cell)
!pip install transformers datasets sentencepiece sacrebleu peft accelerate -q
```

### Training Script

```python
import torch, csv
from transformers import (
    AutoModelForSeq2SeqLM,
    AutoTokenizer,
    Seq2SeqTrainer,
    Seq2SeqTrainingArguments,
    DataCollatorForSeq2Seq,
)
from peft import LoraConfig, get_peft_model, TaskType
from datasets import Dataset

# ── 1. Load base model (200M distilled — NOT the 1B model) ──────────────────
MODEL_ID = "ai4bharat/indictrans2-indic-indic-dist-200M"
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
model     = AutoModelForSeq2SeqLM.from_pretrained(MODEL_ID, trust_remote_code=True)

# ── 2. Apply LoRA ────────────────────────────────────────────────────────────
lora_config = LoraConfig(
    task_type   = TaskType.SEQ_2_SEQ_LM,
    r           = 16,
    lora_alpha  = 32,
    target_modules = ["q_proj", "v_proj"],
    lora_dropout = 0.05,
    bias        = "none",
)
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()

# ── 3. Load dataset ──────────────────────────────────────────────────────────
SRC_LANG = "hin_Deva"
TGT_LANG = "sat_Olck"
MAX_LEN  = 128

rows = []
with open("/kaggle/input/YOUR_DATASET/master_dataset.csv", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        rows.append({"hindi": row["hindi"], "santali": row["santali"]})

dataset = Dataset.from_list(rows).train_test_split(test_size=0.05, seed=42)

def preprocess(batch):
    tokenizer.src_lang = SRC_LANG
    tokenizer.tgt_lang = TGT_LANG
    inputs  = tokenizer(batch["hindi"],   max_length=MAX_LEN, truncation=True, padding=False)
    targets = tokenizer(text_target=batch["santali"], max_length=MAX_LEN, truncation=True, padding=False)
    inputs["labels"] = targets["input_ids"]
    return inputs

tokenized = dataset.map(preprocess, batched=True, remove_columns=["hindi","santali"])

# ── 4. Training arguments ────────────────────────────────────────────────────
args = Seq2SeqTrainingArguments(
    output_dir           = "./lora-indictrans2-200m-hi-sat",
    num_train_epochs     = 5,
    per_device_train_batch_size = 16,
    gradient_accumulation_steps = 2,
    warmup_steps         = 100,
    learning_rate        = 3e-4,
    fp16                 = True,
    predict_with_generate= True,
    evaluation_strategy  = "epoch",
    save_strategy        = "epoch",
    load_best_model_at_end = True,
    logging_steps        = 50,
    report_to            = "none",
)

trainer = Seq2SeqTrainer(
    model         = model,
    args          = args,
    train_dataset = tokenized["train"],
    eval_dataset  = tokenized["test"],
    tokenizer     = tokenizer,
    data_collator = DataCollatorForSeq2Seq(tokenizer, model=model, padding=True),
)

trainer.train()
trainer.save_model("./final_lora_model")
```

---

## Phase 3: Merge LoRA Weights & Export to ONNX

Run these cells immediately after training in the same Kaggle session.

### Step A: Merge LoRA into Base Model

```python
from peft import PeftModel

base_model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_ID, trust_remote_code=True)
peft_model = PeftModel.from_pretrained(base_model, "./final_lora_model")

merged_model = peft_model.merge_and_unload()
merged_model.save_pretrained("./merged_model")
tokenizer.save_pretrained("./merged_model")
print("Merged model saved.")
```

### Step B: Export to ONNX

```python
!pip install optimum[exporters] onnx onnxruntime -q

from optimum.exporters.onnx import main_export

main_export(
    model_name_or_path = "./merged_model",
    output             = "./onnx_export",
    task               = "text2text-generation",
    opset              = 14,
    device             = "cpu",
    no_post_process    = True,
)

print("ONNX export complete. Files in ./onnx_export/")
```

### Step C: Package Everything

```python
import shutil, os

# Copy tokenizer into the ONNX folder
for fname in os.listdir("./merged_model"):
    if fname.endswith(".model") or fname.endswith(".json") or fname.endswith(".txt"):
        shutil.copy(f"./merged_model/{fname}", f"./onnx_export/{fname}")

# Zip the entire folder
shutil.make_archive("indictrans2_200m_hi_sat_onnx", "zip", "./onnx_export")
print("Done. Download: indictrans2_200m_hi_sat_onnx.zip")
```

Download `indictrans2_200m_hi_sat_onnx.zip` from the Kaggle output panel.

---

## Final Deliverables (What to Hand Over)

Provide a single `.zip` file containing the following. Do not send the raw LoRA weights — the Android team cannot use those.

```
indictrans2_200m_hi_sat_onnx.zip
│
├── encoder_model.onnx
├── decoder_model.onnx           ← required
├── decoder_model_merged.onnx    ← if generated
├── config.json
├── tokenizer_config.json
├── sentencepiece.bpe.model      ← tokenizer file, required
└── translation_cache.json       ← the 15,000+ pair master JSON
```

Upload this zip to your HuggingFace repo (`lakshay3605/SIH` or your own) and share the direct download link with the Android team.

---

## Common Errors & Fixes

| Error | Fix |
|---|---|
| `OutOfMemoryError` during training | Reduce `per_device_train_batch_size` to 8 |
| `trust_remote_code` warning | Add `trust_remote_code=True` to all `from_pretrained()` calls |
| `target_modules` LoRA error | Replace `["q_proj","v_proj"]` with `["q","v"]` |
| ONNX export fails | Try `task="seq2seq-lm"` instead of `"text2text-generation"` |
| `sentencepiece.bpe.model` missing | Manually copy it from `./merged_model` into the ONNX folder |
