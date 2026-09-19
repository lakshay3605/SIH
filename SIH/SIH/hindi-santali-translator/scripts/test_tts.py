"""
Test script to validate end-to-end voice translation:
Hindi Sentence -> IndicTrans2 -> Santali (Ol Chiki) -> Indic Parler-TTS -> WAV Audio
"""
import os
import sys
import time

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from src.pipeline import HindiToSantaliVoicePipeline

TEST_SENTENCE = "नमस्ते, आप सब कैसे हैं? आज मौसम बहुत सुहावना है।"


def run_tts_pipeline_test():
    print("=" * 70)
    print("Starting End-to-End Hindi -> Santali Voice Pipeline Test")
    print("=" * 70)

    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "outputs"))
    os.makedirs(output_dir, exist_ok=True)
    output_wav_path = os.path.join(output_dir, "test_output.wav")

    pipeline = HindiToSantaliVoicePipeline(default_speaker="Sumitra")

    print(f"Input Hindi Sentence: {TEST_SENTENCE}")
    print(f"Target Output Path   : {output_wav_path}")
    print("-" * 70)

    start_time = time.time()
    result = pipeline.process(
        hindi_text=TEST_SENTENCE,
        output_wav_path=output_wav_path,
        speaker="Sumitra",
    )
    total_time = time.time() - start_time

    print("=" * 70)
    print("Pipeline Execution Results")
    print("=" * 70)
    print(f"Input Hindi Text       : {result['hindi_text']}")
    print(f"Generated Santali Text : {result['santali_text']}")
    print(f"Generated WAV Audio    : {result['output_audio_path']}")
    print(f"Total Execution Time   : {total_time:.2f}s")
    
    if os.path.exists(result["output_audio_path"]):
        file_size_kb = os.path.getsize(result["output_audio_path"]) / 1024.0
        print(f"Audio File Size        : {file_size_kb:.2f} KB")
        print("Status                 : SUCCESS")
    else:
        print("Status                 : FAILED (Audio file not found)")
    print("=" * 70)


if __name__ == "__main__":
    run_tts_pipeline_test()
