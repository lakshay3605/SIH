import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';

export const Flashcards: React.FC = () => {
  const { flashcards, flashcardIdx, setFlashcardIdx, goBack } = useApp();
  const card = flashcards[flashcardIdx];

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title="Flashcards" onBack={goBack} />

      <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto w-full flex-1 flex flex-col justify-between">
        <div className="my-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
            <img
              src={card.image}
              alt={card.hindi}
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>

          <div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-gray-100">{card.hindi}</h3>
            <p className="text-sm text-gray-500 font-medium">({card.translit})</p>
          </div>

          <div className="pt-4 text-sm space-y-1.5 border-t border-gray-100 dark:border-gray-800 w-full">
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold text-gray-400">Santali: </span>
              <span className="font-bold text-[#0C5A3E] dark:text-[#34D399] font-['Noto_Sans_Ol_Chiki']">{card.santali}</span>
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold text-gray-400">Mundari: </span>
              <span className="font-bold text-[#0C5A3E] dark:text-[#34D399] font-['Noto_Sans_Ol_Chiki']">{card.mundari}</span>
            </p>
            <p className="text-xs text-gray-400 font-medium">({card.english})</p>
          </div>
        </div>

        {/* Navigation Controls: <  1/10  > */}
        <div className="flex items-center justify-center gap-6 pb-2">
          <button
            onClick={() => setFlashcardIdx(prev => (prev > 0 ? prev - 1 : flashcards.length - 1))}
            className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#15231E] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 shadow-xs active:scale-95 transition"
            aria-label="Previous card"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{flashcardIdx + 1} / {flashcards.length}</span>
          <button
            onClick={() => setFlashcardIdx(prev => (prev < flashcards.length - 1 ? prev + 1 : 0))}
            className="w-10 h-10 rounded-full bg-[#0C5A3E] text-white flex items-center justify-center shadow-md hover:bg-[#094731] active:scale-95 transition"
            aria-label="Next card"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
