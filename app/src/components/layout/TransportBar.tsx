import React, { useState } from 'react';
import { Play, Pause, Square, Repeat, ChevronDown } from 'lucide-react';
import { MetronomeTimbre } from '../../types/daw';
import { audioEngine } from '../../lib/webAudioEngine';

interface TransportBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStop?: () => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  timeSignature?: string;
  onTimeSignatureChange?: (ts: string) => void;
  isMetronomeActive: boolean;
  onToggleMetronome: () => void;
  metronomeVolume: number;
  onMetronomeVolumeChange: (vol: number) => void;
  metronomeTimbre: MetronomeTimbre;
  onMetronomeTimbreChange: (timbre: MetronomeTimbre) => void;
  baseSaHz: number;
}

export const TransportBar: React.FC<TransportBarProps> = ({
  isPlaying,
  onTogglePlay,
  onStop,
  bpm,
  onBpmChange,
  timeSignature = '4/4',
  onTimeSignatureChange,
  isMetronomeActive,
  onToggleMetronome,
  metronomeVolume,
  onMetronomeVolumeChange,
  metronomeTimbre,
  onMetronomeTimbreChange,
  baseSaHz,
}) => {
  const [showMetronomeSettings, setShowMetronomeSettings] = useState(false);

  return (
    <div className="flex items-center gap-3 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800/80 shadow-inner select-none">
      {/* Play / Pause / Stop / Loop */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onTogglePlay}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            isPlaying
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md font-semibold'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>
        <button 
          onClick={() => {
            if (onStop) onStop();
            else if (isPlaying) onTogglePlay();
          }}
          title="Stop playback and return to Sam"
          className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
        >
          <Square className="w-3 h-3 fill-current" />
        </button>
        <button 
          className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition cursor-pointer" 
          title="Loop Cycle"
        >
          <Repeat className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-4 w-[1px] bg-slate-800" />

      {/* BPM & Signature */}
      <div className="flex items-center gap-2 font-mono text-[11px]">
        <div className="flex items-center gap-1">
          <span className="text-slate-400 font-medium">BPM</span>
          <input
            type="number"
            min="40"
            max="260"
            value={bpm}
            onChange={(e) => onBpmChange(Number(e.target.value))}
            className="w-12 px-1 py-0.5 bg-slate-900 border border-slate-700 rounded text-center text-amber-300 font-medium focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-slate-400 font-medium">SIG</span>
          <select
            value={timeSignature}
            onChange={(e) => onTimeSignatureChange && onTimeSignatureChange(e.target.value)}
            className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-center text-amber-300 font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="4/4">4/4</option>
            <option value="3/4">3/4</option>
            <option value="6/8">6/8</option>
            <option value="7/8">7/8</option>
            <option value="5/4">5/4</option>
            <option value="12/8">12/8</option>
          </select>
        </div>
      </div>

      <div className="h-4 w-[1px] bg-slate-800" />

      {/* Metronome / Tala Click */}
      <div className="relative flex items-center">
        <button
          onClick={onToggleMetronome}
          title={`Metronome (Tala Click): ${isMetronomeActive ? 'ON' : 'MUTED'}`}
          className={`h-7 px-2 rounded-l-lg flex items-center gap-1.5 transition cursor-pointer text-[11px] font-medium ${
            isMetronomeActive
              ? 'bg-amber-500/20 text-amber-200 border-y border-l border-amber-500/40'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-500 hover:text-slate-300 border-y border-l border-slate-700'
          }`}
        >
          <svg 
            className={`w-3.5 h-3.5 ${isMetronomeActive && isPlaying ? 'text-amber-400' : ''}`} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="m4.5 21 4.5-16.5a1.5 1.5 0 0 1 2.8 0L16.3 21" />
            <path d="M6.2 16h8.4" />
            <path d="M10.4 8l5 6" />
          </svg>
          <span>Click</span>
        </button>
        <button
          onClick={() => setShowMetronomeSettings(!showMetronomeSettings)}
          title="Metronome & Tala Tuning Settings"
          className={`h-7 px-1.5 rounded-r-lg flex items-center justify-center transition cursor-pointer border-y border-r ${
            isMetronomeActive
              ? 'bg-amber-500/20 text-amber-200 border-amber-500/40'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-500 hover:text-slate-300 border-slate-700'
          }`}
        >
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {/* Metronome Settings Popover */}
        {showMetronomeSettings && (
          <div className="absolute top-9 left-0 w-64 glass-dropdown rounded-xl p-3 z-[9999] shadow-2xl border border-slate-700/80 text-xs bg-[#0c1017]">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
              <span className="font-semibold text-slate-200">Metronome & Tala Tuning</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${isMetronomeActive ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                {isMetronomeActive ? 'ACTIVE' : 'MUTED'}
              </span>
            </div>

            <div className="mb-3">
              <label className="text-[10px] text-slate-400 font-medium block mb-1">Acoustic Timbre</label>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                {(['sa-harmonic', 'woodblock', 'manjira'] as MetronomeTimbre[]).map((timbre) => (
                  <button
                    key={timbre}
                    onClick={() => onMetronomeTimbreChange(timbre)}
                    className={`px-1 py-1 rounded transition text-center cursor-pointer capitalize ${
                      metronomeTimbre === timbre
                        ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50 font-semibold'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {timbre.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-2">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-slate-400">Click Volume</span>
                <span className="font-mono text-amber-300 font-semibold">{Math.round(metronomeVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={metronomeVolume}
                onChange={(e) => onMetronomeVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <button
              onClick={() => audioEngine.playTalaClick('sam', baseSaHz, metronomeVolume, metronomeTimbre)}
              className="w-full mt-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 transition cursor-pointer flex items-center justify-center gap-1"
            >
              <span>🔊</span>
              <span>Test Sam Beat</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
