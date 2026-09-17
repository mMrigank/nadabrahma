import { Raga, Tala, RasaType } from '../types/daw';

export const RAGA_DATABASE: Raga[] = [
  {
    id: 'yaman',
    name: 'Raga Yaman',
    tradition: 'Hindustani',
    thaatOrMelakarta: 'Kalyan Thaat (65 Mechakalyani)',
    rasa: 'Shringara',
    prahar: 'Sunset / Sandhiprakash (6 PM - 9 PM)',
    westernMode: 'Lydian Mode (1 - 2 - 3 - #4 - 5 - 6 - 7)',
    swaras: "N' R G M' P D N Ṡ",
    arohana: "N' R G, M' D N Ṡ",
    avarohana: "Ṡ N D P, M' G R S",
    vadi: 'Ga (E in Key D)',
    samvadi: 'Ni (C# in Key D)',
    pakad: "N' R G, R S, P M' D N Ṡ",
    description: 'Serene, romantic, uplifting, prayerful. The quintessential evening raga of peace and deep affection.',
    keyCharacteristic: 'Prominent sharp 4th (Tivra Ma) avoiding direct Sa in ascent'
  },
  {
    id: 'hansadhwani',
    name: 'Raga Hansadhwani',
    tradition: 'Carnatic / Hindustani',
    thaatOrMelakarta: 'Shankarabharanam (29th Melakarta)',
    rasa: 'Adbhuta',
    prahar: 'Evening (6 PM - 9 PM)',
    westernMode: 'Major Pentatonic with Maj 7th (1 - 2 - 3 - 5 - 7)',
    swaras: 'S R G P N Ṡ',
    arohana: 'S R G P N Ṡ',
    avarohana: 'Ṡ N P G R S',
    vadi: 'Sa (Tonic)',
    samvadi: 'Pa (Fifth)',
    pakad: 'G P N Ṡ, N P G R S',
    description: 'Bright, celestial, luminous, auspicious. Often played at the invocation of concerts and sacred ceremonies.',
    keyCharacteristic: 'No 4th or 6th notes; ascends directly from Ga to Pa with swan-like grace'
  },
  {
    id: 'darbari',
    name: 'Raga Darbari Kanhada',
    tradition: 'Hindustani',
    thaatOrMelakarta: 'Asavari Thaat',
    rasa: 'Karuna',
    prahar: 'Late Night (12 AM - 3 AM)',
    westernMode: 'Natural Minor (Aeolian Mode with sunken 3rd & 6th)',
    swaras: 'S R g M P d n Ṡ',
    arohana: 'S R g M P d n Ṡ',
    avarohana: 'Ṡ d n P, M P g, m R S',
    vadi: 'Re (Second)',
    samvadi: 'Pa (Fifth)',
    pakad: 'g M R S, d n P',
    description: 'Majestic, solemn, deeply introspective, royal court gravity. Created by Miyan Tansen for Emperor Akbar.',
    keyCharacteristic: 'Slow oscillation (Andolan) on Komal Gandhar (g) and Komal Dhaivat (d)'
  },
  {
    id: 'bhairavi',
    name: 'Raga Bhairavi',
    tradition: 'Hindustani / Carnatic (Hanumatodi)',
    thaatOrMelakarta: 'Bhairavi Thaat (8th Melakarta)',
    rasa: 'Karuna',
    prahar: 'Dawn / Universal Closing Raga',
    westernMode: 'Phrygian Mode (1 - b2 - b3 - 4 - 5 - b6 - b7)',
    swaras: 'S r g M P d n Ṡ',
    arohana: 'S r g M P d n Ṡ',
    avarohana: 'Ṡ n d P M g r S',
    vadi: 'Ma (Fourth)',
    samvadi: 'Sa (Tonic)',
    pakad: 'M g, S r S, d n S',
    description: 'The queen of ragas. Supreme pathos, divine yearning, forgiveness, and universal devotion.',
    keyCharacteristic: 'All four komal notes (re, ga, dha, ni) with pure shuddha ma'
  },
  {
    id: 'bhoopali',
    name: 'Raga Bhoopali / Mohanam',
    tradition: 'Hindustani / Carnatic',
    thaatOrMelakarta: 'Kalyan Thaat / Harikambhoji',
    rasa: 'Shanta',
    prahar: 'First Part of Night (7 PM - 10 PM)',
    westernMode: 'Major Pentatonic (1 - 2 - 3 - 5 - 6)',
    swaras: 'S R G P D Ṡ',
    arohana: 'S R G P D Ṡ',
    avarohana: 'Ṡ D P G R S',
    vadi: 'Gandhar (3rd)',
    samvadi: 'Dhaivat (6th)',
    pakad: 'G R S D P, G R S',
    description: 'Pure peace, meditative tranquility, warm dawn or gentle evening sunlight.',
    keyCharacteristic: 'Omits 4th and 7th; grand sweeping meends from Dha down to Ga'
  },
  {
    id: 'malkauns',
    name: 'Raga Malkauns',
    tradition: 'Hindustani / Carnatic (Hindolam)',
    thaatOrMelakarta: 'Bhairavi Thaat',
    rasa: 'Veera',
    prahar: 'Deep Midnight (12 AM - 3 AM)',
    westernMode: 'Minor Pentatonic without 2nd & 5th (1 - b3 - 4 - b6 - b7)',
    swaras: 'S g M d n Ṡ',
    arohana: 'S g M d n Ṡ',
    avarohana: 'Ṡ n d M g S',
    vadi: 'Madhyam (4th)',
    samvadi: 'Shadja (Tonic)',
    pakad: 'd n S, M g M, d n d M',
    description: 'Ancient Shaivite meditation raga. Deep power, spiritual trance, cosmic stillness.',
    keyCharacteristic: 'Completely omits Re (2nd) and Pa (5th); heavily revolves around resonant Madhyam'
  },
  {
    id: 'durga',
    name: 'Raga Durga',
    tradition: 'Hindustani / Carnatic (Shuddha Saveri)',
    thaatOrMelakarta: 'Bilawal Thaat',
    rasa: 'Veera',
    prahar: 'Late Evening (9 PM - 12 AM)',
    westernMode: 'Suspended Pentatonic (1 - 2 - 4 - 5 - 6)',
    swaras: 'S R M P D Ṡ',
    arohana: 'S R M P D Ṡ',
    avarohana: 'Ṡ D P M R S',
    vadi: 'Dhaivat (6th)',
    samvadi: 'Rishabh (2nd)',
    pakad: 'D M P, D M R, S',
    description: 'Heroic, divine strength, maternal protection, fearless and joyful dignity.',
    keyCharacteristic: 'Omits Gandhar (3rd) and Nishad (7th); prominent oscillating slide D-M-P'
  },
  {
    id: 'marwa',
    name: 'Raga Marwa',
    tradition: 'Hindustani',
    thaatOrMelakarta: 'Marwa Thaat (53rd Melakarta Gamanashrama)',
    rasa: 'Raudra',
    prahar: 'Sunset Twilight (Sandhiprakash)',
    westernMode: 'Lydian b2 without 5th (1 - b2 - 3 - #4 - 6 - 7)',
    swaras: "S r G M' D N Ṡ",
    arohana: "'N r G M' D N Ṡ",
    avarohana: "Ṡ N D M' G r S",
    vadi: 'Dhaivat (6th)',
    samvadi: 'Rishabh (Flat 2nd)',
    pakad: "D M' G r, 'N D' S",
    description: 'Tense, existential, sunset yearning, dramatic confrontation, psychological suspense.',
    keyCharacteristic: 'Omits the stabilizing 5th (Pa); the clash between Komal Re and Tivra Ma creates electrifying tension'
  },
  {
    id: 'bhairav',
    name: 'Raga Bhairav',
    tradition: 'Hindustani / Carnatic (Mayamalavagowla)',
    thaatOrMelakarta: 'Bhairav Thaat (15th Melakarta)',
    rasa: 'Shanta',
    prahar: 'Dawn (First Prahar: 3 AM - 6 AM)',
    westernMode: 'Double Harmonic Major (1 - b2 - 3 - 4 - 5 - b6 - 7)',
    swaras: 'S r G M P d N Ṡ',
    arohana: 'S r G M P d N Ṡ',
    avarohana: 'Ṡ N d P M G r S',
    vadi: 'Dhaivat (Flat 6th)',
    samvadi: 'Rishabh (Flat 2nd)',
    pakad: 'G M d P, G M r S',
    description: 'The primordial dawn awakening. Divine majesty, cosmic dawn, peace, and spiritual asceticism.',
    keyCharacteristic: 'Slow, wide Andolan oscillation on Komal Rishabh (r) and Komal Dhaivat (d)'
  },
  {
    id: 'todi',
    name: 'Raga Todi (Miyan ki Todi)',
    tradition: 'Hindustani / Carnatic (Shubhapantuvarali)',
    thaatOrMelakarta: 'Todi Thaat (45th Melakarta)',
    rasa: 'Karuna',
    prahar: 'Morning (9 AM - 12 PM)',
    westernMode: 'Harmonic Minor #4 (1 - b2 - b3 - #4 - 5 - b6 - 7)',
    swaras: "S r g M' P d N Ṡ",
    arohana: "S r g M' d N Ṡ",
    avarohana: "Ṡ N d P, M' g r g r S",
    vadi: 'Dhaivat (Flat 6th)',
    samvadi: 'Gandhar (Flat 3rd)',
    pakad: "r g r S, M' g d P",
    description: 'Deep pathos, introspective longing, supreme devotion. Miyan Tansen’s legendary forest raga.',
    keyCharacteristic: 'Ati-Komal Re and Ga with sharp Tivra Ma creating poignant spiritual gravity'
  },
  {
    id: 'kafi',
    name: 'Raga Kafi',
    tradition: 'Hindustani / Carnatic (Kharaharapriya)',
    thaatOrMelakarta: 'Kafi Thaat (22nd Melakarta)',
    rasa: 'Shringara',
    prahar: 'Late Night (Any time in Spring/Monsoon)',
    westernMode: 'Dorian Mode (1 - 2 - b3 - 4 - 5 - 6 - b7)',
    swaras: 'S R g M P D n Ṡ',
    arohana: 'S R g M P D n Ṡ',
    avarohana: 'Ṡ n D P M g R S',
    vadi: 'Pancham (5th)',
    samvadi: 'Shadja (Tonic)',
    pakad: 'S R R g M P, M P D n D P',
    description: 'Joyful, romantic, earthy, festive. The foundation of Holi songs, Horis, and folk semiclassical genres.',
    keyCharacteristic: 'Pure Dorian structure with lively ornamentation and paired note phrases'
  },
  {
    id: 'bageshri',
    name: 'Raga Bageshri',
    tradition: 'Hindustani',
    thaatOrMelakarta: 'Kafi Thaat',
    rasa: 'Shringara',
    prahar: 'Midnight (10 PM - 1 AM)',
    westernMode: 'Dorian Hexatonic (1 - 2 - b3 - 4 - 6 - b7)',
    swaras: 'S R g M D n Ṡ',
    arohana: "S g M D n Ṡ",
    avarohana: "Ṡ n D M, M g R S",
    vadi: 'Madhyam (4th)',
    samvadi: 'Shadja (Tonic)',
    pakad: "S g M, D n D M, M g R S",
    description: 'Deep emotional longing of lovers awaiting reunion. Intimate, evocative, profound.',
    keyCharacteristic: 'Omits Pancham (5th) in ascent; soulful meend glides descending from Dha to Ma'
  }
];

