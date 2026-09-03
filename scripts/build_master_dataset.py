"""
Master Dataset Builder for Hindi -> Santali (Ol Chiki).
Aggregates all corpus sources:
1. FLORES-200 (dev + devtest)
2. Existing 2,007 canonical dataset
3. Synthetic / Sangraha parallel expansions across multiple domains
Produces:
- translation_cache.json (for Android app phrase cache)
- master_dataset.csv (for 200M model fine-tuning)
"""

import os
import csv
import json
from unicodedata import normalize
from typing import Dict, List
from src.script_validator import validate_ol_chiki, validate_devanagari, normalize_text


def nfc(s: str) -> str:
    return normalize("NFC", s.strip())


# Additional domain vocabularies for synthetic multi-domain expansion
EXPANDED_DOMAINS = [
    # General & Governance
    ("यह सरकारी आदेश है।", "ᱱᱚᱣᱟ ᱫᱚ ᱥᱚᱨᱠᱟᱨᱤ ᱟᱫᱮᱥ ᱠᱟᱱᱟ।"),
    ("पंचायत भवन में बैठक है।", "ᱯᱚᱧᱪᱟᱭᱚᱛ ᱵᱷᱚᱵᱚᱱ ᱨᱮ ᱫᱩᱯᱲᱩᱵ ᱢᱮᱱᱟᱜ-ᱟ।"),
    ("गाँव के मुखिया से मिलिए।", "ᱟᱹᱛᱩ ᱨᱤᱱᱤᱡ ᱢᱟᱹᱧᱦᱤ ᱥᱟᱶ ᱧᱟᱯᱟᱢ ᱢᱮ।"),
    ("राशन कार्ड बनवाना जरूरी है।", "ᱨᱟᱥᱚᱱ ᱠᱟᱨᱰ ᱵᱮᱱᱟᱣ ᱞᱟᱹᱠᱛᱤ ᱠᱟᱱᱟ।"),
    ("सभी नागरिक बराबर हैं।", "ᱡᱚᱛᱚ ᱱᱟᱜᱟᱨᱤᱠ ᱥᱚᱢᱟᱱ ᱜᱮᱭᱟ ᱠᱚ।"),
    ("मतदान करना हमारा अधिकार है।", "ᱵᱷᱳᱴ ᱮᱢ ᱟᱵᱚᱣᱟᱜ ᱟᱹᱭᱫᱟᱹᱨᱤ ᱠᱟᱱᱟ।"),
    ("आधार कार्ड साथ रखिए।", "ᱟᱫᱷᱟᱨ ᱠᱟᱨᱰ ᱥᱟᱶᱛᱮ ᱫᱚᱦᱚᱭ ᱢᱮ।"),
    ("बैंक में खाता खुलवाना है।", "ᱵᱮᱸᱠ ᱨᱮ ᱠᱷᱟᱛᱟ ᱡᱷᱤᱡ ᱞᱟᱹᱠᱛᱤ ᱠᱟᱱᱟ।"),

    # Agriculture & Environment
    ("धान की बुवाई का समय आ गया है।", "ᱦᱩᱲᱩ ᱨᱚᱦᱚᱭ ᱚᱠᱛᱚ ᱥᱮᱴᱮᱨ ᱮᱱᱟ।"),
    ("खेत में खाद डालना जरूरी है।", "ᱠᱷᱮᱛ ᱨᱮ ᱥᱟᱨ ᱮᱨ ᱞᱟᱹᱠᱛᱤ ᱠᱟᱱᱟ।"),
    ("समय पर सिंचाई करने से फसल अच्छी होती है।", "ᱚᱠᱛᱚ ᱨᱮ ᱫᱟᱜ ᱮᱢ ᱞᱮᱠᱷᱟᱱ ᱯᱷᱚᱥᱚᱞ ᱱᱟᱯᱟᱭᱚᱜ-ᱟ।"),
    ("इस साल अच्छी बारिश हुई है।", "ᱱᱮᱥ ᱫᱚ ᱱᱟᱯᱟᱭ ᱫᱟᱜ ᱦᱩᱭ ᱟᱠᱟᱱᱟ।"),
    ("कीटों से फसल को बचाना चाहिए।", "ᱛᱤᱡᱩ-ᱛᱤᱨᱩ ᱠᱷᱚᱱ ᱯᱷᱚᱥᱚᱞ ᱵᱟᱧᱪᱟᱣ ᱞᱟᱹᱠᱛᱤ ᱠᱟᱱᱟ।"),
    ("जंगल हमारे पर्यावरण की रक्षा करते हैं।", "ᱵᱤᱨ ᱟᱵᱚᱣᱟᱜ ᱯᱚᱨᱤᱵᱮᱥ ᱮ ᱵᱟᱧᱪᱟᱣᱟ।"),
    ("नदी में गंदा पानी मत डालिए।", "ᱜᱟᱰᱟ ᱨᱮ ᱢᱟᱹᱭᱞᱟᱹ ᱫᱟᱜ ᱟᱞᱚᱯᱮ ᱫᱩᱞᱟ।"),
    ("तालाब का पानी साफ रखिए।", "ᱯᱩᱠᱷᱨᱤ ᱫᱟᱜ ᱯᱷᱟᱨᱪᱟ ᱫᱚᱦᱚᱭ ᱢᱮ।"),

    # Healthcare & Wellness
    ("बुखार आने पर डॉक्टर को दिखाइए।", "ᱨᱩᱣᱟᱹ ᱦᱮᱡ ᱞᱮᱱᱠᱷᱟᱱ ᱰᱟᱠᱛᱚᱨ ᱩᱫᱩᱜ-ᱮ ᱢᱮ।"),
    ("दवाई समय पर लेनी चाहिए।", "ᱨᱟᱱ ᱚᱠᱛᱚ ᱨᱮ ᱦᱟᱛᱟᱣ ᱞᱟᱹᱠᱛᱤ ᱠᱟᱱᱟ।"),
    ("उबला हुआ पानी पीना सुरक्षित है।", "ᱦᱮᱰᱮᱡ ᱫᱟᱜ ᱧᱩ ᱫᱚ ᱵᱷᱟᱹᱜᱤ ᱜᱮᱭᱟ।"),
    ("मच्छरदानी लगाकर सोना चाहिए।", "ᱴᱟᱺᱜᱤ ᱴᱟᱝᱜᱟᱣ ᱠᱟᱛᱮ ᱡᱟᱹᱯᱤᱫ ᱞᱟᱹᱠᱛᱤ ᱠᱟᱱᱟ।"),
    ("गर्भवती महिलाओं को पोषण युक्त भोजन देना चाहिए।", "ᱦᱚᱲᱢᱚ ᱨᱮ ᱜᱤᱫᱽᱨᱟᱹ ᱢᱮᱱᱟᱜ ᱟᱭᱳ ᱠᱚ ᱯᱩᱥᱴᱤ ᱡᱚᱢᱟᱜ ᱮᱢ ᱞᱟᱹᱠᱛᱤ ᱠᱟᱱᱟ।"),
    ("बच्चों को समय पर टीका लगवाएँ।", "ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ ᱚᱠᱛᱚ ᱨᱮ ᱴᱤᱠᱟᱹ ᱮᱢᱟ ᱠᱚ ᱢᱮ।"),
    ("साफ-सफाई से बीमारियाँ दूर रहती हैं।", "ᱯᱷᱟᱨᱪᱟ-ᱥᱟᱯᱷᱟ ᱛᱟᱦᱮᱸᱱ ᱞᱮᱠᱷᱟᱱ ᱨᱩᱣᱟᱹ-ᱦᱟᱹᱥᱩ ᱥᱟᱺᱜᱤᱧ ᱨᱮ ᱛᱟᱦᱮᱸᱱᱟ।"),
    ("ओआरएस का घोल डायरिया में फायदेमंद है।", "ᱳ.ᱟᱨ.ᱮᱥ. ᱫᱟᱜ ᱞᱟᱪᱷᱟ ᱨᱮ ᱟᱹᱰᱤ ᱱᱟᱯᱟᱭ ᱠᱟᱱᱟ।"),

    # Education & Youth
    ("किताबें ज्ञान का भंडार हैं।", "ᱯᱩᱛᱷᱤ ᱫᱚ ᱜᱮᱭᱟᱱ ᱨᱮᱭᱟᱜ ᱵᱷᱟᱱᱰᱟᱨ ᱠᱟᱱᱟ।"),
    ("लड़कियों की शिक्षा बहुत जरूरी है।", "ᱠᱩᱲᱤ ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚᱣᱟᱜ ᱥᱮᱪᱮᱫ ᱟᱹᱰᱤ ᱞᱟᱹᱠᱛᱤ ᱠᱟᱱᱟ।"),
    ("कंप्यूटर सीखना आज के युग में आवश्यक है।", "ᱠᱚᱢᱯᱤᱭᱩᱴᱟᱨ ᱪᱮᱫᱚᱜ ᱛᱮᱦᱮᱧᱟᱜ ᱡᱩᱜᱽ ᱨᱮ ᱞᱟᱹᱠᱛᱤ ᱠᱟᱱᱟ।"),
    ("पुस्तकालय में शांति बनाए रखें।", "ᱯᱩᱛᱷᱤ ᱚᱲᱟᱜ ᱨᱮ ᱱᱤᱨᱚᱲ ᱛᱟᱦᱮᱸᱱ ᱢᱮ।"),
    ("खेलकूद से शरीर स्वस्थ रहता है।", "ᱮᱱᱮᱡ-ᱥᱮᱨᱮᱧ ᱛᱮ ᱦᱚᱲᱢᱚ ᱱᱟᱯᱟᱭ ᱛᱟᱦᱮᱸᱱᱟ।"),
    ("प्रतिदिन नया सीखने का प्रयास करें।", "ᱫᱤᱱᱟᱹᱢ ᱜᱮ ᱱᱟᱣᱟ ᱪᱮᱫᱚᱜ ᱨᱮᱭᱟᱜ ᱠᱩᱨᱩᱢᱩᱴᱩᱭ ᱢᱮ।"),

    # Daily Commerce & Travel
    ("बस स्टैंड कितनी दूर है?", "ᱵᱟᱥ ᱥᱴᱮᱸᱰ ᱛᱤᱱᱟᱹᱜ ᱥᱟᱺᱜᱤᱧ?"),
    ("रेलगाड़ी समय पर आएगी।", "ᱨᱮᱞ ᱜᱟᱹᱰᱤ ᱚᱠᱛᱚ ᱨᱮ ᱦᱤᱡᱩᱜ-ᱟ।"),
    ("बाज़ार में ताज़ी सब्ज़ियाँ मिलती हैं।", "ᱦᱟᱴ ᱨᱮ ᱵᱮᱨᱮᱞ ᱩᱛᱩ ᱧᱟᱢᱚᱜ-ᱟ।"),
    ("चावल की कीमत क्या है?", "ᱪᱟᱣᱞᱮ ᱨᱮᱭᱟᱜ ᱫᱟᱢ ᱫᱚ ᱪᱮᱫ?"),
    ("मुझे एक किलो दाल चाहिए।", "ᱤᱧ ᱢᱤᱫ ᱠᱤᱞᱳ ᱫᱟᱹᱞ ᱫᱚᱨᱠᱟᱨ।"),
    ("दुकान शाम सात बजे बंद होगी।", "ᱫᱚᱠᱟᱱ ᱟᱹᱭᱩᱵ ᱮᱭᱟᱭ ᱴᱟᱲᱟᱝ ᱨᱮ ᱵᱚᱸᱫᱚᱜ-ᱟ।"),
    ("पैसे संभाल कर रखिए।", "ᱴᱟᱠᱟ-ᱯᱩᱭᱥᱟᱹ ᱡᱚᱛᱚᱱ ᱠᱟᱛᱮ ᱫᱚᱦᱚᱭ ᱢᱮ।"),
    ("सुरक्षित यात्रा करें।", "ᱱᱟᱯᱟᱭ ᱛᱮ ᱥᱮᱱᱚᱜ ᱢᱮ।")
]


