export interface InstrumentOption {
  id: string;
  name: string;
  shortName: string;
  family: string;
  icon: string;
  desc: string;
  previewPitch: number; // Hz for preview
}

export interface InstrumentFamily {
  id: string;
  familyTitle: string;
  indianClassicalCategory: string; // Tata, Sushira, Avanaddha, Ghana, etc.
  icon: string;
  instruments: InstrumentOption[];
}

export const INSTRUMENT_FAMILIES: { [roleKey: string]: InstrumentFamily } = {
  // Track 3: Strings (Tata Vadya)
  strings: {
    id: 'strings',
    familyTitle: 'Strings Family',
    indianClassicalCategory: 'Tata Vadya (Plucked & Bowed)',
    icon: '🪕',
    instruments: [
      {
        id: 'sitar',
        name: 'Sitar (Meend Microtonal Glides)',
        shortName: 'Sitar',
        family: 'Strings',
        icon: '🪕',
        desc: 'Vilayat Khan & Ravi Shankar styles with 7 main strings and 13 tarab sympathetic strings.',
        previewPitch: 293.66 // D4
      },
      {
        id: 'sarod',
        name: 'Sarod (Fretless Metallic Sustain)',
        shortName: 'Sarod',
        family: 'Strings',
        icon: '🎻',
        desc: 'Fretless steel fingerboard played with coconut shell plectrum (Jawa) for deep vocal meends.',
        previewPitch: 220.00 // A3
      },
      {
        id: 'saraswati_veena',
        name: 'Saraswati Veena (Carnatic Classical)',
        shortName: 'S. Veena',
        family: 'Strings',
        icon: '🪕',
        desc: 'Ancient 24-fret south Indian lute with resonant jackwood resonator and deep gamakas.',
        previewPitch: 261.63 // C4
      },
      {
        id: 'rudra_veena',
        name: 'Rudra Veena (Ancient Dhrupad Bass)',
        shortName: 'Rudra Veena',
        family: 'Strings',
        icon: '🪕',
        desc: 'Tubular zither with two large pumpkin gourds producing profound, meditative low-frequency tones.',
        previewPitch: 130.81 // C3
      },
      {
        id: 'santoor',
        name: 'Santoor (100-String Kashmiri Hammered)',
        shortName: 'Santoor',
        family: 'Strings',
        icon: '🎼',
        desc: 'Trapezoidal walnut instrument with 100 strings struck with delicate walnut mezrab strikers.',
        previewPitch: 329.63 // E4
      },
      {
        id: 'sarangi',
        name: 'Sarangi (Bowed Voice of 39 Strings)',
        shortName: 'Sarangi',
        family: 'Strings',
        icon: '🎻',
        desc: 'Fretless bowed instrument made from a single block of tun wood, closest acoustic match to the human vocal cord.',
        previewPitch: 277.18 // C#4
      },
      {
        id: 'dilruba_esraj',
        name: 'Dilruba & Esraj (Bowed Sympathetic)',
        shortName: 'Dilruba',
        family: 'Strings',
        icon: '🎻',
        desc: 'Fretted neck of a sitar combined with bowed goat-skin parchment soundbox and sympathetic strings.',
        previewPitch: 246.94 // B3
      },
      {
        id: 'tanpura',
        name: 'Tanpura Drone (4-String Acoustic Grounding)',
        shortName: 'Tanpura',
        family: 'Strings',
        icon: '🪕',
        desc: 'Continuous harmonic overtone drone tuned strictly to Pa-Sa-Sa-Sa ($3:2$ ratio).',
        previewPitch: 138.59 // C#3
      },
      {
        id: 'guitar_acoustic',
        name: 'Acoustic 12-String Guitar (Steel Hybrid)',
        shortName: '12-Str Guitar',
        family: 'Strings',
        icon: '🎸',
        desc: 'Rich doubled-course acoustic chime with extended micro-vibrato and fingerpicking textures.',
        previewPitch: 329.63 // E4
      },
      {
        id: 'cello_solo',
        name: 'Orchestral Cello & Viola (Deep Bowed)',
        shortName: 'Cello',
        family: 'Strings',
        icon: '🎻',
        desc: 'Warm, woody low register bowed acoustic sustain with natural room reverberation.',
        previewPitch: 164.81 // E3
      }
    ]
  },

  // Track 4: Winds & Flutes (Sushira Vadya)
  winds: {
    id: 'winds',
    familyTitle: 'Winds & Flutes Family',
    indianClassicalCategory: 'Sushira Vadya (Wind & Reeds)',
    icon: '🪈',
    instruments: [
      {
        id: 'bansuri',
        name: 'Bansuri Flute (Hypersonic Sheen)',
        shortName: 'Bansuri',
        family: 'Winds',
        icon: '🪈',
        desc: 'Sub-octave E bass bamboo flute with rich breath noise and 20k-48k Hz hypersonic air.',
        previewPitch: 329.63 // E4
      },
      {
        id: 'venu',
        name: 'Venu Bamboo Flute (Carnatic 8-Hole)',
        shortName: 'Venu',
        family: 'Winds',
        icon: '🪈',
        desc: 'Crisp, articulate 8-holed south Indian flute renowned for rapid gamakas and microtonal shifts.',
        previewPitch: 369.99 // F#4
      },
      {
        id: 'shehnai',
        name: 'Shehnai (Acoustic Ceremonial Oboe)',
        shortName: 'Shehnai',
        family: 'Winds',
        icon: '🎺',
        desc: 'Quadruple-reed ceremonial instrument with a piercing, emotionally charged nasal timbre.',
        previewPitch: 440.00 // A4
      },
      {
        id: 'nadaswaram',
        name: 'Nadaswaram (Temple Double-Reed)',
        shortName: 'Nadaswaram',
        family: 'Winds',
        icon: '🎺',
        desc: 'Grand double-reed wind instrument of south Indian temples with unmatched acoustic projection.',
        previewPitch: 293.66 // D4
      },
      {
        id: 'harmonium',
        name: 'Harmonium (Hand-Pumped Reed Organ)',
        shortName: 'Harmonium',
        family: 'Winds',
        icon: '🎹',
        desc: 'Twin-reed hand-pumped organ providing rich, dense chordal and melodic vocal accompaniment.',
        previewPitch: 261.63 // C4
      },
      {
        id: 'shakuhachi',
        name: 'Shakuhachi (Japanese Zen Bamboo)',
        shortName: 'Shakuhachi',
        family: 'Winds',
        icon: '🪈',
        desc: 'End-blown Japanese bamboo flute with expressive breath attacks (meri/kari) and ethereal resonance.',
        previewPitch: 293.66 // D4
      },
      {
        id: 'duduk',
        name: 'Armenian Duduk (Soulful Double-Reed)',
        shortName: 'Duduk',
        family: 'Winds',
        icon: '🪈',
        desc: 'Apricot wood double-reed with a haunting, warm, velvety tone renowned for cinematic pathos.',
        previewPitch: 220.00 // A3
      },
      {
        id: 'silver_flute',
        name: 'Concert Silver Flute (Airy Hypersonic)',
        shortName: 'Concert Flute',
        family: 'Winds',
        icon: '🪈',
        desc: 'Modern orchestral western flute providing crystalline high-register counter-melodies.',
        previewPitch: 523.25 // C5
      }
    ]
  },

  // Track 6: Percussion & Tala (Avanaddha Vadya)
  percussion: {
    id: 'percussion',
    familyTitle: 'Percussion & Tala Family',
    indianClassicalCategory: 'Avanaddha Vadya (Membranophones & Drums)',
    icon: '🥁',
    instruments: [
      {
        id: 'tabla',
        name: 'Tabla & Dagga (Teental 16 Matras)',
        shortName: 'Tabla',
        family: 'Percussion',
        icon: '🥁',
        desc: 'Tuned wooden Dayan with black syahi iron-paste center and resonant brass Bayan (Dagga).',
        previewPitch: 138.59 // C#3
      },
      {
        id: 'pakhawaj',
        name: 'Pakhawaj (Ancient Dhrupad Temple Drum)',
        shortName: 'Pakhawaj',
        family: 'Percussion',
        icon: '🥁',
        desc: 'Asymmetrical double-headed horizontal barrel drum with deep wheat-dough bass and profound impact.',
        previewPitch: 110.00 // A2
      },
      {
        id: 'mridangam',
        name: 'Mridangam (Carnatic Primary Percussion)',
        shortName: 'Mridangam',
        family: 'Percussion',
        icon: '🥁',
        desc: 'South Indian double-headed drum with layered goat skin producing harmonically rich tonal strokes.',
        previewPitch: 130.81 // C3
      },
      {
        id: 'ghatam',
        name: 'Ghatam (Resonant Tuned Clay Pot)',
        shortName: 'Ghatam',
        family: 'Percussion',
        icon: '🏺',
        desc: 'Earthen clay pot baked with copper and brass filings producing metallic bell-like pops and bass booms.',
        previewPitch: 196.00 // G3
      },
      {
        id: 'kanjira',
        name: 'Kanjira (Lizard-Skin Frame Drum)',
        shortName: 'Kanjira',
        family: 'Percussion',
        icon: '🥁',
        desc: 'Single-headed frame drum with high-tension skin and split-second bass pitch modulation.',
        previewPitch: 146.83 // D3
      },
      {
        id: 'dholak',
        name: 'Dholak & Dhol (Folk & Festive Drum)',
        shortName: 'Dholak',
        family: 'Percussion',
        icon: '🥁',
        desc: 'High-energy double-headed drum with driving folk, Sufi, and celebratory syncopated grooves.',
        previewPitch: 164.81 // E3
      },
      {
        id: 'tavil',
        name: 'Tavil (Temple Double-Head Drum)',
        shortName: 'Tavil',
        family: 'Percussion',
        icon: '🥁',
        desc: 'Heavy cylindrical drum played with a wooden stick and finger thimbles for explosive temple power.',
        previewPitch: 174.61 // F3
      },
      {
        id: 'cajon_kit',
        name: 'Cajon & Hybrid Acoustic Kit',
        shortName: 'Cajon Kit',
        family: 'Percussion',
        icon: '📦',
        desc: 'Birchwood acoustic box drum with snare wires paired with subtle shakers and rimshots.',
        previewPitch: 98.00 // G2
      }
    ]
  },

  // Track 1: Mood Instrument (Tata / Sushira Lead)
  mood_instrument: {
    id: 'mood_instrument',
    familyTitle: 'Mood Instrument Family',
    indianClassicalCategory: 'Lead Acoustics (Rasa & Mood Lock)',
    icon: '🪕',
    instruments: [
      {
        id: 'sarod_mood',
        name: 'Sarod (Deep Alap & Mood Lock)',
        shortName: 'Sarod Mood',
        family: 'Mood',
        icon: '🎻',
        desc: 'Fretless metallic plate and Jawa plectrum locked to Vadi-Samvadi microtonal glides.',
        previewPitch: 220.00 // A3
      },
      {
        id: 'sitar_mood',
        name: 'Sitar (Gayaki Ang & Meend Lock)',
        shortName: 'Sitar Mood',
        family: 'Mood',
        icon: '🪕',
        desc: 'Vocal-style melodic ornamentation with 5-note pull bends and shimmering sympathetic overtones.',
        previewPitch: 293.66 // D4
      },
      {
        id: 'rudra_veena_mood',
        name: 'Rudra Veena (Ancient Sacred Drone)',
        shortName: 'Rudra Veena',
        family: 'Mood',
        icon: '🪕',
        desc: 'Deep meditative Dhrupad bass resonance that anchors the contemplative Shanta & Karuna Rasas.',
        previewPitch: 130.81 // C3
      },
      {
        id: 'santoor_mood',
        name: 'Santoor (Kashmiri Shimmer)',
        shortName: 'Santoor Mood',
        family: 'Mood',
        icon: '🎼',
        desc: 'Delicate hammered walnut dulcimer invoking tranquil mountain streams and morning dawn.',
        previewPitch: 329.63 // E4
      },
      {
        id: 'bansuri_mood',
        name: 'Bansuri (Meditative E Bass)',
        shortName: 'Bansuri Mood',
        family: 'Mood',
        icon: '🪈',
        desc: 'Breathy sub-octave bamboo tone with slow pitch glides and hypnotic overtone warmth.',
        previewPitch: 329.63 // E4
      },
      {
        id: 'cello_mood',
        name: 'Acoustic Cello (Warm Sustain)',
        shortName: 'Cello Mood',
        family: 'Mood',
        icon: '🎻',
        desc: 'Rich wooden bowed sustain bridging Indian Classical ragas with Western cinematic depth.',
        previewPitch: 164.81 // E3
      }
    ]
  },

  // Track 2: Vocals Family (Vak / Gayan)
  vocals: {
    id: 'vocals',
    familyTitle: 'Vocals Family',
    indianClassicalCategory: 'Vak & Gayan (Human Voice & Chant)',
    icon: '🎤',
    instruments: [
      {
        id: 'vedic_chant',
        name: 'Vedic Sanskrit Chhandas (Vāgdhenu)',
        shortName: 'Vedic Chant',
        family: 'Vocals',
        icon: '🕉️',
        desc: 'Vāgdhenu engine: authentic Rigveda / Yajurveda recitation with zero schwa-deletion and 3 Svaras.',
        previewPitch: 277.18 // C#4
      },
      {
        id: 'khayal_bandish',
        name: 'Classical Khayal & Bandish',
        shortName: 'Khayal Bandish',
        family: 'Vocals',
        icon: '🎤',
        desc: 'High-register virtuoso vocal performance with intricate Taans, Murkis, and Bol-Alap.',
        previewPitch: 293.66 // D4
      },
      {
        id: 'dhrupad_vocal',
        name: 'Dhrupad & Dhamar Sacred Chants',
        shortName: 'Dhrupad',
        family: 'Vocals',
        icon: '🎤',
        desc: 'Ancient contemplative vocal style utilizing Nom-Tom syllables with resonant chest resonance.',
        previewPitch: 220.00 // A3
      },
      {
        id: 'tarana_sargam',
        name: 'Tarana & Fast Sargam Vocalises',
        shortName: 'Tarana',
        family: 'Vocals',
        icon: '🎶',
        desc: 'Rhythmic, high-tempo vocal fireworks with Persian syllables (Dir Dir, Ta Na Na) and swara notes.',
        previewPitch: 329.63 // E4
      },
      {
        id: 'thumri_dadra',
        name: 'Thumri & Romantic Semi-Classical',
        shortName: 'Thumri',
        family: 'Vocals',
        icon: '🎤',
        desc: 'Lyrical, emotive singing rich in Shringara rasa with delicate ornaments and poetic nuances.',
        previewPitch: 261.63 // C4
      },
      {
        id: 'choral_harmony',
        name: 'Temple Choir & Choral Harmony',
        shortName: 'Temple Choir',
        family: 'Vocals',
        icon: '👥',
        desc: 'YuE 2 multi-layered sacred choir with wide stereo spatialization and temple acoustics.',
        previewPitch: 246.94 // B3
      },
      {
        id: 'sufi_qawwali',
        name: 'Sufi Qawwali & Soulful Alap',
        shortName: 'Sufi Qawwali',
        family: 'Vocals',
        icon: '🎤',
        desc: 'Passionate, ecstasy-driven vocal recitative with dynamic hand-clapping and fervent crescendos.',
        previewPitch: 311.13 // Eb4
      }
    ]
  },

  // Track 5: Risers, Drops & Cinematic FX
  risers_drops: {
    id: 'risers_drops',
    familyTitle: 'Cinematic Transitions & SFX',
    indianClassicalCategory: 'Ghana & Dynamic Synthesis',
    icon: '⚡',
    instruments: [
      {
        id: 'braam_sub',
        name: 'Cinematic Braams & 16Hz Sub Drops',
        shortName: 'Braam & Sub',
        family: 'FX',
        icon: '💥',
        desc: 'Heavy brass-synthesizer impact coupled with somatic 16Hz chest vibration sub drop.',
        previewPitch: 65.41 // C2
      },
      {
        id: 'shepard_riser',
        name: '8-Bar Shepard Tonal Risers',
        shortName: 'Shepard Riser',
        family: 'FX',
        icon: '🌪️',
        desc: 'Infinitely ascending auditory illusion building continuous musical tension up to Sam.',
        previewPitch: 174.61 // F3
      },
      {
        id: 'white_noise_swell',
        name: 'Granular White Noise Swells',
        shortName: 'Noise Swell',
        family: 'FX',
        icon: '🌊',
        desc: 'Filtered analog noise sweep with hypersonic air shimmer (20k-48k Hz).',
        previewPitch: 440.00 // A4
      },
      {
        id: 'reverse_gong',
        name: 'Reverse Gongs & Temple Cymbals',
        shortName: 'Reverse Gong',
        family: 'FX',
        icon: '🔔',
        desc: 'Backwards-enveloped bronze gong swell leading seamlessly into downbeat impacts.',
        previewPitch: 130.81 // C3
      },
      {
        id: 'hypersonic_downlifter',
        name: 'Hypersonic Downlifters & Whooshes',
        shortName: 'Downlifter',
        family: 'FX',
        icon: '💨',
        desc: 'Fast downward pitch drops for effortless section transitions and breakdowns.',
        previewPitch: 220.00 // A3
      }
    ]
  },

  // Track 7: Bass & Low End
  bass: {
    id: 'bass',
    familyTitle: 'Bass & Low End Family',
    indianClassicalCategory: 'Low End Foundation (Somatic 16Hz)',
    icon: '🎻',
    instruments: [
      {
        id: 'sub_cello',
        name: 'Sub Bass & Cello (Somatic 16Hz)',
        shortName: 'Sub Cello',
        family: 'Bass',
        icon: '🎻',
        desc: 'Hybrid acoustic cello warmth grounded with a sub-20Hz pure sine anchor.',
        previewPitch: 65.41 // C2
      },
      {
        id: 'contrabass',
        name: 'Acoustic Upright Contrabass',
        shortName: 'Contrabass',
        family: 'Bass',
        icon: '🎻',
        desc: 'Pizzicato and arco acoustic upright double bass with rich wood body resonance.',
        previewPitch: 82.41 // E2
      },
      {
        id: 'surbahar_bass',
        name: 'Surbahar Deep Bass (Bass Sitar)',
        shortName: 'Surbahar',
        family: 'Bass',
        icon: '🪕',
        desc: 'Bass sitar providing low-octave acoustic meends and deep sympathetic vibrations.',
        previewPitch: 73.42 // D2
      },
      {
        id: 'moog_sub',
        name: 'Moog Analog Synthesizer Sub',
        shortName: 'Moog Sub',
        family: 'Bass',
        icon: '🎹',
        desc: 'Classic ladder-filter 24dB/oct warm analog sub bass with gentle saturation.',
        previewPitch: 55.00 // A1
      }
    ]
  },

  // Track 8: Atmosphere & Textures
  atmosphere: {
    id: 'atmosphere',
    familyTitle: 'Atmosphere & Textures Family',
    indianClassicalCategory: 'Spatial & Environmental Beds',
    icon: '✨',
    instruments: [
      {
        id: 'temple_drone',
        name: 'Sacred Vedic Temple Drone',
        shortName: 'Temple Drone',
        family: 'Atmosphere',
        icon: '🕯️',
        desc: 'Sanctum acoustic reflections with bronze temple bells, oil lamp crackle, and soft chants.',
        previewPitch: 138.59 // C#3
      },
      {
        id: 'singing_bowls',
        name: 'Tibetan Singing Bowls & Gongs',
        shortName: 'Singing Bowls',
        family: 'Atmosphere',
        icon: '🥣',
        desc: 'Multi-harmonic bell-metal singing bowls producing brainwave-entraining binaural beats.',
        previewPitch: 220.00 // A3
      },
      {
        id: 'tanpura_cloud',
        name: 'Tanpura Harmonic Cloud',
        shortName: 'Tanpura Cloud',
        family: 'Atmosphere',
        icon: '☁️',
        desc: 'Lush, ambient reverberant pad synthesized purely from acoustic Tanpura jivari buzz.',
        previewPitch: 138.59 // C#3
      },
      {
        id: 'nature_drone',
        name: 'Forest Rain & Natural Binaural Drone',
        shortName: 'Nature Drone',
        family: 'Atmosphere',
        icon: '🌧️',
        desc: 'Hypersonic 48kHz spatial field recording of mountain rain with sub-harmonic earth drone.',
        previewPitch: 110.00 // A2
      }
    ]
  }
};

