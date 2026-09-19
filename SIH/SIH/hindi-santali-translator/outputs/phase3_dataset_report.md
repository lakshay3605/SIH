# Phase 3 Comprehensive Dataset Report: Hindi → Santali (`sat_Olck`) Parallel Training Corpus & Baseline Benchmark

**Document ID:** `PHASE3-DATASET-AUDIT`  
**Date:** September 1, 2026  
**Target Language Pair:** Hindi (`hin_Deva`) $\rightarrow$ Santali in Ol Chiki script (`sat_Olck`)  
**Objective:** Construct, clean, normalize, validate, deduplicate, score, split, and benchmark a high-quality parallel corpus for supervised fine-tuning.

---

## 1. Summary Metrics Table

| Metric | Value |
|:---|---:|
| **Raw Candidate Pairs** | **2,012** |
| **Valid Canonical Pairs** | **2,007** |
| **Rejected Pairs** | **5** |
| **Exact / Normalized Duplicates** | **0** |
| **Train Set (`train.jsonl` / 80%)** | **1,605** |
| **Validation Set (`validation.jsonl` / 10%)** | **200** |
| **Test Set (`test.jsonl` / 10%)** | **202** |
| **Ol Chiki-Valid Target Ratio** | **100.0%** |
| **Baseline Script Validity Rate** | **100.0%** |
| **Baseline Repetition Rate** | **0.0%** |
| **Baseline Pre-training BLEU-4** | **2.85** |
| **Baseline Pre-training chrF++** | **30.41** |
| **Baseline Foreign Contamination Rate** | **7.0%** |

---

## 2. Original Dataset Inventory & Sources

A comprehensive inventory was conducted across the workspace and local repositories (`outputs/dataset_inventory.json`):

| Dataset Source | File Format | Total Records | Parallel? | Contains Ol Chiki? | Primary Domain | Quality Assessment |
|:---|:---|:---:|:---:|:---:|:---|:---|
| **FLORES-200 Dev Set** | `.dev` (TXT) | 997 | **Yes** | **Yes** | Multi-domain (News, Culture, Science, Healthcare) | Professional human translation |
| **FLORES-200 Devtest Set**| `.devtest` (TXT) | 1,012 | **Yes** | **Yes** | Multi-domain (News, Governance, General) | Professional human translation |
| **Phase 2 Audit Set** | `.json` | 3 | **Yes** | **Yes** | Casual, Question, Agriculture | Verified & Benchmarked |
| **Santali Agri Q&A** | `.csv` | 506 | No (Monolingual) | **Yes** | Agriculture Q&A in Ol Chiki | Domain terminology reference |
| **Murmu Crawl Data** | `.json` | 1 | No (Raw crawl) | **Yes** | Web crawled Santali | Unaligned raw text |
| **JanAI Data / Chat** | `.csv` | 0 | No (Template) | No | Conversational / Healthcare | Empty placeholder schema |

**Total Raw Candidates Extracted for Processing:** **2,012 pairs**.

---

## 3. Canonical Schema & Domain Classification

All processed parallel sentence records adhere strictly to the canonical standard format:

```json
{
  "id": "flores_dev_00001",
  "source_lang": "hin_Deva",
  "target_lang": "sat_Olck",
  "source_text": "सोमवार को, स्टैनफ़ोर्ड यूनिवर्सिटी स्कूल ऑफ़ मेडिसिन के वैज्ञानिकों ने एक नए डायग्नोस्टिक टूल के आविष्कार की घोषणा की...",
  "target_text": "ᱚᱛᱮ ᱢᱟᱦᱟᱸ ᱦᱤᱞᱚᱜ, ᱥᱴᱟᱱᱯᱷᱚᱨᱰ ᱵᱤᱨᱫᱟᱹᱜᱟᱲ ᱟᱥᱲᱟ ᱨᱮᱭᱟᱜ ᱢᱮᱰᱤᱥᱤᱱ ᱨᱤᱱᱤᱡ ᱥᱟᱬᱮᱥᱤᱭᱟᱹ ᱠᱚ ᱢᱤᱫ ᱱᱟᱶᱟ ᱪᱤᱱᱦᱟᱹᱯ ᱦᱟᱹᱛᱭᱟᱹᱨ...",
  "domain": "education",
  "source": "FLORES-200 (dev)",
  "quality": "A",
  "quality_score": 1.0
}
```

