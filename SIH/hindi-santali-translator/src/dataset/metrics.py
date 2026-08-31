"""
Evaluation metrics calculation module for machine translation.
Implements BLEU, chrF++, Ol Chiki validity rate, repetition rate, and contamination rate in pure Python.
"""

import math
import re
from collections import Counter
from typing import List, Dict, Any, Tuple
from src.dataset.validator import validate_ol_chiki_target

def get_ngrams(tokens: List[str], n: int) -> Counter:
    """Extracts n-grams from a list of tokens."""
    return Counter([tuple(tokens[i:i+n]) for i in range(len(tokens) - n + 1)])

def compute_sentence_bleu(hyp_tokens: List[str], ref_tokens: List[str], max_n: int = 4) -> float:
    """Computes sentence-level BLEU with smoothing."""
    if not hyp_tokens or not ref_tokens:
        return 0.0

    precisions = []
    for n in range(1, max_n + 1):
        hyp_ngrams = get_ngrams(hyp_tokens, n)
        ref_ngrams = get_ngrams(ref_tokens, n)

        total_hyp = sum(hyp_ngrams.values())
        if total_hyp == 0:
            precisions.append(0.0)
            continue

        clipped_matches = 0
        for ng, count in hyp_ngrams.items():
            clipped_matches += min(count, ref_ngrams.get(ng, 0))

        # Smoothing for zero matches
        precisions.append((clipped_matches + 0.1) / (total_hyp + 0.1))

    # Brevity penalty
    c = len(hyp_tokens)
    r = len(ref_tokens)
    if c == 0:
        return 0.0
    if c > r:
        bp = 1.0
    else:
        bp = math.exp(1 - (r / c)) if c > 0 else 0.0

    geom_mean = math.exp(sum(math.log(p) for p in precisions) / max_n)
    return bp * geom_mean * 100.0

def compute_corpus_bleu(hypotheses: List[str], references: List[str], max_n: int = 4) -> float:
    """Computes corpus-level BLEU-4 with brevity penalty."""
    if not hypotheses or not references:
        return 0.0

    total_clipped = [0] * max_n
    total_hyp = [0] * max_n
    total_c = 0
    total_r = 0

    for hyp, ref in zip(hypotheses, references):
        hyp_toks = hyp.strip().split()
        ref_toks = ref.strip().split()
        total_c += len(hyp_toks)
        total_r += len(ref_toks)

        for n in range(1, max_n + 1):
            hyp_ng = get_ngrams(hyp_toks, n)
            ref_ng = get_ngrams(ref_toks, n)
            total_hyp[n-1] += sum(hyp_ng.values())
            for ng, cnt in hyp_ng.items():
                total_clipped[n-1] += min(cnt, ref_ng.get(ng, 0))

    precisions = []
    for n in range(max_n):
        if total_hyp[n] == 0:
            precisions.append(0.0)
        else:
            precisions.append((total_clipped[n] + 1e-5) / (total_hyp[n] + 1e-5))

    if total_c == 0:
        return 0.0

    bp = 1.0 if total_c > total_r else math.exp(1 - (total_r / total_c))
    geom_mean = math.exp(sum(math.log(p) for p in precisions) / max_n)
    return round(bp * geom_mean * 100.0, 2)

