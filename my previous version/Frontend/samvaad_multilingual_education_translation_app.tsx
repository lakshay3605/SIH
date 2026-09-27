import React, { useState, useEffect } from 'react';
import {
  Home, History, Settings, Volume2, Copy, Share2, Star, Mic,
  ArrowLeftRight, Download, BookOpen, Layers, FileText, Search, Moon,
  Type, Info, HelpCircle, ChevronRight, CheckCircle2,
  Printer, GraduationCap, ChevronLeft, MoreVertical
} from 'lucide-react';

// ==========================================
// Screen Definitions & Data
// ==========================================
export type ScreenId =
  | 1  // Splash Screen
  | 2  // Onboarding 1
  | 3  // Onboarding 2
  | 4  // Home Screen
  | 5  // Translate (Text)
  | 6  // Voice Conversation
  | 7  // Choose Language
  | 8  // Translation Result
  | 9  // History
  | 10 // Dictionary
  | 11 // Learning Mode
  | 12 // Flashcards
  | 13 // Quiz Mode
  | 14 // Worksheet Generation
  | 15 // Worksheet Preview
  | 16 // Settings
  | 17 // Dark Mode
  | 18 // Text Size Setting
  | 19 // Offline Content
  | 20; // About / Closing

type BottomTab = 'home' | 'translate' | 'history' | 'settings';

const FLASHCARD_ITEMS = [
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

const WORKSHEET_DATA = [
  { num: "1", hindi: "एक", santali: "ᱢᱤᱫ", icons: "🍎" },
  { num: "2", hindi: "दो", santali: "ᱵᱟᱨ", icons: "🍒 🍒" },
  { num: "3", hindi: "तीन", santali: "ᱯᱮ", icons: "🍌 🍌 🍌" },
  { num: "4", hindi: "चार", santali: "ᱯᱩᱱ", icons: "🍓 🍓 🍓 🍓" },
  { num: "5", hindi: "पाँच", santali: "ᱢᱚᱬᱮ", icons: "🥕 🥕 🥕 🥕 🥕" },
];

// ==========================================
// Official Government & Brand Artwork
// ==========================================

// State Emblem of India (Ashoka Lion Capital with "सत्यमेव जयते")
function StateEmblemArtwork({ className = "w-9 h-11" }: { className?: string }) {
  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <img
        src="/assets/state_emblem.jpg"
        alt="Emblem of India"
        className="w-full h-full object-contain mix-blend-multiply filter contrast-125"
      />
    </div>
  );
}

