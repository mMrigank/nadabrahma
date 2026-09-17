import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, Square, Repeat, Mic, Volume2, 
  Sparkles, Sliders, Music, Radio, ChevronDown, Layers, Activity, Compass, Cpu,
  Scissors, Download, RotateCcw, RotateCw, GitBranch
} from 'lucide-react';
import { Raga, Tala, RasaType, MetronomeTimbre } from '../types/daw';
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
  onOpenExtendedSpectrum?: () => void;
  onOpenVagdhenuLyrics?: () => void;
  onOpenShrutiMandala?: () => void;
  onOpenAIOrchestrator?: () => void;
  onOpenStemForge?: () => void;
  onOpenSpatialAudio?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  undoActionName?: string | null;
  redoActionName?: string | null;
  onOpenSnapshots?: () => void;
  activeBranchName?: string;
  onOpenMidiController?: () => void;
  midiDeviceCount?: number;
  onOpenPlugins?: () => void;
  onOpenArranger?: () => void;
  activeMovementName?: string;
  currentBeat: number;
  isMetronomeActive: boolean;
  onToggleMetronome: () => void;
  metronomeVolume: number;
  onMetronomeVolumeChange: (vol: number) => void;
  metronomeTimbre: MetronomeTimbre;
  onMetronomeTimbreChange: (timbre: MetronomeTimbre) => void;
  timeSignature?: string;
  onTimeSignatureChange?: (ts: string) => void;
  onSaveProject?: () => void;
  onExportMaster?: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  isPlaying,
  onTogglePlay,
  bpm,
  onBpmChange,
  timeSignature = '4/4',
  onTimeSignatureChange,
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
  onOpenExtendedSpectrum,
  onOpenVagdhenuLyrics,
  onOpenShrutiMandala,
  onOpenAIOrchestrator,
  onOpenStemForge,
  onOpenSpatialAudio,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  undoActionName,
  redoActionName,
  onOpenSnapshots,
  activeBranchName = 'master',
  onOpenMidiController,
  midiDeviceCount = 0,
  onOpenPlugins,
  onOpenArranger,
  activeMovementName,
  currentBeat,
  isMetronomeActive,
  onToggleMetronome,
  metronomeVolume,
  onMetronomeVolumeChange,
  metronomeTimbre,
  onMetronomeTimbreChange,
  onStop,
  onSaveProject,
  onExportMaster
}) => {
  const [isTanpuraActive, setIsTanpuraActive] = useState(false);
  const [isDetectingSa, setIsDetectingSa] = useState(false);
  const [showRagaDropdown, setShowRagaDropdown] = useState(false);
  const [showSaPopover, setShowSaPopover] = useState(false);
  const [showTalaDropdown, setShowTalaDropdown] = useState(false);
  const [showMetronomeSettings, setShowMetronomeSettings] = useState(false);
  const [showEnginesDropdown, setShowEnginesDropdown] = useState(false);

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

  return (
    <header className="glass-panel border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-xs select-none sticky top-0 z-[200] relative bg-black/85 backdrop-blur-xl">
      
      {/* 1. Brand Logo & Mode Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg overflow-hidden border border-red-900/50 flex items-center justify-center bg-black shadow-[0_0_15px_rgba(153,27,27,0.3)]">
            <img src="/src/assets/logo.jpg" alt="Nāḍ Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-widest text-base text-slate-100 font-serif shadow-sm">
                NĀḌ
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-tight uppercase opacity-80">
              Universal Audio Workstation
            </div>
          </div>
        </div>

        {/* Engines Dropdown to save space */}
        <div className="relative ml-2">
          <button
            onClick={() => setShowEnginesDropdown(!showEnginesDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900/80 hover:bg-stone-800/90 text-amber-200/90 border border-amber-600/25 transition-all duration-150 active:scale-95 cursor-pointer font-medium shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400/80" />
            <span>Engines & Tools</span>
            <ChevronDown className="w-3 h-3 text-amber-500/60" />
          </button>

          {showEnginesDropdown && (
            <div className="absolute top-10 left-0 w-60 glass-dropdown rounded-xl p-2 z-[9999] flex flex-col gap-1 border border-slate-700/80 shadow-2xl bg-[#090c13]/98 backdrop-blur-2xl">
              <div className="text-[10px] text-slate-500 font-semibold uppercase px-2 py-1 tracking-wider border-b border-slate-800/60 mb-1">Launchers</div>
              
              {onOpenExtendedSpectrum && (
                <button onClick={() => { onOpenExtendedSpectrum(); setShowEnginesDropdown(false); }} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-teal-900/40 text-teal-300 transition text-left">
                  <Activity className="w-3.5 h-3.5" /> <span>96k DSP Inspector</span>
                </button>
              )}
              {onOpenVagdhenuLyrics && (
                <button onClick={() => { onOpenVagdhenuLyrics(); setShowEnginesDropdown(false); }} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-amber-900/40 text-amber-300 transition text-left">
                  <span className="w-3.5 h-3.5 flex items-center justify-center text-xs">📿</span> <span>Vedic Lyrics Teleprompter</span>
                </button>
              )}
              {onOpenAIOrchestrator && (
                <button onClick={() => { onOpenAIOrchestrator(); setShowEnginesDropdown(false); }} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-purple-900/40 text-purple-300 transition text-left">
                  <Cpu className="w-3.5 h-3.5" /> <span>AI Suite (MLX runner)</span>
                </button>
              )}
              {onOpenStemForge && (
                <button onClick={() => { onOpenStemForge(); setShowEnginesDropdown(false); }} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cyan-900/40 text-cyan-300 transition text-left">
                  <Scissors className="w-3.5 h-3.5" /> <span>StemForge AI Separation</span>
                </button>
              )}
              {onOpenSpatialAudio && (
                <button onClick={() => { onOpenSpatialAudio(); setShowEnginesDropdown(false); }} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-orange-900/40 text-orange-300 transition text-left">
                  <Compass className="w-3.5 h-3.5" /> <span>3D Spatial Ambisonics</span>
                </button>
              )}
              {onOpenSnapshots && (
                <button onClick={() => { onOpenSnapshots(); setShowEnginesDropdown(false); }} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-emerald-900/40 text-emerald-300 transition text-left">
                  <GitBranch className="w-3.5 h-3.5" /> <span>Branching Snapshots</span>
                </button>
              )}
              {onOpenDirectorWizard && (
                <button onClick={() => { onOpenDirectorWizard(); setShowEnginesDropdown(false); }} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-stone-800 text-amber-200 transition text-left border-t border-slate-800 mt-1 pt-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> <span>Director’s Scene Wizard</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Central Transport Controls (Play, BPM, Tala Beads) */}
      <div className="flex items-center gap-4 bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800/60 shadow-inner">
        {/* Play / Pause / Stop */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onTogglePlay}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-600/85 hover:bg-amber-600 text-slate-950 shadow-sm font-semibold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <button 
            onClick={() => {
              if (onStop) onStop();
              else if (isPlaying) onTogglePlay();
            }}
            title="Stop playback and return to Sam"
            className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
          >
            <Square className="w-3 h-3 fill-current" />
          </button>
          <button className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 flex items-center justify-center transition cursor-pointer" title="Loop cycle">
            <Repeat className="w-3.5 h-3.5" />
          </button>

          {/* Undo & Redo History Controls */}
          {onUndo && (
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title={undoActionName ? `Undo: ${undoActionName} (Cmd+Z)` : 'Undo (Cmd+Z)'}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                canUndo 
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 cursor-pointer' 
                  : 'bg-slate-900/50 text-slate-600 opacity-40 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {onRedo && (
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title={redoActionName ? `Redo: ${redoActionName} (Cmd+Shift+Z)` : 'Redo (Cmd+Shift+Z)'}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                canRedo 
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 cursor-pointer' 
                  : 'bg-slate-900/50 text-slate-600 opacity-40 cursor-not-allowed'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Metronome / Tala Click Toggle & Settings */}
          <div className="relative flex items-center">
            <button
              onClick={onToggleMetronome}
              title={`Metronome (Tala Click): ${isMetronomeActive ? 'ON' : 'MUTED'}`}
              className={`h-7 px-2 rounded-l-lg flex items-center gap-1.5 transition cursor-pointer text-[11px] font-medium ${
                isMetronomeActive
                  ? 'bg-amber-500/15 text-amber-200/90 border-y border-l border-amber-600/30'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-500 hover:text-slate-300 border-y border-l border-slate-700/60'
              }`}
            >
              <svg 
                className={`w-3.5 h-3.5 ${isMetronomeActive && isPlaying ? 'text-amber-300' : ''}`} 
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
                  ? 'bg-amber-500/15 text-amber-200/90 border-amber-600/30'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-500 hover:text-slate-300 border-slate-700/60'
              }`}
            >
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Metronome Settings Popover */}
            {showMetronomeSettings && (
              <div className="absolute top-9 left-0 w-64 glass-dropdown rounded-xl p-3 z-[9999] shadow-2xl border border-slate-700/80 text-xs">
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
                  <span className="font-semibold text-slate-200">Metronome & Tala Tuning</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${isMetronomeActive ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                    {isMetronomeActive ? 'ACTIVE' : 'MUTED'}
                  </span>
                </div>

                {/* Timbre preset selector */}
                <div className="mb-3">
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">Acoustic Timbre</label>
                  <div className="grid grid-cols-3 gap-1 text-[10px]">
                    <button
                      onClick={() => onMetronomeTimbreChange('sa-harmonic')}
                      className={`px-1.5 py-1 rounded transition text-center cursor-pointer ${
                        metronomeTimbre === 'sa-harmonic'
                          ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50 font-semibold'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                    >
                      Sa-Harmonic
                    </button>
                    <button
                      onClick={() => onMetronomeTimbreChange('woodblock')}
                      className={`px-1.5 py-1 rounded transition text-center cursor-pointer ${
                        metronomeTimbre === 'woodblock'
                          ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50 font-semibold'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                    >
                      Woodblock
                    </button>
                    <button
                      onClick={() => onMetronomeTimbreChange('manjira')}
                      className={`px-1.5 py-1 rounded transition text-center cursor-pointer ${
                        metronomeTimbre === 'manjira'
                          ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50 font-semibold'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                    >
                      Manjira Bell
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1.5 leading-normal">
                    {metronomeTimbre === 'sa-harmonic'
                      ? `Harmonically locked to Sa (${baseSaHz} Hz) & Pa with 22 Shrutis Just Intonation.`
                      : metronomeTimbre === 'woodblock'
                      ? 'Studio acoustic physical woodblock percussion click.'
                      : 'Traditional bronze Indian bell cymbals chime.'}
                  </p>
                </div>

                {/* Volume Slider */}
                <div className="mb-2">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-slate-400">Click Volume</span>
                    <span className="font-mono text-amber-300/80 font-semibold">{Math.round(metronomeVolume * 100)}%</span>
                  </div>
                  <div className="group/volume relative flex items-center h-4 cursor-pointer">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={metronomeVolume}
                      onChange={(e) => onMetronomeVolumeChange(parseFloat(e.target.value))}
                      className="volume-slider w-full cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #b08d57 0%, #b08d57 ${metronomeVolume * 100}%, rgba(255, 255, 255, 0.12) ${metronomeVolume * 100}%, rgba(255, 255, 255, 0.12) 100%)`
                      }}
                    />
                  </div>
                </div>

                {/* Quick Test Beat Click button */}
                <button
                  onClick={() => audioEngine.playTalaClick('sam', baseSaHz, metronomeVolume, metronomeTimbre)}
                  className="w-full mt-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-[11px] font-medium border border-slate-700 transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>🔊</span>
                  <span>Test Sam Beat ({metronomeTimbre === 'sa-harmonic' ? `${(baseSaHz * 8).toFixed(1)} Hz` : metronomeTimbre})</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="h-5 w-[1px] bg-slate-800" />

        {/* BPM Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-slate-400 font-medium">BPM</span>
            <input
              type="number"
              min="40"
              max="260"
              value={bpm}
              onChange={(e) => onBpmChange(Number(e.target.value))}
              className="w-13 px-1.5 py-0.5 bg-slate-900 border border-slate-700/80 rounded text-center text-amber-200/90 font-medium focus:outline-none focus:border-amber-600/50"
            />
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-slate-400 font-medium">SIG</span>
            <input
              type="text"
              value={timeSignature}
              onChange={(e) => onTimeSignatureChange && onTimeSignatureChange(e.target.value)}
              className="w-11 px-1.5 py-0.5 bg-slate-900 border border-slate-700/80 rounded text-center text-amber-200/90 font-medium focus:outline-none focus:border-amber-600/50"
              placeholder="4/4"
            />
          </div>
        </div>

        <div className="h-5 w-[1px] bg-slate-800" />

        {/* Tala Selector & Visual Beat Beads */}
        <div className="flex items-center gap-2 relative">
          <div 
            onClick={() => setShowTalaDropdown(!showTalaDropdown)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700/80 cursor-pointer font-medium"
          >
            <Music className="w-3 h-3 text-slate-400" />
            <span>{activeTala.name} ({activeTala.matras})</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>

          {/* Tala Dropdown */}
          {showTalaDropdown && (
            <div className="absolute top-10 left-0 w-52 glass-dropdown rounded-xl p-2 z-[9999]">
              <div className="text-[10px] text-slate-400 font-semibold uppercase px-2 py-1">Select Tala (Meter)</div>
              {TALA_DATABASE.map(t => (
                <div
                  key={t.id}
                  onClick={() => { onTalaSelect(t); setShowTalaDropdown(false); }}
                  className={`px-2 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition ${
                    activeTala.id === t.id ? 'bg-amber-500/15 text-amber-200' : 'hover:bg-slate-800/70 text-slate-300'
                  }`}
                >
                  <span className="font-medium">{t.name}</span>
                  <span className="font-mono text-[10px] text-slate-400">{t.divisions}</span>
                </div>
              ))}
            </div>
          )}

          {/* Animated Beat Beads - Mellow Tones */}
          <div className="flex items-center gap-1 px-1.5 py-1 bg-slate-900/90 rounded-lg border border-slate-800">
            {Array.from({ length: activeTala.matras }).map((_, idx) => {
              const clap = activeTala.claps[idx];
              const isCurrent = isPlaying && (currentBeat % activeTala.matras) === idx;
              
              let beadColor = 'bg-slate-700/50';
              if (clap === 'sam') beadColor = 'bg-amber-600';
              else if (clap === 'tali') beadColor = 'bg-amber-500/60';
              else if (clap === 'khali') beadColor = 'bg-slate-500/40';

              return (
                <div
                  key={idx}
                  title={`Beat ${idx + 1} (${activeTala.bols[idx] || ''})`}
                  className={`w-2 h-2 rounded-full transition-all duration-75 ${beadColor} ${
                    isCurrent ? 'scale-125 ring-1 ring-amber-300/60 ring-offset-1 ring-offset-slate-950' : 'opacity-60'
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700/80 cursor-pointer font-mono text-xs transition"
          >
            <span className="text-amber-300/90 font-semibold">Sa:</span>
            <span>{baseSaHz} Hz</span>
            <span className="text-slate-400 text-[11px]">({saMidiInfo.noteName})</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Sa Popover */}
          {showSaPopover && (
            <div className="absolute top-10 right-0 w-64 glass-dropdown rounded-xl p-3 z-[9999] font-sans">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-200">Adhara Shadja (Sa)</span>
                <span className="font-mono text-amber-300 text-xs font-semibold">{baseSaHz} Hz</span>
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
                className="w-full mb-3 accent-amber-600 cursor-pointer"
              />

              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-1 mb-3 text-[10px] font-mono">
                {[130.81, 138.59, 142.5, 146.83, 196.0, 207.65, 215.0, 220.0].map(hz => (
                  <button
                    key={hz}
                    onClick={() => onSaHzChange(hz)}
                    className="px-1 py-1 rounded bg-slate-800 hover:bg-amber-500/15 text-slate-300 hover:text-amber-200 border border-slate-700 transition cursor-pointer"
                  >
                    {hz}Hz
                  </button>
                ))}
              </div>

              {/* Detect My Sa Button */}
              <button
                onClick={handleDetectSaMic}
                disabled={isDetectingSa}
                className="w-full py-1.5 rounded-lg bg-stone-850 hover:bg-stone-800 text-amber-200/90 border border-amber-600/25 font-semibold flex items-center justify-center gap-1.5 text-xs transition cursor-pointer"
              >
                <Mic className={`w-3.5 h-3.5 ${isDetectingSa ? 'animate-bounce text-amber-300' : ''}`} />
                <span>{isDetectingSa ? 'Listening to voice...' : '🎤 Detect My Sa (Mic)'}</span>
              </button>

              {/* 22 Shrutis Mandala Hub Launcher */}
              {onOpenShrutiMandala && (
                <button
                  onClick={() => {
                    setShowSaPopover(false);
                    onOpenShrutiMandala();
                  }}
                  className="w-full mt-2 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 border border-amber-600/35 font-semibold flex items-center justify-center gap-1.5 text-xs transition cursor-pointer shadow-sm"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open 22 Shrutis Mandala Hub</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Active Raga Selector & Modal Tag */}
        <div className="relative">
          <div
            onClick={() => setShowRagaDropdown(!showRagaDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700/80 cursor-pointer transition"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400/80" />
            <div className="text-left">
              <div className="font-semibold text-amber-200/90 text-xs">{activeRaga.name}</div>
              <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{activeRaga.westernMode}</div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
          </div>

          {/* Raga Dropdown */}
          {showRagaDropdown && (
            <div className="absolute top-10 right-0 w-80 glass-dropdown rounded-xl p-2.5 z-[9999] font-sans">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="font-semibold text-slate-200 text-xs">Raga & Mood Filter</span>
                <select
                  value={selectedRasa}
                  onChange={(e) => onRasaChange(e.target.value as RasaType | 'All')}
                  className="bg-slate-800 text-amber-200/90 text-[11px] rounded px-1.5 py-0.5 border border-slate-700 focus:outline-none"
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
                      activeRaga.id === r.id ? 'bg-amber-500/15 text-amber-200 border border-amber-600/30' : 'hover:bg-slate-800/70 text-slate-300'
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
              ? 'bg-amber-500/15 text-amber-200/90 border-amber-600/35 shadow-none' 
              : 'bg-slate-900 hover:bg-slate-850 text-slate-400 border-slate-700/80'
          }`}
        >
          <Volume2 className={`w-3.5 h-3.5 ${isTanpuraActive ? 'text-amber-300/80' : 'text-slate-500/70'}`} />
          <span>Tanpura: {isTanpuraActive ? 'ON' : 'OFF'}</span>
        </button>

        {/* Hardware MIDI & MPE Controller Launcher */}
        {onOpenMidiController && (
          <button
            onClick={onOpenMidiController}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/40 transition cursor-pointer font-medium text-xs shadow-sm"
            title="Open Hardware MIDI & MPE Expressive Touch Suite"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>🎹 MIDI</span>
            {midiDeviceCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            )}
          </button>
        )}

        {/* VST3 / AU Wasm Audio Plugin Host Launcher */}
        {onOpenPlugins && (
          <button
            onClick={onOpenPlugins}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-500/40 transition cursor-pointer font-medium text-xs shadow-sm"
            title="Open VST3 / AU Audio Plugin Host & Wasm DSP Sandboxing Suite"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>🎛️ FX Rack</span>
          </button>
        )}

        {/* Save & Export Buttons */}
        <div className="flex items-center gap-1 border-r border-slate-700/60 pr-2 mr-1">
          {onSaveProject && (
            <button
              onClick={onSaveProject}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition cursor-pointer font-medium text-xs shadow-sm"
              title="Save Project (.nad)"
            >
              <span>💾</span>
              <span>Save</span>
            </button>
          )}
          {onExportMaster && (
            <button
              onClick={onExportMaster}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 transition cursor-pointer font-medium text-xs shadow-sm"
              title="Export Master Mix (WAV)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export</span>
            </button>
          )}
        </div>

        {/* Intelligent Arrangement Assistant Launcher */}
        {onOpenArranger && (
          <button
            onClick={onOpenArranger}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-500/40 transition cursor-pointer font-medium text-xs shadow-sm"
            title="Open Intelligent Arrangement Assistant & Section Arranger"
          >
            <span className="text-xs">📐</span>
            <span>Arranger</span>
            {activeMovementName && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200 text-[10px] font-mono truncate max-w-[80px]">
                {activeMovementName}
              </span>
            )}
          </button>
        )}

        {/* Add Track Button */}
        <button
          onClick={onOpenAddTrack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-700/80 transition cursor-pointer font-medium"
        >
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>+ Add Track</span>
        </button>

        {/* Master Mix & 3D Spatializer Toggle */}
        <button
          onClick={onToggleMasterMixer}
          className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-700/80 flex items-center justify-center transition cursor-pointer"
          title="Master Mixer & The Owl 3D Spatializer"
        >
          <Sliders className="w-4 h-4 text-slate-300 hover:text-amber-300" />
        </button>
      </div>

    </header>
  );
};
