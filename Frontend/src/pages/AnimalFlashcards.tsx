import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, Volume2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { animalData } from '../data/animalData';

export const AnimalFlashcards: React.FC = () => {
  const { goBack } = useApp();
  
  const [selectedLang, setSelectedLang] = useState<'Santhali' | 'Mundari'>('Santhali');
  const [idx, setIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const card = animalData[idx];
  
  const fontClass = selectedLang === 'Santhali' 
    ? "font-['Noto_Sans_Ol_Chiki'] text-[#0C5A3E] dark:text-[#34D399]" 
    : "font-['Noto_Sans_Nag_Mundari'] text-[#D97706] dark:text-amber-400";
    
  const backCardClass = selectedLang === 'Santhali'
    ? "bg-[#0C5A3E] dark:bg-[#08422D] border-[#0C5A3E]"
    : "bg-[#D97706] dark:bg-[#92400E] border-[#D97706]";

  const watermarkClass = selectedLang === 'Santhali'
    ? "text-emerald-100/20"
    : "text-amber-100/20";
    
  const accentClass = selectedLang === 'Santhali'
    ? "text-emerald-200"
    : "text-amber-200";

  // Stop audio when unmounting or changing card/language
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [idx, selectedLang]);

  const playAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audioUrl = selectedLang === 'Santhali' ? card.santhaliAudio : card.mundariAudio;
    audioRef.current = new Audio(audioUrl);
    audioRef.current.play();
  };

  const handleNext = () => {
    setIsFlipped(false);
    setIdx(prev => (prev < animalData.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setIdx(prev => (prev > 0 ? prev - 1 : animalData.length - 1));
  };

  const switchTab = (lang: 'Santhali' | 'Mundari') => {
    if (lang !== selectedLang) {
      setSelectedLang(lang);
      setIdx(0);
      setIsFlipped(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title="Flashcards (Animals)" onBack={goBack} />

      <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto w-full flex-1 flex flex-col justify-between">
        
        {/* Language Tabs */}
        <div className="flex gap-2 p-1 bg-white dark:bg-[#15231E] rounded-full border border-[#ECE7DA] dark:border-[#20372E] shadow-sm shrink-0">
          <button
            onClick={() => switchTab('Santhali')}
            className={`flex-1 py-2.5 rounded-full font-bold text-sm transition-all ${
              selectedLang === 'Santhali'
                ? 'bg-[#0C5A3E] text-white shadow-md'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Santhali (संताली)
          </button>
          <button
            onClick={() => switchTab('Mundari')}
            className={`flex-1 py-2.5 rounded-full font-bold text-sm transition-all ${
              selectedLang === 'Mundari'
                ? 'bg-[#D97706] text-white shadow-md'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Mundari (मुंडारी)
          </button>
        </div>

        {/* Flashcard Container */}
        <div className="flex-1 flex flex-col justify-center perspective-1000 relative mt-2">
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
              <div className={`w-48 h-48 sm:w-56 sm:h-56 flex flex-col items-center justify-center rounded-3xl shadow-inner overflow-hidden ${selectedLang === 'Santhali' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                <img src={card.image} alt={card.english} className="w-full h-full object-contain p-4 drop-shadow-md" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-[#1A2621] dark:text-gray-100">{card.hindi}</h2>
                <p className="text-lg text-gray-500 font-bold mt-1">{card.english}</p>
              </div>
              <div className="text-gray-400 flex items-center gap-1.5 text-xs font-medium">
                <RotateCw className="w-3.5 h-3.5" /> अनुवाद के लिए टैप करें
              </div>
            </div>

            {/* Back of Card */}
            <div 
              className={`absolute inset-0 w-full h-full p-6 sm:p-8 rounded-3xl border shadow-md flex flex-col items-center justify-center text-center space-y-8 ${backCardClass} ${!isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', transition: 'opacity 0.3s' }}
            >
              <div className="absolute top-8 right-8 opacity-20 pointer-events-none">
                <img src={card.image} alt="watermark" className="w-32 h-32 object-contain grayscale" />
              </div>
              
              <div className="w-full space-y-6 z-10 flex flex-col items-center justify-center h-full pt-8">
                <button
                  onClick={playAudio}
                  className="w-24 h-24 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-lg border border-white/30 mb-4 active:scale-95"
                >
                  <Volume2 className="w-12 h-12" />
                </button>
                <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 w-full">
                  <span className={`font-semibold text-sm uppercase tracking-wider block mb-2 ${accentClass}`}>भाषा</span>
                  <span className="text-2xl font-bold text-white capitalize">{selectedLang}</span>
                </div>
              </div>
              
              <div className={`flex items-center gap-1.5 text-xs font-medium mt-auto z-10 ${accentClass} opacity-80`}>
                <RotateCw className="w-3.5 h-3.5" /> पीछे पलटने के लिए टैप करें
              </div>
            </div>

          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-center gap-6 pb-4">
          <button
            onClick={handlePrev}
            className="w-12 h-12 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#15231E] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 shadow-xs active:scale-95 transition"
            aria-label="Previous card"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-base font-bold text-gray-700 dark:text-gray-300 min-w-[60px] text-center">
            {idx + 1} / {animalData.length}
          </span>
          <button
            onClick={handleNext}
            className={`w-12 h-12 rounded-full text-white flex items-center justify-center shadow-md active:scale-95 transition ${selectedLang === 'Santhali' ? 'bg-[#0C5A3E] hover:bg-[#094731]' : 'bg-[#D97706] hover:bg-[#B45309]'}`}
            aria-label="Next card"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
