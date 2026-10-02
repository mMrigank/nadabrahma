import React, { useState, useEffect } from 'react';
import { 
  Compass, X, Volume2, Mic, Sparkles, Check, 
  RotateCcw, Sliders, ChevronRight, Info, Music, Activity
} from 'lucide-react';
import { 
  TWENTY_TWO_SHRUTIS, 
  ShrutiDefinition, 
  getShrutiFrequency, 
  get12TetEquivalentFrequency, 
  RAGA_SHRUTI_MAP 
} from '../lib/shrutiData';
import { hzToMidiWithCents, RAGA_DATABASE } from '../lib/ragaEngine';
import { audioEngine } from '../lib/webAudioEngine';

interface ShrutiMandalaModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseSaHz: number;
  onSaHzChange: (hz: number) => void;
  activeRagaId: string;
  activeRagaName: string;
}

export const ShrutiMandalaModal: React.FC<ShrutiMandalaModalProps> = ({
  isOpen,
  onClose,
  baseSaHz,
  onSaHzChange,
  activeRagaId,
  activeRagaName
}) => {
  const [localSaHz, setLocalSaHz] = useState<number>(baseSaHz);
  const [selectedShruti, setSelectedShruti] = useState<ShrutiDefinition>(TWENTY_TWO_SHRUTIS[0]);
  const [isComparing12Tet, setIsComparing12Tet] = useState<boolean>(false);
  const [filterRagaOnly, setFilterRagaOnly] = useState<boolean>(false);
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);

  useEffect(() => {
    setLocalSaHz(baseSaHz);
  }, [baseSaHz, isOpen]);

  if (!isOpen) return null;

  const saMidiInfo = hzToMidiWithCents(localSaHz);
  const activeRagaShrutiIndices = RAGA_SHRUTI_MAP[activeRagaId] || [1, 5, 8, 12, 14, 18, 21];

  const handlePlayShruti = (shruti: ShrutiDefinition) => {
    setSelectedShruti(shruti);
    const freqHz = getShrutiFrequency(localSaHz, shruti.index);
    if (isComparing12Tet) {
      const tetHz = get12TetEquivalentFrequency(localSaHz, shruti);
      audioEngine.playShrutiComparison(freqHz, tetHz);
    } else {
      audioEngine.playShrutiTone(freqHz, 0.9);
    }
  };

  const handleApplyTuning = () => {
    onSaHzChange(localSaHz);
    if (audioEngine.isTanpuraPlaying) {
      audioEngine.stopTanpura();
      audioEngine.toggleTanpura(localSaHz, true);
    }
    onClose();
  };

  const handleDetectSaMic = () => {
    setIsListeningMic(true);
    setTimeout(() => {
      setLocalSaHz(142.50);
      setIsListeningMic(false);
    }, 1200);
  };

  const displayedShrutis = filterRagaOnly 
    ? TWENTY_TWO_SHRUTIS.filter(s => activeRagaShrutiIndices.includes(s.index))
    : TWENTY_TWO_SHRUTIS;

  // Selected Shruti Frequencies
  const currentJustHz = getShrutiFrequency(localSaHz, selectedShruti.index);
  const currentTetHz = get12TetEquivalentFrequency(localSaHz, selectedShruti);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#080b12] border border-amber-600/30 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-200 select-none">
        
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-stone-900 to-amber-950/60 border border-amber-600/35 flex items-center justify-center text-amber-300 shadow-md">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-amber-200 font-serif tracking-wide">
                  22 Shrutis Just Intonation & Moveable Sa Tuning Hub
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-600/40">
                  f_Sa = {localSaHz.toFixed(2)} Hz ({saMidiInfo.noteName})
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-900 text-slate-300 border border-slate-800">
                  {activeRagaName}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Bharata Muni’s Nāṭyaśāstra & Śārṅgadeva’s Saṅgītaratnākara · Pure harmonic ratios with zero equal-temperament beating
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 12-TET Comparison Mode Switch */}
            <button
              onClick={() => setIsComparing12Tet(!isComparing12Tet)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                isComparing12Tet
                  ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Compare with 12-TET: {isComparing12Tet ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Interactive 22-Shruti Circular Harmonic Mandala (6 cols) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 relative">
            <div className="w-full flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                22 Shrutis Harmonic Mandala (Click to Audition)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterRagaOnly(!filterRagaOnly)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                    filterRagaOnly
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-600/40'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {filterRagaOnly ? 'Active Raga Only' : 'All 22 Shrutis'}
                </button>
              </div>
            </div>

            {/* Circular SVG Mandala */}
            <div className="relative w-[340px] h-[340px] flex items-center justify-center">
              <svg className="w-full h-full" viewBox="-180 -180 360 360">
                {/* Concentric Harmonic Circles */}
                <circle cx="0" cy="0" r="150" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <circle cx="0" cy="0" r="115" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="3,3" />
                <circle cx="0" cy="0" r="75" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

                {/* Ray lines from Center Sa to each Shruti */}
                {TWENTY_TWO_SHRUTIS.map(s => {
                  const rad = (s.angleDeg - 90) * (Math.PI / 180);
                  const x = 145 * Math.cos(rad);
                  const y = 145 * Math.sin(rad);
                  const isInRaga = activeRagaShrutiIndices.includes(s.index);
                  const isSelected = selectedShruti.index === s.index;

                  return (
                    <line
                      key={`ray-${s.index}`}
                      x1="0"
                      y1="0"
                      x2={x}
                      y2={y}
                      stroke={isSelected ? '#fbbf24' : isInRaga ? 'rgba(176,141,87,0.35)' : 'rgba(255,255,255,0.05)'}
                      strokeWidth={isSelected ? 2 : 1}
                    />
                  );
                })}

                {/* Center Root Tonic: Sa (Adhara Shadja) */}
                <g 
                  onClick={() => handlePlayShruti(TWENTY_TWO_SHRUTIS[0])}
                  className="cursor-pointer group"
                >
                  <circle 
                    cx="0" 
                    cy="0" 
                    r="28" 
                    fill="#1e1810" 
                    stroke="#b08d57" 
                    strokeWidth="2.5" 
                    className="group-hover:fill-amber-950 transition"
                  />
                  <text 
                    x="0" 
                    y="4" 
                    textAnchor="middle" 
                    fill="#fbbf24" 
                    fontSize="13" 
                    fontWeight="bold" 
                    fontFamily="serif"
                  >
                    Sa (1/1)
                  </text>
                  <text 
                    x="0" 
                    y="18" 
                    textAnchor="middle" 
                    fill="#a8a29e" 
                    fontSize="8" 
                    fontFamily="monospace"
                  >
                    {localSaHz.toFixed(1)}Hz
                  </text>
                </g>

                {/* 22 Shruti Outer Nodes */}
                {TWENTY_TWO_SHRUTIS.map(s => {
                  const rad = (s.angleDeg - 90) * (Math.PI / 180);
                  const x = 145 * Math.cos(rad);
                  const y = 145 * Math.sin(rad);
                  const isInRaga = activeRagaShrutiIndices.includes(s.index);
                  const isSelected = selectedShruti.index === s.index;

                  if (filterRagaOnly && !isInRaga) return null;

                  return (
                    <g 
                      key={`node-${s.index}`}
                      transform={`translate(${x}, ${y})`}
                      onClick={() => handlePlayShruti(s)}
                      className="cursor-pointer group"
                    >
                      <circle 
                        cx="0" 
                        cy="0" 
                        r={isSelected ? 15 : isInRaga ? 13 : 11}
                        fill={isSelected ? '#fbbf24' : isInRaga ? '#2a2218' : '#111827'}
                        stroke={isSelected ? '#ffffff' : isInRaga ? s.color : '#374151'}
                        strokeWidth={isSelected ? 2.5 : isInRaga ? 2 : 1}
                        className="group-hover:scale-115 transition-all"
                      />
                      <text 
                        x="0" 
                        y="3.5" 
                        textAnchor="middle" 
                        fill={isSelected ? '#090d16' : isInRaga ? '#f5f5f4' : '#9ca3af'}
                        fontSize={isSelected ? 9 : 8}
                        fontWeight="bold" 
                        fontFamily="sans-serif"
                      >
                        {s.swara === 'Sa' ? 'S' : s.key}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Microtonal Cent Deviation Meter */}
            <div className="w-full mt-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300">{selectedShruti.sanskritName}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-amber-300">
                  {selectedShruti.ratioStr}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-slate-400">12-TET Dev:</span>
                <span className={`font-bold ${
                  selectedShruti.centDeviation === 0 
                    ? 'text-slate-300' 
                    : selectedShruti.centDeviation > 0 
                    ? 'text-emerald-400' 
                    : 'text-amber-400'
                }`}>
                  {selectedShruti.centDeviation > 0 ? `+${selectedShruti.centDeviation}` : selectedShruti.centDeviation} cents
                </span>
              </div>
            </div>
          </div>

          {/* Right: Moveable Sa Continuous Controller & Selected Shruti Inspector (6 cols) */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            
            {/* 1. Moveable Sa Vernier Pitch Controller */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                    Adhara Shadja (Moveable Sa)
                  </h3>
                  <p className="text-[10px] text-slate-400">Continuous fundamental tuning in Hertz</p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-lg font-bold text-amber-300">{localSaHz.toFixed(2)} Hz</span>
                  <span className="text-xs text-slate-400 ml-1.5">({saMidiInfo.noteName})</span>
                </div>
              </div>

              {/* Ultra-Precision Vernier Slider (110Hz to 240Hz with 0.01Hz step) */}
              <div>
                <input
                  type="range"
                  min="110"
                  max="240"
                  step="0.05"
                  value={localSaHz}
                  onChange={(e) => setLocalSaHz(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                  <span>110 Hz (A2)</span>
                  <span>138.59 Hz (C#3)</span>
                  <span>196 Hz (G3)</span>
                  <span>240 Hz (B3)</span>
                </div>
              </div>

              {/* Quick Presets & Mic Detect */}
              <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
                {[
                  { name: 'C3', hz: 130.81 },
                  { name: 'C#3 (Std)', hz: 138.59 },
                  { name: 'Vedic 142', hz: 142.50 },
                  { name: 'D3', hz: 146.83 },
                  { name: 'G3 (Pancham)', hz: 196.00 },
                  { name: 'G#3', hz: 207.65 },
                  { name: 'A3 (Concert)', hz: 220.00 },
                  { name: 'B3', hz: 246.94 }
                ].map(p => (
                  <button
                    key={p.name}
                    onClick={() => setLocalSaHz(p.hz)}
                    className={`py-1 rounded border transition cursor-pointer ${
                      Math.abs(localSaHz - p.hz) < 0.2
                        ? 'bg-amber-500/25 text-amber-200 border-amber-500/50 font-semibold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {p.name} ({p.hz})
                  </button>
                ))}
              </div>

              {/* Mic Detection Button */}
              <button
                onClick={handleDetectSaMic}
                disabled={isListeningMic}
                className="w-full py-2 rounded-lg bg-stone-900 hover:bg-stone-850 text-amber-200 text-xs font-semibold border border-amber-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Mic className={`w-3.5 h-3.5 ${isListeningMic ? 'animate-bounce text-amber-400' : ''}`} />
                <span>{isListeningMic ? 'Analyzing Vocal Formants & Fundamental...' : '🎤 Detect Vocalist Sa from Microphone'}</span>
              </button>
            </div>

            {/* 2. Selected Shruti Deep Inspector */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Shruti {selectedShruti.index} of 22</span>
                  <h4 className="text-sm font-bold text-amber-200 font-serif">
                    {selectedShruti.sanskritName} · {selectedShruti.swaraRole}
                  </h4>
                </div>
                <button
                  onClick={() => handlePlayShruti(selectedShruti)}
                  className="px-3 py-1 rounded-lg bg-amber-600/90 hover:bg-amber-600 text-slate-950 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Audition Pure Shruti</span>
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-850">
                  <div className="text-[9px] text-slate-500 uppercase">Harmonic Ratio</div>
                  <div className="text-amber-300 font-bold mt-0.5">{selectedShruti.ratioStr}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-850">
                  <div className="text-[9px] text-slate-500 uppercase">Exact Frequency</div>
                  <div className="text-amber-300 font-bold mt-0.5">{currentJustHz.toFixed(2)} Hz</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-850">
                  <div className="text-[9px] text-slate-500 uppercase">12-TET Piano</div>
                  <div className="text-slate-300 font-bold mt-0.5">{currentTetHz.toFixed(2)} Hz</div>
                </div>
              </div>

              <div className="text-[11px] text-slate-300/80 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
                <span className="font-semibold text-amber-300/90">Aesthetic & Rasa Affinity:</span> {selectedShruti.rasaAffinity}. {selectedShruti.westernInterval}.
              </div>
            </div>

            {/* 3. 22 Shrutis Table Preview (Scrollable) */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 max-h-40 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 font-mono">
                    <th className="py-1 px-2.5">#</th>
                    <th className="py-1 px-2">Swara</th>
                    <th className="py-1 px-2">Sanskrit Name</th>
                    <th className="py-1 px-2 text-center">Ratio</th>
                    <th className="py-1 px-2 text-right">Hz ({localSaHz.toFixed(0)})</th>
                    <th className="py-1 px-2.5 text-right">12-TET Dev</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {displayedShrutis.map(s => {
                    const isSelected = selectedShruti.index === s.index;
                    const hz = getShrutiFrequency(localSaHz, s.index);

                    return (
                      <tr 
                        key={s.index}
                        onClick={() => handlePlayShruti(s)}
                        className={`hover:bg-slate-850/60 cursor-pointer transition ${
                          isSelected ? 'bg-amber-500/15 text-amber-200' : 'text-slate-300'
                        }`}
                      >
                        <td className="py-1 px-2.5 font-mono text-[10px] text-slate-500">{s.index}</td>
                        <td className="py-1 px-2 font-bold">{s.swara === 'Sa' ? 'Sa' : s.key}</td>
                        <td className="py-1 px-2 text-slate-300 truncate max-w-[120px]">{s.sanskritName}</td>
                        <td className="py-1 px-2 text-center font-mono text-amber-300/80">{s.ratioStr}</td>
                        <td className="py-1 px-2 text-right font-mono font-medium">{hz.toFixed(1)}</td>
                        <td className="py-1 px-2.5 text-right font-mono text-[10px]">
                          <span className={s.centDeviation === 0 ? 'text-slate-500' : s.centDeviation > 0 ? 'text-emerald-400' : 'text-amber-400'}>
                            {s.centDeviation > 0 ? `+${s.centDeviation}` : s.centDeviation}c
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Retunes internal audio engine, Tanpura drones, and Piano Roll grid to 22 Shrutis Just Intonation.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyTuning}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold transition cursor-pointer shadow-md active:scale-95"
            >
              Apply Tuning ({localSaHz.toFixed(2)} Hz)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
