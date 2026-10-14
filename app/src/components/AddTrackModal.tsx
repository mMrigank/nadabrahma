import React, { useState } from 'react';
import { X, Layers, Sparkles, Check } from 'lucide-react';
import { TrackRole, AIModel } from '../types/daw';

interface AddTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrack: (track: {
    name: string;
    role: TrackRole;
    model: AIModel;
    color: string;
    busGroup: 'Vocals' | 'Acoustics' | 'Percussion' | 'Orchestral' | 'Cinematic FX';
  }) => void;
  existingTrackCount: number;
}

const ROLES_CATALOG: { 
  role: TrackRole; 
  title: string; 
  icon: string; 
  desc: string; 
  recommendedModel: AIModel; 
  modelReason: string;
  defaultGroup: 'Vocals' | 'Acoustics' | 'Percussion' | 'Orchestral' | 'Cinematic FX';
  defaultColor: string;
}[] = [
  {
    role: 'lead_melody',
    title: 'AI Generative Track (ACE-Step)',
    icon: '✨',
    desc: 'Full-spectrum generative track conditioned on Raga, lyrics, and Apple Metal latent diffusion.',
    recommendedModel: 'ace_step',
    modelReason: 'ACE-Step 1.5 XL Turbo: Latent diffusion text-to-audio engine.',
    defaultGroup: 'Vocals',
    defaultColor: '#eab308' // OpenStudio Amber Yellow
  },
  {
    role: 'solo_instrument',
    title: 'Mood Instrument (Lock the Mood)',
    icon: '🪕',
    desc: 'Evocative acoustic instrumental music (Sarod, Sitar, Flute) to establish and lock the raga mood and rasa.',
    recommendedModel: 'soundfont_native',
    modelReason: 'Native 96kHz acoustic engine tuned to Moveable Sa and 22 Shrutis Just Intonation.',
    defaultGroup: 'Acoustics',
    defaultColor: '#b08d57' // Mellow Warm Sandstone
  },
  {
    role: 'vedic_chant',
    title: 'Vocals (Chant & Lyrics)',
    icon: '🎤',
    desc: 'Lyrical vocals, sacred Sanskrit shlokas, and mantras with authentic pārāyaṇa meter and zero schwa deletion.',
    recommendedModel: 'vagdhenu',
    modelReason: 'Vāgdhenu (IISc Bengaluru): Trained specifically on Sanskrit phonology & Chhandas.',
    defaultGroup: 'Vocals',
    defaultColor: '#a06352' // Mellow Terracotta
  },
  {
    role: 'choral_harmony',
    title: 'Choral Harmony & Aalap',
    icon: '👥',
    desc: 'Ethereal multi-part vocal choir, sacred temple harmonies, and wordless vocalises.',
    recommendedModel: 'yue_2',
    modelReason: 'YuE 2: Hybrid AR-NAR flow-matching generates rich harmonic vocal layers.',
    defaultGroup: 'Vocals',
    defaultColor: '#9a7442' // Mellow Amberwood
  },
  {
    role: 'voice_over',
    title: 'Voice-Over & Narration',
    icon: '🎙️',
    desc: 'Documentary (Attenborough-style), cinematic trailer, commercial ads & audio-stories.',
    recommendedModel: 'soundfont_native',
    modelReason: 'Neural VO Engine: Articulate speech with automatic BGM sidechain ducking.',
    defaultGroup: 'Vocals',
    defaultColor: '#566c82' // Mellow Slate
  },
  {
    role: 'drone',
    title: 'Acoustic Drone (Tanpura)',
    icon: '🪕',
    desc: 'Continuous harmonic foundation (Pa-Sa / Ma-Sa / Ni-Sa) tuned to exact Sa in Hz.',
    recommendedModel: 'soundfont_native',
    modelReason: 'Pure 96kHz Lossless Synthesis: Zero latency & mathematically pure acoustic ratios.',
    defaultGroup: 'Acoustics',
    defaultColor: '#5f7e6e' // Mellow Sage
  },
  {
    role: 'solo_instrument',
    title: 'Solo Acoustic Instrument',
    icon: '🎻',
    desc: 'Sitar, Bansuri (flute), Sarod, Veena, Cello, Violin with ±7 semitone Meend bends.',
    recommendedModel: 'stable_audio_3',
    modelReason: 'Stable Audio 3 / Web MIDI: Generates rich acoustic timbres with continuous expression.',
    defaultGroup: 'Acoustics',
    defaultColor: '#5d7491' // Mellow Dusty Slate Blue
  },
  {
    role: 'percussion_tala',
    title: 'Indian Percussion (Tabla/Tala)',
    icon: '🥁',
    desc: 'Tabla, Mridangam, Pakhawaj with authentic Bols locked to Teental, Rupak, or Keherwa.',
    recommendedModel: 'stable_audio_3',
    modelReason: 'Stable Audio 3: Dynamic audio diffusion conditioned on exact Tala beat grid.',
    defaultGroup: 'Percussion',
    defaultColor: '#8c7750' // Mellow Warm Teak
  },
  {
    role: 'modern_beats',
    title: 'Modern World Beats & 808',
    icon: '🔊',
    desc: '808 Trap sub-bass, Lo-Fi hip-hop beats, Psytrance rolling basslines & Afrobeat.',
    recommendedModel: 'stable_audio_3',
    modelReason: 'Latent Diffusion DiT: Punchy transients and deep low-end frequency extension.',
    defaultGroup: 'Percussion',
    defaultColor: '#4f787f' // Mellow Muted Teal
  },
  {
    role: 'ambient_pad',
    title: 'Cinematic Ambient Pad',
    icon: '🌌',
    desc: 'Deep orchestral cello beds, lush synth washes, solfeggio 432Hz/528Hz beds.',
    recommendedModel: 'stable_audio_3',
    modelReason: 'Stable Audio 3: Long-form continuous atmospheric soundscapes.',
    defaultGroup: 'Orchestral',
    defaultColor: '#6f5d8a' // Mellow Deep Amethyst
  },
  {
    role: 'risers_drops',
    title: 'Track 5: Risers & Drops',
    icon: '⚡',
    desc: 'Transitions across 10 genres (Sci-Fi, Cinematic, Vedic, EDM) harmonically tuned to Sa.',
    recommendedModel: 'stable_audio_3',
    modelReason: 'Stable Audio 3: Bar-quantized sweeps, braams, and explosive sub-drops.',
    defaultGroup: 'Cinematic FX',
    defaultColor: '#8f6277' // Mellow Dusty Mauve
  }
];

