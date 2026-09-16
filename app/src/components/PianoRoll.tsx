import React, { useState } from 'react';
import { Music, Sliders, Play, Plus, Trash2 } from 'lucide-react';
import { Raga, Track } from '../types/daw';
import { calculateSwaraFrequency, hzToMidiWithCents } from '../lib/ragaEngine';
import { audioEngine } from '../lib/webAudioEngine';

interface PianoRollProps {
  selectedTrack: Track | null;
  activeRaga: Raga;
  baseSaHz: number;
}

interface NoteEvent {
  id: string;
  swaraKey: string;
  swaraName: string;
  pitchMidi: number;
  startStep: number;
  durationSteps: number;
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
  baseSaHz
}) => {
  const totalSteps = 32;
  const [notes, setNotes] = useState<NoteEvent[]>([
    { id: '1', swaraKey: 'S', swaraName: 'S', pitchMidi: 62, startStep: 0, durationSteps: 4 },
    { id: '2', swaraKey: 'R2', swaraName: 'R', pitchMidi: 64, startStep: 4, durationSteps: 4 },
    { id: '3', swaraKey: 'G1', swaraName: 'G', pitchMidi: 66, startStep: 8, durationSteps: 6 },
    { id: '4', swaraKey: 'M3', swaraName: "M'", pitchMidi: 68, startStep: 14, durationSteps: 2 },
    { id: '5', swaraKey: 'P', swaraName: 'P', pitchMidi: 69, startStep: 16, durationSteps: 8 }
  ]);

  const [activeLane, setActiveLane] = useState<'notes' | 'meend'>('notes');

  const isSwaraInActiveRaga = (swaraName: string) => {
    // Basic check against active raga swaras string
    const pureName = swaraName.split(' ')[0];
    return activeRaga.swaras.includes(pureName);
  };

  const handleCellClick = (swaraItem: typeof SWARA_KEYS[0], step: number) => {
    const existing = notes.find(n => n.swaraKey === swaraItem.key && n.startStep === step);
    if (existing) {
      setNotes(notes.filter(n => n.id !== existing.id));
    } else {
      const freq = calculateSwaraFrequency(baseSaHz, swaraItem.key);
      const midi = hzToMidiWithCents(freq).midiNote;
      audioEngine.playNotePreview(freq, 0.4);

      setNotes([...notes, {
        id: String(Date.now()),
        swaraKey: swaraItem.key,
        swaraName: swaraItem.name,
        pitchMidi: midi,
        startStep: step,
        durationSteps: 2
      }]);
    }
  };

  return (
    <div className="h-64 border-t border-slate-800 bg-[#070a0f] flex flex-col select-none text-xs font-sans">
      
      {/* Piano Roll Header Toolbar */}
      <div className="h-8 border-b border-slate-800/80 px-4 flex items-center justify-between bg-slate-950/90">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <Music className="w-3.5 h-3.5 text-amber-400" />
            <span>Swara Piano Roll & Meend Curve Lane</span>
          </div>

          <div className="text-[11px] text-slate-400">
            Track: <span className="text-amber-300 font-semibold">{selectedTrack ? selectedTrack.name : 'No Track Selected'}</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveLane('notes')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer transition ${
                activeLane === 'notes' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
              }`}
            >
              Swara Notes
            </button>
            <button
              onClick={() => setActiveLane('meend')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer transition ${
                activeLane === 'meend' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
              }`}
            >
              〰️ Continuous Meend Curve (F0 in Hz)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="text-slate-500">Active Raga Scale:</span>
          <span className="text-amber-300 font-bold">{activeRaga.swaras}</span>
          <span className="text-slate-500">| Root:</span>
          <span className="text-cyan-400">{baseSaHz} Hz</span>
        </div>
      </div>

      {/* Piano Roll Grid Canvas */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Piano Keys Column (Indian Swaras + Western Pitch) */}
        <div className="w-48 border-r border-slate-800/90 flex flex-col divide-y divide-slate-850/60 overflow-y-auto bg-[#0a0d14]">
          {SWARA_KEYS.map((s) => {
            const inRaga = isSwaraInActiveRaga(s.name);
            const freq = calculateSwaraFrequency(baseSaHz, s.key);
            const midiInfo = hzToMidiWithCents(freq);

            return (
              <div
                key={s.key}
                onClick={() => audioEngine.playNotePreview(freq, 0.5)}
                className={`flex-1 px-2.5 flex items-center justify-between cursor-pointer transition ${
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
                    <span className="text-[9px] px-1 rounded bg-slate-900 text-slate-600 border border-slate-800">
                      varjit
                    </span>
                  )}
                </div>

                <div className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                  <span>{midiInfo.noteName}</span>
                  <span className="text-[9px] text-slate-600">({freq}Hz)</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Step Grid Canvas */}
        <div className="flex-1 overflow-x-auto relative flex flex-col divide-y divide-slate-850/60 bg-[#05070c]">
          {activeLane === 'notes' ? (
            SWARA_KEYS.map((s) => {
              const inRaga = isSwaraInActiveRaga(s.name);

              return (
                <div key={s.key} className="flex-1 flex relative">
                  {Array.from({ length: totalSteps }).map((_, stepIdx) => {
                    const isBarStart = (stepIdx % 4) === 0;
                    const noteOnCell = notes.find(n => n.swaraKey === s.key && n.startStep <= stepIdx && stepIdx < (n.startStep + n.durationSteps));
                    const isNoteHead = noteOnCell && noteOnCell.startStep === stepIdx;

                    return (
                      <div
                        key={stepIdx}
                        onClick={() => handleCellClick(s, stepIdx)}
                        className={`flex-1 h-full border-r cursor-pointer transition-colors relative ${
                          isBarStart ? 'border-slate-800/80' : 'border-slate-900/60'
                        } ${
                          inRaga ? 'hover:bg-amber-500/15' : 'bg-slate-950/60 hover:bg-slate-900/40'
                        }`}
                      >
                        {noteOnCell && (
                          <div 
                            className={`absolute inset-y-0.5 left-0.5 right-0.5 rounded-sm bg-gradient-to-r from-amber-500 to-orange-500 shadow-sm flex items-center px-1 text-[9px] font-bold text-slate-950 ${
                              isNoteHead ? 'z-10' : 'opacity-90'
                            }`}
                          >
                            {isNoteHead && s.name.split(' ')[0]}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          ) : (
            /* Continuous Meend Curve View (F0 in Hz) */
            <div className="flex-1 relative flex flex-col justify-center p-4 bg-gradient-to-b from-slate-950 to-[#070a0f]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-300">Draw Continuous Microtonal Pitch Bend (Meend)</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400">Quick Gamaka Presets:</span>
                  {['Kampita (Vibrato)', 'Nokku (Touch)', 'Meend (Slide)', 'Andolan (Wave)'].map(p => (
                    <button key={p} className="px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-500/20 text-slate-300 text-[10px] border border-slate-700">
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Pitch SVG Wave */}
              <div className="h-32 w-full bg-slate-900/50 rounded-xl border border-slate-800 relative overflow-hidden flex items-center">
                <svg className="w-full h-full">
                  <path
                    d="M 0 60 Q 80 20, 160 60 T 320 60 T 480 30 T 640 90 T 800 50"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                  />
                  <path
                    d="M 0 60 Q 80 20, 160 60 T 320 60 T 480 30 T 640 90 T 800 50 L 800 130 L 0 130 Z"
                    fill="url(#meendGradient)"
                    opacity="0.2"
                  />
                  <defs>
                    <linearGradient id="meendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute top-2 left-3 font-mono text-[10px] text-amber-400/80">
                  F0 Pitch Target: 142.5 Hz $\rightarrow$ 213.75 Hz (Smooth Meend glide)
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
