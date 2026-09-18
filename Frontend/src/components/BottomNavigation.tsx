import React from 'react';
import { Home, ArrowLeftRight, Clock, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BottomNavigation: React.FC = () => {
  const { activeTab, navigateTo, isDarkMode } = useApp();

  return (
    <nav
      aria-label="Main Navigation"
      className={`w-full py-2 px-3 flex items-center justify-around border-t select-none shrink-0 sticky bottom-0 z-30 ${
        isDarkMode
          ? 'bg-[#0E1513] border-[#1D2A24] text-gray-400'
          : 'bg-[#FAF7EE] border-[#E8E1D0] text-[#2C3831]'
      }`}
    >
      {/* 1. Home Tab */}
      <button
        onClick={() => navigateTo('home', 'home')}
        className="flex-1 flex flex-col items-center justify-center py-0.5 transition-colors cursor-pointer group"
      >
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            activeTab === 'home'
              ? 'bg-[#0B4A33] text-white shadow-xs'
              : 'text-[#2C3831] dark:text-gray-400 group-hover:text-black'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'fill-white stroke-white stroke-[1.2]' : 'stroke-[2.2]'}`} />
        </div>
        <span
          className={`text-[11px] tracking-tight mt-0.5 ${
            activeTab === 'home'
              ? 'font-bold text-[#0B4A33] dark:text-[#34D399]'
              : 'font-medium text-[#2C3831] dark:text-gray-400'
          }`}
        >
          Home
        </span>
      </button>

      {/* 2. Translate Tab */}
      <button
        onClick={() => navigateTo('translate', 'translate')}
        className="flex-1 flex flex-col items-center justify-center py-0.5 transition-colors cursor-pointer group"
      >
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            activeTab === 'translate'
              ? 'bg-[#0B4A33] text-white shadow-xs'
              : 'text-[#2C3831] dark:text-gray-400 group-hover:text-black'
          }`}
        >
          <ArrowLeftRight className="w-5 h-5 stroke-[2.2]" />
        </div>
        <span
          className={`text-[11px] tracking-tight mt-0.5 ${
            activeTab === 'translate'
              ? 'font-bold text-[#0B4A33] dark:text-[#34D399]'
              : 'font-medium text-[#2C3831] dark:text-gray-400'
          }`}
        >
          Translate
        </span>
      </button>

      {/* 3. History Tab */}
      <button
        onClick={() => navigateTo('history', 'history')}
        className="flex-1 flex flex-col items-center justify-center py-0.5 transition-colors cursor-pointer group"
      >
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            activeTab === 'history'
              ? 'bg-[#0B4A33] text-white shadow-xs'
              : 'text-[#2C3831] dark:text-gray-400 group-hover:text-black'
          }`}
        >
          <Clock className="w-5 h-5 stroke-[2.2]" />
        </div>
        <span
          className={`text-[11px] tracking-tight mt-0.5 ${
            activeTab === 'history'
              ? 'font-bold text-[#0B4A33] dark:text-[#34D399]'
              : 'font-medium text-[#2C3831] dark:text-gray-400'
          }`}
        >
          History
        </span>
      </button>

      {/* 4. Settings Tab */}
      <button
        onClick={() => navigateTo('settings', 'settings')}
        className="flex-1 flex flex-col items-center justify-center py-0.5 transition-colors cursor-pointer group"
      >
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            activeTab === 'settings'
              ? 'bg-[#0B4A33] text-white shadow-xs'
              : 'text-[#2C3831] dark:text-gray-400 group-hover:text-black'
          }`}
        >
          <Settings className="w-5 h-5 stroke-[2.2]" />
        </div>
        <span
          className={`text-[11px] tracking-tight mt-0.5 ${
            activeTab === 'settings'
              ? 'font-bold text-[#0B4A33] dark:text-[#34D399]'
              : 'font-medium text-[#2C3831] dark:text-gray-400'
          }`}
        >
          Settings
        </span>
      </button>
    </nav>
  );
};
