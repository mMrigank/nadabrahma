import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, Square, Repeat, Mic, Volume2, 
  Sparkles, Sliders, Music, Radio, ChevronDown, Layers
} from 'lucide-react';
import { Raga, Tala, RasaType } from '../types/daw';
import { RAGA_DATABASE, TALA_DATABASE, hzToMidiWithCents } from '../lib/ragaEngine';
import { audioEngine } from '../lib/webAudioEngine';

interface HeaderHUDProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  baseSaHz: number;
  onSaHzChange: (hz: number) => void;
  activeRaga: Raga;
  onRagaSelect: (raga: Raga) => void;
  activeTala: Tala;
  onTalaSelect: (tala: Tala) => void;
  selectedRasa: RasaType | 'All';
  onRasaChange: (rasa: RasaType | 'All') => void;
  onOpenDirectorWizard: () => void;
  onOpenAddTrack: () => void;
  onToggleMasterMixer: () => void;
  currentBeat: number;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  isPlaying,
  onTogglePlay,
  bpm,
  onBpmChange,
  baseSaHz,
  onSaHzChange,
  activeRaga,
  onRagaSelect,
  activeTala,
  onTalaSelect,
  selectedRasa,
  onRasaChange,
  onOpenDirectorWizard,
  onOpenAddTrack,
  onToggleMasterMixer,
  currentBeat
}) => {
  const [isTanpuraActive, setIsTanpuraActive] = useState(false);
  const [isDetectingSa, setIsDetectingSa] = useState(false);
  const [showRagaDropdown, setShowRagaDropdown] = useState(false);
  const [showSaPopover, setShowSaPopover] = useState(false);
  const [showTalaDropdown, setShowTalaDropdown] = useState(false);

  const saMidiInfo = hzToMidiWithCents(baseSaHz);

  // Filter Ragas based on selected Rasa
  const filteredRagas = selectedRasa === 'All' 
    ? RAGA_DATABASE 
    : RAGA_DATABASE.filter(r => r.rasa === selectedRasa);

  const handleToggleTanpura = () => {
    const newState = audioEngine.toggleTanpura(baseSaHz, true);
    setIsTanpuraActive(!!newState);
  };

  const handleDetectSaMic = () => {
    setIsDetectingSa(true);
    // Simulate real-time mic listening & pitch extraction (e.g. 142.5 Hz)
    setTimeout(() => {
      onSaHzChange(142.5);
      setIsDetectingSa(false);
      setShowSaPopover(false);
    }, 1200);
  };

  // Play metronome click on beat pulse
  useEffect(() => {
    if (isPlaying) {
      const beatIndex = currentBeat % activeTala.matras;
      const clapType = activeTala.claps[beatIndex] || 'tali';
      audioEngine.playTalaClick(clapType);
    }
  }, [currentBeat, isPlaying, activeTala]);

  return (
    <header className="glass-panel border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-xs select-none sticky top-0 z-40">
      
      {/* 1. Brand Logo & Mode Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-bold text-sm">
            🕉️
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-wider text-base text-slate-100 font-serif">
                NĀDABRAHMA
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                96k Ultra-HD
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-tight">
              M1 Max (32GB) · Universal Audio Workstation
            </div>
          </div>
        </div>

        {/* Director's Scene Wizard Launcher Button */}
        <button
          onClick={onOpenDirectorWizard}
          className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 shadow-sm transition-all duration-150 active:scale-95 cursor-pointer font-medium"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Director’s Scene Wizard</span>
        </button>
      </div>

      {/* 2. Central Transport Controls (Play, BPM, Tala Beads) */}
      <div className="flex items-center gap-4 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800/60 shadow-inner">
        {/* Play / Pause / Stop */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onTogglePlay}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <button 
            onClick={() => isPlaying && onTogglePlay()}
            className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
          >
            <Square className="w-3 h-3 fill-current" />
          </button>
          <button className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 flex items-center justify-center transition cursor-pointer">
            <Repeat className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-5 w-[1px] bg-slate-800" />

        {/* BPM Selector */}
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-slate-400 font-medium">BPM</span>
          <input
            type="number"
            min="40"
            max="260"
            value={bpm}
            onChange={(e) => onBpmChange(Number(e.target.value))}
            className="w-13 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-center text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="h-5 w-[1px] bg-slate-800" />

        {/* Tala Selector & Visual Beat Beads */}
        <div className="flex items-center gap-2 relative">
          <div 
            onClick={() => setShowTalaDropdown(!showTalaDropdown)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700 cursor-pointer font-medium"
          >
            <Music className="w-3 h-3 text-cyan-400" />
            <span>{activeTala.name} ({activeTala.matras})</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>

          {/* Tala Dropdown */}
          {showTalaDropdown && (
            <div className="absolute top-10 left-0 w-52 glass-dropdown rounded-xl p-2 z-50">
              <div className="text-[10px] text-slate-400 font-semibold uppercase px-2 py-1">Select Tala (Meter)</div>
              {TALA_DATABASE.map(t => (
                <div
                  key={t.id}
                  onClick={() => { onTalaSelect(t); setShowTalaDropdown(false); }}
                  className={`px-2 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition ${
                    activeTala.id === t.id ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-slate-800/70 text-slate-300'
                  }`}
                >
                  <span className="font-medium">{t.name}</span>
                  <span className="font-mono text-[10px] text-slate-400">{t.divisions}</span>
                </div>
              ))}
            </div>
          )}

          {/* Animated Beat Beads */}
          <div className="flex items-center gap-1 px-1.5 py-1 bg-slate-900/90 rounded-lg border border-slate-800">
            {Array.from({ length: activeTala.matras }).map((_, idx) => {
              const clap = activeTala.claps[idx];
              const isCurrent = isPlaying && (currentBeat % activeTala.matras) === idx;
              
              let beadColor = 'bg-slate-700';
              if (clap === 'sam') beadColor = 'bg-rose-500';
              else if (clap === 'tali') beadColor = 'bg-amber-400';
              else if (clap === 'khali') beadColor = 'bg-slate-300';

              return (
                <div
                  key={idx}
                  title={`Beat ${idx + 1} (${activeTala.bols[idx] || ''})`}
                  className={`w-2 h-2 rounded-full transition-all duration-75 ${beadColor} ${
                    isCurrent ? 'scale-150 ring-2 ring-white ring-offset-1 ring-offset-slate-950' : 'opacity-70'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Raga, Sa Frequency & Tanpura Hub */}
      <div className="flex items-center gap-3">
        {/* Moveable Sa (Frequency in Hz) */}
        <div className="relative">
          <button
            onClick={() => setShowSaPopover(!showSaPopover)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 cursor-pointer font-mono text-xs transition"
          >
            <span className="text-amber-400 font-bold">Sa:</span>
            <span>{baseSaHz} Hz</span>
            <span className="text-slate-400 text-[11px]">({saMidiInfo.noteName})</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Sa Popover */}
          {showSaPopover && (
            <div className="absolute top-10 right-0 w-64 glass-dropdown rounded-xl p-3 z-50 font-sans">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-200">Adhara Shadja (Sa)</span>
                <span className="font-mono text-amber-400 text-xs font-bold">{baseSaHz} Hz</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                Tune the fundamental acoustic tonic of the universe. All 22 Shrutis calculate relative to this Hz.
              </p>

              {/* Slider */}
              <input
                type="range"
                min="110"
                max="240"
                step="0.5"
                value={baseSaHz}
                onChange={(e) => onSaHzChange(Number(e.target.value))}
                className="w-full mb-3 accent-amber-500 cursor-pointer"
              />

              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-1 mb-3 text-[10px] font-mono">
                {[130.81, 138.59, 142.5, 146.83, 196.0, 207.65, 215.0, 220.0].map(hz => (
                  <button
                    key={hz}
                    onClick={() => onSaHzChange(hz)}
                    className="px-1 py-1 rounded bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 transition cursor-pointer"
                  >
                    {hz}Hz
                  </button>
                ))}
              </div>

              {/* Detect My Sa Button */}
              <button
                onClick={handleDetectSaMic}
                disabled={isDetectingSa}
                className="w-full py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold flex items-center justify-center gap-1.5 text-xs transition cursor-pointer"
              >
                <Mic className={`w-3.5 h-3.5 ${isDetectingSa ? 'animate-bounce text-yellow-200' : ''}`} />
                <span>{isDetectingSa ? 'Listening to voice...' : '🎤 Detect My Sa (Mic)'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Active Raga Selector & Modal Tag */}
        <div className="relative">
          <div
            onClick={() => setShowRagaDropdown(!showRagaDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 cursor-pointer transition"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <div className="text-left">
              <div className="font-semibold text-amber-300 text-xs">{activeRaga.name}</div>
              <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{activeRaga.westernMode}</div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
          </div>

          {/* Raga Dropdown */}
          {showRagaDropdown && (
            <div className="absolute top-10 right-0 w-80 glass-dropdown rounded-xl p-2.5 z-50 font-sans">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="font-semibold text-slate-200 text-xs">Raga & Mood Filter</span>
                <select
                  value={selectedRasa}
                  onChange={(e) => onRasaChange(e.target.value as RasaType | 'All')}
                  className="bg-slate-800 text-amber-300 text-[11px] rounded px-1.5 py-0.5 border border-slate-700 focus:outline-none"
                >
                  <option value="All">All Rasas (Moods)</option>
                  <option value="Shringara">💖 Shringara (Love)</option>
                  <option value="Karuna">😢 Karuna (Pathos)</option>
                  <option value="Veera">⚔️ Veera (Heroic)</option>
                  <option value="Adbhuta">🌌 Adbhuta (Wonder)</option>
                  <option value="Shanta">🕊️ Shanta (Peace)</option>
                  <option value="Raudra">⚡ Raudra (Fury)</option>
                </select>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1">
                {filteredRagas.map(r => (
                  <div
                    key={r.id}
                    onClick={() => { onRagaSelect(r); setShowRagaDropdown(false); }}
                    className={`p-2 rounded-lg cursor-pointer transition ${
                      activeRaga.id === r.id ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30' : 'hover:bg-slate-800/70 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs">{r.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">{r.swaras}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">{r.westernMode}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tanpura Drone Toggle */}
        <button
          onClick={handleToggleTanpura}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition cursor-pointer font-medium ${
            isTanpuraActive 
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20' 
              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-700/80'
          }`}
        >
          <Volume2 className={`w-3.5 h-3.5 ${isTanpuraActive ? 'text-amber-400 animate-pulse' : ''}`} />
          <span>Tanpura: {isTanpuraActive ? 'ON' : 'OFF'}</span>
        </button>

        {/* Add Track Button */}
        <button
          onClick={onOpenAddTrack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 transition cursor-pointer font-medium"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>+ Add Track</span>
        </button>

        {/* Master Mix & 3D Spatializer Toggle */}
        <button
          onClick={onToggleMasterMixer}
          className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 flex items-center justify-center transition cursor-pointer"
          title="Master Mixer & The Owl 3D Spatializer"
        >
          <Sliders className="w-4 h-4 text-cyan-400" />
        </button>
      </div>

    </header>
  );
};
