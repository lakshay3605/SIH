import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftRight, Mic, MicOff, Volume2, Sparkles, User, GraduationCap, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import {
  createHindiSpeechRecognition,
  createSantaliSpeechRecognition,
  SpeechRecognitionHandler,
  translateHindiToSantaliClient,
  translateHindiToMundariClient,
  translateSantaliToHindiClient,
  speakSantali,
  speakHindi,
  olChikiToPhonetic
} from '../utils/speechTranslation';

interface ConversationTurn {
  id: string;
  speaker: 'teacher' | 'student';
  originalText: string;
  translatedText: string;
  phoneticText?: string;
  timestamp: string;
}

const TEACHER_QUICK_PROMPTS = [
  "नमस्ते, आप कैसे हैं?",
  "और भाई क्या हाल-चाल है",
  "हेलो बच्चों मेरा नाम लक्ष्य है",
  "सभी बच्चे अपनी किताब खोलो।",
  "डरो मत, फिर से कोशिश करो।",
  "आज हम संख्या सीखेंगे।",
  "सभी बच्चे शांत रहिए।"
];

const STUDENT_QUICK_PROMPTS = [
  { text: "ᱡᱚᱦᱟᱨ, ᱢᱟᱪᱮᱛ!", label: "Johar, Machet! (नमस्ते, शिक्षक जी!)" },
  { text: "ᱤᱧ ᱵᱷᱟᱹᱜᱤ ᱜᱮ ᱢᱮᱱᱟᱹᱧᱟ ᱾", label: "Inj bhagi ge menanja (मैं ठीक हूँ)" },
  { text: "ᱤᱧ ᱫᱟᱜ ᱧᱩ ᱥᱟᱱᱟᱹᱧ ᱠᱟᱱᱟ ᱾", label: "Daag nyu sananj kana (मुझे पानी पीना है)" },
  { text: "ᱤᱧ ᱨᱮᱸᱜᱮᱡ ᱤᱧ ᱠᱟᱱᱟ ᱾", label: "Inj rengej inj kana (मुझे भूख लगी है)" },
  { text: "ᱱᱚᱣᱟ ᱯᱩᱛᱷᱤ ᱤᱧᱟᱜ ᱠᱟᱱᱟ", label: "Nowa puthi injag kana (यह किताब मेरी है)" },
  { text: "ᱥᱟᱨᱦᱟᱣ, ᱢᱟᱪᱮᱛ!", label: "Sarhaw, Machet! (धन्यवाद, शिक्षक जी!)" }
];

