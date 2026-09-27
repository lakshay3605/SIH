import React from 'react';
import { ArrowRight, Mic, Volume2, Copy, Share2, Star, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';

export const Translate: React.FC = () => {
  const {
    inputText,
    setInputText,
    playSpeech,
    stopSpeech,
    showToast,
  } = useApp();

  const [isListening, setIsListening] = React.useState(false);
  const [isProcessingAsr, setIsProcessingAsr] = React.useState(false);
  const [asrIndex, setAsrIndex] = React.useState(0);
  
  const [targetLanguage, setTargetLanguage] = React.useState<'santhali' | 'mundari'>('santhali');
  const [isTranslating, setIsTranslating] = React.useState(false);
  
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const ttsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const translateTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const stopAllAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (ttsTimeoutRef.current) clearTimeout(ttsTimeoutRef.current);
    if (translateTimeoutRef.current) clearTimeout(translateTimeoutRef.current);
    if (stopSpeech) stopSpeech();
  };

  React.useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const [translationResult, setTranslationResult] = React.useState<{
    text: string;
    translit: string;
    time: number;
    asrTime: number;
    ttsTime: number;
    audio: string | null;
  } | null>(null);

  const asrSentences = [
    { text: "चलिए अब बताइए, किस बच्चे को क्या परेशानी हुई आज की क्लास को समझने में? मैं समझा दूँगा।" },
    { text: "नमस्ते बच्चों, पेज नंबर 7 खोलिए।" },
    { text: "आज कौन मुझे 10 का पहाड़ा सुनाएगा?" }
  ];

  const getRandomLatency = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  const handleTranslate = (txt: string, asrTimePassed: number = 500, overrideLang?: 'santhali' | 'mundari') => {
    if (!txt.trim()) return;
    
    stopAllAudio();
    
    setIsTranslating(true);
    setTranslationResult(null);

    const lang = overrideLang || targetLanguage;

    const time = getRandomLatency(600, 1000);
    const ttsTime = getRandomLatency(600, 1000);

    let target = { text: "अनुवाद उपलब्ध नहीं है", translit: "Not available", time, asrTime: asrTimePassed, ttsTime, audio: null as string | null };
    
    if (txt === "नमस्ते बच्चों, पेज नंबर 7 खोलिए।") {
      if (lang === 'santhali') {
        target = { text: "ᱡᱚᱦᱟᱨ ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ, ᱥᱟᱦᱴᱟ ᱱᱚᱢᱵᱚᱨ ᱗ ᱡᱷᱤᱡ ᱢᱮ ᱾", translit: "Johar gidra ko, sahta number 7 jhij me.", time, asrTime: asrTimePassed, ttsTime, audio: "/assets/001_santhali.mp3" };
      } else {
        target = { text: "जोअर होनको, पेज नम्बर एआ (7) निइपे।", translit: "Joar honko, page number ea (7) niipe.", time, asrTime: asrTimePassed, ttsTime, audio: "/assets/001_mundari.mp3" };
      }
    } else if (txt === "आज कौन मुझे 10 का पहाड़ा सुनाएगा?") {
      if (lang === 'santhali') {
        target = { text: "ᱛᱮᱦᱮᱧ ᱚᱠᱚᱭ ᱤᱧ ᱑᱐ ᱨᱮᱭᱟᱜ ᱢᱟᱲᱟᱝ ᱮ ᱞᱟᱹᱭᱟᱹᱧᱟ?", translit: "Teheñ okoy iñ 10 reyag marañ e layañ-a?", time, asrTime: asrTimePassed, ttsTime, audio: "/assets/002_santhali.mp3" };
      } else {
        target = { text: "तिसिङ ओकोए अइङ के 10 रअः पहाड़ा उदुबाइअ?", translit: "Tising okoe aing ke 10 ra'ah pahada udubaia?", time, asrTime: asrTimePassed, ttsTime, audio: "/assets/002_mundari.mp3" };
      }
    } else if (txt === "चलिए अब बताइए, किस बच्चे को क्या परेशानी हुई आज की क्लास को समझने में? मैं समझा दूँगा।") {
      if (lang === 'santhali') {
        target = { text: "ᱫᱮᱞᱟ ᱱᱤᱛᱚᱜ ᱞᱟᱹᱭ ᱢᱮ, ᱛᱮᱦᱮᱧᱟᱜ ᱪᱟᱱᱟᱪ ᱵᱩᱡᱷᱟᱹᱣ ᱨᱮ ᱚᱠᱚᱭ ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ ᱪᱮᱫ ᱮᱴᱠᱮᱴᱚᱬᱮ ᱠᱚ ᱧᱟᱢ ᱟᱠᱟᱫᱟ? ᱤᱧ ᱵᱩᱡᱷᱟᱹᱣ ᱟᱢᱟ ᱾", translit: "Dela nitog lay me, teheñ-ag chanach bujhaw re okoy gidra ko ched etketon-e ko ñam akada? Iñ bujhaw ama.", time, asrTime: asrTimePassed, ttsTime, audio: "/assets/003_santhali.mp3" };
      } else {
        target = { text: "मर, नाअः दो कजिलेम, ओको होन चनअःए बलए जना तिसिङ रअः कलास बुजव रे? अइङ बुजवइअ। ", translit: "Mar, na'ah do kajilem, oko hon chana'ae balae jana tising ra'ah kalas bujaw re? Aing bujawaia.", time, asrTime: asrTimePassed, ttsTime, audio: "/assets/003_mundari.mp3" };
      }
    }

    translateTimeoutRef.current = setTimeout(() => {
      setTranslationResult(target);
      setIsTranslating(false);

      if (target.audio) {
        ttsTimeoutRef.current = setTimeout(() => {
          const audio = new Audio(target.audio!);
          audioRef.current = audio;
          audio.play();
        }, target.ttsTime);
      }
    }, target.time);
  };

  const handleMicClick = () => {
    if (isProcessingAsr) return; // Prevent clicking while processing

    if (isListening) {
      setIsListening(false);
      setIsProcessingAsr(true);
      
      const currentSentence = asrSentences[asrIndex];
      const asrLatency = getRandomLatency(600, 1000);
      
      // Simulate network latency for ASR
      setTimeout(() => {
        setInputText(currentSentence.text);
        setAsrIndex((prev) => (prev + 1) % asrSentences.length);
        setIsProcessingAsr(false);
        handleTranslate(currentSentence.text, asrLatency);
      }, asrLatency);
    } else {
      setInputText(""); // clear input when starting to listen
      setIsListening(true);
    }
  };

  // When language is toggled, if we have text, re-translate it to the new language
  const handleToggleLanguage = (lang: 'santhali' | 'mundari') => {
    if (lang === targetLanguage) return;
    setTargetLanguage(lang);
    if (inputText.trim() && translationResult) {
      handleTranslate(inputText.trim(), 200, lang); // quick re-translate when switching, explicitly pass new lang
    }
  }

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title="Translate" />

      <div className="p-4 sm:p-6 space-y-3.5 max-w-lg mx-auto w-full flex-1 overflow-y-auto">
        {/* Language Selector Row */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center justify-between text-xs sm:text-sm shadow-xs transition">
          <div className="text-left cursor-pointer" onClick={() => window.alert('More source languages coming soon!')}>
            <span className="font-bold text-gray-800 dark:text-gray-200 block">Hindi</span>
            <span className="text-xs text-gray-400">हिंदी ▾</span>
          </div>
          
          <ArrowRight className="w-4 h-4 text-[#0C5A3E]" />
          
          {/* Target Language Segmented Control */}
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
            <button 
              onClick={() => handleToggleLanguage('santhali')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${targetLanguage === 'santhali' ? 'bg-white dark:bg-[#20372E] text-[#0C5A3E] dark:text-[#34D399] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Santhali
            </button>
            <button 
              onClick={() => handleToggleLanguage('mundari')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${targetLanguage === 'mundari' ? 'bg-white dark:bg-[#20372E] text-[#0C5A3E] dark:text-[#34D399] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Mundari
            </button>
          </div>
        </div>

        {/* Source Text Input Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] min-h-[130px] flex flex-col justify-between shadow-xs">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type in Hindi..."
            className="w-full text-sm sm:text-base font-medium text-gray-800 dark:text-gray-100 bg-transparent resize-none outline-none placeholder:text-gray-400"
            rows={3}
          />
          <div className="flex items-center justify-between text-xs text-gray-400 pt-2.5 border-t border-gray-100 dark:border-gray-800">
            <span></span>
            <div className="flex items-center gap-2">
              <span>{inputText.length}/500</span>
            </div>
          </div>
        </div>

        {/* Big Mic Button */}
        <div className="flex justify-center my-2">
          <button
            onClick={handleMicClick}
            disabled={isProcessingAsr}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-md ${
              isProcessingAsr
                ? 'bg-gray-400 cursor-not-allowed'
                : isListening
                ? 'bg-red-500 animate-pulse text-white scale-110'
                : 'bg-[#0C5A3E] text-white hover:bg-[#094731] hover:scale-105 active:scale-95'
            }`}
          >
            <Mic className="w-7 h-7" />
          </button>
        </div>

        {/* Translate Action Button */}
        <button
          onClick={() => handleTranslate(inputText.trim())}
          disabled={isTranslating}
          className="w-full py-3.5 rounded-xl bg-[#0C5A3E] text-white text-sm font-bold shadow-md hover:bg-[#094731] transition active:scale-98 flex items-center justify-center gap-2 disabled:bg-gray-400"
        >
          {isTranslating ? <Loader2 className="w-5 h-5 animate-spin" /> : `Translate to ${targetLanguage === 'santhali' ? 'Santhali' : 'Mundari'}`}
        </button>

        {/* Translation Output Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] space-y-2 shadow-xs relative min-h-[150px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0C5A3E] dark:text-[#34D399]">Translation ({targetLanguage === 'santhali' ? 'Santhali' : 'Mundari'})</span>
            {translationResult && (
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800">
                {(translationResult.time / 1000).toFixed(1)}s
              </span>
            )}
          </div>
          
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-wide font-['Noto_Sans_Ol_Chiki'] mt-2 min-h-[28px]">
            {translationResult ? translationResult.text : <span className="text-gray-400 dark:text-gray-500 font-sans text-base opacity-70 tracking-normal">अनुवाद यहाँ दिखाई देगा...</span>}
          </p>
          <p className="text-xs text-gray-500 min-h-[16px]">
            {translationResult ? translationResult.translit : ""}
          </p>

          <div className="pt-3 mt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-around text-gray-400 dark:text-gray-500 text-xs">
            <button 
              onClick={() => {
                if (!translationResult) return;
                stopAllAudio();
                if (translationResult.audio) {
                  const audio = new Audio(translationResult.audio);
                  audioRef.current = audio;
                  audio.play();
                } else {
                  playSpeech(translationResult.translit);
                }
              }} 
              disabled={!translationResult}
              className={`flex items-center gap-1.5 py-1 px-2 transition ${translationResult ? 'text-gray-600 dark:text-gray-300 hover:text-[#0C5A3E]' : 'cursor-not-allowed opacity-50'}`}
            >
              <Volume2 className="w-4 h-4" /> Listen
            </button>
            <button
              onClick={() => {
                if (!translationResult) return;
                navigator.clipboard?.writeText(translationResult.text);
                showToast("कॉपी हो गया!");
              }}
              disabled={!translationResult}
              className={`flex items-center gap-1.5 py-1 px-2 transition ${translationResult ? 'text-gray-600 dark:text-gray-300 hover:text-[#0C5A3E]' : 'cursor-not-allowed opacity-50'}`}
            >
              <Copy className="w-4 h-4" /> Copy
            </button>
            <button 
              onClick={() => {
                if (!translationResult) return;
                showToast("साझा किया गया!");
              }} 
              disabled={!translationResult}
              className={`flex items-center gap-1.5 py-1 px-2 transition ${translationResult ? 'text-gray-600 dark:text-gray-300 hover:text-[#0C5A3E]' : 'cursor-not-allowed opacity-50'}`}
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button 
              onClick={() => {
                if (!translationResult) return;
                showToast("सहेजा गया ⭐");
              }} 
              disabled={!translationResult}
              className={`flex items-center gap-1.5 font-bold py-1 px-2 transition ${translationResult ? 'text-amber-500 hover:text-amber-600' : 'cursor-not-allowed opacity-50'}`}
            >
              <Star className={`w-4 h-4 ${translationResult ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-gray-400'}`} /> Save
            </button>
          </div>
        </div>

        {/* Timing Tabs */}
        {translationResult && (
          <div className="flex flex-wrap items-center justify-between text-[10px] sm:text-xs text-gray-500 bg-white dark:bg-[#15231E] p-3 rounded-xl border border-[#ECE7DA] dark:border-[#20372E] shadow-xs animate-in fade-in slide-in-from-bottom-2">
            <span className="flex flex-col items-center px-2 border-r border-gray-200 dark:border-gray-700 w-1/4">
              <span className="font-bold text-gray-400 mb-0.5">ASR</span>
              <span className="font-mono text-[#0C5A3E] dark:text-[#34D399]">{(translationResult.asrTime / 1000).toFixed(1)}s</span>
            </span>
            <span className="flex flex-col items-center px-2 border-r border-gray-200 dark:border-gray-700 w-1/4">
              <span className="font-bold text-gray-400 mb-0.5">Translate</span>
              <span className="font-mono text-[#0C5A3E] dark:text-[#34D399]">{(translationResult.time / 1000).toFixed(1)}s</span>
            </span>
            <span className="flex flex-col items-center px-2 border-r border-gray-200 dark:border-gray-700 w-1/4">
              <span className="font-bold text-gray-400 mb-0.5">TTS</span>
              <span className="font-mono text-[#0C5A3E] dark:text-[#34D399]">{(translationResult.ttsTime / 1000).toFixed(1)}s</span>
            </span>
            <span className="flex flex-col items-center px-2 w-1/4">
              <span className="font-bold text-gray-400 mb-0.5">Total</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {((translationResult.asrTime + translationResult.time + translationResult.ttsTime) / 1000).toFixed(1)}s
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
