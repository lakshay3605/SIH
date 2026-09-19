"""Diagnose the training pipeline step by step to find the bottleneck."""
import time, sys, psutil, json, torch
sys.path.insert(0, '.')
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from src.translation.processor import IndicProcessor

def mb():
    return psutil.Process().memory_info().rss / (1024**2)

print(f'--- Step 1: Loading tokenizer... ({mb():.0f} MB)')
t0 = time.time()
tok = AutoTokenizer.from_pretrained('ai4bharat/indictrans2-indic-indic-1B', trust_remote_code=True)
print(f'Tokenizer loaded in {time.time()-t0:.1f}s ({mb():.0f} MB)')

print(f'--- Step 2: Loading all 1605 train records...')
records = []
with open('data/processed/train.jsonl', encoding='utf-8') as f:
    for line in f:
        if line.strip():
            records.append(json.loads(line))
print(f'Loaded {len(records)} records')

print(f'--- Step 3: IndicProcessor batch preprocessing all {len(records)} records...')
t0 = time.time()
ip = IndicProcessor(inference=False)
sources = [r['source_text'] for r in records]
targets = [r['target_text'] for r in records]
ps = ip.preprocess_batch(sources, src_lang='hin_Deva', tgt_lang='sat_Olck')
pt = ip.preprocess_batch(targets, src_lang='sat_Olck', tgt_lang='sat_Olck')
print(f'Preprocessing done in {time.time()-t0:.2f}s ({mb():.0f} MB)')
print(f'Sample source: {ps[0][:80]}')
print(f'Sample target: {pt[0][:80]}')

print(f'--- Step 4: Tokenizing first batch of 4...')
t0 = time.time()
inputs = tok(ps[:4], padding=True, truncation=True, max_length=128, return_tensors='pt')
shape = inputs['input_ids'].shape
print(f'Tokenized 4 samples in {time.time()-t0:.2f}s, shape: {shape}')

print(f'--- Step 5: Loading full model...')
t0 = time.time()
print(f'  Starting model load ({mb():.0f} MB)...')
model = AutoModelForSeq2SeqLM.from_pretrained(
    'ai4bharat/indictrans2-indic-indic-1B',
    trust_remote_code=True,
    torch_dtype=torch.float32
)
print(f'Model loaded in {time.time()-t0:.1f}s ({mb():.0f} MB)')

print(f'--- All steps succeeded! Total RAM: {mb():.0f} MB')
