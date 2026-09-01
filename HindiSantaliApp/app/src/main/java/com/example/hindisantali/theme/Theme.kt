package com.example.hindisantali.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val SohraiColorScheme = darkColorScheme(
    primary       = Sage,
    secondary     = Copper,
    tertiary      = Amber,
    background    = BgDeep,
    surface       = BgCard,
    onPrimary     = BgDeep,
    onSecondary   = BgDeep,
    onBackground  = TextPrimary,
    onSurface     = TextPrimary,
    error         = Brick,
    onError       = TextPrimary,
)

@Composable
fun HindiSantaliTheme(content: @Composable () -> Unit) {
    // Dynamic color intentionally disabled — we own every pixel.
    MaterialTheme(
        colorScheme = SohraiColorScheme,
        typography  = Typography,
        content     = content,
    )
}
