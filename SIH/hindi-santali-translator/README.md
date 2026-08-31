# Offline Hindi → Santali Voice Translation System (Phase 1 Baseline)

This repository contains Phase 1 of the offline voice translation pipeline from **Hindi** to **Santali (Ol Chiki script)**.

## Architecture Pipeline

```
Hindi Speech (Future Phase)
       ↓
Hindi Text (Devanagari: hin_Deva)
       ↓  [ai4bharat/indictrans2-indic-indic-1B]
Santali Text (Ol Chiki: sat_Olck)
       ↓  [ai4bharat/indic-parler-tts]
Santali Speech (.WAV Audio)
```

---

## Project Structure

```
hindi-santali-translator/
├── README.md
├── requirements.txt
├── .gitignore
├── configs/
│   └── config.yaml
├── models/
├── data/
│   ├── raw/
│   ├── processed/
│   └── samples/
├── src/
│   ├── __init__.py
│   ├── translation/
│   │   ├── __init__.py
│   │   └── indictrans.py
│   ├── tts/
│   │   ├── __init__.py
│   │   └── santali_tts.py
│   └── pipeline.py
├── scripts/
│   ├── test_translation.py
│   └── test_tts.py
└── outputs/
```

---

## Models Used

1. **Translation**:
   - Hugging Face Model: [`ai4bharat/indictrans2-indic-indic-1B`](https://huggingface.co/ai4bharat/indictrans2-indic-indic-1B)
   - Source Language: `hin_Deva`
   - Target Language: `sat_Olck` (Santali in Ol Chiki script)
   - Preprocessing/Postprocessing: `IndicTransToolkit.IndicProcessor`

2. **Text-to-Speech (TTS)**:
   - Hugging Face Model: [`ai4bharat/indic-parler-tts`](https://huggingface.co/ai4bharat/indic-parler-tts)
   - Supported Santali Voice: `Sumitra` (Female), `Raju` (Male)
   - Dual Tokenizer Setup: Model tokenizer for prompt + FLAN-T5 text encoder tokenizer for voice description prompt.

---

## Installation & Setup

```bash
# Clone the repository and navigate into project directory
cd hindi-santali-translator

# Install dependencies
pip install -r requirements.txt
```

---

## Running Tests

### 1. Translation Test Suite
Validates translation across casual conversation, questions, instructions, numbers, and rural/agriculture vocabulary:
```bash
python scripts/test_translation.py
```

### 2. End-to-End Voice Synthesis Test
Translates a sample Hindi sentence into Santali Ol Chiki and generates a `.wav` audio output in `outputs/`:
```bash
python scripts/test_tts.py
```

---

## Python API Usage

```python
from src.pipeline import HindiToSantaliVoicePipeline

# Initialize pipeline
pipeline = HindiToSantaliVoicePipeline(default_speaker="Sumitra")

# Translate Hindi sentence to Santali Ol Chiki text & synthesize audio
result = pipeline.process(
    hindi_text="नमस्ते, आप कैसे हैं?",
    output_wav_path="outputs/greeting.wav"
)

print("Santali Text:", result["santali_text"])
print("Audio Path  :", result["output_audio_path"])
```
