// Gamaka Musicology Engine & Microtonal Ornamentation Library
// Compliant with ancient Gandharva Veda, Sangeeta Ratnakara, and modern Indian Classical Performance Standards

export type GamakaType = 'none' | 'meend' | 'andolan' | 'kampita' | 'murki' | 'kan';

export interface GamakaConfig {
  type: GamakaType;
  name: string;
  sanskritName: string;
  shortLabel: string;
  description: string;
  targetSwaraKey?: string; // For Meend glide target
  targetSwaraName?: string;
  depthCents: number; // For Andolan / Kampita (5c to 80c)
  speedHz: number; // Oscillation rate (1.0Hz to 9.0Hz)
  curveTension: number; // 0.1 to 1.0 (exponential tension)
  startDelaySec?: number; // Delay before gamaka starts
  color: string;
}

export interface GamakaPreset {
  id: string;
  name: string;
  gamakaType: GamakaType;
  ragaAssociation: string;
  swaraTarget: string;
  description: string;
  config: GamakaConfig;
}

export const GAMAKA_DEFINITIONS: Record<GamakaType, {
  name: string;
  sanskritName: string;
  shortLabel: string;
  description: string;
  icon: string;
  defaultDepthCents: number;
  defaultSpeedHz: number;
  color: string;
}> = {
  none: {
    name: 'Sthira (Straight Tone)',
    sanskritName: 'स्थिर',
    shortLabel: 'Sthira',
    description: 'Pure, steady Just Intonation pitch without microtonal oscillation or slide.',
    icon: '─',
    defaultDepthCents: 0,
    defaultSpeedHz: 0,
    color: '#94a3b8'
  },
  meend: {
    name: 'Meend (Continuous Glide)',
    sanskritName: 'मींड',
    shortLabel: 'Meend',
    description: 'Smooth, unbroken non-linear microtonal glide / portamento between two distant swaras without audible steps.',
    icon: '〰️',
    defaultDepthCents: 0,
    defaultSpeedHz: 0,
    color: '#b08d57' // Warm Sandstone
  },
  andolan: {
    name: 'Andolan (Meditative Oscillation)',
    sanskritName: 'आंदोलन',
    shortLabel: 'Andolan',
    description: 'Slow, graceful swinging oscillation around a sensitive Shruti (e.g. Komal Ga in Darbari, Komal Re in Bhairav).',
    icon: '🌊',
    defaultDepthCents: 35,
    defaultSpeedHz: 2.2,
    color: '#5d7491' // Slate Blue
  },
  kampita: {
    name: 'Kampita (Tremolo Micro-Shakes)',
    sanskritName: 'कंपित',
    shortLabel: 'Kampita',
    description: 'Rapid, sharp microtonal shaking/tremolo creating spiritual intensity and emotional tension.',
    icon: '⚡',
    defaultDepthCents: 20,
    defaultSpeedHz: 5.5,
    color: '#a06352' // Terracotta
  },
  murki: {
    name: 'Murki / Khatka (Ornamental Cluster)',
    sanskritName: 'मुर्की / खटका',
    shortLabel: 'Murki',
    description: 'Rapid, crisp 3-note or 4-note grace flourish touching upper and lower neighboring Shrutis before landing.',
    icon: '✨',
    defaultDepthCents: 45,
    defaultSpeedHz: 7.0,
    color: '#528275' // Sage Celadon
  },
  kan: {
    name: 'Kan-Svara (Grace Touch Note)',
    sanskritName: 'कण-स्वर',
    shortLabel: 'Kan',
    description: 'Subtle instantaneous ghost touch of an upper or lower Swara right at note attack before settling into tonic.',
    icon: '🪶',
    defaultDepthCents: 100,
    defaultSpeedHz: 0,
    color: '#8f6277' // Dusty Mauve
  }
};

