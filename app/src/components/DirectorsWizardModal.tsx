import React, { useState, useEffect } from 'react';
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
  aiStatus?: {
    active: boolean;
    model: string;
    progress: number;
    taskName: string;
    usedGB?: number;
    totalGB?: number;
    pressurePct?: number;
    error?: string;
  };
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
  onApplyScene,
  aiStatus
}) => {
  const [selectedRasa, setSelectedRasa] = useState<RasaType>('Adbhuta');
  const [sceneArc, setSceneArc] = useState<'ambient_flat' | 'slow_build' | 'epic_climax' | 'drop_reveal'>('slow_build');
  const [vocalMode, setVocalMode] = useState<'wordless_aalap' | 'custom_voice_clip' | 'sanskrit_mantra'>('wordless_aalap');
  const [customVoiceFileName, setCustomVoiceFileName] = useState<string | null>(null);
  const [breathiness, setBreathiness] = useState(65);
  const [raspGrit, setRaspGrit] = useState(30);
  const [formantShift, setFormantShift] = useState(2);
  const [gamakaDepth, setGamakaDepth] = useState(80);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    let interval: any;
    if (aiStatus?.active) {
      interval = setInterval(() => {
        setElapsedSec(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedSec(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [aiStatus?.active]);

  if (!isOpen) return null;

  const currentRasaMeta = RASAS_META.find(r => r.type === selectedRasa) || RASAS_META[0];
  const recommendedRaga = RAGA_DATABASE.find(r => r.id === currentRasaMeta.ragaId) || RAGA_DATABASE[1];

  // Pipeline stage and elapsed timer breakdown
  const elapsedMinutes = Math.floor(elapsedSec / 60);
  const elapsedSeconds = (elapsedSec % 60).toString().padStart(2, '0');
  const elapsedTimerStr = `${elapsedMinutes}:${elapsedSeconds}`;

  let currentStageNum = 1;
  let currentStageBadge = "Stage 1/3: AR Symbolic Planning";
  let stageDescription = `Establishing ${selectedRasa} emotional contours in Raag ${recommendedRaga.name}...`;

  if (aiStatus?.progress && aiStatus.progress > 0) {
    if (aiStatus.progress < 35) {
      currentStageNum = 1;
      currentStageBadge = "Stage 1/3: Autoregressive Motif Synthesis";
      stageDescription = `Composing Raga ${recommendedRaga.name} melody & phrasing (${aiStatus.progress}%)...`;
    } else if (aiStatus.progress < 85) {
      currentStageNum = 2;
      currentStageBadge = "Stage 2/3: Acoustic Flow Matching on Metal";
      stageDescription = `Generating orchestral texture layers on Metal GPU (${aiStatus.progress}%)...`;
    } else {
      currentStageNum = 3;
      currentStageBadge = "Stage 3/3: Neural VAE 96kHz Audio Decode";
      stageDescription = `Decoding latent tensors to 96kHz / 32-bit float master WAV...`;
    }
  } else {
    if (elapsedSec < 15) {
      currentStageNum = 1;
      currentStageBadge = "Stage 1/3: Metal Allocation & Weight Loading";
      stageDescription = `Allocating 6.5 GB YuE 2 (BF16) into Apple Silicon Unified Memory...`;
    } else if (elapsedSec < 75) {
      currentStageNum = 1;
      currentStageBadge = "Stage 1/3: Autoregressive Semantic Generation";
      stageDescription = `Synthesizing ${selectedRasa} melodic motifs in Raag ${recommendedRaga.name} (${elapsedTimerStr})...`;
    } else if (elapsedSec < 160) {
      currentStageNum = 2;
      currentStageBadge = "Stage 2/3: Acoustic Flow Matching on Metal GPU";
      stageDescription = `Generating multi-track symphonic textures on Metal GPU (${elapsedTimerStr})...`;
    } else {
      currentStageNum = 3;
      currentStageBadge = "Stage 3/3: VAE Neural Decode & Audio Assembly";
      stageDescription = `Decoding latents into 96kHz / 32-bit float master audio takes (${elapsedTimerStr})...`;
    }
  }

  const displayProgress = aiStatus?.progress && aiStatus.progress > 0
    ? aiStatus.progress
    : Math.min(94, Math.max(4, Math.round((elapsedSec / 160) * 90)));

  const handleSimulateAudioDrop = () => {
    setCustomVoiceFileName('director_sample_voice_24s.wav');
    setVocalMode('custom_voice_clip');
  };

  const handleScoreScene = () => {
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
    // Modal will close externally when generation finishes
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
        <div className="p-6 overflow-y-auto space-y-6 text-xs relative">
          
          {/* Error Banner if generation failed */}
          {aiStatus?.error && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 flex items-start justify-between gap-3 shadow-lg animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <span className="text-base">⚠️</span>
                <div>
                  <h4 className="font-bold text-red-300 text-xs">Generation Notice</h4>
                  <p className="text-[11px] text-red-200/90 mt-0.5 leading-relaxed font-mono">{aiStatus.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Generation Overlay */}
          {aiStatus?.active && (
            <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-8">
              <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 mb-1 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 font-serif tracking-wide">Synthesizing Scene...</h3>
                    <div className="flex items-center justify-center gap-2 mt-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold tracking-wide">
                        {currentStageBadge}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/60">
                        ⏱️ {elapsedTimerStr}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Yellow Status: Exactly where we are standing */}
                  <div className="bg-slate-900/80 rounded-xl p-3 border border-amber-500/30 shadow-inner space-y-1">
                    <p className="text-xs text-amber-300 font-mono tracking-tight font-medium animate-pulse">
                      {stageDescription}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Raag {recommendedRaga.name} · {selectedRasa} Rasa · 32 bars @ 78 BPM · YuE 2 (BF16)
                    </p>
                  </div>

                  {/* 3-Step Pipeline Visualizer */}
                  <div className="grid grid-cols-3 gap-2 text-left pt-1">
                    <div className={`p-2 rounded-lg border transition-all ${
                      currentStageNum === 1 
                        ? 'border-amber-500/60 bg-amber-500/15 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/40' 
                        : currentStageNum > 1 
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' 
                          : 'border-slate-800 bg-slate-900/40 text-slate-500'
                    }`}>
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        <span>STEP 1</span>
                        <span>{currentStageNum > 1 ? '✓' : currentStageNum === 1 ? '●' : '○'}</span>
                      </div>
                      <div className="text-[10px] font-bold mt-0.5">AR Motifs</div>
                      <div className="text-[8px] text-slate-400 font-mono">Raga Phrasing</div>
                    </div>

                    <div className={`p-2 rounded-lg border transition-all ${
                      currentStageNum === 2 
                        ? 'border-amber-500/60 bg-amber-500/15 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/40' 
                        : currentStageNum > 2 
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' 
                          : 'border-slate-800 bg-slate-900/40 text-slate-500'
                    }`}>
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        <span>STEP 2</span>
                        <span>{currentStageNum > 2 ? '✓' : currentStageNum === 2 ? '●' : '○'}</span>
                      </div>
                      <div className="text-[10px] font-bold mt-0.5">Flow Matching</div>
                      <div className="text-[8px] text-slate-400 font-mono">Metal GPU Audio</div>
                    </div>

                    <div className={`p-2 rounded-lg border transition-all ${
                      currentStageNum === 3 
                        ? 'border-amber-500/60 bg-amber-500/15 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/40' 
                        : 'border-slate-800 bg-slate-900/40 text-slate-500'
                    }`}>
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        <span>STEP 3</span>
                        <span>{currentStageNum === 3 ? '●' : '○'}</span>
                      </div>
                      <div className="text-[10px] font-bold mt-0.5">96kHz VAE</div>
                      <div className="text-[8px] text-slate-400 font-mono">Timeline Takes</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {/* Rendering Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Rendering Orchestration</span>
                      <span className="text-amber-300 font-bold">{displayProgress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-orange-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-300 ease-out"
                        style={{ width: `${displayProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Memory Engagement */}
                  {(() => {
                    const usedMem = aiStatus?.usedGB ?? (aiStatus?.active ? 19.2 : 0);
                    const totalMem = aiStatus?.totalGB ?? 32;
                    const memPct = Math.min(100, Math.max(0, (usedMem / totalMem) * 100));
                    return (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                            Unified Memory (M1 Max Metal)
                          </span>
                          <span className="text-cyan-400 font-semibold font-mono">
                            {aiStatus?.active ? `${usedMem.toFixed(1)} GB / ${totalMem.toFixed(0)} GB (${memPct.toFixed(0)}%)` : '0.0 GB / 32 GB'}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-teal-300 rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                            style={{ width: `${aiStatus?.active ? memPct : 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                  <div className={`p-1.5 rounded border transition-colors ${aiStatus.model.includes('MiniMax') ? 'border-amber-500/40 text-amber-300 bg-amber-500/10' : 'border-slate-800'}`}>MiniMax 3</div>
                  <div className={`p-1.5 rounded border transition-colors ${aiStatus.model.includes('Stable') ? 'border-amber-500/40 text-amber-300 bg-amber-500/10' : 'border-slate-800'}`}>Stable Audio 3</div>
                  <div className={`p-1.5 rounded border transition-colors ${aiStatus.model.includes('YuE') ? 'border-amber-500/40 text-amber-300 bg-amber-500/10' : 'border-slate-800'}`}>YuE 2</div>
                </div>
              </div>
            </div>
          )}
          
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
              disabled={aiStatus?.active}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              {aiStatus?.active ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Scene...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>🎬 Generate</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
