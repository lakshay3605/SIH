package com.example.hindisantali.ui.main

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hindisantali.theme.*

@Composable
fun WorksheetScreen(onBack: () -> Unit) {

    val sentences = listOf(
        Pair(
            "\u0915\u094d\u092f\u094b\u0902\u0915\u093f \u0924\u094d\u092f\u094b\u0939\u093e\u0930\u094b\u0902 \u0915\u0947 \u0938\u092e\u092f \u092c\u0939\u0941\u0924 \u092d\u0940\u0921\u093c \u0939\u094b\u0924\u0940 \u0939\u0948, \u0907\u0938\u0932\u093f\u090f \u0915\u0941\u091b \u092a\u094d\u0930\u0924\u093f\u092c\u0902\u0927 \u0939\u094b\u0924\u0947 \u0939\u0948\u0902\u0964",
            "\u1c6f\u1c5a\u1c68\u1c5a\u1c75 \u1c5a\u1c60\u1c5b\u1c6e \u1c5f\u1c6d\u1c62\u1c5f \u1c75\u1c77\u1c64\u1c72 \u1c65\u1c5f\u1c62\u1c72\u1c5f\u1c63 \u1c66\u1c69\u1c6d\u1c69\u1c5c\u1c7c\u1c5f \u1c5a\u1c71\u1c5f \u1c60\u1c5a \u1c62\u1c5f\u1c71\u1c5f\u1c75\u1c5f\u1c68\u1c5a\u1c71 \u1c60\u1c5a \u1c61\u1c5f\u1c79\u1c68\u1c64\u1c6d\u1c5f"
        ),
        Pair(
            "\u0915\u0908 \u0938\u093e\u0932\u094b\u0902 \u0915\u0947 \u092c\u093e\u0926 \u092a\u0941\u0930\u093e\u0928\u0947 \u0926\u094b\u0938\u094d\u0924 \u0939\u092e\u093e\u0930\u0947 \u0938\u093e\u0925 \u0935\u0930\u094d\u0915\u0906\u0909\u091f \u092e\u0947\u0902 \u0935\u093e\u092a\u0938 \u0906 \u0938\u0915\u0947, \u0907\u0938 \u0935\u091c\u0939 \u0938\u0947 \u092c\u0939\u0941\u0924 \u0905\u091a\u094d\u091b\u093e \u0932\u0917\u093e\u0964",
            "\u1c5f\u1c6d\u1c62\u1c5f \u1c65\u1c6e\u1c68\u1c62\u1c5f \u1c5b\u1c5f\u1c6d\u1c5a\u1c62 \u1c62\u1c5f\u1c68\u1c6e \u1c5c\u1c5f\u1c5b\u1c6e \u1c60\u1c5a \u1c5f\u1c5e\u1c6e \u1c65\u1c5f\u1c76 \u1c73\u1c63\u1c5f\u1c68\u1c60 \u1c5f\u1c79\u1c63\u1c69\u1c74 \u1c68\u1c6e \u1c66\u1c6e\u1c61 \u1c6b\u1c5f\u1c72\u1c6e\u1c6d\u1c5f\u1c60\u1c5f\u1c6b \u1c5f\u1c79\u1c70\u1c64 \u1c71\u1c5f\u1c6f\u1c5f\u1c6d \u1c5f\u1c74\u1c60\u1c5f\u1c68 \u1c6e\u1c71\u1c5f"
        ),
        Pair(
            "\u0939\u0930 \u0938\u093e\u0932 \u091c\u0928\u0935\u0930\u0940 \u092e\u0947\u0902 \u0915\u0949\u0932\u0947\u091c \u092e\u0947\u0902 \u0906\u0935\u0947\u0926\u0928 \u092a\u0924\u094d\u0930 \u091c\u092e\u093e \u0915\u093f\u090f \u091c\u093e\u0924\u0947 \u0939\u0948\u0902\u0964",
            "\u1c61\u1c5f\u1c63 \u1c65\u1c6e\u1c68\u1c62\u1c5f \u1c5c\u1c6e \u1c61\u1c5f\u1c71\u1c69\u1c63\u1c5f\u1c68\u1c64 \u1c68\u1c6e \u1c60\u1c5a\u1c5e\u1c6e\u1c61\u1c7d \u1c68\u1c6e \u1c5f\u1c79\u1c68\u1c61\u1c64 \u1c65\u1c5f\u1c60\u1c5f\u1c62 \u1c6b\u1c5a \u1c61\u1c5a\u1c62\u1c5f \u1c66\u1c5f\u1c5b\u1c5f\u1c5c\u1c7c\u1c5f"
        )
    )

    val blanks = listOf(
        "\u0924\u094d\u092f\u094b\u0939\u093e\u0930\u094b\u0902 \u0915\u0947 \u0938\u092e\u092f _____ \u0915\u094b \u0938\u0902\u092d\u093e\u0932\u0928\u093e \u092a\u0921\u093c\u0924\u093e \u0939\u0948\u0964",
        "\u0935\u0930\u094d\u0915\u0906\u0909\u091f \u092e\u0947\u0902 _____ \u0938\u093e\u0932\u094b\u0902 \u0915\u0947 \u092c\u093e\u0926 \u0926\u094b\u0938\u094d\u0924 \u0935\u093e\u092a\u0938 \u0906\u090f\u0964",
        "\u0915\u0949\u0932\u0947\u091c \u092e\u0947\u0902 _____ \u092e\u0947\u0902 \u0906\u0935\u0947\u0926\u0928 \u092a\u0924\u094d\u0930 \u091c\u092e\u093e \u0939\u094b\u0924\u0947 \u0939\u0948\u0902\u0964"
    )
    val answers = listOf("\u092d\u0940\u0921\u093c", "\u0915\u0908", "\u091c\u0928\u0935\u0930\u0940")

    var showAnswers by remember { mutableStateOf(false) }

    Box(Modifier.fillMaxSize().background(BgDeep)) {
        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = onBack) {
                    Text("\u2190 \u0935\u093e\u092a\u0938", color = Copper, fontSize = 14.sp)
                }
                Spacer(Modifier.weight(1f))
                Box(
                    Modifier.clip(RoundedCornerShape(8.dp))
                        .background(Sage.copy(alpha = 0.15f))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text("NIPUN \u092d\u093e\u0930\u0924", color = Sage, fontSize = 11.sp,
                        fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                }
            }

            Spacer(Modifier.height(12.dp))

            Text(
                "\u0926\u094d\u0935\u093f\u092d\u093e\u0937\u0940 \u0915\u093e\u0930\u094d\u092f\u092a\u0924\u094d\u0930\nBilingual Worksheet",
                color = TextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center, lineHeight = 28.sp
            )
            Text(
                "\u0939\u093f\u0902\u0926\u0940 \u2192 \u0938\u0902\u0925\u093e\u0932\u0940  |  Hindi \u2192 Santali (Ol Chiki)",
                color = TextSecondary, fontSize = 12.sp, letterSpacing = 0.5.sp,
                textAlign = TextAlign.Center
            )

            Spacer(Modifier.height(24.dp))

            // Section 1: Translation table
            SectionHeader("\u0905\u0928\u0941\u0935\u093e\u0926 \u0924\u093e\u0932\u093f\u0915\u093e  /  Translation Table")
            Spacer(Modifier.height(10.dp))

            // Table header
            Row(
                Modifier.fillMaxWidth().clip(RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp))
                    .background(Copper.copy(alpha = 0.25f)).padding(horizontal = 14.dp, vertical = 10.dp)
            ) {
                Text("\u0939\u093f\u0902\u0926\u0940", color = Copper, fontWeight = FontWeight.Bold,
                    fontSize = 13.sp, modifier = Modifier.weight(1f))
                Box(Modifier.width(1.dp).height(18.dp).background(BgCardBorder))
                Spacer(Modifier.width(12.dp))
                Text("\u0938\u0902\u0925\u093e\u0932\u0940 (Ol Chiki)", color = Sage,
                    fontWeight = FontWeight.Bold, fontSize = 13.sp, modifier = Modifier.weight(1f))
            }

            sentences.forEachIndexed { i, (hindi, santali) ->
                val bg = if (i % 2 == 0) BgCard else BgHighlight
                val isLast = i == sentences.size - 1
                val shape = if (isLast)
                    RoundedCornerShape(bottomStart = 12.dp, bottomEnd = 12.dp)
                else RoundedCornerShape(0.dp)
                Row(
                    Modifier.fillMaxWidth().clip(shape).background(bg)
                        .padding(horizontal = 14.dp, vertical = 12.dp)
                ) {
                    Text(hindi, color = TextPrimary, fontSize = 13.sp,
                        lineHeight = 20.sp, modifier = Modifier.weight(1f))
                    Box(Modifier.width(1.dp).fillMaxHeight().background(BgCardBorder))
                    Spacer(Modifier.width(12.dp))
                    Text(santali, color = TextPrimary, fontSize = 15.sp,
                        lineHeight = 22.sp, modifier = Modifier.weight(1f),
                        fontFamily = FontFamily.Default)
                }
            }

            Spacer(Modifier.height(28.dp))

            // Section 2: Fill in the blanks
            SectionHeader("\u0930\u093f\u0915\u094d\u0924 \u0938\u094d\u0925\u093e\u0928 \u092d\u0930\u0947\u0902  /  Fill in the Blanks")
            Spacer(Modifier.height(10.dp))

            blanks.forEachIndexed { i, q ->
                Box(
                    Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
                        .background(BgCard).border(1.dp, BgCardBorder, RoundedCornerShape(12.dp))
                        .padding(14.dp)
                ) {
                    Column {
                        Text("${i + 1}.  $q", color = TextPrimary, fontSize = 14.sp, lineHeight = 22.sp)
                        if (showAnswers) {
                            Spacer(Modifier.height(6.dp))
                            Text("\u0909\u0924\u094d\u0924\u0930: ${answers[i]}", color = Sage,
                                fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
                Spacer(Modifier.height(10.dp))
            }

            Spacer(Modifier.height(8.dp))
            Button(
                onClick = { showAnswers = !showAnswers },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = if (showAnswers) BgCardBorder else Amber),
                elevation = ButtonDefaults.buttonElevation(0.dp)
            ) {
                Text(
                    if (showAnswers) "\u0909\u0924\u094d\u0924\u0930 \u091b\u0941\u092a\u093e\u090f\u0902  /  Hide Answers"
                    else "\u0909\u0924\u094d\u0924\u0930 \u0926\u0947\u0916\u0947\u0902  /  Show Answers",
                    color = if (showAnswers) TextHint else TextPrimary,
                    fontWeight = FontWeight.SemiBold, fontSize = 14.sp
                )
            }

            Spacer(Modifier.height(28.dp))

            // NIPUN outcomes
            SectionHeader("NIPUN \u0932\u0915\u094d\u0937\u094d\u092f  /  Learning Outcomes")
            Spacer(Modifier.height(10.dp))
            val outcomes = listOf(
                "\u092e\u0942\u0932\u092d\u0942\u0924 \u092a\u0920\u0928 \u0915\u094c\u0936\u0932  /  Foundational reading skills",
                "\u092a\u0930\u093f\u0935\u0947\u0936 \u0938\u0947 \u0938\u0902\u092c\u0902\u0927  /  Context comprehension",
                "\u0926\u094d\u0935\u093f\u092d\u093e\u0937\u0940 \u0936\u092c\u094d\u0926\u093e\u0935\u0932\u0940  /  Bilingual vocabulary"
            )
            outcomes.forEach { outcome ->
                Row(
                    Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(Modifier.size(8.dp).clip(androidx.compose.foundation.shape.CircleShape)
                        .background(Sage.copy(alpha = 0.7f)))
                    Spacer(Modifier.width(12.dp))
                    Text(outcome, color = TextSecondary, fontSize = 13.sp, lineHeight = 20.sp)
                }
            }
            Spacer(Modifier.height(32.dp))
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.height(1.dp).weight(1f).background(BgCardBorder))
        Spacer(Modifier.width(10.dp))
        Text(title, color = Copper, fontSize = 11.sp, fontWeight = FontWeight.Bold,
            letterSpacing = 0.8.sp, textAlign = TextAlign.Center)
        Spacer(Modifier.width(10.dp))
        Box(Modifier.height(1.dp).weight(1f).background(BgCardBorder))
    }
}