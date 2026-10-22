/**
 * Nād-DAW Musicology Extension for OpenStudio
 * Integrates Indian Classical Music Theory, 22 Shrutis Just Intonation Mandala,
 * Moveable Sa Tuner, Navarasa Emotion Palette, and Sanskrit Vedic Engine into OpenStudio.
 */

(function () {
  'use strict';

  // --- 1. Musicology Databases ---

  const SHRUTIS_DATA = [
    { index: 1, name: "Kshobhini", swara: "Sa", ratio: [1, 1], cents: 0, western: "Tonic", type: "Prakriti" },
    { index: 2, name: "Tivra", swara: "re1 (Ekasruti)", ratio: [256, 243], cents: 90.2, western: "Pythagorean Min 2nd", type: "Vikrit" },
    { index: 3, name: "Kumudvati", swara: "re2 (Dvisruti)", ratio: [16, 15], cents: 111.7, western: "Just Minor 2nd", type: "Vikrit" },
    { index: 4, name: "Manda", swara: "Re1 (Trisruti)", ratio: [10, 9], cents: 182.4, western: "Minor Whole Tone", type: "Shuddha" },
    { index: 5, name: "Chandovati", swara: "Re2 (Chatussruti)", ratio: [9, 8], cents: 203.9, western: "Major Whole Tone", type: "Shuddha" },
    { index: 6, name: "Dayavati", swara: "ga1 (Sadharana)", ratio: [32, 27], cents: 294.1, western: "Pythagorean Min 3rd", type: "Vikrit" },
    { index: 7, name: "Ranjani", swara: "ga2 (Atikomal)", ratio: [6, 5], cents: 315.6, western: "Just Minor 3rd", type: "Vikrit" },
    { index: 8, name: "Raktika", swara: "Ga1 (Antara)", ratio: [5, 4], cents: 386.3, western: "Just Major 3rd", type: "Shuddha" },
    { index: 9, name: "Raudri", swara: "Ga2 (Tivratara)", ratio: [81, 64], cents: 407.8, western: "Pythagorean Maj 3rd", type: "Shuddha" },
    { index: 10, name: "Krodha", swara: "ma1 (Shuddha)", ratio: [4, 3], cents: 498.0, western: "Just Perfect 4th", type: "Shuddha" },
    { index: 11, name: "Vajrika", swara: "ma2 (Tivratara Ma)", ratio: [27, 20], cents: 519.5, western: "Acute 4th", type: "Shuddha" },
    { index: 12, name: "Prasarini", swara: "Ma1 (Tivra)", ratio: [45, 32], cents: 590.2, western: "Augmented 4th / Tritone", type: "Vikrit" },
    { index: 13, name: "Priti", swara: "Ma2 (Tivratama)", ratio: [729, 512], cents: 611.7, western: "Pythagorean Tritone", type: "Vikrit" },
    { index: 14, name: "Marjani", swara: "Pa", ratio: [3, 2], cents: 702.0, western: "Just Perfect 5th", type: "Prakriti" },
    { index: 15, name: "Kshiti", swara: "dha1 (Ekasruti)", ratio: [128, 81], cents: 792.2, western: "Pythagorean Min 6th", type: "Vikrit" },
    { index: 16, name: "Rakta", swara: "dha2 (Dvisruti)", ratio: [8, 5], cents: 813.7, western: "Just Minor 6th", type: "Vikrit" },
    { index: 17, name: "Sandipini", swara: "Dha1 (Trisruti)", ratio: [5, 3], cents: 884.4, western: "Just Major 6th", type: "Shuddha" },
    { index: 18, name: "Alapini", swara: "Dha2 (Chatussruti)", ratio: [27, 16], cents: 905.9, western: "Pythagorean Maj 6th", type: "Shuddha" },
    { index: 19, name: "Madanti", swara: "ni1 (Komal)", ratio: [16, 9], cents: 996.1, western: "Pythagorean Min 7th", type: "Vikrit" },
    { index: 20, name: "Rohini", swara: "ni2 (Kaishiki)", ratio: [9, 5], cents: 1017.6, western: "Just Minor 7th", type: "Vikrit" },
    { index: 21, name: "Ramya", swara: "Ni1 (Kakali)", ratio: [15, 8], cents: 1088.3, western: "Just Major 7th", type: "Shuddha" },
    { index: 22, name: "Ugra", swara: "Ni2 (Tivratama)", ratio: [243, 128], cents: 1109.8, western: "Pythagorean Maj 7th", type: "Shuddha" }
  ];

  const RAGAS = [
    {
      id: "yaman",
      name: "Raga Yaman",
      thaat: "Kalyan Thaat",
      western: "Lydian Mode (1 - 2 - 3 - #4 - 5 - 6 - 7)",
      rasa: "Shringara (Romantic, Devotion)",
      prahar: "Sunset / Sandhiprakash (6 PM - 9 PM)",
      profile: "luminous evening serenity, raised 4th sharp teevra Ma, expansive Kalyan ascent, romantic elegance, peaceful alap",
      arohana: "N' R G, M' D N Ṡ",
      avarohana: "Ṡ N D P, M' G R S",
      vadi: "Ga (Major 3rd)",
      samvadi: "Ni (Major 7th)",
      pakad: "N' R G, R S, P M' D N Ṡ",
      activeShrutis: [1, 5, 8, 12, 14, 18, 21]
    },
    {
      id: "bhairavi",
      name: "Raga Bhairavi",
      thaat: "Bhairavi Thaat",
      western: "Phrygian Mode (1 - b2 - b3 - 4 - 5 - b6 - b7)",
      rasa: "Karuna (Supreme Pathos, Compassion)",
      prahar: "Dawn / Universal Closing Raga",
      profile: "universal closing pathos, all four flat notes (komal re, ga, dha, ni), soulful Phrygian cadence, tender nostalgia, weeping longing",
      arohana: "S r g M P d n Ṡ",
      avarohana: "Ṡ n d P M g r S",
      vadi: "Ma (Pure 4th)",
      samvadi: "Sa (Tonic)",
      pakad: "M g, S r S, d n S",
      activeShrutis: [1, 3, 7, 10, 14, 16, 20]
    },
    {
      id: "darbari",
      name: "Raga Darbari Kanhada",
      thaat: "Asavari Thaat",
      western: "Aeolian / Natural Minor with sunken 3rd & 6th",
      rasa: "Karuna / Veera (Majestic Pathos, Royal Gravity)",
      prahar: "Late Night (12 AM - 3 AM)",
      profile: "late-night royal gravity, sunken flat komal Ga with slow heavy andolan oscillations, majestic Asavari solemnity, deep resonant chest bass",
      arohana: "S R g M P d n Ṡ",
      avarohana: "Ṡ d n P, M P g, m R S",
      vadi: "Re (Major 2nd)",
      samvadi: "Pa (Fifth)",
      pakad: "g M R S, d n P",
      activeShrutis: [1, 5, 7, 10, 14, 16, 20]
    },
    {
      id: "bhoopali",
      name: "Raga Bhoopali",
      thaat: "Kalyan Thaat",
      western: "Major Pentatonic (1 - 2 - 3 - 5 - 6)",
      rasa: "Shanta (Peace, Meditative Serenity)",
      prahar: "Early Night (7 PM - 10 PM)",
      profile: "sweet peaceful simplicity, pure major pentatonic, Kalyan thaat, comforting evening dusk, calm and tender",
      arohana: "S R G P D Ṡ",
      avarohana: "Ṡ D P G R S",
      vadi: "Ga (Major 3rd)",
      samvadi: "Dha (Major 6th)",
      pakad: "G R S D P, G R S",
      activeShrutis: [1, 5, 8, 14, 18]
    },
    {
      id: "malkauns",
      name: "Raga Malkauns",
      thaat: "Bhairavi Thaat",
      western: "Minor Pentatonic (no 2nd & 5th)",
      rasa: "Veera (Spiritual Trance, Cosmic Stillness)",
      prahar: "Deep Midnight (12 AM - 3 AM)",
      profile: "deep midnight minor pentatonic, sacred cosmic trance, meditative darkness, hypnotic bass resonance, still spiritual power",
      arohana: "S g M d n Ṡ",
      avarohana: "Ṡ n d M g S",
      vadi: "Ma (Resonant 4th)",
      samvadi: "Sa (Tonic)",
      pakad: "d n S, M g M, d n d M",
      activeShrutis: [1, 7, 10, 16, 20]
    },
    {
      id: "bhairav",
      name: "Raga Bhairav",
      thaat: "Bhairav Thaat",
      western: "Double Harmonic Major (1 - b2 - 3 - 4 - 5 - b6 - 7)",
      rasa: "Shanta / Bhakti (Sacred Dawn, Awe)",
      prahar: "First Prahar: Dawn (3 AM - 6 AM)",
      profile: "sacred dawn prayer, double harmonic major, trembling flat komal Re and komal Dha, reverent divine awe, devotional solemnity",
      arohana: "S r G M P d N Ṡ",
      avarohana: "Ṡ N d P M G r S",
      vadi: "Dha (Minor 6th)",
      samvadi: "Re (Minor 2nd)",
      pakad: "G M d, d P, M G, m r, S",
      activeShrutis: [1, 3, 8, 10, 14, 16, 21]
    },
    {
      id: "hansadhwani",
      name: "Raga Hansadhwani",
      thaat: "Shankarabharanam",
      western: "Major Pentatonic + Maj 7th (1 - 2 - 3 - 5 - 7)",
      rasa: "Adbhuta (Wonder, Auspiciousness)",
      prahar: "Evening Invocation",
      profile: "auspicious celebratory invocation, bright major pentatonic with major 7th, radiant uplifting joy, sparkling agile taans, sunny warmth",
      arohana: "S R G P N Ṡ",
      avarohana: "Ṡ N P G R S",
      vadi: "Sa (Tonic)",
      samvadi: "Pa (Fifth)",
      pakad: "G P N Ṡ, N P G R S",
      activeShrutis: [1, 5, 8, 14, 21]
    },
    {
      id: "todi",
      name: "Raga Miyan Ki Todi",
      thaat: "Todi Thaat",
      western: "Harmonic Minor #4 (Ukrainian Dorian)",
      rasa: "Karuna / Bhakti (Deep Yearning)",
      prahar: "Morning (9 AM - 12 PM)",
      profile: "intense spiritual yearning, flat komal re, flat komal ga, sharp teevra ma, heart-wrenching ascetic longing, profound emotional plea",
      arohana: "S r g M' P d N Ṡ",
      avarohana: "Ṡ N d P M' g r S",
      vadi: "Dha (Flat 6th)",
      samvadi: "Ga (Flat 3rd)",
      pakad: "r g r S, M' d N Ṡ, d P M' g, r g r S",
      activeShrutis: [1, 3, 7, 12, 14, 16, 21]
    }
  ];

  const NAVARASAS = [
    {
      id: "shringara",
      name: "Shringara",
      english: "Romance & Beauty",
      color: "#ec4899",
      desc: "Sweet, alluring, delicate melodic glides",
      tempo: "Madhya (Medium Flowing, 80-95 BPM)",
      tempoTag: "medium tempo",
      styleTag: "romantic, lyrical, tender, emotional",
      archetype: "tender romantic warmth, lyrical grace, delicate soft ornaments, sweet expressive meend glides, sensual, warm acoustic intimacy, beautiful melodic phrases"
    },
    {
      id: "veera",
      name: "Veera",
      english: "Heroism & Majesty",
      color: "#f59e0b",
      desc: "Bold, triumphant plucks and driving rhythms",
      tempo: "Drut / Madhya (Bold & Stately, 105-125 BPM)",
      tempoTag: "driving tempo",
      styleTag: "heroic, majestic, triumphant, sovereign",
      archetype: "majestic heroic grandeur, bold commanding strokes, royal sovereign presence, triumphant resonance, powerful bass foundations, stately Dhrupad cadence, proud confident stride"
    },
    {
      id: "karuna",
      name: "Karuna",
      english: "Pathos & Compassion",
      color: "#6366f1",
      desc: "Deep yearning, weeping sarangi and micro-bends",
      tempo: "Vilambit (Slow & Somber, 50-65 BPM)",
      tempoTag: "slow tempo",
      styleTag: "deeply sorrowful, melancholic, mournful, yearning",
      archetype: "deeply sorrowful, melancholic, mournful weeping microtones, slow somber tempo, heart-wrenching yearning, poignant emotional grief, tearful longing, tender tragic pathos"
    },
    {
      id: "raudra",
      name: "Raudra",
      english: "Fury & Intensity",
      color: "#ef4444",
      desc: "Dramatic tension, dissonant clashes, rapid taans",
      tempo: "Ati-Drut (Frantic Fast, 140-170 BPM)",
      tempoTag: "fast tempo",
      styleTag: "fierce, intense, frantic, aggressive, explosive climax",
      archetype: "fierce, intense, frantic fast tempo, aggressive sharp attacks, dramatic tension, dark energetic dissonance, furious pakhawaj drum strikes, explosive climax, relentless urgency, menacing power"
    },
    {
      id: "hasya",
      name: "Hasya",
      english: "Joy & Playfulness",
      color: "#10b981",
      desc: "Lively folk swing, bouncy tihais, bright accents",
      tempo: "Drut (Lively & Bouncy, 120-140 BPM)",
      tempoTag: "upbeat lively tempo",
      styleTag: "playful, joyous, cheerful, dancing rhythm",
      archetype: "playful, joyous, upbeat lively tempo, cheerful dancing syncopation, bright agile tihais, whimsical energetic staccato, celebratory festive pulse, sparkling bounce"
    },
    {
      id: "bhayanaka",
      name: "Bhayanaka",
      english: "Mystery & Dread",
      color: "#8b5cf6",
      desc: "Eerie low drones, sudden pauses, microtonal shadows",
      tempo: "Vilambit / Suspense (Irregular, 55-70 BPM)",
      tempoTag: "slow suspenseful tempo",
      styleTag: "haunting, dark mystery, suspenseful, eerie",
      archetype: "haunting, dark ominous mystery, suspenseful tension, eerie low bass drones, sudden dramatic pauses, unsettling microtonal shadows, atmospheric dread, shivering dissonance"
    },
    {
      id: "bibhatsa",
      name: "Bibhatsa",
      english: "Raw Aversion",
      color: "#64748b",
      desc: "Harsh textures, stark metallic overtones",
      tempo: "Angular / Staccato (60-85 BPM)",
      tempoTag: "angular tempo",
      styleTag: "raw, abrasive, dissonant tension, jarring",
      archetype: "raw abrasive friction, harsh metallic overtones, stark dissonant clashes, unconventional angular intervals, visceral jarring textures, brooding tension"
    },
    {
      id: "adbhuta",
      name: "Adbhuta",
      english: "Wonder & Cosmic Awe",
      color: "#06b6d4",
      desc: "Luminous bell overtones, soaring flutes",
      tempo: "Madhya (Floating Fluid, 85-110 BPM)",
      tempoTag: "fluid floating tempo",
      styleTag: "mystical awe, celestial wonder, magical, sparkling",
      archetype: "mystical awe, celestial wonder, magical shimmering overtones, luminous soaring melodies, enchanting cosmic atmosphere, breathtaking elevation, ethereal sparkle"
    },
    {
      id: "shanta",
      name: "Shanta",
      english: "Peace & Serenity",
      color: "#14b8a6",
      desc: "Stillness, breath-like meends, infinite calm",
      tempo: "Vilambit (Deep Meditative, 45-60 BPM)",
      tempoTag: "very slow meditative tempo",
      styleTag: "tranquil, serene, peaceful stillness, meditative",
      archetype: "tranquil, deeply peaceful, serene stillness, meditative calm, spacious, slow floating tempo, gentle breathing silence, profound spiritual relaxation, effortless ease"
    }
  ];

  const INSTRUMENT_CATEGORIES = {
    chordophones: {
      id: "chordophones",
      code: "A",
      title: "A. Chordophones (Stringed Instruments • Tata Vādya)",
      sanskrit: "तत वाद्य",
      desc: "Sound generated by vibrating strings under tension via plucking, bowing, or striking.",
      subcategories: [
        {
          name: "Plucked Strings (Indian & World)",
          items: [
            { name: "Sitar", desc: "Curved brass frets, sympathetic taraf strings, jawari buzz" },
            { name: "Sarod", desc: "Fretless steel fingerboard, coconut plectrum slide" },
            { name: "Saraswati Veena", desc: "24 brass frets in wax, ancient Carnatic resonance" },
            { name: "Rudra Veena", desc: "Massive dual-gourd Dhrupad contemplation lute" },
            { name: "Surbahar", desc: "Bass sitar, deep resonant alap glides" },
            { name: "Vichitra Veena", desc: "Fretless horizontal slide zither played with glass ball" },
            { name: "Tanpura", desc: "Continuous acoustic jawari harmonic drone foundation" },
            { name: "Acoustic Guitar", desc: "Warm steel/nylon string acoustic resonance" },
            { name: "Electric Guitar", desc: "Clean or driven electric guitar articulation" },
            { name: "Electric Bass", desc: "Low-end melodic groove and rhythmic anchor" },
            { name: "Concert Harp", desc: "Soaring diatonic sweeps and celestial arpeggios" },
            { name: "Mandolin", desc: "Bright doubled-course plucks (U. Srinivas style)" },
            { name: "Oud", desc: "Warm microtonal fretless Arabic/Middle-Eastern lute" },
            { name: "Dotara", desc: "Bengali folk skin-faced lute for Baul melodies" },
            { name: "Ektara", desc: "Single-string variable tension folk drone" },
            { name: "Tumbi", desc: "High-pitched Punjabi folk single-string groove" }
          ]
        },
        {
          name: "Bowed Strings (Continuous Friction)",
          items: [
            { name: "Sarangi", desc: "3 gut melody strings + 35 sympathetic taraf strings; mimics human voice" },
            { name: "Dilruba / Esraj", desc: "Fretted neck with sarangi goatskin soundbox and bow" },
            { name: "Violin", desc: "Orchestral or Carnatic/Hindustani sliding gamakas" },
            { name: "Viola", desc: "Warm, rich mid-range orchestral voice" },
            { name: "Cello", desc: "Deep expressive tenor and bass string warmth" },
            { name: "Double Bass", desc: "Massive acoustic contrabass presence" },
            { name: "Erhu", desc: "2-string Chinese python-skin bowed fiddle" }
          ]
        },
        {
          name: "Struck & Hammered Strings",
          items: [
            { name: "Santoor", desc: "100-string Kashmiri hammered dulcimer played with walnut mallets" },
            { name: "Swarmandal", desc: "Vocalist accompaniment harp/zither tuned to raga" },
            { name: "Acoustic Grand Piano", desc: "Full dynamic keyboard hammers striking acoustic strings" },
            { name: "Hammered Dulcimer", desc: "Bright shimmering folk hammered strings" }
          ]
        }
      ]
    },
    aerophones: {
      id: "aerophones",
      code: "B",
      title: "B. Aerophones (Wind & Reed Instruments • Sushira Vādya)",
      sanskrit: "सुषिर वाद्य",
      desc: "Sound generated by vibrating columns of air through flutes, reeds, bellows, or horns.",
      subcategories: [
        {
          name: "Flutes & Edge-Blown Pipes",
          items: [
            { name: "Bansuri (Bass Bamboo)", desc: "Deep 30-inch bamboo flute with breathy warmth and microtonal bends" },
            { name: "Bansuri (Treble)", desc: "Agile, bright high register Indian flute" },
            { name: "Carnatic Venu", desc: "8-hole South Indian flute for rapid gamakas" },
            { name: "Concert Flute", desc: "Western silver orchestral transverse flute" },
            { name: "Piccolo", desc: "Piercing high-octave orchestral woodwind" },
            { name: "Shakuhachi", desc: "Zen meditation Japanese end-blown bamboo flute" },
            { name: "Ney", desc: "Persian/Arabic end-blown cane flute with airy pathos" }
          ]
        },
        {
          name: "Single & Double Reeds",
          items: [
            { name: "Shehnai", desc: "Auspicious quadruple-reed conical woodwind with vocal-like microtones" },
            { name: "Nadhaswaram", desc: "Massive South Indian temple double-reed; powerful soaring sound" },
            { name: "Clarinet", desc: "Warm, woody single-reed with rich dynamic range" },
            { name: "Soprano Saxophone", desc: "Luminous, vocal-like curving lines" },
            { name: "Alto / Tenor Sax", desc: "Soulful, expressive jazz & modern lead reed" },
            { name: "Oboe", desc: "Penetrating, plaintive double-reed voice" },
            { name: "Bassoon", desc: "Warm, resonant bass and tenor woodwind" },
            { name: "Duduk", desc: "Armenian apricot-wood double reed; supreme melancholic pathos" }
          ]
        },
        {
          name: "Free-Reeds & Bellows",
          items: [
            { name: "Indian Harmonium", desc: "Hand-pumped bellows with brass reeds; standard vocal accompaniment" },
            { name: "Shruti Box", desc: "Continuous bellows-driven reed drone" },
            { name: "Accordion", desc: "Full chromatic bellows reed instrument" },
            { name: "Melodica", desc: "Breath-powered keyboard reed instrument" }
          ]
        },
        {
          name: "Brass & Natural Horns",
          items: [
            { name: "Shankha (Conch Shell)", desc: "Sacred ritual conch shell with primal harmonic blast" },
            { name: "Trumpet", desc: "Bright, triumphant brass fanfare and harmon mute nuance" },
            { name: "French Horn", desc: "Mellow, noble cinematic brass resonance" },
            { name: "Trombone", desc: "Smooth slide glissandos and rich brass warmth" },
            { name: "Didgeridoo", desc: "Aboriginal hollowed eucalyptus circular-breathing drone" }
          ]
        }
      ]
    },
    membranophones: {
      id: "membranophones",
      code: "C",
      title: "C. Membranophones (Drums & Skin Percussion • Avanaddha Vādya)",
      sanskrit: "अवनद्ध वाद्य",
      desc: "Sound generated by striking or modulating stretched animal skins or synthetic membranes.",
      subcategories: [
        {
          name: "Classical Tuned Percussion",
          items: [
            { name: "Tabla", desc: "Tuned wooden Dayan (harmonic syahi) + brass Bayan (bass modulation)" },
            { name: "Mridangam", desc: "Primary Carnatic two-headed drum with rich harmonic paste" },
            { name: "Pakhawaj", desc: "Ancient barrel-shaped Dhrupad drum; wheat dough bass weight" },
            { name: "Khol", desc: "Terracotta clay drum for Bengal Kirtan and Gaudiya bhajan" },
            { name: "Thavil", desc: "High-tension temple barrel drum played with stick and thimbles" }
          ]
        },
        {
          name: "Frame & Pressure Drums",
          items: [
            { name: "Kanjira", desc: "Lizard-skin South Indian frame drum with deep pitch-bending bass" },
            { name: "Daffli / Daf", desc: "Large frame drum with jingles for Sufi and folk pulses" },
            { name: "Bodhrán", desc: "Irish goatskin frame drum played with double-headed tipper" },
            { name: "Riq", desc: "Arabic fish-skin tambourine with heavy brass cymbals" },
            { name: "Udukkai / Damru", desc: "Hourglass pressure drum; Shiva's cosmic pulse" },
            { name: "Edakka", desc: "Kerala temple variable-pitch drum; played with curved stick" }
          ]
        },
        {
          name: "Orchestral & Modern Kit",
          items: [
            { name: "Acoustic Drum Kit", desc: "Complete rock/jazz kit: kick, snare, toms, hi-hat, cymbals" },
            { name: "Timpani", desc: "Pedal-tuned orchestral kettledrums with dramatic somatic resonance" },
            { name: "Snare Drum", desc: "Crisp wire-snare percussive attack" },
            { name: "Orchestral Bass Drum", desc: "Massive sub-acoustic boom and thunderous roll" }
          ]
        },
        {
          name: "Folk & Processional Drums",
          items: [
            { name: "Punjabi Dhol", desc: "Loud, energetic double-headed festival drum played with curved sticks" },
            { name: "Dholak", desc: "Everyday folk and qawwali drum with iron-paste bass head" },
            { name: "Nagada", desc: "Pair of kettle-shaped festival drums played with sticks" },
            { name: "Djembe", desc: "West African goblet drum with deep bass and sharp slap" },
            { name: "Darbuka", desc: "Middle Eastern goblet drum with crisp rim finger-rolls" },
            { name: "Congas & Bongos", desc: "Afro-Cuban hand drums for syncopated Latin polyrhythms" },
            { name: "Taiko", desc: "Massive Japanese festival drum with earthquake physical impact" }
          ]
        }
      ]
    },
    idiophones: {
      id: "idiophones",
      code: "D",
      title: "D. Idiophones (Resonant Solids & Struck Metals • Ghana Vādya)",
      sanskrit: "घन वाद्य",
      desc: "Sound generated by the resonant vibration of the solid instrument body itself (metals, clay, bells).",
      subcategories: [
        {
          name: "Dance Bells & Chimes",
          items: [
            { name: "Ghoongroo (Kathak Bells)", desc: "100+ tuned brass ankle bells producing rhythmic shimmer" },
            { name: "Bharatanatyam Salangai", desc: "Woven leather ankle bells with sharp crisp rhythmic slaps" },
            { name: "Temple Ghanta", desc: "Sacred high-resonance bronze hand bell with long sustain" },
            { name: "Tibetan Singing Bowls", desc: "Spun bronze meditation bowls with rich multi-phonic overtones" },
            { name: "Tubular Chimes", desc: "Suspended brass pipes with ethereal cathedral shimmer" }
          ]
        },
        {
          name: "Resonant Vessels & Bowls",
          items: [
            { name: "Ghatam", desc: "South Indian baked clay pot with iron filings; struck with fingers & belly" },
            { name: "Jal Tarang", desc: "Porcelain bowls filled with calibrated water struck with bamboo sticks" },
            { name: "Morsing (Jaw Harp)", desc: "Metal tongue vibrated against teeth with mouth cavity resonance" },
            { name: "Handpan / Hang Drum", desc: "Nitride steel tuned sound-sculpture with hypnotic resonance" },
            { name: "Steelpan", desc: "Caribbean chromatic hammered oil drum" }
          ]
        },
        {
          name: "Tuned Bar Percussion",
          items: [
            { name: "Marimba", desc: "Warm rosewood bars over metallic resonator tubes" },
            { name: "Vibraphone", desc: "Aluminum bars with motorized tremolo and sustain pedal" },
            { name: "Glockenspiel", desc: "Bright metallic bell-bars for sparkling high melodies" },
            { name: "Celesta", desc: "Keyboard-driven steel plates; magical bell-like timbre" },
            { name: "Kalimba (Mbira)", desc: "Thumb piano with metallic tines on wooden soundbox" }
          ]
        },
        {
          name: "Cymbals, Gongs & Clappers",
          items: [
            { name: "Manjira", desc: "Sacred bronze hand cymbals for devotional kirtan accompaniment" },
            { name: "Karatalas", desc: "Heavy bronze clapping cymbals with bright ringing ring" },
            { name: "Khartal", desc: "Rajasthani wooden clappers with brass jingles" },
            { name: "Chimta", desc: "Punjabi metallic fire-tongs with brass jingles" },
            { name: "Tam-tam Gong", desc: "Huge unpitched bronze gong with massive explosive swell" },
            { name: "Crash & Ride Cymbals", desc: "Standard drum kit cymbal accents and wash" }
          ]
        }
      ]
    },
    electrophones: {
      id: "electrophones",
      code: "E",
      title: "E. Electrophones & Digital / Virtual Instruments (Modern Era)",
      sanskrit: "वैद्युत वाद्य",
      desc: "Sound generated or synthesized through electronic circuits, DSP algorithms, or AI neural models.",
      subcategories: [
        {
          name: "Analog & Subtractive Synthesizers",
          items: [
            { name: "Minimoog Bass", desc: "Warm analog 24dB ladder filter bass and leads" },
            { name: "Prophet-5 Pad", desc: "Lush polyphonic analog brass and warm evolving pads" },
            { name: "TB-303 Acid Bass", desc: "Squelchy resonant acid basslines with accent slides" },
            { name: "Modular Synth Arp", desc: "Algorithmic evolving cv/gate sequenced electronic patterns" }
          ]
        },
        {
          name: "Digital, FM & Wavetable Synthesizers",
          items: [
            { name: "Wavetable Lead", desc: "Modern bright digital lead with spectral morphing" },
            { name: "FM Metallic Keys (DX7)", desc: "Complex harmonic frequency-modulation bells and electric piano" },
            { name: "Granular Ambient Pad", desc: "Stretched micro-sound cloud of atmospheric texture" },
            { name: "Resonator Drone", desc: "Physical modeling comb filter drone tuned to root Sa" }
          ]
        },
        {
          name: "Electromechanical Keyboards",
          items: [
            { name: "Fender Rhodes", desc: "Warm electric piano with vibrating metal tines and bell chime" },
            { name: "Wurlitzer 200A", desc: "Reeded electric piano with organic bark and reed tremolo" },
            { name: "Hammond B3 Organ", desc: "Tonewheel drawbars with spinning Leslie rotary speaker" },
            { name: "Hohner Clavinet D6", desc: "Funky plucked electric string clavinet sound" },
            { name: "Mellotron Flute / Strings", desc: "Vintage tape-loop analog replay sampler" }
          ]
        },
        {
          name: "Drum Machines & Low-End",
          items: [
            { name: "Roland TR-808", desc: "Legendary deep sine kick, snappy snare, and crisp hats" },
            { name: "Roland TR-909", desc: "Hard-hitting punchy electronic dance kick and open hats" },
            { name: "Trap 808 Glides", desc: "Pitch-bending saturated sub-bass foundation" }
          ]
        },
        {
          name: "Nād AI Neural & Extended DSP",
          items: [
            { name: "Nād Hypersonic Air (20k-48k)", desc: "Extended ultra-high frequency sheen and harmonic sparkle" },
            { name: "Somatic Infrasound (10Hz-20Hz)", desc: "Physical sub-bass pressure for temple drums and tanpura" },
            { name: "Neural Vocal Dhrupad Choir", desc: "Vedic Sanskrit recitation layer with zero schwa-deletion" }
          ]
        }
      ]
    }
  };

  // --- 1B. Acoustic Timbre Priors & Instrument Role Classifiers ---

  const INSTRUMENT_ACOUSTIC_DESCRIPTORS = {
    "Bansuri (Bass Bamboo)": "Virtuosic solo Bansuri (deep Indian bamboo flute) with authentic breath articulation, warm woody resonance, and microtonal gamakas",
    "Bansuri (Treble)": "Agile solo high-register Bansuri bamboo flute with crystalline overtones and rapid taans",
    "Bansuri": "Virtuosic solo Bansuri (deep Indian bamboo flute) with authentic breath articulation, warm woody resonance, and microtonal gamakas",
    "Carnatic Venu": "Agile solo South Indian Venu bamboo flute with rapid microtonal gamakas and crisp fingering",
    "Sitar": "Virtuosic solo Sitar with rich sympathetic taraf strings, resonant jawari bone bridge buzz, deep meend bending, and chikari accents",
    "Sarod": "Virtuosic solo Sarod with deep fretless steel fingerboard resonance, coconut shell plectrum (java) strokes, and continuous microtonal slides",
    "Rudra Veena": "Ancient meditative solo Rudra Veena (bin) with massive dual-gourd bass resonance, heavy bronze frets, and slow sovereign Dhrupad alap",
    "Shehnai": "Expressive solo Shehnai (quadruple-reed woodwind) with soaring vocal-like microtones and devotional pathos",
    "Sarangi": "Soulful solo Sarangi (bowed box lute with 35 sympathetic strings) mimicking the human voice with poignant microtonal meend",
    "Santoor": "Shimmering solo Kashmiri Santoor (100-string hammered dulcimer) struck with delicate walnut mezrab mallets",
    "Saraswati Veena": "Majestic South Indian Saraswati Veena with curved dragon neck, brass frets, and lyrical Carnatic ornamentation",
    "Surbahar": "Massive bass sitar (Surbahar) with thunderous low-frequency sympathetic resonance and profound Dhrupad glides",
    "Violin (Indian Classical)": "Expressive Indian classical solo violin tuned to root Sa, played in seated gayaki posture with vocal microtonal slides",
    "Dilruba / Esraj": "Resonant bowed fretted lute combining sitar frets with soulful sarangi bowing",
    "Mandolin (Carnatic)": "Electric solid-body Carnatic mandolin with rapid gamakas and syncopated staccato phrasing",
    "Acoustic Grand Piano": "Acoustic concert grand piano with warm dynamic hammer action and rich natural sustain",
    "Cello": "Warm expressive solo cello with deep wooden chest resonance and microtonal lyricism",
    "Tanpura": "Meditative acoustic Tanpura drone with 4 rich harmonic strings (Pa-Sa-Sa-Sa) and continuous jawari thread buzzing",
    "Tabla": "Acoustic Tabla duo: tuned wooden Dayan with crisp harmonic syahi bell tone, paired with deep brass Bayan bass modulation",
    "Pakhawaj": "Ancient barrel-shaped Dhrupad Pakhawaj drum with deep wheat-dough bass weight and resonant slap strokes",
    "Mridangam": "Classical Carnatic two-headed Mridangam drum with crisp tonal slap and deep rhythmic pulse",
    "Kanjira": "Lizard-skin South Indian Kanjira frame drum with deep pitch-bending left-hand bass modulations",
    "Ghatam": "Baked clay Ghatam pot percussion with sharp metallic rim ring and deep belly bass pops"
  };

  const INSTRUMENT_ROLE_HELPERS = {
    isDrone: (name) => {
      const n = (name || '').toLowerCase();
      return n.includes("tanpura") || n.includes("shruti box") || n.includes("resonator drone");
    },
    isRhythm: (name) => {
      const n = (name || '').toLowerCase();
      return n.includes("tabla") || n.includes("pakhawaj") || n.includes("mridangam") ||
             n.includes("kanjira") || n.includes("ghatam") || n.includes("dhol") ||
             n.includes("daf") || n.includes("djembe") || n.includes("conga") ||
             n.includes("bongo") || n.includes("taiko") || n.includes("drum") ||
             n.includes("timpani") || n.includes("snare") || n.includes("edakka") ||
             n.includes("morsing") || n.includes("ghoongroo") || n.includes("salangai");
    },
    isMelodic: (name) => {
      return !INSTRUMENT_ROLE_HELPERS.isDrone(name) && !INSTRUMENT_ROLE_HELPERS.isRhythm(name);
    }
  };


  // --- 2. State & Audio Engine ---

  let currentSaHz = 240.0; // Concert B/C# standard
  let currentRaga = RAGAS[0];
  let currentRasa = NAVARASAS[0];
  let selectedInstruments = new Set(["Sitar", "Tanpura"]);
  let isSoloLeadMode = true;
  let currentInstrumentCategory = "chordophones";
  let customPromptText = "";
  let lyricsText = "";
  let currentVocalMode = "wordless_aalap"; // "instrumental" | "wordless_aalap" | "tarana_sargam" | "vocal_lead"
  let selectedVocalTextures = new Set(["Open Aa Aalap", "Ethereal Oohs"]);
  let selectedModulations = new Set(["Meend (Continuous Glides)"]);
  let referenceAudioFile = null;
  let referenceAudioUrl = null;
  let referenceAudioName = "";
  let referenceAudioDuration = 0;
  let referenceStartTime = 0;
  let referenceEndTime = 0;
  let referenceInfluence = 50; // 15% to 85%
  let refAudioElement = null;
  let isRefPlaying = false;
  let audioCtx = null;
  let activeDroneOscs = [];
  let isDronePlaying = false;

  // AI Generation Engine & LoRA Configuration
  const GEN_MODELS = {
    yue2: {
      id: "yue2",
      label: "YuE 2",
      fullName: "YuE 2 (High Fidelity & Polyphonic Coherence)",
      desc: "★ Best-in-class multi-track frequency clarity & complex Indian classical raga adherence."
    },
    minimax_music3: {
      id: "minimax_music3",
      label: "MiniMax Music 3",
      fullName: "MiniMax Music 3 (Expressive Microtonal Vocals)",
      desc: "★ Unrivaled throat vocal ornamentations, gamakas, and continuous meend portamento. (Tip: 15s-30s renders fast; 60s+ takes longer due to dual-stage 12.5GB AR+DiT architecture)."
    },
    ace_step_xl_turbo: {
      id: "ace_step_xl_turbo",
      label: "ACE-Step 1.5 XL Turbo",
      fullName: "ACE-Step 1.5 XL Turbo (Local Native MPS Engine)",
      desc: "★ Ultra-low latency local diffusion synthesis accelerated on Apple Silicon Neural Engine."
    },
    stable_audio3: {
      id: "stable_audio3",
      label: "Stable Audio 3",
      fullName: "Stable Audio 3 (Pure Acoustic Realism & 10m Render)",
      desc: "★ Long-form sustained acoustic textures, tanpura resonance, and full 10-minute generations."
    }
  };

  const QUANT_PRESETS = {
    q4: {
      id: "q4",
      label: "Q_4 (Low Memory / Fast - Anti-OOM on Long Stems)",
      badge: "Safe VRAM",
      badgeColor: "#065f46",
      badgeText: "#6ee7b7",
      desc: "Q_4: Reduces memory footprint by ~70%, preventing OOM during 5-10 minute generations on Mac."
    },
    q8: {
      id: "q8",
      label: "Q_8 (Balanced Studio Precision - Recommended)",
      badge: "Recommended",
      badgeColor: "#1e1b4b",
      badgeText: "#a5b4fc",
      desc: "Q_8: 50% memory savings with lossless microtonal shruti preservation."
    },
    bf16: {
      id: "bf16",
      label: "bf16 (Full Uncompressed 16-bit Float)",
      badge: "Full Precision",
      badgeColor: "#701a75",
      badgeText: "#f0abfc",
      desc: "bf16: Maximum mathematical float precision; requires 16GB+ unified memory."
    }
  };

  let selectedGenModel = "yue2"; // "yue2" | "minimax_music3" | "ace_step_xl_turbo" | "stable_audio3"
  let selectedQuantization = "q8"; // "q4" | "q8" | "bf16"
  let selectedDuration = 30; // 10 to 600 seconds (Default 30s for fast iteration)
  let selectedLoRAFile = null;
  let selectedLoRAName = "";
  let selectedLoRAStrength = 0.75; // 0.0 to 1.0
  let enableSuperResolutionUpscale = true;
  let targetUpscaleSampleRate = 96000;
  let enableSubsonicClearance = true;
  let enableMidClaritySculpt = true;
  let selectedMasteringPreset = "film"; // "film" | "carnatic" | "dhrupad" | "goa"
  let selectedDroneLevel = 20; // 0 to 50 % (default 20%)

  const MASTERING_PRESETS = {
    film: {
      id: "film",
      label: "🎬 Film Playback",
      desc: "-14 LUFS vocal-forward clarity, 3kHz squillo presence boost, tight bass punch"
    },
    carnatic: {
      id: "carnatic",
      label: "🪘 Carnatic Sabha",
      desc: "-16 LUFS dynamic concert openness, natural acoustic room air, uncompressed dynamics"
    },
    dhrupad: {
      id: "dhrupad",
      label: "🧘 Hindustani Dhrupad",
      desc: "Rich meditative low-mid drone warmth, silky smooth high rolloff, temple depth"
    },
    goa: {
      id: "goa",
      label: "🌴 Goa Fusion",
      desc: "Punchy 50Hz sub-bass transient, crisp high-end excitement for electronic/acoustic fusion"
    }
  };

  function initAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freqHz, duration = 0.8) {
    initAudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqHz, audioCtx.currentTime);

    // Subtle 2nd and 3rd harmonic
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freqHz * 2, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    gain2.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gain);
    osc2.connect(gain2);
    gain.connect(audioCtx.destination);
    gain2.connect(audioCtx.destination);

    osc.start();
    osc2.start();
    osc.stop(audioCtx.currentTime + duration);
    osc2.stop(audioCtx.currentTime + duration);
  }

  function toggleDrone() {
    initAudioContext();
    if (isDronePlaying) {
      activeDroneOscs.forEach(o => {
        try { o.stop(); } catch (e) {}
      });
      activeDroneOscs = [];
      isDronePlaying = false;
      updateDroneUI();
      return;
    }

    // 4 strings: Pa (or Ma/Ni), Sa middle, Sa middle, Sa low
    const sa = currentSaHz;
    const pa = sa * 1.5;
    const saLow = sa * 0.5;

    const freqs = [pa, sa, sa * 1.0008, saLow];
    const gains = [0.12, 0.16, 0.16, 0.22];

    freqs.forEach((f, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = idx === 3 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(f, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(gains[idx], audioCtx.currentTime + 1.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      activeDroneOscs.push(osc);
    });

    isDronePlaying = true;
    updateDroneUI();
  }

  function updateDroneUI() {
    const btn = document.getElementById('nad-drone-toggle-btn');
    if (btn) {
      btn.innerText = isDronePlaying ? "⏹️ Stop Tanpura Drone" : "▶️ Preview Tanpura Drone";
      btn.style.backgroundColor = isDronePlaying ? "#dc2626" : "#d97706";
    }
  }

  function updateTriggerButtonText() {
    const btn = document.getElementById('nad-musicology-trigger-btn');
    if (btn) {
      btn.innerHTML = `🕉️ <span style="letter-spacing:1px;font-weight:800;color:#fde68a;">NĀD</span> • ${currentSaHz.toFixed(1)}Hz • ${currentRaga.name}`;
    }
  }

  // --- 3. UI Construction ---

  function injectMusicologyTrigger() {
    // Check if trigger button already exists
    if (document.getElementById('nad-musicology-trigger-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'nad-musicology-trigger-btn';
    btn.innerHTML = `🕉️ <span style="letter-spacing:1px;font-weight:800;color:#fde68a;">NĀD</span> • ${currentSaHz.toFixed(1)}Hz • ${currentRaga.name}`;
    btn.style.position = 'fixed';
    btn.style.top = '10px';
    btn.style.right = '70px'; // Next to the green AI button and settings
    btn.style.zIndex = '9999';
    btn.style.padding = '6px 14px';
    btn.style.fontSize = '12px';
    btn.style.fontWeight = '600';
    btn.style.color = '#fef3c7';
    btn.style.backgroundColor = 'rgba(217, 119, 6, 0.9)';
    btn.style.backdropFilter = 'blur(8px)';
    btn.style.border = '1px solid #f59e0b';
    btn.style.borderRadius = '6px';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 2px 10px rgba(217, 119, 6, 0.35)';
    btn.style.transition = 'all 0.2s ease';

    btn.onmouseover = () => {
      btn.style.backgroundColor = '#f59e0b';
      btn.style.color = '#ffffff';
      btn.style.boxShadow = '0 4px 14px rgba(245, 158, 11, 0.55)';
    };
    btn.onmouseout = () => {
      btn.style.backgroundColor = 'rgba(217, 119, 6, 0.9)';
      btn.style.color = '#fef3c7';
      btn.style.boxShadow = '0 2px 10px rgba(217, 119, 6, 0.35)';
    };

    btn.onclick = toggleModal;
    document.body.appendChild(btn);
  }

  function toggleModal() {
    const existing = document.getElementById('nad-musicology-modal');
    if (existing) {
      existing.remove();
      if (isDronePlaying) toggleDrone();
      return;
    }
    renderModal();
  }

  function showTimelineToast(title, subtitle = '') {
    const existing = document.getElementById('nad-timeline-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'nad-timeline-toast';
    toast.style.position = 'fixed';
    toast.style.top = '24px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%) translateY(-15px)';
    toast.style.opacity = '0';
    toast.style.zIndex = '100000';
    toast.style.background = 'linear-gradient(135deg, rgba(17, 24, 39, 0.96) 0%, rgba(30, 27, 75, 0.96) 100%)';
    toast.style.border = '1px solid rgba(129, 140, 248, 0.5)';
    toast.style.borderRadius = '10px';
    toast.style.padding = '12px 20px';
    toast.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(99, 102, 241, 0.3)';
    toast.style.color = '#f8fafc';
    toast.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '14px';
    toast.style.pointerEvents = 'auto';
    toast.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    toast.style.backdropFilter = 'blur(12px)';

    toast.innerHTML = `
      <div style="width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #10b981 0%, #059669 100%); display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; box-shadow: 0 0 12px rgba(16, 185, 129, 0.55);">
        🚀
      </div>
      <div>
        <div style="font-size: 13px; font-weight: 700; color: #ffffff; letter-spacing: 0.02em;">${title}</div>
        ${subtitle ? `<div style="font-size: 11px; color: #a5b4fc; margin-top: 2px;">${subtitle}</div>` : ''}
      </div>
      <button id="nad-toast-close" style="margin-left: 10px; background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 16px; padding: 0 4px; line-height: 1;">✕</button>
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(-50%) translateY(0)';
      toast.style.opacity = '1';
    });

    const closeBtn = document.getElementById('nad-toast-close');
    if (closeBtn) {
      closeBtn.onclick = () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-15px)';
        setTimeout(() => toast.remove(), 300);
      };
    }

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-15px)';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4500);
  }

  function renderModal() {
    const modal = document.createElement('div');
    modal.id = 'nad-musicology-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    modal.style.backdropFilter = 'blur(10px)';
    modal.style.zIndex = '10000';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';

    const panel = document.createElement('div');
    panel.style.width = '920px';
    panel.style.maxWidth = '94vw';
    panel.style.maxHeight = '90vh';
    panel.style.backgroundColor = '#18181b';
    panel.style.border = '1px solid #3f3f46';
    panel.style.borderRadius = '12px';
    panel.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.6)';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.overflow = 'hidden';
    panel.style.color = '#f4f4f5';
    panel.style.fontFamily = 'system-ui, -apple-system, sans-serif';

    // Header
    const header = document.createElement('div');
    header.style.padding = '16px 24px';
    header.style.borderBottom = '1px solid #27272a';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    header.style.background = 'linear-gradient(90deg, #18181b 0%, #27272a 100%)';

    header.innerHTML = `
      <div>
        <div style="font-size: 18px; font-weight: 700; color: #fbbf24; display: flex; align-items: center; gap: 8px;">
          <span>🕉️ Nād Musicology & Director's Studio</span>
          <span style="font-size: 11px; padding: 2px 8px; background: rgba(245, 158, 11, 0.2); border: 1px solid #d97706; border-radius: 4px; color: #fef3c7;">OpenStudio JUCE Engine</span>
        </div>
        <div style="font-size: 12px; color: #a1a1aa; margin-top: 2px;">
          22 Shrutis Just Intonation • Moveable Sa Master Tuner • Navarasa Director • Vedic Sanskrit Engine
        </div>
      </div>
      <button id="nad-modal-close-btn" style="background: none; border: none; color: #a1a1aa; font-size: 20px; cursor: pointer; padding: 4px 8px;">✕</button>
    `;

    // Content Body (Scrollable)
    const content = document.createElement('div');
    content.style.padding = '20px 24px';
    content.style.overflowY = 'auto';
    content.style.flex = '1';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.gap = '20px';

    content.innerHTML = `
      <!-- Row 1: Moveable Sa & Master Drone -->
      <div style="background: #202023; border: 1px solid #2e2e32; border-radius: 8px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <span style="font-size: 14px; font-weight: 600; color: #fbbf24;">1. Moveable Sa Master Tuner & Acoustic Tanpura</span>
            <span style="font-size: 12px; color: #a1a1aa; margin-left: 8px;">(Continuous Just Intonation Reference)</span>
          </div>
          <button id="nad-drone-toggle-btn" style="padding: 6px 14px; font-size: 12px; font-weight: 600; color: #ffffff; background: #d97706; border: none; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
            ▶️ Preview Tanpura Drone
          </button>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <input type="range" id="nad-sa-slider" min="110" max="350" step="0.5" value="${currentSaHz}" style="flex: 1; accent-color: #f59e0b; cursor: pointer;">
          <span id="nad-sa-display" style="font-size: 15px; font-weight: 700; color: #fef3c7; min-width: 90px; text-align: right;">${currentSaHz.toFixed(1)} Hz</span>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 10px;">
          <span style="font-size: 11px; color: #71717a; align-self: center;">Standard Presets:</span>
          ${[
            { label: "A (220 Hz)", hz: 220 },
            { label: "B / C# (240 Hz)", hz: 240 },
            { label: "C (261.6 Hz)", hz: 261.63 },
            { label: "C# (277.2 Hz)", hz: 277.18 },
            { label: "D (293.7 Hz)", hz: 293.66 }
          ].map(p => `
            <button class="nad-sa-preset-btn" data-hz="${p.hz}" style="padding: 3px 8px; font-size: 11px; background: #27272a; border: 1px solid #3f3f46; color: #d4d4d8; border-radius: 4px; cursor: pointer;">
              ${p.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Row 2: Raga & Navarasa Director's Palette -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <!-- Raga Selector -->
        <div style="background: #202023; border: 1px solid #2e2e32; border-radius: 8px; padding: 16px;">
          <div style="font-size: 14px; font-weight: 600; color: #fbbf24; margin-bottom: 10px;">2. Select Raga & Modal Anchor</div>
          <select id="nad-raga-select" style="width: 100%; padding: 8px 12px; background: #27272a; border: 1px solid #3f3f46; border-radius: 6px; color: #ffffff; font-size: 13px; cursor: pointer; margin-bottom: 12px;">
            ${RAGAS.map(r => `<option value="${r.id}" ${r.id === currentRaga.id ? 'selected' : ''}>${r.name} (${r.thaat})</option>`).join('')}
          </select>
          <div id="nad-raga-details" style="font-size: 11px; color: #a1a1aa; line-height: 1.6; background: #18181b; padding: 10px; border-radius: 6px; border: 1px solid #27272a;">
            <div><strong>Western Mode:</strong> <span style="color: #67e8f9;">${currentRaga.western}</span></div>
            <div><strong>Arohana (Ascent):</strong> ${currentRaga.arohana}</div>
            <div><strong>Avarohana (Descent):</strong> ${currentRaga.avarohana}</div>
            <div><strong>Vadi / Samvadi:</strong> ${currentRaga.vadi} / ${currentRaga.samvadi}</div>
            <div><strong>Pakad (Catchphrase):</strong> ${currentRaga.pakad}</div>
          </div>
        </div>

        <!-- Navarasa Emotion -->
        <div style="background: #202023; border: 1px solid #2e2e32; border-radius: 8px; padding: 16px;">
          <div style="font-size: 14px; font-weight: 600; color: #fbbf24; margin-bottom: 10px;">3. Navarasa Emotional Archetype</div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 10px;">
            ${NAVARASAS.map(n => `
              <button class="nad-rasa-btn" data-rasa="${n.name}" style="padding: 6px 4px; font-size: 11px; font-weight: 600; background: ${n.name === currentRasa.name ? n.color : '#27272a'}; color: #ffffff; border: 1px solid ${n.name === currentRasa.name ? '#ffffff' : '#3f3f46'}; border-radius: 4px; cursor: pointer; text-align: center;">
                ${n.name}
              </button>
            `).join('')}
          </div>
          <div id="nad-rasa-desc" style="font-size: 11px; color: #d4d4d8; background: #18181b; padding: 8px; border-radius: 6px; border: 1px solid #27272a;">
            <strong>${currentRasa.name} (${currentRasa.english}):</strong> ${currentRasa.desc}
          </div>
        </div>
      </div>

      <!-- Row 3: 22 Shrutis Just Intonation Mandala Visualizer -->
      <div style="background: #202023; border: 1px solid #2e2e32; border-radius: 8px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 14px; font-weight: 600; color: #fbbf24;">4. Interactive 22 Shrutis Just Intonation Wheel</span>
          <span style="font-size: 11px; color: #a1a1aa;">Click any shruti node to audition its frequency</span>
        </div>
        <div id="nad-shrutis-container" style="display: grid; grid-template-columns: repeat(11, 1fr); gap: 6px;">
          <!-- Populated dynamically -->
        </div>
      </div>

      <!-- Row 4: Acoustic & Modern Instrumentation Selection -->
      <div style="background: #202023; border: 1px solid #2e2e32; border-radius: 8px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div>
            <span style="font-size: 14px; font-weight: 600; color: #fbbf24;">5. Acoustic & Modern Instrumentation Selection</span>
            <span style="font-size: 11px; color: #a1a1aa; margin-left: 8px;">(Chaturvidha Vādya + Electrophones)</span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <button id="nad-inst-clear-all-btn" style="padding: 4px 12px; font-size: 11px; font-weight: 600; background: #27272a; border: 1px solid #3f3f46; color: #f87171; border-radius: 4px; cursor: pointer; transition: all 0.2s;">
              Clear All
            </button>
          </div>
        </div>


        <!-- Dropdown Menu for Categories -->
        <div style="margin-bottom: 12px;">
          <select id="nad-inst-category-select" style="width: 100%; padding: 8px 12px; background: #27272a; border: 1px solid #f59e0b; border-radius: 6px; color: #fef3c7; font-size: 13px; font-weight: 600; cursor: pointer;">
            <option value="chordophones" ${currentInstrumentCategory === 'chordophones' ? 'selected' : ''}>A. Chordophones (Stringed Instruments • Tata Vādya)</option>
            <option value="aerophones" ${currentInstrumentCategory === 'aerophones' ? 'selected' : ''}>B. Aerophones (Wind & Reed Instruments • Sushira Vādya)</option>
            <option value="membranophones" ${currentInstrumentCategory === 'membranophones' ? 'selected' : ''}>C. Membranophones (Drums & Skin Percussion • Avanaddha Vādya)</option>
            <option value="idiophones" ${currentInstrumentCategory === 'idiophones' ? 'selected' : ''}>D. Idiophones (Resonant Solids & Struck Metals • Ghana Vādya)</option>
            <option value="electrophones" ${currentInstrumentCategory === 'electrophones' ? 'selected' : ''}>E. Electrophones & Digital / Virtual Instruments (Modern Era)</option>
          </select>
        </div>

        <!-- Category Description Badge -->
        <div id="nad-inst-cat-desc" style="font-size: 11px; color: #a1a1aa; background: #18181b; padding: 8px 12px; border-radius: 6px; border: 1px solid #27272a; margin-bottom: 14px;">
          <!-- Dynamically populated -->
        </div>

        <!-- Dynamic Subcategories & Instrument Chips Container -->
        <div id="nad-inst-chips-container" style="display: flex; flex-direction: column; gap: 12px;">
          <!-- Dynamically populated -->
        </div>

        <!-- Active Selection Summary Bar -->
        <div id="nad-inst-active-bar" style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #2e2e32; display: flex; flex-direction: column; gap: 6px;">
          <!-- Dynamically populated -->
        </div>
      </div>

      <!-- Row 5: Vocal Presence, Textures & Microtonal Modulations -->
      <div style="background: #202023; border: 1px solid #2e2e32; border-radius: 8px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div>
            <span style="font-size: 14px; font-weight: 600; color: #fbbf24;">6. Vocal Presence, Textures & Modulations</span>
            <span style="font-size: 11px; color: #a1a1aa; margin-left: 8px;">(Wordless Aalap, Oohs/Aahs, Tarana & Gamakas)</span>
          </div>
          <!-- Primary Vocal Mode Segmented Chips -->
          <div id="nad-vocal-mode-chips" style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${[
              { id: "instrumental", label: "🎸 Pure Instrumental", desc: "Strictly no vocals (negative prompt suppression)" },
              { id: "wordless_aalap", label: "🕊️ Wordless Aalap", desc: "Non-lexical vocalises (Oohs, Aahs, Nom-Tom)" },
              { id: "tarana_sargam", label: "⚡ Tarana & Sargam", desc: "Rhythmic syllables & rapid solfège taans" },
              { id: "vocal_lead", label: "🎤 Vocal Lead", desc: "Follows lyrics with styled texture & modulation" }
            ].map(m => `
              <button class="nad-vocal-mode-btn" data-mode="${m.id}" title="${m.desc}" style="padding: 5px 12px; font-size: 11px; font-weight: ${currentVocalMode === m.id ? '700' : '500'}; background: ${currentVocalMode === m.id ? '#d97706' : '#27272a'}; color: ${currentVocalMode === m.id ? '#ffffff' : '#a1a1aa'}; border: 1px solid ${currentVocalMode === m.id ? '#f59e0b' : '#3f3f46'}; border-radius: 6px; cursor: pointer; transition: all 0.15s ease;">
                ${m.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Sub-bar for Textures & Modulations -->
        <div id="nad-vocal-details-section" style="transition: all 0.2s ease; opacity: ${currentVocalMode === 'instrumental' ? '0.35' : '1.0'}; pointer-events: ${currentVocalMode === 'instrumental' ? 'none' : 'auto'};">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #18181b; border: 1px solid #27272a; border-radius: 6px; padding: 12px;">
            <!-- Column 1: Vocal Textures & Registers -->
            <div>
              <div style="font-size: 11px; font-weight: 700; color: #67e8f9; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                Vocal Textures & Registers
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                ${[
                  { name: "Open Aa Aalap", desc: "Open-throat Akar diaphragmatic exposition" },
                  { name: "Ethereal Oohs", desc: "Resonant round Okar head voice" },
                  { name: "Soft Humming", desc: "Intimate nasal/chest internal resonance" },
                  { name: "Nom-Tom Syllables", desc: "Dhrupad abstract phonetics: Na, Te, Re, Nom, Tum" },
                  { name: "Mandra (Chest)", desc: "Deep somatic low-octave resonance" },
                  { name: "Taar (High Soaring)", desc: "High register crystalline sheen" },
                  { name: "Breath Choir", desc: "Layered whisper/air vocal bed" },
                  { name: "Granular Vocal Pad", desc: "Atmospheric cloud of harmonic voices" }
                ].map(tex => {
                  const isSel = selectedVocalTextures.has(tex.name);
                  return `
                    <button class="nad-vocal-tex-btn" data-tex="${tex.name}" title="${tex.desc}" style="padding: 4px 9px; font-size: 11px; border-radius: 12px; cursor: pointer; border: 1px solid ${isSel ? '#f59e0b' : '#3f3f46'}; background: ${isSel ? 'rgba(245, 158, 11, 0.25)' : '#27272a'}; color: ${isSel ? '#fef3c7' : '#a1a1aa'}; transition: all 0.15s ease;">
                      ${tex.name}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Column 2: Microtonal Modulations & Gamakas -->
            <div>
              <div style="font-size: 11px; font-weight: 700; color: #a78bfa; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                Gamakas & Modulations
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                ${[
                  { name: "Meend (Continuous Glides)", desc: "Seamless microtonal portamento" },
                  { name: "Gamaka (Throat Oscillations)", desc: "Forceful resonant vibrato and heavy oscillations" },
                  { name: "Andolan (Microtonal Swings)", desc: "Gentle oscillation between subtle Shrutis" },
                  { name: "Khatka / Murki (Fast Turns)", desc: "Agile 3-to-4 note rapid turns" },
                  { name: "Rapid Sapat Taans", desc: "Straight rapid modal scale runs" },
                  { name: "Bol-Taan Weaving", desc: "Rhythmic accentuation of syllables" }
                ].map(mod => {
                  const isSel = selectedModulations.has(mod.name);
                  return `
                    <button class="nad-vocal-mod-btn" data-mod="${mod.name}" title="${mod.desc}" style="padding: 4px 9px; font-size: 11px; border-radius: 12px; cursor: pointer; border: 1px solid ${isSel ? '#a78bfa' : '#3f3f46'}; background: ${isSel ? 'rgba(167, 139, 250, 0.25)' : '#27272a'}; color: ${isSel ? '#ede9fe' : '#a1a1aa'}; transition: all 0.15s ease;">
                      ${mod.name}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 6: Additional Prompt Injection & Section 7 Lyrics -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <!-- Additional Prompt Injection Box -->
        <div style="background: #202023; border: 1px solid #2e2e32; border-radius: 8px; padding: 16px; display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 14px; font-weight: 600; color: #fbbf24;">Additional Prompt</span>
            <span style="font-size: 11px; color: #a1a1aa;">Custom style, solos, tempo & direction</span>
          </div>
          <textarea id="nad-custom-prompt-box" rows="4" placeholder="Enter custom prompt injection (e.g. slow meditative alap, emotive sarod solos, soft keherwa tabla groove, dynamic cinematic build, warm analog console sound)..." style="flex: 1; min-height: 80px; width: 100%; box-sizing: border-box; background: #18181b; border: 1px solid #27272a; border-radius: 6px; padding: 10px; color: #f4f4f5; font-size: 12px; line-height: 1.5; font-family: system-ui, sans-serif; resize: vertical;">${customPromptText}</textarea>
          <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;">
            <span style="font-size: 10px; color: #71717a; align-self: center; margin-right: 2px;">Tags:</span>
            ${[
              "Vilambit (Slow)",
              "Drut (Fast)",
              "Jugalbandi Duet",
              "Meditative Alap",
              "Dynamic Climax",
              "Analog Warmth"
            ].map(tag => `
              <button class="nad-prompt-tag-btn" data-tag="${tag}" style="padding: 2px 7px; font-size: 10px; background: #27272a; border: 1px solid #3f3f46; color: #a1a1aa; border-radius: 4px; cursor: pointer;">
                + ${tag}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Section 7: Lyrics -->
        <div style="background: #202023; border: 1px solid #2e2e32; border-radius: 8px; padding: 16px; display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 14px; font-weight: 600; color: #fbbf24;">7. Lyrics</span>
            <span id="nad-lyrics-header-hint" style="font-size: 11px; color: ${currentVocalMode === 'instrumental' ? '#ef4444' : '#a1a1aa'};">
              ${currentVocalMode === 'instrumental' ? 'Muted (Pure Instrumental Active)' : 'Sanskrit / Hindi / English (zero schwa-deletion)'}
            </span>
          </div>
          <textarea id="nad-lyrics-box" rows="4" placeholder="${currentVocalMode === 'instrumental' ? '(Lyrics muted because Pure Instrumental mode is selected. Negative prompts active).' : (currentVocalMode === 'wordless_aalap' ? 'Wordless vocalise active. Enter lyrics here only if you wish to override with written verses...' : 'Enter or paste lyrics here (Sanskrit, Hindi, English, etc.). The system automatically preserves Vedic meter and applies zero schwa-deletion...')}" style="flex: 1; min-height: 80px; width: 100%; box-sizing: border-box; background: #18181b; border: 1px solid ${currentVocalMode === 'instrumental' ? '#3f3f46' : '#27272a'}; border-radius: 6px; padding: 10px; color: #fef3c7; font-size: 12px; line-height: 1.5; font-family: system-ui, sans-serif; resize: vertical; opacity: ${currentVocalMode === 'instrumental' ? '0.4' : '1.0'};">${lyricsText}</textarea>
          <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 10px; color: #71717a;">Auto-detects phonetics & meter</span>
            <button id="nad-clear-lyrics-btn" style="padding: 2px 8px; font-size: 10px; background: #27272a; border: 1px solid #3f3f46; color: #a1a1aa; border-radius: 4px; cursor: pointer;">Clear</button>
          </div>
        </div>
      </div>

      <!-- Row 7: Reference Music & Style Matcher -->
      <div style="background: #202023; border: 1px solid #2e2e32; border-radius: 8px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div>
            <span style="font-size: 14px; font-weight: 600; color: #fbbf24;">8. Reference Music ("Create Along These Lines")</span>
            <span style="font-size: 11px; color: #a1a1aa; margin-left: 8px;">(Drop audio or trim a phrase to guide the AI)</span>
          </div>
          <input type="file" id="nad-ref-file-input" accept="audio/*" style="display: none;">
          <div style="display: flex; gap: 8px;">
            <button id="nad-ref-browse-btn" style="padding: 4px 12px; font-size: 11px; background: #27272a; border: 1px solid #3f3f46; color: #d4d4d8; border-radius: 4px; cursor: pointer; transition: all 0.2s;">
              📂 Choose Audio File
            </button>
            <button id="nad-ref-clear-btn" style="padding: 4px 10px; font-size: 11px; background: #27272a; border: 1px solid #3f3f46; color: #ef4444; border-radius: 4px; cursor: pointer; display: ${referenceAudioFile ? 'inline-block' : 'none'};">
              ✕ Remove
            </button>
          </div>
        </div>

        <!-- Drag & Drop Zone -->
        <div id="nad-ref-drop-zone" style="border: 2px dashed ${referenceAudioFile ? '#10b981' : '#3f3f46'}; border-radius: 8px; padding: 14px 18px; text-align: center; cursor: pointer; background: #18181b; transition: all 0.2s ease;">
          ${referenceAudioFile ? `
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
              <div style="display: flex; align-items: center; gap: 12px; text-align: left;">
                <div style="font-size: 24px;">🎶</div>
                <div>
                  <div style="font-size: 13px; font-weight: 700; color: #10b981;">${referenceAudioName}</div>
                  <div style="font-size: 11px; color: #a1a1aa;">Duration: ${referenceAudioDuration.toFixed(1)}s • Audio-to-Audio Prior Active</div>
                </div>
              </div>
              <button id="nad-ref-play-btn" style="padding: 6px 14px; font-size: 11px; font-weight: 600; background: ${isRefPlaying ? '#dc2626' : '#059669'}; color: #ffffff; border: none; border-radius: 6px; cursor: pointer;">
                ${isRefPlaying ? '⏹️ Stop' : '▶️ Audition Clip'}
              </button>
            </div>
          ` : `
            <div style="color: #a1a1aa; font-size: 13px;">
              <span style="font-size: 20px; display: block; margin-bottom: 4px;">🎵</span>
              <strong>Drop your reference audio track here</strong>, or click to choose file
              <div style="font-size: 11px; color: #71717a; margin-top: 4px;">Supports WAV, MP3, FLAC, AIFF, M4A</div>
            </div>
          `}
        </div>

        <!-- Range Trimmer & Influence Slider (Progressive Disclosure: only visible when audio is dropped or selected) -->
        <div id="nad-ref-controls-panel" style="margin-top: 12px; display: ${referenceAudioFile ? 'block' : 'none'};">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <!-- Left: Section Trimmer (Start & End seconds) -->
            <div style="background: #18181b; border: 1px solid #27272a; border-radius: 6px; padding: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 11px; font-weight: 700; color: #67e8f9; text-transform: uppercase; letter-spacing: 0.5px;">Section Trimmer (Optional Range)</span>
                <span style="font-size: 10px; color: #71717a;">Isolate phrase / solo</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="flex: 1;">
                  <label style="font-size: 10px; color: #a1a1aa; display: block; margin-bottom: 2px;">Start (sec):</label>
                  <input type="number" id="nad-ref-start-input" min="0" max="${(referenceAudioDuration || 120).toFixed(1)}" step="0.5" value="${referenceStartTime.toFixed(1)}" placeholder="0.0" style="width: 100%; box-sizing: border-box; background: #27272a; border: 1px solid #3f3f46; border-radius: 4px; padding: 6px; color: #ffffff; font-size: 12px;">
                </div>
                <div style="flex: 1;">
                  <label style="font-size: 10px; color: #a1a1aa; display: block; margin-bottom: 2px;">End (sec):</label>
                  <input type="number" id="nad-ref-end-input" min="0" max="${(referenceAudioDuration || 120).toFixed(1)}" step="0.5" value="${(referenceEndTime || 30.0).toFixed(1)}" placeholder="30.0" style="width: 100%; box-sizing: border-box; background: #27272a; border: 1px solid #3f3f46; border-radius: 4px; padding: 6px; color: #ffffff; font-size: 12px;">
                </div>
                <button id="nad-ref-full-range-btn" style="align-self: flex-end; padding: 6px 10px; font-size: 11px; background: #27272a; border: 1px solid #3f3f46; color: #d4d4d8; border-radius: 4px; cursor: pointer; white-space: nowrap;">
                  Full Track
                </button>
              </div>
            </div>

            <!-- Right: Inspiration / Influence Slider -->
            <div style="background: #18181b; border: 1px solid #27272a; border-radius: 6px; padding: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 11px; font-weight: 700; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.5px;">Inspiration Strength ("Along These Lines")</span>
                <span id="nad-ref-influence-display" style="font-size: 12px; font-weight: 700; color: #fef3c7;">${referenceInfluence}%</span>
              </div>
              <input type="range" id="nad-ref-influence-slider" min="15" max="85" step="5" value="${referenceInfluence}" style="width: 100%; accent-color: #f59e0b; cursor: pointer;">
              <div id="nad-ref-influence-desc" style="font-size: 10px; color: #a1a1aa; margin-top: 4px;">
                ${referenceInfluence <= 35 ? 'Loose Vibe (30%): Absorbs tempo & mood, composes fresh original melodies in chosen Raga.' : (referenceInfluence <= 65 ? 'Balanced Re-imagination (50%): Follows contour & rhythm, re-voiced through Indian instruments.' : 'Close Acoustic Reflection (75%): Tightly mirrors phrasing, accents, and dynamics.')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 7: AI Generation Control Hub & Native Timeline Actions -->
      <div style="background: linear-gradient(135deg, #131127 0%, #1c183d 50%, #291a4d 100%); border: 1px solid #6366f1; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45);">
        
        <!-- Header with Status Pill -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">🎛️</span>
            <div>
              <div style="font-size: 14px; font-weight: 700; color: #ffffff; letter-spacing: 0.3px;">AI Audio Generation Engine & LoRA Hub</div>
              <div style="font-size: 11px; color: #c7d2fe;">Configure foundation model, memory quantization, extended render duration, and fine-tuning adapters</div>
            </div>
          </div>
          <div id="nad-gen-status-pill" style="font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 999px; background: rgba(99, 102, 241, 0.2); border: 1px solid #6366f1; color: #c7d2fe; display: flex; align-items: center; gap: 6px;">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: #22c55e;"></span> Ready for Timeline Injection
          </div>
        </div>

        <!-- Primary Controls Grid: Model, Quantization, Duration -->
        <div style="display: grid; grid-template-columns: 1.4fr 1.1fr 1.5fr; gap: 12px; align-items: start;">
          
          <!-- 1. Generative Model Dropdown -->
          <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 6px; padding: 10px;">
            <label style="display: block; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">
              Foundation Model
            </label>
            <select id="nad-gen-model-select" style="width: 100%; background: #18181b; color: #f8fafc; border: 1px solid #4338ca; border-radius: 4px; padding: 7px 10px; font-size: 11px; font-weight: 600; cursor: pointer; outline: none;">
              <option value="yue2" ${selectedGenModel === 'yue2' ? 'selected' : ''}>YuE 2 (High Fidelity & Coherence)</option>
              <option value="minimax_music3" ${selectedGenModel === 'minimax_music3' ? 'selected' : ''}>MiniMax Music 3 (Expressive Vocals)</option>
              <option value="ace_step_xl_turbo" ${selectedGenModel === 'ace_step_xl_turbo' ? 'selected' : ''}>ACE-Step 1.5 XL Turbo (Local MPS)</option>
              <option value="stable_audio3" ${selectedGenModel === 'stable_audio3' ? 'selected' : ''}>Stable Audio 3 (Acoustic & 10m)</option>
            </select>
            <div id="nad-model-desc" style="font-size: 10px; color: #a5b4fc; margin-top: 6px; line-height: 1.35;">
              ${GEN_MODELS[selectedGenModel]?.desc || ''}
            </div>
          </div>

          <!-- 2. Quantization / Precision Menu -->
          <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 6px; padding: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
                Quantization
              </label>
              <span id="nad-quant-badge" style="font-size: 9px; padding: 1px 6px; border-radius: 4px; background: ${QUANT_PRESETS[selectedQuantization]?.badgeColor || '#1e1b4b'}; color: ${QUANT_PRESETS[selectedQuantization]?.badgeText || '#a5b4fc'}; font-weight: 700;">
                ${QUANT_PRESETS[selectedQuantization]?.badge || 'Safe'}
              </span>
            </div>
            <select id="nad-gen-quant-select" style="width: 100%; background: #18181b; color: #f8fafc; border: 1px solid #4338ca; border-radius: 4px; padding: 7px 10px; font-size: 11px; font-weight: 600; cursor: pointer; outline: none;">
              <option value="q4" ${selectedQuantization === 'q4' ? 'selected' : ''}>Q_4 (Low Memory / Anti-OOM)</option>
              <option value="q8" ${selectedQuantization === 'q8' ? 'selected' : ''}>Q_8 (Balanced Studio Quality)</option>
              <option value="bf16" ${selectedQuantization === 'bf16' ? 'selected' : ''}>bf16 (Full Float Precision)</option>
            </select>
            <div id="nad-quant-desc" style="font-size: 10px; color: #a1a1aa; margin-top: 6px; line-height: 1.35;">
              ${QUANT_PRESETS[selectedQuantization]?.desc || ''}
            </div>
          </div>

          <!-- 3. Extended Duration Control (10s to 600s / 10m) -->
          <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 6px; padding: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
                Target Duration
              </label>
              <span id="nad-duration-display" style="font-size: 12px; font-weight: 700; color: #fbbf24;">${selectedDuration}s (${(selectedDuration / 60).toFixed(1)}m)</span>
            </div>
            <input type="range" id="nad-duration-slider" min="10" max="600" step="5" value="${selectedDuration}" style="width: 100%; accent-color: #f59e0b; cursor: pointer; margin-bottom: 8px;">
            
            <!-- Quick Preset Pills -->
            <div style="display: flex; gap: 4px; justify-content: space-between;">
              <button class="nad-dur-pill ${selectedDuration === 15 ? 'active' : ''}" data-sec="15" style="flex: 1; padding: 3px 0; font-size: 9px; font-weight: 600; background: ${selectedDuration === 15 ? '#4f46e5' : '#27272a'}; border: 1px solid ${selectedDuration === 15 ? '#6366f1' : '#3f3f46'}; color: ${selectedDuration === 15 ? '#ffffff' : '#d4d4d8'}; border-radius: 4px; cursor: pointer;">15s</button>
              <button class="nad-dur-pill ${selectedDuration === 30 ? 'active' : ''}" data-sec="30" style="flex: 1; padding: 3px 0; font-size: 9px; font-weight: 600; background: ${selectedDuration === 30 ? '#4f46e5' : '#27272a'}; border: 1px solid ${selectedDuration === 30 ? '#6366f1' : '#3f3f46'}; color: ${selectedDuration === 30 ? '#ffffff' : '#d4d4d8'}; border-radius: 4px; cursor: pointer;">30s</button>
              <button class="nad-dur-pill ${selectedDuration === 60 ? 'active' : ''}" data-sec="60" style="flex: 1; padding: 3px 0; font-size: 9px; font-weight: 600; background: ${selectedDuration === 60 ? '#4f46e5' : '#27272a'}; border: 1px solid ${selectedDuration === 60 ? '#6366f1' : '#3f3f46'}; color: ${selectedDuration === 60 ? '#ffffff' : '#d4d4d8'}; border-radius: 4px; cursor: pointer;">60s</button>
              <button class="nad-dur-pill ${selectedDuration === 180 ? 'active' : ''}" data-sec="180" style="flex: 1; padding: 3px 0; font-size: 9px; font-weight: 600; background: ${selectedDuration === 180 ? '#4f46e5' : '#27272a'}; border: 1px solid ${selectedDuration === 180 ? '#6366f1' : '#3f3f46'}; color: ${selectedDuration === 180 ? '#ffffff' : '#d4d4d8'}; border-radius: 4px; cursor: pointer;">3m</button>
              <button class="nad-dur-pill ${selectedDuration === 300 ? 'active' : ''}" data-sec="300" style="flex: 1; padding: 3px 0; font-size: 9px; font-weight: 600; background: ${selectedDuration === 300 ? '#4f46e5' : '#27272a'}; border: 1px solid ${selectedDuration === 300 ? '#6366f1' : '#3f3f46'}; color: ${selectedDuration === 300 ? '#ffffff' : '#d4d4d8'}; border-radius: 4px; cursor: pointer;">5m</button>
              <button class="nad-dur-pill ${selectedDuration === 600 ? 'active' : ''}" data-sec="600" style="flex: 1; padding: 3px 0; font-size: 9px; font-weight: 600; background: ${selectedDuration === 600 ? '#4f46e5' : '#27272a'}; border: 1px solid ${selectedDuration === 600 ? '#6366f1' : '#3f3f46'}; color: ${selectedDuration === 600 ? '#ffffff' : '#d4d4d8'}; border-radius: 4px; cursor: pointer;">10m</button>
            </div>
          </div>
        </div>

        <!-- Secondary Row: LoRA Fine-Tuning Adapters -->
        <div style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 6px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
            <span style="font-size: 15px;">🧬</span>
            <div style="min-width: 140px;">
              <div style="font-size: 11px; font-weight: 700; color: #f1f5f9; letter-spacing: 0.3px;">Musicology LoRA Adapter</div>
              <div style="font-size: 9px; color: #94a3b8;">Fine-tuned weights (.safetensors)</div>
            </div>

            <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
              <select id="nad-lora-select" style="flex: 1; background: #18181b; color: #f8fafc; border: 1px solid #3f3f46; border-radius: 4px; padding: 5px 8px; font-size: 11px; cursor: pointer; outline: none;">
                <option value="none" ${!selectedLoRAName ? 'selected' : ''}>None (Base Model Priors)</option>
                ${selectedLoRAName ? `<option value="custom" selected>Custom: ${selectedLoRAName}</option>` : ''}
                <option value="browse">Load Custom LoRA File (.safetensors)...</option>
              </select>
              <input type="file" id="nad-lora-file-input" accept=".safetensors,.bin,.pt" style="display: none;">
              <button id="nad-lora-browse-btn" style="padding: 5px 10px; font-size: 10px; font-weight: 600; background: #27272a; border: 1px solid #3f3f46; color: #e4e4e7; border-radius: 4px; cursor: pointer; white-space: nowrap;">
                📂 Browse...
              </button>
              <button id="nad-lora-clear-btn" style="display: ${selectedLoRAName ? 'inline-block' : 'none'}; padding: 5px 8px; font-size: 10px; background: #3f3f46; border: none; color: #f87171; border-radius: 4px; cursor: pointer;" title="Clear LoRA">
                ✕
              </button>
              <span id="nad-lora-badge" style="display: ${selectedLoRAName ? 'inline-block' : 'none'}; font-size: 10px; padding: 2px 7px; border-radius: 4px; background: #065f46; color: #6ee7b7; font-weight: 600; white-space: nowrap;">
                Active
              </span>
            </div>
          </div>

          <!-- LoRA Strength Slider -->
          <div style="display: flex; align-items: center; gap: 10px; min-width: 220px; border-left: 1px solid rgba(255, 255, 255, 0.1); padding-left: 16px;">
            <div style="text-align: right;">
              <div style="font-size: 10px; font-weight: 700; color: #cbd5e1;">LoRA Weight</div>
              <div id="nad-lora-strength-display" style="font-size: 11px; font-weight: 700; color: #a5b4fc;">${selectedLoRAStrength.toFixed(2)}x (${Math.round(selectedLoRAStrength * 100)}%)</div>
            </div>
            <input type="range" id="nad-lora-strength-slider" min="0" max="100" step="5" value="${Math.round(selectedLoRAStrength * 100)}" style="width: 100px; accent-color: #6366f1; cursor: pointer;" ${!selectedLoRAName ? 'disabled style="width: 100px; accent-color: #6366f1; cursor: not-allowed; opacity: 0.5;"' : ''}>
          </div>
        </div>

        <!-- Extended Spectrum Upscale: Simple Button Toggle -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.25); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 6px; padding: 8px 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 14px;">⚡</span>
            <div>
              <span style="font-size: 11px; font-weight: 600; color: #cbd5e1;">Extended Spectrum Upscaling (96kHz / 32-Bit Float)</span>
              <span style="font-size: 10px; color: #64748b; margin-left: 6px;">Zero-phase subsonic clearance & high-harmonic restoration</span>
            </div>
          </div>
          <button id="nad-upscale-toggle-btn" style="padding: 5px 14px; font-size: 11px; font-weight: 700; border-radius: 4px; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 6px; ${enableSuperResolutionUpscale ? 'background: rgba(30, 58, 138, 0.8); border: 1px solid #3b82f6; color: #93c5fd;' : 'background: #27272a; border: 1px solid #3f3f46; color: #71717a;'}">
            <span id="nad-upscale-dot" style="width: 7px; height: 7px; border-radius: 50%; background: ${enableSuperResolutionUpscale ? '#38bdf8' : '#71717a'}; display: inline-block;"></span>
            <span id="nad-upscale-btn-text">${enableSuperResolutionUpscale ? '96kHz Upscale: Active' : '96kHz Upscale: Off'}</span>
          </button>
        </div>

        <!-- Mastering Chain & Acoustic Tanpura Drone Bedding -->
        <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 6px; padding: 10px 12px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 13px;">🎙️</span>
              <span style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Indian Playback Mastering Chain</span>
            </div>
            <div id="nad-mastering-desc" style="font-size: 9.5px; color: #a5b4fc; font-style: italic;">
              ${MASTERING_PRESETS[selectedMasteringPreset]?.desc || ''}
            </div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
            ${Object.values(MASTERING_PRESETS).map(m => `
              <button class="nad-mastering-pill ${selectedMasteringPreset === m.id ? 'active' : ''}" data-preset="${m.id}" style="padding: 6px 4px; font-size: 10px; font-weight: 700; border-radius: 4px; cursor: pointer; text-align: center; transition: all 0.15s ease; ${selectedMasteringPreset === m.id ? 'background: #4f46e5; border: 1px solid #818cf8; color: #ffffff;' : 'background: #1e1b4b; border: 1px solid #312e81; color: #c7d2fe;'}">
                ${m.label}
              </button>
            `).join('')}
          </div>

          <!-- Acoustic Tanpura Drone Bedding Slider -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 8px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 12px;">🪕</span>
              <span style="font-size: 10px; font-weight: 700; color: #cbd5e1;">Acoustic Tanpura Drone Bedding</span>
              <span style="font-size: 9px; color: #64748b;">(4-String Jawari locked to Sa)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span id="nad-drone-level-display" style="font-size: 10.5px; font-weight: 700; color: #38bdf8;">${selectedDroneLevel}% Bedding</span>
              <input type="range" id="nad-drone-level-slider" min="0" max="50" step="5" value="${selectedDroneLevel}" style="width: 110px; accent-color: #38bdf8; cursor: pointer;">
            </div>
          </div>
        </div>

        <!-- Action Row: Prompt Summary + Compact Copy Button + Prominent Generate Trigger -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 4px;">
          <div style="font-size: 11px; color: #cbd5e1; display: flex; align-items: center; gap: 6px;">
            <span style="color: #10b981;">●</span>
            <span>Compiles Raga, 22 Shrutis, Moveable Sa, instrumentation & reference music into track</span>
          </div>

          <div style="display: flex; gap: 8px; align-items: center;">
            <!-- Compact Copy Button -->
            <button id="nad-copy-prompt-btn" title="Copy full compiled musicology prompt to clipboard" style="padding: 9px 14px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); color: #ffffff; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.15s ease;">
              📋 <span id="nad-copy-prompt-label">Copy Prompt</span>
            </button>

            <!-- Prominent Action Trigger -->
            <button id="nad-generate-btn" style="padding: 9px 20px; background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%); border: 1px solid #818cf8; color: #ffffff; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.45); transition: all 0.15s ease;">
              🚀 <span id="nad-generate-btn-label">Generate AI Track in Nād</span>
            </button>
          </div>
        </div>
      </div>
    `;

    panel.appendChild(header);
    panel.appendChild(content);
    modal.appendChild(panel);
    document.body.appendChild(modal);

    // Event Wire-up
    document.getElementById('nad-modal-close-btn').onclick = toggleModal;
    modal.onclick = (e) => { if (e.target === modal) toggleModal(); };

    // Moveable Sa Slider
    const slider = document.getElementById('nad-sa-slider');
    const display = document.getElementById('nad-sa-display');
    slider.oninput = (e) => {
      currentSaHz = parseFloat(e.target.value);
      display.innerText = `${currentSaHz.toFixed(1)} Hz`;
      updateTriggerButtonText();
      renderShrutis();
      if (isDronePlaying) {
        toggleDrone();
        toggleDrone();
      }
    };

    // Presets
    document.querySelectorAll('.nad-sa-preset-btn').forEach(btn => {
      btn.onclick = () => {
        currentSaHz = parseFloat(btn.getAttribute('data-hz'));
        slider.value = currentSaHz;
        display.innerText = `${currentSaHz.toFixed(1)} Hz`;
        updateTriggerButtonText();
        renderShrutis();
        if (isDronePlaying) {
          toggleDrone();
          toggleDrone();
        }
      };
    });

    // Drone button
    document.getElementById('nad-drone-toggle-btn').onclick = toggleDrone;

    // Raga Selector
    const ragaSelect = document.getElementById('nad-raga-select');
    ragaSelect.onchange = (e) => {
      currentRaga = RAGAS.find(r => r.id === e.target.value) || RAGAS[0];
      updateTriggerButtonText();
      const details = document.getElementById('nad-raga-details');
      details.innerHTML = `
        <div><strong>Western Mode:</strong> <span style="color: #67e8f9;">${currentRaga.western}</span></div>
        <div><strong>Arohana (Ascent):</strong> ${currentRaga.arohana}</div>
        <div><strong>Avarohana (Descent):</strong> ${currentRaga.avarohana}</div>
        <div><strong>Vadi / Samvadi:</strong> ${currentRaga.vadi} / ${currentRaga.samvadi}</div>
        <div><strong>Pakad (Catchphrase):</strong> ${currentRaga.pakad}</div>
        <div><strong>Acoustic Profile:</strong> <span style="color: #fde68a;">${currentRaga.profile}</span></div>
      `;
      renderShrutis();
      renderInstrumentsUI();
    };

    // Navarasa Buttons
    document.querySelectorAll('.nad-rasa-btn').forEach(btn => {
      btn.onclick = () => {
        const rasaName = btn.getAttribute('data-rasa');
        currentRasa = NAVARASAS.find(n => n.name === rasaName) || NAVARASAS[0];
        document.querySelectorAll('.nad-rasa-btn').forEach(b => {
          const name = b.getAttribute('data-rasa');
          const isSel = name === currentRasa.name;
          b.style.background = isSel ? currentRasa.color : '#27272a';
          b.style.borderColor = isSel ? '#ffffff' : '#3f3f46';
        });
        const desc = document.getElementById('nad-rasa-desc');
        desc.innerHTML = `<strong>${currentRasa.name} (${currentRasa.english}):</strong> ${currentRasa.desc} • <span style="color:#fde68a;font-weight:700;">Tempo:</span> ${currentRasa.tempo} • <span style="color:#67e8f9;font-weight:600;">Archetype:</span> ${currentRasa.archetype}`;
        renderInstrumentsUI();
      };
    });

    function renderInstrumentsUI() {
      const cat = INSTRUMENT_CATEGORIES[currentInstrumentCategory];
      if (!cat) return;

      // 1. Update Description
      const descEl = document.getElementById('nad-inst-cat-desc');
      if (descEl) {
        const categoryLabel = cat.title.split(' • ')[1]?.replace(')', '') || cat.code;
        descEl.innerHTML = `<span style="font-weight: 700; color: #fbbf24;">${cat.sanskrit} (${categoryLabel}):</span> ${cat.desc}`;
      }

      // 2. Render Subcategories & Chips
      const container = document.getElementById('nad-inst-chips-container');
      if (container) {
        container.innerHTML = cat.subcategories.map(sub => `
          <div style="background: #18181b; border: 1px solid #27272a; border-radius: 6px; padding: 10px;">
            <div style="font-size: 11px; font-weight: 700; color: #67e8f9; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
              ${sub.name}
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${sub.items.map(inst => {
                const isSel = selectedInstruments.has(inst.name);
                const isMelodic = INSTRUMENT_ROLE_HELPERS.isMelodic(inst.name);
                const isDrone = INSTRUMENT_ROLE_HELPERS.isDrone(inst.name);
                const roleBadge = isMelodic ? '⭐' : (isDrone ? '🪕' : '🥁');
                return `
                  <button class="nad-inst-chip" data-inst="${inst.name}" title="${inst.desc}" style="padding: 5px 11px; font-size: 11px; border-radius: 14px; cursor: pointer; border: 1px solid ${isSel ? '#f59e0b' : '#3f3f46'}; background: ${isSel ? 'rgba(245, 158, 11, 0.25)' : '#27272a'}; color: ${isSel ? '#fef3c7' : '#a1a1aa'}; transition: all 0.15s ease;">
                    <span style="font-size: 10px; margin-right: 2px;">${roleBadge}</span>
                    <span style="font-weight: ${isSel ? '700' : '500'};">${inst.name}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        `).join('');

        // Wire clicks for each chip
        container.querySelectorAll('.nad-inst-chip').forEach(chip => {
          chip.onclick = () => {
            const inst = chip.getAttribute('data-inst');
            if (selectedInstruments.has(inst)) {
              selectedInstruments.delete(inst);
            } else {
              selectedInstruments.add(inst);
            }
            renderInstrumentsUI();
          };
        });
      }

      // 3. Update Active Selection Bar with Dynamic Role Detection & Live Token-0 Prompt Preview
      const activeBar = document.getElementById('nad-inst-active-bar');
      if (activeBar) {
        const count = selectedInstruments.size;
        const allList = Array.from(selectedInstruments);
        const melodicList = allList.filter(INSTRUMENT_ROLE_HELPERS.isMelodic);
        const droneList = allList.filter(INSTRUMENT_ROLE_HELPERS.isDrone);
        const rhythmList = allList.filter(INSTRUMENT_ROLE_HELPERS.isRhythm);

        // Dynamic Acoustic Architecture Labeling
        let arrangementLabel = "Default Acoustic Arrangement";
        let arrangementColor = "#a1a1aa";
        if (melodicList.length === 1) {
          arrangementLabel = `★ Solo Recital (${melodicList[0]})`;
          arrangementColor = "#34d399";
        } else if (melodicList.length === 2) {
          arrangementLabel = `👥 Jugalbandi Duet (${melodicList[0]} & ${melodicList[1]})`;
          arrangementColor = "#fbbf24";
        } else if (melodicList.length > 2) {
          arrangementLabel = `🎼 Melodic Ensemble (${melodicList.length} Leads)`;
          arrangementColor = "#a5b4fc";
        } else if (droneList.length > 0 || rhythmList.length > 0) {
          arrangementLabel = `🪕 Accompaniment Only (Drone/Rhythm)`;
          arrangementColor = "#cbd5e1";
        }

        // Build live prompt preview snippet for the user:
        const livePrompt = buildConditionedPromptString();
        const livePreviewText = livePrompt.length > 175 ? livePrompt.slice(0, 175) + '...' : livePrompt;

        activeBar.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 11px; font-weight: 700; color: #fbbf24;">Acoustic Architecture (${count} Active):</span>
              <span style="font-size: 10px; color: ${arrangementColor}; font-weight: 600;">
                ${arrangementLabel}
              </span>
            </div>
            <span style="font-size: 10px; color: #71717a;">Click × to remove</span>
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; align-items: center;">
            ${count === 0 ? `<span style="font-size: 11px; color: #71717a; font-style: italic;">No instruments selected (AI will compose default acoustic arrangement)</span>` : ''}
            
            ${melodicList.length > 0 ? `
              <div style="display: flex; align-items: center; gap: 4px; background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; border-radius: 6px; padding: 2px 6px;">
                <span style="font-size: 9px; font-weight: 800; color: #fbbf24; text-transform: uppercase;">${melodicList.length === 1 ? '⭐ Solo Lead:' : '👥 Melodic Leads:'}</span>
                ${melodicList.map((name, idx) => `
                  <span style="display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 700; color: #ffffff;">
                    ${name}${idx === 0 && melodicList.length > 1 ? ' (Token 0)' : ''}
                    <span class="nad-remove-inst-btn" data-inst="${name}" style="cursor: pointer; color: #f87171; font-weight: 800; font-size: 12px;">×</span>
                  </span>
                `).join(', ')}
              </div>
            ` : ''}

            ${droneList.length > 0 ? `
              <div style="display: flex; align-items: center; gap: 4px; background: rgba(99, 102, 241, 0.15); border: 1px solid #6366f1; border-radius: 6px; padding: 2px 6px;">
                <span style="font-size: 9px; font-weight: 800; color: #a5b4fc; text-transform: uppercase;">🪕 Drone:</span>
                ${droneList.map(name => `
                  <span style="display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 600; color: #e0e7ff;">
                    ${name}
                    <span class="nad-remove-inst-btn" data-inst="${name}" style="cursor: pointer; color: #f87171; font-weight: 800; font-size: 12px;">×</span>
                  </span>
                `).join(', ')}
              </div>
            ` : ''}

            ${rhythmList.length > 0 ? `
              <div style="display: flex; align-items: center; gap: 4px; background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; border-radius: 6px; padding: 2px 6px;">
                <span style="font-size: 9px; font-weight: 800; color: #6ee7b7; text-transform: uppercase;">🥁 Rhythm:</span>
                ${rhythmList.map(name => `
                  <span style="display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 600; color: #d1fae5;">
                    ${name}
                    <span class="nad-remove-inst-btn" data-inst="${name}" style="cursor: pointer; color: #f87171; font-weight: 800; font-size: 12px;">×</span>
                  </span>
                `).join(', ')}
              </div>
            ` : ''}
          </div>

          <!-- Live Token-0 Acoustic Prompt Preview Box -->
          <div style="margin-top: 8px; background: #090d16; border: 1px solid #1e293b; border-left: 3px solid #10b981; border-radius: 6px; padding: 6px 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 9px; font-weight: 700; color: #34d399; text-transform: uppercase; letter-spacing: 0.5px;">✓ Live Model Prompt (Lead Acoustic Instrument at Token 0):</span>
              <span style="font-size: 9px; color: #64748b;">Microtonal Timbre First</span>
            </div>
            <div style="font-size: 10.5px; color: #cbd5e1; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; margin-top: 3px; line-height: 1.4;">
              "${livePreviewText}"
            </div>
          </div>
        `;

        activeBar.querySelectorAll('.nad-remove-inst-btn').forEach(btn => {
          btn.onclick = () => {
            const inst = btn.getAttribute('data-inst');
            selectedInstruments.delete(inst);
            renderInstrumentsUI();
          };
        });
      }
    }

    // Category Select Dropdown
    const catSelect = document.getElementById('nad-inst-category-select');
    if (catSelect) {
      catSelect.onchange = (e) => {
        currentInstrumentCategory = e.target.value;
        renderInstrumentsUI();
      };
    }

    // Clear All
    const clearAllBtn = document.getElementById('nad-inst-clear-all-btn');
    if (clearAllBtn) {
      clearAllBtn.onclick = () => {
        selectedInstruments.clear();
        renderInstrumentsUI();
      };
    }


    renderInstrumentsUI();

    // Vocal Presence & Textures Wire-up
    function updateVocalModeUI() {
      // 1. Update button styling
      document.querySelectorAll('.nad-vocal-mode-btn').forEach(btn => {
        const mode = btn.getAttribute('data-mode');
        const isSel = mode === currentVocalMode;
        btn.style.background = isSel ? '#d97706' : '#27272a';
        btn.style.color = isSel ? '#ffffff' : '#a1a1aa';
        btn.style.borderColor = isSel ? '#f59e0b' : '#3f3f46';
        btn.style.fontWeight = isSel ? '700' : '500';
      });

      // 2. Dim/enable details section
      const detailsSection = document.getElementById('nad-vocal-details-section');
      if (detailsSection) {
        detailsSection.style.opacity = currentVocalMode === 'instrumental' ? '0.35' : '1.0';
        detailsSection.style.pointerEvents = currentVocalMode === 'instrumental' ? 'none' : 'auto';
      }

      // 3. Update lyrics box hint, opacity and placeholder
      const lyricsBox = document.getElementById('nad-lyrics-box');
      const lyricsHint = document.getElementById('nad-lyrics-header-hint');
      if (lyricsBox && lyricsHint) {
        if (currentVocalMode === 'instrumental') {
          lyricsHint.innerText = 'Muted (Pure Instrumental Active)';
          lyricsHint.style.color = '#ef4444';
          lyricsBox.style.opacity = '0.4';
          lyricsBox.placeholder = '(Lyrics muted because Pure Instrumental mode is selected. Negative prompts active).';
        } else if (currentVocalMode === 'wordless_aalap') {
          lyricsHint.innerText = 'Wordless Aalap / Textures Active';
          lyricsHint.style.color = '#67e8f9';
          lyricsBox.style.opacity = '1.0';
          lyricsBox.placeholder = 'Wordless vocalise active. Enter lyrics here only if you wish to override with written verses...';
        } else if (currentVocalMode === 'tarana_sargam') {
          lyricsHint.innerText = 'Tarana & Sargam Active';
          lyricsHint.style.color = '#a78bfa';
          lyricsBox.style.opacity = '1.0';
          lyricsBox.placeholder = 'Tarana & Sargam syllables active. Enter lyrics here to combine with rhythmic solfège...';
        } else {
          lyricsHint.innerText = 'Sanskrit / Hindi / English (zero schwa-deletion)';
          lyricsHint.style.color = '#a1a1aa';
          lyricsBox.style.opacity = '1.0';
          lyricsBox.placeholder = 'Enter or paste lyrics here (Sanskrit, Hindi, English, etc.). The system automatically preserves Vedic meter and applies zero schwa-deletion...';
        }
      }
    }

    document.querySelectorAll('.nad-vocal-mode-btn').forEach(btn => {
      btn.onclick = () => {
        currentVocalMode = btn.getAttribute('data-mode');
        updateVocalModeUI();
      };
    });

    document.querySelectorAll('.nad-vocal-tex-btn').forEach(btn => {
      btn.onclick = () => {
        const tex = btn.getAttribute('data-tex');
        if (selectedVocalTextures.has(tex)) {
          selectedVocalTextures.delete(tex);
          btn.style.background = '#27272a';
          btn.style.color = '#a1a1aa';
          btn.style.borderColor = '#3f3f46';
        } else {
          selectedVocalTextures.add(tex);
          btn.style.background = 'rgba(245, 158, 11, 0.25)';
          btn.style.color = '#fef3c7';
          btn.style.borderColor = '#f59e0b';
        }
      };
    });

    document.querySelectorAll('.nad-vocal-mod-btn').forEach(btn => {
      btn.onclick = () => {
        const mod = btn.getAttribute('data-mod');
        if (selectedModulations.has(mod)) {
          selectedModulations.delete(mod);
          btn.style.background = '#27272a';
          btn.style.color = '#a1a1aa';
          btn.style.borderColor = '#3f3f46';
        } else {
          selectedModulations.add(mod);
          btn.style.background = 'rgba(167, 139, 250, 0.25)';
          btn.style.color = '#ede9fe';
          btn.style.borderColor = '#a78bfa';
        }
      };
    });

    // Additional Prompt & Lyrics Wire-up
    const customPromptBox = document.getElementById('nad-custom-prompt-box');
    if (customPromptBox) {
      customPromptBox.oninput = (e) => {
        customPromptText = e.target.value;
      };
    }

    const lyricsBox = document.getElementById('nad-lyrics-box');
    if (lyricsBox) {
      lyricsBox.oninput = (e) => {
        lyricsText = e.target.value;
      };
    }

    // Quick Prompt Tag Buttons
    document.querySelectorAll('.nad-prompt-tag-btn').forEach(btn => {
      btn.onclick = () => {
        const tag = btn.getAttribute('data-tag');
        if (customPromptBox && tag) {
          const current = customPromptBox.value.trim();
          customPromptBox.value = current ? `${current}, ${tag}` : tag;
          customPromptText = customPromptBox.value;
        }
      };
    });

    // Clear Lyrics Button
    const clearLyricsBtn = document.getElementById('nad-clear-lyrics-btn');
    if (clearLyricsBtn) {
      clearLyricsBtn.onclick = () => {
        if (lyricsBox) {
          lyricsBox.value = '';
          lyricsText = '';
        }
      };
    }

    // Model Selector
    const modelSelect = document.getElementById('nad-gen-model-select');
    const modelDesc = document.getElementById('nad-model-desc');
    if (modelSelect) {
      modelSelect.onchange = (e) => {
        selectedGenModel = e.target.value;
        if (modelDesc && GEN_MODELS[selectedGenModel]) {
          modelDesc.innerText = GEN_MODELS[selectedGenModel].desc;
        }
      };
    }

    // Quantization Selector
    const quantSelect = document.getElementById('nad-gen-quant-select');
    const quantBadge = document.getElementById('nad-quant-badge');
    const quantDesc = document.getElementById('nad-quant-desc');
    if (quantSelect) {
      quantSelect.onchange = (e) => {
        selectedQuantization = e.target.value;
        const qInfo = QUANT_PRESETS[selectedQuantization];
        if (qInfo) {
          if (quantBadge) {
            quantBadge.innerText = qInfo.badge;
            quantBadge.style.background = qInfo.badgeColor;
            quantBadge.style.color = qInfo.badgeText;
          }
          if (quantDesc) {
            quantDesc.innerText = qInfo.desc;
          }
        }
      };
    }

    // Duration Slider & Preset Pills
    const durationSlider = document.getElementById('nad-duration-slider');
    const durationDisplay = document.getElementById('nad-duration-display');
    const durPills = document.querySelectorAll('.nad-dur-pill');

    function updateDurationUI(sec) {
      selectedDuration = sec;
      if (durationSlider) durationSlider.value = sec;
      if (durationDisplay) {
        durationDisplay.innerText = `${sec}s (${(sec / 60).toFixed(1)}m)`;
      }
      durPills.forEach(pill => {
        const pSec = parseInt(pill.getAttribute('data-sec'), 10);
        if (pSec === sec) {
          pill.style.background = '#4f46e5';
          pill.style.borderColor = '#6366f1';
          pill.style.color = '#ffffff';
        } else {
          pill.style.background = '#27272a';
          pill.style.borderColor = '#3f3f46';
          pill.style.color = '#d4d4d8';
        }
      });
    }

    if (durationSlider) {
      durationSlider.oninput = (e) => {
        const sec = parseInt(e.target.value, 10);
        updateDurationUI(sec);
      };
    }

    durPills.forEach(pill => {
      pill.onclick = () => {
        const sec = parseInt(pill.getAttribute('data-sec'), 10);
        updateDurationUI(sec);
      };
    });

    // LoRA Adapter Wire-up
    const loraSelect = document.getElementById('nad-lora-select');
    const loraFileInput = document.getElementById('nad-lora-file-input');
    const loraBrowseBtn = document.getElementById('nad-lora-browse-btn');
    const loraClearBtn = document.getElementById('nad-lora-clear-btn');
    const loraBadge = document.getElementById('nad-lora-badge');
    const loraStrengthSlider = document.getElementById('nad-lora-strength-slider');
    const loraStrengthDisplay = document.getElementById('nad-lora-strength-display');

    if (loraBrowseBtn && loraFileInput) {
      loraBrowseBtn.onclick = () => loraFileInput.click();
    }

    if (loraSelect) {
      loraSelect.onchange = (e) => {
        if (e.target.value === 'browse') {
          if (loraFileInput) loraFileInput.click();
        } else if (e.target.value === 'none') {
          selectedLoRAFile = null;
          selectedLoRAName = "";
          if (loraBadge) loraBadge.style.display = 'none';
          if (loraClearBtn) loraClearBtn.style.display = 'none';
          if (loraStrengthSlider) {
            loraStrengthSlider.disabled = true;
            loraStrengthSlider.style.opacity = '0.5';
            loraStrengthSlider.style.cursor = 'not-allowed';
          }
        }
      };
    }

    if (loraFileInput) {
      loraFileInput.onchange = (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          selectedLoRAFile = file;
          selectedLoRAName = file.name;

          // Re-render modal to sync option and controls cleanly
          const existing = document.getElementById('nad-musicology-modal');
          if (existing) {
            existing.remove();
            renderModal();
          }
        }
      };
    }

    if (loraClearBtn) {
      loraClearBtn.onclick = () => {
        selectedLoRAFile = null;
        selectedLoRAName = "";
        const existing = document.getElementById('nad-musicology-modal');
        if (existing) {
          existing.remove();
          renderModal();
        }
      };
    }

    if (loraStrengthSlider && loraStrengthDisplay) {
      loraStrengthSlider.oninput = (e) => {
        selectedLoRAStrength = parseInt(e.target.value, 10) / 100.0;
        loraStrengthDisplay.innerText = `${selectedLoRAStrength.toFixed(2)}x (${Math.round(selectedLoRAStrength * 100)}%)`;
      };
    }

    // Super-Resolution & Frequency Clearance Button Toggle Wire-up
    const upscaleBtn = document.getElementById('nad-upscale-toggle-btn');
    const upscaleDot = document.getElementById('nad-upscale-dot');
    const upscaleBtnText = document.getElementById('nad-upscale-btn-text');
    if (upscaleBtn) {
      upscaleBtn.onclick = () => {
        enableSuperResolutionUpscale = !enableSuperResolutionUpscale;
        if (enableSuperResolutionUpscale) {
          upscaleBtn.style.background = 'rgba(30, 58, 138, 0.8)';
          upscaleBtn.style.borderColor = '#3b82f6';
          upscaleBtn.style.color = '#93c5fd';
          if (upscaleDot) upscaleDot.style.background = '#38bdf8';
          if (upscaleBtnText) upscaleBtnText.innerText = '96kHz Upscale: Active';
        } else {
          upscaleBtn.style.background = '#27272a';
          upscaleBtn.style.borderColor = '#3f3f46';
          upscaleBtn.style.color = '#71717a';
          if (upscaleDot) upscaleDot.style.background = '#71717a';
          if (upscaleBtnText) upscaleBtnText.innerText = '96kHz Upscale: Off';
        }
      };
    }

    // Indian Playback Mastering Pills Wire-up
    document.querySelectorAll('.nad-mastering-pill').forEach(btn => {
      btn.onclick = () => {
        selectedMasteringPreset = btn.getAttribute('data-preset');
        document.querySelectorAll('.nad-mastering-pill').forEach(b => {
          if (b.getAttribute('data-preset') === selectedMasteringPreset) {
            b.style.background = '#4f46e5';
            b.style.borderColor = '#818cf8';
            b.style.color = '#ffffff';
          } else {
            b.style.background = '#1e1b4b';
            b.style.borderColor = '#312e81';
            b.style.color = '#c7d2fe';
          }
        });
        const mDesc = document.getElementById('nad-mastering-desc');
        if (mDesc && MASTERING_PRESETS[selectedMasteringPreset]) {
          mDesc.innerText = MASTERING_PRESETS[selectedMasteringPreset].desc;
        }
      };
    });

    // Acoustic Tanpura Drone Bedding Slider Wire-up
    const droneSlider = document.getElementById('nad-drone-level-slider');
    const droneDisplay = document.getElementById('nad-drone-level-display');
    if (droneSlider) {
      droneSlider.oninput = (e) => {
        selectedDroneLevel = parseInt(e.target.value, 10);
        if (droneDisplay) {
          droneDisplay.innerText = `${selectedDroneLevel}% Bedding`;
        }
      };
    }

    // Compact Copy Conditioned Prompt Button
    const copyBtn = document.getElementById('nad-copy-prompt-btn');
    const copyLabel = document.getElementById('nad-copy-prompt-label');
    if (copyBtn) {
      copyBtn.onclick = () => {
        const promptText = buildConditionedPromptString();
        navigator.clipboard.writeText(promptText).then(() => {
          if (copyLabel) copyLabel.innerText = "Copied!";
          copyBtn.style.borderColor = '#10b981';
          copyBtn.style.background = 'rgba(16, 185, 129, 0.2)';
          setTimeout(() => {
            if (copyLabel) copyLabel.innerText = "Copy Prompt";
            copyBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            copyBtn.style.background = 'rgba(255, 255, 255, 0.08)';
          }, 2000);
        }).catch(err => {
          console.error("[Nād] Failed to copy prompt to clipboard:", err);
          alert(promptText);
        });
      };
    }

    // Direct Action Trigger: Generate AI Track in Nād
    const genBtn = document.getElementById('nad-generate-btn');
    const genLabel = document.getElementById('nad-generate-btn-label');
    const genStatusPill = document.getElementById('nad-gen-status-pill');

    if (genBtn) {
      genBtn.onclick = async () => {
        const modelObj = GEN_MODELS[selectedGenModel] || { label: selectedGenModel };
        const trackName = `AI - ${currentRaga.name} (${modelObj.label})`;
        const promptText = buildConditionedPromptString();
        
        // Disable button and show active initiating state
        genBtn.disabled = true;
        if (genLabel) genLabel.innerText = "Preparing Engine & Registering Track...";
        genBtn.style.background = 'linear-gradient(90deg, #1e3a8a 0%, #3b82f6 100%)';
        genBtn.style.borderColor = '#60a5fa';
        if (genStatusPill) {
          genStatusPill.innerHTML = `<span style="width: 7px; height: 7px; border-radius: 50%; background: #60a5fa; display: inline-block;"></span> Initializing...`;
          genStatusPill.style.background = 'rgba(59, 130, 246, 0.2)';
          genStatusPill.style.borderColor = '#3b82f6';
          genStatusPill.style.color = '#bfdbfe';
        }

        const nativeModelId = "ace-step-v15-xl-turbo";
        const nativeWorkflow = "text-to-music";

        const midiNote = Math.round(69 + 12 * Math.log2(currentSaHz / 440.0));
        const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        const pitchName = `${noteNames[midiNote % 12]}${Math.floor(midiNote / 12) - 1}`;
        const cleanWesternMode = (currentRaga.western || "Major").split('(')[0].trim();
        const keyscaleStr = `${pitchName} ${cleanWesternMode}`;

        const tempoBpmMap = {
          "very slow meditative tempo": 52,
          "slow tempo": 62,
          "medium tempo": 88,
          "upbeat lively tempo": 118,
          "fast tempo": 138,
          "driving tempo": 126,
          "floating fluid tempo": 74,
          "angular tempo": 104,
          "slow suspenseful tempo": 58
        };
        const resolvedBpm = tempoBpmMap[currentRasa.tempoTag] || 88;

        const allSelected = Array.from(selectedInstruments);
        const melodicInsts = allSelected.filter(INSTRUMENT_ROLE_HELPERS.isMelodic);
        const droneInsts = allSelected.filter(INSTRUMENT_ROLE_HELPERS.isDrone);
        const rhythmInsts = allSelected.filter(INSTRUMENT_ROLE_HELPERS.isRhythm);
        const leadInst = melodicInsts[0] || allSelected[0] || "Sitar";
        const secondaryInsts = melodicInsts.slice(1).concat(droneInsts).concat(rhythmInsts);

        const genParams = {
          prompt: promptText,
          lead_instrument: leadInst,
          secondary_instruments: secondaryInsts,
          duration: selectedDuration,
          model: selectedGenModel,
          model_id: selectedGenModel,
          quantization: selectedQuantization,
          lora: selectedLoRAName,
          lora_strength: selectedLoRAStrength,
          raga: currentRaga.name,
          raga_profile: currentRaga.profile,
          western_mode: cleanWesternMode,
          rasa: currentRasa.name,
          rasa_archetype: currentRasa.archetype,
          rasa_tempo: currentRasa.tempoTag,
          sa_hz: currentSaHz,
          sa_pitch: pitchName,
          keyscale: keyscaleStr,
          bpm: resolvedBpm,
          timesignature: currentTala?.time_signature || "4/4",
          mastering_preset: selectedMasteringPreset,
          drone_level: selectedDroneLevel / 100.0,
          tuning: "22_shrutis",
          upscale: enableSuperResolutionUpscale,
          target_sr: enableSuperResolutionUpscale ? 96000 : 48000,
          bit_depth: 32,
          subsonic_cut: enableSubsonicClearance,
          subsonic_cut_hz: 35.0,
          mid_clarity: enableMidClaritySculpt,
          steps: selectedGenModel === "stable_audio3" ? 8 : (selectedGenModel === "ace_step_xl_turbo" ? 8 : 12)
        };

        // 1. Copy prompt to clipboard for inspection/reference
        try {
          await navigator.clipboard.writeText(promptText);
        } catch (_) {}

        // 2. Add Track to Nād Studio Timeline with C++ Backend Await
        const store = window.__OPENSTUDIO_STORE__;
        const sState = store ? store.getState() : null;
        const transportTime = sState?.transport?.currentTime || 0;
        const trackId = crypto.randomUUID();

        try {
          // Await C++ backend addTrack BEFORE startAIGeneration to prevent "Track not found" race condition!
          if (window.__JUCE__?.backend?.addTrack) {
            await window.__JUCE__.backend.addTrack(trackId, "audio");
            console.log(`[Nād] Registered C++ track in AudioEngine: ${trackId}`);
          }

          if (sState?.addTrack) {
            sState.addTrack({
              id: trackId,
              name: trackName,
              type: "ai",
              inputType: "stereo",
              inputChannelCount: 2,
              armed: false,
              monitorEnabled: false,
              aiMusicModelId: nativeModelId,
              aiWorkflow: nativeWorkflow,
              aiWorkflowParams: genParams,
              aiGenerationState: "loading",
              aiGenerationProgress: 0.05,
              icon: "ai"
            }, { backendAlreadyCreated: true });
            if (sState.selectTrack) {
              sState.selectTrack(trackId);
            }
          }
        } catch (trackErr) {
          console.error("[Nād] Track creation error:", trackErr);
        }

        // 3. Trigger native generation
        let generationStarted = false;
        try {
          if (window.__JUCE__?.backend?.startAIGeneration) {
            const res = await window.__JUCE__.backend.startAIGeneration(
              trackId,
              nativeModelId,
              nativeWorkflow,
              JSON.stringify(genParams)
            );
            generationStarted = res !== false && (typeof res !== 'object' || res.started !== false);
            console.log("[Nād] startAIGeneration response:", res);
          } else if (typeof window.__OPENSTUDIO_START_AI_GENERATION__ === 'function') {
            await window.__OPENSTUDIO_START_AI_GENERATION__(trackId);
            generationStarted = true;
          }
        } catch (startErr) {
          console.error("[Nād] Failed to launch generation:", startErr);
        }

        if (!generationStarted) {
          if (genLabel) genLabel.innerText = "Generation Start Failed";
          genBtn.style.background = '#991b1b';
          genBtn.disabled = false;
          if (genStatusPill) {
            genStatusPill.innerHTML = `⚠️ Failed to start worker`;
            genStatusPill.style.background = 'rgba(239, 68, 68, 0.2)';
            genStatusPill.style.color = '#fca5a5';
          }
          return;
        }

        // 4. Autonomous Polling Loop & Timeline Audio Clip Placement
        let pollCount = 0;
        const pollInterval = setInterval(async () => {
          pollCount++;
          try {
            if (!window.__JUCE__?.backend?.getAIGenerationProgress) return;
            const progress = await window.__JUCE__.backend.getAIGenerationProgress();
            if (!progress) return;

            const pct = Math.round((progress.progress || 0) * 100);
            const phaseMsg = progress.message || progress.phase || "Generating audio on Apple Silicon...";

            if (genLabel) genLabel.innerText = `Synthesizing (${pct}%): ${phaseMsg}`;
            if (genStatusPill) {
              genStatusPill.innerHTML = `<span style="width: 7px; height: 7px; border-radius: 50%; background: #38bdf8; display: inline-block;"></span> ${pct}% — ${phaseMsg}`;
              genStatusPill.style.background = 'rgba(56, 189, 248, 0.2)';
              genStatusPill.style.borderColor = '#38bdf8';
              genStatusPill.style.color = '#bae6fd';
            }

            // Sync timeline track header progress bar
            if (store?.getState()?.setAITrackGenerationState) {
              store.getState().setAITrackGenerationState(trackId, progress.state === 'loading' ? 'loading' : 'generating', progress);
            }

            if (progress.state === 'done') {
              clearInterval(pollInterval);
              console.log("[Nād] Generation succeeded! Output file:", progress.outputFile);

              if (genLabel) genLabel.innerText = "✓ 96kHz Clip Placed on Timeline!";
              genBtn.style.background = 'linear-gradient(90deg, #059669 0%, #10b981 100%)';
              genBtn.style.borderColor = '#34d399';

              if (genStatusPill) {
                genStatusPill.innerHTML = `<span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span> 96kHz Master Ready on Timeline`;
                genStatusPill.style.background = 'rgba(16, 185, 129, 0.2)';
                genStatusPill.style.borderColor = '#10b981';
                genStatusPill.style.color = '#a7f3d0';
              }

              // Import clip directly onto the timeline track
              if (progress.outputFile && store?.getState()) {
                const currentStore = store.getState();
                if (currentStore.addGeneratedAudioClip) {
                  try {
                    await currentStore.addGeneratedAudioClip(
                      trackId,
                      progress.outputFile,
                      transportTime,
                      `${currentRaga.name} (${modelObj.label})`
                    );
                  } catch (clipErr) {
                    console.warn("[Nād] addGeneratedAudioClip note:", clipErr);
                    if (currentStore.importExternalMediaAtTimeline) {
                      await currentStore.importExternalMediaAtTimeline({
                        trackId,
                        filePath: progress.outputFile,
                        startTime: transportTime
                      });
                    }
                  }
                } else if (currentStore.importExternalMediaAtTimeline) {
                  await currentStore.importExternalMediaAtTimeline({
                    trackId,
                    filePath: progress.outputFile,
                    startTime: transportTime
                  });
                }

                if (currentStore.setAITrackGenerationState) {
                  currentStore.setAITrackGenerationState(trackId, 'idle', { state: 'idle', progress: 0 });
                }

                if (currentStore.showToast) {
                  currentStore.showToast(`✨ Nād generated clip ready: "${trackName}"`, "success");
                }
              }

              setTimeout(() => {
                toggleModal();
                showTimelineToast(
                  `✨ Nād Track Generated: "${trackName}"`,
                  `${enableSuperResolutionUpscale ? '96kHz/32-bit Float • ' : ''}${selectedDuration}s • ${currentRaga.name} (${currentRasa.name})`
                );
                genBtn.disabled = false;
                if (genLabel) genLabel.innerText = "Generate AI Track in Nād ⚡";
              }, 600);

            } else if (progress.state === 'error') {
              clearInterval(pollInterval);
              const errMsg = progress.error || progress.message || "Generation halted unexpectedly";
              console.error("[Nād] Generation failed:", errMsg);

              if (genLabel) genLabel.innerText = "Generation Failed";
              genBtn.style.background = '#991b1b';
              genBtn.style.borderColor = '#ef4444';
              genBtn.disabled = false;

              if (genStatusPill) {
                genStatusPill.innerHTML = `⚠️ ${errMsg}`;
                genStatusPill.style.background = 'rgba(239, 68, 68, 0.2)';
                genStatusPill.style.borderColor = '#ef4444';
                genStatusPill.style.color = '#fca5a5';
              }

              if (store?.getState()?.setAITrackGenerationState) {
                store.getState().setAITrackGenerationState(trackId, 'error', progress);
              }
              if (store?.getState()?.showToast) {
                store.getState().showToast(`Nād Generation error: ${errMsg}`, "error");
              }
            }
          } catch (pollErr) {
            console.error("[Nād] Poll loop error:", pollErr);
          }
        }, 300);
      };
    }

    // Reference Audio Wire-up
    const refFileInput = document.getElementById('nad-ref-file-input');
    const refBrowseBtn = document.getElementById('nad-ref-browse-btn');
    const refClearBtn = document.getElementById('nad-ref-clear-btn');
    const refDropZone = document.getElementById('nad-ref-drop-zone');
    const refControlsPanel = document.getElementById('nad-ref-controls-panel');
    const refStartInput = document.getElementById('nad-ref-start-input');
    const refEndInput = document.getElementById('nad-ref-end-input');
    const refFullRangeBtn = document.getElementById('nad-ref-full-range-btn');
    const refInfluenceSlider = document.getElementById('nad-ref-influence-slider');
    const refInfluenceDisplay = document.getElementById('nad-ref-influence-display');
    const refInfluenceDesc = document.getElementById('nad-ref-influence-desc');
    const refPlayBtn = document.getElementById('nad-ref-play-btn');

    function updateRefInfluenceUI() {
      if (!refInfluenceSlider || !refInfluenceDisplay || !refInfluenceDesc) return;
      referenceInfluence = parseInt(refInfluenceSlider.value, 10);
      refInfluenceDisplay.innerText = `${referenceInfluence}%`;
      if (referenceInfluence <= 35) {
        refInfluenceDesc.innerText = 'Loose Vibe (30%): Absorbs tempo & mood, composes fresh original melodies in chosen Raga.';
      } else if (referenceInfluence <= 65) {
        refInfluenceDesc.innerText = 'Balanced Re-imagination (50%): Follows contour & rhythm, re-voiced through Indian instruments.';
      } else {
        refInfluenceDesc.innerText = 'Close Acoustic Reflection (75%): Tightly mirrors phrasing, accents, and dynamics.';
      }
    }

    if (refInfluenceSlider) {
      refInfluenceSlider.oninput = updateRefInfluenceUI;
    }

    function stopRefPlayback() {
      if (refAudioElement) {
        refAudioElement.pause();
        refAudioElement.currentTime = 0;
      }
      isRefPlaying = false;
      const playBtn = document.getElementById('nad-ref-play-btn');
      if (playBtn) {
        playBtn.innerText = '▶️ Audition Clip';
        playBtn.style.background = '#059669';
      }
    }

    function toggleRefPlayback() {
      if (!referenceAudioUrl) return;
      if (isRefPlaying) {
        stopRefPlayback();
        return;
      }
      if (!refAudioElement) {
        refAudioElement = new Audio(referenceAudioUrl);
      } else {
        refAudioElement.src = referenceAudioUrl;
      }

      refAudioElement.currentTime = referenceStartTime;
      refAudioElement.play().then(() => {
        isRefPlaying = true;
        const playBtn = document.getElementById('nad-ref-play-btn');
        if (playBtn) {
          playBtn.innerText = '⏹️ Stop';
          playBtn.style.background = '#dc2626';
        }
      }).catch(err => console.error("Error playing ref audio:", err));

      refAudioElement.ontimeupdate = () => {
        if (refAudioElement && refAudioElement.currentTime >= referenceEndTime) {
          stopRefPlayback();
        }
      };
      refAudioElement.onended = () => {
        stopRefPlayback();
      };
    }

    function handleRefAudioLoaded(file) {
      if (!file) return;
      referenceAudioFile = file;
      referenceAudioName = file.name;
      if (referenceAudioUrl) {
        try { URL.revokeObjectURL(referenceAudioUrl); } catch (_) {}
      }
      referenceAudioUrl = URL.createObjectURL(file);

      // Measure duration with temporary Audio element
      const tempAudio = new Audio(referenceAudioUrl);
      tempAudio.onloadedmetadata = () => {
        referenceAudioDuration = tempAudio.duration || 30.0;
        referenceStartTime = 0;
        referenceEndTime = referenceAudioDuration;

        // Re-render modal panel so drop zone and inputs update cleanly
        const existing = document.getElementById('nad-musicology-modal');
        if (existing) {
          existing.remove();
          renderModal();
        }
      };
    }

    if (refBrowseBtn && refFileInput) {
      refBrowseBtn.onclick = () => refFileInput.click();
      refFileInput.onchange = (e) => {
        if (e.target.files && e.target.files[0]) {
          handleRefAudioLoaded(e.target.files[0]);
        }
      };
    }

    if (refDropZone) {
      refDropZone.onclick = (e) => {
        if (e.target.id === 'nad-ref-play-btn') return;
        if (!referenceAudioFile && refFileInput) {
          refFileInput.click();
        }
      };
      refDropZone.ondragover = (e) => {
        e.preventDefault();
        refDropZone.style.borderColor = '#fbbf24';
        refDropZone.style.background = '#27272a';
      };
      refDropZone.ondragleave = (e) => {
        e.preventDefault();
        refDropZone.style.borderColor = referenceAudioFile ? '#10b981' : '#3f3f46';
        refDropZone.style.background = '#18181b';
      };
      refDropZone.ondrop = (e) => {
        e.preventDefault();
        refDropZone.style.borderColor = '#10b981';
        refDropZone.style.background = '#18181b';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleRefAudioLoaded(e.dataTransfer.files[0]);
        }
      };
    }

    if (refPlayBtn) {
      refPlayBtn.onclick = (e) => {
        e.stopPropagation();
        toggleRefPlayback();
      };
    }

    if (refClearBtn) {
      refClearBtn.onclick = () => {
        stopRefPlayback();
        if (referenceAudioUrl) {
          try { URL.revokeObjectURL(referenceAudioUrl); } catch (_) {}
        }
        referenceAudioFile = null;
        referenceAudioUrl = null;
        referenceAudioName = '';
        referenceAudioDuration = 0;
        referenceStartTime = 0;
        referenceEndTime = 0;
        const existing = document.getElementById('nad-musicology-modal');
        if (existing) {
          existing.remove();
          renderModal();
        }
      };
    }

    if (refStartInput) {
      refStartInput.onchange = (e) => {
        referenceStartTime = Math.max(0, parseFloat(e.target.value) || 0);
      };
    }
    if (refEndInput) {
      refEndInput.onchange = (e) => {
        referenceEndTime = Math.min(referenceAudioDuration, parseFloat(e.target.value) || referenceAudioDuration);
      };
    }
    if (refFullRangeBtn) {
      refFullRangeBtn.onclick = () => {
        referenceStartTime = 0;
        referenceEndTime = referenceAudioDuration;
        if (refStartInput) refStartInput.value = '0.0';
        if (refEndInput) refEndInput.value = referenceAudioDuration.toFixed(1);
      };
    }

    renderShrutis();
  }

  function renderShrutis() {
    const container = document.getElementById('nad-shrutis-container');
    if (!container) return;
    container.innerHTML = '';

    SHRUTIS_DATA.forEach(shruti => {
      const freq = currentSaHz * (shruti.ratio[0] / shruti.ratio[1]);
      const isActive = currentRaga.activeShrutis.includes(shruti.index);

      const cell = document.createElement('div');
      cell.style.padding = '8px 4px';
      cell.style.borderRadius = '6px';
      cell.style.textAlign = 'center';
      cell.style.cursor = 'pointer';
      cell.style.border = `1px solid ${isActive ? '#f59e0b' : '#27272a'}`;
      cell.style.background = isActive ? 'rgba(245, 158, 11, 0.2)' : '#18181b';
      cell.style.color = isActive ? '#fef3c7' : '#71717a';
      cell.style.transition = 'all 0.15s ease';

      cell.title = `${shruti.name} (${shruti.swara}) - ${shruti.ratio[0]}/${shruti.ratio[1]} - ${shruti.cents} cents - ${freq.toFixed(1)} Hz`;

      cell.innerHTML = `
        <div style="font-size: 11px; font-weight: 700; color: ${isActive ? '#fbbf24' : '#a1a1aa'}">${shruti.swara.split(' ')[0]}</div>
        <div style="font-size: 9px; opacity: 0.8; margin-top: 2px;">${freq.toFixed(0)}Hz</div>
        <div style="font-size: 8px; opacity: 0.6;">${shruti.cents.toFixed(0)}c</div>
      `;

      cell.onmouseover = () => {
        cell.style.transform = 'translateY(-2px)';
        cell.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
      };
      cell.onmouseout = () => {
        cell.style.transform = 'none';
        cell.style.boxShadow = 'none';
      };

      cell.onclick = () => {
        playTone(freq, 0.6);
      };

      container.appendChild(cell);
    });
  }

  function buildConditionedPromptString() {
    const customPrompt = (document.getElementById('nad-custom-prompt-box')?.value || customPromptText || '').trim();
    const lyrics = (document.getElementById('nad-lyrics-box')?.value || lyricsText || '').trim();

    // 1. Determine Lead Instrument, Drone, and Rhythm
    const allSelected = Array.from(selectedInstruments);
    const melodicInsts = allSelected.filter(INSTRUMENT_ROLE_HELPERS.isMelodic);
    const droneInsts = allSelected.filter(INSTRUMENT_ROLE_HELPERS.isDrone);
    const rhythmInsts = allSelected.filter(INSTRUMENT_ROLE_HELPERS.isRhythm);

    let leadInst = melodicInsts[0] || allSelected[0] || "Sitar";
    let leadDescriptor = INSTRUMENT_ACOUSTIC_DESCRIPTORS[leadInst] || `Virtuosic solo ${leadInst}`;

    // Calculate Western pitch of Sa (e.g. 240Hz -> C#4)
    const midiNote = Math.round(69 + 12 * Math.log2(currentSaHz / 440.0));
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const pitchName = `${noteNames[midiNote % 12]}${Math.floor(midiNote / 12) - 1}`;

    // Token 0 is always the physical acoustic timbre of the primary lead instrument anchored to Western mode:
    let prompt = `${leadDescriptor} in ${pitchName} ${currentRaga.western}.`;

    // 2. Navarasa Emotional Archetype & Raga Character in prime attention window
    prompt += ` ${currentRasa.name} archetype (${currentRasa.english}): ${currentRasa.archetype}, tempo: ${currentRasa.tempoTag}. ${currentRaga.name} character: ${currentRaga.profile || currentRaga.western}.`;

    // If multiple melodic instruments selected (ensemble mode):
    if (melodicInsts.length > 1) {
      const secondaryMelodic = melodicInsts.slice(1).join(', ');
      prompt += ` Jugalbandi duet interaction and melodic dialogue with ${secondaryMelodic}.`;
    }

    // 3. Drone & Rhythm accompaniment
    const accompParts = [];
    if (droneInsts.length > 0) {
      accompParts.push(`resonant ${droneInsts.join(' and ')} drone`);
    }
    if (rhythmInsts.length > 0) {
      accompParts.push(`acoustic ${rhythmInsts.join(' and ')} rhythm accompaniment`);
    }
    if (accompParts.length > 0) {
      prompt += ` Accompanied by ${accompParts.join(' and ')}.`;
    }

    // 4. Vocal / Instrumental Conditioning
    if (currentVocalMode === "instrumental") {
      prompt += ` Strictly pure acoustic instrumental rendition, no vocals, no singing, no choir, no human voice, no speech.`;
    } else {
      const texList = Array.from(selectedVocalTextures).join(', ');
      const modList = Array.from(selectedModulations).join(', ');

      if (currentVocalMode === "wordless_aalap") {
        prompt += ` Wordless vocalise, emotional unmetered aalap`;
        if (texList) prompt += ` with ${texList}`;
        if (modList) prompt += ` and expressive ${modList}`;
        if (!lyrics) prompt += `, strictly non-lexical, no lyrics`;
        prompt += `.`;
      } else if (currentVocalMode === "tarana_sargam") {
        prompt += ` Rhythmic Tarana and Sargam vocalise with rapid syllables (Ta-Re-Na, Dir-Dir, Dheem) and solfège runs (Sa-Re-Ga-Ma)`;
        if (modList) prompt += ` with ${modList}`;
        prompt += `.`;
      } else if (currentVocalMode === "vocal_lead") {
        prompt += ` Expressive lead vocal performance`;
        if (texList) prompt += ` featuring ${texList}`;
        if (modList) prompt += ` with ${modList}`;
        prompt += `.`;
      }

      if (lyrics) {
        prompt += ` Lyrics: "${lyrics}"`;
      }
    }

    if (customPrompt) {
      prompt += ` ${customPrompt}.`;
    }

    // 5. Reference Audio Guidance ("Along These Lines")
    if (referenceAudioFile) {
      const influenceDesc = referenceInfluence <= 35 ? "Loose Vibe" : (referenceInfluence <= 65 ? "Balanced Re-imagination" : "Close Acoustic Reflection");
      prompt += ` [Reference Music Guidance: Re-imagine and compose acoustic piece along the lines of reference track "${referenceAudioName}" (Section: ${referenceStartTime.toFixed(1)}s-${referenceEndTime.toFixed(1)}s, Inspiration Match: ${referenceInfluence}% - ${influenceDesc}), translating melodic motif into ${currentRaga.name} and selected instrumentation].`;
    }

    prompt += ` Pristine acoustic studio recording, intimate hall resonance, 96kHz master clarity.`;

    // 6. Classical Musicology Metadata at the END
    prompt += ` [${currentRaga.name} | Mode: ${currentRaga.western} | Tonic Sa: ${pitchName} (${currentSaHz.toFixed(1)}Hz, 22 Shrutis Just Intonation) | Vadi: ${currentRaga.vadi}, Samvadi: ${currentRaga.samvadi} | Mastering: ${MASTERING_PRESETS[selectedMasteringPreset]?.label || selectedMasteringPreset} | Tanpura Bedding: ${selectedDroneLevel}%]`;

    return prompt;
  }

  // --- 4. Initialization ---

  function setup() {
    injectMusicologyTrigger();
    // Keep trigger visible even after dynamic UI re-renders
    const observer = new MutationObserver(() => {
      injectMusicologyTrigger();
    });
    observer.observe(document.body, { childList: true, subtree: false });
    console.log("[Nād Musicology Extension] Initialized successfully in OpenStudio.");
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
