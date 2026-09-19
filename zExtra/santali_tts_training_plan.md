# Santali VITS TTS Training Plan

This document outlines how to train a lightweight, 100% offline Santali TTS model (VITS) using the AI4Bharat Rasa dataset, and export it for use in our Android app via Sherpa-ONNX.

## 1. Prerequisites
- **Hardware:** A GPU with at least 16GB VRAM (e.g., RTX 3090, 4090, or a cloud GPU on RunPod/Google Colab Pro).
- **Framework:** We will use **Piper** (a fast VITS implementation) or **Coqui TTS**, as both can easily be exported to ONNX format. Piper is recommended for low-resource edge devices.
- **Dataset:** `ai4bharat/Rasa` (Santali subset).

## 2. Dataset Preparation (LJSpeech Format)
TTS engines require the data to be in the standard LJSpeech format.
1. Download the audio `.wav` files from the Hugging Face dataset.
2. Convert all audio to **16,000 Hz or 22,050 Hz, Mono, 16-bit PCM**.
3. Create a `metadata.csv` file structured exactly like this:
   ```text
   audio_filename1.wav|ᱚᱞ ᱪᱤᱠᱤ ᱴᱮᱠᱥᱴ
   audio_filename2.wav|ᱥᱟᱱᱛᱟᱲᱤ ᱟᱲᱟᱝ
   ```

## 3. The Ol Chiki Phoneme Challenge
Neural TTS learns the mapping between letters (graphemes) and sounds (phonemes). Most open-source phonemizers (like `espeak-ng`) do **not** support the Ol Chiki script. 
**Solution:** You have two options:
1. **Character-level training:** Pass the raw Ol Chiki unicode characters directly to the model. VITS is smart enough to learn character-to-audio mappings if the dataset is clean.
2. **Transliteration:** Convert the Ol Chiki text in your `metadata.csv` to Latin/Devanagari before training, using a mapping script (similar to the one we built in `SantaliTtsEngine.kt`).

## 4. Exporting to ONNX
Once the PyTorch model (`.pth` or `.ckpt`) is trained and sounds good, you must export it to ONNX so the Android app can run it offline.
- Use the Sherpa-ONNX export scripts to convert the VITS model to `.onnx`.
- Quantize the model to `INT8` to reduce the file size from ~150MB down to ~35MB, fitting our 2GB RAM constraint.

---

# Prompt for the AI (Copy & Paste when ready)

When you are ready to train, copy and paste the prompt below into ChatGPT, Claude, or any AI assistant:

```markdown
I need to train a lightweight, offline VITS Text-to-Speech (TTS) model for the Santali language using the Piper TTS framework (or Coqui TTS). 

Here is my context:
1. **Dataset:** I have the AI4Bharat Rasa dataset for Santali (audio wav files + text transcripts in Ol Chiki script).
2. **Target Device:** The exported model will run completely offline on a constrained Android device (2GB RAM) using Sherpa-ONNX. 
3. **Requirement:** The final model must be exported to ONNX INT8 format.

Please provide a step-by-step Python implementation to:
1. Download the Santali subset from `ai4bharat/Rasa` on HuggingFace and format it into an LJSpeech `metadata.csv`.
2. Convert all audio to 16kHz or 22kHz mono wav.
3. Set up the VITS training script (handling the fact that Ol Chiki might not be supported by standard phonemizers — suggest a character-level config or transliteration approach).
4. Provide the exact command to start the training on a single GPU.
5. Provide the Python script to export the final `.pth` checkpoint to `.onnx`.
```
