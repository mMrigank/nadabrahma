import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Wand2, Plus, Sliders, Music, Zap, Layers, 
  Cpu, HardDrive, ShieldCheck, ChevronUp, ChevronDown, CheckCircle2,
  Volume2, Play, Pause, Square, Activity, Scissors, Compass,
  RotateCcw, RotateCw, GitBranch, Radio
} from 'lucide-react';
import { Track, Raga, Tala, RasaType, DirectorSceneState, TransitionFXState, TrackRole, AIModel, MetronomeTimbre, SpatialCoordinates, AudioClip, PluginInstance, ArrangementSection } from './types/daw';
import { RAGA_DATABASE, TALA_DATABASE } from './lib/ragaEngine';
import { audioEngine } from './lib/webAudioEngine';
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
import { SpatialAudioModal } from './components/SpatialAudioModal';
import { SessionSnapshotModal } from './components/SessionSnapshotModal';
import { MidiControllerModal } from './components/MidiControllerModal';
import { AudioPluginHostModal } from './components/AudioPluginHostModal';
import { ArrangementAssistantModal } from './components/ArrangementAssistantModal';
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
    takes: [
      { id: 't1', name: 'Take 1 (16Hz Infrasonic Drone)', timestamp: '05:17', durationSec: 160, contextAware: true }
    ],
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
    takes: [
      { id: 't1', name: 'Take 1 (Varanasi Ghat Dawn Foley)', timestamp: '05:18', durationSec: 160, contextAware: true }
    ],
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
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>('tr-1');

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
  const [isSpatialAudioOpen, setIsSpatialAudioOpen] = useState<boolean>(false);
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

  const handleSaveProject = async () => {
    try {
      const projectData = JSON.stringify({ tracks, activeRaga, activeTala, baseSaHz, bpm }, null, 2);
      if ('showSaveFilePicker' in window) {
        // @ts-ignore
        const handle = await window.showSaveFilePicker({
          suggestedName: 'nadabrahma_project.nad',
          types: [{
            description: 'Nāḍ Project File',
            accept: { 'application/json': ['.nad'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(projectData);
        await writable.close();
        showToast('Project saved successfully.');
      } else {
        // Fallback
        const blob = new Blob([projectData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nadabrahma_project.nad';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Project saved to downloads.');
      }
    } catch (err) {
      console.error(err);
      showToast('Save cancelled or failed.');
    }
  };

  const handleExportMaster = async () => {
    try {
      showToast('Rendering Master Audio (96kHz / 32-bit float)...');
      // Simulated export
      setTimeout(() => {
        setIsStemForgeOpen(true);
        showToast('Ready for Export via StemForge pipeline.');
      }, 1000);
    } catch (err) {
      console.error(err);
    }
  };

  // Metronome & Playhead timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      // Play initial click immediately when playback starts (Beat 0 / Sam)
      if (metronomeRef.current.isActive) {
        const initialClap = activeTala.claps[currentBeatRef.current] || 'sam';
        audioEngine.playTalaClick(
          initialClap,
          metronomeRef.current.baseSaHz,
          metronomeRef.current.volume,
          metronomeRef.current.timbre
        );
      }

      const beatDurationMs = (60 / bpm) * 1000;
      interval = setInterval(() => {
        setCurrentBeat(prev => {
          const nextBeat = (prev + 1) % activeTala.matras;
          
          // Play acoustic Tala click tuned to Moveable Sa
          if (metronomeRef.current.isActive) {
            const clapType = activeTala.claps[nextBeat] || 'tali';
            audioEngine.playTalaClick(
              clapType,
              metronomeRef.current.baseSaHz,
              metronomeRef.current.volume,
              metronomeRef.current.timbre
            );
          }

          return nextBeat;
        });

        // Advance playhead in bars (supports any length up to totalBars)
        setPlayheadPosition(prev => {
          const newPos = prev + (4 / activeTala.matras) * 0.25;
          return newPos > totalBars ? 1 : newPos;
        });

      }, beatDurationMs);
    }
    return () => clearInterval(interval);
  }, [isPlaying, bpm, activeTala, totalBars]);

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

  const handleApplyDirectorScene = (scene: DirectorSceneState, raga: Raga) => {
    setActiveRaga(raga);
    setBpm(scene.pacingBpm);
    showToast(`Scored scene: ${scene.sceneTitle} in Raag ${raga.name} (${scene.rasa})!`);
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
        onOpenExtendedSpectrum={() => setIsSpectrumModalOpen(true)}
        onOpenVagdhenuLyrics={() => setIsVagdhenuLyricsOpen(true)}
        onOpenShrutiMandala={() => setIsShrutiMandalaOpen(true)}
        onOpenAIOrchestrator={() => handleOpenAIOrchestrator()}
        onOpenStemForge={() => setIsStemForgeOpen(true)}
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
          totalBars={totalBars}
          onTotalBarsChange={setTotalBars}
          bpm={bpm}
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

        {/* Floating Quick Action Drawer Bar (Center Bottom of Timeline) */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-800/80 shadow-2xl">
          <button
            onClick={() => setIsArrangerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/60 hover:bg-amber-900/70 border border-amber-500/40 text-amber-200 text-xs font-medium transition cursor-pointer shadow-sm"
            title="Open Intelligent Arrangement Assistant & Section Arranger"
          >
            Arranger
          </button>

          <button
            onClick={() => handleOpenPlugins()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/70 border border-indigo-500/40 text-indigo-200 text-xs font-medium transition cursor-pointer shadow-sm"
            title="Open VST3 / AU Audio Plugin Host & Wasm DSP Sandboxing Suite"
          >
            FX Rack
          </button>

          <button
            onClick={() => handleOpenAIOrchestrator()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 border border-purple-500/40 text-purple-200 text-xs font-medium transition cursor-pointer shadow-sm"
            title="Open Apple MLX Multi-Model AI Suite Orchestrator"
          >
            AI Suite (MLX)
          </button>

          <button
            onClick={() => setIsStemForgeOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/40 text-cyan-200 text-xs font-medium transition cursor-pointer shadow-sm"
            title="Open StemForge AI Stem Separation & 96kHz Master Exporter"
          >
            StemForge & Export
          </button>

          <button
            onClick={() => handleOpenSpatialAudio()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/60 hover:bg-amber-900/70 border border-amber-500/40 text-amber-200 text-xs font-medium transition cursor-pointer shadow-sm"
            title="Open The Owl 3D Spatial Audio Bus & Ambisonics Panner"
          >
            3D Spatial Radar
          </button>

          <button
            onClick={() => setIsDirectorWizardOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-900 hover:bg-stone-850 border border-amber-600/25 text-amber-200/90 text-xs font-medium transition cursor-pointer"
          >
            Director's Mode (9 Rasas)
          </button>

          <button
            onClick={() => setIsShrutiMandalaOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-900 hover:bg-stone-850 border border-amber-600/35 text-amber-200 text-xs font-mono font-medium transition cursor-pointer"
          >
            22 Shrutis & Sa Hub
          </button>

          <button
            onClick={() => setIsVagdhenuLyricsOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-600/35 text-amber-200 text-xs font-serif font-medium transition cursor-pointer"
          >
            Vedic Lyrics (Vāgdhenu)
          </button>

          <button
            onClick={() => setIsRisersDropsOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-rose-200/80 text-xs font-medium transition cursor-pointer"
          >
            Track 5 (Risers & Drops)
          </button>

          <button
            onClick={() => setIsSpectrumModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-950/40 hover:bg-teal-900/50 border border-teal-600/30 text-teal-300 text-xs font-medium transition cursor-pointer"
          >
            96k DSP Pipeline
          </button>

          <button
            onClick={() => setIsAddTrackOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-medium transition cursor-pointer"
          >
            Add Track ({tracks.length}/40+)
          </button>

          <button
            onClick={() => setIsMasterMixerOpen(!isMasterMixerOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-medium transition cursor-pointer"
          >
            Master & 3D Spatial
          </button>

          <button
            onClick={() => setIsSnapshotModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-200 text-xs font-medium transition cursor-pointer shadow-sm"
            title="Open Session Snapshots, Branch Trees & Bundle Manager"
          >
            Snapshots ({activeBranchName})
          </button>

          <button
            onClick={() => setIsMidiModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-200 text-xs font-medium transition cursor-pointer shadow-sm"
            title="Open Hardware MIDI & MPE Expressive Touch Suite"
          >
            MIDI & MPE {midiDeviceCount > 0 && `(${midiDeviceCount})`}
          </button>

          <div className="w-px h-4 bg-slate-800 mx-1"></div>

          <button
            onClick={() => setIsPianoRollOpen(!isPianoRollOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-medium transition cursor-pointer ${
              isPianoRollOpen
                ? 'bg-amber-600/85 hover:bg-amber-600 text-slate-950 border-amber-600/50 font-semibold'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            Swara Piano Roll
          </button>
        </div>
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

    </div>
  );
}

export default App;
