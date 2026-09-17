// Vāgdhenu Sanskrit Vedic Phonology Engine & Chhandas Analyzer
// Strict Zero Schwa-Deletion and Vedic 3-Pitch Svara Accents (Udātta, Anudātta, Svarita)
import { VedicChantPhrase, VedicSvaraAccent, VedicSyllable } from '../types/daw';

export const VEDIC_PRESET_HYMNS: VedicChantPhrase[] = [
  {
    id: 'gayatri',
    title: 'Gāyatrī Mantra (Rigveda 3.62.10)',
    source: 'Rigveda Samhitā Mandala 3, Sukta 62, Richa 10',
    chhandasMeter: 'Gayatri',
    syllableCount: 24,
    devanagariText: 'ॐ भूर्भुवः॒ स्वः॑ तत्स॑वि॒तुर्वरे॑ण्यं॒ भर्गो॑ दे॒वस्य॑ धीमहि धियो॒ यो नः॑ प्रचो॒दया॑त् ॥',
    iastText: 'oṃ bhūr bhuvaḥ svaḥ tat savitur vareṇyaṃ bhargo devasya dhīmahi dhiyo yo naḥ pracodayāt',
    translation: 'We meditate on that most adorable effulgent splendour of the divine Sun, the Creator. May He illumine and inspire our intellect.',
    recommendedRaga: 'Yaman',
    syllables: [
      { devanagari: 'ॐ', iast: 'oṃ', accent: 'svarita', pitchOffsetCents: 0, durationMatras: 2, isSchwaPreserved: true },
      { devanagari: 'भूर्', iast: 'bhūr', accent: 'udatta', pitchOffsetCents: 204, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'भु', iast: 'bhu', accent: 'anudatta', pitchOffsetCents: -182, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'वः', iast: 'vaḥ', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'स्वः', iast: 'svaḥ', accent: 'svarita', pitchOffsetCents: 150, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'तत्', iast: 'tat', accent: 'svarita', pitchOffsetCents: 100, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'स', iast: 'sa', accent: 'anudatta', pitchOffsetCents: -182, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'वि', iast: 'vi', accent: 'anudatta', pitchOffsetCents: -182, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'तुर्', iast: 'tur', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'व', iast: 'va', accent: 'udatta', pitchOffsetCents: 204, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'रे', iast: 're', accent: 'svarita', pitchOffsetCents: 150, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'ण्यम्', iast: 'ṇyam', accent: 'anudatta', pitchOffsetCents: -182, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'भर्', iast: 'bhar', accent: 'svarita', pitchOffsetCents: 100, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'गो', iast: 'go', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'दे', iast: 'de', accent: 'anudatta', pitchOffsetCents: -182, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'व', iast: 'va', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'स्य', iast: 'sya', accent: 'svarita', pitchOffsetCents: 150, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'धी', iast: 'dhī', accent: 'udatta', pitchOffsetCents: 204, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'म', iast: 'ma', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'हि', iast: 'hi', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'धि', iast: 'dhi', accent: 'anudatta', pitchOffsetCents: -182, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'यो', iast: 'yo', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'यो', iast: 'yo', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'नः', iast: 'naḥ', accent: 'svarita', pitchOffsetCents: 150, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'प्र', iast: 'pra', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'चो', iast: 'co', accent: 'anudatta', pitchOffsetCents: -182, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'द', iast: 'da', accent: 'udatta', pitchOffsetCents: 204, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'यात्', iast: 'yāt', accent: 'svarita', pitchOffsetCents: 100, durationMatras: 2, isSchwaPreserved: true }
    ]
  },
  {
    id: 'asato-ma',
    title: 'Asato Mā Sadgamaya (Upanishad)',
    source: 'Bṛhadāraṇyaka Upaniṣad 1.3.28 (Pavamana Mantra)',
    chhandasMeter: 'Anushtubh',
    syllableCount: 32,
    devanagariText: 'ॐ असतो मा सद्गमय । तमसो मा ज्योतिर्गमय । मृत्योर्मा अमृतं गमय ॥',
    iastText: 'oṃ asato mā sadgamaya | tamaso mā jyotirgamaya | mṛtyormā amṛtaṃ gamaya',
    translation: 'From the unreal, lead me to the real; from darkness, lead me to light; from death, lead me to immortality.',
    recommendedRaga: 'Bhairav',
    syllables: [
      { devanagari: 'ॐ', iast: 'oṃ', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 2, isSchwaPreserved: true },
      { devanagari: 'अ', iast: 'a', accent: 'anudatta', pitchOffsetCents: -182, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'स', iast: 'sa', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'तो', iast: 'to', accent: 'udatta', pitchOffsetCents: 204, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'मा', iast: 'mā', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'सद्', iast: 'sad', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'ग', iast: 'ga', accent: 'anudatta', pitchOffsetCents: -182, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'म', iast: 'ma', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'य', iast: 'ya', accent: 'svarita', pitchOffsetCents: 100, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'त', iast: 'ta', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'म', iast: 'ma', accent: 'anudatta', pitchOffsetCents: -182, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'सो', iast: 'so', accent: 'udatta', pitchOffsetCents: 204, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'मा', iast: 'mā', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'ज्यो', iast: 'jyo', accent: 'udatta', pitchOffsetCents: 316, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'तिर्', iast: 'tir', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'ग', iast: 'ga', accent: 'anudatta', pitchOffsetCents: -182, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'म', iast: 'ma', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'य', iast: 'ya', accent: 'svarita', pitchOffsetCents: 100, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'मृ', iast: 'mṛ', accent: 'anudatta', pitchOffsetCents: -182, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'त्योर्', iast: 'tyor', accent: 'udatta', pitchOffsetCents: 204, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'मा', iast: 'mā', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'अ', iast: 'a', accent: 'anudatta', pitchOffsetCents: -182, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'मृ', iast: 'mṛ', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'तं', iast: 'taṃ', accent: 'udatta', pitchOffsetCents: 204, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'ग', iast: 'ga', accent: 'anudatta', pitchOffsetCents: -182, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'म', iast: 'ma', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'य', iast: 'ya', accent: 'svarita', pitchOffsetCents: 100, durationMatras: 2, isSchwaPreserved: true }
    ]
  },
  {
    id: 'maha-mrityunjaya',
    title: 'Mahā Mṛtyuñjaya Mantra (Rigveda 7.59.12)',
    source: 'Rigveda Samhitā Mandala 7, Sukta 59, Richa 12',
    chhandasMeter: 'Anushtubh',
    syllableCount: 32,
    devanagariText: 'ॐ त्र्य॑म्बकं यजामहे सु॒गन्धिं॑ पुष्टि॒वर्ध॑नम् । उ॒र्वा॒रु॒कमि॑व॒ बन्ध॑नान्मृ॒त्योर्मु॑क्षीय॒ मामृता॑त् ॥',
    iastText: 'oṃ tryambakaṃ yajāmahe sugandhiṃ puṣṭivardhanam | urvārukamiva bandhanān mṛtyor mukṣīya māmṛtāt',
    translation: 'We worship the Three-Eyed Lord who is fragrant and nourishes all beings. May He liberate us from death for immortality, as a cucumber is severed from its stalk.',
    recommendedRaga: 'Bhairavi',
    syllables: [
      { devanagari: 'ॐ', iast: 'oṃ', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 2, isSchwaPreserved: true },
      { devanagari: 'त्र्यम्', iast: 'tryam', accent: 'svarita', pitchOffsetCents: 150, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'ब', iast: 'ba', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'कं', iast: 'kaṃ', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'य', iast: 'ya', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'जा', iast: 'jā', accent: 'udatta', pitchOffsetCents: 204, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'म', iast: 'ma', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'हे', iast: 'he', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'सु', iast: 'su', accent: 'anudatta', pitchOffsetCents: -182, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'गन्', iast: 'gan', accent: 'svarita', pitchOffsetCents: 150, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'धिं', iast: 'dhiṃ', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'पुष्', iast: 'puṣ', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'टि', iast: 'ṭi', accent: 'anudatta', pitchOffsetCents: -182, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'वर्', iast: 'var', accent: 'svarita', pitchOffsetCents: 150, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'ध', iast: 'dha', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'नम्', iast: 'nam', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'उर्', iast: 'ur', accent: 'anudatta', pitchOffsetCents: -182, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'वा', iast: 'vā', accent: 'anudatta', pitchOffsetCents: -182, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'रु', iast: 'ru', accent: 'anudatta', pitchOffsetCents: -182, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'क', iast: 'ka', accent: 'svarita', pitchOffsetCents: 150, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'मि', iast: 'mi', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'व', iast: 'va', accent: 'anudatta', pitchOffsetCents: -182, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'बन्', iast: 'ban', accent: 'svarita', pitchOffsetCents: 150, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'ध', iast: 'dha', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'नान्', iast: 'nān', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'मृ', iast: 'mṛ', accent: 'anudatta', pitchOffsetCents: -182, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'त्योर्', iast: 'tyor', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'मु', iast: 'mu', accent: 'svarita', pitchOffsetCents: 150, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'क्षी', iast: 'kṣī', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'य', iast: 'ya', accent: 'anudatta', pitchOffsetCents: -182, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'मा', iast: 'mā', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'मृ', iast: 'mṛ', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'तात्', iast: 'tāt', accent: 'svarita', pitchOffsetCents: 100, durationMatras: 2, isSchwaPreserved: true }
    ]
  },
  {
    id: 'khayal-yaman',
    title: 'Classical Khayal Bandish (Raga Yaman)',
    source: 'Traditional Hindustani Vilambit/Drut Bandish',
    chhandasMeter: 'Custom',
    syllableCount: 16,
    devanagariText: 'एरी आली पिया बिन कल न परत मोहे । निसदिन जियरा बेकल भारी ॥',
    iastText: 'erī ālī piyā bina kala na parata mohe | nisadina jiyarā bekala bhārī',
    translation: 'O friend, without my beloved my heart finds no peace. Day and night, my soul is overwhelmingly restless with longing.',
    recommendedRaga: 'Yaman',
    syllables: [
      { devanagari: 'ए', iast: 'e', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'री', iast: 'rī', accent: 'udatta', pitchOffsetCents: 204, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'आ', iast: 'ā', accent: 'udatta', pitchOffsetCents: 386, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'ली', iast: 'lī', accent: 'svarita', pitchOffsetCents: 590, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'पि', iast: 'pi', accent: 'neutral', pitchOffsetCents: 702, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'या', iast: 'yā', accent: 'udatta', pitchOffsetCents: 906, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'बि', iast: 'bi', accent: 'neutral', pitchOffsetCents: 702, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'न', iast: 'na', accent: 'neutral', pitchOffsetCents: 386, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'क', iast: 'ka', accent: 'anudatta', pitchOffsetCents: 204, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'ल', iast: 'la', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'न', iast: 'na', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'प', iast: 'pa', accent: 'udatta', pitchOffsetCents: 204, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'र', iast: 'ra', accent: 'udatta', pitchOffsetCents: 386, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'त', iast: 'ta', accent: 'neutral', pitchOffsetCents: 204, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'मो', iast: 'mo', accent: 'anudatta', pitchOffsetCents: -182, durationMatras: 1, isSchwaPreserved: true },
      { devanagari: 'हे', iast: 'he', accent: 'neutral', pitchOffsetCents: 0, durationMatras: 1, isSchwaPreserved: true }
    ]
  }
];

