export type TrackRole = 
  | 'lead_vocal'
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
  color?: string;
  swaraNotes?: { swara: string; pitchMidi: number; bar: number; duration: number }[];
  waveformPoints?: number[];
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
  hypersonicAir: boolean; // 20k-48k Hz
  somaticSub: boolean; // 10-20 Hz
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
}

export interface TransitionFXState {
  genre: 'Cinematic' | 'Sci-Fi' | 'Vedic' | 'Electronic' | 'Metal' | 'Pop' | 'Country' | 'Trap' | 'Horror' | 'Lo-Fi';
  type: 'riser' | 'sub_drop' | 'braam' | 'whoosh' | 'reverse_swell';
  bars: 1 | 2 | 4 | 8;
  targetBar: number;
  preDropSilence: boolean;
  saTuned: boolean;
}
