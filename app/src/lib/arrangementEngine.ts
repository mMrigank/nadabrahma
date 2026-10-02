import { 
  ArrangementSection, ArrangementPreset, ClassicalMovementType, 
  WesternStructureType, TrackRole, Track, Raga, Tala, AudioClip 
} from '../types/daw';

export interface MovementMeta {
  type: ClassicalMovementType;
  sanskritName: string;
  englishTitle: string;
  laya: 'Ati-Vilambit (Ultra-Slow)' | 'Vilambit (Slow)' | 'Madhya (Medium)' | 'Drut (Fast)' | 'Ati-Drut (Climax)';
  meterType: 'Anibaddha (Unmetered, Free Time)' | 'Nibaddha (Metered in Tala)';
  icon: string;
  defaultColor: string;
  defaultEnergy: number;
  westernEquivalent: WesternStructureType;
  description: string;
  characteristicFeatures: string[];
}

export const MOVEMENT_META: Record<ClassicalMovementType, MovementMeta> = {
  alap: {
    type: 'alap',
    sanskritName: 'आलाप (Ālāpa)',
    englishTitle: 'Alap (Contemplative Exploration)',
    laya: 'Ati-Vilambit (Ultra-Slow)',
    meterType: 'Anibaddha (Unmetered, Free Time)',
    icon: '🕊️',
    defaultColor: '#b08d57', // Warm Sandstone Ochre
    defaultEnergy: 1,
    westernEquivalent: 'intro',
    description: 'Serene, unhurried unfolding of the Raga Swaras starting from Mandra Saptak (lower octave) up to Madhya Sa. Pure melody, zero percussion.',
    characteristicFeatures: [
      'Zero percussion / drums muted',
      'Continuous Tanpura drone anchoring Moveable Sa',
      'Deep Meend glides between Vadi and Samvadi notes',
      'Contemplative microtonal 22 Shrutis inflection'
    ]
  },
  jor: {
    type: 'jor',
    sanskritName: 'जोड़ (Joḍa)',
    englishTitle: 'Jor (Rhythmic Pulse Emergence)',
    laya: 'Vilambit (Slow)',
    meterType: 'Anibaddha (Unmetered, Free Time)',
    icon: '🌊',
    defaultColor: '#528275', // Sage Celadon
    defaultEnergy: 2,
    westernEquivalent: 'verse',
    description: 'A steady acoustic pulse without a formal Tala cycle. The melody instruments strum acoustic pulse beats while expanding into the upper octave (Tara Saptak).',
    characteristicFeatures: [
      'Steady rhythmic stroke pulse (Da-Ra-Da-Ra)',
      'No tabla yet, but tempo is established',
      'Expanding into Tara Saptak (high octave)',
      'Flowing gamakas and gradual dynamic build'
    ]
  },
  jhala: {
    type: 'jhala',
    sanskritName: 'झाला (Jhālā)',
    englishTitle: 'Jhala (Chikari Sparkle & Strum)',
    laya: 'Madhya (Medium)',
    meterType: 'Nibaddha (Metered in Tala)',
    icon: '⚡',
    defaultColor: '#8f6277', // Dusty Mauve
    defaultEnergy: 4,
    westernEquivalent: 'pre_chorus',
    description: 'High-speed percussive strumming on the high Chikari drone strings alternating with melodic strokes. Creates an intoxicating, dancing rhythmic flutter.',
    characteristicFeatures: [
      'Rapid Chikari string strumming (Da-Ra-Ra-Ra)',
      'Interlocking rhythmic patterns',
      'Dynamic intensity ramp',
      'Precursor to composition entry or final climax'
    ]
  },
  vilambit_gat: {
    type: 'vilambit_gat',
    sanskritName: 'विलम्बित गत (Vilambita Gata)',
    englishTitle: 'Vilambit Gat (Slow Tala Composition)',
    laya: 'Vilambit (Slow)',
    meterType: 'Nibaddha (Metered in Tala)',
    icon: '🥁',
    defaultColor: '#5d7491', // Slate Blue
    defaultEnergy: 2,
    westernEquivalent: 'verse',
    description: 'The formal entry of the Tala rhythm (e.g. Teental, Rupak, Ektaal). The percussionist introduces the full acoustic Theka as the soloist plays the formal Bandish / Gat.',
    characteristicFeatures: [
      'Full Tabla / Pakhawaj entry on Sam (Beat 0)',
      'Fixed melodic theme (Bandish / Sthayi)',
      'Slow rhythmic breathing space',
      'Somatic subharmonics and deep bass resonance'
    ]
  },
  madhya_gat: {
    type: 'madhya_gat',
    sanskritName: 'मध्य गत (Madhya Gata)',
    englishTitle: 'Madhya Gat (Medium Tempo Improvisation)',
    laya: 'Madhya (Medium)',
    meterType: 'Nibaddha (Metered in Tala)',
    icon: '🎵',
    defaultColor: '#8c7750', // Smoked Teak
    defaultEnergy: 3,
    westernEquivalent: 'chorus',
    description: 'Medium tempo development featuring lyrical Taans, Bol-alaps, and Layakari (rhythmic counterpoint). The conversation between soloist and percussion intensifies.',
    characteristicFeatures: [
      'Fluid 8th and 16th note melodic taans',
      'Layakari (dugun and tigun rhythmic doubling)',
      'Interactive Sawaal-Jawaab (call and response)',
      'Vocal lyric embellishments'
    ]
  },
  drut_gat: {
    type: 'drut_gat',
    sanskritName: 'द्रुत गत (Druta Gata)',
    englishTitle: 'Drut Gat (Fast Virtuosic Variations)',
    laya: 'Drut (Fast)',
    meterType: 'Nibaddha (Metered in Tala)',
    icon: '🔥',
    defaultColor: '#a06352', // Terracotta Clay
    defaultEnergy: 4,
    westernEquivalent: 'drop',
    description: 'Fast-paced, adrenaline-fueled composition. Lightning-fast Taans, Palta variations, and dense percussion rolls driving toward ecstasy.',
    characteristicFeatures: [
      'High-velocity 16th/32nd note runs',
      'Rapid Tabla Theka and Rela flourishes',
      'Full polyphonic layering across all tracks',
      'Driving bass groove and hypersonic air'
    ]
  },
  jhala_climax: {
    type: 'jhala_climax',
    sanskritName: 'द्रुत झाला (Druta Jhālā Climax)',
    englishTitle: 'Jhala Climax (Speed & Sound Wall)',
    laya: 'Ati-Drut (Climax)',
    meterType: 'Nibaddha (Metered in Tala)',
    icon: '🚀',
    defaultColor: '#c25e40', // Vermillion Ember
    defaultEnergy: 5,
    westernEquivalent: 'drop',
    description: 'The ecstatic pinnacle of the concert. All instruments playing at maximum speed and energy, building an overwhelming acoustic sonic tapestry.',
    characteristicFeatures: [
      'Max tempo (140-180+ BPM)',
      'Relentless Chikari and tabla rela speed',
      'Cinematic rises and somatic sub braams',
      'Peak emotional absorption (Rasa transcendence)'
    ]
  },
  tihai: {
    type: 'tihai',
    sanskritName: 'तिहाई (Tihāī)',
    englishTitle: 'Tihai (Triple Cadence on Sam)',
    laya: 'Ati-Drut (Climax)',
    meterType: 'Nibaddha (Metered in Tala)',
    icon: '🕉️',
    defaultColor: '#c4923e', // Pure Brass Gold
    defaultEnergy: 5,
    westernEquivalent: 'outro',
    description: 'A virtuosic polyrhythmic phrase repeated exactly THREE times with mathematical perfection, landing with thunderous finality on the Sam (Beat 0).',
    characteristicFeatures: [
      'Mathematical 3-part rhythmic repetition',
      'Precision landing on Sam (Beat 1 of cycle)',
      'Grand unified acoustic punctuation',
      'Resonant reverb tail lingering in sacred silence'
    ]
  }
};

