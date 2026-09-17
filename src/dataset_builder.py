"""
Aadivaani Dataset Pipeline: Hindi (Devanagari) -> Santali (Ol Chiki).
Implements rigorous normalization, script validation, deduplication,
leakage-free deterministic partitioning, and comprehensive dataset statistics.
"""

import os
import json
import random
import csv
from collections import Counter
from typing import List, Dict, Tuple, Set, Optional

from src.script_validator import normalize_text, validate_ol_chiki, validate_devanagari


def load_raw_sources(base_dir: str = ".") -> List[Dict[str, str]]:
    """
    Loads parallel pairs from all available repository data sources:
    1. FLORES-200 parallel corpus (2,001 human-translated pairs).
    2. Authentic conversational and civic domain seed pairs.
    3. Master dataset pairs with provenance tracking.
    """
    candidates: List[Dict[str, str]] = []

    # 1. FLORES-200 (Highest Quality - Meta human translation)
    flores_path = os.path.join(base_dir, "data", "flores_pairs.json")
    if os.path.exists(flores_path):
        with open(flores_path, "r", encoding="utf-8") as f:
            flores_data = json.load(f)
            for hi, sat in flores_data.items():
                candidates.append({
                    "hindi": hi,
                    "santali": sat,
                    "source": "FLORES-200",
                    "provenance": "human_translation"
                })

    # 2. Master Dataset / Domain seeds
    master_path = os.path.join(base_dir, "data", "master_dataset.csv")
    if not os.path.exists(master_path):
        master_path = os.path.join(base_dir, "master_dataset.csv")

    if os.path.exists(master_path):
        with open(master_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                h = row.get("hindi", "").strip()
                s = row.get("santali", "").strip()
                if h and s:
                    candidates.append({
                        "hindi": h,
                        "santali": s,
                        "source": "master_dataset_csv",
                        "provenance": "verified_corpus"
                    })

    return candidates


def validate_and_filter_dataset(
    candidates: List[Dict[str, str]],
    min_length_chars: int = 2,
    min_ratio: float = 0.15,
    max_ratio: float = 6.0
) -> Tuple[List[Dict], List[Dict]]:
    """
    Strict validation and deduplication filter:
    - Normalizes Unicode (NFC).
    - Validates Hindi Devanagari script (min 85% Devanagari letters).
    - Validates Santali Ol Chiki script (min 90% Ol Chiki letters).
    - Rejects empty, whitespace-only, or too-short inputs.
    - Rejects identical source and target pairs.
    - Rejects severe length ratio anomalies.
    - Deduplicates on source sentence.
    """
    valid_pairs: List[Dict] = []
    rejected_pairs: List[Dict] = []
    seen_hindi: Set[str] = set()

    for item in candidates:
        raw_h = item.get("hindi", "")
        raw_s = item.get("santali", "")

        norm_h = normalize_text(raw_h)
        norm_s = normalize_text(raw_s)

        # 1. Empty / Minimum length check
        if not norm_h or not norm_s or len(norm_h) < min_length_chars or len(norm_s) < min_length_chars:
            rejected_pairs.append({
                "hindi": raw_h, "santali": raw_s,
                "reason": "empty_or_too_short"
            })
            continue

        # 2. Identical source and target check
        if norm_h == norm_s:
            rejected_pairs.append({
                "hindi": raw_h, "santali": raw_s,
                "reason": "identical_source_target"
            })
            continue

        # 3. Script validation
        v_hi = validate_devanagari(norm_h)
        if not v_hi["is_valid"]:
            rejected_pairs.append({
                "hindi": raw_h, "santali": raw_s,
                "reason": "invalid_hindi_script",
                "ratio": v_hi["validity_ratio"],
                "foreign_chars": v_hi["foreign_chars"]
            })
            continue

        v_sat = validate_ol_chiki(norm_s)
        if not v_sat["is_valid"]:
            rejected_pairs.append({
                "hindi": raw_h, "santali": raw_s,
                "reason": "invalid_santali_script",
                "ratio": v_sat["validity_ratio"],
                "foreign_chars": v_sat["foreign_chars"]
            })
            continue

        # 4. Length ratio check
        ratio = len(norm_s) / max(1, len(norm_h))
        if ratio < min_ratio or ratio > max_ratio:
            rejected_pairs.append({
                "hindi": raw_h, "santali": raw_s,
                "reason": "abnormal_length_ratio",
                "ratio": round(ratio, 3)
            })
            continue

        # 5. Deduplication on source Hindi
        if norm_h in seen_hindi:
            rejected_pairs.append({
                "hindi": raw_h, "santali": raw_s,
                "reason": "duplicate_hindi_source"
            })
            continue

        seen_hindi.add(norm_h)
        valid_pairs.append({
            "hindi": norm_h,
            "santali": norm_s,
            "source": item.get("source", "unknown"),
            "provenance": item.get("provenance", "unknown"),
            "hi_chars": len(norm_h),
            "sat_chars": len(norm_s),
            "ratio": round(ratio, 2)
        })

    return valid_pairs, rejected_pairs


def split_dataset(
    dataset: List[Dict],
    train_ratio: float = 0.80,
    val_ratio: float = 0.10,
    seed: int = 42
) -> Tuple[List[Dict], List[Dict], List[Dict]]:
    """
    Creates deterministic, zero-leakage splits for train, validation, and test.
    """
    rng = random.Random(seed)
    shuffled = list(dataset)
    rng.shuffle(shuffled)

    n_total = len(shuffled)
    n_train = int(n_total * train_ratio)
    n_val = int(n_total * val_ratio)

    train_split = shuffled[:n_train]
    val_split = shuffled[n_train:n_train + n_val]
    test_split = shuffled[n_train + n_val:]

    # Assert no leakage between splits
    train_hi = {x["hindi"] for x in train_split}
    val_hi = {x["hindi"] for x in val_split}
    test_hi = {x["hindi"] for x in test_split}

    assert len(train_hi.intersection(val_hi)) == 0, "Data leakage detected: Train vs Validation"
    assert len(train_hi.intersection(test_hi)) == 0, "Data leakage detected: Train vs Test"
    assert len(val_hi.intersection(test_hi)) == 0, "Data leakage detected: Validation vs Test"

    return train_split, val_split, test_split


def compute_dataset_statistics(
    train: List[Dict],
    val: List[Dict],
    test: List[Dict],
    rejected: List[Dict]
) -> Dict:
    """Computes detailed statistical summary of the dataset."""
    all_pairs = train + val + test
    hi_lens = [len(x["hindi"].split()) for x in all_pairs]
    sat_lens = [len(x["santali"].split()) for x in all_pairs]

    provenance_counts = dict(Counter(x.get("provenance", "unknown") for x in all_pairs))
    source_counts = dict(Counter(x.get("source", "unknown") for x in all_pairs))

    stats = {
        "total_valid_pairs": len(all_pairs),
        "total_rejected_pairs": len(rejected),
        "split_counts": {
            "train": len(train),
            "validation": len(val),
            "test": len(test)
        },
        "split_percentages": {
            "train": round(len(train) / len(all_pairs) * 100, 2) if all_pairs else 0,
            "validation": round(len(val) / len(all_pairs) * 100, 2) if all_pairs else 0,
            "test": round(len(test) / len(all_pairs) * 100, 2) if all_pairs else 0
        },
        "token_statistics": {
            "avg_hindi_words": round(sum(hi_lens) / max(1, len(hi_lens)), 2),
            "max_hindi_words": max(hi_lens) if hi_lens else 0,
            "min_hindi_words": min(hi_lens) if hi_lens else 0,
            "avg_santali_words": round(sum(sat_lens) / max(1, len(sat_lens)), 2),
            "max_santali_words": max(sat_lens) if sat_lens else 0,
            "min_santali_words": min(sat_lens) if sat_lens else 0
        },
        "provenance_distribution": provenance_counts,
        "source_distribution": source_counts
    }
    return stats


def build_and_export_splits(base_dir: str = ".") -> Dict:
    """
    Main entry point: loads, validates, deduplicates, splits, and saves datasets.
    """
    data_dir = os.path.join(base_dir, "data", "processed")
    eval_dir = os.path.join(base_dir, "data", "evaluation")
    out_dir = os.path.join(base_dir, "outputs")

    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(eval_dir, exist_ok=True)
    os.makedirs(out_dir, exist_ok=True)

    # 1. Load candidates
    candidates = load_raw_sources(base_dir)
    print(f"Loaded {len(candidates)} raw candidate pairs across all sources.")

    # 2. Validate and filter
    valid_pairs, rejected_pairs = validate_and_filter_dataset(candidates)
    print(f"Validation complete: {len(valid_pairs)} valid pairs, {len(rejected_pairs)} rejected.")

    # 3. Split dataset (80 / 10 / 10)
    train_split, val_split, test_split = split_dataset(valid_pairs, train_ratio=0.80, val_ratio=0.10, seed=42)
    print(f"Splits generated: Train={len(train_split)}, Validation={len(val_split)}, Test={len(test_split)}")

    # 4. Save splits to JSONL
    def save_jsonl(path: str, data: List[Dict]):
        with open(path, "w", encoding="utf-8") as f:
            for item in data:
                # Save essential fields cleanly
                clean_item = {
                    "hindi": item["hindi"],
                    "santali": item["santali"],
                    "source": item["source"],
                    "provenance": item["provenance"]
                }
                f.write(json.dumps(clean_item, ensure_ascii=False) + "\n")

    train_path = os.path.join(data_dir, "train.jsonl")
    val_path = os.path.join(data_dir, "validation.jsonl")
    test_path = os.path.join(data_dir, "test.jsonl")
    eval_path = os.path.join(eval_dir, "baseline_eval.jsonl")

    save_jsonl(train_path, train_split)
    save_jsonl(val_path, val_split)
    save_jsonl(test_path, test_split)
    save_jsonl(eval_path, test_split[:100]) # 100 locked evaluation samples from test set

    # 5. Save rejected pairs log
    rejected_path = os.path.join(out_dir, "rejected_dataset.jsonl")
    with open(rejected_path, "w", encoding="utf-8") as f:
        for r in rejected_pairs:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    # 6. Compute & Save statistics
    stats = compute_dataset_statistics(train_split, val_split, test_split, rejected_pairs)
    stats_path = os.path.join(out_dir, "dataset_statistics.json")
    with open(stats_path, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2, ensure_ascii=False)

    print(f"Dataset statistics saved to {stats_path}")
    print(f"Train samples: {stats['split_counts']['train']} ({stats['split_percentages']['train']}%)")
    print(f"Validation samples: {stats['split_counts']['validation']} ({stats['split_percentages']['validation']}%)")
    print(f"Test samples: {stats['split_counts']['test']} ({stats['split_percentages']['test']}%)")

    return stats


if __name__ == "__main__":
    build_and_export_splits(".")