### Domain Distribution Across Canonical Corpus:
- `general`: 1,489 pairs (74.2%)
- `education`: 239 pairs (11.9%)
- `government`: 92 pairs (4.6%)
- `healthcare`: 61 pairs (3.0%)
- `technology`: 49 pairs (2.4%)
- `emergency`: 37 pairs (1.8%)
- `finance`: 25 pairs (1.2%)
- `conversation`: 11 pairs (0.5%)
- `agriculture`: 3 pairs (0.15%)
- `rural`: 1 pair (0.05%)

---

## 4. Language & Script Validation Layer

Each sentence was parsed at the Unicode codepoint level:
- **Hindi (`hin_Deva`):** Strictly validates Devanagari range `U+0900`–`U+097F`, allowed punctuation, Indic Danda (`।`), and ASCII digits.
- **Santali (`sat_Olck`):** Reuses the Phase 2 `validate_ol_chiki()` layer enforcing Unicode range `U+1C50`–`U+1C7F`.

### Rejection Audit (`outputs/rejected_dataset.jsonl`):
**5 records were rejected** due to untransliterated foreign script spans:
1. `flores_dev_00143`: Source contained untransliterated Latin `NBA` and `covid-19`. (Devanagari ratio: 0.84)
2. `flores_dev_00148`: Source contained Latin brand names `Yahoo!`, `Microsoft`, and `AOL`. (Devanagari ratio: 0.79)
3. `flores_dev_00728`: Source contained Spanish name `Callejon del Beso`. (Devanagari ratio: 0.84)
4. `flores_devtest_00172`: Source contained Latin brand names `TogiNet` and `AstroNet`. (Devanagari ratio: 0.77)
5. `flores_devtest_00978`: Source contained Latin grammatical tokens `r`, `rr`, `caro`, and `carro`. (Devanagari ratio: 0.82)

Every rejection was logged with explicit technical reasons without silent record loss.

---

## 5. Deterministic Text Normalization

Normalization implemented in `src/dataset/normalizer.py`:
- Applied Unicode NFKC normalization.
- Stripped zero-width spaces (`\u200b`, `\ufeff`, `\u00ad`, `\u2060`) while preserving Indic ligatures (ZWJ/ZWNJ).
- Stripped non-printable ASCII control characters.
- Normalized smart quotation marks (`“`, `”`, `‘`, `’`) and dashes (`–`, `—`).
- Collapsed redundant repeated punctuation and standardized spacing.

All raw and processed files remain strictly separated in `data/raw/` and `data/processed/`.

---

## 6. Deduplication & Near-Duplicate Analysis

Executed SHA-256 exact matching and character 3-gram Jaccard similarity analysis (`outputs/deduplication_report.json`):
- **Exact Duplicates:** 0
- **Normalized Duplicates:** 0
- **Source Duplicates with Differing Targets:** 0
- **Target Duplicates with Differing Sources:** 0
- **Near-Duplicate Pairs ($Sim \ge 0.88$):** 0
- **Final Clean Unique Parallel Records:** **2,007 pairs**.

---

## 7. Quality Scoring & Alignment Analysis

Calculated multi-factor quality score ($0.0 - 1.0$) across script validity, length plausibility, cleanliness, and length ratio ($Len_{tgt} / Len_{src}$):

```
┌─────────────────────────────────────────────────────────────┐
│                 QUALITY BUCKET DISTRIBUTION                 │
├─────────────────┬─────────────────┬───────────┬─────────────┤
│ Bucket A (High) │ Bucket B (Good) │ Bucket C  │ Bucket D    │
│ Score >= 0.85   │ 0.70 - 0.84     │ 0.50-0.69 │ Reject <0.5 │
│   2,007 (100%)  │     0 (0%)      │   0 (0%)  │   0 (0%)    │
└─────────────────┴─────────────────┴───────────┴─────────────┘
```

### Length & Alignment Statistics (`outputs/alignment_analysis.json`):
- **Hindi Source Length:** Mean = **127.73 characters** ($\sigma = 62.42$, range: 17 to 484 chars).
- **Santali Target Length:** Mean = **135.74 characters** ($\sigma = 65.55$, range: 17 to 506 chars).
- **Length Ratio ($Len_{tgt}/Len_{src}$):** Mean = **1.08**, Median = **1.05**.
- **Suspicious Alignment Outliers ($Ratio < 0.25$ or $> 3.5$):** **0** (All 2,007 pairs fall within normal translation length boundaries).

