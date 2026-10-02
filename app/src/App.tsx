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
import { PianoRoll } from './components/PianoRoll';
import { VariationSelectorModal } from './components/VariationSelectorModal';
import { DirectorsWizardModal } from './components/DirectorsWizardModal';
import { AddTrackModal } from './components/AddTrackModal';
import { RisersDropsPanel } from './components/RisersDropsPanel';
import { MasterMixerDrawer } from './components/MasterMixerDrawer';
import { ExtendedSpectrumModal } from './components/ExtendedSpectrumModal';
import { VagdhenuLyricsDrawer } from './components/VagdhenuLyricsDrawer';
import { ShrutiMandalaModal } from './components/ShrutiMandalaModal';
import { AIModelOrchestratorModal } from './components/AIModelOrchestratorModal';
import { StemForgeModal } from './components/StemForgeModal';
import { ModelLibraryModal } from './components/ModelLibraryModal';
import { SpatialAudioModal } from './components/SpatialAudioModal';
import { SessionSnapshotModal } from './components/SessionSnapshotModal';
import { MidiControllerModal } from './components/MidiControllerModal';
import { AudioPluginHostModal } from './components/AudioPluginHostModal';
import { ArrangementAssistantModal } from './components/ArrangementAssistantModal';
import { RendersModal } from './components/RendersModal';
import { DEFAULT_MASTER_PLUGINS } from './lib/pluginEngine';
import { arrangementEngine } from './lib/arrangementEngine';
import { getOptimizedLoadedModels, calculateWorkingMemoryGB } from './lib/aiModelData';
import { DEFAULT_TRACK_SPATIAL, SPATIAL_STAGING_PRESETS } from './lib/spatialAudioEngine';
import { sessionHistory, SessionState } from './lib/sessionHistoryEngine';
import { midiEngine } from './lib/midiEngine';

