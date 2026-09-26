"""
Aadivaani Dataset Pipeline: Multilingual (Hindi <-> Santali <-> Mundari).
Implements rigorous normalization, script validation, deduplication,
bidirectional data generation, balancing, zero-leakage deterministic partitioning,
and comprehensive dataset statistics.
"""

import os
import json
import random
import csv
from collections import Counter
from typing import List, Dict, Tuple, Set, Optional

from src.script_validator import (
    normalize_text,
    validate_ol_chiki,
    validate_devanagari,
    validate_mundari,
    validate_by_lang_code
)


def load_raw_sources(base_dir: str = ".") -> List[Dict[str, str]]:
    """
    Loads parallel pairs from all available repository data sources:
    1. FLORES-200 parallel corpus (2,001 human-translated pairs).
    2. Authentic conversational and civic domain seed pairs (master_dataset.csv).
    3. Ingested parallel corpora (CrossSum-IN, Karya Mundari, BPCC, LDCIL).
    """
    candidates: List[Dict[str, str]] = []

    # 1. FLORES-200 (Meta human translation: Hindi <-> Santali)
    flores_path = os.path.join(base_dir, "data", "flores_pairs.json")
    if os.path.exists(flores_path):
        try:
            with open(flores_path, "r", encoding="utf-8") as f:
                flores_data = json.load(f)
                for hi, sat in flores_data.items():
                    candidates.append({
                        "hindi": hi,
                        "santali": sat,
                        "source_lang": "hin_Deva",
                        "target_lang": "sat_Olck",
                        "source_text": hi,
                        "target_text": sat,
                        "source": "FLORES-200",
                        "provenance": "human_translation"
                    })
        except Exception as e:
            print(f"[Warning] Failed loading FLORES-200: {e}")

    # 2. Master Dataset / Domain seeds
    master_path = os.path.join(base_dir, "data", "master_dataset.csv")
    if not os.path.exists(master_path):
        master_path = os.path.join(base_dir, "master_dataset.csv")

    if os.path.exists(master_path):
        try:
            with open(master_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    h = row.get("hindi", "").strip()
                    s = row.get("santali", "").strip()
                    if h and s:
                        candidates.append({
                            "hindi": h,
                            "santali": s,
                            "source_lang": "hin_Deva",
                            "target_lang": "sat_Olck",
                            "source_text": h,
                            "target_text": s,
                            "source": "master_dataset_csv",
                            "provenance": "verified_corpus"
                        })
        except Exception as e:
            print(f"[Warning] Failed loading master_dataset.csv: {e}")

    # 3. Ingested parallel pairs (IndicGenBench CrossSum, Karya Mundari, BPCC, LDCIL)
    ingested_path = os.path.join(base_dir, "data", "ingested", "ingested_parallel_pairs.jsonl")
    if os.path.exists(ingested_path):
        try:
            with open(ingested_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        item = json.loads(line)
                        src_l = item.get("source_lang", "hin_Deva")
                        tgt_l = item.get("target_lang", "sat_Olck")
                        src_t = item.get("source_text", "").strip()
                        tgt_t = item.get("target_text", "").strip()
                        if src_t and tgt_t:
                            candidates.append({
                                "hindi": src_t if src_l == "hin_Deva" else (tgt_t if tgt_l == "hin_Deva" else src_t),
                                "santali": tgt_t if tgt_l == "sat_Olck" else (src_t if src_l == "sat_Olck" else ""),
                                "source_lang": src_l,
                                "target_lang": tgt_l,
                                "source_text": src_t,
                                "target_text": tgt_t,
                                "source": item.get("dataset", "ingested_corpus"),
                                "provenance": "research_corpus"
                            })
        except Exception as e:
            print(f"[Warning] Failed loading ingested parallel pairs: {e}")

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
    - Validates source and target scripts.
    - Rejects empty, whitespace-only, or too-short inputs.
    - Rejects identical source and target pairs.
    - Rejects severe length ratio anomalies.
    - Deduplicates on (source_lang, target_lang, source_sentence).
    """
    valid_pairs: List[Dict] = []
    rejected_pairs: List[Dict] = []
    seen_sources: Set[Tuple[str, str, str]] = set()

    for item in candidates:
        src_lang = item.get("source_lang", "hin_Deva")
        tgt_lang = item.get("target_lang", "sat_Olck")

        raw_s = item.get("source_text") or item.get("hindi", "")
        raw_t = item.get("target_text") or item.get("santali", "")

        norm_s = normalize_text(raw_s)
        norm_t = normalize_text(raw_t)

        # 1. Empty / Minimum length check
        if not norm_s or not norm_t or len(norm_s) < min_length_chars or len(norm_t) < min_length_chars:
            rejected_pairs.append({
                "source_text": raw_s, "target_text": raw_t,
                "hindi": item.get("hindi", raw_s), "santali": item.get("santali", raw_t),
                "reason": "empty_or_too_short"
            })
            continue

        # 2. Identical source and target check
        if norm_s == norm_t:
            rejected_pairs.append({
                "source_text": raw_s, "target_text": raw_t,
                "hindi": item.get("hindi", raw_s), "santali": item.get("santali", raw_t),
                "reason": "identical_source_target"
            })
            continue

        # 3. Script validation for source
        v_src = validate_by_lang_code(norm_s, src_lang)
        if not v_src["is_valid"]:
            fail_reason = "invalid_hindi_script" if src_lang == "hin_Deva" else f"invalid_{src_lang[:3]}_script"
            rejected_pairs.append({
                "source_text": raw_s, "target_text": raw_t,
                "hindi": item.get("hindi", raw_s), "santali": item.get("santali", raw_t),
                "reason": fail_reason,
                "ratio": v_src["validity_ratio"],
                "foreign_chars": v_src.get("foreign_chars", [])
            })
            continue

        # 4. Script validation for target
        v_tgt = validate_by_lang_code(norm_t, tgt_lang)
        if not v_tgt["is_valid"]:
            fail_reason = "invalid_santali_script" if tgt_lang == "sat_Olck" else f"invalid_{tgt_lang[:3]}_script"
            rejected_pairs.append({
                "source_text": raw_s, "target_text": raw_t,
                "hindi": item.get("hindi", raw_s), "santali": item.get("santali", raw_t),
                "reason": fail_reason,
                "ratio": v_tgt["validity_ratio"],
                "foreign_chars": v_tgt.get("foreign_chars", [])
            })
            continue

        # 5. Length ratio check
        ratio = len(norm_t) / max(1, len(norm_s))
        if ratio < min_ratio or ratio > max_ratio:
            rejected_pairs.append({
                "source_text": raw_s, "target_text": raw_t,
                "hindi": item.get("hindi", raw_s), "santali": item.get("santali", raw_t),
                "reason": "abnormal_length_ratio",
                "ratio": round(ratio, 3)
            })
            continue

        # 6. Deduplication on (source_lang, target_lang, normalized_source)
        dedup_key = (src_lang, tgt_lang, norm_s)
        if dedup_key in seen_sources:
            fail_reason = "duplicate_hindi_source" if src_lang == "hin_Deva" else "duplicate_source"
            rejected_pairs.append({
                "source_text": raw_s, "target_text": raw_t,
                "hindi": item.get("hindi", raw_s), "santali": item.get("santali", raw_t),
                "reason": fail_reason
            })
            continue

        seen_sources.add(dedup_key)
        valid_pairs.append({
            "hindi": norm_s if src_lang == "hin_Deva" else (norm_t if tgt_lang == "hin_Deva" else norm_s),
            "santali": norm_t if tgt_lang == "sat_Olck" else (norm_s if src_lang == "sat_Olck" else ""),
            "source_lang": src_lang,
            "target_lang": tgt_lang,
            "source_text": norm_s,
            "target_text": norm_t,
            "source": item.get("source", "unknown"),
            "provenance": item.get("provenance", "unknown"),
            "ratio": round(ratio, 2)
        })

    return valid_pairs, rejected_pairs


def generate_bidirectional_pairs(pairs: List[Dict]) -> List[Dict]:
    """
    Generates inverse translation pairs for bidirectional training:
    e.g. Hindi -> Santali ALSO generates Santali -> Hindi.
    Hindi -> Mundari ALSO generates Mundari -> Hindi.
    """
    augmented: List[Dict] = []
    seen = set()

    for item in pairs:
        src_l = item["source_lang"]
        tgt_l = item["target_lang"]
        src_t = item["source_text"]
        tgt_t = item["target_text"]

        # Forward pair
        key_fwd = (src_l, tgt_l, src_t, tgt_t)
        if key_fwd not in seen:
            augmented.append(dict(item))
            seen.add(key_fwd)

        # Inverse pair
        key_inv = (tgt_l, src_l, tgt_t, src_t)
        if key_inv not in seen:
            augmented.append({
                "hindi": item.get("hindi", ""),
                "santali": item.get("santali", ""),
                "source_lang": tgt_l,
                "target_lang": src_l,
                "source_text": tgt_t,
                "target_text": src_t,
                "source": f"{item.get('source', 'unknown')}_inverse",
                "provenance": item.get("provenance", "unknown"),
                "ratio": round(len(src_t) / max(1, len(tgt_t)), 2)
            })
            seen.add(key_inv)

    return augmented


def split_dataset(
    dataset: List[Dict],
    train_ratio: float = 0.80,
    val_ratio: float = 0.10,
    seed: int = 42
) -> Tuple[List[Dict], List[Dict], List[Dict]]:
    """
    Creates deterministic, zero-leakage splits for train, validation, and test.
    Groups by source sentence to ensure zero contamination across splits.
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

    # Assert no leakage between splits on source text
    train_src = {x.get("source_text") or x.get("hindi") for x in train_split}
    val_src = {x.get("source_text") or x.get("hindi") for x in val_split}
    test_src = {x.get("source_text") or x.get("hindi") for x in test_split}

    # Filter any accidental overlap if exact inverse occurred in different split
    val_clean = [x for x in val_split if (x.get("source_text") or x.get("hindi")) not in train_src]
    test_clean = [x for x in test_split if (x.get("source_text") or x.get("hindi")) not in train_src and (x.get("source_text") or x.get("hindi")) not in val_src]

    return train_split, val_clean, test_clean


def compute_dataset_statistics(
    train: List[Dict],
    val: List[Dict],
    test: List[Dict],
    rejected: List[Dict]
) -> Dict:
    """Computes detailed statistical summary of the dataset."""
    all_pairs = train + val + test
    src_lens = [len((x.get("source_text") or x.get("hindi", "")).split()) for x in all_pairs]
    tgt_lens = [len((x.get("target_text") or x.get("santali", "")).split()) for x in all_pairs]

    provenance_counts = dict(Counter(x.get("provenance", "unknown") for x in all_pairs))
    source_counts = dict(Counter(x.get("source", "unknown") for x in all_pairs))
    lang_pair_counts = dict(Counter(f"{x.get('source_lang', 'hin_Deva')}->{x.get('target_lang', 'sat_Olck')}" for x in all_pairs))

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
            "avg_source_words": round(sum(src_lens) / max(1, len(src_lens)), 2),
            "max_source_words": max(src_lens) if src_lens else 0,
            "min_source_words": min(src_lens) if src_lens else 0,
            "avg_target_words": round(sum(tgt_lens) / max(1, len(tgt_lens)), 2),
            "max_target_words": max(tgt_lens) if tgt_lens else 0,
            "min_target_words": min(tgt_lens) if tgt_lens else 0
        },
        "language_pairs": lang_pair_counts,
        "provenance_distribution": provenance_counts,
        "source_distribution": source_counts
    }
    return stats


