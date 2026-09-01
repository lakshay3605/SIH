package com.example.hindisantali.ui.main

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel

// ─── Colour palette ───────────────────────────────────────────────────────────
private val BgDeep        = Color(0xFF0A0E1A)
private val BgCard        = Color(0xFF141929)
private val BgCardBorder  = Color(0xFF1E2A45)
private val AccentBlue    = Color(0xFF3B82F6)
private val AccentPurple  = Color(0xFF8B5CF6)
private val AccentGreen   = Color(0xFF22C55E)
private val AccentOrange  = Color(0xFFF59E0B)
private val AccentRed     = Color(0xFFEF4444)
private val TextPrimary   = Color(0xFFF1F5F9)
private val TextSecondary = Color(0xFF94A3B8)
private val TextHint      = Color(0xFF475569)

// ─── Main Screen ─────────────────────────────────────────────────────────────

@Composable
fun MainScreen(
    viewModel: MainScreenViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) { viewModel.checkModelsReady() }

    // Show download prompt if models are not present
    if (!uiState.modelsReady) {
        ModelDownloadPrompt(
            uiState = uiState,
            onDownload = { viewModel.downloadModels() }
        )
        return
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDeep)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // ── Header ───────────────────────────────────────────────────────
            AppHeader(isOffline = uiState.isOffline)

            Spacer(Modifier.height(28.dp))

            // ── Mic Button ───────────────────────────────────────────────────
            MicButton(
                stage = uiState.stage,
                onPressStart = { viewModel.startRecording() },
                onPressEnd   = { viewModel.stopRecordingAndProcess() }
            )

            Spacer(Modifier.height(8.dp))

            // Stage hint text
            StageHint(stage = uiState.stage)

            Spacer(Modifier.height(28.dp))

            // ── Hindi Output ─────────────────────────────────────────────────
            OutputCard(
                label        = "🎤  Recognized Hindi",
                labelColor   = AccentBlue,
                content      = uiState.hindiText,
                placeholder  = "Your Hindi speech will appear here...",
                isLoading    = uiState.stage == PipelineStage.TRANSCRIBING,
            )

            Spacer(Modifier.height(16.dp))

            // ── Santali Output ───────────────────────────────────────────────
            OutputCard(
                label       = "🗣  Santali — ᱚᱞ ᱪᱤᱠᱤ",
                labelColor  = AccentPurple,
                content     = uiState.santaliText,
                placeholder = "Santali (Ol Chiki) translation will appear here...",
                isLoading   = uiState.stage == PipelineStage.TRANSLATING,
                isSantali   = true,
            )

            Spacer(Modifier.height(16.dp))

            // ── Play Button ──────────────────────────────────────────────────
            PlayButton(
                enabled   = uiState.audioFilePath != null,
                isPlaying = uiState.isPlaying,
                onPlay    = { viewModel.playAudio() },
                onStop    = { viewModel.stopAudio() },
            )

            Spacer(Modifier.height(20.dp))

            // ── Latency Card ─────────────────────────────────────────────────
            if (uiState.latency.totalMs > 0) {
                LatencyCard(latency = uiState.latency)
                Spacer(Modifier.height(16.dp))
            }

            // ── Error Banner ─────────────────────────────────────────────────
            uiState.errorMessage?.let { msg ->
                ErrorBanner(message = msg, onDismiss = { viewModel.clearError() })
                Spacer(Modifier.height(16.dp))
            }

            Spacer(Modifier.height(16.dp))

            // ── Footer ───────────────────────────────────────────────────────
            Text(
                text = "Powered by IndicTrans2 · SherpaOnnx · Indic TTS\nAll inference runs on-device",
                style = MaterialTheme.typography.bodySmall,
                color = TextHint,
                textAlign = TextAlign.Center,
                lineHeight = 18.sp,
            )
        }
    }
}

