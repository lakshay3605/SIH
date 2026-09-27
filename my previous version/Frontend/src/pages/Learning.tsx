import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';

export const Learning: React.FC = () => {
  const {
    learningClass,
    setLearningClass,
    navigateTo,
    goBack,
  } = useApp();

  const categories = [
    { title: "Common Words", sub: "Everyday vocabulary", color: "bg-[#2563EB]", icon: "💬" },
    { title: "Numbers", sub: "1, 2, 3...", color: "bg-[#D97706]", icon: "123" },
    { title: "Alphabets", sub: "अ, आ, इ ...", color: "bg-[#DC2626]", icon: "A" },
    { title: "Classroom Phrases", sub: "For teachers", color: "bg-[#2563EB]", icon: "👩‍🏫" },
  ];

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title="Learning Mode" onBack={goBack} />

      <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto w-full flex-1 overflow-y-auto">
        {/* Section Title */}
        <div className="pt-2">
          <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">Modules:</h3>
        </div>

        {/* Categories List */}
        <div className="space-y-3 pt-1">
          {categories.map((it, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (it.title === "Alphabets") navigateTo('flashcards');
                else if (it.title === "Numbers") navigateTo('numbers-flashcards');
                else if (it.title === "Classroom Phrases") navigateTo('classroom-phrases');
                else navigateTo('dictionary');
              }}
              className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-300 active:scale-98 transition"
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-xl ${it.color} text-white flex items-center justify-center font-bold text-sm shrink-0`}>
                  {it.icon}
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">{it.title}</h4>
                  <p className="text-xs text-gray-500">{it.sub}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