export interface InstrumentCategoryGroup {
  id: string;
  label: string;
  icon: string;
  category: string;
  instruments: InstrumentOption[];
}

export const ALL_INDIAN_INSTRUMENT_CATEGORIES: InstrumentCategoryGroup[] = [
  {
    id: 'strings',
    label: 'Strings (Tata)',
    icon: '🪕',
    category: 'Tata Vadya (Plucked & Bowed)',
    instruments: INSTRUMENT_FAMILIES.strings.instruments
  },
  {
    id: 'winds',
    label: 'Winds (Sushira)',
    icon: '🪈',
    category: 'Sushira Vadya (Winds & Flutes)',
    instruments: INSTRUMENT_FAMILIES.winds.instruments
  },
  {
    id: 'percussion',
    label: 'Percussion (Avanaddha)',
    icon: '🥁',
    category: 'Avanaddha Vadya (Drums & Tala)',
    instruments: INSTRUMENT_FAMILIES.percussion.instruments
  },
  {
    id: 'vocals',
    label: 'Vocals (Vāgdhenu)',
    icon: '📿',
    category: 'Vedic Sanskrit & Classical Vocalise',
    instruments: INSTRUMENT_FAMILIES.vocals.instruments
  },
  {
    id: 'ambient_fx',
    label: 'Drone & FX',
    icon: '🕉️',
    category: 'Harmonic Grounding & Infrasound',
    instruments: [
      ...INSTRUMENT_FAMILIES.atmosphere.instruments,
      ...INSTRUMENT_FAMILIES.risers_drops.instruments
    ]
  }
];