---

## 8. Leakage-Free Dataset Split

To prevent test set contamination, data was split using source sentence hashing with fixed seed `42` (`outputs/split_report.json`):

- **Training Set (`train.jsonl`):** **1,605 pairs (80.0%)**
- **Validation Set (`validation.jsonl`):** **200 pairs (10.0%)**
- **Test Set (`test.jsonl`):** **202 pairs (10.0%)**

### Strict Zero-Leakage Verification:
- $\text{Train} \cap \text{Validation}$ Overlap: **0 records**
- $\text{Train} \cap \text{Test}$ Overlap: **0 records**
- $\text{Validation} \cap \text{Test}$ Overlap: **0 records**

---

## 9. Test Set Domain Coverage & Identified Gaps

The test split (202 pairs) covers the following domains:
- **General News / Culture:** 149 examples (Available)
- **Education / Science:** 26 examples (Available)
- **Governance & Legal:** 9 examples (Available)
- **Healthcare & Medicine:** 6 examples (Available)
- **Technology & Media:** 5 examples (Available)
- **Emergency & Natural Events:** 4 examples (Available)
- **Finance & Economics:** 3 examples (Available)
- **Conversational Hindi:** 1 example (Identified Gap: Low volume in FLORES)
- **Rural Life & Agriculture:** 1 example (Identified Gap: Low volume in general corpus)

> [!NOTE]
> Per project guidelines, no artificial translations were fabricated to pad underrepresented domains.

---

## 10. Fixed Evaluation Benchmark & Baseline Model Performance

A fixed benchmark evaluation set of **100 high-quality sentences** was locked in `data/evaluation/baseline_eval.jsonl`.

The pre-training baseline IndicTrans2 1B model was evaluated with `repetition_penalty=1.2` (`outputs/pretraining_baseline_results.json`):

| Evaluation Metric | Baseline Value | Interpretation |
|:---|:---:|:---|
| **Evaluated Sentences** | **100** | Fixed pre-training evaluation set |
| **Corpus BLEU-4** | **2.85** | Low baseline lexical overlap with human reference |
| **Corpus chrF++** | **30.41** | Character-level n-gram match baseline |
| **Ol Chiki Script Validity** | **100.0%** | All generated predictions pass Ol Chiki block rules |
| **Foreign-Script Contamination** | **7.0%** | Residual Urdu (`پوائنٹس`) & Meitei (`ꯂꯨꯆꯤꯡꯕ`) leakage |
| **Catastrophic Repetition Rate** | **0.0%** | `repetition_penalty=1.2` completely prevented loops |
| **Empty Output Rate** | **0.0%** | All inputs produced non-empty translations |
| **Inference Latency (CPU)** | **3.16s / sent** | Batched CPU inference throughput |

---

## 11. Major Dataset Weaknesses & Technical Risks

1. **Overall Dataset Scale (2,007 pairs):**
   - While 2,007 pairs provide a solid high-quality foundation for Parameter-Efficient Fine-Tuning (LoRA / QLoRA), full-parameter fine-tuning of a 1-Billion parameter model on only 2,000 pairs risks severe overfitting.
2. **Domain Skew towards Formal/News Prose:**
   - FLORES-200 is heavily weighted towards formal news, science, and governance. Rural conversational and agricultural colloquial speech are underrepresented.
3. **Foreign Script Leakage in Base Model:**
   - Baseline IndicTrans2 exhibits a 7.0% cross-lingual contamination rate on out-of-domain terms.

---

## 12. Recommended Supervised Fine-Tuning Strategy

1. **Parameter-Efficient Fine-Tuning (LoRA):**
   - Apply Low-Rank Adaptation (LoRA) targeting attention projection layers (`q_proj`, `v_proj`) with rank $r=16$ or $r=32$.
   - Prevents catastrophic forgetting of the multilingual backbone while aligning the output head strictly to Ol Chiki vocabulary.
2. **Loss Masking on Foreign Token Logits:**
   - Penalize generation of non-Ol Chiki tokens during training loss computation.
3. **Domain Augmentation via Agricultural QA:**
   - Leverage the 506 Santali Agricultural Q&A pairs (`data/raw/agriculture/`) for monolingual domain adaptation.

---
*End of Phase 3 Dataset Construction & Audit Report.*
