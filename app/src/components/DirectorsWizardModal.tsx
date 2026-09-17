import React, { useState } from 'react';
import { 
  X, Sparkles, Upload, Music, Sliders, Play, CheckCircle2, RefreshCw
} from 'lucide-react';
import { RasaType, DirectorSceneState, Raga } from '../types/daw';
import { RAGA_DATABASE } from '../lib/ragaEngine';

interface DirectorsWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseSaHz: number;
  onApplyScene: (scene: DirectorSceneState, raga: Raga) => void;
}

const RASAS_META: { type: RasaType; label: string; emoji: string; ragaId: string; description: string }[] = [
  { type: 'Adbhuta', label: 'Adbhuta (Wonder & Cosmic Awe)', emoji: '🌌', ragaId: 'hansadhwani', description: 'Celestial revelation, temple discovery, ascending dawn, awe-inspiring vistas.' },
  { type: 'Shringara', label: 'Shringara (Love & Deep Longing)', emoji: '💖', ragaId: 'yaman', description: 'Intimate dialogue, twilight romance, tender affection, devotional warmth.' },
  { type: 'Karuna', label: 'Karuna (Grief, Pathos & Yearning)', emoji: '😢', ragaId: 'darbari', description: 'Protagonist solitude, tragic loss, soulful meditation, royal gravity.' },
  { type: 'Shanta', label: 'Shanta (Tranquility & Inner Peace)', emoji: '🕊️', ragaId: 'bhoopali', description: 'Meditative stillness, serene prayer, river flowing, peaceful sunrise.' },
  { type: 'Veera', label: 'Veera (Heroism, Valor & Pride)', emoji: '⚔️', ragaId: 'durga', description: 'Pre-battle march, triumphant awakening, fearlessness, righteous power.' },
  { type: 'Raudra', label: 'Raudra (Fury & Cosmic Destruction)', emoji: '⚡', ragaId: 'marwa', description: 'High psychological tension, cosmic dance of fire, dramatic confrontation.' }
];