export const ARRANGEMENT_PRESETS: ArrangementPreset[] = [
  {
    id: 'khayal_64',
    name: 'Classical Khayal Concert Suite (64 Bars)',
    sanskritTitle: 'ख्याल राग संरचना (६४ आवर्तन)',
    description: 'The golden standard of North Indian classical concerts: unmetered Alap introduction, meditative pulse Jor, full Tabla entry in Vilambit Gat, and a breathless Drut Jhala finale with Tihai.',
    totalBars: 64,
    suggestedBpm: 96,
    sections: [
      {
        name: 'Alap (Contemplative Raga Invocation)',
        sanskritName: 'आलाप',
        movementType: 'alap',
        westernEquivalent: 'intro',
        startBar: 1,
        durationBars: 16,
        color: '#b08d57',
        targetBpm: 60,
        tempoRamp: 'none',
        activeRoles: ['solo_instrument', 'lead_vocal', 'ambient_pad'],
        description: 'Zero percussion. Solo instrument, voice, and drone introduce the Raga swaras.',
        energyLevel: 1
      },
      {
        name: 'Jor (Acoustic Pulse Emergence)',
        sanskritName: 'जोड़',
        movementType: 'jor',
        westernEquivalent: 'verse',
        startBar: 17,
        durationBars: 16,
        color: '#528275',
        targetBpm: 76,
        tempoRamp: 'linear_accel',
        activeRoles: ['solo_instrument', 'lead_vocal', 'drone', 'ambient_pad'],
        description: 'Pulse develops. Strings and woodwinds play rhythmic melodic ostinatos.',
        energyLevel: 2
      },
      {
        name: 'Vilambit Gat (Tala & Tabla Entry)',
        sanskritName: 'विलम्बित गत',
        movementType: 'vilambit_gat',
        westernEquivalent: 'verse',
        startBar: 33,
        durationBars: 16,
        color: '#5d7491',
        targetBpm: 88,
        tempoRamp: 'none',
        activeRoles: ['solo_instrument', 'lead_vocal', 'percussion_tala', 'drone', 'ambient_pad'],
        description: 'Full Tabla Theka enters on Sam. Main Bandish composition is stated.',
        energyLevel: 3
      },
      {
        name: 'Drut Jhala & Tihai Finale',
        sanskritName: 'द्रुत झाला व तिहाई',
        movementType: 'drut_gat',
        westernEquivalent: 'drop',
        startBar: 49,
        durationBars: 16,
        color: '#a06352',
        targetBpm: 124,
        tempoRamp: 'linear_accel',
        activeRoles: ['solo_instrument', 'lead_vocal', 'percussion_tala', 'modern_beats', 'risers_drops', 'ambient_pad'],
        description: 'Blistering speed, high Chikari strumming, culminating in a 3-fold Tihai landing on Sam.',
        energyLevel: 5
      }
    ]
  },
  {
    id: 'dhrupad_128',
    name: 'Ancient Dhrupad Grand Suite (128 Bars)',
    sanskritTitle: 'ध्रुपद महाकाव्य संरचना (१२८ आवर्तन)',
    description: 'Solemn, monumental ancient Vedic Dhrupad form. Deep meditative Alap with Rudra Veena and Vedic Sanskrit chanting, transitioning into rhythmic Nom-Tom Jor, massive Pakhawaj Dhamar Gat, and an epic Jhala.',
    totalBars: 128,
    suggestedBpm: 72,
    sections: [
      {
        name: 'Dhyana Alap (Sacred Meditation)',
        sanskritName: 'ध्यान आलाप',
        movementType: 'alap',
        westernEquivalent: 'intro',
        startBar: 1,
        durationBars: 32,
        color: '#b08d57',
        targetBpm: 52,
        tempoRamp: 'none',
        activeRoles: ['solo_instrument', 'vedic_chant', 'ambient_pad'],
        description: 'Deep unmetered meditation. Rudra Veena low tones and Vedic Sanskrit recitation.',
        energyLevel: 1
      },
      {
        name: 'Nom-Tom Jor (Rhythmic Syllables)',
        sanskritName: 'नोम-तोम जोड़',
        movementType: 'jor',
        westernEquivalent: 'verse',
        startBar: 33,
        durationBars: 32,
        color: '#528275',
        targetBpm: 70,
        tempoRamp: 'linear_accel',
        activeRoles: ['solo_instrument', 'vedic_chant', 'solo_instrument', 'ambient_pad'],
        description: 'Traditional syllables (Ta, Ra, Na, Ri) in rhythmic pulsing patterns.',
        energyLevel: 2
      },
      {
        name: 'Dhamar Pakhawaj Gat (14 Matras)',
        sanskritName: 'धमार पखावज गत',
        movementType: 'vilambit_gat',
        westernEquivalent: 'verse',
        startBar: 65,
        durationBars: 32,
        color: '#5d7491',
        targetBpm: 84,
        tempoRamp: 'none',
        activeRoles: ['solo_instrument', 'vedic_chant', 'percussion_tala', 'ambient_pad'],
        description: 'Monumental Pakhawaj strokes (Dha Dha Thin Ta) anchoring the sacred chant.',
        energyLevel: 4
      },
      {
        name: 'Drut Jhala & Maha-Tihai',
        sanskritName: 'द्रुत झाला व महा-तिहाई',
        movementType: 'jhala_climax',
        westernEquivalent: 'drop',
        startBar: 97,
        durationBars: 32,
        color: '#c25e40',
        targetBpm: 120,
        tempoRamp: 'exp_accel',
        activeRoles: ['solo_instrument', 'vedic_chant', 'percussion_tala', 'modern_beats', 'risers_drops', 'ambient_pad'],
        description: 'Full acoustic crescendo with 10Hz somatic sub drops and triple resolving Tihai.',
        energyLevel: 5
      }
    ]
  },
  {
    id: 'fusion_64',
    name: 'Contemporary Raga Fusion & Drop (64 Bars)',
    sanskritTitle: 'राग फ्यूजन व आधुनिक ड्रॉप (६४ आवर्तन)',
    description: 'Dynamic East-meets-West structure: atmospheric intro with hypersonic flute, melodic verse, high-octane build-up with cinematic risers, massive electronic/acoustic drop, and a mathematically precise Tihai outro.',
    totalBars: 64,
    suggestedBpm: 110,
    sections: [
      {
        name: 'Atmospheric Intro (Dawn Foley & Bansuri)',
        sanskritName: 'प्रस्तावना (Intro)',
        movementType: 'alap',
        westernEquivalent: 'intro',
        startBar: 1,
        durationBars: 8,
        color: '#b08d57',
        targetBpm: 90,
        tempoRamp: 'none',
        activeRoles: ['solo_instrument', 'ambient_pad'],
        description: 'Sparse morning ghat foley and delicate flute opening with hypersonic air.',
        energyLevel: 1
      },
      {
        name: 'Melodic Verse (Vocal & Sitar Hook)',
        sanskritName: 'राग स्थायी (Verse)',
        movementType: 'vilambit_gat',
        westernEquivalent: 'verse',
        startBar: 9,
        durationBars: 16,
        color: '#5d7491',
        targetBpm: 100,
        tempoRamp: 'none',
        activeRoles: ['solo_instrument', 'lead_vocal', 'percussion_tala', 'ambient_pad'],
        description: 'Core vocal theme and Sitar counter-melody over mellow tabla groove.',
        energyLevel: 2
      },
      {
        name: 'Rhythmic Build / Pre-Drop (Rising Jhala)',
        sanskritName: 'उभार (Build)',
        movementType: 'jhala',
        westernEquivalent: 'pre_chorus',
        startBar: 25,
        durationBars: 16,
        color: '#8f6277',
        targetBpm: 116,
        tempoRamp: 'linear_accel',
        activeRoles: ['solo_instrument', 'lead_vocal', 'percussion_tala', 'risers_drops', 'ambient_pad'],
        description: 'Accelerating Chikari strumming, rising percussion rolls, and 8-bar pink noise riser.',
        energyLevel: 4
      },
      {
        name: 'Peak Climax Drop (Full Power Raga Groove)',
        sanskritName: 'महा-ड्रॉप (Drop)',
        movementType: 'drut_gat',
        westernEquivalent: 'drop',
        startBar: 41,
        durationBars: 16,
        color: '#c25e40',
        targetBpm: 128,
        tempoRamp: 'none',
        activeRoles: ['solo_instrument', 'lead_vocal', 'percussion_tala', 'modern_beats', 'risers_drops', 'ambient_pad'],
        description: 'Massive energetic drop with Somatic 10Hz sub braam and blazing virtuoso Sitar taans.',
        energyLevel: 5
      },
      {
        name: 'Tihai & Ambient Outro',
        sanskritName: 'तिहाई व उपसंहार (Outro)',
        movementType: 'tihai',
        westernEquivalent: 'outro',
        startBar: 57,
        durationBars: 8,
        color: '#c4923e',
        targetBpm: 100,
        tempoRamp: 'none',
        activeRoles: ['solo_instrument', 'percussion_tala', 'ambient_pad'],
        description: 'Triple cadence resolving on Sam, fading into lingering temple reverb.',
        energyLevel: 2
      }
    ]
  },
  {
    id: 'bhakti_64',
    name: 'Bhakti Kirtan & Bhajan Suite (64 Bars)',
    sanskritTitle: 'भक्ति संकीर्तन संरचना (६४ आवर्तन)',
    description: 'Devotional ecstasy structure: humble prayer invocation, call-and-response Bhajan verse, soaring choral Antara chorus, accelerating Dholak/Manjira groove, and blissful Mahamantra Tihai.',
    totalBars: 64,
    suggestedBpm: 92,
    sections: [
      {
        name: 'Mangalacharan (Prayer Invocation)',
        sanskritName: 'मङ्गलाचरण',
        movementType: 'alap',
        westernEquivalent: 'intro',
        startBar: 1,
        durationBars: 8,
        color: '#b08d57',
        targetBpm: 72,
        tempoRamp: 'none',
        activeRoles: ['vedic_chant', 'solo_instrument', 'ambient_pad'],
        description: 'Quiet devotional opening chanting ancient Sanskrit peace shlokas.',
        energyLevel: 1
      },
      {
        name: 'Sthayi (Bhajan Call & Response)',
        sanskritName: 'स्थायी पद',
        movementType: 'vilambit_gat',
        westernEquivalent: 'verse',
        startBar: 9,
        durationBars: 16,
        color: '#5d7491',
        targetBpm: 86,
        tempoRamp: 'none',
        activeRoles: ['lead_vocal', 'vedic_chant', 'solo_instrument', 'percussion_tala'],
        description: 'Lead singer states the devotional line, followed by acoustic response.',
        energyLevel: 2
      },
      {
        name: 'Antara (Soaring Choral Chorus)',
        sanskritName: 'अन्तरा पद',
        movementType: 'madhya_gat',
        westernEquivalent: 'chorus',
        startBar: 25,
        durationBars: 16,
        color: '#8c7750',
        targetBpm: 98,
        tempoRamp: 'none',
        activeRoles: ['lead_vocal', 'vedic_chant', 'solo_instrument', 'percussion_tala', 'ambient_pad'],
        description: 'High-octave ecstatic chorus with full choir and bright manjira bells.',
        energyLevel: 4
      },
      {
        name: 'Drut Kirtan (Dholak Dance Acceleration)',
        sanskritName: 'द्रुत कीर्तन',
        movementType: 'drut_gat',
        westernEquivalent: 'drop',
        startBar: 41,
        durationBars: 16,
        color: '#a06352',
        targetBpm: 120,
        tempoRamp: 'linear_accel',
        activeRoles: ['lead_vocal', 'vedic_chant', 'solo_instrument', 'percussion_tala', 'modern_beats'],
        description: 'Fast energetic chanting with driving Dholak Kaharwa rhythms.',
        energyLevel: 5
      },
      {
        name: 'Mahamantra Tihai on Sam',
        sanskritName: 'महामन्त्र तिहाई',
        movementType: 'tihai',
        westernEquivalent: 'outro',
        startBar: 57,
        durationBars: 8,
        color: '#c4923e',
        targetBpm: 90,
        tempoRamp: 'none',
        activeRoles: ['lead_vocal', 'vedic_chant', 'percussion_tala', 'ambient_pad'],
        description: 'Triumphant 3-fold mantra cadence resolving on Sam with resonant temple bell.',
        energyLevel: 3
      }
    ]
  },
  {
    id: 'cinematic_256',
    name: 'Epic 256-Bar Raga Symphony (Extended Concert)',
    sanskritTitle: 'महा-राग महाकाव्य (२५६ आवर्तन)',
    description: 'An expansive symphonic classical journey: 64 bars of deep meditative Alap, 64 bars of pulsing Jor, 64 bars of intricate Vilambit/Madhya Gat, and 64 bars of explosive Drut Jhala & triple Mahatihai.',
    totalBars: 256,
    suggestedBpm: 84,
    sections: [
      {
        name: 'Mandra Alap (Subterranean Swara Discovery)',
        sanskritName: 'मन्द्र आलाप',
        movementType: 'alap',
        westernEquivalent: 'intro',
        startBar: 1,
        durationBars: 64,
        color: '#b08d57',
        targetBpm: 56,
        tempoRamp: 'none',
        activeRoles: ['solo_instrument', 'lead_vocal', 'ambient_pad'],
        description: 'Unmetered 64-bar profound unfolding through all 22 Shrutis of the lower and middle octaves.',
        energyLevel: 1
      },
      {
        name: 'Tara Jor (Upper Octave Pulse)',
        sanskritName: 'तार जोड़',
        movementType: 'jor',
        westernEquivalent: 'verse',
        startBar: 65,
        durationBars: 64,
        color: '#528275',
        targetBpm: 78,
        tempoRamp: 'linear_accel',
        activeRoles: ['solo_instrument', 'solo_instrument', 'ambient_pad'],
        description: 'Hypnotic rhythmic pulses climbing into the high register without drums.',
        energyLevel: 2
      },
      {
        name: 'Vilambit & Madhya Gat (Tala Unveiling)',
        sanskritName: 'विलम्बित व मध्य गत',
        movementType: 'vilambit_gat',
        westernEquivalent: 'chorus',
        startBar: 129,
        durationBars: 64,
        color: '#5d7491',
        targetBpm: 92,
        tempoRamp: 'linear_accel',
        activeRoles: ['solo_instrument', 'lead_vocal', 'percussion_tala', 'ambient_pad'],
        description: '64 bars of structured composition in Tala with virtuosic Layakari taans.',
        energyLevel: 4
      },
      {
        name: 'Drut Jhala & Grand Tihai (Cosmic Resolution)',
        sanskritName: 'द्रुत झाला व ब्रह्माण्ड तिहाई',
        movementType: 'jhala_climax',
        westernEquivalent: 'drop',
        startBar: 193,
        durationBars: 64,
        color: '#c25e40',
        targetBpm: 136,
        tempoRamp: 'exp_accel',
        activeRoles: ['solo_instrument', 'lead_vocal', 'percussion_tala', 'modern_beats', 'risers_drops', 'ambient_pad'],
        description: 'Unrelenting velocity with 10Hz somatic braams, Chikari fireworks, and grand triple Tihai.',
        energyLevel: 5
      }
    ]
  }
];

