/**
 * Voice Recognition (STT), Speech Synthesis (TTS) & Bidirectional Translation Engine
 * Pure offline-ready:
 * 1. Comprehensive Phrasebook for daily life, classroom, healthcare & pedagogy
 * 2. Exhaustive Vocabulary Engine (verbs with inflections, pronouns, questions, adverbs, nouns)
 * 3. Multi-word phrase matching + verb-stem lemmatization (eliminating untranslated Hindi words)
 * 4. High-Fidelity Acoustic Devanagari Transcription for authentic Indian TTS speech synthesis
 * 5. Android Native Bridge integration with hardware TTS & SpeechRecognizer
 * 6. Web Speech API browser fallback with optimized Indian acoustic voice selection
 */

// Ol Chiki -> Roman phonetic sounds for UI display
export const OL_CHIKI_TO_PHONETIC: Record<string, string> = {
  // Vowels
  'ᱚ': 'o', 'ᱟ': 'a', 'ᱤ': 'i', 'ᱩ': 'u', 'ᱮ': 'e', 'ᱳ': 'o',
  // Consonants
  'ᱛ': 't', 'ᱜ': 'g', 'ᱝ': 'ng', 'ᱞ': 'l', 'ᱠ': 'k', 'ᱡ': 'j',
  'ᱢ': 'm', 'ᱣ': 'w', 'ᱥ': 's', 'ᱦ': 'h', 'ᱧ': 'ny', 'ᱨ': 'r',
  'ᱪ': 'ch', 'ᱫ': 'd', 'ᱬ': 'n', 'ᱭ': 'y', 'ᱯ': 'p', 'ᱰ': 'd',
  'ᱱ': 'n', 'ᱲ': 'rh', 'ᱴ': 't', 'ᱵ': 'b', 'ᱶ': 'nh', 'ᱷ': 'h',
  // Modifiers & Punctuations
  'ᱸ': 'm', 'ᱹ': '', 'ᱺ': '', 'ᱻ': '', 'ᱼ': '-', '᱾': '.', '᱿': '..'
};

// Aspirated pairs in Ol Chiki (Consonant + ᱷ) -> Devanagari aspirated consonants
const ASPIRATE_MAP: Record<string, string> = {
  'ᱠᱷ': 'ख', 'ᱜᱷ': 'घ', 'ᱪᱷ': 'छ', 'ᱡᱷ': 'झ', 'ᱴᱷ': 'ठ',
  'ᱰᱷ': 'ढ', 'ᱛᱷ': 'थ', 'ᱫᱷ': 'ध', 'ᱯᱷ': 'फ', 'ᱵᱷ': 'भ', 'ᱲᱷ': 'ढ़'
};

const VOWEL_MAP: Record<string, [string, string]> = {
  'ᱚ': ['ऑ', 'ो'],
  'ᱟ': ['आ', 'ा'],
  'ᱤ': ['इ', 'ि'],
  'ᱩ': ['उ', 'ु'],
  'ᱮ': ['ए', 'े'],
  'ᱳ': ['ओ', 'ो']
};

const CONSONANT_MAP: Record<string, string> = {
  'ᱛ': 'त', 'ᱜ': 'ग', 'ᱝ': 'ंग', 'ᱞ': 'ल',
  'ᱠ': 'क', 'ᱡ': 'ज', 'ᱢ': 'म', 'ᱣ': 'व',
  'ᱥ': 'स', 'ᱦ': 'ह', 'ᱧ': 'ञ', 'ᱨ': 'र',
  'ᱪ': 'च', 'ᱫ': 'द', 'ᱬ': 'ण', 'ᱭ': 'य',
  'ᱯ': 'प', 'ᱰ': 'ड', 'ᱱ': 'न', 'ᱲ': 'ड़',
  'ᱴ': 'ट', 'ᱵ': 'ब', 'ᱶ': 'व', 'ᱷ': 'ह'
};

const MODIFIER_MAP: Record<string, string> = {
  'ᱸ': 'ं', 'ᱹ': '', 'ᱺ': 'ँ', 'ᱻ': '',
  'ᱼ': '-', '᱾': '।', '᱿': '॥'
};

/**
 * Converts Ol Chiki text into phonetically exact Devanagari acoustic text.
 * When fed into Android or Web Indian TTS (hi-IN), it articulates authentic
 * Santali sounds naturally rather than robotic or garbled English spellings.
 */
export function olChikiToDevaPhonetic(olChikiText: string): string {
  const n = olChikiText.length;
  let result = '';
  let i = 0;

  while (i < n) {
    const ch = olChikiText[i];

    // 1. Check aspirate pairs
    if (i + 1 < n) {
      const pair = ch + olChikiText[i + 1];
      if (ASPIRATE_MAP[pair]) {
        const aspCons = ASPIRATE_MAP[pair];
        if (i + 2 < n && VOWEL_MAP[olChikiText[i + 2]]) {
          result += aspCons + VOWEL_MAP[olChikiText[i + 2]][1];
          i += 3;
          continue;
        } else {
          result += aspCons;
          i += 2;
          continue;
        }
      }
    }

    // 2. Regular consonants
    if (CONSONANT_MAP[ch]) {
      const cons = CONSONANT_MAP[ch];
      if (i + 1 < n && VOWEL_MAP[olChikiText[i + 1]]) {
        const matra = VOWEL_MAP[olChikiText[i + 1]][1];
        if (ch === 'ᱧ') {
          result += (matra === 'ु' || matra === 'ू') ? 'न्यू' : ('न्य' + matra);
        } else {
          result += cons + matra;
        }
        i += 2;
        continue;
      } else {
        result += (ch === 'ᱧ') ? 'ञ' : cons;
        i += 1;
        continue;
      }
    }

    // 3. Independent vowels
    if (VOWEL_MAP[ch]) {
      result += VOWEL_MAP[ch][0];
      i += 1;
      continue;
    }

    // 4. Modifiers
    if (MODIFIER_MAP[ch] !== undefined) {
      result += MODIFIER_MAP[ch];
      i += 1;
      continue;
    }

    result += ch;
    i += 1;
  }

  return result.replace(/\s+/g, ' ').trim();
}

// Devanagari to Ol Chiki character transliteration map
export const DEVA_TO_OL_CHIKI: Record<string, string> = {
  'अ': 'ᱚ', 'आ': 'ᱟ', 'इ': 'ᱤ', 'ई': 'ᱤ', 'उ': 'ᱩ', 'ऊ': 'ᱩ',
  'ए': 'ᱮ', 'ऐ': 'ᱮ', 'ओ': 'ᱳ', 'औ': 'ᱳ',
  'क': 'ᱠ', 'ख': 'ᱠᱷ', 'ग': 'ᱜ', 'घ': 'ᱜᱷ', 'ङ': 'ᱝ',
  'च': 'ᱪ', 'छ': 'ᱪᱷ', 'ज': 'ᱡ', 'झ': 'ᱡᱷ', 'ञ': 'ᱧ',
  'ट': 'ᱴ', 'ठ': 'ᱴᱷ', 'ड': 'ᱰ', 'ढ': 'ᱰᱷ', 'ण': 'ᱬ',
  'त': 'ᱛ', 'थ': 'ᱛᱷ', 'द': 'ᱫ', 'ध': 'ᱫᱷ', 'न': 'ᱱ',
  'प': 'ᱯ', 'फ': 'ᱯᱷ', 'ब': 'ᱵ', 'भ': 'ᱵᱷ', 'म': 'ᱢ',
  'य': 'ᱭ', 'र': 'ᱨ', 'ल': 'ᱞ', 'व': 'ᱣ', 'श': 'ᱥ', 'ष': 'ᱥ', 'स': 'ᱥ', 'ह': 'ᱦ',
  'ड़': 'ᱲ', 'ढ़': 'ᱲᱷ', 'फ़': 'ᱯᱷ', 'ज़': 'ᱡ',
  'ा': 'ᱟ', 'ि': 'ᱤ', 'ी': 'ᱤ', 'ु': 'ᱩ', 'ू': 'ᱩ',
  'े': 'ᱮ', 'ै': 'ᱮ', 'ो': 'ᱳ', 'ौ': 'ᱳ',
  'ं': 'ᱸ', 'ँ': 'ᱸ', 'ः': 'ᱷ', '्': '',
  '।': ' ᱾', '.': ' ᱾', '?': '?', '!': '!'
};

export const OL_CHIKI_TO_DEVA: Record<string, string> = {
  'ᱚ': 'ओ', 'ᱟ': 'आ', 'ᱤ': 'इ', 'ᱩ': 'उ', 'ᱮ': 'ए', 'ᱳ': 'ओ',
  'ᱛ': 'त', 'ᱜ': 'ग', 'ᱝ': 'ंग', 'ᱞ': 'ल', 'ᱠ': 'क', 'ᱡ': 'ज',
  'ᱢ': 'म', 'ᱣ': 'व', 'ᱥ': 'स', 'ᱦ': 'ह', 'ᱧ': 'ञ', 'ᱨ': 'र',
  'ᱪ': 'च', 'ᱫ': 'द', 'ᱬ': 'ण', 'ᱭ': 'य', 'ᱯ': 'प', 'ᱰ': 'ड',
  'ᱱ': 'न', 'ᱲ': 'ड़', 'ᱴ': 'ट', 'ᱵ': 'ब', 'ᱶ': 'न्ह', 'ᱷ': 'ह',
  'ᱸ': 'ं', '᱾': '।', '᱿': '।'
};

export function transliterateDevaToOlChiki(devaText: string): string {
  let result = '';
  for (let i = 0; i < devaText.length; i++) {
    const ch = devaText[i];
    result += DEVA_TO_OL_CHIKI[ch] !== undefined ? DEVA_TO_OL_CHIKI[ch] : ch;
  }
  return result.replace(/\s+/g, ' ').trim();
}

export function transliterateOlChikiToDeva(olChikiText: string): string {
  let result = '';
  for (let i = 0; i < olChikiText.length; i++) {
    const ch = olChikiText[i];
    result += OL_CHIKI_TO_DEVA[ch] !== undefined ? OL_CHIKI_TO_DEVA[ch] : ch;
  }
  return result.replace(/\s+/g, ' ').trim();
}

export function olChikiToPhonetic(olChikiText: string): string {
  let phonetic = '';
  for (const char of olChikiText) {
    phonetic += OL_CHIKI_TO_PHONETIC[char] !== undefined ? OL_CHIKI_TO_PHONETIC[char] : char;
  }
  return phonetic.trim();
}

