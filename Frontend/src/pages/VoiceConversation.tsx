import React from 'react';
import { ArrowLeftRight, Mic } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';

export const VoiceConversation: React.FC = () => {
  const { playSpeech, showToast, goBack } = useApp();

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title="Voice Conversation" onBack={goBack} />

      <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto w-full flex-1 flex flex-col justify-between">
        {/* Language Row */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center justify-between text-xs sm:text-sm shadow-xs">
          <div className="text-left">
            <span className="font-bold text-gray-800 dark:text-gray-200 block">Hindi</span>
            <span className="text-[10px] text-gray-400">हिंदी ▾</span>
          </div>
          <ArrowLeftRight className="w-4 h-4 text-[#0C5A3E]" />
          <div className="text-right">
            <span className="font-bold text-[#0C5A3E] dark:text-[#34D399] block">Mundari</span>
            <span className="text-[10px] text-gray-400">मुंडारी ▾</span>
          </div>
        </div>

        {/* Concentric Voice Waves & Green Mic */}
        <div className="py-10 flex flex-col items-center justify-center my-auto">
          <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#E5F2EB] dark:bg-[#142C21] opacity-70 animate-pulse"></div>
            <div className="absolute inset-7 rounded-full bg-[#C7E9D7] dark:bg-[#1A382B] opacity-80"></div>
            <button
              onClick={() => {
                showToast("आवाज रिकॉर्ड हो रही है...");
                playSpeech("नमस्ते, आप कैसे हैं?");
              }}
              className="relative w-28 h-28 rounded-full bg-[#0C5A3E] text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition"
              aria-label="Speak"
            >
              <Mic className="w-12 h-12" />
            </button>
          </div>

          <div className="text-center mt-6 space-y-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Tap and speak</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">(हिंदी में बोलें)</p>
            <p className="text-xs text-gray-500 pt-1">
              Translation will play automatically<br />in Mundari
            </p>
          </div>

          <button
            onClick={() => showToast("दिशा बदली गई: Mundari → Hindi")}
            className="mt-6 px-6 py-2.5 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#15231E] text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 shadow-xs hover:bg-gray-50 active:scale-95 transition"
          >
            <ArrowLeftRight className="w-4 h-4 text-[#0C5A3E]" />
            <span>Switch Direction</span>
          </button>
        </div>

        <div></div>
      </div>
    </div>
  );
};
