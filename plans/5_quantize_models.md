# Plan 5: INT8 Quantization of Aakansha's ONNX Models
**Runs on:** Local Windows PC (no GPU, no Kaggle needed)
**Time:** ~15-20 minutes total

---

## Context

Aakansha trained and exported the IndicTrans2 200M model to ONNX format.
The output files are already on disk:

| File | Size | Problem |
|---|---|---|
| `encoder_model.onnx` | 479 MB | Too large for mobile (float32) |
| `decoder_model.onnx` | 807 MB | Too large for mobile (float32) |
| **Total** | **1.28 GB** | Cannot be used in Android app |

**This plan quantizes those files from float32 → INT8, which reduces them to ~320MB total
with <2% translation quality loss.** No retraining. No Kaggle. Runs entirely on CPU.

> [!IMPORTANT]
> **Do NOT re-run Aakansha's training (phase7_training.md). That is complete.**
> This plan only post-processes the files she already produced.

---

## Step 1: Install Dependencies

Open a terminal (PowerShell or CMD) and run:

```powershell
pip install onnxruntime onnx rich
```

If `pip` is not on PATH, use:
```powershell
python -m pip install onnxruntime onnx rich
```

Verify installation:
```powershell
python -c "import onnxruntime; import rich; print('OK')"
```

---

## Step 2: Create the Quantization Dashboard Script

Create this file at `d:\sih2026\zExtra\quantize_dashboard.py`:

