import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { WorksheetType } from '../types';

type UILang = 'English' | 'Hindi' | 'Santhali' | 'Mundari';

const translations = {
  English: {
    match: { label: '🔗 Match the following', desc: 'Connect the translations' },
    mcq: { label: '🔘 Multiple choice questions', desc: 'Pick the correct answer' },
    blanks: { label: '✍️ Fill in the blanks', desc: 'Complete the sentence' },
    mix: { label: '🎲 Surprise me', desc: 'A fun mix of everything' },
    start: 'Start worksheet 🚀',
    uiLabel: 'UI Language',
    targetLabel: 'Target Language',
    title: 'Generate Worksheet'
  },
  Hindi: {
    match: { label: '🔗 निम्नलिखित का मिलान करें', desc: 'अनुवादों को मिलाएँ' },
    mcq: { label: '🔘 बहु विकल्पीय प्रश्न', desc: 'सही उत्तर चुनें' },
    blanks: { label: '✍️ खाली जगहें भरें', desc: 'वाक्य पूरा करें' },
    mix: { label: '🎲 मिले-जुले प्रश्न', desc: 'मज़ेदार मिले-जुले प्रश्न' },
    start: 'शुरू करें 🚀',
    uiLabel: 'UI भाषा',
    targetLabel: 'लक्ष्य भाषा',
    title: 'वर्कशीट बनाएँ'
  },
  Santhali: {
    match: { label: '🔗 ᱞᱟᱛᱟᱨ ᱨᱮᱭᱟᱜ ᱥᱟᱦᱴᱟᱠᱚ ᱥᱟᱶ ᱢᱮᱥᱟ ᱢᱮ', desc: '' },
    mcq: { label: '🔘 ᱟᱭᱢᱟ ᱞᱮᱠᱟᱱ ᱠᱩᱠᱞᱤ ᱠᱚ ᱾', desc: '' },
    blanks: { label: '✍️ ᱠᱷᱟᱹᱞᱤ ᱡᱟᱭᱜᱟ ᱯᱮᱨᱮᱡ ᱢᱮ ᱾', desc: '' },
    mix: { label: '🎲 ᱢᱮᱥᱟ ᱠᱩᱠᱞᱤ ᱠᱚ ᱾', desc: '' },
    start: 'ᱮᱛᱦᱚᱵ ᱢᱮ 🚀',
    uiLabel: 'UI ᱯᱟᱹᱨᱥᱤ',
    targetLabel: 'ᱴᱟᱨᱜᱮᱴ ᱯᱟᱹᱨᱥᱤ',
    title: 'ᱣᱟᱨᱠᱥᱤᱴ ᱵᱮᱱᱟᱣ ᱢᱮ'
  },
  Mundari: {
    match: { label: '🔗 लतर रे ओलाकनअः को जुगुतुएपे', desc: '' },
    mcq: { label: '🔘 बहुविकल्पी कुनुलि', desc: '' },
    blanks: { label: '✍️ खाली ठांव को पेरेःएपे', desc: '' },
    mix: { label: '🎲 जुड़िओः कुनुलि', desc: '' },
    start: 'एटेःएपे 🚀',
    uiLabel: 'UI भाषा',
    targetLabel: 'लक्ष्य भाषा',
    title: 'वर्कशीट बनाओ'
  }
};

