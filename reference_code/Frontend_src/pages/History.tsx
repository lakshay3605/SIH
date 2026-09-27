import React from 'react';
import { Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';

export const History: React.FC = () => {
  const {
    historyItems,
    historyFilter,
    setHistoryFilter,
    navigateTo,
    goBack,
  } = useApp();

  const filtered = historyItems.filter(
    item => historyFilter === 'All' || item.lang === historyFilter
  );

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title="Translation History" onBack={goBack} />

      <div className="p-4 sm:p-6 space-y-3.5 max-w-lg mx-auto w-full flex-1 overflow-y-auto">
        {/* Filter Chips: All | Hindi → Santali | Hindi → Mundari */}
        <div className="flex gap-2 text-xs sm:text-sm font-semibold">
          {(['All', 'Hindi → Santali', 'Hindi → Mundari'] as const).map(f => (
            <button
              key={f}
              onClick={() => setHistoryFilter(f)}
              className={`px-3.5 py-1.5 rounded-full transition ${
                historyFilter === f
                  ? 'bg-[#0C5A3E] text-white'
                  : 'bg-white dark:bg-[#15231E] border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* History List */}
        <div className="space-y-3 pt-1">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              onClick={() => navigateTo('translation-result')}
              className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs space-y-1 cursor-pointer hover:border-emerald-300 active:scale-98 transition"
            >
              <div className="flex justify-between items-start">
                <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">{item.hi}</p>
                <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
              </div>
              <p className="text-sm sm:text-base font-bold text-[#0C5A3E] dark:text-[#34D399] font-['Noto_Sans_Ol_Chiki']">
                → {item.sat}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-400 pt-0.5">{item.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