// ── COMPREHENSIVE PHRASEBOOK FOR DAILY CONVERSATION, SCHOOL & PEDAGOGY ───────
export const HINDI_SANTALI_PHRASE_BOOK: Record<string, { olChiki: string; phonetic: string }> = {
  // Greetings & Courtesies
  "नमस्ते": { olChiki: "ᱡᱚᱦᱟᱨ", phonetic: "Johar" },
  "जोहार": { olChiki: "ᱡᱚᱦᱟᱨ", phonetic: "Johar" },
  "हेलो": { olChiki: "ᱡᱚᱦᱟᱨ", phonetic: "Johar" },
  "नमस्ते शिक्षक जी": { olChiki: "ᱡᱚᱦᱟᱨ, ᱢᱟᱪᱮᱛ!", phonetic: "Johar, machet!" },
  "नमस्ते, आप कैसे हैं?": { olChiki: "ᱡᱚᱦᱟᱨ, ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ?", phonetic: "Johar, aam ched leka menag-ama?" },
  "नमस्ते आप कैसे हैं": { olChiki: "ᱡᱚᱦᱟᱨ, ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ?", phonetic: "Johar, aam ched leka menag-ama?" },
  "आप कैसे हैं?": { olChiki: "ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ?", phonetic: "Aam ched leka menag-ama?" },
  "आप कैसे हैं": { olChiki: "ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ?", phonetic: "Aam ched leka menag-ama?" },
  "तुम कैसे हो?": { olChiki: "ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ?", phonetic: "Aam ched leka menag-ama?" },
  "तुम कैसे हो": { olChiki: "ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ?", phonetic: "Aam ched leka menag-ama?" },
  "और भाई क्या हाल-चाल है": { olChiki: "ᱟᱨ ᱵᱚᱭᱦᱟ, ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ ᱵᱤᱱᱟ?", phonetic: "Ar boyha, ched leka menag bina?" },
  "और भाई क्या हाल चाल है": { olChiki: "ᱟᱨ ᱵᱚᱭᱦᱟ, ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ ᱵᱤᱱᱟ?", phonetic: "Ar boyha, ched leka menag bina?" },
  "क्या हाल-चाल है": { olChiki: "ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ ᱵᱤᱱᱟ?", phonetic: "Ched leka menag bina?" },
  "क्या हाल चाल है": { olChiki: "ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ ᱵᱤᱱᱟ?", phonetic: "Ched leka menag bina?" },
  "मैं ठीक हूँ": { olChiki: "ᱤᱧ ᱵᱷᱟᱹᱜᱤ ᱜᱮ ᱢᱮᱱᱟᱹᱧᱟ ᱾", phonetic: "Inj bhagi ge menanja." },
  "मैं ठीक हूँ धन्यवाद": { olChiki: "ᱤᱧ ᱵᱷᱟᱹᱜᱤ ᱜᱮ ᱢᱮᱱᱟᱹᱧᱟ, ᱥᱟᱨᱦᱟᱣ ᱾", phonetic: "Inj bhagi ge menanja, sarhaw." },
  "मैं ठीक हूँ, धन्यवाद।": { olChiki: "ᱤᱧ ᱵᱷᱟᱹᱜᱤ ᱜᱮ ᱢᱮᱱᱟᱹᱧᱟ, ᱥᱟᱨᱦᱟᱣ ᱾", phonetic: "Inj bhagi ge menanja, sarhaw." },
  "सब ठीक है": { olChiki: "ᱡᱚᱛᱚ ᱵᱷᱟᱹᱜᱤ ᱜᱮᱭᱟ ᱾", phonetic: "Joto bhagi geya." },
  "धन्यवाद": { olChiki: "ᱥᱟᱨᱦᱟᱣ", phonetic: "Sarhaw" },
  "बहुत धन्यवाद": { olChiki: "ᱟᱹᱰᱤ ᱥᱟᱨᱦᱟᱣ", phonetic: "Aadi sarhaw" },
  "शुक्रिया": { olChiki: "ᱥᱟᱨᱦᱟᱣ", phonetic: "Sarhaw" },
  "स्वागत है": { olChiki: "ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ", phonetic: "Sagun daram" },

  // Self Introduction & Questions
  "आपका नाम क्या है?": { olChiki: "ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱫᱚ ᱪᱮᱫ?", phonetic: "Amag nyutum do ched?" },
  "आपका नाम क्या है": { olChiki: "ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱫᱚ ᱪᱮᱫ?", phonetic: "Amag nyutum do ched?" },
  "तुम्हारा नाम क्या है?": { olChiki: "ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱫᱚ ᱪᱮᱫ?", phonetic: "Amag nyutum do ched?" },
  " तुम्हारा नाम क्या है": { olChiki: "ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱫᱚ ᱪᱮᱫ?", phonetic: "Amag nyutum do ched?" },
  "मेरा नाम क्या है": { olChiki: "ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ ᱫᱚ ᱪᱮᱫ?", phonetic: "Injag nyutum do ched?" },
  "मेरा नाम लखन है।": { olChiki: "ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ ᱞᱚᱠᱷᱚᱱ ᱠᱟᱱᱟ ᱾", phonetic: "Injag nyutum Lokhon kana." },
  "मेरा नाम लखन है": { olChiki: "ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ ᱞᱚᱠᱷᱚᱱ ᱠᱟᱱᱟ ᱾", phonetic: "Injag nyutum Lokhon kana." },
  "हेलो बच्चों मेरा नाम लक्ष्य है": { olChiki: "ᱡᱚᱦᱟᱨ ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ, ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ ᱞᱟᱠᱥᱭ ᱠᱟᱱᱟ ᱾", phonetic: "Johar gidra ko, injag nyutum Laksya kana." },
  "हेलो बच्चों मेरा नाम लक्ष्य है।": { olChiki: "ᱡᱚᱦᱟᱨ ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ, ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ ᱞᱟᱠᱥᱭ ᱠᱟᱱᱟ ᱾", phonetic: "Johar gidra ko, injag nyutum Laksya kana." },
  "बच्चों मेरा नाम लक्ष्य है": { olChiki: "ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ, ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ ᱞᱟᱠᱥᱭ ᱠᱟᱱᱟ ᱾", phonetic: "Gidra ko, injag nyutum Laksya kana." },
  "मैं एक शिक्षक हूँ।": { olChiki: "ᱤᱧ ᱫᱚ ᱢᱤᱫ ᱢᱟᱪᱮᱛ ᱠᱟᱹᱱᱟᱹᱧ ᱾", phonetic: "Inj do mid machet kananj." },
  "मैं एक शिक्षक हूँ": { olChiki: "ᱤᱧ ᱫᱚ ᱢᱤᱫ ᱢᱟᱪᱮᱛ ᱠᱟᱹᱱᱟᱹᱧ ᱾", phonetic: "Inj do mid machet kananj." },
  "मैं एक विद्यार्थी हूँ।": { olChiki: "ᱤᱧ ᱫᱚ ᱢᱤᱫ ᱯᱟᱹᱴᱷᱩᱣᱟᱹ ᱠᱟᱹᱱᱟᱹᱧ ᱾", phonetic: "Inj do mid pathuwa kananj." },
  "यह कौन है?": { olChiki: "ᱱᱩᱭ ᱫᱚ ᱚᱠᱚᱭ ᱠᱟᱱᱟᱭ?", phonetic: "Nuy do okoy kanay?" },
  "यह कौन है": { olChiki: "ᱱᱩᱭ ᱫᱚ ᱚᱠᱚᱭ ᱠᱟᱱᱟᱭ?", phonetic: "Nuy do okoy kanay?" },
  "वह कौन है?": { olChiki: "ᱩᱱᱤ ᱫᱚ ᱚᱠᱚᱭ ᱠᱟᱱᱟᱭ?", phonetic: "Uni do okoy kanay?" },
  "वह कौन है": { olChiki: "ᱩᱱᱤ ᱫᱚ ᱚᱠᱚᱭ ᱠᱟᱱᱟᱭ?", phonetic: "Uni do okoy kanay?" },
  "यह क्या है?": { olChiki: "ᱱᱚᱣᱟ ᱫᱚ ᱪᱮᱫ ᱠᱟᱱᱟ?", phonetic: "Nowa do ched kana?" },
  "यह क्या है": { olChiki: "ᱱᱚᱣᱟ ᱫᱚ ᱪᱮᱫ ᱠᱟᱱᱟ?", phonetic: "Nowa do ched kana?" },
  "वह क्या है?": { olChiki: "ᱦᱟᱱᱟ ᱫᱚ ᱪᱮᱫ ᱠᱟᱱᱟ?", phonetic: "Hana do ched kana?" },
  "वह क्या है": { olChiki: "ᱦᱟᱱᱟ ᱫᱚ ᱪᱮᱫ ᱠᱟᱱᱟ?", phonetic: "Hana do ched kana?" },
  "तुम क्या कर रहे हो?": { olChiki: "ᱟᱢ ᱪᱮᱫ ᱮᱢ ᱪᱤᱠᱟᱹᱭᱮᱫ-ᱟ?", phonetic: "Aam ched em chikayed-a?" },
  "तुम क्या कर रहे हो": { olChiki: "ᱟᱢ ᱪᱮᱫ ᱮᱢ ᱪᱤᱠᱟᱹᱭᱮᱫ-ᱟ?", phonetic: "Aam ched em chikayed-a?" },
  "आप क्या कर रहे हैं?": { olChiki: "ᱟᱢ ᱪᱮᱫ ᱮᱢ ᱠᱟᱹᱢᱤ ᱠᱟᱱᱟ?", phonetic: "Aam ched em kami kana?" },
  "आप क्या कर रहे हैं": { olChiki: "ᱟᱢ ᱪᱮᱫ ᱮᱢ ᱠᱟᱹᱢᱤ ᱠᱟᱱᱟ?", phonetic: "Aam ched em kami kana?" },
  "वह क्या कर रहा है?": { olChiki: "ᱩᱱᱤ ᱫᱚ ᱪᱮᱫ ᱮ ᱠᱟᱹᱢᱤ ᱠᱟᱱᱟ?", phonetic: "Uni do ched e kami kana?" },
  "वह क्या कर रहा है": { olChiki: "ᱩᱱᱤ ᱫᱚ ᱪᱮᱫ ᱮ ᱠᱟᱹᱢᱤ ᱠᱟᱱᱟ?", phonetic: "Uni do ched e kami kana?" },

  // Location & Routine
  "आपका घर कहाँ है?": { olChiki: "ᱟᱢᱟᱜ ᱚᱲᱟᱜ ᱫᱚ ᱚᱠᱟᱨᱮ?", phonetic: "Amag orag do okare?" },
  "आपका घर कहाँ है": { olChiki: "ᱟᱢᱟᱜ ᱚᱲᱟᱜ ᱫᱚ ᱚᱠᱟᱨᱮ?", phonetic: "Amag orag do okare?" },
  "तुम कहाँ रहते हो?": { olChiki: "ᱟᱢ ᱫᱚ ᱚᱠᱟᱨᱮᱢ ᱛᱟᱦᱮᱸᱱᱟ?", phonetic: "Aam do okarem tahena?" },
  "तुम कहाँ रहते हो": { olChiki: "ᱟᱢ ᱫᱚ ᱚᱠᱟᱨᱮᱢ ᱛᱟᱦᱮᱸᱱᱟ?", phonetic: "Aam do okarem tahena?" },
  "आप कहाँ रहते हैं?": { olChiki: "ᱟᱢ ᱫᱚ ᱚᱠᱟᱨᱮᱢ ᱛᱟᱦᱮᱸᱱᱟ?", phonetic: "Aam do okarem tahena?" },
  "आप कहाँ रहते हैं": { olChiki: "ᱟᱢ ᱫᱚ ᱚᱠᱟᱨᱮᱢ ᱛᱟᱦᱮᱸᱱᱟ?", phonetic: "Aam do okarem tahena?" },
  "आप कहाँ जा रहे हैं?": { olChiki: "ᱟᱢ ᱚᱠᱟᱛᱮᱢ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ?", phonetic: "Aam okatem senog kana?" },
  "आप कहाँ जा रहे हैं": { olChiki: "ᱟᱢ ᱚᱠᱟᱛᱮᱢ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ?", phonetic: "Aam okatem senog kana?" },
  "तुम कहाँ जा रहे हो?": { olChiki: "ᱟᱢ ᱚᱠᱟᱛᱮᱢ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ?", phonetic: "Aam okatem senog kana?" },
  "तुम कहाँ जा रहे हो": { olChiki: "ᱟᱢ ᱚᱠᱟᱛᱮᱢ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ?", phonetic: "Aam okatem senog kana?" },
  "वह कहाँ गया?": { olChiki: "ᱩᱱᱤ ᱫᱚ ᱚᱠᱟᱛᱮᱭ ᱥᱮᱱ ᱮᱱᱟ?", phonetic: "Uni do okatey sen ena?" },
  "वह कहाँ गया": { olChiki: "ᱩᱱᱤ ᱫᱚ ᱚᱠᱟᱛᱮᱭ ᱥᱮᱱ ᱮᱱᱟ?", phonetic: "Uni do okatey sen ena?" },
  "तुम कब आओगे?": { olChiki: "ᱟᱢ ᱛᱤᱥ-ᱮᱢ ᱦᱤᱡᱩᱜ-ᱟ?", phonetic: "Aam tis-em hijug-a?" },
  "तुम कब आओगे": { olChiki: "ᱟᱢ ᱛᱤᱥ-ᱮᱢ ᱦᱤᱡᱩᱜ-ᱟ?", phonetic: "Aam tis-em hijug-a?" },
  "मैं घर जा रहा हूँ।": { olChiki: "ᱤᱧ ᱚᱲᱟᱜ-ᱤᱧ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ ᱾", phonetic: "Inj orag-inj senog kana." },
  "मैं घर जा रहा हूँ": { olChiki: "ᱤᱧ ᱚᱲᱟᱜ-ᱤᱧ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ ᱾", phonetic: "Inj orag-inj senog kana." },
  "हम स्कूल जा रहे हैं।": { olChiki: "ᱟᱞᱮ ᱵᱤᱨᱫᱟᱹᱜᱟᱲ ᱞᱮ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ ᱾", phonetic: "Ale birdagarh le senog kana." },
  "हम स्कूल जा रहे हैं": { olChiki: "ᱟᱞᱮ ᱵᱤᱨᱫᱟᱹᱜᱟᱲ ᱞᱮ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ ᱾", phonetic: "Ale birdagarh le senog kana." },
  "सभी बच्चे स्कूल जा रहे हैं।": { olChiki: "ᱥᱟᱱᱟᱢ ᱜᱤᱫᱽᱨᱟᱹ ᱜᱮ ᱵᱤᱨᱫᱟᱹᱜᱟᱲ ᱨᱮ ᱪᱟᱞᱟᱣᱚᱜ ᱠᱟᱱᱟ ᱾", phonetic: "Sanam gidra ge birdagarh re chalawog kana." },
  "सभी बच्चे स्कूल जा रहे हैं": { olChiki: "ᱥᱟᱱᱟᱢ ᱜᱤᱫᱽᱨᱟᱹ ᱜᱮ ᱵᱤᱨᱫᱟᱹᱜᱟᱲ ᱨᱮ ᱪᱟᱞᱟᱣᱚᱜ ᱠᱟᱱᱟ ᱾", phonetic: "Sanam gidra ge birdagarh re chalawog kana." },
  "स्कूल चलो": { olChiki: "ᱵᱤᱨᱫᱟᱹᱜᱟᱲ ᱫᱮᱞᱟ ᱾", phonetic: "Birdagarh dela." },
  "घर जाओ": { olChiki: "ᱚᱲᱟᱜ ᱥᱮᱱᱚᱜ ᱢᱮ ᱾", phonetic: "Orag senog me." },
  "यहाँ आओ": { olChiki: "ᱱᱚᱸᱰᱮ ᱦᱤᱡᱩᱜ ᱢᱮ ᱾", phonetic: "Nonde hijug me." },
  "यहाँ आइए": { olChiki: "ᱱᱚᱸᱰᱮ ᱦᱤᱡᱩᱜ ᱢᱮ ᱾", phonetic: "Nonde hijug me." },
  "वहाँ जाओ": { olChiki: "ᱚᱸᱰᱮ ᱥᱮᱱᱚᱜ ᱢᱮ ᱾", phonetic: "Onde senog me." },
  "बैठ जाओ": { olChiki: "ᱫᱩᱲᱩᱵ ᱢᱮ ᱾", phonetic: "Durhub me." },
  "यहाँ बैठो": { olChiki: "ᱱᱚᱸᱰᱮ ᱫᱩᱲᱩᱵ ᱢᱮ ᱾", phonetic: "Nonde durhub me." },
  "खड़े हो जाओ": { olChiki: "ᱛᱤᱸᱜᱩᱱ ᱢᱮ ᱾", phonetic: "Tingun me." },
  "आज छुट्टी है।": { olChiki: "ᱛᱮᱦᱮᱧ ᱫᱚ ᱪᱷᱩᱴᱤ ᱠᱟᱱᱟ ᱾", phonetic: "Tehenj do chhuti kana." },
  "आज छुट्टी है": { olChiki: "ᱛᱮᱦᱮᱧ ᱫᱚ ᱪᱷᱩᱴᱤ ᱠᱟᱱᱟ ᱾", phonetic: "Tehenj do chhuti kana." },
  "कल स्कूल आना": { olChiki: "ᱜᱟᱯᱟ ᱵᱤᱨᱫᱟᱹᱜᱟᱲ ᱦᱤᱡᱩᱜ ᱢᱮ ᱾", phonetic: "Gapa birdagarh hijug me." },

  // Classroom Management & Pedagogy
  "सभी बच्चे शांत रहिए और मेरी बात ध्यान से सुनिए।": {
    olChiki: "ᱥᱟᱱᱟᱢ ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ ᱛᱷᱤᱨ ᱛᱟᱦᱮᱸᱱ ᱯᱮ ᱟᱨ ᱤᱧᱟᱜ ᱠᱟᱛᱷᱟ ᱫᱷᱮᱭᱟᱱ ᱛᱮ ᱟᱸᱡᱚᱢ ᱯᱮ ᱾",
    phonetic: "Sanam gidra ko thir tahen pe ar injag katha dhyan te anjom pe."
  },
  "सभी बच्चे शांत रहिए": {
    olChiki: "ᱥᱟᱱᱟᱢ ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ ᱛᱷᱤᱨ ᱛᱟᱦᱮᱸᱱ ᱯᱮ ᱾",
    phonetic: "Sanam gidra ko thir tahen pe."
  },
  "शांत रहिए": { olChiki: "ᱛᱷᱤᱨ ᱛᱟᱦᱮᱸᱱ ᱯᱮ ᱾", phonetic: "Thir tahen pe." },
  "शांत रहो": { olChiki: "ᱛᱷᱤᱨ ᱛᱟᱦᱮᱸᱱ ᱢᱮ ᱾", phonetic: "Thir tahen me." },
  "सब लोग ब्लैकबोर्ड की तरफ देखिए।": {
    olChiki: "ᱡᱚᱛᱚ ᱦᱚᱲ ᱵᱞᱮᱠᱵᱳᱨᱰ ᱥᱮᱫ ᱠᱚᱭᱚᱜ ᱯᱮ ᱾",
    phonetic: "Joto horh blackboard sed koyog pe."
  },
  "ब्लैकबोर्ड की तरफ देखिए": {
    olChiki: "ᱵᱞᱮᱠᱵᱳᱨᱰ ᱥᱮᱫ ᱠᱚᱭᱚᱜ ᱯᱮ ᱾",
    phonetic: "Blackboard sed koyog pe."
  },
  "सभी बच्चे अपनी किताब खोलो।": {
    olChiki: "ᱥᱟᱱᱟᱢ ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ ᱟᱯᱱᱟᱨᱟᱜ ᱯᱩᱛᱷᱤ ᱡᱷᱤᱡ ᱯᱮ ᱾",
    phonetic: "Sanam gidra ko apnarag puthi jhij pe."
  },
  "अपनी किताब खोलो": {
    olChiki: "ᱟᱢᱟᱜ ᱯᱩᱛᱷᱤ ᱡᱷᱤᱡ ᱢᱮ ᱾",
    phonetic: "Amag puthi jhij me."
  },
  "किताब खोलो": { olChiki: "ᱯᱩᱛᱷᱤ ᱡᱷᱤᱡ ᱢᱮ ᱾", phonetic: "Puthi jhij me." },
  "अपनी किताब निकालो": {
    olChiki: "ᱟᱢᱟᱜ ᱯᱩᱛᱷᱤ ᱚᱰᱚᱠ ᱢᱮ ᱾",
    phonetic: "Amag puthi odok me."
  },
  "अपनी कॉपी निकालो और एक सुंदर चित्र बनाओ।": {
    olChiki: "ᱟᱯᱱᱟᱨᱟᱜ ᱠᱷᱟᱛᱟ ᱚᱰᱚᱠ ᱯᱮ ᱟᱨ ᱢᱤᱫᱴᱟᱝ ᱪᱚᱨᱚᱠ ᱪᱤᱛᱟᱹᱨ ᱵᱮᱱᱟᱣ ᱯᱮ ᱾",
    phonetic: "Apnarag khata odok pe ar midtang chorok chitar benaw pe."
  },
  "चित्र बनाओ": { olChiki: "ᱪᱤᱛᱟᱹᱨ ᱵᱮᱱᱟᱣ ᱢᱮ ᱾", phonetic: "Chitar benaw me." },
  "किताब पढ़ो": { olChiki: "ᱯᱩᱛᱷᱤ ᱯᱟᱲᱦᱟᱣ ᱢᱮ ᱾", phonetic: "Puthi parhaw me." },
  "पाठ पढ़ो": { olChiki: "ᱯᱟᱲᱦᱟᱣ ᱢᱮ ᱾", phonetic: "Parhaw me." },
  "कॉपी में लिखो": { olChiki: "ᱠᱷᱟᱛᱟ ᱨᱮ ᱚᱞ ᱢᱮ ᱾", phonetic: "Khata re ol me." },
  "साफ लिखो": { olChiki: "ᱥᱟᱯᱷᱟ ᱚᱞ ᱢᱮ ᱾", phonetic: "Sapha ol me." },
  "मेरी बात सुनो": { olChiki: "ᱤᱧᱟᱜ ᱠᱟᱛᱷᱟ ᱟᱸᱡᱚᱢ ᱢᱮ ᱾", phonetic: "Injag katha anjom me." },
  "बात सुनो": { olChiki: "ᱠᱟᱛᱷᱟ ᱟᱸᱡᱚᱢ ᱢᱮ ᱾", phonetic: "Katha anjom me." },
  "ध्यान से सुनो": { olChiki: "ᱫᱷᱮᱭᱟᱱ ᱛᱮ ᱟᱸᱡᱚᱢ ᱢᱮ ᱾", phonetic: "Dhyan te anjom me." },
  "आज हम संख्या सीखेंगे।": {
    olChiki: "ᱛᱮᱦᱮᱧ ᱟᱵᱚ ᱮᱞ ᱵᱚᱱ ᱪᱮᱫᱚᱜᱼᱟ ᱾",
    phonetic: "Tehenj abo el bon chedog-aa."
  },
  "आज हम संख्या सीखेंगे": {
    olChiki: "ᱛᱮᱦᱮᱧ ᱟᱵᱚ ᱮᱞ ᱵᱚᱱ ᱪᱮᱫᱚᱜᱼᱟ ᱾",
    phonetic: "Tehenj abo el bon chedog-aa."
  },
  "आज हम जोड़ना और घटाना सीखेंगे।": {
    olChiki: "ᱛᱮᱦᱮᱧ ᱟᱵᱚ ᱡᱚᱲᱟᱣ ᱟᱨ ᱜᱷᱟᱴᱟᱣ ᱵᱚᱱ ᱪᱮᱫᱚᱜ-ᱟ ᱾",
    phonetic: "Tehenj abo jorhaw ar ghataw bon chedog-a."
  },
  "इस सवाल का जवाब कौन जानता है? हाथ उठाइए।": {
    olChiki: "ᱱᱚᱣᱟ ᱠᱩᱠᱞᱤ ᱨᱮᱭᱟᱜ ᱛᱮᱞᱟ ᱚᱠᱚᱭ ᱮ ᱵᱟᱰᱟᱭᱟ? ᱛᱤ ᱛᱩᱞ ᱯᱮ ᱾",
    phonetic: "Nowa kukli reyag tela okoy e badaya? Ti tul pe."
  },
  "हाथ उठाइए": { olChiki: "ᱛᱤ ᱛᱩᱞ ᱯᱮ ᱾", phonetic: "Ti tul pe." },
  "हाथ उठाओ": { olChiki: "ᱛᱤ ᱛᱩᱞ ᱢᱮ ᱾", phonetic: "Ti tul me." },
  "बहुत अच्छा! तुमने बहुत सही उत्तर दिया।": {
    olChiki: "ᱟᱹᱰᱤ ᱱᱟᱯᱟᱭ! ᱟᱢ ᱟᱹᱰᱤ ᱴᱷᱤᱠ ᱛᱮᱞᱟᱢ ᱮᱢ ᱠᱮᱫᱟ ᱾",
    phonetic: "Aadi napay! Aam aadi thik telam em keda."
  },
  "बहुत अच्छा": { olChiki: "ᱟᱹᱰᱤ ᱱᱟᱯᱟᱭ", phonetic: "Aadi napay" },
  "शाबाश": { olChiki: "ᱥᱟᱵᱟᱥ, ᱟᱹᱰᱤ ᱱᱟᱯᱟᱭ!", phonetic: "Sabas, aadi napay!" },
  "डरो मत, फिर से कोशिश करो।": {
    olChiki: "ᱟᱞᱚᱢ ᱵᱚᱛᱚᱨᱚᱜ-ᱟ, ᱟᱨᱦᱚᱸ ᱠᱩᱨᱩᱢᱩᱴᱩᱭ ᱢᱮ ᱾",
    phonetic: "Alom botorog-a, arho kurmutuy me."
  },
  "डरो मत": { olChiki: "ᱟᱞᱚᱢ ᱵᱚᱛᱚᱨᱚᱜ-ᱟ", phonetic: "Alom botorog-a" },
  "मत डरो": { olChiki: "ᱟᱞᱚᱢ ᱵᱚᱛᱚᱨᱚᱜ-ᱟ", phonetic: "Alom botorog-a" },
  "फिर से कोशिश करो": { olChiki: "ᱟᱨᱦᱚᱸ ᱠᱩᱨᱩᱢᱩᱴᱩᱭ ᱢᱮ", phonetic: "Arho kurmutuy me" },
  "आज का पाठ यहीं समाप्त होता है, कल फिर मिलेंगे।": {
    olChiki: "ᱛᱮᱦᱮᱧᱟᱜ ᱯᱟᱲᱦᱟᱣ ᱱᱚᱸᱰᱮ ᱜᱮ ᱢᱩᱪᱟᱹᱫ ᱮᱱᱟ, ᱜᱟᱯᱟ ᱟᱨᱦᱚᱸ ᱵᱚᱱ ᱧᱟᱯᱟᱢᱟ ᱾",
    phonetic: "Tehenjag parhaw nonde ge muchad ena, gapa arho bon nyapama."
  },

  // Daily Needs, Food & Water
  "मुझे भूख लगी है": { olChiki: "ᱤᱧ ᱨᱮᱸᱜᱮᱡ ᱤᱧ ᱠᱟᱱᱟ ᱾", phonetic: "Inj rengej inj kana." },
  "मुझे भूख लगी है।": { olChiki: "ᱤᱧ ᱨᱮᱸᱜᱮᱡ ᱤᱧ ᱠᱟᱱᱟ ᱾", phonetic: "Inj rengej inj kana." },
  "मुझे प्यास लगी है": { olChiki: "ᱤᱧ ᱛᱮᱛᱟᱝ ᱤᱧ ᱠᱟᱱᱟ ᱾", phonetic: "Inj tetang inj kana." },
  "मुझे पानी पीना है": { olChiki: "ᱤᱧ ᱫᱟᱜ ᱧᱩ ᱥᱟᱱᱟᱹᱧ ᱠᱟᱱᱟ ᱾", phonetic: "Inj daag nyu sananj kana." },
  "मुझे पानी पीना है।": { olChiki: "ᱤᱧ ᱫᱟᱜ ᱧᱩ ᱥᱟᱱᱟᱹᱧ ᱠᱟᱱᱟ ᱾", phonetic: "Inj daag nyu sananj kana." },
  "मुझे पानी दो": { olChiki: "ᱤᱧ ᱫᱟᱜ ᱮᱢᱟᱹᱧ ᱢᱮ ᱾", phonetic: "Inj daag emanj me." },
  "पानी लाओ": { olChiki: "ᱫᱟᱜ ᱟᱹᱜᱩᱭ ᱢᱮ ᱾", phonetic: "Daag aguy me." },
  "पानी पियो": { olChiki: "ᱫᱟᱜ ᱧᱩᱭ ᱢᱮ ᱾", phonetic: "Daag nyuy me." },
  "खाना खाओ": { olChiki: "ᱫᱟᱠᱟ ᱡᱚᱢ ᱢᱮ ᱾", phonetic: "Daka jom me." },
  "खाना खा लो": { olChiki: "ᱫᱟᱠᱟ ᱡᱚᱢ ᱢᱮ ᱾", phonetic: "Daka jom me." },
  "मैं खाना खा रहा हूँ": { olChiki: "ᱤᱧ ᱫᱟᱠᱟ-ᱧ ᱡᱚᱢ ᱮᱫᱟ ᱾", phonetic: "Inj daka-nj jom eda." },
  "मैं खाना खा रहा हूँ।": { olChiki: "ᱤᱧ ᱫᱟᱠᱟ-ᱧ ᱡᱚᱢ ᱮᱫᱟ ᱾", phonetic: "Inj daka-nj jom eda." },
  "हाथ धो लो": { olChiki: "ᱛᱤ ᱟᱹᱨᱩᱵ ᱢᱮ ᱾", phonetic: "Ti arub me." },
  "हाथ साफ़ करो": { olChiki: "ᱛᱤ ᱥᱟᱯᱷᱟᱭ ᱢᱮ ᱾", phonetic: "Ti saphay me." },
  "चलो खेलने चलें": { olChiki: "ᱫᱮᱞᱟ ᱮᱱᱮᱡ ᱵᱚᱱ ᱪᱟᱞᱟᱜ-ᱟ ᱾", phonetic: "Dela enej bon chalag-a." },
  "चलो खेलते हैं": { olChiki: "ᱫᱮᱞᱟ ᱮᱱᱮᱡ ᱵᱚᱱ ᱪᱟᱞᱟᱜ-ᱟ ᱾", phonetic: "Dela enej bon chalag-a." },
  "मेरी मदद करो": { olChiki: "ᱤᱧ ᱜᱚᱲᱚᱣᱟᱹᱧ ᱢᱮ ᱾", phonetic: "Inj gorhowanj me." },
  "मदद कीजिए": { olChiki: "ᱜᱚᱲᱚᱣᱟᱹᱧ ᱢᱮ ᱾", phonetic: "Gorhowanj me." },

  // Environment & Weather
  "आज बहुत तेज़ बारिश हो रही है।": { olChiki: "ᱛᱮᱦᱮᱧ ᱟᱹᱰᱤ ᱰᱷᱮᱨ ᱫᱟᱜ ᱦᱩᱭᱩᱜ ᱠᱟᱱᱟ ᱾", phonetic: "Tehenj aadi dher daag huyug kana." },
  "आज बहुत तेज़ बारिश हो रही है": { olChiki: "ᱛᱮᱦᱮᱧ ᱟᱹᱰᱤ ᱰᱷᱮᱨ ᱫᱟᱜ ᱦᱩᱭᱩᱜ ᱠᱟᱱᱟ ᱾", phonetic: "Tehenj aadi dher daag huyug kana." },
  "बारिश हो रही है": { olChiki: "ᱫᱟᱜ ᱦᱩᱭᱩᱜ ᱠᱟᱱᱟ ᱾", phonetic: "Daag huyug kana." },
  "आज धूप बहुत तेज़ है।": { olChiki: "ᱛᱮᱦᱮᱧ ᱥᱤᱛᱩᱝ ᱟᱹᱰᱤ ᱛᱮᱡ ᱜᱮᱭᱟ ᱾", phonetic: "Tehenj situng aadi tej geya." },
  "आज धूप बहुत तेज़ है": { olChiki: "ᱛᱮᱦᱮᱧ ᱥᱤᱛᱩᱝ ᱟᱹᱰᱤ ᱛᱮᱡ ᱜᱮᱭᱟ ᱾", phonetic: "Tehenj situng aadi tej geya." },
  "पेड़ हमें ताज़ी हवा और फल देते हैं।": {
    olChiki: "ᱫᱟᱨᱮ ᱫᱚ ᱟᱵᱚ ᱥᱚᱨᱮᱥ ᱦᱚᱭ ᱟᱨ ᱡᱚ ᱮᱢᱟᱵᱚᱱᱟ ᱾",
    phonetic: "Dare do abo sores hoy ar jo emabona."
  },
  "यह कितने का है?": { olChiki: "ᱱᱚᱣᱟ ᱫᱚ ᱛᱤᱱᱟᱹᱜ ᱫᱟᱢ?", phonetic: "Nowa do tinag daam?" },
  "यह कितने का है": { olChiki: "ᱱᱚᱣᱟ ᱫᱚ ᱛᱤᱱᱟᱹᱜ ᱫᱟᱢ?", phonetic: "Nowa do tinag daam?" },
  "किसान खेत में काम कर रहा है।": { olChiki: "ᱪᱟᱹᱥᱤ ᱠᱷᱮᱛ ᱨᱮ ᱠᱟᱹᱢᱤ ᱠᱟᱱᱟᱭ ᱾", phonetic: "Chasi khet re kami kanay." },
  "हम सब साथ मिलकर काम करेंगे।": { olChiki: "ᱟᱵᱚ ᱡᱚᱛᱚ ᱦᱚᱲ ᱢᱤᱫ ᱥᱟᱶᱛᱮ ᱠᱟᱹᱢᱤ ᱵᱚᱱ ᱠᱟᱹᱢᱤᱭᱟ ᱾", phonetic: "Abo joto horh mid sawte kami bon kamiya." }
};

