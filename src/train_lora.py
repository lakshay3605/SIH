"""
Aadivaani Real Training Pipeline: Hindi (hin_Deva) -> Santali (sat_Olck).
Fully compatible with IndicTrans2 (ai4bharat/indictrans2-indic-indic-dist-320M)
and standard Seq2Seq Transformer architectures.
Formats source sentences as: "hin_Deva sat_Olck <Hindi sentence>".
Uses genuine PyTorch + PEFT/LoRA training with FP16 AMP support for Tesla T4 GPU.
"""

import os
import sys
import json
import time
import math
import types
import argparse
import psutil
from typing import Dict, List, Optional, Tuple

# Ensure UTF-8 output on Windows console
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import torch
import torch.nn as nn

# Explicitly import torch.distributed.tensor for PEFT compatibility
try:
    import torch.distributed.tensor
except Exception:
    pass

from torch.utils.data import Dataset, DataLoader
from transformers import (
    AutoModelForSeq2SeqLM,
    AutoTokenizer,
    get_linear_schedule_with_warmup,
    PreTrainedTokenizer
)
from peft import LoraConfig, get_peft_model, TaskType, PeftModel

from src.script_validator import normalize_text


class ParallelTranslationDataset(Dataset):
    """
    Pure PyTorch Dataset for parallel translation.
    Avoids third-party C-extension dependencies to guarantee Windows/Linux portability.
    """
    def __init__(self, jsonl_path: str, max_samples: Optional[int] = None):
        self.samples = []
        if not os.path.exists(jsonl_path):
            raise FileNotFoundError(f"Dataset file not found: {jsonl_path}")

        with open(jsonl_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    item = json.loads(line)
                    h = normalize_text(item.get("hindi", ""))
                    s = normalize_text(item.get("santali", ""))
                    if h and s:
                        self.samples.append({"hindi": h, "santali": s})
                    if max_samples and len(self.samples) >= max_samples:
                        break

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Dict[str, str]:
        return self.samples[idx]


def build_collate_fn(
    tokenizer: PreTrainedTokenizer,
    src_lang: str = "hin_Deva",
    tgt_lang: str = "sat_Olck",
    max_src_len: int = 128,
    max_tgt_len: int = 128
):
    """
    Constructs dynamic padding collation function formatted specifically for IndicTrans2.
    Ensures every Hindi source sentence is prefixed as:
        hin_Deva sat_Olck <Hindi sentence>
    Uses the correct IndicTrans2 tokenizer behavior for target Santali text (text_target=...).
    Masks padding tokens with -100 for proper cross-entropy loss computation.
    """
    def collate_fn(batch: List[Dict[str, str]]) -> Dict[str, torch.Tensor]:
        src_texts = []
        tgt_texts = []

        is_indictrans = (
            type(tokenizer).__name__ == "IndicTransTokenizer"
            or hasattr(tokenizer, "add_new_language_tags")
            or "indictrans" in getattr(tokenizer, "name_or_path", "").lower()
        )

        for item in batch:
            h = item["hindi"].strip()
            s = item["santali"].strip()

            # Format source: hin_Deva sat_Olck <Hindi sentence>
            if is_indictrans or not h.startswith(src_lang):
                src_formatted = f"{src_lang} {tgt_lang} {h}"
            else:
                src_formatted = h

            src_texts.append(src_formatted)
            tgt_texts.append(s)

        # Source input tokenization
        inputs = tokenizer(
            src_texts,
            padding=True,
            truncation=True,
            max_length=max_src_len,
            return_tensors="pt"
        )

        # Target tokenization via text_target
        targets = tokenizer(
            text_target=tgt_texts,
            padding=True,
            truncation=True,
            max_length=max_tgt_len,
            return_tensors="pt"
        )

        # Mask padding tokens in labels with -100
        labels = targets["input_ids"].clone()
        pad_token_id = tokenizer.pad_token_id if tokenizer.pad_token_id is not None else 1
        labels[labels == pad_token_id] = -100

        return {
            "input_ids": inputs["input_ids"],
            "attention_mask": inputs["attention_mask"],
            "labels": labels
        }

    return collate_fn


def perform_preflight_check(model_id: str, batch_size: int) -> Dict:
    """
    Verifies hardware, memory, and model accessibility before allocating training resources.
    """
    ram = psutil.virtual_memory()
    available_ram_gb = ram.available / (1024 ** 3)
    total_ram_gb = ram.total / (1024 ** 3)
    cuda_available = torch.cuda.is_available()

    gpu_name = torch.cuda.get_device_name(0) if cuda_available else "None (CPU)"
    vram_gb = (torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)) if cuda_available else 0.0

    print("=" * 75)
    print("AADIVAANI PRE-FLIGHT HARDWARE & ENVIRONMENT AUDIT")
    print("=" * 75)
    print(f"Target Base Model : {model_id}")
    print(f"Host Total RAM    : {total_ram_gb:.2f} GB")
    print(f"Host Available RAM: {available_ram_gb:.2f} GB")
    print(f"CUDA Available    : {cuda_available}")
    print(f"Compute Device    : {gpu_name}")
    if cuda_available:
        print(f"Dedicated VRAM    : {vram_gb:.2f} GB (FP16 AMP Supported)")
    else:
        print(f"PyTorch CPU Cores : {torch.get_num_threads()} threads (FP32 Mode)")
    print("=" * 75)

    return {
        "cuda_available": cuda_available,
        "available_ram_gb": available_ram_gb,
        "gpu_name": gpu_name,
        "vram_gb": vram_gb
    }


