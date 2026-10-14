export type TrackRole = 
  | 'lead_vocal'
  | 'lead_melody'
  | 'vedic_chant'
  | 'choral_harmony'
  | 'voice_over'
  | 'drone'
  | 'solo_instrument'
  | 'percussion_tala'
  | 'modern_beats'
  | 'ambient_pad'
  | 'risers_drops';

export type AIModel = 
  | 'ace_step'
  | 'ace_studio'
  | 'yue_2'
  | 'minimax_3'
  | 'stable_audio_3'
  | 'vagdhenu'
  | 'soundfont_native';

export interface AudioTake {
  id: string;
  name: string;
  timestamp: string;
  durationSec: number;
  waveformUrl?: string;
  energyScore?: number;
  promptUsed?: string;
  contextAware: boolean;
}

export interface AudioClip {
  id: string;
  name: string;
  startBar: number;
  durationBars: number;
  fadeInBars?: number;
  fadeOutBars?: number;
  color?: string;
  swaraNotes?: { swara: string; pitchMidi: number; bar: number; duration: number }[];
  waveformPoints?: number[];
  audioBuffer?: AudioBuffer;
  audioUrl?: string;
}

export interface SpatialCoordinates {
  azimuth: number; // -180 to 180 degrees (0 = center front, 90 = right, -90 = left, 180/-180 = rear)
  elevation: number; // -90 to +90 degrees (0 = ear level, +90 = zenith/overhead, -90 = nadir/floor)
  distance: number; // 0.1 to 10 meters (radial distance from listener)
  binauralHrtf: boolean; // true for HRTF 3D spatialization, false for standard stereo pan
  spread: number; // 0 to 1 (source width / diffuseness)
}

export interface Track {
  id: string;
  name: string;
  role: TrackRole;
  model: AIModel;
  color: string;
  muted: boolean;
  soloed: boolean;
  volume: number; // 0 to 1
  pan: number; // -1 to 1
  busGroup: 'Vocals' | 'Acoustics' | 'Percussion' | 'Orchestral' | 'Cinematic FX';
  takes: AudioTake[];
  activeTakeIndex: number;
  clips: AudioClip[];
  activeInstrument?: string;
  hypersonicAir: boolean; // 20k-48k Hz
  somaticSub: boolean; // 10-20 Hz
  spatial?: SpatialCoordinates;
  plugins?: PluginInstance[];
  // OpenStudio-style AI Track fields
  isAITrack?: boolean;
  aiModelName?: string;
  aiWorkflow?: string;
  aiModelVersion?: string;
  aiPrompt?: string;
  aiLyrics?: string;
  aiStatusState?: 'ready' | 'generating' | 'loading' | 'error';
}

export type RasaType = 
  | 'Shringara'  // Love / Longing
  | 'Karuna'     // Pathos / Compassion
  | 'Veera'      // Heroism / Pride
  | 'Raudra'     // Fury / Destruction
  | 'Adbhuta'    // Wonder / Cosmic Awe
  | 'Shanta'     // Peace / Meditation
  | 'Hasya'      // Joy / Playfulness
  | 'Bhayanaka'  // Fear / Suspense
  | 'Bibhatsa';   // Chaos / Aversion

export type PraharType = 
  | 'Brahma Muhurta (3 AM - 6 AM)'
  | 'Morning (6 AM - 9 AM)'
  | 'Late Morning (9 AM - 12 PM)'
  | 'Afternoon (12 PM - 3 PM)'
  | 'Sunset / Sandhiprakash (6 PM - 9 PM)'
  | 'Night (9 PM - 12 AM)'
  | 'Late Night (12 AM - 3 AM)';

export interface Raga {
  id: string;
  name: string;
  tradition: 'Hindustani' | 'Carnatic' | string;
  thaatOrMelakarta: string;
  rasa: RasaType;
  prahar: string;
  westernMode: string;
  swaras: string; // e.g. "S R G M' P D N"
  arohana: string;
  avarohana: string;
  vadi: string;
  samvadi: string;
  pakad: string;
  description: string;
  keyCharacteristic: string;
}

export interface Tala {
  id: string;
  name: string;
  matras: number;
  divisions: string; // e.g. "4 + 4 + 4 + 4"
  vibhaags: number[];
  claps: { [matraIndex: number]: 'sam' | 'tali' | 'khali' };
  bols: string[];
}

