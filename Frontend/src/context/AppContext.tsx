import React, { createContext, useContext, useState, useEffect } from 'react';
import { ScreenId, BottomTab, LanguageCode, HistoryItem, DictionaryItem, FlashcardItem, WorksheetRow } from '../types';

interface AppContextType {
  currentScreen: ScreenId;
  activeTab: BottomTab;
  isDarkMode: boolean;
  textSize: 'Small' | 'Medium' | 'Large' | 'Extra Large';
  appLanguage: LanguageCode;
  toastMessage: string | null;
  inputText: string;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  quizSelected: number;
  flashcardIdx: number;
  learningClass: 'Class 1' | 'Class 2' | 'Class 3';
  historyFilter: 'All' | 'Hindi → Santali' | 'Hindi → Mundari';
  dictFilter: 'All' | LanguageCode;
  dictSearch: string;
  wsClass: string;
  wsTopic: string;
  wsLanguage: string;
  wsType: string;
  offlinePacks: { Hindi: boolean; Santali: boolean; Mundari: boolean };
  flashcards: FlashcardItem[];
  worksheetData: WorksheetRow[];
  dictionaryItems: DictionaryItem[];
  historyItems: HistoryItem[];
  navigateTo: (screen: ScreenId, tabHint?: BottomTab) => void;
  goBack: () => void;
  showToast: (msg: string) => void;
  playSpeech: (text: string) => void;
  setIsDarkMode: (val: boolean) => void;
  setTextSize: (val: 'Small' | 'Medium' | 'Large' | 'Extra Large') => void;
  setAppLanguage: (val: LanguageCode) => void;
  setInputText: (val: string) => void;
  setQuizSelected: (val: number) => void;
  setFlashcardIdx: (updater: (prev: number) => number) => void;
  setLearningClass: (val: 'Class 1' | 'Class 2' | 'Class 3') => void;
  setHistoryFilter: (val: 'All' | 'Hindi → Santali' | 'Hindi → Mundari') => void;
  setDictFilter: (val: 'All' | LanguageCode) => void;
  setDictSearch: (val: string) => void;
  setOfflinePacks: React.Dispatch<React.SetStateAction<{ Hindi: boolean; Santali: boolean; Mundari: boolean }>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('splash');
  const [screenHistory, setScreenHistory] = useState<ScreenId[]>(['splash']);
  const [activeTab, setActiveTab] = useState<BottomTab>('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [textSize, setTextSize] = useState<'Small' | 'Medium' | 'Large' | 'Extra Large'>('Medium');
  const [appLanguage, setAppLanguage] = useState<LanguageCode>('Hindi');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [inputText, setInputText] = useState('आज हम संख्या सीखेंगे।');
  const [sourceLang] = useState<LanguageCode>('Hindi');
  const [targetLang] = useState<LanguageCode>('Santali');
  const [quizSelected, setQuizSelected] = useState<number>(1);
  const [flashcardIdx, setFlashcardIdxState] = useState<number>(0);
  const [learningClass, setLearningClass] = useState<'Class 1' | 'Class 2' | 'Class 3'>('Class 1');
  const [historyFilter, setHistoryFilter] = useState<'All' | 'Hindi → Santali' | 'Hindi → Mundari'>('All');
  const [dictFilter, setDictFilter] = useState<'All' | LanguageCode>('All');
  const [dictSearch, setDictSearch] = useState('');

  const [wsClass] = useState('Class 1');
  const [wsTopic] = useState('Numbers (1–10)');
  const [wsLanguage] = useState('Hindi + Santali');
  const [wsType] = useState('Practice Sheet');

  const [offlinePacks, setOfflinePacks] = useState({
    Hindi: true,
    Santali: true,
    Mundari: false
  });

  const flashcards: FlashcardItem[] = [
    {
      hindi: "सेब",
      translit: "Seb",
      santali: "ᱥᱮᱣ",
      mundari: "ᱥᱮᱵᱽ",
      english: "Apple",
      image: "/assets/red_apple.jpg"
    },
    {
      hindi: "आम",
      translit: "Aam",
      santali: "ᱩᱞ",
      mundari: "ᱩᱞᱤ",
      english: "Mango",
      image: "/assets/red_apple.jpg"
    },
    {
      hindi: "पेड़",
      translit: "Ped",
      santali: "ᱫᱟᱨᱮ",
      mundari: "ᱫᱟᱨᱩ",
      english: "Tree",
      image: "/assets/rural_children.jpg"
    }
  ];

  const worksheetData: WorksheetRow[] = [
    { num: "1", hindi: "एक", santali: "ᱢᱤᱫ", icons: "🍎" },
    { num: "2", hindi: "दो", santali: "ᱵᱟᱨ", icons: "🍒 🍒" },
    { num: "3", hindi: "तीन", santali: "ᱯᱮ", icons: "🍌 🍌 🍌" },
    { num: "4", hindi: "चार", santali: "ᱯᱩᱱ", icons: "🍓 🍓 🍓 🍓" },
    { num: "5", hindi: "पाँच", santali: "ᱢᱚᱬᱮ", icons: "🥕 🥕 🥕 🥕 🥕" },
  ];

  const dictionaryItems: DictionaryItem[] = [
    {
      hindi: "घर",
      english: "House",
      santali: "ᱚᱲᱟᱜ",
      mundari: "ᱚᱲᱟᱜ",
    },
    {
      hindi: "किताब",
      english: "Book",
      santali: "ᱯᱩᱛᱷᱤ",
      mundari: "ᱯᱩᱛᱷᱤ",
    },
    {
      hindi: "स्कूल",
      english: "School",
      santali: "ᱤᱛᱩᱱ ᱟᱥᱲᱟ",
      mundari: "ᱤᱛᱩᱱ ᱚᱲᱟᱜ",
    }
  ];

  const historyItems: HistoryItem[] = [
    { hi: "आज हम संख्या सीखेंगे।", sat: "ᱛᱮᱦᱮᱧ ᱟᱵᱚ ᱮᱞ ᱵᱚᱱ ᱪᱮᱫᱚᱜᱼᱟ᱾", time: "Today, 10:30 AM", lang: "Hindi → Santali", starred: true },
    { hi: "मेरा नाम लखन है।", sat: "ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ ᱞᱚᱠᱷᱚᱱ ᱠᱟᱱᱟ᱾", time: "Today, 09:15 AM", lang: "Hindi → Santali", starred: true },
    { hi: "यह एक किताब है।", sat: "ᱱᱚᱣᱟ ᱫᱚ ᱢᱤᱫᱴᱟᱝ ᱯᱩᱛᱷᱤ ᱠᱟᱱᱟ᱾", time: "Yesterday, 4:20 PM", lang: "Hindi → Santali", starred: true },
    { hi: "हम स्कूल जा रहे हैं।", sat: "ᱟᱞᱮ ᱤᱛᱩᱱ ᱟᱥᱲᱟ ᱞᱮ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ᱾", time: "Yesterday, 4:10 PM", lang: "Hindi → Santali", starred: true },
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const playSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85;
      u.lang = 'hi-IN';
      window.speechSynthesis.speak(u);
    }
  };

