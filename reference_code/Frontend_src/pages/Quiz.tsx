import React from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';

export const Quiz: React.FC = () => {
  const { quizSelected, setQuizSelected, showToast, goBack } = useApp();

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title="Quiz" onBack={goBack} />

      <div className="p-4 sm:p-6 space-y-5 max-w-lg mx-auto w-full flex-1 overflow-y-auto">
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="w-1/5 h-full bg-[#0C5A3E] dark:bg-[#34D399]"></div>
          </div>
          <span className="text-xs font-bold text-gray-500">1/5</span>
        </div>

        <div className="pt-2 text-center">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 leading-snug">
            “किताब” का संताली में क्या है?
          </h3>
        </div>

        <div className="space-y-3 pt-2">
          {["ᱚᱲᱟᱜ", "ᱯᱩᱛᱷᱤ", "ᱫᱟᱜ", "ᱫᱟᱠᱟ"].map((opt, idx) => {
            const isChosen = quizSelected === idx;
            return (
              <div
                key={idx}
                onClick={() => setQuizSelected(idx)}
                className={`p-4 rounded-2xl border flex items-center gap-3.5 cursor-pointer text-base font-semibold transition ${
                  isChosen
                    ? 'bg-[#EFF8F3] dark:bg-[#163326] border-[#0C5A3E] text-[#0C5A3E] dark:text-[#34D399] shadow-xs'
                    : 'bg-white dark:bg-[#15231E] border-[#ECE7DA] dark:border-[#20372E] text-gray-800 dark:text-gray-200 hover:border-emerald-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isChosen ? 'border-[#0C5A3E]' : 'border-gray-400'
                }`}>
                  {isChosen && <div className="w-2.5 h-2.5 rounded-full bg-[#0C5A3E]"></div>}
                </div>
                <span className="font-['Noto_Sans_Ol_Chiki'] text-lg">{opt}</span>
              </div>
            );
          })}
        </div>

        <div className="pt-4">
          <button
            onClick={() => showToast("क्विज उत्तर दर्ज हुआ!")}
            className="w-full py-3.5 rounded-xl bg-[#0C5A3E] text-white text-sm sm:text-base font-bold shadow-md hover:bg-[#094731] active:scale-98 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
