import React from 'react';
import { ArrowLeftRight, Type, Moon, Download, Info, HelpCircle, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';

export const Settings: React.FC = () => {
  const { appLanguage, textSize, isDarkMode, navigateTo, showToast, goBack } = useApp();

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title="Settings" onBack={goBack} showMore={false} />

      <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto w-full flex-1 overflow-y-auto">
        <div className="rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] divide-y divide-gray-100 dark:divide-gray-800 shadow-xs overflow-hidden">
          <div
            onClick={() => navigateTo('choose-language')}
            className="p-4 flex items-center justify-between text-xs sm:text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#182922] transition"
          >
            <div className="flex items-center gap-3">
              <ArrowLeftRight className="w-5 h-5 text-[#0C5A3E] dark:text-[#34D399]" />
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm sm:text-base">Language</span>
            </div>
            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-400">
              <span>{appLanguage}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div
            onClick={() => navigateTo('text-size')}
            className="p-4 flex items-center justify-between text-xs sm:text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#182922] transition"
          >
            <div className="flex items-center gap-3">
              <Type className="w-5 h-5 text-[#0C5A3E] dark:text-[#34D399]" />
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm sm:text-base">Text Size</span>
            </div>
            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-400">
              <span>{textSize}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div
            onClick={() => navigateTo('dark-mode')}
            className="p-4 flex items-center justify-between text-xs sm:text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#182922] transition"
          >
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-[#0C5A3E] dark:text-[#34D399]" />
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm sm:text-base">Dark Mode</span>
            </div>
            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-400">
              <span>{isDarkMode ? 'On' : 'Off'}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div
            onClick={() => navigateTo('offline-content')}
            className="p-4 flex items-center justify-between text-xs sm:text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#182922] transition"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-[#0C5A3E] dark:text-[#34D399]" />
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm sm:text-base">Offline Content</span>
            </div>
            <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-emerald-600">
              <span>Downloaded ✓</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div
            onClick={() => navigateTo('about')}
            className="p-4 flex items-center justify-between text-xs sm:text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#182922] transition"
          >
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-[#0C5A3E] dark:text-[#34D399]" />
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm sm:text-base">App Information</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>

          <div
            onClick={() => showToast("शिक्षक हेल्पलाइन: 1800-SAMVAAD")}
            className="p-4 flex items-center justify-between text-xs sm:text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#182922] transition"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-[#0C5A3E] dark:text-[#34D399]" />
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm sm:text-base">Help & Support</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
