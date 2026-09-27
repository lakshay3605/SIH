import React from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';

export const TextSize: React.FC = () => {
  const { textSize, setTextSize, showToast, goBack } = useApp();

  const options: { id: 'Small' | 'Medium' | 'Large' | 'Extra Large'; label: string; sizeClass: string }[] = [
    { id: 'Small', label: 'Small', sizeClass: 'text-sm' },
    { id: 'Medium', label: 'Medium', sizeClass: 'text-base font-bold' },
    { id: 'Large', label: 'Large', sizeClass: 'text-lg font-bold' },
    { id: 'Extra Large', label: 'Extra Large', sizeClass: 'text-xl font-black' },
  ];

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title="Text Size" onBack={goBack} showMore={false} />

      <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto w-full flex-1 overflow-y-auto">
        <div className="space-y-3 pt-1">
          {options.map((item) => {
            const isChosen = textSize === item.id;
            return (
              <div
                key={item.id}
                onClick={() => {
                  setTextSize(item.id);
                  showToast(`Text Size: ${item.id}`);
                }}
                className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center justify-between cursor-pointer hover:border-emerald-300 active:scale-98 transition shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isChosen ? 'border-[#0C5A3E]' : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {isChosen && <div className="w-2.5 h-2.5 rounded-full bg-[#0C5A3E]"></div>}
                  </div>
                  <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">{item.label}</span>
                </div>
                <span className={`font-serif text-gray-700 dark:text-gray-300 ${item.sizeClass}`}>A</span>
              </div>
            );
          })}
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] space-y-1.5 shadow-xs">
          <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">यह एक उदाहरण पाठ है।</p>
          <p className="text-xs text-gray-500">(This is a sample text.)</p>
        </div>
      </div>
    </div>
  );
};
