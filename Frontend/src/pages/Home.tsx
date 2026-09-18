import React from 'react';
import { ChevronLeft, User, ArrowLeftRight, BookOpen, GraduationCap, Layers, HelpCircle, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SamvaadLogo } from '../components/SamvaadLogo';

export const Home: React.FC = () => {
  const { navigateTo, goBack } = useApp();

  return (
    <div className="w-full h-full flex flex-col justify-between px-4 pt-2.5 pb-2.5 bg-[#FAF7EE] dark:bg-[#0E1513] select-none">
      {/* 1. Header matching reference: Back Arrow, Centered Samvaad Logo & Tagline, Profile Icon */}
      <div className="w-full flex items-center justify-between pt-0.5">
        <button
          onClick={() => goBack()}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition"
          aria-label="Go Back"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.4]" />
        </button>

        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5">
            <SamvaadLogo className="w-6 h-5" />
            <span className="text-[19px] font-black text-[#0F513A] dark:text-[#34D399] tracking-tight leading-none">
              Samvaad
            </span>
          </div>
          <p className="text-[10.5px] font-bold text-[#0F513A] dark:text-[#34D399] mt-0.5 tracking-tight">
            भाषा से सीखें, साथ मिलकर बढ़ें
          </p>
        </div>

        <button
          onClick={() => navigateTo('settings')}
          className="w-9 h-9 rounded-full border border-gray-300/80 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition"
          aria-label="User Profile"
        >
          <User className="w-5 h-5 stroke-[1.8]" />
        </button>
      </div>

      {/* 2. Hero Banner: Warm Yellow Background with Storybook Art & Text */}
      <div
        onClick={() => navigateTo('translate', 'translate')}
        className="w-full h-[155px] rounded-2xl bg-[#FCE59F] dark:bg-[#2A2312] border border-[#EED076] dark:border-[#42371E] flex items-center justify-between overflow-hidden shadow-xs cursor-pointer hover:border-amber-400 transition relative"
      >
        <div className="flex-1 pl-4 pr-1 py-3 z-10 flex flex-col justify-center">
          <h3 className="text-[15.5px] font-extrabold text-[#202922] dark:text-[#F3EFE0] leading-[1.3] tracking-tight">
            Teaching is easier<br />
            when language<br />
            is no longer a barrier.
          </h3>
        </div>

        <div className="w-[155px] h-full relative shrink-0 overflow-hidden rounded-r-2xl">
          <img
            src="/assets/home_banner.jpg"
            alt="Teacher and students in village"
            className="w-full h-full object-cover object-[78%_center]"
          />
        </div>
      </div>

      {/* 3. 2-Column Grid of 6 Compact Feature Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Card 1: Translate */}
        <div
          onClick={() => navigateTo('translate', 'translate')}
          className="h-[96px] rounded-2xl bg-[#FCFAF5] dark:bg-[#15231E] border border-[#EBE3D3] dark:border-[#20372E] shadow-xs flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500/50 active:scale-[0.98] transition px-2"
        >
          <div className="w-9 h-9 rounded-xl bg-[#EAF4EF] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-1.5">
            <ArrowLeftRight className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[13px] font-bold text-[#1C2620] dark:text-gray-100 tracking-tight leading-tight">
            Translate
          </span>
        </div>

        {/* Card 2: Dictionary */}
        <div
          onClick={() => navigateTo('dictionary')}
          className="h-[96px] rounded-2xl bg-[#FCFAF5] dark:bg-[#15231E] border border-[#EBE3D3] dark:border-[#20372E] shadow-xs flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500/50 active:scale-[0.98] transition px-2"
        >
          <div className="w-9 h-9 rounded-xl bg-[#EAF4EF] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-1.5">
            <BookOpen className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[13px] font-bold text-[#1C2620] dark:text-gray-100 tracking-tight leading-tight">
            Dictionary
          </span>
        </div>

        {/* Card 3: Learn */}
        <div
          onClick={() => navigateTo('learning')}
          className="h-[96px] rounded-2xl bg-[#FCFAF5] dark:bg-[#15231E] border border-[#EBE3D3] dark:border-[#20372E] shadow-xs flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500/50 active:scale-[0.98] transition px-2"
        >
          <div className="w-9 h-9 rounded-xl bg-[#EAF4EF] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-1.5">
            <GraduationCap className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[13px] font-bold text-[#1C2620] dark:text-gray-100 tracking-tight leading-tight">
            Learn
          </span>
        </div>

        {/* Card 4: Flashcards */}
        <div
          onClick={() => navigateTo('flashcards')}
          className="h-[96px] rounded-2xl bg-[#FCFAF5] dark:bg-[#15231E] border border-[#EBE3D3] dark:border-[#20372E] shadow-xs flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500/50 active:scale-[0.98] transition px-2"
        >
          <div className="w-9 h-9 rounded-xl bg-[#EAF4EF] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-1.5">
            <Layers className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[13px] font-bold text-[#1C2620] dark:text-gray-100 tracking-tight leading-tight">
            Flashcards
          </span>
        </div>

        {/* Card 5: Quiz */}
        <div
          onClick={() => navigateTo('quiz')}
          className="h-[96px] rounded-2xl bg-[#FCFAF5] dark:bg-[#15231E] border border-[#EBE3D3] dark:border-[#20372E] shadow-xs flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500/50 active:scale-[0.98] transition px-2"
        >
          <div className="w-9 h-9 rounded-xl bg-[#EAF4EF] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-1.5">
            <HelpCircle className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[13px] font-bold text-[#1C2620] dark:text-gray-100 tracking-tight leading-tight">
            Quiz
          </span>
        </div>

        {/* Card 6: Worksheets */}
        <div
          onClick={() => navigateTo('worksheet-gen')}
          className="h-[96px] rounded-2xl bg-[#FCFAF5] dark:bg-[#15231E] border border-[#EBE3D3] dark:border-[#20372E] shadow-xs flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500/50 active:scale-[0.98] transition px-2"
        >
          <div className="w-9 h-9 rounded-xl bg-[#EAF4EF] dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center mb-1.5">
            <FileText className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[13px] font-bold text-[#1C2620] dark:text-gray-100 tracking-tight leading-tight">
            Worksheets
          </span>
        </div>
      </div>
    </div>
  );
};
