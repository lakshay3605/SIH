export type ScreenId =
  | 'splash'              // Screen 1: Splash Screen
  | 'onboarding1'         // Screen 2: Onboarding 1
  | 'onboarding2'         // Screen 3: Onboarding 2
  | 'home'                // Screen 4: Home Screen
  | 'translate'           // Screen 5: Translate (Text)
  | 'voice'               // Screen 6: Voice Conversation
  | 'choose-language'     // Screen 7: Choose Language
  | 'translation-result'  // Screen 8: Translation Result
  | 'history'             // Screen 9: History
  | 'dictionary'          // Screen 10: Dictionary
  | 'learning'            // Screen 11: Learning Mode
  | 'flashcards'          // Screen 12: Flashcards
  | 'quiz'                // Screen 13: Quiz Mode
  | 'worksheet-gen'       // Screen 14: Worksheet Generation
  | 'worksheet-preview'   // Screen 15: Worksheet Preview
  | 'settings'            // Screen 16: Settings
  | 'dark-mode'           // Screen 17: Dark Mode
  | 'text-size'           // Screen 18: Text Size Setting
  | 'offline-content'     // Screen 19: Offline Content
  | 'about'               // Screen 20: About / Closing
  | 'classroom-phrases'   // Screen 21: Classroom Phrases
  | 'numbers-flashcards'  // Screen 22: Numbers Flashcards
  | 'animal-flashcards';  // Screen 23: Animal Flashcards

export type BottomTab = 'home' | 'translate' | 'history' | 'settings';

export type LanguageCode = 'Hindi' | 'Santhali' | 'Mundari';

export interface FlashcardItem {
  hindi: string;
  translit: string;
  santhali: string;
  mundari: string;
  english: string;
  image: string;
  santhaliAudio: string;
  mundariAudio: string;
}

export type WorksheetType = 'match' | 'mcq' | 'blanks' | 'mix';

export interface WorksheetRow {
  num: string;
  hindi: string;
  santhali: string;
  icons: string;
}

export interface DictionaryItem {
  hindi: string;
  english: string;
  santhali: string;
  mundari: string;
  santhaliAudio?: string;
  mundariAudio?: string;
}

export interface HistoryItem {
  hi: string;
  sat: string;
  time: string;
  lang: string;
  starred?: boolean;
}
