# Agent Prompt — Execute Phase 3: Hindi ASR Integration

## Your Task
You are a coding agent. Your job is to implement Phase 3 of the Hindi → Santali offline Android translator app. This means integrating real Hindi speech recognition (ASR) into an already-built Android app so that when a user holds the mic button and speaks Hindi, their speech is transcribed to Hindi Devanagari text entirely on-device with no internet.

## Read This First
Before writing any code, read the full detailed plan at:
**`d:\sih2026\plans\phase3_asr_integration.md`**

That file contains all the exact file paths, code snippets, and step-by-step instructions you need. Follow it precisely.

## Project Location
- **Android project root:** `d:\sih2026\HindiSantaliApp`
- **App package:** `com.example.hindisantali`
- **Min SDK:** 26 (Android 9)
- **Build tool:** `.\gradlew.bat` (run from project root, PowerShell)

## What Already Exists (Do NOT recreate these)
- Full working UI in `app/src/main/java/com/example/hindisantali/ui/main/MainScreen.kt`
- Pipeline ViewModel in `app/src/main/java/com/example/hindisantali/ui/main/MainScreenViewModel.kt`
  - The stub you must fill is: `private fun transcribeHindi(pcmData: ShortArray): String`
- `AndroidManifest.xml` already has RECORD_AUDIO + INTERNET permissions
- App already builds successfully with `BUILD SUCCESSFUL`

## What You Must Do (Summary)
1. Add SherpaOnnx library via JitPack to Gradle (`libs.versions.toml`, `settings.gradle.kts`, `app/build.gradle.kts`)
2. **Search HuggingFace for the correct IndicConformer Hindi INT8 model** — find the real download URL before writing `ModelDownloader.kt`
3. Create `asr/ModelDownloader.kt` — downloads model once on first launch, then works offline
4. Create `asr/HindiAsrEngine.kt` — wraps SherpaOnnx to convert raw 16kHz PCM to Hindi text
5. Update `MainScreenViewModel.kt` — replace the stub with real engine calls
6. Update `MainScreen.kt` — add a download prompt screen for first launch
7. Run `.\gradlew.bat assembleDebug --no-daemon` and confirm `BUILD SUCCESSFUL`

## Hard Constraints
- **Sequential model loading:** Call `asrEngine.release()` after transcription finishes to free RAM before translation loads. The device only has 2GB RAM.
- **No cloud APIs whatsoever.** The only internet use is the one-time model download.
- **All models stored in** `context.filesDir/asr_model/` — NOT in assets, NOT on SD card.
- **SherpaOnnx API:** Use the Kotlin API (`com.k2fsa.sherpa.onnx.*`). Use `OnlineRecognizer` for Transducer models, `OfflineRecognizer` for CTC models — verify which type the downloaded model is.
- **Do NOT modify** `MainScreen.kt` UI colours, layout, or the `MainScreenViewModel`'s recording logic — only touch what the plan says.

## Critical Step — Verify Model URL
Before writing `ModelDownloader.kt`, you MUST search for the real model:
1. Search: https://huggingface.co/models?search=sherpa-onnx+hindi
2. Also check: https://github.com/k2-fsa/sherpa-onnx/releases/tag/asr-models
3. Find a Hindi-capable INT8 quantized model (~150–250MB total)
4. Confirm exact filenames in the repo (e.g. `encoder.int8.onnx`, `tokens.txt`)
5. Use the HuggingFace raw URL format: `https://huggingface.co/{repo_id}/resolve/main/{file}`

If no Hindi-specific IndicConformer model is found, fall back to the **Dolphin multilingual model** which supports Hindi.

## Verification
After `BUILD SUCCESSFUL`:
- Connect Android phone via USB with Developer Mode + USB Debugging enabled
- Run: `adb install -r d:\sih2026\HindiSantaliApp\app\build\outputs\apk\debug\app-debug.apk`
- Open app → tap "Download ASR Model" (first launch, needs WiFi)
- Hold mic → speak Hindi → confirm Hindi Devanagari text appears in the output card

## What to Report Back
When done, tell the user:
1. ✅ or ❌ Build status
2. Which exact SherpaOnnx model was used (name + HuggingFace URL)
3. Measured ASR latency in milliseconds on the physical device
4. Any issues encountered and how they were resolved
