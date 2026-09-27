import React, { useState, useEffect } from 'react';
import { CheckCircle2, RotateCcw, Trophy, ArrowRight, Play, Link as LinkIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { worksheetSentences } from '../data/worksheetSentences';

export const WorksheetPreview: React.FC = () => {
  const { wsLanguage, wsType, goBack } = useApp();
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  
  // MCQ & Blanks state
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  // Match state
  const [matchSelectedLeft, setMatchSelectedLeft] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]); // stores left indices
  const [rightOptions, setRightOptions] = useState<{text: string, originalIndex: number}[]>([]);
  const [wrongMatch, setWrongMatch] = useState<{left: number, right: number} | null>(null);

  const [score, setScore] = useState(0);
  
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const QUESTIONS_PER_LEVEL = 5;
  const TOTAL_LEVELS = 3;
  const TOTAL_QUESTIONS = QUESTIONS_PER_LEVEL * TOTAL_LEVELS;

  useEffect(() => {
    generateWorksheet();
  }, [wsLanguage, wsType]);

  const generateWorksheet = () => {
    setIsFinished(false);
    setShowLevelComplete(false);
    setScore(0);
    setCurrentIdx(0);
    setSelectedOpt(null);
    setIsCorrect(null);
    setMatchedPairs([]);
    setMatchSelectedLeft(null);

    // Pick random sentences for 3 levels
    const shuffled = [...worksheetSentences].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, TOTAL_QUESTIONS);
    
    const generated = selected.map(sentence => {
      const wrong = worksheetSentences
        .filter(s => s.id !== sentence.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(s => s.hindi);
      
      const options = [...wrong, sentence.hindi].sort(() => 0.5 - Math.random());
      
      const words = sentence.hindi.split(' ');
      const blankIdx = Math.floor(Math.random() * words.length);
      const answerWord = words[blankIdx];
      const blankedHindi = words.map((w, i) => i === blankIdx ? '_____' : w).join(' ');

      const wrongWords = worksheetSentences
        .filter(s => s.id !== sentence.id)
        .map(s => s.hindi.split(' ')[0] || '') 
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      
      const blankOptions = [...wrongWords, answerWord].sort(() => 0.5 - Math.random());

      return {
        ...sentence,
        options,
        answer: sentence.hindi,
        blankedHindi,
        answerWord,
        blankOptions
      };
    });
    
    setQuestions(generated);
  };

  const currentLevel = Math.floor(currentIdx / QUESTIONS_PER_LEVEL) + 1;
  const currentLevelQuestionIdx = currentIdx % QUESTIONS_PER_LEVEL;
  const mode = wsType === 'mix' ? (currentIdx % 2 === 0 ? 'mcq' : 'blanks') : wsType;

  // Setup match options when level changes and mode is match
  useEffect(() => {
    if (questions.length > 0 && mode === 'match') {
      const levelQs = questions.slice((currentLevel - 1) * QUESTIONS_PER_LEVEL, currentLevel * QUESTIONS_PER_LEVEL);
      const shuffledRight = levelQs.map((q, i) => ({ text: q.hindi, originalIndex: i })).sort(() => Math.random() - 0.5);
      setRightOptions(shuffledRight);
      setMatchedPairs([]);
      setMatchSelectedLeft(null);
    }
  }, [currentLevel, questions, mode]);

  if (questions.length === 0) return null;

  const currentQ = questions[currentIdx];
  const questionLangText = wsLanguage === 'Santhali' ? currentQ.santhali : currentQ.mundari;
  const fontClass = wsLanguage === 'Santhali' ? 'font-["Noto_Sans_Ol_Chiki"]' : 'font-["Noto_Sans_Nag_Mundari"]';

  const handleSelectMCQ = (idx: number, answer: string) => {
    if (selectedOpt !== null) return; 
    setSelectedOpt(idx);
    
    const correct = mode === 'blanks' ? answer === currentQ.answerWord : answer === currentQ.answer;
    setIsCorrect(correct);
    if (correct) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (mode === 'match') {
      // In match mode, jumping to next level means jumping currentIdx by QUESTIONS_PER_LEVEL
      const nextIdx = currentLevel * QUESTIONS_PER_LEVEL;
      if (nextIdx < questions.length) {
        setShowLevelComplete(true);
      } else {
        setIsFinished(true);
      }
    } else {
      if (currentIdx < questions.length - 1) {
        if ((currentIdx + 1) % QUESTIONS_PER_LEVEL === 0) {
          setShowLevelComplete(true);
        } else {
          moveToNextQ();
        }
      } else {
        setIsFinished(true);
      }
    }
  };

  const moveToNextQ = () => {
    setShowLevelComplete(false);
    setSelectedOpt(null);
    setIsCorrect(null);
    if (mode === 'match') {
      setCurrentIdx(currentLevel * QUESTIONS_PER_LEVEL);
    } else {
      setCurrentIdx(i => i + 1);
    }
  };

  const handleMatchLeftClick = (index: number) => {
    if (matchedPairs.includes(index)) return;
    setMatchSelectedLeft(index === matchSelectedLeft ? null : index);
    setWrongMatch(null);
  };

  const handleMatchRightClick = (rightItem: {text: string, originalIndex: number}, rightRenderIndex: number) => {
    if (matchSelectedLeft === null) return;
    if (matchedPairs.includes(rightItem.originalIndex)) return;

    if (matchSelectedLeft === rightItem.originalIndex) {
      // Correct match
      setMatchedPairs(prev => [...prev, matchSelectedLeft]);
      setScore(s => s + 1);
      setMatchSelectedLeft(null);
      setWrongMatch(null);
    } else {
      // Wrong match
      setWrongMatch({ left: matchSelectedLeft, right: rightRenderIndex });
      setTimeout(() => setWrongMatch(null), 800);
      setMatchSelectedLeft(null);
    }
  };

  const renderMatchMode = () => {
    const levelQs = questions.slice((currentLevel - 1) * QUESTIONS_PER_LEVEL, currentLevel * QUESTIONS_PER_LEVEL);
    
    return (
      <div className="flex-1 flex flex-col space-y-4 pt-2 animate-in fade-in">
        <div className="flex justify-between items-center px-1 mb-2">
          <span className="text-sm font-black text-gray-400 tracking-wider">LEVEL {currentLevel}/{TOTAL_LEVELS}</span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Score: {score}</span>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center border border-emerald-100 dark:border-emerald-800">
          <p className="text-sm font-bold text-[#0C5A3E] dark:text-[#34D399]">Match the correct translations!</p>
        </div>

        <div className="flex-1 flex gap-3 relative">
          {/* Left Column (Target Language) */}
          <div className="flex-1 flex flex-col gap-3">
            {levelQs.map((q, i) => {
              const isMatched = matchedPairs.includes(i);
              const isSelected = matchSelectedLeft === i;
              const isWrong = wrongMatch?.left === i;

              let btnClass = "bg-white dark:bg-[#15231E] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200";
              if (isMatched) btnClass = "bg-green-100 dark:bg-green-900/40 border-green-400 text-green-800 dark:text-green-300 opacity-60";
              else if (isWrong) btnClass = "bg-red-100 dark:bg-red-900/40 border-red-400 text-red-800 dark:text-red-300";
              else if (isSelected) btnClass = "bg-[#0C5A3E] border-[#0C5A3E] text-white shadow-md ring-2 ring-[#0C5A3E] ring-offset-2 dark:ring-offset-[#0E1513] scale-[1.02]";

              return (
                <button
                  key={`left-${i}`}
                  onClick={() => handleMatchLeftClick(i)}
                  disabled={isMatched}
                  className={`flex-1 min-h-[70px] p-3 rounded-xl border text-sm sm:text-base font-bold transition-all duration-200 flex items-center justify-center text-center ${fontClass} ${btnClass}`}
                >
                  {wsLanguage === 'Santhali' ? q.santhali : q.mundari}
                </button>
              );
            })}
          </div>

          {/* Right Column (Hindi) */}
          <div className="flex-1 flex flex-col gap-3">
            {rightOptions.map((opt, renderIdx) => {
              const isMatched = matchedPairs.includes(opt.originalIndex);
              const isWrong = wrongMatch?.right === renderIdx;
              
              let btnClass = "bg-white dark:bg-[#15231E] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200";
              if (isMatched) btnClass = "bg-green-100 dark:bg-green-900/40 border-green-400 text-green-800 dark:text-green-300 opacity-60";
              else if (isWrong) btnClass = "bg-red-100 dark:bg-red-900/40 border-red-400 text-red-800 dark:text-red-300";
              else if (matchSelectedLeft !== null) btnClass += " hover:border-[#0C5A3E] cursor-pointer shadow-sm";

              return (
                <button
                  key={`right-${renderIdx}`}
                  onClick={() => handleMatchRightClick(opt, renderIdx)}
                  disabled={isMatched || matchSelectedLeft === null}
                  className={`flex-1 min-h-[70px] p-3 rounded-xl border text-sm sm:text-base font-bold transition-all duration-200 flex items-center justify-center text-center ${btnClass}`}
                >
                  {opt.text}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleNext}
            disabled={matchedPairs.length !== QUESTIONS_PER_LEVEL}
            className={`w-full py-4 rounded-2xl text-white text-base sm:text-lg font-bold shadow-md transition flex items-center justify-center gap-2
              ${matchedPairs.length !== QUESTIONS_PER_LEVEL ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-50' : 'bg-[#0C5A3E] hover:bg-[#094731] active:scale-95'}`}
          >
            {currentLevel < TOTAL_LEVELS ? 'Complete Level' : 'Finish Game'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderMCQMode = () => {
    return (
      <div className="space-y-6 flex-1 flex flex-col pt-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-sm font-black text-gray-400 tracking-wider">LEVEL {currentLevel}/{TOTAL_LEVELS}</span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Score: {score}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5">
          <div 
            className="bg-[#0C5A3E] dark:bg-[#34D399] h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${((currentLevelQuestionIdx + 1) / QUESTIONS_PER_LEVEL) * 100}%` }}
          ></div>
        </div>
        
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-sm flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">{wsLanguage}</span>
          <h3 className={`text-2xl sm:text-3xl font-bold ${fontClass} leading-relaxed text-[#0C5A3E] dark:text-[#34D399]`}>
            {questionLangText}
          </h3>
        </div>

        <div className="space-y-3">
          {currentQ.options.map((opt: string, idx: number) => {
            
            const isSelected = selectedOpt === idx;
            const isCorrectAnswer = opt === currentQ.answer;
            
            let btnStyle = "bg-white dark:bg-[#15231E] border-[#ECE7DA] dark:border-[#20372E] text-gray-800 dark:text-gray-100 hover:bg-gray-50";
            
            if (selectedOpt !== null) {
              if (isCorrectAnswer) {
                btnStyle = "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:border-green-500 dark:text-green-300";
              } else if (isSelected && !isCorrectAnswer) {
                btnStyle = "bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:border-red-500 dark:text-red-300";
              } else {
                btnStyle = "bg-gray-50 border-gray-200 text-gray-400 dark:bg-[#1A2622] dark:border-gray-800 dark:text-gray-600 opacity-50";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectMCQ(idx, opt)}
                disabled={selectedOpt !== null}
                className={`w-full p-4 rounded-xl border text-left text-base sm:text-lg font-bold transition flex justify-between items-center ${btnStyle} ${selectedOpt === null ? 'active:scale-95' : ''}`}
              >
                <span>{opt}</span>
                {selectedOpt !== null && isCorrectAnswer && <CheckCircle2 className="w-5 h-5 text-green-500 animate-in zoom-in" />}
              </button>
            );
          })}
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
            ) : 'Finish Game'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderBlanksMode = () => {
    return (
      <div className="space-y-6 flex-1 flex flex-col pt-2 animate-in fade-in">
        <div className="flex justify-between items-center px-1">
          <span className="text-sm font-black text-gray-400 tracking-wider">LEVEL {currentLevel}/{TOTAL_LEVELS}</span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Score: {score}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5">
          <div 
            className="bg-[#0C5A3E] dark:bg-[#34D399] h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${((currentLevelQuestionIdx + 1) / QUESTIONS_PER_LEVEL) * 100}%` }}
          ></div>
        </div>
        
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-sm flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">{wsLanguage}</span>
          <h3 className={`text-2xl sm:text-3xl font-bold ${fontClass} leading-relaxed text-[#0C5A3E] dark:text-[#34D399]`}>
            {questionLangText}
          </h3>
          
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 w-full">
            <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mt-2 leading-relaxed flex flex-wrap justify-center gap-x-2 items-center">
              {currentQ.blankedHindi.split('_____').map((part: string, idx: number, arr: string[]) => (
                <React.Fragment key={idx}>
                  <span>{part}</span>
                  {idx < arr.length - 1 && (
                    <span className={`inline-block min-w-[80px] sm:min-w-[100px] border-b-[3px] text-center pb-1 px-3 transition-all duration-300 ${
                      selectedOpt !== null 
                        ? (isCorrect ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-red-500 text-red-600 dark:text-red-400')
                        : 'border-gray-300 dark:border-gray-600 text-transparent'
                    }`}>
                      {selectedOpt !== null ? currentQ.blankOptions[selectedOpt] : 'word'}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </p>
          </div>
        </div>

        {/* Word Bank */}
        <div className="flex-1 flex flex-col justify-end pb-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {currentQ.blankOptions.map((opt: string, idx: number) => {
              const isSelected = selectedOpt === idx;
              const isCorrectAnswer = opt === currentQ.answerWord;
              
              let btnStyle = "bg-white dark:bg-[#15231E] border-gray-200 dark:border-[#20372E] text-gray-800 dark:text-gray-100 shadow-sm";
              
              if (selectedOpt !== null) {
                if (isSelected) {
                  if (isCorrectAnswer) btnStyle = "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/40 dark:border-green-500 dark:text-green-300 ring-2 ring-green-500 ring-offset-2 dark:ring-offset-[#0E1513] scale-[1.02]";
                  else btnStyle = "bg-red-100 border-red-500 text-red-800 dark:bg-red-900/40 dark:border-red-500 dark:text-red-300 ring-2 ring-red-500 ring-offset-2 dark:ring-offset-[#0E1513] scale-[1.02]";
                } else {
                  btnStyle = "bg-gray-50 border-gray-100 text-gray-300 dark:bg-[#15231E]/50 dark:border-gray-800 dark:text-gray-600 opacity-40 scale-95";
                }
              } else {
                btnStyle += " hover:bg-gray-50 dark:hover:bg-[#1A2622] hover:border-[#0C5A3E] dark:hover:border-[#34D399] active:scale-95 cursor-pointer";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectMCQ(idx, opt)}
                  disabled={selectedOpt !== null}
                  className={`py-4 px-2 rounded-2xl border-2 text-center text-lg sm:text-xl font-bold transition-all duration-300 ${btnStyle}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <button
            onClick={handleNext}
            disabled={selectedOpt === null}
            className={`w-full py-4 rounded-2xl text-white text-base sm:text-lg font-bold shadow-md transition flex items-center justify-center gap-2
              ${selectedOpt === null ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-50' : 'bg-[#0C5A3E] hover:bg-[#094731] active:scale-95'}`}
          >
            {currentIdx < questions.length - 1 ? (
              (currentIdx + 1) % QUESTIONS_PER_LEVEL === 0 ? 'Complete Level' : 'Next Question'
            ) : 'Finish Game'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title={`Level ${currentLevel}`} onBack={goBack} />

      <div className="p-4 sm:p-6 space-y-6 max-w-lg mx-auto w-full flex-1 flex flex-col justify-between">
        
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
                onClick={generateWorksheet}
                className="w-full py-4 rounded-2xl bg-[#0C5A3E] text-white text-base sm:text-lg font-bold shadow-md hover:bg-[#094731] active:scale-95 transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> Play Again
              </button>
              <button
                onClick={goBack}
                className="w-full py-4 rounded-2xl bg-white dark:bg-[#15231E] border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-base sm:text-lg font-bold shadow-sm hover:bg-gray-50 active:scale-95 transition"
              >
                Back to Menu
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
          mode === 'match' ? renderMatchMode() : (mode === 'blanks' ? renderBlanksMode() : renderMCQMode())
        )}
      </div>
    </div>
  );
};
