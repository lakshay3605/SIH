"""
src/demo.py — Offline Hindi → Santali Voice Translation Demo

CLI usage:
    python src/demo.py --offline
    python src/demo.py --offline --speaker Raju
    python src/demo.py --online   # allows model download if not cached

The --offline flag forces local_files_only=True on all model loads.
It will fail immediately and clearly if any required file is missing
from the local HuggingFace cache.
"""

import os
import sys
import time
import argparse
import logging

# Ensure project root is on path regardless of where script is run from
_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

sys.stdout.reconfigure(encoding="utf-8")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("demo")


# ---------------------------------------------------------------------------
# Offline-aware model loading helpers
# ---------------------------------------------------------------------------

TRANSLATION_MODEL = "ai4bharat/indictrans2-indic-indic-1B"
TTS_MODEL = "ai4bharat/indic-parler-tts"
TTS_DESC_MODEL = "google/flan-t5-large"

HF_CACHE = os.path.expanduser("~/.cache/huggingface/hub")


def _cache_dir_name(model_id: str) -> str:
    """Convert HF model id to the local cache directory name."""
    return "models--" + model_id.replace("/", "--")


def verify_cache(model_id: str) -> str:
    """Return the snapshot path for a cached model or raise FileNotFoundError."""
    cache_path = os.path.join(HF_CACHE, _cache_dir_name(model_id), "snapshots")
    if not os.path.isdir(cache_path):
        raise FileNotFoundError(
            f"\n\n[OFFLINE ERROR] Model '{model_id}' is NOT found in the local cache.\n"
            f"  Expected at: {cache_path}\n"
            f"  Run ONCE with --online to download it:\n"
            f"    python src/demo.py --online\n"
        )
    snapshots = os.listdir(cache_path)
    if not snapshots:
        raise FileNotFoundError(
            f"[OFFLINE ERROR] Cache directory exists but contains no snapshots: {cache_path}"
        )
    return os.path.join(cache_path, snapshots[0])


def load_translator(offline: bool):
    """Load IndicTrans2 translator, optionally enforcing local_files_only."""
    import torch
    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

    try:
        from IndicTransToolkit import IndicProcessor
    except ImportError:
        from src.translation.processor import IndicProcessor

    if offline:
        logger.info(f"[OFFLINE] Verifying cache for {TRANSLATION_MODEL}...")
        verify_cache(TRANSLATION_MODEL)
        logger.info("[OFFLINE] Cache verified. Loading from local files only.")

    kwargs = dict(trust_remote_code=True, local_files_only=offline)

    logger.info(f"Loading tokenizer: {TRANSLATION_MODEL}")
    tokenizer = AutoTokenizer.from_pretrained(TRANSLATION_MODEL, **kwargs)

    logger.info(f"Loading model: {TRANSLATION_MODEL}")
    model = AutoModelForSeq2SeqLM.from_pretrained(
        TRANSLATION_MODEL, torch_dtype=torch.float32, **kwargs
    )
    model.eval()

    ip = IndicProcessor(inference=True)
    logger.info("IndicTrans2 loaded successfully.")
    return tokenizer, model, ip


def load_tts(offline: bool):
    """Load Indic Parler-TTS model and tokenizers, optionally enforcing local_files_only."""
    import torch
    from transformers import AutoTokenizer
    from parler_tts import ParlerTTSForConditionalGeneration

    if offline:
        for mid in (TTS_MODEL, TTS_DESC_MODEL):
            logger.info(f"[OFFLINE] Verifying cache for {mid}...")
            verify_cache(mid)
        logger.info("[OFFLINE] TTS cache verified. Loading from local files only.")

    kwargs = dict(local_files_only=offline)

    logger.info(f"Loading TTS model: {TTS_MODEL}")
    tts_model = ParlerTTSForConditionalGeneration.from_pretrained(
        TTS_MODEL, torch_dtype=torch.float32, **kwargs
    )
    tts_model.eval()

    logger.info(f"Loading TTS prompt tokenizer: {TTS_MODEL}")
    prompt_tokenizer = AutoTokenizer.from_pretrained(TTS_MODEL, **kwargs)

    logger.info(f"Loading TTS description tokenizer: {TTS_DESC_MODEL}")
    desc_tokenizer = AutoTokenizer.from_pretrained(TTS_DESC_MODEL, **kwargs)

    sampling_rate = getattr(tts_model.config, "sampling_rate", 22050)
    logger.info(f"Indic Parler-TTS loaded successfully (sampling_rate={sampling_rate} Hz).")
    return tts_model, prompt_tokenizer, desc_tokenizer, sampling_rate


# ---------------------------------------------------------------------------
# Core inference functions
# ---------------------------------------------------------------------------

def translate(hindi_text: str, tokenizer, model, ip) -> str:
    """Translate one Hindi sentence to Santali Ol Chiki."""
    import torch

    batch = ip.preprocess_batch([hindi_text.strip()], src_lang="hin_Deva", tgt_lang="sat_Olck")
    inputs = tokenizer(batch, padding=True, truncation=True, max_length=256, return_tensors="pt")

    with torch.inference_mode():
        generated = model.generate(
            **inputs,
            max_length=256,
            num_beams=4,
            repetition_penalty=1.3,
            no_repeat_ngram_size=3,
        )

    with tokenizer.as_target_tokenizer():
        decoded = tokenizer.batch_decode(generated, skip_special_tokens=True)

    result = ip.postprocess_batch(decoded, lang="sat_Olck")
    return result[0] if result else ""


