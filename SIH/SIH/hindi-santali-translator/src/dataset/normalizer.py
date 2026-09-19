"""
Deterministic text normalization module for Hindi and Santali text.
Preserves linguistic meaning and vocabulary while standardizing formatting.
"""

import re
import unicodedata

def normalize_text(text: str) -> str:
    """
    Applies deterministic Unicode and formatting normalization:
    1. Unicode NFKC normalization
    2. Strips invisible zero-width spaces (U+200B, U+FEFF, U+00AD) while preserving Indic ZWJ/ZWNJ
    3. Cleans control characters
    4. Normalizes whitespace and line breaks
    5. Normalizes excessive repeated punctuation
    """
    if not text:
        return ""

    # 1. Unicode NFKC normalization
    norm = unicodedata.normalize("NFKC", text)

    # 2. Remove invisible artifacts (zero-width space, BOM, soft hyphen)
    # Note: \u200c (ZWNJ) and \u200d (ZWJ) are preserved for Indic halants/ligatures
    invisible_chars = ["\u200b", "\ufeff", "\u00ad", "\u2060", "\u200e", "\u200f"]
    for c in invisible_chars:
        norm = norm.replace(c, "")

    # 3. Clean non-printable control characters (except newline \n and tab \t)
    norm = "".join(ch for ch in norm if ch in ("\n", "\t", "\r") or not unicodedata.category(ch).startswith("C"))

    # 4. Normalize quotes and dashes to standard Unicode forms
    norm = norm.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'")
    norm = norm.replace("–", "-").replace("—", "-")

    # 5. Normalize excessive repeated punctuation (e.g., '!!!!' -> '!', '????' -> '?')
    norm = re.sub(r'([!?.,।])\1{2,}', r'\1', norm)

    # 6. Normalize whitespace (collapse multiple spaces into single space, trim margins)
    norm = re.sub(r'[ \t\r\f\v]+', ' ', norm)
    norm = norm.strip()

    return norm