/**
 * Helper to get the instrument family associated with a track
 */
export function getTrackInstrumentFamily(track: { id?: string; role: string; name: string; activeInstrument?: string }): InstrumentFamily {
  // If activeInstrument is defined, check all families first
  if (track.activeInstrument) {
    for (const key of Object.keys(INSTRUMENT_FAMILIES)) {
      const fam = INSTRUMENT_FAMILIES[key];
      if (fam.instruments.some(i => i.name === track.activeInstrument || i.id === track.activeInstrument)) {
        return fam;
      }
    }
  }

  const lower = (track.name + ' ' + track.role).toLowerCase();

  if (lower.includes('vocal') || lower.includes('chant') || lower.includes('recit')) {
    return INSTRUMENT_FAMILIES.vocals;
  }
  if (lower.includes('string') || lower.includes('sitar') || lower.includes('sarod') || lower.includes('veena') || lower.includes('santoor')) {
    return INSTRUMENT_FAMILIES.strings;
  }
  if (lower.includes('wind') || lower.includes('flute') || lower.includes('bansuri') || lower.includes('shehnai')) {
    return INSTRUMENT_FAMILIES.winds;
  }
  if (lower.includes('tabla') || lower.includes('pakhawaj') || lower.includes('percussion') || lower.includes('tala') || lower.includes('drum')) {
    return INSTRUMENT_FAMILIES.percussion;
  }
  if (lower.includes('riser') || lower.includes('drop') || lower.includes('braam') || lower.includes('sfx')) {
    return INSTRUMENT_FAMILIES.risers_drops;
  }
  if (lower.includes('bass') || lower.includes('sub')) {
    return INSTRUMENT_FAMILIES.bass;
  }
  if (lower.includes('atmosphere') || lower.includes('ambient') || lower.includes('drone') || lower.includes('tanpura')) {
    return INSTRUMENT_FAMILIES.atmosphere;
  }

  // Fallback based on role
  if (track.role === 'solo_instrument') return INSTRUMENT_FAMILIES.strings;
  if (track.role === 'percussion_tala') return INSTRUMENT_FAMILIES.percussion;
  if (track.role === 'risers_drops') return INSTRUMENT_FAMILIES.risers_drops;
  if (track.role === 'lead_vocal' || track.role === 'vedic_chant') return INSTRUMENT_FAMILIES.vocals;

  return INSTRUMENT_FAMILIES.strings;
}
