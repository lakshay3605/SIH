"""
Script Validator for Hindi (Devanagari) and Santali (Ol Chiki).
Validates Unicode ranges, detects foreign-script contamination, and normalizes text.
"""

import re
import unicodedata

# Unicode block ranges:
# Ol Chiki: U+1C50 to U+1C7F
OL_CHIKI_START = 0x1C50
OL_CHIKI_END = 0x1C7F

# Devanagari: U+0900 to U+097F
DEVANAGARI_START = 0x0900
DEVANAGARI_END = 0x097F

# Common punctuation and spaces allowed in all texts
COMMON_PUNCTUATION_AND_SPACE = set(" \t\n\r.,!?;:\"'()[]{}«»—-।॥%&/-0123456789")


def normalize_text(text: str) -> str:
    """Normalize unicode (NFC) and clean excessive whitespace."""
    if not text:
        return ""
    text = unicodedata.normalize("NFC", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def is_ol_chiki_char(char: str) -> bool:
    """Check if a character falls within the Ol Chiki Unicode block."""
    code = ord(char)
    return OL_CHIKI_START <= code <= OL_CHIKI_END


def is_devanagari_char(char: str) -> bool:
    """Check if a character falls within the Devanagari Unicode block."""
    code = ord(char)
    return DEVANAGARI_START <= code <= DEVANAGARI_END


def validate_ol_chiki(text: str) -> dict:
    """
    Validate Santali Ol Chiki text.
    Returns:
        is_valid: bool
        ol_chiki_char_count: int
        total_letters: int
        validity_ratio: float (0.0 to 1.0)
        foreign_chars: list of unique non-Ol Chiki alphabetic characters found
        has_foreign_contamination: bool
    """
    cleaned = normalize_text(text)
    if not cleaned:
        return {
            "is_valid": False,
            "ol_chiki_char_count": 0,
            "total_letters": 0,
            "validity_ratio": 0.0,
            "foreign_chars": [],
            "has_foreign_contamination": False
        }

    ol_chiki_chars = 0
    foreign_chars = []
    total_letters = 0

    for char in cleaned:
        if is_ol_chiki_char(char):
            ol_chiki_chars += 1
            total_letters += 1
        elif char in COMMON_PUNCTUATION_AND_SPACE or not char.isalnum():
            continue
        else:
            total_letters += 1
            foreign_chars.append(char)

    validity_ratio = (ol_chiki_chars / total_letters) if total_letters > 0 else 0.0
    has_foreign_contamination = len(foreign_chars) > 0

    return {
        "is_valid": validity_ratio >= 0.90 and ol_chiki_chars > 0,
        "ol_chiki_char_count": ol_chiki_chars,
        "total_letters": total_letters,
        "validity_ratio": round(validity_ratio, 4),
        "foreign_chars": list(set(foreign_chars)),
        "has_foreign_contamination": has_foreign_contamination
    }


def validate_devanagari(text: str) -> dict:
    """Validate Hindi Devanagari text."""
    cleaned = normalize_text(text)
    if not cleaned:
        return {
            "is_valid": False,
            "devanagari_char_count": 0,
            "total_letters": 0,
            "validity_ratio": 0.0,
            "foreign_chars": [],
            "has_foreign_contamination": False
        }

    devanagari_chars = 0
    foreign_chars = []
    total_letters = 0

    for char in cleaned:
        if is_devanagari_char(char):
            devanagari_chars += 1
            total_letters += 1
        elif char in COMMON_PUNCTUATION_AND_SPACE or not char.isalnum():
            continue
        else:
            total_letters += 1
            foreign_chars.append(char)

    validity_ratio = (devanagari_chars / total_letters) if total_letters > 0 else 0.0
    return {
        "is_valid": validity_ratio >= 0.85 and devanagari_chars > 0,
        "devanagari_char_count": devanagari_chars,
        "total_letters": total_letters,
        "validity_ratio": round(validity_ratio, 4),
        "foreign_chars": list(set(foreign_chars)),
        "has_foreign_contamination": len(foreign_chars) > 0
    }


# Phonetic Devanagari to Ol Chiki mapping table
DEV_TO_OL_CHIKI = {
    # Independent Vowels
    'अ': 'ᱚ', 'आ': 'ᱟ', 'इ': 'ᱤ', 'ई': 'ᱤ', 'उ': 'ᱩ', 'ऊ': 'ᱩ',
    'ए': 'ᱮ', 'ऐ': 'ᱮ', 'ओ': 'ᱳ', 'औ': 'ᱳ', 'ऋ': 'ᱨᱤ',
    # Dependent Vowel Signs (Matras)
    'ा': 'ᱟ', 'ि': 'ᱤ', 'ी': 'ᱤ', 'ु': 'ᱩ', 'ू': 'ᱩ',
    'े': 'ᱮ', 'ै': 'ᱮ', 'ो': 'ᱳ', 'ौ': 'ᱳ', 'ृ': 'ᱨᱤ',
    # Consonants
    'क': 'ᱠ', 'ख': 'ᱠᱷ', 'ग': 'ᱜ', 'घ': 'ᱜᱷ', 'ङ': 'ᱝ',
    'च': 'ᱪ', 'छ': 'ᱪᱷ', 'ज': 'ᱡ', 'झ': 'ᱡᱷ', 'ञ': 'ᱧ',
    'ट': 'ᱴ', 'ठ': 'ᱴᱷ', 'ड': 'ᱰ', 'ढ': 'ᱰᱷ', 'ण': 'ᱬ',
    'त': 'ᱛ', 'थ': 'ᱛᱷ', 'द': 'ᱫ', 'ध': 'ᱫᱷ', 'न': 'ᱱ',
    'प': 'ᱯ', 'फ': 'ᱯᱷ', 'ब': 'ᱵ', 'भ': 'ᱵᱷ', 'म': 'ᱢ',
    'य': 'ᱭ', 'र': 'ᱨ', 'ल': 'ᱞ', 'व': 'ᱣ', 'श': 'ᱥ',
    'ष': 'ᱥ', 'स': 'ᱥ', 'ह': 'ᱦ', 'ड़': 'ᱲ', 'ढ़': 'ᱲᱷ',
    # Diacritics & Modifiers
    'ं': 'ᱝ', 'ँ': 'ᱶ', 'ः': 'ᱷ', '्': '',
    # Digits
    '०': '᱐', '१': '᱑', '२': '᱒', '३': '᱓', '४': '᱔',
    '५': '᱕', '६': '᱖', '७': '᱗', '८': '᱘', '९': '᱙',
    '0': '᱐', '1': '᱑', '2': '᱒', '3': '᱓', '4': '᱔',
    '5': '᱕', '6': '᱖', '7': '᱗', '8': '᱘', '9': '᱙',
    '।': '।', '॥': '॥'
}


def transliterate_devanagari_to_ol_chiki(text: str) -> str:
    """
    Phonetically transliterates Devanagari text into canonical Ol Chiki script.
    Ensures zero foreign character contamination for out-of-vocabulary terms.
    """
    if not text:
        return ""
    result = []
    i = 0
    while i < len(text):
        char = text[i]
        if char in DEV_TO_OL_CHIKI:
            result.append(DEV_TO_OL_CHIKI[char])
        elif is_ol_chiki_char(char) or char in COMMON_PUNCTUATION_AND_SPACE:
            result.append(char)
        else:
            # Drop or preserve ASCII punctuation
            result.append(char if char in " .,!?:;-()[]{}" else "")
        i += 1
    return "".join(result)

