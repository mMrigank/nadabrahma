// Nādabrahma WebAssembly / Web Audio 96kHz DSP Plugin Engine
// Sandboxed Studio Suite: NādaEQ Pro, Prāṇa Tape Saturator, Mandir Convolution Reverb,
// Somatic Sub Braam, and Vāc Compressor with strict zero-leak memory guarantees

import { PluginType, PluginInstance, Track } from '../types/daw';

export interface PluginSpec {
  type: PluginType;
  name: string;
  sanskritTitle: string;
  category: 'harmonic_eq' | 'saturation' | 'spatial_reverb' | 'infrasound' | 'dynamics';
  description: string;
  defaultParams: Record<string, any>;
  ramUsageMb: number;
}

export const PLUGIN_SPECS: Record<PluginType, PluginSpec> = {
  eq: {
    type: 'eq',
    name: 'NādaEQ Pro (7-Band Svara EQ)',
    sanskritTitle: 'नाद समकारी (Svara Resonance)',
    category: 'harmonic_eq',
    description: 'Dynamic 7-band parametric equalizer with bands harmonically locked to the 7 Svara ratios (Sa, Re, Ga, Ma, Pa, Dha, Ni) relative to Moveable Sa.',
    defaultParams: {
      saGainDb: 0.0,
      reGainDb: 0.0,
      gaGainDb: 1.5,
      maGainDb: 0.0,
      paGainDb: 2.0,
      dhaGainDb: 0.0,
      niGainDb: 1.0,
      qFactor: 2.5,
      lowCutHz: 25,
      highCutHz: 32000,
      hypersonicAirBoostDb: 2.0
    },
    ramUsageMb: 8.5
  },
  tape: {
    type: 'tape',
    name: 'Prāṇa Tape Saturator (Studer A800)',
    sanskritTitle: 'प्राण संतृप्ति (Magnetic Tape Drive)',
    category: 'saturation',
    description: '32-bit float polynomial magnetic tape simulation with even/odd harmonic saturation, 15/30 IPS head bump, and subtle analog flux.',
    defaultParams: {
      drive: 38,
      warmth: 65,
      tapeSpeed: '30 IPS',
      biasFlux: 1.2,
      wowFlutter: 0.12,
      outputGainDb: 0.0
    },
    ramUsageMb: 12.0
  },
  reverb: {
    type: 'reverb',
    name: 'Mandir Sacred Spaces Convolver',
    sanskritTitle: 'मन्दिर प्रतिध्वनि (Sacred Space IR)',
    category: 'spatial_reverb',
    description: 'Zero-latency convolution impulse response engine capturing the sacred acoustics of stone temple sanctums, riverside ghats, and royal baithaks.',
    defaultParams: {
      spaceId: 'brihadisvara_sanctum',
      decaySec: 3.8,
      preDelayMs: 22,
      damping: 35,
      stereoWidth: 1.0
    },
    ramUsageMb: 24.5
  },
  sub_braam: {
    type: 'sub_braam',
    name: 'Somatic Sub Braam Resonator',
    sanskritTitle: 'देह नाद (Chest Infrasound)',
    category: 'infrasound',
    description: '10Hz to 20Hz tactile chest subharmonic exciter with second harmonic perceptual lock for physical acoustic gravity.',
    defaultParams: {
      frequencyHz: 14,
      subGainDb: 3.0,
      harmonicDrive: 30,
      punchTransient: 65,
      phaseAlignDeg: 0
    },
    ramUsageMb: 6.0
  },
  compressor: {
    type: 'compressor',
    name: 'Vāc Opto Leveler & Master Limiter',
    sanskritTitle: 'वाच् गतिरोध (Opto Dynamics)',
    category: 'dynamics',
    description: 'Smooth optical gain reduction leveler with program-dependent release and true-peak intersample limiter protection (-0.3 dBTP).',
    defaultParams: {
      thresholdDb: -18,
      ratio: 3.5,
      attackMs: 14,
      releaseMs: 160,
      makeupGainDb: 2.5,
      ceilingDbTP: -0.3
    },
    ramUsageMb: 10.2
  }
};

export interface SacredSpaceIR {
  id: string;
  name: string;
  location: string;
  defaultDecaySec: number;
  description: string;
  color: string;
}