@Composable
private fun ModelDownloadPrompt(
    uiState: MainUiState,
    onDownload: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDeep)
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text("🌐 First Launch Setup", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
        Spacer(Modifier.height(12.dp))
        Text(
            text = "Three AI models need to be downloaded once over WiFi:\n\n" +
                   "• Hindi ASR model (~196MB)\n" +
                   "• Translation model (~200MB)\n" +
                   "• Santali TTS voice model (~50MB)\n\n" +
                   "Total: ~450MB. After this, the app works 100% offline.",
            color = TextSecondary,
            textAlign = TextAlign.Center,
            lineHeight = 22.sp,
        )
        Spacer(Modifier.height(24.dp))
        
        if (uiState.isDownloading) {
            Text(
                text = uiState.downloadStatusText,
                color = AccentBlue,
                fontSize = 14.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            LinearProgressIndicator(
                progress = { uiState.downloadProgress },
                modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                color = AccentBlue,
                trackColor = AccentBlue.copy(alpha = 0.2f),
            )
            Spacer(Modifier.height(24.dp))
        } else {
            Button(
                onClick = onDownload,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AccentBlue),
            ) {
                Text("⬇  Download All Models (~450MB)", color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
        
        // Show any error that happened during download
        uiState.errorMessage?.let {
            Spacer(Modifier.height(16.dp))
            Text(text = "Error: $it", color = AccentRed, fontSize = 13.sp, textAlign = TextAlign.Center)
        }
    }
}


// ─── App Header ──────────────────────────────────────────────────────────────

@Composable
private fun AppHeader(isOffline: Boolean) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = "हिंदी → ᱥᱟᱱᱛᱟᱲᱤ",
            fontSize = 26.sp,
            fontWeight = FontWeight.ExtraBold,
            color = TextPrimary,
            textAlign = TextAlign.Center,
        )
        Text(
            text = "Hindi → Santali Voice Translator",
            fontSize = 13.sp,
            color = TextSecondary,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(10.dp))
        OfflineBadge(isOffline = isOffline)
    }
}

@Composable
private fun OfflineBadge(isOffline: Boolean) {
    val color  = if (isOffline) AccentGreen else AccentOrange
    val label  = if (isOffline) "● OFFLINE — No Internet Needed" else "○ ONLINE MODE"
    Surface(
        shape  = RoundedCornerShape(20.dp),
        color  = color.copy(alpha = 0.15f),
        border = androidx.compose.foundation.BorderStroke(1.dp, color.copy(alpha = 0.5f)),
    ) {
        Text(
            text     = label,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 5.dp),
            color    = color,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
        )
    }
}

// ─── Mic Button ──────────────────────────────────────────────────────────────

@Composable
private fun MicButton(
    stage: PipelineStage,
    onPressStart: () -> Unit,
    onPressEnd: () -> Unit,
) {
    val isRecording = stage == PipelineStage.RECORDING
    val isBusy      = stage != PipelineStage.IDLE && stage != PipelineStage.RECORDING && stage != PipelineStage.ERROR

    // Pulsing animation when recording
    val pulseAnim = rememberInfiniteTransition(label = "pulse")
    val pulseScale by pulseAnim.animateFloat(
        initialValue = 1f, targetValue = 1.12f,
        animationSpec = infiniteRepeatable(
            tween(600, easing = FastOutSlowInEasing),
            RepeatMode.Reverse
        ),
        label = "pulseScale"
    )

    val bgColor by animateColorAsState(
        targetValue = when {
            isRecording -> AccentRed
            isBusy      -> AccentOrange
            else        -> AccentBlue
        },
        label = "micBg"
    )

    val scale = if (isRecording) pulseScale else 1f

    Box(contentAlignment = Alignment.Center) {
        // Outer glow ring when recording
        if (isRecording) {
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .scale(scale)
                    .clip(CircleShape)
                    .background(AccentRed.copy(alpha = 0.25f))
            )
        }

        // Mic button
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(96.dp)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = listOf(bgColor, bgColor.copy(alpha = 0.7f))
                    )
                )
                .pointerInput(isBusy) {
                    if (!isBusy) {
                        detectTapGestures(
                            onPress = {
                                onPressStart()
                                tryAwaitRelease()
                                onPressEnd()
                            }
                        )
                    }
                }
        ) {
            Text(
                text = if (isRecording) "⏹" else "🎙",
                fontSize = 36.sp,
                color = Color.White,
            )
        }
    }
}

// ─── Stage Hint ──────────────────────────────────────────────────────────────

