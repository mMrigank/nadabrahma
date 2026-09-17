import React, { useState } from 'react';
import { Zap, Mic, Play, Square, Radio } from 'lucide-react';
import { SHRUTI_RATIOS, calculateSwaraFrequency, hzToMidiWithCents } from '../lib/ragaEngine';
import { audioEngine } from '../lib/webAudioEngine';

interface ShrutiMandalaModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseSaHz: number;
  onSaHzChange: (hz: number) => void;
  activeRagaId?: string;
}

// Which of the 22 Shrutis each raga engages
const RAGA_SHRUTI_MAP: Record<string, string[]> = {
  yaman: ['S', 'R2', 'G1', 'M2', 'P', 'D2', 'N2', 'S_high'],
  hansadhwani: ['S', 'R2', 'G2', 'P', 'N2', 'S_high'],
  darbari: ['S', 'r2', 'g2', 'M1', 'P', 'd1', 'n1', 'S_high'],
  bhairavi: ['S', 'r1', 'g1', 'M1', 'P', 'd1', 'n1', 'S_high'],
  bhoopali: ['S', 'R2', 'G2', 'P', 'D2', 'S_high'],
  malkauns: ['S', 'g1', 'M1', 'd1', 'n1', 'S_high'],
  durga: ['S', 'R2', 'M1', 'P', 'D2', 'S_high'],
  marwa: ['S', 'r1', 'G1', 'M2', 'D2', 'N2', 'S_high']
};

const SHRUTI_KEYS = Object.keys(SHRUTI_RATIOS);
const SA_PRESETS: { label: string; hz: number }[] = [
  { label: 'C', hz: 130.81 },
  { label: 'C#', hz: 138.59 },
  { label: 'D', hz: 146.83 },
  { label: 'D#', hz: 155.56 },
  { label: 'A432', hz: 216.0 }
];

