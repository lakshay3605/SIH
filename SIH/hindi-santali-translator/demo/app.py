"""
demo/app.py — Gradio Web UI for Offline Hindi → Santali Voice Translation

Usage:
    python demo/app.py --offline
    python demo/app.py --online

Opens at http://localhost:7860 in your browser.
Works fully offline after models are downloaded once.
"""

import os
import sys
import time
import argparse
import tempfile
import logging

_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

sys.stdout.reconfigure(encoding="utf-8")
logging.basicConfig(level=logging.WARNING)  # suppress routine HF logs in UI

# Import core pipeline functions from src/demo.py
from src.demo import (
    load_translator,
    load_tts,
    translate,
    synthesize,
    TRANSLATION_MODEL,
    TTS_MODEL,
)

import gradio as gr

# ── Module-level state (loaded once per server session) ──────────────────────
_OFFLINE = False
_translator = None  # (tokenizer, model, ip)
_tts = None         # (tts_model, prompt_tok, desc_tok, sr)
_load_error = None


def _ensure_models_loaded():
    global _translator, _tts, _load_error
    if _load_error:
        raise RuntimeError(_load_error)
    if _translator is None:
        try:
            _translator = load_translator(offline=_OFFLINE)
        except FileNotFoundError as e:
            _load_error = str(e)
            raise RuntimeError(_load_error)
    if _tts is None:
        try:
            _tts = load_tts(offline=_OFFLINE)
        except FileNotFoundError as e:
            _load_error = str(e)
            raise RuntimeError(_load_error)


# ── Gradio handler functions ─────────────────────────────────────────────────

def do_translate(hindi_text: str) -> str:
    """Handler: Hindi text → Santali Ol Chiki text."""
    hindi_text = (hindi_text or "").strip()
    if not hindi_text:
        return "⚠ Please enter some Hindi text first."
    try:
        _ensure_models_loaded()
        tokenizer, model, ip = _translator
        t0 = time.time()
        santali = translate(hindi_text, tokenizer, model, ip)
        elapsed = time.time() - t0
        if not santali:
            return "⚠ Translation produced empty output. Please try a different sentence."
        return f"{santali}\n\n[Translation took {elapsed:.1f}s]"
    except Exception as e:
        return f"❌ Translation error: {e}"


def do_tts(santali_text: str, speaker: str) -> tuple:
    """Handler: Santali text → WAV audio file path."""
    # Strip timing annotation line if present
    santali_clean = santali_text.strip()
    if "\n\n[Translation" in santali_clean:
        santali_clean = santali_clean.split("\n\n[Translation")[0].strip()

    if not santali_clean:
        return None, "⚠ No Santali text to synthesize. Translate first."
    try:
        _ensure_models_loaded()
        tts_model, prompt_tok, desc_tok, sr = _tts
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False, dir="outputs/demo_audio") as f:
            wav_path = f.name
        os.makedirs("outputs/demo_audio", exist_ok=True)
        t0 = time.time()
        out_path = synthesize(santali_clean, tts_model, prompt_tok, desc_tok,
                              sr, speaker, wav_path)
        elapsed = time.time() - t0
        return out_path, f"✅ Audio generated in {elapsed:.1f}s → {out_path}"
    except Exception as e:
        return None, f"❌ TTS error: {e}"


def do_full_pipeline(hindi_text: str, speaker: str) -> tuple:
    """Handler: Hindi → Santali text + audio in one click."""
    santali_result = do_translate(hindi_text)
    if santali_result.startswith(("⚠", "❌")):
        return santali_result, None, santali_result

    # Extract clean Santali from result string
    santali_clean = santali_result.split("\n\n[Translation")[0].strip()
    audio_path, audio_status = do_tts(santali_clean, speaker)
    return santali_result, audio_path, audio_status


# ── Build Gradio UI ──────────────────────────────────────────────────────────

