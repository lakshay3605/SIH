import React, { useState, useEffect } from 'react';
import { CheckCircle2, RotateCcw, Trophy, ArrowRight, Play } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { worksheetSentences } from '../data/worksheetSentences';

export const Quiz: React.FC = () => {
  const { goBack } = useApp();

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);

  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const QUESTIONS_PER_LEVEL = 5;
  const TOTAL_LEVELS = 3;
  const TOTAL_QUESTIONS = QUESTIONS_PER_LEVEL * TOTAL_LEVELS;

  useEffect(() => {
    generateQuiz();
  }, []);

  const generateQuiz = () => {
    setIsFinished(false);
    setShowLevelComplete(false);
    setScore(0);
    setCurrentIdx(0);
    setSelectedOpt(null);
    setIsCorrect(null);

    const shuffled = [...worksheetSentences].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, TOTAL_QUESTIONS);

    const generated = selected.map(sentence => {
      // Hindi question, Santhali options
      const wrong = worksheetSentences
        .filter(s => s.id !== sentence.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(s => s.santhali);

      const options = [...wrong, sentence.santhali].sort(() => 0.5 - Math.random());

      return {
        ...sentence,
        options,
        answer: sentence.santhali
      };
    });

    setQuestions(generated);
  };

  if (questions.length === 0) return null;

  const currentLevel = Math.floor(currentIdx / QUESTIONS_PER_LEVEL) + 1;
  const currentLevelQuestionIdx = currentIdx % QUESTIONS_PER_LEVEL;

  const currentQ = questions[currentIdx];

  const handleSelect = (idx: number, answer: string) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);

    const correct = answer === currentQ.answer;
    setIsCorrect(correct);
    if (correct) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      if ((currentIdx + 1) % QUESTIONS_PER_LEVEL === 0) {
        setShowLevelComplete(true);
      } else {
        moveToNextQ();
      }
    } else {
      setIsFinished(true);
    }
  };

  const moveToNextQ = () => {
    setShowLevelComplete(false);
    setSelectedOpt(null);
    setIsCorrect(null);
    setCurrentIdx(i => i + 1);
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title={`Quiz - Level ${currentLevel}`} onBack={goBack} />

      <div className="p-4 sm:p-6 space-y-5 max-w-lg mx-auto w-full flex-1 flex flex-col justify-between">
        {isFinished ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 text-center pb-12 animate-in zoom-in duration-300">
            <div className="w-32 h-32 bg-emerald-100 dark:bg-[#0C5A3E]/30 rounded-full flex items-center justify-center shadow-inner">
              <Trophy className="w-16 h-16 text-yellow-500" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100">Champion!</h2>
              <p className="text-lg font-bold text-gray-500">You scored <span className="text-emerald-600 dark:text-emerald-400 font-black">{score}</span> out of {TOTAL_QUESTIONS}</p>
            </div>
            
            <div className="w-full space-y-3 pt-8">
              <button
                onClick={generateQuiz}
                className="w-full py-4 rounded-2xl bg-[#0C5A3E] text-white text-base sm:text-lg font-bold shadow-md hover:bg-[#094731] active:scale-95 transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> Play Again
              </button>
            </div>
          </div>
        ) : showLevelComplete ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 text-center pb-12 animate-in slide-in-from-bottom-8 duration-300">
            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-5xl">
              ⭐
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-blue-900 dark:text-blue-100">Level {currentLevel} Complete!</h2>
              <p className="text-base font-bold text-gray-500">Get ready for Level {currentLevel + 1}</p>
            </div>
            
            <div className="w-full pt-8">
              <button
                onClick={moveToNextQ}
                className="w-full py-4 rounded-2xl bg-blue-600 text-white text-base sm:text-lg font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition flex items-center justify-center gap-2"
              >
                Start Level {currentLevel + 1} <Play className="w-5 h-5 fill-current" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-5 flex-1 flex flex-col pt-1">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-black text-gray-400 tracking-wider">LEVEL {currentLevel}</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Score: {score}</span>
              </div>
              
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#0C5A3E] dark:bg-[#34D399] transition-all duration-300"
                    style={{ width: `${((currentLevelQuestionIdx + 1) / QUESTIONS_PER_LEVEL) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-gray-500">{currentLevelQuestionIdx + 1}/5</span>
              </div>

              <div className="pt-2 text-center">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 leading-snug">
                  "{currentQ.hindi}" का संताली में क्या अनुवाद है?
                </h3>
              </div>

              <div className="space-y-3 pt-2">
                {currentQ.options.map((opt: string, idx: number) => {
                  const isChosen = selectedOpt === idx;
                  const isCorrectAnswer = opt === currentQ.answer;

                  let btnStyle = "bg-white dark:bg-[#15231E] border-[#ECE7DA] dark:border-[#20372E] text-gray-800 dark:text-gray-200 hover:border-emerald-300";
                  let dotStyle = "border-gray-400";
                  
                  if (selectedOpt !== null) {
                    if (isCorrectAnswer) {
                      btnStyle = "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-300";
                      dotStyle = "border-green-500 bg-green-500";
                    } else if (isChosen) {
                      btnStyle = "bg-red-100 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-300";
                      dotStyle = "border-red-500 bg-red-500";
                    } else {
                      btnStyle = "bg-white dark:bg-[#15231E] border-[#ECE7DA] dark:border-[#20372E] text-gray-400 dark:text-gray-600 opacity-50";
                    }
                  }

                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelect(idx, opt)}
                      className={`p-4 rounded-2xl border flex items-center gap-3.5 cursor-pointer text-base font-semibold transition ${btnStyle} ${selectedOpt === null ? 'active:scale-98' : ''}`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${dotStyle}`}>
                        {selectedOpt !== null && (isCorrectAnswer || isChosen) && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                        )}
                      </div>
                      <span className="font-['Noto_Sans_Ol_Chiki'] text-lg">{opt}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleNext}
                disabled={selectedOpt === null}
                className={`w-full py-4 rounded-2xl text-white text-base sm:text-lg font-bold shadow-md transition flex items-center justify-center gap-2
                  ${selectedOpt === null ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-50' : 'bg-[#0C5A3E] hover:bg-[#094731] active:scale-95'}`}
              >
                {currentIdx < questions.length - 1 ? (
                  (currentIdx + 1) % QUESTIONS_PER_LEVEL === 0 ? 'Complete Level' : 'Next Question'
                ) : 'Finish Quiz'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