export const MASTER_GAMAKA_PRESETS: GamakaPreset[] = [
  {
    id: 'darbari_ga_andolan',
    name: 'Darbari Komal Ga Andolan',
    gamakaType: 'andolan',
    ragaAssociation: 'Raga Darbari Kanhada',
    swaraTarget: 'g2 (Komal Ga)',
    description: 'The soul of Darbari: slow, hypnotic 2.2 Hz oscillation swinging between Ati-Komal Ga and Shuddha Re.',
    config: {
      type: 'andolan',
      name: 'Darbari Komal Ga Andolan',
      sanskritName: 'दरबारी कोमल ग आंदोलन',
      shortLabel: 'Andolan (2.2Hz)',
      description: 'Slow hypnotic swing (35 cents depth)',
      depthCents: 35,
      speedHz: 2.2,
      curveTension: 0.7,
      color: '#5d7491'
    }
  },
  {
    id: 'yaman_pa_ga_meend',
    name: 'Yaman Pa-to-Ga Meend Glide',
    gamakaType: 'meend',
    ragaAssociation: 'Raga Yaman',
    swaraTarget: 'G1 (Shuddha Ga)',
    description: 'Quintessential Yaman glide from Pancham (P) cascading through Tivra Ma down to Shuddha Ga.',
    config: {
      type: 'meend',
      name: 'Yaman Pa-to-Ga Meend',
      sanskritName: 'यमन प-ग मींड',
      shortLabel: 'Meend (P->G)',
      description: 'Cascading glide through Tivra Ma',
      targetSwaraKey: 'G1',
      targetSwaraName: 'G (Shuddha Ga)',
      depthCents: 0,
      speedHz: 0,
      curveTension: 0.65,
      color: '#b08d57'
    }
  },
  {
    id: 'bhairav_re_andolan',
    name: 'Bhairav Komal Re Andolan',
    gamakaType: 'andolan',
    ragaAssociation: 'Raga Bhairav',
    swaraTarget: 'r1 (Komal Re)',
    description: 'Deep sunrise solemnity: 2.4 Hz oscillation oscillating Komal Rishabh down toward Shadja.',
    config: {
      type: 'andolan',
      name: 'Bhairav Komal Re Andolan',
      sanskritName: 'भैरव कोमल रे आंदोलन',
      shortLabel: 'Andolan (2.4Hz)',
      description: 'Solemn dawn oscillation (28 cents)',
      depthCents: 28,
      speedHz: 2.4,
      curveTension: 0.8,
      color: '#5d7491'
    }
  },
  {
    id: 'bhoopali_dha_ga_meend',
    name: 'Bhoopali Dha-to-Ga Grand Meend',
    gamakaType: 'meend',
    ragaAssociation: 'Raga Bhoopali / Mohanam',
    swaraTarget: 'G1 (Shuddha Ga)',
    description: 'Grand sweeping slide omitting Ma to resolve into sweet meditative Gandhar.',
    config: {
      type: 'meend',
      name: 'Bhoopali Dha-to-Ga Meend',
      sanskritName: 'भूपाली ध-ग मींड',
      shortLabel: 'Meend (D->G)',
      description: 'Grand sweeping pentatonic slide',
      targetSwaraKey: 'G1',
      targetSwaraName: 'G (Shuddha Ga)',
      depthCents: 0,
      speedHz: 0,
      curveTension: 0.75,
      color: '#b08d57'
    }
  },
  {
    id: 'malkauns_murki',
    name: 'Malkauns Midnight Murki',
    gamakaType: 'murki',
    ragaAssociation: 'Raga Malkauns',
    swaraTarget: 'M1 (Shuddha Ma)',
    description: 'Fast 3-note embellishment (g-M-d-M) emphasizing the sovereign Madhyam in midnight stillness.',
    config: {
      type: 'murki',
      name: 'Malkauns Midnight Murki',
      sanskritName: 'मालकौंस मध्य मुर्की',
      shortLabel: 'Murki (g-M-d)',
      description: 'Crisp 3-note grace embellishment',
      depthCents: 45,
      speedHz: 7.2,
      curveTension: 0.5,
      color: '#528275'
    }
  },
  {
    id: 'marwa_tivra_ma_kan',
    name: 'Marwa Tivra Ma Kan Touch',
    gamakaType: 'kan',
    ragaAssociation: 'Raga Marwa',
    swaraTarget: "M3 (Tivra Ma')",
    description: 'Ghost-touch of sharp fourth creating intense twilight yearning before resolving to Dhaivat.',
    config: {
      type: 'kan',
      name: 'Marwa Tivra Ma Kan',
      sanskritName: 'मारवा तीव्र म कण',
      shortLabel: "Kan (M')",
      description: 'Instantaneous ghost-touch of sharp 4th',
      depthCents: 100,
      speedHz: 0,
      curveTension: 0.9,
      color: '#8f6277'
    }
  }
];

