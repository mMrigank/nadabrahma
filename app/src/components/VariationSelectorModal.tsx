import React, { useState, useEffect } from 'react';
import { X, Play, Wand2, ArrowRight } from 'lucide-react';
import { audioEngine } from '../lib/webAudioEngine';

interface VariationSelectorModalProps {
  trackId: string | null;
  trackName: string;
  onSelect: (trackId: string, variation: 'A' | 'B') => void;
  onCancel: () => void;
}

export const VariationSelectorModal: React.FC<VariationSelectorModalProps> = ({
  trackId,
  trackName,
  onSelect,
  onCancel
}) => {
  const [playingVar, setPlayingVar] = useState<'A' | 'B' | null>(null);
  
  if (!trackId) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0c1017] border border-white/[0.15] shadow-2xl rounded-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.1]">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-200 font-serif">Regenerate {trackName}</h2>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-white/10 rounded-full transition text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6">
          <p className="text-sm text-slate-400 font-mono">
            Two variations have been synthesized. Audition and select one to commit to the timeline.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* Variation A */}
            <div className="bg-[#0e121a] border border-white/[0.1] rounded-lg p-4 flex flex-col items-center gap-4 hover:border-amber-500/50 transition relative group">
              <h3 className="font-bold text-slate-200 font-serif tracking-wider">Variation A</h3>
              <div className="flex-1 w-full flex items-center justify-center">
                <button 
                  onClick={() => {
                    audioEngine.playNotePreview(220, 0.5);
                    setPlayingVar('A');
                  }}
                  className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center hover:bg-amber-500 hover:text-black transition text-slate-300"
                >
                  <Play className="w-6 h-6 ml-1" />
                </button>
              </div>
              <button 
                onClick={() => onSelect(trackId, 'A')}
                className="w-full py-2 rounded bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-black transition text-xs font-bold font-mono"
              >
                COMMIT A
              </button>
            </div>

            {/* Variation B */}
            <div className="bg-[#0e121a] border border-white/[0.1] rounded-lg p-4 flex flex-col items-center gap-4 hover:border-emerald-500/50 transition relative group">
              <h3 className="font-bold text-slate-200 font-serif tracking-wider">Variation B</h3>
              <div className="flex-1 w-full flex items-center justify-center">
                <button 
                  onClick={() => {
                    audioEngine.playNotePreview(277, 0.5); // Slightly different pitch
                    setPlayingVar('B');
                  }}
                  className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-500 hover:text-black transition text-slate-300"
                >
                  <Play className="w-6 h-6 ml-1" />
                </button>
              </div>
              <button 
                onClick={() => onSelect(trackId, 'B')}
                className="w-full py-2 rounded bg-emerald-500/20 hover:bg-emerald-500 text-emerald-200 hover:text-black transition text-xs font-bold font-mono"
              >
                COMMIT B
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