// ── EXPANDED VOCABULARY ENGINE (VERB PARADIGMS, NOUNS, ROOTS) ───────────────
export const HINDI_SANTALI_VOCAB: Record<string, { olChiki: string; phonetic: string }> = {
  // Pronouns & Demonstratives
  "मैं": { olChiki: "ᱤᱧ", phonetic: "Inj" },
  "मुझे": { olChiki: "ᱤᱧ", phonetic: "Inj" },
  "मुझको": { olChiki: "ᱤᱧ", phonetic: "Inj" },
  "हम": { olChiki: "ᱟᱵᱚ", phonetic: "Abo" },
  "हमें": { olChiki: "ᱟᱵᱚ", phonetic: "Abo" },
  "हमको": { olChiki: "ᱟᱵᱚ", phonetic: "Abo" },
  "तुम": { olChiki: "ᱟᱢ", phonetic: "Aam" },
  "तुम्हें": { olChiki: "ᱟᱢ", phonetic: "Aam" },
  "तुमको": { olChiki: "ᱟᱢ", phonetic: "Aam" },
  "आप": { olChiki: "ᱟᱢ", phonetic: "Aam" },
  "आपको": { olChiki: "ᱟᱢ", phonetic: "Aam" },
  "वह": { olChiki: "ᱩᱱᱤ", phonetic: "Uni" },
  "वो": { olChiki: "ᱩᱱᱤ", phonetic: "Uni" },
  "उसे": { olChiki: "ᱩᱱᱤ", phonetic: "Uni" },
  "उसको": { olChiki: "ᱩᱱᱤ", phonetic: "Uni" },
  "वे": { olChiki: "ᱩᱱᱠᱩ", phonetic: "Unku" },
  "उन्हें": { olChiki: "ᱩᱱᱠᱩ", phonetic: "Unku" },
  "उनको": { olChiki: "ᱩᱱᱠᱩ", phonetic: "Unku" },
  "यह": { olChiki: "ᱱᱚᱣᱟ", phonetic: "Nowa" },
  "ये": { olChiki: "ᱱᱩᱠᱩ", phonetic: "Nuku" },
  "मेरा": { olChiki: "ᱤᱧᱟᱜ", phonetic: "Injag" },
  "मेरी": { olChiki: "ᱤᱧᱟᱜ", phonetic: "Injag" },
  "मेरे": { olChiki: "ᱤᱧᱟᱜ", phonetic: "Injag" },
  "हमारा": { olChiki: "ᱟᱵᱚᱣᱟᱜ", phonetic: "Abowag" },
  "हमारी": { olChiki: "ᱟᱵᱚᱣᱟᱜ", phonetic: "Abowag" },
  "हमारे": { olChiki: "ᱟᱵᱚᱣᱟᱜ", phonetic: "Abowag" },
  "तुम्हारा": { olChiki: "ᱟᱢᱟᱜ", phonetic: "Amag" },
  "तुम्हारी": { olChiki: "ᱟᱢᱟᱜ", phonetic: "Amag" },
  "तुम्हारे": { olChiki: "ᱟᱢᱟᱜ", phonetic: "Amag" },
  "आपका": { olChiki: "ᱟᱢᱟᱜ", phonetic: "Amag" },
  "आपकी": { olChiki: "ᱟᱢᱟᱜ", phonetic: "Amag" },
  "आपके": { olChiki: "ᱟᱢᱟᱜ", phonetic: "Amag" },
  "उसका": { olChiki: "ᱩᱱᱤᱭᱟᱜ", phonetic: "Uniyag" },
  "उसकी": { olChiki: "ᱩᱱᱤᱭᱟᱜ", phonetic: "Uniyag" },
  "उसके": { olChiki: "ᱩᱱᱤᱭᱟᱜ", phonetic: "Uniyag" },
  "उनका": { olChiki: "ᱩᱱᱠᱩᱣᱟᱜ", phonetic: "Unkuwag" },
  "उनकी": { olChiki: "ᱩᱱᱠᱩᱣᱟᱜ", phonetic: "Unkuwag" },
  "उनके": { olChiki: "ᱩᱱᱠᱩᱣᱟᱜ", phonetic: "Unkuwag" },

  // Question Words
  "क्या": { olChiki: "ᱪᱮᱫ", phonetic: "Ched" },
  "क्यों": { olChiki: "ᱪᱮᱫᱟᱜ", phonetic: "Chedag" },
  "कहाँ": { olChiki: "ᱚᱠᱟᱨᱮ", phonetic: "Okare" },
  "कब": { olChiki: "ᱛᱤᱥ", phonetic: "Tis" },
  "कैसे": { olChiki: "ᱪᱮᱫ ᱞᱮᱠᱟ", phonetic: "Ched leka" },
  "कैसा": { olChiki: "ᱪᱮᱫ ᱞᱮᱠᱟᱱ", phonetic: "Ched lekan" },
  "कैसी": { olChiki: "ᱪᱮᱫ ᱞᱮᱠᱟᱱ", phonetic: "Ched lekan" },
  "कौन": { olChiki: "ᱚᱠᱚᱭ", phonetic: "Okoy" },
  "किसका": { olChiki: "ᱚᱠᱚᱭᱟᱜ", phonetic: "Okoyag" },
  "किसकी": { olChiki: "ᱚᱠᱚᱭᱟᱜ", phonetic: "Okoyag" },
  "किसके": { olChiki: "ᱚᱠᱚᱭᱟᱜ", phonetic: "Okoyag" },
  "किसको": { olChiki: "ᱚᱠᱚᱭ", phonetic: "Okoy" },
  "कितना": { olChiki: "ᱛᱤᱱᱟᱹᱜ", phonetic: "Tinag" },
  "कितने": { olChiki: "ᱛᱤᱱᱟᱹᱜ", phonetic: "Tinag" },
  "कितनी": { olChiki: "ᱛᱤᱱᱟᱹᱜ", phonetic: "Tinag" },

  // Direction & Spatial Location
  "यहाँ": { olChiki: "ᱱᱚᱸᱰᱮ", phonetic: "Nonde" },
  "वहाँ": { olChiki: "ᱚᱸᱰᱮ", phonetic: "Onde" },
  "इधर": { olChiki: "ᱱᱚᱛᱮ", phonetic: "Note" },
  "उधर": { olChiki: "ᱦᱟᱱᱛᱮ", phonetic: "Hante" },
  "किधर": { olChiki: "ᱚᱠᱟ ᱥᱮᱫ", phonetic: "Oka sed" },
  "अंदर": { olChiki: "ᱵᱷᱤᱛᱨᱤ", phonetic: "Bhitri" },
  "बाहर": { olChiki: "ᱵᱟᱦᱨᱮ", phonetic: "Bahre" },
  "ऊपर": { olChiki: "ᱪᱮᱛᱟᱱ", phonetic: "Chetan" },
  "नीचे": { olChiki: "ᱞᱟᱛᱟᱨ", phonetic: "Latar" },
  "आगे": { olChiki: "ᱞᱟᱦᱟ", phonetic: "Laha" },
  "पीछे": { olChiki: "ᱛᱟᱭᱚᱢ", phonetic: "Tayom" },
  "पास": { olChiki: "ᱥᱩᱨ", phonetic: "Sur" },
  "नजदीक": { olChiki: "ᱥᱩᱨ", phonetic: "Sur" },
  "दूर": { olChiki: "ᱥᱟᱺᱜᱤᱧ", phonetic: "Sanginj" },

  // Verbs & Common Actions (with imperative, continuous & root inflections)
  // To do (करना)
  "करना": { olChiki: "ᱠᱟᱹᱢᱤ", phonetic: "Kami" },
  "करो": { olChiki: "ᱠᱟᱹᱢᱤᱭ ᱢᱮ", phonetic: "Kamiy me" },
  "कीजिए": { olChiki: "ᱠᱟᱹᱢᱤᱭ ᱢᱮ", phonetic: "Kamiy me" },
  "कर": { olChiki: "ᱠᱟᱹᱢᱤ", phonetic: "Kami" },
  "करता": { olChiki: "ᱠᱟᱹᱢᱤᱭᱟ", phonetic: "Kamiya" },
  "करते": { olChiki: "ᱠᱟᱹᱢᱤᱭᱟ ᱠᱚ", phonetic: "Kamiya ko" },
  "करती": { olChiki: "ᱠᱟᱹᱢᱤᱭᱟ", phonetic: "Kamiya" },
  "किया": { olChiki: "ᱠᱟᱹᱢᱤ ᱠᱮᱫᱟ", phonetic: "Kami keda" },
  "करेंगे": { olChiki: "ᱠᱟᱹᱢᱤᱭᱟ ᱵᱚᱱ", phonetic: "Kamiya bon" },

  // To come (आना)
  "आना": { olChiki: "ᱦᱤᱡᱩᱜ", phonetic: "Hijug" },
  "आओ": { olChiki: "ᱦᱤᱡᱩᱜ ᱢᱮ", phonetic: "Hijug me" },
  "आइए": { olChiki: "ᱦᱤᱡᱩᱜ ᱢᱮ", phonetic: "Hijug me" },
  "आ": { olChiki: "ᱦᱮᱡ", phonetic: "Hej" },
  "आता": { olChiki: "ᱦᱤᱡᱩᱜ-ᱟ", phonetic: "Hijug-a" },
  "आते": { olChiki: "ᱦᱤᱡᱩᱜ ᱠᱟᱱᱟ ᱠᱚ", phonetic: "Hijug kana ko" },
  "आया": { olChiki: "ᱦᱮᱡ ᱮᱱᱟ", phonetic: "Hej ena" },
  "आए": { olChiki: "ᱦᱮᱡ ᱮᱱᱟ ᱠᱚ", phonetic: "Hej ena ko" },
  "आओगे": { olChiki: "ᱦᱤᱡᱩᱜ-ᱟᱢ", phonetic: "Hijug-am" },
  "आएंगे": { olChiki: "ᱦᱤᱡᱩᱜ-ᱟ ᱠᱚ", phonetic: "Hijug-a ko" },

  // To go (जाना)
  "जाना": { olChiki: "ᱥᱮᱱᱚᱜ", phonetic: "Senog" },
  "जाओ": { olChiki: "ᱥᱮᱱᱚᱜ ᱢᱮ", phonetic: "Senog me" },
  "जाइए": { olChiki: "ᱥᱮᱱᱚᱜ ᱢᱮ", phonetic: "Senog me" },
  "जा": { olChiki: "ᱥᱮᱱ", phonetic: "Sen" },
  "जाता": { olChiki: "ᱪᱟᱞᱟᱜ-ᱟ", phonetic: "Chalag-a" },
  "जाते": { olChiki: "ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ ᱠᱚ", phonetic: "Senog kana ko" },
  "गया": { olChiki: "ᱥᱮᱱ ᱮᱱᱟ", phonetic: "Sen ena" },
  "गए": { olChiki: "ᱥᱮᱱ ᱮᱱᱟ ᱠᱚ", phonetic: "Sen ena ko" },
  "गई": { olChiki: "ᱥᱮᱱ ᱮᱱᱟ", phonetic: "Sen ena" },
  "जाएंगे": { olChiki: "ᱥᱮᱱᱚᱜ-ᱟ ᱵᱚᱱ", phonetic: "Senog-a bon" },

  // To eat (खाना)
  "खाना": { olChiki: "ᱫᱟᱠᱟ", phonetic: "Daka" },
  "खाओ": { olChiki: "ᱡᱚᱢ ᱢᱮ", phonetic: "Jom me" },
  "खाइए": { olChiki: "ᱡᱚᱢ ᱢᱮ", phonetic: "Jom me" },
  "खा": { olChiki: "ᱡᱚᱢ", phonetic: "Jom" },
  "खाया": { olChiki: "ᱡᱚᱢ ᱠᱮᱫᱟ", phonetic: "Jom keda" },
  "खाता": { olChiki: "ᱡᱚᱢᱟ", phonetic: "Joma" },
  "खाते": { olChiki: "ᱡᱚᱢ ᱠᱟᱱᱟ ᱠᱚ", phonetic: "Jom kana ko" },

  // To drink (पीना)
  "पीना": { olChiki: "ᱧᱩ", phonetic: "Nyu" },
  "पियो": { olChiki: "ᱧᱩᱭ ᱢᱮ", phonetic: "Nyuy me" },
  "पीजिए": { olChiki: "ᱧᱩᱭ ᱢᱮ", phonetic: "Nyuy me" },
  "पी": { olChiki: "ᱧᱩ", phonetic: "Nyu" },
  "पिया": { olChiki: "ᱧᱩ ᱠᱮᱫᱟ", phonetic: "Nyu keda" },

  // To speak (बोलना / कहना)
  "बोलना": { olChiki: "ᱨᱚᱲ", phonetic: "Rorh" },
  "बोलो": { olChiki: "ᱨᱚᱲ ᱢᱮ", phonetic: "Rorh me" },
  "बोलिए": { olChiki: "ᱨᱚᱲ ᱢᱮ", phonetic: "Rorh me" },
  "बोल": { olChiki: "ᱨᱚᱲ", phonetic: "Rorh" },
  "बोला": { olChiki: "ᱞᱟᱹᱭ ᱠᱮᱫᱟ", phonetic: "Lay keda" },
  "कहना": { olChiki: "ᱞᱟᱹᱭ", phonetic: "Lay" },
  "कहो": { olChiki: "ᱞᱟᱹᱭ ᱢᱮ", phonetic: "Lay me" },
  "कहिए": { olChiki: "ᱞᱟᱹᱭ ᱢᱮ", phonetic: "Lay me" },
  "कहा": { olChiki: "ᱞᱟᱹᱭ ᱠᱮᱫᱟ", phonetic: "Lay keda" },

  // To listen (सुनना)
  "सुनना": { olChiki: "ᱟᱸᱡᱚᱢ", phonetic: "Anjom" },
  "सुनो": { olChiki: "ᱟᱸᱡᱚᱢ ᱢᱮ", phonetic: "Anjom me" },
  "सुनिए": { olChiki: "ᱟᱸᱡᱚᱢ ᱯᱮ", phonetic: "Anjom pe" },
  "सुन": { olChiki: "ᱟᱸᱡᱚᱢ", phonetic: "Anjom" },
  "सुना": { olChiki: "ᱟᱸᱡᱚᱢ ᱠᱮᱫᱟ", phonetic: "Anjom keda" },

  // To see / look (देखना)
  "देखना": { olChiki: "ᱧᱮᱞ", phonetic: "Nyel" },
  "देखो": { olChiki: "ᱧᱮᱞ ᱢᱮ", phonetic: "Nyel me" },
  "देखिए": { olChiki: "ᱠᱚᱭᱚᱜ ᱯᱮ", phonetic: "Koyog pe" },
  "देख": { olChiki: "ᱧᱮᱞ", phonetic: "Nyel" },
  "देखा": { olChiki: "ᱧᱮᱞ ᱠᱮᱫᱟ", phonetic: "Nyel keda" },

  // To read (पढ़ना)
  "पढ़ना": { olChiki: "ᱯᱟᱲᱦᱟᱣ", phonetic: "Parhaw" },
  "पढ़ो": { olChiki: "ᱯᱟᱲᱦᱟᱣ ᱢᱮ", phonetic: "Parhaw me" },
  "पढ़िए": { olChiki: "ᱯᱟᱲᱦᱟᱣ ᱯᱮ", phonetic: "Parhaw pe" },
  "पढ़": { olChiki: "ᱯᱟᱲᱦᱟᱣ", phonetic: "Parhaw" },
  "पढ़ा": { olChiki: "ᱯᱟᱲᱦᱟᱣ ᱠᱮᱫᱟ", phonetic: "Parhaw keda" },

  // To write (लिखना)
  "लिखना": { olChiki: "ᱚᱞ", phonetic: "Ol" },
  "लिखो": { olChiki: "ᱚᱞ ᱢᱮ", phonetic: "Ol me" },
  "लिखिए": { olChiki: "ᱚᱞ ᱯᱮ", phonetic: "Ol pe" },
  "लिख": { olChiki: "ᱚᱞ", phonetic: "Ol" },
  "लिखा": { olChiki: "ᱚᱞ ᱠᱮᱫᱟ", phonetic: "Ol keda" },

  // To sit (बैठना)
  "बैठना": { olChiki: "ᱫᱩᱲᱩᱵ", phonetic: "Durhub" },
  "बैठो": { olChiki: "ᱫᱩᱲᱩᱵ ᱢᱮ", phonetic: "Durhub me" },
  "बैठिए": { olChiki: "ᱫᱩᱲᱩᱵ ᱯᱮ", phonetic: "Durhub pe" },
  "बैठ": { olChiki: "ᱫᱩᱲᱩᱵ", phonetic: "Durhub" },
  "बैठा": { olChiki: "ᱫᱩᱲᱩᱵ ᱮᱱᱟ", phonetic: "Durhub ena" },

  // To stand / rise (उठना / खड़ा होना)
  "उठना": { olChiki: "ᱵᱮᱨᱮᱫ", phonetic: "Bered" },
  "उठो": { olChiki: "ᱵᱮᱨᱮᱫ ᱢᱮ", phonetic: "Bered me" },
  "उठिए": { olChiki: "ᱵᱮᱨᱮᱫ ᱯᱮ", phonetic: "Bered pe" },
  "उठ": { olChiki: "ᱵᱮᱨᱮᱫ", phonetic: "Bered" },
  "खड़ा": { olChiki: "ᱛᱤᱸᱜᱩ", phonetic: "Tingu" },
  "खड़े": { olChiki: "ᱛᱤᱸᱜᱩ", phonetic: "Tingu" },

  // To sleep (सोना)
  "सोना": { olChiki: "ᱜᱤᱛᱤᱡ", phonetic: "Gitij" },
  "सो": { olChiki: "ᱜᱤᱛᱤᱡ", phonetic: "Gitij" },
  "सोया": { olChiki: "ᱜᱤᱛᱤᱡ ᱮᱱᱟ", phonetic: "Gitij ena" },

  // To give (देना)
  "देना": { olChiki: "ᱮᱢ", phonetic: "Em" },
  "दो": { olChiki: "ᱮᱢᱟᱹᱧ ᱢᱮ", phonetic: "Emanj me" },
  "दीजिए": { olChiki: "ᱮᱢᱟᱹᱧ ᱯᱮ", phonetic: "Emanj pe" },
  "दे": { olChiki: "ᱮᱢ", phonetic: "Em" },
  "दिया": { olChiki: "ᱮᱢ ᱠᱮᱫᱟ", phonetic: "Em keda" },
  "देते": { olChiki: "ᱮᱢᱟ", phonetic: "Ema" },

  // To take (लेना)
  "लेना": { olChiki: "ᱦᱟᱛᱟᱣ", phonetic: "Hataw" },
  "लो": { olChiki: "ᱦᱟᱛᱟᱣ ᱢᱮ", phonetic: "Hataw me" },
  "लीजिये": { olChiki: "ᱦᱟᱛᱟᱣ ᱯᱮ", phonetic: "Hataw pe" },
  "ले": { olChiki: "ᱦᱟᱛᱟᱣ", phonetic: "Hataw" },
  "लिया": { olChiki: "ᱦᱟᱛᱟᱣ ᱠᱮᱫᱟ", phonetic: "Hataw keda" },

  // To bring (लाना)
  "लाना": { olChiki: "ᱟᱹᱜᱩ", phonetic: "Agu" },
  "लाओ": { olChiki: "ᱟᱹᱜᱩᱭ ᱢᱮ", phonetic: "Aguy me" },
  "लाइए": { olChiki: "ᱟᱹᱜᱩᱭ ᱯᱮ", phonetic: "Aguy pe" },
  "ला": { olChiki: "ᱟᱹᱜᱩ", phonetic: "Agu" },
  "लाया": { olChiki: "ᱟᱹᱜᱩ ᱠᱮᱫᱟ", phonetic: "Agu keda" },

  // To keep / put (रखना)
  "रखना": { olChiki: "ᱫᱚᱦᱚ", phonetic: "Doho" },
  "रखो": { olChiki: "ᱫᱚᱦᱚᱭ ᱢᱮ", phonetic: "Dohoy me" },
  "रखिए": { olChiki: "ᱫᱚᱦᱚᱭ ᱯᱮ", phonetic: "Dohoy pe" },
  "रख": { olChiki: "ᱫᱚᱦᱚ", phonetic: "Doho" },

  // To walk / move (चलना)
  "चलना": { olChiki: "ᱛᱟᱲᱟᱢ", phonetic: "Tarham" },
  "चलो": { olChiki: "ᱫᱮᱞᱟ", phonetic: "Dela" },
  "चल": { olChiki: "ᱫᱮᱞᱟ", phonetic: "Dela" },
  "चलें": { olChiki: "ᱵᱚᱱ ᱪᱟᱞᱟᱜ-ᱟ", phonetic: "Bon chalag-a" },

  // To stop (रुकना)
  "रुकना": { olChiki: "ᱛᱤᱸᱜᱩ", phonetic: "Tingu" },
  "रुको": { olChiki: "ᱛᱤᱸᱜᱩᱱ ᱢᱮ", phonetic: "Tingun me" },
  "रुकिए": { olChiki: "ᱛᱤᱸᱜᱩᱱ ᱯᱮ", phonetic: "Tingun pe" },
  "रुक": { olChiki: "ᱛᱤᱸᱜᱩ", phonetic: "Tingu" },

  // To play (खेलना)
  "खेलना": { olChiki: "ᱮᱱᱮᱡ", phonetic: "Enej" },
  "खेले": { olChiki: "ᱮᱱᱮᱡ ᱠᱮᱫᱟ", phonetic: "Enej keda" },
  "खेलते": { olChiki: "ᱮᱱᱮᱡ ᱠᱟᱱᱟ", phonetic: "Enej kana" },
  "खेल": { olChiki: "ᱮᱱᱮᱡ", phonetic: "Enej" },

  // To learn & teach (सीखना / सिखाना)
  "सीखना": { olChiki: "ᱪᱮᱫᱚᱜ", phonetic: "Chedog" },
  "सीखो": { olChiki: "ᱪᱮᱫᱚᱜ ᱢᱮ", phonetic: "Chedog me" },
  "सीखेंगे": { olChiki: "ᱵᱚᱱ ᱪᱮᱫᱚᱜ-ᱟ", phonetic: "Bon chedog-a" },
  "सीख": { olChiki: "ᱪᱮᱫ", phonetic: "Ched" },

  // To understand (समझना)
  "समझना": { olChiki: "ᱵᱩᱡᱷᱟᱹᱣ", phonetic: "Bujhaw" },
  "समझो": { olChiki: "ᱵᱩᱡᱷᱟᱹᱣ ᱢᱮ", phonetic: "Bujhaw me" },
  "समझे": { olChiki: "ᱵᱩᱡᱷᱟᱹᱣ ᱠᱮᱫᱟ", phonetic: "Bujhaw keda" },
  "समझ": { olChiki: "ᱵᱩᱡᱷᱟᱹᱣ", phonetic: "Bujhaw" },

  // To wash (धोना)
  "धोना": { olChiki: "ᱟᱹᱨᱩᱵ", phonetic: "Arub" },
  "धो": { olChiki: "ᱟᱹᱨᱩᱵ", phonetic: "Arub" },

  // To stay / live (रहना)
  "रहना": { olChiki: "ᱛᱟᱦᱮᱸᱱ", phonetic: "Tahen" },
  "रहते": { olChiki: "ᱛᱟᱦᱮᱸᱱᱟ", phonetic: "Tahena" },
  "रहता": { olChiki: "ᱛᱟᱦᱮᱸᱱᱟᱭ", phonetic: "Tahenay" },
  "रहती": { olChiki: "ᱛᱟᱦᱮᱸᱱᱟᱭ", phonetic: "Tahenay" },
  "रहो": { olChiki: "ᱛᱟᱦᱮᱸᱱ ᱢᱮ", phonetic: "Tahen me" },
  "रहिए": { olChiki: "ᱛᱟᱦᱮᱸᱱ ᱯᱮ", phonetic: "Tahen pe" },

  // Continuous auxiliaries (रहा, रहे, रही)
  "रहा": { olChiki: "ᱠᱟᱱᱟ", phonetic: "Kana" },
  "रहे": { olChiki: "ᱠᱟᱱᱟ", phonetic: "Kana" },
  "रही": { olChiki: "ᱠᱟᱱᱟ", phonetic: "Kana" },

  // Copulas & Auxiliaries (है, हैं, हूँ, हो, था, थे)
  "है": { olChiki: "ᱠᱟᱱᱟ", phonetic: "Kana" },
  "हैं": { olChiki: "ᱠᱟᱱᱟ ᱠᱚ", phonetic: "Kana ko" },
  "हूँ": { olChiki: "ᱠᱟᱹᱱᱟᱹᱧ", phonetic: "Kananj" },
  "हो": { olChiki: "ᱠᱟᱱᱟᱢ", phonetic: "Kanam" },
  "था": { olChiki: "ᱛᱟᱦᱮᱸ ᱠᱟᱱᱟ", phonetic: "Tahen kana" },
  "थी": { olChiki: "ᱛᱟᱦᱮᱸ ᱠᱟᱱᱟ", phonetic: "Tahen kana" },
  "थे": { olChiki: "ᱛᱟᱦᱮᱸ ᱠᱟᱱᱟ ᱠᱚ", phonetic: "Tahen kana ko" },
  "होगा": { olChiki: "ᱦᱩᱭᱩᱜ-ᱟ", phonetic: "Huyug-a" },
  "होगी": { olChiki: "ᱦᱩᱭᱩᱜ-ᱟ", phonetic: "Huyug-a" },

  // People & Family
  "नाम": { olChiki: "ᱧᱩᱛᱩᱢ", phonetic: "Nyutum" },
  "भाई": { olChiki: "ᱵᱚᱭᱦᱟ", phonetic: "Boyha" },
  "बहन": { olChiki: "ᱢᱤᱥᱨᱟ", phonetic: "Misra" },
  "माँ": { olChiki: "ᱟᱭᱳ", phonetic: "Ayo" },
  "माताजी": { olChiki: "ᱟᱭᱳ", phonetic: "Ayo" },
  "पिता": { olChiki: "ᱵᱟᱵᱟ", phonetic: "Baba" },
  "पिताजी": { olChiki: "ᱵᱟᱵᱟ", phonetic: "Baba" },
  "बच्चा": { olChiki: "ᱜᱤᱫᱽᱨᱟᱹ", phonetic: "Gidra" },
  "बच्चे": { olChiki: "ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ", phonetic: "Gidra ko" },
  "बच्चों": { olChiki: "ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ", phonetic: "Gidra ko" },
  "लड़का": { olChiki: "ᱠᱚᱲᱟ", phonetic: "Kora" },
  "लड़के": { olChiki: "ᱠᱚᱲᱟ ᱠᱚ", phonetic: "Kora ko" },
  "लड़की": { olChiki: "ᱠᱩᱲᱤ", phonetic: "Kuri" },
  "लड़कियाँ": { olChiki: "ᱠᱩᱲᱤ ᱠᱚ", phonetic: "Kuri ko" },
  "दोस्त": { olChiki: "ᱜᱟᱛᱮ", phonetic: "Gate" },
  "मित्र": { olChiki: "ᱜᱟᱛᱮ", phonetic: "Gate" },
  "लोग": { olChiki: "ᱦᱚᱲ", phonetic: "Horh" },
  "आदमी": { olChiki: "ᱦᱚᱲ", phonetic: "Horh" },
  "औरत": { olChiki: "ᱢᱟᱹᱭᱡᱤᱣ", phonetic: "Mayjiw" },
  "शिक्षक": { olChiki: "ᱢᱟᱪᱮᱛ", phonetic: "Machet" },
  "शिक्षिका": { olChiki: "ᱢᱟᱪᱮᱛᱟᱹᱱᱤ", phonetic: "Machetani" },
  "विद्यार्थी": { olChiki: "ᱯᱟᱹᱴᱷᱩᱣᱟᱹ", phonetic: "Pathuwa" },
  "छात्र": { olChiki: "ᱯᱟᱹᱴᱷᱩᱣᱟᱹ", phonetic: "Pathuwa" },
  "किसान": { olChiki: "ᱪᱟᱹᱥᱤ", phonetic: "Chasi" },
  "दुकानदार": { olChiki: "ᱫᱚᱠᱟᱱᱤᱭᱟᱹ", phonetic: "Dokanriya" },
  "डॉक्टर": { olChiki: "ᱰᱟᱠᱛᱚᱨ", phonetic: "Daktar" },

  // Classroom & Education
  "किताब": { olChiki: "ᱯᱩᱛᱷᱤ", phonetic: "Puthi" },
  "पुस्तक": { olChiki: "ᱯᱩᱛᱷᱤ", phonetic: "Puthi" },
  "कॉपी": { olChiki: "ᱠᱷᱟᱛᱟ", phonetic: "Khata" },
  "कलम": { olChiki: "ᱠᱚᱞᱚᱢ", phonetic: "Kolom" },
  "पेंसिल": { olChiki: "ᱯᱮᱱᱥᱤᱞ", phonetic: "Pencil" },
  "स्कूल": { olChiki: "ᱵᱤᱨᱫᱟᱹᱜᱟᱲ", phonetic: "Birdagarh" },
  "विद्यालय": { olChiki: "ᱵᱤᱨᱫᱟᱹᱜᱟᱲ", phonetic: "Birdagarh" },
  "पाठ": { olChiki: "ᱯᱟᱲᱦᱟᱣ", phonetic: "Parhaw" },
  "संख्या": { olChiki: "ᱮᱞ", phonetic: "El" },
  "चित्र": { olChiki: "ᱪᱤᱛᱟᱹᱨ", phonetic: "Chitar" },
  "ब्लैकबोर्ड": { olChiki: "ᱵᱞᱮᱠᱵᱳᱨᱰ", phonetic: "Blackboard" },
  "सवाल": { olChiki: "ᱠᱩᱠᱞᱤ", phonetic: "Kukli" },
  "प्रश्न": { olChiki: "ᱠᱩᱠᱞᱤ", phonetic: "Kukli" },
  "जवाब": { olChiki: "ᱛᱮᱞᱟ", phonetic: "Tela" },
  "उत्तर": { olChiki: "ᱛᱮᱞᱟ", phonetic: "Tela" },
  "बात": { olChiki: "ᱠᱟᱛᱷᱟ", phonetic: "Katha" },
  "बातें": { olChiki: "ᱠᱟᱛᱷᱟ", phonetic: "Katha" },
  "मदद": { olChiki: "ᱜᱚᱲᱚ", phonetic: "Gorho" },
  "काम": { olChiki: "ᱠᱟᱹᱢᱤ", phonetic: "Kami" },

  // Body Parts
  "हाथ": { olChiki: "ᱛᱤ", phonetic: "Ti" },
  "पैर": { olChiki: "ᱡᱟᱝᱜᱟ", phonetic: "Janga" },
  "आँख": { olChiki: "ᱢᱮᱫ", phonetic: "Med" },
  "आँखें": { olChiki: "ᱢᱮᱫ ᱠᱤᱱ", phonetic: "Med kin" },
  "कान": { olChiki: "ᱞᱩᱛᱩᱨ", phonetic: "Lutur" },
  "नाक": { olChiki: "ᱢᱩᱸ", phonetic: "Mu" },
  "मुँह": { olChiki: "ᱢᱚᱪᱟ", phonetic: "Mocha" },
  "सिर": { olChiki: "ᱵᱚᱦᱚᱜ", phonetic: "Bohog" },
  "पेट": { olChiki: "ᱞᱟᱡ", phonetic: "Laj" },
  "शरीर": { olChiki: "ᱦᱚᱲᱢᱚ", phonetic: "Hormo" },

  // Animals & Birds
  "गाय": { olChiki: "ᱜᱟᱹᱭ", phonetic: "Gay" },
  "बैल": { olChiki: "ᱰᱟᱝᱜᱽᱨᱟ", phonetic: "Dangra" },
  "कुत्ता": { olChiki: "ᱥᱮᱛᱟ", phonetic: "Seta" },
  "बिल्ली": { olChiki: "ᱯᱩᱥᱤ", phonetic: "Pusi" },
  "पक्षी": { olChiki: "ᱪᱮᱬᱮ", phonetic: "Chene" },
  "चिड़िया": { olChiki: "ᱪᱮᱬᱮ", phonetic: "Chene" },
  "मछली": { olChiki: "ᱦᱟᱹᱠᱩ", phonetic: "Haku" },
  "हाथी": { olChiki: "ᱦᱟᱛᱤ", phonetic: "Hati" },
  "बकरी": { olChiki: "ᱢᱮᱨᱚᱢ", phonetic: "Merom" },
  "मुर्गी": { olChiki: "ᱥᱤᱢ", phonetic: "Sim" },

  // Food, Home & Nature
  "पानी": { olChiki: "ᱫᱟᱜ", phonetic: "Daag" },
  "घर": { olChiki: "ᱚᱲᱟᱜ", phonetic: "Orag" },
  "गाँव": { olChiki: "ᱟᱹᱛᱩ", phonetic: "Atu" },
  "शहर": { olChiki: "ᱵᱟᱡᱟᱨ", phonetic: "Bajar" },
  "पेड़": { olChiki: "ᱫᱟᱨᱮ", phonetic: "Dare" },
  "पौधा": { olChiki: "ᱫᱟᱨᱮ", phonetic: "Dare" },
  "पत्ता": { olChiki: "ᱥᱟᱠᱟᱢ", phonetic: "Sakam" },
  "फूल": { olChiki: "ᱵᱟᱦᱟ", phonetic: "Baha" },
  "फल": { olChiki: "ᱡᱚ", phonetic: "Jo" },
  "सेब": { olChiki: "ᱥᱮᱣ", phonetic: "Sew" },
  "आम": { olChiki: "ᱩᱞ", phonetic: "Ul" },
  "भात": { olChiki: "ᱫᱟᱠᱟ", phonetic: "Daka" },
  "चावल": { olChiki: "ᱪᱟᱣᱞᱮ", phonetic: "Chawle" },
  "रोटी": { olChiki: "ᱨᱩᱴᱤ", phonetic: "Ruti" },
  "सब्ज़ी": { olChiki: "ᱩᱛᱩ", phonetic: "Utu" },
  "दाल": { olChiki: "ᱫᱟᱹᱞ", phonetic: "Dal" },
  "नमक": { olChiki: "ᱵᱩᱞᱩᱝ", phonetic: "Bulung" },
  "तेल": { olChiki: "ᱥᱩᱱᱩᱢ", phonetic: "Sunum" },
  "दूध": { olChiki: "ᱛᱳᱣᱟ", phonetic: "Towa" },
  "चाय": { olChiki: "ᱪᱟ", phonetic: "Cha" },
  "खेत": { olChiki: "ᱠᱷᱮᱛ", phonetic: "Khet" },
  "नदी": { olChiki: "ᱜᱟᱰᱟ", phonetic: "Gada" },
  "पहाड़": { olChiki: "ᱵᱩᱨᱩ", phonetic: "Buru" },
  "जंगल": { olChiki: "ᱵᱤᱨ", phonetic: "Bir" },
  "बाज़ार": { olChiki: "ᱦᱟᱴ", phonetic: "Haat" },
  "हवा": { olChiki: "ᱦᱚᱭ", phonetic: "Hoy" },
  "धूप": { olChiki: "ᱥᱤᱛᱩᱝ", phonetic: "Situng" },
  "बारिश": { olChiki: "ᱫᱟᱜ", phonetic: "Daag" },
  "आग": { olChiki: "ᱥᱮᱸᱜᱮᱞ", phonetic: "Sengel" },
  "मिट्टी": { olChiki: "ᱦᱟᱥᱟ", phonetic: "Hasa" },
  "दवाई": { olChiki: "ᱨᱟᱱ", phonetic: "Ran" },
  "साइकिल": { olChiki: "ᱥᱟᱭᱠᱮᱞ", phonetic: "Cycle" },
  "पैसा": { olChiki: "ᱴᱟᱠᱟ", phonetic: "Taka" },
  "रुपया": { olChiki: "ᱴᱟᱠᱟ", phonetic: "Taka" },
  "रास्ता": { olChiki: "ᱦᱚᱨ", phonetic: "Hor" },
  "सड़क": { olChiki: "ᱦᱚᱨ", phonetic: "Hor" },

  // Time & Numbers
  "आज": { olChiki: "ᱛᱮᱦᱮᱧ", phonetic: "Tehenj" },
  "कल": { olChiki: "ᱜᱟᱯᱟ", phonetic: "Gapa" },
  "परसों": { olChiki: "ᱢᱮᱭᱟᱝ", phonetic: "Meyang" },
  "सुबह": { olChiki: "ᱥᱮᱛᱟᱜ", phonetic: "Setag" },
  "दोपहर": { olChiki: "ᱛᱤᱠᱤᱱ", phonetic: "Tikin" },
  "शाम": { olChiki: "ᱟᱹᱭᱩᱵ", phonetic: "Ayub" },
  "रात": { olChiki: "ᱧᱤᱫᱟᱹ", phonetic: "Nyida" },
  "दिन": { olChiki: "ᱢᱟᱦᱟᱸ", phonetic: "Maha" },
  "साल": { olChiki: "ᱥᱮᱨᱢᱟ", phonetic: "Serma" },
  "समय": { olChiki: "ᱚᱠᱛᱚ", phonetic: "Okto" },
  "अभी": { olChiki: "ᱱᱤᱛᱚᱜ", phonetic: "Nitog" },
  "हमेशा": { olChiki: "ᱡᱟᱣᱜᱮ", phonetic: "Jawge" },
  "रोज": { olChiki: "ᱫᱤᱱᱟᱹᱢ", phonetic: "Dinam" },
  "एक": { olChiki: "ᱢᱤᱫ", phonetic: "Mid" },
  "दो": { olChiki: "ᱵᱟᱨ", phonetic: "Bar" },
  "तीन": { olChiki: "ᱯᱮ", phonetic: "Pe" },
  "चार": { olChiki: "ᱯᱩᱱ", phonetic: "Pun" },
  "पाँच": { olChiki: "ᱢᱚᱬᱮ", phonetic: "Mone" },
  "पांच": { olChiki: "ᱢᱚᱬᱮ", phonetic: "Mone" },
  "छह": { olChiki: "ᱛᱩᱨᱩᱭ", phonetic: "Turuy" },
  "सात": { olChiki: "ᱮᱭᱟᱭ", phonetic: "Eyay" },
  "आठ": { olChiki: "ᱤᱨᱟᱹᱞ", phonetic: "Iral" },
  "नौ": { olChiki: "ᱟᱨᱮ", phonetic: "Are" },
  "दस": { olChiki: "ᱜᱮᱞ", phonetic: "Gel" },

  // Adjectives, Particles & Conjunctions
  "और": { olChiki: "ᱟᱨ", phonetic: "Ar" },
  "भी": { olChiki: "ᱦᱚᱸ", phonetic: "Ho" },
  "नहीं": { olChiki: "ᱵᱟᱝ", phonetic: "Bang" },
  "मत": { olChiki: "ᱟᱞᱚ", phonetic: "Alo" },
  "हाँ": { olChiki: "ᱦᱮᱸ", phonetic: "He" },
  "लेकिन": { olChiki: "ᱢᱮᱱᱠᱷᱟᱱ", phonetic: "Menkhan" },
  "अच्छा": { olChiki: "ᱱᱟᱯᱟᱭ", phonetic: "Napay" },
  "अच्छी": { olChiki: "ᱱᱟᱯᱟᱭ", phonetic: "Napay" },
  "अच्छे": { olChiki: "ᱱᱟᱯᱟᱭ", phonetic: "Napay" },
  "ठीक": { olChiki: "ᱵᱷᱟᱹᱜᱤ", phonetic: "Bhagi" },
  "बुरा": { olChiki: "ᱵᱟᱹᱲᱤᱡ", phonetic: "Barij" },
  "खराब": { olChiki: "ᱵᱟᱹᱲᱤᱡ", phonetic: "Barij" },
  "सुंदर": { olChiki: "ᱪᱚᱨᱚᱠ", phonetic: "Chorok" },
  "बड़ा": { olChiki: "ᱢᱟᱨᱟᱝ", phonetic: "Marang" },
  "बड़ी": { olChiki: "ᱢᱟᱨᱟᱝ", phonetic: "Marang" },
  "बड़े": { olChiki: "ᱢᱟᱨᱟᱝ", phonetic: "Marang" },
  "छोटा": { olChiki: "ᱦᱩᱰᱤᱧ", phonetic: "Hudinj" },
  "छोटी": { olChiki: "ᱦᱩᱰᱤᱧ", phonetic: "Hudinj" },
  "छोटे": { olChiki: "ᱦᱩᱰᱤᱧ", phonetic: "Hudinj" },
  "नया": { olChiki: "ᱱᱟᱣᱟ", phonetic: "Nawa" },
  "नई": { olChiki: "ᱱᱟᱣᱟ", phonetic: "Nawa" },
  "नए": { olChiki: "ᱱᱟᱣᱟ", phonetic: "Nawa" },
  "पुराना": { olChiki: "ᱢᱟᱨᱮ", phonetic: "Mare" },
  "पुरानी": { olChiki: "ᱢᱟᱨᱮ", phonetic: "Mare" },
  "पुराने": { olChiki: "ᱢᱟᱨᱮ", phonetic: "Mare" },
  "तेज़": { olChiki: "ᱞᱚᱜᱚᱱ", phonetic: "Logon" },
  "जल्दी": { olChiki: "ᱞᱚᱜᱚᱱ", phonetic: "Logon" },
  "धीरे": { olChiki: "ᱵᱷᱟᱹᱜᱤ ᱛᱮ", phonetic: "Bhagi te" },
  "शांत": { olChiki: "ᱛᱷᱤᱨ", phonetic: "Thir" },
  "खुश": { olChiki: "ᱨᱟᱹᱥᱠᱟᱹ", phonetic: "Raska" },
  "दुखी": { olChiki: "ᱫᱩᱠᱷ", phonetic: "Dukh" },
  "साफ़": { olChiki: "ᱥᱟᱯᱷᱟ", phonetic: "Sapha" },
  "साफ": { olChiki: "ᱥᱟᱯᱷᱟ", phonetic: "Sapha" },
  "गंदा": { olChiki: "ᱵᱟᱹᱲᱤᱡ", phonetic: "Barij" },
  "मीठा": { olChiki: "ᱦᱮᱲᱮᱢ", phonetic: "Herhem" },
  "ठंडा": { olChiki: "ᱨᱮᱭᱟᱲ", phonetic: "Reyar" },
  "गर्म": { olChiki: "ᱞᱚᱞᱚ", phonetic: "Lolo" },
  "बहुत": { olChiki: "ᱟᱹᱰᱤ", phonetic: "Aadi" },
  "ज्यादा": { olChiki: "ᱰᱷᱮᱨ", phonetic: "Dher" },
  "थोड़ा": { olChiki: "ᱠᱟᱹᱴᱤᱡ", phonetic: "Katij" },
  "कम": { olChiki: "ᱠᱚᱢ", phonetic: "Kom" },
  "सब": { olChiki: "ᱥᱟᱱᱟᱢ", phonetic: "Sanam" },
  "सभी": { olChiki: "ᱥᱟᱱᱟᱢ", phonetic: "Sanam" },
  "का": { olChiki: "ᱨᱮᱭᱟᱜ", phonetic: "Reyag" },
  "की": { olChiki: "ᱨᱮᱭᱟᱜ", phonetic: "Reyag" },
  "के": { olChiki: "ᱨᱮᱭᱟᱜ", phonetic: "Reyag" },
  "में": { olChiki: "ᱨᱮ", phonetic: "Re" },
  "से": { olChiki: "ᱛᱮ", phonetic: "Te" },
  "पर": { olChiki: "ᱪᱮᱛᱟᱱ ᱨᱮ", phonetic: "Chetan re" },
  "साथ": { olChiki: "ᱥᱟᱶ", phonetic: "Saw" }
};

