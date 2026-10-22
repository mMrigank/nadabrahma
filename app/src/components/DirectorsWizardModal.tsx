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

const SANSKRIT_SHLOKAS: Record<RasaType, { title: string; devanagari: string; iast: string; meaning: string }> = {
  Adbhuta: {
    title: 'Vishvarupa Darshanam (Universal Cosmic Form)',
    devanagari: 'ॐ नमो भगवते वासुदेवाय । पश्य मे पार्थ रूपाणि शतशोऽथ सहस्रशः ॥',
    iast: 'oṃ namo bhagavate vāsudevāya | paśya me pārtha rūpāṇi śataśo\'tha sahasraśaḥ ||',
    meaning: 'Cosmic revelation of infinite universal forms (Bhagavad Gita 11.5)'
  },
  Shringara: {
    title: 'Madhurashtakam (Divine Romance & Grace)',
    devanagari: 'अधरं मधुरं वदनं मधुरं नयनं मधुरं हसितं मधुरम् । मधुराधिपतेरखिलं मधुरम् ॥',
    iast: 'adharaṃ madhuraṃ vadanaṃ madhuraṃ nayanaṃ madhuraṃ hasitaṃ madhuram | madhurādhipaterakhilaṃ madhuram ||',
    meaning: 'Supreme sweetness of the beloved, sublime romance and divine grace'
  },
  Karuna: {
    title: 'Maha Mrityunjaya (Soul Solace & Pathos)',
    devanagari: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् । उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय मामृतात् ॥',
    iast: 'oṃ tryambakaṃ yajāmahe sugandhiṃ puṣṭivardhanam | urvārukamiva bandhanānmṛtyormukṣīya māmṛtāt ||',
    meaning: 'Deep soul solace, healing of mortal grief, liberation into eternal light'
  },
  Shanta: {
    title: 'Pavamana Shanti Mantra (Transcendent Peace)',
    devanagari: 'ॐ असतो मा सद्गमय । तमसो मा ज्योतिर्गमय । मृत्योर्मा अमृतं गमय ॥ ॐ शान्तिः ॥',
    iast: 'oṃ asato mā sadgamaya | tamaso mā jyotirgamaya | mṛtyormā amṛtaṃ gamaya || oṃ śāntiḥ ||',
    meaning: 'Lead from darkness to light, transcendent stillness and inner peace'
  },
  Veera: {
    title: 'Dharma Jagriti (Heroic Duty & Valor)',
    devanagari: 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत । अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम् ॥',
    iast: 'yadā yadā hi dharmasya glānirbhavati bhārata | abhyutthānamadharmasya tadātmānaṃ sṛjāmyaham ||',
    meaning: 'Heroic awakening to restore righteousness and vanquish chaos'
  },
  Raudra: {
    title: 'Shiva Tandava Stotram (Cosmic Fury & Power)',
    devanagari: 'जटाटवीगलज्जलप्रवाहपावितस्थले गलेऽवलम्ब्य लम्बितां भुजङ्गतुङ्गमालिकाम् ॥',
    iast: 'jaṭāṭavīgalajjalapravāhapāvitasthale gale\'valambya lambitāṃ bhujaṅgatuṅgamālikām ||',
    meaning: 'Cosmic fury of the cosmic dancer, fierce dissolution of illusion'
  },
  Hasya: {
    title: 'Hasya Rasollasa (Joy & Playfulness)',
    devanagari: 'हास्यं रसानां प्रवरं वदन्ति चित्तप्रसादं कुरुते नराणाम् । आनन्दकन्दं परिपूर्णरूपम् ॥',
    iast: 'hāsyaṃ rasānāṃ pravaraṃ vadanti cittaprasādaṃ kurute narāṇām | ānandakandaṃ paripūrṇarūpam ||',
    meaning: 'Laughter brings delight and clears the minds of mortals'
  },
  Bhayanaka: {
    title: 'Narasimha Kavacham (Cosmic Terror & Protection)',
    devanagari: 'उग्रं वीरं महाविष्णुं ज्वलन्तं सर्वतोमुखम् । नृसिंहं भीषणं भद्रं मृत्युमृत्युं नमाम्यहम् ॥',
    iast: 'ugraṃ vīraṃ mahāviṣṇuṃ jvalantaṃ sarvatomukham | nṛsiṃhaṃ bhīṣaṇaṃ bhadraṃ mṛtyumṛtyuṃ namāmyaham ||',
    meaning: 'Sublime awe and protection from existential dread'
  },
  Bibhatsa: {
    title: 'Vairagya Shatakam (Aversion & Transcendence)',
    devanagari: 'भोगा न भुक्ता वयमेव भुक्ताः कालो न यातो वयमेव याताः । तृष्णा न जीर्णा वयमेव जीर्णाः ॥',
    iast: 'bhogā na bhuktā vayameva bhuktāḥ kālo na yāto vayameva yātāḥ | tṛṣṇā na jīrṇā vayameva jīrṇāḥ ||',
    meaning: 'Dispassion toward mortal illusions and transience (Bhartrihari)'
  }
};

