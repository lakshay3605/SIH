import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { CheckCircle2 } from 'lucide-react';
import { Splash } from './pages/Splash';
import { Onboarding1 } from './pages/Onboarding1';
import { Onboarding2 } from './pages/Onboarding2';
import { Home } from './pages/Home';
import { Translate } from './pages/Translate';
import { VoiceConversation } from './pages/VoiceConversation';
import { LanguageSelection } from './pages/LanguageSelection';
import { TranslationResult } from './pages/TranslationResult';
import { History } from './pages/History';
import { Dictionary } from './pages/Dictionary';
import { Learning } from './pages/Learning';
import { Flashcards } from './pages/Flashcards';
import { Quiz } from './pages/Quiz';
import { WorksheetGenerator } from './pages/WorksheetGenerator';
import { WorksheetPreview } from './pages/WorksheetPreview';
import { Settings } from './pages/Settings';
import { DarkMode } from './pages/DarkMode';
import { TextSize } from './pages/TextSize';
import { OfflineContent } from './pages/OfflineContent';
import { About } from './pages/About';
import { BottomNavigation } from './components/BottomNavigation';

const AppContent: React.FC = () => {
  const { currentScreen, isDarkMode, toastMessage } = useApp();

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <Splash />;
      case 'onboarding1':
        return <Onboarding1 />;
      case 'onboarding2':
        return <Onboarding2 />;
      case 'home':
        return <Home />;
      case 'translate':
        return <Translate />;
      case 'voice':
        return <VoiceConversation />;
      case 'choose-language':
        return <LanguageSelection />;
      case 'translation-result':
        return <TranslationResult />;
      case 'history':
        return <History />;
      case 'dictionary':
        return <Dictionary />;
      case 'learning':
        return <Learning />;
      case 'flashcards':
        return <Flashcards />;
      case 'quiz':
        return <Quiz />;
      case 'worksheet-gen':
        return <WorksheetGenerator />;
      case 'worksheet-preview':
        return <WorksheetPreview />;
      case 'settings':
        return <Settings />;
      case 'dark-mode':
        return <DarkMode />;
      case 'text-size':
        return <TextSize />;
      case 'offline-content':
        return <OfflineContent />;
      case 'about':
        return <About />;
      default:
        return <Home />;
    }
  };

  const showBottomNav =
    currentScreen !== 'splash' &&
    currentScreen !== 'onboarding1' &&
    currentScreen !== 'onboarding2' &&
    currentScreen !== 'about';

  return (
    // Desktop canvas: dark neutral background to cleanly isolate the 390x844 mobile app viewport
    <div className="w-full min-h-screen bg-[#18181B] flex items-center justify-center sm:py-6 sm:px-4 antialiased selection:bg-emerald-100 overflow-x-hidden">
      {/* 390 × 844 px Mobile App Viewport (Actual App UI - Clean, Sharp, No Mockup Bezels or Borders) */}
      <div
        id="samvaad-app-viewport"
        className={`w-full sm:w-[390px] h-screen sm:h-[844px] sm:max-h-[844px] ${
          isDarkMode ? 'bg-[#0E1513] text-gray-100' : 'bg-[#FAF7EE] text-gray-900'
        } flex flex-col relative overflow-hidden sm:shadow-2xl`}
      >
        {/* Main App Content */}
        <main className="w-full flex-1 flex flex-col relative overflow-y-auto overflow-x-hidden">
          {renderActiveScreen()}
        </main>

        {/* Persistent Bottom Tab Navigation for Main App Screens */}
        {showBottomNav && <BottomNavigation />}

        {/* Floating In-App Toast */}
        {toastMessage && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#0C5A3E] text-white text-xs sm:text-sm font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 pointer-events-none">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
