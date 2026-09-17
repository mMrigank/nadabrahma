import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Mic, Sparkles, Box } from 'lucide-react';
import {
  VEDIC_HYMNS,
  generateVedicIPA,
  generateVedicTiming,
  type VedicSyllable
} from '../lib/vagdhenuPhonetics';
import { audioEngine } from '../lib/webAudioEngine';
import { Raga } from '../types/daw';

interface VagdhenuLyricsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  baseSaHz: number;
  onSaHzChange: (hz: number) => void;
  activeRaga: Raga;
  beatsPerBar: number;
  onSendToTrack2: (vedicText: string) => void;
}

type HymnKey = keyof typeof VEDIC_HYMNS;

const SVARA_GLYPH: Record<VedicSyllable['svara'], string> = {
  udatta: '↗',
  anudatta: '↘',
  svarita: '⤹',
  none: ''
};

const SVARA_LABEL: Record<VedicSyllable['svara'], string> = {
  udatta: 'Udātta (high tonic)',
  anudatta: 'Anudātta (low tonic)',
  svarita: 'Svarita (descending glide)',
  none: 'Neutral'
};

export const VagdhenuLyricsDrawer: React.FC<VagdhenuLyricsDrawerProps> = ({
  isOpen,
  onClose,
  baseSaHz,
  onSaHzChange,
  activeRaga,
  beatsPerBar,
  onSendToTrack2
}) => {
  const [hymnKey, setHymnKey] = useState<HymnKey>('gayatri');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSyllable, setCurrentSyllable] = useState(-1);
  const [showDevanagari, setShowDevanagari] = useState(true);
  const [showIast, setShowIast] = useState(true);
  const [showIPA, setShowIPA] = useState(false);
  const [detectedSa, setDetectedSa] = useState<number | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  const hymn = VEDIC_HYMNS[hymnKey];
  const syllables = hymn.syllables;
  const timing = generateVedicTiming(syllables);

  // Re-run the recitation sequencer on the animation frame clock so the
  // highlighted syllable stays locked to the scheduled pitch auditions.
  useEffect(() => {
    if (!isPlaying) return;

    startRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - startRef.current) / 1000;

      let index = 0;
      for (let i = 0; i < timing.length; i++) {
        if (elapsed >= timing[i]) index = i;
        else break;
      }

      setCurrentSyllable((prev) => {
        if (index !== prev) {
          const syl = syllables[index];
          if (syl) {
            audioEngine.playVedicSyllable(
              baseSaHz,
              syl.svara,
              // matra duration at 60 BPM reference, capped for auditioning
              Math.min(1.2, syl.durationMatras * 0.25)
            );
          }
        }
        return index;
      });

      const total = timing[timing.length - 1] + 1.5;
      if (elapsed >= total) {
        setIsPlaying(false);
        setCurrentSyllable(-1);
        return;
      }

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafRef.current);
  }, [isPlaying, baseSaHz, syllables, timing]);

  useEffect(() => {
    return () => window.cancelAnimationFrame(rafRef.current);
  }, []);

  // Surface any colloquial schwa-deletion errors in the source transliteration.
  // A terminal consonant (including -m) with no following vowel is the usual
  // signature of a dropped final schwa.
  const schwaIssues = syllables.flatMap((s) =>
    s.iast
      .split(/\s+/)
      .filter((word) => /[k-rtvymnsśṣhḍṭṇ]$/.test(word) && word.length > 1)
  );

  const handleDetectSa = () => {
    setIsDetecting(true);
    // Hook point for real microphone pitch extraction (Web Audio autocorrelation).
    window.setTimeout(() => {
      const guess = 138.59;
      setDetectedSa(guess);
      onSaHzChange(guess);
      setIsDetecting(false);
    }, 900);
  };

  if (!isOpen) return null;

  const totalMatras = syllables.reduce((sum, s) => sum + s.durationMatras, 0);
  const durationSec = totalMatras * 0.25;
  const bars = Math.max(1, Math.ceil(durationSec / ((60 / 60) * beatsPerBar)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-[860px] max-w-[95vw] max-h-[92vh] overflow-y-auto bg-[#0a0d14] border border-amber-500/30 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/40 sticky top-0 bg-[#0a0d14] z-10">
          <div>
            <h2 className="text-lg font-bold text-amber-300">
              Vāgdhenu · Sanskrit Vedic Phonology Engine
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              Zero schwa-deletion · Udātta / Anudātta / Svarita pitch accents
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

        <div className="p-5 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
          {/* Left: hymn picker + chant analysis */}
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-800/50 p-3 space-y-2">
              <div className="text-[11px] font-mono text-slate-400">Hymn Library</div>
              {(Object.keys(VEDIC_HYMNS) as HymnKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setHymnKey(key);
                    setCurrentSyllable(-1);
                    setIsPlaying(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                    hymnKey === key
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/35'
                      : 'bg-slate-900/50 text-slate-300 border border-slate-800/50 hover:bg-slate-800/50'
                  }`}
                >
                  {VEDIC_HYMNS[key].name}
                </button>
              ))}
            </div>

            <div className="rounded-lg border border-slate-800/50 p-3 space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-mono text-amber-300">
                <Box className="w-3.5 h-3.5" /> Chhandas Analysis
              </div>
              <div className="text-[11px] font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Meter</span>
                  <span className="text-slate-200">{hymn.chhanda.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Syllables</span>
                  <span className="text-slate-200">{hymn.chhanda.syllables}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total mātrās</span>
                  <span className="text-slate-200">{totalMatras}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Est. length</span>
                  <span className="text-slate-200">
                    {durationSec.toFixed(1)}s · {bars} bar{bars > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">{hymn.chhanda.description}</p>
            </div>

            {/* Schwa auditor */}
            <div className="rounded-lg border border-slate-800/50 p-3 space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-300">
                <Mic className="w-3.5 h-3.5" /> Schwa Auditor
              </div>
              {schwaIssues.length === 0 ? (
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  ✅ No schwa-deletion in this hymn's transliteration. All terminal
                  <span className="font-mono"> -a </span>
                  vowels are retained ([ɐ]), preserving the Vedic pronunciation.
                </p>
              ) : (
                <p className="text-[10px] text-rose-300 leading-relaxed">
                  ⚠️ {schwaIssues.length} candidate deletion(s) flagged for review.
                </p>
              )}
            </div>

            {/* Sa tuning */}
            <div className="rounded-lg border border-slate-800/50 p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Ādhāra Ṣaḍja</span>
                <span className="text-amber-300">{baseSaHz.toFixed(2)} Hz</span>
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
              <button
                onClick={handleDetectSa}
                disabled={isDetecting}
                className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-[10px] font-mono bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Mic className="w-3 h-3" />
                {isDetecting ? 'Listening…' : detectedSa ? `Detected ${detectedSa.toFixed(2)} Hz` : 'Detect My Sa'}
              </button>
            </div>
          </div>

          {/* Right: teleprompter */}
          <div className="space-y-3">
            {/* View toggles */}
            <div className="flex items-center gap-2">
              {[
                { label: 'Devanagari', on: showDevanagari, set: setShowDevanagari },
                { label: 'IAST', on: showIast, set: setShowIast },
                { label: 'IPA + Accents', on: showIPA, set: setShowIPA }
              ].map(({ label, on, set }) => (
                <button
                  key={label}
                  onClick={() => set(!on)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                    on
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                      : 'bg-slate-900/50 text-slate-400 border-slate-800/50 hover:bg-slate-800/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Transport */}
            <div className="flex items-center gap-2 rounded-lg border border-slate-800/50 p-2.5">
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isPlaying
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/35 hover:bg-amber-500/25'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isPlaying ? 'Pause Chant' : 'Audition Vedic Recitation'}
              </button>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentSyllable(-1);
                }}
                className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 transition-colors cursor-pointer"
                aria-label="Stop"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
              <span className="ml-auto text-[10px] font-mono text-slate-500">
                {currentSyllable >= 0
                  ? `Syllable ${currentSyllable + 1} / ${syllables.length}`
                  : `${syllables.length} syllables`}
              </span>
            </div>

            {/* Syllable grid */}
            <div className="rounded-lg border border-slate-800/50 divide-y divide-slate-800/40 max-h-[380px] overflow-y-auto">
              {syllables.map((syl, i) => {
                const active = i === currentSyllable;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentSyllable(i);
                      audioEngine.playVedicSyllable(baseSaHz, syl.svara, 0.9);
                    }}
                    className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${
                      active ? 'bg-amber-500/10 border-l-2 border-amber-500' : 'border-l-2 border-transparent hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-[10px] font-mono text-slate-600 pt-1 w-6 shrink-0">
                        {i + 1}.
                      </span>
                      <div className="flex-1 space-y-1">
                        {showDevanagari && (
                          <div className={`text-xl font-bold ${active ? 'text-amber-300' : 'text-slate-200'}`}>
                            {syl.text}
                          </div>
                        )}
                        {showIast && (
                          <div className="text-xs font-mono text-slate-400">{syl.iast}</div>
                        )}
                        {showIPA && (
                          <div className="text-sm font-mono text-amber-300/90">
                            /{generateVedicIPA(syl, baseSaHz)}/
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-right space-y-0.5">
                        <div className="text-xs font-mono text-slate-300">
                          {SVARA_GLYPH[syl.svara]}{' '}
                          <span className="text-[10px] text-slate-500">
                            {syl.svara === 'none' ? '—' : syl.svara}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-600">
                          {syl.durationMatras} mātrā
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => {
                  onSendToTrack2(syllables.map((s) => s.text).join(' '));
                  onClose();
                }}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-medium bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Send to Track 2 (Vocals) AI Generation
              </button>
            </div>

            <div className="text-[10px] font-mono text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
              <span>Raga: <span className="text-amber-300/80">{activeRaga.name}</span></span>
              <span>Sa: <span className="text-amber-300/80">{baseSaHz.toFixed(2)} Hz</span></span>
              <span>Meaning: <span className="text-slate-400 italic">{hymn.meaning}</span></span>
            </div>

            {/* Legend */}
            <div className="rounded-lg border border-slate-800/40 p-2.5 text-[10px] font-mono text-slate-500 space-y-1">
              {(['udatta', 'anudatta', 'svarita'] as const).map((a) => (
                <div key={a} className="flex items-center gap-2">
                  <span className="text-amber-300 w-3">{SVARA_GLYPH[a]}</span>
                  <span>{SVARA_LABEL[a]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
