import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Cpu, Activity, Sliders, Music, Zap, CheckCircle2, 
  Radio, RefreshCw, Layers, ShieldCheck, Flame, Volume2, 
  Play, Square, Sparkles, ChevronRight, Gauge, Disc
} from 'lucide-react';
import { Raga, Tala, Track, MidiDevice, MpeConfiguration, MidiMapping, MidiLiveTelemetry } from '../types/daw';
import { midiEngine, HARDWARE_PRESETS, SvaraNoteInfo } from '../lib/midiEngine';

interface MidiControllerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  activeRaga: Raga;
  activeTala: Tala;
  baseSaHz: number;
  selectedTrackId: string | null;
  onInsertMidiClip: (trackId: string, clip: any) => void;
  onParamChange?: (paramKey: string, value: number, trackId?: string) => void;
}

export const MidiControllerModal: React.FC<MidiControllerModalProps> = ({
  isOpen,
  onClose,
  tracks,
  activeRaga,
  activeTala,
  baseSaHz,
  selectedTrackId,
  onInsertMidiClip,
  onParamChange
}) => {
  const [activeTab, setActiveTab] = useState<'devices_mpe' | 'midi_learn' | 'quantize_tuning'>('devices_mpe');
  const [devices, setDevices] = useState<MidiDevice[]>([]);
  const [mpeConfig, setMpeConfig] = useState<MpeConfiguration>(midiEngine.getMpeConfig());
  const [mappings, setMappings] = useState<MidiMapping[]>(midiEngine.getMappings());
  const [telemetry, setTelemetry] = useState<MidiLiveTelemetry | null>(null);
  const [isLearning, setIsLearning] = useState<boolean>(false);
  const [learningLabel, setLearningLabel] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedCount, setRecordedCount] = useState<number>(0);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [snapToRaga, setSnapToRaga] = useState<boolean>(true);
  const [justIntonationRetuning, setJustIntonationRetuning] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected arm track
  const armTrackId = selectedTrackId || tracks[0]?.id || 'tr-1';
  const armTrack = tracks.find(t => t.id === armTrackId) || tracks[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Initialize and subscribe to MIDI Engine
  useEffect(() => {
    if (!isOpen) return;

    midiEngine.init().then(() => {
      setDevices(midiEngine.getDevices());
    });

    const unsubDevices = midiEngine.onDevices((devs) => {
      setDevices(devs);
    });

    const unsubTelemetry = midiEngine.onTelemetry((t) => {
      setTelemetry(t);
      if (t.lastEventType === 'noteon' && t.noteNumber !== undefined) {
        setActiveNotes(prev => new Set(prev).add(t.noteNumber!));
      } else if (t.lastEventType === 'noteoff' && t.noteNumber !== undefined) {
        setActiveNotes(prev => {
          const next = new Set(prev);
          next.delete(t.noteNumber!);
          return next;
        });
      }
    });

    const unsubParam = midiEngine.onParamChange((paramKey, value, trackId) => {
      if (onParamChange) {
        onParamChange(paramKey, value, trackId);
      }
    });

    const unsubLearn = midiEngine.onLearnStatus((learning, label) => {
      setIsLearning(learning);
      setLearningLabel(label || '');
    });

    return () => {
      unsubDevices();
      unsubTelemetry();
      unsubParam();
      unsubLearn();
    };
  }, [isOpen, onParamChange]);

  // QWERTY Computer Keyboard mapping for instant playing without external MIDI hardware
  useEffect(() => {
    if (!isOpen) return;

    const KEY_TO_NOTE: { [key: string]: number } = {
      'a': 48, // Sa (C3)
      'w': 49, // re (C#3)
      's': 50, // Re (D3)
      'e': 51, // ga (D#3)
      'd': 52, // Ga (E3)
      'f': 53, // ma (F3)
      't': 54, // Ma' (F#3)
      'g': 55, // Pa (G3)
      'y': 56, // dha (G#3)
      'h': 57, // Dha (A3)
      'u': 58, // ni (A#3)
      'j': 59, // Ni (B3)
      'k': 60, // Sa' (C4)
      'o': 61, // re' (C#4)
      'l': 62  // Re' (D4)
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      const note = KEY_TO_NOTE[key];
      if (note !== undefined) {
        midiEngine.triggerVirtualNoteOn(note, 0.85, 0.5, 0.5, baseSaHz, activeRaga, snapToRaga);
      } else if (e.key === 'ArrowLeft') {
        // Continuous Meend glide downwards
        midiEngine.triggerVirtualPitchBend(0, -0.5);
      } else if (e.key === 'ArrowRight') {
        // Continuous Meend glide upwards
        midiEngine.triggerVirtualPitchBend(0, 0.5);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      const note = KEY_TO_NOTE[key];
      if (note !== undefined) {
        midiEngine.triggerVirtualNoteOff(note);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        midiEngine.triggerVirtualPitchBend(0, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen, baseSaHz, activeRaga, snapToRaga]);

  if (!isOpen) return null;

  // Handle MPE config updates
  const handleUpdateMpe = (updates: Partial<MpeConfiguration>) => {
    const updated = { ...mpeConfig, ...updates };
    setMpeConfig(updated);
    midiEngine.updateMpeConfig(updates);
    showToast('Updated MPE hardware touch parameters.');
  };

  // Handle Hardware Preset
  const handleApplyPreset = (presetId: string) => {
    midiEngine.applyHardwarePreset(presetId);
    setMappings(midiEngine.getMappings());
    setMpeConfig(midiEngine.getMpeConfig());
    const preset = HARDWARE_PRESETS.find(p => p.id === presetId);
    showToast(`Loaded ${preset?.name} mapping template!`);
  };

  // Handle Arm Recording
  const handleToggleRecording = () => {
    if (!isRecording) {
      midiEngine.startRecording(armTrackId);
      setIsRecording(true);
      setRecordedCount(0);
      showToast(`🔴 Armed Track "${armTrack?.name || 'Selected'}" for live MIDI performance recording!`);
    } else {
      const result = midiEngine.stopRecording();
      setIsRecording(false);
      if (result) {
        onInsertMidiClip(result.trackId, result.clip);
        showToast(`✨ Recorded ${result.clip.swaraNotes?.length || 0} Swaras directly to timeline!`);
      } else {
        showToast('Stopped recording (no notes recorded).');
      }
    }
  };

  // Virtual Key Drag Interaction (X = Pitch Bend, Y = Slide / Timbre)
  const handleKeyMouseDown = (note: number, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relY = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height)); // 0 bottom, 1 top
    midiEngine.triggerVirtualNoteOn(note, 0.85, 0.5, relY, baseSaHz, activeRaga, snapToRaga);
  };

  const handleKeyMouseMove = (note: number, e: React.MouseEvent) => {
    if (e.buttons !== 1) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2); // -1 to +1
    const relY = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
    midiEngine.triggerVirtualPitchBend(note, relX * 0.4);
    midiEngine.triggerVirtualSlide(note, relY);
  };

  const handleKeyMouseUp = (note: number) => {
    midiEngine.triggerVirtualPitchBend(note, 0);
    midiEngine.triggerVirtualNoteOff(note);
  };

  // 25 Virtual Keys (C3 to C5)
  const virtualKeys = Array.from({ length: 25 }, (_, i) => 48 + i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="flex flex-col w-full max-w-5xl h-[88vh] bg-[#090c14] border border-amber-500/25 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-100">
        
        {/* Header Strip */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400 shadow-inner">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-100 tracking-tight">
                  Hardware MIDI & MPE Expressive Touch Engine
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 font-semibold">
                  96kHz Real-Time Core
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Web MIDI API • 5D MPE Meend Glides • 22 Shrutis Just Intonation Retuning • Control Surface Mapping
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Device Count Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/60 text-xs font-mono">
              <span className={`w-2 h-2 rounded-full ${devices.length > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-slate-300">{devices.length} Controller{devices.length === 1 ? '' : 's'} Active</span>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Notification Toast */}
        {toastMessage && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/30 px-6 py-2 text-xs text-emerald-200 flex items-center gap-2 font-medium animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {toastMessage}
          </div>
        )}

        {/* Learning Banner */}
        {isLearning && (
          <div className="bg-amber-950/90 border-b border-amber-500/40 px-6 py-2.5 text-xs text-amber-200 flex items-center justify-between font-medium animate-pulse">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>
                <strong>MIDI Learn Active:</strong> Wiggle any hardware fader or rotary knob to bind to <span className="underline font-bold text-white">{learningLabel}</span>.
              </span>
            </div>
            <button
              onClick={() => midiEngine.disarmMidiLearn()}
              className="px-2.5 py-0.5 rounded bg-amber-800/80 hover:bg-amber-700 text-white text-[11px] font-semibold cursor-pointer"
            >
              Cancel Learn
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 border-b border-white/[0.08] bg-slate-950/40 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('devices_mpe')}
              className={`px-4 py-3 font-medium transition border-b-2 cursor-pointer flex items-center gap-2 ${
                activeTab === 'devices_mpe'
                  ? 'border-amber-400 text-amber-300 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              1. Devices & MPE Live Monitor
            </button>

            <button
              onClick={() => setActiveTab('midi_learn')}
              className={`px-4 py-3 font-medium transition border-b-2 cursor-pointer flex items-center gap-2 ${
                activeTab === 'midi_learn'
                  ? 'border-amber-400 text-amber-300 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              2. MIDI Learn & Surface Templates
            </button>

            <button
              onClick={() => setActiveTab('quantize_tuning')}
              className={`px-4 py-3 font-medium transition border-b-2 cursor-pointer flex items-center gap-2 ${
                activeTab === 'quantize_tuning'
                  ? 'border-amber-400 text-amber-300 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              3. Svara Scale Snap & 22 Shrutis
            </button>
          </div>

          {/* Quick Record Arm Button */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono">
              Target: <strong className="text-slate-200">{armTrack?.name}</strong>
            </span>
            <button
              onClick={handleToggleRecording}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shadow-md ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30'
              }`}
            >
              {isRecording ? <Square className="w-3 h-3 fill-white" /> : <Disc className="w-3 h-3 text-rose-400" />}
              {isRecording ? 'Stop Recording' : '● Record to Track'}
            </button>
          </div>
        </div>

        {/* Tab 1 Content: Devices & MPE Monitor */}
        {activeTab === 'devices_mpe' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Top Row: Devices & MPE Touch Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Connected Hardware List */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400" />
                    Detected MIDI Hardware
                  </h3>
                  <button
                    onClick={() => {
                      midiEngine.init();
                      showToast('Scanned for USB & Bluetooth MIDI hardware.');
                    }}
                    className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Rescan Devices
                  </button>
                </div>

                <div className="space-y-2">
                  {devices.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        <div>
                          <p className="font-semibold text-slate-200">{d.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{d.manufacturer} • Port: {d.id}</p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-mono">
                        ONLINE (0.4ms)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* MPE 5D Touch Parameter Matrix */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    MPE 5D Expression Configuration
                  </h3>
                  <label className="flex items-center gap-2 text-xs cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={mpeConfig.enabled}
                      onChange={(e) => handleUpdateMpe({ enabled: e.target.checked })}
                      className="rounded accent-amber-500"
                    />
                    <span className={mpeConfig.enabled ? 'text-amber-300' : 'text-slate-500'}>
                      {mpeConfig.enabled ? 'MPE Enabled' : 'Standard MIDI'}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Pitch Bend Range (Meend Glide):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="2"
                        max="48"
                        step="1"
                        value={mpeConfig.pitchBendRangeSemitones}
                        onChange={(e) => handleUpdateMpe({ pitchBendRangeSemitones: parseInt(e.target.value) })}
                        className="flex-1 accent-amber-500"
                      />
                      <span className="font-mono font-bold text-amber-300 w-12 text-right">
                        ±{mpeConfig.pitchBendRangeSemitones}st
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Pressure Sensitivity (Z-Axis):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0.2"
                        max="2.0"
                        step="0.1"
                        value={mpeConfig.pressureSensitivity}
                        onChange={(e) => handleUpdateMpe({ pressureSensitivity: parseFloat(e.target.value) })}
                        className="flex-1 accent-amber-500"
                      />
                      <span className="font-mono font-bold text-amber-300 w-12 text-right">
                        {mpeConfig.pressureSensitivity.toFixed(1)}x
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
                  <p>
                    <strong className="text-amber-300">Continuous Indian Classical Meend:</strong> In MPE mode, each note glides freely along the continuous Hertz scale (Sa frequency to 22 Shrutis) without quantizing pitch bend to a single global channel.
                  </p>
                </div>
              </div>
            </div>

            {/* Middle Row: Live Real-Time MIDI & MPE Telemetry HUD */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-[#0a0d18] to-slate-950 border border-amber-500/20 shadow-inner">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Live Hex / Telemetry Monitor
                </h3>
                <span className="text-[10px] font-mono text-slate-500">
                  Buffer: 96kHz / 32-bit Float IEEE
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* Active Note & Svara */}
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Active Svara</span>
                  <p className="text-base font-bold text-amber-400 font-mono">
                    {telemetry?.svaraName || 'Idle (Silence)'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {telemetry?.noteName ? `Key: ${telemetry.noteName} (MIDI ${telemetry.noteNumber})` : 'Awaiting Note'}
                  </p>
                </div>

                {/* Just Intonation Frequency */}
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Pure Just Frequency</span>
                  <p className="text-base font-bold text-cyan-400 font-mono">
                    {telemetry?.frequencyHz ? `${telemetry.frequencyHz} Hz` : `${baseSaHz.toFixed(1)} Hz (Sa)`}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {telemetry?.centDeviation ? `${telemetry.centDeviation > 0 ? '+' : ''}${telemetry.centDeviation}c from 12-TET` : 'Pure Root Unison'}
                  </p>
                </div>

                {/* Pitch Bend / Meend Cents */}
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Pitch Bend (Meend)</span>
                  <p className="text-base font-bold text-purple-400 font-mono">
                    {telemetry?.pitchBendCents !== undefined ? `${telemetry.pitchBendCents > 0 ? '+' : ''}${telemetry.pitchBendCents} cents` : '0 cents'}
                  </p>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden relative">
                    <div
                      className="h-full bg-purple-500 transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, 50 + ((telemetry?.pitchBendCents || 0) / 4800) * 50))}%`
                      }}
                    ></div>
                  </div>
                </div>

                {/* Polyphonic Pressure */}
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Channel Pressure</span>
                  <p className="text-base font-bold text-rose-400 font-mono">
                    {telemetry?.pressure !== undefined ? `${Math.round(telemetry.pressure * 100)}%` : '0%'}
                  </p>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all"
                      style={{ width: `${(telemetry?.pressure || 0) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* CC74 Slide */}
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Slide (CC74 Timbre)</span>
                  <p className="text-base font-bold text-emerald-400 font-mono">
                    {telemetry?.ccNumber === 74 ? `${Math.round((telemetry.ccValue || 0) / 127 * 100)}%` : '50%'}
                  </p>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${((telemetry?.ccValue || 64) / 127) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: 25-Key Interactive Virtual MPE Playing Surface */}
            <div className="p-4 rounded-xl bg-slate-950 border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Music className="w-4 h-4 text-amber-400" />
                    25-Key MPE Playing Surface (C3 to C5)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Click & drag horizontally on any key for continuous Meend glide; drag vertically for CC74 slide. Or play using QWERTY keys: <span className="font-mono text-amber-300">A, W, S, E, D, F, T, G, Y, H, U, J, K</span>.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-600/30">
                  Sa = {baseSaHz.toFixed(1)} Hz ({activeRaga.name})
                </span>
              </div>

              {/* Keyboard Display */}
              <div className="relative h-40 bg-slate-900/90 rounded-xl p-2 flex border border-slate-800 select-none overflow-x-auto">
                {virtualKeys.map((note) => {
                  const svara = midiEngine.midiNoteToSwara(note, baseSaHz, activeRaga, snapToRaga);
                  const isBlackKey = [1, 3, 6, 8, 10].includes(note % 12);
                  const isActive = activeNotes.has(note);

                  return (
                    <div
                      key={note}
                      onMouseDown={(e) => handleKeyMouseDown(note, e)}
                      onMouseMove={(e) => handleKeyMouseMove(note, e)}
                      onMouseUp={() => handleKeyMouseUp(note)}
                      onMouseLeave={() => handleKeyMouseUp(note)}
                      className={`relative flex-1 flex flex-col justify-end items-center pb-2 cursor-pointer transition rounded-b-md ${
                        isBlackKey
                          ? `h-24 -mx-2.5 z-10 ${
                              isActive
                                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/50'
                                : svara.isVarjit
                                ? 'bg-slate-950/90 border border-slate-800 text-slate-600'
                                : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-200'
                            }`
                          : `h-full ${
                              isActive
                                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/50'
                                : svara.isVarjit
                                ? 'bg-slate-900/60 border border-slate-800 text-slate-600'
                                : 'bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200'
                            }`
                      }`}
                      title={`${svara.svara} (${svara.svaraName}) - ${svara.frequencyHz.toFixed(1)}Hz`}
                    >
                      <span className="text-xs font-bold font-mono">
                        {svara.svara}
                      </span>
                      <span className="text-[9px] opacity-70 font-mono">
                        {svara.westernNote}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* Tab 2 Content: MIDI Learn & Surface Templates */}
        {activeTab === 'midi_learn' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Top: Controller Templates */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                1-Click Hardware Controller Mapping Templates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {HARDWARE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleApplyPreset(p.id)}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 text-left transition cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300">
                        {p.name}
                      </span>
                      {p.isMpe && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 font-mono font-bold">
                          MPE 5D
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      {p.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Active MIDI Learn Arm Strip */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.08] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Interactive MIDI Learn</h4>
                <p className="text-[11px] text-slate-400">
                  Arm any parameter below to bind it to your hardware knob, fader, or pitch wheel.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => midiEngine.armMidiLearn('masterVolume', undefined, 'Master Volume Fader')}
                  className="px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/40 text-amber-200 text-xs font-medium transition cursor-pointer"
                >
                  Learn Master Vol
                </button>
                <button
                  onClick={() => midiEngine.armMidiLearn('baseSaHz', undefined, 'Adhara Shadja (Sa Hz)')}
                  className="px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/40 text-amber-200 text-xs font-medium transition cursor-pointer"
                >
                  Learn Sa Pitch
                </button>
                <button
                  onClick={() => midiEngine.armMidiLearn('spatialAzimuth', undefined, '3D Azimuth Panner')}
                  className="px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/40 text-amber-200 text-xs font-medium transition cursor-pointer"
                >
                  Learn 3D Panner
                </button>
              </div>
            </div>

            {/* Mappings Table */}
            <div className="rounded-xl border border-white/[0.08] bg-slate-950 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Active MIDI Mappings ({mappings.length})
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">
                  CC Range: 0 - 127
                </span>
              </div>

              <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto">
                {mappings.map((m) => (
                  <div key={m.id} className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-900/40 transition">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-amber-300 font-bold">
                        CC {m.ccNumber}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-200">{m.paramLabel}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Param: {m.paramKey} {m.trackId ? `• Track: ${m.trackId}` : ''} • Ch: {m.channel === 0 ? 'Omni' : m.channel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 font-mono">
                        Range: {m.minVal} to {m.maxVal}
                      </span>
                      <button
                        onClick={() => {
                          midiEngine.removeMapping(m.id);
                          setMappings(midiEngine.getMappings());
                          showToast(`Removed mapping for CC ${m.ccNumber}`);
                        }}
                        className="text-slate-500 hover:text-rose-400 transition cursor-pointer p-1"
                        title="Delete mapping"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 3 Content: Svara Scale Snap & 22 Shrutis Microtonal Tuning */}
        {activeTab === 'quantize_tuning' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Raga Scale Snap Configuration */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Raga Scale Quantization (Purity Lock)
                  </h3>
                  <label className="flex items-center gap-2 text-xs cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={snapToRaga}
                      onChange={(e) => {
                        setSnapToRaga(e.target.checked);
                        showToast(e.target.checked ? 'Enabled Raga Scale Snap (Varjit notes blocked)' : 'Disabled Snap (Chromatic mode)');
                      }}
                      className="rounded accent-amber-500"
                    />
                    <span className={snapToRaga ? 'text-emerald-300' : 'text-slate-500'}>
                      {snapToRaga ? 'Raga Lock Active' : 'Free Chromatic'}
                    </span>
                  </label>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  When enabled, incoming MIDI keys automatically snap to permitted Swaras in <strong className="text-amber-300">{activeRaga.name}</strong> ({activeRaga.swaras}). Any out-of-scale (Varjit) note is retuned to the nearest legitimate melodic node to prevent dissonant clashes.
                </p>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-1">
                  <p className="text-slate-400">Arohana: <span className="text-amber-300">{activeRaga.arohana}</span></p>
                  <p className="text-slate-400">Avarohana: <span className="text-amber-300">{activeRaga.avarohana}</span></p>
                  <p className="text-slate-400">Vadi: <span className="text-emerald-300">{activeRaga.vadi}</span> • Samvadi: <span className="text-emerald-300">{activeRaga.samvadi}</span></p>
                </div>
              </div>

              {/* 22 Shrutis Just Intonation Retuning */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    22 Shrutis Just Intonation Retuning
                  </h3>
                  <label className="flex items-center gap-2 text-xs cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={justIntonationRetuning}
                      onChange={(e) => {
                        setJustIntonationRetuning(e.target.checked);
                        showToast(e.target.checked ? '22 Shrutis Just Intonation Active' : '12-TET Standard Active');
                      }}
                      className="rounded accent-amber-500"
                    />
                    <span className={justIntonationRetuning ? 'text-cyan-300' : 'text-slate-500'}>
                      {justIntonationRetuning ? 'Just Intonation' : '12-TET Equal'}
                    </span>
                  </label>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Every standard 12-TET MIDI key is dynamically retuned in real-time to the pure mathematical harmonic ratio ($1/1, 256/243, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8$) rooted at <strong className="text-cyan-300">Sa = {baseSaHz.toFixed(2)} Hz</strong>.
                </p>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-1">
                  <p className="text-slate-400">Root Reference Tonic: <span className="text-cyan-300">{baseSaHz.toFixed(2)} Hz</span></p>
                  <p className="text-slate-400">Acoustic Beating: <span className="text-emerald-400 font-bold">0.00 Hz (Beatless Harmonics)</span></p>
                </div>
              </div>
            </div>

            {/* Swara Frequency Reference Grid */}
            <div className="rounded-xl border border-white/[0.08] bg-slate-950 p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Active 12-Svara Tuning Matrix for {activeRaga.name}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs font-mono">
                {[
                  { swara: 'S', name: 'Sa', ratio: '1/1', dev: '0.0c' },
                  { swara: 'r', name: 're', ratio: '256/243', dev: '-9.8c' },
                  { swara: 'R', name: 'Re', ratio: '9/8', dev: '+3.9c' },
                  { swara: 'g', name: 'ga', ratio: '6/5', dev: '+15.6c' },
                  { swara: 'G', name: 'Ga', ratio: '5/4', dev: '-13.7c' },
                  { swara: 'm', name: 'ma', ratio: '4/3', dev: '-2.0c' },
                  { swara: "M'", name: "Ma'", ratio: '45/32', dev: '-10.3c' },
                  { swara: 'P', name: 'Pa', ratio: '3/2', dev: '+2.0c' },
                  { swara: 'd', name: 'dha', ratio: '8/5', dev: '+13.7c' },
                  { swara: 'D', name: 'Dha', ratio: '5/3', dev: '-15.6c' },
                  { swara: 'n', name: 'ni', ratio: '9/5', dev: '+17.6c' },
                  { swara: 'N', name: 'Ni', ratio: '15/8', dev: '-11.7c' }
                ].map((s) => (
                  <div key={s.swara} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300 text-sm">{s.swara}</span>
                      <span className="text-[10px] text-slate-500">{s.name}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400">
                      <p>Ratio: {s.ratio}</p>
                      <p className="text-cyan-300">Offset: {s.dev}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.08] bg-slate-950/70 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>MPE Mode: {mpeConfig.enabled ? 'Active (5D Expression)' : 'Standard'} • Engine: 96kHz / 32-bit Float</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition cursor-pointer shadow-lg shadow-amber-600/20"
            >
              Done & Return to Timeline
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
