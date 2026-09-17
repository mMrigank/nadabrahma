// Vāgdhenu Sanskrit Vedic Phonology Engine for Nādabrahma DAW
export type SvaraAccent =
  | 'udatta'    // High tonic (↗) - +204 cents / Major 2nd above Sa
  | 'anudatta'  // Low tonic (↘) - -182 cents / Minor 7th below Sa
  | 'svarita'   // Descending meend glissando (⤹) - +150 to 0 cents tonic
  | 'none';     // Neutral

export interface VedicSyllable {
  text: string;           // Original Sanskrit text (Devanagari or IAST)
  iast: string;           // IAST Roman transliteration
  svara: SvaraAccent;     // Vedic pitch accent
  durationMatras: number; // Duration in matras (beats)
  isDeergha: boolean;     // Long vowel (dīrgha)
  isPluta: boolean;       // Prolonged vowel (pluta, 3+ matras)
}

export interface VedicChhanda {
  name: string;           // Name of the meter (Gāyatrī, Anuṣṭubh, etc.)
  syllables: number;      // Total syllables per pada (quarter)
  pattern: number[];      // Pattern of guru (heavy) and laghu (light) syllables
  description: string;    // Description of the meter
}

// Authentic Vedic Hymns Library
export const VEDIC_HYMNS: Record<string, {
  name: string;
  syllables: VedicSyllable[];
  chhanda: VedicChhanda;
  meaning: string;
}> = {
  gayatri: {
    name: 'Gāyatrī Mantra',
    syllables: [
      { text: 'ॐ', iast: 'om', svara: 'udatta', durationMatras: 1, isDeergha: true, isPluta: false },
      { text: 'भूर्भुवः स्वः', iast: 'bhūr bhuvaḥ svaḥ', svara: 'udatta', durationMatras: 3, isDeergha: false, isPluta: false },
      { text: 'तत्सवितुर्वरेण्यम्', iast: 'tatsavitur vareṇyam', svara: 'anudatta', durationMatras: 4, isDeergha: false, isPluta: false },
      { text: 'भर्गो देवस्य धीमही', iast: 'bhargo devasya dhīmahī', svara: 'svarita', durationMatras: 4, isDeergha: true, isPluta: false },
      { text: 'धियो यो नः प्रचोदयात्', iast: 'dhiyo yo naḥ pracodayāt', svara: 'udatta', durationMatras: 4, isDeergha: true, isPluta: false }
    ],
    chhanda: {
      name: 'Gāyatrī',
      syllables: 24,
      pattern: [4, 4, 4, 4, 4, 4], // 6 groups of 4 syllables each
      description: 'Most sacred Vedic meter: 3 padas of 8 syllables each (24 total)'
    },
    meaning: 'We meditate on the sublime glory of the divine illuminator; may he inspire our intellect.'
  },
  asato: {
    name: 'Asato Mā Sadgamaya',
    syllables: [
      { text: 'असतो मा सद्गमय', iast: 'asato mā sadgamaya', svara: 'anudatta', durationMatras: 4, isDeergha: false, isPluta: false },
      { text: 'तमसो मा ज्योतिर्गमय', iast: 'tamaso mā jyotirgamaya', svara: 'udatta', durationMatras: 4, isDeergha: false, isPluta: false },
      { text: 'मृत्योर्मा अमृतं गमय', iast: 'mṛtyormā amṛtaṃ gamaya', svara: 'svarita', durationMatras: 4, isDeergha: false, isPluta: false },
      { text: 'ॐ शान्तिः शान्तिः शान्तिः', iast: 'oṁ śāntiḥ śāntiḥ śāntiḥ', svara: 'udatta', durationMatras: 3, isDeergha: true, isPluta: false }
    ],
    chhanda: {
      name: 'Anuṣṭubh',
      syllables: 32,
      pattern: [4, 4, 4, 4, 4, 4, 4, 4], // 4 padas of 8 syllables each
      description: 'Most common classical Sanskrit meter: 4 padas of 8 syllables each (32 total)'
    },
    meaning: 'Lead me from unreal to real, from darkness to light, from death to immortality.'
  },
  mahamrityunjaya: {
    name: 'Mahā Mṛtyuñjaya Mantra',
    syllables: [
      { text: 'ओम त्र्यम्बकं यजामहे', iast: 'oṁ tryambakaṃ yajāmahe', svara: 'udatta', durationMatras: 3, isDeergha: false, isPluta: false },
      { text: 'सुगन्धिं पुष्टिवर्धनम्', iast: 'sugandhiṃ puṣṭivardhanam', svara: 'anudatta', durationMatras: 3, isDeergha: false, isPluta: false },
      { text: 'उर्वारुकमिव बन्धनान्', iast: 'urvārukamiva bandhān', svara: 'svarita', durationMatras: 3, isDeergha: false, isPluta: false },
      { text: 'मृत्योर्मुक्षीय माऽमृतात्', iast: "mṛtyurmukṣīya mā'mṛtāt", svara: 'udatta', durationMatras: 3, isDeergha: false, isPluta: false }
    ],
    chhanda: {
      name: 'Triṣṭubh',
      syllables: 44,
      pattern: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4], // 11 padas of 4 syllables each
      description: 'Vedic meter: 4 padas of 11 syllables each (44 total)'
    },
    meaning: 'We worship the three-eyed one (Shiva) who is fragrant and nourishes all; like a cucumber freed from its bondage, liberate us from death for the sake of immortality.'
  }
};

// Vedic Svara Pitch Frequencies (relative to Sa)
export const VEDIC_SVARA_INTERVALS: Record<SvaraAccent, number> = {
  udatta: 1.1547,    // +204 cents (Major 2nd above Sa)
  anudatta: 0.8909,  // -182 cents (Minor 7th below Sa)
  svarita: 1.0,      // Variable glide (handled dynamically)
  none: 1.0          // Neutral (Sa)
};