def synthesize(santali_text: str, tts_model, prompt_tok, desc_tok,
               sampling_rate: int, speaker: str, output_path: str) -> str:
    """Synthesize Santali Ol Chiki text to WAV and save it."""
    import torch
    import soundfile as sf

    description = (
        f"{speaker}'s voice is clear, expressive, and natural "
        f"with moderate pace and high audio quality."
    )

    desc_inputs = desc_tok(description, return_tensors="pt")
    prompt_inputs = prompt_tok(santali_text.strip(), return_tensors="pt")

    with torch.inference_mode():
        generation = tts_model.generate(
            input_ids=desc_inputs.input_ids,
            attention_mask=desc_inputs.attention_mask,
            prompt_input_ids=prompt_inputs.input_ids,
            prompt_attention_mask=prompt_inputs.attention_mask,
        )

    audio_arr = generation.cpu().numpy().squeeze()
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    sf.write(output_path, audio_arr, sampling_rate)
    return os.path.abspath(output_path)


# ---------------------------------------------------------------------------
# CLI Demo
# ---------------------------------------------------------------------------

TEST_SENTENCES = [
    "नमस्ते, आप कैसे हैं?",
    "तुम कहाँ जा रहे हो?",
    "मुझे पानी चाहिए।",
    "किसान खेत में काम कर रहा है।",
    "स्कूल कब खुलता है?",
]


def run_cli(args):
    mode_label = "OFFLINE (local_files_only=True)" if args.offline else "ONLINE"
    print(f"\n{'='*70}")
    print(f"  HINDI → SANTALI OFFLINE VOICE PIPELINE")
    print(f"  Mode: {mode_label}")
    print(f"{'='*70}\n")

    # ── Load models ──────────────────────────────────────────────────────────
    print("[1/2] Loading translation model...")
    t0 = time.time()
    try:
        tokenizer, model, ip = load_translator(offline=args.offline)
    except FileNotFoundError as e:
        print(str(e))
        sys.exit(1)
    print(f"      Translation model ready in {time.time()-t0:.1f}s\n")

    print("[2/2] Loading TTS model...")
    t0 = time.time()
    try:
        tts_model, prompt_tok, desc_tok, sr = load_tts(offline=args.offline)
    except FileNotFoundError as e:
        print(str(e))
        sys.exit(1)
    print(f"      TTS model ready in {time.time()-t0:.1f}s\n")

    # ── Run test sentences ───────────────────────────────────────────────────
    sentences = args.sentences if args.sentences else TEST_SENTENCES
    os.makedirs(args.output_dir, exist_ok=True)

    results = []
    for i, hindi in enumerate(sentences, 1):
        print(f"─── Sentence {i}/{len(sentences)} ───────────────────────────────")
        print(f"  Hindi   : {hindi}")

        # Translation
        t0 = time.time()
        santali = translate(hindi, tokenizer, model, ip)
        t_trans = time.time() - t0
        print(f"  Santali : {santali}")
        print(f"  [Translation: {t_trans:.1f}s]")

        # TTS
        wav_path = os.path.join(args.output_dir, f"sentence_{i:02d}.wav")
        t0 = time.time()
        try:
            out_path = synthesize(santali, tts_model, prompt_tok, desc_tok,
                                  sr, args.speaker, wav_path)
            t_tts = time.time() - t0
            print(f"  Audio   : {out_path}")
            print(f"  [TTS: {t_tts:.1f}s]")
            audio_status = "OK"
        except Exception as e:
            print(f"  Audio   : FAILED — {e}")
            out_path = None
            audio_status = f"FAILED: {e}"

        print()
        results.append({
            "id": i,
            "hindi": hindi,
            "santali": santali,
            "audio_path": out_path,
            "audio_status": audio_status,
            "translation_latency_s": round(t_trans, 2),
        })

    # ── Summary ──────────────────────────────────────────────────────────────
    print(f"{'='*70}")
    print(f"  PIPELINE COMPLETE")
    print(f"  Mode       : {mode_label}")
    print(f"  Sentences  : {len(results)}")
    ok_audio = sum(1 for r in results if r["audio_status"] == "OK")
    print(f"  Audio OK   : {ok_audio}/{len(results)}")
    print(f"  Output dir : {os.path.abspath(args.output_dir)}")
    print(f"{'='*70}")

    return results


def parse_args():
    parser = argparse.ArgumentParser(
        description="Offline Hindi → Santali Voice Translation Demo"
    )
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument(
        "--offline",
        action="store_true",
        help="Force local_files_only=True. Fails clearly if any model is missing from cache.",
    )
    mode.add_argument(
        "--online",
        action="store_true",
        help="Allow downloading models if not already cached.",
    )
    parser.add_argument(
        "--speaker",
        type=str,
        default="Sumitra",
        choices=["Sumitra", "Raju"],
        help="TTS speaker voice (default: Sumitra)",
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="outputs/demo_audio",
        help="Directory to write WAV files (default: outputs/demo_audio)",
    )
    parser.add_argument(
        "--sentences",
        nargs="+",
        default=None,
        help="Custom Hindi sentences to translate (overrides default 5 test sentences)",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run_cli(args)