// ── VERB STEM LEMMATIZATION MAP FOR ACCURATE INFLECTION MATCHING ─────────────
const VERB_STEMS: Record<string, { olChiki: string; phonetic: string }> = {
  "कर": { olChiki: "ᱠᱟᱹᱢᱤ", phonetic: "Kami" },
  "जा": { olChiki: "ᱥᱮᱱ", phonetic: "Sen" },
  "आ": { olChiki: "ᱦᱮᱡ", phonetic: "Hej" },
  "खा": { olChiki: "ᱡᱚᱢ", phonetic: "Jom" },
  "पी": { olChiki: "ᱧᱩ", phonetic: "Nyu" },
  "बोल": { olChiki: "ᱨᱚᱲ", phonetic: "Rorh" },
  "सुन": { olChiki: "ᱟᱸᱡᱚᱢ", phonetic: "Anjom" },
  "देख": { olChiki: "ᱧᱮᱞ", phonetic: "Nyel" },
  "पढ़": { olChiki: "ᱯᱟᱲᱦᱟᱣ", phonetic: "Parhaw" },
  "लिख": { olChiki: "ᱚᱞ", phonetic: "Ol" },
  "बैठ": { olChiki: "ᱫᱩᱲᱩᱵ", phonetic: "Durhub" },
  "उठ": { olChiki: "ᱵᱮᱨᱮᱫ", phonetic: "Bered" },
  "सो": { olChiki: "ᱜᱤᱛᱤᱡ", phonetic: "Gitij" },
  "दे": { olChiki: "ᱮᱢ", phonetic: "Em" },
  "ले": { olChiki: "ᱦᱟᱛᱟᱣ", phonetic: "Hataw" },
  "ला": { olChiki: "ᱟᱹᱜᱩ", phonetic: "Agu" },
  "रख": { olChiki: "ᱫᱚᱦᱚ", phonetic: "Doho" },
  "चल": { olChiki: "ᱪᱟᱞᱟᱜ", phonetic: "Chalag" },
  "रुक": { olChiki: "ᱛᱤᱸᱜᱩ", phonetic: "Tingu" },
  "खेल": { olChiki: "ᱮᱱᱮᱡ", phonetic: "Enej" },
  "सीख": { olChiki: "ᱪᱮᱫᱚᱜ", phonetic: "Chedog" },
  "समझ": { olChiki: "ᱵᱩᱡᱷᱟᱹᱣ", phonetic: "Bujhaw" },
  "धो": { olChiki: "ᱟᱹᱨᱩᱵ", phonetic: "Arub" },
  "रह": { olChiki: "ᱛᱟᱦᱮᱸᱱ", phonetic: "Tahen" }
};

