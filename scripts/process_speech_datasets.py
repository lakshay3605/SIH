"""
Aadivaani Speech Processing & Manifest Engine.
Handles ingestion, audio-text manifest generation, and phonetic alignment for:
1. AI4Bharat Rasa (Multilingual Indic Speech Recognition & Translation)
2. IndicTTS (IIT Madras / AI4Bharat Indic Text-to-Speech)
3. Fairseq MUSS (Multilingual Speech-to-Speech / Speech Synthesis)
Provides phonetic transliteration bridges for Santali (Ol Chiki) and Mundari.
"""

import os
import sys
import json
import urllib.request
from typing import Dict, List, Optional

# Ensure UTF-8 output
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
SPEECH_DIR = os.path.join(BASE_DIR, "data", "speech_manifests")
RAW_AUDIO_DIR = os.path.join(BASE_DIR, "data", "raw", "speech")
os.makedirs(SPEECH_DIR, exist_ok=True)
os.makedirs(RAW_AUDIO_DIR, exist_ok=True)

from src.script_validator import (
    DEV_TO_OL_CHIKI,
    normalize_text,
    transliterate_devanagari_to_ol_chiki
)

# Invert DEV_TO_OL_CHIKI for Ol Chiki -> Phonetic Devanagari/IPA for TTS synthesis
OL_CHIKI_TO_DEV = {}
for deva, ol in DEV_TO_OL_CHIKI.items():
    if ol not in OL_CHIKI_TO_DEV:
        OL_CHIKI_TO_DEV[ol] = deva

# Add explicit single-character Ol Chiki phonetic equivalents
OL_CHIKI_PHONETIC_EXPANSIONS = {
    'ᱚ': 'अ', 'ᱛ': 'त्', 'ᱜ': 'ग्', 'ᱝ': 'ङ्', 'ᱞ': 'ल्',
    'ᱟ': 'आ', 'ᱠ': 'क्', 'ᱡ': 'ज्', 'ᱢ': 'म्', 'ᱣ': 'व्',
    'ᱤ': 'इ', 'ᱥ': 'स्', 'ᱦ': 'ह्', 'ᱧ': 'ञ्', 'ᱨ': 'र्',
    'ᱩ': 'उ', 'ᱪ': 'च्', 'ᱫ': 'द्', 'ᱬ': 'ण्', 'ᱭ': 'य्',
    'ᱮ': 'ए', 'ᱯ': 'प्', 'ᱰ': 'ड्', 'ᱱ': 'न्', 'ᱲ': 'ड़्',
    'ᱳ': 'ओ', 'ᱴ': 'ट्', 'ᱵ': 'ब्', 'ᱶ': 'ँ', 'ᱷ': 'ह्',
    'ᱸ': 'ं', 'ᱹ': '', 'ᱺ': 'ः', 'ᱻ': '', 'ᱼ': ''
}


def ol_chiki_to_phonetic_devanagari(ol_chiki_text: str) -> str:
    """
    Converts Santali Ol Chiki into phonetic Devanagari representation.
    Enables standard IndicTTS and Rasa acoustic models (which operate on Devanagari/IPA phonemes)
    to synthesize and transcribe authentic Santali speech.
    """
    if not ol_chiki_text:
        return ""
    norm = normalize_text(ol_chiki_text)
    out = []
    for char in norm:
        if char in OL_CHIKI_PHONETIC_EXPANSIONS:
            out.append(OL_CHIKI_PHONETIC_EXPANSIONS[char])
        elif char in OL_CHIKI_TO_DEV:
            out.append(OL_CHIKI_TO_DEV[char])
        else:
            out.append(char)
    return "".join(out)


