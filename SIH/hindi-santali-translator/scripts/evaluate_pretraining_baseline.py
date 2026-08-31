"""
Task 11: Benchmark the Pre-training IndicTrans2 Baseline on data/evaluation/baseline_eval.jsonl.
Evaluates BLEU, chrF++, Ol Chiki validity, foreign contamination, repetition rate, and latency.
"""

import os
import sys
import json
import time
from typing import List, Dict, Any

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.translation.indictrans import IndicTransTranslator
from src.dataset.metrics import evaluate_predictions

sys.stdout.reconfigure(encoding="utf-8")

def main():
    eval_file = "data/evaluation/baseline_eval.jsonl"
    if not os.path.exists(eval_file):
        raise FileNotFoundError(f"Evaluation benchmark file not found at {eval_file}")

    print("=" * 80)
    print("TASK 11: Pre-training Baseline Evaluation on Fixed Evaluation Set")
    print(f"Loading evaluation dataset: {eval_file}")
    print("=" * 80)

    eval_records = []
    with open(eval_file, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                eval_records.append(json.loads(line.strip()))

    print(f"Loaded {len(eval_records)} evaluation examples.")

    # Initialize IndicTrans2 translator with Phase 2 verified configuration
    print("Initializing IndicTrans2 Translator on CPU...")
    translator = IndicTransTranslator()
    translator.load_model()

    inputs = [r["source_text"] for r in eval_records]
    references = [r["target_text"] for r in eval_records]
    predictions = []
    latencies = []

    # Run inference in batches of 16 for maximum CPU throughput
    batch_size = 16
    total_batches = (len(inputs) + batch_size - 1) // batch_size

    print(f"\nStarting inference across {len(inputs)} sentences in {total_batches} batches (batch_size={batch_size})...")
    print("Decoding configuration: repetition_penalty=1.2, num_beams=1")

    for b_idx in range(total_batches):
        b_start = b_idx * batch_size
        b_end = min(len(inputs), b_start + batch_size)
        batch_inputs = inputs[b_start:b_end]

        t0 = time.time()
        batch_preds = translator.translate(
            batch_inputs,
            src_lang="hin_Deva",
            tgt_lang="sat_Olck",
            max_length=256,
            num_beams=1,
            repetition_penalty=1.2
        )
        t_batch = time.time() - t0
        per_item_lat = t_batch / len(batch_inputs)

        predictions.extend(batch_preds)
        latencies.extend([per_item_lat] * len(batch_inputs))

        print(f"  Batch {b_idx+1}/{total_batches} ({len(batch_inputs)} items) completed in {t_batch:.2f}s ({per_item_lat:.2f}s/sent)")

    print("\nInference complete! Calculating automated metrics...")
    results = evaluate_predictions(inputs, references, predictions, latencies)

    # Save to outputs/pretraining_baseline_results.json
    output_path = "outputs/pretraining_baseline_results.json"
    os.makedirs("outputs", exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print("=" * 80)
    print("PRE-TRAINING BASELINE EVALUATION SUMMARY:")
    print("=" * 80)
    print(f"Total Sentences Evaluated      : {results['total_eval_samples']}")
    print(f"Corpus BLEU-4                   : {results['corpus_bleu_4']}")
    print(f"Corpus chrF++                   : {results['corpus_chrf_plus_plus']}")
    print(f"Ol Chiki Script Validity Rate   : {results['ol_chiki_validity_rate_pct']}%")
    print(f"Foreign-Script Contamination    : {results['foreign_script_contamination_rate_pct']}%")
    print(f"Repetition Rate                 : {results['repetition_rate_pct']}%")
    print(f"Empty Output Rate               : {results['empty_output_rate_pct']}%")
    print(f"Avg Latency per Sentence        : {results['avg_latency_seconds_per_sentence']}s")
    print(f"Total Evaluation Time           : {results['total_evaluation_time_seconds']}s")
    print(f"Results saved to                : {output_path}")
    print("=" * 80)

if __name__ == "__main__":
    main()