```python
"""
INT8 Quantization Dashboard
Shrinks Aakansha's float32 ONNX models to INT8 for Android deployment.
  encoder_model.onnx  (~479MB) → encoder_model_int8.onnx  (~120MB)
  decoder_model.onnx  (~807MB) → decoder_model_int8.onnx  (~200MB)

Run: python quantize_dashboard.py
"""

import os
import time
import threading
from pathlib import Path

from onnxruntime.quantization import quantize_dynamic, QuantType
from rich.console import Console
from rich.panel import Panel
from rich.progress import (
    Progress, SpinnerColumn, BarColumn, TextColumn,
    TimeElapsedColumn, FileSizeColumn, TransferSpeedColumn,
    TaskProgressColumn,
)
from rich.table import Table
from rich.live import Live
from rich.layout import Layout
from rich.text import Text
from rich import box

# ── Paths ────────────────────────────────────────────────────────────────────
AAKANSHA_DIR = Path(r"d:\sih2026\aakansha's work\indictrans2_200m_hi_sat_onnx")

JOBS = [
    {
        "name":    "Encoder",
        "input":   AAKANSHA_DIR / "encoder_model.onnx",
        "output":  AAKANSHA_DIR / "encoder_model_int8.onnx",
        "expected_mb": 120,
    },
    {
        "name":    "Decoder",
        "input":   AAKANSHA_DIR / "decoder_model.onnx",
        "output":  AAKANSHA_DIR / "decoder_model_int8.onnx",
        "expected_mb": 200,
    },
]

console = Console()


def get_mb(path: Path) -> float:
    """Return file size in MB, or 0 if not found."""
    try:
        return path.stat().st_size / 1_048_576
    except FileNotFoundError:
        return 0.0


def run_quantize(job: dict, status_dict: dict):
    """Run quantize_dynamic in a background thread. Updates status_dict."""
    try:
        status_dict["state"] = "running"
        status_dict["start_time"] = time.time()
        quantize_dynamic(
            model_input  = str(job["input"]),
            model_output = str(job["output"]),
            weight_type  = QuantType.QInt8,
        )
        status_dict["state"] = "done"
    except Exception as e:
        status_dict["state"] = "error"
        status_dict["error"] = str(e)
    finally:
        status_dict["end_time"] = time.time()


def make_summary_table(jobs: list, statuses: list) -> Table:
    table = Table(box=box.ROUNDED, border_style="dim", expand=True)
    table.add_column("Model",        style="bold white",  width=12)
    table.add_column("Input",        style="yellow",      justify="right")
    table.add_column("Output",       style="green",       justify="right")
    table.add_column("Reduction",    style="cyan",        justify="right")
    table.add_column("Status",       style="bold",        justify="center")
    table.add_column("Time",         style="dim",         justify="right")

    for job, st in zip(jobs, statuses):
        in_mb  = get_mb(job["input"])
        out_mb = get_mb(job["output"])
        reduction = f"{((in_mb - out_mb) / in_mb * 100):.0f}%" if out_mb > 0 else "—"
        elapsed = ""
        if "start_time" in st:
            end = st.get("end_time", time.time())
            elapsed = f"{end - st['start_time']:.0f}s"

        state = st["state"]
        status_text = {
            "waiting": "[dim]Waiting[/dim]",
            "running": "[yellow]⚙ Running[/yellow]",
            "done":    "[green]✓ Done[/green]",
            "error":   "[red]✗ Error[/red]",
        }.get(state, state)

        table.add_row(
            job["name"],
            f"{in_mb:.1f} MB",
            f"{out_mb:.1f} MB" if out_mb > 0 else "—",
            reduction,
            status_text,
            elapsed,
        )

    return table


def make_output_size_bar(job: dict) -> str:
    """Show a live growing bar based on output file size vs expected."""
    out_mb      = get_mb(job["output"])
    expected_mb = job["expected_mb"]
    pct         = min(out_mb / expected_mb, 1.0) if expected_mb > 0 else 0
    bar_len     = 30
    filled      = int(bar_len * pct)
    bar         = "█" * filled + "░" * (bar_len - filled)
    return f"[green]{bar}[/green] {out_mb:.1f}/{expected_mb} MB"


def main():
    console.print(Panel.fit(
        "[bold white]INT8 Quantization Dashboard[/bold white]\n"
        "[dim]Shrinking Aakansha's ONNX models for Android deployment[/dim]",
        border_style="yellow"
    ))
    console.print()

    # Validate input files exist
    for job in JOBS:
        if not job["input"].exists():
            console.print(f"[red]ERROR: File not found: {job['input']}[/red]")
            console.print("[red]Make sure Aakansha's ONNX folder path is correct.[/red]")
            return

    statuses = [{"state": "waiting"} for _ in JOBS]

    with Live(refresh_per_second=4, console=console) as live:
        for i, (job, status) in enumerate(zip(JOBS, statuses)):
            # Skip if output already exists
            if job["output"].exists():
                console.print(f"[dim]Skipping {job['name']} — {job['output'].name} already exists.[/dim]")
                status["state"] = "done"
                status["start_time"] = 0
                status["end_time"] = 0
                continue

            # Start quantization in background thread
            t = threading.Thread(target=run_quantize, args=(job, status), daemon=True)
            t.start()

            # Live update while thread runs
            while t.is_alive():
                layout = Layout()
                layout.split_column(
                    Layout(name="table"),
                    Layout(name="progress"),
                )

                table = make_summary_table(JOBS, statuses)
                bar   = make_output_size_bar(job)

                progress_panel = Panel(
                    f"[bold]{job['name']} model[/bold]\n\n"
                    f"  Output growth: {bar}\n\n"
                    f"  [dim]This can take 5-15 minutes. The output file grows as quantization proceeds.[/dim]",
                    title=f"[yellow]⚙ Currently Processing: {job['name']}[/yellow]",
                    border_style="yellow",
                )

                live.update(
                    Panel(
                        f"{table}\n\n{progress_panel.renderable}",
                        title="[bold white]Quantization Progress[/bold white]",
                        border_style="dim",
                    )
                )
                time.sleep(1.0)

            t.join()

            if status["state"] == "error":
                console.print(f"\n[red]Quantization failed for {job['name']}: {status.get('error')}[/red]")
                return

        # Final summary
        live.stop()

    console.print()
    console.print(make_summary_table(JOBS, statuses))
    console.print()

    # Check if both succeeded
    all_done = all(job["output"].exists() for job in JOBS)
    if all_done:
        total_in  = sum(get_mb(j["input"])  for j in JOBS)
        total_out = sum(get_mb(j["output"]) for j in JOBS)
        console.print(Panel(
            f"[bold green]✓ Quantization Complete![/bold green]\n\n"
            f"  Before : [yellow]{total_in:.0f} MB[/yellow]\n"
            f"  After  : [green]{total_out:.0f} MB[/green]\n"
            f"  Saved  : [cyan]{total_in - total_out:.0f} MB "
            f"({(total_in - total_out)/total_in*100:.0f}% reduction)[/cyan]\n\n"
            f"  Files saved to:\n"
            f"  [dim]{AAKANSHA_DIR}[/dim]\n\n"
            f"  [bold]Next step → Follow Plan 3 (3_onnx_integration_plan.md)[/bold]\n"
            f"  [dim]Upload the int8 files to HuggingFace and update the app downloader.[/dim]",
            border_style="green",
            title="[bold green]Done[/bold green]"
        ))
    else:
        console.print("[red]Some files are missing. Check errors above.[/red]")


if __name__ == "__main__":
    main()
```