class ArrangementEngine {
  /**
   * Generates default arrangement sections tailored to the current total bars
   */
  generateDefaultSections(totalBars: number = 64): ArrangementSection[] {
    if (totalBars >= 256) {
      return this.instantiatePreset(ARRANGEMENT_PRESETS[4]); // cinematic_256
    } else if (totalBars >= 128) {
      return this.instantiatePreset(ARRANGEMENT_PRESETS[1]); // dhrupad_128
    } else {
      // Default 64 or scale 32
      const preset = ARRANGEMENT_PRESETS[0]; // khayal_64
      const instantiated = this.instantiatePreset(preset);
      if (totalBars !== 64) {
        return this.rescaleSections(instantiated, totalBars);
      }
      return instantiated;
    }
  }

  /**
   * Converts a preset's sections into fully qualified ArrangementSection instances
   */
  instantiatePreset(preset: ArrangementPreset): ArrangementSection[] {
    return preset.sections.map((sec, idx) => ({
      ...sec,
      id: `sec-${preset.id}-${idx + 1}-${Date.now()}`
    }));
  }

  /**
   * Identifies which arrangement section contains the current bar
   */
  calculateCurrentSection(sections: ArrangementSection[], currentBar: number): ArrangementSection | null {
    if (!sections || sections.length === 0) return null;
    return sections.find(s => currentBar >= s.startBar && currentBar < s.startBar + s.durationBars) || sections[0] || null;
  }

