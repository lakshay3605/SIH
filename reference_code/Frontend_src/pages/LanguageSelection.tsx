import React from 'react';
import { Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { LanguageCode } from '../types';

export const LanguageSelection: React.FC = () => {
  const { appLanguage, setAppLanguage, showToast, goBack } = useApp();

  const languages: { id: LanguageCode; label: string }[] = [
    { id: 'Hindi', label: 'Hindi (हिंदी)' },
    { id: 'Santali', label: 'Santali (संताली)' },
    { id: 'Mundari', label: 'Mundari (मुंडारी)' },
  ];

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title="Choose Language" onBack={goBack} showMore={false} />

      <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto w-full flex-1 overflow-y-auto">
        <div className="space-y-3 pt-2">
          {languages.map((lang) => {
            const isChecked = appLanguage === lang.id;
            return (
              <div
                key={lang.id}
                onClick={() => {
                  setAppLanguage(lang.id);
                  showToast(`भाषा चुनी: ${lang.label}`);
                }}
                className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center gap-3.5 cursor-pointer shadow-xs hover:border-emerald-400 active:scale-98 transition"
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isChecked ? 'border-[#0C5A3E]' : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {isChecked && <div className="w-2.5 h-2.5 rounded-full bg-[#0C5A3E]"></div>}
                </div>
                <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">{lang.label}</span>
              </div>
            );
          })}
        </div>

        <div className="pt-4">
          <button
            onClick={goBack}
            className="w-full py-3.5 rounded-xl bg-[#0C5A3E] text-white text-sm font-bold shadow-md hover:bg-[#094731] transition active:scale-98"
          >
            Continue
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-[#F0F7F4] dark:bg-[#152720] border border-emerald-100 dark:border-[#1E372C] flex items-start gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          <Info className="w-5 h-5 text-[#0C5A3E] dark:text-[#34D399] shrink-0 mt-0.5" />
          <span>You can change language anytime in Settings</span>
        </div>
      </div>
    </div>
  );
};
