# Prototype Status — Hindi → Santali Offline Voice Pipeline

**Last updated:** 2026-09-01  
**Test machine:** AMD Ryzen 5 5600H, 15.4 GB RAM, CPU-only  
**Offline test:** PASSED (`local_files_only=True`, all 5/5 sentences)

---

## Component Status

| Component | Status | Notes |
|---|---|---|
| Hindi text input | ✅ WORKING | CLI (`src/demo.py`) + Gradio UI (`demo/app.py`) |
| Hindi → Santali translation | ✅ WORKING | IndicTrans2 1B, beam_search, 4–16s/sentence on CPU |
| Ol Chiki output | ✅ WORKING | 100% Ol Chiki validity in offline test (5/5) |
| Santali TTS | ✅ WORKING | Indic Parler-TTS, 44100 Hz WAV, 23–36s/sentence on CPU |
| Audio generation (WAV) | ✅ WORKING | Saved to `outputs/demo_audio/` |
| Offline translation | ✅ VERIFIED | `local_files_only=True`, zero network requests |
| Offline TTS | ✅ VERIFIED | `local_files_only=True`, zero network requests |
| Offline cache check | ✅ WORKING | Fails clearly with actionable message if model missing |
| External APIs (Google, OpenAI, etc.) | ✅ NONE USED | Fully local inference |
| Gradio web UI | ✅ BUILT | `demo/app.py --offline`, opens at localhost:7860 |
| Android | ❌ NOT STARTED | Pending Phase 5 (after fine-tuning + quantization) |
| Model fine-tuning | ⏸ PAUSED | Phase 4 paused; training script ready, config audited |
| ONNX / TFLite conversion | ❌ NOT STARTED | Future phase |
| Quantization | ❌ NOT STARTED | Future phase |

---

## Verified Offline Test Results (2026-09-01)

| # | Hindi | Santali (Ol Chiki) | Audio |
|---|---|---|---|
| 1 | नमस्ते, आप कैसे हैं? | ᱦᱚᱞᱮ, ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱠᱟᱱᱟ? | ✅ sentence_01.wav |
| 2 | तुम कहाँ जा रहे हो? | ᱟᱢ ᱚᱠᱟ ᱥᱮᱫ ᱪᱟᱞᱟᱣᱚᱜ ᱠᱟᱱᱟ? | ✅ sentence_02.wav |
| 3 | मुझे पानी चाहिए। | ᱤᱧ ᱫᱟᱜ ᱞᱟᱹᱠᱛᱤ ᱠᱟᱱᱟ ᱾ | ✅ sentence_03.wav |
| 4 | किसान खेत में काम कर रहा है। | ᱵᱤᱨᱤᱭᱟᱹ ᱫᱚ ᱪᱟᱥ ᱚᱲᱟᱜ ᱨᱮ ᱠᱟᱹᱢᱤ ᱟᱠᱟᱫᱟᱭ ᱾ | ✅ sentence_04.wav |
| 5 | स्कूल कब खुलता है? | ᱵᱤᱨᱫᱟᱹᱜᱟᱲ ᱫᱚ ᱪᱮᱫ ᱚᱠᱛᱚ ᱮᱦᱚᱵᱚᱜᱼᱟ? | ✅ sentence_05.wav |

---

## Performance (CPU-only baseline)

| Metric | Value |
|---|---|
| Model load time (both models) | ~31s |
| Translation latency (avg after warmup) | ~5.5s/sentence |
| TTS latency (avg) | ~30s/sentence |
| End-to-end per sentence | ~35s |
| Peak RAM | ~4.5 GB |
| Baseline BLEU-4 (100-sentence eval) | 2.85 |
| Baseline chrF++ | 30.41 |
| Ol Chiki validity (eval set) | 100% |
| Foreign contamination (eval set) | 7% |

---

## Files Created

| File | Purpose |
|---|---|
| [`src/demo.py`](../src/demo.py) | CLI offline pipeline — `python src/demo.py --offline` |
| [`demo/app.py`](../demo/app.py) | Gradio web UI — `python demo/app.py --offline` |
| [`demo/README.md`](README.md) | Setup and usage guide |
| [`outputs/offline_test_report.md`](offline_test_report.md) | Verified offline test results |
| [`outputs/demo_audio/sentence_0*.wav`](demo_audio/) | Generated audio files from offline test |

---

## Known Limitations

1. **Translation quality**: Base model, not fine-tuned on Hindi→Santali. 7% foreign contamination on evaluation set.
2. **Speed**: ~35s per sentence on CPU. GPU would reduce to ~2-3s.
3. **No ASR**: Hindi _speech_ input not yet implemented. Currently text-only input.
4. **No Android**: Mobile deployment pending quantization + ONNX/TFLite conversion.
5. **Single-sentence**: No streaming or batched real-time mode yet.

---

## Next Steps (Not Started)

- [ ] Phase 4 (resumed): Fine-tune IndicTrans2 with corrected LR=2e-5
- [ ] Phase 5: Hindi ASR integration (Whisper or IndicWhisper)
- [ ] Phase 6: Quantization (INT8/INT4) for size reduction
- [ ] Phase 7: ONNX/TFLite/ExecuTorch conversion
- [ ] Phase 8: Android app integration
