import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Wand2, Plus, Sliders, Music, Zap, Layers, 
  Cpu, HardDrive, ShieldCheck, ChevronUp, ChevronDown, CheckCircle2,
  Volume2, Play, Pause, Square
} from 'lucide-react';
import { Track, Raga, Tala, RasaType, DirectorSceneState, TransitionFXState, TrackRole, AIModel } from './types/daw';
import { RAGA_DATABASE, TALA_DATABASE } from './lib/ragaEngine';
import { audioEngine } from './lib/webAudioEngine';
import { HeaderHUD } from './components/HeaderHUD';
import { Timeline } from './components/Timeline';
import { PianoRoll } from './components/PianoRoll';
import { DirectorsWizardModal } from './components/DirectorsWizardModal';
import { AddTrackModal } from './components/AddTrackModal';
import { RisersDropsPanel } from './components/RisersDropsPanel';
import { MasterMixerDrawer } from './components/MasterMixerDrawer';
import { ShrutiMandalaModal } from './components/ShrutiMandalaModal';
import { VagdhenuLyricsDrawer } from './components/VagdhenuLyricsDrawer';
import { AIModelOrchestratorModal } from './components/AIModelOrchestratorModal';

const INITIAL_TRACKS: Track[] = [
  {
    id: 'tr-1',
    name: '1. Lead Vocal (Aalap & Meend)',
    role: 'lead_vocal',
    model: 'ace_studio',
    color: '#f59e0b',
    muted: false,
    soloed: false,
    volume: 0.85,
    pan: 0,
    busGroup: 'Vocals',
    takes: [
      { id: 't1', name: 'Take 1 (Passionate Yaman)', timestamp: '05:12', durationSec: 64, contextAware: true }
    ],
    activeTakeIndex: 0,
    clips: [
      { id: 'c1', name: 'Yaman Aalap Phrase 1', startBar: 1, durationBars: 8, color: '#f59e0b' },
      { id: 'c2', name: 'Drut Bandish Call', startBar: 9, durationBars: 8, color: '#f59e0b' }
    ],
    hypersonicAir: true,
    somaticSub: false
  },
  {
    id: 'tr-2',
    name: '2. Vedic Chant (Sanskrit Chhandas)',
    role: 'vedic_chant',
    model: 'vagdhenu',
    color: '#ea580c',
    muted: false,
    soloed: false,
    volume: 0.8,
    pan: -0.2,
    busGroup: 'Vocals',
    takes: [
      { id: 't1', name: 'Take 1 (Gayatri Pārāyaṇa)', timestamp: '05:13', durationSec: 64, contextAware: true }
    ],
    activeTakeIndex: 0,
    clips: [
      { id: 'c3', name: 'Rigveda Invocation', startBar: 1, durationBars: 8, color: '#ea580c' }
    ],
    hypersonicAir: true,
    somaticSub: false
  },
  {
    id: 'tr-3',
    name: '3. Sitar (Meend Microtonal Glides)',
    role: 'solo_instrument',
    model: 'soundfont_native',
    color: '#3b82f6',
    muted: false,
    soloed: false,
    volume: 0.78,
    pan: 0.35,
    busGroup: 'Acoustics',
    takes: [
      { id: 't1', name: 'Take 1 (Jor-Jhala)', timestamp: '05:14', durationSec: 64, contextAware: true }
    ],
    activeTakeIndex: 0,
    clips: [
      { id: 'c4', name: 'Sitar Vadi Ga Theme', startBar: 1, durationBars: 16, color: '#3b82f6' }
    ],
    hypersonicAir: true,
    somaticSub: false
  },
  {
    id: 'tr-4',
    name: '4. Bansuri Flute (Hypersonic Sheen)',
    role: 'solo_instrument',
    model: 'soundfont_native',
    color: '#06b6d4',
    muted: false,
    soloed: false,
    volume: 0.72,
    pan: -0.35,
    busGroup: 'Acoustics',
    takes: [
      { id: 't1', name: 'Take 1 (Airy Murki)', timestamp: '05:15', durationSec: 64, contextAware: true }
    ],
    activeTakeIndex: 0,
    clips: [
      { id: 'c5', name: 'Bansuri 24k Breath Fill', startBar: 5, durationBars: 8, color: '#06b6d4' }
    ],
    hypersonicAir: true,
    somaticSub: false
  },
  {
    id: 'tr-5',
    name: '5. Risers & Drops (10-Genre Transition)',
    role: 'risers_drops',
    model: 'stable_audio_3',
    color: '#ec4899',
    muted: false,
    soloed: false,
    volume: 0.9,
    pan: 0,
    busGroup: 'Cinematic FX',
    takes: [
      { id: 't1', name: 'Take 1 (Cinematic Braam & Drop)', timestamp: '05:16', durationSec: 32, contextAware: true }
    ],
    activeTakeIndex: 0,
    clips: [
      { id: 'c6', name: '4-Bar Cinematic Riser + Sub Drop', startBar: 5, durationBars: 4, color: '#ec4899' }
    ],
    hypersonicAir: true,
    somaticSub: true
  },
  {
    id: 'tr-6',
    name: '6. Tabla Rhythm (Teental 16 Matras)',
    role: 'percussion_tala',
    model: 'soundfont_native',
    color: '#10b981',
    muted: false,
    soloed: false,
    volume: 0.85,
    pan: 0.1,
    busGroup: 'Percussion',
    takes: [
      { id: 't1', name: 'Take 1 (Dha Dhin Dhin Dha Theka)', timestamp: '05:16', durationSec: 64, contextAware: true }
    ],
    activeTakeIndex: 0,
    clips: [
      { id: 'c7', name: 'Teental 16-Beat Grooves', startBar: 1, durationBars: 24, color: '#10b981' }
    ],
    hypersonicAir: false,
    somaticSub: true
  },
  {
    id: 'tr-7',
    name: '7. Sub Bass & Cello (Somatic 16Hz)',
    role: 'ambient_pad',
    model: 'stable_audio_3',
    color: '#8b5cf6',
    muted: false,
    soloed: false,
    volume: 0.75,
    pan: 0,
    busGroup: 'Orchestral',
    takes: [
      { id: 't1', name: 'Take 1 (16Hz Infrasonic Drone)', timestamp: '05:17', durationSec: 64, contextAware: true }
    ],
    activeTakeIndex: 0,
    clips: [
      { id: 'c8', name: 'Sub-harmonic Cello Drone', startBar: 1, durationBars: 32, color: '#8b5cf6' }
    ],
    hypersonicAir: false,
    somaticSub: true
  },
  {
    id: 'tr-8',
    name: '8. Cinematic Atmosphere (Temple Bell)',
    role: 'ambient_pad',
    model: 'stable_audio_3',
    color: '#6366f1',
    muted: false,
    soloed: false,
    volume: 0.65,
    pan: 0.25,
    busGroup: 'Cinematic FX',
    takes: [
      { id: 't1', name: 'Take 1 (Varanasi Ghat Dawn Foley)', timestamp: '05:18', durationSec: 64, contextAware: true }
    ],
    activeTakeIndex: 0,
    clips: [
      { id: 'c9', name: 'Morning Ghat Atmosphere', startBar: 1, durationBars: 32, color: '#6366f1' }
    ],
    hypersonicAir: true,
    somaticSub: false
  }
];

