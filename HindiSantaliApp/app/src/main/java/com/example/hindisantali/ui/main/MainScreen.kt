package com.example.hindisantali.ui.main

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.hindisantali.theme.*

// ─── Main Screen ──────────────────────────────────────────────────────────────

@Composable
fun MainScreen(viewModel: MainScreenViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    LaunchedEffect(Unit) { viewModel.checkModelsReady() }

    if (!uiState.modelsReady) {
        ModelDownloadScreen(uiState = uiState, onDownload = { viewModel.downloadModels() })
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
                .padding(horizontal = 24.dp, vertical = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            AppHeader(isOffline = uiState.isOffline)
            Spacer(Modifier.height(36.dp))
            MicSection(
                stage        = uiState.stage,
                onPressStart = { viewModel.startRecording() },
                onPressEnd   = { viewModel.stopRecordingAndProcess() }
            )
            Spacer(Modifier.height(32.dp))
            PipelineStepRow(stage = uiState.stage)
            Spacer(Modifier.height(28.dp))
            OutputCard(
                label       = "HINDI",
                accentColor = Copper,
                content     = uiState.hindiText,
                placeholder = "Your spoken Hindi will appear here\u2026",
                isLoading   = uiState.stage == PipelineStage.TRANSCRIBING,
            )
            Spacer(Modifier.height(14.dp))
            ChevronDivider()
            Spacer(Modifier.height(14.dp))
            OutputCard(
                label       = "SANTALI  \u1C1A\u1C1E \u1C04\u1C64\u1C40\u1C64",
                accentColor = Sage,
                content     = uiState.santaliText,
                placeholder = "Santali translation in Ol Chiki will appear here\u2026",
                isLoading   = uiState.stage == PipelineStage.TRANSLATING,
                isSantali   = true,
                bgColor     = BgHighlight,
            )
            Spacer(Modifier.height(24.dp))
            PlayButton(
                enabled   = uiState.audioFilePath != null,
                isPlaying = uiState.isPlaying,
                onPlay    = { viewModel.playAudio() },
                onStop    = { viewModel.stopAudio() },
            )
            Spacer(Modifier.height(20.dp))
            AnimatedVisibility(
                visible = uiState.latency.totalMs > 0,
                enter   = fadeIn() + expandVertically(),
                exit    = fadeOut() + shrinkVertically()
            ) {
                LatencyStrip(latency = uiState.latency)
            }
            uiState.errorMessage?.let { msg ->
                Spacer(Modifier.height(16.dp))
                ErrorBanner(message = msg, onDismiss = { viewModel.clearError() })
            }
            Spacer(Modifier.height(24.dp))
            Text(
                text          = "All inference runs on-device \u00B7 No cloud required",
                color         = TextHint,
                fontSize      = 11.sp,
                letterSpacing = 0.5.sp,
                textAlign     = TextAlign.Center,
            )
        }
    }
}

// ─── App Header ───────────────────────────────────────────────────────────────

@Composable
private fun AppHeader(isOffline: Boolean) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text          = "\u0939\u093F\u0902\u0926\u0940 \u2192 \u1C25\u1C5F\u1C6C\u1C71\u1C60\u1C6C\u1C5E\u1C64",
            fontSize      = 28.sp,
            fontWeight    = FontWeight.Bold,
            fontFamily    = FontFamily.Serif,
            color         = TextPrimary,
            letterSpacing = 0.sp,
            textAlign     = TextAlign.Center,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            text          = "Hindi \u00B7 Santali Voice Translator",
            fontSize      = 12.sp,
            color         = TextSecondary,
            letterSpacing = 1.5.sp,
            textAlign     = TextAlign.Center,
        )
        Spacer(Modifier.height(12.dp))
        Row(
            verticalAlignment     = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            HorizontalRule(width = 32.dp)
            Spacer(Modifier.width(10.dp))
            OfflineBadge(isOffline = isOffline)
            Spacer(Modifier.width(10.dp))
            HorizontalRule(width = 32.dp)
        }
    }
}

@Composable
private fun HorizontalRule(width: Dp) {
    Box(
        modifier = Modifier
            .width(width)
            .height(1.dp)
            .background(BgCardBorder)
    )
}

@Composable
private fun OfflineBadge(isOffline: Boolean) {
    val badgeColor = if (isOffline) Sage else Amber
    val badgeText  = if (isOffline) "OFFLINE" else "ONLINE"
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(badgeColor.copy(alpha = 0.12f))
            .border(1.dp, badgeColor.copy(alpha = 0.35f), RoundedCornerShape(20.dp))
            .padding(horizontal = 12.dp, vertical = 4.dp)
    ) {
        Text(
            text          = badgeText,
            color         = badgeColor,
            fontSize      = 10.sp,
            fontWeight    = FontWeight.Bold,
            letterSpacing = 1.5.sp,
        )
    }
}

