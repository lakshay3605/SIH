package com.example.hindisantali.ui.main

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hindisantali.theme.*

@Composable
fun FlashcardScreen(onBack: () -> Unit) {

    data class Card(val hindi: String, val meaning: String, val santali: String, val category: String)

    val cards = listOf(
        Card("\u092d\u0940\u0921\u093c",        "crowd",      "\u1c75\u1c77\u1c64\u1c72",                      "\u0936\u092c\u094d\u0926"),
        Card("\u0924\u094d\u092f\u094b\u0939\u093e\u0930", "festival",   "\u1c6f\u1c5a\u1c68\u1c5a\u1c75",            "\u0936\u092c\u094d\u0926"),
        Card("\u092a\u094d\u0930\u0924\u093f\u092c\u0902\u0927","restriction","\u1c62\u1c5f\u1c71\u1c5f\u1c75\u1c5f\u1c68\u1c5a\u1c71",  "\u0936\u092c\u094d\u0926"),
        Card("\u0905\u0927\u093f\u0915\u093e\u0930\u0940", "official",   "\u1c5f\u1c79\u1c62\u1c5f\u1c79\u1c5e\u1c64\u1c6d\u1c5f\u1c79",  "\u0936\u092c\u094d\u0926"),
        Card("\u0935\u0930\u094d\u0915\u0906\u0909\u091f", "workout",    "\u1c73\u1c63\u1c5f\u1c68\u1c60 \u1c5f\u1c79\u1c63\u1c69\u1c74", "\u0936\u092c\u094d\u0926"),
        Card("\u091c\u0928\u0935\u0930\u0940",   "January",   "\u1c61\u1c5f\u1c71\u1c69\u1c63\u1c5f\u1c68\u1c64",   "\u092e\u0939\u0940\u0928\u093e"),
        Card("\u0906\u0935\u0947\u0926\u0928",   "application","\u1c5f\u1c79\u1c68\u1c61\u1c64 \u1c65\u1c5f\u1c60\u1c5f\u1c62", "\u0936\u092c\u094d\u0926"),
        Card("\u0935\u093f\u0926\u094d\u092f\u093e\u0932\u092f", "school","\u1c64\u1c65\u1c60\u1c5a\u1c5e",              "\u0938\u0902\u0938\u094d\u0925\u093e")
    )

    var index  by remember { mutableStateOf(0) }
    var flipped by remember { mutableStateOf(false) }

    val rotation by animateFloatAsState(
        targetValue   = if (flipped) 180f else 0f,
        animationSpec = tween(400, easing = FastOutSlowInEasing),
        label         = "flip"
    )

    // Reset flip when card changes
    LaunchedEffect(index) { flipped = false }

    Box(Modifier.fillMaxSize().background(BgDeep)) {
        Column(
            Modifier.fillMaxSize().padding(horizontal = 24.dp, vertical = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = onBack) {
                    Text("\u2190 \u0935\u093e\u092a\u0938", color = Copper, fontSize = 14.sp)
                }
                Spacer(Modifier.weight(1f))
                Text("${index + 1} / ${cards.size}", color = TextHint, fontSize = 13.sp)
            }

            Spacer(Modifier.height(8.dp))

            Text("\u090c\u0915\u094d\u0937\u093e \u0915\u093e\u0930\u094d\u0921  /  Flashcards",
                color = TextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center)
            Text("\u0936\u092c\u094d\u0926 \u092d\u0902\u0921\u093e\u0930  |  Vocabulary",
                color = TextSecondary, fontSize = 12.sp, letterSpacing = 0.5.sp)

            Spacer(Modifier.height(32.dp))

            // Progress dots
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                cards.forEachIndexed { i, _ ->
                    Box(
                        Modifier.size(if (i == index) 10.dp else 6.dp)
                            .clip(CircleShape)
                            .background(if (i == index) Copper else BgCardBorder)
                    )
                }
            }

            Spacer(Modifier.height(28.dp))

            // Flip card
            Box(
                Modifier.fillMaxWidth().height(260.dp)
                    .graphicsLayer { rotationY = rotation; cameraDistance = 12f * density }
                    .clickable { flipped = !flipped }
            ) {
                if (rotation <= 90f) {
                    // Front — Hindi
                    Box(
                        Modifier.fillMaxSize()
                            .clip(RoundedCornerShape(24.dp))
                            .background(BgCard)
                            .border(2.dp, Copper.copy(alpha = 0.4f), RoundedCornerShape(24.dp))
                            .padding(28.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(
                                Modifier.clip(RoundedCornerShape(8.dp))
                                    .background(Copper.copy(alpha = 0.12f))
                                    .padding(horizontal = 10.dp, vertical = 3.dp)
                            ) {
                                Text(cards[index].category, color = Copper, fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                            }
                            Spacer(Modifier.height(20.dp))
                            Text(cards[index].hindi, color = TextPrimary, fontSize = 42.sp,
                                fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
                            Spacer(Modifier.height(8.dp))
                            Text(cards[index].meaning, color = TextHint, fontSize = 15.sp,
                                textAlign = TextAlign.Center, letterSpacing = 0.5.sp)
                            Spacer(Modifier.height(20.dp))
                            Text("\u091f\u0948\u092a \u0915\u0930\u0947\u0902 \u2014 tap to flip",
                                color = TextHint, fontSize = 11.sp)
                        }
                    }
                } else {
                    // Back — Santali (mirrored so it reads correctly)
                    Box(
                        Modifier.fillMaxSize().graphicsLayer { rotationY = 180f }
                            .clip(RoundedCornerShape(24.dp))
                            .background(BgHighlight)
                            .border(2.dp, Sage.copy(alpha = 0.5f), RoundedCornerShape(24.dp))
                            .padding(28.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(
                                Modifier.clip(RoundedCornerShape(8.dp))
                                    .background(Sage.copy(alpha = 0.15f))
                                    .padding(horizontal = 10.dp, vertical = 3.dp)
                            ) {
                                Text("Ol Chiki  \u1c25\u1c5f\u1c6c\u1c71\u1c60\u1c6c\u1c5e\u1c64", color = Sage,
                                    fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                            }
                            Spacer(Modifier.height(20.dp))
                            Text(cards[index].santali, color = TextPrimary, fontSize = 38.sp,
                                fontWeight = FontWeight.Bold, textAlign = TextAlign.Center,
                                fontFamily = FontFamily.Default)
                            Spacer(Modifier.height(8.dp))
                            Text(cards[index].hindi + "  =  " + cards[index].meaning,
                                color = TextHint, fontSize = 14.sp, textAlign = TextAlign.Center)
                        }
                    }
                }
            }

            Spacer(Modifier.height(32.dp))

            // Prev / Next
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                OutlinedButton(
                    onClick = { if (index > 0) index-- },
                    modifier = Modifier.weight(1f).height(52.dp),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, if (index > 0) BgCardBorder else Color.Transparent),
                    enabled = index > 0
                ) {
                    Text("\u2190 \u092a\u093f\u091b\u0932\u093e", color = if (index > 0) TextSecondary else TextHint,
                        fontSize = 14.sp)
                }
                Button(
                    onClick = { if (index < cards.size - 1) index++ },
                    modifier = Modifier.weight(1f).height(52.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Copper,
                        disabledContainerColor = BgCardBorder
                    ),
                    enabled = index < cards.size - 1,
                    elevation = ButtonDefaults.buttonElevation(0.dp)
                ) {
                    Text("\u0905\u0917\u0932\u093e \u2192", color = TextPrimary, fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold)
                }
            }

            Spacer(Modifier.height(20.dp))

            Text("\u0915\u093e\u0930\u094d\u0921 \u092a\u0930 \u091f\u0948\u092a \u0915\u0930\u0947\u0902 \u0924\u094b \u092a\u0932\u091f\u0947\u0902  \u2022  Tap card to flip",
                color = TextHint, fontSize = 11.sp, textAlign = TextAlign.Center)
        }
    }
}