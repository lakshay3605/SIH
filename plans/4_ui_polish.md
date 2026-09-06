# Plan 4: UI/UX Polish, Bug Fixes & Cache Upgrade
**Codebase:** `d:\sih2026\HindiSantaliApp`

---

## Overview

The Sohrai palette and base layout are already implemented. This plan covers:
1. A critical text bug fix (wrong instruction text after ASR refactor)
2. Upgrading to a premium Google Font
3. A sound wave animation during recording
4. Status text improvements for the new tap-to-listen model
5. Replacing the 2,007-pair cache with Aakansha's 15,000+ pair cache

No ViewModel, engine, or model code is touched. All changes are purely UI.

---

## Step 0 — Copy the New Translation Cache (Do First)

Copy this file:
```
d:\sih2026\aakansha's work\indictrans2_200m_hi_sat_onnx\translation_cache.json
```
to:
```
d:\sih2026\HindiSantaliApp\app\src\main\assets\translation_cache.json
```
Overwrite the existing file. Rebuild. Done — 15,000+ pairs are now active.

---

## Step 1 — Add Google Fonts Dependency

**File:** `app/build.gradle` (Module level)

Add to the `dependencies` block:
```gradle
implementation "androidx.compose.ui:ui-text-google-fonts:1.7.0"
```

---

## Step 2 — Create Font Setup File

**File:** `app/src/main/java/com/example/hindisantali/theme/Fonts.kt` (NEW)

```kotlin
package com.example.hindisantali.theme

import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.googlefonts.Font
import androidx.compose.ui.text.googlefonts.GoogleFont

private val provider = GoogleFont.Provider(
    providerAuthority = "com.google.android.gms.fonts",
    providerPackage   = "com.google.android.gms",
    certificates      = com.example.hindisantali.R.array.com_google_android_gms_fonts_certs
)

private val outfitFont = GoogleFont("Outfit")
private val notoSansFont = GoogleFont("Noto Sans Ol Chiki")

val OutfitFamily = FontFamily(
    Font(googleFont = outfitFont, fontProvider = provider, weight = FontWeight.Normal),
    Font(googleFont = outfitFont, fontProvider = provider, weight = FontWeight.Medium),
    Font(googleFont = outfitFont, fontProvider = provider, weight = FontWeight.SemiBold),
    Font(googleFont = outfitFont, fontProvider = provider, weight = FontWeight.Bold),
)

// Noto Sans Ol Chiki renders Santali script properly
val OlChikiFamily = FontFamily(
    Font(googleFont = notoSansFont, fontProvider = provider, weight = FontWeight.Normal),
    Font(googleFont = notoSansFont, fontProvider = provider, weight = FontWeight.Medium),
)
```

> **Note:** The `com_google_android_gms_fonts_certs` resource array is auto-generated
> when the dependency is added. If it's missing, run `Sync Project with Gradle Files` first.

---

## Step 3 — Update Type.kt

**File:** `app/src/main/java/com/example/hindisantali/theme/Type.kt`

Replace the default `Typography` object to use `OutfitFamily` as the base:

```kotlin
package com.example.hindisantali.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val AppTypography = Typography(
    bodyLarge = TextStyle(
        fontFamily = OutfitFamily,
        fontWeight = FontWeight.Normal,
        fontSize   = 16.sp,
        lineHeight = 24.sp,
    ),
    bodyMedium = TextStyle(
        fontFamily = OutfitFamily,
        fontWeight = FontWeight.Normal,
        fontSize   = 14.sp,
        lineHeight = 20.sp,
    ),
    labelSmall = TextStyle(
        fontFamily = OutfitFamily,
        fontWeight = FontWeight.Medium,
        fontSize   = 10.sp,
        letterSpacing = 1.5.sp,
    ),
    titleLarge = TextStyle(
        fontFamily = OutfitFamily,
        fontWeight = FontWeight.Bold,
        fontSize   = 28.sp,
    ),
)
```

In `Theme.kt`, make sure `typography = AppTypography` is passed to `MaterialTheme`.

---

## Step 4 — Update MainScreen.kt

Apply all UI changes below to `MainScreen.kt`. **Do not modify any function
signatures, ViewModel calls, or state reading logic.**

### 4a — Fix Instruction Text Bug

**Current text (wrong — this is a hold-to-record instruction, but we now tap-to-listen):**
```kotlin
// Line ~334
"Hold the mic button and speak Hindi"
```

**Replace with:**
```kotlin
"Tap the mic and speak in Hindi"
```

### 4b — Apply OutfitFamily to All Text Composables

In every `Text(...)` call that does NOT display Santali script, add:
```kotlin
fontFamily = OutfitFamily,
```

For the Santali output text in `OutputCard`, use:
```kotlin
// Inside the isSantali branch
fontFamily = OlChikiFamily,
```

This makes the Ol Chiki script render correctly and look premium instead of using
the device's fallback font.

### 4c — Add Status Text Below the Mic

In the `MicSection` composable, add a `Text` below the Box (after the 140dp circle):