def compute_corpus_chrf(hypotheses: List[str], references: List[str], char_n: int = 6, beta: float = 2.0) -> float:
    """Computes chrF++ character n-gram F-score."""
    if not hypotheses or not references:
        return 0.0

    f_scores = []
    for hyp, ref in zip(hypotheses, references):
        hyp_clean = "".join(hyp.split())
        ref_clean = "".join(ref.split())

        if not hyp_clean or not ref_clean:
            f_scores.append(0.0)
            continue

        n_precisions = []
        n_recalls = []
        for n in range(1, char_n + 1):
            hyp_ng = Counter([hyp_clean[i:i+n] for i in range(len(hyp_clean) - n + 1)])
            ref_ng = Counter([ref_clean[i:i+n] for i in range(len(ref_clean) - n + 1)])

            total_h = sum(hyp_ng.values())
            total_r = sum(ref_ng.values())

            if total_h == 0 or total_r == 0:
                n_precisions.append(0.0)
                n_recalls.append(0.0)
                continue

            matches = sum(min(cnt, ref_ng.get(ng, 0)) for ng, cnt in hyp_ng.items())
            n_precisions.append(matches / total_h)
            n_recalls.append(matches / total_r)

        avg_p = sum(n_precisions) / len(n_precisions) if n_precisions else 0.0
        avg_r = sum(n_recalls) / len(n_recalls) if n_recalls else 0.0

        if (beta**2 * avg_p + avg_r) == 0:
            f_scores.append(0.0)
        else:
            f_score = ((1 + beta**2) * avg_p * avg_r) / (beta**2 * avg_p + avg_r)
            f_scores.append(f_score * 100.0)

    return round(sum(f_scores) / len(f_scores), 2) if f_scores else 0.0

def detect_repetition(text: str) -> bool:
    """Detects repeated consecutive words or phrases (e.g. 'ᱦᱚᱭᱩᱜ ᱟ ᱦᱚᱭᱩᱜ ᱟ')."""
    words = text.strip().split()
    if len(words) < 4:
        return False
    # Check 1-word repetition 3+ times
    for i in range(len(words) - 2):
        if words[i] == words[i+1] == words[i+2]:
            return True
    # Check 2-word phrase repetition 2+ times
    for i in range(len(words) - 3):
        if words[i:i+2] == words[i+2:i+4]:
            return True
    return False

def evaluate_predictions(
    inputs: List[str],
    references: List[str],
    predictions: List[str],
    latencies: List[float]
) -> Dict[str, Any]:
    """
    Computes comprehensive translation evaluation metrics.
    """
    total = len(predictions)
    if total == 0:
        return {}

    empty_count = sum(1 for p in predictions if not p or not p.strip())
    repetition_count = sum(1 for p in predictions if detect_repetition(p))

    valid_script_count = 0
    foreign_contamination_count = 0
    sample_evaluations = []

    for idx, (inp, ref, pred, lat) in enumerate(zip(inputs, references, predictions, latencies)):
        val_res = validate_ol_chiki_target(pred)
        if val_res["valid"]:
            valid_script_count += 1
        if val_res["invalid_spans"]:
            foreign_contamination_count += 1

        hyp_tokens = pred.strip().split()
        ref_tokens = ref.strip().split()
        s_bleu = compute_sentence_bleu(hyp_tokens, ref_tokens)

        sample_evaluations.append({
            "index": idx + 1,
            "hindi_input": inp,
            "reference_santali": ref,
            "prediction": pred,
            "script_valid": val_res["valid"],
            "ol_chiki_ratio": val_res["ol_chiki_ratio"],
            "has_repetition": detect_repetition(pred),
            "sentence_bleu": round(s_bleu, 2),
            "latency_seconds": round(lat, 3)
        })

    bleu = compute_corpus_bleu(predictions, references)
    chrf = compute_corpus_chrf(predictions, references)
    avg_latency = round(sum(latencies) / len(latencies), 3) if latencies else 0.0

    return {
        "total_eval_samples": total,
        "corpus_bleu_4": bleu,
        "corpus_chrf_plus_plus": chrf,
        "ol_chiki_validity_rate_pct": round((valid_script_count / total) * 100, 2),
        "foreign_script_contamination_rate_pct": round((foreign_contamination_count / total) * 100, 2),
        "repetition_rate_pct": round((repetition_count / total) * 100, 2),
        "empty_output_rate_pct": round((empty_count / total) * 100, 2),
        "avg_latency_seconds_per_sentence": avg_latency,
        "total_evaluation_time_seconds": round(sum(latencies), 2),
        "sample_evaluations": sample_evaluations
    }
