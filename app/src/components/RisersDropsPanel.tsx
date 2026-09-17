import React, { useState } from 'react';
import { 
  X, Zap, Sparkles, Volume2, Play, Plus, Sliders, Waves, Activity, Radio
} from 'lucide-react';
import { TransitionFXState, Raga } from '../types/daw';
import { audioEngine } from '../lib/webAudioEngine';

interface RisersDropsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  baseSaHz: number;
  activeRaga: Raga;
  onInsertTransition: (fx: TransitionFXState) => void;
}

const GENRE_STYLES = [
  { id: 'Cinematic', label: 'Cinematic', desc: 'Heavy brass braams, low taiko thuds, massive orchestral swells' },
  { id: 'Sci-Fi', label: 'Sci-Fi Cyber', desc: 'Laser sweeps, granular stutters, warp drive drops & resonant filters' },
  { id: 'Vedic', label: 'Vedic Sacred', desc: 'Conch shell (Shankha) crescendo, temple bell resonance, drone swells' },
  { id: 'Electronic', label: 'EDM / Electro', desc: 'White noise whiteouts, pitch-bending saws, sidechain pumping drops' },
  { id: 'Metal', label: 'Metal / Industrial', desc: 'Distorted guitar feedback swell, heavy sub-boom, reverse crash' },
  { id: 'Pop', label: 'Modern Pop', desc: 'Vocal chop risers, snare roll accelerandos, crisp filtered drops' },
  { id: 'Country', label: 'Country / Folk', desc: 'Acoustic guitar strum crescendo, dobro slide swells, stomp impact' },
  { id: 'Trap', label: 'Trap / Drill', desc: '808 glide sweeps, rapid hi-hat rolls, pitched 808 sub-bombs' },
  { id: 'Horror', label: 'Horror / Thriller', desc: 'Microtonal string screech, subsonic dread rumble, waterphone screams' },
  { id: 'Lo-Fi', label: 'Lo-Fi / Chill', desc: 'Vinyl tape rewind, muted rhodes filter sweep, gentle pillowy drop' }
] as const;

const FX_TYPES = [
  { id: 'riser', label: 'Riser Crescendo', icon: '📈', desc: 'Rising pitch & energy building up to the climax' },
  { id: 'sub_drop', label: 'Somatic Sub Drop (10-20 Hz)', icon: '💥', desc: 'Physical chest-thumping infrasound impact' },
  { id: 'braam', label: 'Cinematic Braam', icon: '🎺', desc: 'Massive brass-hybrid horn of doom tuned to Sa' },
  { id: 'whoosh', label: 'Whoosh / Sweep', icon: '💨', desc: 'Fast stereo fly-by transition for scene cuts' },
  { id: 'reverse_swell', label: 'Reverse Acoustic Swell', icon: '🔄', desc: 'Reversed sitar/chime swell leading into next beat' }
] as const;

