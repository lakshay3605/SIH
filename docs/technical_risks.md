# Aadivaani — Technical Risks & Mitigation Matrix

**Document**: `docs/technical_risks.md`  
**Version**: 1.0 (Phase 0 Deliverable)  
**Scope**: Identification of architectural, algorithmic, hardware, and linguistic failure modes.

---

## 1. Risk Matrix Overview

| Risk ID | Category | Description | Likelihood | Impact | Severity | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TR-01** | Memory | Android Low Memory Killer (LMK) crash on 2GB RAM devices | High | Critical | **P0** | Enforce sequential encoder/decoder session lifecycle; dynamic INT8 quantization; strict heap ceiling < 400 MB. |
| **TR-02** | Latency | Autoregressive decoding exceeding 2.0s target on low-end ARM | High | High | **P0** | Implement Past-Key-Value (KV-cache) ONNX export; greedy decoding; dual-tier phrase cache for common phrases. |
| **TR-03** | Data | Total absence of parallel training data for Ho and Mundari | High | Critical | **P0** | Multi-source mining (Bible corpora, ILCI, CFILT); synthetic back-translation using cross-lingual Munda transfer; community lexical tables. |
| **TR-04** | Model | IndicTrans2 lack of native Ho / Mundari token embeddings | High | High | **P1** | Add new script tokens to SentencePiece model; initialize new token embeddings with Santali/Devanagari phoneme counterparts; continuous fine-tuning. |
| **TR-05** | Packaging | App size exceeding store / sideload limits with offline assets | Medium | Medium | **P1** | Compress models with ONNX weight-only quantization; separate model pack sideload or modular on-demand feature pack. |
| **TR-06** | Speech | Native Android TTS unusable for Ol Chiki & Warang Chiti | Critical | High | **P1** | Replace built-in Android TTS with lightweight native tribal phoneme engine or compact acoustic model (Piper/VITS INT8). |
| **TR-07** | Hallucination | Neural model hallucination / script mixing on low-resource input | Medium | High | **P2** | Constrained decoding enforcing script Unicode range; post-generation script validator with phonetic fallback. |

---

## 2. Deep Dive: High-Priority Risks & Mitigations

### 2.1 TR-01: Low Memory Killer (LMK) on 2GB RAM Devices
- **Root Cause**: On an Android 9+ phone with 2GB RAM, the OS and system services consume 1.0–1.2 GB. The Android `ActivityManager` typically sets `largeHeap="true"` limit around 512 MB. If an app attempts to allocate >450 MB simultaneously, the OS sends an `onTrimMemory()` signal or immediately terminates the process with SIGKILL (signal 9).
- **Existing Problem in Repo**: Attempting to load unquantized models or holding both encoder and decoder ONNX sessions simultaneously pushes memory beyond 600 MB.
- **Enforced Mitigation**:
  1. **Dynamic INT8 Quantization**: Reduces 200M model size from 410 MB to ~310 MB.
  2. **Sequential Session Management**: In `HindiSantaliTranslator.kt`, create the Encoder session, run forward pass to extract hidden states, immediately call `encSession.close()`, and only then allocate the Decoder session.
  3. **Direct Memory Mapping (`OrtMemoryAllocation`)**: Use read-only memory-mapped model files (`mmap`) rather than loading raw byte buffers into Java heap memory.

### 2.2 TR-02: Autoregressive Decoder Latency on ARM CPU
- **Root Cause**: Without a Key-Value (KV) cache, each step $t$ of decoding requires recalculating attention across all previous $1 \dots t-1$ tokens, causing $O(N^2)$ complexity. On a low-end Cortex-A53 core running at 1.4 GHz, generation drops to 8–10 tokens/sec.
- **Enforced Mitigation**:
  1. Export the ONNX decoder with `use_cache_branch=True` and `past_key_values` inputs/outputs.
  2. With KV-cache, each decoding step processes only tensor shape `(1, 1)` through attention projections ($O(N)$ complexity).
  3. Limit maximum generation length (`max_length=64`) for mobile conversational usage.
  4. Use Tier 1 phrase cache to instantly bypass neural inference for standard phrases.

### 2.3 TR-03 & TR-04: Language & Script Gaps (Ho & Mundari)
- **Root Cause**: `IndicTrans2` was trained on 22 scheduled Indian languages plus Santali in Ol Chiki script. It has zero native tokens for Ho (in Warang Chiti script) and Mundari.
- **Enforced Mitigation**:
  1. **Script Transliteration Pipeline**: Ho and Mundari share phonetic and syntactic structures with Santali (all belong to the North Munda group of Austroasiatic languages). We can map Warang Chiti and Mundari into an internal canonical phonemic representation compatible with the shared Munda embeddings.
  2. **Lexicon-Guided Transfer**: Build bilingual seed dictionaries for Ho-Hindi and Mundari-Hindi.
  3. **Subword Vocabulary Extension**: Extend the SentencePiece tokenizer by reserving special token slots and fine-tuning cross-lingual linear projections.

### 2.4 TR-06: Tribal Text-to-Speech (TTS) Failure
- **Root Cause**: Android's `TextToSpeech` API relies on Google Speech Services or OEM engines, none of which support Ol Chiki (`sat_Olck`) or Warang Chiti (`hoc_Wara`). The existing repo's transliteration of Ol Chiki into Latin letters sounds distorted and inaccurate when spoken by a Hindi or English TTS engine.
- **Enforced Mitigation**:
  1. Build an offline phoneme synthesizer that maps Ol Chiki and Warang Chiti characters directly to pre-rendered native diphthongs and syllable audio snippets.
  2. For Phase 5, train a compact Piper TTS or SherpaOnnx VITS acoustic model (~25 MB) on native speaker recordings.
