import React from 'react';
import { ArrowLeftRight, BookOpen, GraduationCap, Layers, HelpCircle, FileText, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SamvaadLogo } from '../components/SamvaadLogo';

export const Home: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto w-full flex-1 overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <SamvaadLogo className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-black text-[#0C5A3E] dark:text-[#34D399] leading-tight">Samvaad</h1>
              <p className="text-[11px] text-[#0C5A3E] font-medium">भाषा से सीखें, साथ मिलकर बढ़ें</p>
            </div>
          </div>
          <button
            onClick={() => navigateTo('settings')}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Teacher Hero Banner */}
        <div
          onClick={() => navigateTo('onboarding1')}
          className="p-4 rounded-2xl bg-[#FFF9E6] dark:bg-[#1E1B13] border border-[#F1E3B8] dark:border-[#382F1B] flex items-center justify-between overflow-hidden shadow-xs cursor-pointer hover:border-amber-300 transition"
        >
          <div className="max-w-[180px] sm:max-w-xs space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 leading-snug">
              Teaching is easier when language is no longer a barrier.
            </h3>
          </div>
          <div className="w-28 h-20 sm:w-36 sm:h-24 relative rounded-xl overflow-hidden border border-[#EBDDB5] shrink-0">
            <img
              src="/assets/teacher_village.jpg"
              alt="Teacher Banner"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* 2x3 Grid of 6 Action Cards */}
        <div className="grid grid-cols-2 gap-3.5 pt-1">
          <div
            onClick={() => navigateTo('translate', 'translate')}
            className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs flex flex-col items-center text-center cursor-pointer hover:border-emerald-400 active:scale-95 transition"
          >
            <div className="w-12 h-12 rounded-xl bg-[#E8F3EE] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-2">
              <ArrowLeftRight className="w-6 h-6 stroke-[2]" />
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Translate</h4>
          </div>

          <div
            onClick={() => navigateTo('dictionary')}
            className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs flex flex-col items-center text-center cursor-pointer hover:border-emerald-400 active:scale-95 transition"
          >
            <div className="w-12 h-12 rounded-xl bg-[#E8F3EE] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-2">
              <BookOpen className="w-6 h-6 stroke-[2]" />
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Dictionary</h4>
          </div>

          <div
            onClick={() => navigateTo('learning')}
            className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs flex flex-col items-center text-center cursor-pointer hover:border-emerald-400 active:scale-95 transition"
          >
            <div className="w-12 h-12 rounded-xl bg-[#E8F3EE] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-2">
              <GraduationCap className="w-6 h-6 stroke-[2]" />
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Learn</h4>
          </div>

          <div
            onClick={() => navigateTo('flashcards')}
            className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs flex flex-col items-center text-center cursor-pointer hover:border-emerald-400 active:scale-95 transition"
          >
            <div className="w-12 h-12 rounded-xl bg-[#E8F3EE] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-2">
              <Layers className="w-6 h-6 stroke-[2]" />
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Flashcards</h4>
          </div>

          <div
            onClick={() => navigateTo('quiz')}
            className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs flex flex-col items-center text-center cursor-pointer hover:border-emerald-400 active:scale-95 transition"
          >
            <div className="w-12 h-12 rounded-xl bg-[#E8F3EE] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-2">
              <HelpCircle className="w-6 h-6 stroke-[2]" />
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Quiz</h4>
          </div>

          <div
            onClick={() => navigateTo('worksheet-gen')}
            className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs flex flex-col items-center text-center cursor-pointer hover:border-emerald-400 active:scale-95 transition"
          >
            <div className="w-12 h-12 rounded-xl bg-[#E8F3EE] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-2">
              <FileText className="w-6 h-6 stroke-[2]" />
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Worksheets</h4>
          </div>
        </div>
      </div>
    </div>
  );
};