export const AddTrackModal: React.FC<AddTrackModalProps> = ({
  isOpen,
  onClose,
  onAddTrack,
  existingTrackCount
}) => {
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [trackName, setTrackName] = useState('');

  if (!isOpen) return null;

  const activeRole = ROLES_CATALOG[selectedRoleIndex];

  const handleCreate = () => {
    onAddTrack({
      name: trackName || `${activeRole.title} ${existingTrackCount + 1}`,
      role: activeRole.role,
      model: activeRole.recommendedModel,
      color: activeRole.defaultColor,
      busGroup: activeRole.defaultGroup
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl glass-panel rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-100">
              Add New Track — Select Role & Engine
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-2 uppercase tracking-wider text-[11px]">
              Select Track Purpose (10 Universal Roles)
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {ROLES_CATALOG.map((cat, idx) => (
                <div
                  key={cat.role}
                  onClick={() => {
                    setSelectedRoleIndex(idx);
                    setTrackName(`${cat.title} ${existingTrackCount + 1}`);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    selectedRoleIndex === idx
                      ? 'bg-indigo-600/20 border-indigo-500/60 text-slate-100 shadow-md ring-1 ring-indigo-400/30'
                      : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="shrink-0 text-sm">{cat.icon}</span>
                    <span className="font-bold text-xs text-slate-100 leading-tight">{cat.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 font-mono text-slate-400 whitespace-nowrap">
                      {cat.defaultGroup}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 font-mono text-amber-300/80 whitespace-nowrap">
                      {cat.recommendedModel.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
                    {cat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Model Recommendation Badge */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="text-[11px] font-semibold text-slate-200 flex items-center gap-2">
                <span>Recommended Engine:</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] uppercase font-bold border border-amber-500/40">
                  {activeRole.recommendedModel.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {activeRole.modelReason}
              </p>
            </div>
          </div>

          {/* Track Name Input */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1 uppercase tracking-wider text-[11px]">
              Track Name
            </label>
            <input
              type="text"
              value={trackName || `${activeRole.title} ${existingTrackCount + 1}`}
              onChange={(e) => setTrackName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Create Track</span>
          </button>
        </div>

      </div>
    </div>
  );
};
