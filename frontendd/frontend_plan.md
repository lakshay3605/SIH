# Vernacular Pedagogy App — Content & Feature Plan
### SIH 27042 | Hindi → Santhali / Ho / Mundari

This document lists everything the app needs to contain, with sample content, so the frontend/theme design has a real basis to work from.

---

## 1. App Entry Flow

**Step 1 — Language Selector (first screen, before anything else)**
- Big tappable tiles, one per language: Santhali, Ho, Mundari (+ Hindi, for teacher setup)
- Each tile shows the language's own script/name, plus a tap-to-hear audio sample ("This is Santhali" spoken in Santhali) — so non-readers can pick correctly
- Selection sets the language for the **entire app**, not just content — every button, label, and instruction switches too
- Recommended: language is set **per device**, since tablets will likely be assigned per classroom, not per student login

**Step 2 — Home Screen**
- One large "Translate / Speak" button (core feature, backend by teammate)
- Icon tiles for each module below (icons + one-word caption, no long text)

**Two Modes:**
| Mode | Who | What it shows |
|---|---|---|
| Student Mode | Kids | Selected tribal language only, big icons, audio-first |
| Teacher Mode | Teachers | Tribal language + Hindi side-by-side, plus dashboard/progress tools |

---

## 2. Content Modules (with sample content)

### A. Flashcards
Category decks, each card = image + word (text + audio) in selected language.

**Decks to include:** Alphabets, Numbers, Animals, Family/Relations, Colors, Body Parts, Classroom Objects, Food, Local Festivals (Sarhul, Karma), Farming Tools

Example card set (Animals):
| Image | Word slot |
|---|---|
| 🐄 Cow | [language word] + audio |
| 🐐 Goat | [language word] + audio |
| 🐔 Hen | [language word] + audio |
| 🐘 Elephant | [language word] + audio |
| 🐕 Dog | [language word] + audio |
| 🐈 Cat | [language word] + audio |
| 🐖 Pig | [language word] + audio |
| 🐑 Sheep | [language word] + audio |
| 🐦 Bird/Sparrow | [language word] + audio |
| 🐒 Monkey | [language word] + audio |

For class 4-6: add a swipe "I know it / I don't know it" sorting mode.

Example card set (Numbers 1-10):
| Image | Word slot |
|---|---|
| 1️⃣ (one object shown) | [language word for "one"] + audio |
| 2️⃣ (two objects shown) | [language word for "two"] + audio |
| 3️⃣ (three objects shown) | [language word for "three"] + audio |
| 4️⃣ (four objects shown) | [language word for "four"] + audio |
| 5️⃣ (five objects shown) | [language word for "five"] + audio |
| 6️⃣ (six objects shown) | [language word for "six"] + audio |
| 7️⃣ (seven objects shown) | [language word for "seven"] + audio |
| 8️⃣ (eight objects shown) | [language word for "eight"] + audio |
| 9️⃣ (nine objects shown) | [language word for "nine"] + audio |
| 🔟 (ten objects shown) | [language word for "ten"] + audio |

Each number card pairs the numeral with a matching count of simple objects (e.g., 3 mangoes for "3"), not just the digit alone — this reinforces quantity recognition, not just symbol memorization. Extend the deck to 20 for class 2-3, and introduce tens/multiples of ten for class 4-6.

---

### B. Image Study (Scene Vocabulary)
One large illustrated scene with tappable hotspots. Tap an object → hear + see its name in the selected language.

**Scenes to include:** Classroom, Market, Farm/Field, River/Forest, Home, Festival gathering

This works even for children who can't read yet — pure audio-visual learning.

---

### C. Worksheets (auto-generated, template-based)

**Type 1 — Match the Following** (Class 1-2)
Image on one side, word-audio bubble on other side; child connects them.
> Example set: Cow / Goat / Hen / Elephant / Dog (images ↔ language audio bubbles)