def train_lora(
    model_id: str = "ai4bharat/indictrans2-indic-indic-dist-320M",
    train_path: str = "data/processed/train.jsonl",
    val_path: str = "data/processed/validation.jsonl",
    output_dir: str = "models/checkpoints/best_lora",
    epochs: int = 3,
    batch_size: int = 4,
    grad_accum_steps: int = 4,
    learning_rate: float = 3e-4,
    lora_r: int = 16,
    lora_alpha: int = 32,
    lora_dropout: float = 0.05,
    max_src_len: int = 128,
    max_tgt_len: int = 128,
    seed: int = 42,
    resume_from: Optional[str] = None,
    max_train_samples: Optional[int] = None,
    max_val_samples: Optional[int] = None,
    dry_run: bool = False
) -> Dict:
    """
    Executes real Seq2Seq LoRA fine-tuning loop using PyTorch & HuggingFace Transformers.
    Supports FP16 mixed precision with AMP on NVIDIA Tesla T4 and CPU FP32 fallback.
    """
    torch.manual_seed(seed)
    os.makedirs(output_dir, exist_ok=True)

    # 1. Preflight audit
    hw_info = perform_preflight_check(model_id, batch_size)
    device = torch.device("cuda" if hw_info["cuda_available"] else "cpu")
    use_fp16 = hw_info["cuda_available"] # FP16 on Tesla T4 / CUDA GPUs

    # 2. Load Tokenizer
    print(f"\n[Step 1/5] Loading Tokenizer for '{model_id}'...")
    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token or "<pad>"

    # 3. Load Base Model
    print(f"\n[Step 2/5] Loading Base Model '{model_id}'...")
    model_dtype = torch.float16 if use_fp16 else torch.float32
    base_model = AutoModelForSeq2SeqLM.from_pretrained(
        model_id,
        trust_remote_code=True,
        torch_dtype=model_dtype
    )

    # 4. Apply LoRA Adapter
    print(f"\n[Step 3/5] Configuring LoRA Adapter (r={lora_r}, alpha={lora_alpha})...")
    lora_config = LoraConfig(
        task_type=TaskType.SEQ_2_SEQ_LM,
        r=lora_r,
        lora_alpha=lora_alpha,
        lora_dropout=lora_dropout,
        target_modules=["q_proj", "v_proj"],
        bias="none"
    )

    if resume_from and os.path.exists(os.path.join(resume_from, "adapter_model.safetensors")):
        print(f"Resuming LoRA weights from {resume_from}...")
        model = PeftModel.from_pretrained(base_model, resume_from, is_trainable=True)
    else:
        model = get_peft_model(base_model, lora_config)

    model.to(device)
    model.print_trainable_parameters()

    # 5. Prepare DataLoaders with IndicTrans Collation
    print(f"\n[Step 4/5] Building DataLoaders from '{train_path}' and '{val_path}'...")
    train_ds = ParallelTranslationDataset(train_path, max_samples=max_train_samples)
    val_ds = ParallelTranslationDataset(val_path, max_samples=max_val_samples)

    collate_fn = build_collate_fn(
        tokenizer,
        src_lang="hin_Deva",
        tgt_lang="sat_Olck",
        max_src_len=max_src_len,
        max_tgt_len=max_tgt_len
    )

    train_loader = DataLoader(
        train_ds,
        batch_size=batch_size,
        shuffle=True,
        collate_fn=collate_fn
    )
    val_loader = DataLoader(
        val_ds,
        batch_size=batch_size,
        shuffle=False,
        collate_fn=collate_fn
    )

    print(f"Train samples: {len(train_ds)} ({len(train_loader)} batches)")
    print(f"Validation samples: {len(val_ds)} ({len(val_loader)} batches)")

    # 6. Optimizer, Scheduler, and FP16 GradScaler
    optimizer = torch.optim.AdamW(
        [p for p in model.parameters() if p.requires_grad],
        lr=learning_rate,
        weight_decay=0.01
    )
    total_steps = (len(train_loader) // max(1, grad_accum_steps)) * epochs
    warmup_steps = max(1, int(total_steps * 0.10))
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=warmup_steps,
        num_training_steps=max(1, total_steps)
    )

    # FP16 GradScaler for Tesla T4 GPU
    scaler = torch.amp.GradScaler("cuda", enabled=use_fp16)

    # 7. Real Training Loop
    print(f"\n[Step 5/5] Commencing Real Training Loop ({epochs} epochs, FP16={use_fp16})...")
    training_history = []
    best_val_loss = float("inf")
    start_time = time.time()

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss_accum = 0.0
        optimizer.zero_grad()
        epoch_start = time.time()
        step_count = 0

        for step, batch in enumerate(train_loader, 1):
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            # Autocast FP16 on Tesla T4
            with torch.autocast(device_type="cuda" if use_fp16 else "cpu", dtype=torch.float16 if use_fp16 else torch.float32, enabled=use_fp16):
                outputs = model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    labels=labels
                )
                loss = outputs.loss / grad_accum_steps

            if use_fp16:
                scaler.scale(loss).backward()
            else:
                loss.backward()

            train_loss_accum += outputs.loss.item()
            step_count += 1

            if step % grad_accum_steps == 0 or step == len(train_loader):
                if use_fp16:
                    scaler.unscale_(optimizer)
                    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
                    scaler.step(optimizer)
                    scaler.update()
                else:
                    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
                    optimizer.step()

                scheduler.step()
                optimizer.zero_grad()

            if dry_run and step >= 2:
                print("  [DRY-RUN MODE] Completed 2 test batches successfully.")
                break

        avg_train_loss = train_loss_accum / max(1, step_count)

        # Real Validation phase
        model.eval()
        val_loss_accum = 0.0
        val_steps = 0
        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                labels = batch["labels"].to(device)

                with torch.autocast(device_type="cuda" if use_fp16 else "cpu", dtype=torch.float16 if use_fp16 else torch.float32, enabled=use_fp16):
                    outputs = model(
                        input_ids=input_ids,
                        attention_mask=attention_mask,
                        labels=labels
                    )
                val_loss_accum += outputs.loss.item()
                val_steps += 1
                if dry_run and val_steps >= 2:
                    break

        avg_val_loss = val_loss_accum / max(1, val_steps)
        epoch_duration = round(time.time() - epoch_start, 2)

        print(f"Epoch {epoch}/{epochs} | Real Train Loss: {avg_train_loss:.4f} | Real Val Loss: {avg_val_loss:.4f} | Duration: {epoch_duration}s")

        log_entry = {
            "epoch": epoch,
            "train_loss": round(avg_train_loss, 4),
            "val_loss": round(avg_val_loss, 4),
            "duration_sec": epoch_duration
        }
        training_history.append(log_entry)

        # Save checkpoint if best or during dry run
        if avg_val_loss < best_val_loss or dry_run:
            best_val_loss = avg_val_loss
            print(f"  -> Saving best model checkpoint to '{output_dir}'...")
            model.save_pretrained(output_dir)
            tokenizer.save_pretrained(output_dir)

            with open(os.path.join(output_dir, "training_args.json"), "w", encoding="utf-8") as f:
                json.dump({
                    "model_id": model_id,
                    "epochs": epochs,
                    "batch_size": batch_size,
                    "grad_accum_steps": grad_accum_steps,
                    "learning_rate": learning_rate,
                    "lora_r": lora_r,
                    "lora_alpha": lora_alpha,
                    "best_epoch": epoch,
                    "best_val_loss": round(best_val_loss, 4),
                    "device": str(device),
                    "fp16": use_fp16
                }, f, indent=2)

        if dry_run:
            break

    total_training_time = round(time.time() - start_time, 2)
    print("=" * 75)
    print(f"TRAINING COMPLETE in {total_training_time}s | Best Val Loss: {best_val_loss:.4f}")
    print(f"Real model artifacts saved to: {output_dir}")
    print("=" * 75)

    history_path = os.path.join(output_dir, "training_history.json")
    with open(history_path, "w", encoding="utf-8") as f:
        json.dump(training_history, f, indent=2)

    return {
        "best_val_loss": best_val_loss,
        "total_time_sec": total_training_time,
        "history": training_history,
        "output_dir": output_dir
    }


