import React, { useState } from 'react';
import { Search, Volume2, Bookmark, Book } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { dictionaryData } from '../data/dictionaryData';

// Map of emojis based on English words for the visual flair
const wordIcons: Record<string, string> = {
  'Home': '🏠',
  'Book': '📖',
  'School': '🏫',
  'Mother': '👩‍👧',
  'Father': '👨‍👦',
  'Brother': '👦',
  'Sister': '👧',
  'Pen': '🖊️',
  'Tree': '🌳',
  'Mango': '🥭',
  'Cow': '🐄',
  'Water': '💧',
  'River': '🌊',
  'Bird': '🐦',
  'Ball': '⚽',
  'Game/Play': '🎮',
  'Friend': '🤝',
  'Fruit': '🍎',
  'Flower': '🌸',
  'Forest': '🌲'
};

export const Dictionary: React.FC = () => {
  const {
    dictFilter,
    setDictFilter,
    dictSearch,
    setDictSearch,
    playSpeech,
    goBack,
  } = useApp();

  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const filtered = dictionaryData.filter(w =>
    !dictSearch ||
    w.hindi.toLowerCase().includes(dictSearch.toLowerCase()) ||
    w.english.toLowerCase().includes(dictSearch.toLowerCase()) ||
    w.santhali.includes(dictSearch) ||
    w.mundari.includes(dictSearch)
  );

  const playAudio = (audioPath?: string) => {
    if (audioPath) {
      if (playingAudio === audioPath) return;
      setPlayingAudio(audioPath);
      const audio = new Audio(audioPath);
      audio.onended = () => setPlayingAudio(null);
      audio.play();
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF7EE] dark:bg-[#0E1513]">
      <Header title="Dictionary" onBack={goBack} />

      <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto w-full flex-1 flex flex-col h-full">
        
        {/* Search Header Area */}
        <div className="space-y-4 shrink-0">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={dictSearch}
              onChange={(e) => setDictSearch(e.target.value)}
              placeholder="Search words..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] text-sm sm:text-base outline-none placeholder:text-gray-400 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-2 focus:ring-[#0C5A3E]/20 transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {(['All', 'Hindi', 'Santhali', 'Mundari'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setDictFilter(tab as any)}
                className={`px-4 py-2 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                  dictFilter === tab
                    ? 'bg-[#0C5A3E] text-white shadow-md'
                    : 'bg-white dark:bg-[#15231E] border border-[#ECE7DA] dark:border-[#20372E] text-gray-600 dark:text-gray-300 hover:border-emerald-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {dictFilter === 'All' ? (
          /* Word Cards Grid */
          <div className="flex-1 overflow-y-auto space-y-6 pt-2 pb-8 pr-1 custom-scrollbar">
            {filtered.map((w, idx) => (
              <div key={idx} className="bg-white dark:bg-[#15231E] rounded-3xl border-2 border-[#ECE7DA] dark:border-[#20372E] shadow-lg overflow-hidden flex flex-col transition-all hover:shadow-xl">
                
                {/* Card Header (Hindi/English) */}
                <div className="p-5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-[#0C5A3E]/20 flex items-center justify-center text-2xl shadow-inner">
                      {wordIcons[w.english] || <Book className="w-6 h-6 text-[#0C5A3E]" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 leading-tight">
                        {w.hindi}
                      </h3>
                      <p className="text-sm font-bold text-gray-400 capitalize">
                        {w.english}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => playSpeech(w.hindi)}
                    className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-[#0C5A3E] transition active:scale-95 shadow-sm"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Card Body (Translations) */}
                <div className="p-4 space-y-3 bg-[#FCFAFA] dark:bg-[#111917]">
                  
                  {/* Santhali Row */}
                  <div className="flex items-center justify-between bg-white dark:bg-[#15231E] p-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md">
                    <div className="pl-2">
                      <span className="text-[10px] font-black tracking-widest text-emerald-600/60 uppercase block mb-0.5">Santhali</span>
                      <span className="text-xl font-bold text-[#0C5A3E] dark:text-[#34D399] font-['Noto_Sans_Ol_Chiki']">
                        {w.santhali}
                      </span>
                    </div>
                    <button 
                      onClick={() => playAudio(w.santhaliAudio)}
                      disabled={!w.santhaliAudio}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition active:scale-95 shadow-sm ${
                        playingAudio === w.santhaliAudio 
                          ? 'bg-[#0C5A3E] text-white animate-pulse' 
                          : w.santhaliAudio 
                            ? 'bg-emerald-50 dark:bg-[#0C5A3E]/20 text-[#0C5A3E] dark:text-[#34D399]' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-300 opacity-50'
                      }`}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mundari Row */}
                  <div className="flex items-center justify-between bg-white dark:bg-[#15231E] p-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md">
                    <div className="pl-2">
                      <span className="text-[10px] font-black tracking-widest text-emerald-600/60 uppercase block mb-0.5">Mundari</span>
                      <span className="text-xl font-bold text-[#0C5A3E] dark:text-[#34D399] font-['Noto_Sans_Nag_Mundari']">
                        {w.mundari}
                      </span>
                    </div>
                    <button 
                      onClick={() => playAudio(w.mundariAudio)}
                      disabled={!w.mundariAudio}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition active:scale-95 shadow-sm ${
                        playingAudio === w.mundariAudio 
                          ? 'bg-[#0C5A3E] text-white animate-pulse' 
                          : w.mundariAudio 
                            ? 'bg-emerald-50 dark:bg-[#0C5A3E]/20 text-[#0C5A3E] dark:text-[#34D399]' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-300 opacity-50'
                      }`}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 font-bold">No words found.</p>
              </div>
            )}
          </div>
        ) : (
          <LanguageJumbleView filter={dictFilter} playAudio={playAudio} playSpeech={playSpeech} playingAudio={playingAudio} />
        )}
      </div>
    </div>
  );
};

const LanguageJumbleView: React.FC<{
  filter: 'Hindi' | 'Santhali' | 'Mundari',
  playAudio: (p?: string) => void,
  playSpeech: (t: string) => void,
  playingAudio: string | null
}> = ({ filter, playAudio, playSpeech, playingAudio }) => {
  const itemRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  const N = dictionaryData.length;
  const radius = 130; // sphere radius

  // Calculate fixed points on a sphere (Fibonacci sphere)
  const spherePoints = React.useMemo(() => {
    const points = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      points.push({ x, y, z });
    }
    return points;
  }, [N]);

  // Main 60FPS animation loop completely bypassing React state
  React.useEffect(() => {
    let req: number;
    let rotation = 0;

    const update = () => {
      rotation += 0.003; // Speed of rotation

      for (let i = 0; i < N; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;

        const p = spherePoints[i];
        
        // Rotate around Y axis
        let rx = p.x * Math.cos(rotation) + p.z * Math.sin(rotation);
        let rz = -p.x * Math.sin(rotation) + p.z * Math.cos(rotation);
        let ry = p.y;
        
        // Slight tilt around X axis for better 3D effect
        const tilt = -0.2; 
        const ty = ry * Math.cos(tilt) - rz * Math.sin(tilt);
        const tz = ry * Math.sin(tilt) + rz * Math.cos(tilt);
        ry = ty;
        rz = tz;

        // Apply 3D perspective projection
        const perspective = 300;
        const zOffset = rz * radius; // scale normalized vector by radius
        const scale = perspective / (perspective + zOffset);
        
        const left = rx * radius * scale;
        const top = ry * radius * scale;

        const zIndex = Math.round(scale * 100);
        const opacity = Math.max(0.2, Math.min(1, scale * scale * 0.8));

        // Read playing state from dataset to avoid putting playingAudio in the dependency array
        const isPlaying = el.dataset.playing === 'true';

        // Direct DOM updates
        el.style.left = `calc(50% + ${left}px)`;
        el.style.top = `calc(50% + ${top}px)`;
        el.style.transform = `translate(-50%, -50%) scale(${isPlaying ? scale * 1.5 : scale})`;
        el.style.opacity = isPlaying ? '1' : opacity.toString();
        el.style.zIndex = isPlaying ? '999' : zIndex.toString();
        el.style.filter = isPlaying ? 'none' : `blur(${Math.max(0, (1 - scale) * 3)}px)`;
      }

      req = requestAnimationFrame(update);
    };
    req = requestAnimationFrame(update);
    return () => cancelAnimationFrame(req);
  }, [spherePoints, N]);

  // Separate effect to update dataset when audio changes, avoiding re-triggering the animation loop
  React.useEffect(() => {
    dictionaryData.forEach((w, i) => {
      const el = itemRefs.current[i];
      if (el) {
        const isPlaying = 
          (filter === 'Santhali' && playingAudio === w.santhaliAudio) ||
          (filter === 'Mundari' && playingAudio === w.mundariAudio) ||
          (filter === 'Hindi' && playingAudio === `speech-${w.hindi}`);
        el.dataset.playing = isPlaying ? 'true' : 'false';
        
        if (isPlaying) {
          el.classList.add('brightness-150');
        } else {
          el.classList.remove('brightness-150');
        }
      }
    });
  }, [playingAudio, filter]);

  const items = dictionaryData.map((w, i) => {
    const handleClick = () => {
      if (filter === 'Santhali') playAudio(w.santhaliAudio);
      else if (filter === 'Mundari') playAudio(w.mundariAudio);
      else playSpeech(w.hindi);
    };

    let text = w.hindi;
    let fontClass = '';
    if (filter === 'Santhali') {
      text = w.santhali;
      fontClass = "font-['Noto_Sans_Ol_Chiki'] text-[#0C5A3E] dark:text-[#34D399]";
    } else if (filter === 'Mundari') {
      text = w.mundari;
      fontClass = "font-['Noto_Sans_Nag_Mundari'] text-[#D97706] dark:text-amber-400";
    } else {
      fontClass = "text-blue-600 dark:text-blue-400";
    }

    return (
      <div 
        key={i}
        ref={el => itemRefs.current[i] = el}
        onClick={handleClick}
        className="absolute cursor-pointer select-none whitespace-nowrap transition-colors duration-300 hover:brightness-125"
        data-playing="false"
      >
        <span className={`font-black text-2xl drop-shadow-md ${fontClass}`}>{text}</span>
      </div>
    );
  });

  return (
    <div className="flex-1 relative w-full h-full overflow-hidden bg-[#FCFAFA] dark:bg-[#111917] rounded-3xl border-2 border-dashed border-[#ECE7DA] dark:border-[#20372E] shadow-inner mt-4 flex items-center justify-center">
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none text-9xl">
        {filter === 'Santhali' ? '🍃' : filter === 'Mundari' ? '🍂' : '📖'}
      </div>
      <p className="absolute bottom-4 left-0 right-0 text-center text-xs font-bold text-gray-400 uppercase tracking-widest z-[1000] pointer-events-none">
        Tap a word to hear it
      </p>
      
      {/* Container for the 3D items */}
      <div className="relative w-full h-full">
        {items}
      </div>
    </div>
  );
};