  /**
   * Calculates the target tempo at a given bar accounting for linear/exponential tempo ramps
   */
  calculateDynamicBpm(sections: ArrangementSection[], currentBar: number, fallbackBpm: number): number {
    const currentSection = this.calculateCurrentSection(sections, currentBar);
    if (!currentSection) return fallbackBpm;

    if (!currentSection.tempoRamp || currentSection.tempoRamp === 'none') {
      return currentSection.targetBpm;
    }

    // Find next section's target BPM
    const currentIndex = sections.findIndex(s => s.id === currentSection.id);
    const nextSection = sections[currentIndex + 1];
    if (!nextSection) return currentSection.targetBpm;

    const progress = (currentBar - currentSection.startBar) / Math.max(1, currentSection.durationBars);
    const startBpm = currentSection.targetBpm;
    const endBpm = nextSection.targetBpm;

    if (currentSection.tempoRamp === 'linear_accel') {
      return Math.round(startBpm + (endBpm - startBpm) * progress);
    } else if (currentSection.tempoRamp === 'exp_accel') {
      return Math.round(startBpm * Math.pow(endBpm / startBpm, progress));
    }

    return currentSection.targetBpm;
  }

  /**
   * Rescales an existing set of sections to match an updated arrangement totalBars length
   */
  rescaleSections(sections: ArrangementSection[], newTotalBars: number): ArrangementSection[] {
    if (!sections || sections.length === 0) return this.generateDefaultSections(newTotalBars);
    const oldTotal = sections.reduce((acc, s) => Math.max(acc, s.startBar + s.durationBars - 1), 0);
    if (oldTotal <= 0) return this.generateDefaultSections(newTotalBars);

    let currentStart = 1;
    return sections.map((sec, idx) => {
      const isLast = idx === sections.length - 1;
      const proportion = sec.durationBars / oldTotal;
      const duration = isLast 
        ? Math.max(4, newTotalBars - currentStart + 1)
        : Math.max(4, Math.round(proportion * newTotalBars));
      
      const newSec: ArrangementSection = {
        ...sec,
        startBar: currentStart,
        durationBars: duration
      };
      currentStart += duration;
      return newSec;
    });
  }

