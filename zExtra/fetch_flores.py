from datasets import load_dataset
import json
import os

print("Loading FLORES-200 Hindi and Santali splits (devtest)...")
flores_hi = load_dataset("facebook/flores", "hin_Deva", split="devtest")
flores_sat = load_dataset("facebook/flores", "sat_Olck", split="devtest")

pairs = {}
for hi_row, sat_row in zip(flores_hi, flores_sat):
    hindi = hi_row["sentence"].strip()
    santali = sat_row["sentence"].strip()
    if hindi and santali:
        pairs[hindi] = santali

print(f"Extracted {len(pairs)} FLORES devtest pairs")

print("Loading FLORES-200 Hindi and Santali splits (dev)...")
flores_hi_dev = load_dataset("facebook/flores", "hin_Deva", split="dev")
flores_sat_dev = load_dataset("facebook/flores", "sat_Olck", split="dev")

for hi_row, sat_row in zip(flores_hi_dev, flores_sat_dev):
    hindi = hi_row["sentence"].strip()
    santali = sat_row["sentence"].strip()
    if hindi and santali:
        pairs[hindi] = santali

print(f"Extracted a total of {len(pairs)} FLORES pairs")

out_file = os.path.join(os.path.dirname(__file__), "flores_pairs.json")
with open(out_file, "w", encoding="utf-8") as f:
    json.dump(pairs, f, ensure_ascii=False, indent=2)

print(f"Saved to {out_file}")
