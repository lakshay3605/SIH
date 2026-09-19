# Plan 6: Upload INT8 Models to HuggingFace & Wire App
**Goal:** Host the quantized ONNX models on HuggingFace so any real Android device
can download them without needing a local server.

---

## Files to Upload

All located at: `d:\sih2026\aakansha's work\indictrans2_200m_hi_sat_onnx\`

| File | Size | Must Upload |
|---|---|---|
| `encoder_model_int8.onnx` | 115.5 MB | ✅ Yes |
| `decoder_model_int8.onnx` | 194.4 MB | ✅ Yes |
| `sentencepiece.bpe.model` | 3.1 MB | ✅ Yes |
| `config.json` | <1 KB | ✅ Yes |
| `tokenizer_config.json` | <1 KB | ✅ Yes |
| `encoder_model.onnx` | 457 MB | ❌ Do NOT upload (old float32) |
| `decoder_model.onnx` | 769 MB | ❌ Do NOT upload (old float32) |

---

## Step 1: Get a HuggingFace Token

1. Go to https://huggingface.co/settings/tokens
2. Click **New token**
3. Name: `sih-upload`
4. Role: **Write**
5. Copy the token (starts with `hf_...`)

---

## Step 2: Create a HuggingFace Model Repository

1. Go to https://huggingface.co/new
2. Set:
   - **Owner:** your HuggingFace username (same account that owns the ASR model repo)
   - **Repository name:** `indictrans2-hi-sat-int8`
   - **Visibility:** Public
3. Click **Create repository**

The repo URL will be: `https://huggingface.co/{YOUR_USERNAME}/indictrans2-hi-sat-int8`

---

## Step 3: Install HuggingFace Hub

```powershell
pip install huggingface_hub
```

---

## Step 4: Create and Run the Upload Script

Create `d:\sih2026\zExtra\upload_to_hf.py`:

```python
"""
Uploads the INT8 quantized translation ONNX models to HuggingFace.
Run: python upload_to_hf.py
"""
from huggingface_hub import HfApi, login
from pathlib import Path
import time

# ── CONFIGURE THESE ──────────────────────────────────────────────────────────
HF_TOKEN   = "hf_YOUR_TOKEN_HERE"          # paste your HuggingFace write token
HF_REPO_ID = "YOUR_USERNAME/indictrans2-hi-sat-int8"  # e.g. sharjil/indictrans2-hi-sat-int8
# ─────────────────────────────────────────────────────────────────────────────

MODEL_DIR = Path(r"d:\sih2026\aakansha's work\indictrans2_200m_hi_sat_onnx")

FILES_TO_UPLOAD = [
    "encoder_model_int8.onnx",
    "decoder_model_int8.onnx",
    "sentencepiece.bpe.model",
    "config.json",
    "tokenizer_config.json",
]

def main():
    login(token=HF_TOKEN)
    api = HfApi()

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
        print(f"  Done in {elapsed:.0f}s → "
              f"https://huggingface.co/{HF_REPO_ID}/resolve/main/{fname}\n")

    print("\n✅ All files uploaded.")
    print(f"\nBase URL for the app:")
    print(f"  https://huggingface.co/{HF_REPO_ID}/resolve/main/")

if __name__ == "__main__":
    main()
```

**Fill in** `HF_TOKEN` and `HF_REPO_ID` before running.

Run:
```powershell
python "d:\sih2026\zExtra\upload_to_hf.py"
```

This will take 5-15 minutes depending on internet speed. The large INT8 files
(115MB + 194MB) are uploaded with progress shown in the terminal.

---

## Step 5: Update the Android App

Once all files are uploaded, open:
`d:\sih2026\HindiSantaliApp\app\src\main\java\com\example\hindisantali\translation\TranslationModelDownloader.kt`

Change line 24 from:
```kotlin
const val TRANSLATION_BASE_URL = "http://10.0.2.2:8080/"
```

To:
```kotlin
const val TRANSLATION_BASE_URL = "https://huggingface.co/YOUR_USERNAME/indictrans2-hi-sat-int8/resolve/main/"
```

Replace `YOUR_USERNAME` with the actual HuggingFace username.

---

## Step 6: Clear Old App Data on Phone

The phone still has the old float32 models taking up ~1.26GB of storage.
This frees that space before downloading the new smaller models.

On the Android phone:
> **Settings → Apps → HindiSantali → Storage → Clear Data**

> [!WARNING]
> "Clear Data" deletes ALL downloaded models (ASR + Translation + TTS).
> The app will ask to re-download everything on next launch.
> Total re-download = ~520MB (ASR 196MB + Translation INT8 310MB + TTS ~50MB).

---

## Step 7: Rebuild and Test

```powershell
cd d:\sih2026\HindiSantaliApp
.\gradlew.bat assembleDebug
```

Install the new APK on the phone. On first launch, tap **Download All Models**.
The translation model should now download ~310MB instead of the old ~1.26GB.

---

## Step 8: Verify the Download Worked

After downloading completes on the phone, use ADB to confirm the new files exist:

```powershell
adb shell ls -lh /data/data/com.example.hindisantali/files/translation_model/
```

Expected output:
```
-rw------- 1 u0_aXX u0_aXX 115M ... encoder_model_int8.onnx
-rw------- 1 u0_aXX u0_aXX 194M ... decoder_model_int8.onnx
-rw------- 1 u0_aXX u0_aXX 3.1M ... sentencepiece.bpe.model
```

If you see the old `encoder_model.onnx` (457MB) or `decoder_model.onnx` (769MB),
Clear Data again and retry.

---

## Summary

| Action | Where |
|---|---|
| Create HuggingFace repo | https://huggingface.co/new |
| Get write token | https://huggingface.co/settings/tokens |
| Run upload script | `d:\sih2026\zExtra\upload_to_hf.py` |
| Update URL in app | `TranslationModelDownloader.kt` line 24 |
| Clear phone storage | Settings → Apps → HindiSantali → Clear Data |
| Rebuild APK | `.\gradlew.bat assembleDebug` |
