"""
Metrics calculation suite for Hindi -> Santali translation evaluation.
Computes BLEU-4, chrF++, Ol Chiki script validity, foreign contamination,
repetition rate, empty outputs, and latency.
Provides full SacreBLEU integration with fallback.
"""

import time
import re
import math
from collections import Counter
from typing import List, Dict, Tuple
from src.script_validator import validate_ol_chiki, normalize_text

try:
    import sacrebleu
    HAS_SACREBLEU = True
except ImportError:
    HAS_SACREBLEU = False


def _compute_bleu(hypotheses: List[str], references: List[str], max_n: int = 4) -> float:
    """Fallback BLEU calculation matching standard SacreBLEU / Papineni et al."""
    total_len_hyp = 0
    total_len_ref = 0
    clipped_counts = [0] * max_n
    total_counts = [0] * max_n

    for hyp, ref in zip(hypotheses, references):
        hyp_tokens = normalize_text(hyp).split()
        ref_tokens = normalize_text(ref).split()
        total_len_hyp += len(hyp_tokens)
        total_len_ref += len(ref_tokens)

        for n in range(1, max_n + 1):
            hyp_ngrams = [tuple(hyp_tokens[i:i+n]) for i in range(len(hyp_tokens)-n+1)]
            ref_ngrams = [tuple(ref_tokens[i:i+n]) for i in range(len(ref_tokens)-n+1)]
            ref_counter = Counter(ref_ngrams)
            hyp_counter = Counter(hyp_ngrams)

            clipped = sum(min(count, ref_counter[ng]) for ng, count in hyp_counter.items())
            clipped_counts[n-1] += clipped
            total_counts[n-1] += len(hyp_ngrams)

    # Brevity penalty
    if total_len_hyp == 0:
        return 0.0
    bp = 1.0 if total_len_hyp > total_len_ref else math.exp(1 - (total_len_ref / total_len_hyp))

    precisions = []
    for clipped, total in zip(clipped_counts, total_counts):
        if total == 0 or clipped == 0:
            precisions.append(1e-9)
        else:
            precisions.append(clipped / total)

    geom_mean = math.exp(sum((1.0 / max_n) * math.log(p) for p in precisions))
    return round(bp * geom_mean * 100, 2)


def _compute_chrf(hypotheses: List[str], references: List[str], char_order: int = 6, beta: float = 2.0) -> float:
    """Fallback chrF calculation matching Popovic (2015)."""
    precisions = []
    recalls = []

    for hyp, ref in zip(hypotheses, references):
        hyp_chars = list(normalize_text(hyp))
        ref_chars = list(normalize_text(ref))
        if not hyp_chars or not ref_chars:
            continue

        for n in range(1, char_order + 1):
            hyp_ngrams = [tuple(hyp_chars[i:i+n]) for i in range(len(hyp_chars)-n+1)]
            ref_ngrams = [tuple(ref_chars[i:i+n]) for i in range(len(ref_chars)-n+1)]
            ref_counter = Counter(ref_ngrams)
            hyp_counter = Counter(hyp_ngrams)

            clipped = sum(min(count, ref_counter[ng]) for ng, count in hyp_counter.items())
            p = (clipped / len(hyp_ngrams)) if len(hyp_ngrams) > 0 else 0.0
            r = (clipped / len(ref_ngrams)) if len(ref_ngrams) > 0 else 0.0
            precisions.append(p)
            recalls.append(r)

    if not precisions:
        return 0.0

    avg_p = sum(precisions) / len(precisions)
    avg_r = sum(recalls) / len(recalls)
    if (beta**2 * avg_p + avg_r) == 0:
        return 0.0
    chrf = (1 + beta**2) * (avg_p * avg_r) / (beta**2 * avg_p + avg_r)
    return round(chrf * 100, 2)


def detect_repetition(text: str, n: int = 3) -> bool:
    """
    Detects catastrophic or phrase-level repetitive loops.
    """
    words = text.strip().split()
    if len(words) < n * 3:
        return False
    for i in range(len(words) - n * 2):
        ngram = " ".join(words[i:i+n])
        rest = " ".join(words[i+n:])
        if (ngram + " " + ngram) in rest or rest.startswith(ngram):
            return True
    return False


def compute_translation_metrics(
    hypotheses: List[str],
    references: List[str],
    latencies_sec: List[float] = None
) -> Dict:
    """
    Compute full evaluation metrics comparing hypotheses to reference translations.
    """
    assert len(hypotheses) == len(references), "Hypotheses and references count mismatch"
    total_samples = len(hypotheses)

    if total_samples == 0:
        return {}

    # BLEU & chrF++
    if HAS_SACREBLEU:
        try:
            bleu = sacrebleu.corpus_bleu(hypotheses, [references])
            bleu_score = round(bleu.score, 2)
            chrf = sacrebleu.corpus_chrf(hypotheses, [references], word_order=2)
            chrf_score = round(chrf.score, 2)
        except Exception:
            bleu_score = _compute_bleu(hypotheses, references)
            chrf_score = _compute_chrf(hypotheses, references)
    else:
        bleu_score = _compute_bleu(hypotheses, references)
        chrf_score = _compute_chrf(hypotheses, references)

    # Script validation & contamination
    valid_ol_chiki_count = 0
    foreign_contaminated_count = 0
    repetition_count = 0
    empty_count = 0

    for hyp in hypotheses:
        norm_hyp = normalize_text(hyp)
        if not norm_hyp:
            empty_count += 1
            continue

        val_res = validate_ol_chiki(norm_hyp)
        if val_res["is_valid"]:
            valid_ol_chiki_count += 1
        if val_res["has_foreign_contamination"]:
            foreign_contaminated_count += 1
        if detect_repetition(norm_hyp):
            repetition_count += 1

    ol_chiki_validity_pct = round((valid_ol_chiki_count / total_samples) * 100, 2)
    foreign_contamination_pct = round((foreign_contaminated_count / total_samples) * 100, 2)
    repetition_pct = round((repetition_count / total_samples) * 100, 2)
    empty_pct = round((empty_count / total_samples) * 100, 2)

    avg_latency = 0.0
    if latencies_sec and len(latencies_sec) > 0:
        avg_latency = round(sum(latencies_sec) / len(latencies_sec), 3)

    return {
        "bleu_4": bleu_score,
        "chrf_plus_plus": chrf_score,
        "ol_chiki_validity_pct": ol_chiki_validity_pct,
        "foreign_contamination_pct": foreign_contamination_pct,
        "repetition_pct": repetition_pct,
        "empty_output_pct": empty_pct,
        "average_latency_sec": avg_latency,
        "total_evaluated_samples": total_samples
    }