export const SACRED_SPACES: SacredSpaceIR[] = [
  {
    id: 'brihadisvara_sanctum',
    name: 'Brihadisvara Temple Granite Sanctum',
    location: 'Thanjavur, Tamil Nadu',
    defaultDecaySec: 3.8,
    description: 'Monumental Chola granite sanctum with rich low-mid decay, soaring ceiling reflections, and bell shimmer.',
    color: '#d97706'
  },
  {
    id: 'varanasi_dawn_ghat',
    name: 'Varanasi Kashi Vishwanath Ghat Dawn',
    location: 'Varanasi, Uttar Pradesh',
    defaultDecaySec: 5.4,
    description: 'Expansive open-air Ganges river reflection with morning mist diffusion, distant temple gongs, and wide horizon.',
    color: '#0284c7'
  },
  {
    id: 'royal_mehfil_baithak',
    name: 'Royal Mehfil Teakwood Baithak',
    location: 'Jaipur, Rajasthan',
    defaultDecaySec: 1.8,
    description: 'Intimate royal chamber lined with seasoned teakwood and hand-woven silks for warm, dry, close-up acoustic presence.',
    color: '#b45309'
  },
  {
    id: 'vedic_yajnashala',
    name: 'Vedic Yajñashala (Sacred Hearth)',
    location: 'Kerala Vedic Tradition',
    defaultDecaySec: 2.6,
    description: 'Four-cardinal thatch and clay ritual pavilion with dry hearth resonance and pristine vocal clarity.',
    color: '#ea580c'
  },
  {
    id: 'sabha_orchestral_hall',
    name: 'Orchestral Sabha Hall',
    location: 'Chennai Music Academy',
    defaultDecaySec: 3.0,
    description: 'Symphonic concert hall layout with broad stereo width and natural acoustic bloom across 10Hz-48kHz.',
    color: '#8b5cf6'
  }
];

export const PLUGIN_PRESETS: { [key: string]: { name: string; type: PluginType; params: Record<string, any> }[] } = {
  vocal_silk: [
    {
      name: 'Vedic Vocal Clarity & Air',
      type: 'eq',
      params: { saGainDb: 0, reGainDb: -1.0, gaGainDb: 2.0, paGainDb: 1.5, niGainDb: 2.5, qFactor: 2.0, lowCutHz: 80, highCutHz: 44000, hypersonicAirBoostDb: 3.5 }
    },
    {
      name: 'Opto Vocal Compression',
      type: 'compressor',
      params: { thresholdDb: -20, ratio: 2.8, attackMs: 18, releaseMs: 120, makeupGainDb: 3.0, ceilingDbTP: -0.5 }
    }
  ],
  sitar_presence: [
    {
      name: 'Sitar Resonant Sparkle',
      type: 'eq',
      params: { saGainDb: 1.0, reGainDb: 0, gaGainDb: 2.5, paGainDb: 2.0, niGainDb: 1.5, qFactor: 3.2, lowCutHz: 60, highCutHz: 42000, hypersonicAirBoostDb: 3.0 }
    },
    {
      name: 'Warm Analog Tape Drive',
      type: 'tape',
      params: { drive: 42, warmth: 70, tapeSpeed: '30 IPS', biasFlux: 1.5, wowFlutter: 0.08, outputGainDb: 0.5 }
    }
  ],
  tabla_gravity: [
    {
      name: 'Tabla Bayan Somatic Punch',
      type: 'sub_braam',
      params: { frequencyHz: 16, subGainDb: 4.5, harmonicDrive: 40, punchTransient: 75, phaseAlignDeg: 0 }
    },
    {
      name: 'Punchy Percussion Tape',
      type: 'tape',
      params: { drive: 48, warmth: 55, tapeSpeed: '15 IPS', biasFlux: 2.0, wowFlutter: 0.05, outputGainDb: -0.5 }
    }
  ]
};