  /**
   * 1-Click Multi-Track Generator:
   * Populates musically coherent clips across all tracks aligned to the arrangement sections,
   * respecting Indian Classical musicology (e.g. Alap = zero drums, Sitar = Meend glides, etc.)
   */
  generateMultiTrackArrangementClips(
    sections: ArrangementSection[], 
    tracks: Track[], 
    raga: Raga, 
    tala: Tala, 
    baseSaHz: number
  ): Track[] {
    // Generate clips for each track based on its role and each section's characteristics
    return tracks.map(track => {
      const newClips: AudioClip[] = [];

      sections.forEach((section, sIdx) => {
        const isRoleActive = section.activeRoles.includes(track.role) || 
          (track.busGroup === 'Percussion' && section.movementType !== 'alap');

        if (!isRoleActive && section.movementType === 'alap' && track.busGroup === 'Percussion') {
          // Indian Classical rule: Alap has ZERO percussion
          return;
        }

        const clipId = `clip-arr-${track.id}-s${sIdx}-${Date.now()}`;
        const clipName = `${track.name.replace(/^[0-9.]+\s*/, '')} (${section.name.split(' ')[0]})`;

        // Generate melodic Swara notes appropriate for the section and Raga
        const swaraNotes = this.generateSectionSwaras(track.role, section.movementType, raga);

        newClips.push({
          id: clipId,
          name: clipName,
          startBar: section.startBar,
          durationBars: section.durationBars,
          color: section.color,
          swaraNotes
        });
      });

      return {
        ...track,
        clips: newClips.length > 0 ? newClips : track.clips
      };
    });
  }

