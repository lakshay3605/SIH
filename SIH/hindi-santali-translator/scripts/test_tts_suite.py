"""
Task 4: Dedicated Santali Indic Parler-TTS Validation Suite.
Tests:
- Model download verification & disk footprint
- Santali language configuration ('sat' / 'sat_Olck')
- Speaker voice testing ('Sumitra' female, 'Raju' male)
- Audio sample rate, WAV duration, latency, RTF (Real-Time Factor)
- Peak RAM / Peak VRAM
- Generates outputs/tts_test_01.wav, outputs/tts_test_02.wav, outputs/tts_test_03.wav
- Writes outputs/tts_results.json
"""
import os
import sys
import time
import json
import psutil
import soundfile as sf
import torch

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from src.tts.santali_tts import SantaliTTS

TEST_SANTALI_SENTENCES = [
    {
        "id": "tts_01",
        "category": "Casual Greeting",
        "santali": "ᱡᱚᱦᱟᱨ, ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ ᱢᱮᱭᱟ?",
        "speaker": "Sumitra",
        "output_file": "tts_test_01.wav"
    },
    {
        "id": "tts_02",
        "category": "Question",
        "santali": "ᱟᱢᱟᱜ ᱟᱹᱛᱩ ᱨᱮᱱᱟᱜ ᱧᱩᱛᱩᱢ ᱫᱚ ᱪᱮᱫ?",
        "speaker": "Sumitra",
        "output_file": "tts_test_02.wav"
    },
    {
        "id": "tts_03",
        "category": "Rural / Agriculture",
        "santali": "ᱱᱚᱶᱟ ᱥᱮᱨᱢᱟ ᱦᱳᱲᱳ ᱟᱨ ᱡᱚᱱᱰᱨᱟ ᱪᱟᱥ ᱟᱹᱰᱤ ᱱᱟᱯᱟᱭ ᱦᱩᱭ ᱟᱠᱟᱱᱟ ᱾",
        "speaker": "Raju",
        "output_file": "tts_test_03.wav"
    },
]


def run_tts_suite():
    print("=" * 80)
    print("TASK 4: Indic Parler-TTS Dedicated Santali Validation Suite")
    print("=" * 80)

    process = psutil.Process()
    initial_ram = process.memory_info().rss / (1024 * 1024)
    print(f"Initial Process RAM: {initial_ram:.1f} MB")

    tts = SantaliTTS()
    t_load_start = time.time()
    tts.load_model()
    load_time = time.time() - t_load_start
    loaded_ram = process.memory_info().rss / (1024 * 1024)
    print(f"Model loaded in {load_time:.2f}s | RAM after load: {loaded_ram:.1f} MB (Delta: +{loaded_ram - initial_ram:.1f} MB)")

    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "outputs"))
    os.makedirs(output_dir, exist_ok=True)

    results = []
    peak_ram = loaded_ram

    for item in TEST_SANTALI_SENTENCES:
        santali_text = item["santali"]
        speaker = item["speaker"]
        wav_filename = item["output_file"]
        wav_path = os.path.join(output_dir, wav_filename)

        print(f"\n--- Synthesizing [{item['id']}] Speaker: {speaker} ---")
        print(f"Text: {santali_text}")

        t0 = time.time()
        res = tts.synthesize(text=santali_text, output_path=wav_path, speaker=speaker)
        infer_time = time.time() - t0

        curr_ram = process.memory_info().rss / (1024 * 1024)
        if curr_ram > peak_ram:
            peak_ram = curr_ram

        # Read generated audio properties
        audio_data, sample_rate = sf.read(wav_path)
        duration_sec = len(audio_data) / sample_rate
        rtf = infer_time / duration_sec if duration_sec > 0 else 0.0

        print(f"  WAV Path      : {wav_path}")
        print(f"  Sample Rate   : {sample_rate} Hz")
        print(f"  Audio Duration: {duration_sec:.2f} s")
        print(f"  Inference Time: {infer_time:.2f} s (RTF: {rtf:.2f}x real-time)")
        print(f"  Process RAM   : {curr_ram:.1f} MB")

        results.append({
            "id": item["id"],
            "category": item["category"],
            "santali_text": santali_text,
            "speaker": speaker,
            "output_path": wav_path,
            "sample_rate": sample_rate,
            "audio_duration_seconds": round(duration_sec, 2),
            "inference_latency_seconds": round(infer_time, 2),
            "real_time_factor": round(rtf, 2),
            "device": tts.device,
            "ram_mb": round(curr_ram, 1),
            "status": "SUCCESS"
        })

    # Model file size calculation
    import glob
    model_cache_files = glob.glob(os.path.expanduser("~/.cache/huggingface/hub/**/models--ai4bharat--indic-parler-tts/**"), recursive=True)
    total_size_bytes = sum(os.path.getsize(f) for f in model_cache_files if os.path.isfile(f))
    model_size_mb = total_size_bytes / (1024 * 1024)

    has_gpu = torch.cuda.is_available()
    vram_mb = torch.cuda.max_memory_allocated() / (1024 * 1024) if has_gpu else 0.0

    summary = {
        "model_name": tts.model_name,
        "model_disk_size_mb": round(model_size_mb, 2),
        "model_load_time_sec": round(load_time, 2),
        "device": tts.device,
        "gpu_available": has_gpu,
        "peak_ram_mb": round(peak_ram, 1),
        "peak_vram_mb": round(vram_mb, 1),
        "sentences_tested": len(results),
        "results": results
    }

    json_path = os.path.join(output_dir, "tts_results.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 80)
    print(f"TASK 4 Summary: All 3 Santali speech files generated! Results saved to: {json_path}")
    print("=" * 80)


if __name__ == "__main__":
    run_tts_suite()