export interface SchwaAuditResult {
  isZeroSchwaDeleted: boolean;
  score: number; // 0 to 100%
  deletedWords: { word: string; corrected: string; explanation: string }[];
  summary: string;
}

// Common colloquial deletions vs authentic Vedic/Sanskrit pronunciations
const SCHWA_DELETION_PATTERNS: { [colloquial: string]: { correct: string; expl: string } } = {
  'ram': { correct: 'rāma', expl: 'Terminal short "a" [ɐ] must be vocalized in Sanskrit.' },
  'shiv': { correct: 'śiva', expl: 'Inherent short vowel "a" must be voiced in Vedic chant.' },
  'shivaya': { correct: 'śivāya', expl: 'Preserve full long vowel quantity.' },
  'krishn': { correct: 'kṛṣṇa', expl: 'Syllabic vocalic ṛ and retroflex terminal a.' },
  'yog': { correct: 'yoga', expl: 'Preserve terminal "ga" with vocalic release.' },
  'ved': { correct: 'veda', expl: 'Voiced "da" release.' },
  'mantr': { correct: 'mantra', expl: 'Preserve conjunct tr with terminal a.' },
  'tantr': { correct: 'tantra', expl: 'Preserve conjunct tr with terminal a.' },
  'brahm': { correct: 'brahma', expl: 'Preserve terminal a.' },
  'dhyan': { correct: 'dhyāna', expl: 'Preserve vocalic cadence and final short vowel.' },
  'sur': { correct: 'svara', expl: 'Full conjunct svara instead of colloquial sur.' },
  'rag': { correct: 'rāga', expl: 'Preserve final ga.' },
  'tal': { correct: 'tāla', expl: 'Preserve final la.' },
  'bhagwan': { correct: 'bhagavān', expl: 'Full medial a and diacritic macron.' }
};

