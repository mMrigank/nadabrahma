import React, { useState, useRef } from 'react';
import { 
  Music, Sliders, Play, Plus, Trash2, 
  ZoomIn, ZoomOut, Maximize2, Minimize2, X,
  Waves, Sparkles, Activity, Check, ChevronDown, Volume2, ArrowRight,
  Zap, Copy, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { Raga, Track } from '../types/daw';
import { calculateSwaraFrequency, hzToMidiWithCents } from '../lib/ragaEngine';
import { audioEngine } from '../lib/webAudioEngine';
import { 
  GamakaConfig, 
  GamakaType, 
  GAMAKA_DEFINITIONS, 
  MASTER_GAMAKA_PRESETS,
  calculateGamakaSvgPath 
} from '../lib/gamakaData';

interface PianoRollProps {
  selectedTrack: Track;
  activeRaga: Raga;
  baseSaHz: number;
  onClose: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  playheadPosition?: number;
  timeSignature?: string;
}

export interface NoteEvent {
  id: string;
  swaraKey: string;
  swaraName: string;
  pitchMidi: number;
  startStep: number;
  durationSteps: number;
  gamaka?: GamakaConfig;
}

const SWARA_KEYS = [
  { key: 'S_high', name: 'Ṡ (Taar Sa)', isKomal: false },
  { key: 'N1', name: 'N (Shuddha Ni)', isKomal: false },
  { key: 'n1', name: 'n (Komal ni)', isKomal: true },
  { key: 'D1', name: 'D (Shuddha Dha)', isKomal: false },
  { key: 'd2', name: 'd (Komal dha)', isKomal: true },
  { key: 'P', name: 'P (Pancham)', isKomal: false },
  { key: 'M3', name: "M' (Tivra Ma)", isKomal: false },
  { key: 'M1', name: 'M (Shuddha Ma)', isKomal: false },
  { key: 'G1', name: 'G (Shuddha Ga)', isKomal: false },
  { key: 'g2', name: 'g (Komal ga)', isKomal: true },
  { key: 'R2', name: 'R (Shuddha Re)', isKomal: false },
  { key: 'r1', name: 'r (Komal re)', isKomal: true },
  { key: 'S', name: 'S (Madhya Sa)', isKomal: false }
];

export const PianoRoll: React.FC<PianoRollProps> = ({
  selectedTrack,
  activeRaga,
  baseSaHz,
  onClose,
  isExpanded = false,
  onToggleExpand,
  playheadPosition = 1,
  timeSignature = '4/4'
}) => {
  const totalSteps = 64; // Increased to 64 for longer scrolling
  const [stepWidth, setStepWidth] = useState<number>(54); // Horizontal stretch in pixels per step (36px - 96px)
  const [activeLane, setActiveLane] = useState<'notes' | 'meend'>('notes');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>('3'); // Default select Ga
  const [copiedPromptToast, setCopiedPromptToast] = useState<string | null>(null);

  const tsParts = timeSignature.split('/');
  const beatsPerBar = parseInt(tsParts[0]) || 4;

  const keysRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleGridScroll = () => {
    if (keysRef.current && gridRef.current) {
      keysRef.current.scrollTop = gridRef.current.scrollTop;
    }
  };

  const handleKeysScroll = () => {
    if (keysRef.current && gridRef.current) {
      gridRef.current.scrollTop = keysRef.current.scrollTop;
    }
  };

  // Initial phrase with authentic classical Gamakas
  const [notes, setNotes] = useState<NoteEvent[]>([
    { 
      id: '1', 
      swaraKey: 'S', 
      swaraName: 'S', 
      pitchMidi: 62, 
      startStep: 0, 
      durationSteps: 4,
      gamaka: {
        type: 'none',
        name: 'Sthira Sa',
        sanskritName: 'स्थिर',
        shortLabel: 'Sthira',
        description: 'Pure tonic foundation',
        depthCents: 0,
        speedHz: 0,
        curveTension: 0.5,
        color: '#94a3b8'
      }
    },
    { 
      id: '2', 
      swaraKey: 'R2', 
      swaraName: 'R', 
      pitchMidi: 64, 
      startStep: 4, 
      durationSteps: 4,
      gamaka: {
        type: 'kan',
        name: 'Sa-Kan Touch',
        sanskritName: 'कण',
        shortLabel: 'Kan',
        description: 'Subtle grace touch of lower Sa',
        depthCents: 80,
        speedHz: 0,
        curveTension: 0.8,
        color: '#8f6277'
      }
    },
    { 
      id: '3', 
      swaraKey: 'G1', 
      swaraName: 'G', 
      pitchMidi: 66, 
      startStep: 8, 
      durationSteps: 6,
      gamaka: {
        type: 'andolan',
        name: 'Gandhar Meditative Andolan',
        sanskritName: 'आंदोलन',
        shortLabel: 'Andolan',
        description: 'Slow graceful 2.4Hz swinging oscillation',
        depthCents: 30,
        speedHz: 2.4,
        curveTension: 0.7,
        color: '#5d7491'
      }
    },
    { 
      id: '4', 
      swaraKey: 'M3', 
      swaraName: "M'", 
      pitchMidi: 68, 
      startStep: 14, 
      durationSteps: 2,
      gamaka: {
        type: 'murki',
        name: 'Tivra Ma Murki',
        sanskritName: 'मुर्की',
        shortLabel: 'Murki',
        description: 'Rapid grace cluster G-M-P-M',
        depthCents: 45,
        speedHz: 6.5,
        curveTension: 0.5,
        color: '#528275'
      }
    },
    { 
      id: '5', 
      swaraKey: 'P', 
      swaraName: 'P', 
      pitchMidi: 69, 
      startStep: 16, 
      durationSteps: 8,
      gamaka: {
        type: 'meend',
        name: 'Pancham to Gandhar Meend',
        sanskritName: 'मींड',
        shortLabel: 'Meend (P->G)',
        description: 'Cascading glide through Tivra Ma down to Ga',
        targetSwaraKey: 'G1',
        targetSwaraName: 'G (Shuddha Ga)',
        depthCents: 0,
        speedHz: 0,
        curveTension: 0.7,
        color: '#b08d57'
      }
    }
  ]);

  // Meend Trajectory Nodes (Continuous F0 representation)
  const [trajectoryPoints, setTrajectoryPoints] = useState<Array<{ step: number; freqRatio: number; label: string }>>([
    { step: 0, freqRatio: 1.0, label: 'Sa (138.6Hz)' },
    { step: 6, freqRatio: 1.125, label: 'Re (155.6Hz)' },
    { step: 12, freqRatio: 1.25, label: 'Ga (173.2Hz)' },
    { step: 18, freqRatio: 1.406, label: "Ma' (194.9Hz)" },
    { step: 24, freqRatio: 1.5, label: 'Pa (207.9Hz)' },
    { step: 31, freqRatio: 1.25, label: 'Ga Meend End' }
  ]);

  const selectedNote = notes.find(n => n.id === selectedNoteId) || notes[0];

  const isSwaraInActiveRaga = (swaraName: string) => {
    const pureName = swaraName.split(' ')[0];
    return activeRaga.swaras.includes(pureName);
  };

  const handleCellClick = (swaraItem: typeof SWARA_KEYS[0], step: number) => {
    const existing = notes.find(n => n.swaraKey === swaraItem.key && n.startStep <= step && step < (n.startStep + n.durationSteps));
    if (existing) {
      if (selectedNoteId === existing.id) {
        // Double click removes note
        setNotes(notes.filter(n => n.id !== existing.id));
        setSelectedNoteId(null);
      } else {
        setSelectedNoteId(existing.id);
        const freq = calculateSwaraFrequency(baseSaHz, existing.swaraKey);
        if (existing.gamaka && existing.gamaka.type !== 'none') {
          audioEngine.playGamakaPreview(freq, existing.gamaka);
        } else {
          audioEngine.playNotePreview(freq, 0.4);
        }
      }
    } else {
      const freq = calculateSwaraFrequency(baseSaHz, swaraItem.key);
      const midi = hzToMidiWithCents(freq).midiNote;
      audioEngine.playNotePreview(freq, 0.4);

      const newId = String(Date.now());
      const newNote: NoteEvent = {
        id: newId,
        swaraKey: swaraItem.key,
        swaraName: swaraItem.name,
        pitchMidi: midi,
        startStep: step,
        durationSteps: 4,
        gamaka: {
          type: 'none',
          name: 'Sthira',
          sanskritName: 'स्थिर',
          shortLabel: 'Sthira',
          description: 'Pure straight tone',
          depthCents: 0,
          speedHz: 0,
          curveTension: 0.5,
          color: '#94a3b8'
        }
      };

      setNotes([...notes, newNote]);
      setSelectedNoteId(newId);
    }
  };

  // Update Gamaka for selected note
  const handleAssignGamaka = (type: GamakaType) => {
    if (!selectedNote) return;

    const def = GAMAKA_DEFINITIONS[type];
    const newGamaka: GamakaConfig = {
      type,
      name: def.name,
      sanskritName: def.sanskritName,
      shortLabel: def.shortLabel,
      description: def.description,
      depthCents: def.defaultDepthCents,
      speedHz: def.defaultSpeedHz,
      curveTension: 0.65,
      color: def.color,
      targetSwaraKey: type === 'meend' ? 'S' : undefined,
      targetSwaraName: type === 'meend' ? 'S (Madhya Sa)' : undefined
    };

    setNotes(notes.map(n => n.id === selectedNote.id ? { ...n, gamaka: newGamaka } : n));

    // Audition gamaka
    const freq = calculateSwaraFrequency(baseSaHz, selectedNote.swaraKey);
    audioEngine.playGamakaPreview(freq, newGamaka);
  };

  const handleApplyPreset = (preset: typeof MASTER_GAMAKA_PRESETS[0]) => {
    if (!selectedNote) return;
    setNotes(notes.map(n => n.id === selectedNote.id ? { ...n, gamaka: preset.config } : n));
    const freq = calculateSwaraFrequency(baseSaHz, selectedNote.swaraKey);
    audioEngine.playGamakaPreview(freq, preset.config);
  };

  const handleAuditionSelected = () => {
    if (!selectedNote) return;
    const freq = calculateSwaraFrequency(baseSaHz, selectedNote.swaraKey);
    if (selectedNote.gamaka && selectedNote.gamaka.type !== 'none') {
      let targetFreq = freq;
      if (selectedNote.gamaka.targetSwaraKey) {
        targetFreq = calculateSwaraFrequency(baseSaHz, selectedNote.gamaka.targetSwaraKey);
      }
      audioEngine.playGamakaPreview(freq, selectedNote.gamaka, targetFreq);
    } else {
      audioEngine.playNotePreview(freq, 0.6);
    }
  };

  // Audition full trajectory
  const handleAuditionTrajectory = () => {
    trajectoryPoints.forEach((pt, idx) => {
      setTimeout(() => {
        const f = baseSaHz * pt.freqRatio;
        audioEngine.playNotePreview(f, 0.4);
      }, idx * 300);
    });
  };

  const handleCopyPrompt = () => {
    const phraseDesc = notes
      .map(n => `${n.swaraName.split(' ')[0]}${n.gamaka?.type !== 'none' ? ` (${n.gamaka?.shortLabel})` : ''}`)
      .join(' - ');
    const fullPrompt = `[Indian Classical ${activeRaga.name}] Adhara Sa: ${baseSaHz.toFixed(1)}Hz. Phrase: ${phraseDesc}. Microtonal Gamakas: Meend glide, Andolan wave. 96kHz extended spectrum (48k Air, 10Hz Sub).`;
    navigator.clipboard.writeText(fullPrompt);
    setCopiedPromptToast('✨ Copied Dual-Conditioned Gamaka Prompt to Clipboard!');
    setTimeout(() => setCopiedPromptToast(null), 3500);
  };

  // Keyboard Delete for Notes
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedNoteId) {
          setNotes(prev => prev.filter(n => n.id !== selectedNoteId));
          setSelectedNoteId(null);
          audioEngine.playNotePreview(150, 0.1); // subtle low thud
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNoteId]);

  return (
    <div className="h-full w-full bg-[#070a0f] flex flex-col select-none text-xs font-sans">
      
      {/* 1. Piano Roll Header Toolbar */}
      <div className="h-10 border-b border-white/[0.12] px-4 flex items-center justify-between bg-[#080c14] shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <Music className="w-3.5 h-3.5 text-amber-400" />
            <span>Swara Piano Roll & Gamaka Modeler</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-950/70 text-amber-300 border border-amber-600/30">
              22 Shrutis Microtonal
            </span>
          </div>

          <div className="text-[11px] text-slate-400">
            Track: <span className="text-amber-200/90 font-medium">{selectedTrack ? selectedTrack.name : 'No Track Selected'}</span>
          </div>

          {/* Lane Selector Toggle */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-white/[0.12]">
            <button
              onClick={() => setActiveLane('notes')}
              className={`px-2.5 py-1 rounded text-[10px] font-medium cursor-pointer transition flex items-center gap-1 ${
                activeLane === 'notes' 
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm font-semibold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Music className="w-3 h-3" />
              <span>Swara Notes Grid</span>
            </button>
            <button
              onClick={() => setActiveLane('meend')}
              className={`px-2.5 py-1 rounded text-[10px] font-medium cursor-pointer transition flex items-center gap-1 ${
                activeLane === 'meend' 
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm font-semibold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Waves className="w-3 h-3 text-amber-400" />
              <span>〰️ Continuous Meend Curve (F0)</span>
            </button>
          </div>
        </div>

        {/* Right Toolbar Controls: Active Raga, Zoom, Expand, Close */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="text-slate-500">Raga:</span>
            <span className="text-amber-200/90 font-semibold">{activeRaga.name}</span>
            <span className="text-slate-500">| Arohana:</span>
            <span className="text-slate-300">{activeRaga.arohana || activeRaga.swaras}</span>
          </div>

          {/* Horizontal Step Zoom */}
          {activeLane === 'notes' && (
            <div className="flex items-center gap-1 bg-slate-900 border border-white/[0.08] rounded px-1.5 py-0.5">
              <button 
                onClick={() => setStepWidth(prev => Math.max(36, prev - 8))}
                title="Zoom Out Steps"
                className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="text-slate-400 text-[9px] w-6 text-center font-mono">{stepWidth}p</span>
              <button 
                onClick={() => setStepWidth(prev => Math.min(96, prev + 8))}
                title="Zoom In Steps (Stretch Horizontally)"
                className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Height Expand / Restore Toggle */}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              title={isExpanded ? "Restore standard height" : "Move up & expand height"}
              className="p-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-amber-200 border border-white/[0.08] transition cursor-pointer"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Close Drawer Button */}
          {onClose && (
            <button
              onClick={onClose}
              title="Close Piano Roll Drawer"
              className="p-1 rounded bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-white/[0.08] transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Audio Take Active Banner */}
      {selectedTrack?.clips?.some(c => c.audioBuffer || (c.waveformPoints && c.waveformPoints.length > 0)) && (
        <div className="px-4 py-1.5 bg-emerald-950/40 border-b border-emerald-800/40 flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              <strong className="text-emerald-300">Audio Master Take Active:</strong> {selectedTrack.takes?.[selectedTrack.activeTakeIndex]?.name || selectedTrack.clips[0]?.name} ({selectedTrack.takes?.[selectedTrack.activeTakeIndex]?.durationSec || 98}s • 48kHz Stereo). Real audio is mounted on the timeline.
            </span>
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono">
            Timeline plays rendered WAV audio • Swara grid available for microtonal tuning
          </span>
        </div>
      )}

      {/* 2. Gamaka Inspector & Microtonal Control Strip (Pinned below toolbar) */}
      <div className="px-4 py-1.5 bg-[#0a0f18] border-b border-white/[0.10] flex items-center justify-between gap-4 shrink-0 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[11px]">Selected Note:</span>
            {selectedNote ? (
              <span className="font-bold text-amber-300 font-mono">
                {selectedNote.swaraName} (Step {selectedNote.startStep + 1})
              </span>
            ) : (
              <span className="text-slate-500 italic">None (click note below)</span>
            )}
          </div>

          <div className="w-px h-4 bg-slate-800"></div>

          {/* Gamaka Type Quick Selector */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider mr-1">Gamaka:</span>
            {(['none', 'meend', 'andolan', 'kampita', 'murki', 'kan'] as GamakaType[]).map((type) => {
              const def = GAMAKA_DEFINITIONS[type];
              const isCurrent = selectedNote?.gamaka?.type === type;
              return (
                <button
                  key={type}
                  onClick={() => handleAssignGamaka(type)}
                  className={`px-2 py-1 rounded text-[10px] font-medium cursor-pointer transition flex items-center gap-1 ${
                    isCurrent
                      ? 'bg-amber-500/25 text-amber-200 border border-amber-500/50 shadow-sm font-semibold'
                      : 'bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                  title={def.description}
                >
                  <span>{def.icon}</span>
                  <span>{def.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* If Meend: Target Swara Selector */}
          {selectedNote?.gamaka?.type === 'meend' && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-white/[0.08]">
              <span className="text-[10px] text-slate-400 font-mono">Glide To:</span>
              <select
                value={selectedNote.gamaka.targetSwaraKey || 'G1'}
                onChange={(e) => {
                  const targetKey = e.target.value;
                  const targetSwara = SWARA_KEYS.find(s => s.key === targetKey);
                  if (selectedNote.gamaka) {
                    const updated = {
                      ...selectedNote.gamaka,
                      targetSwaraKey: targetKey,
                      targetSwaraName: targetSwara?.name || targetKey
                    };
                    setNotes(notes.map(n => n.id === selectedNote.id ? { ...n, gamaka: updated } : n));
                  }
                }}
                className="bg-slate-950 border border-slate-700 text-amber-300 text-[11px] rounded px-1.5 py-0.5 font-mono focus:outline-none"
              >
                {SWARA_KEYS.map(s => (
                  <option key={s.key} value={s.key}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* If Andolan / Kampita: Depth Slider */}
          {(selectedNote?.gamaka?.type === 'andolan' || selectedNote?.gamaka?.type === 'kampita') && (
            <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08] text-[10px] font-mono">
              <span className="text-slate-400">Depth:</span>
              <input
                type="range"
                min="10"
                max="60"
                value={selectedNote.gamaka.depthCents}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (selectedNote.gamaka) {
                    const updated = { ...selectedNote.gamaka, depthCents: val };
                    setNotes(notes.map(n => n.id === selectedNote.id ? { ...n, gamaka: updated } : n));
                  }
                }}
                className="w-16 h-1 rounded bg-slate-800 accent-amber-400 cursor-pointer"
              />
              <span className="text-amber-300 font-bold">{selectedNote.gamaka.depthCents}c</span>
            </div>
          )}
        </div>

        {/* Audition & Presets Button */}
        <div className="flex items-center gap-2">
          {copiedPromptToast && (
            <span className="text-emerald-400 font-semibold text-[10px] animate-in fade-in">
              {copiedPromptToast}
            </span>
          )}

          <button
            onClick={handleCopyPrompt}
            title="Export this phrase with authentic Gamakas as a dual-conditioned AI prompt"
            className="px-2 py-1 rounded-lg bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 text-[10px] font-mono transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>AI Prompt Bridge</span>
          </button>

          <button
            onClick={handleAuditionSelected}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Play className="w-3 h-3 text-amber-400" />
            <span>▶ Audition Gamaka</span>
          </button>
        </div>
      </div>

      {/* 3. Main Piano Roll Canvas */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Left Piano Keys Column (Indian Swaras + Western Pitch) - Pinned Left */}
        <div 
          ref={keysRef}
          onScroll={handleKeysScroll}
          className="w-56 shrink-0 border-r border-white/[0.15] flex flex-col divide-y divide-white/[0.08] overflow-y-auto bg-[#0a0d14] shadow-md z-10 no-scrollbar"
        >
          
          {/* Top spacer matching step header */}
          <div className="h-6 shrink-0 bg-slate-950 border-b border-white/[0.08] px-3 flex items-center font-mono text-[10px] text-slate-500">
            <span>Swara (Pitch)</span>
          </div>

          {SWARA_KEYS.map((s) => {
            const inRaga = isSwaraInActiveRaga(s.name);
            const freq = calculateSwaraFrequency(baseSaHz, s.key);
            const midiInfo = hzToMidiWithCents(freq);

            return (
              <div
                key={s.key}
                onMouseDown={() => audioEngine.playNotePreview(freq, 0.5)}
                className={`h-7 shrink-0 px-3 flex items-center justify-between cursor-pointer transition ${
                  inRaga 
                    ? 'bg-slate-900/90 hover:bg-amber-500/20 text-slate-200' 
                    : 'bg-slate-950 text-slate-600 hover:bg-slate-900 opacity-60'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`font-bold font-serif text-xs ${inRaga ? 'text-amber-300' : 'text-slate-600'}`}>
                    {s.name}
                  </span>
                  {!inRaga && (
                    <span className="text-[8.5px] px-1 rounded bg-slate-900 text-slate-600 border border-white/[0.08]">
                      varjit
                    </span>
                  )}
                </div>

                <div className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                  <span className="text-slate-400">{midiInfo.noteName}</span>
                  <span className="text-[9px] text-slate-600">({freq}Hz)</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Step Grid Canvas (Horizontally Stretched with Overflow Scroll) */}
        <div 
          ref={gridRef}
          onScroll={handleGridScroll}
          className="flex-1 overflow-x-auto overflow-y-auto relative bg-[#05070c]"
        >
          {activeLane === 'notes' ? (
            <div 
              className="flex flex-col relative divide-y divide-white/[0.08]"
              style={{ width: `${totalSteps * stepWidth}px` }}
            >
              
              {/* Step / Beat Ruler Header */}
              <div className="h-6 flex shrink-0 border-b border-white/[0.12] bg-slate-950 sticky top-0 z-10">
                {Array.from({ length: totalSteps }).map((_, stepIdx) => {
                  const isBarStart = (stepIdx % beatsPerBar) === 0;
                  const barNum = Math.floor(stepIdx / beatsPerBar) + 1;
                  const stepInBar = (stepIdx % beatsPerBar) + 1;

                  return (
                    <div
                      key={stepIdx}
                      style={{ width: `${stepWidth}px` }}
                      className={`h-full shrink-0 flex items-center ${isBarStart ? 'pl-2.5 pr-1' : 'px-1'} font-mono text-[10px] border-r ${
                        isBarStart 
                          ? 'border-white/[0.15] text-amber-200/90 font-medium bg-amber-500/[0.03]' 
                          : 'border-white/[0.05] text-slate-500'
                      }`}
                    >
                      {isBarStart ? (
                        <span>Bar {barNum}</span>
                      ) : (
                        <span className="text-[9px] text-slate-600">.{stepInBar}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Vertical Playhead Line inside Piano Roll */}
              <div 
                className="absolute top-0 bottom-0 w-[2px] bg-amber-400 pointer-events-none z-30 transition-all duration-75"
                style={{ left: `${(playheadPosition - 1) * beatsPerBar * stepWidth}px` }}
              />

              {/* Swara Grid Rows */}
              {SWARA_KEYS.map((s) => {
                const inRaga = isSwaraInActiveRaga(s.name);

                return (
                  <div 
                    key={s.key} 
                    className="h-7 shrink-0 flex relative"
                  >
                    {Array.from({ length: totalSteps }).map((_, stepIdx) => {
                      const isBarStart = (stepIdx % beatsPerBar) === 0;
                      const noteOnCell = notes.find(n => n.swaraKey === s.key && n.startStep <= stepIdx && stepIdx < (n.startStep + n.durationSteps));
                      const isNoteHead = noteOnCell && noteOnCell.startStep === stepIdx;
                      const isSelected = noteOnCell && noteOnCell.id === selectedNoteId;

                      return (
                        <div
                          key={stepIdx}
                          onClick={() => handleCellClick(s, stepIdx)}
                          style={{ width: `${stepWidth}px` }}
                          className={`h-full shrink-0 border-r cursor-pointer transition-colors relative ${
                            isBarStart ? 'border-white/[0.15]' : 'border-white/[0.05]'
                          } ${
                            inRaga ? 'hover:bg-amber-500/15' : 'bg-slate-950/60 hover:bg-slate-900/40'
                          }`}
                        >
                          {noteOnCell && isNoteHead && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNoteId(noteOnCell.id);
                                handleAuditionSelected();
                              }}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setNotes(prev => prev.filter(n => n.id !== noteOnCell.id));
                                if (selectedNoteId === noteOnCell.id) setSelectedNoteId(null);
                              }}
                              className={`absolute inset-y-1 rounded shadow-md flex items-center px-1.5 text-[10px] font-semibold text-slate-950 transition-all duration-150 z-10 ${
                                isSelected 
                                  ? 'ring-2 ring-amber-300 ring-offset-1 ring-offset-black' 
                                  : 'hover:brightness-110'
                              }`}
                              style={{ 
                                left: '2px',
                                width: `${noteOnCell.durationSteps * stepWidth - 4}px`,
                                background: noteOnCell.gamaka?.color 
                                  ? `linear-gradient(135deg, ${noteOnCell.gamaka.color}, #785a36)` 
                                  : 'linear-gradient(135deg, #b08d57, #9d6d45)'
                              }}
                            >
                              {/* Gamaka SVG Pitch Curve Overlay */}
                              {noteOnCell.gamaka && (
                                <svg 
                                  className="absolute inset-0 w-full h-full pointer-events-none opacity-40 overflow-visible"
                                  viewBox={`0 0 ${noteOnCell.durationSteps * stepWidth - 4} 24`}
                                  preserveAspectRatio="none"
                                >
                                  <path
                                    d={calculateGamakaSvgPath(
                                      noteOnCell.gamaka, 
                                      noteOnCell.durationSteps * stepWidth - 4, 
                                      24
                                    )}
                                    fill="none"
                                    stroke="#ffffff"
                                    strokeWidth="2"
                                  />
                                </svg>
                              )}

                              <div className="relative z-10 flex items-center justify-between w-full truncate">
                                <span className="truncate font-bold font-serif text-slate-100 drop-shadow">
                                  {s.name.split(' ')[0]}
                                </span>

                                {noteOnCell.gamaka && noteOnCell.gamaka.type !== 'none' && (
                                  <span className="text-[9px] font-mono text-amber-200/90 bg-black/40 px-1 rounded ml-1">
                                    {noteOnCell.gamaka.shortLabel}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Continuous Meend Curve View (F0 in Hz) */
            <div className="w-full h-full p-6 flex flex-col justify-between bg-gradient-to-b from-[#070a12] to-[#04060a]">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                      <Waves className="w-4 h-4 text-amber-400" />
                      <span>Continuous Microtonal Pitch Bend (F0 Trajectory in Hz)</span>
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Infinitely glide fundamental frequency between 22 Shrutis with smooth non-linear bezier curves without discrete Western interval stepping.
                    </p>
                  </div>

                  {/* Classical Gamaka Presets */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Presets:</span>
                    {MASTER_GAMAKA_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => handleApplyPreset(preset)}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-amber-500/20 text-slate-300 text-[10px] border border-white/[0.12] transition cursor-pointer flex items-center gap-1 shadow-sm"
                        title={preset.description}
                      >
                        <span>{preset.config.type === 'meend' ? '〰️' : preset.config.type === 'andolan' ? '🌊' : '✨'}</span>
                        <span>{preset.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive SVG Meend Waveform Canvas */}
                <div className="h-48 w-full bg-slate-950/80 rounded-xl border border-white/[0.12] relative overflow-hidden flex items-center shadow-inner">
                  <svg className="w-full h-full">
                    <defs>
                      <linearGradient id="meendFill" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#b08d57" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#b08d57" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* F0 Trajectory Curve */}
                    <path
                      d="M 0 110 C 120 40, 200 40, 320 85 C 440 130, 520 130, 640 60 C 760 30, 840 30, 960 120 C 1080 150, 1160 90, 1280 75"
                      fill="none"
                      stroke="#b08d57"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 0 110 C 120 40, 200 40, 320 85 C 440 130, 520 130, 640 60 C 760 30, 840 30, 960 120 C 1080 150, 1160 90, 1280 75 L 1280 192 L 0 192 Z"
                      fill="url(#meendFill)"
                    />

                    {/* Interactive Trajectory Knots */}
                    {trajectoryPoints.map((pt, i) => {
                      const cx = (pt.step / totalSteps) * 1100 + 40;
                      const cy = 192 - (pt.freqRatio - 0.9) * 180;
                      return (
                        <g key={i} className="cursor-pointer group">
                          <circle
                            cx={cx}
                            cy={cy}
                            r="6"
                            fill="#b08d57"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="transition-transform group-hover:scale-125"
                          />
                          <text
                            x={cx}
                            y={cy - 10}
                            fill="#fcd34d"
                            fontSize="10"
                            textAnchor="middle"
                            fontFamily="monospace"
                          >
                            {pt.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Telemetry pill */}
                  <div className="absolute top-3 left-4 font-mono text-[11px] text-amber-300/90 bg-slate-950/90 px-3 py-1.5 rounded-lg border border-white/[0.10] shadow-md flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    <span>Continuous F0: {baseSaHz.toFixed(1)} Hz (Sa) $\rightarrow$ {(baseSaHz * 1.5).toFixed(1)} Hz (Pa) $\rightarrow$ {(baseSaHz * 1.25).toFixed(1)} Hz (Ga Meend Glide)</span>
                  </div>
                </div>
              </div>

              {/* Trajectory Action Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-white/[0.08] text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Sub-cent precision continuous pitch interpolation (96kHz sample rate)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyPrompt}
                    className="px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/70 border border-purple-500/40 text-purple-200 text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Copy Dual-Conditioned Prompt</span>
                  </button>

                  <button
                    onClick={handleAuditionTrajectory}
                    className="px-4 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 text-amber-400" />
                    <span>▶ Audition Trajectory</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
