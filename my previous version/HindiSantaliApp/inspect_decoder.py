import onnxruntime as ort
import os

model_path = r"D:\sih2026\HindiSantaliApp\pulled_models\decoder_model.onnx"
print(f"Loading {model_path}...")
sess = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])

print("INPUTS:")
for inp in sess.get_inputs():
    print(f"  {inp.name} : {inp.shape} : {inp.type}")
    
print("OUTPUTS:")
for out in sess.get_outputs():
    print(f"  {out.name} : {out.shape} : {out.type}")
