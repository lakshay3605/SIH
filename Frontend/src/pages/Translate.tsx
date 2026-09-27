import React, { useState } from 'react';
import { ArrowLeftRight, Mic, MicOff, Volume2, Copy, Share2, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { createHindiSpeechRecognition, speakSantali } from '../utils/speechTranslation';

export const Translate: React.FC = () => {
  const {
    inputText,
    setInputText,
    translatedText,
    phoneticText,
    translateInput,
    navigateTo,
    playSpeech,
    showToast,
  } = useApp();

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = React.useRef<any>(null);

  const handleMicClick = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      showToast("माइक बंद किया गया");
      return;
    }

    const handler = createHindiSpeechRecognition(
      (transcript) => {
        setIsListening(false);
        setInputText(transcript);
        const res = translateInput(transcript);
        speakSantali(
          res.olChiki,
          res.phonetic,
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
      },
      () => {
        setIsListening(true);
        showToast("सुन रहे हैं... बोलिए (Listening...)");
      },
      () => {
        setIsListening(false);
      },
      () => {
        setIsListening(false);
        showToast("माइक्रोफोन पूरा हुआ");
      }
    );

    recognitionRef.current = handler;
    if (handler.isSupported) {
      handler.start();
    } else {
      navigateTo('voice');
    }
  };

  const handleTranslateClick = () => {
    const res = translateInput(inputText);
    showToast("अनुवाद पूर्ण हुआ!");
  };

  const handleListenClick = () => {
    playSpeech(
      translatedText,
      phoneticText,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title="Translate" />

      <div className="p-4 sm:p-6 space-y-3.5 max-w-lg mx-auto w-full flex-1 overflow-y-auto">
        {/* Language Selector Row */}
        <div
          onClick={() => navigateTo('choose-language')}
          className="p-3.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center justify-between text-xs sm:text-sm cursor-pointer shadow-xs hover:border-emerald-300 transition"
        >
          <div className="text-left">
            <span className="font-bold text-gray-800 dark:text-gray-200 block">Hindi</span>
            <span className="text-xs text-gray-400">हिंदी ▾</span>
          </div>
          <ArrowLeftRight className="w-4 h-4 text-[#0C5A3E]" />
          <div className="text-right">
            <span className="font-bold text-[#0C5A3E] dark:text-[#34D399] block">Santali</span>
            <span className="text-xs text-gray-400">संताली ▾</span>
          </div>
        </div>

        {/* Source Text Input Card */}
        <div className={`p-4 rounded-2xl bg-white dark:bg-[#15231E] border ${
          isListening ? "border-emerald-400 ring-2 ring-emerald-200" : "border-[#ECE7DA] dark:border-[#20372E]"
        } min-h-[130px] flex flex-col shadow-xs transition relative`}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type in Hindi or tap the microphone..."
            className="w-full text-sm sm:text-base font-medium text-gray-800 dark:text-gray-100 bg-transparent resize-none outline-none placeholder:text-gray-400 flex-1"
            rows={3}
          />
          <div className="absolute bottom-3 right-4 text-xs text-gray-400">
            {inputText.length}/500
          </div>
        </div>

        {/* Large Mic Button */}
        <div className="flex justify-center py-2">
          <button
            onClick={handleMicClick}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition shadow-lg ${
              isListening
                ? "bg-rose-500 text-white animate-pulse"
                : "bg-[#0C5A3E] hover:bg-[#094731] text-white"
            }`}
            aria-label="Voice Input"
            title="बोलकर इनपुट दें"
          >
            {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-semibold text-gray-500 shrink-0">सुझाव:</span>
          {[
            "और भाई क्या हाल-चाल है",
            "हेलो बच्चों मेरा नाम लक्ष्य है",
            "नमस्ते, आप कैसे हैं?",
            "आज हम संख्या सीखेंगे।",
            "मुझे पानी पीना है"
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(prompt);
                translateInput(prompt);
                showToast("अनुवादित!");
              }}
              className="text-xs bg-emerald-50 dark:bg-emerald-950/60 text-[#0C5A3E] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-full px-2.5 py-1 whitespace-nowrap hover:bg-emerald-100 transition shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Translate Action Button */}
        <button
          onClick={handleTranslateClick}
          className="w-full py-3.5 rounded-xl bg-[#0C5A3E] text-white text-sm font-bold shadow-md hover:bg-[#094731] transition active:scale-98"
        >
          Translate to Santhali
        </button>

        {/* Translation Output Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] space-y-2 shadow-xs">
          <span className="text-xs font-bold text-gray-400 block">Translation (Santali - संताली)</span>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-wide font-['Noto_Sans_Ol_Chiki']">
            {translatedText}
          </p>
          <p className="text-xs text-gray-500 italic">उच्चारण: {phoneticText}</p>

          <div className="pt-3 mt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-around text-gray-600 dark:text-gray-300 text-xs">
            <button
              onClick={handleListenClick}
              className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition ${
                isSpeaking ? "text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950 animate-pulse" : "hover:text-[#0C5A3E]"
              }`}
            >
              <Volume2 className="w-4 h-4" /> {isSpeaking ? "बोल रहा है..." : "Listen"}
            </button>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(translatedText);
                showToast("कॉपी हो गया!");
              }}
              className="flex items-center gap-1.5 hover:text-[#0C5A3E] py-1 px-2"
            >
              <Copy className="w-4 h-4" /> Copy
            </button>
            <button onClick={() => showToast("साझा किया गया!")} className="flex items-center gap-1.5 hover:text-[#0C5A3E] py-1 px-2">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button onClick={() => showToast("सहेजा गया ⭐")} className="flex items-center gap-1.5 text-amber-500 font-bold py-1 px-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