export const DirectorsWizardModal: React.FC<DirectorsWizardModalProps> = ({
  isOpen,
  onClose,
  baseSaHz,
  onApplyScene
}) => {
  const [selectedRasa, setSelectedRasa] = useState<RasaType>('Adbhuta');
  const [sceneArc, setSceneArc] = useState<'ambient_flat' | 'slow_build' | 'epic_climax' | 'drop_reveal'>('slow_build');
  const [vocalMode, setVocalMode] = useState<'wordless_aalap' | 'custom_voice_clip' | 'sanskrit_mantra'>('wordless_aalap');
  const [customVoiceFileName, setCustomVoiceFileName] = useState<string | null>(null);
  const [breathiness, setBreathiness] = useState(65);
  const [raspGrit, setRaspGrit] = useState(30);
  const [formantShift, setFormantShift] = useState(2);
  const [gamakaDepth, setGamakaDepth] = useState(80);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const currentRasaMeta = RASAS_META.find(r => r.type === selectedRasa) || RASAS_META[0];
  const recommendedRaga = RAGA_DATABASE.find(r => r.id === currentRasaMeta.ragaId) || RAGA_DATABASE[1];

  const handleSimulateAudioDrop = () => {
    setCustomVoiceFileName('director_sample_voice_24s.wav');
    setVocalMode('custom_voice_clip');
  };

  const handleScoreScene = () => {
    setIsGenerating(true);
    setTimeout(() => {
      onApplyScene({
        rasa: selectedRasa,
        sceneTitle: `${selectedRasa} Scene Score`,
        arcType: sceneArc,
        vocalPreference: vocalMode,
        customVoiceName: customVoiceFileName || undefined,
        voiceReinterpretation: {
          breathiness,
          raspGrit,
          formantShift,
          gamakaDepth
        },
        pacingBpm: 78
      }, recommendedRaga);
      setIsGenerating(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl glass-panel rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 font-serif">
                Director’s Scene Scoring Co-Pilot
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 font-normal">
                  Non-Composer Mode
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Define the emotional arc of your film scene. The AI translates emotion into Raga, Tala, and Multi-Track orchestration.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          
          {/* 1. The Navarasa Emotion Compass */}
          <div>
            <label className="text-slate-300 font-semibold block mb-2 uppercase tracking-wider text-[11px]">
              Step 1: Choose the Dominant Emotional Rasa of the Scene
            </label>
            <div className="grid grid-cols-3 gap-3">
              {RASAS_META.map(rasa => (
                <button
                  key={rasa.type}
                  onClick={() => setSelectedRasa(rasa.type)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedRasa === rasa.type
                      ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/30'
                      : 'bg-slate-900/60 hover:bg-slate-850/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">{rasa.emoji}</span>
                    <span className="font-bold text-slate-200 text-xs">{rasa.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {rasa.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Intelligent Auto-Translation to Raga & Scales */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider">
                AI Music Supervisor Translation
              </div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>{recommendedRaga.name}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  {recommendedRaga.westernMode}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Acoustic Swaras: <span className="font-mono text-amber-300">{recommendedRaga.swaras}</span> (Root Sa: {baseSaHz} Hz)
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right text-[11px] text-slate-400 font-mono">
                <div>Tempo: <span className="text-slate-200 font-bold">78 BPM (Vilambit)</span></div>
                <div>Tala: <span className="text-slate-200 font-bold">Teental (16)</span></div>
              </div>
            </div>
          </div>

          {/* 3. Scene Arc & Dynamic Pacing */}
          <div>
            <label className="text-slate-300 font-semibold block mb-2 uppercase tracking-wider text-[11px]">
              Step 2: Scene Dynamic Arc & Intensity
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { id: 'ambient_flat', title: 'Atmospheric Underscore', desc: 'Gentle, floating dialogue bed' },
                { id: 'slow_build', title: 'Slow Cinematic Build', desc: 'Starts soft, swells into climax' },
                { id: 'epic_climax', title: 'High-Impact Climax', desc: 'Explosive rhythm & full ensemble' },
                { id: 'drop_reveal', title: 'Tension & Drop Reveal', desc: 'Suspenseful riser followed by silence' }
              ].map(arc => (
                <div
                  key={arc.id}
                  onClick={() => setSceneArc(arc.id as any)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition ${
                    sceneArc === arc.id
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200'
                      : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-semibold text-slate-200 text-xs">{arc.title}</div>
                  <div className="text-[10px] mt-0.5">{arc.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Track 2: Vocal Designer & 15-30s Voice Drop Box */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                Step 3: Track 2 Vocal Designer & Voice Reinterpretation
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setVocalMode('wordless_aalap')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                    vocalMode === 'wordless_aalap' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
                  }`}
                >
                  Wordless Aalap (Aaa/Ooo)
                </button>
                <button
                  onClick={() => setVocalMode('custom_voice_clip')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                    vocalMode === 'custom_voice_clip' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
                  }`}
                >
                  📥 Custom Voice Drop Box
                </button>
              </div>
            </div>

            {/* Custom Voice Drop Box Area */}
            {vocalMode === 'custom_voice_clip' && (
              <div 
                onClick={handleSimulateAudioDrop}
                className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-4 text-center cursor-pointer bg-slate-950/40 transition"
              >
                <Upload className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                {customVoiceFileName ? (
                  <div className="text-amber-300 font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Loaded: {customVoiceFileName}</span>
                  </div>
                ) : (
                  <div>
                    <div className="font-semibold text-slate-300">Drag & drop a 15–30s vocal sample (.wav, .mp3)</div>
                    <div className="text-[11px] text-slate-500">AI learns timbre, formants, and vibrato to reinterpret across the raga</div>
                  </div>
                )}
              </div>
            )}

            {/* Vocal Texture Sliders */}
            <div className="grid grid-cols-4 gap-3 pt-2">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Breathiness</span>
                  <span className="text-amber-400 font-mono">{breathiness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={breathiness}
                  onChange={(e) => setBreathiness(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Rasp / Grit</span>
                  <span className="text-amber-400 font-mono">{raspGrit}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={raspGrit}
                  onChange={(e) => setRaspGrit(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Formant Shift</span>
                  <span className="text-amber-400 font-mono">+{formantShift} st</span>
                </div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  value={formantShift}
                  onChange={(e) => setFormantShift(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Meend Depth</span>
                  <span className="text-amber-400 font-mono">{gamakaDepth}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={gamakaDepth}
                  onChange={(e) => setGamakaDepth(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Auto-scores: <span className="text-slate-200">Track 1 (Bed)</span> + <span className="text-slate-200">Track 2 (Vocals)</span> + <span className="text-slate-200">Track 3 (Percussion)</span> + <span className="text-slate-200">Track 5 (Risers & Drops)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleScoreScene}
              disabled={isGenerating}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Scene...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>🎬 Score My Scene</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
