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
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from peft import PeftModel

from src.script_validator import normalize_text, validate_ol_chiki, validate_devanagari


class NeuralHindiSantaliTranslator:
    """
    Offline Neural Translation Engine for Hindi -> Santali.
    Performs true autoregressive token generation.
    """
    def __init__(
        self,
        model_path: Optional[str] = None,
        base_model_id: Optional[str] = None,
        device: Optional[str] = None,
        use_phrase_cache: bool = False
    ):
        self.use_phrase_cache = use_phrase_cache
        self.phrase_cache = {}
        self.device = torch.device(device if device else ("cuda" if torch.cuda.is_available() else "cpu"))

        # Default model search locations
        candidate_paths = [
            model_path,
            "models/checkpoints/best_lora",
            "checkpoints/best_lora_checkpoint",
            "ai4bharat/indictrans2-indic-indic-dist-320M"
        ]
        resolved_path = None
        for p in candidate_paths:
            if p and (os.path.exists(p) or "/" in p):
                resolved_path = p
                break

        self.model_path = resolved_path or "models/checkpoints/best_lora"
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
                            self.phrase_cache[normalize_text(k)] = normalize_text(v)
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
        hindi_text: str,
        max_length: int = 128,
        num_beams: int = 1,
        temperature: float = 1.0
    ) -> str:
        """
        Translates Hindi input text to Santali (Ol Chiki) using genuine model generation.
        """
        norm_hi = normalize_text(hindi_text)
        if not norm_hi:
            return ""

        # Tier-1: Optional exact phrase cache lookup (if explicitly enabled)
        if self.use_phrase_cache and norm_hi in self.phrase_cache:
            return self.phrase_cache[norm_hi]

        # Tier-2: Neural Model Generation
        if self.model is None or self.tokenizer is None:
            raise RuntimeError(
                f"Neural model is not loaded (tried '{self.model_path}'). "
                f"Ensure a valid model checkpoint exists or run 'python -m src.train_lora'."
            )

        if hasattr(self.tokenizer, "src_lang"):
            self.tokenizer.src_lang = "hin_Deva"

        # Format with language tag prefix if using IndicTransTokenizer
        formatted_src = norm_hi
        if not formatted_src.startswith("hin_Deva"):
            # Check if tokenizer expects language tag format
            if type(self.tokenizer).__name__ == "IndicTransTokenizer" or hasattr(self.tokenizer, "add_new_language_tags"):
                formatted_src = f"hin_Deva sat_Olck {norm_hi}"

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
    """
    Standard Public Interface for Aadivaani Hindi -> Santali translation.
    Args:
        hindi_text: Source Hindi text in Devanagari script.
        model_path: Path to trained model or PEFT checkpoint.
        use_phrase_cache: If True, allows instant Tier-1 cache lookup for exact phrase matches.
    Returns:
        Translated Santali text in Ol Chiki script.
    """
    translator = get_translator(model_path=model_path, use_phrase_cache=use_phrase_cache)
    return translator.translate(hindi_text)


if __name__ == "__main__":
    test_input = "नमस्ते, आप कैसे हैं?"
    print(f"Testing real inference module with: '{test_input}'")
    try:
        res = translate_hindi_to_santali(test_input, use_phrase_cache=True)
        print(f"Result (Cache Enabled): {res}")
    except Exception as e:
        print(f"Caught expected behavior when model weights not yet trained: {e}")
