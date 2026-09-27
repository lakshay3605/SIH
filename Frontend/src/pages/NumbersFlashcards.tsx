import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Volume2, RotateCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { numbersData } from '../data/numbersData';

export const NumbersFlashcards: React.FC = () => {
  const { goBack } = useApp();
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const card = numbersData[flashcardIdx];
  const [isFlipped, setIsFlipped] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const handleNext = () => {
    setIsFlipped(false);
    setFlashcardIdx(prev => (prev < numbersData.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setFlashcardIdx(prev => (prev > 0 ? prev - 1 : numbersData.length - 1));
  };

  const playAudio = (e: React.MouseEvent, audioPath: string) => {
    e.stopPropagation();
    if (audioPath) {
      if (playingAudio === audioPath) return; // avoid overlapping
      setPlayingAudio(audioPath);
      const audio = new Audio(audioPath);
      audio.onended = () => {
        setPlayingAudio(null);
      };
      audio.play();
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title="Numbers" onBack={goBack} />

      <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto w-full flex-1 flex flex-col justify-between">
        
        {/* Flashcard Container */}
        <div className="flex-1 flex flex-col justify-center perspective-1000 relative">
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className={`w-full h-[400px] sm:h-[450px] relative transition-all duration-500 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front of Card */}
            <div 
              className={`absolute inset-0 w-full h-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-sm flex flex-col items-center justify-center text-center space-y-6 ${isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
              style={{ backfaceVisibility: 'hidden', transition: 'opacity 0.3s' }}
            >
              <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
                <img
                  src={card.image}
                  alt={card.hindi}
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
              <div>
                <h3 className="text-4xl font-black text-gray-900 dark:text-gray-100">{card.hindi}</h3>
                <p className="text-base text-gray-500 font-medium mt-1">({card.translit})</p>
                <p className="text-sm text-gray-400 font-medium mt-2 capitalize">{card.english}</p>
              </div>
              <div className="text-gray-400 flex items-center gap-1.5 text-xs font-medium">
                <RotateCw className="w-3.5 h-3.5" /> Tap to reveal translation
              </div>
            </div>

            {/* Back of Card */}
            <div 
              className={`absolute inset-0 w-full h-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#15231E] border border-[#0C5A3E]/30 dark:border-[#34D399]/30 shadow-md flex flex-col items-center justify-center text-center space-y-8 ${!isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', transition: 'opacity 0.3s' }}
            >
              
              <div className="w-24 h-24 mb-2">
                <img src={card.image} alt={card.english} className="w-full h-full object-contain opacity-50" />
              </div>

              <div className="w-full space-y-6">
                {/* Santhali Row */}
                <div className="flex items-center justify-between bg-emerald-50 dark:bg-[#0C5A3E]/20 p-4 rounded-2xl">
                  <div className="text-left">
                    <span className="font-semibold text-gray-400 text-xs uppercase tracking-wider block mb-1">Santhali</span>
                    <span className="text-2xl font-bold text-[#0C5A3E] dark:text-[#34D399] font-['Noto_Sans_Ol_Chiki']">{card.santhali}</span>
                  </div>
                  <button 
                    onClick={(e) => playAudio(e, card.santhaliAudio)}
                    className={`w-12 h-12 rounded-full shadow-sm flex items-center justify-center transition active:scale-95 ${playingAudio === card.santhaliAudio ? 'bg-[#0C5A3E] text-white animate-pulse' : 'bg-white dark:bg-[#15231E] text-[#0C5A3E] dark:text-[#34D399] hover:bg-gray-50'}`}
                  >
                    <Volume2 className="w-6 h-6" />
                  </button>
                </div>

                {/* Mundari Row */}
                <div className="flex items-center justify-between bg-emerald-50 dark:bg-[#0C5A3E]/20 p-4 rounded-2xl">
                  <div className="text-left">
                    <span className="font-semibold text-gray-400 text-xs uppercase tracking-wider block mb-1">Mundari</span>
                    <span className="text-2xl font-bold text-[#0C5A3E] dark:text-[#34D399] font-['Noto_Sans_Nag_Mundari']">{card.mundari}</span>
                  </div>
                  <button 
                    onClick={(e) => playAudio(e, card.mundariAudio)}
                    disabled={!card.mundariAudio}
                    className={`w-12 h-12 rounded-full shadow-sm flex items-center justify-center transition active:scale-95 ${playingAudio === card.mundariAudio ? 'bg-[#0C5A3E] text-white animate-pulse' : !card.mundariAudio ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 opacity-50 cursor-not-allowed' : 'bg-white dark:bg-[#15231E] text-[#0C5A3E] dark:text-[#34D399] hover:bg-gray-50'}`}
                  >
                    <Volume2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="text-gray-400 flex items-center gap-1.5 text-xs font-medium mt-auto">
                <RotateCw className="w-3.5 h-3.5" /> Tap to flip back
              </div>
            </div>

          </div>
        </div>

        {/* Navigation Controls: <  1/10  > */}
        <div className="flex items-center justify-center gap-6 pb-4">
          <button
            onClick={handlePrev}
            className="w-12 h-12 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#15231E] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 shadow-xs active:scale-95 transition"
            aria-label="Previous card"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-base font-bold text-gray-700 dark:text-gray-300 min-w-[60px] text-center">
            {flashcardIdx + 1} / {numbersData.length}
          </span>
          <button
            onClick={handleNext}
            className="w-12 h-12 rounded-full bg-[#0C5A3E] text-white flex items-center justify-center shadow-md hover:bg-[#094731] active:scale-95 transition"
            aria-label="Next card"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
