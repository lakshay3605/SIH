"""
Supervised Fine-Tuning Script for IndicTrans2 (Hindi -> Santali sat_Olck).
Implements pure PyTorch LoRA on CPU. Optimized for AMD Ryzen 5 5600H (12 threads).
"""

import os
import sys
import json
import time
import math
import argparse
import random
import psutil
from typing import List, Dict, Any, Tuple

# Force unbuffered output so logs appear in real-time
os.environ['PYTHONUNBUFFERED'] = '1'

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, get_linear_schedule_with_warmup

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.translation.processor import IndicProcessor
from src.dataset.metrics import evaluate_predictions

sys.stdout.reconfigure(encoding="utf-8")


def log(msg: str):
    """Print with immediate flush for live log visibility."""
    print(msg, flush=True)


# ---------------------------------------------------------------------------
# Custom Pure PyTorch LoRA Layer (avoids peft torch.distributed.tensor bug)
# ---------------------------------------------------------------------------
class LoRALinear(nn.Module):
    def __init__(self, base_layer: nn.Linear, r: int = 16, lora_alpha: int = 32, lora_dropout: float = 0.05):
        super().__init__()
        self.base_layer = base_layer
        self.base_layer.weight.requires_grad = False
        if self.base_layer.bias is not None:
            self.base_layer.bias.requires_grad = False

        self.r = r
        self.lora_alpha = lora_alpha
        self.scaling = lora_alpha / r
        self.lora_A = nn.Linear(base_layer.in_features, r, bias=False)
        self.lora_B = nn.Linear(r, base_layer.out_features, bias=False)
        self.dropout = nn.Dropout(p=lora_dropout)

        nn.init.kaiming_uniform_(self.lora_A.weight, a=math.sqrt(5))
        nn.init.zeros_(self.lora_B.weight)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.base_layer(x) + self.lora_B(self.lora_A(self.dropout(x))) * self.scaling


def apply_lora_to_model(
    model: nn.Module,
    target_modules: List[str] = ["q_proj", "v_proj"],
    r: int = 16,
    lora_alpha: int = 32,
    lora_dropout: float = 0.05
) -> Tuple[nn.Module, int, int]:
    for param in model.parameters():
        param.requires_grad = False

    replaced_count = 0
    for name, module in model.named_modules():
        for child_name, child in module.named_children():
            if any(target in child_name for target in target_modules) and isinstance(child, nn.Linear):
                setattr(module, child_name, LoRALinear(child, r=r, lora_alpha=lora_alpha, lora_dropout=lora_dropout))
                replaced_count += 1

    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_params = sum(p.numel() for p in model.parameters())
    return model, trainable_params, total_params


# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------
class TranslationDataset(Dataset):
    def __init__(
        self,
        file_path: str,
        tokenizer: AutoTokenizer,
        indic_processor: IndicProcessor,
        max_source_length: int = 128,
        max_target_length: int = 128,
        src_lang: str = "hin_Deva",
        tgt_lang: str = "sat_Olck"
    ):
        self.records = []
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    self.records.append(json.loads(line.strip()))

        self.tokenizer = tokenizer
        self.ip = indic_processor
        self.max_source_length = max_source_length
        self.max_target_length = max_target_length
        self.src_lang = src_lang
        self.tgt_lang = tgt_lang

        raw_sources = [r["source_text"] for r in self.records]
        raw_targets = [r["target_text"] for r in self.records]

        self.proc_sources = self.ip.preprocess_batch(raw_sources, src_lang=src_lang, tgt_lang=tgt_lang)
        self.proc_targets = self.ip.preprocess_batch(raw_targets, src_lang=tgt_lang, tgt_lang=tgt_lang)

    def __len__(self) -> int:
        return len(self.records)

    def __getitem__(self, idx: int) -> Dict[str, Any]:
        return {
            "source_text": self.records[idx]["source_text"],
            "target_text": self.records[idx]["target_text"],
            "proc_source": self.proc_sources[idx],
            "proc_target": self.proc_targets[idx],
        }


