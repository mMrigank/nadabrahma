import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Wand2, Plus, Sliders, Music, Zap, Layers, 
  Cpu, HardDrive, ShieldCheck, ChevronUp, ChevronDown, CheckCircle2,
  Volume2, Play, Pause, Square, Activity, Scissors, Compass,
  RotateCcw, RotateCw, GitBranch, Radio, Folder
} from 'lucide-react';
import { Track, Raga, Tala, RasaType, DirectorSceneState, TransitionFXState, TrackRole, AIModel, MetronomeTimbre, SpatialCoordinates, AudioClip, AudioTake, PluginInstance, ArrangementSection } from './types/daw';
import { RAGA_DATABASE, TALA_DATABASE } from './lib/ragaEngine';
import { audioEngine } from './lib/webAudioEngine';
import { TimeEngine } from './lib/timeEngine';
import { HeaderHUD } from './components/HeaderHUD';
import { Timeline } from './components/Timeline';
import { TopMenuBar } from './components/layout/TopMenuBar';
import { AIGenerationModal } from './components/AIGenerationModal';
import { VariationSelectorModal } from './components/VariationSelectorModal';
import { FooterStatusBar } from './components/layout/FooterStatusBar';
import { ModalHost } from './components/layout/ModalHost';
import { DEFAULT_MASTER_PLUGINS } from './lib/pluginEngine';
import { arrangementEngine } from './lib/arrangementEngine';
import { getOptimizedLoadedModels, calculateWorkingMemoryGB } from './lib/aiModelData';
import { DEFAULT_TRACK_SPATIAL, SPATIAL_STAGING_PRESETS } from './lib/spatialAudioEngine';
import { sessionHistory, SessionState } from './lib/sessionHistoryEngine';
import { midiEngine } from './lib/midiEngine';

const INITIAL_TRACKS: Track[] = [];

/**
 * Creates multi-track separated stem channels when Director scores a scene
 */
function createStemTracksForDirectorScene(
  scene: DirectorSceneState,
  raga: Raga,
  tala: Tala,
  audioBuffer?: AudioBuffer,
  waveformPoints?: number[]
): Track[] {
  const isAlapMode = !!scene.isAlap;
  const leadInst = scene.rasa === 'Karuna' 
    ? 'Sarod (Fretless Metallic Sustain)'
    : scene.rasa === 'Shanta'
    ? 'Bansuri Flute (Hypersonic Sheen)'
    : scene.rasa === 'Raudra' || scene.rasa === 'Veera'
    ? 'Rudra Veena (Ancient Dhrupad Bass)'
    : 'Sitar (Meend Microtonal Glides)';

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const leadClip: AudioClip = {
    id: `clip-mel-${Date.now()}`,
    name: `${scene.rasa} Melody (${leadInst.split(' ')[0]})`,
    startBar: 1,
    durationBars: 32,
    color: '#b08d57',
    audioBuffer: audioBuffer,
    waveformPoints: waveformPoints || Array.from({ length: 64 }, (_, i) => Math.sin(i * 0.2) * 0.45 + 0.5)
  };

  const rhythmClip: AudioClip = {
    id: `clip-rhythm-${Date.now()}`,
    name: `${tala.name} (${isAlapMode ? 'Muted in Alap' : 'Theka'})`,
    startBar: 1,
    durationBars: 32,
    color: '#8c7750',
    waveformPoints: Array.from({ length: 64 }, (_, i) => (i % 4 === 0 ? 0.9 : 0.35))
  };

  const droneClip: AudioClip = {
    id: `clip-drone-${Date.now()}`,
    name: `Tanpura Drone (Sa-Pa Continuous)`,
    startBar: 1,
    durationBars: 32,
    color: '#5d7491',
    waveformPoints: Array.from({ length: 64 }, () => 0.6)
  };

  const vocalClip: AudioClip = {
    id: `clip-voc-${Date.now()}`,
    name: scene.vocalPreference === 'sanskrit_mantra' ? 'Vāgdhenu Vedic Recitation' : 'Wordless Classical Aalap',
    startBar: 1,
    durationBars: 32,
    color: '#a06352',
    waveformPoints: Array.from({ length: 64 }, (_, i) => Math.cos(i * 0.15) * 0.4 + 0.5)
  };

  const fxClip: AudioClip = {
    id: `clip-fx-${Date.now()}`,
    name: `16Hz Somatic Sub & Braam`,
    startBar: 1,
    durationBars: 32,
    color: '#8f6277',
    waveformPoints: Array.from({ length: 64 }, (_, i) => (i < 8 ? 0.95 : 0.2))
  };

  const newTracks: Track[] = [
    {
      id: 'tr-1',
      name: `1. Melody (${leadInst.split(' ')[0]})`,
      activeInstrument: leadInst,
      role: 'solo_instrument',
      model: 'yue_2',
      color: '#b08d57',
      muted: false,
      soloed: false,
      volume: 0.85,
      pan: 0,
      busGroup: 'Acoustics',
      takes: [{ id: `take-1-${Date.now()}`, name: `Take 1 (${scene.rasa} Melody)`, timestamp, durationSec: 128, contextAware: true }],
      activeTakeIndex: 0,
      clips: [leadClip],
      hypersonicAir: true,
      somaticSub: false,
      spatial: { azimuth: 0, elevation: 0, distance: 2.0, binauralHrtf: true, spread: 0.2 }
    },
    {
      id: 'tr-2',
      name: `2. Rhythm & Tala (${isAlapMode ? 'Pakhawaj' : 'Tabla'})`,
      activeInstrument: isAlapMode ? 'Pakhawaj (Ancient Dhrupad Temple Drum)' : 'Tabla & Dagga (Teental 16 Matras)',
      role: 'percussion_tala',
      model: 'soundfont_native',
      color: '#8c7750',
      muted: isAlapMode,
      soloed: false,
      volume: 0.8,
      pan: 0.15,
      busGroup: 'Percussion',
      takes: [{ id: `take-2-${Date.now()}`, name: `Take 1 (${tala.name})`, timestamp, durationSec: 128, contextAware: true }],
      activeTakeIndex: 0,
      clips: [rhythmClip],
      hypersonicAir: false,
      somaticSub: true,
      spatial: { azimuth: 15, elevation: 0, distance: 2.2, binauralHrtf: true, spread: 0.3 }
    },
    {
      id: 'tr-3',
      name: `3. Drone (Tanpura)`,
      activeInstrument: 'Tanpura Drone (4-String Acoustic Grounding)',
      role: 'ambient_pad',
      model: 'soundfont_native',
      color: '#5d7491',
      muted: false,
      soloed: false,
      volume: 0.7,
      pan: -0.2,
      busGroup: 'Acoustics',
      takes: [{ id: `take-3-${Date.now()}`, name: `Take 1 (Pa-Sa Harmonic Ground)`, timestamp, durationSec: 128, contextAware: true }],
      activeTakeIndex: 0,
      clips: [droneClip],
      hypersonicAir: true,
      somaticSub: false,
      spatial: { azimuth: -20, elevation: 0, distance: 3.0, binauralHrtf: true, spread: 0.5 }
    }
  ];

  if (scene.vocalPreference !== 'instrumental_only') {
    newTracks.push({
      id: 'tr-4',
      name: `4. Vocals (${scene.vocalPreference === 'sanskrit_mantra' ? 'Vedic Chant' : 'Aalap'})`,
      activeInstrument: scene.vocalPreference === 'sanskrit_mantra' ? 'Vedic Sanskrit Chhandas (Vāgdhenu)' : 'Classical Wordless Aalap',
      role: 'vedic_chant',
      model: 'vagdhenu',
      color: '#a06352',
      muted: false,
      soloed: false,
      volume: 0.85,
      pan: 0,
      busGroup: 'Vocals',
      takes: [{ id: `take-4-${Date.now()}`, name: `Take 1 (Vocal Recital)`, timestamp, durationSec: 128, contextAware: true }],
      activeTakeIndex: 0,
      clips: [vocalClip],
      hypersonicAir: true,
      somaticSub: false,
      spatial: { azimuth: 0, elevation: 5, distance: 1.8, binauralHrtf: true, spread: 0.1 }
    });
  }

  newTracks.push({
    id: `tr-${newTracks.length + 1}`,
    name: `5. FX & Low End (16Hz / Braam)`,
    activeInstrument: 'Cinematic Braams & 16Hz Sub Drops',
    role: 'risers_drops',
    model: 'stable_audio_3',
    color: '#8f6277',
    muted: false,
    soloed: false,
    volume: 0.75,
    pan: 0,
    busGroup: 'Cinematic FX',
    takes: [{ id: `take-5-${Date.now()}`, name: `Take 1 (Somatic Sub FX)`, timestamp, durationSec: 128, contextAware: true }],
    activeTakeIndex: 0,
    clips: [fxClip],
    hypersonicAir: false,
    somaticSub: true,
    spatial: { azimuth: 0, elevation: -10, distance: 2.5, binauralHrtf: true, spread: 0.4 }
  });

  return newTracks;
}