// ─── Mic Section ──────────────────────────────────────────────────────────────

@Composable
private fun MicSection(
    stage: PipelineStage,
    onPressStart: () -> Unit,
    onPressEnd: () -> Unit,
) {
    val isRecording = stage == PipelineStage.RECORDING
    val isBusy      = stage != PipelineStage.IDLE &&
                      stage != PipelineStage.RECORDING &&
                      stage != PipelineStage.ERROR

    val micColor by animateColorAsState(
        targetValue = when {
            isRecording -> Brick
            isBusy      -> Amber
            else        -> Copper
        },
        animationSpec = tween(400),
        label = "micColor"
    )

    val pulseInfinite = rememberInfiniteTransition(label = "pulse")
    val pulseScale by pulseInfinite.animateFloat(
        initialValue  = 1f,
        targetValue   = 1.18f,
        animationSpec = infiniteRepeatable(tween(700, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label         = "pulseScale"
    )

    Box(contentAlignment = Alignment.Center, modifier = Modifier.size(140.dp)) {
        AnimatedVisibility(visible = isRecording, enter = fadeIn(), exit = fadeOut()) {
            Box(
                modifier = Modifier
                    .size(138.dp)
                    .scale(pulseScale)
                    .clip(CircleShape)
                    .background(Brick.copy(alpha = 0.18f))
            )
        }
        AnimatedVisibility(visible = isBusy, enter = fadeIn(), exit = fadeOut()) {
            Box(
                modifier = Modifier
                    .size(118.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.sweepGradient(
                            listOf(Amber.copy(alpha = 0.25f), Amber.copy(alpha = 0.05f))
                        )
                    )
            )
        }
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(96.dp)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = listOf(micColor.copy(alpha = 0.95f), micColor.copy(alpha = 0.65f))
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
                text     = when {
                    isRecording -> "\u23F9"
                    isBusy      -> "\u2699"
                    else        -> "\uD83C\uDF99"
                },
                fontSize = 32.sp,
                color    = TextPrimary,
            )
        }
    }
}

// ─── Pipeline Step Row ────────────────────────────────────────────────────────

private val pipelineSteps = listOf(
    PipelineStage.RECORDING    to "Listen",
    PipelineStage.TRANSCRIBING to "Recognise",
    PipelineStage.TRANSLATING  to "Translate",
    PipelineStage.SYNTHESIZING to "Speak",
)

@Composable
private fun PipelineStepRow(stage: PipelineStage) {
    val activeIndex = pipelineSteps.indexOfFirst { it.first == stage }

    Row(
        modifier              = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment     = Alignment.CenterVertically,
    ) {
        pipelineSteps.forEachIndexed { i, (_, label) ->
            val isActive = i == activeIndex
            val isPast   = activeIndex >= 0 && i < activeIndex

            val dotColor by animateColorAsState(
                targetValue   = when { isActive -> Amber; isPast -> Sage; else -> BgCardBorder },
                animationSpec = tween(300),
                label         = "dotColor$i"
            )
            val textColor by animateColorAsState(
                targetValue   = when { isActive -> Amber; isPast -> Sage.copy(alpha = 0.7f); else -> TextHint },
                animationSpec = tween(300),
                label         = "textColor$i"
            )

            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Box(
                    modifier = Modifier
                        .size(if (isActive) 10.dp else 6.dp)
                        .clip(CircleShape)
                        .background(dotColor)
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text          = label,
                    fontSize      = 10.sp,
                    color         = textColor,
                    fontWeight    = if (isActive) FontWeight.SemiBold else FontWeight.Normal,
                    letterSpacing = 0.5.sp,
                )
            }

            if (i < pipelineSteps.size - 1) {
                Box(
                    modifier = Modifier
                        .padding(horizontal = 6.dp, vertical = 3.dp)
                        .width(28.dp)
                        .height(1.dp)
                        .background(if (isPast || isActive) Sage.copy(alpha = 0.4f) else BgCardBorder)
                )
            }
        }
    }

    if (stage == PipelineStage.IDLE || stage == PipelineStage.ERROR) {
        Spacer(Modifier.height(6.dp))
        Text(
            text      = if (stage == PipelineStage.ERROR) "Something went wrong \u2014 try again"
                        else "Hold the mic button and speak Hindi",
            color     = if (stage == PipelineStage.ERROR) Brick else TextHint,
            fontSize  = 12.sp,
            textAlign = TextAlign.Center,
        )
    }
}

// ─── Chevron Divider ─────────────────────────────────────────────────────────

