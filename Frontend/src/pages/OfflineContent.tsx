import React from 'react';
import { Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';

export const OfflineContent: React.FC = () => {
  const { offlinePacks, setOfflinePacks, showToast, goBack } = useApp();

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title="Offline Content" onBack={goBack} showMore={false} />

      <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto w-full flex-1 overflow-y-auto">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-full bg-[#E5F2EB] dark:bg-[#183427] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center shrink-0">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Language Packs</h4>
            <p className="text-xs text-gray-500">Downloaded for offline use</p>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center font-bold text-sm">
                अ
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Hindi</span>
            </div>
            <span className="text-xs font-bold text-[#0C5A3E] dark:text-[#34D399] flex items-center gap-1">
              ✓ Installed
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center font-bold text-sm font-['Noto_Sans_Ol_Chiki']">
                ᱚ
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Santali</span>
            </div>
            <span className="text-xs font-bold text-[#0C5A3E] dark:text-[#34D399] flex items-center gap-1">
              ✓ Installed
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-[#183126] text-[#0C5A3E] dark:text-[#34D399] flex items-center justify-center font-bold text-sm font-['Noto_Sans_Ol_Chiki']">
                ᱢ
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Mundari</span>
            </div>

            {offlinePacks.Mundari ? (
              <span className="text-xs font-bold text-[#0C5A3E] dark:text-[#34D399] flex items-center gap-1">
                ✓ Installed
              </span>
            ) : (
              <button
                onClick={() => {
                  setOfflinePacks(prev => ({ ...prev, Mundari: true }));
                  showToast("Mundari पैकेज डाउनलोड हुआ!");
                }}
                className="px-3.5 py-2 rounded-lg bg-[#0C5A3E] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-[#094731] active:scale-95 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download (120 MB)</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center pt-2 leading-relaxed">
          ℹ Once downloaded, the app works<br />completely offline.
        </p>
      </div>
    </div>
  );
};
