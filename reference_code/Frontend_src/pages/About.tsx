import React from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { StateEmblem } from '../components/StateEmblem';
import { SamvaadLogo } from '../components/SamvaadLogo';

export const About: React.FC = () => {
  const { goBack } = useApp();

  return (
    <div className="w-full flex-1 flex flex-col justify-between items-center text-center p-6 bg-[#FAF7EE] dark:bg-[#0E1513] select-none">
      <Header title="About Samvaad" onBack={goBack} showMore={false} />

      <div className="pt-4 space-y-1.5 max-w-sm mx-auto">
        <div className="w-14 h-12 mx-auto flex items-center justify-center">
          <SamvaadLogo className="w-12 h-10" />
        </div>
        <h2 className="text-3xl font-black text-[#0C5A3E] dark:text-[#34D399] tracking-tight">Samvaad</h2>
        <p className="text-xs sm:text-sm font-bold text-[#0C5A3E] dark:text-[#34D399]">भाषा से सीखें, साथ मिलकर बढ़ें</p>
      </div>

      <div className="my-auto space-y-3.5 w-full max-w-sm sm:max-w-md">
        <div className="flex flex-col items-center">
          <StateEmblem className="w-10 h-12 mb-1" />
          <p className="text-xs font-semibold text-[#1C362B] dark:text-[#34D399] uppercase">Government of Jharkhand</p>
          <p className="text-sm font-bold text-[#1C362B] dark:text-gray-100">झारखंड सरकार</p>
        </div>

        <div className="px-1">
          <img
            src="/assets/splash_teacher_children.jpg"
            alt="Storybook Rural Landscape"
            className="w-full h-56 sm:h-64 object-cover rounded-2xl border border-[#E7DFCE] shadow-xs"
          />
        </div>
      </div>

      <div className="w-full pb-4">
        <p className="text-base font-bold text-[#0C5A3E] dark:text-[#34D399] tracking-wide">
          सबकी भाषा, बेहतर शिक्षा
        </p>
        <p className="text-xs text-[#3E5C4E] dark:text-gray-400 mt-1">Stronger Roots • Brighter Futures</p>
        <div className="w-28 h-1 bg-[#2D4539]/20 rounded-full mx-auto mt-3"></div>
      </div>
    </div>
  );
};
