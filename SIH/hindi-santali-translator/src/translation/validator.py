"""
Ol Chiki Script Validation & Analysis Utility.
Validates whether generated Santali text adheres strictly to the Ol Chiki Unicode standard (U+1C50-U+1C7F).
NOTE: Script-level validation proves Unicode conformance, NOT semantic or native linguistic correctness.
"""
import re
import unicodedata
from typing import Dict, Any, List, Tuple

# Ol Chiki Unicode block: U+1C50 to U+1C7F
OL_CHIKI_START = 0x1C50
OL_CHIKI_END = 0x1C7F

# Allowed punctuation and spacing characters
ALLOWED_PUNCTUATION = set(" \t\n\r.,!?-:;()[]{}'\"/\\@#$%^&*~`|+=_<>।॥")


def is_ol_chiki(char: str) -> bool:
    """Checks if a single character belongs to the Ol Chiki Unicode block."""
    code = ord(char)
    return OL_CHIKI_START <= code <= OL_CHIKI_END


def is_allowed_char(char: str) -> bool:
    """
    Checks if a character is valid for Santali Ol Chiki text:
    - In Ol Chiki Unicode range (U+1C50 - U+1C7F)
    - Standard ASCII / Indic punctuation
    - Whitespace
    - ASCII digits (0-9)
    """
    if is_ol_chiki(char):
        return True
    if char in ALLOWED_PUNCTUATION:
        return True
    if char.isdigit():  # Allows ASCII digits
        return True
    return False


def detect_script_name(char: str) -> str:
    """Returns the name of the script or character category for diagnostics."""
    try:
        name = unicodedata.name(char)
        if "ARABIC" in name:
            return "Arabic/Urdu"
        elif "MEETEI" in name:
            return "Meitei Mayek"
        elif "DEVANAGARI" in name:
            return "Devanagari"
        elif "BENGALI" in name:
            return "Bengali"
        elif "ORIYA" in name or "ODIA" in name:
            return "Odia"
        elif "LATIN" in name:
            return "Latin/English"
        return name.split()[0]
    except ValueError:
        return "Unknown"


def validate_ol_chiki(text: str) -> Dict[str, Any]:
    """
    Validates every character in generated Santali text.
    
    Returns structured analysis:
    {
        "valid": bool,
        "invalid_characters": list of unique invalid chars,
        "invalid_spans": list of span dicts with offsets, text, and detected script,
        "ol_chiki_ratio": float (0.0 to 1.0),
        "raw_text": original unaltered text,
        "cleaned_candidate": text with invalid spans flagged/removed separately,
        "disclaimer": "Unicode validation confirms script conformance only; not linguistic correctness."
    }
    """
    if not text:
        return {
            "valid": True,
            "invalid_characters": [],
            "invalid_spans": [],
            "ol_chiki_ratio": 1.0,
            "raw_text": text,
            "cleaned_candidate": text,
            "disclaimer": "Unicode validation confirms script conformance only; not linguistic correctness."
        }

    invalid_chars = []
    invalid_spans = []
    
    total_letters = 0
    ol_chiki_letters = 0
    
    current_span_chars = []
    span_start = -1
    
    for idx, char in enumerate(text):
        is_letter = unicodedata.category(char).startswith("L") or is_ol_chiki(char)
        if is_letter:
            total_letters += 1
            if is_ol_chiki(char):
                ol_chiki_letters += 1

        if not is_allowed_char(char):
            if char not in invalid_chars:
                invalid_chars.append(char)
            if span_start == -1:
                span_start = idx
            current_span_chars.append(char)
        else:
            if span_start != -1:
                span_text = "".join(current_span_chars)
                scripts = list(set(detect_script_name(c) for c in current_span_chars))
                invalid_spans.append({
                    "start": span_start,
                    "end": idx,
                    "text": span_text,
                    "script": ", ".join(scripts)
                })
                span_start = -1
                current_span_chars = []
                
    # Close pending span at end of text
    if span_start != -1:
        span_text = "".join(current_span_chars)
        scripts = list(set(detect_script_name(c) for c in current_span_chars))
        invalid_spans.append({
            "start": span_start,
            "end": len(text),
            "text": span_text,
            "script": ", ".join(scripts)
        })

    ol_chiki_ratio = (ol_chiki_letters / total_letters) if total_letters > 0 else 1.0
    is_valid = len(invalid_chars) == 0

    # Build cleaned candidate without destroying raw text
    cleaned_candidate = text
    for span in reversed(invalid_spans):
        start, end = span["start"], span["end"]
        cleaned_candidate = cleaned_candidate[:start] + f"[{span['text']}]" + cleaned_candidate[end:]
    
    # Remove extra spaces
    cleaned_candidate = re.sub(r"\s+", " ", cleaned_candidate).strip()

    return {
        "valid": is_valid,
        "invalid_characters": invalid_chars,
        "invalid_spans": invalid_spans,
        "ol_chiki_ratio": round(ol_chiki_ratio, 4),
        "raw_text": text,
        "cleaned_candidate": cleaned_candidate,
        "disclaimer": "Unicode validation confirms script conformance only; not linguistic correctness."
    }
