import { Raga, Tala, AIModel, Track } from '../types/daw';
import { hzToMidiWithCents } from './ragaEngine';

export interface DualConditionedPrompt {
  model: AIModel;
  trackId: string;
  trackName: string;
  ragaName: string;
  westernMode: string;
  baseSaHz: number;
  saPitchName: string;
  talaName: string;
  bpm: number;
  rasa: string;
  formattedPrompt: string;
  acousticTokens: string[];
  musicologyDirectives: string[];
}

/**
 * Maps Ragas to their exact Western harmonic modal and chordal representations
 */
export const RAGA_TO_WESTERN_MAP: Record<string, {
  westernMode: string;
  chordAnchor: string;
  modalDegrees: string;
  characteristicInterval: string;
  suggestedAcousticTimbre: string;
}> = {
  yaman: {
    westernMode: 'Lydian Mode',
    chordAnchor: 'Maj7(#11)',
    modalDegrees: '1 - 2 - 3 - #4 - 5 - 6 - 7',
    characteristicInterval: 'Raised 4th (Tivra Ma / #11) with major 3rd and 7th',
    suggestedAcousticTimbre: 'Luminous acoustic string resonance with shimmering high air'
  },
  hansadhwani: {
    westernMode: 'Major Pentatonic (with Maj 7th)',
    chordAnchor: 'Maj9(no 4th)',
    modalDegrees: '1 - 2 - 3 - 5 - 7',
    characteristicInterval: 'Omission of 4th and 6th; swan-like leap Ga to Pa',
    suggestedAcousticTimbre: 'Bright, auspicious brass-like flute and bell harmonics'
  },
  darbari: {
    westernMode: 'Dorian / Natural Minor (Sunken 3rd & 6th)',
    chordAnchor: 'm7(b13) with deep pedal drone',
    modalDegrees: '1 - 2 - b3 - 4 - 5 - b6 - b7',
    characteristicInterval: 'Slow microtonal oscillation (andolan) on flat 3rd and flat 6th',
    suggestedAcousticTimbre: 'Majestic, solemn bowed strings with low-frequency somatic resonance'
  },
  bhairavi: {
    westernMode: 'Phrygian Mode',
    chordAnchor: 'm7(b9)',
    modalDegrees: '1 - b2 - b3 - 4 - 5 - b6 - b7',
    characteristicInterval: 'Minor 2nd (Komal Re) coupled with pure 4th and minor 7th',
    suggestedAcousticTimbre: 'Devotional, tender vocal pathos with subtle micro-bends'
  },
  bhoopali: {
    westernMode: 'Major Pentatonic',
    chordAnchor: '6/9 chord',
    modalDegrees: '1 - 2 - 3 - 5 - 6',
    characteristicInterval: 'Omission of 4th and 7th; wide sweeping meends Dha to Ga',
    suggestedAcousticTimbre: 'Peaceful acoustic bamboo flute and warm sandalwood strings'
  },
  malkauns: {
    westernMode: 'Minor Pentatonic (no 2nd & 5th)',
    chordAnchor: 'm7(add11, b13)',
    modalDegrees: '1 - b3 - 4 - b6 - b7',
    characteristicInterval: 'Absence of fifth (Pa); magnetic pull toward resonant fourth (Ma)',
    suggestedAcousticTimbre: 'Hypnotic nocturnal trance with deep sub-harmonic weight'
  },
  durga: {
    westernMode: 'Suspended Pentatonic',
    chordAnchor: 'sus2 / sus4 with Maj 6th',
    modalDegrees: '1 - 2 - 4 - 5 - 6',
    characteristicInterval: 'Omission of 3rd and 7th; bold D-M-P melodic oscillation',
    suggestedAcousticTimbre: 'Heroic resonant percussion and triumphant string plucks'
  },
  marwa: {
    westernMode: 'Lydian b2 (no 5th)',
    chordAnchor: 'Maj7(#11, b9)',
    modalDegrees: '1 - b2 - 3 - #4 - 6 - 7',
    characteristicInterval: 'Clash between Komal Re and Tivra Ma without stabilizing fifth',
    suggestedAcousticTimbre: 'Tense sunset twilight yearning with existential harmonic edge'
  },
  bhairav: {
    westernMode: 'Double Harmonic Major (Byzantine Mode)',
    chordAnchor: 'Maj7(b9, b13)',
    modalDegrees: '1 - b2 - 3 - 4 - 5 - b6 - 7',
    characteristicInterval: 'Two augmented 2nds with wide oscillating andolan on b2 and b6',
    suggestedAcousticTimbre: 'Sacred temple morning brass, austere drone, and soaring devotional voice'
  },
  todi: {
    westernMode: 'Harmonic Minor #4 (Ukrainian Dorian / Gypsy Minor)',
    chordAnchor: 'm(Maj7, #11, b9)',
    modalDegrees: '1 - b2 - b3 - #4 - 5 - b6 - 7',
    characteristicInterval: 'Poignant clash of flat 2nd, flat 3rd, and raised 4th (Tivra Ma)',
    suggestedAcousticTimbre: 'Heartbreaking bowed sarangi and weeping bamboo bansuri'
  },
  kafi: {
    westernMode: 'Dorian Mode',
    chordAnchor: 'm7 / m9',
    modalDegrees: '1 - 2 - b3 - 4 - 5 - 6 - b7',
    characteristicInterval: 'Natural 6th with minor 3rd and 7th; lively folk swing',
    suggestedAcousticTimbre: 'Earthy folk percussion, resonant sarod, and vibrant monsoon flutes'
  },
  bageshri: {
    westernMode: 'Dorian Hexatonic (no 5th in ascent)',
    chordAnchor: 'm7(11)',
    modalDegrees: '1 - 2 - b3 - 4 - 6 - b7',
    characteristicInterval: 'Sweet yearning meends gliding from Dhaivat down to Madhyam',
    suggestedAcousticTimbre: 'Intimate midnight sitar and deep contemplative vocal bends'
  }
};