```kotlin
Spacer(Modifier.height(16.dp))
val statusText = when (stage) {
    PipelineStage.IDLE        -> "Tap to speak Hindi"
    PipelineStage.RECORDING   -> "Listening..."
    PipelineStage.TRANSCRIBING -> "Processing speech..."
    PipelineStage.TRANSLATING  -> "Translating to Santali..."
    PipelineStage.SYNTHESIZING -> "Preparing audio..."
    PipelineStage.PLAYING      -> "Playing..."
    PipelineStage.ERROR        -> "Tap to try again"
}
val statusColor by animateColorAsState(
    targetValue   = if (stage == PipelineStage.RECORDING) Brick
                    else if (stage == PipelineStage.IDLE || stage == PipelineStage.ERROR) TextHint
                    else Amber,
    animationSpec = tween(400),
    label         = "statusColor"
)
Text(
    text          = statusText,
    color         = statusColor,
    fontSize      = 13.sp,
    fontFamily    = OutfitFamily,
    fontWeight    = FontWeight.Medium,
    letterSpacing = 0.3.sp,
    textAlign     = TextAlign.Center,
)
```

### 4d — Add Sound Wave Animation During Recording

Replace the existing pulse ring animation in `MicSection` with a richer sound wave
that appears below the mic circle when recording. Add this composable at the bottom
of the `MicSection` function:

```kotlin
// Inside MicSection, after the status text:
Spacer(Modifier.height(12.dp))
AnimatedVisibility(
    visible = isRecording,
    enter   = fadeIn(tween(300)),
    exit    = fadeOut(tween(200))
) {
    SoundWaveBar()
}
```

Create a new private composable `SoundWaveBar`:

```kotlin
@Composable
private fun SoundWaveBar() {
    val transition = rememberInfiniteTransition(label = "wave")
    // 5 bars, each with a different phase
    val phases = listOf(0, 150, 300, 150, 0)
    Row(
        horizontalArrangement = Arrangement.spacedBy(5.dp),
        verticalAlignment     = Alignment.CenterVertically,
    ) {
        phases.forEachIndexed { i, delayMs ->
            val height by transition.animateFloat(
                initialValue  = 6f,
                targetValue   = 28f,
                animationSpec = infiniteRepeatable(
                    animation = tween(500, easing = FastOutSlowInEasing, delayMillis = delayMs),
                    repeatMode = RepeatMode.Reverse
                ),
                label = "waveBar$i"
            )
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .height(height.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(Brick.copy(alpha = 0.75f))
            )
        }
    }
}
```

### 4e — Update Download Screen Sizes

The download screen currently says `~200 MB` for translation. Update to reflect
the INT8 quantized model sizes (from Plan 3):

```kotlin
// Translation model line:
size = "~320 MB"   // encoder_int8 (~120MB) + decoder_int8 (~200MB)

// Total button text:
"Download All Models  (~520 MB)"
```

### 4f — Remove the PipelineStepRow Hint Text Duplication

The `PipelineStepRow` currently shows a hint text at the bottom:
```kotlin
"Hold the mic button and speak Hindi"
```

This is now shown by the new status text in `MicSection` (Step 4c above).
**Delete the entire `if (stage == PipelineStage.IDLE || ...) { Spacer + Text }` block**
from the bottom of `PipelineStepRow` to avoid duplicate text on screen.

---

## Step 5 — Verify the Build

```
.\gradlew.bat assembleDebug
```

Fix any import or font certificate errors before proceeding. 

The Google Fonts certificate file is auto-generated but may need this res file:
**`app/src/main/res/values/font_certs.xml`** — If the build fails citing missing
`com_google_android_gms_fonts_certs`, create this file:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <array name="com_google_android_gms_fonts_certs">
        <item>@array/com_google_android_gms_fonts_certs_dev</item>
        <item>@array/com_google_android_gms_fonts_certs_prod</item>
    </array>
    <string-array name="com_google_android_gms_fonts_certs_dev">
        <item>
            MIIEqDCCA5CgAwIBAgIJANWFuGx90071MA0GCSqGSIb3DQEBBAUAMIGUMQswCQYD...
        </item>
    </string-array>
    <string-array name="com_google_android_gms_fonts_certs_prod">
        <item>
            MIIEQzCCAyugAwIBAgIJAMLgh0ZkSjCNMA0GCSqGSIb3DQEBBAUAMHMxCzAJBgNV...
        </item>
    </string-array>
</resources>
```

> The actual certificate values are available at:
> https://github.com/android/compose-samples/blob/main/Jetchat/app/src/main/res/values/font_certs.xml

---

## Summary of Changes

| File | Change |
|---|---|
| `assets/translation_cache.json` | Replace with Aakansha's 15k-pair version |
| `app/build.gradle` | Add Google Fonts dependency |
| `theme/Fonts.kt` | NEW — Outfit + Noto Sans Ol Chiki setup |
| `theme/Type.kt` | Switch typography to OutfitFamily |
| `MainScreen.kt` | Fix instruction text, status text, sound wave, font, no PipelineRow hint |
| `res/values/font_certs.xml` | NEW — only if build fails for missing certs |
