"""
Test script to validate IndicTrans2 Hindi -> Santali (Ol Chiki) translation.
Covers:
- Casual conversation
- Questions
- Instructions
- Numbers
- Rural / Agriculture vocabulary
"""
import os
import sys
import time

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.translation.indictrans import IndicTransTranslator

TEST_SENTENCES = [
    {
        "category": "Casual Conversation",
        "hindi": "नमस्ते, आप कैसे हैं और आपका दिन कैसा बीत रहा है?",
    },
    {
        "category": "Question",
        "hindi": "क्या आप मुझे नजदीकी प्राथमिक स्वास्थ्य केंद्र का रास्ता बता सकते हैं?",
    },
    {
        "category": "Instruction",
        "hindi": "कृपया यहाँ शांति से बैठिए और जब तक डॉक्टर न बुलाएँ प्रतीक्षा कीजिए।",
    },
    {
        "category": "Numbers & Quantities",
        "hindi": "बाजार से दो किलो चावल, तीन लीटर दूध और पाँच सौ ग्राम दाल लेकर आओ।",
    },
    {
        "category": "Rural & Agriculture",
        "hindi": "इस साल मानसूनी बारिश अच्छी होने से धान और मक्के की फसल बहुत अच्छी हुई है।",
    },
]


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

def run_translation_tests():
    print("=" * 70)
    print("Starting IndicTrans2 Hindi -> Santali (Ol Chiki) Translation Tests")
    print("=" * 70)

    start_init = time.time()
    translator = IndicTransTranslator()
    translator.load_model()
    init_time = time.time() - start_init
    print(f"Model initialization completed in {init_time:.2f}s on device: {translator.device}\n")

    results = []
    total_infer_time = 0.0

    for i, sample in enumerate(TEST_SENTENCES, 1):
        category = sample["category"]
        hindi_text = sample["hindi"]
        
        print(f"[{i}/{len(TEST_SENTENCES)}] Category: {category}")
        print(f"  Hindi Input   : {hindi_text}")
        
        t0 = time.time()
        try:
            santali_text = translator.translate(hindi_text)
            infer_time = time.time() - t0
            total_infer_time += infer_time
            print(f"  Santali Output: {santali_text}")
            print(f"  Inference Time: {infer_time:.2f}s\n")
            results.append({
                "category": category,
                "hindi": hindi_text,
                "santali": santali_text,
                "time_sec": round(infer_time, 2),
                "status": "SUCCESS"
            })
        except Exception as e:
            infer_time = time.time() - t0
            print(f"  ERROR: {e}\n")
            results.append({
                "category": category,
                "hindi": hindi_text,
                "santali": "",
                "time_sec": round(infer_time, 2),
                "status": f"FAILED: {e}"
            })

    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "outputs"))
    os.makedirs(output_dir, exist_ok=True)
    json_path = os.path.join(output_dir, "translation_results.json")
    
    import json
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "model": translator.model_name,
            "device": translator.device,
            "init_time_sec": round(init_time, 2),
            "total_inference_time_sec": round(total_infer_time, 2),
            "avg_time_per_sentence_sec": round(total_infer_time / len(TEST_SENTENCES), 2),
            "results": results
        }, f, ensure_ascii=False, indent=2)

    print("=" * 70)
    print("Summary of Translation Tests")
    print("=" * 70)
    print(f"Total Sentences Tested: {len(TEST_SENTENCES)}")
    print(f"Total Inference Time  : {total_infer_time:.2f}s (Avg: {total_infer_time / len(TEST_SENTENCES):.2f}s/sentence)")
    print(f"Results saved to      : {json_path}")
    print("=" * 70)


if __name__ == "__main__":
    run_translation_tests()
