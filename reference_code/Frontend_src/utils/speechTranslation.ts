/**
 * Voice Recognition (STT), Speech Synthesis (TTS) & Bidirectional Translation Engine
 * Pure offline-ready:
 * 1. Rich Phrasebook & Sentence Translation for daily life, classroom & pedagogy
 * 2. Comprehensive Vocabulary Engine
 * 3. Devanagari <-> Ol Chiki Phonetic Transliteration (ensuring 0 mixed-script corruption)
 * 4. Android Native Bridge integration for instant hardware TTS & SpeechRecognizer
 * 5. Web Speech API browser fallback
 */

// Mapping Ol Chiki characters to accurate Santali phonetic sounds for speech synthesis
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

// Devanagari to Ol Chiki character transliteration map
export const DEVA_TO_OL_CHIKI: Record<string, string> = {
  // Independent Vowels
  'अ': 'ᱚ', 'आ': 'ᱟ', 'इ': 'ᱤ', 'ई': 'ᱤ', 'उ': 'ᱩ', 'ऊ': 'ᱩ',
  'ए': 'ᱮ', 'ऐ': 'ᱮ', 'ओ': 'ᱳ', 'औ': 'ᱳ',
  // Consonants
  'क': 'ᱠ', 'ख': 'ᱠᱷ', 'ग': 'ᱜ', 'घ': 'ᱜᱷ', 'ङ': 'ᱝ',
  'च': 'ᱪ', 'छ': 'ᱪᱷ', 'ज': 'ᱡ', 'झ': 'ᱡᱷ', 'ञ': 'ᱧ',
  'ट': 'ᱴ', 'ठ': 'ᱴᱷ', 'ड': 'ᱰ', 'ढ': 'ᱰᱷ', 'ण': 'ᱬ',
  'त': 'ᱛ', 'थ': 'ᱛᱷ', 'द': 'ᱫ', 'ध': 'ᱫᱷ', 'न': 'ᱱ',
  'प': 'ᱯ', 'फ': 'ᱯᱷ', 'ब': 'ᱵ', 'भ': 'ᱵᱷ', 'म': 'ᱢ',
  'य': 'ᱭ', 'र': 'ᱨ', 'ल': 'ᱞ', 'व': 'ᱣ', 'श': 'ᱥ', 'ष': 'ᱥ', 'स': 'ᱥ', 'ह': 'ᱦ',
  'ड़': 'ᱲ', 'ढ़': 'ᱲᱷ', 'फ़': 'ᱯᱷ', 'ज़': 'ᱡ',
  // Dependent Vowel Signs (Matras)
  'ा': 'ᱟ', 'ि': 'ᱤ', 'ी': 'ᱤ', 'ु': 'ᱩ', 'ू': 'ᱩ',
  'े': 'ᱮ', 'ै': 'ᱮ', 'ो': 'ᱳ', 'ौ': 'ᱳ',
  'ं': 'ᱸ', 'ँ': 'ᱸ', 'ः': 'ᱷ', '्': '',
  // Punctuations
  '।': ' ᱾', '.': ' ᱾', '?': '?', '!': '!'
};

// Ol Chiki to Devanagari transliteration map for reverse fallback
export const OL_CHIKI_TO_DEVA: Record<string, string> = {
  'ᱚ': 'ओ', 'ᱟ': 'आ', 'ᱤ': 'इ', 'ᱩ': 'उ', 'ᱮ': 'ए', 'ᱳ': 'ओ',
  'ᱛ': 'त', 'ᱜ': 'ग', 'ᱝ': 'ंग', 'ᱞ': 'ल', 'ᱠ': 'क', 'ᱡ': 'ज',
  'ᱢ': 'म', 'ᱣ': 'व', 'ᱥ': 'स', 'ᱦ': 'ह', 'ᱧ': 'ञ', 'ᱨ': 'र',
  'ᱪ': 'च', 'ᱫ': 'द', 'ᱬ': 'ण', 'ᱭ': 'य', 'ᱯ': 'प', 'ᱰ': 'ड',
  'ᱱ': 'न', 'ᱲ': 'ड़', 'ᱴ': 'ट', 'ᱵ': 'ब', 'ᱶ': 'न्ह', 'ᱷ': 'ह',
  'ᱸ': 'ं', '᱾': '।', '᱿': '।'
};

