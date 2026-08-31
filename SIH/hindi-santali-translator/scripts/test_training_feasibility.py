"""
Test model load time + one forward pass to assess training feasibility on CPU.
"""
import sys, time, psutil, math, torch
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, '.')
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from src.translation.processor import IndicProcessor
import json

def mb():
    return psutil.Process().memory_info().rss / (1024**2)

MODEL = 'ai4bharat/indictrans2-indic-indic-1B'

print(f'RAM before: {mb():.0f} MB | Available: {psutil.virtual_memory().available/(1024**2):.0f} MB')

# LoRA implementation
class LoRALinear(torch.nn.Module):
    def __init__(self, base_layer, r=16, lora_alpha=32, lora_dropout=0.05):
        super().__init__()
        self.base_layer = base_layer
        self.base_layer.weight.requires_grad = False
        if self.base_layer.bias is not None:
            self.base_layer.bias.requires_grad = False
        self.r = r
        self.scaling = lora_alpha / r
        self.lora_A = torch.nn.Linear(base_layer.in_features, r, bias=False)
        self.lora_B = torch.nn.Linear(r, base_layer.out_features, bias=False)
        self.dropout = torch.nn.Dropout(p=lora_dropout)
        torch.nn.init.kaiming_uniform_(self.lora_A.weight, a=math.sqrt(5))
        torch.nn.init.zeros_(self.lora_B.weight)

    def forward(self, x):
        return self.base_layer(x) + self.lora_B(self.lora_A(self.dropout(x))) * self.scaling

def apply_lora(model, target_modules=['q_proj', 'v_proj'], r=16, lora_alpha=32):
    for param in model.parameters():
        param.requires_grad = False
    count = 0
    for name, module in model.named_modules():
        for child_name, child in module.named_children():
            if any(t in child_name for t in target_modules) and isinstance(child, torch.nn.Linear):
                setattr(module, child_name, LoRALinear(child, r=r, lora_alpha=lora_alpha))
                count += 1
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f'LoRA applied to {count} layers. Trainable: {trainable:,} / {total:,} ({trainable/total*100:.3f}%)')
    return model

print('Loading tokenizer...')
tok = AutoTokenizer.from_pretrained(MODEL, trust_remote_code=True)
ip = IndicProcessor(inference=False)
print(f'Tokenizer ready. RAM: {mb():.0f} MB')

print('Loading model (this may take 2-4 minutes on CPU)...')
t0 = time.time()
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL, trust_remote_code=True, torch_dtype=torch.float32)
load_time = time.time() - t0
print(f'Model loaded in {load_time:.1f}s. RAM: {mb():.0f} MB')

print('Applying LoRA...')
model = apply_lora(model)
print(f'LoRA done. RAM: {mb():.0f} MB')

print('Loading one batch from train.jsonl...')
records = []
with open('data/processed/train.jsonl', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i >= 4: break
        records.append(json.loads(line))

sources = ip.preprocess_batch([r['source_text'] for r in records], src_lang='hin_Deva', tgt_lang='sat_Olck')
targets = ip.preprocess_batch([r['target_text'] for r in records], src_lang='sat_Olck', tgt_lang='sat_Olck')

inputs = tok(sources, padding=True, truncation=True, max_length=128, return_tensors='pt')
tgt_ids = tok(text_target=targets, padding=True, truncation=True, max_length=128, return_tensors='pt')
labels = tgt_ids['input_ids'].clone()
labels[labels == tok.pad_token_id] = -100

print('Running forward pass (timing)...')
model.train()
t0 = time.time()
out = model(input_ids=inputs['input_ids'], attention_mask=inputs['attention_mask'], labels=labels)
fwd_time = time.time() - t0
print(f'Forward pass: {fwd_time:.2f}s, Loss: {out.loss.item():.4f}')

print('Running backward pass (timing)...')
t0 = time.time()
out.loss.backward()
bwd_time = time.time() - t0
print(f'Backward pass: {bwd_time:.2f}s')

step_time = fwd_time + bwd_time
# 1605 examples / 4 batch = 402 steps/epoch, / 4 accumulation = ~101 optimizer steps
steps_per_epoch = (1605 // 4)
epoch_time_est = steps_per_epoch * step_time
print()
print('====== TRAINING FEASIBILITY ESTIMATE ======')
print(f'  Step time (fwd+bwd, batch=4): {step_time:.2f}s')
print(f'  Steps per epoch (batch=4):    {steps_per_epoch}')
print(f'  Estimated epoch time:         {epoch_time_est/60:.1f} min')
print(f'  Estimated 3-epoch time:       {3*epoch_time_est/3600:.2f} hours')
print(f'  Final RAM:                    {mb():.0f} MB')
print(f'  Available RAM:                {psutil.virtual_memory().available/(1024**2):.0f} MB')