/**
 * Translates Hindi text to Santali (Ol Chiki) with 100% pure script guarantee.
 * Uses exact phrasebook matches first, then multi-token dictionary and verb-stem
 * matching to ensure zero residual Hindi words leak into the Santali speech.
 */
export function translateHindiToSantaliClient(hindiInput: string): { olChiki: string; phonetic: string } {
  const cleaned = hindiInput.trim();
  if (!cleaned) {
    return { olChiki: "", phonetic: "" };
  }

  // 1. Direct exact phrasebook match
  if (HINDI_SANTALI_PHRASE_BOOK[cleaned]) {
    return HINDI_SANTALI_PHRASE_BOOK[cleaned];
  }

  // 2. Normalized punctuation match
  const stripped = cleaned.replace(/[।.,!?]/g, "").trim();
  if (HINDI_SANTALI_PHRASE_BOOK[stripped]) {
    const res = HINDI_SANTALI_PHRASE_BOOK[stripped];
    return {
      olChiki: res.olChiki + (cleaned.endsWith("?") ? " ?" : " ᱾"),
      phonetic: res.phonetic
    };
  }

  // 3. Substring / phrase lookup against phrasebook
  for (const [key, val] of Object.entries(HINDI_SANTALI_PHRASE_BOOK)) {
    const keyStripped = key.replace(/[।.,!?]/g, "").trim();
    if (keyStripped === stripped) {
      return val;
    }
  }

  // 4. Tokenized smart translation + Verb-Stem Lemmatization + Transliteration Fallback
  const words = cleaned.split(/\s+/);
  const olChikiWords: string[] = [];
  const phoneticWords: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const wStripped = w.replace(/[।.,!?]/g, "").trim();
    if (!wStripped) continue;

    // Check two-word bigram first (e.g. "बैठ जाओ", "खाना खाओ", "मत डरो", "क्या हाल")
    if (i + 1 < words.length) {
      const nextW = words[i + 1].replace(/[।.,!?]/g, "").trim();
      const bigram = `${wStripped} ${nextW}`;
      if (HINDI_SANTALI_PHRASE_BOOK[bigram]) {
        olChikiWords.push(HINDI_SANTALI_PHRASE_BOOK[bigram].olChiki);
        phoneticWords.push(HINDI_SANTALI_PHRASE_BOOK[bigram].phonetic);
        i++; // skip next word
        continue;
      }
      if (HINDI_SANTALI_VOCAB[bigram]) {
        olChikiWords.push(HINDI_SANTALI_VOCAB[bigram].olChiki);
        phoneticWords.push(HINDI_SANTALI_VOCAB[bigram].phonetic);
        i++; // skip next word
        continue;
      }
    }

    // Single word lookup in vocab
    if (HINDI_SANTALI_VOCAB[wStripped]) {
      olChikiWords.push(HINDI_SANTALI_VOCAB[wStripped].olChiki);
      phoneticWords.push(HINDI_SANTALI_VOCAB[wStripped].phonetic);
    } else if (HINDI_SANTALI_PHRASE_BOOK[wStripped]) {
      olChikiWords.push(HINDI_SANTALI_PHRASE_BOOK[wStripped].olChiki);
      phoneticWords.push(HINDI_SANTALI_PHRASE_BOOK[wStripped].phonetic);
    } else {
      // 5. Try Verb Stem Lemmatization (e.g. खाएगा -> खा, जाओगे -> जा, करते -> कर)
      let stemFound = false;
      for (const [stem, sObj] of Object.entries(VERB_STEMS)) {
        if (wStripped.startsWith(stem)) {
          olChikiWords.push(sObj.olChiki);
          phoneticWords.push(sObj.phonetic);
          stemFound = true;
          break;
        }
      }

      if (!stemFound) {
        // Unrecognized proper noun or rare word -> transliterate to Ol Chiki
        const transliterated = transliterateDevaToOlChiki(wStripped);
        olChikiWords.push(transliterated);
        phoneticWords.push(olChikiToPhonetic(transliterated));
      }
    }
  }

  const punc = cleaned.endsWith("?") ? " ?" : " ᱾";
  const resOlChiki = olChikiWords.join(" ") + punc;
  const resPhonetic = olChikiToPhonetic(resOlChiki);
  return { olChiki: resOlChiki, phonetic: resPhonetic };
}

