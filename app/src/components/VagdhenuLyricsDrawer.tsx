import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Sparkles, Volume2, CheckCircle2, AlertTriangle, 
  X, ChevronDown, Music, Copy, Send, Check, Play, Square, RefreshCw
} from 'lucide-react';
import { VedicChantPhrase, VedicSyllable, VedicSvaraAccent } from '../types/daw';
import { 
  VEDIC_PRESET_HYMNS, 
  auditZeroSchwaDeletion, 
  detectChhandasMeter, 
  generateVagdhenuPrompt,
  SchwaAuditResult
} from '../lib/vagdhenuPhonetics';
import { audioEngine } from '../lib/webAudioEngine';

interface VagdhenuLyricsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  baseSaHz: number;
  activeRagaName: string;
  selectedRasa: string;
  isPlaying: boolean;
  currentBeat: number;
  onSendToVocalPrompt?: (promptText: string) => void;
}

export const VagdhenuLyricsDrawer: React.FC<VagdhenuLyricsDrawerProps> = ({
  isOpen,
  onClose,
  baseSaHz,
  activeRagaName,
  selectedRasa,
  isPlaying,
  currentBeat,
  onSendToVocalPrompt
}) => {
  const [activeHymn, setActiveHymn] = useState<VedicChantPhrase>(VEDIC_PRESET_HYMNS[0]);
  const [scriptMode, setScriptMode] = useState<'both' | 'devanagari' | 'iast'>('both');
  const [schwaAudit, setSchwaAudit] = useState<SchwaAuditResult>(() => auditZeroSchwaDeletion(VEDIC_PRESET_HYMNS[0].iastText));
  const [isChantingFull, setIsChantingFull] = useState<boolean>(false);
  const [activeSyllableIdx, setActiveSyllableIdx] = useState<number | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [customText, setCustomText] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  // Sync audit when hymn changes
  useEffect(() => {
    if (!isCustomMode) {
      setSchwaAudit(auditZeroSchwaDeletion(activeHymn.iastText));
    }
  }, [activeHymn, isCustomMode]);

  // Sync teleprompter highlighting when playback is active
  useEffect(() => {
    if (isPlaying && activeHymn.syllables.length > 0) {
      const idx = currentBeat % activeHymn.syllables.length;
      setActiveSyllableIdx(idx);
    } else if (!isChantingFull) {
      setActiveSyllableIdx(null);
    }
  }, [isPlaying, currentBeat, activeHymn, isChantingFull]);

  // Full chant audition playback loop
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isChantingFull) {
      let curr = 0;
      const step = () => {
        if (curr >= activeHymn.syllables.length) {
          setIsChantingFull(false);
          setActiveSyllableIdx(null);
          return;
        }
        const s = activeHymn.syllables[curr];
        setActiveSyllableIdx(curr);
        audioEngine.playVedicSyllable(s.accent, baseSaHz, (s.durationMatras * 0.45));
        curr++;
        timer = setTimeout(step, s.durationMatras * 480);
      };
      step();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isChantingFull, activeHymn, baseSaHz]);

  if (!isOpen) return null;

  const chhandasInfo = detectChhandasMeter(activeHymn.syllables.length);

  const handlePlaySyllable = (s: VedicSyllable, idx: number) => {
    setActiveSyllableIdx(idx);
    audioEngine.playVedicSyllable(s.accent, baseSaHz, s.durationMatras * 0.5);
    setTimeout(() => {
      if (!isPlaying && !isChantingFull) setActiveSyllableIdx(null);
    }, 450);
  };

  const handleCopyPrompt = () => {
    const prompt = generateVagdhenuPrompt(activeHymn, baseSaHz, activeRagaName, selectedRasa);
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2200);
  };

  const handleSendPrompt = () => {
    const prompt = generateVagdhenuPrompt(activeHymn, baseSaHz, activeRagaName, selectedRasa);
    if (onSendToVocalPrompt) {
      onSendToVocalPrompt(prompt);
    }
  };

  const handleSelectPreset = (hymn: VedicChantPhrase) => {
    setActiveHymn(hymn);
    setIsCustomMode(false);
    setIsChantingFull(false);
    setActiveSyllableIdx(null);
  };

  const handleAuditCustomText = (text: string) => {
    setCustomText(text);
    setSchwaAudit(auditZeroSchwaDeletion(text));
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-[#07090e]/95 backdrop-blur-xl border-t border-amber-600/30 shadow-[0_-8px_32px_rgba(0,0,0,0.85)] max-h-[72vh] text-slate-200 font-sans transition-all duration-200 select-none">
      
      {/* Header Bar */}
      <div className="px-5 py-2.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-950/60 to-stone-900 border border-amber-600/35 flex items-center justify-center text-amber-300 text-sm shadow-sm">
            📿
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-amber-200/95 font-serif tracking-wide">
                Vāgdhenu Sanskrit Vedic Phonology Engine
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Zero Schwa-Deletion (100% Vedic)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-900 text-amber-300/80 border border-stone-750">
                {chhandasInfo.meterName} ({activeHymn.syllableCount} Akṣaras)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Strict phonetic vocalization with authentic Udātta (High), Anudātta (Low) & Svarita (Descending Glide) svara pitch accents
            </p>
          </div>
        </div>

        {/* Controls: Script toggle, Play full, Send to Vocal */}
        <div className="flex items-center gap-2.5">
          {/* Svara Pitch Legend */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Udātta (+204c)
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 text-blue-300">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Anudātta (-182c)
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 text-teal-300">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              Svarita (Glide)
            </span>
          </div>

          {/* Script Mode Selector */}
          <div className="flex items-center rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-[11px]">
            <button
              onClick={() => setScriptMode('both')}
              className={`px-2 py-0.5 rounded font-medium cursor-pointer transition ${
                scriptMode === 'both' ? 'bg-amber-600/80 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dual-Script
            </button>
            <button
              onClick={() => setScriptMode('devanagari')}
              className={`px-2 py-0.5 rounded font-medium cursor-pointer transition ${
                scriptMode === 'devanagari' ? 'bg-amber-600/80 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              देवनागरी
            </button>
            <button
              onClick={() => setScriptMode('iast')}
              className={`px-2 py-0.5 rounded font-medium cursor-pointer transition ${
                scriptMode === 'iast' ? 'bg-amber-600/80 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              IAST Roman
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Drawer Body: 2 Columns */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-y-auto custom-scrollbar">
        
        {/* Left Column (Presets & Meter Authority) - 4 cols */}
        <div className="lg:col-span-4 space-y-3">
          
          {/* Hymn Presets Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
              Vedic Hymns & Bandish Presets
            </label>
            <div className="space-y-1">
              {VEDIC_PRESET_HYMNS.map(h => (
                <div
                  key={h.id}
                  onClick={() => handleSelectPreset(h)}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    activeHymn.id === h.id && !isCustomMode
                      ? 'bg-amber-500/15 border-amber-600/40 text-amber-200 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">{h.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-amber-300/80 border border-slate-800">
                      {h.chhandasMeter}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {h.source}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chhandas Vedic Meter Authority Card */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <span>Chhandas Meter Structure</span>
              <span className="text-amber-300 font-mono">{chhandasInfo.padaStructure}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {chhandasInfo.description}
            </p>
            <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Moveable Sa Tonic:</span>
              <span className="text-amber-300">{baseSaHz.toFixed(2)} Hz</span>
            </div>
          </div>

          {/* Zero Schwa-Deletion Auditor Status */}
          <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
            schwaAudit.isZeroSchwaDeleted
              ? 'bg-emerald-950/20 border-emerald-800/40'
              : 'bg-rose-950/20 border-rose-800/40'
          }`}>
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Zero Schwa-Deletion Score:
              </span>
              <span className="font-mono text-emerald-300 font-bold">{schwaAudit.score}%</span>
            </div>
            <p className="text-[10px] text-slate-300/80 leading-normal">
              {schwaAudit.summary}
            </p>
            {schwaAudit.deletedWords.length > 0 && (
              <div className="mt-1 space-y-1">
                {schwaAudit.deletedWords.map((item, idx) => (
                  <div key={idx} className="p-1.5 rounded bg-slate-950/80 text-[10px] font-mono flex items-center justify-between">
                    <span className="text-rose-400 line-through">{item.word}</span>
                    <span className="text-emerald-300">→ {item.corrected}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (Synchronized Interactive Teleprompter) - 8 cols */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-3">
          
          {/* Teleprompter Display Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200">
                {activeHymn.title}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                (Click any syllable to audition with pitch accent)
              </span>
            </div>

            {/* Chant button */}
            <button
              onClick={() => setIsChantingFull(!isChantingFull)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isChantingFull
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-amber-600/85 hover:bg-amber-600 text-slate-950'
              }`}
            >
              {isChantingFull ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
              <span>{isChantingFull ? 'Stop Chant' : '▶ Audition Vedic Recitation'}</span>
            </button>
          </div>

          {/* Interactive Syllable Grid / Teleprompter Canvas */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 min-h-[140px] flex flex-wrap items-center gap-1.5 overflow-y-auto max-h-56 shadow-inner">
            {activeHymn.syllables.map((s, idx) => {
              const isCurrent = activeSyllableIdx === idx;
              
              let accentColor = 'border-slate-700 text-slate-300';
              let accentLabel = 'Tonic';
              let accentBadge = 'bg-slate-800 text-slate-400';

              if (s.accent === 'udatta') {
                accentColor = 'border-amber-500/50 text-amber-200 bg-amber-950/30';
                accentLabel = 'Udātta ↗';
                accentBadge = 'bg-amber-500/20 text-amber-300';
              } else if (s.accent === 'anudatta') {
                accentColor = 'border-blue-500/50 text-blue-200 bg-blue-950/30';
                accentLabel = 'Anudātta ↘';
                accentBadge = 'bg-blue-500/20 text-blue-300';
              } else if (s.accent === 'svarita') {
                accentColor = 'border-teal-500/50 text-teal-200 bg-teal-950/30';
                accentLabel = 'Svarita ⤹';
                accentBadge = 'bg-teal-500/20 text-teal-300';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handlePlaySyllable(s, idx)}
                  title={`${s.iast} (${accentLabel}) - Click to audition`}
                  className={`group relative p-1.5 rounded-lg border flex flex-col items-center justify-center transition-all duration-100 cursor-pointer ${accentColor} ${
                    isCurrent 
                      ? 'scale-115 ring-2 ring-amber-400 bg-amber-500/40 text-amber-100 shadow-lg z-10' 
                      : 'hover:scale-105 hover:bg-slate-800/80'
                  }`}
                >
                  {/* Svara Accent Tag */}
                  <span className={`text-[8px] font-mono px-1 rounded mb-0.5 leading-none ${accentBadge}`}>
                    {accentLabel}
                  </span>

                  {/* Devanagari Script */}
                  {(scriptMode === 'both' || scriptMode === 'devanagari') && (
                    <span className="text-sm font-serif font-bold leading-tight">
                      {s.devanagari}
                    </span>
                  )}

                  {/* IAST Roman Script */}
                  {(scriptMode === 'both' || scriptMode === 'iast') && (
                    <span className="text-[10px] font-mono text-slate-300/80 leading-tight">
                      {s.iast}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Translation & Exegesis Banner */}
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-300 italic flex items-center justify-between">
            <span className="line-clamp-2">“{activeHymn.translation}”</span>
            <span className="text-[10px] font-mono text-amber-300/80 ml-2 whitespace-nowrap not-italic">
              Raga: {activeHymn.recommendedRaga}
            </span>
          </div>

          {/* Action Row */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
              >
                {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedPrompt ? 'Copied Vāgdhenu Prompt!' : 'Copy Prompt'}</span>
              </button>
            </div>

            <button
              onClick={handleSendPrompt}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600/90 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send to Track 2 (Vocals) AI Generation</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