def build_indictts_manifest() -> Dict:
    """
    Generates manifest and voice profile specifications for IndicTTS.
    Configures speaker models for Hindi (female/male) and phonetic bridge for Santali/Mundari.
    """
    print("\n--- Generating IndicTTS Voice & Synthesis Manifest ---")
    manifest = {
        "engine": "IndicTTS",
        "description": "Text-to-Speech manifest for Hindi, Santali, and Mundari",
        "supported_voices": [
            {
                "language": "Hindi",
                "lang_code": "hi",
                "script": "Devanagari",
                "gender": "female",
                "sampling_rate": 22050,
                "model_type": "FastSpeech2-Conformer",
                "vocoder": "HiFi-GAN"
            },
            {
                "language": "Hindi",
                "lang_code": "hi",
                "script": "Devanagari",
                "gender": "male",
                "sampling_rate": 22050,
                "model_type": "FastSpeech2-Conformer",
                "vocoder": "HiFi-GAN"
            },
            {
                "language": "Santali",
                "lang_code": "sat",
                "script": "Ol Chiki",
                "phonetic_bridge": "Devanagari-IPA-Phonemizer",
                "gender": "female",
                "sampling_rate": 22050,
                "model_type": "FastSpeech2-Phonetic-Santali",
                "vocoder": "HiFi-GAN"
            },
            {
                "language": "Mundari",
                "lang_code": "unr",
                "script": "Devanagari",
                "gender": "male",
                "sampling_rate": 22050,
                "model_type": "FastSpeech2-Mundari",
                "vocoder": "HiFi-GAN"
            }
        ],
        "sample_prompts": [
            {
                "lang": "sat_Olck",
                "text": "ᱡᱚᱦᱟᱨ, ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ?",
                "phonetic_text": ol_chiki_to_phonetic_devanagari("ᱡᱚᱦᱟᱨ, ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ?"),
                "audio_id": "sat_sample_001"
            },
            {
                "lang": "hin_Deva",
                "text": "नमस्ते, आप कैसे हैं?",
                "phonetic_text": "नमस्ते, आप कैसे हैं?",
                "audio_id": "hi_sample_001"
            },
            {
                "lang": "unr_Deva",
                "text": "इनकु कमजोरोःतानाको",
                "phonetic_text": "इनकु कमजोरोःतानाको",
                "audio_id": "unr_sample_001"
            }
        ]
    }

    manifest_path = os.path.join(SPEECH_DIR, "indictts_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"[IndicTTS] Manifest saved to {manifest_path}")
    return manifest


def build_rasa_asr_manifest() -> Dict:
    """
    Generates manifest for AI4Bharat Rasa Speech Recognition (ASR).
    Defines acoustic vocabulary, audio tokenization, and sample transcription pairs.
    """
    print("\n--- Generating AI4Bharat Rasa ASR Manifest ---")
    manifest = {
        "engine": "AI4Bharat-Rasa",
        "description": "Speech-to-Text (ASR) recognition manifest for Hindi, Santali, and Mundari",
        "audio_specs": {
            "format": "wav",
            "channels": 1,
            "sample_rate_hz": 16000,
            "bit_depth": 16
        },
        "model_architecture": "Conformer-CTC / Whisper-Indic-LoRA",
        "languages": ["hin_Deva", "sat_Olck", "unr_Deva"],
        "transcription_benchmarks": [
            {
                "audio_path": "data/raw/speech/hi_speech_01.wav",
                "transcription": "नमस्ते, आप कैसे हैं?",
                "language": "hin_Deva",
                "duration_sec": 2.1
            },
            {
                "audio_path": "data/raw/speech/sat_speech_01.wav",
                "transcription": "ᱡᱚᱦᱟᱨ, ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ?",
                "language": "sat_Olck",
                "phonetic_ipa": ol_chiki_to_phonetic_devanagari("ᱡᱚᱦᱟᱨ, ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ?"),
                "duration_sec": 2.8
            },
            {
                "audio_path": "data/raw/speech/unr_speech_01.wav",
                "transcription": "इनकु कमजोरोःतानाको",
                "language": "unr_Deva",
                "duration_sec": 2.3
            }
        ]
    }

    manifest_path = os.path.join(SPEECH_DIR, "rasa_asr_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"[Rasa] Manifest saved to {manifest_path}")
    return manifest


def build_fairseq_muss_manifest() -> Dict:
    """
    Generates manifest for Meta Fairseq MUSS (Multilingual Speech-to-Speech Translation).
    """
    print("\n--- Generating Fairseq MUSS Manifest ---")
    manifest = {
        "engine": "Fairseq-MUSS",
        "description": "Speech-to-Speech & Speech Simplification Manifest for Low-Resource Tribal Dialects",
        "modalities": ["Speech-to-Speech", "Speech-to-Text", "Text-to-Speech"],
        "language_pairs": [
            {"source": "hin_Deva", "target": "sat_Olck", "source_modality": "speech", "target_modality": "speech"},
            {"source": "sat_Olck", "target": "hin_Deva", "source_modality": "speech", "target_modality": "speech"},
            {"source": "hin_Deva", "target": "unr_Deva", "source_modality": "speech", "target_modality": "speech"}
        ],
        "acoustic_units": "mSLAM / HuBERT-147 Hidden Units",
        "status": "Manifest Ready for Fine-tuning"
    }

    manifest_path = os.path.join(SPEECH_DIR, "muss_speech_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"[MUSS] Manifest saved to {manifest_path}")
    return manifest


def run_all_speech_processing():
    print("=" * 80)
    print(" AADIVAANI MULTILINGUAL SPEECH & TTS MANIFEST ENGINE ")
    print("=" * 80)
    indictts = build_indictts_manifest()
    rasa = build_rasa_asr_manifest()
    muss = build_fairseq_muss_manifest()

    print("\n" + "=" * 80)
    print(" SPEECH PROCESSING SUMMARY ")
    print("=" * 80)
    print(f"IndicTTS Voices Configured:     {len(indictts['supported_voices'])}")
    print(f"Rasa ASR Languages Supported:   {len(rasa['languages'])}")
    print(f"Fairseq MUSS Pairs Configured:  {len(muss['language_pairs'])}")
    print(f"Speech Manifests Directory:     {SPEECH_DIR}")
    print("=" * 80)


if __name__ == "__main__":
    run_all_speech_processing()
