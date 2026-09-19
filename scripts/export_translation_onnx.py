"""
Export IndicTrans2 Distilled 200M to ONNX INT8 for Android deployment.
Run this ONCE on the developer PC. Output goes to d:\sih2026\translation_model\

Requirements: pip install optimum[onnxruntime] transformers torch sentencepiece
"""

import os
import subprocess
import sys

OUTPUT_DIR = r"d:\sih2026\translation_model"
MODEL_ID = "ai4bharat/indictrans2-indic-indic-dist-320M"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Step 1: Install requirements
subprocess.run([sys.executable, "-m", "pip", "install",
    "optimum[onnxruntime]", "transformers", "torch",
    "sentencepiece", "sacremoses", "mosestokenizer",
    "indic-nlp-library", "IndicTransToolkit"], check=True)

# Step 2: Export to ONNX via optimum-cli
# This exports encoder_model.onnx, decoder_model.onnx, decoder_with_past_model.onnx
subprocess.run([
    sys.executable, "-m", "optimum.commands.optimum_cli", "export", "onnx",
    "--model", MODEL_ID,
    "--task", "text2text-generation-with-past",
    "--trust-remote-code",
    "--framework", "pt",
    OUTPUT_DIR
], check=True)

# Step 3: Quantize to INT8 to reduce size from ~800MB to ~200MB
from onnxruntime.quantization import quantize_dynamic, QuantType
import os

for onnx_file in ["encoder_model.onnx", "decoder_model.onnx", "decoder_with_past_model.onnx"]:
    src = os.path.join(OUTPUT_DIR, onnx_file)
    dst = os.path.join(OUTPUT_DIR, onnx_file.replace(".onnx", ".int8.onnx"))
    if os.path.exists(src):
        print(f"Quantizing {onnx_file}...")
        quantize_dynamic(src, dst, weight_type=QuantType.QInt8)
        os.remove(src)  # Remove the float32 version to save space
        print(f"Done: {dst}")

print("\nAll done! Files are in:", OUTPUT_DIR)
print("Upload these to HuggingFace or serve from your own server, then update TRANSLATION_BASE_URL in TranslationModelDownloader.kt")
