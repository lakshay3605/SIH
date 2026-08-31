"""
End-to-end Hindi -> Santali Voice Translation Pipeline.
Orchestrates: Hindi Text -> IndicTrans2 -> Santali (Ol Chiki) -> Indic Parler-TTS -> Santali WAV
"""
import os
import sys
import logging
from typing import Dict, Any, Optional

from src.translation.indictrans import IndicTransTranslator, translate_hindi_to_santali
from src.tts.santali_tts import SantaliTTS, synthesize_santali

logger = logging.getLogger(__name__)


class HindiToSantaliVoicePipeline:
    """
    End-to-End pipeline for Hindi text to Santali speech translation.
    """
    def __init__(
        self,
        device: Optional[str] = None,
        translation_model: Optional[str] = None,
        tts_model: Optional[str] = None,
        default_speaker: str = "Sumitra",
        token: Optional[str] = None,
    ):
        self.device = device or ("cuda" if False else "auto")
        self.token = token or os.environ.get("HF_TOKEN")
        self.translator = IndicTransTranslator(model_name=translation_model, device=device, token=self.token)
        self.tts = SantaliTTS(model_name=tts_model, device=device, token=self.token)
        self.default_speaker = default_speaker

    def load_all(self) -> None:
        """Preload all model weights into memory."""
        logger.info("Preloading Translation model...")
        self.translator.load_model()
        logger.info("Preloading TTS model...")
        self.tts.load_model()

    def translate(self, hindi_text: str) -> str:
        """
        Translates Hindi Devanagari text to Santali Ol Chiki text.
        """
        return self.translator.translate(hindi_text, src_lang="hin_Deva", tgt_lang="sat_Olck")

    def speak(self, santali_text: str, output_wav_path: str, speaker: Optional[str] = None) -> str:
        """
        Synthesizes Santali Ol Chiki text to a WAV audio file.
        """
        speaker = speaker or self.default_speaker
        return self.tts.synthesize(text=santali_text, output_path=output_wav_path, speaker=speaker)

    def process(
        self,
        hindi_text: str,
        output_wav_path: str,
        speaker: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Executes the full pipeline:
        Hindi Text -> Santali Text (Ol Chiki) -> Santali Audio (WAV)
        
        Args:
            hindi_text: Source Hindi text string.
            output_wav_path: Filepath where the synthesized audio should be saved.
            speaker: Speaker ID ('Sumitra' or 'Raju').
            
        Returns:
            Dictionary containing 'hindi_text', 'santali_text', and 'output_audio_path'.
        """
        if not hindi_text or not hindi_text.strip():
            raise ValueError("Input Hindi text cannot be empty.")

        logger.info(f"Step 1: Translating Hindi text: '{hindi_text}'")
        santali_text = self.translate(hindi_text)
        logger.info(f"Step 1 Complete. Santali (Ol Chiki): '{santali_text}'")

        logger.info(f"Step 2: Synthesizing Santali speech to: '{output_wav_path}'")
        audio_path = self.speak(santali_text, output_wav_path=output_wav_path, speaker=speaker)
        logger.info(f"Step 2 Complete. Audio saved to: '{audio_path}'")

        return {
            "hindi_text": hindi_text,
            "santali_text": santali_text,
            "output_audio_path": audio_path,
        }


def run_pipeline(
    hindi_text: str,
    output_wav_path: str,
    speaker: str = "Sumitra",
) -> Dict[str, Any]:
    """
    Convenience function for full end-to-end voice translation.
    """
    santali_text = translate_hindi_to_santali(hindi_text)
    audio_path = synthesize_santali(santali_text, output_path=output_wav_path, speaker=speaker)
    return {
        "hindi_text": hindi_text,
        "santali_text": santali_text,
        "output_audio_path": audio_path,
    }
