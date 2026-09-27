import React, { createContext, useContext, useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { speakSantali, translateHindiToSantaliClient } from '../utils/speechTranslation';
import { ScreenId, BottomTab, LanguageCode, HistoryItem, DictionaryItem, FlashcardItem, WorksheetRow, WorksheetType } from '../types';

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
  translatedText: string;
  phoneticText: string;
  historyFilter: 'All' | 'Hindi → Santhali' | 'Hindi → Mundari';
  dictFilter: 'All' | LanguageCode;
  dictSearch: string;
  wsClass: string;
  wsTopic: string;
  wsLanguage: 'Santhali' | 'Mundari';
  wsType: WorksheetType;
  offlinePacks: { Hindi: boolean; Santhali: boolean; Mundari: boolean };
  flashcards: FlashcardItem[];
  worksheetData: WorksheetRow[];
  dictionaryItems: DictionaryItem[];
  historyItems: HistoryItem[];
  navigateTo: (screen: ScreenId, tabHint?: BottomTab) => void;
  goBack: () => void;
  showToast: (msg: string) => void;
  playSpeech: (text: string, phoneticOverride?: string, onStart?: () => void, onEnd?: () => void) => void;
  translateInput: (textToTranslate?: string) => { olChiki: string; phonetic: string };
  setIsDarkMode: (val: boolean) => void;
  setTextSize: (val: 'Small' | 'Medium' | 'Large' | 'Extra Large') => void;
  setAppLanguage: (val: LanguageCode) => void;
  setInputText: (val: string) => void;
  setTranslatedText: (val: string) => void;
  setPhoneticText: (val: string) => void;
  setQuizSelected: (val: number) => void;
  setFlashcardIdx: (updater: (prev: number) => number) => void;
  setLearningClass: (val: 'Class 1' | 'Class 2' | 'Class 3') => void;
  setHistoryFilter: (val: 'All' | 'Hindi → Santhali' | 'Hindi → Mundari') => void;
  setDictFilter: (val: 'All' | LanguageCode) => void;
  setDictSearch: (val: string) => void;
  setOfflinePacks: React.Dispatch<React.SetStateAction<{ Hindi: boolean; Santhali: boolean; Mundari: boolean }>>;
  setWsLanguage: (val: 'Santhali' | 'Mundari') => void;
  setWsType: (val: WorksheetType) => void;
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
  const [translatedText, setTranslatedText] = useState('ᱛᱮᱦᱮᱧ ᱟᱵᱚ ᱮᱞ ᱵᱚᱱ ᱪᱮᱫᱚᱜᱼᱟ᱾');
  const [phoneticText, setPhoneticText] = useState('Tehenj abo el bon chedog-aa.');
  const [sourceLang] = useState<LanguageCode>('Hindi');
  const [targetLang] = useState<LanguageCode>('Santhali');
  const [quizSelected, setQuizSelected] = useState<number>(1);
  const [flashcardIdx, setFlashcardIdxState] = useState<number>(0);
  const [learningClass, setLearningClass] = useState<'Class 1' | 'Class 2' | 'Class 3'>('Class 1');
  const [historyFilter, setHistoryFilter] = useState<'All' | 'Hindi → Santhali' | 'Hindi → Mundari'>('All');
  const [dictFilter, setDictFilter] = useState<'All' | LanguageCode>('All');
  const [dictSearch, setDictSearch] = useState('');

  const [wsClass] = useState('Class 1');
  const [wsTopic] = useState('Numbers (1–10)');
  const [wsLanguage, setWsLanguage] = useState<'Santhali' | 'Mundari'>('Santhali');
  const [wsType, setWsType] = useState<WorksheetType>('mix');

  const [offlinePacks, setOfflinePacks] = useState({
    Hindi: true,
    Santhali: true,
    Mundari: false
  });

  useEffect(() => {
    CapacitorApp.addListener('backButton', () => {
      setScreenHistory(prev => {
        if (prev.length > 1) {
          const newHistory = [...prev];
          newHistory.pop();
          const s = newHistory[newHistory.length - 1];
          setCurrentScreen(s);
          
          if (s === 'home' || s === 'dictionary' || s === 'learning' || s === 'flashcards' || s === 'animal-flashcards' || s === 'quiz' || s === 'worksheet-gen' || s === 'worksheet-preview') {
            setActiveTab('home');
          } else if (s === 'translate' || s === 'voice' || s === 'translation-result') {
            setActiveTab('translate');
          } else if (s === 'history') {
            setActiveTab('history');
          } else if (s === 'settings' || s === 'choose-language' || s === 'dark-mode' || s === 'text-size' || s === 'offline-content' || s === 'about') {
            setActiveTab('settings');
          }
          return newHistory;
        } else {
          const exit = window.confirm("Are you sure you want to close the app?");
          if (exit) {
            CapacitorApp.exitApp();
          }
          return prev;
        }
      });
    });

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, []);

  const flashcards: FlashcardItem[] = [
    {
      hindi: "पक्षी", translit: "Pakshi", santhali: "ᱪᱮᱬᱮ", mundari: "चेंड़ेको", english: "Bird",
      image: "/assets/animals/bird.png",
      santhaliAudio: "/assets/animals/bird-santali.mp3",
      mundariAudio: "/assets/animals/bird_mundari.mp3"
    },
    {
      hindi: "बिल्ली", translit: "Billi", santhali: "ᱯᱩᱥᱤ", mundari: "पुसि", english: "Cat",
      image: "/assets/animals/cat.png",
      santhaliAudio: "/assets/animals/cat-santali.mp3",
      mundariAudio: "/assets/animals/cat_mundari.mp3"
    },
    {
      hindi: "गाय", translit: "Gaay", santhali: "ᱜᱟᱹᱭ", mundari: "उरिः", english: "Cow",
      image: "/assets/animals/cow.png",
      santhaliAudio: "/assets/animals/cow-santali.mp3",
      mundariAudio: "/assets/animals/cow_mundari.mp3"
    },
    {
      hindi: "कुत्ता", translit: "Kutta", santhali: "ᱥᱮᱛᱟ", mundari: "सेता", english: "Dog",
      image: "/assets/animals/dog.png",
      santhaliAudio: "/assets/animals/dog_santali.mp3",
      mundariAudio: "/assets/animals/dog_mundari.mp3"
    },
    {
      hindi: "हाथी", translit: "Haathi", santhali: "ᱦᱟᱹᱛᱤ", mundari: "हाथि!", english: "Elephant",
      image: "/assets/animals/elephant.png",
      santhaliAudio: "/assets/animals/elephant_santali.mp3",
      mundariAudio: "/assets/animals/elephant_mundari.mp3"
    },
    {
      hindi: "बकरी", translit: "Bakri", santhali: "ᱵᱟᱠᱨᱤ", mundari: "मेरोम", english: "Goat",
      image: "/assets/animals/goat.png",
      santhaliAudio: "/assets/animals/goat_santali.mp3",
      mundariAudio: "/assets/animals/goat_mundari.mp3"
    },
    {
      hindi: "मुर्गी", translit: "Murgi", santhali: "ᱥᱤᱢ ᱾", mundari: "सिम", english: "Hen",
      image: "/assets/animals/hen.png",
      santhaliAudio: "/assets/animals/hen_santali.mp3",
      mundariAudio: "/assets/animals/hen_mundari.mp3"
    },
    {
      hindi: "बंदर", translit: "Bandar", santhali: "ᱦᱟᱹᱬᱩ ᱾", mundari: "गड़ि", english: "Monkey",
      image: "/assets/animals/monkey.png",
      santhaliAudio: "/assets/animals/monkey_santali.mp3",
      mundariAudio: "/assets/animals/monkey_mundari.mp3"
    },
    {
      hindi: "सुअर", translit: "Suar", santhali: "ᱥᱩᱠᱨᱤ ᱾", mundari: "सुकुरि", english: "Pig",
      image: "/assets/animals/pig.png",
      santhaliAudio: "/assets/animals/pig_santali.mp3",
      mundariAudio: "/assets/animals/pig_mundari.mp3"
    },
    {
      hindi: "भेड़", translit: "Bhed", santhali: "ᱵᱷᱤᱰᱤ", mundari: "मिंडि", english: "Sheep",
      image: "/assets/animals/sheep.png",
      santhaliAudio: "/assets/animals/sheep_santali.mp3",
      mundariAudio: "/assets/animals/sheep_mundari.mp3"
    }
  ];

  const worksheetData: WorksheetRow[] = [
    { num: "1", hindi: "एक", santhali: "ᱢᱤᱫ", icons: "🍎" },
    { num: "2", hindi: "दो", santhali: "ᱵᱟᱨ", icons: "🍒 🍒" },
    { num: "3", hindi: "तीन", santhali: "ᱯᱮ", icons: "🍌 🍌 🍌" },
    { num: "4", hindi: "चार", santhali: "ᱯᱩᱱ", icons: "🍓 🍓 🍓 🍓" },
    { num: "5", hindi: "पाँच", santhali: "ᱢᱚᱬᱮ", icons: "🥕 🥕 🥕 🥕 🥕" },
  ];

  const dictionaryItems: DictionaryItem[] = [
    {
      hindi: "घर",
      english: "House",
      santhali: "ᱚᱲᱟᱜ",
      mundari: "ᱚᱲᱟᱜ",
    },
    {
      hindi: "किताब",
      english: "Book",
      santhali: "ᱯᱩᱛᱷᱤ",
      mundari: "ᱯᱩᱛᱷᱤ",
    },
    {
      hindi: "स्कूल",
      english: "School",
      santhali: "ᱤᱛᱩᱱ ᱟᱥᱲᱟ",
      mundari: "ᱤᱛᱩᱱ ᱚᱲᱟᱜ",
    }
  ];

  const historyItems: HistoryItem[] = [
    { hi: "आज हम संख्या सीखेंगे।", sat: "ᱛᱮᱦᱮᱧ ᱟᱵᱚ ᱮᱞ ᱵᱚᱱ ᱪᱮᱫᱚᱜᱼᱟ᱾", time: "Today, 10:30 AM", lang: "Hindi → Santhali", starred: true },
    { hi: "मेरा नाम लखन है।", sat: "ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ ᱞᱚᱠᱷᱚᱱ ᱠᱟᱱᱟ᱾", time: "Today, 09:15 AM", lang: "Hindi → Santhali", starred: true },
    { hi: "यह एक किताब है।", sat: "ᱱᱚᱣᱟ ᱫᱚ ᱢᱤᱫᱴᱟᱝ ᱯᱩᱛᱷᱤ ᱠᱟᱱᱟ᱾", time: "Yesterday, 4:20 PM", lang: "Hindi → Santhali", starred: true },
    { hi: "हम स्कूल जा रहे हैं।", sat: "ᱟᱞᱮ ᱤᱛᱩᱱ ᱟᱥᱲᱟ ᱞᱮ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ᱾", time: "Yesterday, 4:10 PM", lang: "Hindi → Santhali", starred: true },
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const translateInput = (textToTranslate?: string) => {
    const text = textToTranslate !== undefined ? textToTranslate : inputText;
    const res = translateHindiToSantaliClient(text);
    const newOlChiki = res.olChiki || 'ᱛᱮᱦᱮᱧ ᱟᱵᱚ ᱮᱞ ᱵᱚᱱ ᱪᱮᱫᱚᱜᱼᱟ᱾';
    const newPhonetic = res.phonetic || 'Tehenj abo el bon chedog-aa.';
    setTranslatedText(newOlChiki);
    setPhoneticText(newPhonetic);
    return { olChiki: newOlChiki, phonetic: newPhonetic };
  };

  const playSpeech = (text: string, phoneticOverride?: string, onStart?: () => void, onEnd?: () => void) => {
    speakSantali(text, phoneticOverride, onStart, onEnd);
  };

  const navigateTo = (s: ScreenId, tabHint?: BottomTab) => {
    setScreenHistory(prev => [...prev, s]);
    setCurrentScreen(s);
    if (tabHint) {
      setActiveTab(tabHint);
    } else {
      if (s === 'home' || s === 'dictionary' || s === 'learning' || s === 'flashcards' || s === 'animal-flashcards' || s === 'quiz' || s === 'worksheet-gen' || s === 'worksheet-preview') {
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
        translatedText,
        phoneticText,
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
        translateInput,
        setIsDarkMode,
        setTextSize,
        setAppLanguage,
        setInputText,
        setTranslatedText,
        setPhoneticText,
        setQuizSelected,
        setFlashcardIdx,
        setLearningClass,
        setHistoryFilter,
        setDictFilter,
        setDictSearch,
        setOfflinePacks,
        setWsLanguage,
        setWsType,
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
