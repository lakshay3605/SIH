import React from 'react';
import { ChevronLeft, MoreVertical } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  showMore?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, onBack, showMore = true }) => {
  const { goBack, isDarkMode, showToast } = useApp();

  return (
    <header className={`w-full px-4 py-3 flex items-center justify-between border-b select-none shrink-0 sticky top-0 z-20 ${
      isDarkMode ? 'bg-[#0E1513] border-[#1D2B25] text-gray-100' : 'bg-[#FAF7EE] border-[#EDE7D9] text-gray-900'
    }`}>
      <button
        onClick={onBack || goBack}
        className="p-1.5 -ml-1 text-gray-700 dark:text-gray-300 hover:text-[#0C5A3E] active:scale-95 transition"
        aria-label="Back"
      >
        <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
      </button>
      <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight text-center truncate">
        {title}
      </h1>
      <div className="w-8 flex justify-end">
        {showMore ? (
          <button
            onClick={() => showToast("विकल्प मेनू")}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-4"></div>
        )}
      </div>
    </header>
  );
};