export const WorksheetGenerator: React.FC = () => {
  const {
    wsLanguage,
    setWsLanguage,
    wsType,
    setWsType,
    navigateTo,
    goBack,
  } = useApp();

  const [uiLang, setUiLang] = useState<UILang>('English');
  const t = translations[uiLang];

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title={t.title} onBack={goBack} />

      <div className="p-4 sm:p-6 space-y-8 max-w-lg mx-auto w-full flex-1 overflow-y-auto">
        <div className="space-y-6 text-left pt-2">
          
          {/* UI Language Selection */}
          <div>
            <label className="text-sm font-bold text-gray-500 block mb-2 uppercase tracking-wide">{t.uiLabel}</label>
            <div className="grid grid-cols-4 gap-2">
              {(['English', 'Hindi', 'Santhali', 'Mundari'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setUiLang(lang)}
                  className={`p-2 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center transition active:scale-95
                    ${uiLang === lang 
                      ? 'bg-[#1e293b] text-white border-[#1e293b] shadow-sm' 
                      : 'bg-white dark:bg-[#15231E] border-[#ECE7DA] dark:border-[#20372E] text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}
                >
                  <span className={`${lang === 'Santhali' ? 'font-["Noto_Sans_Ol_Chiki"]' : ''} ${lang === 'Mundari' ? 'font-["Noto_Sans_Nag_Mundari"]' : ''}`}>
                    {lang === 'English' ? 'EN' : lang === 'Hindi' ? 'HI' : lang === 'Santhali' ? 'ᱥᱟᱱᱛᱟᱲᱤ' : '𞓧𞓟𞓨𞓜𞓕𞓣𞓚'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Target Language Selection */}
          <div>
            <label className="text-sm font-bold text-gray-500 block mb-2 uppercase tracking-wide">{t.targetLabel}</label>
            <div className="grid grid-cols-2 gap-3">
              {(['Santhali', 'Mundari'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setWsLanguage(lang)}
                  className={`p-3.5 rounded-xl border text-sm font-bold flex items-center justify-center transition active:scale-95
                    ${wsLanguage === lang 
                      ? 'bg-[#0C5A3E] text-white border-[#0C5A3E] shadow-sm' 
                      : 'bg-white dark:bg-[#15231E] border-[#ECE7DA] dark:border-[#20372E] text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}
                >
                  <span className={`${lang === 'Santhali' ? 'font-["Noto_Sans_Ol_Chiki"]' : ''} ${lang === 'Mundari' ? 'font-["Noto_Sans_Nag_Mundari"]' : ''}`}>
                    {lang === 'Santhali' ? 'ᱥᱟᱱᱛᱟᱲᱤ' : '𞓧𞓟𞓨𞓜𞓕𞓣𞓚'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Worksheet Type Selection */}
          <div>
            <div className="space-y-3">
              {[
                { id: 'match', ...t.match },
                { id: 'mcq', ...t.mcq },
                { id: 'blanks', ...t.blanks },
                { id: 'mix', ...t.mix }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setWsType(type.id as WorksheetType)}
                  className={`w-full p-4 rounded-xl border text-left flex flex-col transition active:scale-95
                    ${wsType === type.id 
                      ? 'bg-emerald-50 dark:bg-[#0C5A3E]/20 border-[#0C5A3E] shadow-sm' 
                      : 'bg-white dark:bg-[#15231E] border-[#ECE7DA] dark:border-[#20372E] hover:bg-gray-50'}`}
                >
                  <span className={`text-base font-bold ${wsType === type.id ? 'text-[#0C5A3E] dark:text-[#34D399]' : 'text-gray-800 dark:text-gray-100'} ${uiLang === 'Santhali' ? 'font-["Noto_Sans_Ol_Chiki"]' : ''} ${uiLang === 'Mundari' ? 'font-["Noto_Sans_Nag_Mundari"]' : ''}`}>
                    {type.label}
                  </span>
                  {type.desc && <span className="text-xs text-gray-500 font-medium mt-1">{type.desc}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2 pb-6">
          <button
            onClick={() => navigateTo('worksheet-preview')}
            className={`w-full py-4 rounded-2xl bg-[#0C5A3E] text-white text-base sm:text-lg font-bold shadow-lg hover:bg-[#094731] active:scale-95 transition flex items-center justify-center gap-2 ${uiLang === 'Santhali' ? 'font-["Noto_Sans_Ol_Chiki"]' : ''} ${uiLang === 'Mundari' ? 'font-["Noto_Sans_Nag_Mundari"]' : ''}`}
          >
            {t.start}
          </button>
        </div>
      </div>
    </div>
  );
};
