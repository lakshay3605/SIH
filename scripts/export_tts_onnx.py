"""
Exports facebook/mms-tts-sat (VITS) to SherpaOnnx-compatible ONNX format.
Run once on the developer PC.
Output goes to: d:\sih2026\tts_model\

Requirements:
    pip install transformers torch onnx onnxruntime sherpa-onnx
"""

import os
import sys
import torch
import onnx
from transformers import VitsModel, AutoTokenizer
from onnxruntime.quantization import quantize_dynamic, QuantType

MODEL_ID = "facebook/mms-tts-sat"
OUTPUT_DIR = r"d:\sih2026\tts_model"
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("Loading MMS Santali TTS model...")
model = VitsModel.from_pretrained(MODEL_ID, token=False)
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, token=False)
model.eval()

# Test input — simple Santali greeting
sample_text = "ᱡᱚᱦᱟᱨ"
inputs = tokenizer(sample_text, return_tensors="pt")

print("Exporting to ONNX...")
onnx_path = os.path.join(OUTPUT_DIR, "model.onnx")

with torch.no_grad():
    torch.onnx.export(
        model,
        (inputs["input_ids"],),
        onnx_path,
        opset_version=17,
        input_names=["input_ids"],
        output_names=["waveform"],
        dynamic_axes={
            "input_ids": {0: "batch", 1: "sequence"},
            "waveform":  {0: "batch", 2: "samples"},
        },
        do_constant_folding=True,
    )
print(f"Exported: {onnx_path} ({os.path.getsize(onnx_path) // 1024 // 1024} MB)")

print("Quantizing to INT8...")
int8_path = os.path.join(OUTPUT_DIR, "model.int8.onnx")
quantize_dynamic(onnx_path, int8_path, weight_type=QuantType.QInt8)
os.remove(onnx_path)  # Remove float32 version
print(f"INT8 model: {int8_path} ({os.path.getsize(int8_path) // 1024 // 1024} MB)")

# Save sample rate info
sample_rate = model.config.sampling_rate  # Should be 16000 for MMS
with open(os.path.join(OUTPUT_DIR, "config.txt"), "w") as f:
    f.write(f"sample_rate={sample_rate}\n")
    f.write(f"model_id={MODEL_ID}\n")

print(f"\nDone. Sample rate: {sample_rate}")
print(f"Files saved to: {OUTPUT_DIR}")
print("Upload model.int8.onnx and config.txt to HuggingFace, then update TTS_BASE_URL in TtsModelDownloader.kt")