def collate_fn(batch, tokenizer, max_source_length=128, max_target_length=128):
    proc_sources = [item["proc_source"] for item in batch]
    proc_targets = [item["proc_target"] for item in batch]

    inputs = tokenizer(proc_sources, padding=True, truncation=True,
                       max_length=max_source_length, return_tensors="pt")
    targets = tokenizer(text_target=proc_targets, padding=True, truncation=True,
                        max_length=max_target_length, return_tensors="pt")

    labels = targets["input_ids"].clone()
    labels[labels == tokenizer.pad_token_id] = -100

    return {
        "input_ids": inputs["input_ids"],
        "attention_mask": inputs["attention_mask"],
        "labels": labels
    }


def save_checkpoint(model, tokenizer, output_dir, metadata):
    os.makedirs(output_dir, exist_ok=True)
    lora_state_dict = {name: param.cpu().data
                       for name, param in model.named_parameters() if param.requires_grad}
    torch.save(lora_state_dict, os.path.join(output_dir, "adapter_weights.pt"))
    with open(os.path.join(output_dir, "training_metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    tokenizer.save_pretrained(output_dir)
    log(f"  [SAVED] Checkpoint: {output_dir}")


def main():
    parser = argparse.ArgumentParser(description="Fine-tune IndicTrans2 for Hindi -> Santali")
    parser.add_argument("--model", type=str, default="ai4bharat/indictrans2-indic-indic-1B")
    parser.add_argument("--train_file", type=str, default="data/processed/train.jsonl")
    parser.add_argument("--validation_file", type=str, default="data/processed/validation.jsonl")
    parser.add_argument("--output_dir", type=str, default="models/finetuned")
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--learning_rate", type=float, default=1e-4)
    parser.add_argument("--batch_size", type=int, default=4)
    parser.add_argument("--gradient_accumulation_steps", type=int, default=4)
    parser.add_argument("--max_source_length", type=int, default=128)
    parser.add_argument("--max_target_length", type=int, default=128)
    parser.add_argument("--warmup_ratio", type=float, default=0.10)
    parser.add_argument("--weight_decay", type=float, default=0.01)
    parser.add_argument("--lora_r", type=int, default=16)
    parser.add_argument("--lora_alpha", type=int, default=32)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--num_threads", type=int, default=12,
                        help="PyTorch CPU threads (use all Ryzen cores)")
    args = parser.parse_args()

    # 1. Use all CPU threads
    torch.set_num_threads(args.num_threads)
    log(f"PyTorch num_threads set to {args.num_threads}")

    # 2. Determinism
    random.seed(args.seed)
    torch.manual_seed(args.seed)

    log("=" * 80)
    log("PHASE 4: SUPERVISED FINE-TUNING — IndicTrans2 (Hindi -> Santali sat_Olck)")
    log("=" * 80)
    log(f"Base Model              : {args.model}")
    log(f"Train File              : {args.train_file}")
    log(f"Validation File         : {args.validation_file}")
    log(f"Output Directory        : {args.output_dir}")
    log(f"Epochs                  : {args.epochs}")
    log(f"Learning Rate           : {args.learning_rate}")
    log(f"Batch Size (Per Device) : {args.batch_size}")
    log(f"Grad Accumulation Steps : {args.gradient_accumulation_steps} (Eff. Batch = {args.batch_size * args.gradient_accumulation_steps})")
    log(f"LoRA r / alpha          : r={args.lora_r}, alpha={args.lora_alpha}")
    cpu_info = f"{psutil.cpu_count(logical=True)} logical threads"
    ram_avail = psutil.virtual_memory().available / (1024**3)
    log(f"Hardware                : CPU ({cpu_info}), {ram_avail:.2f} GB RAM available")
    log("=" * 80)

    # 3. Load Tokenizer & Processor
    log("\n[Step 1/5] Loading Tokenizer and IndicProcessor...")
    tokenizer = AutoTokenizer.from_pretrained(args.model, trust_remote_code=True)
    ip_train = IndicProcessor(inference=False)
    ip_eval = IndicProcessor(inference=True)
    log(f"  Tokenizer loaded. RAM: {psutil.Process().memory_info().rss/(1024**2):.0f} MB")

    # 4. Load Model & Apply LoRA
    log("\n[Step 2/5] Loading Base Model...")
    t_load = time.time()
    model = AutoModelForSeq2SeqLM.from_pretrained(args.model, trust_remote_code=True, torch_dtype=torch.float32)
    log(f"  Model loaded in {time.time()-t_load:.1f}s. RAM: {psutil.Process().memory_info().rss/(1024**2):.0f} MB")

    log("  Injecting LoRA adapters (q_proj, v_proj)...")
    model, trainable_params, total_params = apply_lora_to_model(
        model, target_modules=["q_proj", "v_proj"],
        r=args.lora_r, lora_alpha=args.lora_alpha
    )
    log(f"  Trainable params : {trainable_params:,} / {total_params:,} ({trainable_params/total_params*100:.3f}%)")
    log(f"  RAM after LoRA   : {psutil.Process().memory_info().rss/(1024**2):.0f} MB")

    # 5. Prepare Datasets
    log("\n[Step 3/5] Building DataLoaders...")
    t_data = time.time()
    train_dataset = TranslationDataset(args.train_file, tokenizer, ip_train,
                                       args.max_source_length, args.max_target_length)
    val_dataset = TranslationDataset(args.validation_file, tokenizer, ip_eval,
                                     args.max_source_length, args.max_target_length)
    log(f"  Datasets built in {time.time()-t_data:.1f}s")
    log(f"  Train samples: {len(train_dataset)} | Val samples: {len(val_dataset)}")

    def _collate(b):
        return collate_fn(b, tokenizer, args.max_source_length, args.max_target_length)

    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True, collate_fn=_collate)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size * 2, shuffle=False, collate_fn=_collate)
    log(f"  Train batches: {len(train_loader)} | Val batches: {len(val_loader)}")

    # 6. Optimizer & Scheduler
    trainable_params_list = [p for p in model.parameters() if p.requires_grad]
    optimizer = torch.optim.AdamW(trainable_params_list, lr=args.learning_rate, weight_decay=args.weight_decay)
    total_update_steps = (len(train_loader) // args.gradient_accumulation_steps) * args.epochs
    warmup_steps = int(total_update_steps * args.warmup_ratio)
    scheduler = get_linear_schedule_with_warmup(optimizer, num_warmup_steps=warmup_steps,
                                                num_training_steps=total_update_steps)
    log(f"  Optimizer: AdamW | Total Update Steps: {total_update_steps} | Warmup: {warmup_steps}")

    # 7. Training Loop
    log("\n[Step 4/5] Starting Supervised Fine-Tuning...")
    training_logs = []
    best_val_loss = float("inf")
    best_epoch = -1

    os.makedirs("outputs/training_logs", exist_ok=True)
    os.makedirs(args.output_dir, exist_ok=True)

    start_time_all = time.time()

    for epoch in range(1, args.epochs + 1):
        epoch_start_time = time.time()
        model.train()
        total_train_loss = 0.0
        optimizer.zero_grad()

        log(f"\n{'='*60}")
        log(f"  EPOCH {epoch}/{args.epochs} — Starting")
        log(f"{'='*60}")

        for step, batch in enumerate(train_loader):
            input_ids = batch["input_ids"]
            attention_mask = batch["attention_mask"]
            labels = batch["labels"]

            outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
            loss = outputs.loss / args.gradient_accumulation_steps
            loss.backward()

            total_train_loss += outputs.loss.item()

            if (step + 1) % args.gradient_accumulation_steps == 0 or (step + 1) == len(train_loader):
                torch.nn.utils.clip_grad_norm_(trainable_params_list, max_norm=1.0)
                optimizer.step()
                scheduler.step()
                optimizer.zero_grad()

            # Report every 10 steps
            if (step + 1) % 10 == 0 or (step + 1) == len(train_loader):
                elapsed = time.time() - epoch_start_time
                avg_step_loss = total_train_loss / (step + 1)
                steps_remaining = len(train_loader) - (step + 1)
                eta_sec = (elapsed / (step + 1)) * steps_remaining
                current_lr = scheduler.get_last_lr()[0]
                ram_mb = psutil.Process().memory_info().rss / (1024 * 1024)
                log(f"  Ep{epoch} Step {step+1:>4}/{len(train_loader)} | "
                    f"Loss: {avg_step_loss:.4f} | LR: {current_lr:.2e} | "
                    f"Elapsed: {elapsed/60:.1f}m | ETA: {eta_sec/60:.1f}m | "
                    f"RAM: {ram_mb:.0f}MB")

        avg_train_loss = total_train_loss / len(train_loader)

        # Validation Loss
        log(f"\n  Running validation...")
        model.eval()
        total_val_loss = 0.0
        with torch.no_grad():
            for vbatch in val_loader:
                val_out = model(input_ids=vbatch["input_ids"],
                                attention_mask=vbatch["attention_mask"],
                                labels=vbatch["labels"])
                total_val_loss += val_out.loss.item()

        avg_val_loss = total_val_loss / len(val_loader)
        epoch_duration = time.time() - epoch_start_time
        peak_ram_mb = psutil.Process().memory_info().rss / (1024 * 1024)

        log(f"\n  EPOCH {epoch} SUMMARY:")
        log(f"    Train Loss : {avg_train_loss:.4f}")
        log(f"    Val Loss   : {avg_val_loss:.4f}")
        log(f"    Duration   : {epoch_duration/60:.1f} min")
        log(f"    RAM Usage  : {peak_ram_mb:.0f} MB")

        log_entry = {
            "epoch": epoch,
            "train_loss": round(avg_train_loss, 4),
            "val_loss": round(avg_val_loss, 4),
            "learning_rate": scheduler.get_last_lr()[0],
            "epoch_duration_seconds": round(epoch_duration, 2),
            "total_elapsed_seconds": round(time.time() - start_time_all, 2),
            "ram_usage_mb": round(peak_ram_mb, 2)
        }
        training_logs.append(log_entry)

        # Save epoch checkpoint
        epoch_dir = os.path.join(args.output_dir, f"checkpoint-epoch-{epoch}")
        save_checkpoint(model, tokenizer, epoch_dir, log_entry)

        # Save best model
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            best_epoch = epoch
            best_dir = os.path.join(args.output_dir, "best_model")
            save_checkpoint(model, tokenizer, best_dir, log_entry)
            log(f"  [*] New best model! Epoch {epoch}, Val Loss: {best_val_loss:.4f}")

    total_training_time = time.time() - start_time_all
    log("\n[Step 5/5] Training Complete!")
    log(f"  Total Time  : {total_training_time:.0f}s ({total_training_time/3600:.2f} hours)")
    log(f"  Best Epoch  : {best_epoch} (Val Loss: {best_val_loss:.4f})")

    log_file = "outputs/training_logs/training_history.json"
    with open(log_file, "w", encoding="utf-8") as f:
        json.dump({
            "args": vars(args),
            "training_logs": training_logs,
            "best_epoch": best_epoch,
            "best_val_loss": round(best_val_loss, 4),
            "total_training_time_seconds": round(total_training_time, 2),
            "total_training_time_hours": round(total_training_time / 3600, 3)
        }, f, indent=2, ensure_ascii=False)

    log(f"  Training logs saved to: {log_file}")
    log("=" * 80)


if __name__ == "__main__":
    main()
