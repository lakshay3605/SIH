"""
Task 2: Rigorous verification of training, validation, and test datasets for Phase 4.
Validates exact record counts, schema, script validity, tokenizer compatibility, and zero leakage.
"""

import os
import sys
import json
from typing import List, Dict, Any

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.dataset.validator import validate_devanagari_source, validate_ol_chiki_target
from transformers import AutoTokenizer
from src.translation.processor import IndicProcessor

sys.stdout.reconfigure(encoding="utf-8")

def load_jsonl(path: str) -> List[Dict[str, Any]]:
    records = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                records.append(json.loads(line.strip()))
    return records

def main():
    print("=" * 80)
    print("TASK 2: Verifying Training, Validation, and Test Datasets...")
    print("=" * 80)

    train_path = "data/processed/train.jsonl"
    val_path = "data/processed/validation.jsonl"
    test_path = "data/processed/test.jsonl"

    train_recs = load_jsonl(train_path)
    val_recs = load_jsonl(val_path)
    test_recs = load_jsonl(test_path)

    print(f"Loaded Counts: Train={len(train_recs)}, Validation={len(val_recs)}, Test={len(test_recs)}")

    # 1. Check counts
    count_checks = {
        "train_count_expected": 1605,
        "train_count_actual": len(train_recs),
        "train_count_pass": len(train_recs) == 1605,
        "val_count_expected": 200,
        "val_count_actual": len(val_recs),
        "val_count_pass": len(val_recs) == 200,
        "test_count_expected": 202,
        "test_count_actual": len(test_recs),
        "test_count_pass": len(test_recs) == 202
    }

    # 2. Check empty examples & intra-split duplicates
    splits = {"train": train_recs, "validation": val_recs, "test": test_recs}
    empty_checks = {}
    dup_checks = {}
    script_checks = {}

    for s_name, recs in splits.items():
        empty_src = sum(1 for r in recs if not r.get("source_text", "").strip())
        empty_tgt = sum(1 for r in recs if not r.get("target_text", "").strip())
        empty_checks[s_name] = {"empty_source_count": empty_src, "empty_target_count": empty_tgt, "pass": (empty_src + empty_tgt) == 0}

        pairs = [f"{r['source_text']}|||{r['target_text']}" for r in recs]
        dups = len(pairs) - len(set(pairs))
        dup_checks[s_name] = {"duplicate_count": dups, "pass": dups == 0}

        # Check script validity
        src_valid_cnt = sum(1 for r in recs if validate_devanagari_source(r["source_text"])["valid"])
        tgt_valid_cnt = sum(1 for r in recs if validate_ol_chiki_target(r["target_text"])["valid"])
        script_checks[s_name] = {
            "source_hindi_valid_ratio": round(src_valid_cnt / len(recs), 4),
            "target_ol_chiki_valid_ratio": round(tgt_valid_cnt / len(recs), 4),
            "all_valid": (src_valid_cnt == len(recs)) and (tgt_valid_cnt == len(recs))
        }

    # 3. Leakage Checks
    train_sources = set(r["source_text"] for r in train_recs)
    val_sources = set(r["source_text"] for r in val_recs)
    test_sources = set(r["source_text"] for r in test_recs)

    train_targets = set(r["target_text"] for r in train_recs)
    val_targets = set(r["target_text"] for r in val_recs)
    test_targets = set(r["target_text"] for r in test_recs)

    leakage_checks = {
        "train_val_source_leakage": len(train_sources.intersection(val_sources)),
        "train_test_source_leakage": len(train_sources.intersection(test_sources)),
        "val_test_source_leakage": len(val_sources.intersection(test_sources)),
        "train_val_target_leakage": len(train_targets.intersection(val_targets)),
        "train_test_target_leakage": len(train_targets.intersection(test_targets)),
        "val_test_target_leakage": len(val_targets.intersection(test_targets)),
        "zero_leakage_pass": (
            len(train_sources.intersection(val_sources)) == 0 and
            len(train_sources.intersection(test_sources)) == 0 and
            len(val_sources.intersection(test_sources)) == 0
        )
    }

    # 4. Tokenizer Compatibility Check
    print("Testing Tokenizer and IndicProcessor compatibility across all datasets...")
    model_name = "ai4bharat/indictrans2-indic-indic-1B"
    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
    ip = IndicProcessor(inference=False)

    tokenizer_errors = []
    all_records = [("train", train_recs), ("validation", val_recs), ("test", test_recs)]

    for s_name, recs in all_records:
        src_texts = [r["source_text"] for r in recs]
        tgt_texts = [r["target_text"] for r in recs]

        try:
            # Preprocess
            proc_src = ip.preprocess_batch(src_texts, src_lang="hin_Deva", tgt_lang="sat_Olck")
            proc_tgt = ip.preprocess_batch(tgt_texts, src_lang="sat_Olck", tgt_lang="sat_Olck")

            # Tokenize
            enc_src = tokenizer(proc_src, padding=True, truncation=True, max_length=256, return_tensors="pt")
            enc_tgt = tokenizer(text_target=proc_tgt, padding=True, truncation=True, max_length=256, return_tensors="pt")

            print(f"  {s_name.capitalize()}: Tokenizer processed {len(recs)} pairs successfully (max src len: {enc_src['input_ids'].shape[1]}, max tgt len: {enc_tgt['input_ids'].shape[1]}).")
        except Exception as e:
            tokenizer_errors.append(f"{s_name} tokenization error: {e}")

    tokenizer_checks = {
        "all_splits_tokenizable": len(tokenizer_errors) == 0,
        "errors": tokenizer_errors
    }

    overall_pass = (
        all(count_checks[k] for k in ["train_count_pass", "val_count_pass", "test_count_pass"]) and
        all(empty_checks[k]["pass"] for k in empty_checks) and
        all(dup_checks[k]["pass"] for k in dup_checks) and
        leakage_checks["zero_leakage_pass"] and
        tokenizer_checks["all_splits_tokenizable"]
    )

    report = {
        "timestamp": "2026-09-01T02:47:45Z",
        "overall_validation_pass": overall_pass,
        "count_checks": count_checks,
        "empty_checks": empty_checks,
        "duplicate_checks": dup_checks,
        "script_checks": script_checks,
        "leakage_checks": leakage_checks,
        "tokenizer_checks": tokenizer_checks
    }

    os.makedirs("outputs", exist_ok=True)
    with open("outputs/phase4_data_validation.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 80)
    print(f"TASK 2 DATA VALIDATION RESULT: {'PASSED' if overall_pass else 'FAILED'}")
    print("Report saved to: outputs/phase4_data_validation.json")
    print("=" * 80)

    if not overall_pass:
        print("CRITICAL ERROR: Data validation failed. Halting pipeline.")
        sys.exit(1)

if __name__ == "__main__":
    main()
