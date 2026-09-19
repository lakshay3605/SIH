"""
Task 2: Controlled comparison of generation/decoding strategies on IndicTrans2 1B (hin_Deva -> sat_Olck).
Configurations tested:
- Config A: Current baseline (Greedy search: num_beams=1, repetition_penalty=1.0)
- Config B: Repetition Penalty (repetition_penalty=1.2, num_beams=1)
- Config C: Repetition Penalty + N-gram Blocking (repetition_penalty=1.2, no_repeat_ngram_size=3)
- Config D: Beam Search (num_beams=4, early_stopping=True)
"""
import os
import sys
import time
import json
from typing import Dict, Any, List

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from src.translation.indictrans import IndicTransTranslator
from src.translation.validator import validate_ol_chiki

TEST_SENTENCES = [
    {
        "id": "casual",
        "category": "Casual Conversation",
        "hindi": "नमस्ते, आप कैसे हैं और आपका दिन कैसा बीत रहा है?",
    },
    {
        "id": "question",
        "category": "Question",
        "hindi": "क्या आप मुझे नजदीकी प्राथमिक स्वास्थ्य केंद्र का रास्ता बता सकते हैं?",
    },
    {
        "id": "instruction",
        "category": "Instruction",
        "hindi": "कृपया यहाँ शांति से बैठिए और जब तक डॉक्टर न बुलाएँ प्रतीक्षा कीजिए।",
    },
    {
        "id": "numbers",
        "category": "Numbers & Quantities",
        "hindi": "बाजार से दो किलो चावल, तीन लीटर दूध और पाँच सौ ग्राम दाल लेकर आओ।",
    },
    {
        "id": "agriculture",
        "category": "Rural & Agriculture",
        "hindi": "इस साल मानसूनी बारिश अच्छी होने से धान और मक्के की फसल बहुत अच्छी हुई है।",
    },
]

CONFIGURATIONS = [
    {
        "name": "Config A: Baseline (Greedy)",
        "gen_kwargs": {"num_beams": 1, "repetition_penalty": 1.0, "no_repeat_ngram_size": 0},
    },
    {
        "name": "Config B: Repetition Penalty (1.2)",
        "gen_kwargs": {"num_beams": 1, "repetition_penalty": 1.2, "no_repeat_ngram_size": 0},
    },
    {
        "name": "Config C: Repetition Penalty (1.2) + N-gram (3)",
        "gen_kwargs": {"num_beams": 1, "repetition_penalty": 1.2, "no_repeat_ngram_size": 3},
    },
    {
        "name": "Config D: Beam Search (Beams=4)",
        "gen_kwargs": {"num_beams": 4, "early_stopping": True, "repetition_penalty": 1.0, "no_repeat_ngram_size": 0},
    },
]


def detect_obvious_repetition(text: str) -> bool:
    """Checks for repeating words, loops, or consecutive duplicate phrases."""
    words = text.split()
    if len(words) < 4:
        return False
    # Check consecutive word repeats
    for i in range(len(words) - 3):
        if words[i] == words[i+1] == words[i+2]:
            return True
        if i + 3 < len(words) and words[i:i+2] == words[i+2:i+4]:
            return True
    return False


def run_decoding_matrix():
    print("=" * 80)
    print("TASK 2: IndicTrans2 Controlled Decoding Strategy Matrix Comparison")
    print("=" * 80)

    translator = IndicTransTranslator()
    translator.load_model()

    matrix_results = []

    for cfg in CONFIGURATIONS:
        cfg_name = cfg["name"]
        gen_kwargs = cfg["gen_kwargs"]
        print(f"\n>>> Running Benchmark for: {cfg_name}")
        print(f"    Parameters: {gen_kwargs}")

        cfg_records = []
        total_time = 0.0

        for sample in TEST_SENTENCES:
            hindi_text = sample["hindi"]
            cat = sample["category"]

            # Run translation with explicit kwargs
            t0 = time.time()
            try:
                # Preprocess
                preprocessed = translator.ip.preprocess_batch([hindi_text], src_lang="hin_Deva", tgt_lang="sat_Olck")
                inputs = translator.tokenizer(preprocessed, padding=True, truncation=True, max_length=256, return_tensors="pt").to(translator.device)
                
                import torch
                with torch.inference_mode():
                    generated_tokens = translator.model.generate(
                        **inputs,
                        max_length=256,
                        use_cache=True,
                        **gen_kwargs
                    )
                
                with translator.tokenizer.as_target_tokenizer():
                    decoded = translator.tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)
                
                santali_text = translator.ip.postprocess_batch(decoded, lang="sat_Olck")[0]
                infer_time = time.time() - t0
                total_time += infer_time

                # Validate Ol Chiki script
                validation = validate_ol_chiki(santali_text)
                has_repetition = detect_obvious_repetition(santali_text)

                record = {
                    "id": sample["id"],
                    "category": cat,
                    "hindi_input": hindi_text,
                    "santali_output": santali_text,
                    "latency_sec": round(infer_time, 2),
                    "script_valid": validation["valid"],
                    "ol_chiki_ratio": validation["ol_chiki_ratio"],
                    "invalid_spans": validation["invalid_spans"],
                    "has_repetition": has_repetition,
                    "cleaned_candidate": validation["cleaned_candidate"],
                }
                cfg_records.append(record)
                print(f"  [{sample['id'].upper():11s}] Latency: {infer_time:5.2f}s | Valid: {str(validation['valid']):5s} | Ratio: {validation['ol_chiki_ratio']:.2f} | Repeat: {has_repetition}")
                print(f"    Out: {santali_text[:70]}...")

            except Exception as e:
                infer_time = time.time() - t0
                print(f"  [{sample['id'].upper():11s}] ERROR: {e}")
                cfg_records.append({
                    "id": sample["id"],
                    "category": cat,
                    "hindi_input": hindi_text,
                    "santali_output": "",
                    "latency_sec": round(infer_time, 2),
                    "error": str(e),
                    "script_valid": False,
                    "ol_chiki_ratio": 0.0,
                    "has_repetition": False,
                })

        matrix_results.append({
            "configuration": cfg_name,
            "gen_kwargs": gen_kwargs,
            "total_time_sec": round(total_time, 2),
            "avg_time_sec": round(total_time / len(TEST_SENTENCES), 2),
            "records": cfg_records
        })

    # Save complete matrix results
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "outputs"))
    os.makedirs(output_dir, exist_ok=True)
    json_path = os.path.join(output_dir, "decoding_comparison_results.json")

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(matrix_results, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 80)
    print(f"Task 2 Benchmark Complete! Matrix results saved to: {json_path}")
    print("=" * 80)


if __name__ == "__main__":
    run_decoding_matrix()