  const navigateTo = (s: ScreenId, tabHint?: BottomTab) => {
    setScreenHistory(prev => [...prev, s]);
    setCurrentScreen(s);
    if (tabHint) {
      setActiveTab(tabHint);
    } else {
      if (s === 'home' || s === 'dictionary' || s === 'learning' || s === 'flashcards' || s === 'quiz' || s === 'worksheet-gen' || s === 'worksheet-preview') {
        setActiveTab('home');
      } else if (s === 'translate' || s === 'voice' || s === 'translation-result') {
        setActiveTab('translate');
      } else if (s === 'history') {
        setActiveTab('history');
      } else if (s === 'settings' || s === 'choose-language' || s === 'dark-mode' || s === 'text-size' || s === 'offline-content' || s === 'about') {
        setActiveTab('settings');
      }
    }
  };

  const goBack = () => {
    if (screenHistory.length > 1) {
      const newHistory = [...screenHistory];
      newHistory.pop();
      const prev = newHistory[newHistory.length - 1];
      setScreenHistory(newHistory);
      setCurrentScreen(prev);
      if (prev === 'home') setActiveTab('home');
      else if (prev === 'translate' || prev === 'voice' || prev === 'translation-result') setActiveTab('translate');
      else if (prev === 'history') setActiveTab('history');
      else if (prev === 'settings') setActiveTab('settings');
    } else {
      navigateTo('home');
    }
  };

  const setFlashcardIdx = (updater: (prev: number) => number) => {
    setFlashcardIdxState(updater);
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        activeTab,
        isDarkMode,
        textSize,
        appLanguage,
        toastMessage,
        inputText,
        sourceLang,
        targetLang,
        quizSelected,
        flashcardIdx,
        learningClass,
        historyFilter,
        dictFilter,
        dictSearch,
        wsClass,
        wsTopic,
        wsLanguage,
        wsType,
        offlinePacks,
        flashcards,
        worksheetData,
        dictionaryItems,
        historyItems,
        navigateTo,
        goBack,
        showToast,
        playSpeech,
        setIsDarkMode,
        setTextSize,
        setAppLanguage,
        setInputText,
        setQuizSelected,
        setFlashcardIdx,
        setLearningClass,
        setHistoryFilter,
        setDictFilter,
        setDictSearch,
        setOfflinePacks,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