def load_existing_dataset() -> Dict[str, str]:
    pairs = {}
    splits = ["train.jsonl", "validation.jsonl", "test.jsonl"]
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    for split in splits:
        path = os.path.join(base_dir, "data", "processed", split)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        item = json.loads(line)
                        pairs[nfc(item["hindi"])] = nfc(item["santali"])
    return pairs


def load_flores_pairs() -> Dict[str, str]:
    flores_path = os.path.join("data", "flores_pairs.json")
    if os.path.exists(flores_path):
        with open(flores_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def build_master_dataset():
    print("=" * 60)
    print("BUILDING MASTER HINDI -> SANTALI DATASET")
    print("=" * 60)

    master: Dict[str, str] = {}

    # 1. Existing verified dataset (2,007 pairs)
    existing = load_existing_dataset()
    for hi, sat in existing.items():
        master[nfc(hi)] = nfc(sat)
    print(f"Loaded existing dataset: {len(existing)} pairs")

    # 2. FLORES-200 pairs
    flores = load_flores_pairs()
    for hi, sat in flores.items():
        master[nfc(hi)] = nfc(sat)
    print(f"Loaded FLORES-200 dataset: {len(flores)} pairs")

    # 3. Expanded domain pairs
    for hi, sat in EXPANDED_DOMAINS:
        master[nfc(hi)] = nfc(sat)
    print(f"Loaded expanded multi-domain pairs: {len(EXPANDED_DOMAINS)} pairs")

    # Final cleanup & validation
    clean_master = {}
    for hi, sat in master.items():
        if hi and sat:
            v_sat = validate_ol_chiki(sat)
            v_hi = validate_devanagari(hi)
            if v_sat["is_valid"] and v_hi["is_valid"]:
                clean_master[nfc(hi)] = nfc(sat)

    print(f"\nFinal Master Dataset: {len(clean_master)} high-quality unique pairs")

    # Save translation_cache.json (both root and data/ for app & distribution)
    with open("translation_cache.json", "w", encoding="utf-8") as f:
        json.dump(clean_master, f, ensure_ascii=False, indent=2)
    with open(os.path.join("data", "translation_cache.json"), "w", encoding="utf-8") as f:
        json.dump(clean_master, f, ensure_ascii=False, indent=2)
    print("Saved: translation_cache.json")

    # Save master_dataset.csv (both root and data/ for training)
    with open("master_dataset.csv", "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["hindi", "santali"])
        writer.writeheader()
        for hi, sat in clean_master.items():
            writer.writerow({"hindi": hi, "santali": sat})
    with open(os.path.join("data", "master_dataset.csv"), "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["hindi", "santali"])
        writer.writeheader()
        for hi, sat in clean_master.items():
            writer.writerow({"hindi": hi, "santali": sat})
    print("Saved: master_dataset.csv")
    print("=" * 60)
    return clean_master


if __name__ == "__main__":
    build_master_dataset()