// Reverse mapping for Santali (Ol Chiki and Romanized phonetics) -> Hindi
export const SANTALI_HINDI_REVERSE_MAP: Record<string, string> = {
  "ᱡᱚᱦᱟᱨ": "नमस्ते / जोहार",
  "ᱡᱚᱦᱟᱨ, ᱢᱟᱪᱮᱛ!": "नमस्ते, शिक्षक जी!",
  "ᱡᱚᱦᱟᱨ, ᱢᱟᱪᱮᱛ": "नमस्ते, शिक्षक जी!",
  "ᱡᱚᱦᱟᱨ, ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ?": "नमस्ते, आप कैसे हैं?",
  "ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ?": "आप कैसे हैं?",
  "ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ": "आप कैसे हैं?",
  "ᱟᱨ ᱵᱚᱭᱦᱟ, ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ ᱵᱤᱱᱟ?": "और भाई, क्या हाल-चाल है?",
  "ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ ᱵᱤᱱᱟ?": "क्या हाल-चाल है?",
  "ᱤᱧ ᱵᱷᱟᱹᱜᱤ ᱜᱮ ᱢᱮᱱᱟᱹᱧᱟ": "मैं ठीक हूँ",
  "ᱤᱧ ᱵᱷᱟᱹᱜᱤ ᱜᱮ ᱢᱮᱱᱟᱹᱧᱟ ᱾": "मैं ठीक हूँ।",
  "ᱤᱧ ᱵᱷᱟᱹᱜᱤ ᱜᱮ ᱢᱮᱱᱟᱹᱧᱟ, ᱥᱟᱨᱦᱟᱣ ᱾": "मैं ठीक हूँ, धन्यवाद।",
  "ᱥᱟᱨᱦᱟᱣ": "धन्यवाद",
  "ᱥᱟᱨᱦᱟᱣ, ᱢᱟᱪᱮᱛ!": "धन्यवाद, शिक्षक जी!",
  "ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱫᱚ ᱪᱮᱫ?": "आपका नाम क्या है?",
  "ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱫᱚ ᱪᱮᱫ": "आपका नाम क्या है?",
  "ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ": "मेरा नाम",
  "ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ ᱞᱚᱠᱷᱚᱱ ᱠᱟᱱᱟ": "मेरा नाम लखन है।",
  "ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ ᱞᱚᱠᱷᱚᱱ ᱠᱟᱱᱟ ᱾": "मेरा नाम लखन है।",
  "ᱟᱞᱮ ᱵᱤᱨᱫᱟᱹᱜᱟᱲ ᱞᱮ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ ᱾": "हम स्कूल जा रहे हैं।",
  "ᱛᱮᱦᱮᱧ ᱟᱵᱚ ᱮᱞ ᱵᱚᱱ ᱪᱮᱫᱚᱜᱼᱟ ᱾": "आज हम संख्या सीखेंगे।",
  "ᱛᱮᱦᱮᱧ ᱟᱵᱚ ᱮᱞ ᱵᱚᱱ ᱪᱮᱫᱚᱜᱼᱟ": "आज हम संख्या सीखेंगे।",
  "ᱫᱟᱜ ᱧᱩ ᱥᱟᱱᱟᱹᱧ ᱠᱟᱱᱟ": "मुझे पानी पीना है।",
  "ᱫᱟᱜ ᱧᱩ ᱥᱟᱱᱟᱹᱧ ᱠᱟᱱᱟ ᱾": "मुझे पानी पीना है।",
  "ᱤᱧ ᱫᱟᱜ ᱧᱩ ᱥᱟᱱᱟᱹᱧ ᱠᱟᱱᱟ ᱾": "मुझे पानी पीना है।",
  "ᱤᱧ ᱨᱮᱸᱜᱮᱡ ᱤᱧ ᱠᱟᱱᱟ ᱾": "मुझे भूख लगी है।",
  "ᱱᱚᱣᱟ ᱯᱩᱛᱷᱤ ᱤᱧᱟᱜ ᱠᱟᱱᱟ": "यह किताब मेरी है।",
  "ᱱᱚᱣᱟ ᱯᱩᱛᱷᱤ ᱤᱧᱟᱜ ᱠᱟᱱᱟ ᱾": "यह किताब मेरी है।",
  "ᱥᱟᱱᱟᱢ ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ ᱛᱷᱤᱨ ᱛᱟᱦᱮᱸᱱ ᱯᱮ": "सभी बच्चे शांत रहिए।",
  "ᱟᱞᱚᱢ ᱵᱚᱛᱚᱨᱚᱜ-ᱟ": "डरो मत।",
  "ᱟᱨᱦᱚᱸ ᱠᱩᱨᱩᱢᱩᱴᱩᱭ ᱢᱮ": "फिर से कोशिश करो।",
  "ᱫᱟᱜ": "पानी",
  "ᱵᱤᱨᱫᱟᱹᱜᱟᱲ": "स्कूल",
  "ᱚᱲᱟᱜ": "घर",
  "ᱯᱩᱛᱷᱤ": "किताब",
  "ᱫᱟᱨᱮ": "पेड़",
  "ᱪᱟᱹᱥᱤ": "किसान",
  "ᱥᱮᱣ": "सेब",
  "ᱩᱞ": "आम",
  "ᱢᱤᱫ": "एक",
  "ᱵᱟᱨ": "दो",
  "ᱯᱮ": "तीन",
  "ᱯᱩᱱ": "चार",
  "ᱢᱚᱬᱮ": "पाँच"
};

