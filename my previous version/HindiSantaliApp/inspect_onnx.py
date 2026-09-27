"""
Use onnxruntime to inspect model inputs/outputs.
Pull full models from device first if needed.
"""
import subprocess, os

model_dir = r"D:\sih2026\pulled_models"
os.makedirs(model_dir, exist_ok=True)

# Files to inspect - only pull the small .onnx files (not the .data files, just need headers)
files = [
    ("encoder_model.onnx", 831435),
    ("decoder_model.onnx", 2037642),
    ("decoder_with_past_model.onnx", 1850619),
]

for fname, expected_size in files:
    dst = os.path.join(model_dir, fname)
    if not os.path.exists(dst) or os.path.getsize(dst) != expected_size:
        print(f"Pulling {fname} from device...")
        result = subprocess.run(
            ["adb", "shell", "run-as", "com.example.hindisantali", "cat", f"files/translation_model/{fname}"],
            capture_output=True
        )
        with open(dst, 'wb') as f:
            f.write(result.stdout)
        print(f"  -> {len(result.stdout)} bytes")
    else:
        print(f"Already have {fname} ({os.path.getsize(dst)} bytes)")

# Use onnxruntime to inspect - it can read model metadata without the .data file
# by using model loading with skip_external_data
import onnxruntime as ort

for fname, _ in files:
    path = os.path.join(model_dir, fname)
    print(f"\n{'='*60}")
    print(f"=== {fname} ===")
    
    # Try with InferenceSession directly
    try:
        opts = ort.SessionOptions()
        # Use load model from path directly
        sess = ort.InferenceSession(path, sess_options=opts, providers=['CPUExecutionProvider'])
        print(f"INPUTS ({len(sess.get_inputs())}):")
        for inp in sess.get_inputs():
            print(f"  [{inp.name}]: shape={inp.shape} type={inp.type}")
        print(f"OUTPUTS ({len(sess.get_outputs())}):")
        for out in sess.get_outputs():
            print(f"  [{out.name}]: shape={out.shape} type={out.type}")
    except Exception as e:
        print(f"Session error: {e}")
        # Try onnx model loading with external data skipped
        try:
            import onnx
            model = onnx.load(path, load_external_data=False)
            graph = model.graph
            print(f"INPUTS ({len(graph.input)}) [onnx, no ext data]:")
            for inp in graph.input:
                try:
                    shape = [d.dim_value if d.dim_value != 0 else d.dim_param 
                             for d in inp.type.tensor_type.shape.dim]
                except:
                    shape = "?"
                print(f"  [{inp.name}]: shape={shape}")
            print(f"OUTPUTS ({len(graph.output)}):")
            for out in graph.output:
                try:
                    shape = [d.dim_value if d.dim_value != 0 else d.dim_param 
                             for d in out.type.tensor_type.shape.dim]
                except:
                    shape = "?"
                print(f"  [{out.name}]: shape={shape}")
        except Exception as e2:
            print(f"onnx error: {e2}")