export const ShrutiMandalaModal: React.FC<ShrutiMandalaModalProps> = ({
  isOpen,
  onClose,
  baseSaHz,
  onSaHzChange,
  activeRagaId
}) => {
  const [selectedShruti, setSelectedShruti] = useState<string>('S');
  const [isComparing, setIsComparing] = useState(false);

  if (!isOpen) return null;

  const shrutiData = SHRUTI_RATIOS[selectedShruti] ?? SHRUTI_RATIOS['S'];
  const shrutiFreq = calculateSwaraFrequency(baseSaHz, selectedShruti);
  const shrutiCents =
    shrutiData.ratio === 1 ? 0 : Math.round(Math.log2(shrutiData.ratio) * 1200 * 100) / 100;
  const midiInfo = hzToMidiWithCents(shrutiFreq);
  const twelveTetFreq = 440 * Math.pow(2, (midiInfo.midiNote - 69) / 12);
  const twelveTetDeviation = Math.round((shrutiCents - midiInfo.centsOffset) * 100) / 100;

  const activeShrutis = RAGA_SHRUTI_MAP[activeRagaId ?? ''] ?? SHRUTI_KEYS;

  // Lay the 22 shrutis around the circle in ascending pitch order
  const radius = 150;
  const center = 200;

  const handleShrutiSelect = (key: string) => {
    setSelectedShruti(key);
    audioEngine.playNotePreview(calculateSwaraFrequency(baseSaHz, key), 1.2);
  };

  const handleCompareJustVs12Tet = () => {
    setIsComparing(true);
    audioEngine.playNotePreview(shrutiFreq, 1.8);
    window.setTimeout(() => audioEngine.playNotePreview(twelveTetFreq, 1.8), 120);
    window.setTimeout(() => setIsComparing(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-[920px] max-w-[95vw] max-h-[92vh] overflow-y-auto bg-[#0a0d14] border border-amber-500/30 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/40 sticky top-0 bg-[#0a0d14] z-10">
          <div>
            <h2 className="text-lg font-bold text-amber-300">
              22 Shrutis · Just Intonation & Moveable Sa Hub
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              f(i) = f(Sa) × ratio(i) · Nāṭyaśāstra / Saṅgītaratnākara
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors text-amber-400"
          >
            <Square className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5">
          {/* Mandala */}
          <div className="flex items-center justify-center">
            <svg viewBox="0 0 400 400" className="w-full max-w-[400px] select-none">
              {[60, 95, 130, 165, radius].map((r) => (
                <circle
                  key={r}
                  cx={center}
                  cy={center}
                  r={r}
                  fill="none"
                  stroke="rgba(148,163,184,0.12)"
                  strokeWidth={1}
                />
              ))}

              {/* Radial rays */}
              {SHRUTI_KEYS.map((key, i) => {
                const angle = (i / SHRUTI_KEYS.length) * Math.PI * 2 - Math.PI / 2;
                const inRaga = activeShrutis.includes(key);
                return (
                  <line
                    key={`ray-${key}`}
                    x1={center}
                    y1={center}
                    x2={center + radius * Math.cos(angle)}
                    y2={center + radius * Math.sin(angle)}
                    stroke={inRaga ? 'rgba(245,158,11,0.22)' : 'rgba(148,163,184,0.08)'}
                    strokeWidth={1}
                  />
                );
              })}

              {/* Shruti nodes */}
              {SHRUTI_KEYS.map((key, i) => {
                const angle = (i / SHRUTI_KEYS.length) * Math.PI * 2 - Math.PI / 2;
                const x = center + radius * Math.cos(angle);
                const y = center + radius * Math.sin(angle);
                const inRaga = activeShrutis.includes(key);
                const isSelected = key === selectedShruti;

                return (
                  <g
                    key={key}
                    className="cursor-pointer"
                    onClick={() => handleShrutiSelect(key)}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 8 : 5}
                      fill={
                        isSelected
                          ? '#f59e0b'
                          : inRaga
                            ? 'rgba(245,158,11,0.55)'
                            : 'rgba(100,116,139,0.45)'
                      }
                      stroke={isSelected ? '#fbbf24' : 'rgba(148,163,184,0.4)'}
                      strokeWidth={isSelected ? 2 : 1}
                    />
                    <text
                      x={x}
                      y={y - 12}
                      textAnchor="middle"
                      fontSize={isSelected ? 10 : 9}
                      fill={isSelected ? '#fcd34d' : inRaga ? '#cbd5e1' : '#64748b'}
                      fontFamily="ui-monospace, monospace"
                    >
                      {key}
                    </text>
                  </g>
                );
              })}

              {/* Center hub */}
              <circle cx={center} cy={center} r={42} fill="rgba(245,158,11,0.08)" stroke="rgba(245,158,11,0.35)" />
              <text x={center} y={center - 4} textAnchor="middle" fontSize={11} fill="#fbbf24" fontFamily="ui-monospace, monospace">
                Sa
              </text>
              <text x={center} y={center + 12} textAnchor="middle" fontSize={12} fill="#fcd34d" fontFamily="ui-monospace, monospace">
                {baseSaHz.toFixed(2)}
              </text>
            </svg>
          </div>

          {/* Controls + Inspector */}
          <div className="space-y-4">
            {/* Sa vernier */}
            <div className="rounded-lg border border-slate-800/50 p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-300">Moveable Sa (Ādhāra Ṣaḍja)</span>
                <span className="font-mono text-amber-300 font-semibold">{baseSaHz.toFixed(2)} Hz</span>
              </div>
              <input
                type="range"
                min={110}
                max={240}
                step={0.05}
                value={baseSaHz}
                onChange={(e) => onSaHzChange(parseFloat(e.target.value))}
                className="w-full h-1.5 accent-amber-500 cursor-pointer"
              />
              <div className="flex flex-wrap items-center gap-1.5">
                {SA_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => onSaHzChange(p.hz)}
                    className="px-2 py-1 rounded text-[10px] font-mono bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 transition-colors cursor-pointer"
                  >
                    {p.label} ({p.hz})
                  </button>
                ))}
                <button
                  className="px-2 py-1 rounded text-[10px] font-mono bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Acoustic microphone pitch detection hook"
                >
                  <Mic className="w-3 h-3" /> Detect My Sa
                </button>
              </div>
            </div>

            {/* Selected shruti inspector */}
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.04] p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-amber-300">{shrutiData.name}</span>
                <span className="font-mono text-xs text-slate-400">Svara {selectedShruti}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] font-mono">
                <Row label="Ratio" value={`${shrutiData.ratio.toFixed(6)}`} />
                <Row label="Just Freq" value={`${shrutiFreq.toFixed(2)} Hz`} accent />
                <Row label="12-TET Freq" value={`${twelveTetFreq.toFixed(2)} Hz`} />
                <Row label="Near Note" value={midiInfo.noteName} />
                <Row label="Just Cents" value={`${shrutiCents.toFixed(1)}¢`} />
                <Row
                  label="12-TET Δ"
                  value={`${twelveTetDeviation >= 0 ? '+' : ''}${twelveTetDeviation.toFixed(1)}¢`}
                  accent={Math.abs(twelveTetDeviation) > 5}
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-mono text-slate-400">Active Raga:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    activeShrutis.includes(selectedShruti)
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800/60 text-slate-500 border border-slate-700/40'
                  }`}
                >
                  {activeShrutis.includes(selectedShruti) ? 'Engaged' : 'Varjit / Unused'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => audioEngine.playNotePreview(shrutiFreq, 2.0)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" /> Audition Just
                </button>
                <button
                  onClick={handleCompareJustVs12Tet}
                  disabled={isComparing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/70 hover:bg-slate-700/70 text-slate-300 border border-slate-700/50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5" /> Just vs 12-TET (beat reveal)
                </button>
                <button
                  onClick={() => onSaHzChange(shrutiFreq)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/70 hover:bg-slate-700/70 text-slate-300 border border-slate-700/50 transition-colors cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" /> Set as Sa
                </button>
              </div>
            </div>

            {/* Full reference table */}
            <div className="rounded-lg border border-slate-800/50 overflow-hidden">
              <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800/50 text-[11px] font-mono text-slate-400">
                22 Shrutis Reference ({SHRUTI_KEYS.length} microtones)
              </div>
              <div className="max-h-[190px] overflow-y-auto divide-y divide-slate-800/40">
                {SHRUTI_KEYS.map((key) => {
                  const d = SHRUTI_RATIOS[key];
                  const f = calculateSwaraFrequency(baseSaHz, key);
                  const inRaga = activeShrutis.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => handleShrutiSelect(key)}
                      className={`w-full grid grid-cols-[38px_1fr_86px_64px_44px] items-center px-3 py-1.5 text-left text-[11px] font-mono transition-colors cursor-pointer ${
                        key === selectedShruti ? 'bg-amber-500/10' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <span className={inRaga ? 'text-amber-300' : 'text-slate-500'}>{key}</span>
                      <span className="text-slate-300 truncate">{d.name}</span>
                      <span className="text-slate-400 text-right">{f.toFixed(2)} Hz</span>
                      <span className="text-slate-500 text-right">{d.ratio.toFixed(4)}</span>
                      <span
                        className={`text-right text-[10px] ${
                          inRaga ? 'text-emerald-400/80' : 'text-slate-600'
                        }`}
                      >
                        {inRaga ? '●' : '–'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string; accent?: boolean }> = ({
  label,
  value,
  accent
}) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-slate-500">{label}</span>
    <span className={accent ? 'text-amber-300' : 'text-slate-300'}>{value}</span>
  </div>
);
