"""
Task 5: End-to-End Hindi -> Santali Voice Translation Validation.
Executes the full pipeline:
Hindi text -> IndicTrans2 (sat_Olck) -> Script Validation -> Indic Parler-TTS -> WAV Audio
Tested across 3 representative categories:
1. Casual Conversation
2. Question
3. Rural / Agriculture
Saves results to outputs/end_to_end_results.json matching exact user schema.
"""
import os
import sys
import time
import json
import soundfile as sf

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from src.translation.indictrans import IndicTransTranslator
from src.translation.validator import validate_ol_chiki
from src.tts.santali_tts import SantaliTTS

TEST_CASES = [
    {
        "id": "e2e_casual",
        "category": "Casual Conversation",
        "hindi": "नमस्ते, आप कैसे हैं और आपका दिन कैसा बीत रहा है?",
        "speaker": "Sumitra",
        "output_file": "e2e_output_01_casual.wav"
    },
    {
        "id": "e2e_question",
        "category": "Question",
        "hindi": "क्या आप मुझे नजदीकी प्राथमिक स्वास्थ्य केंद्र का रास्ता बता सकते हैं?",
        "speaker": "Sumitra",
        "output_file": "e2e_output_02_question.wav"
    },
    {
        "id": "e2e_agriculture",
        "category": "Rural / Agriculture",
        "hindi": "इस साल मानसूनी बारिश अच्छी होने से धान और मक्के की फसल बहुत अच्छी हुई है।",
        "speaker": "Raju",
        "output_file": "e2e_output_03_agriculture.wav"
    },
]


def run_end_to_end_suite():
    print("=" * 80)
    print("TASK 5: End-to-End Hindi -> Santali Voice Translation Suite")
    print("=" * 80)

    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "outputs"))
    os.makedirs(output_dir, exist_ok=True)

    print("Initializing IndicTrans2 Translator...")
    translator = IndicTransTranslator()
    translator.load_model()

    print("Initializing Indic Parler-TTS Synthesizer...")
    tts = SantaliTTS()
    tts.load_model()

    records = []

    for idx, test_case in enumerate(TEST_CASES, 1):
        cat = test_case["category"]
        hindi_text = test_case["hindi"]
        speaker = test_case["speaker"]
        wav_path = os.path.join(output_dir, test_case["output_file"])

        print(f"\n[{idx}/3] Category: {cat}")
        print(f"  Hindi Input: {hindi_text}")

        # Step 1: Translation with repetition penalty to prevent loop artifacts
        t_trans_start = time.time()
        # Preprocess and generate with repetition penalty 1.2
        preprocessed = translator.ip.preprocess_batch([hindi_text], src_lang="hin_Deva", tgt_lang="sat_Olck")
        inputs = translator.tokenizer(preprocessed, padding=True, truncation=True, max_length=256, return_tensors="pt").to(translator.device)
        
        import torch
        with torch.inference_mode():
            generated_tokens = translator.model.generate(
                **inputs,
                max_length=256,
                repetition_penalty=1.2,
                no_repeat_ngram_size=3,
                use_cache=True,
            )
        
        with translator.tokenizer.as_target_tokenizer():
            decoded = translator.tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)
        
        santali_text = translator.ip.postprocess_batch(decoded, lang="sat_Olck")[0]
        trans_latency = time.time() - t_trans_start

        # Step 2: Ol Chiki Script Validation
        script_val = validate_ol_chiki(santali_text)

        print(f"  Santali (Raw) : {santali_text}")
        print(f"  Script Valid  : {script_val['valid']} (Ol Chiki Ratio: {script_val['ol_chiki_ratio']:.2f})")
        print(f"  Trans Latency : {trans_latency:.2f}s")

        # Step 3: Santali TTS Audio Synthesis
        t_tts_start = time.time()
        tts.synthesize(text=santali_text, output_path=wav_path, speaker=speaker)
        tts_latency = time.time() - t_tts_start

        audio_data, sample_rate = sf.read(wav_path)
        duration_sec = len(audio_data) / sample_rate

        print(f"  Audio Path    : {wav_path}")
        print(f"  Audio Duration: {duration_sec:.2f}s")
        print(f"  TTS Latency   : {tts_latency:.2f}s")

        record = {
            "hindi_input": hindi_text,
            "santali_output": santali_text,
            "script_validation": script_val,
            "translation_latency_seconds": round(trans_latency, 2),
            "tts_latency_seconds": round(tts_latency, 2),
            "audio_path": wav_path,
            "audio_duration_seconds": round(duration_sec, 2),
        }
        records.append(record)

    # Save to outputs/end_to_end_results.json
    json_path = os.path.join(output_dir, "end_to_end_results.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 80)
    print(f"TASK 5 Complete! End-to-end results saved to: {json_path}")
    print("=" * 80)


if __name__ == "__main__":
    run_end_to_end_suite()
