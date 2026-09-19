"""
Download and extract Ho-English translation dataset from Hugging Face.
Downloads parquet files directly to avoid downloading heavy audio files.
"""

import os
import sys
import requests
import io
from pathlib import Path

OUT_DIR = r"d:\sih2026\ho"
os.makedirs(OUT_DIR, exist_ok=True)

# Parquet files from HF dataset
PARQUET_URLS = [
    "https://huggingface.co/datasets/project-boli/ho/resolve/main/data/preview/data-14d6ebf4.parquet",
    "https://huggingface.co/datasets/project-boli/ho/resolve/main/data/preview/data-53dffdd1.parquet",
    "https://huggingface.co/datasets/project-boli/ho/resolve/main/data/preview/data-6a147b41.parquet",
    "https://huggingface.co/datasets/project-boli/ho/resolve/main/data/preview/data-aac1747c.parquet",
]

FIELDS = [
    "Q_Id",
    "sentence-Devanagari-transcription",
    "sentence-English-Latin-translation",
]

# Read token
token_path = Path.home() / ".cache" / "huggingface" / "token"
token = None
if token_path.exists():
    token = token_path.read_text().strip()

headers = {}
if token:
    headers["Authorization"] = f"Bearer {token}"
else:
    print("Warning: No Hugging Face token found. Request might fail if dataset is gated.")

print("Downloading parquet files...")

try:
    import pandas as pd
except ImportError:
    print("Installing pandas...")
    os.system(f"{sys.executable} -m pip install pandas pyarrow -q")
    import pandas as pd

dfs = []
for i, url in enumerate(PARQUET_URLS, 1):
    print(f"[{i}/{len(PARQUET_URLS)}] Downloading: {url.split('/')[-1]}")
    resp = requests.get(url, headers=headers, timeout=120)
    
    if resp.status_code == 401:
        print(f"Error: Unauthorized (401). Is the dataset gated? Make sure you have accepted the conditions on the Hugging Face website and your token is valid.")
        sys.exit(1)
        
    resp.raise_for_status()
    df = pd.read_parquet(io.BytesIO(resp.content))
    print(f"  Loaded {len(df)} rows.")
    dfs.append(df)

df_all = pd.concat(dfs, ignore_index=True)
print(f"\nTotal rows loaded: {len(df_all)}")

available_fields = [f for f in FIELDS if f in df_all.columns]
missing_fields = [f for f in FIELDS if f not in df_all.columns]

if missing_fields:
    print(f"\nWARNING: These fields are missing: {missing_fields}")
    print(f"Available columns: {df_all.columns.tolist()}")

if not available_fields:
    print("ERROR: None of the required fields found. Exiting.")
    sys.exit(1)

df_filtered = df_all[available_fields].copy()

# Drop rows where all key fields are null
df_filtered.dropna(how='all', inplace=True)
print(f"Rows after dropping empty: {len(df_filtered)}")

csv_path = os.path.join(OUT_DIR, "ho_english_dataset.csv")
df_filtered.to_csv(csv_path, index=False, encoding='utf-8')

jsonl_path = os.path.join(OUT_DIR, "ho_english_dataset.jsonl")
df_filtered.to_json(jsonl_path, orient='records', lines=True, force_ascii=False)

print(f"\nSuccess! Dataset extracted and saved to:")
print(f"- {csv_path}")
print(f"- {jsonl_path}")

print(f"\n--- Sample (first 3 rows) ---")
print(df_filtered.head(3).to_string())
