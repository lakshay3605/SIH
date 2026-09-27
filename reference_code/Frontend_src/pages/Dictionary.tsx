import React from 'react';
import { Search, Volume2, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { LanguageCode } from '../types';

export const Dictionary: React.FC = () => {
  const {
    dictionaryItems,
    dictFilter,
    setDictFilter,
    dictSearch,
    setDictSearch,
    playSpeech,
    goBack,
  } = useApp();

  const filtered = dictionaryItems.filter(w =>
    !dictSearch ||
    w.hindi.includes(dictSearch) ||
    w.english.toLowerCase().includes(dictSearch.toLowerCase()) ||
    w.santali.includes(dictSearch)
  );

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title="Dictionary" onBack={goBack} />

      <div className="p-4 sm:p-6 space-y-3.5 max-w-lg mx-auto w-full flex-1 overflow-y-auto">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={dictSearch}
            onChange={(e) => setDictSearch(e.target.value)}
            placeholder="Search word (Hindi / Santali / Mundari)"
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] text-xs sm:text-sm outline-none placeholder:text-gray-400 text-gray-900 dark:text-gray-100 shadow-2xs"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 text-xs sm:text-sm font-semibold">
          {(['All', 'Hindi', 'Santali', 'Mundari'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setDictFilter(tab as any)}
              className={`px-3 py-1.5 rounded-full transition ${
                dictFilter === tab
                  ? 'bg-[#0C5A3E] text-white'
                  : 'bg-white dark:bg-[#15231E] border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Word Cards */}
        <div className="space-y-3 pt-1">
          {filtered.map((w, idx) => (
            <div key={idx} className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100">{w.hindi}</h4>
                  <p className="text-xs text-gray-400">(Hindi)</p>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <button onClick={() => playSpeech(w.hindi)} className="hover:text-[#0C5A3E] p-1">
                    <Volume2 className="w-5 h-5 text-[#0C5A3E] dark:text-[#34D399]" />
                  </button>
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                </div>
              </div>

              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <p><span className="font-semibold text-gray-400">Santali:</span> <span className="font-bold text-gray-900 dark:text-gray-100 font-['Noto_Sans_Ol_Chiki']">{w.santali}</span></p>
                <p><span className="font-semibold text-gray-400">Mundari:</span> <span className="font-bold text-gray-900 dark:text-gray-100 font-['Noto_Sans_Ol_Chiki']">{w.mundari}</span></p>
                <p className="text-[11px] text-gray-400">({w.english})</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
