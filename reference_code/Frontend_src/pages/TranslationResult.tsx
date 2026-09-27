import React from 'react';
import { ArrowLeftRight, Mic, Volume2, Copy, Share2, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';

export const TranslationResult: React.FC = () => {
  const { navigateTo, playSpeech, showToast, goBack } = useApp();

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title="Translate" onBack={goBack} />

      <div className="p-4 sm:p-6 space-y-3.5 max-w-lg mx-auto w-full flex-1 overflow-y-auto">
        {/* Language Row */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center justify-between text-xs sm:text-sm shadow-xs">
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

        {/* Input Card with Active Hindi Text */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex flex-col justify-between shadow-xs">
          <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 leading-relaxed">
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
          onClick={() => navigateTo('translate')}
          className="w-full py-3.5 rounded-xl bg-[#0C5A3E] text-white text-sm font-bold shadow hover:bg-[#094731] transition active:scale-98"
        >
          Translate
        </button>

        {/* Output Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] space-y-2 shadow-xs">
          <span className="text-xs font-bold text-[#0C5A3E] dark:text-[#34D399] block">Santali (संताली)</span>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-wide font-['Noto_Sans_Ol_Chiki']">
            ᱛᱮᱦᱮᱧ ᱟᱵᱚ ᱮᱞ ᱵᱚᱱ ᱪᱮᱫᱚᱜᱼᱟ᱾
          </p>
          <p className="text-xs text-gray-500">Aaj am sankhya sikhenge.</p>

          <div className="pt-3 mt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-around text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
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
            <button onClick={() => showToast("तारांकित!")} className="flex items-center gap-1.5 text-amber-500 font-bold py-1 px-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
