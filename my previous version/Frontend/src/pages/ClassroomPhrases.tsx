import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { worksheetSentences } from '../data/worksheetSentences';
import { Search } from 'lucide-react';

export const ClassroomPhrases: React.FC = () => {
  const { goBack } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [targetLang, setTargetLang] = useState<'Santhali' | 'Mundari'>('Santhali');

  const filteredSentences = worksheetSentences.filter(s => 
    s.hindi.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.santhali.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.mundari.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title="Classroom Phrases" onBack={goBack} />

      <div className="p-4 sm:p-6 space-y-5 max-w-lg mx-auto w-full flex-1 overflow-y-auto">
        
        {/* Header Section */}
        <div className="space-y-4">
          <p className="text-sm text-gray-500 font-medium">
            Learn 40 essential classroom and daily phrases to communicate better with your students.
          </p>

          {/* Target Language Toggle */}
          <div className="flex bg-white dark:bg-[#15231E] p-1 rounded-xl border border-[#ECE7DA] dark:border-[#20372E] shadow-xs">
            {(['Santhali', 'Mundari'] as const).map(lang => (
              <button
                key={lang}
                onClick={() => setTargetLang(lang)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  targetLang === lang 
                    ? 'bg-[#0C5A3E] text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search phrases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[#ECE7DA] dark:border-[#20372E] bg-white dark:bg-[#15231E] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0C5A3E]/20"
            />
          </div>
        </div>

        {/* Phrases List */}
        <div className="space-y-4 pt-2 pb-6">
          {filteredSentences.map((sentence, idx) => (
            <div 
              key={sentence.id} 
              className="bg-white dark:bg-[#15231E] rounded-2xl p-5 border border-[#ECE7DA] dark:border-[#20372E] shadow-sm hover:border-emerald-300 transition-colors space-y-3"
            >
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  HI
                </div>
                <p className="text-base font-bold text-gray-800 dark:text-gray-100">
                  {sentence.hindi}
                </p>
              </div>

              <div className="pl-11 border-l-2 border-gray-100 dark:border-gray-800 ml-4 py-2">
                {targetLang === 'Santhali' ? (
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-[#0C5A3E] dark:text-[#34D399] font-['Noto_Sans_Ol_Chiki']">
                      {sentence.santhali}
                    </p>
                    <p className="text-xs font-bold text-emerald-600/50 uppercase tracking-widest">Santhali</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-[#0C5A3E] dark:text-[#34D399] font-['Noto_Sans_Nag_Mundari']">
                      {sentence.mundari}
                    </p>
                    <p className="text-xs font-bold text-emerald-600/50 uppercase tracking-widest">Mundari</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredSentences.length === 0 && (
            <div className="text-center py-10 text-gray-400 font-medium">
              No phrases found matching "{searchTerm}"
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