/**
 * Calculates normalized SVG path coordinates (x: 0 to 1, y: -1 to +1) for a Gamaka
 */
export function calculateGamakaSvgPath(
  gamaka: GamakaConfig,
  widthPx: number,
  heightPx: number,
  yOffsetPx: number = 0
): string {
  if (gamaka.type === 'none') {
    return `M 0 ${heightPx / 2} L ${widthPx} ${heightPx / 2}`;
  }

  if (gamaka.type === 'meend') {
    // Smooth bezier S-curve glide
    const startY = heightPx * 0.2;
    const endY = heightPx * 0.8;
    const cp1x = widthPx * 0.4;
    const cp1y = startY;
    const cp2x = widthPx * 0.6;
    const cp2y = endY;
    return `M 0 ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${widthPx} ${endY}`;
  }

  if (gamaka.type === 'andolan') {
    // Gentle sine wave oscillation
    const points: string[] = [];
    const numCycles = Math.max(1.5, Math.min(4, gamaka.speedHz * 0.8));
    const amp = Math.min(heightPx * 0.4, (gamaka.depthCents / 50) * (heightPx * 0.35));
    const midY = heightPx / 2;

    for (let i = 0; i <= 32; i++) {
      const x = (i / 32) * widthPx;
      const progress = i / 32;
      // Gentle sine modulation with natural breathing envelope
      const env = Math.sin(progress * Math.PI);
      const y = midY + amp * env * Math.sin(progress * Math.PI * 2 * numCycles);
      points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return points.join(' ');
  }

  if (gamaka.type === 'kampita') {
    // High-frequency trembling oscillation
    const points: string[] = [];
    const numCycles = Math.max(4, gamaka.speedHz * 1.2);
    const amp = Math.min(heightPx * 0.35, (gamaka.depthCents / 40) * (heightPx * 0.3));
    const midY = heightPx / 2;

    for (let i = 0; i <= 40; i++) {
      const x = (i / 40) * widthPx;
      const progress = i / 40;
      const y = midY + amp * Math.sin(progress * Math.PI * 2 * numCycles);
      points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return points.join(' ');
  }

  if (gamaka.type === 'murki') {
    // Sharp multi-step grace cluster (touches upper neighbor, tonic, lower, tonic)
    const midY = heightPx / 2;
    const upY = midY - heightPx * 0.35;
    const downY = midY + heightPx * 0.25;
    const w = widthPx;
    return `M 0 ${midY} L ${w * 0.15} ${upY} L ${w * 0.3} ${midY} L ${w * 0.45} ${downY} L ${w * 0.6} ${midY} L ${w} ${midY}`;
  }

  if (gamaka.type === 'kan') {
    // Quick initial spike that immediately resolves
    const midY = heightPx / 2;
    const spikeY = midY - heightPx * 0.4;
    return `M 0 ${spikeY} Q ${widthPx * 0.15} ${spikeY}, ${widthPx * 0.25} ${midY} L ${widthPx} ${midY}`;
  }

  return `M 0 ${heightPx / 2} L ${widthPx} ${heightPx / 2}`;
}