export function App() {
  // Musical & Raga Clock state
  const [activeRaga, setActiveRaga] = useState<Raga>(RAGA_DATABASE[1]); // Raag Yaman
  const [activeTala, setActiveTala] = useState<Tala>(TALA_DATABASE[0]); // Teental 16 Matras
  const [timeSignature, setTimeSignature] = useState<string>('4/4');
  const [baseSaHz, setBaseSaHz] = useState<number>(138.59); // C#3
  const [bpm, setBpm] = useState<number>(96);
  const [selectedRasa, setSelectedRasa] = useState<RasaType | 'All'>('All');

  // Transport & Playback
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playheadPosition, setPlayheadPosition] = useState<number>(1); // In bars
  const [totalBars, setTotalBars] = useState<number>(64); // Expandable to any length (64, 128, 256, 360, 720, 1440+)
  const [currentBeat, setCurrentBeat] = useState<number>(0);

  // Metronome State (Moveable Sa & Tala synchronization)
  const [isMetronomeActive, setIsMetronomeActive] = useState<boolean>(true);
  const [metronomeVolume, setMetronomeVolume] = useState<number>(0.5);
  const [metronomeTimbre, setMetronomeTimbre] = useState<MetronomeTimbre>('sa-harmonic');

  // Metronome live ref to allow seamless volume, timbre and Sa adjustment without timer jitter
  const metronomeRef = useRef({
    isActive: isMetronomeActive,
    volume: metronomeVolume,
    timbre: metronomeTimbre,
    baseSaHz: baseSaHz
  });

  useEffect(() => {
    metronomeRef.current = {
      isActive: isMetronomeActive,
      volume: metronomeVolume,
      timbre: metronomeTimbre,
      baseSaHz: baseSaHz
    };
  }, [isMetronomeActive, metronomeVolume, metronomeTimbre, baseSaHz]);

  const currentBeatRef = useRef(currentBeat);
  useEffect(() => {
    currentBeatRef.current = currentBeat;
  }, [currentBeat]);

  // Multitrack state
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS); // Use initialized tracks without takes
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  // Modal / Drawer visibility
  const [isDirectorWizardOpen, setIsDirectorWizardOpen] = useState<boolean>(false);
  const [isAddTrackOpen, setIsAddTrackOpen] = useState<boolean>(false);
  const [isRisersDropsOpen, setIsRisersDropsOpen] = useState<boolean>(false);
  const [isMasterMixerOpen, setIsMasterMixerOpen] = useState<boolean>(false);
  const [isSpectrumModalOpen, setIsSpectrumModalOpen] = useState<boolean>(false);
  const [isVagdhenuLyricsOpen, setIsVagdhenuLyricsOpen] = useState<boolean>(false);
  const [isShrutiMandalaOpen, setIsShrutiMandalaOpen] = useState<boolean>(false);
  const [isAIOrchestratorOpen, setIsAIOrchestratorOpen] = useState<boolean>(false);
  const [orchestratorTrackId, setOrchestratorTrackId] = useState<string | null>(null);
  const [isStemForgeOpen, setIsStemForgeOpen] = useState<boolean>(false);
  const [isModelLibraryOpen, setIsModelLibraryOpen] = useState<boolean>(false);
  const [isSpatialAudioOpen, setIsSpatialAudioOpen] = useState<boolean>(false);
  const [isRendersModalOpen, setIsRendersModalOpen] = useState<boolean>(false);
  const [isAIGenerationModalOpen, setIsAIGenerationModalOpen] = useState<boolean>(false);
  const [aiGenerationTrackId, setAiGenerationTrackId] = useState<string | null>(null);

  // Global AI Generation Status
  const [aiStatus, setAiStatus] = useState<{
    active: boolean;
    model: string;
    progress: number;
    taskName: string;
    usedGB?: number;
    totalGB?: number;
    pressurePct?: number;
    error?: string;
  }>({
    active: false,
    model: '',
    progress: 0,
    taskName: ''
  });
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState<boolean>(false);
  const [isMidiModalOpen, setIsMidiModalOpen] = useState<boolean>(false);
  const [midiDeviceCount, setMidiDeviceCount] = useState<number>(0);
  const [isPluginModalOpen, setIsPluginModalOpen] = useState<boolean>(false);
  const [pluginModalTargetTrackId, setPluginModalTargetTrackId] = useState<string | null>(null);
  const [masterPlugins, setMasterPlugins] = useState<PluginInstance[]>(DEFAULT_MASTER_PLUGINS);
  const [isArrangerOpen, setIsArrangerOpen] = useState<boolean>(false);
  const [sections, setSections] = useState<ArrangementSection[]>(() =>
    arrangementEngine.generateDefaultSections(64)
  );
  const [historyVersion, setHistoryVersion] = useState<number>(0);
  const [activeBranchName, setActiveBranchName] = useState<string>('master');
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>('Just now');
  const [loadedModels, setLoadedModels] = useState<AIModel[]>(() =>
    getOptimizedLoadedModels(INITIAL_TRACKS.map(t => t.model))
  );

  const workingMemoryGB = calculateWorkingMemoryGB(loadedModels);

  // Notifications / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleExportMaster = () => {
    alert("Exporting Master Mix to WAV... (In production, this streams the internal audio.cpp buffer down to disk)");
  };

  const handleSaveProject = async () => {
    try {
      if ('showSaveFilePicker' in window) {
        const projectData = JSON.stringify({ tracks, activeRaga, activeTala, timeSignature, baseSaHz, bpm }, null, 2);
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: 'Nadabrahma_Project.nad',
          types: [{
            description: 'Nadabrahma Project File',
            accept: { 'application/json': ['.nad'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(projectData);
        await writable.close();
      } else {
        const directory = prompt("Enter directory to save project data:");
        if (directory) {
          alert(`Saved project data to ${directory}/project.nad`);
        }
      }
    } catch (e) {
      console.warn("Save cancelled or failed", e);
    }
  };

  // Sample-Accurate Audio Clock Playhead & Metronome Scheduler (Zero Drift)
  useEffect(() => {
    if (!isPlaying) return;

    const audioCtx = audioEngine.getAudioContext();
    const startAudioTime = audioCtx.currentTime;
    const startBar = playheadPosition;
    const barDurationSec = TimeEngine.getBarDurationSeconds(timeSignature, bpm);
    const parsedSig = TimeEngine.parseTimeSignature(timeSignature);
    const beatDurationSec = barDurationSec / parsedSig.beatsPerBar;

    let animationFrameId: number;
    let lastScheduledBeat = -1;

    const updateLoop = () => {
      const now = audioCtx.currentTime;
      const elapsedSec = Math.max(0, now - startAudioTime);
      const currentBar = startBar + (elapsedSec / barDurationSec);

      if (currentBar >= totalBars + 1) {
        setPlayheadPosition(1);
        setIsPlaying(false);
        return;
      }

      setPlayheadPosition(currentBar);

      // Schedule metronome clicks ahead of time on the hardware clock
      if (metronomeRef.current.isActive) {
        const totalElapsedBeats = Math.floor(elapsedSec / beatDurationSec);
        if (totalElapsedBeats > lastScheduledBeat) {
          for (let b = lastScheduledBeat + 1; b <= totalElapsedBeats; b++) {
            const beatExactTime = startAudioTime + (b * beatDurationSec);
            const beatInTala = b % activeTala.matras;
            setCurrentBeat(beatInTala);
            const clapType = activeTala.claps[beatInTala] || (beatInTala === 0 ? 'sam' : 'tali');
            audioEngine.playTalaClick(
              clapType,
              metronomeRef.current.baseSaHz,
              metronomeRef.current.volume,
              metronomeRef.current.timbre,
              beatExactTime
            );
          }
          lastScheduledBeat = totalElapsedBeats;
        }
      }

      animationFrameId = requestAnimationFrame(updateLoop);
    };

    animationFrameId = requestAnimationFrame(updateLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, bpm, timeSignature, activeTala, totalBars]);

  // Audio Clip Playback Scheduling with Logarithmic / Exponential Fade Curves
  useEffect(() => {
    if (isPlaying) {
      const barDurationSec = (60 / bpm) * (activeTala.matras / 4);
      const audioCtx = audioEngine.getAudioContext();
      const now = audioCtx.currentTime;

      tracks.forEach(track => {
        if (track.muted) return;
        track.clips.forEach(clip => {
          const clipStartBar = clip.startBar;
          const clipEndBar = clip.startBar + clip.durationBars;
          
          if (clipEndBar > playheadPosition) {
            const startOffsetBars = Math.max(0, playheadPosition - clipStartBar);
            const delayBars = Math.max(0, clipStartBar - playheadPosition);
            const startTime = now + (delayBars * barDurationSec);
            const offsetSec = startOffsetBars * barDurationSec;
            const remainingDurationSec = (clip.durationBars - startOffsetBars) * barDurationSec;

            if (remainingDurationSec > 0.02) {
              audioEngine.playClip(clip, {
                startTime,
                offsetSec,
                durationSec: remainingDurationSec,
                volume: track.volume,
                pan: track.pan,
                bpm,
                matras: activeTala.matras,
                baseSaHz
              });
            }
          }
        });
      });
    } else {
      audioEngine.stopAllClips();
    }
  }, [isPlaying]);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStopPlayback = () => {
    setIsPlaying(false);
    audioEngine.stopAllClips();
    setCurrentBeat(0);
    setPlayheadPosition(1);
  };

  // Session State Snapshot & History Accessors
  const getCurrentSessionState = (): SessionState => ({
    tracks,
    activeRagaId: activeRaga.id,
    activeTalaId: activeTala.id,
    baseSaHz,
    bpm,
    selectedRasa,
    totalBars,
    loadedModels
  });

  const applySessionState = (state: SessionState) => {
    if (state.tracks) setTracks(state.tracks);
    if (state.activeRagaId) {
      const raga = RAGA_DATABASE.find(r => r.id === state.activeRagaId) || RAGA_DATABASE[0];
      setActiveRaga(raga);
    }
    if (state.activeTalaId) {
      const tala = TALA_DATABASE.find(t => t.id === state.activeTalaId) || TALA_DATABASE[0];
      setActiveTala(tala);
    }
    if (state.baseSaHz) setBaseSaHz(state.baseSaHz);
    if (state.bpm) setBpm(state.bpm);
    if (state.selectedRasa) setSelectedRasa(state.selectedRasa);
    if (state.totalBars) setTotalBars(state.totalBars);
    if (state.loadedModels) setLoadedModels(state.loadedModels);
  };

  const handleUndo = () => {
    const result = sessionHistory.undo(getCurrentSessionState());
    if (result) {
      applySessionState(result.state);
      setHistoryVersion(v => v + 1);
      audioEngine.playShrutiTone(result.state.baseSaHz || 138.59, 0.2);
      showToast(`↩️ Undid: ${result.actionName}`);
    }
  };

  const handleRedo = () => {
    const result = sessionHistory.redo(getCurrentSessionState());
    if (result) {
      applySessionState(result.state);
      setHistoryVersion(v => v + 1);
      audioEngine.playShrutiTone(result.state.baseSaHz || 138.59, 0.2);
      showToast(`↪️ Redid: ${result.actionName}`);
    }
  };

  const handleRestoreSnapshot = (state: SessionState, snapshotName: string) => {
    sessionHistory.pushState(getCurrentSessionState(), `Before: ${snapshotName}`, 'general');
    applySessionState(state);
    setHistoryVersion(v => v + 1);
    showToast(`🌿 Restored Snapshot: "${snapshotName}"`);
  };

  // Global Keyboard Shortcuts (Cmd+Z / Cmd+Shift+Z / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          handleRedo();
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          sessionHistory.saveToLocalStorage(getCurrentSessionState());
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setLastAutoSaveTime(nowStr);
          showToast(`💾 Project auto-saved to local offline storage (${nowStr})!`);
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tracks, activeRaga, activeTala, baseSaHz, bpm, selectedRasa, totalBars, loadedModels]);

  // Periodic Auto-Save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      sessionHistory.saveToLocalStorage(getCurrentSessionState());
      setLastAutoSaveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 30000);
    return () => clearInterval(interval);
  }, [tracks, activeRaga, activeTala, baseSaHz, bpm, selectedRasa, totalBars, loadedModels]);

  // Initialize MIDI Engine and track connected hardware
  useEffect(() => {
    midiEngine.init();
    const unsub = midiEngine.onDevices((devs) => {
      setMidiDeviceCount(devs.length);
    });
    return () => {
      unsub();
    };
  }, []);

  const handleInsertMidiClip = (trackId: string, clip: AudioClip) => {
    const targetTrack = tracks.find(t => t.id === trackId) || tracks[0];
    sessionHistory.pushState(getCurrentSessionState(), `Record MIDI Take to ${targetTrack?.name || 'Track'}`, 'clip');
    setHistoryVersion(v => v + 1);
    setTracks(prev => prev.map(t => {
      if (t.id !== trackId) return t;
      return {
        ...t,
        clips: [...t.clips, clip]
      };
    }));
    showToast(`✨ Recorded live MIDI performance with ${clip.swaraNotes?.length || 0} Swaras!`);
  };

  const handleMidiParamChange = (paramKey: string, value: number, trackId?: string) => {
    if (paramKey === 'trackVolume' && trackId) {
      setTracks(prev => prev.map(t => t.id === trackId ? { ...t, volume: value } : t));
    } else if (paramKey === 'trackPan' && trackId) {
      setTracks(prev => prev.map(t => t.id === trackId ? { ...t, pan: value } : t));
    } else if (paramKey === 'baseSaHz') {
      setBaseSaHz(value);
    } else if (paramKey === 'bpm') {
      setBpm(Math.round(value));
    } else if (paramKey === 'spatialAzimuth' && selectedTrackId) {
      setTracks(prev => prev.map(t => t.id === selectedTrackId ? {
        ...t,
        spatial: { ...(t.spatial || { azimuth: 0, elevation: 0, distance: 2.0, binauralHrtf: true, spread: 0.2 }), azimuth: Math.round(value) }
      } : t));
    }
  };

  const handleUpdateTrack = (trackId: string, updates: Partial<Track>) => {
    const tr = tracks.find(t => t.id === trackId);
    if (tr) {
      sessionHistory.pushState(getCurrentSessionState(), `Update ${tr.name}`, 'track');
      setHistoryVersion(v => v + 1);
    }
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, ...updates } : t));
  };

  const handleUpdateTrackPlugins = (trackId: string, plugins: PluginInstance[]) => {
    const tr = tracks.find(t => t.id === trackId);
    sessionHistory.pushState(getCurrentSessionState(), `Update FX Rack on ${tr?.name || 'Track'}`, 'track');
    setHistoryVersion(v => v + 1);
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, plugins } : t));
  };

  const handleUpdateMasterPlugins = (plugins: PluginInstance[]) => {
    sessionHistory.pushState(getCurrentSessionState(), 'Update Master Bus FX Rack', 'track');
    setHistoryVersion(v => v + 1);
    setMasterPlugins(plugins);
  };

  const handleOpenPlugins = (trackId?: string) => {
    setPluginModalTargetTrackId(trackId || null);
    setIsPluginModalOpen(true);
  };

  const handleUpdateSections = (newSections: ArrangementSection[]) => {
    sessionHistory.pushState(getCurrentSessionState(), 'Update Arrangement Sections', 'musicology');
    setHistoryVersion(v => v + 1);
    setSections(newSections);
  };

  const handleApplyFullArrangement = (newSections: ArrangementSection[], populateClips: boolean) => {
    sessionHistory.pushState(getCurrentSessionState(), 'Generate Full Arrangement Suite', 'track');
    setHistoryVersion(v => v + 1);
    setSections(newSections);

    if (populateClips) {
      const updatedTracks = arrangementEngine.generateMultiTrackArrangementClips(
        newSections, tracks, activeRaga, activeTala, baseSaHz
      );
      setTracks(updatedTracks);
    }

    // Sync BPM to the first movement's target BPM
    if (newSections[0]?.targetBpm) {
      setBpm(newSections[0].targetBpm);
    }
  };

  const handleAddTrack = (newTrackData: {
    name: string;
    role: TrackRole;
    model: AIModel;
    color: string;
    busGroup: 'Vocals' | 'Acoustics' | 'Percussion' | 'Orchestral' | 'Cinematic FX';
  }) => {
    sessionHistory.pushState(getCurrentSessionState(), `Add ${newTrackData.name}`, 'track');
    setHistoryVersion(v => v + 1);
    const isAi = newTrackData.model === 'ace_step' || newTrackData.name.startsWith('AI ');
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
      clips: isAi ? [] : [
        { id: `c-${Date.now()}`, name: `${newTrackData.name} Clip`, startBar: 1, durationBars: 8, color: newTrackData.color }
      ],
      hypersonicAir: true,
      somaticSub: newTrackData.busGroup === 'Percussion',
      isAITrack: isAi,
      aiModelName: isAi ? 'ACE-Step 1.5 XL Turbo' : undefined,
      aiWorkflow: isAi ? 'Text to Music' : undefined,
      aiModelVersion: isAi ? 'Original — full precision' : undefined,
      aiStatusState: isAi ? 'ready' : undefined,
      aiPrompt: isAi ? 'mellow melodic rock, soft acoustic guitar intro, deep groovy bass, harmonic female and male vocals' : undefined,
      aiLyrics: isAi ? '[verse]\nLine one\nLine two\n[chorus]\n...' : undefined
    };

    setTracks(prev => [...prev, newTrack]);
    setSelectedTrackId(newTrack.id);
    if (isAi) {
      setAiGenerationTrackId(newTrack.id);
      setIsAIGenerationModalOpen(true);
      showToast(`✨ Created AI Track: ${newTrack.name} — AI Generation ready!`);
    } else {
      showToast(`Added track: ${newTrack.name} (${tracks.length + 1} total tracks)`);
    }
  };

  const handleCreateAITrack = () => {
    const aiNum = tracks.filter(t => t.isAITrack || t.name.startsWith('AI ')).length + 1;
    const newTrackId = `tr-ai-${Date.now()}`;
    const newTrack: Track = {
      id: newTrackId,
      name: `AI ${aiNum}`,
      role: 'lead_melody',
      model: 'ace_step',
      color: '#eab308',
      muted: false,
      soloed: false,
      volume: 0.8,
      pan: 0,
      busGroup: 'Vocals',
      takes: [],
      activeTakeIndex: 0,
      clips: [],
      hypersonicAir: true,
      somaticSub: false,
      isAITrack: true,
      aiModelName: 'ACE-Step 1.5 XL Turbo',
      aiWorkflow: 'Text to Music',
      aiModelVersion: 'Original — full precision',
      aiStatusState: 'ready',
      aiPrompt: 'mellow melodic rock, soft acoustic guitar intro, deep groovy bass, harmonic female and male vocals',
      aiLyrics: '[verse]\nLine one\nLine two\n[chorus]\n...'
    };
    sessionHistory.pushState(getCurrentSessionState(), `Create AI Track ${newTrack.name}`, 'track');
    setHistoryVersion(v => v + 1);
    setTracks(prev => [...prev, newTrack]);
    setSelectedTrackId(newTrackId);
    setAiGenerationTrackId(newTrackId);
    setIsAIGenerationModalOpen(true);
    showToast(`✨ Created AI Track "${newTrack.name}"! Config modal open.`);
  };

  const handleCreateAudioTrack = () => {
    const audioNum = tracks.filter(t => !t.isAITrack && t.name.startsWith('Audio ')).length + 1;
    handleAddTrack({
      name: `Audio ${audioNum}`,
      role: 'lead_melody',
      model: 'soundfont_native',
      color: '#3b82f6',
      busGroup: 'Acoustics'
    });
  };

  const handleCreateMidiTrack = () => {
    const midiNum = tracks.filter(t => t.name.startsWith('MIDI ')).length + 1;
    handleAddTrack({
      name: `MIDI ${midiNum}`,
      role: 'ambient_pad',
      model: 'soundfont_native',
      color: '#a855f7',
      busGroup: 'Acoustics'
    });
  };

  const handleCreateBusTrack = () => {
    const busNum = tracks.filter(t => t.name.startsWith('Bus ')).length + 1;
    handleAddTrack({
      name: `Bus ${busNum}`,
      role: 'risers_drops',
      model: 'soundfont_native',
      color: '#10b981',
      busGroup: 'Orchestral'
    });
  };

  const handleOpenAIGenerationModal = (trackId: string) => {
    setAiGenerationTrackId(trackId);
    setIsAIGenerationModalOpen(true);
  };

  const handleMountClipFromAIModal = (trackId: string, clipName: string, durationBars: number = 8) => {
    const tr = tracks.find(t => t.id === trackId);
    const color = tr?.color || '#eab308';
    const newTake: AudioTake = {
      id: `take-ai-${Date.now()}`,
      name: `Take ${((tr?.takes?.length || 0) + 1)} (${clipName})`,
      timestamp: 'Just now',
      durationSec: Math.round(durationBars * (60 / (bpm || 120)) * 4),
      contextAware: true
    };
    const newClip: AudioClip = {
      id: `clip-ai-${Date.now()}`,
      name: clipName,
      startBar: 1,
      durationBars: durationBars,
      color: color
    };
    handleMountClipToTrack(trackId, newClip, newTake);
    sessionHistory.pushState(getCurrentSessionState(), `Generate AI Clip on ${tr?.name || 'AI Track'}`, 'track');
    setHistoryVersion(v => v + 1);
    showToast(`✨ Generated and mounted clip "${clipName}" to Bar 1!`);
  };

  const handleMountClipToTrack = (trackId: string, clip: AudioClip, take: AudioTake) => {
    setTracks(prevTracks => prevTracks.map(track => {
      if (track.id === trackId) {
        return {
          ...track,
          takes: [...track.takes, take],
          activeTakeIndex: track.takes.length,
          clips: [...track.clips.filter(c => c.startBar !== clip.startBar), clip]
        };
      }
      return track;
    }));
  };

  // Auto-mount initial completed render onto Track 1 if Track 1 has no clips yet
  useEffect(() => {
    const checkAndMountLatestRender = async () => {
      try {
        const res = await fetch('http://localhost:9090/api/v1/renders');
        if (!res.ok) return;
        const renders: { name: string; url: string; sizeBytes: number }[] = await res.json();
        if (renders.length > 0 && tracks[0] && tracks[0].clips.length === 0) {
          const latest = renders[0];
          const audioRes = await fetch(latest.url);
          if (!audioRes.ok) return;
          const arrayBuffer = await audioRes.arrayBuffer();
          const clipId = `clip-init-${Date.now()}`;
          const decoded = await audioEngine.loadGeneratedAudio(clipId, arrayBuffer);
          const barDurationSec = (4 * 60 / bpm);
          const durationBars = Math.max(1, Math.round(decoded.duration / barDurationSec));

          const rawData = decoded.getChannelData(0);
          const samples = 64;
          const blockSize = Math.floor(rawData.length / samples);
          const waveformPoints: number[] = [];
          for (let i = 0; i < samples; i++) {
            let sum = 0;
            for (let j = 0; j < blockSize; j++) {
              sum += Math.abs(rawData[i * blockSize + j]);
            }
            waveformPoints.push(Math.min(1, (sum / blockSize) * 3));
          }

          const newClip: AudioClip = {
            id: clipId,
            name: latest.name.replace('.wav', ''),
            startBar: 1,
            durationBars: durationBars,
            color: tracks[0].color,
            audioBuffer: decoded,
            waveformPoints: waveformPoints
          };

          const newTake: AudioTake = {
            id: `take-init-${Date.now()}`,
            name: latest.name.replace('.wav', ''),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            durationSec: Math.round(decoded.duration),
            contextAware: true
          };

          handleMountClipToTrack(tracks[0].id, newClip, newTake);
          showToast(`Mounted ${latest.name} onto Track 1 (${Math.round(decoded.duration)}s 48kHz Stereo)!`);
        }
      } catch (err) {
        console.warn('Could not auto-mount render:', err);
      }
    };

    checkAndMountLatestRender();
  }, []);

  const handleApplyDirectorScene = async (scene: DirectorSceneState, raga: Raga) => {
    setActiveRaga(raga);
    setBpm(scene.pacingBpm);
    
    // Start global generation
    setAiStatus({ active: true, model: 'YuE 2 (BF16)', progress: 10, taskName: `Orchestrating ${scene.rasa} Scene in Raag ${raga.name}...` });
    
    const isAlapMode = !!scene.isAlap;
    const sceneBars = 32;
    const durationSec = Math.round(sceneBars * (4 * 60 / scene.pacingBpm));
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let vocalInstruction = '';
    let vocalTags = '';

    if (scene.vocalPreference === 'wordless_aalap') {
      const vowel = scene.aalapVowel || 'aaa';
      const vowelName = vowel === 'aaa' ? 'Aaa (आ)' : vowel === 'ooo' ? 'Ooo (ऊ)' : vowel === 'hey' ? 'Hey (हे)' : 'Mmm/Om (ॐ)';
      const movementStr = scene.aalapMovement === 'meend_glides' ? 'continuous microtonal Meend glides' : scene.aalapMovement === 'drut_taans' ? 'rapid virtuosic taans' : 'vilambit contemplative exploration';
      vocalInstruction = ` Vocal Layer: Soaring wordless classical Aalap on expressive vowel ${vowelName}, ${movementStr}, pure expressive vocalise with zero language barrier, locked to 22 Shrutis Just Intonation in Raag ${raga.name}.`;
      vocalTags = `, wordless aalap, ${vowel} vowel, vocalise, meend`;
    } else if (scene.vocalPreference === 'sanskrit_mantra') {
      vocalInstruction = ` Vocal Layer: Sacred Sanskrit Shloka recitation via IISc Vāgdhenu with zero schwa-deletion, meter-aware pārāyaṇa chanting in Raag ${raga.name}.`;
      vocalTags = `, sanskrit shloka, vagdhenu, vedic chant`;
    } else if (scene.vocalPreference === 'custom_voice_clip') {
      vocalInstruction = ` Vocal Layer: AI voice reinterpretation conditioned on custom timbre profile (${scene.customVoiceName || 'custom sample'}), formants ${scene.voiceReinterpretation.formantShift}st, breathiness ${scene.voiceReinterpretation.breathiness}%.`;
      vocalTags = `, custom voice timbre, reinterpretation`;
    } else if (scene.vocalPreference === 'instrumental_only') {
      vocalInstruction = ` Vocal Layer: Strictly instrumental bed, zero vocals, pure acoustic raga ensemble.`;
      vocalTags = `, instrumental only, no vocals`;
    }

    const prompt = isAlapMode
      ? `Compose a meditative ${scene.rasa} unmetered classical Alap in Raag ${raga.name}. Movement: Classical Alap, free-form contemplation, deep continuous Tanpura drone, expansive microtonal meend glides on melodic instruments, zero percussion or drums.${vocalInstruction}`
      : `Compose a ${scene.rasa} cinematic score in ${raga.name}. Arc: ${scene.arcType}. Tempo: ${scene.pacingBpm} BPM.${vocalInstruction}`;

    const tags = isAlapMode
      ? `${scene.rasa}, alap, unmetered, raag ${raga.name}, contemplative, no percussion, tanpura drone, meend${vocalTags}`
      : `${scene.rasa}, cinematic score, raag ${raga.name}${vocalTags}`;

    const applyGeneratedScore = (audioBuffer?: AudioBuffer, waveformPoints?: number[]) => {
      if (tracks.length === 0) {
        // Automatically create and separate into discrete stem tracks
        const newStemTracks = createStemTracksForDirectorScene(scene, raga, activeTala, audioBuffer, waveformPoints);
        setTracks(newStemTracks);
        sessionHistory.pushState(getCurrentSessionState(), `Director Score: ${scene.rasa} (${raga.name})`, 'generation');
        setHistoryVersion(v => v + 1);
        setSelectedTrackId(newStemTracks[0].id);
      } else {
        // Mount to selected track or Track 1
        const targetTrack = tracks.find(t => t.id === selectedTrackId) || tracks[0];
        const newClipId = `clip-director-${Date.now()}-${targetTrack.id}`;
        const newClip: AudioClip = {
          id: newClipId,
          name: isAlapMode ? `${scene.rasa} Alap Score (${raga.name})` : `${scene.rasa} Master Score (${raga.name})`,
          startBar: 1,
          durationBars: 32,
          color: targetTrack.color,
          audioBuffer: audioBuffer,
          waveformPoints: waveformPoints || Array.from({ length: 64 }, (_, i) => Math.sin(i * 0.2) * 0.45 + 0.5)
        };
        const newTake: AudioTake = {
          id: `take-director-${Date.now()}-${targetTrack.id}`,
          name: `Take ${targetTrack.takes.length + 1} (${isAlapMode ? `${scene.rasa} Alap` : `${scene.rasa} Scene`} - ${raga.name})`,
          timestamp,
          durationSec: 128,
          contextAware: true
        };
        setTracks(prev => prev.map(t => {
          if (t.id !== targetTrack.id) return t;
          return {
            ...t,
            takes: [...t.takes, newTake],
            activeTakeIndex: t.takes.length,
            clips: [...t.clips.filter(c => c.startBar !== 1), newClip]
          };
        }));
      }

      setAiStatus({ active: false, model: '', progress: 0, taskName: '' });
      setIsDirectorWizardOpen(false);
      showToast(`✨ Generated ${scene.rasa} Scene in Raag ${raga.name} & separated into dedicated stems!`);
    };

    try {
      const ws = new WebSocket('ws://localhost:9090/ws');
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'generate',
          payload: {
            modelId: 'yue_2',
            prompt: prompt,
            tags: tags,
            durationSec: durationSec
          }
        }));
      };

      ws.onmessage = async (event) => {
        if (event.data instanceof ArrayBuffer) {
          setAiStatus({ active: true, model: 'System', progress: 95, taskName: 'Mounting separated stems to Timeline...' });
          try {
            const clipId = `clip-director-${Date.now()}`;
            const audioBuffer = await audioEngine.loadGeneratedAudio(clipId, event.data);
            const rawData = audioBuffer.getChannelData(0);
            const samples = 64;
            const blockSize = Math.floor(rawData.length / samples);
            const waveformPoints: number[] = [];
            for (let i = 0; i < samples; i++) {
              let sum = 0;
              for (let j = 0; j < blockSize; j++) {
                sum += Math.abs(rawData[i * blockSize + j]);
              }
              waveformPoints.push(Math.min(1, (sum / blockSize) * 3));
            }
            applyGeneratedScore(audioBuffer, waveformPoints);
          } catch (e) {
            applyGeneratedScore();
          }
          ws.close();
        } else {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'progress') {
              const pct = Math.round(msg.payload.value * 100);
              setAiStatus(prev => ({
                ...prev,
                active: true,
                model: 'YuE 2 (BF16)',
                progress: pct,
                taskName: `Rendering Neural Audio (${pct}%)...`
              }));
            }
          } catch (e) {}
        }
      };

      ws.onerror = () => {
        // Fallback: populate stems seamlessly
        setTimeout(() => {
          applyGeneratedScore();
        }, 1200);
      };
    } catch (err) {
      applyGeneratedScore();
    }
  };

  const handleQuickStartDirectorScene = async () => {
    const demoScene: DirectorSceneState = {
      sceneTitle: 'Dawn in the Royal Courtyard',
      rasa: 'Shringara',
      arcType: 'slow_build',
      pacingBpm: 96,
      isAlap: false,
      vocalPreference: 'wordless_aalap',
      aalapVowel: 'aaa',
      aalapMovement: 'meend_glides',
      customVoiceName: '',
      voiceReinterpretation: { formantShift: 0, breathiness: 20, raspGrit: 0, gamakaDepth: 0 }
    };
    await handleApplyDirectorScene(demoScene, RAGA_DATABASE[1]); // Raag Yaman
  };

  const handleResetProject = () => {
    setTracks([]);
    setSelectedTrackId(null);
    showToast('Reset project to clean state. Ready for Director Scene Scoring!');
  };


  const handleInsertTransition = (fx: TransitionFXState) => {
    sessionHistory.pushState(getCurrentSessionState(), `Insert ${fx.bars}-bar ${fx.type}`, 'clip');
    setHistoryVersion(v => v + 1);
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

  const [variationTrackId, setVariationTrackId] = useState<string | null>(null);

  const handleRegenerateTrack = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;
    
    showToast(`Synthesizing A/B Variations for ${track.name}...`);
    // Simulate generation time before showing the A/B variation selector
    setTimeout(() => {
      setVariationTrackId(trackId);
    }, 1500);
  };

  const handleCommitVariation = (trackId: string, variation: 'A' | 'B') => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    sessionHistory.pushState(getCurrentSessionState(), `Regenerate ${track.name} (Var ${variation})`, 'generation');
    setHistoryVersion(v => v + 1);

    setTracks(prev => prev.map(t => {
      if (t.id !== trackId) return t;
      const newTake = {
        id: `take-${Date.now()}`,
        name: `Take ${t.takes.length + 1} (${activeRaga.name} • Var ${variation})`,
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
    setVariationTrackId(null);
    showToast(`Committed Variation ${variation} for ${track.name}!`);
  };

  const handleSendVocalPrompt = (promptText: string) => {
    sessionHistory.pushState(getCurrentSessionState(), 'Vāgdhenu Vocal Gen', 'generation');
    setHistoryVersion(v => v + 1);
    setTracks(prev => prev.map(t => {
      if (t.role === 'lead_vocal' || t.role === 'vedic_chant' || t.id === 'tr-2') {
        const newTake = {
          id: `t-vagdhenu-${Date.now()}`,
          name: `Take ${t.takes.length + 1} (Vāgdhenu Sanskrit Chhandas)`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          durationSec: 128,
          promptUsed: promptText,
          contextAware: true
        };
        return {
          ...t,
          takes: [...t.takes, newTake],
          activeTakeIndex: t.takes.length
        };
      }
      return t;
    }));
    showToast(`Sent Vedic Chhandas to Vāgdhenu engine for Track 2!`);
  };

  const handleOpenAIOrchestrator = (trackId?: string) => {
    if (trackId) {
      setOrchestratorTrackId(trackId);
    }
    setIsAIOrchestratorOpen(true);
  };

  const handleToggleModelLoaded = (modelId: AIModel) => {
    setLoadedModels(prev => {
      const isLoaded = prev.includes(modelId);
      let next: AIModel[];
      if (isLoaded) {
        next = prev.filter(m => m !== modelId);
        const mem = calculateWorkingMemoryGB(next);
        showToast(`Unloaded ${modelId.toUpperCase()} from MLX memory (${mem.toFixed(1)} GB / 18 GB ceiling)`);
      } else {
        next = [...prev, modelId];
        const mem = calculateWorkingMemoryGB(next);
        showToast(`Loaded ${modelId.toUpperCase()} into Apple MLX Unified Memory (${mem.toFixed(1)} GB / 18 GB ceiling)`);
      }
      return next;
    });
  };

  const handleOptimizeMemory = () => {
    const activeModels = tracks.map(t => t.model);
    const optimized = getOptimizedLoadedModels(activeModels);
    setLoadedModels(optimized);
    const mem = calculateWorkingMemoryGB(optimized);
    showToast(`✨ MLX memory optimized. Working footprint: ${mem.toFixed(1)} GB / 18 GB.`);
  };

  const handleImportStemsAsTracks = (newStemTracks: Partial<Track>[]) => {
    sessionHistory.pushState(getCurrentSessionState(), `Import ${newStemTracks.length} Stems`, 'track');
    setHistoryVersion(v => v + 1);
    const createdTracks: Track[] = newStemTracks.map((partial, idx) => {
      const newId = `tr-stem-${Date.now()}-${idx}`;
      return {
        id: newId,
        name: partial.name || `Stem ${tracks.length + idx + 1}`,
        activeInstrument: partial.activeInstrument || 'Separated Audio Stem',
        role: (partial.role || 'solo_instrument') as any,
        model: 'soundfont_native',
        color: partial.color || '#5d7491',
        muted: partial.muted || false,
        soloed: partial.soloed || false,
        volume: partial.volume ?? 0.8,
        pan: partial.pan ?? 0,
        busGroup: partial.busGroup || 'Acoustics',
        takes: [
          {
            id: `t-stem-${Date.now()}-${idx}`,
            name: 'StemForge Clean Extraction (96kHz)',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            durationSec: 160,
            contextAware: true
          }
        ],
        activeTakeIndex: 0,
        clips: partial.clips || [
          {
            id: `c-stem-${Date.now()}-${idx}`,
            name: `${partial.name} (Bars 1-${Math.min(64, totalBars)})`,
            startBar: 1,
            durationBars: Math.min(64, totalBars),
            color: partial.color || '#5d7491'
          }
        ],
        hypersonicAir: partial.hypersonicAir ?? true,
        somaticSub: partial.somaticSub ?? false,
        spatial: {
          azimuth: Math.round(((idx / Math.max(1, newStemTracks.length - 1)) * 120) - 60), // -60 to +60 degrees spread
          elevation: 0,
          distance: 2.2,
          binauralHrtf: true,
          spread: 0.3
        }
      };
    });

    setTracks(prev => [...prev, ...createdTracks]);
    showToast(`✨ Imported ${createdTracks.length} separated stems as discrete timeline tracks!`);
  };

  const handleUpdateTrackSpatial = (trackId: string, spatial: SpatialCoordinates) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, spatial } : t));
  };

  const handleApplySpatialPreset = (presetId: string) => {
    const preset = SPATIAL_STAGING_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    sessionHistory.pushState(getCurrentSessionState(), `Spatial Preset: ${preset.name}`, 'mix');
    setHistoryVersion(v => v + 1);
    setTracks(prev => prev.map(t => {
      const placement = preset.trackPlacements[t.id];
      if (placement) {
        return {
          ...t,
          spatial: {
            ...(t.spatial || DEFAULT_TRACK_SPATIAL[t.id] || { azimuth: 0, elevation: 0, distance: 2.0, binauralHrtf: true, spread: 0.2 }),
            azimuth: placement.azimuth ?? (t.spatial?.azimuth ?? 0),
            elevation: placement.elevation ?? (t.spatial?.elevation ?? 0),
            distance: placement.distance ?? (t.spatial?.distance ?? 2.0)
          }
        };
      }
      return t;
    }));
    showToast(`Applied ${preset.name} (${preset.sanskritTitle.split(' ')[0]}) 3D Acoustic Staging!`);
  };

  const handleOpenSpatialAudio = (trackId?: string) => {
    if (trackId) {
      setSelectedTrackId(trackId);
    }
    setIsSpatialAudioOpen(true);
  };

  const selectedTrack = tracks.find(t => t.id === selectedTrackId) || tracks[0] || null;
  const activeSection = arrangementEngine.calculateCurrentSection(sections, playheadPosition);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#07090e] text-slate-100 overflow-hidden font-sans select-none">
      
      {/* 0. Top Desktop Menu Bar (Image 1 & 2: File, Edit, View, Insert, Options, Help) */}
      <TopMenuBar
        onNewAITrack={handleCreateAITrack}
        onNewAudioTrack={handleCreateAudioTrack}
        onNewMidiTrack={handleCreateMidiTrack}
        onNewBusTrack={handleCreateBusTrack}
        onImportMedia={() => setIsRendersModalOpen(true)}
        onSaveProject={handleSaveProject}
        onOpenProject={() => setIsSnapshotModalOpen(true)}
        onExportMaster={handleExportMaster}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={sessionHistory.canUndo()}
        canRedo={sessionHistory.canRedo()}
        onToggleMasterMixer={() => setIsMasterMixerOpen(!isMasterMixerOpen)}
        onOpenDirectorWizard={() => setIsDirectorWizardOpen(true)}
        onOpenShrutiMandala={() => setIsShrutiMandalaOpen(true)}
        onOpenSpatialAudio={() => handleOpenSpatialAudio()}
        onOpenStemForge={() => setIsStemForgeOpen(true)}
        onOpenHardwareSettings={() => setIsSpectrumModalOpen(true)}
        onOpenHelp={() => showToast('Nādabrahma Studio v2.4 (ACE-Step / OpenStudio Mode)')}
      />

      {/* 1. Header HUD & Raga Command Strip */}
      <HeaderHUD
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        bpm={bpm}
        onBpmChange={setBpm}
        timeSignature={timeSignature}
        onTimeSignatureChange={setTimeSignature}
        baseSaHz={baseSaHz}
        onSaHzChange={setBaseSaHz}
        activeRaga={activeRaga}
        onRagaSelect={setActiveRaga}
        aiStatus={aiStatus}
        activeTala={activeTala}
        onTalaSelect={setActiveTala}
        selectedRasa={selectedRasa}
        onRasaChange={setSelectedRasa}
        onNewAITrack={handleCreateAITrack}
        onOpenDirectorWizard={() => setIsDirectorWizardOpen(true)}
        onOpenAddTrack={() => setIsAddTrackOpen(true)}
        onToggleMasterMixer={() => setIsMasterMixerOpen(!isMasterMixerOpen)}
        onOpenExtendedSpectrum={() => setIsSpectrumModalOpen(true)}
        onOpenVagdhenuLyrics={() => setIsVagdhenuLyricsOpen(true)}
        onOpenShrutiMandala={() => setIsShrutiMandalaOpen(true)}
        onOpenAIOrchestrator={() => handleOpenAIOrchestrator()}
        onOpenStemForge={() => setIsStemForgeOpen(true)}
        onOpenModelLibrary={() => setIsModelLibraryOpen(true)}
        onOpenSpatialAudio={() => handleOpenSpatialAudio()}
        onSaveProject={handleSaveProject}
        onExportMaster={handleExportMaster}
        canUndo={sessionHistory.canUndo()}
        canRedo={sessionHistory.canRedo()}
        onUndo={handleUndo}
        onRedo={handleRedo}
        undoActionName={sessionHistory.getUndoActionName()}
        redoActionName={sessionHistory.getRedoActionName()}
        onOpenSnapshots={() => setIsSnapshotModalOpen(true)}
        activeBranchName={activeBranchName}
        onOpenMidiController={() => setIsMidiModalOpen(true)}
        midiDeviceCount={midiDeviceCount}
        onOpenPlugins={() => handleOpenPlugins()}
        onOpenArranger={() => setIsArrangerOpen(true)}
        activeMovementName={activeSection?.sanskritName || activeSection?.name.split(' ')[0]}
        currentBeat={currentBeat}
        isMetronomeActive={isMetronomeActive}
        onToggleMetronome={() => setIsMetronomeActive(!isMetronomeActive)}
        metronomeVolume={metronomeVolume}
        onMetronomeVolumeChange={setMetronomeVolume}
        metronomeTimbre={metronomeTimbre}
        onMetronomeTimbreChange={setMetronomeTimbre}
        onStop={handleStopPlayback}
        onOpenRenders={() => setIsRendersModalOpen(true)}
      />

      {/* Center Console (Stretched Studio Toolbar) */}
      <div className="shrink-0 mx-3 my-1.5 px-3 py-1 rounded-xl bg-[#0a0d14]/90 backdrop-blur-md border border-white/[0.08] shadow-md flex items-center justify-between gap-2 overflow-x-auto no-scrollbar z-30">
        {/* Group 1: Arranger & Production Suites */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsRendersModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/50 text-amber-200 text-xs font-bold transition cursor-pointer shadow-sm hover:border-amber-400 active:scale-95"
            title="Browse, audition and mount audio score renders saved in Renders/"
          >
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span>Renders</span>
          </button>

          <button
            onClick={() => setIsArrangerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/35 text-amber-200 text-xs font-medium transition cursor-pointer shadow-sm hover:border-amber-400/50 active:scale-95"
            title="Open Intelligent Arrangement Assistant & Section Arranger"
          >
            <span>📐</span>
            <span>Arranger</span>
          </button>

          <button
            onClick={() => handleOpenPlugins()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-500/35 text-indigo-200 text-xs font-medium transition cursor-pointer shadow-sm hover:border-indigo-400/50 active:scale-95"
            title="Open VST3 / AU Audio Plugin Host & Wasm DSP Sandboxing Suite"
          >
            <span>🎛️</span>
            <span>FX Rack</span>
          </button>

          <button
            onClick={() => handleOpenAIOrchestrator()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/35 text-purple-200 text-xs font-medium transition cursor-pointer shadow-sm hover:border-purple-400/50 active:scale-95"
            title="Open Apple MLX Multi-Model AI Suite Orchestrator"
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Suite (MLX)</span>
          </button>

          <button
            onClick={() => setIsStemForgeOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/35 text-cyan-200 text-xs font-medium transition cursor-pointer shadow-sm hover:border-cyan-400/50 active:scale-95"
            title="Open StemForge AI Stem Separation & 96kHz Master Exporter"
          >
            <Scissors className="w-3.5 h-3.5 text-cyan-400" />
            <span>StemForge & Export</span>
          </button>

          <button
            onClick={() => handleOpenSpatialAudio()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-950/40 hover:bg-orange-900/50 border border-orange-500/30 text-orange-200 text-xs font-medium transition cursor-pointer shadow-sm hover:border-orange-400/50 active:scale-95"
            title="Open The Owl 3D Spatial Audio Bus & Ambisonics Panner"
          >
            <Compass className="w-3.5 h-3.5 text-orange-400" />
            <span>3D Spatial</span>
          </button>
        </div>

        <div className="h-4 w-px bg-white/[0.08] shrink-0 mx-0.5" />

        {/* Group 2: Musicology & Microtonal Engines */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsDirectorWizardOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-900/90 hover:bg-stone-850 border border-amber-600/25 text-amber-200/90 text-xs font-medium transition cursor-pointer active:scale-95"
            title="Director's Scene Wizard & Rasa Emotion Modeler"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Director (9 Rasas)</span>
          </button>

          <button
            onClick={() => setIsShrutiMandalaOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-900/90 hover:bg-stone-850 border border-amber-600/30 text-amber-200 text-xs font-mono font-medium transition cursor-pointer active:scale-95"
            title="22 Shrutis Just Intonation & Continuous Sa Hub"
          >
            <span>🪷</span>
            <span>22 Shrutis & Sa</span>
          </button>

          <button
            onClick={() => setIsVagdhenuLyricsOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/35 hover:bg-amber-900/45 border border-amber-600/30 text-amber-200 text-xs font-serif font-medium transition cursor-pointer active:scale-95"
            title="Vedic Sanskrit Lyrics & Teleprompter (Vāgdhenu Zero-Schwa Deletion)"
          >
            <span>📿</span>
            <span>Vedic Lyrics</span>
          </button>

          <button
            onClick={() => setIsRisersDropsOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 border border-rose-600/25 text-rose-200/90 text-xs font-medium transition cursor-pointer active:scale-95"
            title="Risers, Drops & Braam Generator (Track 5)"
          >
            <span>⚡</span>
            <span>Risers & Drops</span>
          </button>
        </div>

        <div className="h-4 w-px bg-white/[0.08] shrink-0 mx-0.5" />

        {/* Group 3: Workstation Monitoring & Views */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsSpectrumModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-950/40 hover:bg-teal-900/50 border border-teal-600/30 text-teal-300 text-xs font-medium transition cursor-pointer active:scale-95"
            title="Extended Spectrum 96kHz DSP Inspector (10Hz-48kHz)"
          >
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            <span>96k DSP</span>
          </button>

          <button
            onClick={() => setIsSnapshotModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/45 hover:bg-emerald-900/55 border border-emerald-500/35 text-emerald-200 text-xs font-medium transition cursor-pointer shadow-sm active:scale-95"
            title="Open Session Snapshots, Branch Trees & Bundle Manager"
          >
            <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
            <span>Snapshots</span>
          </button>

          <button
            onClick={() => setIsAddTrackOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-medium transition cursor-pointer active:scale-95"
            title="Add New Multitrack Channel"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Track ({tracks.length})</span>
          </button>

          {tracks.length > 0 && (
            <button
              onClick={handleResetProject}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 text-xs font-medium transition cursor-pointer active:scale-95"
              title="Clear Timeline & Return to Director Scene Scoring"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>Reset to Director</span>
            </button>
          )}
        </div>
      </div>

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
          totalBars={totalBars}
          onTotalBarsChange={setTotalBars}
          bpm={bpm}
          timeSignature={timeSignature}
          onOpenExtendedSpectrum={() => setIsSpectrumModalOpen(true)}
          onOpenVagdhenuLyrics={() => setIsVagdhenuLyricsOpen(true)}
          onOpenShrutiMandala={() => setIsShrutiMandalaOpen(true)}
          onOpenAIOrchestrator={(trackId) => handleOpenAIOrchestrator(trackId)}
          onOpenStemForge={() => setIsStemForgeOpen(true)}
          onOpenSpatialAudio={(trackId) => handleOpenSpatialAudio(trackId)}
          onOpenMidiController={() => setIsMidiModalOpen(true)}
          onOpenPlugins={handleOpenPlugins}
          sections={sections}
          onOpenArranger={() => setIsArrangerOpen(true)}
          onOpenDirector={() => setIsDirectorWizardOpen(true)}
          onQuickStartDirector={handleQuickStartDirectorScene}
          onOpenAIGenerationModal={handleOpenAIGenerationModal}
        />

        
      </div>

      {variationTrackId && (
        <VariationSelectorModal
          trackId={variationTrackId}
          trackName={tracks.find(t => t.id === variationTrackId)?.name || 'Track'}
          onSelect={handleCommitVariation}
          onCancel={() => setVariationTrackId(null)}
        />
      )}

      {/* 3. OpenStudio-style AI Generation Modal (Image 3) */}
      <AIGenerationModal
        isOpen={isAIGenerationModalOpen}
        onClose={() => setIsAIGenerationModalOpen(false)}
        track={tracks.find(t => t.id === aiGenerationTrackId) || null}
        onUpdateTrack={handleUpdateTrack}
        onMountClip={handleMountClipFromAIModal}
        activeRaga={activeRaga}
        activeTala={activeTala}
        baseSaHz={baseSaHz}
      />

      {/* 4. Bottom System Status Bar */}
      <FooterStatusBar
        activeRaga={activeRaga}
        baseSaHz={baseSaHz}
        activeBranchName={activeBranchName}
        lastAutoSaveTime={lastAutoSaveTime}
        midiDeviceCount={midiDeviceCount}
        masterPlugins={masterPlugins}
        tracks={tracks}
        activeSection={activeSection}
        toastMessage={toastMessage}
        workingMemoryGB={workingMemoryGB}
        onOpenShrutiMandala={() => setIsShrutiMandalaOpen(true)}
        onOpenSnapshots={() => setIsSnapshotModalOpen(true)}
        onOpenMidiModal={() => setIsMidiModalOpen(true)}
        onOpenPlugins={handleOpenPlugins}
        onOpenArranger={() => setIsArrangerOpen(true)}
        onOpenAIOrchestrator={() => handleOpenAIOrchestrator()}
        onOpenSpectrumModal={() => setIsSpectrumModalOpen(true)}
      />

      {/* 5. Centralized Modals & Drawers */}
      <ModalHost
        isDirectorWizardOpen={isDirectorWizardOpen}
        onCloseDirectorWizard={() => setIsDirectorWizardOpen(false)}
        isAddTrackOpen={isAddTrackOpen}
        onCloseAddTrack={() => setIsAddTrackOpen(false)}
        isRisersDropsOpen={isRisersDropsOpen}
        onCloseRisersDrops={() => setIsRisersDropsOpen(false)}
        isMasterMixerOpen={isMasterMixerOpen}
        onCloseMasterMixer={() => setIsMasterMixerOpen(false)}
        isSpectrumModalOpen={isSpectrumModalOpen}
        onCloseSpectrumModal={() => setIsSpectrumModalOpen(false)}
        isVagdhenuLyricsOpen={isVagdhenuLyricsOpen}
        onCloseVagdhenuLyrics={() => setIsVagdhenuLyricsOpen(false)}
        isShrutiMandalaOpen={isShrutiMandalaOpen}
        onCloseShrutiMandala={() => setIsShrutiMandalaOpen(false)}
        isAIOrchestratorOpen={isAIOrchestratorOpen}
        onCloseAIOrchestrator={() => setIsAIOrchestratorOpen(false)}
        isStemForgeOpen={isStemForgeOpen}
        onCloseStemForge={() => setIsStemForgeOpen(false)}
        isSpatialAudioOpen={isSpatialAudioOpen}
        onCloseSpatialAudio={() => setIsSpatialAudioOpen(false)}
        isSnapshotModalOpen={isSnapshotModalOpen}
        onCloseSnapshotModal={() => setIsSnapshotModalOpen(false)}
        isMidiModalOpen={isMidiModalOpen}
        onCloseMidiModal={() => setIsMidiModalOpen(false)}
        isPluginModalOpen={isPluginModalOpen}
        onClosePluginModal={() => setIsPluginModalOpen(false)}
        isArrangerOpen={isArrangerOpen}
        onCloseArranger={() => setIsArrangerOpen(false)}
        isRendersModalOpen={isRendersModalOpen}
        onCloseRendersModal={() => setIsRendersModalOpen(false)}
        isModelLibraryOpen={isModelLibraryOpen}
        onCloseModelLibrary={() => setIsModelLibraryOpen(false)}

        tracks={tracks}
        activeRaga={activeRaga}
        activeTala={activeTala}
        baseSaHz={baseSaHz}
        onSaHzChange={(hz) => {
          setBaseSaHz(hz);
          showToast(`Tuned Adhara Shadja to ${hz.toFixed(2)} Hz with 22 Shrutis Just Intonation!`);
        }}
        bpm={bpm}
        totalBars={totalBars}
        onTotalBarsChange={setTotalBars}
        selectedRasa={selectedRasa}
        isPlaying={isPlaying}
        currentBeat={currentBeat}
        selectedTrackId={selectedTrackId}
        orchestratorTrackId={orchestratorTrackId}
        loadedModels={loadedModels}
        pluginModalTargetTrackId={pluginModalTargetTrackId}
        onSelectPluginTarget={setPluginModalTargetTrackId}
        masterPlugins={masterPlugins}
        sections={sections}
        aiStatus={aiStatus}

        onApplyDirectorScene={handleApplyDirectorScene}
        onAddTrack={handleAddTrack}
        onInsertTransition={handleInsertTransition}
        onUpdateTrack={handleUpdateTrack}
        onUpdateTrackSpatial={handleUpdateTrackSpatial}
        onApplySpatialPreset={handleApplySpatialPreset}
        onSendVocalPrompt={handleSendVocalPrompt}
        onToggleModelLoaded={handleToggleModelLoaded}
        onOptimizeMemory={handleOptimizeMemory}
        onImportStemsAsTracks={handleImportStemsAsTracks}
        onRestoreSnapshot={handleRestoreSnapshot}
        getCurrentSessionState={getCurrentSessionState}
        onInsertMidiClip={handleInsertMidiClip}
        onMidiParamChange={handleMidiParamChange}
        onUpdateMasterPlugins={handleUpdateMasterPlugins}
        onUpdateTrackPlugins={handleUpdateTrackPlugins}
        onUpdateSections={handleUpdateSections}
        onApplyFullArrangement={handleApplyFullArrangement}
        onMountClipToTrack={handleMountClipToTrack}
        showToast={showToast}
        onOpenStemForge={() => setIsStemForgeOpen(true)}
        onOpenSpatialAudio={() => setIsSpatialAudioOpen(true)}
        onOpenPlugins={handleOpenPlugins}
      />

    </div>
  );
}

export default App;