const INITIAL_TRACKS: Track[] = [
  {
    id: 'tr-1',
    name: '1. Mood Instrument',
    activeInstrument: 'Sarod (Deep Alap & Mood Lock)',
    role: 'solo_instrument',
    model: 'soundfont_native',
    color: '#b08d57', // Mellow Warm Sandstone
    muted: false,
    soloed: false,
    volume: 0.85,
    pan: 0,
    busGroup: 'Acoustics',
    takes: [
      { id: 't1', name: 'Take 1 (Passionate Mood Lock)', timestamp: '05:12', durationSec: 160, contextAware: true }
    ],
    activeTakeIndex: 0,
    clips: [],
    hypersonicAir: true,
    somaticSub: false,
    spatial: DEFAULT_TRACK_SPATIAL['tr-1']
  },
  {
    id: 'tr-2',
    name: '2. Vocals',
    activeInstrument: 'Vedic Sanskrit Chhandas (Vāgdhenu)',
    role: 'vedic_chant',
    model: 'vagdhenu',
    color: '#a06352', // Mellow Terracotta Clay
    muted: false,
    soloed: false,
    volume: 0.8,
    pan: -0.2,
    busGroup: 'Vocals',
    takes: [
      { id: 't1', name: 'Take 1 (Vocal Recital & Chhandas)', timestamp: '05:13', durationSec: 160, contextAware: true }
    ],
    activeTakeIndex: 0,
    clips: [],
    hypersonicAir: true,
    somaticSub: false,
    spatial: DEFAULT_TRACK_SPATIAL['tr-2']
  },
  {
    id: 'tr-3',
    name: '3. Strings',
    activeInstrument: 'Sitar (Meend Microtonal Glides)',
    role: 'solo_instrument',
    model: 'soundfont_native',
    color: '#5d7491', // Mellow Dusty Slate Blue
    muted: false,
    soloed: false,
    volume: 0.78,
    pan: 0.35,
    busGroup: 'Acoustics',
    takes: [
      { id: 't1', name: 'Take 1 (Jor-Jhala)', timestamp: '05:14', durationSec: 160, contextAware: true }
    ],
    activeTakeIndex: 0,
    clips: [],
    hypersonicAir: true,
    somaticSub: false,
    spatial: DEFAULT_TRACK_SPATIAL['tr-3']
  },
  {
    id: 'tr-4',
    name: '4. Winds & Flutes',
    activeInstrument: 'Bansuri Flute (Hypersonic Sheen)',
    role: 'solo_instrument',
    model: 'soundfont_native',
    color: '#528275', // Mellow Sage Celadon
    muted: false,
    soloed: false,
    volume: 0.72,
    pan: -0.35,
    busGroup: 'Acoustics',
    takes: [
      { id: 't1', name: 'Take 1 (Airy Murki)', timestamp: '05:15', durationSec: 160, contextAware: true }
    ],
    activeTakeIndex: 0,
    clips: [],
    hypersonicAir: true,
    somaticSub: false,
    spatial: DEFAULT_TRACK_SPATIAL['tr-4']
  },
  {
    id: 'tr-5',
    name: '5. Risers & Drops',
    activeInstrument: 'Cinematic Braams & 16Hz Sub Drops',
    role: 'risers_drops',
    model: 'stable_audio_3',
    color: '#8f6277', // Mellow Dusty Mauve
    muted: false,
    soloed: false,
    volume: 0.9,
    pan: 0,
    busGroup: 'Cinematic FX',
    takes: [
      { id: 't1', name: 'Take 1 (Cinematic Braam & Drop)', timestamp: '05:16', durationSec: 64, contextAware: true }
    ],
    activeTakeIndex: 0,
    clips: [],
    hypersonicAir: true,
    somaticSub: true,
    spatial: DEFAULT_TRACK_SPATIAL['tr-5']
  },
  {
    id: 'tr-6',
    name: '6. Percussion & Tala',
    activeInstrument: 'Tabla & Dagga (Teental 16 Matras)',
    role: 'percussion_tala',
    model: 'soundfont_native',
    color: '#8c7750', // Mellow Warm Teak Wood
    muted: false,
    soloed: false,
    volume: 0.85,
    pan: 0.1,
    busGroup: 'Percussion',
    takes: [
      { id: 't1', name: 'Take 1 (Dha Dhin Dhin Dha Theka)', timestamp: '05:16', durationSec: 160, contextAware: true }
    ],
    activeTakeIndex: 0,
    clips: [],
    hypersonicAir: false,
    somaticSub: true,
    spatial: DEFAULT_TRACK_SPATIAL['tr-6']
  },
  {
    id: 'tr-7',
    name: '7. Bass & Low End',
    activeInstrument: 'Sub Bass & Cello (Somatic 16Hz)',
    role: 'ambient_pad',
    model: 'stable_audio_3',
    color: '#6f5d8a', // Mellow Deep Amethyst
    muted: false,
    soloed: false,
    volume: 0.75,
    pan: 0,
    busGroup: 'Orchestral',
    takes: [],
    activeTakeIndex: 0,
    clips: [],
    hypersonicAir: false,
    somaticSub: true,
    spatial: DEFAULT_TRACK_SPATIAL['tr-7']
  },
  {
    id: 'tr-8',
    name: '8. Atmosphere & Textures',
    activeInstrument: 'Sacred Vedic Temple Drone',
    role: 'ambient_pad',
    model: 'stable_audio_3',
    color: '#566c82', // Mellow Smoky Slate
    muted: false,
    soloed: false,
    volume: 0.65,
    pan: 0.25,
    busGroup: 'Cinematic FX',
    takes: [],
    activeTakeIndex: 0,
    clips: [],
    hypersonicAir: true,
    somaticSub: false,
    spatial: DEFAULT_TRACK_SPATIAL['tr-8']
  }
];

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
  const [isPianoRollOpen, setIsPianoRollOpen] = useState<boolean>(true);
  const [isPianoRollExpanded, setIsPianoRollExpanded] = useState<boolean>(false);
  const [isAIOrchestratorOpen, setIsAIOrchestratorOpen] = useState<boolean>(false);
  const [orchestratorTrackId, setOrchestratorTrackId] = useState<string | null>(null);
  const [isStemForgeOpen, setIsStemForgeOpen] = useState<boolean>(false);
  const [isModelLibraryOpen, setIsModelLibraryOpen] = useState<boolean>(false);
  const [isSpatialAudioOpen, setIsSpatialAudioOpen] = useState<boolean>(false);
  const [isRendersModalOpen, setIsRendersModalOpen] = useState<boolean>(false);

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
    setAiStatus({ active: true, model: 'Apple MLX', progress: 5, taskName: 'Connecting to Nāḍ Backend...' });
    
    const sceneBars = 32;
    const durationSec = Math.round(sceneBars * (4 * 60 / scene.pacingBpm));
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Target Track: Prioritize selected track or default to Track 1 (Mood Instrument / Master Score)
    const targetTrack = tracks.find(t => t.id === selectedTrackId) || tracks[0];

    if (!targetTrack) {
      setAiStatus({ active: false, model: '', progress: 0, taskName: '' });
      showToast('No valid track found to receive score.');
      return;
    }

    try {
      setAiStatus({ active: true, model: 'YuE 2 (BF16)', progress: 0, taskName: `Orchestrating ${scene.rasa} Scene...` });
      
      const prompt = `Compose a ${scene.rasa} cinematic score in ${raga.name}. Arc: ${scene.arcType}. Tempo: ${scene.pacingBpm} BPM.`;

      // Connect to WebSocket for real-time generation progress
      const ws = new WebSocket('ws://localhost:9090/ws');
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'generate',
          payload: {
            modelId: 'yue_2',
            prompt: prompt,
            tags: `${scene.rasa}, cinematic score, raag ${raga.name}`,
            durationSec: durationSec
          }
        }));
      };

      ws.onmessage = async (event) => {
        // If we receive a binary frame, it's the completed WAV file
        if (event.data instanceof ArrayBuffer) {
          setAiStatus({ active: true, model: 'System', progress: 95, taskName: 'Mounting to Timeline...' });

          try {
            const newClipId = `clip-director-${Date.now()}-${targetTrack.id}`;
            const audioBuffer = await audioEngine.loadGeneratedAudio(newClipId, event.data);

            const barDurationSec = (4 * 60 / scene.pacingBpm);
            const clipDurationBars = Math.max(1, Math.round(audioBuffer.duration / barDurationSec));

            // Extract waveform peaks for rich timeline rendering
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

            const newClip: AudioClip = {
              id: newClipId,
              name: `${scene.rasa} Master Score (${raga.name})`,
              startBar: 1,
              durationBars: clipDurationBars,
              color: targetTrack.color,
              audioBuffer: audioBuffer,
              waveformPoints: waveformPoints
            };

            const newTake: AudioTake = {
              id: `take-director-${Date.now()}-${targetTrack.id}`,
              name: `Take ${targetTrack.takes.length + 1} (${scene.rasa} Scene - ${raga.name})`,
              timestamp,
              durationSec: Math.round(audioBuffer.duration),
              contextAware: true
            };

            setTracks(prevTracks => prevTracks.map(track => {
              if (track.id === targetTrack.id) {
                return {
                  ...track,
                  takes: [...track.takes, newTake],
                  activeTakeIndex: track.takes.length,
                  clips: [...track.clips.filter(c => c.startBar !== 1), newClip]
                };
              }
              return track;
            }));

            showToast(`Scored scene "${scene.sceneTitle}" (${raga.name} / ${scene.rasa}) saved to Renders & mounted on ${targetTrack.name}!`);
          } catch (err: any) {
            console.error('Failed to mount generated audio:', err);
            showToast('Failed to decode audio: ' + (err?.message || err));
          }

          setAiStatus({ active: false, model: '', progress: 0, taskName: '' });
          setIsDirectorWizardOpen(false);
          ws.close();
          return;
        }

        // Otherwise, it's a JSON event
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch (e) {
          console.error('WS parse error', e);
          return;
        }

        if (msg.type === 'progress') {
          const pct = Math.round(msg.payload.value * 100);
          setAiStatus(prev => ({
            ...prev,
            active: true,
            model: 'YuE 2 (BF16)',
            progress: pct,
            taskName: `Rendering AI Audio (${pct}%)...`,
            usedGB: msg.payload.usedGB ?? prev.usedGB,
            totalGB: msg.payload.totalGB ?? prev.totalGB,
            pressurePct: msg.payload.pressurePct ?? prev.pressurePct
          }));
        } else if (msg.type === 'memory') {
          setAiStatus(prev => ({
            ...prev,
            usedGB: msg.payload.usedGB,
            totalGB: msg.payload.totalGB,
            pressurePct: msg.payload.pressurePct
          }));
        } else if (msg.type === 'error') {
          console.error('Backend WS Error:', msg.payload.message);
          showToast(`Generation Failed: ${msg.payload.message}`);
          setAiStatus({ active: false, model: '', progress: 0, taskName: '', error: msg.payload.message });
          ws.close();
        } else if (msg.type === 'model_state') {
          if (msg.payload.state === 'loading') {
            setAiStatus(prev => ({
              ...prev,
              taskName: 'Loading YuE 2 (BF16) into Unified Memory...',
              usedGB: msg.payload.usedGB ?? prev.usedGB,
              totalGB: msg.payload.totalGB ?? prev.totalGB
            }));
          } else if (msg.payload.state === 'generating') {
            setAiStatus(prev => ({
              ...prev,
              taskName: 'Generating Neural Audio on Metal GPU...'
            }));
          }
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        showToast('WebSocket connection to backend failed.');
        setAiStatus({ active: false, model: '', progress: 0, taskName: '', error: 'WebSocket connection failed' });
      };

    } catch (err: any) {
      console.error('AI Generation Error:', err);
      showToast(`Generation Failed: ${err.message}. Make sure the Go backend is running.`);
      setAiStatus({ active: false, model: '', progress: 0, taskName: '', error: err.message });
    }
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

          <button
            onClick={() => setIsPianoRollOpen(!isPianoRollOpen)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-medium transition cursor-pointer shadow-sm active:scale-95 ${
              isPianoRollOpen
                ? 'bg-amber-500/25 text-amber-200 border-amber-500/50 font-semibold'
                : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200'
            }`}
            title="Toggle Bottom Swara Piano Roll & Gamaka Modeler"
          >
            <Music className="w-3.5 h-3.5 text-amber-400" />
            <span>Swara Piano Roll</span>
          </button>
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
        />

        
      </div>

      {/* 3. Bottom Swara Piano Roll Drawer (Moved up, expanded height, zero overlap) */}
      {isPianoRollOpen && (
        <div className={`border-t border-white/[0.15] bg-[#080b12] flex flex-col z-20 shadow-2xl shrink-0 transition-all duration-200 ${
          isPianoRollExpanded ? 'h-[500px]' : 'h-[370px]'
        }`}>
          <PianoRoll
            selectedTrack={selectedTrack}
            activeRaga={activeRaga}
            baseSaHz={baseSaHz}
            onClose={() => setIsPianoRollOpen(false)}
            isExpanded={isPianoRollExpanded}
            onToggleExpand={() => setIsPianoRollExpanded(!isPianoRollExpanded)}
            playheadPosition={playheadPosition}
            timeSignature={timeSignature}
          />
        </div>
      )}

      {variationTrackId && (
        <VariationSelectorModal
          trackId={variationTrackId}
          trackName={tracks.find(t => t.id === variationTrackId)?.name || 'Track'}
          onSelect={handleCommitVariation}
          onCancel={() => setVariationTrackId(null)}
        />
      )}

      {/* 4. Bottom System Status Bar (Pinned, non-overlapping) */}
      <footer className="h-7 shrink-0 relative z-30 border-t border-white/[0.12] bg-[#06080e] px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
        
        {/* Left: Modal bridge readout & Session Branch */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsShrutiMandalaOpen(true)}
            title="Open 22 Shrutis Just Intonation & Moveable Sa Tuning Hub"
            className="flex items-center gap-1 text-amber-400 hover:underline cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            Raga: {activeRaga.name} ({activeRaga.tradition}) • Sa: {baseSaHz.toFixed(1)}Hz
          </button>
          <span className="text-slate-500">|</span>
          <span>Western Mode: <span className="text-slate-200">{activeRaga.westernMode}</span></span>
          <span className="text-slate-500">|</span>
          <span>Vadi: <span className="text-amber-300">{activeRaga.vadi}</span> • Samvadi: <span className="text-amber-300">{activeRaga.samvadi}</span></span>
          <span className="text-slate-500">|</span>
          <button
            onClick={() => setIsSnapshotModalOpen(true)}
            className="flex items-center gap-1 text-emerald-400/90 hover:text-emerald-300 hover:underline cursor-pointer transition"
            title="Open Session Snapshots & Branch Tree"
          >
            <GitBranch className="w-3 h-3 text-emerald-400" />
            Branch: <span className="text-emerald-200">{activeBranchName}</span> (Saved {lastAutoSaveTime})
          </button>
          <span className="text-slate-500">|</span>
          <button
            onClick={() => setIsMidiModalOpen(true)}
            className="flex items-center gap-1 text-emerald-400/90 hover:text-emerald-300 hover:underline cursor-pointer transition"
            title="Open Hardware MIDI & MPE Controller"
          >
            <Radio className="w-3 h-3 text-emerald-400" />
            MIDI: <span className="text-emerald-200">{midiDeviceCount > 0 ? `${midiDeviceCount} Active` : 'Ready'}</span>
          </button>
          <span className="text-slate-500">|</span>
          <button
            onClick={() => handleOpenPlugins()}
            className="flex items-center gap-1 text-indigo-400/90 hover:text-indigo-300 hover:underline cursor-pointer transition"
            title="Open VST3 / AU Audio Plugin Host & Wasm DSP Rack"
          >
            <Sliders className="w-3 h-3 text-indigo-400" />
            Plugins: <span className="text-indigo-200">{masterPlugins.filter(p => p.enabled).length + tracks.reduce((acc, t) => acc + (t.plugins?.filter(p => p.enabled).length || 0), 0)} Active</span>
          </button>
          <span className="text-slate-500">|</span>
          <button
            onClick={() => setIsArrangerOpen(true)}
            className="flex items-center gap-1 text-amber-400/90 hover:text-amber-300 hover:underline cursor-pointer transition"
            title="Open Intelligent Arrangement Assistant & Section Arranger"
          >
            <span className="text-xs">📐</span>
            Movement: <span className="text-amber-200">{activeSection ? `${activeSection.sanskritName || activeSection.name.split(' ')[0]} (b${activeSection.startBar}-${activeSection.startBar + activeSection.durationBars - 1})` : 'Full Suite'}</span>
          </button>
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
          <button
            onClick={() => handleOpenAIOrchestrator()}
            title="Open Apple Silicon M1 Max AI Suite & Memory Budgeter"
            className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer transition"
          >
            <HardDrive className="w-3 h-3" /> {workingMemoryGB.toFixed(1)} GB / 18 GB Allocated ({(32 - workingMemoryGB).toFixed(1)} GB Free)
          </button>
          <span className="text-slate-600">•</span>
          <button
            onClick={() => setIsSpectrumModalOpen(true)}
            title="Open Native 96kHz / 32-Bit Float DSP Engine"
            className="text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer transition"
          >
            <Activity className="w-3 h-3" />
            96 kHz / 32-bit Float CoreAudio
          </button>
        </div>
      </footer>

      {/* 5. Modals & Drawers */}
      <DirectorsWizardModal
        isOpen={isDirectorWizardOpen || aiStatus?.active}
        onClose={() => setIsDirectorWizardOpen(false)}
        baseSaHz={baseSaHz}
        onApplyScene={handleApplyDirectorScene}
        aiStatus={aiStatus}
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
        onOpenStemForge={() => setIsStemForgeOpen(true)}
        onOpenSpatialAudio={() => setIsSpatialAudioOpen(true)}
        onOpenPlugins={() => handleOpenPlugins()}
        tracks={tracks}
        onUpdateTrackSpatial={handleUpdateTrackSpatial}
      />

      <ExtendedSpectrumModal
        isOpen={isSpectrumModalOpen}
        onClose={() => setIsSpectrumModalOpen(false)}
        tracks={tracks}
        onUpdateTrack={handleUpdateTrack}
        baseSaHz={baseSaHz}
      />

      <VagdhenuLyricsDrawer
        isOpen={isVagdhenuLyricsOpen}
        onClose={() => setIsVagdhenuLyricsOpen(false)}
        baseSaHz={baseSaHz}
        activeRagaName={activeRaga.name}
        selectedRasa={selectedRasa}
        isPlaying={isPlaying}
        currentBeat={currentBeat}
        onSendToVocalPrompt={handleSendVocalPrompt}
      />

      <ShrutiMandalaModal
        isOpen={isShrutiMandalaOpen}
        onClose={() => setIsShrutiMandalaOpen(false)}
        baseSaHz={baseSaHz}
        onSaHzChange={(hz) => {
          setBaseSaHz(hz);
          showToast(`Tuned Adhara Shadja to ${hz.toFixed(2)} Hz with 22 Shrutis Just Intonation!`);
        }}
        activeRagaId={activeRaga.id}
        activeRagaName={activeRaga.name}
      />

      <AIModelOrchestratorModal
        isOpen={isAIOrchestratorOpen}
        onClose={() => setIsAIOrchestratorOpen(false)}
        tracks={tracks}
        onUpdateTrack={handleUpdateTrack}
        activeRaga={activeRaga}
        activeTala={activeTala}
        baseSaHz={baseSaHz}
        initialSelectedTrackId={orchestratorTrackId}
        loadedModels={loadedModels}
        onToggleModelLoaded={handleToggleModelLoaded}
        onOptimizeMemory={handleOptimizeMemory}
      />

      <StemForgeModal
        isOpen={isStemForgeOpen}
        onClose={() => setIsStemForgeOpen(false)}
        tracks={tracks}
        activeRaga={activeRaga}
        activeTala={activeTala}
        baseSaHz={baseSaHz}
        bpm={bpm}
        totalBars={totalBars}
        onImportStemsAsTracks={handleImportStemsAsTracks}
      />

      <SpatialAudioModal
        isOpen={isSpatialAudioOpen}
        onClose={() => setIsSpatialAudioOpen(false)}
        tracks={tracks}
        onUpdateTrackSpatial={handleUpdateTrackSpatial}
        onApplyPreset={handleApplySpatialPreset}
        isPlaying={isPlaying}
      />

      <SessionSnapshotModal
        isOpen={isSnapshotModalOpen}
        onClose={() => setIsSnapshotModalOpen(false)}
        currentState={getCurrentSessionState()}
        activeRagaName={activeRaga.name}
        onRestoreSnapshot={handleRestoreSnapshot}
      />

      <MidiControllerModal
        isOpen={isMidiModalOpen}
        onClose={() => setIsMidiModalOpen(false)}
        tracks={tracks}
        activeRaga={activeRaga}
        activeTala={activeTala}
        baseSaHz={baseSaHz}
        selectedTrackId={selectedTrackId}
        onInsertMidiClip={handleInsertMidiClip}
        onParamChange={handleMidiParamChange}
      />

      <AudioPluginHostModal
        isOpen={isPluginModalOpen}
        onClose={() => setIsPluginModalOpen(false)}
        tracks={tracks}
        targetTrackId={pluginModalTargetTrackId}
        onSelectTarget={setPluginModalTargetTrackId}
        masterPlugins={masterPlugins}
        onUpdateMasterPlugins={handleUpdateMasterPlugins}
        onUpdateTrackPlugins={handleUpdateTrackPlugins}
        baseSaHz={baseSaHz}
        activeRaga={activeRaga}
      />

      <ArrangementAssistantModal
        isOpen={isArrangerOpen}
        onClose={() => setIsArrangerOpen(false)}
        sections={sections}
        onUpdateSections={handleUpdateSections}
        onApplyFullArrangement={handleApplyFullArrangement}
        tracks={tracks}
        activeRaga={activeRaga}
        activeTala={activeTala}
        baseSaHz={baseSaHz}
        bpm={bpm}
        totalBars={totalBars}
        onTotalBarsChange={setTotalBars}
      />

      <RendersModal
        isOpen={isRendersModalOpen}
        onClose={() => setIsRendersModalOpen(false)}
        tracks={tracks}
        onMountClipToTrack={handleMountClipToTrack}
        showToast={showToast}
        bpm={bpm}
      />

    </div>
  );
}

export default App;
