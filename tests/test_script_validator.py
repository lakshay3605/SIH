"""
Unit tests for Unicode script validation and normalization.
Tests Devanagari, Ol Chiki, foreign contamination detection, and phonetic transliteration.
"""

import unittest
from src.script_validator import (
    normalize_text,
    validate_ol_chiki,
    validate_devanagari,
    transliterate_devanagari_to_ol_chiki,
    is_ol_chiki_char,
    is_devanagari_char
)


class TestScriptValidator(unittest.TestCase):

    def test_unicode_normalization(self):
        # Combining character sequence should normalize to NFC
        decomposed = "ह" + "\u093F" # Decomposed Hindi 'hi'
        normalized = normalize_text(decomposed)
        self.assertEqual(len(normalized), 2)
        # Whitespace collapsing
        raw_whitespace = "  नमस्ते,   आप     कैसे हैं? \n\t "
        self.assertEqual(normalize_text(raw_whitespace), "नमस्ते, आप कैसे हैं?")

    def test_valid_ol_chiki(self):
        pure_santali = "ᱡᱚᱦᱟᱨ, ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ?"
        res = validate_ol_chiki(pure_santali)
        self.assertTrue(res["is_valid"])
        self.assertFalse(res["has_foreign_contamination"])
        self.assertEqual(res["validity_ratio"], 1.0)
        self.assertEqual(len(res["foreign_chars"]), 0)

    def test_contaminated_ol_chiki(self):
        # Santali mixed with English Latin word
        mixed_text = "ᱡᱚᱦᱟᱨ hello ᱟᱢ"
        res = validate_ol_chiki(mixed_text)
        self.assertTrue(res["has_foreign_contamination"])
        self.assertIn("h", res["foreign_chars"])
        self.assertIn("e", res["foreign_chars"])

    def test_valid_devanagari(self):
        hindi_sentence = "हम सब मिलकर काम करेंगे।"
        res = validate_devanagari(hindi_sentence)
        self.assertTrue(res["is_valid"])
        self.assertFalse(res["has_foreign_contamination"])
        self.assertEqual(res["validity_ratio"], 1.0)

    def test_empty_and_punctuation_inputs(self):
        empty_res = validate_ol_chiki("")
        self.assertFalse(empty_res["is_valid"])
        self.assertEqual(empty_res["ol_chiki_char_count"], 0)

        punct_only = ".,!?;:--- "
        self.assertFalse(validate_ol_chiki(punct_only)["is_valid"])
        self.assertFalse(validate_devanagari(punct_only)["is_valid"])

    def test_devanagari_to_ol_chiki_transliteration(self):
        trans = transliterate_devanagari_to_ol_chiki("नमस्ते")
        self.assertIsInstance(trans, str)
        self.assertTrue(len(trans) > 0)
        # All characters in transliterated output must be Ol Chiki or punctuation
        val = validate_ol_chiki(trans)
        self.assertTrue(val["is_valid"])


if __name__ == "__main__":
    unittest.main()
