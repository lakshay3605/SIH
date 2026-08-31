"""
Live Progress Monitor for Hugging Face Model Downloads.
Continuously checks the downloaded byte count in ~/.cache/huggingface/hub and prints progress.
"""
import os
import glob
import time
import sys

TOTAL_EXPECTED_MB = 4090.0  # Approx size for IndicTrans2 1B safetensors

def monitor():
    print("=" * 65)
    print("  Hugging Face Model Download Live Monitor")
    print(f"  Target: IndicTrans2 1B Model (~{TOTAL_EXPECTED_MB:.0f} MB)")
    print("=" * 65)
    
    last_size = 0.0
    last_time = time.time()
    
    while True:
        pattern = os.path.expanduser("~/.cache/huggingface/hub/**/574d*.incomplete")
        files = glob.glob(pattern, recursive=True)
        completed_safetensors = glob.glob(os.path.expanduser("~/.cache/huggingface/hub/**/model.safetensors"), recursive=True)
        
        now = time.time()
        dt = max(now - last_time, 0.001)
        
        if files:
            file_path = files[0]
            current_bytes = os.path.getsize(file_path)
            current_mb = current_bytes / (1024 * 1024)
            pct = min(100.0, (current_mb / TOTAL_EXPECTED_MB) * 100)
            
            speed_mb_s = max(0.0, (current_mb - last_size) / dt) if last_size > 0 else 0.0
            eta_sec = (TOTAL_EXPECTED_MB - current_mb) / max(speed_mb_s, 0.01) if speed_mb_s > 0 else 0
            eta_min = eta_sec / 60.0
            
            bar_len = 30
            filled = int(bar_len * pct / 100.0)
            bar = "=" * filled + (">" if filled < bar_len else "") + " " * (bar_len - filled - (1 if filled < bar_len else 0))
            
            print(f"\r[{bar}] {pct:5.1f}% | {current_mb:7.1f} / {TOTAL_EXPECTED_MB:.0f} MB | Speed: {speed_mb_s:5.2f} MB/s | ETA: {eta_min:4.1f} min", end="", flush=True)
            
            last_size = current_mb
            last_time = now
        elif any(os.path.getsize(f) > 3 * 1024 * 1024 * 1024 for f in completed_safetensors):
            print(f"\n[==============================] 100.0% | Download Complete! ({TOTAL_EXPECTED_MB:.0f} MB)")
            break
        else:
            print(f"\rScanning for active download file...", end="", flush=True)
        
        time.sleep(3)

if __name__ == "__main__":
    monitor()