@Composable
private fun ChevronDivider() {
    Row(
        modifier              = Modifier.fillMaxWidth(),
        verticalAlignment     = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
    ) {
        Box(Modifier.weight(1f).height(1.dp).background(BgCardBorder))
        Spacer(Modifier.width(10.dp))
        Text(text = "\u2193", color = TextHint, fontSize = 14.sp)
        Spacer(Modifier.width(10.dp))
        Box(Modifier.weight(1f).height(1.dp).background(BgCardBorder))
    }
}

// ─── Output Card ──────────────────────────────────────────────────────────────

@Composable
private fun OutputCard(
    label: String,
    accentColor: Color,
    content: String,
    placeholder: String,
    isLoading: Boolean,
    isSantali: Boolean = false,
    bgColor: Color = BgCard,
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(bgColor)
            .border(1.dp, BgCardBorder, RoundedCornerShape(18.dp))
    ) {
        Box(
            modifier = Modifier
                .align(Alignment.CenterStart)
                .width(3.dp)
                .fillMaxHeight()
                .clip(RoundedCornerShape(topStart = 18.dp, bottomStart = 18.dp))
                .background(accentColor.copy(alpha = 0.6f))
        )
        Column(modifier = Modifier.padding(start = 20.dp, end = 16.dp, top = 14.dp, bottom = 16.dp)) {
            Text(
                text          = label,
                color         = accentColor,
                fontSize      = 10.sp,
                fontWeight    = FontWeight.Bold,
                letterSpacing = 1.8.sp,
            )
            Spacer(Modifier.height(6.dp))
            if (isLoading) {
                LinearProgressIndicator(
                    modifier   = Modifier.fillMaxWidth().height(2.dp).clip(RoundedCornerShape(1.dp)),
                    color      = accentColor,
                    trackColor = accentColor.copy(alpha = 0.15f),
                    strokeCap  = StrokeCap.Round,
                )
                Spacer(Modifier.height(8.dp))
            }
            AnimatedContent(
                targetState  = content,
                transitionSpec = { fadeIn(tween(300)) togetherWith fadeOut(tween(200)) },
                label        = "cardText"
            ) { displayText ->
                Text(
                    text       = displayText.ifBlank { placeholder },
                    color      = if (displayText.isBlank()) TextHint else TextPrimary,
                    fontSize   = if (isSantali) 22.sp else 17.sp,
                    lineHeight = if (isSantali) 34.sp else 26.sp,
                    fontFamily = FontFamily.Default,
                    minLines   = 2,
                )
            }
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
    val btnColor by animateColorAsState(
        targetValue   = if (isPlaying) Brick else Sage,
        animationSpec = tween(300),
        label         = "playBtnColor"
    )
    Button(
        onClick   = { if (isPlaying) onStop() else onPlay() },
        enabled   = enabled,
        modifier  = Modifier.widthIn(min = 200.dp).height(52.dp),
        shape     = RoundedCornerShape(26.dp),
        colors    = ButtonDefaults.buttonColors(
            containerColor         = btnColor,
            disabledContainerColor = BgCardBorder,
        ),
        elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp),
    ) {
        Text(
            text          = if (isPlaying) "\u25A0  Stop" else "\u25B6  Play Santali",
            color         = if (enabled) TextPrimary else TextHint,
            fontWeight    = FontWeight.SemiBold,
            fontSize      = 14.sp,
            letterSpacing = 0.5.sp,
        )
    }
}

// ─── Latency Strip ───────────────────────────────────────────────────────────

@Composable
private fun LatencyStrip(latency: LatencyBreakdown) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(BgCard)
            .border(1.dp, BgCardBorder, RoundedCornerShape(14.dp))
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        Column {
            Text(
                text          = "LATENCY",
                color         = TextHint,
                fontSize      = 10.sp,
                letterSpacing = 1.5.sp,
                fontWeight    = FontWeight.Bold,
            )
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                LatencyItem("ASR",         latency.asrMs,         Copper)
                LatencyItem("Translation", latency.translationMs, Amber)
                LatencyItem("TTS",         latency.ttsMs,         Sage)
                LatencyItem("Total",       latency.totalMs,       TextPrimary)
            }
        }
    }
}

@Composable
private fun LatencyItem(label: String, ms: Long, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = "${ms}ms", color = color, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
        Spacer(Modifier.height(2.dp))
        Text(text = label, color = TextHint, fontSize = 10.sp, letterSpacing = 0.8.sp)
    }
}

// ─── Error Banner ─────────────────────────────────────────────────────────────