@Composable
private fun StageHint(stage: PipelineStage) {
    val (text, color) = when (stage) {
        PipelineStage.IDLE         -> "Hold mic to speak Hindi" to TextHint
        PipelineStage.RECORDING    -> "🔴  Recording… release to process" to AccentRed
        PipelineStage.TRANSCRIBING -> "⚙  Recognising Hindi speech…" to AccentBlue
        PipelineStage.TRANSLATING  -> "⚙  Translating to Santali…" to AccentPurple
        PipelineStage.SYNTHESIZING -> "⚙  Generating Santali audio…" to AccentOrange
        PipelineStage.PLAYING      -> "🔊  Playing Santali audio…" to AccentGreen
        PipelineStage.ERROR        -> "Something went wrong" to AccentRed
    }
    Text(text = text, color = color, fontSize = 13.sp, fontWeight = FontWeight.Medium)
}

// ─── Output Card ─────────────────────────────────────────────────────────────

@Composable
private fun OutputCard(
    label: String,
    labelColor: Color,
    content: String,
    placeholder: String,
    isLoading: Boolean,
    isSantali: Boolean = false,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape    = RoundedCornerShape(16.dp),
        color    = BgCard,
        border   = androidx.compose.foundation.BorderStroke(1.dp, BgCardBorder),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text       = label,
                color      = labelColor,
                fontSize   = 12.sp,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(Modifier.height(8.dp))

            if (isLoading) {
                LinearProgressIndicator(
                    modifier = Modifier.fillMaxWidth().height(3.dp).clip(RoundedCornerShape(2.dp)),
                    color    = labelColor,
                    trackColor = labelColor.copy(alpha = 0.2f),
                )
                Spacer(Modifier.height(8.dp))
            }

            Text(
                text       = content.ifBlank { placeholder },
                color      = if (content.isBlank()) TextHint else TextPrimary,
                fontSize   = if (isSantali) 20.sp else 16.sp,
                fontFamily = if (isSantali) FontFamily.Default else FontFamily.Default,
                lineHeight = if (isSantali) 30.sp else 24.sp,
                minLines   = 2,
            )
        }
    }
}

// ─── Play Button ─────────────────────────────────────────────────────────────

@Composable
private fun PlayButton(
    enabled: Boolean,
    isPlaying: Boolean,
    onPlay: () -> Unit,
    onStop: () -> Unit,
) {
    Button(
        onClick  = { if (isPlaying) onStop() else onPlay() },
        enabled  = enabled,
        modifier = Modifier.fillMaxWidth().height(52.dp),
        shape    = RoundedCornerShape(14.dp),
        colors   = ButtonDefaults.buttonColors(
            containerColor = if (isPlaying) AccentOrange else AccentGreen,
            disabledContainerColor = TextHint.copy(alpha = 0.3f),
        ),
    ) {
        Text(
            text       = if (isPlaying) "⏹  Stop Audio" else "▶  Play Santali Audio",
            color      = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize   = 15.sp,
        )
    }
}

// ─── Latency Card ────────────────────────────────────────────────────────────

@Composable
private fun LatencyCard(latency: LatencyBreakdown) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape    = RoundedCornerShape(16.dp),
        color    = BgCard,
        border   = androidx.compose.foundation.BorderStroke(1.dp, BgCardBorder),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text       = "⏱  Latency Breakdown",
                color      = AccentGreen,
                fontSize   = 12.sp,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(Modifier.height(10.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                LatencyItem("ASR",         latency.asrMs,         AccentBlue)
                LatencyItem("Translation", latency.translationMs, AccentPurple)
                LatencyItem("TTS",         latency.ttsMs,         AccentOrange)
                LatencyItem("Total",       latency.totalMs,       AccentGreen)
            }
        }
    }
}

@Composable
private fun LatencyItem(label: String, ms: Long, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text       = "${ms}ms",
            color      = color,
            fontSize   = 15.sp,
            fontWeight = FontWeight.Bold,
        )
        Text(text = label, color = TextSecondary, fontSize = 11.sp)
    }
}

// ─── Error Banner ────────────────────────────────────────────────────────────

@Composable
private fun ErrorBanner(message: String, onDismiss: () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape    = RoundedCornerShape(12.dp),
        color    = AccentRed.copy(alpha = 0.12f),
        border   = androidx.compose.foundation.BorderStroke(1.dp, AccentRed.copy(alpha = 0.4f)),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text     = "⚠  $message",
                color    = AccentRed,
                fontSize = 13.sp,
                modifier = Modifier.weight(1f),
            )
            TextButton(onClick = onDismiss) {
                Text("Dismiss", color = AccentRed, fontSize = 12.sp)
            }
        }
    }
}
