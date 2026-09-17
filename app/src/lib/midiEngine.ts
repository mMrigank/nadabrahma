// Nādabrahma Hardware MIDI & MPE Microtonal Pressure Engine
// Supporting Web MIDI API, 5D MPE Touch, 22 Shrutis Just Intonation Retuning,
// Raga Scale Quantization, MIDI Learn, and Hardware Surface Templates

import { MidiDevice, MpeConfiguration, MidiMapping, MidiLiveTelemetry, Raga, AudioClip } from '../types/daw';
import { TWENTY_TWO_SHRUTIS } from './shrutiData';
import { audioEngine } from './webAudioEngine';

export interface SvaraNoteInfo {
  midiNote: number;
  svara: string;
  svaraName: string;
  frequencyHz: number;
  centDeviation: number;
  isVarjit: boolean;
  octave: number;
  westernNote: string;
}

export interface HardwareControllerPreset {
  id: string;
  name: string;
  manufacturer: string;
  isMpe: boolean;
  description: string;
  defaultMappings: MidiMapping[];
}

// 12 Semitone Svara Template
const SWARA_LOOKUP: { [semitone: number]: { svara: string; name: string; shrutiKey: string; altShrutiKey?: string } } = {
  0: { svara: 'S', name: 'Shadja (Sa)', shrutiKey: 'S' },
  1: { svara: 'r', name: 'Komal Rishabh (re)', shrutiKey: 'r2', altShrutiKey: 'r1' },
  2: { svara: 'R', name: 'Shuddha Rishabh (Re)', shrutiKey: 'R2', altShrutiKey: 'R1' },
  3: { svara: 'g', name: 'Komal Gandhar (ga)', shrutiKey: 'g2', altShrutiKey: 'g1' },
  4: { svara: 'G', name: 'Shuddha Gandhar (Ga)', shrutiKey: 'G2', altShrutiKey: 'G1' },
  5: { svara: 'm', name: 'Shuddha Madhyam (ma)', shrutiKey: 'M1', altShrutiKey: 'M2' },
  6: { svara: "M'", name: 'Tīvra Madhyam (Ma\')', shrutiKey: 'm2', altShrutiKey: 'm1' },
  7: { svara: 'P', name: 'Pancham (Pa)', shrutiKey: 'P' },
  8: { svara: 'd', name: 'Komal Dhaivat (dha)', shrutiKey: 'd2', altShrutiKey: 'd1' },
  9: { svara: 'D', name: 'Shuddha Dhaivat (Dha)', shrutiKey: 'D2', altShrutiKey: 'D1' },
  10: { svara: 'n', name: 'Komal Nishad (ni)', shrutiKey: 'n2', altShrutiKey: 'n1' },
  11: { svara: 'N', name: 'Shuddha Nishad (Ni)', shrutiKey: 'N2', altShrutiKey: 'N1' }
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const HARDWARE_PRESETS: HardwareControllerPreset[] = [
  {
    id: 'akai-mpk-mini',
    name: 'Akai MPK Mini Mk3 / Plus',
    manufacturer: 'Akai Professional',
    isMpe: false,
    description: 'Compact 25-key keyboard with 8 endless rotary knobs, modulation joystick, and dynamic drum pads.',
    defaultMappings: [
      { id: 'akai-k1', paramKey: 'trackVolume', trackId: 'tr-1', channel: 0, ccNumber: 70, minVal: 0, maxVal: 1, paramLabel: 'Track 1 Volume' },
      { id: 'akai-k2', paramKey: 'trackVolume', trackId: 'tr-2', channel: 0, ccNumber: 71, minVal: 0, maxVal: 1, paramLabel: 'Track 2 Volume' },
      { id: 'akai-k3', paramKey: 'trackVolume', trackId: 'tr-3', channel: 0, ccNumber: 72, minVal: 0, maxVal: 1, paramLabel: 'Track 3 Volume' },
      { id: 'akai-k4', paramKey: 'trackVolume', trackId: 'tr-4', channel: 0, ccNumber: 73, minVal: 0, maxVal: 1, paramLabel: 'Track 4 Volume' },
      { id: 'akai-k5', paramKey: 'baseSaHz', channel: 0, ccNumber: 74, minVal: 110, maxVal: 240, paramLabel: 'Moveable Sa Hz' },
      { id: 'akai-k6', paramKey: 'bpm', channel: 0, ccNumber: 75, minVal: 40, maxVal: 240, paramLabel: 'Tempo (BPM)' },
      { id: 'akai-k7', paramKey: 'spatialAzimuth', channel: 0, ccNumber: 76, minVal: -180, maxVal: 180, paramLabel: '3D Spatial Azimuth' },
      { id: 'akai-k8', paramKey: 'masterVolume', channel: 0, ccNumber: 77, minVal: 0, maxVal: 1, paramLabel: 'Master Volume' }
    ]
  },
  {
    id: 'roli-seaboard-mpe',
    name: 'ROLI Seaboard / RISE 2 (MPE)',
    manufacturer: 'ROLI',
    isMpe: true,
    description: '5D Touch expressive MPE silicone keybed for fluid continuous Meend glides, vibratos, and polyphonic pressure.',
    defaultMappings: [
      { id: 'roli-slide', paramKey: 'hypersonicAir', channel: 0, ccNumber: 74, minVal: 0, maxVal: 1, paramLabel: 'Hypersonic Air Injection (Y Slide)' },
      { id: 'roli-press', paramKey: 'somaticSub', channel: 0, ccNumber: 11, minVal: 0, maxVal: 1, paramLabel: 'Somatic Sub Resonance (Press)' },
      { id: 'roli-fader1', paramKey: 'masterVolume', channel: 0, ccNumber: 1, minVal: 0, maxVal: 1, paramLabel: 'Expression Master' }
    ]
  },
  {
    id: 'novation-launchkey',
    name: 'Novation Launchkey / SL Series',
    manufacturer: 'Novation',
    isMpe: false,
    description: 'Full-featured studio controller with 8 channel faders, 8 rotary encoders, transport buttons, and velocity pads.',
    defaultMappings: [
      { id: 'nov-f1', paramKey: 'trackVolume', trackId: 'tr-1', channel: 0, ccNumber: 21, minVal: 0, maxVal: 1, paramLabel: 'Track 1 Fader' },
      { id: 'nov-f2', paramKey: 'trackVolume', trackId: 'tr-2', channel: 0, ccNumber: 22, minVal: 0, maxVal: 1, paramLabel: 'Track 2 Fader' },
      { id: 'nov-f3', paramKey: 'trackVolume', trackId: 'tr-3', channel: 0, ccNumber: 23, minVal: 0, maxVal: 1, paramLabel: 'Track 3 Fader' },
      { id: 'nov-f4', paramKey: 'trackVolume', trackId: 'tr-4', channel: 0, ccNumber: 24, minVal: 0, maxVal: 1, paramLabel: 'Track 4 Fader' },
      { id: 'nov-k1', paramKey: 'trackPan', trackId: 'tr-1', channel: 0, ccNumber: 31, minVal: -1, maxVal: 1, paramLabel: 'Track 1 Pan' },
      { id: 'nov-k2', paramKey: 'trackPan', trackId: 'tr-2', channel: 0, ccNumber: 32, minVal: -1, maxVal: 1, paramLabel: 'Track 2 Pan' },
      { id: 'nov-k3', paramKey: 'trackPan', trackId: 'tr-3', channel: 0, ccNumber: 33, minVal: -1, maxVal: 1, paramLabel: 'Track 3 Pan' },
      { id: 'nov-k4', paramKey: 'trackPan', trackId: 'tr-4', channel: 0, ccNumber: 34, minVal: -1, maxVal: 1, paramLabel: 'Track 4 Pan' }
    ]
  },
  {
    id: 'arturia-keylab',
    name: 'Arturia KeyLab / MiniLab 3',
    manufacturer: 'Arturia',
    isMpe: false,
    description: 'Tactile keyboard controller with clickable encoders, responsive faders, and pitch/mod touch strips.',
    defaultMappings: [
      { id: 'art-enc1', paramKey: 'baseSaHz', channel: 0, ccNumber: 86, minVal: 110, maxVal: 240, paramLabel: 'Adhara Shadja (Sa Hz)' },
      { id: 'art-enc2', paramKey: 'bpm', channel: 0, ccNumber: 87, minVal: 40, maxVal: 220, paramLabel: 'Tala Tempo (BPM)' },
      { id: 'art-f1', paramKey: 'masterVolume', channel: 0, ccNumber: 73, minVal: 0, maxVal: 1, paramLabel: 'Master Volume Fader' }
    ]
  },
  {
    id: 'linnstrument-mpe',
    name: 'LinnStrument Expressive MPE Grid',
    manufacturer: 'Roger Linn Design',
    isMpe: true,
    description: 'Legendary multi-dimensional grid controller with 3D touch (continuous X-axis pitch slide, Y-axis CC74, Z-axis pressure).',
    defaultMappings: [
      { id: 'linn-y', paramKey: 'gamakaDepth', channel: 0, ccNumber: 74, minVal: 0, maxVal: 100, paramLabel: 'Gamaka Oscillation Depth (Y)' },
      { id: 'linn-z', paramKey: 'somaticSub', channel: 0, ccNumber: 11, minVal: 0, maxVal: 1, paramLabel: 'Somatic Sub Infrasound (Z Pressure)' }
    ]
  },
  {
    id: 'korg-nanokontrol',
    name: 'Korg nanoKONTROL 2',
    manufacturer: 'Korg',
    isMpe: false,
    description: 'Dedicated 8-channel slim control surface with faders, rotary knobs, solo/mute/record switches, and transport strip.',
    defaultMappings: [
      { id: 'korg-f1', paramKey: 'trackVolume', trackId: 'tr-1', channel: 0, ccNumber: 0, minVal: 0, maxVal: 1, paramLabel: 'Ch 1 Volume' },
      { id: 'korg-f2', paramKey: 'trackVolume', trackId: 'tr-2', channel: 0, ccNumber: 1, minVal: 0, maxVal: 1, paramLabel: 'Ch 2 Volume' },
      { id: 'korg-f3', paramKey: 'trackVolume', trackId: 'tr-3', channel: 0, ccNumber: 2, minVal: 0, maxVal: 1, paramLabel: 'Ch 3 Volume' },
      { id: 'korg-f4', paramKey: 'trackVolume', trackId: 'tr-4', channel: 0, ccNumber: 3, minVal: 0, maxVal: 1, paramLabel: 'Ch 4 Volume' },
      { id: 'korg-k1', paramKey: 'trackPan', trackId: 'tr-1', channel: 0, ccNumber: 16, minVal: -1, maxVal: 1, paramLabel: 'Ch 1 Pan' },
      { id: 'korg-k2', paramKey: 'trackPan', trackId: 'tr-2', channel: 0, ccNumber: 17, minVal: -1, maxVal: 1, paramLabel: 'Ch 2 Pan' }
    ]
  }
];

class MidiEngine {
  private midiAccess: any = null;
  private isSupported: boolean = false;
  private devices: MidiDevice[] = [];
  private mpeConfig: MpeConfiguration = {
    enabled: true,
    pitchBendRangeSemitones: 48,
    masterChannel: 1,
    pressureSensitivity: 1.0,
    timbreCc: 74
  };
  private mappings: MidiMapping[] = [...HARDWARE_PRESETS[0].defaultMappings];
  private learningParam: { paramKey: string; trackId?: string; paramLabel: string } | null = null;
  
  // Active MPE Voices tracker: key = noteNumber or `${channel}-${noteNumber}`
  private activeVoices: Map<string, { note: number; freqHz: number; velocity: number; svara: string; channel: number }> = new Map();

  // Recording State
  private isRecording: boolean = false;
  private recordingTrackId: string | null = null;
  private recordedNotes: { swara: string; pitchMidi: number; bar: number; duration: number }[] = [];
  private recordingStartTime: number = 0;

  // Listeners
  private telemetryListeners: Set<(t: MidiLiveTelemetry) => void> = new Set();
  private deviceListeners: Set<(devices: MidiDevice[]) => void> = new Set();
  private paramChangeListeners: Set<(paramKey: string, value: number, trackId?: string) => void> = new Set();
  private learnStatusListeners: Set<(isLearning: boolean, label?: string) => void> = new Set();

  constructor() {
    this.isSupported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
  }

  // Initialize Web MIDI API
  public async init(): Promise<boolean> {
    if (!this.isSupported) {
      this.populateFallbackVirtualDevice();
      return false;
    }

    try {
      const midiAccess = await (navigator as any).requestMIDIAccess({ sysex: false });
      this.midiAccess = midiAccess;
      this.refreshDevices();

      midiAccess.onstatechange = () => {
        this.refreshDevices();
      };

      // Connect input message listeners
      const inputs = midiAccess.inputs.values();
      for (const input of inputs) {
        input.onmidimessage = (event: any) => this.handleMidiMessage(event);
      }

      return true;
    } catch (err) {
      console.warn('Web MIDI Access request failed or was dismissed. Enabling Virtual MPE Controller.', err);
      this.populateFallbackVirtualDevice();
      return false;
    }
  }

  private populateFallbackVirtualDevice() {
    this.devices = [
      {
        id: 'virtual-mpe-core',
        name: 'Nādabrahma Virtual MPE Playing Surface',
        manufacturer: 'Apple Silicon MLX Core',
        state: 'connected',
        type: 'input'
      }
    ];
    this.notifyDevices();
  }

  private refreshDevices() {
    if (!this.midiAccess) return;
    const newDevices: MidiDevice[] = [];

    const inputs = this.midiAccess.inputs.values();
    for (const input of inputs) {
      newDevices.push({
        id: input.id,
        name: input.name || `MIDI Input (${input.id})`,
        manufacturer: input.manufacturer || 'Generic Hardware',
        state: input.state === 'connected' ? 'connected' : 'disconnected',
        type: 'input'
      });
      // Re-attach message handler
      input.onmidimessage = (event: any) => this.handleMidiMessage(event);
    }

    // Always include virtual controller
    newDevices.push({
      id: 'virtual-mpe-core',
      name: 'Nādabrahma Virtual MPE Playing Surface',
      manufacturer: 'Apple Silicon MLX Core',
      state: 'connected',
      type: 'input'
    });

    this.devices = newDevices;
    this.notifyDevices();
  }

  // Low-level MIDI Packet Parser
  private handleMidiMessage(event: any) {
    const data = event.data;
    if (!data || data.length < 2) return;

    const statusByte = data[0];
    const messageType = statusByte >> 4;
    const channel = (statusByte & 0x0f) + 1; // 1-indexed (1-16)

    const data1 = data[1];
    const data2 = data.length > 2 ? data[2] : 0;

    switch (messageType) {
      case 0x9: { // Note On (or Note Off if velocity is 0)
        const note = data1;
        const velocity = data2 / 127;
        if (velocity > 0) {
          this.processNoteOn(channel, note, velocity);
        } else {
          this.processNoteOff(channel, note);
        }
        break;
      }
      case 0x8: { // Note Off
        const note = data1;
        this.processNoteOff(channel, note);
        break;
      }
      case 0xe: { // Pitch Bend (14-bit)
        const bendRaw = (data2 << 7) | data1; // 0 to 16383, 8192 is center
        this.processPitchBend(channel, bendRaw);
        break;
      }
      case 0xd: { // Channel Pressure (Aftertouch)
        const pressure = data1 / 127;
        this.processChannelPressure(channel, pressure);
        break;
      }
      case 0xb: { // Control Change (CC)
        const ccNum = data1;
        const ccVal = data2 / 127; // 0 to 1
        this.processControlChange(channel, ccNum, ccVal);
        break;
      }
    }
  }

  // Note On Processor
  public processNoteOn(
    channel: number,
    note: number,
    velocity: number,
    baseSaHz: number = 138.59,
    activeRaga?: Raga,
    snapToRaga: boolean = true
  ) {
    const svaraInfo = this.midiNoteToSwara(note, baseSaHz, activeRaga, snapToRaga);
    const voiceKey = `${channel}-${note}`;

    this.activeVoices.set(voiceKey, {
      note,
      freqHz: svaraInfo.frequencyHz,
      velocity,
      svara: svaraInfo.svara,
      channel
    });

    // Send to Web Audio Engine for native 96kHz synthesis
    audioEngine.playMpeNoteOn(voiceKey, svaraInfo.frequencyHz, velocity, svaraInfo.svara);

    // Record if timeline recording is active
    if (this.isRecording) {
      const elapsedSec = (Date.now() - this.recordingStartTime) / 1000;
      const approxBar = 1 + Math.max(0, Math.floor(elapsedSec / 2));
      this.recordedNotes.push({
        swara: svaraInfo.svara,
        pitchMidi: note,
        bar: approxBar,
        duration: 1
      });
    }

    this.notifyTelemetry({
      lastEventType: 'noteon',
      channel,
      noteNumber: note,
      noteName: svaraInfo.westernNote,
      svaraName: `${svaraInfo.svara} (${svaraInfo.svaraName})`,
      frequencyHz: Math.round(svaraInfo.frequencyHz * 100) / 100,
      centDeviation: Math.round(svaraInfo.centDeviation * 10) / 10,
      velocity: Math.round(velocity * 100) / 100,
      timestamp: Date.now()
    });
  }

  // Note Off Processor
  public processNoteOff(channel: number, note: number) {
    const voiceKey = `${channel}-${note}`;
    const voice = this.activeVoices.get(voiceKey);
    if (voice) {
      audioEngine.playMpeNoteOff(voiceKey);
      this.activeVoices.delete(voiceKey);
    }

    this.notifyTelemetry({
      lastEventType: 'noteoff',
      channel,
      noteNumber: note,
      timestamp: Date.now()
    });
  }

  // Pitch Bend Processor (Continuous Meend / Gamaka glide)
  public processPitchBend(channel: number, bendRaw: number) {
    const normBend = (bendRaw - 8192) / 8192; // -1.0 to +1.0
    const semitoneBend = normBend * this.mpeConfig.pitchBendRangeSemitones;
    const cents = normBend * (this.mpeConfig.pitchBendRangeSemitones * 100);

    // If MPE is enabled, update notes on this specific MPE channel
    for (const [voiceKey, voice] of this.activeVoices.entries()) {
      if (!this.mpeConfig.enabled || voice.channel === channel || channel === this.mpeConfig.masterChannel) {
        // Continuous exponential frequency glide
        const bentFreq = voice.freqHz * Math.pow(2, semitoneBend / 12);
        audioEngine.updateMpePitchBend(voiceKey, bentFreq);
      }
    }

    this.notifyTelemetry({
      lastEventType: 'pitchbend',
      channel,
      pitchBendCents: Math.round(cents),
      timestamp: Date.now()
    });
  }

  // Channel Pressure Processor (Somatic sub & harmonic overtone resonance)
  public processChannelPressure(channel: number, pressure: number) {
    const scaledPressure = Math.min(1.0, pressure * this.mpeConfig.pressureSensitivity);

    for (const [voiceKey, voice] of this.activeVoices.entries()) {
      if (!this.mpeConfig.enabled || voice.channel === channel || channel === this.mpeConfig.masterChannel) {
        audioEngine.updateMpePressure(voiceKey, scaledPressure);
      }
    }

    this.notifyTelemetry({
      lastEventType: 'aftertouch',
      channel,
      pressure: Math.round(scaledPressure * 100) / 100,
      timestamp: Date.now()
    });
  }

  // Control Change (CC) Processor (Timbre Slide / CC74, MIDI Learn, and Knobs)
  public processControlChange(channel: number, ccNum: number, ccVal: number) {
    // 1. Check MIDI Learn mode
    if (this.learningParam) {
      const newMapping: MidiMapping = {
        id: `map-${Date.now()}`,
        paramKey: this.learningParam.paramKey,
        trackId: this.learningParam.trackId,
        channel: 0, // All channels by default
        ccNumber: ccNum,
        minVal: 0,
        maxVal: 1,
        paramLabel: this.learningParam.paramLabel
      };

      // Remove existing mapping for same param if any
      this.mappings = this.mappings.filter(m => m.paramKey !== this.learningParam?.paramKey);
      this.mappings.push(newMapping);

      this.learningParam = null;
      this.notifyLearnStatus(false);
      return;
    }

    // 2. Check MPE Slide (CC74)
    if (this.mpeConfig.enabled && ccNum === this.mpeConfig.timbreCc) {
      for (const [voiceKey, voice] of this.activeVoices.entries()) {
        if (voice.channel === channel || channel === this.mpeConfig.masterChannel) {
          audioEngine.updateMpeSlide(voiceKey, ccVal);
        }
      }
    }

    // 3. Check Mapped CCs
    const matched = this.mappings.filter(m => m.ccNumber === ccNum && (m.channel === 0 || m.channel === channel));
    for (const map of matched) {
      const scaledVal = map.minVal + ccVal * (map.maxVal - map.minVal);
      this.notifyParamChange(map.paramKey, scaledVal, map.trackId);
    }

    this.notifyTelemetry({
      lastEventType: 'cc',
      channel,
      ccNumber: ccNum,
      ccValue: Math.round(ccVal * 127),
      timestamp: Date.now()
    });
  }

  // Svara & 22 Shrutis Math Calculator
  public midiNoteToSwara(
    midiNote: number,
    baseSaHz: number = 138.59,
    activeRaga?: Raga,
    snapToRaga: boolean = true
  ): SvaraNoteInfo {
    // Standard middle C (MIDI 60)
    const noteName = NOTE_NAMES[midiNote % 12];
    const octave = Math.floor(midiNote / 12) - 1;
    const westernNote = `${noteName}${octave}`;

    // Compute distance in semitones from Adhara Shadja (Sa)
    // Assume reference Sa is C#3 (MIDI 49) or C3 (MIDI 48) based on baseSaHz
    const estimatedSaMidi = 48 + Math.round(12 * Math.log2(baseSaHz / 130.81));
    let semitoneOffset = (midiNote - estimatedSaMidi) % 12;
    if (semitoneOffset < 0) semitoneOffset += 12;

    const octaveShift = Math.floor((midiNote - estimatedSaMidi) / 12);
    const swaraDef = SWARA_LOOKUP[semitoneOffset] || SWARA_LOOKUP[0];

    // Check if Swara is in Raga
    let isVarjit = false;
    if (activeRaga && activeRaga.swaras) {
      // If Raga swaras string doesn't contain this swara abbreviation
      const ragaSwaras = activeRaga.swaras.replace(/['ˈ\s]/g, '');
      const svaraSimple = swaraDef.svara.replace("'", "");
      isVarjit = !ragaSwaras.includes(svaraSimple);
    }

    // Find 22 Shrutis Just Intonation ratio
    const matchedShruti = TWENTY_TWO_SHRUTIS.find(s => s.key === swaraDef.shrutiKey) || TWENTY_TWO_SHRUTIS[0];
    const justRatio = matchedShruti.ratioValue;

    // Compute exact frequency: f = f_Sa * 2^(octave) * ratio
    const frequencyHz = baseSaHz * Math.pow(2, octaveShift) * justRatio;

    return {
      midiNote,
      svara: swaraDef.svara,
      svaraName: swaraDef.name,
      frequencyHz,
      centDeviation: matchedShruti.centDeviation,
      isVarjit,
      octave: octaveShift,
      westernNote
    };
  }

  // Virtual Performance Trigger Hooks (for On-Screen MPE Keyboard)
  public triggerVirtualNoteOn(
    note: number,
    velocity: number = 0.85,
    pressure: number = 0.5,
    slideY: number = 0.5,
    baseSaHz: number = 138.59,
    activeRaga?: Raga,
    snapToRaga: boolean = true
  ) {
    this.processNoteOn(2, note, velocity, baseSaHz, activeRaga, snapToRaga);
    this.processChannelPressure(2, pressure);
    this.processControlChange(2, 74, slideY);
  }

  public triggerVirtualPitchBend(note: number, bendNorm: number) {
    const bendRaw = Math.round(8192 + bendNorm * 8192);
    this.processPitchBend(2, bendRaw);
  }

  public triggerVirtualPressure(note: number, pressure: number) {
    this.processChannelPressure(2, pressure);
  }

  public triggerVirtualSlide(note: number, slideY: number) {
    this.processControlChange(2, 74, slideY);
  }

  public triggerVirtualNoteOff(note: number) {
    this.processNoteOff(2, note);
  }

  // MIDI Learn API
  public armMidiLearn(paramKey: string, trackId?: string, paramLabel: string = 'Parameter') {
    this.learningParam = { paramKey, trackId, paramLabel };
    this.notifyLearnStatus(true, paramLabel);
  }

  public disarmMidiLearn() {
    this.learningParam = null;
    this.notifyLearnStatus(false);
  }

  public getIsLearning(): boolean {
    return this.learningParam !== null;
  }

  public getLearningParamLabel(): string | undefined {
    return this.learningParam?.paramLabel;
  }

  public applyHardwarePreset(presetId: string) {
    const preset = HARDWARE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    this.mappings = [...preset.defaultMappings];
    if (preset.isMpe) {
      this.mpeConfig.enabled = true;
      this.mpeConfig.pitchBendRangeSemitones = 48;
    }
  }

  // Timeline Recording API
  public startRecording(trackId: string) {
    this.isRecording = true;
    this.recordingTrackId = trackId;
    this.recordedNotes = [];
    this.recordingStartTime = Date.now();
  }

  public stopRecording(): { trackId: string; clip: AudioClip } | null {
    if (!this.isRecording || !this.recordingTrackId) return null;
    const trackId = this.recordingTrackId;
    this.isRecording = false;
    this.recordingTrackId = null;

    if (this.recordedNotes.length === 0) return null;

    const clip: AudioClip = {
      id: `clip-midi-${Date.now()}`,
      name: `MIDI Take (${this.recordedNotes.length} Swaras)`,
      startBar: 1,
      durationBars: Math.max(4, Math.ceil(this.recordedNotes.length / 4)),
      color: '#10b981',
      swaraNotes: this.recordedNotes
    };

    return { trackId, clip };
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  // Mappings & Device Accessors
  public getDevices(): MidiDevice[] {
    return this.devices;
  }

  public getMpeConfig(): MpeConfiguration {
    return { ...this.mpeConfig };
  }

  public updateMpeConfig(config: Partial<MpeConfiguration>) {
    this.mpeConfig = { ...this.mpeConfig, ...config };
  }

  public getMappings(): MidiMapping[] {
    return [...this.mappings];
  }

  public removeMapping(id: string) {
    this.mappings = this.mappings.filter(m => m.id !== id);
  }

  // Event Subscription methods
  public onTelemetry(cb: (t: MidiLiveTelemetry) => void) {
    this.telemetryListeners.add(cb);
    return () => this.telemetryListeners.delete(cb);
  }

  public onDevices(cb: (devices: MidiDevice[]) => void) {
    this.deviceListeners.add(cb);
    cb(this.devices);
    return () => this.deviceListeners.delete(cb);
  }

  public onParamChange(cb: (paramKey: string, value: number, trackId?: string) => void) {
    this.paramChangeListeners.add(cb);
    return () => this.paramChangeListeners.delete(cb);
  }

  public onLearnStatus(cb: (isLearning: boolean, label?: string) => void) {
    this.learnStatusListeners.add(cb);
    return () => this.learnStatusListeners.delete(cb);
  }

  private notifyTelemetry(t: MidiLiveTelemetry) {
    for (const cb of this.telemetryListeners) cb(t);
  }

  private notifyDevices() {
    for (const cb of this.deviceListeners) cb(this.devices);
  }

  private notifyParamChange(paramKey: string, value: number, trackId?: string) {
    for (const cb of this.paramChangeListeners) cb(paramKey, value, trackId);
  }

  private notifyLearnStatus(isLearning: boolean, label?: string) {
    for (const cb of this.learnStatusListeners) cb(isLearning, label);
  }
}

export const midiEngine = new MidiEngine();
