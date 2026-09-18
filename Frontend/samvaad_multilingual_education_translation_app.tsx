import React, { useState } from 'react';
import {
  Home, History, Settings, Volume2, Copy, Share2, Star, Mic,
  ArrowLeftRight, Check, Download,
  BookOpen, Layers, FileText, Search, Moon,
  Type, Info, HelpCircle, ChevronRight, CheckCircle2,
  Printer, GraduationCap, ChevronLeft, LayoutGrid, Smartphone, MoreVertical
} from 'lucide-react';

// ==========================================
// Types
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

export const SCREENS_CATALOG: { num: ScreenId; name: string }[] = [
  { num: 1, name: "Splash Screen" },
  { num: 2, name: "Onboarding 1" },
  { num: 3, name: "Onboarding 2" },
  { num: 4, name: "Home Screen" },
  { num: 5, name: "Translate (Text)" },
  { num: 6, name: "Voice Conversation" },
  { num: 7, name: "Choose Language" },
  { num: 8, name: "Translation Result" },
  { num: 9, name: "History" },
  { num: 10, name: "Dictionary" },
  { num: 11, name: "Learning Mode" },
  { num: 12, name: "Flashcards" },
  { num: 13, name: "Quiz Mode" },
  { num: 14, name: "Worksheet Generation" },
  { num: 15, name: "Worksheet Preview" },
  { num: 16, name: "Settings" },
  { num: 17, name: "Dark Mode" },
  { num: 18, name: "Text Size Setting" },
  { num: 19, name: "Offline Content" },
  { num: 20, name: "About / Closing" },
];

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
// Authentic High-Fidelity Components
// ==========================================

