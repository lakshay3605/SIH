"""
Santali TTS Module using AI4Bharat Indic Parler-TTS.
"""
import os
import sys
import logging
from typing import Optional, Union

import torch
import soundfile as sf
from transformers import AutoTokenizer

try:
    from parler_tts import ParlerTTSForConditionalGeneration
except ImportError:
    ParlerTTSForConditionalGeneration = None

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


class SantaliTTS:
    """
    Text-to-Speech synthesizer wrapper for ai4bharat/indic-parler-tts.
    Supports Santali voice synthesis with speakers like 'Sumitra' and 'Raju'.
    """
    MODEL_NAME = "ai4bharat/indic-parler-tts"
    DEFAULT_SPEAKER = "Sumitra"

    def __init__(
        self,
        model_name: str = MODEL_NAME,
        device: Optional[str] = None,
        model_dir: Optional[str] = None,
        use_half_precision: bool = False,
        token: Optional[str] = None,
    ):
        self.model_name = model_name or self.MODEL_NAME
        self.model_dir = model_dir
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.token = token or os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")

        if self.device == "cpu":
            self.torch_dtype = torch.float32
        else:
            self.torch_dtype = torch.float16 if use_half_precision else torch.float32

        self.model = None
        self.tokenizer = None
        self.description_tokenizer = None
        self.sampling_rate = 22050
        self._is_loaded = False

    def load_model(self) -> None:
        """Loads Indic Parler-TTS model and dual tokenizers."""
        if self._is_loaded:
            logger.info("Indic Parler-TTS model is already loaded.")
            return

        logger.info(f"Loading Indic Parler-TTS model '{self.model_name}' on device '{self.device}'...")

        if ParlerTTSForConditionalGeneration is None:
            raise ImportError(
                "parler_tts is required. Please install it using 'pip install git+https://github.com/huggingface/parler-tts.git'."
            )

        try:
            # 1. Load TTS model
            self.model = ParlerTTSForConditionalGeneration.from_pretrained(
                self.model_name,
                torch_dtype=self.torch_dtype,
                cache_dir=self.model_dir,
                token=self.token,
            ).to(self.device)
            self.model.eval()

            # 2. Prompt text tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                cache_dir=self.model_dir,
                token=self.token,
            )

            # 3. Description text tokenizer (from underlying text encoder)
            text_encoder_name = getattr(self.model.config, "text_encoder", None)
            if text_encoder_name and hasattr(text_encoder_name, "_name_or_path"):
                desc_model_id = text_encoder_name._name_or_path
            else:
                desc_model_id = "google/flan-t5-large"

            self.description_tokenizer = AutoTokenizer.from_pretrained(
                desc_model_id,
                cache_dir=self.model_dir,
                token=self.token,
            )

            self.sampling_rate = getattr(self.model.config, "sampling_rate", 22050)
            self._is_loaded = True
            logger.info(f"Indic Parler-TTS successfully loaded (sampling rate: {self.sampling_rate} Hz).")

        except torch.cuda.OutOfMemoryError as e:
            logger.warning(f"CUDA Out of Memory loading TTS model. Falling back to CPU: {e}")
            self.device = "cpu"
            self.torch_dtype = torch.float32
            self.model = ParlerTTSForConditionalGeneration.from_pretrained(
                self.model_name,
                torch_dtype=self.torch_dtype,
                cache_dir=self.model_dir,
                token=self.token,
            ).to(self.device)
            self.model.eval()
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name, cache_dir=self.model_dir, token=self.token)
            self.description_tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-large", cache_dir=self.model_dir, token=self.token)
            self.sampling_rate = getattr(self.model.config, "sampling_rate", 22050)
            self._is_loaded = True
            logger.info(f"Indic Parler-TTS loaded on CPU (sampling rate: {self.sampling_rate} Hz).")

        except Exception as e:
            logger.error(f"Failed to load Indic Parler-TTS model {self.model_name}: {e}")
            raise RuntimeError(f"TTS model loading error: {e}") from e

    def synthesize(
        self,
        text: str,
        output_path: str,
        speaker: str = DEFAULT_SPEAKER,
        description: Optional[str] = None,
    ) -> str:
        """
        Synthesizes speech from Santali text and saves to a WAV file.
        
        Args:
            text: Santali text string to speak.
            output_path: Target .wav filepath.
            speaker: Speaker identifier ('Sumitra' or 'Raju').
            description: Optional custom voice description prompt.
            
        Returns:
            Absolute path to the generated WAV file.
        """
        if not self._is_loaded:
            self.load_model()

        if not text or not text.strip():
            raise ValueError("Input text for synthesis cannot be empty.")

        # Ensure output directory exists
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        if not output_path.lower().endswith(".wav"):
            output_path += ".wav"

        # Build voice description
        if description is None:
            description = f"{speaker}'s voice is clear, expressive, and natural with moderate pace and high audio quality."

        logger.info(f"Synthesizing audio for text: '{text}' with voice: '{description}'")

        try:
            # Tokenize description and prompt
            desc_inputs = self.description_tokenizer(
                description,
                return_tensors="pt",
            ).to(self.device)

            prompt_inputs = self.tokenizer(
                text.strip(),
                return_tensors="pt",
            ).to(self.device)

            with torch.inference_mode():
                generation = self.model.generate(
                    input_ids=desc_inputs.input_ids,
                    attention_mask=desc_inputs.attention_mask,
                    prompt_input_ids=prompt_inputs.input_ids,
                    prompt_attention_mask=prompt_inputs.attention_mask,
                )

            # Convert to numpy audio waveform
            audio_arr = generation.cpu().numpy().squeeze()

            # Save to WAV file
            sf.write(output_path, audio_arr, self.sampling_rate)
            logger.info(f"Saved audio output to {output_path}")

            return os.path.abspath(output_path)

        except Exception as e:
            logger.error(f"Inference error during speech synthesis: {e}")
            raise RuntimeError(f"TTS synthesis failed: {e}") from e


# Singleton instance
_default_tts: Optional[SantaliTTS] = None


def synthesize_santali(text: str, output_path: str, speaker: str = "Sumitra") -> str:
    """
    Standard interface function to synthesize Santali speech to WAV.
    
    Args:
        text: Santali text in Ol Chiki script.
        output_path: Destination path for the WAV audio file.
        speaker: Voice speaker name ('Sumitra' or 'Raju').
        
    Returns:
        Absolute filepath to the saved WAV audio.
    """
    global _default_tts
    if not isinstance(text, str):
        raise TypeError(f"Expected str input for text, got {type(text).__name__}")
    if not text.strip():
        raise ValueError("Cannot synthesize empty text.")

    if _default_tts is None:
        _default_tts = SantaliTTS()

    return _default_tts.synthesize(text=text, output_path=output_path, speaker=speaker)
