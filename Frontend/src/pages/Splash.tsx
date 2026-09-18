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
      className="w-full h-full flex flex-col justify-between items-center text-center px-6 pt-9 pb-6 bg-[#FAF7EE] dark:bg-[#0E1513] select-none cursor-pointer"
    >
      {/* 1. Top Section: Official State Emblem of India + Government of Jharkhand */}
      <div className="w-full flex flex-col items-center pt-1">
        <StateEmblem className="w-11 h-14 mb-1.5" />
        <p className="text-xs font-semibold text-[#1A2621] dark:text-gray-200 tracking-normal leading-tight">
          Government of Jharkhand
        </p>
        <p className="text-base font-bold text-[#1A2621] dark:text-gray-100 leading-tight mt-0.5">
          झारखंड सरकार
        </p>
      </div>

      {/* 2. Middle Section: Samvaad Branding (Leaves + Title + Taglines) */}
      <div className="w-full flex flex-col items-center mt-2">
        <SamvaadLogo className="w-14 h-11" />
        <h1 className="text-[38px] font-black text-[#0F513A] dark:text-[#34D399] tracking-tight leading-none mt-1.5">
          Samvaad
        </h1>
        <p className="text-sm font-bold text-[#0F513A] dark:text-[#34D399] mt-1">
          भाषा से सीखें, साथ मिलकर बढ़ें
        </p>
        <p className="text-xs text-[#2C3E35] dark:text-gray-300 font-medium max-w-[270px] mx-auto mt-1.5 leading-snug">
          An initiative for Mother Tongue-Based<br />Multilingual Education (MTB-MLE)
        </p>
      </div>

      {/* 3. Large Storybook Teacher-and-Children Illustration */}
      <div className="w-full px-1 my-1">
        <div className="w-full h-[340px] rounded-2xl overflow-hidden">
          <img
            src="/assets/splash_teacher_children.jpg"
            alt="Female teacher teaching children in rural Jharkhand"
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>

      {/* 4. Bottom Section: Tagline */}
      <div className="w-full pb-2">
        <p className="text-[17px] font-bold text-[#0F513A] dark:text-[#34D399] tracking-wide">
          सबकी भाषा, बेहतर शिक्षा
        </p>
      </div>
    </div>
  );
};