// Authentic Three-Leaves Brand Mark (Forest green with white veins)
function SamvaadLeavesLogo({ className = "w-11 h-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Center Leaf */}
      <path d="M50 70 C50 40 45 15 50 8 C55 15 67 35 63 55 C59 68 50 70 50 70 Z" fill="#0C5A3E" />
      <path d="M50 68 L50 14 M50 32 L56 26 M50 44 L58 37 M50 56 L55 50" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
      {/* Left Leaf */}
      <path d="M48 70 C30 55 16 42 12 28 C26 26 40 40 46 64 C48 68 48 70 48 70 Z" fill="#0C5A3E" />
      <path d="M46 66 C35 52 26 42 16 33 M24 40 L30 46 M32 50 L38 56" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
      {/* Right Leaf */}
      <path d="M52 70 C70 55 84 42 88 28 C74 26 60 40 54 64 C52 68 52 70 52 70 Z" fill="#0C5A3E" />
      <path d="M54 66 C65 52 74 42 84 33 M76 40 L70 46 M68 50 L62 56" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
      {/* Stem */}
      <path d="M50 70 L50 78" stroke="#0C5A3E" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

// ==========================================
// Actual Mobile App Root Component
// ==========================================
export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>(1);
  const [screenHistory, setScreenHistory] = useState<ScreenId[]>([1]);
  const [activeTab, setActiveTab] = useState<BottomTab>('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [textSize, setTextSize] = useState<'Small' | 'Medium' | 'Large' | 'Extra Large'>('Medium');
  const [appLanguage, setAppLanguage] = useState<'Hindi' | 'Santali' | 'Mundari'>('Hindi');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // App Features State
  const [inputText, setInputText] = useState('आज हम संख्या सीखेंगे।');
  const [quizSelected, setQuizSelected] = useState<number>(1);
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [learningClass, setLearningClass] = useState<'Class 1' | 'Class 2' | 'Class 3'>('Class 1');
  const [historyFilter, setHistoryFilter] = useState<'All' | 'Hindi → Santali' | 'Hindi → Mundari'>('All');
  const [dictFilter, setDictFilter] = useState<'All' | 'Hindi' | 'Santali' | 'Mundari'>('All');
  const [dictSearch, setDictSearch] = useState('');

  // Worksheet State
  const [wsClass] = useState('Class 1');
  const [wsTopic] = useState('Numbers (1–10)');
  const [wsLanguage] = useState('Hindi + Santali');
  const [wsType] = useState('Practice Sheet');

  // Offline Packs State
  const [offlinePacks, setOfflinePacks] = useState({
    Hindi: true,
    Santali: true,
    Mundari: false
  });

  // Auto-advance Splash Screen after 3 seconds into Onboarding 1
  useEffect(() => {
    if (currentScreen === 1) {
      const timer = setTimeout(() => {
        navigateTo(2);
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

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
      if (s === 4 || s === 10 || s === 11 || s === 12 || s === 13 || s === 14 || s === 15) {
        setActiveTab('home');
      } else if (s === 5 || s === 6 || s === 8) {
        setActiveTab('translate');
      } else if (s === 9) {
        setActiveTab('history');
      } else if (s === 16 || s === 7 || s === 17 || s === 18 || s === 19 || s === 20) {
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
      if (prev === 4) setActiveTab('home');
      else if (prev === 5 || prev === 6 || prev === 8) setActiveTab('translate');
      else if (prev === 9) setActiveTab('history');
      else if (prev === 16) setActiveTab('settings');
    } else {
      navigateTo(4, 'home');
    }
  };

  // Standard Mobile App Screen Header
  const HeaderBar = ({
    title,
    onBack,
    showMore = true,
  }: {
    title: string;
    onBack?: () => void;
    showMore?: boolean;
  }) => {
    return (
      <header className={`px-4 py-3 flex items-center justify-between border-b select-none shrink-0 sticky top-0 z-20 ${
        isDarkMode ? 'bg-[#0E1513] border-[#1D2B25] text-gray-100' : 'bg-[#FAF7EE] border-[#EDE7D9] text-gray-900'
      }`}>
        <button
          onClick={onBack || goBack}
          className="p-1.5 -ml-1 text-gray-700 dark:text-gray-300 hover:text-[#0C5A3E] active:scale-95 transition"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
        <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight text-center truncate">
          {title}
        </h1>
        <div className="w-8 flex justify-end">
          {showMore ? (
            <button onClick={() => showToast("विकल्प मेनू")} className="p-1.5 text-gray-600 dark:text-gray-400">
              <MoreVertical className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-4"></div>
          )}
        </div>
      </header>
    );
  };

  // Main Persistent Mobile Bottom Navigation (Home → Translate [Central Highlighted] → History → Settings)
  const BottomTabBar = () => {
    return (
      <nav aria-label="Main Navigation" className={`w-full py-1 px-4 flex items-center justify-around border-t select-none shrink-0 sticky bottom-0 z-30 ${
        isDarkMode ? 'bg-[#121B17] border-[#1D2A24] text-gray-400' : 'bg-white border-[#EAE4D6] text-gray-400 shadow-lg'
      }`}>
        {/* 1. Home Tab */}
        <button
          onClick={() => navigateTo(4, 'home')}
          className={`flex-1 flex flex-col items-center py-1 transition-colors ${
            activeTab === 'home'
              ? isDarkMode ? 'text-[#34D399] font-bold' : 'text-[#0C5A3E] font-bold'
              : 'hover:text-gray-600 dark:hover:text-gray-200'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Home</span>
        </button>

        {/* 2. Central Highlighted Action: Translate */}
        <button
          onClick={() => navigateTo(5, 'translate')}
          className="flex-1 flex flex-col items-center py-0 relative group"
        >
          <div className={`w-12 h-12 -mt-5 rounded-full flex items-center justify-center shadow-lg transition-transform duration-150 group-hover:scale-105 active:scale-95 border-4 ${
            activeTab === 'translate'
              ? 'bg-[#0C5A3E] text-white border-[#FAF7EE] dark:border-[#0E1513] shadow-emerald-950/40 ring-2 ring-emerald-500/20'
              : 'bg-[#0C5A3E] text-white border-[#FAF7EE] dark:border-[#0E1513]'
          }`}>
            <ArrowLeftRight className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className={`text-[10px] tracking-tight mt-0.5 ${
            activeTab === 'translate'
              ? isDarkMode ? 'text-[#34D399] font-bold' : 'text-[#0C5A3E] font-bold'
              : 'text-gray-600 dark:text-gray-400 font-semibold'
          }`}>
            Translate
          </span>
        </button>

        {/* 3. History Tab */}
        <button
          onClick={() => navigateTo(9, 'history')}
          className={`flex-1 flex flex-col items-center py-1 transition-colors ${
            activeTab === 'history'
              ? isDarkMode ? 'text-[#34D399] font-bold' : 'text-[#0C5A3E] font-bold'
              : 'hover:text-gray-600 dark:hover:text-gray-200'
          }`}
        >
          <History className={`w-5 h-5 ${activeTab === 'history' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">History</span>
        </button>

        {/* 4. Settings Tab */}
        <button
          onClick={() => navigateTo(16, 'settings')}
          className={`flex-1 flex flex-col items-center py-1 transition-colors ${
            activeTab === 'settings'
              ? isDarkMode ? 'text-[#34D399] font-bold' : 'text-[#0C5A3E] font-bold'
              : 'hover:text-gray-600 dark:hover:text-gray-200'
          }`}
        >
          <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Settings</span>
        </button>
      </nav>
    );
  };

  // ==========================================
  // Mobile Screen Renderers
  // ==========================================

  // SCREEN 1: Splash Screen (Occupies the entire mobile viewport)
  const renderScreen1 = () => (
    <div
      onClick={() => navigateTo(2)}
      className="w-full min-h-screen flex flex-col items-center justify-between text-center px-5 pt-8 pb-6 bg-[#FAF7EE] dark:bg-[#0E1513] cursor-pointer select-none"
    >
      {/* Top: Official State Emblem of India + Government of Jharkhand */}
      <div className="w-full flex flex-col items-center pt-2">
        <StateEmblemArtwork className="w-10 h-12 mb-1.5" />
        <p className="text-xs font-medium text-[#1A2621] dark:text-gray-200 tracking-normal leading-tight">
          Government of Jharkhand
        </p>
        <p className="text-sm font-bold text-[#1A2621] dark:text-gray-100 leading-tight mt-0.5">
          झारखंड सरकार
        </p>
      </div>

      {/* Middle: Brand Logo, Title, Tagline, Subtitle */}
      <div className="w-full flex flex-col items-center mt-3">
        <SamvaadLeavesLogo className="w-13 h-10" />
        <h1 className="text-4xl font-black text-[#0F513A] dark:text-[#34D399] tracking-tight leading-none mt-1.5">
          Samvaad
        </h1>
        <p className="text-sm font-bold text-[#0F513A] dark:text-[#34D399] mt-1.5">
          भाषा से सीखें, साथ मिलकर बढ़ें
        </p>
        <p className="text-xs text-[#2C3E35] dark:text-gray-300 font-medium max-w-[260px] mx-auto mt-2 leading-snug">
          An initiative for Mother Tongue-Based<br />Multilingual Education (MTB-MLE)
        </p>
      </div>

      {/* Large Teacher-and-Children Illustration */}
      <div className="w-full max-w-sm px-1 my-3">
        <div className="w-full h-72 sm:h-80 rounded-2xl overflow-hidden shadow-xs border border-[#E7DFCE]">
          <img
            src="/assets/splash_teacher_children.jpg"
            alt="Female teacher teaching children in rural Jharkhand"
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>

      {/* Bottom Motto Text: Simple, official, clean typography */}
      <div className="w-full pb-2">
        <p className="text-base font-bold text-[#0F513A] dark:text-[#34D399] tracking-wide">
          सबकी भाषा, बेहतर शिक्षा
        </p>
        <div className="w-24 h-1 bg-[#2D4539]/25 rounded-full mx-auto mt-3"></div>
      </div>
    </div>
  );

  // SCREEN 2: Onboarding 1
  const renderScreen2 = () => (
    <div className="w-full min-h-screen flex flex-col justify-between p-6 bg-[#FAF7EE] dark:bg-[#0E1513]">
      <div className="flex justify-end pt-2">
        <button
          onClick={() => navigateTo(4, 'home')}
          className="text-sm text-gray-500 font-semibold hover:text-[#0C5A3E] px-2 py-1"
        >
          Skip
        </button>
      </div>

      <div className="my-auto text-center space-y-3">
        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 leading-tight">
          Har Baccha Samjhe
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          Bridging languages<br />Building brighter futures
        </p>

        <div className="py-2 px-1 max-w-sm mx-auto">
          <img
            src="/assets/teacher_village.jpg"
            alt="Teacher with village children"
            className="w-full h-64 sm:h-72 object-cover rounded-2xl border border-[#E7DFCE] shadow-xs"
          />
        </div>

        {/* 3 Pagination Dots: ● ○ ○ */}
        <div className="flex justify-center items-center gap-2 pt-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0C5A3E] dark:bg-[#34D399]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700"></span>
        </div>
      </div>

      <div className="pb-4">
        <button
          onClick={() => navigateTo(3)}
          className="w-full py-3.5 rounded-xl bg-[#0C5A3E] text-white text-sm font-bold shadow-md hover:bg-[#094731] active:scale-98 transition"
        >
          Next
        </button>
      </div>
    </div>
  );

  // SCREEN 3: Onboarding 2
  const renderScreen3 = () => (
    <div className="w-full min-h-screen flex flex-col justify-between p-6 bg-[#FAF7EE] dark:bg-[#0E1513]">
      <div className="flex justify-end pt-2">
        <button
          onClick={() => navigateTo(4, 'home')}
          className="text-sm text-gray-500 font-semibold hover:text-[#0C5A3E] px-2 py-1"
        >
          Skip
        </button>
      </div>

      <div className="my-auto text-center space-y-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 leading-tight">
            Learn<br />Translate<br />Teach Together
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-2">
            Supporting teachers in<br />tribal areas with AI
          </p>
        </div>

        {/* 2x2 Feature Cards Grid */}
        <div className="grid grid-cols-2 gap-3.5 pt-2 max-w-xs mx-auto">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs flex flex-col items-center">
            <ArrowLeftRight className="w-7 h-7 text-[#0C5A3E] dark:text-[#34D399] mb-2 stroke-[1.8]" />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Translate</span>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs flex flex-col items-center">
            <BookOpen className="w-7 h-7 text-[#0C5A3E] dark:text-[#34D399] mb-2 stroke-[1.8]" />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Dictionary</span>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs flex flex-col items-center">
            <FileText className="w-7 h-7 text-[#0C5A3E] dark:text-[#34D399] mb-2 stroke-[1.8]" />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Worksheets</span>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs flex flex-col items-center">
            <Layers className="w-7 h-7 text-[#0C5A3E] dark:text-[#34D399] mb-2 stroke-[1.8]" />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Flashcards</span>
          </div>
        </div>

        {/* 3 Pagination Dots: ○ ● ○ */}
        <div className="flex justify-center items-center gap-2 pt-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#0C5A3E] dark:bg-[#34D399]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700"></span>
        </div>
      </div>

      <div className="pb-4">
        <button
          onClick={() => navigateTo(4, 'home')}
          className="w-full py-3.5 rounded-xl bg-[#0C5A3E] text-white text-sm font-bold shadow-md hover:bg-[#094731] active:scale-98 transition"
        >
          Next
        </button>
      </div>
    </div>
  );

  // SCREEN 4: Home Screen
  const renderScreen4 = () => (
    <div className="flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <SamvaadLeavesLogo className="w-7 h-7" />
            <div>
              <h1 className="text-lg font-black text-[#0C5A3E] dark:text-[#34D399] leading-tight">Samvaad</h1>
              <p className="text-[10px] text-[#0C5A3E] font-medium">भाषा से सीखें, साथ मिलकर बढ़ें</p>
            </div>
          </div>
          <button
            onClick={() => navigateTo(16)}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Teacher Hero Banner */}
        <div
          onClick={() => navigateTo(2)}
          className="p-3.5 rounded-2xl bg-[#FFF9E6] dark:bg-[#1E1B13] border border-[#F1E3B8] dark:border-[#382F1B] flex items-center justify-between overflow-hidden shadow-xs cursor-pointer hover:border-amber-300 transition"
        >
          <div className="max-w-[155px] space-y-1">
            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-snug">
              Teaching is easier when language is no longer a barrier.
            </h3>
          </div>
          <div className="w-28 h-20 relative rounded-xl overflow-hidden border border-[#EBDDB5] shrink-0">
            <img
              src="/assets/teacher_village.jpg"
              alt="Teacher Banner"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* 2x3 Grid of 6 Action Cards */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div
            onClick={() => navigateTo(5, 'translate')}
            className="p-3.5 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs flex flex-col items-center text-center cursor-pointer hover:border-emerald-400 active:scale-95 transition"
          >
            <div className="w-11 h-11 rounded-xl bg-[#E8F3EE] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-2">
              <ArrowLeftRight className="w-6 h-6 stroke-[2]" />
            </div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">Translate</h4>
          </div>

          <div
            onClick={() => navigateTo(10)}
            className="p-3.5 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs flex flex-col items-center text-center cursor-pointer hover:border-emerald-400 active:scale-95 transition"
          >
            <div className="w-11 h-11 rounded-xl bg-[#E8F3EE] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-2">
              <BookOpen className="w-6 h-6 stroke-[2]" />
            </div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">Dictionary</h4>
          </div>

          <div
            onClick={() => navigateTo(11)}
            className="p-3.5 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs flex flex-col items-center text-center cursor-pointer hover:border-emerald-400 active:scale-95 transition"
          >
            <div className="w-11 h-11 rounded-xl bg-[#E8F3EE] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-2">
              <GraduationCap className="w-6 h-6 stroke-[2]" />
            </div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">Learn</h4>
          </div>

          <div
            onClick={() => navigateTo(12)}
            className="p-3.5 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs flex flex-col items-center text-center cursor-pointer hover:border-emerald-400 active:scale-95 transition"
          >
            <div className="w-11 h-11 rounded-xl bg-[#E8F3EE] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-2">
              <Layers className="w-6 h-6 stroke-[2]" />
            </div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">Flashcards</h4>
          </div>

          <div
            onClick={() => navigateTo(13)}
            className="p-3.5 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs flex flex-col items-center text-center cursor-pointer hover:border-emerald-400 active:scale-95 transition"
          >
            <div className="w-11 h-11 rounded-xl bg-[#E8F3EE] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-2">
              <HelpCircle className="w-6 h-6 stroke-[2]" />
            </div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">Quiz</h4>
          </div>

          <div
            onClick={() => navigateTo(14)}
            className="p-3.5 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs flex flex-col items-center text-center cursor-pointer hover:border-emerald-400 active:scale-95 transition"
          >
            <div className="w-11 h-11 rounded-xl bg-[#E8F3EE] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-2">
              <FileText className="w-6 h-6 stroke-[2]" />
            </div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">Worksheets</h4>
          </div>
        </div>
      </div>
    </div>
  );

  // SCREEN 5: Translate (Text)
  const renderScreen5 = () => (
    <div className="flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <HeaderBar title="Translate" />

      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
        {/* Language Selector Row */}
        <div
          onClick={() => navigateTo(7)}
          className="p-3 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center justify-between text-xs cursor-pointer shadow-xs"
        >
          <div className="text-left">
            <span className="font-bold text-gray-800 dark:text-gray-200 block">Hindi</span>
            <span className="text-[10px] text-gray-400">हिंदी ▾</span>
          </div>
          <ArrowLeftRight className="w-4 h-4 text-[#0C5A3E]" />
          <div className="text-right">
            <span className="font-bold text-[#0C5A3E] dark:text-[#34D399] block">Santali</span>
            <span className="text-[10px] text-gray-400">संताली ▾</span>
          </div>
        </div>

        {/* Source Text Input Card */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] min-h-[120px] flex flex-col justify-between shadow-xs">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type in Hindi..."
            className="w-full text-sm font-medium text-gray-800 dark:text-gray-100 bg-transparent resize-none outline-none placeholder:text-gray-400"
            rows={3}
          />
          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
            <span></span>
            <div className="flex items-center gap-2">
              <button onClick={() => navigateTo(6)} className="hover:text-[#0C5A3E] p-1">
                <Mic className="w-4 h-4 text-gray-400 hover:text-[#0C5A3E]" />
              </button>
              <span>{inputText.length}/500</span>
            </div>
          </div>
        </div>

        {/* Translate Button */}
        <button
          onClick={() => navigateTo(8, 'translate')}
          className="w-full py-3 rounded-xl bg-[#0C5A3E] text-white text-sm font-bold shadow-md hover:bg-[#094731] transition active:scale-98"
        >
          Translate
        </button>

        {/* Translation Output Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] space-y-1.5 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 block">Translation (Santali)</span>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-wide font-['Noto_Sans_Ol_Chiki']">
            ᱛᱮᱦᱮᱧ ᱟᱵᱚ ᱮᱞ ᱵᱚᱱ ᱪᱮᱫᱚᱜᱼᱟ᱾
          </p>
          <p className="text-xs text-gray-500">Aaj am sankhya sikhenge.</p>

          <div className="pt-2.5 mt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-around text-gray-600 dark:text-gray-300 text-xs">
            <button onClick={() => playSpeech("Aaj am sankhya sikhenge.")} className="flex items-center gap-1 hover:text-[#0C5A3E]">
              <Volume2 className="w-4 h-4" /> Listen
            </button>
            <button onClick={() => { navigator.clipboard?.writeText("ᱛᱮᱦᱮᱧ ᱟᱵᱚ ᱮᱞ ᱵᱚᱱ ᱪᱮᱫᱚᱜᱼᱟ᱾"); showToast("कॉपी हो गया!"); }} className="flex items-center gap-1 hover:text-[#0C5A3E]">
              <Copy className="w-4 h-4" /> Copy
            </button>
            <button onClick={() => showToast("साझा किया गया!")} className="flex items-center gap-1 hover:text-[#0C5A3E]">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button onClick={() => showToast("सहेजा गया ⭐")} className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // SCREEN 6: Voice Conversation
  const renderScreen6 = () => (
    <div className="flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <HeaderBar title="Voice Conversation" onBack={goBack} />

      <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
        <div className="p-3 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center justify-between text-xs shadow-xs">
          <div className="text-left">
            <span className="font-bold text-gray-800 dark:text-gray-200 block">Hindi</span>
            <span className="text-[10px] text-gray-400">हिंदी ▾</span>
          </div>
          <ArrowLeftRight className="w-4 h-4 text-[#0C5A3E]" />
          <div className="text-right">
            <span className="font-bold text-[#0C5A3E] dark:text-[#34D399] block">Mundari</span>
            <span className="text-[10px] text-gray-400">मुंडारी ▾</span>
          </div>
        </div>

        {/* Concentric Voice Waves & Green Mic */}
        <div className="py-8 flex flex-col items-center justify-center my-auto">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#E5F2EB] dark:bg-[#142C21] opacity-70 animate-pulse"></div>
            <div className="absolute inset-6 rounded-full bg-[#C7E9D7] dark:bg-[#1A382B] opacity-80"></div>
            <button
              onClick={() => {
                showToast("आवाज रिकॉर्ड हो रही है...");
                playSpeech("नमस्ते, आप कैसे हैं?");
              }}
              className="relative w-24 h-24 rounded-full bg-[#0C5A3E] text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition"
            >
              <Mic className="w-10 h-10" />
            </button>
          </div>

          <div className="text-center mt-4 space-y-1">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Tap and speak</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">(हिंदी में बोलें)</p>
            <p className="text-[11px] text-gray-500 pt-1">
              Translation will play automatically<br />in Mundari
            </p>
          </div>

          <button
            onClick={() => showToast("दिशा बदली गई: Mundari → Hindi")}
            className="mt-6 px-5 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#15231E] text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 shadow-xs hover:bg-gray-50"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#0C5A3E]" />
            <span>Switch Direction</span>
          </button>
        </div>

        <div></div>
      </div>
    </div>
  );

  // SCREEN 7: Choose Language
  const renderScreen7 = () => (
    <div className="flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <HeaderBar title="Choose Language" onBack={goBack} showMore={false} />

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        <div className="space-y-3 pt-2">
          {[
            { id: 'Hindi', label: 'Hindi (हिंदी)' },
            { id: 'Santali', label: 'Santali (संताली)' },
            { id: 'Mundari', label: 'Mundari (मुंडारी)' },
          ].map((lang) => {
            const isChecked = appLanguage === lang.id;
            return (
              <div
                key={lang.id}
                onClick={() => {
                  setAppLanguage(lang.id as any);
                  showToast(`भाषा चुनी: ${lang.label}`);
                }}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center gap-3.5 cursor-pointer shadow-xs hover:border-emerald-400 transition"
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isChecked ? 'border-[#0C5A3E]' : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {isChecked && <div className="w-2.5 h-2.5 rounded-full bg-[#0C5A3E]"></div>}
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{lang.label}</span>
              </div>
            );
          })}
        </div>

        <div className="pt-4">
          <button
            onClick={goBack}
            className="w-full py-3 rounded-xl bg-[#0C5A3E] text-white text-sm font-bold shadow-md hover:bg-[#094731] transition"
          >
            Continue
          </button>
        </div>

        <div className="p-3 rounded-xl bg-[#F0F7F4] dark:bg-[#152720] border border-emerald-100 dark:border-[#1E372C] flex items-start gap-2.5 text-xs text-gray-600 dark:text-gray-300">
          <Info className="w-4 h-4 text-[#0C5A3E] dark:text-[#34D399] shrink-0 mt-0.5" />
          <span>You can change language anytime in Settings</span>
        </div>
      </div>
    </div>
  );

  // SCREEN 8: Translation Result
  const renderScreen8 = () => (
    <div className="flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <HeaderBar title="Translate" onBack={goBack} />

      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
        <div className="p-3 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center justify-between text-xs shadow-xs">
          <div className="text-left">
            <span className="font-bold text-gray-800 dark:text-gray-200 block">Hindi</span>
            <span className="text-[10px] text-gray-400">हिंदी ▾</span>
          </div>
          <ArrowLeftRight className="w-4 h-4 text-[#0C5A3E]" />
          <div className="text-right">
            <span className="font-bold text-[#0C5A3E] dark:text-[#34D399] block">Santali</span>
            <span className="text-[10px] text-gray-400">संताली ▾</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex flex-col justify-between shadow-xs">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-relaxed">
            आज हम संख्या सीखेंगे।
          </p>
          <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-800 mt-3">
            <span></span>
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-gray-400" />
              <span>16/500</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigateTo(5)}
          className="w-full py-3 rounded-xl bg-[#0C5A3E] text-white text-sm font-bold shadow hover:bg-[#094731]"
        >
          Translate
        </button>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] space-y-1.5 shadow-xs">
          <span className="text-xs font-bold text-[#0C5A3E] dark:text-[#34D399] block">Santali (संताली)</span>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-wide font-['Noto_Sans_Ol_Chiki']">
            ᱛᱮᱦᱮᱧ ᱟᱵᱚ ᱮᱞ ᱵᱚᱱ ᱪᱮᱫᱚᱜᱼᱟ᱾
          </p>
          <p className="text-xs text-gray-500">Aaj am sankhya sikhenge.</p>

          <div className="pt-3 mt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-around text-gray-600 dark:text-gray-300 text-xs">
            <button onClick={() => playSpeech("Aaj am sankhya sikhenge.")} className="flex items-center gap-1 hover:text-[#0C5A3E]">
              <Volume2 className="w-4 h-4" /> Listen
            </button>
            <button onClick={() => { navigator.clipboard?.writeText("ᱛᱮᱦᱮᱧ ᱟᱵᱚ ᱮᱞ ᱵᱚᱱ ᱪᱮᱫᱚᱜᱼᱟ᱾"); showToast("कॉपी हो गया!"); }} className="flex items-center gap-1 hover:text-[#0C5A3E]">
              <Copy className="w-4 h-4" /> Copy
            </button>
            <button onClick={() => showToast("साझा किया गया!")} className="flex items-center gap-1 hover:text-[#0C5A3E]">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button onClick={() => showToast("तारांकित!")} className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // SCREEN 9: History
  const renderScreen9 = () => {
    const historyList = [
      { hi: "आज हम संख्या सीखेंगे।", sat: "ᱛᱮᱦᱮᱧ ᱟᱵᱚ ᱮᱞ ᱵᱚᱱ ᱪᱮᱫᱚᱜᱼᱟ᱾", time: "Today, 10:30 AM", lang: "Hindi → Santali" },
      { hi: "मेरा नाम लखन है।", sat: "ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ ᱞᱚᱠᱷᱚᱱ ᱠᱟᱱᱟ᱾", time: "Today, 09:15 AM", lang: "Hindi → Santali" },
      { hi: "यह एक किताब है।", sat: "ᱱᱚᱣᱟ ᱫᱚ ᱢᱤᱫᱴᱟᱝ ᱯᱩᱛᱷᱤ ᱠᱟᱱᱟ᱾", time: "Yesterday, 4:20 PM", lang: "Hindi → Santali" },
      { hi: "हम स्कूल जा रहे हैं।", sat: "ᱟᱞᱮ ᱤᱛᱩᱱ ᱟᱥᱲᱟ ᱞᱮ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ᱾", time: "Yesterday, 4:10 PM", lang: "Hindi → Santali" },
    ].filter(item => historyFilter === 'All' || item.lang === historyFilter);

    return (
      <div className="flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
        <HeaderBar title="Translation History" onBack={goBack} />

        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          <div className="flex gap-2 text-xs font-semibold">
            {(['All', 'Hindi → Santali', 'Hindi → Mundari'] as const).map(f => (
              <button
                key={f}
                onClick={() => setHistoryFilter(f)}
                className={`px-3 py-1.5 rounded-full transition ${
                  historyFilter === f
                    ? 'bg-[#0C5A3E] text-white'
                    : 'bg-white dark:bg-[#15231E] border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-2.5 pt-1">
            {historyList.map((item, idx) => (
              <div
                key={idx}
                onClick={() => navigateTo(8)}
                className="p-3 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs space-y-1 cursor-pointer hover:border-emerald-300 transition"
              >
                <div className="flex justify-between items-start">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.hi}</p>
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                </div>
                <p className="text-sm font-bold text-[#0C5A3E] dark:text-[#34D399]">→ {item.sat}</p>
                <p className="text-[10px] text-gray-400 pt-0.5">{item.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // SCREEN 10: Dictionary
  const renderScreen10 = () => {
    const dictItems = [
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
    ].filter(w => !dictSearch || w.hindi.includes(dictSearch) || w.english.toLowerCase().includes(dictSearch.toLowerCase()));

    return (
      <div className="flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
        <HeaderBar title="Dictionary" onBack={goBack} />

        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={dictSearch}
              onChange={(e) => setDictSearch(e.target.value)}
              placeholder="Search word (Hindi / Santali / Mundari)"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] text-xs outline-none placeholder:text-gray-400 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex gap-2 text-xs font-semibold">
            {(['All', 'Hindi', 'Santali', 'Mundari'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setDictFilter(tab)}
                className={`px-3 py-1 rounded-full transition ${
                  dictFilter === tab
                    ? 'bg-[#0C5A3E] text-white'
                    : 'bg-white dark:bg-[#15231E] border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-2.5 pt-1">
            {dictItems.map((w, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs space-y-1.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-gray-100">{w.hindi}</h4>
                    <p className="text-[10px] text-gray-400">(Hindi)</p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <button onClick={() => playSpeech(w.hindi)} className="hover:text-[#0C5A3E] p-1">
                      <Volume2 className="w-4 h-4 text-[#0C5A3E] dark:text-[#34D399]" />
                    </button>
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </div>
                </div>

                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                  <p><span className="font-semibold text-gray-400">Santali:</span> <span className="font-bold text-gray-900 dark:text-gray-100 font-['Noto_Sans_Ol_Chiki']">{w.santali}</span></p>
                  <p><span className="font-semibold text-gray-400">Mundari:</span> <span className="font-bold text-gray-900 dark:text-gray-100 font-['Noto_Sans_Ol_Chiki']">{w.mundari}</span></p>
                  <p className="text-[10px] text-gray-400">({w.english})</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // SCREEN 11: Learning Mode
  const renderScreen11 = () => (
    <div className="flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <HeaderBar title="Learning Mode" onBack={goBack} />

      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
        <div className="flex gap-2 text-xs font-bold">
          {(['Class 1', 'Class 2', 'Class 3'] as const).map((cls) => (
            <button
              key={cls}
              onClick={() => setLearningClass(cls)}
              className={`px-3.5 py-1.5 rounded-full transition ${
                learningClass === cls
                  ? 'bg-[#0C5A3E] text-white'
                  : 'bg-white dark:bg-[#15231E] border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>

        <div className="space-y-2.5 pt-1">
          {[
            { title: "Common Words", sub: "Everyday vocabulary", color: "bg-[#2563EB]", icon: "💬" },
            { title: "Common Sentences", sub: "Useful in classroom", color: "bg-[#059669]", icon: "🗣️" },
            { title: "Numbers", sub: "1, 2, 3...", color: "bg-[#D97706]", icon: "123" },
            { title: "Alphabets", sub: "अ, आ, इ ...", color: "bg-[#DC2626]", icon: "A" },
            { title: "Classroom Phrases", sub: "For teachers", color: "bg-[#2563EB]", icon: "👩‍🏫" },
          ].map((it, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (it.title === "Numbers" || it.title === "Alphabets") navigateTo(12);
                else navigateTo(10);
              }}
              className="p-3 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-300 transition"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${it.color} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                  {it.icon}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-tight">{it.title}</h4>
                  <p className="text-[10px] text-gray-500">{it.sub}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // SCREEN 12: Flashcards
  const renderScreen12 = () => {
    const card = FLASHCARD_ITEMS[flashcardIdx];
    return (
      <div className="flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
        <HeaderBar title="Flashcards" onBack={goBack} />

        <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
          <div className="my-auto p-5 rounded-3xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-md flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-36 h-36 flex items-center justify-center">
              <img
                src={card.image}
                alt={card.hindi}
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>

            <div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">{card.hindi}</h3>
              <p className="text-xs text-gray-500 font-medium">({card.translit})</p>
            </div>

            <div className="pt-3 text-xs space-y-1 border-t border-gray-100 dark:border-gray-800 w-full">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold text-gray-400">Santali: </span>
                <span className="font-bold text-[#0C5A3E] dark:text-[#34D399] font-['Noto_Sans_Ol_Chiki']">{card.santali}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold text-gray-400">Mundari: </span>
                <span className="font-bold text-[#0C5A3E] dark:text-[#34D399] font-['Noto_Sans_Ol_Chiki']">{card.mundari}</span>
              </p>
              <p className="text-[11px] text-gray-400 font-medium">({card.english})</p>
            </div>
          </div>

          {/* Navigation Controls: <  1/10  > */}
          <div className="flex items-center justify-center gap-5 pb-2">
            <button
              onClick={() => setFlashcardIdx(prev => (prev > 0 ? prev - 1 : FLASHCARD_ITEMS.length - 1))}
              className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#15231E] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 shadow-xs"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{flashcardIdx + 1} / 10</span>
            <button
              onClick={() => setFlashcardIdx(prev => (prev < FLASHCARD_ITEMS.length - 1 ? prev + 1 : 0))}
              className="w-9 h-9 rounded-full bg-[#0C5A3E] text-white flex items-center justify-center shadow-md hover:bg-[#094731]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // SCREEN 13: Quiz Mode
  const renderScreen13 = () => (
    <div className="flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <HeaderBar title="Quiz" onBack={goBack} />

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="w-1/5 h-full bg-[#0C5A3E] dark:bg-[#34D399]"></div>
          </div>
          <span className="text-xs font-bold text-gray-500">1/5</span>
        </div>

        <div className="pt-3 text-center">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-snug">
            “किताब” का संताली में क्या है?
          </h3>
        </div>

        <div className="space-y-2.5 pt-1">
          {["ᱚᱲᱟᱜ", "ᱯᱩᱛᱷᱤ", "ᱫᱟᱜ", "ᱫᱟᱠᱟ"].map((opt, idx) => {
            const isChosen = quizSelected === idx;
            return (
              <div
                key={idx}
                onClick={() => setQuizSelected(idx)}
                className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer text-sm font-semibold transition ${
                  isChosen
                    ? 'bg-[#EFF8F3] dark:bg-[#163326] border-[#0C5A3E] text-[#0C5A3E] dark:text-[#34D399] shadow-xs'
                    : 'bg-white dark:bg-[#15231E] border-[#ECE7DA] dark:border-[#20372E] text-gray-800 dark:text-gray-200'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  isChosen ? 'border-[#0C5A3E]' : 'border-gray-400'
                }`}>
                  {isChosen && <div className="w-2 h-2 rounded-full bg-[#0C5A3E]"></div>}
                </div>
                <span className="font-['Noto_Sans_Ol_Chiki'] text-base">{opt}</span>
              </div>
            );
          })}
        </div>

        <div className="pt-4">
          <button
            onClick={() => showToast("क्विज उत्तर दर्ज हुआ!")}
            className="w-full py-3 rounded-xl bg-[#0C5A3E] text-white text-sm font-bold shadow hover:bg-[#094731]"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );

  // SCREEN 14: Worksheet Generation
  const renderScreen14 = () => (
    <div className="flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <HeaderBar title="Generate Worksheet" onBack={goBack} />

      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
        <div className="space-y-2.5 text-left pt-1">
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">Class</label>
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] text-xs font-bold flex justify-between items-center text-gray-800 dark:text-gray-100">
              <span>{wsClass}</span>
              <span className="text-gray-400">▾</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">Topic</label>
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] text-xs font-bold flex justify-between items-center text-gray-800 dark:text-gray-100">
              <span>{wsTopic}</span>
              <span className="text-gray-400">▾</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">Language</label>
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] text-xs font-bold flex justify-between items-center text-gray-800 dark:text-gray-100">
              <span>{wsLanguage}</span>
              <span className="text-gray-400">▾</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">Worksheet Type</label>
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] text-xs font-bold flex justify-between items-center text-gray-800 dark:text-gray-100">
              <span>{wsType}</span>
              <span className="text-gray-400">▾</span>
            </div>
          </div>
        </div>

        <div className="pt-3">
          <button
            onClick={() => navigateTo(15)}
            className="w-full py-3 rounded-xl bg-[#0C5A3E] text-white text-sm font-bold shadow hover:bg-[#094731]"
          >
            Generate
          </button>
        </div>

        <p className="text-[11px] text-gray-500 text-center leading-relaxed pt-1">
          ℹ Worksheet will be saved offline.<br />You can print or share it.
        </p>
      </div>
    </div>
  );

  // SCREEN 15: Worksheet Preview
  const renderScreen15 = () => (
    <div className="flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <HeaderBar title="Worksheet" onBack={goBack} />

      <div className="p-4 space-y-3.5 flex-1 overflow-y-auto">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-sm space-y-3">
          <div className="text-center">
            <h4 className="text-sm font-black text-gray-900 dark:text-gray-100">संख्या पहचानें</h4>
            <p className="text-[11px] text-gray-500 font-medium">(Identify the numbers)</p>
          </div>

          <table className="w-full text-xs text-left border-collapse">
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {WORKSHEET_DATA.map((row) => (
                <tr key={row.num} className="py-1.5">
                  <td className="py-1.5 font-bold text-gray-500">{row.num}</td>
                  <td className="py-1.5 font-bold text-gray-900 dark:text-gray-100">{row.hindi}</td>
                  <td className="py-1.5 font-bold text-[#0C5A3E] dark:text-[#34D399] font-['Noto_Sans_Ol_Chiki']">{row.santali}</td>
                  <td className="py-1.5 text-right text-sm">{row.icons}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={() => window.print()}
            className="flex-1 py-2.5 rounded-xl bg-white dark:bg-[#15231E] border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center justify-center gap-2 shadow-xs hover:bg-gray-50"
          >
            <Printer className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span>Print</span>
          </button>
          <button
            onClick={() => showToast("PDF साझा किया गया!")}
            className="flex-1 py-2.5 rounded-xl bg-[#0C5A3E] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs hover:bg-[#094731]"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );

  // SCREEN 16: Settings
  const renderScreen16 = () => (
    <div className="flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <HeaderBar title="Settings" onBack={goBack} showMore={false} />

      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
        <div className="rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] divide-y divide-gray-100 dark:divide-gray-800 shadow-xs overflow-hidden">
          <div onClick={() => navigateTo(7)} className="p-3.5 flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-[#182922]">
            <div className="flex items-center gap-3">
              <ArrowLeftRight className="w-4 h-4 text-[#0C5A3E] dark:text-[#34D399]" />
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Language</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span>{appLanguage}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div onClick={() => navigateTo(18)} className="p-3.5 flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-[#182922]">
            <div className="flex items-center gap-3">
              <Type className="w-4 h-4 text-[#0C5A3E] dark:text-[#34D399]" />
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Text Size</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span>{textSize}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div onClick={() => navigateTo(17)} className="p-3.5 flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-[#182922]">
            <div className="flex items-center gap-3">
              <Moon className="w-4 h-4 text-[#0C5A3E] dark:text-[#34D399]" />
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Dark Mode</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span>{isDarkMode ? 'On' : 'Off'}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div onClick={() => navigateTo(19)} className="p-3.5 flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-[#182922]">
            <div className="flex items-center gap-3">
              <Download className="w-4 h-4 text-[#0C5A3E] dark:text-[#34D399]" />
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Offline Content</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <span>Downloaded ✓</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div onClick={() => navigateTo(20)} className="p-3.5 flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-[#182922]">
            <div className="flex items-center gap-3">
              <Info className="w-4 h-4 text-[#0C5A3E] dark:text-[#34D399]" />
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">App Information</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>

          <div onClick={() => showToast("शिक्षक हेल्पलाइन: 1800-SAMVAAD")} className="p-3.5 flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-[#182922]">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-4 h-4 text-[#0C5A3E] dark:text-[#34D399]" />
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Help & Support</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );

  // SCREEN 17: Dark Mode
  const renderScreen17 = () => (
    <div className="flex-1 flex flex-col bg-[#121614] text-gray-100">
      <HeaderBar title="Dark Mode" onBack={goBack} showMore={false} />

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        <div className="p-4 rounded-2xl bg-[#1A221E] border border-[#25332C] flex items-center justify-between">
          <span className="text-sm font-bold text-gray-100">Enable Dark Mode</span>
          <button
            onClick={() => {
              setIsDarkMode(!isDarkMode);
              showToast(isDarkMode ? "Light Mode Enabled" : "Dark Mode Enabled");
            }}
            className={`w-12 h-6 rounded-full p-0.5 transition-colors flex items-center ${
              isDarkMode ? 'bg-[#22C55E] justify-end' : 'bg-gray-600 justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-md"></div>
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-[#1A221E] border border-[#25332C] space-y-3">
          <div className="flex items-center gap-2">
            <SamvaadLeavesLogo className="w-6 h-6" />
            <div>
              <h4 className="text-xs font-bold text-gray-100 leading-none">Samvaad</h4>
              <p className="text-[9px] text-gray-400">भाषा से सीखें, साथ मिलकर बढ़ें</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {['Translate', 'Dictionary', 'Learn', 'Flashcards', 'Quiz', 'Worksheets'].map((name, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-[#121614] border border-[#23312A] text-center">
                <span className="text-[10px] font-bold text-gray-300">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // SCREEN 18: Text Size Setting
  const renderScreen18 = () => (
    <div className="flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <HeaderBar title="Text Size" onBack={goBack} showMore={false} />

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        <div className="space-y-2.5 pt-1">
          {[
            { id: 'Small', label: 'Small', sizeClass: 'text-xs' },
            { id: 'Medium', label: 'Medium', sizeClass: 'text-sm font-bold' },
            { id: 'Large', label: 'Large', sizeClass: 'text-base font-bold' },
            { id: 'Extra Large', label: 'Extra Large', sizeClass: 'text-lg font-black' },
          ].map((item) => {
            const isChosen = textSize === item.id;
            return (
              <div
                key={item.id}
                onClick={() => {
                  setTextSize(item.id as any);
                  showToast(`Text Size: ${item.id}`);
                }}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center justify-between cursor-pointer hover:border-emerald-300 transition shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isChosen ? 'border-[#0C5A3E]' : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {isChosen && <div className="w-2 h-2 rounded-full bg-[#0C5A3E]"></div>}
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.label}</span>
                </div>
                <span className={`font-serif text-gray-700 dark:text-gray-300 ${item.sizeClass}`}>A</span>
              </div>
            );
          })}
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] space-y-1 shadow-xs">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">यह एक उदाहरण पाठ है।</p>
          <p className="text-xs text-gray-500">(This is a sample text.)</p>
        </div>
      </div>
    </div>
  );

  // SCREEN 19: Offline Content
  const renderScreen19 = () => (
    <div className="flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <HeaderBar title="Offline Content" onBack={goBack} showMore={false} />

      <div className="p-4 space-y-3.5 flex-1 overflow-y-auto">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-[#E5F2EB] dark:bg-[#183427] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">Language Packs</h4>
            <p className="text-[10px] text-gray-500">Downloaded for offline use</p>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          <div className="p-3 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center font-bold text-xs">
                अ
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Hindi</span>
            </div>
            <span className="text-xs font-bold text-[#0C5A3E] dark:text-[#34D399] flex items-center gap-1">
              ✓ Installed
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center font-bold text-xs font-['Noto_Sans_Ol_Chiki']">
                ᱚ
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Santali</span>
            </div>
            <span className="text-xs font-bold text-[#0C5A3E] dark:text-[#34D399] flex items-center gap-1">
              ✓ Installed
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center font-bold text-xs font-['Noto_Sans_Ol_Chiki']">
                ᱢ
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Mundari</span>
            </div>

            {offlinePacks.Mundari ? (
              <span className="text-xs font-bold text-[#0C5A3E] dark:text-[#34D399] flex items-center gap-1">
                ✓ Installed
              </span>
            ) : (
              <button
                onClick={() => {
                  setOfflinePacks(prev => ({ ...prev, Mundari: true }));
                  showToast("Mundari पैकेज डाउनलोड हुआ!");
                }}
                className="px-3 py-1.5 rounded-lg bg-[#0C5A3E] text-white text-xs font-bold flex items-center gap-1 shadow-xs hover:bg-[#094731]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download (120 MB)</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-[10px] text-gray-500 text-center pt-2 leading-relaxed">
          ℹ Once downloaded, the app works<br />completely offline.
        </p>
      </div>
    </div>
  );

  // SCREEN 20: About / Closing
  const renderScreen20 = () => (
    <div className="flex-1 flex flex-col justify-between items-center text-center p-6 bg-[#FAF7EE] dark:bg-[#0E1513] select-none">
      <HeaderBar title="About Samvaad" onBack={goBack} showMore={false} />

      <div className="pt-4 space-y-1">
        <div className="w-12 h-12 mx-auto flex items-center justify-center">
          <SamvaadLeavesLogo className="w-11 h-9" />
        </div>
        <h2 className="text-3xl font-black text-[#0C5A3E] dark:text-[#34D399] tracking-tight">Samvaad</h2>
        <p className="text-xs font-bold text-[#0C5A3E] dark:text-[#34D399]">भाषा से सीखें, साथ मिलकर बढ़ें</p>
      </div>

      <div className="my-auto space-y-3 w-full max-w-sm">
        <div className="flex flex-col items-center">
          <StateEmblemArtwork className="w-9 h-11 mb-1" />
          <p className="text-[10px] font-semibold text-[#1C362B] dark:text-[#34D399] uppercase">Government of Jharkhand</p>
          <p className="text-xs font-bold text-[#1C362B] dark:text-gray-100">झारखंड सरकार</p>
        </div>

        <div className="px-1">
          <img
            src="/assets/splash_teacher_children.jpg"
            alt="Storybook Rural Landscape"
            className="w-full h-48 object-cover rounded-2xl border border-[#E7DFCE] shadow-xs"
          />
        </div>
      </div>

      <div className="w-full pb-4">
        <p className="text-sm font-bold text-[#0C5A3E] dark:text-[#34D399] tracking-wide">
          सबकी भाषा, बेहतर शिक्षा
        </p>
        <p className="text-[10px] text-[#3E5C4E] dark:text-gray-400 mt-0.5">Stronger Roots • Brighter Futures</p>
        <div className="w-24 h-1 bg-[#2D4539]/20 rounded-full mx-auto mt-3"></div>
      </div>
    </div>
  );

  // Screen Dispatcher
  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 1: return renderScreen1();
      case 2: return renderScreen2();
      case 3: return renderScreen3();
      case 4: return renderScreen4();
      case 5: return renderScreen5();
      case 6: return renderScreen6();
      case 7: return renderScreen7();
      case 8: return renderScreen8();
      case 9: return renderScreen9();
      case 10: return renderScreen10();
      case 11: return renderScreen11();
      case 12: return renderScreen12();
      case 13: return renderScreen13();
      case 14: return renderScreen14();
      case 15: return renderScreen15();
      case 16: return renderScreen16();
      case 17: return renderScreen17();
      case 18: return renderScreen18();
      case 19: return renderScreen19();
      case 20: return renderScreen20();
      default: return renderScreen4();
    }
  };

  return (
    <div className={`w-full min-h-screen ${isDarkMode ? 'bg-[#0E1513] text-gray-100' : 'bg-[#FAF7EE] text-gray-900'} flex flex-col font-sans select-none antialiased overflow-x-hidden`}>
      {/* Mobile Application Viewport Container */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col relative min-h-screen shadow-none sm:shadow-md bg-inherit">
        {/* Main Content Viewport */}
        <main className="flex-1 flex flex-col relative overflow-y-auto">
          {renderActiveScreen()}
        </main>

        {/* Persistent Bottom Tab Navigation (Only visible on main application screens >= 4) */}
        {currentScreen >= 4 && currentScreen !== 20 && (
          <BottomTabBar />
        )}

        {/* In-App Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#0C5A3E] text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}