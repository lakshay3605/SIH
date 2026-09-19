import json
import csv
import os

print("Loading existing translation_cache.json...")
cache_path = r"d:\sih2026\aakansha's work\indictrans2_200m_hi_sat_onnx\translation_cache.json"

with open(cache_path, "r", encoding="utf-8") as f:
    master = json.load(f)

print(f"Loaded {len(master)} pairs from cache.")

csv_path = r"d:\sih2026\zExtra\master_dataset.csv"
print("Generating master_dataset.csv for Kaggle training...")
with open(csv_path, "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["hindi", "santali"])
    writer.writeheader()
    for hi, sat in master.items():
        writer.writerow({"hindi": hi, "santali": sat})

print(f"Saved: {csv_path}")