export const RisersDropsPanel: React.FC<RisersDropsPanelProps> = ({
  isOpen,
  onClose,
  baseSaHz,
  activeRaga,
  onInsertTransition
}) => {
  const [selectedGenre, setSelectedGenre] = useState<TransitionFXState['genre']>('Cinematic');
  const [selectedType, setSelectedType] = useState<TransitionFXState['type']>('riser');
  const [bars, setBars] = useState<1 | 2 | 4 | 8>(4);
  const [targetBar, setTargetBar] = useState<number>(9);
  const [preDropSilence, setPreDropSilence] = useState<boolean>(true);
  const [saTuned, setSaTuned] = useState<boolean>(true);
  const [curveType, setCurveType] = useState<'exponential' | 'linear' | 's_curve'>('exponential');
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePreviewSound = () => {
    setIsPreviewing(true);
    // Play sound via Web Audio API
    if (selectedType === 'sub_drop') {
      audioEngine.previewSubDrop();
    } else {
      audioEngine.previewRiser(saTuned ? baseSaHz : 130.81, bars);
    }
    setTimeout(() => {
      setIsPreviewing(false);
    }, 2400);
  };

  const handleInsert = () => {
    onInsertTransition({
      genre: selectedGenre,
      type: selectedType,
      bars,
      targetBar,
      preDropSilence,
      saTuned
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0f1422] border border-amber-500/40 rounded-2xl w-full max-w-3xl shadow-2xl shadow-amber-950/40 flex flex-col overflow-hidden max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-amber-950/40 to-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">Transition FX & Drop Engine</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] border border-amber-500/30">
                  Track 5 / Transitions
                </span>
              </div>
              <p className="text-xs text-slate-400">
                10 genres, Sa-tuned harmonic risers, Somatic infrasound (10-20Hz) drops, and silence gaps
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* Section 1: Genre Selection (10 Genres) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-amber-400" /> Select Transition Genre (10 World Styles)
              </label>
              <span className="text-[11px] text-amber-400/80 font-mono">Current Raga: {activeRaga.name}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {GENRE_STYLES.map(genre => {
                const isSelected = selectedGenre === genre.id;
                return (
                  <button
                    key={genre.id}
                    onClick={() => setSelectedGenre(genre.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-md shadow-amber-950/40 ring-1 ring-amber-500/50'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="font-semibold text-xs text-slate-100">{genre.label}</span>
                    <span className="text-[10px] text-slate-400 mt-1 leading-tight line-clamp-2">
                      {genre.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Transition Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-cyan-400" /> Transition Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {FX_TYPES.map(fx => {
                const isSelected = selectedType === fx.id;
                return (
                  <button
                    key={fx.id}
                    onClick={() => setSelectedType(fx.id)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      isSelected 
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{fx.icon}</span>
                      <span className="font-bold text-xs text-slate-100">{fx.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {fx.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Tuning & Physics Parameters */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-amber-400" /> Harmonic & Timing Parameters
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Duration in Bars */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1.5 font-medium">
                  Riser Duration
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {([1, 2, 4, 8] as const).map(b => (
                    <button
                      key={b}
                      onClick={() => setBars(b)}
                      className={`py-1.5 rounded-lg font-mono text-xs font-semibold border transition-all ${
                        bars === b
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {b} Bar{b > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Impact Bar */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1.5 font-medium">
                  Impact Bar Position
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={64}
                    value={targetBar}
                    onChange={(e) => setTargetBar(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[11px] text-slate-400 font-mono">Bar</span>
                </div>
              </div>

              {/* Energy Curve */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1.5 font-medium">
                  Crescendo Energy Shape
                </label>
                <select
                  value={curveType}
                  onChange={(e) => setCurveType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
                >
                  <option value="exponential">Exponential (Steep climax)</option>
                  <option value="linear">Linear (Constant build)</option>
                  <option value="s_curve">S-Curve (Gentle start, heavy peak)</option>
                </select>
              </div>
            </div>

            {/* Checkbox Toggles: Sa Tuning & Pre-drop Silence */}
            <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Sa Harmonic Lock */}
              <label className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-amber-500/40 transition-colors">
                <input
                  type="checkbox"
                  checked={saTuned}
                  onChange={(e) => setSaTuned(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    Tuned to Sa ({baseSaHz.toFixed(1)} Hz)
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono">Raga Locked</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Locks fundamental root and overtone frequencies of the braam/riser to your exact Sa.
                  </p>
                </div>
              </label>

              {/* Pre-Drop Silence Gap */}
              <label className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-cyan-500/40 transition-colors">
                <input
                  type="checkbox"
                  checked={preDropSilence}
                  onChange={(e) => setPreDropSilence(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-900"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    Pre-Drop Silence Gap
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-mono">1 Beat Gap</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Mutes all backing tracks for 1 beat right before the impact to maximize drop contrast.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={handlePreviewSound}
            disabled={isPreviewing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 text-cyan-400 ${isPreviewing ? 'animate-pulse' : ''}`} />
            {isPreviewing ? 'Playing Audition...' : 'Audition Transition'}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInsert}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Insert into Track 5 (Transition FX)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
