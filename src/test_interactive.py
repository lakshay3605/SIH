"""
Interactive and Batch Model Verification Tester for Hindi -> Santali Translation.
Tests fine-tuned model outputs, verifies Ol Chiki script validity, measures latency,
and provides an interactive translation console.
"""

import sys
import time
import argparse

# Ensure UTF-8 output on Windows console
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from src.inference import (
    translate,
    translate_hindi_to_santali,
    translate_santali_to_hindi,
    translate_hindi_to_mundari,
    translate_mundari_to_hindi
)
from src.script_validator import (
    validate_ol_chiki,
    validate_devanagari,
    detect_script,
    normalize_text
)

VERIFICATION_BENCHMARK_SENTENCES = [
    {
        "domain": "Education",
        "hindi": "सभी बच्चों को स्कूल जाना चाहिए।",
        "expected_santali": "ᱥᱟᱱᱟᱢ ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ ᱟᱥᱲᱟ ᱥᱮᱱᱚᱜ ᱞᱟᱹᱠᱛᱤ ᱠᱟᱱᱟ᱾",
        "expected_mundari": "ᱥᱚᱵᱮᱱ ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ ᱤᱥᱠᱩᱞ ᱥᱮᱱᱚᱜ ᱞᱟᱹᱠᱛᱤ ᱠᱟᱱᱟ।"
    },
    {
        "domain": "Healthcare",
        "hindi": "समय पर दवाई खाइए और पानी उबालकर पीजिए।",
        "expected_santali": "ᱚᱠᱛᱚ ᱨᱮ ᱨᱟᱱ ᱡᱚᱢ ᱢᱮ ᱟᱨ ᱫᱟᱜ ᱦᱮᱰᱮᱡ ᱠᱟᱛᱮ ᱧᱩᱭ ᱢᱮ᱾",
        "expected_mundari": "ᱚᱠᱛᱚ ᱨᱮ ᱨᱟᱱ ᱡᱚᱢ ᱢᱮ।"
    },
    {
        "domain": "Governance & Civic",
        "hindi": "यह पंचायत का आधिकारिक कार्यालय है।",
        "expected_santali": "ᱱᱚᱶᱟ ᱫᱚ ᱯᱚᱧᱪᱟᱭᱚᱛ ᱨᱮᱱᱟᱜ ᱟᱹᱭᱫᱟᱹᱨᱤ ᱚᱯᱷᱤᱥ ᱠᱟᱱᱟ᱾",
        "expected_mundari": "ᱱᱮᱭᱟ ᱫᱚ ᱯᱚᱧᱪᱟᱭᱚᱛ ᱚᱲᱟᱜ ᱠᱟᱱᱟ।"
    },
    {
        "domain": "Daily Conversation",
        "hindi": "नमस्ते, आप कैसे हैं?",
        "expected_santali": "ᱡᱚᱦᱟᱨ, ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ?",
        "expected_mundari": "ᱡᱚᱦᱟᱨ, ᱟᱢ ᱪᱤᱞᱠᱟ ᱢᱮᱱᱟᱢᱟ?"
    },
    {
        "domain": "Agriculture & Environment",
        "hindi": "आज बहुत तेज़ बारिश हो रही है।",
        "expected_santali": "ᱛᱮᱦᱮᱧ ᱟᱹᱰᱤ ᱡᱚᱨ ᱫᱟᱜ ᱮᱫᱟᱭ᱾",
        "expected_mundari": "ᱛᱤᱥᱤᱧ ᱟᱹᱰᱤ ᱡᱚᱨ ᱫᱟᱜ ᱮᱫᱟᱭ।"
    }
]