@Composable
private fun ErrorBanner(message: String, onDismiss: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Brick.copy(alpha = 0.10f))
            .border(1.dp, Brick.copy(alpha = 0.35f), RoundedCornerShape(14.dp))
            .padding(horizontal = 14.dp, vertical = 10.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text       = message,
                color      = Brick,
                fontSize   = 13.sp,
                modifier   = Modifier.weight(1f),
                lineHeight = 20.sp,
            )
            Spacer(Modifier.width(8.dp))
            TextButton(onClick = onDismiss, contentPadding = PaddingValues(0.dp)) {
                Text("\u2715", color = Brick.copy(alpha = 0.7f), fontSize = 14.sp)
            }
        }
    }
}

// ─── Model Download Screen ────────────────────────────────────────────────────

@Composable
private fun ModelDownloadScreen(uiState: MainUiState, onDownload: () -> Unit) {
    Box(
        modifier           = Modifier.fillMaxSize().background(BgDeep),
        contentAlignment   = Alignment.Center,
    ) {
        Column(
            modifier              = Modifier.fillMaxWidth().padding(32.dp),
            horizontalAlignment   = Alignment.CenterHorizontally,
        ) {
            Text(
                text       = "\u0939\u093F\u0902\u0926\u0940 \u2192 \u1C25\u1C5F\u1C6C\u1C71\u1C60\u1C6C\u1C5E\u1C64",
                fontSize   = 30.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                color      = TextPrimary,
                textAlign  = TextAlign.Center,
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text          = "Hindi \u00B7 Santali Voice Translator",
                fontSize      = 12.sp,
                color         = TextSecondary,
                letterSpacing = 1.5.sp,
                textAlign     = TextAlign.Center,
            )
            Spacer(Modifier.height(36.dp))
            ModelDownloadItem(
                title    = "Hindi Speech Recognition",
                subtitle = "Understands spoken Hindi \u2014 runs fully on-device",
                size     = "~196 MB",
                color    = Copper,
            )
            Spacer(Modifier.height(12.dp))
            ModelDownloadItem(
                title    = "Hindi \u2192 Santali Translation",
                subtitle = "IndicTrans2 neural translation model",
                size     = "~200 MB",
                color    = Amber,
            )
            Spacer(Modifier.height(12.dp))
            ModelDownloadItem(
                title    = "Santali Text-to-Speech",
                subtitle = "Speaks back the Santali translation",
                size     = "~50 MB",
                color    = Sage,
            )
            Spacer(Modifier.height(32.dp))
            if (uiState.isDownloading) {
                Text(
                    text       = uiState.downloadStatusText,
                    color      = Amber,
                    fontSize   = 13.sp,
                    textAlign  = TextAlign.Center,
                    lineHeight = 20.sp,
                )
                Spacer(Modifier.height(12.dp))
                LinearProgressIndicator(
                    progress   = { uiState.downloadProgress },
                    modifier   = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                    color      = Amber,
                    trackColor = Amber.copy(alpha = 0.15f),
                    strokeCap  = StrokeCap.Round,
                )
            } else {
                Button(
                    onClick   = onDownload,
                    modifier  = Modifier.fillMaxWidth().height(54.dp),
                    shape     = RoundedCornerShape(18.dp),
                    colors    = ButtonDefaults.buttonColors(containerColor = Copper),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp),
                ) {
                    Text(
                        text          = "Download All Models  (~450 MB)",
                        color         = TextPrimary,
                        fontWeight    = FontWeight.SemiBold,
                        fontSize      = 14.sp,
                        letterSpacing = 0.3.sp,
                    )
                }
            }
            uiState.errorMessage?.let {
                Spacer(Modifier.height(16.dp))
                Text(text = it, color = Brick, fontSize = 13.sp, textAlign = TextAlign.Center, lineHeight = 20.sp)
            }
            Spacer(Modifier.height(24.dp))
            Text(
                text          = "After this one-time download, the app works with no internet.",
                color         = TextHint,
                fontSize      = 11.sp,
                textAlign     = TextAlign.Center,
                lineHeight    = 17.sp,
                letterSpacing = 0.3.sp,
            )
        }
    }
}

@Composable
private fun ModelDownloadItem(title: String, subtitle: String, size: String, color: Color) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(BgCard)
            .border(1.dp, BgCardBorder, RoundedCornerShape(14.dp))
    ) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(color.copy(alpha = 0.7f)))
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) {
                Text(text = title, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                Spacer(Modifier.height(2.dp))
                Text(text = subtitle, color = TextSecondary, fontSize = 11.sp, lineHeight = 16.sp)
            }
            Spacer(Modifier.width(10.dp))
            Text(text = size, color = TextHint, fontSize = 11.sp, letterSpacing = 0.3.sp)
        }
    }
}