/**
 * Translates Santali (Ol Chiki or Phonetic) input into Hindi.
 */
export function translateSantaliToHindiClient(santaliInput: string): { hindi: string } {
  const cleaned = santaliInput.trim();
  if (!cleaned) {
    return { hindi: "" };
  }

  // 1. Direct match in reverse map
  if (SANTALI_HINDI_REVERSE_MAP[cleaned]) {
    return { hindi: SANTALI_HINDI_REVERSE_MAP[cleaned] };
  }

  // 2. Case and punctuation-agnostic match
  const stripped = cleaned.replace(/[।.,!?]/g, "").trim();
  const lower = stripped.toLowerCase();
  for (const [key, val] of Object.entries(SANTALI_HINDI_REVERSE_MAP)) {
    const keyStripped = key.replace(/[।.,!?]/g, "").trim();
    if (keyStripped === stripped || keyStripped.toLowerCase() === lower) {
      return { hindi: val };
    }
  }

  // 3. Reverse lookup against HINDI_SANTALI_PHRASE_BOOK
  for (const [hiText, satObj] of Object.entries(HINDI_SANTALI_PHRASE_BOOK)) {
    const satStripped = satObj.olChiki.replace(/[।.,!?]/g, "").trim();
    const phoStripped = satObj.phonetic.replace(/[।.,!?]/g, "").trim().toLowerCase();
    if (satStripped === stripped || phoStripped === lower) {
      return { hindi: hiText };
    }
  }

  // 4. Tokenized reverse lookup
  const words = cleaned.split(/\s+/);
  const hindiWords: string[] = [];

  for (const w of words) {
    const wStripped = w.replace(/[।.,!?]/g, "").trim();
    if (!wStripped) continue;

    if (SANTALI_HINDI_REVERSE_MAP[wStripped]) {
      hindiWords.push(SANTALI_HINDI_REVERSE_MAP[wStripped]);
    } else {
      let found = false;
      for (const [hWord, vObj] of Object.entries(HINDI_SANTALI_VOCAB)) {
        if (vObj.olChiki === wStripped || vObj.phonetic.toLowerCase() === wStripped.toLowerCase()) {
          hindiWords.push(hWord);
          found = true;
          break;
        }
      }
      if (!found) {
        hindiWords.push(transliterateOlChikiToDeva(wStripped));
      }
    }
  }

  const punc = cleaned.endsWith("?") ? "?" : "।";
  return { hindi: hindiWords.join(" ") + " " + punc };
}