def run_benchmark_verification(use_cache: bool = False, reverse: bool = False):
    """Runs automated verification on multi-domain benchmark sentences."""
    direction_label = "SANTALI (OL CHIKI) -> HINDI (DEVANAGARI) REVERSE" if reverse else "HINDI -> SANTALI (OL CHIKI)"
    print("=" * 80)
    print(f" {direction_label} MODEL VERIFICATION TEST ")
    print(f" Mode: {'Tier-1 Cache Accelerated' if use_cache else 'Pure Neural Autoregressive Generation'}")
    print("=" * 80)
    print(f"Total Test Cases: {len(VERIFICATION_BENCHMARK_SENTENCES)}")
    print("-" * 80)

    total_time = 0.0
    passed_validity = 0

    for i, test in enumerate(VERIFICATION_BENCHMARK_SENTENCES, 1):
        if reverse:
            src_input = test["expected_santali"]
            target_expected = test["hindi"]
            t0 = time.perf_counter()
            pred = translate_santali_to_hindi(src_input, use_phrase_cache=use_cache)
            latency = (time.perf_counter() - t0) * 1000
            val_res = validate_devanagari(pred)
            target_label = "Expected Hindi"
            pred_label = "Hindi Output"
            src_label = "Santali Input"
        else:
            src_input = test["hindi"]
            target_expected = test["expected_santali"]
            t0 = time.perf_counter()
            pred = translate_hindi_to_santali(src_input, use_phrase_cache=use_cache)
            latency = (time.perf_counter() - t0) * 1000
            val_res = validate_ol_chiki(pred)
            target_label = "Expected Target"
            pred_label = "Santali Output"
            src_label = "Hindi Input"

        total_time += latency
        is_valid = val_res["is_valid"]
        if is_valid:
            passed_validity += 1

        status_tag = "[PASS: VALID SCRIPT]" if is_valid else "[FAIL: SCRIPT ERROR]"

        print(f"[{i:02d}] Domain: {test['domain']}")
        print(f"     {src_label}:       {src_input}")
        print(f"     {pred_label}:      {pred}")
        print(f"     {target_label}:    {target_expected}")
        print(f"     Result:            {status_tag} | Latency: {latency:.2f}ms | Ratio: {val_res['validity_ratio'] * 100:.1f}%")
        print("-" * 80)

    avg_latency = total_time / len(VERIFICATION_BENCHMARK_SENTENCES)
    print("=" * 80)
    print(" VERIFICATION SUMMARY ")
    print("=" * 80)
    print(f"Script Compliance:         {passed_validity}/{len(VERIFICATION_BENCHMARK_SENTENCES)} ({passed_validity/len(VERIFICATION_BENCHMARK_SENTENCES)*100:.1f}%)")
    print(f"Average Inference Latency: {avg_latency:.2f} ms")
    print("=" * 80)


def interactive_mode(use_cache: bool = False, direction: str = "auto"):
    """Interactive bidirectional loop for translating custom sentences."""
    print("=" * 80)
    print(" HINDI <-> SANTALI (OL CHIKI) BIDIRECTIONAL CONSOLE ")
    print(f" Engine:    {'Neural + Tier-1 Cache' if use_cache else 'Pure Neural Generator'}")
    print(f" Direction: {direction.upper()} (Auto-detects Hindi Devanagari vs Santali Ol Chiki)")
    print(" Type a Hindi or Santali sentence (or 'exit' / 'quit' to stop):")
    print("=" * 80)

    while True:
        try:
            line = input("\n[Input] > ").strip()
            if not line or line.lower() in ("exit", "quit", "q"):
                print("Exiting console.")
                break

            script = detect_script(line)
            is_santali = (direction == "sat-hi") or (direction == "auto" and script == "ol_chiki")

            t0 = time.perf_counter()
            if is_santali:
                out = translate_santali_to_hindi(line, use_phrase_cache=use_cache)
                latency = (time.perf_counter() - t0) * 1000
                val = validate_devanagari(out)
                print(f"[Direction]        : Santali (Ol Chiki) -> Hindi (Devanagari)")
                print(f"[Hindi Devanagari] : {out}")
                print(f"[Analysis]         : Valid Devanagari: {val['is_valid']} | Latency: {latency:.2f}ms")
            else:
                out = translate_hindi_to_santali(line, use_phrase_cache=use_cache)
                latency = (time.perf_counter() - t0) * 1000
                val = validate_ol_chiki(out)
                print(f"[Direction]        : Hindi (Devanagari) -> Santali (Ol Chiki)")
                print(f"[Santali Ol Chiki] : {out}")
                print(f"[Analysis]         : Valid Ol Chiki: {val['is_valid']} | Latency: {latency:.2f}ms | Foreign chars: {val['foreign_chars']}")
        except (KeyboardInterrupt, EOFError):
            print("\nExiting console.")
            break


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test Hindi <-> Santali Translation Model")
    parser.add_argument("--interactive", "-i", action="store_true", help="Launch interactive translation console")
    parser.add_argument("--use-cache", "-c", action="store_true", help="Enable Tier-1 phrase cache for instant match lookups")
    parser.add_argument("--direction", "-d", choices=["auto", "hi-sat", "sat-hi"], default="auto", help="Translation direction")
    parser.add_argument("--reverse", "-r", action="store_true", help="Run benchmark verification for Santali -> Hindi")
    args = parser.parse_args()

    if args.interactive:
        interactive_mode(use_cache=args.use_cache, direction=args.direction)
    else:
        run_benchmark_verification(use_cache=args.use_cache, reverse=args.reverse or (args.direction == "sat-hi"))
