from huggingface_hub import HfApi, login
from pathlib import Path
import time
import sys

HF_TOKEN = "YOUR_HF_TOKEN_HERE"

def main():
    login(token=HF_TOKEN)
    api = HfApi()

    # Get username
    user_info = api.whoami(token=HF_TOKEN)
    username = user_info["name"]
    print(f"Logged in as: {username}")

    HF_REPO_ID = f"{username}/indictrans2-hi-sat-int8"

    print(f"Creating repo: {HF_REPO_ID}")
    try:
        api.create_repo(repo_id=HF_REPO_ID, repo_type="model", private=False, exist_ok=True)
    except Exception as e:
        print(f"Error creating repo (might already exist): {e}")

    MODEL_DIR = Path(r"d:\sih2026\aakansha's work\indictrans2_200m_hi_sat_onnx")

    FILES_TO_UPLOAD = [
        "encoder_model_int8.onnx",
        "decoder_model_int8.onnx",
        "sentencepiece.bpe.model",
        "config.json",
        "tokenizer_config.json",
    ]

    print(f"\nUploading to: https://huggingface.co/{HF_REPO_ID}\n")

    for fname in FILES_TO_UPLOAD:
        path = MODEL_DIR / fname
        if not path.exists():
            print(f"  SKIP  {fname} — file not found")
            continue

        size_mb = path.stat().st_size / 1_048_576
        print(f"  Uploading {fname} ({size_mb:.1f} MB)...")
        start = time.time()

        api.upload_file(
            path_or_fileobj = str(path),
            path_in_repo    = fname,
            repo_id         = HF_REPO_ID,
            repo_type       = "model",
            token           = HF_TOKEN,
        )

        elapsed = time.time() - start
        print(f"  Done in {elapsed:.0f}s -> https://huggingface.co/{HF_REPO_ID}/resolve/main/{fname}\n")

    print("\n✅ All files uploaded.")
    print(f"USERNAME={username}")

if __name__ == "__main__":
    main()