---

## Step 3: Run the Script

In PowerShell:
```powershell
python "d:\sih2026\zExtra\quantize_dashboard.py"
```

The dashboard will show a live terminal UI like this while running:

```
┌─ Quantization Progress ───────────────────────────────────────────┐
│                                                                    │
│  ┌──────────┬──────────┬──────────┬───────────┬──────────┬──────┐ │
│  │ Model    │ Input    │ Output   │ Reduction │ Status   │ Time │ │
│  ├──────────┼──────────┼──────────┼───────────┼──────────┼──────┤ │
│  │ Encoder  │ 479.1 MB │  81.2 MB │       83% │ ⚙ Running│  42s │ │
│  │ Decoder  │ 807.0 MB │      —   │         — │  Waiting │      │ │
│  └──────────┴──────────┴──────────┴───────────┴──────────┴──────┘ │
│                                                                    │
│  ┌─ Currently Processing: Encoder ──────────────────────────────┐ │
│  │  Output growth: ████████████░░░░░░░░░░░░░░░░░  81.2/120 MB  │ │
│  │  This can take 5-15 minutes per model.                       │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

The bar grows in real time as the output file is written to disk.

---

## Step 4: Verify Output

After the script completes, verify these files exist and have the expected sizes:

```powershell
Get-Item "d:\sih2026\aakansha's work\indictrans2_200m_hi_sat_onnx\*_int8.onnx" |
    Select-Object Name, @{N='MB';E={[math]::Round($_.Length/1MB,1)}}
```

Expected output:
```
Name                        MB
----                        --
encoder_model_int8.onnx    ~120
decoder_model_int8.onnx    ~200
```

---

## Step 5: What Comes Next

After quantization, proceed to **`3_onnx_integration_plan.md`** (already written).
Specifically:
1. Upload `encoder_model_int8.onnx` and `decoder_model_int8.onnx` to HuggingFace
2. Update `TranslationModelDownloader.kt` with new file names and URLs
3. Modify `HindiSantaliTranslator.kt` to load the int8 files
4. Remove the `decoder_with_past_model.onnx` dependency

---

## If the Script Crashes / Errors

| Error | Fix |
|---|---|
| `ModuleNotFoundError: rich` | Run `pip install rich` |
| `ModuleNotFoundError: onnxruntime` | Run `pip install onnxruntime` |
| `File not found` on input | Check the path — make sure Aakansha's folder exists |
| `MemoryError` during quantize | Close other heavy apps (Chrome, etc.) — quantization needs ~4GB RAM |
| Output file is 0 bytes | Delete the corrupt output file and rerun |
| Script already produced the int8 files | The script skips existing files automatically |