  /**
   * Generates authentic Swaras from the active Raga based on the movement type
   */
  private generateSectionSwaras(
    role: TrackRole, 
    movement: ClassicalMovementType, 
    raga: Raga
  ): { swara: string; pitchMidi: number; bar: number; duration: number }[] {
    const swaraList = raga.swaras.split(/\s+/).filter(Boolean);
    const notes: { swara: string; pitchMidi: number; bar: number; duration: number }[] = [];

    // Scale root midi: default 60 (C4)
    const baseMidi = 60;
    const svaraToSemitone: Record<string, number> = {
      'S': 0, 'r': 1, 'R': 2, 'g': 3, 'G': 4,
      'm': 5, "M'": 6, 'P': 7, 'd': 8, 'D': 9, 'n': 10, 'N': 11
    };

    if (movement === 'alap') {
      // Long, contemplative notes around Vadi & Samvadi
      const vadi = raga.vadi || swaraList[0] || 'S';
      const samvadi = raga.samvadi || swaraList[3] || 'P';
      notes.push(
        { swara: 'S', pitchMidi: baseMidi, bar: 1, duration: 4 },
        { swara: vadi, pitchMidi: baseMidi + (svaraToSemitone[vadi] || 4), bar: 5, duration: 4 },
        { swara: samvadi, pitchMidi: baseMidi + (svaraToSemitone[samvadi] || 7), bar: 9, duration: 4 },
        { swara: 'S', pitchMidi: baseMidi, bar: 13, duration: 4 }
      );
    } else if (movement === 'jor') {
      // Pulsing 2-bar phrases
      swaraList.slice(0, 4).forEach((swara, idx) => {
        notes.push({
          swara,
          pitchMidi: baseMidi + (svaraToSemitone[swara] || (idx * 2)),
          bar: 1 + idx * 2,
          duration: 2
        });
      });
    } else if (movement === 'drut_gat' || movement === 'jhala') {
      // Fast melodic runs (taans)
      swaraList.forEach((swara, idx) => {
        notes.push({
          swara,
          pitchMidi: baseMidi + (svaraToSemitone[swara] || (idx * 2)),
          bar: 1 + idx,
          duration: 1
        });
      });
    } else if (movement === 'tihai') {
      // Triple repetition ending on Sa
      for (let i = 0; i < 3; i++) {
        notes.push(
          { swara: 'P', pitchMidi: baseMidi + 7, bar: 1 + i * 2, duration: 1 },
          { swara: 'D', pitchMidi: baseMidi + 9, bar: 1.5 + i * 2, duration: 0.5 }
        );
      }
      notes.push({ swara: 'S', pitchMidi: baseMidi + 12, bar: 7, duration: 2 });
    }

    return notes;
  }
}

export const arrangementEngine = new ArrangementEngine();