export function App() {
  // Musical & Raga Clock state
  const [activeRaga, setActiveRaga] = useState<Raga>(RAGA_DATABASE[1]); // Raag Yaman
  const [activeTala, setActiveTala] = useState<Tala>(TALA_DATABASE[0]); // Teental 16 Matras
  const [baseSaHz, setBaseSaHz] = useState<number>(138.59); // C#3
  const [bpm, setBpm] = useState<number>(96);
  const [selectedRasa, setSelectedRasa] = useState<RasaType | 'All'>('All');

  // Transport & Playback
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playheadPosition, setPlayheadPosition] = useState<number>(1); // In bars (1 to 32)
  const [currentBeat, setCurrentBeat] = useState<number>(0);

  // Multitrack state
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>('tr-1');

  // Modal / Drawer visibility
  const [isDirectorWizardOpen, setIsDirectorWizardOpen] = useState<boolean>(false);
  const [isAddTrackOpen, setIsAddTrackOpen] = useState<boolean>(false);
  const [isRisersDropsOpen, setIsRisersDropsOpen] = useState<boolean>(false);
  const [isMasterMixerOpen, setIsMasterMixerOpen] = useState<boolean>(false);
  const [isPianoRollOpen, setIsPianoRollOpen] = useState<boolean>(true);
  const [isShrutiHubOpen, setIsShrutiHubOpen] = useState<boolean>(false);
  const [isVagdhenuOpen, setIsVagdhenuOpen] = useState<boolean>(false);
  const [isAISuiteOpen, setIsAISuiteOpen] = useState<boolean>(false);
  const [aiFocusedTrackId, setAiFocusedTrackId] = useState<string | null>(null);

  // Notifications / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Metronome & Playhead timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      const beatDurationMs = (60 / bpm) * 1000;
      interval = setInterval(() => {
        setCurrentBeat(prev => {
          const nextBeat = (prev + 1) % activeTala.matras;
          
          // Play click for current matra
          const clapType = activeTala.claps[nextBeat];
          if (clapType === 'sam') {
            audioEngine.playMetronomeClick(880, 0.4); // High pitch for Sam
          } else if (clapType === 'tali') {
            audioEngine.playMetronomeClick(587.33, 0.25); // Medium pitch
          } else if (clapType === 'khali') {
            audioEngine.playMetronomeClick(440, 0.15); // Soft pitch
          }

          return nextBeat;
        });

        // Advance playhead in bars (each 4 beats is 1 bar in 4/4 or 16-beat cycle)
        setPlayheadPosition(prev => {
          const newPos = prev + (4 / activeTala.matras) * 0.25;
          return newPos > 32 ? 1 : newPos;
        });

      }, beatDurationMs);
    }
    return () => clearInterval(interval);
  }, [isPlaying, bpm, activeTala]);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleUpdateTrack = (trackId: string, updates: Partial<Track>) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, ...updates } : t));
  };

  const handleAddTrack = (newTrackData: {
    name: string;
    role: TrackRole;
    model: AIModel;
    color: string;
    busGroup: 'Vocals' | 'Acoustics' | 'Percussion' | 'Orchestral' | 'Cinematic FX';
  }) => {
    const newTrack: Track = {
      id: `tr-${Date.now()}`,
      name: newTrackData.name,
      role: newTrackData.role,
      model: newTrackData.model,
      color: newTrackData.color,
      muted: false,
      soloed: false,
      volume: 0.8,
      pan: 0,
      busGroup: newTrackData.busGroup,
      takes: [
        { id: `t-${Date.now()}`, name: 'Take 1 (Initial Generation)', timestamp: 'Just now', durationSec: 32, contextAware: true }
      ],
      activeTakeIndex: 0,
      clips: [
        { id: `c-${Date.now()}`, name: `${newTrackData.name} Clip`, startBar: 1, durationBars: 8, color: newTrackData.color }
      ],
      hypersonicAir: true,
      somaticSub: newTrackData.busGroup === 'Percussion'
    };

    setTracks(prev => [...prev, newTrack]);
    setSelectedTrackId(newTrack.id);
    showToast(`Added track: ${newTrack.name} (${tracks.length + 1} total tracks)`);
  };

  const handleApplyDirectorScene = (scene: DirectorSceneState, raga: Raga) => {
    setActiveRaga(raga);
    setBpm(scene.pacingBpm);
    showToast(`Scored scene: ${scene.sceneTitle} in Raag ${raga.name} (${scene.rasa})!`);
  };

  const handleInsertTransition = (fx: TransitionFXState) => {
    // Add or update track 5 clip
    const riserTrackIndex = tracks.findIndex(t => t.role === 'risers_drops');
    const newClip = {
      id: `clip-fx-${Date.now()}`,
      name: `${fx.genre} ${fx.type.toUpperCase()} (${fx.bars} bars)`,
      startBar: Math.max(1, fx.targetBar - fx.bars),
      durationBars: fx.bars,
      color: '#ec4899'
    };

    if (riserTrackIndex !== -1) {
      setTracks(prev => {
        const updated = [...prev];
        updated[riserTrackIndex] = {
          ...updated[riserTrackIndex],
          clips: [...updated[riserTrackIndex].clips, newClip]
        };
        return updated;
      });
      showToast(`Inserted ${fx.bars}-bar ${fx.genre} ${fx.type} into Track 5 at Bar ${newClip.startBar}!`);
    } else {
      showToast(`Inserted ${fx.genre} transition clip!`);
    }
  };

  const handleRegenerateTrack = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    showToast(`Regenerating ${track.name} with ${track.model.toUpperCase()} (96kHz Extended Spectrum)...`);
    setTimeout(() => {
      setTracks(prev => prev.map(t => {
        if (t.id !== trackId) return t;
        const newTake = {
          id: `take-${Date.now()}`,
          name: `Take ${t.takes.length + 1} (${activeRaga.name} Overdub)`,
          timestamp: 'Just now',
          durationSec: 64,
          contextAware: true
        };
        return {
          ...t,
          takes: [...t.takes, newTake],
          activeTakeIndex: t.takes.length
        };
      }));
      showToast(`Generated Take for ${track.name} with zero phase cancellation!`);
    }, 1200);
  };

  const selectedTrack = tracks.find(t => t.id === selectedTrackId) || tracks[0] || null;

  /** Commit an AI-synthesised take as a new clip on the target track. */
  const handleGenerateAIClip = (
    trackId: string,
    prompt: string,
    model: AIModel,
    durationBars: number
  ) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    const startBar = Math.max(
      1,
      track.clips.reduce((end, c) => Math.max(end, c.startBar + c.durationBars), 1)
    );

    setTracks(prev =>
      prev.map(t => {
        if (t.id !== trackId) return t;
        const takeName = `Take ${t.takes.length + 1} (${model.replace('_', ' ')} · ${activeRaga.name})`;
        return {
          ...t,
          model,
          takes: [
            ...t.takes,
            {
              id: `take-${Date.now()}`,
              name: takeName,
              timestamp: 'Just now',
              durationSec: Math.round(durationBars * (4 * 60 / bpm)),
              energyScore: 0.86,
              promptUsed: prompt,
              contextAware: true
            }
          ],
          activeTakeIndex: t.takes.length,
          clips: [
            ...t.clips,
            {
              id: `clip-ai-${Date.now()}`,
              name: `${activeRaga.name} AI Phrase (${durationBars}b)`,
              startBar,
              durationBars,
              color: t.color
            }
          ]
        };
      })
    );

    audioEngine.playNotePreview(baseSaHz * 2, 0.5);
    showToast(`${model.replace('_', ' ')} rendered ${durationBars} bars → ${track.name} @ Bar ${startBar}`);
  };

  /** Route a Vedic hymn into Track 2 (Vocals) as a new AI take. */
  const handleSendVedicToTrack2 = (vedicText: string) => {
    const vocalTrack = tracks.find(t => t.id === 'tr-2') ?? tracks.find(t => t.role === 'vedic_chant');
    if (!vocalTrack) {
      showToast('No vocal track available to receive the recitation.');
      return;
    }

    setTracks(prev =>
      prev.map(t => {
        if (t.id !== vocalTrack.id) return t;
        return {
          ...t,
          takes: [
            ...t.takes,
            {
              id: `take-vedic-${Date.now()}`,
              name: `Take ${t.takes.length + 1} (Vāgdhenu Recitation)`,
              timestamp: 'Just now',
              durationSec: 32,
              energyScore: 0.9,
              promptUsed: vedicText,
              contextAware: true
            }
          ],
          activeTakeIndex: t.takes.length,
          clips: [
            ...t.clips,
            {
              id: `clip-vedic-${Date.now()}`,
              name: 'Vedic Chhandas Recitation',
              startBar: Math.max(
                1,
                t.clips.reduce((end, c) => Math.max(end, c.startBar + c.durationBars), 1)
              ),
              durationBars: 8,
              color: t.color
            }
          ]
        };
      })
    );

    audioEngine.playNotePreview(baseSaHz * 1.5, 0.6);
    showToast(`Vāgdhenu recitation routed to ${vocalTrack.name}`);
  };

  const openAISuite = (trackId?: string) => {
    setAiFocusedTrackId(trackId ?? null);
    setIsAISuiteOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#07090e] text-slate-100 overflow-hidden font-sans select-none">
      
      {/* 1. Header HUD & Raga Command Strip */}
      <HeaderHUD
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        bpm={bpm}
        onBpmChange={setBpm}
        baseSaHz={baseSaHz}
        onSaHzChange={setBaseSaHz}
        activeRaga={activeRaga}
        onRagaSelect={setActiveRaga}
        activeTala={activeTala}
        onTalaSelect={setActiveTala}
        selectedRasa={selectedRasa}
        onRasaChange={setSelectedRasa}
        onOpenDirectorWizard={() => setIsDirectorWizardOpen(true)}
        onOpenAddTrack={() => setIsAddTrackOpen(true)}
        onToggleMasterMixer={() => setIsMasterMixerOpen(!isMasterMixerOpen)}
        onOpenShrutiHub={() => setIsShrutiHubOpen(true)}
        onOpenVagdhenu={() => setIsVagdhenuOpen(true)}
        onOpenAISuite={() => openAISuite()}
        currentBeat={currentBeat}
      />

      {/* 2. Main Timeline Workspace */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <Timeline
          tracks={tracks}
          onUpdateTrack={handleUpdateTrack}
          onSelectTrack={(t) => setSelectedTrackId(t.id)}
          selectedTrackId={selectedTrackId}
          activeTala={activeTala}
          activeRaga={activeRaga}
          isPlaying={isPlaying}
          playheadPosition={playheadPosition}
          onSeekPlayhead={(bar) => setPlayheadPosition(bar)}
          onOpenAddTrack={() => setIsAddTrackOpen(true)}
          onOpenRisersDrops={() => setIsRisersDropsOpen(true)}
          onRegenerateTrack={handleRegenerateTrack}
        />

        {/* Floating Quick Action Drawer Bar (Center Bottom of Timeline) */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-2xl">
          <button
            onClick={() => setIsDirectorWizardOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Director's Mode (9 Rasas)
          </button>

          <button
            onClick={() => setIsRisersDropsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/20 border border-pink-500/40 text-pink-300 hover:bg-pink-500/30 text-xs font-semibold transition-all shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-pink-400" />
            Track 5 (Risers & Drops)
          </button>

          <button
            onClick={() => setIsAddTrackOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            Add Track ({tracks.length}/40+)
          </button>

          <button
            onClick={() => setIsMasterMixerOpen(!isMasterMixerOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 text-xs font-semibold transition-all shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Master & 3D Spatial
          </button>

          <div className="w-px h-5 bg-slate-700 mx-1"></div>

          <button
            onClick={() => setIsShrutiHubOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold transition-all shadow-sm"
            title="22 Shrutis Just Intonation & Moveable Sa continuous-Hz tuning"
          >
            <span className="text-[13px] leading-none">🕉️</span>
            22 Shrutis · Sa Hub
          </button>

          <button
            onClick={() => setIsVagdhenuOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-300 hover:bg-orange-500/30 text-xs font-semibold transition-all shadow-sm"
            title="Vāgdhenu Sanskrit Vedic phonology & synchronized teleprompter"
          >
            <span className="text-[13px] leading-none">📿</span>
            Vedic Lyrics
          </button>

          <button
            onClick={() => openAISuite()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-300 hover:bg-violet-500/30 text-xs font-semibold transition-all shadow-sm"
            title="Multi-model AI suite with Apple MLX memory budgeter"
          >
            <span className="text-[13px] leading-none">🧠</span>
            AI Suite (MLX)
          </button>

          <div className="w-px h-5 bg-slate-700 mx-1"></div>

          <button
            onClick={() => setIsPianoRollOpen(!isPianoRollOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isPianoRollOpen
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            Swara Piano Roll
            {isPianoRollOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* 3. Bottom Swara Piano Roll Drawer */}
      {isPianoRollOpen && (
        <div className="h-64 border-t border-slate-800 bg-[#080b12] flex flex-col z-20 shadow-2xl">
          <PianoRoll
            selectedTrack={selectedTrack}
            activeRaga={activeRaga}
            baseSaHz={baseSaHz}
          />
        </div>
      )}

      {/* 4. Bottom System Status Bar */}
      <footer className="h-7 border-t border-slate-800/90 bg-[#06080e] px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
        
        {/* Left: Modal bridge readout */}
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            Raga: {activeRaga.name} ({activeRaga.tradition})
          </span>
          <span className="text-slate-500">|</span>
          <span>Western Mode: <span className="text-slate-200">{activeRaga.westernMode}</span></span>
          <span className="text-slate-500">|</span>
          <span>Vadi: <span className="text-amber-300">{activeRaga.vadi}</span> • Samvadi: <span className="text-amber-300">{activeRaga.samvadi}</span></span>
        </div>

        {/* Center: Live Notification Toast */}
        {toastMessage && (
          <div className="flex items-center gap-2 text-emerald-300 font-sans font-semibold text-xs animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {toastMessage}
          </div>
        )}

        {/* Right: Mac M1 Max 32GB Hardware Footprint */}
        <div className="flex items-center gap-4 text-[10px]">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Cpu className="w-3 h-3" /> Apple M1 Max (32GB Unified)
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <HardDrive className="w-3 h-3" /> 6.4 GB / 18 GB Allocated (14 GB Free)
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-purple-400">
            96 kHz / 32-bit Float CoreAudio
          </span>
        </div>
      </footer>

      {/* 5. Modals & Drawers */}
      <DirectorsWizardModal
        isOpen={isDirectorWizardOpen}
        onClose={() => setIsDirectorWizardOpen(false)}
        baseSaHz={baseSaHz}
        onApplyScene={handleApplyDirectorScene}
      />

      <AddTrackModal
        isOpen={isAddTrackOpen}
        onClose={() => setIsAddTrackOpen(false)}
        onAddTrack={handleAddTrack}
        existingTrackCount={tracks.length}
      />

      <RisersDropsPanel
        isOpen={isRisersDropsOpen}
        onClose={() => setIsRisersDropsOpen(false)}
        baseSaHz={baseSaHz}
        activeRaga={activeRaga}
        onInsertTransition={handleInsertTransition}
      />

      <MasterMixerDrawer
        isOpen={isMasterMixerOpen}
        onClose={() => setIsMasterMixerOpen(false)}
        isPlaying={isPlaying}
        busGroups={['Vocals', 'Acoustics', 'Percussion', 'Orchestral', 'Cinematic FX']}
      />

      <ShrutiMandalaModal
        isOpen={isShrutiHubOpen}
        onClose={() => setIsShrutiHubOpen(false)}
        baseSaHz={baseSaHz}
        onSaHzChange={setBaseSaHz}
        activeRagaId={activeRaga.id}
      />

      <VagdhenuLyricsDrawer
        isOpen={isVagdhenuOpen}
        onClose={() => setIsVagdhenuOpen(false)}
        baseSaHz={baseSaHz}
        onSaHzChange={setBaseSaHz}
        activeRaga={activeRaga}
        beatsPerBar={activeTala.matras / 4}
        onSendToTrack2={handleSendVedicToTrack2}
      />

      <AIModelOrchestratorModal
        isOpen={isAISuiteOpen}
        onClose={() => setIsAISuiteOpen(false)}
        baseSaHz={baseSaHz}
        activeRaga={activeRaga}
        activeTala={activeTala}
        tracks={tracks}
        focusedTrackId={aiFocusedTrackId}
        onGenerateAIClip={handleGenerateAIClip}
      />

    </div>
  );
}

export default App;
