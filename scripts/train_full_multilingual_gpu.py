"""
Aadivaani Cloud & GPU Training Engine: Multilingual (Hindi <-> Santali <-> Mundari).
Engineered for High-Throughput Training on NVIDIA Tesla T4 / A100 / V100 / L4 / RTX GPUs
and Google Colab / Kaggle environments.
Trains LoRA on the full 44,228+ sentence multilingual corpus:
  - hin_Deva <-> sat_Olck (Hindi <-> Santali Ol Chiki)
  - hin_Deva <-> unr_Deva (Hindi <-> Mundari Devanagari)
"""

import os
import sys
import json
import time
import argparse
import psutil
from typing import Dict, List, Optional

# Ensure UTF-8 output
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

try:
    import torch.distributed.tensor
except Exception:
    pass

from transformers import (
    AutoModelForSeq2SeqLM,
    AutoTokenizer,
    get_cosine_schedule_with_warmup,
    PreTrainedTokenizer
)
from peft import LoraConfig, get_peft_model, TaskType, PeftModel

from src.script_validator import normalize_text


class CloudMultilingualDataset(Dataset):
    """Memory-efficient PyTorch Dataset for large-scale multilingual corpora."""
    def __init__(self, jsonl_path: str, max_samples: Optional[int] = None):
        self.samples = []
        if not os.path.exists(jsonl_path):
            raise FileNotFoundError(f"Corpus not found: {jsonl_path}")

        print(f"Loading corpus from {jsonl_path}...")
        with open(jsonl_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    item = json.loads(line)
                    src_l = item.get("source_lang", "hin_Deva")
                    tgt_l = item.get("target_lang", "sat_Olck")
                    if src_l in ("mun_Deva", "mundari"):
                        src_l = "unr_Deva"
                    if tgt_l in ("mun_Deva", "mundari"):
                        tgt_l = "unr_Deva"

                    s_text = normalize_text(item.get("source_text") or item.get("hindi", ""))
                    t_text = normalize_text(item.get("target_text") or item.get("santali", ""))

                    if s_text and t_text:
                        self.samples.append({
                            "source_lang": src_l,
                            "target_lang": tgt_l,
                            "source_text": s_text,
                            "target_text": t_text
                        })
                    if max_samples and len(self.samples) >= max_samples:
                        break
        print(f"Loaded {len(self.samples)} valid multilingual pairs.")

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Dict[str, str]:
        return self.samples[idx]


def build_gpu_collate_fn(tokenizer: PreTrainedTokenizer, max_len: int = 128):
    def collate_fn(batch: List[Dict[str, str]]) -> Dict[str, torch.Tensor]:
        src_texts = []
        tgt_texts = []

        is_indictrans = (
            type(tokenizer).__name__ == "IndicTransTokenizer"
            or hasattr(tokenizer, "add_new_language_tags")
            or "indictrans" in getattr(tokenizer, "name_or_path", "").lower()
        )

        for item in batch:
            s_lang = item["source_lang"]
            t_lang = item["target_lang"]
            s_text = item["source_text"]
            t_text = item["target_text"]

            if is_indictrans or not s_text.startswith(s_lang):
                src_formatted = f"{s_lang} {t_lang} {s_text}"
            else:
                src_formatted = s_text

            src_texts.append(src_formatted)
            tgt_texts.append(t_text)

        inputs = tokenizer(
            src_texts,
            padding=True,
            truncation=True,
            max_length=max_len,
            return_tensors="pt"
        )

        targets = tokenizer(
            text_target=tgt_texts,
            padding=True,
            truncation=True,
            max_length=max_len,
            return_tensors="pt"
        )

        labels = targets["input_ids"].clone()
        pad_id = tokenizer.pad_token_id if tokenizer.pad_token_id is not None else 1
        labels[labels == pad_id] = -100

        return {
            "input_ids": inputs["input_ids"],
            "attention_mask": inputs["attention_mask"],
            "labels": labels
        }
    return collate_fn


def run_gpu_training(
    model_id: str = "ai4bharat/indictrans2-indic-indic-dist-320M",
    train_path: str = "data/processed/full_multilingual_corpus.jsonl",
    val_path: str = "data/processed/val_multilingual.jsonl",
    output_dir: str = "models/checkpoints/best_multilingual_lora_gpu",
    epochs: int = 5,
    batch_size: int = 16,
    grad_accum_steps: int = 2,
    lr: float = 4e-4,
    lora_r: int = 32,
    lora_alpha: int = 64,
    lora_dropout: float = 0.05,
    max_len: int = 128,
    bf16: bool = False
):
    print("=" * 80)
    print(" AADIVAANI CLOUD GPU MULTILINGUAL TRAINING ENGINE ")
    print("=" * 80)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    cuda_avail = torch.cuda.is_available()
    vram = (torch.cuda.get_device_properties(0).total_memory / (1024**3)) if cuda_avail else 0.0
    device_name = torch.cuda.get_device_name(0) if cuda_avail else "CPU Fallback"

    print(f"Device:           {device_name} ({vram:.2f} GB VRAM)" if cuda_avail else "Device: CPU")
    print(f"Base Model:       {model_id}")
    print(f"Corpus:           {train_path}")
    print(f"Batch Size:       {batch_size} (effective: {batch_size * grad_accum_steps})")
    print(f"Epochs:           {epochs} | Learning Rate: {lr}")
    print(f"LoRA Rank (r):    {lora_r} | Alpha: {lora_alpha}")
    print(f"Output Checkpoint: {output_dir}")
    print("=" * 80)

    os.makedirs(output_dir, exist_ok=True)

    # 1. Tokenizer
    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token or "<pad>"

    # 2. Base Model
    dtype = torch.bfloat16 if (cuda_avail and bf16 and torch.cuda.is_bf16_supported()) else (torch.float16 if cuda_avail else torch.float32)
    base_model = AutoModelForSeq2SeqLM.from_pretrained(
        model_id,
        trust_remote_code=True,
        torch_dtype=dtype
    )

    # 3. LoRA
    lora_cfg = LoraConfig(
        task_type=TaskType.SEQ_2_SEQ_LM,
        r=lora_r,
        lora_alpha=lora_alpha,
        lora_dropout=lora_dropout,
        target_modules=["q_proj", "v_proj", "k_proj", "out_proj"],
        bias="none"
    )
    model = get_peft_model(base_model, lora_cfg)
    model.to(device)
    model.print_trainable_parameters()

    # 4. Data
    collate = build_gpu_collate_fn(tokenizer, max_len=max_len)
    train_ds = CloudMultilingualDataset(train_path)
    val_ds = CloudMultilingualDataset(val_path)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, collate_fn=collate)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, collate_fn=collate)

    # 5. Optimization
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=0.01)
    total_steps = (len(train_loader) // max(1, grad_accum_steps)) * epochs
    warmup_steps = max(10, int(total_steps * 0.05))
    scheduler = get_cosine_schedule_with_warmup(optimizer, num_warmup_steps=warmup_steps, num_training_steps=total_steps)
    scaler = torch.amp.GradScaler("cuda", enabled=cuda_avail and not bf16)

    # 6. Training Loop
    best_loss = float("inf")
    history = []
    start_t = time.time()

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        step_loss = 0.0
        optimizer.zero_grad()

        for step, batch in enumerate(train_loader, 1):
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            with torch.autocast(device_type="cuda" if cuda_avail else "cpu", dtype=dtype, enabled=cuda_avail):
                outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
                loss = outputs.loss / grad_accum_steps

            if cuda_avail and not bf16:
                scaler.scale(loss).backward()
            else:
                loss.backward()

            train_loss += outputs.loss.item()
            step_loss += outputs.loss.item()

            if step % grad_accum_steps == 0 or step == len(train_loader):
                if cuda_avail and not bf16:
                    scaler.unscale_(optimizer)
                    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                    scaler.step(optimizer)
                    scaler.update()
                else:
                    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                    optimizer.step()

                scheduler.step()
                optimizer.zero_grad()

            if step % 200 == 0:
                print(f"Epoch {epoch}/{epochs} | Step {step}/{len(train_loader)} | Loss: {step_loss/200:.4f}")
                step_loss = 0.0

        avg_train = train_loss / max(1, len(train_loader))

        # Evaluation
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                labels = batch["labels"].to(device)
                with torch.autocast(device_type="cuda" if cuda_avail else "cpu", dtype=dtype, enabled=cuda_avail):
                    outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
                    val_loss += outputs.loss.item()

        avg_val = val_loss / max(1, len(val_loader))
        print(f"--> Epoch {epoch} Done: Train Loss={avg_train:.4f}, Val Loss={avg_val:.4f}")

        history.append({"epoch": epoch, "train_loss": avg_train, "val_loss": avg_val})

        if avg_val < best_loss:
            best_loss = avg_val
            print(f"  [Checkpoint] Saving new best model to {output_dir}")
            model.save_pretrained(output_dir)
            tokenizer.save_pretrained(output_dir)

    total_time = round(time.time() - start_t, 2)
    print("=" * 80)
    print(f"TRAINING COMPLETED in {total_time}s | Best Val Loss: {best_loss:.4f}")
    print(f"LoRA Artifacts saved to: {output_dir}")
    print("=" * 80)

    with open(os.path.join(output_dir, "training_history.json"), "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model_id", type=str, default="ai4bharat/indictrans2-indic-indic-dist-320M")
    parser.add_argument("--train_path", type=str, default="data/processed/full_multilingual_corpus.jsonl")
    parser.add_argument("--val_path", type=str, default="data/processed/val_multilingual.jsonl")
    parser.add_argument("--output_dir", type=str, default="models/checkpoints/best_multilingual_lora_gpu")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch_size", type=int, default=16)
    parser.add_argument("--grad_accum", type=int, default=2)
    parser.add_argument("--lr", type=float, default=4e-4)
    parser.add_argument("--lora_r", type=int, default=32)
    parser.add_argument("--lora_alpha", type=int, default=64)
    parser.add_argument("--bf16", action="store_true")
    args = parser.parse_args()

    run_gpu_training(
        model_id=args.model_id,
        train_path=args.train_path,
        val_path=args.val_path,
        output_dir=args.output_dir,
        epochs=args.epochs,
        batch_size=args.batch_size,
        grad_accum_steps=args.grad_accum,
        lr=args.lr,
        lora_r=args.lora_r,
        lora_alpha=args.lora_alpha,
        bf16=args.bf16
    )
