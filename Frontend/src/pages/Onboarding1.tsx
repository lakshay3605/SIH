import React from 'react';
import { useApp } from '../context/AppContext';

export const Onboarding1: React.FC = () => {
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

      <div className="my-auto text-center space-y-3">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 leading-tight">
          Har Baccha Samjhe
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          Bridging languages<br />Building brighter futures
        </p>

        <div className="py-2 px-1 max-w-sm sm:max-w-md mx-auto">
          <img
            src="/assets/teacher_village.jpg"
            alt="Teacher with village children"
            className="w-full h-64 sm:h-76 object-cover rounded-2xl border border-[#E7DFCE] shadow-xs"
          />
        </div>

        {/* 3 Pagination Dots: ● ○ ○ */}
        <div className="flex justify-center items-center gap-2 pt-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0C5A3E] dark:bg-[#34D399]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700"></span>
        </div>
      </div>

      <div className="pb-4">
        <button
          onClick={() => navigateTo('onboarding2')}
          className="w-full py-3.5 rounded-xl bg-[#0C5A3E] text-white text-sm font-bold shadow-md hover:bg-[#094731] active:scale-98 transition"
        >
          Next
        </button>
      </div>
    </div>
  );
};
