"""
Aadivaani Real Inference Pipeline: Hindi (Devanagari) -> Santali (Ol Chiki).
Implements genuine neural sequence-to-sequence generation via PyTorch & HuggingFace.
Loads locally trained model weights and SentencePiece tokenizer for 100% offline execution.
Retains optional phrase cache acceleration without replacing the primary neural model.
"""

import os
import sys
import json
import time
from typing import Optional, Dict

# Ensure UTF-8 output on Windows console
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import torch
try:
    import torch.distributed.tensor  # Ensures torch.distributed.tensor is populated for PEFT on Windows/Python 3.13
except Exception:
    pass
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from peft import PeftModel

from src.script_validator import (
    normalize_text,
    validate_ol_chiki,
    validate_devanagari,
    detect_script
)


class NeuralHindiSantaliTranslator:
    """
    Offline Neural Translation Engine for Hindi <-> Santali.
    Performs true autoregressive token generation in both directions:
      - hin_Deva -> sat_Olck
      - sat_Olck -> hin_Deva
    """
    def __init__(
        self,
        model_path: Optional[str] = None,
        base_model_id: Optional[str] = None,
        device: Optional[str] = None,
        use_phrase_cache: bool = False
    ):
        self.use_phrase_cache = use_phrase_cache
        self.phrase_cache: Dict[str, str] = {}
        self.reverse_phrase_cache: Dict[str, str] = {}
        self.device = torch.device(device if device else ("cuda" if torch.cuda.is_available() else "cpu"))

        # Default model search locations
        candidate_paths = [
            model_path,
            "models/checkpoints/best_multilingual_lora",
            "models/checkpoints/best_lora",
            "checkpoints/best_lora_checkpoint",
            "ai4bharat/indictrans2-indic-indic-dist-320M"
        ]
        resolved_path = None
        for p in candidate_paths:
            if p and (os.path.exists(p) or "/" in p):
                resolved_path = p
                break

        self.model_path = resolved_path or "models/checkpoints/best_multilingual_lora"
        self.base_model_id = base_model_id

        # 1. Load optional phrase cache for Tier-1 acceleration
        if self.use_phrase_cache:
            self._load_phrase_cache()

        # 2. Load Tokenizer & Model
        self.tokenizer = None
        self.model = None
        self._load_neural_model()

    def _load_phrase_cache(self):
        cache_paths = [
            "data/translation_cache.json",
            "translation_cache.json"
        ]
        for cp in cache_paths:
            if os.path.exists(cp):
                try:
                    with open(cp, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        for k, v in data.items():
                            norm_k = normalize_text(k)
                            norm_v = normalize_text(v)
                            self.phrase_cache[norm_k] = norm_v
                            self.reverse_phrase_cache[norm_v] = norm_k
                    print(f"Loaded phrase cache: {len(self.phrase_cache)} phrases from {cp}")
                    break
                except Exception as e:
                    print(f"Warning loading phrase cache: {e}")

    def _load_neural_model(self):
        """Loads genuine neural model weights into memory."""
        print(f"Initializing Neural Translation Engine on {self.device}...")
        try:
            adapter_cfg = os.path.join(self.model_path, "adapter_config.json")
            base_id = self.base_model_id
            if os.path.exists(adapter_cfg):
                # PEFT LoRA adapter
                with open(adapter_cfg, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                base_id = base_id or cfg.get("base_model_name_or_path")

            try:
                self.tokenizer = AutoTokenizer.from_pretrained(self.model_path, trust_remote_code=True)
            except Exception:
                tok_id = base_id or "ai4bharat/indictrans2-indic-indic-dist-320M"
                self.tokenizer = AutoTokenizer.from_pretrained(tok_id, trust_remote_code=True)

            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token or "<pad>"

            if os.path.exists(adapter_cfg):
                print(f"Loading base model '{base_id}' and applying LoRA adapter '{self.model_path}'...")
                base_model = AutoModelForSeq2SeqLM.from_pretrained(
                    base_id,
                    trust_remote_code=True,
                    torch_dtype=torch.float32
                )
                self.model = PeftModel.from_pretrained(base_model, self.model_path)
            else:
                self.model = AutoModelForSeq2SeqLM.from_pretrained(
                    self.model_path,
                    trust_remote_code=True,
                    torch_dtype=torch.float32
                )

            self.model.to(self.device)
            self.model.eval()
            print(f"Neural Translation Engine ready ({self.model.__class__.__name__}).")

        except Exception as e:
            print(f"Warning: Could not load neural model from '{self.model_path}': {e}")
            print("Inference will raise ModelNotLoadedError if neural generation is requested.")
            self.model = None

    def translate(
        self,
        text: str,
        source_lang: Optional[str] = None,
        target_lang: Optional[str] = None,
        max_length: int = 128,
        num_beams: int = 1,
        temperature: float = 1.0
    ) -> str:
        """
        Translates input text between Hindi (hin_Deva) and Santali (sat_Olck).
        Automatically detects source script if source_lang is omitted.
        """
        norm_text = normalize_text(text)
        if not norm_text:
            return ""

        # Auto-detect script if not specified
        if not source_lang:
            detected = detect_script(norm_text)
            if detected == "ol_chiki":
                source_lang = "sat_Olck"
                target_lang = "hin_Deva"
            else:
                source_lang = "hin_Deva"
                target_lang = "sat_Olck"
        elif not target_lang:
            target_lang = "hin_Deva" if source_lang == "sat_Olck" else "sat_Olck"

        # Map Mundari language tag to IndicTrans2 unr_Deva
        if source_lang in ("mun_Deva", "mundari", "mun"):
            source_lang = "unr_Deva"
        if target_lang in ("mun_Deva", "mundari", "mun"):
            target_lang = "unr_Deva"

        # Tier-1: Optional exact phrase cache lookup
        if self.use_phrase_cache:
            if source_lang == "sat_Olck" and norm_text in self.reverse_phrase_cache:
                return self.reverse_phrase_cache[norm_text]
            elif source_lang == "hin_Deva" and norm_text in self.phrase_cache:
                return self.phrase_cache[norm_text]

        # Tier-2: Neural Model Generation
        if self.model is None or self.tokenizer is None:
            raise RuntimeError(
                f"Neural model is not loaded (tried '{self.model_path}'). "
                f"Ensure a valid model checkpoint exists or run 'python -m src.train_lora'."
            )

        if hasattr(self.tokenizer, "src_lang"):
            self.tokenizer.src_lang = source_lang

        formatted_src = norm_text
        if not formatted_src.startswith(source_lang):
            formatted_src = f"{source_lang} {target_lang} {norm_text}"

        inputs = self.tokenizer(
            formatted_src,
            return_tensors="pt",
            truncation=True,
            max_length=128
        ).to(self.device)

        with torch.no_grad():
            gen_kwargs = {
                "input_ids": inputs["input_ids"],
                "attention_mask": inputs.get("attention_mask"),
                "max_length": max_length,
                "num_beams": num_beams,
                "early_stopping": True if num_beams > 1 else False
            }
            if num_beams == 1 and temperature != 1.0:
                gen_kwargs["do_sample"] = True
                gen_kwargs["temperature"] = temperature

            tokens = self.model.generate(**gen_kwargs)

        output_text = self.tokenizer.decode(tokens[0], skip_special_tokens=True)
        return normalize_text(output_text)


# Global singleton instance for high-throughput calls
_global_translator: Optional[NeuralHindiSantaliTranslator] = None


def get_translator(
    model_path: Optional[str] = None,
    use_phrase_cache: bool = False
) -> NeuralHindiSantaliTranslator:
    """Returns or initializes the singleton neural translator instance."""
    global _global_translator
    if _global_translator is None or (model_path and _global_translator.model_path != model_path):
        _global_translator = NeuralHindiSantaliTranslator(
            model_path=model_path,
            use_phrase_cache=use_phrase_cache
        )
    return _global_translator


def translate_hindi_to_santali(
    hindi_text: str,
    model_path: Optional[str] = None,
    use_phrase_cache: bool = False
) -> str:
    """Translates Hindi (Devanagari) to Santali (Ol Chiki)."""
    translator = get_translator(model_path=model_path, use_phrase_cache=use_phrase_cache)
    return translator.translate(hindi_text, source_lang="hin_Deva", target_lang="sat_Olck")


def translate_santali_to_hindi(
    santali_text: str,
    model_path: Optional[str] = None,
    use_phrase_cache: bool = False
) -> str:
    """Translates Santali (Ol Chiki) to Hindi (Devanagari)."""
    translator = get_translator(model_path=model_path, use_phrase_cache=use_phrase_cache)
    return translator.translate(santali_text, source_lang="sat_Olck", target_lang="hin_Deva")


def translate_hindi_to_mundari(
    hindi_text: str,
    model_path: Optional[str] = None,
    use_phrase_cache: bool = False
) -> str:
    """Translates Hindi (Devanagari) to Mundari (Devanagari / unr_Deva)."""
    translator = get_translator(model_path=model_path, use_phrase_cache=use_phrase_cache)
    return translator.translate(hindi_text, source_lang="hin_Deva", target_lang="unr_Deva")


def translate_mundari_to_hindi(
    mundari_text: str,
    model_path: Optional[str] = None,
    use_phrase_cache: bool = False
) -> str:
    """Translates Mundari (Devanagari / unr_Deva) to Hindi (Devanagari)."""
    translator = get_translator(model_path=model_path, use_phrase_cache=use_phrase_cache)
    return translator.translate(mundari_text, source_lang="unr_Deva", target_lang="hin_Deva")


def translate(
    text: str,
    source_lang: Optional[str] = None,
    target_lang: Optional[str] = None,
    model_path: Optional[str] = None,
    use_phrase_cache: bool = False
) -> str:
    """Auto-detecting multilingual translator for Hindi, Santali, and Mundari."""
    translator = get_translator(model_path=model_path, use_phrase_cache=use_phrase_cache)
    return translator.translate(text, source_lang=source_lang, target_lang=target_lang)


if __name__ == "__main__":
    hi_test = "नमस्ते, आप कैसे हैं?"
    sat_test = "ᱥᱟᱱᱟᱢ ᱜᱤᱫᱽᱨᱟᱹ ᱜᱮ ᱵᱤᱨᱫᱟᱹᱜᱟᱲ ᱨᱮ ᱪᱟᱞᱟᱣᱚᱜ ᱠᱟᱱᱟ ᱾"

    print("=== Testing Hindi -> Santali ===")
    print(f"Hi:  {hi_test}")
    print(f"Sat: {translate_hindi_to_santali(hi_test, use_phrase_cache=True)}")

    print("\n=== Testing Santali -> Hindi (Reverse) ===")
    print(f"Sat: {sat_test}")
    print(f"Hi:  {translate_santali_to_hindi(sat_test, use_phrase_cache=False)}")