export const TALA_DATABASE: Tala[] = [
  {
    id: 'teental',
    name: 'Teental',
    matras: 16,
    divisions: '4 + 4 + 4 + 4',
    vibhaags: [4, 4, 4, 4],
    claps: {
      0: 'sam',
      4: 'tali',
      8: 'khali',
      12: 'tali'
    },
    bols: ['Dha', 'Dhin', 'Dhin', 'Dha', 'Dha', 'Dhin', 'Dhin', 'Dha', 'Dha', 'Tin', 'Tin', 'Ta', 'Ta', 'Dhin', 'Dhin', 'Dha']
  },
  {
    id: 'rupak',
    name: 'Rupak Tala',
    matras: 7,
    divisions: '3 + 2 + 2',
    vibhaags: [3, 2, 2],
    claps: {
      0: 'khali', // Uniquely starts on Khali
      3: 'tali',
      5: 'tali'
    },
    bols: ['Tin', 'Tin', 'Na', 'Dhin', 'Na', 'Dhin', 'Na']
  },
  {
    id: 'jhaptal',
    name: 'Jhaptal',
    matras: 10,
    divisions: '2 + 3 + 2 + 3',
    vibhaags: [2, 3, 2, 3],
    claps: {
      0: 'sam',
      2: 'tali',
      5: 'khali',
      7: 'tali'
    },
    bols: ['Dhi', 'Na', 'Dhi', 'Dhi', 'Na', 'Ti', 'Na', 'Dhi', 'Dhi', 'Na']
  },
  {
    id: 'aditala',
    name: 'Adi Tala (Carnatic)',
    matras: 8,
    divisions: '4 + 2 + 2',
    vibhaags: [4, 2, 2],
    claps: {
      0: 'sam',
      4: 'tali',
      6: 'tali'
    },
    bols: ['Tha', 'Ka', 'Dhi', 'Mi', 'Tha', 'Ki', 'Ta', 'Thom']
  },
  {
    id: 'keherwa',
    name: 'Keherwa (Folk / Ghazal)',
    matras: 8,
    divisions: '4 + 4',
    vibhaags: [4, 4],
    claps: {
      0: 'sam',
      4: 'khali'
    },
    bols: ['Dha', 'Ge', 'Na', 'Tin', 'Na', 'Ke', 'Dhin', 'Na']
  }
];

