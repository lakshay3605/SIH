"""
One-step training benchmark.
Measures wall-clock time, CPU utilisation, RAM, and thread count
for EXACTLY ONE forward+backward pass, at both 1-thread and 12-thread settings.
Does NOT modify model weights (no optimizer.step()).
"""

import sys, os, time, json, math, threading
sys.stdout.reconfigure(encoding='utf-8')
os.environ['PYTHONUNBUFFERED'] = '1'
sys.path.insert(0, '.')

import torch
import torch.nn as nn
import psutil
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from src.translation.processor import IndicProcessor

MODEL = 'ai4bharat/indictrans2-indic-indic-1B'
BATCH_SIZE = 4
MAX_LEN = 128
SEED = 42

torch.manual_seed(SEED)

# ------------ LoRA (same as training script) ---------------------------------
class LoRALinear(nn.Module):
    def __init__(self, base_layer, r=16, lora_alpha=32, lora_dropout=0.05):
        super().__init__()
        self.base_layer = base_layer
        self.base_layer.weight.requires_grad = False
        if self.base_layer.bias is not None:
            self.base_layer.bias.requires_grad = False
        self.r = r
        self.scaling = lora_alpha / r
        self.lora_A = nn.Linear(base_layer.in_features, r, bias=False)
        self.lora_B = nn.Linear(r, base_layer.out_features, bias=False)
        self.dropout = nn.Dropout(p=lora_dropout)
        nn.init.kaiming_uniform_(self.lora_A.weight, a=math.sqrt(5))
        nn.init.zeros_(self.lora_B.weight)

    def forward(self, x):
        return self.base_layer(x) + self.lora_B(self.lora_A(self.dropout(x))) * self.scaling

def apply_lora(model):
    for param in model.parameters():
        param.requires_grad = False
    count = 0
    for name, module in model.named_modules():
        for child_name, child in module.named_children():
            if child_name in ('q_proj', 'v_proj') and isinstance(child, nn.Linear):
                setattr(module, child_name, LoRALinear(child))
                count += 1
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    return model, trainable, total, count

# ------------ CPU monitoring thread ------------------------------------------
cpu_samples = []
stop_monitor = threading.Event()

def monitor_cpu():
    proc = psutil.Process()
    while not stop_monitor.is_set():
        cpu_samples.append(proc.cpu_percent(interval=0.5))

# ------------ Setup ----------------------------------------------------------
print(f"System: {psutil.cpu_count(logical=False)} physical / {psutil.cpu_count(logical=True)} logical cores")
print(f"RAM total: {psutil.virtual_memory().total/(1024**3):.1f} GB")
print(f"RAM available: {psutil.virtual_memory().available/(1024**3):.1f} GB")
print(f"PyTorch version: {torch.__version__}")
print()

print("Loading tokenizer + IndicProcessor...", flush=True)
tok = AutoTokenizer.from_pretrained(MODEL, trust_remote_code=True)
ip = IndicProcessor(inference=False)

print("Loading model...", flush=True)
t0 = time.time()
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL, trust_remote_code=True, torch_dtype=torch.float32)
print(f"Model loaded in {time.time()-t0:.1f}s. RAM: {psutil.Process().memory_info().rss/(1024**2):.0f} MB")

print("Applying LoRA...", flush=True)
model, trainable, total, lora_count = apply_lora(model)
print(f"LoRA applied: {lora_count} layers, {trainable:,}/{total:,} trainable ({trainable/total*100:.3f}%)")
print(f"RAM after LoRA: {psutil.Process().memory_info().rss/(1024**2):.0f} MB")

