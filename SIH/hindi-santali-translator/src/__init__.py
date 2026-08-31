"""
Hindi -> Santali offline speech translation pipeline package.
"""
from src.translation.indictrans import translate_hindi_to_santali, IndicTransTranslator
from src.tts.santali_tts import synthesize_santali, SantaliTTS
from src.pipeline import HindiToSantaliVoicePipeline

__all__ = [
    "translate_hindi_to_santali",
    "IndicTransTranslator",
    "synthesize_santali",
    "SantaliTTS",
    "HindiToSantaliVoicePipeline",
]