/**
 * Builds the comprehensive dual-conditioned prompt (ragaBridge) tailored specifically for each AI model
 */
export function buildDualConditionedPrompt(
  model: AIModel,
  track: Track,
  raga: Raga,
  tala: Tala,
  baseSaHz: number,
  customLyrics?: string
): DualConditionedPrompt {
  const saInfo = hzToMidiWithCents(baseSaHz);
  const ragaId = raga.id.toLowerCase();
  const westernInfo = RAGA_TO_WESTERN_MAP[ragaId] || {
    westernMode: raga.westernMode,
    chordAnchor: 'Modal Tonic Drone',
    modalDegrees: '1 - 2 - 3 - 4 - 5 - 6 - 7',
    characteristicInterval: 'Raga melodic contours',
    suggestedAcousticTimbre: 'Acoustic Indian Classical'
  };

  const acousticTokens: string[] = [];
  if (track.hypersonicAir) acousticTokens.push('Hypersonic Air (20kHz-48kHz Sheen)');
  if (track.somaticSub) acousticTokens.push('Somatic Infrasound (10Hz-20Hz Pressure)');
  acousticTokens.push(`96kHz/32-bit Float`);
  acousticTokens.push(`Moveable Sa: ${baseSaHz.toFixed(2)}Hz (${saInfo.noteName})`);
  acousticTokens.push(`22 Shrutis Just Intonation`);

  const musicologyDirectives: string[] = [
    `Raga: ${raga.name} (${raga.tradition})`,
    `Western Equivalent: ${westernInfo.westernMode} [Chord Anchor: ${westernInfo.chordAnchor}]`,
    `Tonic Root (Sa): ${baseSaHz.toFixed(2)} Hz [${saInfo.noteName}]`,
    `Arohana (Ascent): ${raga.arohana}`,
    `Avarohana (Descent): ${raga.avarohana}`,
    `Vadi Note: ${raga.vadi} | Samvadi Note: ${raga.samvadi}`,
    `Pakad (Core Phrase): ${raga.pakad}`,
    `Tala: ${tala.name} (${tala.matras} Matras: ${tala.divisions})`,
    `Active Instrument: ${track.activeInstrument || track.name}`,
    `Rasa Sentiment: ${raga.rasa}`
  ];

  let formattedPrompt = '';

  switch (model) {
    case 'yue_2':
      formattedPrompt = [
        `[Genre: Indian Classical Ambient Fusion & Contemporary Orchestration]`,
        `[Mode: ${westernInfo.westernMode} | Raga: ${raga.name}]`,
        `[Tuning: Moveable Sa ${baseSaHz.toFixed(2)}Hz (${saInfo.noteName}), 22 Shrutis Pure Just Intonation]`,
        `[Tempo: ${tala.name} (${tala.matras} beats), Vilambit into Drut]`,
        `[Instrumentation: ${track.activeInstrument || track.name}, Acoustic Tanpura Drone in ${saInfo.noteName}]`,
        `[Vadi: ${raga.vadi} | Samvadi: ${raga.samvadi}]`,
        `[Acoustic Processing: ${acousticTokens.join(', ')}]`,
        customLyrics ? `[Lyrics & Syllables: ${customLyrics}]` : `[Structure: Instrumental Alap -> Jor -> Gat with continuous meend slides]`
      ].join('\n');
      break;

    case 'minimax_3':
      formattedPrompt = [
        `Style: Authentic Hindustani Vocal Recital in ${raga.name}`,
        `Western Mode Bridge: ${westernInfo.westernMode} with ${westernInfo.characteristicInterval}`,
        `Root Pitch: $Sa = ${baseSaHz.toFixed(2)}\\text{ Hz}$ (${saInfo.noteName})`,
        `Rasa: ${raga.rasa} (Emotional Nuance)`,
        `Phrasing: Rapid Sargam taans, emotional Pukar, and gamaka embellishments`,
        customLyrics ? `Vocal Text: ${customLyrics}` : `Vocal Phrasing: Classical Bandish in ${tala.name} with authentic Swara syllables`,
        `Engineering: 96kHz super-resolution buffer with extended hypersonic breath`
      ].join('\n');
      break;

    case 'ace_studio':
      formattedPrompt = [
        `Neural Formant Target: Indian Classical Vocal Virtual Performer`,
        `Scale Tuning: 22 Shrutis Just Intonation (Adhara Shadja ${baseSaHz.toFixed(2)} Hz)`,
        `Raga Constraints: ${raga.swaras} (Avoid Vivadi notes)`,
        `Meend Glissando: Continuous portamento curves between ${raga.vadi} and ${raga.samvadi}`,
        `Formant Dynamics: Breathiness 35%, Rasp 15%, Gamaka Depth 65%`,
        `Western Mode: ${westernInfo.westernMode}`,
        customLyrics ? `Phonetic Stream: ${customLyrics}` : `Syllables: Dha, Ni, Sa, Re, Ga with zero schwa-deletion`
      ].join('\n');
      break;

    case 'stable_audio_3':
      formattedPrompt = [
        `High-fidelity acoustic texture: ${track.activeInstrument || track.name}`,
        `Musical Mode: ${raga.name} (${westernInfo.westernMode}), Root ${saInfo.noteName} (${baseSaHz.toFixed(2)} Hz)`,
        `Rhythmic Pulse: ${tala.name} (${tala.matras} Matras)`,
        `Acoustic Space: Ancient sacred stone temple acoustics, pristine reverberant tail`,
        `Extended Spectrum: ${track.hypersonicAir ? 'Intense 24k-48k hypersonic shimmer' : ''} ${track.somaticSub ? '14Hz visceral somatic chest rumble' : ''}`,
        `Sample Rate: 96,000 Hz 32-bit float internal buffer, zero phase cancellation`
      ].filter(Boolean).join('\n');
      break;

    case 'vagdhenu':
      formattedPrompt = [
        `Vāgdhenu Vedic Sanskrit Recitation Engine`,
        `Tonic: Sa = ${baseSaHz.toFixed(2)} Hz (${saInfo.noteName})`,
        `Chhandas Meter: Ancient Rigvedic Metric Feet`,
        `Phonetic Discipline: 100% Zero Schwa-Deletion (Sanskrit Purity)`,
        `Pitch Accents: Udātta (↗ +204c), Anudātta (↘ -182c), Svarita (⤹ meend drop)`,
        customLyrics ? `Vedic Stanza: ${customLyrics}` : `Text: Gāyatrī Mantra in Devanagari & IAST with metric pauses`,
        `Acoustic DSP: Hypersonic vocal tract shimmer (20k-48k Hz)`
      ].join('\n');
      break;

    case 'soundfont_native':
    default:
      formattedPrompt = [
        `Native Multi-Sample Physical Modeling: ${track.activeInstrument || track.name}`,
        `Pitch Anchor: Sa = ${baseSaHz.toFixed(2)} Hz with 22 Shrutis Just Intonation microtonal tuning`,
        `Raga Scale: ${raga.swaras} (${raga.name} / ${westernInfo.westernMode})`,
        `Latency: 0ms Instantaneous Local Synthesis (Apple Silicon MLX Wasm)`
      ].join('\n');
      break;
  }

  return {
    model,
    trackId: track.id,
    trackName: track.name,
    ragaName: raga.name,
    westernMode: westernInfo.westernMode,
    baseSaHz,
    saPitchName: saInfo.noteName,
    talaName: tala.name,
    bpm: 96,
    rasa: raga.rasa,
    formattedPrompt,
    acousticTokens,
    musicologyDirectives
  };
}
