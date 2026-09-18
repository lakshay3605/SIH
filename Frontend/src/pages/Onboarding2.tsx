import React from 'react';
import { ArrowLeftRight, BookOpen, FileText, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Onboarding2: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <div className="w-full min-h-screen flex flex-col justify-between p-6 bg-[#FAF7EE] dark:bg-[#0E1513]">
      <div className="flex justify-end pt-2">
        <button
          onClick={() => navigateTo('home', 'home')}
          className="text-sm text-gray-500 font-semibold hover:text-[#0C5A3E] px-2 py-1"
        >
          Skip
        </button>
      </div>

      <div className="my-auto text-center space-y-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 leading-tight">
            Learn<br />Translate<br />Teach Together
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium mt-2">
            Supporting teachers in<br />tribal areas with AI
          </p>
        </div>

        {/* 2x2 Feature Cards Grid */}
        <div className="grid grid-cols-2 gap-3.5 pt-2 max-w-xs sm:max-w-sm mx-auto">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs flex flex-col items-center">
            <ArrowLeftRight className="w-7 h-7 text-[#0C5A3E] dark:text-[#34D399] mb-2 stroke-[1.8]" />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Translate</span>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs flex flex-col items-center">
            <BookOpen className="w-7 h-7 text-[#0C5A3E] dark:text-[#34D399] mb-2 stroke-[1.8]" />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Dictionary</span>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs flex flex-col items-center">
            <FileText className="w-7 h-7 text-[#0C5A3E] dark:text-[#34D399] mb-2 stroke-[1.8]" />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Worksheets</span>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs flex flex-col items-center">
            <Layers className="w-7 h-7 text-[#0C5A3E] dark:text-[#34D399] mb-2 stroke-[1.8]" />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Flashcards</span>
          </div>
        </div>

        {/* 3 Pagination Dots: ○ ● ○ */}
        <div className="flex justify-center items-center gap-2 pt-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#0C5A3E] dark:bg-[#34D399]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700"></span>
        </div>
      </div>

      <div className="pb-4">
        <button
          onClick={() => navigateTo('home', 'home')}
          className="w-full py-3.5 rounded-xl bg-[#0C5A3E] text-white text-sm font-bold shadow-md hover:bg-[#094731] active:scale-98 transition"
        >
          Next
        </button>
      </div>
    </div>
  );
};
