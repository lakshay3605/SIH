import React from 'react';
import { Home, ArrowLeftRight, History, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BottomNavigation: React.FC = () => {
  const { activeTab, navigateTo, isDarkMode } = useApp();

  return (
    <nav
      aria-label="Main Application Navigation"
      className={`w-full py-1 px-4 flex items-center justify-around border-t select-none shrink-0 sticky bottom-0 z-30 ${
        isDarkMode
          ? 'bg-[#121B17] border-[#1D2A24] text-gray-400'
          : 'bg-white border-[#EAE4D6] text-gray-400 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]'
      }`}
    >
      {/* 1. Home Tab */}
      <button
        onClick={() => navigateTo('home', 'home')}
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
        onClick={() => navigateTo('translate', 'translate')}
        className="flex-1 flex flex-col items-center py-0 relative group"
        aria-label="Translate"
      >
        <div
          className={`w-12 h-12 -mt-5 rounded-full flex items-center justify-center shadow-lg transition-transform duration-150 group-hover:scale-105 active:scale-95 border-4 ${
            activeTab === 'translate'
              ? 'bg-[#0C5A3E] text-white border-[#FAF7EE] dark:border-[#0E1513] shadow-emerald-950/40 ring-2 ring-emerald-500/20'
              : 'bg-[#0C5A3E] text-white border-[#FAF7EE] dark:border-[#0E1513]'
          }`}
        >
          <ArrowLeftRight className="w-5 h-5 stroke-[2.5]" />
        </div>
        <span
          className={`text-[10px] tracking-tight mt-0.5 ${
            activeTab === 'translate'
              ? isDarkMode ? 'text-[#34D399] font-bold' : 'text-[#0C5A3E] font-bold'
              : 'text-gray-600 dark:text-gray-400 font-semibold'
          }`}
        >
          Translate
        </span>
      </button>

      {/* 3. History Tab */}
      <button
        onClick={() => navigateTo('history', 'history')}
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
        onClick={() => navigateTo('settings', 'settings')}
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