export function auditZeroSchwaDeletion(text: string): SchwaAuditResult {
  const words = text.toLowerCase().replace(/[।॥|,.-]/g, '').split(/\s+/).filter(Boolean);
  const deletedWords: { word: string; corrected: string; explanation: string }[] = [];

  words.forEach(w => {
    if (SCHWA_DELETION_PATTERNS[w]) {
      deletedWords.push({
        word: w,
        corrected: SCHWA_DELETION_PATTERNS[w].correct,
        explanation: SCHWA_DELETION_PATTERNS[w].expl
      });
    } else {
      // General rule: terminal non-vowel consonant in Sanskrit usually has inherent a unless marked with halant/virama
      const lastChar = w[w.length - 1];
      if (['m', 't', 'k', 'p', 'n', 's', 'r', 'l', 'd', 'b', 'g', 'j'].includes(lastChar)) {
        if (!w.endsWith('am') && !w.endsWith('aṃ') && !w.endsWith('aḥ') && !w.endsWith('iḥ') && !w.endsWith('uḥ') && !w.endsWith('āt') && !w.endsWith('at')) {
          deletedWords.push({
            word: w,
            corrected: `${w}a`,
            explanation: `Terminal "${lastChar}" likely suffering colloquial schwa deletion. Sanskrit vocalizes terminal [ɐ].`
          });
        }
      }
    }
  });

  const isZeroSchwaDeleted = deletedWords.length === 0;
  const score = isZeroSchwaDeleted ? 100 : Math.max(20, Math.round(100 - (deletedWords.length * 18)));

  return {
    isZeroSchwaDeleted,
    score,
    deletedWords,
    summary: isZeroSchwaDeleted 
      ? 'Verified 100% Zero Schwa-Deletion: Pure Vedic Sanskrit Phonology.'
      : `Found ${deletedWords.length} potential colloquial schwa deletion(s). Auto-repair available.`
  };
}