export const DirectorsWizardModal: React.FC<DirectorsWizardModalProps> = ({
  isOpen,
  onClose,
  baseSaHz,
  onApplyScene,
  aiStatus
}) => {
  const [selectedRasa, setSelectedRasa] = useState<RasaType>('Adbhuta');
  const [sceneArc, setSceneArc] = useState<'ambient_flat' | 'slow_build' | 'epic_climax' | 'drop_reveal'>('slow_build');
  const [vocalMode, setVocalMode] = useState<'wordless_aalap' | 'custom_voice_clip' | 'sanskrit_mantra' | 'instrumental_only'>('wordless_aalap');
  const [aalapVowel, setAalapVowel] = useState<'aaa' | 'ooo' | 'hey' | 'mmm'>('aaa');
  const [aalapMovement, setAalapMovement] = useState<'vilambit' | 'meend_glides' | 'drut_taans'>('vilambit');
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
      aalapVowel,
      aalapMovement,
      customVoiceName: customVoiceFileName || undefined,
      isAlap: false,
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

            <div className="text-right text-[11px] text-slate-400 font-mono">
              <div>Tempo: <span className="text-slate-200 font-bold">78 BPM (Vilambit)</span></div>
              <div>Tala: <span className="text-slate-200 font-bold">Teental (16)</span></div>
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
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-slate-200 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-2">
                <span>Step 3: Track 2 Vocal Designer & Voice Reinterpretation</span>
                {vocalMode === 'wordless_aalap' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    Aalap Vocalist Active
                  </span>
                )}
                {vocalMode === 'instrumental_only' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                    Muted (Instrumental)
                  </span>
                )}
              </span>

              {/* Interactive Vocal Mode Toggles */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* 1. Toggleable Wordless Aalap Button */}
                <button
                  type="button"
                  onClick={() => setVocalMode(prev => prev === 'wordless_aalap' ? 'instrumental_only' : 'wordless_aalap')}
                  title="Click to toggle Wordless Aalap vocals ON / OFF"
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-2 border cursor-pointer select-none ${
                    vocalMode === 'wordless_aalap'
                      ? 'bg-amber-500/25 border-amber-500/70 text-amber-200 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/30 font-semibold'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full transition-all ${
                    vocalMode === 'wordless_aalap'
                      ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse'
                      : 'bg-slate-600'
                  }`} />
                  <span className="font-semibold">Wordless Aalap (Aaa/Ooo)</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase transition ${
                    vocalMode === 'wordless_aalap'
                      ? 'bg-amber-400 text-amber-950 shadow-sm'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {vocalMode === 'wordless_aalap' ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* 2. Custom Voice Drop Box */}
                <button
                  type="button"
                  onClick={() => setVocalMode(prev => prev === 'custom_voice_clip' ? 'instrumental_only' : 'custom_voice_clip')}
                  title="Click to toggle Custom Voice Sample Reinterpretation"
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 border cursor-pointer ${
                    vocalMode === 'custom_voice_clip'
                      ? 'bg-blue-500/25 border-blue-500/70 text-blue-200 shadow-md shadow-blue-500/20 ring-1 ring-blue-400/30 font-semibold'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full transition-all ${
                    vocalMode === 'custom_voice_clip'
                      ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.9)] animate-pulse'
                      : 'bg-slate-600'
                  }`} />
                  <span>📥 Custom Voice Drop Box</span>
                </button>

                {/* 3. Sacred Sanskrit Shloka (Vāgdhenu) */}
                <button
                  type="button"
                  onClick={() => setVocalMode(prev => prev === 'sanskrit_mantra' ? 'instrumental_only' : 'sanskrit_mantra')}
                  title="Click to toggle Sacred Sanskrit Vedic Chanting (IISc Vāgdhenu)"
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 border cursor-pointer ${
                    vocalMode === 'sanskrit_mantra'
                      ? 'bg-orange-500/25 border-orange-500/70 text-orange-200 shadow-md shadow-orange-500/20 ring-1 ring-orange-400/30 font-semibold'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full transition-all ${
                    vocalMode === 'sanskrit_mantra'
                      ? 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.9)] animate-pulse'
                      : 'bg-slate-600'
                  }`} />
                  <span>🕉️ Sanskrit Shloka (Vāgdhenu)</span>
                </button>
              </div>
            </div>

            {/* A. Wordless Aalap Designer Studio */}
            {vocalMode === 'wordless_aalap' && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-slate-950/80 border border-amber-500/40 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-amber-300">📿 Wordless Aalap Studio</span>
                    <span className="text-[10px] text-amber-400/80 font-mono">22 Shrutis Just Intonation</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Pure expressive vowels • Sings without language barrier
                  </div>
                </div>

                {/* Vowel Selection */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Select Core Singing Vowel:</span>
                    <span className="text-amber-400 font-mono text-[10px]">
                      Active: {aalapVowel === 'aaa' ? 'Aaa (आ)' : aalapVowel === 'ooo' ? 'Ooo (ऊ)' : aalapVowel === 'hey' ? 'Hey (हे)' : 'Mmm (ॐ)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'aaa', label: 'Aaa (आ)', desc: 'Broad chest warmth & grandeur' },
                      { id: 'ooo', label: 'Ooo (ऊ)', desc: 'Inward meditative resonance' },
                      { id: 'hey', label: 'Hey (हे)', desc: 'High dramatic vocal call' },
                      { id: 'mmm', label: 'Mmm / Om (ॐ)', desc: 'Nasal hum & drone glide' }
                    ].map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setAalapVowel(v.id as any)}
                        className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                          aalapVowel === v.id
                            ? 'bg-amber-500/25 border-amber-500/70 text-amber-200 shadow-sm shadow-amber-500/20'
                            : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="font-bold text-xs">{v.label}</div>
                        <div className="text-[9px] text-slate-400 leading-tight mt-0.5">{v.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Movement & Phrasing */}
                <div className="flex items-center justify-between pt-1 text-[11px] flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Movement Style:</span>
                    <div className="flex gap-1">
                      {[
                        { id: 'vilambit', label: 'Vilambit (Contemplative)' },
                        { id: 'meend_glides', label: 'Continuous Meend' },
                        { id: 'drut_taans', label: 'Drut Taans' }
                      ].map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setAalapMovement(m.id as any)}
                          className={`px-2.5 py-1 rounded text-[10px] transition cursor-pointer ${
                            aalapMovement === m.id
                              ? 'bg-amber-500/30 text-amber-200 font-semibold border border-amber-500/50'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono">
                    Raag {recommendedRaga.name} Swaras: <span className="text-amber-300 font-bold">{recommendedRaga.arohana}</span>
                  </div>
                </div>
              </div>
            )}

            {/* B. Custom Voice Drop Box Area */}
            {vocalMode === 'custom_voice_clip' && (
              <div 
                onClick={handleSimulateAudioDrop}
                className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl p-4 text-center cursor-pointer bg-slate-950/40 transition animate-in fade-in duration-150"
              >
                <Upload className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                {customVoiceFileName ? (
                  <div className="text-blue-300 font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Loaded: {customVoiceFileName}</span>
                  </div>
                ) : (
                  <div>
                    <div className="font-semibold text-slate-300">Drag & drop a 15–30s vocal sample (.wav, .mp3)</div>
                    <div className="text-[11px] text-slate-500">AI learns timbre, formants, and vibrato to reinterpret across Raag {recommendedRaga.name}</div>
                  </div>
                )}
              </div>
            )}

            {/* C. Sacred Sanskrit Shloka Card */}
            {vocalMode === 'sanskrit_mantra' && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-orange-950/30 via-slate-900/90 to-slate-950/80 border border-orange-500/40 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-orange-300">🕉️ Vāgdhenu Vedic SVS</span>
                    <span className="text-[10px] text-orange-400/80 font-mono">IISc Bengaluru • Zero Schwa-Deletion</span>
                  </div>
                  <span className="text-[10px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded border border-orange-500/30 font-medium">
                    {SANSKRIT_SHLOKAS[selectedRasa].title}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800">
                  <div className="text-sm font-serif text-amber-200 font-medium tracking-wide">
                    {SANSKRIT_SHLOKAS[selectedRasa].devanagari}
                  </div>
                  <div className="text-[10px] text-slate-400 italic mt-1 font-mono">
                    {SANSKRIT_SHLOKAS[selectedRasa].iast}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {SANSKRIT_SHLOKAS[selectedRasa].meaning}
                  </div>
                </div>
              </div>
            )}

            {/* D. Instrumental Only Banner */}
            {vocalMode === 'instrumental_only' && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center text-xs text-slate-400 animate-in fade-in duration-150">
                <span className="font-semibold text-slate-300">🔇 Instrumental Bed Mode:</span> Track 2 Vocalist is muted. Synthesis generates a pure acoustic raga ensemble (Sitar, Bansuri, Strings & Tanpura) with zero singing.
              </div>
            )}

            {/* Vocal Texture Sliders */}
            <div className={`grid grid-cols-4 gap-3 pt-2 transition-opacity ${vocalMode === 'instrumental_only' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
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
            Auto-scores: <span className="text-slate-200">Track 1 (Bed / Drone)</span> + {vocalMode === 'instrumental_only' ? (
              <span className="text-slate-500 line-through" title="Track 2 Vocalist muted for instrumental bed">Track 2 (Vocals - Muted)</span>
            ) : vocalMode === 'wordless_aalap' ? (
              <span className="text-amber-300 font-medium" title="Wordless Aalap on pure expressive vowels">Track 2 (Wordless Aalap - {aalapVowel.toUpperCase()})</span>
            ) : vocalMode === 'sanskrit_mantra' ? (
              <span className="text-orange-300 font-medium" title="Vāgdhenu Vedic Recitation">Track 2 (Vedic Shloka)</span>
            ) : (
              <span className="text-blue-300 font-medium" title="Custom Voice Reinterpretation">Track 2 (Custom Voice)</span>
            )} + <span className="text-slate-200">Track 3 (Percussion)</span> + <span className="text-slate-200">Track 5 (Ambience)</span>
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
