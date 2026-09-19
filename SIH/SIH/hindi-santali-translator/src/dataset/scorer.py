"""
Rule-based data quality scoring module for Hindi-Santali parallel sentence pairs.
Computes a transparent structural quality score (0.0 to 1.0) and assigns quality buckets (A, B, C, D).
Note: This score measures structural and script conformance, not semantic human translation accuracy.
"""

from typing import Dict, Any, Tuple

def compute_quality_score(
    source_script_ratio: float,
    target_ol_chiki_ratio: float,
    source_len: int,
    target_len: int,
    has_foreign_spans: bool = False,
    is_duplicate: bool = False
) -> Tuple[float, str, Dict[str, Any]]:
    """
    Calculates a multi-factor structural quality score (0.0 - 1.0) and quality bucket.
    """
    # 1. Script validity factor (weight: 0.40)
    script_score = (source_script_ratio * 0.5) + (target_ol_chiki_ratio * 0.5)

    # 2. Length balance factor (weight: 0.30)
    if source_len == 0 or target_len == 0:
        length_ratio = 0.0
        ratio_score = 0.0
    else:
        length_ratio = target_len / source_len
        # Ideal ratio is between 0.6 and 2.0
        if 0.6 <= length_ratio <= 2.0:
            ratio_score = 1.0
        elif 0.3 <= length_ratio <= 3.0:
            ratio_score = 0.75
        elif 0.15 <= length_ratio <= 4.5:
            ratio_score = 0.40
        else:
            ratio_score = 0.10

    # 3. Minimum length plausibility factor (weight: 0.15)
    if source_len >= 15 and target_len >= 15:
        len_plausibility = 1.0
    elif source_len >= 5 and target_len >= 5:
        len_plausibility = 0.70
    else:
        len_plausibility = 0.30

    # 4. Cleanliness factor (weight: 0.15)
    cleanliness = 1.0
    if has_foreign_spans:
        cleanliness -= 0.40
    if is_duplicate:
        cleanliness -= 0.30
    cleanliness = max(0.0, cleanliness)

    # Total score calculation
    total_score = (
        (script_score * 0.40) +
        (ratio_score * 0.30) +
        (len_plausibility * 0.15) +
        (cleanliness * 0.15)
    )
    total_score = round(min(1.0, max(0.0, total_score)), 4)

    # Assign Quality Bucket
    if total_score >= 0.85:
        quality_bucket = "A"  # High Quality
    elif total_score >= 0.70:
        quality_bucket = "B"  # Usable
    elif total_score >= 0.50:
        quality_bucket = "C"  # Questionable
    else:
        quality_bucket = "D"  # Reject

    breakdown = {
        "script_score": round(script_score, 4),
        "ratio_score": round(ratio_score, 4),
        "length_ratio": round(length_ratio, 4),
        "len_plausibility": round(len_plausibility, 4),
        "cleanliness": round(cleanliness, 4),
        "quality_score": total_score,
        "quality_bucket": quality_bucket
    }

    return total_score, quality_bucket, breakdown