// Chhandas (Vedic Meter) Definitions
export const VEDIC_CHHANDAS: VedicChhanda[] = [
  {
    name: 'Gāyatrī',
    syllables: 24,
    pattern: [4, 4, 4, 4, 4, 4],
    description: 'Most sacred Vedic meter: 3 padas of 8 syllables each (24 total)'
  },
  {
    name: 'Anuṣṭubh',
    syllables: 32,
    pattern: [4, 4, 4, 4, 4, 4, 4, 4],
    description: 'Most common classical Sanskrit meter: 4 padas of 8 syllables each (32 total)'
  },
  {
    name: 'Triṣṭubh',
    syllables: 44,
    pattern: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    description: 'Vedic meter: 4 padas of 11 syllables each (44 total)'
  },
  {
    name: 'Jagatī',
    syllables: 48,
    pattern: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    description: 'Vedic meter: 4 padas of 12 syllables each (48 total)'
  }
];

/**
 * Calculate Vedic svara pitch frequency based on accent and base Sa frequency
 */
export function calculateVedicSvaraFrequency(baseSaHz: number, accent: SvaraAccent): number {
  const interval = VEDIC_SVARA_INTERVALS[accent];
  return baseSaHz * interval;
}

/**
 * Generate phonetic IPA transcription with svara markers
 */
export function generateVedicIPA(syllable: VedicSyllable, baseSaHz: number): string {
  const svaraMarkers: Record<SvaraAccent, string> = {
    udatta: '↗',
    anudatta: '↘',
    svarita: '⤹',
    none: ''
  };

  // Simplified IAST to IPA conversion (for demonstration)
  const ipaMap: Record<string, string> = {
    'a': 'ɐ', 'ā': 'aː', 'i': 'i', 'ī': 'iː', 'u': 'u', 'ū': 'uː',
    'ṛ': 'ɽ̝', 'ṝ': 'ɽ̝ː', 'ḷ': 'l̩', 'ḹ': 'l̩ː',
    'e': 'e', 'ai': 'aɪ', 'o': 'o', 'au': 'ɔʊ',
    'k': 'k', 'kh': 'kʰ', 'g': 'ɡ', 'gh': 'ɡʰ', 'ṅ': 'ŋ',
    'c': 'c', 'ch': 'cʰ', 'j': 'ɟ', 'jh': 'ɟʰ', 'ñ': 'ɲ',
    'ṭ': 'ʈ', 'ṭh': 'ʈʰ', 'ḍ': 'ɖ', 'ḍh': 'ɖʰ', 'ṇ': 'ɳ',
    't': 't', 'th': 'tʰ', 'd': 'd', 'dh': 'dʰ', 'n': 'n',
    'p': 'p', 'ph': 'pʰ', 'b': 'b', 'bh': 'bʰ', 'm': 'm',
    'y': 'j', 'r': 'ɾ', 'l': 'l', 'v': 'ʋ',
    'ś': 'ɕ', 'ṣ': 'ʂ', 's': 's', 'h': 'ɦ'
  };

  // Convert IAST to IPA (simplified)
  let ipa = syllable.iast.toLowerCase();
  Object.keys(ipaMap).forEach(key => {
    ipa = ipa.split(key).join(ipaMap[key]);
  });

  return `${svaraMarkers[syllable.svara]}${ipa}`;
}

/**
 * Analyze text for Vedic meter (chhanda) detection
 */
export function analyzeVedicMeter(syllableCount: number): VedicChhanda | null {
  return VEDIC_CHHANDAS.find(ch => ch.syllables === syllableCount) || null;
}

/**
 * Check for schwa deletion in pronunciation (common colloquial error)
 */
export function checkSchwaDeletion(word: string): {
  hasSchwaDeletion: boolean;
  correction: string;
  explanation: string
} {
  // Common schwa deletion patterns in colloquial Sanskrit
  const schwaPatterns: Array<{
    pattern: RegExp;
    replacement: string;
    explanation: string
  }> = [
    {
      pattern: /rām$/i,
      replacement: 'rāma',
      explanation: 'Colloquial "Rām" misses schwa in final "a" - should be "Rāma" [raːmɐ]'
    },
    {
      pattern: /kṛṣṇ$/i,
      replacement: 'kṛṣṇa',
      explanation: "Colloquial 'Kṛṣṇ' misses schwa - should be 'Kṛṣṇa' [kɽɪʂɳɐ]"
    },
    {
      pattern: /šiv$/i,
      replacement: 'šiva',
      explanation: "Colloquial 'Šiv' misses schwa - should be 'Šiva' [ɕiʋɐ]"
    }
  ];

  for (const patternObj of schwaPatterns) {
    if (patternObj.pattern.test(word)) {
      return {
        hasSchwaDeletion: true,
        correction: word.replace(patternObj.pattern, patternObj.replacement),
        explanation: patternObj.explanation
      };
    }
  }

  return { hasSchwaDeletion: false, correction: word, explanation: 'No schwa deletion detected' };
}

/**
 * Generate Vedic recitation timing markers
 */
export function generateVedicTiming(syllables: VedicSyllable[], baseTempo: number = 60): number[] {
  // Calculate timing in seconds for each syllable based on matra duration
  const matraDuration = 60 / baseTempo; // seconds per matra at given BPM
  const timing: number[] = [];
  let cumulativeTime = 0;

  syllables.forEach(syllable => {
    const syllableDuration = syllable.durationMatras * matraDuration;
    timing.push(cumulativeTime);
    cumulativeTime += syllableDuration;
  });

  return timing;
}