// Pure Acoustic Ratios for 22 Shrutis relative to Sa
export const SHRUTI_RATIOS: { [swara: string]: { ratio: number; name: string } } = {
  'S': { ratio: 1.0, name: 'Shadja' },
  'r1': { ratio: 16 / 15, name: 'Eka-Shruti Rishabh' },
  'r2': { ratio: 25 / 24, name: 'Komal Rishabh' },
  'R1': { ratio: 10 / 9, name: 'Laghu Rishabh' },
  'R2': { ratio: 9 / 8, name: 'Shuddha Rishabh' },
  'g1': { ratio: 32 / 27, name: 'Sadharana Gandhar' },
  'g2': { ratio: 6 / 5, name: 'Komal Gandhar' },
  'G1': { ratio: 5 / 4, name: 'Shuddha Gandhar' },
  'G2': { ratio: 81 / 64, name: 'Teevra Gandhar' },
  'M1': { ratio: 4 / 3, name: 'Shuddha Madhyam' },
  'M2': { ratio: 27 / 20, name: 'Teevra Madhyam' },
  'M3': { ratio: 45 / 32, name: 'Kadi Madhyam' },
  'P': { ratio: 3 / 2, name: 'Pancham' },
  'd1': { ratio: 128 / 81, name: 'Ati-Komal Dhaivat' },
  'd2': { ratio: 8 / 5, name: 'Komal Dhaivat' },
  'D1': { ratio: 5 / 3, name: 'Shuddha Dhaivat' },
  'D2': { ratio: 27 / 16, name: 'Teevra Dhaivat' },
  'n1': { ratio: 16 / 9, name: 'Komal Nishad' },
  'n2': { ratio: 9 / 5, name: 'Kaishiki Nishad' },
  'N1': { ratio: 15 / 8, name: 'Shuddha Nishad' },
  'N2': { ratio: 243 / 128, name: 'Kakali Nishad' },
  'S_high': { ratio: 2.0, name: 'Taar Shadja' }
};

export function calculateSwaraFrequency(baseSaHz: number, swaraKey: string): number {
  const item = SHRUTI_RATIOS[swaraKey] || SHRUTI_RATIOS['S'];
  return Math.round(baseSaHz * item.ratio * 100) / 100;
}

export function hzToMidiWithCents(freqHz: number): { midiNote: number; centsOffset: number; noteName: string } {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const exactMidi = 69 + 12 * Math.log2(freqHz / 440);
  const roundedMidi = Math.round(exactMidi);
  const centsOffset = Math.round((exactMidi - roundedMidi) * 100);
  const octave = Math.floor(roundedMidi / 12) - 1;
  const noteName = `${noteNames[roundedMidi % 12]}${octave}`;
  
  return { midiNote: roundedMidi, centsOffset, noteName };
}
