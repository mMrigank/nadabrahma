// 22 Shrutis Just Intonation Musicology Engine for Nādabrahma DAW
// Based on Bharata Muni's Nāṭyaśāstra & Śārṅgadeva's Saṅgītaratnākara
// Continuous Moveable Sa (f_Sa) calculations with exact harmonic ratios & 12-TET cent deviations

export interface ShrutiDefinition {
  index: number; // 1 to 22
  key: string;
  sanskritName: string;
  swara: 'Sa' | 'Re' | 'Ga' | 'Ma' | 'Pa' | 'Dha' | 'Ni';
  swaraRole: string;
  ratioNumerator: number;
  ratioDenominator: number;
  ratioStr: string;
  ratioValue: number;
  justCents: number;
  tet12Cents: number;
  centDeviation: number; // Difference from 12-TET in cents
  westernInterval: string;
  rasaAffinity: string;
  color: string;
  angleDeg: number;
}

export const TWENTY_TWO_SHRUTIS: ShrutiDefinition[] = [
  {
    index: 1,
    key: 'S',
    sanskritName: 'Tīvrā (तीव्रा)',
    swara: 'Sa',
    swaraRole: 'Shadja (Fundamental Tonic)',
    ratioNumerator: 1,
    ratioDenominator: 1,
    ratioStr: '1/1',
    ratioValue: 1.0,
    justCents: 0.0,
    tet12Cents: 0,
    centDeviation: 0.0,
    westernInterval: 'Unison / Root Tonic',
    rasaAffinity: 'Shanta (Cosmic Stability & Peace)',
    color: '#b08d57', // Sandstone
    angleDeg: 0
  },
  {
    index: 2,
    key: 'r1',
    sanskritName: 'Kumudvatī (कुमुद्वती)',
    swara: 'Re',
    swaraRole: 'Ati-Komal Rishabh (Pythagorean Minor 2nd)',
    ratioNumerator: 256,
    ratioDenominator: 243,
    ratioStr: '256/243',
    ratioValue: 256 / 243,
    justCents: 90.2,
    tet12Cents: 100,
    centDeviation: -9.8,
    westernInterval: 'Lesser Limma Minor 2nd',
    rasaAffinity: 'Karuna (Pathos / Yearning)',
    color: '#a06352', // Terracotta
    angleDeg: 16.36
  },
  {
    index: 3,
    key: 'r2',
    sanskritName: 'Mandā (मन्दा)',
    swara: 'Re',
    swaraRole: 'Komal Rishabh (Diatonic Minor 2nd)',
    ratioNumerator: 16,
    ratioDenominator: 15,
    ratioStr: '16/15',
    ratioValue: 16 / 15,
    justCents: 111.7,
    tet12Cents: 100,
    centDeviation: +11.7,
    westernInterval: 'Just Minor 2nd',
    rasaAffinity: 'Karuna & Bhakti (Tender Devotion)',
    color: '#a06352',
    angleDeg: 32.73
  },
  {
    index: 4,
    key: 'R1',
    sanskritName: 'Chandovatī (छन्दोवती)',
    swara: 'Re',
    swaraRole: 'Laghu Rishabh (Minor Whole Tone)',
    ratioNumerator: 10,
    ratioDenominator: 9,
    ratioStr: '10/9',
    ratioValue: 10 / 9,
    justCents: 182.4,
    tet12Cents: 200,
    centDeviation: -17.6,
    westernInterval: 'Minor Whole Tone',
    rasaAffinity: 'Shanta & Shringara (Subtle Joy)',
    color: '#b08d57',
    angleDeg: 49.09
  },
  {
    index: 5,
    key: 'R2',
    sanskritName: 'Dayāvatī (दयावती)',
    swara: 'Re',
    swaraRole: 'Shuddha Rishabh (Major Whole Tone)',
    ratioNumerator: 9,
    ratioDenominator: 8,
    ratioStr: '9/8',
    ratioValue: 9 / 8,
    justCents: 203.9,
    tet12Cents: 200,
    centDeviation: +3.9,
    westernInterval: 'Major Whole Tone',
    rasaAffinity: 'Veera (Heroic Dignity)',
    color: '#b08d57',
    angleDeg: 65.45
  },
  {
    index: 6,
    key: 'g1',
    sanskritName: 'Rañjanī (रञ्जनी)',
    swara: 'Ga',
    swaraRole: 'Ati-Komal Gandhar (Pythagorean Minor 3rd)',
    ratioNumerator: 32,
    ratioDenominator: 27,
    ratioStr: '32/27',
    ratioValue: 32 / 27,
    justCents: 294.1,
    tet12Cents: 300,
    centDeviation: -5.9,
    westernInterval: 'Pythagorean Minor 3rd',
    rasaAffinity: 'Karuna (Pensive Yearning)',
    color: '#5d7491', // Slate Blue
    angleDeg: 81.82
  },
  {
    index: 7,
    key: 'g2',
    sanskritName: 'Raktikā (रक्तिका)',
    swara: 'Ga',
    swaraRole: 'Komal Gandhar (Sadharana Just Minor 3rd)',
    ratioNumerator: 6,
    ratioDenominator: 5,
    ratioStr: '6/5',
    ratioValue: 6 / 5,
    justCents: 315.6,
    tet12Cents: 300,
    centDeviation: +15.6,
    westernInterval: 'Pure Just Minor 3rd',
    rasaAffinity: 'Shringara & Karuna (Deep Emotion)',
    color: '#5d7491',
    angleDeg: 98.18
  },
  {
    index: 8,
    key: 'G1',
    sanskritName: 'Raudrī (रौद्री)',
    swara: 'Ga',
    swaraRole: 'Shuddha Gandhar (Pure 5-Limit Major 3rd)',
    ratioNumerator: 5,
    ratioDenominator: 4,
    ratioStr: '5/4',
    ratioValue: 5 / 4,
    justCents: 386.3,
    tet12Cents: 400,
    centDeviation: -13.7,
    westernInterval: 'Pure Just Major 3rd',
    rasaAffinity: 'Shanta & Hasya (Luminous Serenity)',
    color: '#528275', // Sage Green
    angleDeg: 114.55
  },
  {
    index: 9,
    key: 'G2',
    sanskritName: 'Krodhā (क्रोधा)',
    swara: 'Ga',
    swaraRole: 'Teevra Gandhar (Pythagorean Major 3rd / Ditone)',
    ratioNumerator: 81,
    ratioDenominator: 64,
    ratioStr: '81/64',
    ratioValue: 81 / 64,
    justCents: 407.8,
    tet12Cents: 400,
    centDeviation: +7.8,
    westernInterval: 'Pythagorean Ditone',
    rasaAffinity: 'Adbhuta (Wonder & Brilliance)',
    color: '#528275',
    angleDeg: 130.91
  },
  {
    index: 10,
    key: 'M1',
    sanskritName: 'Vajrikā (वज्रिका)',
    swara: 'Ma',
    swaraRole: 'Shuddha Madhyam (Consonant Perfect 4th)',
    ratioNumerator: 4,
    ratioDenominator: 3,
    ratioStr: '4/3',
    ratioValue: 4 / 3,
    justCents: 498.0,
    tet12Cents: 500,
    centDeviation: -2.0,
    westernInterval: 'Pure Perfect 4th',
    rasaAffinity: 'Shanta (Cooling Water & Oasis)',
    color: '#5d7491',
    angleDeg: 147.27
  },
  {
    index: 11,
    key: 'M2',
    sanskritName: 'Prasāriṇī (प्रसारिणी)',
    swara: 'Ma',
    swaraRole: 'Teevra Madhyam 1 (Praman / Augmented 4th)',
    ratioNumerator: 27,
    ratioDenominator: 20,
    ratioStr: '27/20',
    ratioValue: 27 / 20,
    justCents: 519.5,
    tet12Cents: 500,
    centDeviation: +19.5,
    westernInterval: 'Acute 4th / Chroma',
    rasaAffinity: 'Adbhuta (Mystical Tension)',
    color: '#e07a5f',
    angleDeg: 163.64
  },
  {
    index: 12,
    key: 'M3',
    sanskritName: 'Prīti (प्रीति)',
    swara: 'Ma',
    swaraRole: 'Prati Madhyam (Tritone / Diatonic Sharp 4th)',
    ratioNumerator: 45,
    ratioDenominator: 32,
    ratioStr: '45/32',
    ratioValue: 45 / 32,
    justCents: 590.2,
    tet12Cents: 600,
    centDeviation: -9.8,
    westernInterval: 'Diatonic Tritone (#4)',
    rasaAffinity: 'Shringara & Adbhuta (Romantic Longing in Yaman)',
    color: '#e07a5f',
    angleDeg: 180.0
  },
  {
    index: 13,
    key: 'M4',
    sanskritName: 'Mārjanī (मार्जनी)',
    swara: 'Ma',
    swaraRole: 'Teevratara Madhyam (Pythagorean Tritone)',
    ratioNumerator: 729,
    ratioDenominator: 512,
    ratioStr: '729/512',
    ratioValue: 729 / 512,
    justCents: 611.7,
    tet12Cents: 600,
    centDeviation: +11.7,
    westernInterval: 'Pythagorean Tritone',
    rasaAffinity: 'Raudra & Veera (Piercing Brilliance)',
    color: '#e07a5f',
    angleDeg: 196.36
  },
  {
    index: 14,
    key: 'P',
    sanskritName: 'Kṣiti (क्षिति)',
    swara: 'Pa',
    swaraRole: 'Pancham (Immutable Perfect 5th)',
    ratioNumerator: 3,
    ratioDenominator: 2,
    ratioStr: '3/2',
    ratioValue: 1.5,
    justCents: 702.0,
    tet12Cents: 700,
    centDeviation: +2.0,
    westernInterval: 'Pure Perfect 5th',
    rasaAffinity: 'Shanta (Universal Pillar & Resonance)',
    color: '#b08d57',
    angleDeg: 212.73
  },
  {
    index: 15,
    key: 'd1',
    sanskritName: 'Raktā (रक्ता)',
    swara: 'Dha',
    swaraRole: 'Ati-Komal Dhaivat (Pythagorean Minor 6th)',
    ratioNumerator: 128,
    ratioDenominator: 81,
    ratioStr: '128/81',
    ratioValue: 128 / 81,
    justCents: 792.2,
    tet12Cents: 800,
    centDeviation: -7.8,
    westernInterval: 'Pythagorean Minor 6th',
    rasaAffinity: 'Karuna (Melancholy Gravitas in Darbari)',
    color: '#a06352',
    angleDeg: 229.09
  },
  {
    index: 16,
    key: 'd2',
    sanskritName: 'Sandīpinī (सन्दीपिनी)',
    swara: 'Dha',
    swaraRole: 'Komal Dhaivat (Just Minor 6th)',
    ratioNumerator: 8,
    ratioDenominator: 5,
    ratioStr: '8/5',
    ratioValue: 8 / 5,
    justCents: 813.7,
    tet12Cents: 800,
    centDeviation: +13.7,
    westernInterval: 'Pure Just Minor 6th',
    rasaAffinity: 'Karuna & Shanta (Sunset Poignancy)',
    color: '#a06352',
    angleDeg: 245.45
  },
  {
    index: 17,
    key: 'D1',
    sanskritName: 'Ālāpinī (आलापिनी)',
    swara: 'Dha',
    swaraRole: 'Laghu Dhaivat (Minor Whole Tone from Pa)',
    ratioNumerator: 5,
    ratioDenominator: 3,
    ratioStr: '5/3',
    ratioValue: 5 / 3,
    justCents: 884.4,
    tet12Cents: 900,
    centDeviation: -15.6,
    westernInterval: 'Pure Just Major 6th',
    rasaAffinity: 'Shringara & Shanta (Gentle Grace)',
    color: '#528275',
    angleDeg: 261.82
  },
  {
    index: 18,
    key: 'D2',
    sanskritName: 'Madantī (मदन्ती)',
    swara: 'Dha',
    swaraRole: 'Shuddha Dhaivat (Trishruti Major 6th)',
    ratioNumerator: 27,
    ratioDenominator: 16,
    ratioStr: '27/16',
    ratioValue: 27 / 16,
    justCents: 905.9,
    tet12Cents: 900,
    centDeviation: +5.9,
    westernInterval: 'Pythagorean Major 6th',
    rasaAffinity: 'Veera (Uplifting Majesty)',
    color: '#528275',
    angleDeg: 278.18
  },
  {
    index: 19,
    key: 'n1',
    sanskritName: 'Rohiṇī (रोहिणी)',
    swara: 'Ni',
    swaraRole: 'Ati-Komal Nishad (Pythagorean Minor 7th)',
    ratioNumerator: 16,
    ratioDenominator: 9,
    ratioStr: '16/9',
    ratioValue: 16 / 9,
    justCents: 996.1,
    tet12Cents: 1000,
    centDeviation: -3.9,
    westernInterval: 'Pythagorean Minor 7th',
    rasaAffinity: 'Karuna (Solemn Night Pathos)',
    color: '#5d7491',
    angleDeg: 294.55
  },
  {
    index: 20,
    key: 'n2',
    sanskritName: 'Ramyā (रम्य)',
    swara: 'Ni',
    swaraRole: 'Kaishiki Nishad (Just Minor 7th)',
    ratioNumerator: 9,
    ratioDenominator: 5,
    ratioStr: '9/5',
    ratioValue: 9 / 5,
    justCents: 1017.6,
    tet12Cents: 1000,
    centDeviation: +17.6,
    westernInterval: 'Just Minor 7th',
    rasaAffinity: 'Shringara (Soulful Yearning)',
    color: '#5d7491',
    angleDeg: 310.91
  },
  {
    index: 21,
    key: 'N1',
    sanskritName: 'Ugrā (उग्रा)',
    swara: 'Ni',
    swaraRole: 'Shuddha Nishad (Kakali Just Major 7th)',
    ratioNumerator: 15,
    ratioDenominator: 8,
    ratioStr: '15/8',
    ratioValue: 15 / 8,
    justCents: 1088.3,
    tet12Cents: 1100,
    centDeviation: -11.7,
    westernInterval: 'Pure Just Major 7th',
    rasaAffinity: 'Shringara (Leading Tone Ecstasy)',
    color: '#b08d57',
    angleDeg: 327.27
  },
  {
    index: 22,
    key: 'N2',
    sanskritName: 'Kṣobhiṇī (क्षोभिणी)',
    swara: 'Ni',
    swaraRole: 'Teevra Nishad (Chyuta Sa / Pythagorean Major 7th)',
    ratioNumerator: 243,
    ratioDenominator: 128,
    ratioStr: '243/128',
    ratioValue: 243 / 128,
    justCents: 1109.8,
    tet12Cents: 1100,
    centDeviation: +9.8,
    westernInterval: 'Pythagorean Major 7th',
    rasaAffinity: 'Adbhuta (Tense Resolution into Sa)',
    color: '#b08d57',
    angleDeg: 343.64
  }
];