print("\nLoading one real batch from train.jsonl...", flush=True)
records = []
with open('data/processed/train.jsonl', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i >= BATCH_SIZE: break
        records.append(json.loads(line))

sources = ip.preprocess_batch([r['source_text'] for r in records], src_lang='hin_Deva', tgt_lang='sat_Olck')
targets = ip.preprocess_batch([r['target_text'] for r in records], src_lang='sat_Olck', tgt_lang='sat_Olck')
inputs = tok(sources, padding=True, truncation=True, max_length=MAX_LEN, return_tensors='pt')
tgt_ids = tok(text_target=targets, padding=True, truncation=True, max_length=MAX_LEN, return_tensors='pt')
labels = tgt_ids['input_ids'].clone()
labels[labels == tok.pad_token_id] = -100

print(f"Batch shapes: input_ids={list(inputs['input_ids'].shape)}, labels={list(labels.shape)}")

def run_one_step(n_threads, label):
    """Run exactly one forward+backward pass. No optimizer.step()."""
    torch.set_num_threads(n_threads)
    torch.manual_seed(SEED)
    model.train()

    # Detach grads from any prior run
    for p in model.parameters():
        if p.grad is not None:
            p.grad = None

    cpu_samples.clear()
    stop_monitor.clear()
    monitor_thread = threading.Thread(target=monitor_cpu, daemon=True)
    monitor_thread.start()

    ram_before = psutil.Process().memory_info().rss / (1024**2)
    t_start = time.perf_counter()

    # FORWARD
    t_fwd_start = time.perf_counter()
    out = model(input_ids=inputs['input_ids'], attention_mask=inputs['attention_mask'], labels=labels)
    loss = out.loss
    t_fwd = time.perf_counter() - t_fwd_start

    # BACKWARD
    t_bwd_start = time.perf_counter()
    loss.backward()
    t_bwd = time.perf_counter() - t_bwd_start

    t_total = time.perf_counter() - t_start

    stop_monitor.set()
    monitor_thread.join(timeout=2)

    ram_after = psutil.Process().memory_info().rss / (1024**2)
    avg_cpu = sum(cpu_samples) / len(cpu_samples) if cpu_samples else 0.0
    max_cpu = max(cpu_samples) if cpu_samples else 0.0

    print(f"\n{'='*60}")
    print(f"BENCHMARK: {label}")
    print(f"{'='*60}")
    print(f"  torch.get_num_threads() : {torch.get_num_threads()}")
    print(f"  Forward pass time       : {t_fwd:.2f}s")
    print(f"  Backward pass time      : {t_bwd:.2f}s")
    print(f"  Total step time         : {t_total:.2f}s")
    print(f"  Loss value              : {loss.item():.4f}")
    print(f"  RAM before              : {ram_before:.0f} MB")
    print(f"  RAM after               : {ram_after:.0f} MB")
    print(f"  Avg CPU utilisation     : {avg_cpu:.1f}%")
    print(f"  Peak CPU utilisation    : {max_cpu:.1f}%")
    return t_total

print("\n" + "="*60)
print("RUNNING BENCHMARK — 1 THREAD")
print("="*60, flush=True)
t1 = run_one_step(1, "1 CPU thread")

print("\n" + "="*60)
print("RUNNING BENCHMARK — 12 THREADS")
print("="*60, flush=True)
t12 = run_one_step(12, "12 CPU threads")

print(f"\n{'='*60}")
print("THREAD COMPARISON SUMMARY")
print(f"{'='*60}")
print(f"  1-thread step time  : {t1:.2f}s")
print(f"  12-thread step time : {t12:.2f}s")
print(f"  Actual speedup      : {t1/t12:.2f}x")
print(f"  Prior measurement   : 21.71s (1-thread, different script)")

steps_per_epoch = 1605 // BATCH_SIZE  # 401 steps
print(f"\n  Steps per epoch (batch={BATCH_SIZE})   : {steps_per_epoch}")
print(f"  Optimizer updates/epoch (accum=4)   : {steps_per_epoch // 4}")

for lr_note, threads, t_step in [("1-thread", 1, t1), ("12-thread", 12, t12)]:
    ep_min = steps_per_epoch * t_step / 60
    print(f"\n  Projected epoch time ({lr_note}): {ep_min:.1f} min")
    print(f"  Projected 3-epoch time ({lr_note}): {3*ep_min/60:.2f} hours")