def build_ui(offline: bool) -> gr.Blocks:
    mode_color = "#22c55e" if offline else "#f59e0b"
    mode_label = "🟢 OFFLINE — Local inference only" if offline else "🟡 ONLINE — May contact HuggingFace"
    model_info = (
        f"**Translation:** `{TRANSLATION_MODEL}`\n\n"
        f"**TTS:** `{TTS_MODEL}`"
    )

    EXAMPLES = [
        ["नमस्ते, आप कैसे हैं?"],
        ["तुम कहाँ जा रहे हो?"],
        ["मुझे पानी चाहिए।"],
        ["किसान खेत में काम कर रहा है।"],
        ["स्कूल कब खुलता है?"],
    ]

    css = """
    .status-bar {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 10px 16px;
        font-family: monospace;
        font-size: 14px;
        margin-bottom: 12px;
    }
    .mode-badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 13px;
    }
    footer { display: none !important; }
    """

    _theme = gr.themes.Default(
        primary_hue="indigo",
        secondary_hue="slate",
        neutral_hue="slate",
    )

    with gr.Blocks(title="Offline Hindi → Santali Translator") as demo:
        gr.HTML(f"""
        <div style="text-align:center; padding: 20px 0 10px 0;">
          <h1 style="font-size:2rem; font-weight:800; margin:0;">
            🗣 Offline Hindi → Santali Translator
          </h1>
          <p style="color:#94a3b8; margin-top:6px; font-size:1rem;">
            Powered by <strong>IndicTrans2</strong> + <strong>Indic Parler-TTS</strong> · 100% Local Inference
          </p>
          <div style="margin-top:12px; padding:8px 20px; background:{mode_color}20;
                      border:1px solid {mode_color}; border-radius:8px; display:inline-block;">
            <span style="color:{mode_color}; font-weight:700; font-family:monospace;">
              {mode_label}
            </span>
          </div>
        </div>
        """)

        with gr.Row():
            with gr.Column(scale=2):
                gr.Markdown("### Step 1 — Hindi Input")
                hindi_input = gr.Textbox(
                    label="Hindi Text (Devanagari)",
                    placeholder="यहाँ हिंदी में लिखें...",
                    lines=3,
                    max_lines=6,
                    elem_id="hindi_input",
                )
                speaker_dropdown = gr.Dropdown(
                    choices=["Sumitra", "Raju"],
                    value="Sumitra",
                    label="TTS Speaker Voice",
                    elem_id="speaker_select",
                )

                with gr.Row():
                    translate_btn = gr.Button("🔤 Translate", variant="primary", elem_id="translate_btn")
                    full_btn = gr.Button("⚡ Translate + Speak", variant="secondary", elem_id="full_btn")

                gr.Examples(
                    examples=EXAMPLES,
                    inputs=[hindi_input],
                    label="Example sentences",
                    elem_id="examples",
                )

            with gr.Column(scale=2):
                gr.Markdown("### Step 2 — Santali Output (Ol Chiki)")
                santali_output = gr.Textbox(
                    label="Santali Translation (ᱚᱞ ᱪᱤᱠᱤ)",
                    lines=3,
                    max_lines=6,
                    interactive=False,
                    elem_id="santali_output",
                )

                tts_btn = gr.Button("🔊 Generate Santali Speech", variant="primary", elem_id="tts_btn")

                gr.Markdown("### Step 3 — Audio Output")
                audio_output = gr.Audio(
                    label="Synthesized Santali Speech",
                    type="filepath",
                    elem_id="audio_output",
                )
                status_output = gr.Textbox(
                    label="Status",
                    lines=2,
                    interactive=False,
                    elem_id="status_output",
                )

        gr.Markdown("---")
        with gr.Accordion("ℹ Model Information", open=False):
            gr.Markdown(model_info)
            gr.Markdown(
                "**Cache location:** `~/.cache/huggingface/hub/`\n\n"
                "All inference runs locally on your CPU. No data leaves your machine."
            )

        # ── Event wiring ────────────────────────────────────────────────────
        translate_btn.click(
            fn=do_translate,
            inputs=[hindi_input],
            outputs=[santali_output],
        )

        tts_btn.click(
            fn=do_tts,
            inputs=[santali_output, speaker_dropdown],
            outputs=[audio_output, status_output],
        )

        full_btn.click(
            fn=do_full_pipeline,
            inputs=[hindi_input, speaker_dropdown],
            outputs=[santali_output, audio_output, status_output],
        )

    return demo, _theme, css


# ── Entry point ──────────────────────────────────────────────────────────────

def parse_args():
    parser = argparse.ArgumentParser(description="Gradio UI — Offline Hindi → Santali")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--offline", action="store_true",
                      help="Force local_files_only=True. Fails if models not cached.")
    mode.add_argument("--online", action="store_true",
                      help="Allow model downloads if not cached.")
    parser.add_argument("--port", type=int, default=7860)
    parser.add_argument("--share", action="store_true",
                        help="Create a public Gradio share link (requires internet)")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    _OFFLINE = args.offline

    os.makedirs("outputs/demo_audio", exist_ok=True)

    print(f"\n{'='*60}")
    print(f"  HINDI → SANTALI GRADIO UI")
    print(f"  Mode: {'OFFLINE' if args.offline else 'ONLINE'}")
    print(f"  URL:  http://localhost:{args.port}")
    print(f"{'='*60}\n")

    ui, _theme, css = build_ui(offline=args.offline)
    ui.launch(
        server_port=args.port,
        share=args.share,
        inbrowser=True,
        show_error=True,
        theme=_theme,
        css=css,
    )
