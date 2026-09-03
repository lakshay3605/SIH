"""
Extract Hindi-Santali (Ol Chiki) parallel sentence pairs from FLORES-200.
Downloads directly from Meta AI Research NLLB FLORES-200 open release:
https://dl.fbaipublicfiles.com/nllb/flores200_dataset.tar.gz
"""

import os
import tarfile
import json
import urllib.request
from unicodedata import normalize
from src.script_validator import validate_ol_chiki, validate_devanagari


FLORES_TAR_URL = "https://dl.fbaipublicfiles.com/nllb/flores200_dataset.tar.gz"


def nfc(text: str) -> str:
    return normalize("NFC", text.strip())


def extract_flores_from_tar(tar_path: str = "flores200_dataset.tar.gz", output_file: str = "data/flores_pairs.json") -> dict:
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    pairs = {}

    if not os.path.exists(tar_path):
        print(f"Downloading FLORES-200 dataset from {FLORES_TAR_URL}...")
        urllib.request.urlretrieve(FLORES_TAR_URL, tar_path)
        print("Download complete.")

    print(f"Reading FLORES-200 archive: {tar_path}...")
    with tarfile.open(tar_path, "r:gz") as tar:
        for split in ["dev", "devtest"]:
            hi_member_name = None
            sat_member_name = None

            for m in tar.getmembers():
                if f"/{split}/hin_Deva.{split}" in m.name or m.name.endswith(f"hin_Deva.{split}"):
                    hi_member_name = m
                if f"/{split}/sat_Olck.{split}" in m.name or m.name.endswith(f"sat_Olck.{split}"):
                    sat_member_name = m

            if hi_member_name and sat_member_name:
                hi_f = tar.extractfile(hi_member_name)
                sat_f = tar.extractfile(sat_member_name)

                hi_lines = [nfc(line.decode("utf-8")) for line in hi_f.readlines()]
                sat_lines = [nfc(line.decode("utf-8")) for line in sat_f.readlines()]

                count = 0
                for hi_text, sat_text in zip(hi_lines, sat_lines):
                    if hi_text and sat_text:
                        v_sat = validate_ol_chiki(sat_text)
                        v_hi = validate_devanagari(hi_text)
                        if v_sat["is_valid"] and v_hi["is_valid"]:
                            pairs[hi_text] = sat_text
                            count += 1

                print(f"Extracted {count} valid pairs from '{split}'.")

    print(f"Total FLORES-200 extracted pairs: {len(pairs)}")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(pairs, f, ensure_ascii=False, indent=2)
    print(f"Saved to {output_file}")
    return pairs


if __name__ == "__main__":
    extract_flores_from_tar()