// 1. National Emblem of India (Ashoka Lion Capital)
function StateEmblemArtwork({ className = "w-8 h-10" }: { className?: string }) {
  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <img
        src="/assets/state_emblem.jpg"
        alt="Emblem of India"
        className="w-full h-full object-contain mix-blend-multiply filter contrast-125"
        onError={(e) => {
          // Fallback if image path differs
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    </div>
  );
}

// 2. Exact Three-Leaves Brand Mark (Matching Screen 1 & Screen 20)
function SamvaadLeavesLogo({ className = "w-10 h-10" }: { className?: string }) {
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
// Main Connected Mobile App
// ==========================================
export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>(1);
  const [activeTab, setActiveTab] = useState<BottomTab>('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [textSize, setTextSize] = useState<'Small' | 'Medium' | 'Large' | 'Extra Large'>('Medium');
  const [appLanguage, setAppLanguage] = useState<'Hindi' | 'Santali' | 'Mundari'>('Hindi');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'phone' | 'poster'>('phone');

  // Interactive State
  const [inputText, setInputText] = useState('आज हम संख्या सीखेंगे।');
  const [quizSelected, setQuizSelected] = useState<number>(1); // Screen 13: option 2 ("ᱯᱩᱛᱷᱤ") checked in reference!
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [learningClass, setLearningClass] = useState<'Class 1' | 'Class 2' | 'Class 3'>('Class 1');
  const [historyFilter, setHistoryFilter] = useState<'All' | 'Hindi → Santali' | 'Hindi → Mundari'>('All');
  const [dictFilter, setDictFilter] = useState<'All' | 'Hindi' | 'Santali' | 'Mundari'>('All');
  const [dictSearch, setDictSearch] = useState('');

  // Worksheet State
  const [wsClass, setWsClass] = useState('Class 1');
  const [wsTopic, setWsTopic] = useState('Numbers (1–10)');
  const [wsLanguage, setWsLanguage] = useState('Hindi + Santali');
  const [wsType, setWsType] = useState('Practice Sheet');

  // Offline Packs State
  const [offlinePacks, setOfflinePacks] = useState({
    Hindi: true,
    Santali: true,
    Mundari: false
  });

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

  // Shared Screen Header (Matching Clean Minimal Design from Reference Poster)
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
      <div className={`px-4 py-3 flex items-center justify-between border-b select-none shrink-0 ${
        isDarkMode ? 'bg-[#0F1613] border-[#1D2B25] text-gray-100' : 'bg-[#FAF7EE] border-[#EDE7D9] text-gray-900'
      }`}>
        <button
          onClick={onBack || (() => navigateTo(4, 'home'))}
          className="p-1 -ml-1 text-gray-700 dark:text-gray-300 hover:text-[#0C5A3E] transition"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight text-center truncate">
          {title}
        </h2>
        <div className="w-6 flex justify-end">
          {showMore ? (
            <button onClick={() => showToast("विकल्प मेनू")} className="p-1 text-gray-600 dark:text-gray-400">
              <MoreVertical className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-4"></div>
          )}
        </div>
      </div>
    );
  };

  // Shared Bottom Navigation Bar (4 clean tabs: Home, Translate, History, Settings)
  const BottomTabBar = () => {
    const tabs: { id: BottomTab; label: string; icon: any; screen: ScreenId }[] = [
      { id: 'home', label: 'Home', icon: Home, screen: 4 },
      { id: 'translate', label: 'Translate', icon: ArrowLeftRight, screen: 5 },
      { id: 'history', label: 'History', icon: History, screen: 9 },
      { id: 'settings', label: 'Settings', icon: Settings, screen: 16 },
    ];

    return (
      <div className={`w-full py-2 px-3 flex items-center justify-around border-t select-none shrink-0 z-20 ${
        isDarkMode ? 'bg-[#121B17] border-[#1D2A24] text-gray-400' : 'bg-white border-[#EAE4D6] text-gray-400'
      }`}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                navigateTo(t.screen, t.id);
              }}
              className={`flex flex-col items-center py-0.5 px-3 transition-colors ${
                isActive
                  ? isDarkMode
                    ? 'text-[#34D399] font-bold'
                    : 'text-[#0C5A3E] font-bold'
                  : 'hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] tracking-tight mt-0.5">{t.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  // ==========================================
  // 20 Exact Screen Renderers (Pixel-Matched to Poster)
  // ==========================================

  // SCREEN 1: Splash Screen (Pixel-Matched to Original Reference Proportions & Density)
  const renderScreen1 = () => (
    <div
      onClick={() => navigateTo(2)}
      className="flex-1 flex flex-col items-center justify-between text-center px-4 pt-4 pb-2.5 bg-[#FAF7EE] dark:bg-[#0E1513] cursor-pointer select-none"
    >
      {/* Top: Official Emblem of India + Government of Jharkhand (Title Case as in Reference) */}
      <div className="w-full flex flex-col items-center pt-0.5">
        <StateEmblemArtwork className="w-9 h-11 mb-1" />
        <p className="text-[11.5px] font-medium text-[#1A2621] dark:text-gray-200 tracking-normal leading-tight">
          Government of Jharkhand
        </p>
        <p className="text-[14px] font-bold text-[#1A2621] dark:text-gray-100 leading-tight mt-0.5">
          झारखंड सरकार
        </p>
      </div>

      {/* Middle: Brand Logo, Title, Tagline, Subtitle (Tightly Grouped to Match Reference) */}
      <div className="w-full flex flex-col items-center mt-2">
        <SamvaadLeavesLogo className="w-13 h-10" />
        <h1 className="text-[34px] font-black text-[#0F513A] dark:text-[#34D399] tracking-tight leading-none mt-1">
          Samvaad
        </h1>
        <p className="text-[13.5px] font-bold text-[#0F513A] dark:text-[#34D399] mt-1.5">
          भाषा से सीखें, साथ मिलकर बढ़ें
        </p>
        <p className="text-[10px] text-[#2C3E35] dark:text-gray-300 font-medium max-w-[240px] mx-auto mt-1.5 leading-snug">
          An initiative for Mother Tongue-Based<br />Multilingual Education (MTB-MLE)
        </p>
      </div>

      {/* Large Teacher-and-Children Illustration (Matching Original Reference Size & Proportions) */}
      <div className="w-full px-1 mt-2.5 mb-1">
        <div className="w-full h-[275px] rounded-2xl overflow-hidden shadow-xs border border-[#E7DFCE]/90">
          <img
            src="/assets/splash_teacher_children.jpg"
            alt="Female teacher teaching children in rural Jharkhand"
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>

      {/* Bottom Motto Text: Clean, official typography with comfortable spacing near bottom */}
      <div className="w-full pb-0.5 pt-0.5">
        <p className="text-[15.5px] font-bold text-[#0F513A] dark:text-[#34D399] tracking-wide">
          सबकी भाषा, बेहतर शिक्षा
        </p>
        {/* Subtle Home Indicator Line */}
        <div className="w-24 h-1 bg-[#2D4539]/20 rounded-full mx-auto mt-2"></div>
      </div>
    </div>
  );

  // SCREEN 2: Onboarding 1
  const renderScreen2 = () => (
    <div className="flex-1 flex flex-col justify-between p-4 bg-[#FAF7EE] dark:bg-[#0E1513]">
      <div className="flex justify-end pt-1">
        <button onClick={() => navigateTo(4, 'home')} className="text-xs text-gray-500 font-medium hover:text-[#0C5A3E]">
          Skip
        </button>
      </div>

      <div className="my-auto text-center space-y-2">
        <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 leading-tight">
          Har Baccha Samjhe
        </h2>
        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
          Bridging languages<br />Building brighter futures
        </p>

        {/* Storybook Teacher in Yellow Sari with Village Children */}
        <div className="py-2 px-1">
          <img
            src="/assets/teacher_village.jpg"
            alt="Teacher with village children"
            className="w-full h-48 object-cover rounded-2xl border border-[#E7DFCE] shadow-xs"
          />
        </div>

        {/* 3 Pagination Dots: ● ○ ○ */}
        <div className="flex justify-center items-center gap-1.5 pt-2">
          <span className="w-2 h-2 rounded-full bg-[#0C5A3E] dark:bg-[#34D399]"></span>
          <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700"></span>
          <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700"></span>
        </div>
      </div>

      <div className="pb-2">
        <button
          onClick={() => navigateTo(3)}
          className="w-full py-3 rounded-xl bg-[#0C5A3E] text-white text-xs font-bold shadow hover:bg-[#094731] active:scale-98 transition"
        >
          Next
        </button>
      </div>
    </div>
  );

  // SCREEN 3: Onboarding 2
  const renderScreen3 = () => (
    <div className="flex-1 flex flex-col justify-between p-4 bg-[#FAF7EE] dark:bg-[#0E1513]">
      <div className="flex justify-end pt-1">
        <button onClick={() => navigateTo(4, 'home')} className="text-xs text-gray-500 font-medium hover:text-[#0C5A3E]">
          Skip
        </button>
      </div>

      <div className="my-auto text-center space-y-3">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 leading-tight">
            Learn<br />Translate<br />Teach Together
          </h2>
          <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium mt-1.5">
            Supporting teachers in<br />tribal areas with AI
          </p>
        </div>

        {/* 2x2 Feature Cards Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2 max-w-[240px] mx-auto">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-2xs flex flex-col items-center">
            <ArrowLeftRight className="w-6 h-6 text-[#0C5A3E] dark:text-[#34D399] mb-1.5 stroke-[1.8]" />
            <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">Translate</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-2xs flex flex-col items-center">
            <BookOpen className="w-6 h-6 text-[#0C5A3E] dark:text-[#34D399] mb-1.5 stroke-[1.8]" />
            <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">Dictionary</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-2xs flex flex-col items-center">
            <FileText className="w-6 h-6 text-[#0C5A3E] dark:text-[#34D399] mb-1.5 stroke-[1.8]" />
            <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">Worksheets</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-2xs flex flex-col items-center">
            <Layers className="w-6 h-6 text-[#0C5A3E] dark:text-[#34D399] mb-1.5 stroke-[1.8]" />
            <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">Flashcards</span>
          </div>
        </div>

        {/* 3 Pagination Dots: ○ ● ○ */}
        <div className="flex justify-center items-center gap-1.5 pt-2">
          <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700"></span>
          <span className="w-2 h-2 rounded-full bg-[#0C5A3E] dark:bg-[#34D399]"></span>
          <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700"></span>
        </div>
      </div>

      <div className="pb-2">
        <button
          onClick={() => navigateTo(4, 'home')}
          className="w-full py-3 rounded-xl bg-[#0C5A3E] text-white text-xs font-bold shadow hover:bg-[#094731] active:scale-98 transition"
        >
          Next
        </button>
      </div>
    </div>
  );

  // SCREEN 4: Home Screen
  const renderScreen4 = () => (
    <div className="flex-1 flex flex-col justify-between bg-[#FAF7EE] dark:bg-[#0E1513]">
      <div className="p-3.5 space-y-3 overflow-y-auto">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SamvaadLeavesLogo className="w-6 h-6" />
            <div>
              <h1 className="text-base font-black text-[#0C5A3E] dark:text-[#34D399] leading-tight">Samvaad</h1>
              <p className="text-[9px] text-[#0C5A3E] font-medium">भाषा से सीखें, साथ मिलकर बढ़ें</p>
            </div>
          </div>
          <button onClick={() => navigateTo(16)} className="p-1.5 text-gray-600 dark:text-gray-300">
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Teacher Hero Banner */}
        <div
          onClick={() => navigateTo(2)}
          className="p-3 rounded-2xl bg-[#FFF9E6] dark:bg-[#1E1B13] border border-[#F1E3B8] dark:border-[#382F1B] flex items-center justify-between overflow-hidden shadow-2xs cursor-pointer hover:border-amber-300 transition"
        >
          <div className="max-w-[140px] space-y-1">
            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-snug">
              Teaching is easier<br />when language<br />is no longer a barrier.
            </h3>
          </div>
          <div className="w-26 h-18 relative rounded-xl overflow-hidden border border-[#EBDDB5]">
            <img
              src="/assets/teacher_village.jpg"
              alt="Teacher Banner"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* 2x3 Grid of 6 Action Cards (Matching Reference) */}
        <div className="grid grid-cols-2 gap-2.5 pt-0.5">
          <div
            onClick={() => navigateTo(5, 'translate')}
            className="p-3 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-2xs flex flex-col items-center text-center cursor-pointer hover:border-emerald-400 active:scale-95 transition"
          >
            <div className="w-9 h-9 rounded-xl bg-[#E8F3EE] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-1.5">
              <ArrowLeftRight className="w-5 h-5 stroke-[2]" />
            </div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">Translate</h4>
          </div>

          <div
            onClick={() => navigateTo(10)}
            className="p-3 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-2xs flex flex-col items-center text-center cursor-pointer hover:border-emerald-400 active:scale-95 transition"
          >
            <div className="w-9 h-9 rounded-xl bg-[#E8F3EE] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-1.5">
              <BookOpen className="w-5 h-5 stroke-[2]" />
            </div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">Dictionary</h4>
          </div>

          <div
            onClick={() => navigateTo(11)}
            className="p-3 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-2xs flex flex-col items-center text-center cursor-pointer hover:border-emerald-400 active:scale-95 transition"
          >
            <div className="w-9 h-9 rounded-xl bg-[#E8F3EE] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-1.5">
              <GraduationCap className="w-5 h-5 stroke-[2]" />
            </div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">Learn</h4>
          </div>

          <div
            onClick={() => navigateTo(12)}
            className="p-3 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-2xs flex flex-col items-center text-center cursor-pointer hover:border-emerald-400 active:scale-95 transition"
          >
            <div className="w-9 h-9 rounded-xl bg-[#E8F3EE] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-1.5">
              <Layers className="w-5 h-5 stroke-[2]" />
            </div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">Flashcards</h4>
          </div>

          <div
            onClick={() => navigateTo(13)}
            className="p-3 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-2xs flex flex-col items-center text-center cursor-pointer hover:border-emerald-400 active:scale-95 transition"
          >
            <div className="w-9 h-9 rounded-xl bg-[#E8F3EE] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-1.5">
              <HelpCircle className="w-5 h-5 stroke-[2]" />
            </div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">Quiz</h4>
          </div>

          <div
            onClick={() => navigateTo(14)}
            className="p-3 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-2xs flex flex-col items-center text-center cursor-pointer hover:border-emerald-400 active:scale-95 transition"
          >
            <div className="w-9 h-9 rounded-xl bg-[#E8F3EE] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-1.5">
              <FileText className="w-5 h-5 stroke-[2]" />
            </div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">Worksheets</h4>
          </div>
        </div>
      </div>

      <BottomTabBar />
    </div>
  );

  // SCREEN 5: Translate (Text)
  const renderScreen5 = () => (
    <div className="flex-1 flex flex-col justify-between bg-[#FAF7EE] dark:bg-[#0E1513]">
      <HeaderBar title="Translate" />

      <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto">
        {/* Language Selector Row */}
        <div
          onClick={() => navigateTo(7)}
          className="p-2.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center justify-between text-xs cursor-pointer shadow-2xs"
        >
          <div className="text-left">
            <span className="font-bold text-gray-800 dark:text-gray-200 block">Hindi</span>
            <span className="text-[10px] text-gray-400">हिंदी ▾</span>
          </div>
          <ArrowLeftRight className="w-3.5 h-3.5 text-[#0C5A3E]" />
          <div className="text-right">
            <span className="font-bold text-[#0C5A3E] dark:text-[#34D399] block">Santali</span>
            <span className="text-[10px] text-gray-400">संताली ▾</span>
          </div>
        </div>

        {/* Source Text Input Card */}
        <div className="p-3 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] min-h-[105px] flex flex-col justify-between shadow-2xs">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type in Hindi..."
            className="w-full text-xs font-medium text-gray-800 dark:text-gray-100 bg-transparent resize-none outline-none placeholder:text-gray-400"
            rows={3}
          />
          <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
            <span></span>
            <div className="flex items-center gap-2">
              <button onClick={() => navigateTo(6)} className="hover:text-[#0C5A3E]">
                <Mic className="w-3.5 h-3.5 text-gray-400" />
              </button>
              <span>{inputText.length}/500</span>
            </div>
          </div>
        </div>

        {/* Big Green Translate Button */}
        <button
          onClick={() => navigateTo(8, 'translate')}
          className="w-full py-2.5 rounded-xl bg-[#0C5A3E] text-white text-xs font-bold shadow hover:bg-[#094731] transition active:scale-98"
        >
          Translate
        </button>

        {/* Translation Output Card (Santali) */}
        <div className="p-3 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 block">Translation (Santali)</span>
          <p className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-wide font-['Noto_Sans_Ol_Chiki']">
            ᱛᱮᱦᱮᱧ ᱟᱵᱚ ᱮᱞ ᱵᱚᱱ ᱪᱮᱫᱚᱜᱼᱟ᱾
          </p>
          <p className="text-[10px] text-gray-500">Aaj am sankhya sikhenge.</p>

          {/* Action Row: Listen, Copy, Share, Save */}
          <div className="pt-2 mt-1 border-t border-gray-100 dark:border-gray-800 flex items-center justify-around text-gray-600 dark:text-gray-300 text-[10px]">
            <button onClick={() => playSpeech("Aaj am sankhya sikhenge.")} className="flex items-center gap-1 hover:text-[#0C5A3E]">
              <Volume2 className="w-3.5 h-3.5" /> Listen
            </button>
            <button onClick={() => { navigator.clipboard?.writeText("ᱛᱮᱦᱮᱧ ᱟᱵᱚ ᱮᱞ ᱵᱚᱱ ᱪᱮᱫᱚᱜᱼᱟ᱾"); showToast("कॉपी हो गया!"); }} className="flex items-center gap-1 hover:text-[#0C5A3E]">
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
            <button onClick={() => showToast("साझा किया गया!")} className="flex items-center gap-1 hover:text-[#0C5A3E]">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            <button onClick={() => showToast("सहेजा गया ⭐")} className="flex items-center gap-1 text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400" /> Save
            </button>
          </div>
        </div>
      </div>

      <BottomTabBar />
    </div>
  );

  // SCREEN 6: Voice Conversation
  const renderScreen6 = () => (
    <div className="flex-1 flex flex-col justify-between bg-[#FAF7EE] dark:bg-[#0E1513]">
      <HeaderBar title="Voice Conversation" onBack={() => navigateTo(5)} />

      <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
        {/* Language Selector: Hindi ⇄ Mundari */}
        <div className="p-2.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center justify-between text-xs shadow-2xs">
          <div className="text-left">
            <span className="font-bold text-gray-800 dark:text-gray-200 block">Hindi</span>
            <span className="text-[10px] text-gray-400">हिंदी ▾</span>
          </div>
          <ArrowLeftRight className="w-3.5 h-3.5 text-[#0C5A3E]" />
          <div className="text-right">
            <span className="font-bold text-[#0C5A3E] dark:text-[#34D399] block">Mundari</span>
            <span className="text-[10px] text-gray-400">मुंडारी ▾</span>
          </div>
        </div>

        {/* Concentric Voice Waves & Green Mic */}
        <div className="py-4 flex flex-col items-center justify-center my-auto">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#E5F2EB] dark:bg-[#142C21] opacity-70 animate-pulse"></div>
            <div className="absolute inset-5 rounded-full bg-[#C7E9D7] dark:bg-[#1A382B] opacity-80"></div>
            <button
              onClick={() => {
                showToast("आवाज रिकॉर्ड हो रही है...");
                playSpeech("नमस्ते, आप कैसे हैं?");
              }}
              className="relative w-22 h-22 rounded-full bg-[#0C5A3E] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition"
            >
              <Mic className="w-9 h-9" />
            </button>
          </div>

          <div className="text-center mt-3 space-y-0.5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Tap and speak</h3>
            <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium">(हिंदी में बोलें)</p>
            <p className="text-[9.5px] text-gray-500 pt-1">
              Translation will play automatically<br />in Mundari
            </p>
          </div>

          <button
            onClick={() => showToast("दिशा बदली गई: Mundari → Hindi")}
            className="mt-4 px-4 py-1.5 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#15231E] text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 shadow-2xs hover:bg-gray-50"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#0C5A3E]" />
            <span>Switch Direction</span>
          </button>
        </div>

        <div></div>
      </div>

      <BottomTabBar />
    </div>
  );

  // SCREEN 7: Choose Language
  const renderScreen7 = () => (
    <div className="flex-1 flex flex-col justify-between bg-[#FAF7EE] dark:bg-[#0E1513]">
      <HeaderBar title="Choose Language" onBack={() => navigateTo(16)} showMore={false} />

      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
        <div className="space-y-2.5 pt-2">
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
                className="p-3 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center gap-3 cursor-pointer shadow-2xs hover:border-emerald-400 transition"
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  isChecked ? 'border-[#0C5A3E]' : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {isChecked && <div className="w-2 h-2 rounded-full bg-[#0C5A3E]"></div>}
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{lang.label}</span>
              </div>
            );
          })}
        </div>

        <div className="pt-3">
          <button
            onClick={() => navigateTo(4, 'home')}
            className="w-full py-2.5 rounded-xl bg-[#0C5A3E] text-white text-xs font-bold shadow hover:bg-[#094731] transition"
          >
            Continue
          </button>
        </div>

        <div className="p-2.5 rounded-xl bg-[#F0F7F4] dark:bg-[#152720] border border-emerald-100 dark:border-[#1E372C] flex items-start gap-2 text-[10px] text-gray-600 dark:text-gray-300">
          <Info className="w-3.5 h-3.5 text-[#0C5A3E] dark:text-[#34D399] shrink-0 mt-0.5" />
          <span>You can change language anytime in Settings</span>
        </div>
      </div>

      <BottomTabBar />
    </div>
  );

  // SCREEN 8: Translation Result
  const renderScreen8 = () => (
    <div className="flex-1 flex flex-col justify-between bg-[#FAF7EE] dark:bg-[#0E1513]">
      <HeaderBar title="Translate" onBack={() => navigateTo(5)} />

      <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto">
        {/* Language Row */}
        <div className="p-2.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center justify-between text-xs shadow-2xs">
          <div className="text-left">
            <span className="font-bold text-gray-800 dark:text-gray-200 block">Hindi</span>
            <span className="text-[10px] text-gray-400">हिंदी ▾</span>
          </div>
          <ArrowLeftRight className="w-3.5 h-3.5 text-[#0C5A3E]" />
          <div className="text-right">
            <span className="font-bold text-[#0C5A3E] dark:text-[#34D399] block">Santali</span>
            <span className="text-[10px] text-gray-400">संताली ▾</span>
          </div>
        </div>

        {/* Input Card with Active Hindi Text */}
        <div className="p-3 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex flex-col justify-between shadow-2xs">
          <p className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-relaxed">
            आज हम संख्या सीखेंगे।
          </p>
          <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
            <span></span>
            <div className="flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-gray-400" />
              <span>16/500</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigateTo(5)}
          className="w-full py-2.5 rounded-xl bg-[#0C5A3E] text-white text-xs font-bold shadow hover:bg-[#094731]"
        >
          Translate
        </button>

        {/* Translation Output Card with Ol Chiki & Star Filled */}
        <div className="p-3 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold text-[#0C5A3E] dark:text-[#34D399] block">Santali (संताली)</span>
          <p className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-wide font-['Noto_Sans_Ol_Chiki']">
            ᱛᱮᱦᱮᱧ ᱟᱵᱚ ᱮᱞ ᱵᱚᱱ ᱪᱮᱫᱚᱜᱼᱟ᱾
          </p>
          <p className="text-[10px] text-gray-500">Aaj am sankhya sikhenge.</p>

          <div className="pt-2 mt-1 border-t border-gray-100 dark:border-gray-800 flex items-center justify-around text-gray-600 dark:text-gray-300 text-[10px]">
            <button onClick={() => playSpeech("Aaj am sankhya sikhenge.")} className="flex items-center gap-1 hover:text-[#0C5A3E]">
              <Volume2 className="w-3.5 h-3.5" /> Listen
            </button>
            <button onClick={() => { navigator.clipboard?.writeText("ᱛᱮᱦᱮᱧ ᱟᱵᱚ ᱮᱞ ᱵᱚᱱ ᱪᱮᱫᱚᱜᱼᱟ᱾"); showToast("कॉपी हो गया!"); }} className="flex items-center gap-1 hover:text-[#0C5A3E]">
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
            <button onClick={() => showToast("साझा किया गया!")} className="flex items-center gap-1 hover:text-[#0C5A3E]">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            <button onClick={() => showToast("तारांकित!")} className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Save
            </button>
          </div>
        </div>
      </div>

      <BottomTabBar />
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
      <div className="flex-1 flex flex-col justify-between bg-[#FAF7EE] dark:bg-[#0E1513]">
        <HeaderBar title="Translation History" onBack={() => navigateTo(4)} />

        <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto">
          {/* Filter Chips: All | Hindi → Santali | Hindi → Mundari */}
          <div className="flex gap-1.5 text-[10px] font-semibold">
            {(['All', 'Hindi → Santali', 'Hindi → Mundari'] as const).map(f => (
              <button
                key={f}
                onClick={() => setHistoryFilter(f)}
                className={`px-2.5 py-1 rounded-full transition ${
                  historyFilter === f
                    ? 'bg-[#0C5A3E] text-white'
                    : 'bg-white dark:bg-[#15231E] border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-2 pt-1">
            {historyList.map((item, idx) => (
              <div
                key={idx}
                onClick={() => navigateTo(8)}
                className="p-2.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-2xs space-y-0.5 cursor-pointer hover:border-emerald-300 transition"
              >
                <div className="flex justify-between items-start">
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{item.hi}</p>
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                </div>
                <p className="text-xs font-bold text-[#0C5A3E] dark:text-[#34D399]">→ {item.sat}</p>
                <p className="text-[9px] text-gray-400 pt-0.5">{item.time}</p>
              </div>
            ))}
          </div>
        </div>

        <BottomTabBar />
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
      <div className="flex-1 flex flex-col justify-between bg-[#FAF7EE] dark:bg-[#0E1513]">
        <HeaderBar title="Dictionary" onBack={() => navigateTo(4)} />

        <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={dictSearch}
              onChange={(e) => setDictSearch(e.target.value)}
              placeholder="Search word (Hindi / Santali / Mundari)"
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] text-xs outline-none placeholder:text-gray-400 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Filter Tabs: All | Hindi | Santali | Mundari */}
          <div className="flex gap-1.5 text-[10px] font-semibold">
            {(['All', 'Hindi', 'Santali', 'Mundari'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setDictFilter(tab)}
                className={`px-2.5 py-0.5 rounded-full transition ${
                  dictFilter === tab
                    ? 'bg-[#0C5A3E] text-white'
                    : 'bg-white dark:bg-[#15231E] border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Word Cards */}
          <div className="space-y-2 pt-1">
            {dictItems.map((w, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-2xs space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black text-gray-900 dark:text-gray-100">{w.hindi}</h4>
                    <p className="text-[9px] text-gray-400">(Hindi)</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <button onClick={() => playSpeech(w.hindi)} className="hover:text-[#0C5A3E]">
                      <Volume2 className="w-3.5 h-3.5 text-[#0C5A3E] dark:text-[#34D399]" />
                    </button>
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  </div>
                </div>

                <div className="text-[10px] text-gray-600 dark:text-gray-300 space-y-0.5">
                  <p><span className="font-semibold text-gray-400">Santali:</span> <span className="font-bold text-gray-900 dark:text-gray-100">{w.santali}</span></p>
                  <p><span className="font-semibold text-gray-400">Mundari:</span> <span className="font-bold text-gray-900 dark:text-gray-100">{w.mundari}</span></p>
                  <p className="text-[9px] text-gray-400">({w.english})</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <BottomTabBar />
      </div>
    );
  };

  // SCREEN 11: Learning Mode
  const renderScreen11 = () => (
    <div className="flex-1 flex flex-col justify-between bg-[#FAF7EE] dark:bg-[#0E1513]">
      <HeaderBar title="Learning Mode" onBack={() => navigateTo(4)} />

      <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto">
        {/* Class Tabs: Class 1 | Class 2 | Class 3 */}
        <div className="flex gap-1.5 text-[10px] font-bold">
          {(['Class 1', 'Class 2', 'Class 3'] as const).map((cls) => (
            <button
              key={cls}
              onClick={() => setLearningClass(cls)}
              className={`px-3 py-1 rounded-full transition ${
                learningClass === cls
                  ? 'bg-[#0C5A3E] text-white'
                  : 'bg-white dark:bg-[#15231E] border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>

        {/* 5 Category Cards (Matching Reference) */}
        <div className="space-y-2 pt-1">
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
              className="p-2.5 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-2xs flex items-center justify-between cursor-pointer hover:border-emerald-300 transition"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl ${it.color} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
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

      <BottomTabBar />
    </div>
  );

  // SCREEN 12: Flashcards (With glossy red Apple 🍎)
  const renderScreen12 = () => {
    const card = FLASHCARD_ITEMS[flashcardIdx];
    return (
      <div className="flex-1 flex flex-col justify-between bg-[#FAF7EE] dark:bg-[#0E1513]">
        <HeaderBar title="Flashcards" onBack={() => navigateTo(11)} />

        <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
          <div className="my-auto p-4 rounded-3xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-sm flex flex-col items-center justify-center text-center space-y-2">
            {/* Glossy Red Apple / Item Picture */}
            <div className="w-28 h-28 flex items-center justify-center">
              <img
                src={card.image}
                alt={card.hindi}
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>

            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">{card.hindi}</h3>
              <p className="text-[11px] text-gray-500 font-medium">({card.translit})</p>
            </div>

            <div className="pt-2 text-xs space-y-0.5 border-t border-gray-100 dark:border-gray-800 w-full">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold text-gray-400">Santali: </span>
                <span className="font-bold text-[#0C5A3E] dark:text-[#34D399]">{card.santali}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold text-gray-400">Mundari: </span>
                <span className="font-bold text-[#0C5A3E] dark:text-[#34D399]">{card.mundari}</span>
              </p>
              <p className="text-[10px] text-gray-400 font-medium">({card.english})</p>
            </div>
          </div>

          {/* Navigation Controls: <  1/10  > */}
          <div className="flex items-center justify-center gap-4 pt-1">
            <button
              onClick={() => setFlashcardIdx(prev => (prev > 0 ? prev - 1 : FLASHCARD_ITEMS.length - 1))}
              className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#15231E] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{flashcardIdx + 1} / 10</span>
            <button
              onClick={() => setFlashcardIdx(prev => (prev < FLASHCARD_ITEMS.length - 1 ? prev + 1 : 0))}
              className="w-8 h-8 rounded-full bg-[#0C5A3E] text-white flex items-center justify-center shadow"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <BottomTabBar />
      </div>
    );
  };

  // SCREEN 13: Quiz Mode (Option 2 Selected with Green Radio)
  const renderScreen13 = () => (
    <div className="flex-1 flex flex-col justify-between bg-[#FAF7EE] dark:bg-[#0E1513]">
      <HeaderBar title="Quiz" onBack={() => navigateTo(4)} />

      <div className="p-3.5 space-y-3 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="w-1/5 h-full bg-[#0C5A3E] dark:bg-[#34D399]"></div>
          </div>
          <span className="text-[10px] font-bold text-gray-500">1/5</span>
        </div>

        <div className="pt-2 text-center">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-snug">
            “किताब” का संताली में क्या है?
          </h3>
        </div>

        {/* 4 Quiz Options (Option 2 "ᱯᱩᱛᱷᱤ" checked green by default in reference) */}
        <div className="space-y-2 pt-1">
          {["ᱚᱲᱟᱜ", "ᱯᱩᱛᱷᱤ", "ᱫᱟᱜ", "ᱫᱟᱠᱟ"].map((opt, idx) => {
            const isChosen = quizSelected === idx;
            return (
              <div
                key={idx}
                onClick={() => setQuizSelected(idx)}
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs font-semibold transition ${
                  isChosen
                    ? 'bg-[#EFF8F3] dark:bg-[#163326] border-[#0C5A3E] text-[#0C5A3E] dark:text-[#34D399]'
                    : 'bg-white dark:bg-[#15231E] border-[#ECE7DA] dark:border-[#20372E] text-gray-800 dark:text-gray-200'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                  isChosen ? 'border-[#0C5A3E]' : 'border-gray-400'
                }`}>
                  {isChosen && <div className="w-1.5 h-1.5 rounded-full bg-[#0C5A3E]"></div>}
                </div>
                <span className="font-['Noto_Sans_Ol_Chiki']">{opt}</span>
              </div>
            );
          })}
        </div>

        <div className="pt-2">
          <button
            onClick={() => showToast("क्विज उत्तर दर्ज हुआ!")}
            className="w-full py-2.5 rounded-xl bg-[#0C5A3E] text-white text-xs font-bold shadow hover:bg-[#094731]"
          >
            Next
          </button>
        </div>
      </div>

      <BottomTabBar />
    </div>
  );

  // SCREEN 14: Worksheet Generation
  const renderScreen14 = () => (
    <div className="flex-1 flex flex-col justify-between bg-[#FAF7EE] dark:bg-[#0E1513]">
      <HeaderBar title="Generate Worksheet" onBack={() => navigateTo(4)} />

      <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto">
        <div className="space-y-2 text-left pt-1">
          <div>
            <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Class</label>
            <div className="p-2 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] text-xs font-bold flex justify-between items-center text-gray-800 dark:text-gray-100">
              <span>{wsClass}</span>
              <span className="text-gray-400">▾</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Topic</label>
            <div className="p-2 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] text-xs font-bold flex justify-between items-center text-gray-800 dark:text-gray-100">
              <span>{wsTopic}</span>
              <span className="text-gray-400">▾</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Language</label>
            <div className="p-2 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] text-xs font-bold flex justify-between items-center text-gray-800 dark:text-gray-100">
              <span>{wsLanguage}</span>
              <span className="text-gray-400">▾</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Worksheet Type</label>
            <div className="p-2 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] text-xs font-bold flex justify-between items-center text-gray-800 dark:text-gray-100">
              <span>{wsType}</span>
              <span className="text-gray-400">▾</span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => navigateTo(15)}
            className="w-full py-2.5 rounded-xl bg-[#0C5A3E] text-white text-xs font-bold shadow hover:bg-[#094731]"
          >
            Generate
          </button>
        </div>

        <p className="text-[9.5px] text-gray-500 text-center leading-relaxed">
          ℹ Worksheet will be saved offline.<br />You can print or share it.
        </p>
      </div>

      <BottomTabBar />
    </div>
  );

  // SCREEN 15: Worksheet Preview
  const renderScreen15 = () => (
    <div className="flex-1 flex flex-col justify-between bg-[#FAF7EE] dark:bg-[#0E1513]">
      <HeaderBar title="Worksheet" onBack={() => navigateTo(14)} />

      <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto">
        <div className="p-3 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-sm space-y-2">
          <div className="text-center">
            <h4 className="text-xs font-black text-gray-900 dark:text-gray-100">संख्या पहचानें</h4>
            <p className="text-[9px] text-gray-500 font-medium">(Identify the numbers)</p>
          </div>

          <table className="w-full text-[10px] text-left border-collapse">
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {WORKSHEET_DATA.map((row) => (
                <tr key={row.num} className="py-1">
                  <td className="py-1 font-bold text-gray-500">{row.num}</td>
                  <td className="py-1 font-bold text-gray-900 dark:text-gray-100">{row.hindi}</td>
                  <td className="py-1 font-bold text-[#0C5A3E] dark:text-[#34D399] font-['Noto_Sans_Ol_Chiki']">{row.santali}</td>
                  <td className="py-1 text-right text-xs">{row.icons}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => window.print()}
            className="flex-1 py-2 rounded-xl bg-white dark:bg-[#15231E] border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center justify-center gap-1.5 shadow-2xs hover:bg-gray-50"
          >
            <Printer className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
            <span>Print</span>
          </button>
          <button
            onClick={() => showToast("PDF साझा किया गया!")}
            className="flex-1 py-2 rounded-xl bg-[#0C5A3E] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs hover:bg-[#094731]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      <BottomTabBar />
    </div>
  );

  // SCREEN 16: Settings
  const renderScreen16 = () => (
    <div className="flex-1 flex flex-col justify-between bg-[#FAF7EE] dark:bg-[#0E1513]">
      <HeaderBar title="Settings" onBack={() => navigateTo(4)} showMore={false} />

      <div className="p-3.5 space-y-3 flex-1 overflow-y-auto">
        <div className="rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] divide-y divide-gray-100 dark:divide-gray-800 shadow-2xs overflow-hidden">
          <div onClick={() => navigateTo(7)} className="p-3 flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-[#182922]">
            <div className="flex items-center gap-2.5">
              <ArrowLeftRight className="w-4 h-4 text-[#0C5A3E] dark:text-[#34D399]" />
              <span className="font-semibold text-gray-800 dark:text-gray-200">Language</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <span>Hindi</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div onClick={() => navigateTo(18)} className="p-3 flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-[#182922]">
            <div className="flex items-center gap-2.5">
              <Type className="w-4 h-4 text-[#0C5A3E] dark:text-[#34D399]" />
              <span className="font-semibold text-gray-800 dark:text-gray-200">Text Size</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <span>Medium</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div onClick={() => navigateTo(17)} className="p-3 flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-[#182922]">
            <div className="flex items-center gap-2.5">
              <Moon className="w-4 h-4 text-[#0C5A3E] dark:text-[#34D399]" />
              <span className="font-semibold text-gray-800 dark:text-gray-200">Dark Mode</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <span>{isDarkMode ? 'On' : 'Off'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div onClick={() => navigateTo(19)} className="p-3 flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-[#182922]">
            <div className="flex items-center gap-2.5">
              <Download className="w-4 h-4 text-[#0C5A3E] dark:text-[#34D399]" />
              <span className="font-semibold text-gray-800 dark:text-gray-200">Offline Content</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <span>Downloaded ✓</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>

          <div onClick={() => navigateTo(20)} className="p-3 flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-[#182922]">
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-[#0C5A3E] dark:text-[#34D399]" />
              <span className="font-semibold text-gray-800 dark:text-gray-200">App Information</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          </div>

          <div onClick={() => showToast("शिक्षक हेल्पलाइन: 1800-SAMVAAD")} className="p-3 flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-[#182922]">
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-[#0C5A3E] dark:text-[#34D399]" />
              <span className="font-semibold text-gray-800 dark:text-gray-200">Help & Support</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>
      </div>

      <BottomTabBar />
    </div>
  );

  // SCREEN 17: Dark Mode
  const renderScreen17 = () => (
    <div className="flex-1 flex flex-col justify-between bg-[#121614] text-gray-100">
      <HeaderBar title="Dark Mode" onBack={() => navigateTo(16)} showMore={false} />

      <div className="p-3.5 space-y-3 flex-1 overflow-y-auto">
        {/* Toggle Switch Card */}
        <div className="p-3 rounded-2xl bg-[#1A221E] border border-[#25332C] flex items-center justify-between">
          <span className="text-xs font-bold text-gray-100">Enable Dark Mode</span>
          <button
            onClick={() => {
              setIsDarkMode(!isDarkMode);
              showToast(isDarkMode ? "Light Mode Enabled" : "Dark Mode Enabled");
            }}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center ${
              isDarkMode ? 'bg-[#22C55E] justify-end' : 'bg-gray-600 justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-md"></div>
          </button>
        </div>

        {/* Mini Preview of Home Screen in Dark Mode */}
        <div className="p-3 rounded-2xl bg-[#1A221E] border border-[#25332C] space-y-2.5">
          <div className="flex items-center gap-1.5">
            <SamvaadLeavesLogo className="w-5 h-5" />
            <div>
              <h4 className="text-[11px] font-bold text-gray-100 leading-none">Samvaad</h4>
              <p className="text-[8px] text-gray-400">भाषा से सीखें, साथ मिलकर बढ़ें</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {['Translate', 'Dictionary', 'Learn', 'Flashcards', 'Quiz', 'Worksheets'].map((name, i) => (
              <div key={i} className="p-2 rounded-xl bg-[#121614] border border-[#23312A] text-center">
                <span className="text-[9px] font-bold text-gray-300">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomTabBar />
    </div>
  );

  // SCREEN 18: Text Size Setting
  const renderScreen18 = () => (
    <div className="flex-1 flex flex-col justify-between bg-[#FAF7EE] dark:bg-[#0E1513]">
      <HeaderBar title="Text Size" onBack={() => navigateTo(16)} showMore={false} />

      <div className="p-3.5 space-y-3 flex-1 overflow-y-auto">
        <div className="space-y-2 pt-1">
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
                className="p-3 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center justify-between cursor-pointer hover:border-emerald-300 transition shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isChosen ? 'border-[#0C5A3E]' : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {isChosen && <div className="w-2 h-2 rounded-full bg-[#0C5A3E]"></div>}
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{item.label}</span>
                </div>
                <span className={`font-serif text-gray-700 dark:text-gray-300 ${item.sizeClass}`}>A</span>
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] space-y-1 shadow-2xs">
          <p className="text-xs font-bold text-gray-900 dark:text-gray-100">यह एक उदाहरण पाठ है।</p>
          <p className="text-[10px] text-gray-500">(This is a sample text.)</p>
        </div>
      </div>

      <BottomTabBar />
    </div>
  );

  // SCREEN 19: Offline Content
  const renderScreen19 = () => (
    <div className="flex-1 flex flex-col justify-between bg-[#FAF7EE] dark:bg-[#0E1513]">
      <HeaderBar title="Offline Content" onBack={() => navigateTo(16)} showMore={false} />

      <div className="p-3.5 space-y-3 flex-1 overflow-y-auto">
        <div className="p-3 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-full bg-[#E5F2EB] dark:bg-[#183427] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">Language Packs</h4>
            <p className="text-[9.5px] text-gray-500">Downloaded for offline use</p>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <div className="p-2.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center font-bold text-[10px]">
                अ
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Hindi</span>
            </div>
            <span className="text-[10px] font-bold text-[#0C5A3E] dark:text-[#34D399] flex items-center gap-1">
              ✓ Installed
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center font-bold text-[10px]">
                ᱚ
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Santali</span>
            </div>
            <span className="text-[10px] font-bold text-[#0C5A3E] dark:text-[#34D399] flex items-center gap-1">
              ✓ Installed
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center font-bold text-[10px]">
                ᱢ
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Mundari</span>
            </div>

            {offlinePacks.Mundari ? (
              <span className="text-[10px] font-bold text-[#0C5A3E] dark:text-[#34D399] flex items-center gap-1">
                ✓ Installed
              </span>
            ) : (
              <button
                onClick={() => {
                  setOfflinePacks(prev => ({ ...prev, Mundari: true }));
                  showToast("Mundari पैकेज डाउनलोड हुआ!");
                }}
                className="px-2.5 py-1 rounded-lg bg-[#0C5A3E] text-white text-[10px] font-bold flex items-center gap-1 shadow-2xs hover:bg-[#094731]"
              >
                <Download className="w-3 h-3" />
                <span>Download (120 MB)</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-[9.5px] text-gray-500 text-center pt-2 leading-relaxed">
          ℹ Once downloaded, the app works<br />completely offline.
        </p>
      </div>

      <BottomTabBar />
    </div>
  );

  // SCREEN 20: About / Closing
  const renderScreen20 = () => (
    <div
      onClick={() => navigateTo(4, 'home')}
      className="flex-1 flex flex-col justify-between items-center text-center px-4 py-3 bg-[#FAF7EE] dark:bg-[#0E1513] cursor-pointer select-none"
    >
      <div className="pt-2 space-y-1">
        <div className="w-10 h-10 mx-auto flex items-center justify-center">
          <SamvaadLeavesLogo className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-black text-[#0C5A3E] dark:text-[#34D399] tracking-tight">Samvaad</h1>
        <p className="text-[10px] font-bold text-[#0C5A3E] dark:text-[#34D399]">भाषा से सीखें, साथ मिलकर बढ़ें</p>
      </div>

      <div className="my-auto space-y-2.5 w-full">
        <div className="flex flex-col items-center">
          <StateEmblemArtwork className="w-7 h-9 mb-0.5" />
          <p className="text-[8.5px] font-semibold text-[#1C362B] dark:text-[#34D399] uppercase">Government of Jharkhand</p>
          <p className="text-[10px] font-bold text-[#1C362B] dark:text-gray-100">झारखंड सरकार</p>
        </div>

        <div className="px-1">
          <img
            src="/assets/rural_children.jpg"
            alt="Storybook Rural Landscape"
            className="w-full h-40 object-cover rounded-2xl border border-[#E7DFCE] shadow-xs"
          />
        </div>
      </div>

      <div className="w-full pb-1">
        <p className="text-sm font-bold text-[#0C5A3E] dark:text-[#34D399] tracking-tight">
          सबकी भाषा, बेहतर शिक्षा
        </p>
        <p className="text-[9px] text-[#3E5C4E] dark:text-gray-400">Stronger Roots • Brighter Futures</p>
        <div className="w-28 h-1 bg-[#2D4539]/20 rounded-full mx-auto mt-2"></div>
      </div>
    </div>
  );

  // Screen Dispatcher
  const renderScreenById = (id: ScreenId) => {
    switch (id) {
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
    <div className="min-h-screen bg-[#ECE6DC] text-gray-900 flex flex-col items-center justify-start py-4 px-2 select-none">
      {/* Top Floating Control Bar */}
      <div className="w-full max-w-2xl mb-3 px-4 py-2 bg-white/95 backdrop-blur rounded-2xl border border-[#D5CFC2] shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#0C5A3E] animate-pulse"></span>
          <span className="font-extrabold text-[#0C5A3E]">Samvaad Mobile</span>
          <span className="text-gray-300">|</span>
          <span className="font-semibold text-gray-700">Screen #{currentScreen}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Switch: Interactive Phone vs 20-Screen Poster Gallery */}
          <button
            onClick={() => setViewMode(viewMode === 'phone' ? 'poster' : 'phone')}
            className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-[#0C5A3E] font-bold text-[11px] flex items-center gap-1.5 hover:bg-emerald-100 transition"
          >
            {viewMode === 'phone' ? (
              <>
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>View All 20 Screens Poster</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span>Interactive Phone View</span>
              </>
            )}
          </button>

          {/* Jump directly to any screen */}
          <select
            value={currentScreen}
            onChange={(e) => navigateTo(Number(e.target.value) as ScreenId)}
            className="px-2 py-1 rounded-xl bg-gray-100 border border-gray-200 font-bold text-[11px] text-gray-800 outline-none cursor-pointer hover:border-gray-400"
          >
            {SCREENS_CATALOG.map((s) => (
              <option key={s.num} value={s.num}>
                {s.num}. {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODE 1: Interactive Smartphone Mockup                     */}
      {/* ======================================================== */}
      {viewMode === 'phone' && (
        <div className="flex flex-col items-center">
          <div className="relative shadow-2xl rounded-[48px] p-2.5 bg-[#1C1C1E] border-[4px] border-[#2C2C2E]">
            <div className={`w-[320px] sm:w-[340px] h-[680px] rounded-[40px] overflow-hidden flex flex-col relative border ${
              isDarkMode ? 'bg-[#0E1513] border-[#1E2B26]' : 'bg-[#FAF7EE] border-[#ECE7DA]'
            }`}>
              {/* Top Status Bar: 9:41, Dynamic Notch, 5G Battery */}
              <div className={`w-full px-6 py-2 flex items-center justify-between text-[11px] font-bold select-none shrink-0 z-30 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-900'
              }`}>
                <span>9:41</span>
                {/* Dynamic Notch */}
                <div className="w-18 h-4 bg-black rounded-full mx-auto -mt-1 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#181818]"></div>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  <span>5G</span>
                  <div className="w-4 h-2.5 border border-current rounded-xs p-0.5 flex items-center">
                    <div className="w-full h-full bg-current rounded-2xs"></div>
                  </div>
                </div>
              </div>

              {/* Active Screen Viewport */}
              <div className="flex-1 overflow-y-auto flex flex-col relative">
                {renderScreenById(currentScreen)}
              </div>
            </div>
          </div>

          <div className="mt-3 text-center space-y-0.5">
            <p className="text-xs font-serif font-bold text-gray-800 tracking-tight">
              Screen {currentScreen}: {SCREENS_CATALOG.find(s => s.num === currentScreen)?.name}
            </p>
            <p className="text-[10px] text-gray-500">
              Tap buttons or bottom tabs to navigate through the entire mobile app.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2: Poster View (All 20 Screens Side-by-Side)         */}
      {/* ======================================================== */}
      {viewMode === 'poster' && (
        <div className="w-full max-w-7xl pb-12">
          <div className="text-center mb-4">
            <h2 className="text-xl font-black text-[#0C5A3E]">Samvaad • Complete 20-Screen Reference Gallery</h2>
            <p className="text-xs text-gray-600 mt-0.5">Click any screen to zoom and interact inside the mobile phone</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {SCREENS_CATALOG.map((sc) => (
              <div
                key={sc.num}
                onClick={() => {
                  setCurrentScreen(sc.num);
                  setViewMode('phone');
                }}
                className="flex flex-col items-center cursor-pointer group"
              >
                <div className="relative shadow-md group-hover:shadow-xl group-hover:scale-102 transition-all duration-200 rounded-[30px] p-1.5 bg-[#1C1C1E] border-[2.5px] border-[#2C2C2E] w-full max-w-[240px]">
                  <div className={`w-full h-[460px] rounded-[24px] overflow-hidden flex flex-col relative text-[9px] ${
                    sc.num === 17 ? 'bg-[#121614]' : 'bg-[#FAF7EE]'
                  }`}>
                    {/* Mini Status Bar */}
                    <div className="w-full px-3 py-1 flex items-center justify-between text-[8px] font-bold text-gray-600 dark:text-gray-400">
                      <span>9:41</span>
                      <div className="w-8 h-2 bg-black rounded-full"></div>
                      <span>5G</span>
                    </div>

                    <div className="flex-1 overflow-hidden pointer-events-none scale-90 origin-top flex flex-col">
                      {renderScreenById(sc.num)}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-gray-800 mt-1.5 text-center group-hover:text-[#0C5A3E]">
                  {sc.num}. {sc.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#0C5A3E] text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}