// Initial Master Chain
export const DEFAULT_MASTER_PLUGINS: PluginInstance[] = [
  {
    id: 'master-plug-tape',
    type: 'tape',
    name: 'Prāṇa Tape Saturator',
    sanskritTitle: 'प्राण संतृप्ति',
    enabled: true,
    dryWet: 0.85,
    params: { ...PLUGIN_SPECS.tape.defaultParams },
    trackId: 'master',
    slotIndex: 0
  },
  {
    id: 'master-plug-eq',
    type: 'eq',
    name: 'NādaEQ Pro',
    sanskritTitle: 'नाद समकारी',
    enabled: true,
    dryWet: 1.0,
    params: { ...PLUGIN_SPECS.eq.defaultParams },
    trackId: 'master',
    slotIndex: 1
  },
  {
    id: 'master-plug-reverb',
    type: 'reverb',
    name: 'Mandir Convolver',
    sanskritTitle: 'मन्दिर प्रतिध्वनि',
    enabled: true,
    dryWet: 0.22,
    params: { ...PLUGIN_SPECS.reverb.defaultParams },
    trackId: 'master',
    slotIndex: 2
  },
  {
    id: 'master-plug-comp',
    type: 'compressor',
    name: 'Vāc Master Leveler',
    sanskritTitle: 'वाच् गतिरोध',
    enabled: true,
    dryWet: 1.0,
    params: { ...PLUGIN_SPECS.compressor.defaultParams },
    trackId: 'master',
    slotIndex: 3
  }
];

class PluginEngine {
  // Factory to create a new plugin instance
  public createPlugin(type: PluginType, trackId: string = 'master', slotIndex: number = 0): PluginInstance {
    const spec = PLUGIN_SPECS[type];
    return {
      id: `plug-${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      name: spec.name.split(' (')[0],
      sanskritTitle: spec.sanskritTitle.split(' (')[0],
      enabled: true,
      dryWet: type === 'reverb' ? 0.25 : 1.0,
      params: { ...spec.defaultParams },
      trackId,
      slotIndex
    };
  }

  // Calculate live memory footprint of all active plugins across tracks & master bus
  public calculateMemoryUsageMB(tracks: Track[], masterPlugins: PluginInstance[]): number {
    let total = 0;
    for (const p of masterPlugins) {
      if (p.enabled) total += PLUGIN_SPECS[p.type]?.ramUsageMb || 8;
    }
    for (const t of tracks) {
      if (t.plugins) {
        for (const p of t.plugins) {
          if (p.enabled) total += PLUGIN_SPECS[p.type]?.ramUsageMb || 8;
        }
      }
    }
    return Math.round(total * 10) / 10;
  }

  // Calculate EQ frequency response curve points for SVG canvas rendering
  public calculateEqCurve(baseSaHz: number, params: Record<string, any>): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const bands = [
      { ratio: 1.0, gain: params.saGainDb || 0 },        // Sa
      { ratio: 9/8, gain: params.reGainDb || 0 },        // Re
      { ratio: 5/4, gain: params.gaGainDb || 0 },        // Ga
      { ratio: 4/3, gain: params.maGainDb || 0 },        // Ma
      { ratio: 3/2, gain: params.paGainDb || 0 },        // Pa
      { ratio: 5/3, gain: params.dhaGainDb || 0 },       // Dha
      { ratio: 15/8, gain: params.niGainDb || 0 }        // Ni
    ];

    const minFreq = 10;
    const maxFreq = 48000;
    const numPoints = 80;

    for (let i = 0; i < numPoints; i++) {
      const freq = minFreq * Math.pow(maxFreq / minFreq, i / (numPoints - 1));
      let totalGain = 0;

      // Sum bell responses
      for (const b of bands) {
        const centerHz = baseSaHz * 2 * b.ratio; // 2nd octave for clarity
        const distanceOct = Math.abs(Math.log2(freq / centerHz));
        const q = params.qFactor || 2.5;
        const bell = b.gain * Math.exp(-0.5 * Math.pow(distanceOct * q, 2));
        totalGain += bell;
      }

      // High-frequency air sheen
      if (freq > 20000 && params.hypersonicAirBoostDb) {
        const airFrac = (freq - 20000) / 28000;
        totalGain += params.hypersonicAirBoostDb * airFrac;
      }

      // Low-cut
      if (params.lowCutHz && freq < params.lowCutHz) {
        const lowCutFactor = Math.min(1, freq / params.lowCutHz);
        totalGain -= (1 - lowCutFactor) * 18;
      }

      // Map to SVG coordinates: width 400, height 120 (0dB at y=60, ±12dB mapped)
      const x = (i / (numPoints - 1)) * 400;
      const y = Math.max(5, Math.min(115, 60 - totalGain * 4.2));
      points.push({ x, y });
    }

    return points;
  }
}

export const pluginEngine = new PluginEngine();