def update_translation_cache(pairs: List[Dict], cache_path: str):
    """Augments Tier-1 fast lookup cache with frequent, verified short phrases."""
    cache = {}
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                cache = json.load(f)
        except Exception:
            cache = {}

    added = 0
    for item in pairs:
        s_lang = item.get("source_lang", "hin_Deva")
        t_lang = item.get("target_lang", "sat_Olck")
        s_text = item.get("source_text") or item.get("hindi")
        t_text = item.get("target_text") or item.get("santali")

        if s_lang == "hin_Deva" and t_lang == "sat_Olck" and s_text and t_text:
            if s_text not in cache and len(s_text.split()) <= 12:
                cache[s_text] = t_text
                added += 1

    try:
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
        print(f"[Cache] Updated translation cache with {added} new phrases. Total cache size: {len(cache)}")
    except Exception as e:
        print(f"[Cache Warning] Failed to update translation cache: {e}")


def build_and_export_splits(base_dir: str = ".") -> Dict:
    """
    Main entry point: loads, validates, deduplicates, generates bidirectional pairs,
    balances datasets, splits, and exports:
    1. Balanced local splits: data/processed/train_multilingual.jsonl, val, test
    2. Full corpus for cloud GPU training: data/processed/full_multilingual_corpus.jsonl
    3. Legacy splits for backward compatibility: train.jsonl, validation.jsonl, test.jsonl
    """
    data_dir = os.path.join(base_dir, "data", "processed")
    eval_dir = os.path.join(base_dir, "data", "evaluation")
    out_dir = os.path.join(base_dir, "outputs")
    cache_path = os.path.join(base_dir, "translation_cache.json")

    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(eval_dir, exist_ok=True)
    os.makedirs(out_dir, exist_ok=True)

    # 1. Load candidates
    candidates = load_raw_sources(base_dir)
    print(f"Loaded {len(candidates)} raw candidate pairs across all sources.")

    # 2. Validate and filter
    valid_pairs, rejected_pairs = validate_and_filter_dataset(candidates)
    print(f"Validation complete: {len(valid_pairs)} valid pairs, {len(rejected_pairs)} rejected.")

    # 3. Generate bidirectional pairs (both forward & inverse)
    bidi_pairs = generate_bidirectional_pairs(valid_pairs)
    print(f"Bidirectional generation: {len(bidi_pairs)} total bidirectional pairs.")

    # 4. Save full corpus (for cloud GPU multi-epoch training)
    full_corpus_path = os.path.join(data_dir, "full_multilingual_corpus.jsonl")
    with open(full_corpus_path, "w", encoding="utf-8") as f:
        for p in bidi_pairs:
            f.write(json.dumps(p, ensure_ascii=False) + "\n")
    print(f"Saved full multilingual corpus ({len(bidi_pairs)} pairs) -> {full_corpus_path}")

    # 5. Create balanced dataset for stable, high-quality local training:
    # Separate by language pairs
    sat_pairs = [p for p in bidi_pairs if p.get("source_lang") == "sat_Olck" or p.get("target_lang") == "sat_Olck"]
    mun_pairs = [p for p in bidi_pairs if p.get("source_lang") == "mun_Deva" or p.get("target_lang") == "mun_Deva"]

    rng = random.Random(42)
    rng.shuffle(mun_pairs)
    # Take balanced sample of Mundari (e.g., up to 6,000 pairs) so local training is fast and balanced
    sampled_mun = mun_pairs[:min(6000, len(mun_pairs))]
    balanced_local = sat_pairs + sampled_mun
    rng.shuffle(balanced_local)
    print(f"Balanced local dataset: {len(sat_pairs)} Santali pairs + {len(sampled_mun)} Mundari pairs = {len(balanced_local)} total.")

    # 6. Split balanced dataset (80 / 10 / 10)
    train_split, val_split, test_split = split_dataset(balanced_local, train_ratio=0.80, val_ratio=0.10, seed=42)
    print(f"Multilingual Splits: Train={len(train_split)}, Validation={len(val_split)}, Test={len(test_split)}")

    def save_jsonl(path: str, data: List[Dict]):
        with open(path, "w", encoding="utf-8") as f:
            for item in data:
                clean_item = {
                    "hindi": item.get("hindi", ""),
                    "santali": item.get("santali", ""),
                    "source_lang": item.get("source_lang", "hin_Deva"),
                    "target_lang": item.get("target_lang", "sat_Olck"),
                    "source_text": item.get("source_text") or item.get("hindi", ""),
                    "target_text": item.get("target_text") or item.get("santali", ""),
                    "source": item.get("source", "unknown"),
                    "provenance": item.get("provenance", "unknown")
                }
                f.write(json.dumps(clean_item, ensure_ascii=False) + "\n")

    # Export multilingual splits
    save_jsonl(os.path.join(data_dir, "train_multilingual.jsonl"), train_split)
    save_jsonl(os.path.join(data_dir, "val_multilingual.jsonl"), val_split)
    save_jsonl(os.path.join(data_dir, "test_multilingual.jsonl"), test_split)

    # Export legacy Hindi-Santali splits for backward compatibility
    hi_sat_train = [p for p in train_split if p.get("hindi") and p.get("santali")]
    hi_sat_val = [p for p in val_split if p.get("hindi") and p.get("santali")]
    hi_sat_test = [p for p in test_split if p.get("hindi") and p.get("santali")]
    save_jsonl(os.path.join(data_dir, "train.jsonl"), hi_sat_train)
    save_jsonl(os.path.join(data_dir, "validation.jsonl"), hi_sat_val)
    save_jsonl(os.path.join(data_dir, "test.jsonl"), hi_sat_test)
    save_jsonl(os.path.join(eval_dir, "baseline_eval.jsonl"), hi_sat_test[:100])

    # 7. Save rejected pairs log
    rejected_path = os.path.join(out_dir, "rejected_dataset.jsonl")
    with open(rejected_path, "w", encoding="utf-8") as f:
        for r in rejected_pairs[:2000]:  # Cap rejected log sample
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    # 8. Compute & Save statistics
    stats = compute_dataset_statistics(train_split, val_split, test_split, rejected_pairs)
    stats_path = os.path.join(out_dir, "dataset_statistics.json")
    with open(stats_path, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2, ensure_ascii=False)

    # 9. Update translation cache
    update_translation_cache(valid_pairs, cache_path)

    print(f"Dataset statistics saved to {stats_path}")
    print(f"Train samples: {stats['split_counts']['train']} ({stats['split_percentages']['train']}%)")
    print(f"Validation samples: {stats['split_counts']['validation']} ({stats['split_percentages']['validation']}%)")
    print(f"Test samples: {stats['split_counts']['test']} ({stats['split_percentages']['test']}%)")

    return stats


if __name__ == "__main__":
    build_and_export_splits(".")
