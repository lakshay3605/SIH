"""
Dataset script validation module for Hindi (hin_Deva) and Santali (sat_Olck).
Enforces Unicode script integrity and detects foreign script contamination.
"""

import re
import unicodedata
from typing import Dict, Any, List, Tuple

# Ol Chiki Unicode Block: U+1C50 to U+1C7F
OL_CHIKI_MIN = 0x1C50
OL_CHIKI_MAX = 0x1C7F

# Devanagari Unicode Block: U+0900 to U+097F
DEVANAGARI_MIN = 0x0900
DEVANAGARI_MAX = 0x097F

# Allowed punctuation and symbols for Indic text
ALLOWED_PUNCTUATION = set(" ,.-–—!?:;\"'()[]{}<>/\\|@#$%^&*~`_+=।॥°…·—‘’“”«»‹›0123456789\n\r\t")

def is_ol_chiki(char: str) -> bool:
    """Checks if a character belongs to the Ol Chiki Unicode block."""
    if len(char) != 1:
        return False
    return OL_CHIKI_MIN <= ord(char) <= OL_CHIKI_MAX

def is_devanagari(char: str) -> bool:
    """Checks if a character belongs to the Devanagari Unicode block."""
    if len(char) != 1:
        return False
    return DEVANAGARI_MIN <= ord(char) <= DEVANAGARI_MAX

def get_script_name(char: str) -> str:
    """Identifies the script family of a character."""
    code = ord(char)
    if DEVANAGARI_MIN <= code <= DEVANAGARI_MAX:
        return "Devanagari (Hindi/Sanskrit)"
    if OL_CHIKI_MIN <= code <= OL_CHIKI_MAX:
        return "Ol Chiki (Santali)"
    if 0x0600 <= code <= 0x06FF or 0x0750 <= code <= 0x077F or 0xFB50 <= code <= 0xFDFF:
        return "Arabic/Urdu"
    if 0xABC0 <= code <= 0xABFF:
        return "Meitei Mayek"
    if 0x0980 <= code <= 0x09FF:
        return "Bengali"
    if 0x0A80 <= code <= 0x0AFF:
        return "Gujarati"
    if 0x0B00 <= code <= 0x0B7F:
        return "Odia"
    if 0x0041 <= code <= 0x005A or 0x0061 <= code <= 0x007A:
        return "Latin"
    return unicodedata.name(char, "UNKNOWN")

def validate_devanagari_source(text: str) -> Dict[str, Any]:
    """
    Validates that source text conforms to Hindi Devanagari script.
    """
    if not text or not text.strip():
        return {
            "valid": False,
            "script_ratio": 0.0,
            "invalid_characters": [],
            "invalid_spans": [],
            "rejection_reason": "Empty or whitespace-only source text"
        }
    
    total_letters = 0
    deva_letters = 0
    invalid_chars = []
    invalid_spans = []
    current_span = None

    for i, char in enumerate(text):
        if char in ALLOWED_PUNCTUATION:
            if current_span:
                invalid_spans.append(current_span)
                current_span = None
            continue

        if is_devanagari(char):
            total_letters += 1
            deva_letters += 1
            if current_span:
                invalid_spans.append(current_span)
                current_span = None
        else:
            total_letters += 1
            invalid_chars.append(char)
            script = get_script_name(char)
            if current_span is None:
                current_span = {
                    "span": char,
                    "start": i,
                    "end": i + 1,
                    "detected_script": script
                }
            else:
                current_span["span"] += char
                current_span["end"] = i + 1

    if current_span:
        invalid_spans.append(current_span)

    script_ratio = (deva_letters / total_letters) if total_letters > 0 else 0.0
    valid = (script_ratio >= 0.70) and (len(invalid_spans) == 0 or script_ratio >= 0.85)

    return {
        "valid": valid,
        "script_ratio": round(script_ratio, 4),
        "total_letters": total_letters,
        "devanagari_letters": deva_letters,
        "invalid_characters": list(set(invalid_chars)),
        "invalid_spans": invalid_spans
    }