**Type 2 — Fill in the Blank (picture clue)** (Class 1-3)
Picture shown, one letter/sound missing from the word underneath, in the selected language script/transliteration.

**Type 3 — Trace & Draw** (Class 1)
Trace a number, then draw that many objects.
> Example: Trace "3" → draw 3 apples

**Type 4 — Picture Word Problem** (Class 3-4, Numeracy)
Image-based story, question asked in selected language + audio.
> Example: Image shows 4 mangoes on a tree + 2 falling. Question (in language): "How many mangoes in total?"

**Type 5 — Sentence-to-Picture Match** (Class 5-6)
Short sentence (text + audio, selected language) matched to the correct picture.
> Examples: "The child is going to school" → child+bag+school icon; "Mother is cooking" → mother+pot icon; "The farmer is working in the field" → farmer+field icon

**Teacher toggle:** every worksheet can show Hindi alongside the tribal language for the teacher's own reference/prep — not shown to students by default.

---

### D. Read-Along Storybooks
Illustrated short stories, sentence-by-sentence audio with text highlighting as it plays (karaoke-style).
- Use local folk stories / tribal cultural stories where possible, not generic imported stories
- Fully in selected language; Hindi available as teacher reference only

---

### E. Numeracy Module
- Counting with visual objects (tap-to-count)
- Shape and pattern recognition
- Addition/subtraction shown visually before numerically (e.g., picture of 3 mangoes + 2 mangoes, then the equation)
- Word problems using locally relevant items (paddy, mahua, forest produce) instead of generic apples/oranges

---

### F. Rhymes & Songs
Short animated rhymes/songs, audio-first, in the selected language. Strong for early language acquisition, minimal reading required.

---

### G. Speaking Practice Game
Child taps a picture → hears the word → repeats it → gets a simple star/badge reward. Doesn't need perfect speech recognition — approximate matching is enough for engagement.

---

### H. Teacher Dashboard
- Class progress overview (which modules/worksheets completed)
- Auto-flagged "struggling" words/concepts based on flashcard/worksheet performance
- Lesson planner: pick a Hindi FLN lesson topic → app shows the matching translated + visual version to teach with

---

## 3. Gamification Layer
- Star/badge per completed module
- Visual "learning journey map" (game-level-style path) instead of a plain progress bar
- Daily streak icon (e.g., growing tree/sun) for repeat use

---

## 4. Cultural/Visual Direction (for theme & illustration)
- Tribal motifs, local clothing, local flora/fauna in all illustrations — avoid generic clip-art style
- Vocabulary and word-problem examples should reflect local life: farming tools, forest produce, festivals, regional food
- This is the main way to differentiate from other teams' generic-themed submissions

---

## 5. Data Structure Note (for whoever builds content/backend)
Every piece of content (flashcard, worksheet item, story line) should be stored with **all languages as equal fields**, not Hindi-as-default:

```
concept_id: animal_cow
image: cow.png
text: { hindi: "गाय", santhali: "", ho: "", mundari: "" }
audio: { hindi: "hi_gaay.mp3", santhali: "", ho: "", mundari: "" }
```

The app just displays `text[selected_language]` and `audio[selected_language]` everywhere — this makes language-switching and adding new content straightforward, and lets the translation and frontend halves of the team work in parallel using the same content IDs.

---

## 6. Content Pool to Prepare (vocabulary/sentence bank)
- **Vocabulary sets:** animals, fruits/vegetables, family members, classroom objects, body parts, colors, numbers 1-100, days/months, weather, festivals, farming tools
- **Sentence patterns:** simple subject-verb-object, question forms (what/who/where), daily routine sentences
- **Numeracy progression:** counting → addition/subtraction with objects → simple word problems → measurement (bigger/smaller, more/less)

---

## 7. Suggested Build Priority (for prototype/demo)
1. Language selector + Flashcards + Image Study (strongest visual demo)
2. One worksheet type (Match the Following) with auto-generation
3. One read-along story
4. Basic teacher dashboard
5. Gamification polish