// Calculate exact frequency in Hz for any Shruti given a Moveable Sa (f_Sa)
export function getShrutiFrequency(baseSaHz: number, shrutiIndex: number): number {
  const shruti = TWENTY_TWO_SHRUTIS.find(s => s.index === shrutiIndex) || TWENTY_TWO_SHRUTIS[0];
  return Math.round(baseSaHz * shruti.ratioValue * 100) / 100;
}

// Calculate the equivalent 12-TET frequency for comparison
export function get12TetEquivalentFrequency(baseSaHz: number, shruti: ShrutiDefinition): number {
  return Math.round(baseSaHz * Math.pow(2, shruti.tet12Cents / 1200) * 100) / 100;
}

// Map Swaras of a Raga to their exact active Shrutis
export const RAGA_SHRUTI_MAP: { [ragaId: string]: number[] } = {
  'yaman': [1, 5, 8, 12, 14, 18, 21], // S, R2 (9/8), G1 (5/4), M3 (45/32), P (3/2), D2 (27/16), N1 (15/8)
  'hansadhwani': [1, 5, 8, 14, 21],   // S, R2, G1, P, N1
  'darbari': [1, 5, 7, 10, 14, 16, 20], // S, R2, g2, M1, P, d2, n2
  'bhairavi': [1, 3, 7, 10, 14, 16, 20], // S, r2, g2, M1, P, d2, n2
  'todi': [1, 2, 6, 13, 14, 15, 21],     // S, r1, g1, M4, P, d1, N1
  'bhimpalasi': [1, 5, 7, 10, 14, 18, 20], // S, R2, g2, M1, P, D2, n2
  'marwa': [1, 3, 8, 12, 18, 21],          // S, r2, G1, M3, D2, N1 (Omits Pa)
  'bageshree': [1, 5, 7, 10, 14, 18, 20],  // S, R2, g2, M1, P, D2, n2
  'desh': [1, 5, 8, 10, 14, 18, 20, 21]    // S, R2, G1, M1, P, D2, n2/N1
};
