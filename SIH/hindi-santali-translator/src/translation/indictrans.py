"""
Hindi to Santali (Ol Chiki) Translation Module using AI4Bharat IndicTrans2.
"""
import os
import sys
import logging
from typing import Optional, List, Union

import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

try:
    from IndicTransToolkit import IndicProcessor
except ImportError:
    try:
        from src.translation.processor import IndicProcessor
    except ImportError:
        IndicProcessor = None

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


class IndicTransTranslator:
    """
    Translator wrapper for ai4bharat/indictrans2-indic-indic-1B.
    """
    MODEL_NAME = "ai4bharat/indictrans2-indic-indic-1B"
    SRC_LANG = "hin_Deva"
    TGT_LANG = "sat_Olck"

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

        # CPU does not natively support FP16 operations efficiently on PyTorch
        if self.device == "cpu":
            self.torch_dtype = torch.float32
        else:
            self.torch_dtype = torch.float16 if use_half_precision else torch.float32

        self.tokenizer = None
        self.model = None
        self.ip = None
        self._is_loaded = False

    def load_model(self) -> None:
        """Loads IndicTrans2 tokenizer, model weights, and IndicProcessor."""
        if self._is_loaded:
            logger.info("IndicTrans2 model is already loaded.")
            return

        logger.info(f"Loading IndicTrans2 model '{self.model_name}' on device '{self.device}'...")

        if IndicProcessor is None:
            raise ImportError(
                "IndicTransToolkit / processor is required. Ensure src/translation/processor.py is available."
            )

        try:
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                trust_remote_code=True,
                cache_dir=self.model_dir,
                token=self.token,
            )
        except Exception as e:
            logger.error(f"Failed to load tokenizer for {self.model_name}: {e}")
            raise RuntimeError(
                f"Tokenizer loading error: {e}. If model is gated, ensure you have accepted the model terms at https://huggingface.co/{self.model_name} and set your HF_TOKEN."
            ) from e

        try:
            self.model = AutoModelForSeq2SeqLM.from_pretrained(
                self.model_name,
                trust_remote_code=True,
                torch_dtype=self.torch_dtype,
                cache_dir=self.model_dir,
                token=self.token,
            ).to(self.device)
            self.model.eval()
        except torch.cuda.OutOfMemoryError as e:
            logger.warning(f"CUDA Out of Memory loading model. Falling back to CPU: {e}")
            self.device = "cpu"
            self.torch_dtype = torch.float32
            self.model = AutoModelForSeq2SeqLM.from_pretrained(
                self.model_name,
                trust_remote_code=True,
                torch_dtype=self.torch_dtype,
                cache_dir=self.model_dir,
                token=self.token,
            ).to(self.device)
            self.model.eval()
        except Exception as e:
            logger.error(f"Failed to load model {self.model_name}: {e}")
            raise RuntimeError(f"Model loading error: {e}") from e

        self.ip = IndicProcessor(inference=True)
        self._is_loaded = True
        logger.info("IndicTrans2 model and processor successfully loaded.")

    def translate(
        self,
        text: Union[str, List[str]],
        src_lang: str = SRC_LANG,
        tgt_lang: str = TGT_LANG,
        max_length: int = 256,
        num_beams: int = 1,
        **generation_kwargs,
    ) -> Union[str, List[str]]:
        """
        Translates text from src_lang to tgt_lang.
        """
        if not self._is_loaded:
            self.load_model()

        is_single = isinstance(text, str)
        sentences = [text] if is_single else list(text)

        # Handle empty/whitespace inputs
        cleaned_sentences = []
        empty_indices = set()
        for idx, s in enumerate(sentences):
            if not s or not s.strip():
                empty_indices.add(idx)
                cleaned_sentences.append("")
            else:
                cleaned_sentences.append(s.strip())

        non_empty_indices = [i for i in range(len(sentences)) if i not in empty_indices]
        non_empty_sentences = [cleaned_sentences[i] for i in non_empty_indices]

        if not non_empty_sentences:
            return "" if is_single else ["" for _ in sentences]

        try:
            # 1. Preprocess batch with IndicProcessor
            preprocessed_batch = self.ip.preprocess_batch(
                non_empty_sentences,
                src_lang=src_lang,
                tgt_lang=tgt_lang,
            )

            # 2. Tokenize
            inputs = self.tokenizer(
                preprocessed_batch,
                padding=True,
                truncation=True,
                max_length=max_length,
                return_tensors="pt",
            ).to(self.device)

            # 3. Model Generation
            gen_kwargs = {
                "max_length": max_length,
                "num_beams": num_beams,
                "use_cache": True,
                **generation_kwargs,
            }

            with torch.inference_mode():
                generated_tokens = self.model.generate(
                    **inputs,
                    **gen_kwargs,
                )

            # 4. Target Tokenizer Decoding
            with self.tokenizer.as_target_tokenizer():
                decoded_preds = self.tokenizer.batch_decode(
                    generated_tokens,
                    skip_special_tokens=True,
                )

            # 5. Postprocess batch with IndicProcessor
            postprocessed_translations = self.ip.postprocess_batch(
                decoded_preds,
                lang=tgt_lang,
            )

        except Exception as e:
            logger.error(f"Inference error during translation: {e}")
            raise RuntimeError(f"Translation failed: {e}") from e

        # Recombine with empty entries if any
        results = ["" for _ in sentences]
        for result_idx, orig_idx in enumerate(non_empty_indices):
            results[orig_idx] = postprocessed_translations[result_idx]

        return results[0] if is_single else results


# Singleton instance for simple module-level calls
_default_translator: Optional[IndicTransTranslator] = None


def translate_hindi_to_santali(text: str) -> str:
    """
    Standard interface function to translate Hindi text into Santali (Ol Chiki) script.
    
    Args:
        text: Hindi text string (in Devanagari script).
        
    Returns:
        Translated Santali text string (in Ol Chiki script).
    """
    global _default_translator
    if not isinstance(text, str):
        raise TypeError(f"Expected str input for text, got {type(text).__name__}")
    if not text.strip():
        return ""

    if _default_translator is None:
        _default_translator = IndicTransTranslator()

    return _default_translator.translate(text=text, src_lang="hin_Deva", tgt_lang="sat_Olck")
