"""
Unit tests for Dataset Validation, Deduplication, Leakage Prevention, and Splitting.
"""

import unittest
from src.dataset_builder import (
    validate_and_filter_dataset,
    split_dataset,
    compute_dataset_statistics
)


class TestDatasetPipeline(unittest.TestCase):

    def setUp(self):
        self.mock_candidates = [
            # Valid Pair 1
            {"hindi": "नमस्ते, आप कैसे हैं?", "santali": "ᱡᱚᱦᱟᱨ, ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ?", "source": "test_src"},
            # Valid Pair 2
            {"hindi": "मैं घर जा रहा हूँ।", "santali": "ᱤᱧ ᱚᱲᱟᱜ-ᱤᱧ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ।", "source": "test_src"},
            # Duplicate Hindi Pair
            {"hindi": "नमस्ते, आप कैसे हैं?", "santali": "ᱡᱚᱦᱟᱨ, ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ?", "source": "duplicate"},
            # Identical Source & Target (Untranslated)
            {"hindi": "यह एक किताब है।", "santali": "यह एक किताब है।", "source": "identical"},
            # Empty Santali
            {"hindi": "पानी लाओ", "santali": "", "source": "empty_tgt"},
            # Contaminated Script (Latin in Santali)
            {"hindi": "बाज़ार चलो", "santali": "bajar chalo", "source": "latin_tgt"},
            # Severe Length Ratio Mismatch
            {"hindi": "यह एक बहुत बड़ा और लंबा वाक्य है जिसमें कई शब्द हैं।", "santali": "ᱫᱟᱜ", "source": "ratio_mismatch"}
        ]

    def test_filtering_and_deduplication(self):
        valid, rejected = validate_and_filter_dataset(self.mock_candidates)
        
        # Only 2 pairs should be valid
        self.assertEqual(len(valid), 2)
        self.assertEqual(len(rejected), 5)

        reasons = [r["reason"] for r in rejected]
        self.assertIn("duplicate_hindi_source", reasons)
        self.assertIn("identical_source_target", reasons)
        self.assertIn("empty_or_too_short", reasons)
        self.assertIn("invalid_santali_script", reasons)
        self.assertIn("abnormal_length_ratio", reasons)

    def test_zero_leakage_splits(self):
        # Generate 100 synthetic valid pairs to test splitting
        pairs = []
        for i in range(100):
            pairs.append({
                "hindi": f"वाक्य संख्या {i} यहाँ है।",
                "santali": f"ᱟᱹᱭᱟᱹᱛ ᱮᱞ {i} ᱱᱚᱰᱮ ᱢᱮᱱᱟᱜ-ᱟ।"
            })

        train, val, test = split_dataset(pairs, train_ratio=0.80, val_ratio=0.10, seed=42)
        self.assertEqual(len(train), 80)
        self.assertEqual(len(val), 10)
        self.assertEqual(len(test), 10)

        # Assert zero leakage
        train_hi = set(x["hindi"] for x in train)
        val_hi = set(x["hindi"] for x in val)
        test_hi = set(x["hindi"] for x in test)

        self.assertEqual(len(train_hi.intersection(val_hi)), 0)
        self.assertEqual(len(train_hi.intersection(test_hi)), 0)
        self.assertEqual(len(val_hi.intersection(test_hi)), 0)

    def test_statistics_calculation(self):
        train = [{"hindi": "एक दो तीन", "santali": "ᱢᱤᱫ ᱵᱟᱨ ᱯᱮ", "provenance": "test", "source": "src1"}]
        val = [{"hindi": "चार पाँच", "santali": "ᱯᱩᱱ ᱢᱚᱬᱮ", "provenance": "test", "source": "src1"}]
        test = [{"hindi": "छह सात", "santali": "ᱛᱩᱨᱩᱭ ᱮᱭᱟᱭ", "provenance": "test", "source": "src1"}]
        rejected = [{"reason": "empty"}]

        stats = compute_dataset_statistics(train, val, test, rejected)
        self.assertEqual(stats["total_valid_pairs"], 3)
        self.assertEqual(stats["total_rejected_pairs"], 1)
        self.assertEqual(stats["split_counts"]["train"], 1)
        self.assertIn("token_statistics", stats)


if __name__ == "__main__":
    unittest.main()
