"""
Deduplication and similarity detection module for Hindi-Santali parallel dataset.
Identifies exact duplicates, source/target duplicates, normalized duplicates, and near-duplicates.
"""

import hashlib
from typing import List, Dict, Any, Tuple, Set

def get_hash(text: str) -> str:
    """Computes SHA-256 hash of a string."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def get_char_ngrams(text: str, n: int = 3) -> Set[str]:
    """Extracts character n-grams for fuzzy similarity comparison."""
    if len(text) < n:
        return {text}
    return {text[i:i+n] for i in range(len(text) - n + 1)}

def jaccard_similarity(set1: Set[str], set2: Set[str]) -> float:
    """Computes Jaccard similarity between two sets."""
    if not set1 or not set2:
        return 0.0
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    return intersection / union if union > 0 else 0.0

def run_deduplication(records: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Analyzes and tags records for duplicates.
    Returns (processed_records, deduplication_report).
    """
    exact_hashes: Dict[str, str] = {}  # hash -> first_record_id
    source_hashes: Dict[str, str] = {} # hash -> first_record_id
    target_hashes: Dict[str, str] = {} # hash -> first_record_id
    norm_hashes: Dict[str, str] = {}   # hash -> first_record_id

    exact_duplicates = []
    source_duplicates = []
    target_duplicates = []
    norm_duplicates = []
    near_duplicates = []

    seen_ngrams: List[Tuple[str, Set[str]]] = []  # (id, ngrams)

    for rec in records:
        rec_id = rec["id"]
        src = rec["source_text"]
        tgt = rec["target_text"]
        norm_src = rec.get("normalized_source", src)
        norm_tgt = rec.get("normalized_target", tgt)

        exact_h = get_hash(f"{src}|||{tgt}")
        src_h = get_hash(src)
        tgt_h = get_hash(tgt)
        norm_h = get_hash(f"{norm_src}|||{norm_tgt}")

        is_exact = False
        is_source_dup = False
        is_target_dup = False
        is_norm_dup = False
        is_near_dup = False
        duplicate_of = None

        # 1. Exact duplicate check
        if exact_h in exact_hashes:
            is_exact = True
            duplicate_of = exact_hashes[exact_h]
            exact_duplicates.append({"id": rec_id, "duplicate_of": duplicate_of, "type": "exact"})
        else:
            exact_hashes[exact_h] = rec_id

        # 2. Normalized duplicate check
        if norm_h in norm_hashes and not is_exact:
            is_norm_dup = True
            duplicate_of = norm_hashes[norm_h]
            norm_duplicates.append({"id": rec_id, "duplicate_of": duplicate_of, "type": "normalized"})
        else:
            norm_hashes[norm_h] = rec_id

        # 3. Source duplicate check
        if src_h in source_hashes and not is_exact:
            is_source_dup = True
            source_duplicates.append({"id": rec_id, "first_id": source_hashes[src_h], "type": "source_duplicate"})
        else:
            source_hashes[src_h] = rec_id

        # 4. Target duplicate check
        if tgt_h in target_hashes and not is_exact:
            is_target_dup = True
            target_duplicates.append({"id": rec_id, "first_id": target_hashes[tgt_h], "type": "target_duplicate"})
        else:
            target_hashes[tgt_h] = rec_id

        # 5. Near duplicate check (character 3-grams on source)
        src_ngrams = get_char_ngrams(norm_src, n=3)
        if not is_exact and not is_norm_dup:
            for prev_id, prev_ngrams in seen_ngrams:
                sim = jaccard_similarity(src_ngrams, prev_ngrams)
                if sim >= 0.88 and sim < 1.0:
                    is_near_dup = True
                    near_duplicates.append({
                        "id": rec_id,
                        "similar_to": prev_id,
                        "similarity": round(sim, 3),
                        "type": "near_duplicate"
                    })
                    break
        seen_ngrams.append((rec_id, src_ngrams))

        # Tag record
        rec["is_duplicate"] = is_exact or is_norm_dup
        rec["duplicate_type"] = "exact" if is_exact else ("normalized" if is_norm_dup else ("near" if is_near_dup else "none"))
        rec["duplicate_of"] = duplicate_of

    unique_records = [r for r in records if not r["is_duplicate"]]

    report = {
        "total_records": len(records),
        "exact_duplicates": len(exact_duplicates),
        "normalized_duplicates": len(norm_duplicates),
        "source_duplicates_differing_target": len(source_duplicates),
        "target_duplicates_differing_source": len(target_duplicates),
        "near_duplicates": len(near_duplicates),
        "final_unique_records": len(unique_records),
        "exact_duplicate_details": exact_duplicates[:20],
        "near_duplicate_details": near_duplicates[:20]
    }

    return records, report