def parse_args():
    parser = argparse.ArgumentParser(description="Aadivaani IndicTrans2 LoRA Training Pipeline")
    parser.add_argument("--model_id", type=str, default="ai4bharat/indictrans2-indic-indic-dist-320M", help="Hugging Face Model ID or local model path")
    parser.add_argument("--train_path", type=str, default="data/processed/train.jsonl")
    parser.add_argument("--val_path", type=str, default="data/processed/validation.jsonl")
    parser.add_argument("--output_dir", type=str, default="models/checkpoints/best_lora")
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch_size", type=int, default=4)
    parser.add_argument("--grad_accum", type=int, default=4)
    parser.add_argument("--lr", type=float, default=3e-4)
    parser.add_argument("--lora_r", type=int, default=16)
    parser.add_argument("--lora_alpha", type=int, default=32)
    parser.add_argument("--resume_from", type=str, default=None)
    parser.add_argument("--max_train_samples", type=int, default=None)
    parser.add_argument("--max_val_samples", type=int, default=None)
    parser.add_argument("--dry_run", action="store_true", help="Execute 2 steps to verify pipeline mechanics without full epoch training")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    train_lora(
        model_id=args.model_id,
        train_path=args.train_path,
        val_path=args.val_path,
        output_dir=args.output_dir,
        epochs=args.epochs,
        batch_size=args.batch_size,
        grad_accum_steps=args.grad_accum,
        learning_rate=args.lr,
        lora_r=args.lora_r,
        lora_alpha=args.lora_alpha,
        resume_from=args.resume_from,
        max_train_samples=args.max_train_samples,
        max_val_samples=args.max_val_samples,
        dry_run=args.dry_run
    )