export const VoiceConversation: React.FC = () => {
  const { showToast, goBack, appLanguage, playSpeech } = useApp();

  // Active speaking direction: 'hindi-to-santali' (Teacher) or 'santali-to-hindi' (Student)
  const [direction, setDirection] = useState<'hindi-to-santali' | 'santali-to-hindi'>('hindi-to-santali');
  const [isListening, setIsListening] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<'teacher' | 'student' | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [recognitionSupported, setRecognitionSupported] = useState(true);

  // Current turn state
  const [currentInput, setCurrentInput] = useState("नमस्ते, आप कैसे हैं?");
  const [currentTranslation, setCurrentTranslation] = useState("ᱡᱚᱦᱟᱨ, ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ?");
  const [currentPhonetic, setCurrentPhonetic] = useState("Johar, aam ched leka menag-ama?");

  // Conversation turns history
  const [turns, setTurns] = useState<ConversationTurn[]>([
    {
      id: 'turn-1',
      speaker: 'teacher',
      originalText: 'नमस्ते, आप कैसे हैं?',
      translatedText: 'ᱡᱚᱦᱟᱨ, ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟᱢᱟ?',
      phoneticText: 'Johar, aam ched leka menag-ama?',
      timestamp: '10:00 AM'
    },
    {
      id: 'turn-2',
      speaker: 'student',
      originalText: 'ᱡᱚᱦᱟᱨ, ᱢᱟᱪᱮᱛ! ᱤᱧ ᱵᱷᱟᱹᱜᱤ ᱜᱮ ᱢᱮᱱᱟᱹᱧᱟ᱾',
      translatedText: 'नमस्ते, शिक्षक जी! मैं ठीक हूँ।',
      phoneticText: 'Johar, machet! Inj bhagi ge menanja.',
      timestamp: '10:01 AM'
    }
  ]);

  const recognitionRef = useRef<SpeechRecognitionHandler | null>(null);

  // Initialize Speech Recognition based on current direction
  const startRecognitionFor = (speaker: 'teacher' | 'student') => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const factory = speaker === 'teacher' ? createHindiSpeechRecognition : createSantaliSpeechRecognition;

    const handler = factory(
      (transcript) => {
        handleProcessSpeech(transcript, speaker);
      },
      () => {
        setIsListening(true);
        setActiveSpeaker(speaker);
        showToast(speaker === 'teacher' ? "सुन रहे हैं... हिंदी में बोलिए" : "ᱟᱸᱡᱚᱢᱮᱫᱟᱞᱮ... संताली बोलिए");
      },
      () => {
        setIsListening(false);
        setActiveSpeaker(null);
      },
      (err) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
        setActiveSpeaker(null);
        showToast("माइक्रोफोन शुरू नहीं हो सका — कृपया अनुमति दें");
      }
    );

    recognitionRef.current = handler;
    setRecognitionSupported(handler.isSupported);

    if (handler.isSupported) {
      handler.start();
    } else {
      showToast("ब्राउज़र स्पीच रिकग्निशन समर्थित नहीं है — नीचे दिए गए उदाहरण चुनें");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setActiveSpeaker(null);
    showToast("माइक बंद किया गया");
  };

  const handleProcessSpeech = (transcript: string, speaker: 'teacher' | 'student') => {
    setIsListening(false);
    setActiveSpeaker(null);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (speaker === 'teacher') {
      if (appLanguage === 'Mundari') {
        const res = translateHindiToMundariClient(transcript);
        setCurrentInput(transcript);
        setCurrentTranslation(res.devanagari);
        setCurrentPhonetic(res.phonetic);
        setDirection('hindi-to-santali');

        const newTurn: ConversationTurn = {
          id: `turn-${Date.now()}`,
          speaker: 'teacher',
          originalText: transcript,
          translatedText: res.devanagari,
          phoneticText: res.phonetic,
          timestamp: timeStr
        };
        setTurns(prev => [...prev.slice(-5), newTurn]);

        if (autoSpeak) {
          playSpeech(
            res.devanagari,
            res.phonetic,
            () => setIsSpeaking(true),
            () => setIsSpeaking(false)
          );
        }
      } else {
        const res = translateHindiToSantaliClient(transcript);
        setCurrentInput(transcript);
        setCurrentTranslation(res.olChiki);
        setCurrentPhonetic(res.phonetic);
        setDirection('hindi-to-santali');

        const newTurn: ConversationTurn = {
          id: `turn-${Date.now()}`,
          speaker: 'teacher',
          originalText: transcript,
          translatedText: res.olChiki,
          phoneticText: res.phonetic,
          timestamp: timeStr
        };
        setTurns(prev => [...prev.slice(-5), newTurn]);

        if (autoSpeak) {
          playSpeech(
            res.olChiki,
            res.phonetic,
            () => setIsSpeaking(true),
            () => setIsSpeaking(false)
          );
        }
      }
    } else {
      // Santali -> Hindi
      const res = translateSantaliToHindiClient(transcript);
      const phonetic = olChikiToPhonetic(transcript);
      setCurrentInput(transcript);
      setCurrentTranslation(res.hindi);
      setCurrentPhonetic(phonetic);
      setDirection('santali-to-hindi');

      const newTurn: ConversationTurn = {
        id: `turn-${Date.now()}`,
        speaker: 'student',
        originalText: transcript,
        translatedText: res.hindi,
        phoneticText: phonetic,
        timestamp: timeStr
      };
      setTurns(prev => [...prev.slice(-5), newTurn]);

      if (autoSpeak) {
        speakHindi(
          res.hindi,
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
      }
    }
  };

  const handleReplayTurn = (turn: ConversationTurn) => {
    if (isSpeaking) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    if (turn.speaker === 'teacher') {
      // Play Santali speech
      speakSantali(
        turn.translatedText,
        turn.phoneticText,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    } else {
      // Play Hindi speech
      speakHindi(
        turn.translatedText,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title="Two-Way Voice (द्विभाषी संवाद)" onBack={goBack} />

      <div className="p-3.5 sm:p-5 space-y-3.5 max-w-lg mx-auto w-full flex-1 flex flex-col justify-between overflow-y-auto">
        {/* Direction Switch Tabs: Teacher (Hindi -> Santali) vs Student (Santali -> Hindi) */}
        <div className="flex bg-[#EFEAD9] dark:bg-[#14231E] p-1 rounded-2xl border border-[#E0D7C4] dark:border-[#1E382E] shadow-2xs">
          <button
            onClick={() => setDirection('hindi-to-santali')}
            className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition ${
              direction === 'hindi-to-santali'
                ? 'bg-[#0C5A3E] text-white shadow-xs'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900'
            }`}
          >
            <GraduationCap className="w-4 h-4 shrink-0" />
            <span>शिक्षक (हिंदी → संताली)</span>
          </button>

          <button
            onClick={() => setDirection('santali-to-hindi')}
            className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition ${
              direction === 'santali-to-hindi'
                ? 'bg-[#0C5A3E] text-white shadow-xs'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>छात्र (संताली → हिंदी)</span>
          </button>
        </div>

        {/* Live Conversation Stream (Chat bubbles between Teacher & Student) */}
        <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[290px] pr-1">
          {turns.map((turn) => {
            const isTeacher = turn.speaker === 'teacher';
            return (
              <div
                key={turn.id}
                className={`p-3 rounded-2xl border shadow-2xs flex flex-col space-y-1.5 transition ${
                  isTeacher
                    ? 'bg-white dark:bg-[#15231E] border-[#ECE7DA] dark:border-[#20372E] ml-2'
                    : 'bg-[#F2F8F4] dark:bg-[#11291E] border-[#C2E3D0] dark:border-[#1E4D37] mr-2'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className={`flex items-center gap-1.5 ${isTeacher ? 'text-[#0C5A3E] dark:text-[#34D399]' : 'text-emerald-700 dark:text-emerald-400'}`}>
                    {isTeacher ? (
                      <>
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>शिक्षक (Teacher) • Hindi:</span>
                      </>
                    ) : (
                      <>
                        <User className="w-3.5 h-3.5" />
                        <span>छात्र (Student) • Santali:</span>
                      </>
                    )}
                  </span>
                  <span className="text-gray-400 text-[10px]">{turn.timestamp}</span>
                </div>

                {/* Spoken original */}
                <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {turn.originalText}
                </p>

                {/* Translated output banner */}
                <div className="pt-1.5 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                  <div className="flex-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
                      {isTeacher ? 'Santali (Ol Chiki) Voice Output:' : 'Hindi Voice Output:'}
                    </span>
                    <p className={`text-sm sm:text-base font-bold ${
                      isTeacher
                        ? "text-[#0C5A3E] dark:text-[#34D399] font-['Noto_Sans_Ol_Chiki']"
                        : "text-gray-900 dark:text-white"
                    }`}>
                      {turn.translatedText}
                    </p>
                    {turn.phoneticText && (
                      <p className="text-[10px] text-gray-500 italic">
                        {turn.phoneticText}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleReplayTurn(turn)}
                    className="p-2 rounded-full bg-[#E5F2EB] dark:bg-[#183427] text-[#0C5A3E] dark:text-[#34D399] hover:bg-[#d5ebd0] active:scale-95 transition shrink-0 ml-2"
                    title="Play Audio"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dual Speaking Control Center (Teacher Mic on Left, Student Mic on Right) */}
        <div className="bg-white dark:bg-[#15231E] p-3.5 rounded-3xl border border-[#ECE7DA] dark:border-[#20372E] shadow-sm">
          <div className="text-center pb-2">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {isListening ? (
                <span className="text-rose-600 dark:text-rose-400 animate-pulse font-extrabold flex items-center justify-center gap-1">
                  ● {activeSpeaker === 'teacher' ? 'शिक्षक की आवाज़ सुन रहे हैं...' : 'छात्र की संताली आवाज़ सुन रहे हैं...'}
                </span>
              ) : isSpeaking ? (
                <span className="text-emerald-600 dark:text-emerald-400 animate-pulse font-extrabold flex items-center justify-center gap-1">
                  🔊 अनुवाद बोलकर सुनाया जा रहा है...
                </span>
              ) : (
                "दोनों में से किसी एक माइक को दबाकर बोलें:"
              )}
            </span>
          </div>

          
          
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Teacher Button (Speak Hindi -> Speaks Santali) */}
            <button
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); startRecognitionFor('teacher'); }}
              onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); stopListening(); }}
              onPointerCancel={(e) => { stopListening(); }}
              style={{ touchAction: 'none' }}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition active:scale-95 ${
                isListening && activeSpeaker === 'teacher'
                  ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-300 animate-pulse'
                  : 'bg-[#0C5A3E] text-white shadow-sm hover:bg-[#094731]'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                {isListening && activeSpeaker === 'teacher' ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="text-center leading-tight">
                <span className="text-xs sm:text-sm font-extrabold block">बोलें हिंदी</span>
                <span className="text-[10px] text-emerald-100 font-medium">शिक्षक (Teacher)</span>
              </div>
            </button>

            {/* Student Button (Speak Santali -> Speaks Hindi) */}
            <button
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); startRecognitionFor('student'); }}
              onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); stopListening(); }}
              onPointerCancel={(e) => { stopListening(); }}
              style={{ touchAction: 'none' }}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition active:scale-95 ${
                isListening && activeSpeaker === 'student'
                  ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-300 animate-pulse'
                  : 'bg-[#1E3A8A] text-white shadow-sm hover:bg-[#172554]'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                {isListening && activeSpeaker === 'student' ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="text-center leading-tight">
                <span className="text-xs sm:text-sm font-extrabold block">ᱨᱚᱲ ᱢᱮ (Santali)</span>
                <span className="text-[10px] text-blue-100 font-medium">छात्र (Student)</span>
              </div>
            </button>
          </div>
            <div className="text-center mt-2 text-[11px] font-bold text-rose-600 dark:text-rose-400">
              👇 Hold to Talk / बोलने के लिए दबाए रखें
            </div>


          {/* Auto-Speak Checkbox */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-500">
            <span>आवाज़ स्वतः सुनाएँ (Auto-speak):</span>
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`px-2.5 py-0.5 rounded-full font-bold transition ${
                autoSpeak
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-[#0C5A3E] dark:text-[#34D399]'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
              }`}
            >
              {autoSpeak ? "चालू (ON)" : "बंद (OFF)"}
            </button>
          </div>
        </div>

        {/* Quick Testing Chips for Active Mode */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 px-1">
            <span>
              {direction === 'hindi-to-santali'
                ? "शिक्षक के त्वरित वाक्य (Teacher Prompts):"
                : "छात्र के त्वरित वाक्य (Student Prompts):"}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-start">
            {direction === 'hindi-to-santali'
              ? TEACHER_QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleProcessSpeech(prompt, 'teacher')}
                    className="text-xs py-1 px-2.5 rounded-full bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] text-gray-700 dark:text-gray-200 hover:border-emerald-500 hover:text-[#0C5A3E] transition shadow-2xs active:scale-95"
                  >
                    {prompt}
                  </button>
                ))
              : STUDENT_QUICK_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleProcessSpeech(item.text, 'student')}
                    className="text-xs py-1 px-2.5 rounded-full bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] text-gray-700 dark:text-gray-200 hover:border-blue-500 hover:text-blue-700 transition shadow-2xs active:scale-95"
                  >
                    {item.label}
                  </button>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
};
