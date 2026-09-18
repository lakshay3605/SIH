import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StateEmblem } from '../components/StateEmblem';
import { SamvaadLogo } from '../components/SamvaadLogo';

export const Splash: React.FC = () => {
  const { navigateTo } = useApp();

  // Android-style automatic splash transition after 3.2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigateTo('onboarding1');
    }, 3200);
    return () => clearTimeout(timer);
  }, [navigateTo]);

  return (
    <div
      onClick={() => navigateTo('onboarding1')}
      className="w-full min-h-screen flex flex-col justify-between items-center text-center px-6 pt-10 pb-8 bg-[#FAF7EE] dark:bg-[#0E1513] select-none cursor-pointer"
    >
      {/* Top: Official State Emblem of India + Government of Jharkhand */}
      <div className="w-full flex flex-col items-center pt-2">
        <StateEmblem className="w-11 h-14 mb-1.5" />
        <p className="text-xs font-semibold text-[#1A2621] dark:text-gray-200 tracking-normal leading-tight">
          Government of Jharkhand
        </p>
        <p className="text-base font-bold text-[#1A2621] dark:text-gray-100 leading-tight mt-0.5">
          झारखंड सरकार
        </p>
      </div>

      {/* Middle: Brand Logo, Title, Tagline, Subtitle */}
      <div className="w-full flex flex-col items-center mt-3">
        <SamvaadLogo className="w-14 h-11" />
        <h1 className="text-4xl sm:text-5xl font-black text-[#0F513A] dark:text-[#34D399] tracking-tight leading-none mt-2">
          Samvaad
        </h1>
        <p className="text-sm sm:text-base font-bold text-[#0F513A] dark:text-[#34D399] mt-1.5">
          भाषा से सीखें, साथ मिलकर बढ़ें
        </p>
        <p className="text-xs text-[#2C3E35] dark:text-gray-300 font-medium max-w-[280px] mx-auto mt-2 leading-snug">
          An initiative for Mother Tongue-Based<br />Multilingual Education (MTB-MLE)
        </p>
      </div>

      {/* Storybook Rural Teacher-and-Children Watercolor Illustration */}
      <div className="w-full max-w-sm sm:max-w-md px-1 my-4">
        <div className="w-full h-72 sm:h-84 rounded-2xl overflow-hidden shadow-sm border border-[#E7DFCE]">
          <img
            src="/assets/splash_teacher_children.jpg"
            alt="Female teacher teaching children in rural Jharkhand"
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>

      {/* Bottom Motto Text: Simple, official, clean typography */}
      <div className="w-full pb-2">
        <p className="text-base sm:text-lg font-bold text-[#0F513A] dark:text-[#34D399] tracking-wide">
          सबकी भाषा, बेहतर शिक्षा
        </p>
        {/* Subtle Home Indicator Line */}
        <div className="w-28 h-1 bg-[#2D4539]/25 rounded-full mx-auto mt-3"></div>
      </div>
    </div>
  );
};
