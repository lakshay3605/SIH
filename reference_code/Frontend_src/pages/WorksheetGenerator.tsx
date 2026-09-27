import React from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';

export const WorksheetGenerator: React.FC = () => {
  const {
    wsClass,
    wsTopic,
    wsLanguage,
    wsType,
    navigateTo,
    goBack,
  } = useApp();

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title="Generate Worksheet" onBack={goBack} />

      <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto w-full flex-1 overflow-y-auto">
        <div className="space-y-3.5 text-left pt-1">
          <div>
            <label className="text-xs sm:text-sm font-bold text-gray-500 block mb-1">Class</label>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] text-sm font-bold flex justify-between items-center text-gray-800 dark:text-gray-100">
              <span>{wsClass}</span>
              <span className="text-gray-400">▾</span>
            </div>
          </div>

          <div>
            <label className="text-xs sm:text-sm font-bold text-gray-500 block mb-1">Topic</label>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] text-sm font-bold flex justify-between items-center text-gray-800 dark:text-gray-100">
              <span>{wsTopic}</span>
              <span className="text-gray-400">▾</span>
            </div>
          </div>

          <div>
            <label className="text-xs sm:text-sm font-bold text-gray-500 block mb-1">Language</label>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] text-sm font-bold flex justify-between items-center text-gray-800 dark:text-gray-100">
              <span>{wsLanguage}</span>
              <span className="text-gray-400">▾</span>
            </div>
          </div>

          <div>
            <label className="text-xs sm:text-sm font-bold text-gray-500 block mb-1">Worksheet Type</label>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] text-sm font-bold flex justify-between items-center text-gray-800 dark:text-gray-100">
              <span>{wsType}</span>
              <span className="text-gray-400">▾</span>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={() => navigateTo('worksheet-preview')}
            className="w-full py-3.5 rounded-xl bg-[#0C5A3E] text-white text-sm sm:text-base font-bold shadow-md hover:bg-[#094731] active:scale-98 transition"
          >
            Generate
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center leading-relaxed pt-1">
          ℹ Worksheet will be saved offline.<br />You can print or share it.
        </p>
      </div>
    </div>
  );
};
