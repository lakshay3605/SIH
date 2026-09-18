import React from 'react';
import { Printer, Share2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';

export const WorksheetPreview: React.FC = () => {
  const { worksheetData, showToast, goBack } = useApp();

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title="Worksheet" onBack={goBack} />

      <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto w-full flex-1 overflow-y-auto">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] shadow-sm space-y-3.5">
          <div className="text-center pb-1">
            <h4 className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100">संख्या पहचानें</h4>
            <p className="text-xs text-gray-500 font-medium">(Identify the numbers)</p>
          </div>

          <table className="w-full text-xs sm:text-sm text-left border-collapse">
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {worksheetData.map((row) => (
                <tr key={row.num} className="py-2">
                  <td className="py-2 font-bold text-gray-500">{row.num}</td>
                  <td className="py-2 font-bold text-gray-900 dark:text-gray-100">{row.hindi}</td>
                  <td className="py-2 font-bold text-[#0C5A3E] dark:text-[#34D399] font-['Noto_Sans_Ol_Chiki']">{row.santali}</td>
                  <td className="py-2 text-right text-base">{row.icons}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 rounded-xl bg-white dark:bg-[#15231E] border border-gray-300 dark:border-gray-700 text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center justify-center gap-2 shadow-xs hover:bg-gray-50 active:scale-98 transition"
          >
            <Printer className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span>Print</span>
          </button>
          <button
            onClick={() => showToast("PDF साझा किया गया!")}
            className="flex-1 py-3 rounded-xl bg-[#0C5A3E] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs hover:bg-[#094731] active:scale-98 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};