def validate_ol_chiki_target(text: str) -> Dict[str, Any]:
    """
    Validates that target text conforms to Santali Ol Chiki script.
    """
    if not text or not text.strip():
        return {
            "valid": False,
            "ol_chiki_ratio": 0.0,
            "invalid_characters": [],
            "invalid_spans": [],
            "rejection_reason": "Empty or whitespace-only target text"
        }

    total_letters = 0
    ol_chiki_letters = 0
    invalid_chars = []
    invalid_spans = []
    current_span = None

    for i, char in enumerate(text):
        if char in ALLOWED_PUNCTUATION:
            if current_span:
                invalid_spans.append(current_span)
                current_span = None
            continue

        if is_ol_chiki(char):
            total_letters += 1
            ol_chiki_letters += 1
            if current_span:
                invalid_spans.append(current_span)
                current_span = None
        else:
            total_letters += 1
            invalid_chars.append(char)
            script = get_script_name(char)
            if current_span is None:
                current_span = {
                    "span": char,
                    "start": i,
                    "end": i + 1,
                    "detected_script": script
                }
            else:
                current_span["span"] += char
                current_span["end"] = i + 1

    if current_span:
        invalid_spans.append(current_span)

    ol_chiki_ratio = (ol_chiki_letters / total_letters) if total_letters > 0 else 0.0
    valid = (ol_chiki_ratio >= 0.70) and (len(invalid_spans) == 0 or ol_chiki_ratio >= 0.85)

    return {
        "valid": valid,
        "ol_chiki_ratio": round(ol_chiki_ratio, 4),
        "total_letters": total_letters,
        "ol_chiki_letters": ol_chiki_letters,
        "invalid_characters": list(set(invalid_chars)),
        "invalid_spans": invalid_spans
    }

def validate_parallel_pair(source_text: str, target_text: str) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Validates a parallel pair (Hindi source, Santali target).
    Returns (is_valid, rejection_reason, metrics_dict).
    """
    if not source_text or not source_text.strip():
        return False, "Empty source text", {}
    if not target_text or not target_text.strip():
        return False, "Empty target text", {}

    s_clean = source_text.strip()
    t_clean = target_text.strip()

    # Extremely short fragments
    if len(s_clean) < 2:
        return False, f"Source text is an extremely short fragment ({len(s_clean)} chars)", {}
    if len(t_clean) < 2:
        return False, f"Target text is an extremely short fragment ({len(t_clean)} chars)", {}

    # Identical source and target
    if s_clean == t_clean:
        return False, "Source and target texts are identical (untranslated)", {}

    # HTML / Code / URL detection
    html_pattern = re.compile(r'<[a-zA-Z\/][^>]*>')
    if html_pattern.search(s_clean) or html_pattern.search(t_clean):
        return False, "Contains raw HTML tags", {}

    url_pattern = re.compile(r'https?://[^\s]+|www\.[^\s]+')
    if url_pattern.search(s_clean) or url_pattern.search(t_clean):
        return False, "Contains raw URLs", {}

    # Corrupted Unicode replacement character U+FFFD
    if "\ufffd" in s_clean or "\ufffd" in t_clean:
        return False, "Corrupted Unicode replacement characters (U+FFFD)", {}

    src_val = validate_devanagari_source(s_clean)
    tgt_val = validate_ol_chiki_target(t_clean)

    if not src_val["valid"]:
        reason = f"Low Hindi Devanagari ratio ({src_val['script_ratio']:.2f})"
        if src_val["invalid_spans"]:
            reason += f" with foreign spans: {[s['detected_script'] for s in src_val['invalid_spans']]}"
        return False, reason, {"source_val": src_val, "target_val": tgt_val}

    if not tgt_val["valid"]:
        reason = f"Low Santali Ol Chiki ratio ({tgt_val['ol_chiki_ratio']:.2f})"
        if tgt_val["invalid_spans"]:
            reason += f" with foreign spans: {[s['detected_script'] for s in tgt_val['invalid_spans']]}"
        return False, reason, {"source_val": src_val, "target_val": tgt_val}

    metrics = {
        "source_script_ratio": src_val["script_ratio"],
        "target_ol_chiki_ratio": tgt_val["ol_chiki_ratio"],
        "invalid_source_chars": src_val["invalid_characters"],
        "invalid_target_chars": tgt_val["invalid_characters"],
        "source_len": len(s_clean),
        "target_len": len(t_clean)
    }

    return True, "", metrics