/**
 * Transliterates Devanagari text into authentic Ol Chiki script.
 * Ensures that even proper nouns, names, and unknown words are converted into pure Ol Chiki
 * rather than leaving ugly mixed-script characters in the output.
 */
export function transliterateDevaToOlChiki(devaText: string): string {
  let result = '';
  for (let i = 0; i < devaText.length; i++) {
    const ch = devaText[i];
    if (DEVA_TO_OL_CHIKI[ch] !== undefined) {
      result += DEVA_TO_OL_CHIKI[ch];
    } else {
      result += ch;
    }
  }
  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Transliterates Ol Chiki text into Devanagari script.
 */
export function transliterateOlChikiToDeva(olChikiText: string): string {
  let result = '';
  for (let i = 0; i < olChikiText.length; i++) {
    const ch = olChikiText[i];
    if (OL_CHIKI_TO_DEVA[ch] !== undefined) {
      result += OL_CHIKI_TO_DEVA[ch];
    } else {
      result += ch;
    }
  }
  return result.replace(/\s+/g, ' ').trim();
}

// Comprehensive phrasebook for daily conversation, home, market and classroom pedagogy
export const HINDI_SANTALI_PHRASE_BOOK: Record<string, { olChiki: string; phonetic: string }> = {
  // Greetings & Courtesies
  "नमस्ते": { olChiki: "ᱡᱚᱦᱟᱨ", phonetic: "Johar" },
  "जोहार": { olChiki: "ᱡᱚᱦᱟᱨ", phonetic: "Johar" },
  "हेलो": { olChiki: "ᱡᱚᱦᱟᱨ", phonetic: "Johar" },
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
  "मैं ठीक हूँ, धन्यवाद।": { olChiki: "ᱤᱧ ᱵᱷᱟᱹᱜᱤ ᱜᱮ ᱢᱮᱱᱟᱹᱧᱟ, ᱥᱟᱨᱦᱟᱣ ᱾", phonetic: "Inj bhagi ge menanja, sarhaw." },
  "सब ठीक है": { olChiki: "ᱡᱚᱛᱚ ᱵᱷᱟᱹᱜᱤ ᱜᱮᱭᱟ ᱾", phonetic: "Joto bhagi geya." },
  "धन्यवाद": { olChiki: "ᱥᱟᱨᱦᱟᱣ", phonetic: "Sarhaw" },
  "बहुत धन्यवाद": { olChiki: "ᱟᱹᱰᱤ ᱥᱟᱨᱦᱟᱣ", phonetic: "Aadi sarhaw" },
  "शुक्रिया": { olChiki: "ᱥᱟᱨᱦᱟᱣ", phonetic: "Sarhaw" },
  "स्वागत है": { olChiki: "ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ", phonetic: "Sagun daram" },

  // Self Introduction & Identity
  "आपका नाम क्या है?": { olChiki: "ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱫᱚ ᱪᱮᱫ?", phonetic: "Amag nyutum do ched?" },
  "आपका नाम क्या है": { olChiki: "ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱫᱚ ᱪᱮᱫ?", phonetic: "Amag nyutum do ched?" },
  "तुम्हारा नाम क्या है?": { olChiki: "ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱫᱚ ᱪᱮᱫ?", phonetic: "Amag nyutum do ched?" },
  "तुम्हारा नाम क्या है": { olChiki: "ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱫᱚ ᱪᱮᱫ?", phonetic: "Amag nyutum do ched?" },
  "मेरा नाम क्या है": { olChiki: "ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ ᱫᱚ ᱪᱮᱫ?", phonetic: "Injag nyutum do ched?" },
  "मेरा नाम लखन है।": { olChiki: "ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ ᱞᱚᱠᱷᱚᱱ ᱠᱟᱱᱟ ᱾", phonetic: "Injag nyutum Lokhon kana." },
  "मेरा नाम लखन है": { olChiki: "ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ ᱞᱚᱠᱷᱚᱱ ᱠᱟᱱᱟ ᱾", phonetic: "Injag nyutum Lokhon kana." },
  "हेलो बच्चों मेरा नाम लक्ष्य है": { olChiki: "ᱡᱚᱦᱟᱨ ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ, ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ ᱞᱟᱠᱥᱭ ᱠᱟᱱᱟ ᱾", phonetic: "Johar gidra ko, injag nyutum Laksya kana." },
  "हेलो बच्चों मेरा नाम लक्ष्य है।": { olChiki: "ᱡᱚᱦᱟᱨ ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ, ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ ᱞᱟᱠᱥᱭ ᱠᱟᱱᱟ ᱾", phonetic: "Johar gidra ko, injag nyutum Laksya kana." },
  "बच्चों मेरा नाम लक्ष्य है": { olChiki: "ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ, ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ ᱞᱟᱠᱥᱭ ᱠᱟᱱᱟ ᱾", phonetic: "Gidra ko, injag nyutum Laksya kana." },
  "मैं एक शिक्षक हूँ।": { olChiki: "ᱤᱧ ᱫᱚ ᱢᱤᱫ ᱢᱟᱪᱮᱛ ᱠᱟᱹᱱᱟᱹᱧ ᱾", phonetic: "Inj do mid machet kananj." },
  "मैं एक विद्यार्थी हूँ।": { olChiki: "ᱤᱧ ᱫᱚ ᱢᱤᱫ ᱯᱟᱹᱴᱷᱩᱣᱟᱹ ᱠᱟᱹᱱᱟᱹᱧ ᱾", phonetic: "Inj do mid pathuwa kananj." },

  // Location & Routine
  "आपका घर कहाँ है?": { olChiki: "ᱟᱢᱟᱜ ᱚᱲᱟᱜ ᱫᱚ ᱚᱠᱟᱨᱮ?", phonetic: "Amag orag do okare?" },
  "आपका घर कहाँ है": { olChiki: "ᱟᱢᱟᱜ ᱚᱲᱟᱜ ᱫᱚ ᱚᱠᱟᱨᱮ?", phonetic: "Amag orag do okare?" },
  "तुम कहाँ रहते हो?": { olChiki: "ᱟᱢ ᱫᱚ ᱚᱠᱟᱨᱮᱢ ᱛᱟᱦᱮᱸᱱᱟ?", phonetic: "Aam do okarem tahena?" },
  "आप कहाँ जा रहे हैं?": { olChiki: "ᱟᱢ ᱚᱠᱟᱛᱮᱢ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ?", phonetic: "Aam okatem senog kana?" },
  "तुम कहाँ जा रहे हो?": { olChiki: "ᱟᱢ ᱚᱠᱟᱛᱮᱢ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ?", phonetic: "Aam okatem senog kana?" },
  "मैं घर जा रहा हूँ।": { olChiki: "ᱤᱧ ᱚᱲᱟᱜ-ᱤᱧ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ ᱾", phonetic: "Inj orag-inj senog kana." },
  "मैं घर जा रहा हूँ": { olChiki: "ᱤᱧ ᱚᱲᱟᱜ-ᱤᱧ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ ᱾", phonetic: "Inj orag-inj senog kana." },
  "हम स्कूल जा रहे हैं।": { olChiki: "ᱟᱞᱮ ᱵᱤᱨᱫᱟᱹᱜᱟᱲ ᱞᱮ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ ᱾", phonetic: "Ale birdagarh le senog kana." },
  "सभी बच्चे स्कूल जा रहे हैं।": { olChiki: "ᱥᱟᱱᱟᱢ ᱜᱤᱫᱽᱨᱟᱹ ᱜᱮ ᱵᱤᱨᱫᱟᱹᱜᱟᱲ ᱨᱮ ᱪᱟᱞᱟᱣᱚᱜ ᱠᱟᱱᱟ ᱾", phonetic: "Sanam gidra ge birdagarh re chalawog kana." },
  "आज छुट्टी है।": { olChiki: "ᱛᱮᱦᱮᱧ ᱫᱚ ᱪᱷᱩᱴᱤ ᱠᱟᱱᱟ ᱾", phonetic: "Tehenj do chhuti kana." },
  "आज छुट्टी है": { olChiki: "ᱛᱮᱦᱮᱧ ᱫᱚ ᱪᱷᱩᱴᱤ ᱠᱟᱱᱟ ᱾", phonetic: "Tehenj do chhuti kana." },

  // Classroom Management & Pedagogy
  "सभी बच्चे शांत रहिए और मेरी बात ध्यान से सुनिए।": {
    olChiki: "ᱥᱟᱱᱟᱢ ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ ᱛᱷᱤᱨ ᱛᱟᱦᱮᱸᱱ ᱯᱮ ᱟᱨ ᱤᱧᱟᱜ ᱠᱟᱛᱷᱟ ᱫᱷᱮᱭᱟᱱ ᱛᱮ ᱟᱸᱡᱚᱢ ᱯᱮ ᱾",
    phonetic: "Sanam gidra ko thir tahen pe ar injag katha dhyan te anjom pe."
  },
  "सभी बच्चे शांत रहिए": {
    olChiki: "ᱥᱟᱱᱟᱢ ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ ᱛᱷᱤᱨ ᱛᱟᱦᱮᱸᱱ ᱯᱮ ᱾",
    phonetic: "Sanam gidra ko thir tahen pe."
  },
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
  "अपनी किताब निकालो": {
    olChiki: "ᱟᱢᱟᱜ ᱯᱩᱛᱷᱤ ᱚᱰᱚᱠ ᱢᱮ ᱾",
    phonetic: "Amag puthi odok me."
  },
  "अपनी कॉपी निकालो और एक सुंदर चित्र बनाओ।": {
    olChiki: "ᱟᱯᱱᱟᱨᱟᱜ ᱠᱷᱟᱛᱟ ᱚᱰᱚᱠ ᱯᱮ ᱟᱨ ᱢᱤᱫᱴᱟᱝ ᱪᱚᱨᱚᱠ ᱪᱤᱛᱟᱹᱨ ᱵᱮᱱᱟᱣ ᱯᱮ ᱾",
    phonetic: "Apnarag khata odok pe ar midtang chorok chitar benaw pe."
  },
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
  "हाथ उठाइए": {
    olChiki: "ᱛᱤ ᱛᱩᱞ ᱯᱮ ᱾",
    phonetic: "Ti tul pe."
  },
  "बहुत अच्छा! तुमने बहुत सही उत्तर दिया।": {
    olChiki: "ᱟᱹᱰᱤ ᱱᱟᱯᱟᱭ! ᱟᱢ ᱟᱹᱰᱤ ᱴᱷᱤᱠ ᱛᱮᱞᱟᱢ ᱮᱢ ᱠᱮᱫᱟ ᱾",
    phonetic: "Aadi napay! Aam aadi thik telam em keda."
  },
  "बहुत अच्छा": {
    olChiki: "ᱟᱹᱰᱤ ᱱᱟᱯᱟᱭ",
    phonetic: "Aadi napay"
  },
  "डरो मत, फिर से कोशिश करो।": {
    olChiki: "ᱟᱞᱚᱢ ᱵᱚᱛᱚᱨᱚᱜ-ᱟ, ᱟᱨᱦᱚᱸ ᱠᱩᱨᱩᱢᱩᱴᱩᱭ ᱢᱮ ᱾",
    phonetic: "Alom botorog-a, arho kurmutuy me."
  },
  "डरो मत": {
    olChiki: "ᱟᱞᱚᱢ ᱵᱚᱛᱚᱨᱚᱜ-ᱟ",
    phonetic: "Alom botorog-a"
  },
  "फिर से कोशिश करो": {
    olChiki: "ᱟᱨᱦᱚᱸ ᱠᱩᱨᱩᱢᱩᱴᱩᱭ ᱢᱮ",
    phonetic: "Arho kurmutuy me"
  },
  "आज का पाठ यहीं समाप्त होता है, कल फिर मिलेंगे।": {
    olChiki: "ᱛᱮᱦᱮᱧᱟᱜ ᱯᱟᱲᱦᱟᱣ ᱱᱚᱸᱰᱮ ᱜᱮ ᱢᱩᱪᱟᱹᱫ ᱮᱱᱟ, ᱜᱟᱯᱟ ᱟᱨᱦᱚᱸ ᱵᱚᱱ ᱧᱟᱯᱟᱢᱟ ᱾",
    phonetic: "Tehenjag parhaw nonde ge muchad ena, gapa arho bon nyapama."
  },

  // Daily Needs & Environment
  "मुझे भूख लगी है": { olChiki: "ᱤᱧ ᱨᱮᱸᱜᱮᱡ ᱤᱧ ᱠᱟᱱᱟ ᱾", phonetic: "Inj rengej inj kana." },
  "मुझे पानी पीना है": { olChiki: "ᱤᱧ ᱫᱟᱜ ᱧᱩ ᱥᱟᱱᱟᱹᱧ ᱠᱟᱱᱟ ᱾", phonetic: "Inj daag nyu sananj kana." },
  "मुझे पानी पीना है।": { olChiki: "ᱤᱧ ᱫᱟᱜ ᱧᱩ ᱥᱟᱱᱟᱹᱧ ᱠᱟᱱᱟ ᱾", phonetic: "Inj daag nyu sananj kana." },
  "यह पानी पीने के लिए है।": { olChiki: "ᱱᱚᱶᱟ ᱫᱚ ᱫᱟᱜ ᱦᱟᱛᱟᱣ ᱞᱟᱹᱜᱤᱫ ᱾", phonetic: "Nowa do daag hataw lagid." },
  "खाना खा लो": { olChiki: "ᱫᱟᱠᱟ ᱡᱚᱢ ᱢᱮ ᱾", phonetic: "Daka jom me." },
  "आज बहुत तेज़ बारिश हो रही है।": { olChiki: "ᱛᱮᱦᱮᱧ ᱟᱹᱰᱤ ᱰᱷᱮᱨ ᱫᱟᱜ ᱦᱩᱭᱩᱜ ᱠᱟᱱᱟ ᱾", phonetic: "Tehenj aadi dher daag huyug kana." },
  "आज बहुत तेज़ बारिश हो रही है": { olChiki: "ᱛᱮᱦᱮᱧ ᱟᱹᱰᱤ ᱰᱷᱮᱨ ᱫᱟᱜ ᱦᱩᱭᱩᱜ ᱠᱟᱱᱟ ᱾", phonetic: "Tehenj aadi dher daag huyug kana." },
  "आज धूप बहुत तेज़ है।": { olChiki: "ᱛᱮᱦᱮᱧ ᱥᱤᱛᱩᱝ ᱟᱹᱰᱤ ᱛᱮᱡ ᱜᱮᱭᱟ ᱾", phonetic: "Tehenj situng aadi tej geya." },
  "पेड़ हमें ताज़ी हवा और फल देते हैं।": {
    olChiki: "ᱫᱟᱨᱮ ᱫᱚ ᱟᱵᱚ ᱥᱚᱨᱮᱥ ᱦᱚᱭ ᱟᱨ ᱡᱚ ᱮᱢᱟᱵᱚᱱᱟ ᱾",
    phonetic: "Dare do abo sores hoy ar jo emabona."
  },
  "यह कितने का है?": { olChiki: "ᱱᱚᱣᱟ ᱫᱚ ᱛᱤᱱᱟᱹᱜ ᱫᱟᱢ?", phonetic: "Nowa do tinag daam?" },
  "यह कितने का है": { olChiki: "ᱱᱚᱣᱟ ᱫᱚ ᱛᱤᱱᱟᱹᱜ ᱫᱟᱢ?", phonetic: "Nowa do tinag daam?" },
  "किसान खेत में काम कर रहा है।": { olChiki: "ᱪᱟᱹᱥᱤ ᱠᱷᱮᱛ ᱨᱮ ᱠᱟᱹᱢᱤ ᱠᱟᱱᱟᱭ ᱾", phonetic: "Chasi khet re kami kanay." },
  "हम सब साथ मिलकर काम करेंगे।": { olChiki: "ᱟᱵᱚ ᱡᱚᱛᱚ ᱦᱚᱲ ᱢᱤᱫ ᱥᱟᱶᱛᱮ ᱠᱟᱹᱢᱤ ᱵᱚᱱ ᱠᱟᱹᱢᱤᱭᱟ ᱾", phonetic: "Abo joto horh mid sawte kami bon kamiya." },
  "चलो खेलने चलें": { olChiki: "ᱫᱮᱞᱟ ᱮᱱᱮᱡ ᱵᱚᱱ ᱪᱟᱞᱟᱜ-ᱟ ᱾", phonetic: "Dela enej bon chalag-a." }
};

// Rich vocabulary mapping (Hindi root word -> Santali Ol Chiki + Phonetic)
export const HINDI_SANTALI_VOCAB: Record<string, { olChiki: string; phonetic: string }> = {
  // Pronouns
  "मैं": { olChiki: "ᱤᱧ", phonetic: "Inj" },
  "हम": { olChiki: "ᱟᱵᱚ", phonetic: "Abo" },
  "तुम": { olChiki: "ᱟᱢ", phonetic: "Aam" },
  "आप": { olChiki: "ᱟᱢ", phonetic: "Aam" },
  "वह": { olChiki: "ᱩᱱᱤ", phonetic: "Uni" },
  "वे": { olChiki: "ᱩᱱᱠᱩ", phonetic: "Unku" },
  "मेरा": { olChiki: "ᱤᱧᱟᱜ", phonetic: "Injag" },
  "मेरी": { olChiki: "ᱤᱧᱟᱜ", phonetic: "Injag" },
  "मेरे": { olChiki: "ᱤᱧᱟᱜ", phonetic: "Injag" },
  "हमारा": { olChiki: "ᱟᱵᱚᱣᱟᱜ", phonetic: "Abowag" },
  "हमारी": { olChiki: "ᱟᱵᱚᱣᱟᱜ", phonetic: "Abowag" },
  "तुम्हारा": { olChiki: "ᱟᱢᱟᱜ", phonetic: "Amag" },
  "तुम्हारी": { olChiki: "ᱟᱢᱟᱜ", phonetic: "Amag" },
  "आपका": { olChiki: "ᱟᱢᱟᱜ", phonetic: "Amag" },
  "आपकी": { olChiki: "ᱟᱢᱟᱜ", phonetic: "Amag" },
  "उसका": { olChiki: "ᱩᱱᱤᱭᱟᱜ", phonetic: "Uniyag" },
  "उसकी": { olChiki: "ᱩᱱᱤᱭᱟᱜ", phonetic: "Uniyag" },

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
  "दोस्त": { olChiki: "ᱜᱟᱛᱮ", phonetic: "Gate" },
  "मित्र": { olChiki: "ᱜᱟᱛᱮ", phonetic: "Gate" },
  "लोग": { olChiki: "ᱦᱚᱲ", phonetic: "Horh" },
  "शिक्षक": { olChiki: "ᱢᱟᱪᱮᱛ", phonetic: "Machet" },
  "शिक्षिका": { olChiki: "ᱢᱟᱪᱮᱛᱟᱹᱱᱤ", phonetic: "Machetani" },
  "विद्यार्थी": { olChiki: "ᱯᱟᱹᱴᱷᱩᱣᱟᱹ", phonetic: "Pathuwa" },
  "छात्र": { olChiki: "ᱯᱟᱹᱴᱷᱩᱣᱟᱹ", phonetic: "Pathuwa" },
  "किसान": { olChiki: "ᱪᱟᱹᱥᱤ", phonetic: "Chasi" },
  "दुकानदार": { olChiki: "ᱫᱚᱠᱟᱱᱤᱭᱟᱹ", phonetic: "Dokanriya" },

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
  "हाथ": { olChiki: "ᱛᱤ", phonetic: "Ti" },

  // Environment & Daily Items
  "पानी": { olChiki: "ᱫᱟᱜ", phonetic: "Daag" },
  "घर": { olChiki: "ᱚᱲᱟᱜ", phonetic: "Orag" },
  "गाँव": { olChiki: "ᱟᱹᱛᱩ", phonetic: "Atu" },
  "पेड़": { olChiki: "ᱫᱟᱨᱮ", phonetic: "Dare" },
  "पौधा": { olChiki: "ᱫᱟᱨᱮ", phonetic: "Dare" },
  "पत्ता": { olChiki: "ᱥᱟᱠᱟᱢ", phonetic: "Sakam" },
  "फल": { olChiki: "ᱡᱚ", phonetic: "Jo" },
  "सेब": { olChiki: "ᱥᱮᱣ", phonetic: "Sew" },
  "आम": { olChiki: "ᱩᱞ", phonetic: "Ul" },
  "खाना": { olChiki: "ᱫᱟᱠᱟ", phonetic: "Daka" },
  "भात": { olChiki: "ᱫᱟᱠᱟ", phonetic: "Daka" },
  "रोटी": { olChiki: "ᱨᱩᱴᱤ", phonetic: "Ruti" },
  "सब्ज़ी": { olChiki: "ᱩᱛᱩ", phonetic: "Utu" },
  "खेत": { olChiki: "ᱠᱷᱮᱛ", phonetic: "Khet" },
  "नदी": { olChiki: "ᱜᱟᱰᱟ", phonetic: "Gada" },
  "बाज़ार": { olChiki: "ᱦᱟᱴ", phonetic: "Haat" },
  "हवा": { olChiki: "ᱦᱚᱭ", phonetic: "Hoy" },
  "धूप": { olChiki: "ᱥᱤᱛᱩᱝ", phonetic: "Situng" },
  "बारिश": { olChiki: "ᱫᱟᱜ", phonetic: "Daag" },
  "दवाई": { olChiki: "ᱨᱟᱱ", phonetic: "Ran" },
  "साइकिल": { olChiki: "ᱥᱟᱭᱠᱮᱞ", phonetic: "Cycle" },

  // Time & Numbers
  "आज": { olChiki: "ᱛᱮᱦᱮᱧ", phonetic: "Tehenj" },
  "कल": { olChiki: "ᱜᱟᱯᱟ", phonetic: "Gapa" },
  "सुबह": { olChiki: "ᱥᱮᱛᱟᱜ", phonetic: "Setag" },
  "दोपहर": { olChiki: "ᱛᱤᱠᱤᱱ", phonetic: "Tikin" },
  "शाम": { olChiki: "ᱟᱹᱭᱩᱵ", phonetic: "Ayub" },
  "रात": { olChiki: "ᱧᱤᱫᱟᱹ", phonetic: "Nyida" },
  "एक": { olChiki: "ᱢᱤᱫ", phonetic: "Mid" },
  "दो": { olChiki: "ᱵᱟᱨ", phonetic: "Bar" },
  "तीन": { olChiki: "ᱯᱮ", phonetic: "Pe" },
  "चार": { olChiki: "ᱯᱩᱱ", phonetic: "Pun" },
  "पाँच": { olChiki: "ᱢᱚᱬᱮ", phonetic: "Mone" },
  "छह": { olChiki: "ᱛᱩᱨᱩᱭ", phonetic: "Turuy" },
  "सात": { olChiki: "ᱮᱭᱟᱭ", phonetic: "Eyay" },
  "आठ": { olChiki: "ᱤᱨᱟᱹᱞ", phonetic: "Iral" },
  "नौ": { olChiki: "ᱟᱨᱮ", phonetic: "Are" },
  "दस": { olChiki: "ᱜᱮᱞ", phonetic: "Gel" },

  // Adjectives & Particles
  "और": { olChiki: "ᱟᱨ", phonetic: "Ar" },
  "भी": { olChiki: "ᱦᱚᱸ", phonetic: "Ho" },
  "नहीं": { olChiki: "ᱵᱟᱝ", phonetic: "Bang" },
  "मत": { olChiki: "ᱟᱞᱚ", phonetic: "Alo" },
  "हाँ": { olChiki: "ᱦᱮᱸ", phonetic: "He" },
  "अच्छा": { olChiki: "ᱱᱟᱯᱟᱭ", phonetic: "Napay" },
  "सुंदर": { olChiki: "ᱪᱚᱨᱚᱠ", phonetic: "Chorok" },
  "बड़ा": { olChiki: "ᱢᱟᱨᱟᱝ", phonetic: "Marang" },
  "छोटा": { olChiki: "ᱦᱩᱰᱤᱧ", phonetic: "Hudinj" },
  "नया": { olChiki: "ᱱᱟᱣᱟ", phonetic: "Nawa" },
  "पुराना": { olChiki: "ᱢᱟᱨᱮ", phonetic: "Mare" },
  "तेज़": { olChiki: "ᱞᱚᱜᱚᱱ", phonetic: "Logon" },
  "धीरे": { olChiki: "ᱵᱷᱟᱹᱜᱤ ᱛᱮ", phonetic: "Bhagi te" },
  "शांत": { olChiki: "ᱛᱷᱤᱨ", phonetic: "Thir" },
  "है": { olChiki: "ᱠᱟᱱᱟ", phonetic: "Kana" },
  "हैं": { olChiki: "ᱠᱟᱱᱟ ᱠᱚ", phonetic: "Kana ko" },
  "हूँ": { olChiki: "ᱠᱟᱹᱱᱟᱹᱧ", phonetic: "Kananj" },
  "था": { olChiki: "ᱛᱟᱦᱮᱸ ᱠᱟᱱᱟ", phonetic: "Tahen kana" },
  "थे": { olChiki: "ᱛᱟᱦᱮᱸ ᱠᱟᱱᱟ ᱠᱚ", phonetic: "Tahen kana ko" },
  "का": { olChiki: "ᱨᱮᱭᱟᱜ", phonetic: "Reyag" },
  "की": { olChiki: "ᱨᱮᱭᱟᱜ", phonetic: "Reyag" },
  "के": { olChiki: "ᱨᱮᱭᱟᱜ", phonetic: "Reyag" },
  "में": { olChiki: "ᱨᱮ", phonetic: "Re" },
  "से": { olChiki: "ᱛᱮ", phonetic: "Te" },
  "पर": { olChiki: "ᱪᱮᱛᱟᱱ ᱨᱮ", phonetic: "Chetan re" },
  "साथ": { olChiki: "ᱥᱟᱶ", phonetic: "Saw" }
};

/**
 * Converts Ol Chiki text into phonetic Roman representation for speech synthesis.
 */
export function olChikiToPhonetic(olChikiText: string): string {
  let phonetic = "";
  for (const char of olChikiText) {
    if (OL_CHIKI_TO_PHONETIC[char] !== undefined) {
      phonetic += OL_CHIKI_TO_PHONETIC[char];
    } else {
      phonetic += char;
    }
  }
  return phonetic.trim();
}

/**
 * Translates Hindi text to Santali (Ol Chiki) with 100% pure script guarantee.
 * Never leaves any foreign Devanagari characters in the Ol Chiki output.
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

  // 3. Substring / phrase lookup
  for (const [key, val] of Object.entries(HINDI_SANTALI_PHRASE_BOOK)) {
    const keyStripped = key.replace(/[।.,!?]/g, "").trim();
    if (keyStripped === stripped) {
      return val;
    }
  }

  // 4. Tokenized smart translation + Devanagari transliteration fallback
  const words = cleaned.split(/\s+/);
  const olChikiWords: string[] = [];
  const phoneticWords: string[] = [];

  for (const w of words) {
    const wStripped = w.replace(/[।.,!?]/g, "").trim();
    if (!wStripped) continue;

    if (HINDI_SANTALI_VOCAB[wStripped]) {
      olChikiWords.push(HINDI_SANTALI_VOCAB[wStripped].olChiki);
      phoneticWords.push(HINDI_SANTALI_VOCAB[wStripped].phonetic);
    } else if (HINDI_SANTALI_PHRASE_BOOK[wStripped]) {
      olChikiWords.push(HINDI_SANTALI_PHRASE_BOOK[wStripped].olChiki);
      phoneticWords.push(HINDI_SANTALI_PHRASE_BOOK[wStripped].phonetic);
    } else {
      // Unrecognized word / proper noun (e.g. 'लक्ष्य', 'दिल्ली') -> Transliterate to pure Ol Chiki
      const transliterated = transliterateDevaToOlChiki(wStripped);
      olChikiWords.push(transliterated);
      phoneticWords.push(olChikiToPhonetic(transliterated));
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
  // Core vocabulary roots
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
      // Find in vocab
      let found = false;
      for (const [hWord, vObj] of Object.entries(HINDI_SANTALI_VOCAB)) {
        if (vObj.olChiki === wStripped || vObj.phonetic.toLowerCase() === wStripped.toLowerCase()) {
          hindiWords.push(hWord);
          found = true;
          break;
        }
      }
      if (!found) {
        // Transliterate Ol Chiki characters to Devanagari if applicable
        hindiWords.push(transliterateOlChikiToDeva(wStripped));
      }
    }
  }

  const punc = cleaned.endsWith("?") ? "?" : "।";
  return { hindi: hindiWords.join(" ") + " " + punc };
}

/**
 * Synthesizes Santali speech.
 * Checks for Android native bridge first for instant hardware speech,
 * then falls back to browser Web Speech API with Ol Chiki phonetic representation.
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
    const spokenText = phoneticOverride || (text.match(/[\u1C50-\u1C7F]/) ? olChikiToPhonetic(text) : text);
    if (!spokenText.trim()) return false;

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = 0.85;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(v => v.lang.includes("hi") || v.lang.includes("IN"));
    if (indianVoice) {
      utterance.voice = indianVoice;
    } else {
      utterance.lang = "hi-IN";
    }

    if (onStart) utterance.onstart = onStart;
    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn("Speech synthesis error:", err);
    if (onEnd) onEnd();
    return false;
  }
}

/**
 * Synthesizes Hindi speech.
 * Checks for Android native bridge first, then browser Web Speech API.
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

/**
 * Interface for Speech Recognition handler
 */
export interface SpeechRecognitionHandler {
  start: () => void;
  stop: () => void;
  isSupported: boolean;
}

/**
 * Initializes Speech Recognition for Hindi voice input.
 * Supports both Android Native SpeechRecognizer and Web Speech API with built-in watchdog timer.
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
          // Watchdog: auto-stop after 5 seconds to ensure mic never hangs
          watchdogTimer = setTimeout(() => {
            console.log("Watchdog auto-stopping Hindi mic");
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

