import React from 'react';
import { ArrowLeftRight, Mic, Volume2, Copy, Share2, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';

export const Translate: React.FC = () => {
  const {
    inputText,
    setInputText,
    navigateTo,
    playSpeech,
    showToast,
  } = useApp();

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title="Translate" />

      <div className="p-4 sm:p-6 space-y-3.5 max-w-lg mx-auto w-full flex-1 overflow-y-auto">
        {/* Language Selector Row */}
        <div
          onClick={() => navigateTo('choose-language')}
          className="p-3.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center justify-between text-xs sm:text-sm cursor-pointer shadow-xs hover:border-emerald-300 transition"
        >
          <div className="text-left">
            <span className="font-bold text-gray-800 dark:text-gray-200 block">Hindi</span>
            <span className="text-xs text-gray-400">हिंदी ▾</span>
          </div>
          <ArrowLeftRight className="w-4 h-4 text-[#0C5A3E]" />
          <div className="text-right">
            <span className="font-bold text-[#0C5A3E] dark:text-[#34D399] block">Santali</span>
            <span className="text-xs text-gray-400">संताली ▾</span>
          </div>
        </div>

        {/* Source Text Input Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] min-h-[130px] flex flex-col justify-between shadow-xs">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type in Hindi..."
            className="w-full text-sm sm:text-base font-medium text-gray-800 dark:text-gray-100 bg-transparent resize-none outline-none placeholder:text-gray-400"
            rows={3}
          />
          <div className="flex items-center justify-between text-xs text-gray-400 pt-2.5 border-t border-gray-100 dark:border-gray-800">
            <span></span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateTo('voice')}
                className="hover:text-[#0C5A3E] p-1 text-gray-400 hover:text-[#0C5A3E] transition"
                aria-label="Voice Input"
              >
                <Mic className="w-4 h-4" />
              </button>
              <span>{inputText.length}/500</span>
            </div>
          </div>
        </div>

        {/* Translate Action Button */}
        <button
          onClick={() => navigateTo('translation-result', 'translate')}
          className="w-full py-3.5 rounded-xl bg-[#0C5A3E] text-white text-sm font-bold shadow-md hover:bg-[#094731] transition active:scale-98"
        >
          Translate
        </button>

        {/* Translation Output Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] space-y-2 shadow-xs">
          <span className="text-xs font-bold text-gray-400 block">Translation (Santali)</span>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-wide font-['Noto_Sans_Ol_Chiki']">
            ᱛᱮᱦᱮᱧ ᱟᱵᱚ ᱮᱞ ᱵᱚᱱ ᱪᱮᱫᱚᱜᱼᱟ᱾
          </p>
          <p className="text-xs text-gray-500">Aaj am sankhya sikhenge.</p>

          <div className="pt-3 mt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-around text-gray-600 dark:text-gray-300 text-xs">
            <button onClick={() => playSpeech("Aaj am sankhya sikhenge.")} className="flex items-center gap-1.5 hover:text-[#0C5A3E] py-1 px-2">
              <Volume2 className="w-4 h-4" /> Listen
            </button>
            <button
              onClick={() => {
                navigator.clipboard?.writeText("ᱛᱮᱦᱮᱧ ᱟᱵᱚ ᱮᱞ ᱵᱚᱱ ᱪᱮᱫᱚᱜᱼᱟ᱾");
                showToast("कॉपी हो गया!");
              }}
              className="flex items-center gap-1.5 hover:text-[#0C5A3E] py-1 px-2"
            >
              <Copy className="w-4 h-4" /> Copy
            </button>
            <button onClick={() => showToast("साझा किया गया!")} className="flex items-center gap-1.5 hover:text-[#0C5A3E] py-1 px-2">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button onClick={() => showToast("सहेजा गया ⭐")} className="flex items-center gap-1.5 text-amber-500 font-bold py-1 px-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