export interface DirectorSceneState {
  rasa: RasaType;
  sceneTitle: string;
  arcType: 'ambient_flat' | 'slow_build' | 'epic_climax' | 'drop_reveal';
  vocalPreference: 'custom_voice_clip' | 'wordless_aalap' | 'sanskrit_mantra' | 'instrumental_only';
  customVoiceName?: string;
  voiceReinterpretation: {
    breathiness: number; // 0-100%
    raspGrit: number;    // 0-100%
    formantShift: number; // -12 to +12
    gamakaDepth: number;  // 0-100%
  };
  pacingBpm: number;
  isAlap?: boolean;
  aalapVowel?: 'aaa' | 'ooo' | 'hey' | 'mmm';
  aalapMovement?: 'vilambit' | 'meend_glides' | 'drut_taans';
}

export interface TransitionFXState {
  genre: 'Cinematic' | 'Sci-Fi' | 'Vedic' | 'Electronic' | 'Metal' | 'Pop' | 'Country' | 'Trap' | 'Horror' | 'Lo-Fi';
  type: 'riser' | 'sub_drop' | 'braam' | 'whoosh' | 'reverse_swell';
  bars: 1 | 2 | 4 | 8;
  targetBar: number;
  preDropSilence: boolean;
  saTuned: boolean;
}

export type MetronomeTimbre = 'sa-harmonic' | 'woodblock' | 'manjira';

export type VedicSvaraAccent = 'udatta' | 'anudatta' | 'svarita' | 'neutral';

export interface VedicSyllable {
  devanagari: string;
  iast: string;
  accent: VedicSvaraAccent;
  pitchOffsetCents?: number;
  durationMatras: number;
  isSchwaPreserved: boolean;
}

export interface VedicChantPhrase {
  id: string;
  title: string;
  source: string;
  chhandasMeter: 'Gayatri' | 'Anushtubh' | 'Trishtubh' | 'Jagati' | 'Custom';
  syllableCount: number;
  devanagariText: string;
  iastText: string;
  syllables: VedicSyllable[];
  translation: string;
  recommendedRaga: string;
}

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: 'connected' | 'disconnected';
  type: 'input' | 'output';
}

export interface MpeConfiguration {
  enabled: boolean;
  pitchBendRangeSemitones: number; // e.g. 48 for MPE, 2 for standard
  masterChannel: number; // 1 or 16
  pressureSensitivity: number; // 0.1 to 2.0
  timbreCc: number; // default 74
}

export interface MidiMapping {
  id: string;
  paramKey: string;
  trackId?: string;
  channel: number; // 0 = all channels, 1-16
  ccNumber: number; // 0-127
  minVal: number;
  maxVal: number;
  paramLabel: string;
  inverted?: boolean;
}

export interface MidiLiveTelemetry {
  lastEventType: 'noteon' | 'noteoff' | 'pitchbend' | 'aftertouch' | 'cc';
  channel: number;
  noteNumber?: number;
  noteName?: string;
  svaraName?: string;
  frequencyHz?: number;
  centDeviation?: number;
  velocity?: number;
  pitchBendCents?: number;
  pressure?: number;
  ccNumber?: number;
  ccValue?: number;
  timestamp: number;
}

export type PluginType = 'eq' | 'tape' | 'reverb' | 'sub_braam' | 'compressor';

export interface PluginInstance {
  id: string;
  type: PluginType;
  name: string;
  sanskritTitle: string;
  enabled: boolean;
  dryWet: number; // 0 to 1
  params: Record<string, any>;
  trackId?: string; // Track ID or 'master'
  slotIndex: number;
}

export type ClassicalMovementType = 
  | 'alap'          // Unmetered, contemplative raga exploration, zero percussion
  | 'jor'           // Steady pulse emerges, melodic pulse without drums
  | 'jhala'         // Rapid rhythmic strumming, chikari acceleration
  | 'vilambit_gat'  // Slow tempo formal composition in Tala with Tabla entry
  | 'madhya_gat'    // Medium tempo composition, taans and layakari
  | 'drut_gat'      // Fast tempo composition, energetic variations
  | 'jhala_climax'  // Final high-speed climax
  | 'tihai';        // Triple polyrhythmic cadence resolving on Sam

export type WesternStructureType =
  | 'intro'
  | 'verse'
  | 'pre_chorus'
  | 'chorus'
  | 'bridge'
  | 'breakdown'
  | 'drop'
  | 'outro';

export interface ArrangementSection {
  id: string;
  name: string;
  sanskritName: string;
  movementType: ClassicalMovementType;
  westernEquivalent: WesternStructureType;
  startBar: number;
  durationBars: number;
  color: string;
  targetBpm: number;
  tempoRamp?: 'none' | 'linear_accel' | 'exp_accel';
  activeRoles: TrackRole[]; // Which tracks are active in this section
  description: string;
  energyLevel: number; // 1 to 5
}

export interface ArrangementPreset {
  id: string;
  name: string;
  sanskritTitle: string;
  description: string;
  totalBars: number;
  suggestedBpm: number;
  sections: Omit<ArrangementSection, 'id'>[];
}

