import React from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { SamvaadLogo } from '../components/SamvaadLogo';

export const DarkMode: React.FC = () => {
  const { isDarkMode, setIsDarkMode, showToast, goBack } = useApp();

  return (
    <div className="w-full flex-1 flex flex-col bg-[#121614] text-gray-100">
      <Header title="Dark Mode" onBack={goBack} showMore={false} />

      <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto w-full flex-1 overflow-y-auto">
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

        <div className="p-4 sm:p-5 rounded-2xl bg-[#1A221E] border border-[#25332C] space-y-3">
          <div className="flex items-center gap-2">
            <SamvaadLogo className="w-6 h-6" />
            <div>
              <h4 className="text-xs font-bold text-gray-100 leading-none">Samvaad</h4>
              <p className="text-[9px] text-gray-400">भाषा से सीखें, साथ मिलकर बढ़ें</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {['Translate', 'Dictionary', 'Learn', 'Flashcards', 'Quiz', 'Worksheets'].map((name, i) => (
              <div key={i} className="p-3 rounded-xl bg-[#121614] border border-[#23312A] text-center">
                <span className="text-xs font-bold text-gray-300">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
