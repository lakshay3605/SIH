import React from 'react';
import { Home, ArrowLeftRight, History, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BottomNavigation: React.FC = () => {
  const { activeTab, navigateTo, isDarkMode } = useApp();

  return (
    <nav
      aria-label="Main Application Navigation"
      className={`w-full py-1.5 px-3 flex items-center justify-around border-t select-none shrink-0 sticky bottom-0 z-30 ${
        isDarkMode
          ? 'bg-[#121B17] border-[#1D2A24] text-gray-400'
          : 'bg-white border-[#EBE4D5] text-[#7A8780] shadow-[0_-2px_8px_rgba(0,0,0,0.03)]'
      }`}
    >
      {/* 1. Home Tab */}
      <button
        onClick={() => navigateTo('home', 'home')}
        className={`flex-1 flex flex-col items-center py-0.5 transition-colors ${
          activeTab === 'home'
            ? isDarkMode ? 'text-[#34D399] font-bold' : 'text-[#0C5A3E] font-bold'
            : 'hover:text-gray-700 dark:hover:text-gray-200'
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            activeTab === 'home'
              ? 'bg-[#0C5A3E] text-white shadow-xs'
              : 'text-[#68756E] dark:text-gray-400'
          }`}
        >
          <Home className="w-4.5 h-4.5 stroke-[2.2]" />
        </div>
        <span className="text-[10.5px] font-bold tracking-tight mt-0.5">Home</span>
      </button>

      {/* 2. Central Highlighted Action: Translate */}
      <button
        onClick={() => navigateTo('translate', 'translate')}
        className="flex-1 flex flex-col items-center py-0 relative group"
        aria-label="Translate"
      >
        <div
          className={`w-11 h-11 -mt-4 rounded-full flex items-center justify-center shadow-md transition-transform duration-150 group-hover:scale-105 active:scale-95 border-3 ${
            activeTab === 'translate'
              ? 'bg-[#0C5A3E] text-white border-[#FAF7EE] dark:border-[#0E1513] shadow-emerald-950/30'
              : 'bg-[#0C5A3E] text-white border-[#FAF7EE] dark:border-[#0E1513]'
          }`}
        >
          <ArrowLeftRight className="w-5 h-5 stroke-[2.4]" />
        </div>
        <span
          className={`text-[10.5px] tracking-tight mt-0.5 ${
            activeTab === 'translate'
              ? isDarkMode ? 'text-[#34D399] font-bold' : 'text-[#0C5A3E] font-bold'
              : 'text-[#68756E] dark:text-gray-400 font-semibold'
          }`}
        >
          Translate
        </span>
      </button>

      {/* 3. History Tab */}
      <button
        onClick={() => navigateTo('history', 'history')}
        className={`flex-1 flex flex-col items-center py-0.5 transition-colors ${
          activeTab === 'history'
            ? isDarkMode ? 'text-[#34D399] font-bold' : 'text-[#0C5A3E] font-bold'
            : 'hover:text-gray-700 dark:hover:text-gray-200'
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            activeTab === 'history'
              ? 'bg-[#0C5A3E] text-white shadow-xs'
              : 'text-[#68756E] dark:text-gray-400'
          }`}
        >
          <History className="w-4.5 h-4.5 stroke-[2.2]" />
        </div>
        <span className="text-[10.5px] font-bold tracking-tight mt-0.5">History</span>
      </button>

      {/* 4. Settings Tab */}
      <button
        onClick={() => navigateTo('settings', 'settings')}
        className={`flex-1 flex flex-col items-center py-0.5 transition-colors ${
          activeTab === 'settings'
            ? isDarkMode ? 'text-[#34D399] font-bold' : 'text-[#0C5A3E] font-bold'
            : 'hover:text-gray-700 dark:hover:text-gray-200'
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            activeTab === 'settings'
              ? 'bg-[#0C5A3E] text-white shadow-xs'
              : 'text-[#68756E] dark:text-gray-400'
          }`}
        >
          <Settings className="w-4.5 h-4.5 stroke-[2.2]" />
        </div>
        <span className="text-[10.5px] font-bold tracking-tight mt-0.5">Settings</span>
      </button>
    </nav>
  );
};
