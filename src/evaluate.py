"""
Aadivaani Real Evaluation Suite: Hindi (hin_Deva) -> Santali (sat_Olck).
Performs genuine autoregressive model generation, computes actual SacreBLEU and chrF++,
analyzes Ol Chiki script validity and foreign character contamination,
and generates an inspectable qualitative report.
"""

import os
import sys
import json
import time
import argparse
from typing import List, Dict, Optional

# Ensure UTF-8 output on Windows console
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from peft import PeftModel

from src.script_validator import normalize_text, validate_ol_chiki
from src.metrics import compute_translation_metrics


def run_evaluation(
    model_path: str,
    tokenizer_path: Optional[str] = None,
    base_model_id: Optional[str] = None,
    test_path: str = "data/processed/test.jsonl",
    output_report_path: str = "outputs/evaluation_results.json",
    max_samples: Optional[int] = None,
    batch_size: int = 4,
    max_gen_len: int = 128,
    num_beams: int = 1,
    sample_display_count: int = 25
) -> Dict:
    """
    Executes genuine neural evaluation:
    1. Loads actual model weights & tokenizer.
    2. Runs autoregressive decoding on test samples.
    3. Computes real SacreBLEU / chrF++ scores.
    4. Outputs structured inspection report.
    """
    if tokenizer_path is None:
        tokenizer_path = model_path

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("=" * 75)
    print("AADIVAANI GENUINE MODEL EVALUATION PIPELINE")
    print("=" * 75)
    print(f"Model Path    : {model_path}")
    print(f"Tokenizer Path: {tokenizer_path}")
    print(f"Test Set Path : {test_path}")
    print(f"Device        : {device}")
    print("=" * 75)

    # 1. Load Test Dataset
    if not os.path.exists(test_path):
        raise FileNotFoundError(f"Test dataset not found at {test_path}")

    test_samples = []
    with open(test_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                item = json.loads(line)
                h = normalize_text(item.get("hindi", ""))
                s = normalize_text(item.get("santali", ""))
                if h and s:
                    test_samples.append({"hindi": h, "santali": s})
                if max_samples and len(test_samples) >= max_samples:
                    break

    print(f"Loaded {len(test_samples)} test samples for evaluation.")
    if len(test_samples) == 0:
        raise ValueError("No valid test samples found.")

    # 2. Load Tokenizer & Model
    print("\n[1/3] Loading Tokenizer and Model...")
    tokenizer = AutoTokenizer.from_pretrained(tokenizer_path, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token or "<pad>"

    # Check if model_path is a PEFT LoRA adapter checkpoint
    adapter_config_path = os.path.join(model_path, "adapter_config.json")
    if os.path.exists(adapter_config_path):
        print(f"Detected PEFT LoRA checkpoint at '{model_path}'.")
        with open(adapter_config_path, "r", encoding="utf-8") as f:
            cfg = json.load(f)
        resolved_base_id = base_model_id or cfg.get("base_model_name_or_path")
        print(f"Loading Base Model: '{resolved_base_id}'...")
        base_model = AutoModelForSeq2SeqLM.from_pretrained(
            resolved_base_id,
            trust_remote_code=True,
            torch_dtype=torch.float32
        )
        print("Loading and attaching LoRA adapter weights...")
        model = PeftModel.from_pretrained(base_model, model_path)
    else:
        print(f"Loading direct Seq2Seq model from '{model_path}'...")
        model = AutoModelForSeq2SeqLM.from_pretrained(
            model_path,
            trust_remote_code=True,
            torch_dtype=torch.float32
        )

    model.to(device)
    model.eval()

    # 3. Autoregressive Inference Generation Loop
    print("\n[2/3] Generating model predictions via autoregressive decoding...")
    sources = [x["hindi"] for x in test_samples]
    references = [x["santali"] for x in test_samples]
    hypotheses = []
    latencies = []

    start_eval_time = time.time()

    for i in range(0, len(sources), batch_size):
        batch_src = sources[i:i + batch_size]
        t0 = time.perf_counter()

        if hasattr(tokenizer, "src_lang"):
            tokenizer.src_lang = "hin_Deva"

        # Ensure IndicTrans language prefix if using IndicTrans tokenizer
        formatted_batch_src = []
        for s in batch_src:
            if not s.startswith("hin_Deva"):
                formatted_batch_src.append(f"hin_Deva sat_Olck {s}")
            else:
                formatted_batch_src.append(s)

        inputs = tokenizer(
            formatted_batch_src,
            padding=True,
            truncation=True,
            max_length=128,
            return_tensors="pt"
        ).to(device)

        with torch.no_grad():
            gen_tokens = model.generate(
                input_ids=inputs["input_ids"],
                attention_mask=inputs["attention_mask"],
                max_length=max_gen_len,
                num_beams=num_beams,
                early_stopping=True if num_beams > 1 else False
            )

        batch_latency = time.perf_counter() - t0
        per_sentence_latency = batch_latency / len(batch_src)

        batch_preds = tokenizer.batch_decode(gen_tokens, skip_special_tokens=True)
        for pred in batch_preds:
            hypotheses.append(normalize_text(pred))
            latencies.append(round(per_sentence_latency, 4))

        if (i + len(batch_src)) % (batch_size * 5) == 0 or (i + len(batch_src)) == len(sources):
            print(f"  Processed {min(i + batch_size, len(sources))}/{len(sources)} sentences...")

    total_eval_duration = round(time.time() - start_eval_time, 2)
    print(f"Inference complete in {total_eval_duration}s (Avg Latency: {sum(latencies)/len(latencies)*1000:.1f}ms/sentence)")

    # 4. Compute Genuine Metrics
    print("\n[3/3] Calculating genuine SacreBLEU, chrF++, and script compliance metrics...")
    metrics = compute_translation_metrics(hypotheses, references, latencies)

    # 5. Build Inspectable Qualitative Samples
    qualitative_samples = []
    for idx in range(min(sample_display_count, len(sources))):
        src_h = sources[idx]
        ref_s = references[idx]
        hyp_s = hypotheses[idx]
        script_val = validate_ol_chiki(hyp_s)

        # Single sample chrF approximation for report
        sample_metrics = compute_translation_metrics([hyp_s], [ref_s])

        qualitative_samples.append({
            "sample_index": idx + 1,
            "hindi_input": src_h,
            "santali_reference": ref_s,
            "santali_hypothesis": hyp_s,
            "ol_chiki_valid": script_val["is_valid"],
            "foreign_chars_detected": script_val["foreign_chars"],
            "sample_bleu_4": sample_metrics.get("bleu_4", 0.0),
            "sample_chrf_plus_plus": sample_metrics.get("chrf_plus_plus", 0.0)
        })

    report = {
        "evaluation_metadata": {
            "model_path": model_path,
            "tokenizer_path": tokenizer_path,
            "test_set_path": test_path,
            "evaluated_samples_count": len(sources),
            "num_beams": num_beams,
            "total_duration_sec": total_eval_duration,
            "device": str(device)
        },
        "aggregate_metrics": metrics,
        "inspectable_samples": qualitative_samples
    }

    # Save to JSON
    os.makedirs(os.path.dirname(output_report_path) or ".", exist_ok=True)
    with open(output_report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print("=" * 75)
    print("EVALUATION RESULTS SUMMARY")
    print("=" * 75)
    print(f"BLEU-4 Score              : {metrics.get('bleu_4', 'N/A')}")
    print(f"chrF++ Score              : {metrics.get('chrf_plus_plus', 'N/A')}")
    print(f"Ol Chiki Script Validity  : {metrics.get('ol_chiki_validity_pct', 'N/A')}%")
    print(f"Foreign Contamination     : {metrics.get('foreign_contamination_pct', 'N/A')}%")
    print(f"Repetition Loop Rate      : {metrics.get('repetition_pct', 'N/A')}%")
    print(f"Empty Output Rate         : {metrics.get('empty_output_pct', 'N/A')}%")
    print(f"Average Latency           : {metrics.get('average_latency_sec', 0)*1000:.2f} ms")
    print(f"Full Report Saved To      : {output_report_path}")
    print("=" * 75)

    # Print first 3 inspectable samples to stdout
    print("\nSAMPLE PREDICTIONS (First 3):")
    for s in qualitative_samples[:3]:
        print(f"[{s['sample_index']}] Hindi : {s['hindi_input']}")
        print(f"    Ref   : {s['santali_reference']}")
        print(f"    Hyp   : {s['santali_hypothesis']}")
        print(f"    Script Valid: {s['ol_chiki_valid']} | chrF++: {s['sample_chrf_plus_plus']}")
        print("-" * 75)

    return report


def parse_args():
    parser = argparse.ArgumentParser(description="Aadivaani Real Evaluation Script")
    parser.add_argument("--model_path", type=str, required=True, help="Path to trained model or PEFT checkpoint directory")
    parser.add_argument("--tokenizer_path", type=str, default=None, help="Path to tokenizer")
    parser.add_argument("--base_model_id", type=str, default=None, help="Base model ID if evaluating a PEFT adapter")
    parser.add_argument("--test_path", type=str, default="data/processed/test.jsonl")
    parser.add_argument("--output_report", type=str, default="outputs/evaluation_results.json")
    parser.add_argument("--max_samples", type=int, default=None, help="Limit number of test samples")
    parser.add_argument("--batch_size", type=int, default=4)
    parser.add_argument("--num_beams", type=int, default=1)
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run_evaluation(
        model_path=args.model_path,
        tokenizer_path=args.tokenizer_path,
        base_model_id=args.base_model_id,
        test_path=args.test_path,
        output_report_path=args.output_report,
        max_samples=args.max_samples,
        batch_size=args.batch_size,
        num_beams=args.num_beams
    )