// Chhandas Meter detection based on syllable count
export function detectChhandasMeter(syllableCount: number): {
  meterName: string;
  description: string;
  padaStructure: string;
  isStandardVedic: boolean;
} {
  if (syllableCount === 24) {
    return {
      meterName: 'Gāyatrī',
      description: 'The supreme Vedic solar meter composed of 3 Pādas of 8 syllables each.',
      padaStructure: '3 × 8 syllables = 24 Akṣaras',
      isStandardVedic: true
    };
  } else if (syllableCount === 32) {
    return {
      meterName: 'Anuṣṭubh (Śloka)',
      description: 'The standard classical and Epic meter composed of 4 Pādas of 8 syllables each.',
      padaStructure: '4 × 8 syllables = 32 Akṣaras (8+8+8+8)',
      isStandardVedic: true
    };
  } else if (syllableCount === 44) {
    return {
      meterName: 'Triṣṭubh',
      description: 'The heroic Vedic meter of 4 Pādas with 11 syllables each (very prominent in Rigveda).',
      padaStructure: '4 × 11 syllables = 44 Akṣaras',
      isStandardVedic: true
    };
  } else if (syllableCount === 48) {
    return {
      meterName: 'Jāgatī',
      description: 'The extensive cosmic Vedic meter of 4 Pādas with 12 syllables each.',
      padaStructure: '4 × 12 syllables = 48 Akṣaras',
      isStandardVedic: true
    };
  } else if (syllableCount === 16) {
    return {
      meterName: 'Teental Khayal (Bandish)',
      description: 'Classical 16-matra rhythmic cadence matching Teental (4+4+4+4 vibhaags).',
      padaStructure: '16 Matras (Teental Sam to Sam)',
      isStandardVedic: false
    };
  } else {
    return {
      meterName: 'Miśra / Custom Chhandas',
      description: `Rhythmic poetic phrase containing ${syllableCount} syllables.`,
      padaStructure: `${syllableCount} Akṣaras`,
      isStandardVedic: false
    };
  }
}

// Generate Dual-Conditioned Vāgdhenu Sanskrit AI Vocal Prompt
export function generateVagdhenuPrompt(
  chant: VedicChantPhrase,
  baseSaHz: number,
  ragaName: string,
  rasa: string
): string {
  const syllablesIpa = chant.syllables.map(s => {
    let accentMark = '';
    if (s.accent === 'udatta') accentMark = '↗[udatta]';
    else if (s.accent === 'anudatta') accentMark = '↘[anudatta]';
    else if (s.accent === 'svarita') accentMark = '⤹[svarita]';
    return `${s.iast}${accentMark}`;
  }).join(' ');

  return `[VAGDHENU_SANSKRIT_VOCAL]
Source: "${chant.source}"
Chhandas Meter: ${chant.chhandasMeter} (${chant.syllableCount} Syllables)
Phonetic Constraints: ZERO_SCHWA_DELETION=TRUE; PURE_SANSKRIT_CADENCE=TRUE
Tuning: Adhara Shadja f_Sa=${baseSaHz.toFixed(2)}Hz; Raga=${ragaName}; Rasa=${rasa}
Svara Accents: Udātta (High Tonic +200c), Anudātta (Low Tonic -182c), Svarita (Descending Glide +150c to 0c)
Devanagari: ${chant.devanagariText}
IAST Phonetic Stream: ${syllablesIpa}
Acoustic Color: High-Res 96kHz Hypersonic Air 20k-48k Sheen Active, Zero Phase Cancellation.`;
}
