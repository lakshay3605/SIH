import React from 'react';
import { ChevronLeft, ArrowLeftRight, BookOpen, GraduationCap, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SamvaadLogo } from '../components/SamvaadLogo';

export const Home: React.FC = () => {
  const { navigateTo, goBack } = useApp();

  return (
    <div className="w-full h-full flex flex-col justify-between px-3.5 pt-3 pb-2 bg-[#FAF7EE] dark:bg-[#0E1513] select-none">
      {/* 1. Top Header: Back Arrow, Centered Samvaad Logo & Tagline */}
      <div className="w-full flex items-center justify-between pt-0.5">
        <button
          onClick={() => goBack()}
          className="w-8 h-8 flex items-center justify-center text-[#1A2621] dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition"
          aria-label="Go Back"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.6]" />
        </button>

        <div className="flex flex-col items-center justify-center text-center">
          <SamvaadLogo className="w-7 h-6 mb-1" />
          <h1 className="text-[21px] font-black text-[#0B4A33] dark:text-[#34D399] tracking-tight leading-none">
            Samvaad
          </h1>
          <p className="text-[11px] font-bold text-[#0B4A33] dark:text-[#34D399] mt-0.5 tracking-tight">
            भाषा से सीखें, साथ मिलकर बढ़ें
          </p>
        </div>

        {/* Right spacer to keep the center logo perfectly aligned */}
        <div className="w-8 h-8"></div>
      </div>

      {/* 2. Hero Banner: Exact Reference Illustrated Banner */}
      <div
        onClick={() => navigateTo('translate', 'translate')}
        className="w-full h-[165px] rounded-2xl overflow-hidden shadow-xs cursor-pointer active:scale-[0.99] transition my-2 border border-[#E8D080]/60 dark:border-[#42371E]"
      >
        <img
          src="/assets/home_banner_exact.png"
          alt="Teaching is easier when language is no longer a barrier."
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* 3. 2-Column Grid of 6 Feature Cards matching exact reference icons & typography */}
      <div className="grid grid-cols-2 gap-2.5 my-1">
        {/* Card 1: Translate */}
        <div
          onClick={() => navigateTo('translate', 'translate')}
          className="h-[96px] rounded-2xl bg-[#FAF8F2] dark:bg-[#15231E] border border-[#ECE5D6]/80 dark:border-[#20372E] shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500/50 active:scale-[0.98] transition px-2"
        >
          <ArrowLeftRight className="w-7 h-7 stroke-[2.4] text-[#0C5A3E] dark:text-[#34D399] mb-1.5" />
          <span className="text-[14px] font-bold text-[#1B2520] dark:text-gray-100 tracking-tight leading-none">
            Translate
          </span>
        </div>

        {/* Card 2: Dictionary */}
        <div
          onClick={() => navigateTo('dictionary')}
          className="h-[96px] rounded-2xl bg-[#FAF8F2] dark:bg-[#15231E] border border-[#ECE5D6]/80 dark:border-[#20372E] shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500/50 active:scale-[0.98] transition px-2"
        >
          <BookOpen className="w-7 h-7 stroke-[2.4] text-[#0C5A3E] dark:text-[#34D399] mb-1.5" />
          <span className="text-[14px] font-bold text-[#1B2520] dark:text-gray-100 tracking-tight leading-none">
            Dictionary
          </span>
        </div>

        {/* Card 3: Learn */}
        <div
          onClick={() => navigateTo('learning')}
          className="h-[96px] rounded-2xl bg-[#FAF8F2] dark:bg-[#15231E] border border-[#ECE5D6]/80 dark:border-[#20372E] shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500/50 active:scale-[0.98] transition px-2"
        >
          <GraduationCap className="w-7 h-7 stroke-[2.4] text-[#0C5A3E] dark:text-[#34D399] mb-1.5" />
          <span className="text-[14px] font-bold text-[#1B2520] dark:text-gray-100 tracking-tight leading-none">
            Learn
          </span>
        </div>

        {/* Card 4: Flashcards */}
        <div
          onClick={() => navigateTo('flashcards')}
          className="h-[96px] rounded-2xl bg-[#FAF8F2] dark:bg-[#15231E] border border-[#ECE5D6]/80 dark:border-[#20372E] shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500/50 active:scale-[0.98] transition px-2"
        >
          <Layers className="w-7 h-7 stroke-[2.4] text-[#0C5A3E] dark:text-[#34D399] mb-1.5" />
          <span className="text-[14px] font-bold text-[#1B2520] dark:text-gray-100 tracking-tight leading-none">
            Flashcards
          </span>
        </div>

        {/* Card 5: Quiz (Filled circle with white ?) */}
        <div
          onClick={() => navigateTo('quiz')}
          className="h-[96px] rounded-2xl bg-[#FAF8F2] dark:bg-[#15231E] border border-[#ECE5D6]/80 dark:border-[#20372E] shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500/50 active:scale-[0.98] transition px-2"
        >
          <div className="w-7 h-7 rounded-full bg-[#0C5A3E] text-white flex items-center justify-center mb-1.5">
            <span className="text-[15px] font-black leading-none -mt-0.5">?</span>
          </div>
          <span className="text-[14px] font-bold text-[#1B2520] dark:text-gray-100 tracking-tight leading-none">
            Quiz
          </span>
        </div>

        {/* Card 6: Worksheets (Document with horizontal lines) */}
        <div
          onClick={() => navigateTo('worksheet-gen')}
          className="h-[96px] rounded-2xl bg-[#FAF8F2] dark:bg-[#15231E] border border-[#ECE5D6]/80 dark:border-[#20372E] shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500/50 active:scale-[0.98] transition px-2"
        >
          <div className="w-6 h-7 rounded-md bg-[#0C5A3E] text-white flex flex-col justify-center items-center px-1 py-1 gap-1 mb-1.5">
            <div className="w-full h-0.5 bg-white rounded-full"></div>
            <div className="w-full h-0.5 bg-white rounded-full"></div>
            <div className="w-3/4 h-0.5 bg-white rounded-full self-start"></div>
          </div>
          <span className="text-[14px] font-bold text-[#1B2520] dark:text-gray-100 tracking-tight leading-none">
            Worksheets
          </span>
        </div>
      </div>
    </div>
  );
};
