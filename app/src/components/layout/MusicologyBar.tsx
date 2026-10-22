import React, { useState } from 'react';
import { Radio, Music, Volume2, VolumeX, ChevronDown, Mic, Compass, Sparkles } from 'lucide-react';
import { Raga, Tala, RasaType } from '../../types/daw';
import { RAGA_DATABASE, TALA_DATABASE, hzToMidiWithCents } from '../../lib/ragaEngine';
import { audioEngine } from '../../lib/webAudioEngine';

interface MusicologyBarProps {
  baseSaHz: number;
  onSaHzChange: (hz: number) => void;
  activeRaga: Raga;
  onRagaSelect: (raga: Raga) => void;
  activeTala: Tala;
  onTalaSelect: (tala: Tala) => void;
  selectedRasa: RasaType | 'All';
  onRasaChange: (rasa: RasaType | 'All') => void;
  currentBeat: number;
  isPlaying: boolean;
  onOpenShrutiMandala?: () => void;
  aiStatus?: { active: boolean; model: string; progress: number; taskName: string; };
}

export const MusicologyBar: React.FC<MusicologyBarProps> = ({
  baseSaHz,
  onSaHzChange,
  activeRaga,
  onRagaSelect,
  activeTala,
  onTalaSelect,
  selectedRasa,
  onRasaChange,
  currentBeat,
  isPlaying,
  onOpenShrutiMandala,
  aiStatus,
}) => {
  const [showSaPopover, setShowSaPopover] = useState(false);
  const [showRagaDropdown, setShowRagaDropdown] = useState(false);
  const [showTalaDropdown, setShowTalaDropdown] = useState(false);
  const [isTanpuraActive, setIsTanpuraActive] = useState(false);
  const [isDetectingSa, setIsDetectingSa] = useState(false);

  const saMidiInfo = hzToMidiWithCents(baseSaHz);

  const filteredRagas = selectedRasa === 'All' 
    ? RAGA_DATABASE 
    : RAGA_DATABASE.filter(r => r.rasa === selectedRasa);

  const handleToggleTanpura = () => {
    const newState = audioEngine.toggleTanpura(baseSaHz, true);
    setIsTanpuraActive(!!newState);
  };

  const handleDetectSaMic = () => {
    setIsDetectingSa(true);
    setTimeout(() => {
      onSaHzChange(142.5);
      setIsDetectingSa(false);
      setShowSaPopover(false);
    }, 1200);
  };

  return (
    <div className="flex items-center gap-2 select-none">
      {/* 1. Moveable Sa Tuning */}
      <div className="relative">
        <button
          onClick={() => setShowSaPopover(!showSaPopover)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 cursor-pointer font-mono text-xs transition shadow-sm"
          title="Tonic Pitch (Moveable Sa)"
        >
          <span className="text-amber-400 font-bold">Sa:</span>
          <span>{baseSaHz} Hz</span>
          <span className="text-slate-400 text-[10px]">({saMidiInfo.noteName})</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {showSaPopover && (
          <div className="absolute top-10 left-0 w-64 glass-dropdown rounded-xl p-3 z-[9999] font-sans bg-[#0c1017] border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-200 text-xs">Adhara Shadja (Sa)</span>
              <span className="font-mono text-amber-300 text-xs font-semibold">{baseSaHz} Hz</span>
            </div>
            <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
              Moveable tonic frequency. All 22 Shrutis calculate relative to this Hz.
            </p>

            <input
              type="range"
              min="110"
              max="240"
              step="0.5"
              value={baseSaHz}
              onChange={(e) => onSaHzChange(Number(e.target.value))}
              className="w-full mb-2 accent-amber-500 cursor-pointer"
            />

            <div className="grid grid-cols-4 gap-1 mb-2.5 text-[10px] font-mono">
              {[130.81, 138.59, 142.5, 146.83, 196.0, 207.65, 215.0, 220.0].map(hz => (
                <button
                  key={hz}
                  onClick={() => onSaHzChange(hz)}
                  className="px-1 py-1 rounded bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-200 border border-slate-700 transition cursor-pointer text-center"
                >
                  {hz}Hz
                </button>
              ))}
            </div>

            <button
              onClick={handleDetectSaMic}
              disabled={isDetectingSa}
              className="w-full py-1.5 rounded-lg bg-stone-850 hover:bg-stone-800 text-amber-200 border border-amber-600/30 font-medium flex items-center justify-center gap-1.5 text-xs transition cursor-pointer"
            >
              <Mic className={`w-3.5 h-3.5 ${isDetectingSa ? 'animate-bounce text-amber-300' : ''}`} />
              <span>{isDetectingSa ? 'Listening to voice...' : 'Detect Sa with Mic'}</span>
            </button>

            {onOpenShrutiMandala && (
              <button
                onClick={() => {
                  setShowSaPopover(false);
                  onOpenShrutiMandala();
                }}
                className="w-full mt-1.5 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 border border-amber-600/30 font-medium flex items-center justify-center gap-1.5 text-xs transition cursor-pointer shadow-sm"
              >
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>22 Shrutis Mandala Hub</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Active Raga Selector */}
      <div className="relative">
        <div
          onClick={() => setShowRagaDropdown(!showRagaDropdown)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 cursor-pointer transition shadow-sm"
        >
          <Radio className="w-3.5 h-3.5 text-amber-400" />
          <div className="text-left">
            <div className="font-semibold text-amber-200 text-xs leading-none">{activeRaga.name}</div>
            <div className="text-[10px] text-slate-400 truncate max-w-[110px] mt-0.5">{activeRaga.westernMode}</div>
          </div>
          <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
        </div>

        {showRagaDropdown && (
          <div className="absolute top-10 left-0 w-72 glass-dropdown rounded-xl p-2.5 z-[9999] bg-[#0c1017] border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="font-semibold text-slate-200 text-xs">Raga & Rasa Filter</span>
              <select
                value={selectedRasa}
                onChange={(e) => onRasaChange(e.target.value as RasaType | 'All')}
                className="bg-slate-800 text-amber-200 text-[11px] rounded px-1.5 py-0.5 border border-slate-700 focus:outline-none"
              >
                <option value="All">All Rasas</option>
                <option value="Shringara">💖 Shringara</option>
                <option value="Karuna">😢 Karuna</option>
                <option value="Veera">⚔️ Veera</option>
                <option value="Adbhuta">🌌 Adbhuta</option>
                <option value="Shanta">🕊️ Shanta</option>
                <option value="Raudra">⚡ Raudra</option>
              </select>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1">
              {filteredRagas.map(r => (
                <div
                  key={r.id}
                  onClick={() => { onRagaSelect(r); setShowRagaDropdown(false); }}
                  className={`p-1.5 rounded-lg cursor-pointer transition ${
                    activeRaga.id === r.id ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">{r.name}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">{r.swaras}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">{r.westernMode}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Tala & Beat Beads */}
      <div className="flex items-center gap-1.5 relative">
        <div 
          onClick={() => setShowTalaDropdown(!showTalaDropdown)}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 cursor-pointer font-medium text-xs shadow-sm"
        >
          <Music className="w-3 h-3 text-slate-400" />
          <span>{activeTala.name}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </div>

        {showTalaDropdown && (
          <div className="absolute top-10 left-0 w-48 glass-dropdown rounded-xl p-2 z-[9999] bg-[#0c1017] border border-slate-700 shadow-2xl">
            <div className="text-[10px] text-slate-400 font-semibold uppercase px-2 py-1">Tala Rhythm</div>
            {TALA_DATABASE.map(t => (
              <div
                key={t.id}
                onClick={() => { onTalaSelect(t); setShowTalaDropdown(false); }}
                className={`px-2 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition text-xs ${
                  activeTala.id === t.id ? 'bg-amber-500/20 text-amber-200' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <span>{t.name}</span>
                <span className="font-mono text-[10px] text-slate-400">{t.matras}m</span>
              </div>
            ))}
          </div>
        )}

        {/* Visual Beat Beads */}
        <div className="flex items-center gap-1 px-1.5 py-1 bg-slate-900/90 rounded-lg border border-slate-800">
          {Array.from({ length: activeTala.matras }).map((_, idx) => {
            const clap = activeTala.claps[idx];
            const isCurrent = isPlaying && (currentBeat % activeTala.matras) === idx;
            
            let beadColor = 'bg-slate-700/50';
            if (clap === 'sam') beadColor = 'bg-amber-500';
            else if (clap === 'tali') beadColor = 'bg-amber-400/60';
            else if (clap === 'khali') beadColor = 'bg-slate-500/40';

            return (
              <div
                key={idx}
                title={`Beat ${idx + 1}`}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-75 ${beadColor} ${
                  isCurrent ? 'scale-150 ring-1 ring-amber-300 ring-offset-1 ring-offset-slate-950' : 'opacity-60'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* 4. Tanpura Drone or AI Status */}
      {aiStatus?.active ? (
        <div className="flex items-center gap-2 px-2.5 py-1 bg-amber-950/40 border border-amber-500/30 rounded-lg min-w-[160px] shadow-sm">
          <div className="flex-1">
            <div className="flex justify-between items-end text-[9px] font-mono text-amber-300 mb-0.5">
              <span className="font-semibold truncate max-w-[100px]">{aiStatus.model}</span>
              <span>{Math.round(aiStatus.progress)}%</span>
            </div>
            <div className="h-1 bg-slate-900 rounded-full w-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${aiStatus.progress}%` }} />
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={handleToggleTanpura}
          title="Toggle 22-Shruti Acoustic Tanpura Drone"
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition font-medium text-xs cursor-pointer shadow-sm ${
            isTanpuraActive
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-400'
          }`}
        >
          {isTanpuraActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 opacity-50" />}
          <span>Tanpura</span>
        </button>
      )}
    </div>
  );
};