/**
 * Synthesizes Santali speech with authentic Indian acoustic pronunciation.
 * Android: Native bridge receives text; SantaliTtsEngine renders Devanagari acoustic phonetics.
 * Web: Translates Ol Chiki to Devanagari phonetics and synthesizes with hi-IN Indian acoustic voice.
 */
export function speakSantali(
  text: string,
  phoneticOverride?: string,
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  if (typeof window !== "undefined") {
    const bridge = (window as any).AndroidBridge;
    if (bridge && typeof bridge.speakSantali === "function") {
      try {
        bridge.speakSantali(text);
        if (onStart) onStart();
        const duration = Math.min(6000, Math.max(1200, text.length * 85));
        setTimeout(() => { if (onEnd) onEnd(); }, duration);
        return true;
      } catch (e) {
        console.warn("Native bridge speech failed, using fallback:", e);
      }
    }
  }

  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  try {
    window.speechSynthesis.cancel();
    // Convert Ol Chiki to acoustic Devanagari phonetics for natural Indian TTS
    const spokenText = text.match(/[\u1C50-\u1C7F]/) ? olChikiToDevaPhonetic(text) : (phoneticOverride || text);
    if (!spokenText.trim()) return false;

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = 0.88;
    utterance.pitch = 1.0;
    utterance.lang = "hi-IN";

    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(v => v.lang.startsWith("hi") || v.lang.includes("IN") || v.name.toLowerCase().includes("india"));
    if (indianVoice) {
      utterance.voice = indianVoice;
    }

    if (onStart) utterance.onstart = onStart;
    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn("Santali speech synthesis error:", err);
    if (onEnd) onEnd();
    return false;
  }
}

/**
 * Synthesizes Hindi speech.
 */
export function speakHindi(
  hindiText: string,
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  if (typeof window !== "undefined") {
    const bridge = (window as any).AndroidBridge;
    if (bridge && typeof bridge.speakHindi === "function") {
      try {
        bridge.speakHindi(hindiText);
        if (onStart) onStart();
        const duration = Math.min(6000, Math.max(1200, hindiText.length * 85));
        setTimeout(() => { if (onEnd) onEnd(); }, duration);
        return true;
      } catch (e) {
        console.warn("Native bridge Hindi speech failed, using fallback:", e);
      }
    }
  }

  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  try {
    window.speechSynthesis.cancel();
    const cleaned = hindiText.trim();
    if (!cleaned) return false;

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.rate = 0.88;
    utterance.pitch = 1.0;
    utterance.lang = "hi-IN";

    const voices = window.speechSynthesis.getVoices();
    const hiVoice = voices.find(v => v.lang.startsWith("hi") || v.lang.includes("HI"));
    if (hiVoice) {
      utterance.voice = hiVoice;
    }

    if (onStart) utterance.onstart = onStart;
    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn("Hindi speech synthesis error:", err);
    if (onEnd) onEnd();
    return false;
  }
}

export interface SpeechRecognitionHandler {
  start: () => void;
  stop: () => void;
  isSupported: boolean;
}

/**
 * Initializes Speech Recognition for Hindi voice input.
 */
export function createHindiSpeechRecognition(
  onResult: (transcript: string) => void,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): SpeechRecognitionHandler {
  if (typeof window === "undefined") {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  let watchdogTimer: any = null;
  const clearTimer = () => {
    if (watchdogTimer) {
      clearTimeout(watchdogTimer);
      watchdogTimer = null;
    }
  };

  const bridge = (window as any).AndroidBridge;
  if (bridge && typeof bridge.startNativeSpeechRecognition === "function") {
    (window as any).onNativeSpeechResult = (text: string, speaker: string) => {
      clearTimer();
      if (speaker === "teacher" || !speaker) {
        onResult(text);
      }
      if (onEnd) onEnd();
    };
    (window as any).onNativeSpeechEnd = () => {
      clearTimer();
      if (onEnd) onEnd();
    };
    (window as any).onNativeSpeechError = (err: any) => {
      clearTimer();
      if (onError) onError(err);
      if (onEnd) onEnd();
    };

    return {
      start: () => {
        try {
          clearTimer();
          if (onStart) onStart();
          bridge.startNativeSpeechRecognition("teacher");
          watchdogTimer = setTimeout(() => {
            console.log("Watchdog auto-stopping Hindi mic");
            try { bridge.stopNativeSpeechRecognition?.(); } catch (_e) {}
            if (onEnd) onEnd();
          }, 15000);
        } catch (e) {
          clearTimer();
          if (onError) onError(e);
          if (onEnd) onEnd();
        }
      },
      stop: () => {
        clearTimer();
        try { bridge.stopNativeSpeechRecognition?.(); } catch (_e) {}
        if (onEnd) onEnd();
      },
      isSupported: true
    };
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (onStart) onStart();
      clearTimer();
      watchdogTimer = setTimeout(() => {
        try { recognition.stop(); } catch (_e) {}
        if (onEnd) onEnd();
      }, 5000);
    };
    recognition.onresult = (event: any) => {
      clearTimer();
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        finalTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript) {
        onResult(finalTranscript);
      }
    };
    recognition.onend = () => {
      clearTimer();
      if (onEnd) onEnd();
    };
    recognition.onerror = (event: any) => {
      clearTimer();
      if (onError) onError(event);
      if (onEnd) onEnd();
    };

    return {
      start: () => {
        try {
          clearTimer();
          recognition.start();
        } catch (e) {
          console.warn("Speech recognition error:", e);
          if (onEnd) onEnd();
        }
      },
      stop: () => {
        clearTimer();
        try {
          recognition.stop();
          recognition.abort?.();
        } catch (e) {
          console.warn("Speech stop error:", e);
        }
        if (onEnd) onEnd();
      },
      isSupported: true
    };
  } catch (_e) {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }
}

/**
 * Initializes Speech Recognition for Santali voice input.
 */
export function createSantaliSpeechRecognition(
  onResult: (transcript: string) => void,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): SpeechRecognitionHandler {
  if (typeof window === "undefined") {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  let watchdogTimer: any = null;
  const clearTimer = () => {
    if (watchdogTimer) {
      clearTimeout(watchdogTimer);
      watchdogTimer = null;
    }
  };

  const bridge = (window as any).AndroidBridge;
  if (bridge && typeof bridge.startNativeSpeechRecognition === "function") {
    (window as any).onNativeSpeechResult = (text: string, speaker: string) => {
      clearTimer();
      if (speaker === "student") {
        onResult(text);
      }
      if (onEnd) onEnd();
    };
    (window as any).onNativeSpeechEnd = () => {
      clearTimer();
      if (onEnd) onEnd();
    };
    (window as any).onNativeSpeechError = (err: any) => {
      clearTimer();
      if (onError) onError(err);
      if (onEnd) onEnd();
    };

    return {
      start: () => {
        try {
          clearTimer();
          if (onStart) onStart();
          bridge.startNativeSpeechRecognition("student");
          watchdogTimer = setTimeout(() => {
            console.log("Watchdog auto-stopping Santali mic");
            try { bridge.stopNativeSpeechRecognition?.(); } catch (_e) {}
            if (onEnd) onEnd();
          }, 5000);
        } catch (e) {
          clearTimer();
          if (onError) onError(e);
          if (onEnd) onEnd();
        }
      },
      stop: () => {
        clearTimer();
        try { bridge.stopNativeSpeechRecognition?.(); } catch (_e) {}
        if (onEnd) onEnd();
      },
      isSupported: true
    };
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (onStart) onStart();
      clearTimer();
      watchdogTimer = setTimeout(() => {
        try { recognition.stop(); } catch (_e) {}
        if (onEnd) onEnd();
      }, 5000);
    };
    recognition.onresult = (event: any) => {
      clearTimer();
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        finalTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript) {
        onResult(finalTranscript);
      }
    };
    recognition.onend = () => {
      clearTimer();
      if (onEnd) onEnd();
    };
    recognition.onerror = (event: any) => {
      clearTimer();
      if (onError) onError(event);
      if (onEnd) onEnd();
    };

    return {
      start: () => {
        try {
          clearTimer();
          recognition.start();
        } catch (e) {
          console.warn("Speech recognition error:", e);
          if (onEnd) onEnd();
        }
      },
      stop: () => {
        clearTimer();
        try {
          recognition.stop();
          recognition.abort?.();
        } catch (e) {
          console.warn("Speech stop error:", e);
        }
        if (onEnd) onEnd();
      },
      isSupported: true
    };
  } catch (_e) {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }
}
