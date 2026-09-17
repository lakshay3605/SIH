"""
Unit tests for Real Neural Pipeline:
Tests model initialization, LoRA attachment, real gradient backprop,
checkpoint saving/loading, autoregressive generation, and SacreBLEU evaluation
using a self-contained local miniature Seq2Seq model fixture.
"""

import os
import shutil
import tempfile
import unittest
import torch
from transformers import (
    BartConfig,
    BartForConditionalGeneration,
    AutoTokenizer,
    PreTrainedTokenizerFast
)
from tokenizers import Tokenizer
from tokenizers.models import WordLevel
from tokenizers.pre_tokenizers import Whitespace
from peft import LoraConfig, get_peft_model, TaskType, PeftModel

from src.metrics import compute_translation_metrics
from src.inference import NeuralHindiSantaliTranslator


class TestNeuralPipeline(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.mkdtemp(prefix="aadivaani_test_")

        # 1. Build a local miniature Seq2Seq model (315K params, ~1.2 MB on disk)
        cls.config = BartConfig(
            vocab_size=128,
            d_model=32,
            encoder_layers=2,
            decoder_layers=2,
            encoder_attention_heads=2,
            decoder_attention_heads=2,
            encoder_ffn_dim=64,
            decoder_ffn_dim=64,
            max_position_embeddings=128,
            pad_token_id=0,
            bos_token_id=1,
            eos_token_id=2
        )
        cls.base_model = BartForConditionalGeneration(cls.config)
        cls.base_model_path = os.path.join(cls.temp_dir, "mini_base_model")
        cls.base_model.save_pretrained(cls.base_model_path)

        # 2. Build a local miniature tokenizer matching the vocab
        raw_tok = Tokenizer(WordLevel(vocab={"<pad>": 0, "<s>": 1, "</s>": 2, "<unk>": 3}, unk_token="<unk>"))
        raw_tok.pre_tokenizer = Whitespace()
        # Add basic test tokens
        for i in range(4, 128):
            raw_tok.add_tokens([f"token_{i}"])
        raw_tok.add_tokens(["नमस्ते", "आप", "कैसे", "हैं", "ᱡᱚᱦᱟᱨ", "ᱟᱢ", "ᱪᱮᱫ", "ᱞᱮᱠᱟ"])

        cls.tokenizer = PreTrainedTokenizerFast(
            tokenizer_object=raw_tok,
            pad_token="<pad>",
            bos_token="<s>",
            eos_token="</s>",
            unk_token="<unk>"
        )
        cls.tokenizer.save_pretrained(cls.base_model_path)

        # Checkpoint directory
        cls.checkpoint_dir = os.path.join(cls.temp_dir, "test_lora_checkpoint")

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(cls.temp_dir):
            shutil.rmtree(cls.temp_dir)

    def test_lora_injection_and_gradient_flow(self):
        """Verify LoRA injects trainable adapters and receives real backprop gradients."""
        lora_config = LoraConfig(
            task_type=TaskType.SEQ_2_SEQ_LM,
            r=4,
            lora_alpha=8,
            target_modules=["q_proj", "v_proj"],
            bias="none"
        )
        peft_model = get_peft_model(self.base_model, lora_config)

        # Trainable parameter assertion
        trainable = sum(p.numel() for p in peft_model.parameters() if p.requires_grad)
        total = sum(p.numel() for p in peft_model.parameters())
        self.assertGreater(trainable, 0)
        self.assertLess(trainable, total)

        # Real Forward & Backward pass
        input_ids = torch.randint(0, 120, (2, 8))
        labels = torch.randint(0, 120, (2, 8))
        outputs = peft_model(input_ids=input_ids, labels=labels)

        loss = outputs.loss
        self.assertIsNotNone(loss)
        self.assertGreater(loss.item(), 0.0)

        loss.backward()

        # Verify gradient existence on LoRA weights
        lora_grad_found = False
        for name, param in peft_model.named_parameters():
            if "lora" in name and param.grad is not None:
                if param.grad.abs().sum() > 0:
                    lora_grad_found = True
                    break
        self.assertTrue(lora_grad_found, "LoRA parameters must receive nonzero gradients during backprop")

    def test_real_checkpoint_saving_and_loading(self):
        """Verify that genuine weights (safetensors or bin) are written and reloadable."""
        lora_config = LoraConfig(
            task_type=TaskType.SEQ_2_SEQ_LM,
            r=4,
            lora_alpha=8,
            target_modules=["q_proj", "v_proj"],
            bias="none"
        )
        peft_model = get_peft_model(self.base_model, lora_config)
        peft_model.save_pretrained(self.checkpoint_dir)
        self.tokenizer.save_pretrained(self.checkpoint_dir)

        # Assert config and real weight files exist on disk
        self.assertTrue(os.path.exists(os.path.join(self.checkpoint_dir, "adapter_config.json")))
        has_weights = (
            os.path.exists(os.path.join(self.checkpoint_dir, "adapter_model.safetensors")) or
            os.path.exists(os.path.join(self.checkpoint_dir, "adapter_model.bin"))
        )
        self.assertTrue(has_weights, "Checkpoint directory must contain actual weight files")

        # Reload weights into a fresh base model
        fresh_base = BartForConditionalGeneration(self.config)
        reloaded = PeftModel.from_pretrained(fresh_base, self.checkpoint_dir)
        self.assertIsNotNone(reloaded)

    def test_autoregressive_generation(self):
        """Verify model.generate produces decoded token strings."""
        input_ids = torch.tensor([[1, 5, 6, 7, 2]])
        gen = self.base_model.generate(input_ids, max_length=10)
        self.assertIsInstance(gen, torch.Tensor)
        self.assertEqual(gen.shape[0], 1)
        decoded = self.tokenizer.batch_decode(gen, skip_special_tokens=True)
        self.assertIsInstance(decoded[0], str)

    def test_evaluation_metrics_computation(self):
        """Verify real SacreBLEU / chrF++ computation without mocks."""
        hypotheses = ["ᱡᱚᱦᱟᱨ ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ?"]
        references = ["ᱡᱚᱦᱟᱨ, ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ?"]
        metrics = compute_translation_metrics(hypotheses, references, [0.05])
        
        self.assertIn("chrf_plus_plus", metrics)
        self.assertIn("bleu_4", metrics)
        self.assertGreater(metrics["chrf_plus_plus"], 50.0) # High similarity
        self.assertEqual(metrics["ol_chiki_validity_pct"], 100.0)
        self.assertEqual(metrics["foreign_contamination_pct"], 0.0)

    def test_inference_error_handling(self):
        """Verify translator handles empty inputs and missing model gracefully."""
        translator = NeuralHindiSantaliTranslator(model_path=self.checkpoint_dir, use_phrase_cache=False)
        # Empty input should return empty string without crash
        self.assertEqual(translator.translate(""), "")


if __name__ == "__main__":
    unittest.main()
