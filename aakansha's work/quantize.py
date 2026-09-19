import onnxruntime
from onnxruntime.quantization import quantize_dynamic, QuantType
import os

model_dir = r"d:\sih2026\aakansha's work\indictrans2_200m_hi_sat_onnx"
out_dir   = r"d:\sih2026\aakansha's work\indictrans2_200m_hi_sat_int8"
os.makedirs(out_dir, exist_ok=True)

for fname in ["encoder_model.onnx", "decoder_model.onnx"]:
    src = os.path.join(model_dir, fname)
    dst = os.path.join(out_dir, fname.replace(".onnx", "_int8.onnx"))
    print(f"Quantizing {fname} ({os.path.getsize(src)//1024//1024}MB)...")
    quantize_dynamic(src, dst, weight_type=QuantType.QInt8)
    print(f"  -> {dst} ({os.path.getsize(dst)//1024//1024}MB)")

print("Done.")
