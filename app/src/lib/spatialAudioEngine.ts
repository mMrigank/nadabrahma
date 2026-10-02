// 3D Spatial Audio Bus & Ambisonics Panner Engine ("The Owl 3D Core")
// High-Resolution 96 kHz / 32-bit Float Spatial Acoustics for Nādabrahma DAW

import { SpatialCoordinates } from '../types/daw';

export interface Cartesian3D {
  x: number; // Left (-) to Right (+)
  y: number; // Nadir (-) to Zenith (+) / Down to Up
  z: number; // Front (-) to Rear (+) / Forward to Backward
}

export interface AmbisonicsBFormat {
  w: number; // Omnidirectional pressure
  x: number; // Figure-8 front / back
  y: number; // Figure-8 left / right
  z: number; // Figure-8 up / down
}

export interface Atmos714Bed {
  L: number;   // Left front (-30°)
  R: number;   // Right front (+30°)
  C: number;   // Center (0°)
  LFE: number; // Low Frequency Effects / Sub (10-20Hz Somatic)
  Lss: number; // Left side surround (-90°)
  Rss: number; // Right side surround (+90°)
  Lsr: number; // Left rear surround (-135°)
  Rsr: number; // Right rear surround (+135°)
  Ltf: number; // Left top front (-45°, +45° elev)
  Rtf: number; // Right top front (+45°, +45° elev)
  Ltr: number; // Left top rear (-135°, +45° elev)
  Rtr: number; // Right top rear (+135°, +45° elev)
}

export interface SpatialStagingPreset {
  id: string;
  name: string;
  sanskritTitle: string;
  description: string;
  icon: string;
  roomDimensions: { width: number; depth: number; height: number }; // meters
  rt60ReverbSec: number;
  acousticDiffusion: number; // 0 to 1
  hypersonicReflectionBoost: number; // 1.0 to 2.0
  trackPlacements: { [trackIdOrRole: string]: Partial<SpatialCoordinates> };
}

/**
 * Converts Spherical Coordinates (Azimuth, Elevation, Distance) into Web Audio 3D Cartesian coordinates.
 * Convention:
 * - Azimuth: 0° = Center Front, +90° = Right, -90° = Left, 180°/-180° = Rear
 * - Elevation: 0° = Ear level, +90° = Zenith (overhead), -90° = Nadir (floor)
 * - Distance: radial radius in meters
 * 
 * Web Audio Cartesian:
 * x: +X is right, -X is left
 * y: +Y is up, -Y is down
 * z: -Z is front, +Z is back (listener faces negative Z)
 */
export function sphericalToCartesian(azimuthDeg: number, elevationDeg: number, distanceM: number): Cartesian3D {
  const azRad = (azimuthDeg * Math.PI) / 180;
  const elRad = (elevationDeg * Math.PI) / 180;
  const r = Math.max(0.1, distanceM);

  const x = r * Math.cos(elRad) * Math.sin(azRad);
  const y = r * Math.sin(elRad);
  const z = -r * Math.cos(elRad) * Math.cos(azRad);

  return {
    x: Math.round(x * 1000) / 1000,
    y: Math.round(y * 1000) / 1000,
    z: Math.round(z * 1000) / 1000
  };
}

/**
 * Converts Web Audio Cartesian coordinates back into Spherical coordinates.
 */
export function cartesianToSpherical(x: number, y: number, z: number): SpatialCoordinates {
  const r = Math.sqrt(x * x + y * y + z * z);
  const safeR = Math.max(0.1, r);

  // Elevation (-90° to +90°)
  const elRad = Math.asin(Math.max(-1, Math.min(1, y / safeR)));
  const elevation = Math.round((elRad * 180) / Math.PI);

  // Azimuth (-180° to +180°)
  // -z is front, +x is right
  const azRad = Math.atan2(x, -z);
  const azimuth = Math.round((azRad * 180) / Math.PI);

  return {
    azimuth,
    elevation,
    distance: Math.round(safeR * 10) / 10,
    binauralHrtf: true,
    spread: 0.2
  };
}

/**
 * Calculates 1st Order Ambisonics (B-Format) signal components for a given spatial coordinate.
 * W: 1/sqrt(2) omni
 * X: cos(az) * cos(el) front-back
 * Y: sin(az) * cos(el) left-right
 * Z: sin(el) up-down
 */
export function computeAmbisonicsBFormat(
  azimuthDeg: number,
  elevationDeg: number,
  gain: number = 1.0
): AmbisonicsBFormat {
  const azRad = (azimuthDeg * Math.PI) / 180;
  const elRad = (elevationDeg * Math.PI) / 180;
  const normGain = Math.max(0, Math.min(2.0, gain));

  const w = (normGain / Math.SQRT2);
  const x = normGain * Math.cos(azRad) * Math.cos(elRad);
  const y = normGain * Math.sin(azRad) * Math.cos(elRad);
  const z = normGain * Math.sin(elRad);

  return {
    w: Math.round(w * 1000) / 1000,
    x: Math.round(x * 1000) / 1000,
    y: Math.round(y * 1000) / 1000,
    z: Math.round(z * 1000) / 1000
  };
}

/**
 * Computes Vector Base Amplitude Panning (VBAP) speaker gains for a 7.1.4 Dolby Atmos Bed.
 */
export function computeAtmos714Bed(
  azimuthDeg: number,
  elevationDeg: number,
  distanceM: number,
  gain: number = 1.0,
  isSomaticSub: boolean = false
): Atmos714Bed {
  const azRad = (azimuthDeg * Math.PI) / 180;
  const elRad = (elevationDeg * Math.PI) / 180;
  const distAtten = 1 / Math.max(1, distanceM * 0.7);
  const effectiveGain = gain * distAtten;

  // Speaker nominal angular positions
  const speakers = [
    { id: 'C', az: 0, el: 0 },
    { id: 'L', az: -30, el: 0 },
    { id: 'R', az: 30, el: 0 },
    { id: 'Lss', az: -90, el: 0 },
    { id: 'Rss', az: 90, el: 0 },
    { id: 'Lsr', az: -135, el: 0 },
    { id: 'Rsr', az: 135, el: 0 },
    { id: 'Ltf', az: -45, el: 45 },
    { id: 'Rtf', az: 45, el: 45 },
    { id: 'Ltr', az: -135, el: 45 },
    { id: 'Rtr', az: 135, el: 45 }
  ];

  const speakerGains: { [key: string]: number } = {};

  // Compute spherical distance to each speaker
  const sourceCart = sphericalToCartesian(azimuthDeg, elevationDeg, 1.0);
  let sumSquared = 0;

  speakers.forEach(spk => {
    const spkCart = sphericalToCartesian(spk.az, spk.el, 1.0);
    // Dot product gives cosine of angle
    const dot = sourceCart.x * spkCart.x + sourceCart.y * spkCart.y + sourceCart.z * spkCart.z;
    // Map cosine [-1, 1] to proximity weight [0, 1] with steep exponent for sharp localization
    const proximity = Math.max(0, dot);
    const weight = Math.pow(proximity, 2.8);
    speakerGains[spk.id] = weight;
    sumSquared += weight * weight;
  });

  // Energy normalize
  const norm = sumSquared > 0.0001 ? Math.sqrt(sumSquared) : 1;
  const result: any = {};
  speakers.forEach(spk => {
    result[spk.id] = Math.round((speakerGains[spk.id] / norm) * effectiveGain * 1000) / 1000;
  });

  // LFE channel calculation (Somatic 10-20Hz energy routing)
  result.LFE = isSomaticSub || elevationDeg < -20
    ? Math.round(effectiveGain * 0.95 * 1000) / 1000
    : Math.round(effectiveGain * 0.15 * 1000) / 1000;

  return result as Atmos714Bed;
}

// Five Indian Classical Acoustic Staging Presets
export const SPATIAL_STAGING_PRESETS: SpatialStagingPreset[] = [
  {
    id: 'temple_sanctum',
    name: 'Temple Sanctum',
    sanskritTitle: 'गर्भगृह नाद (Garbhagriha)',
    description: 'Ancient carved granite sanctum. Tanpura reverberates from behind the sanctum wall, Sitar & Bansuri frame the central deity, Tabla anchors the floor, and Vedic chants rise toward the shikhara spire.',
    icon: '🛕',
    roomDimensions: { width: 14, depth: 22, height: 12 },
    rt60ReverbSec: 2.8,
    acousticDiffusion: 0.88,
    hypersonicReflectionBoost: 1.45,
    trackPlacements: {
      'tr-1': { azimuth: -25, elevation: 0, distance: 2.5 },   // Mood Sarod (Front-Left)
      'tr-2': { azimuth: 0, elevation: 18, distance: 2.2 },    // Vedic Vocals (Elevated Center)
      'tr-3': { azimuth: -40, elevation: 0, distance: 2.8 },   // Sitar (Mid-Left)
      'tr-4': { azimuth: 40, elevation: 5, distance: 2.8 },    // Bansuri (Mid-Right)
      'tr-5': { azimuth: 0, elevation: 65, distance: 4.0 },    // Risers / Braams (High Zenith Spire)
      'tr-6': { azimuth: 0, elevation: -12, distance: 1.8 },   // Tabla (Center Floor)
      'tr-7': { azimuth: 0, elevation: -35, distance: 1.5 },   // Somatic Bass (Stone Foundation)
      'tr-8': { azimuth: 180, elevation: 22, distance: 5.2 }   // Temple Drone (Rear Envelopment)
    }
  },
  {
    id: 'mehfil_circle',
    name: 'Mehfil Intimate Circle',
    sanskritTitle: 'महफ़िल बैठक (Baithak)',
    description: 'Traditional royal baithak seating arrangement. All artists sit in an intimate semi-circle around the listener (Rasika), creating a warm, immediate, microtonal envelopment with dry wooden reflections.',
    icon: '🪕',
    roomDimensions: { width: 8, depth: 8, height: 4.2 },
    rt60ReverbSec: 1.2,
    acousticDiffusion: 0.65,
    hypersonicReflectionBoost: 1.15,
    trackPlacements: {
      'tr-1': { azimuth: -30, elevation: 0, distance: 1.8 },   // Mood Sarod
      'tr-2': { azimuth: 0, elevation: 0, distance: 1.5 },     // Lead Vocals
      'tr-3': { azimuth: 30, elevation: 0, distance: 1.8 },    // Sitar
      'tr-4': { azimuth: -55, elevation: 0, distance: 2.0 },   // Bansuri
      'tr-5': { azimuth: 0, elevation: 30, distance: 2.5 },    // FX Riser
      'tr-6': { azimuth: 55, elevation: -8, distance: 1.8 },   // Tabla
      'tr-7': { azimuth: 0, elevation: -20, distance: 1.5 },   // Bass
      'tr-8': { azimuth: -145, elevation: 5, distance: 2.2 }   // Tanpura Drone Behind
    }
  },
  {
    id: 'varanasi_ghat',
    name: 'Varanasi Ghat Dawn Echo',
    sanskritTitle: 'काशी प्रभात (Varanasi Dawn)',
    description: 'Expansive open-air sunrise acoustic horizon along the sacred river Ganga. Sounds reflect off gentle morning waters and stone ghat staircases with deep horizon diffusion and wide stereo breadth.',
    icon: '🌊',
    roomDimensions: { width: 45, depth: 60, height: 25 },
    rt60ReverbSec: 3.8,
    acousticDiffusion: 0.95,
    hypersonicReflectionBoost: 1.6,
    trackPlacements: {
      'tr-1': { azimuth: -45, elevation: 0, distance: 4.5 },
      'tr-2': { azimuth: 0, elevation: 12, distance: 3.5 },
      'tr-3': { azimuth: -70, elevation: 0, distance: 5.5 },
      'tr-4': { azimuth: 70, elevation: 8, distance: 5.5 },
      'tr-5': { azimuth: 90, elevation: 42, distance: 6.0 },
      'tr-6': { azimuth: 25, elevation: -15, distance: 3.0 },
      'tr-7': { azimuth: 0, elevation: -45, distance: 2.0 },  // Deep Ganga River Sub
      'tr-8': { azimuth: 180, elevation: 10, distance: 7.5 }  // Distant Ghat Bells & Drone
    }
  },
  {
    id: 'vedic_yajna',
    name: 'Vedic Yajña Mandala',
    sanskritTitle: 'वैदिक यज्ञ मण्डल (Sacred Agni)',
    description: 'Sacred four-cardinal circular ritual staging. The sacred Agni fire burns in the center floor, while Hotri (Rigveda, East), Adhvaryu (Yajurveda, South), Udgatri (Samaveda, West), and Brahma (Atharvaveda, North) chant across the circle.',
    icon: '🔥',
    roomDimensions: { width: 16, depth: 16, height: 8 },
    rt60ReverbSec: 2.1,
    acousticDiffusion: 0.82,
    hypersonicReflectionBoost: 1.35,
    trackPlacements: {
      'tr-1': { azimuth: 0, elevation: 0, distance: 2.6 },     // East (Prachi)
      'tr-2': { azimuth: 0, elevation: 22, distance: 2.0 },    // Rigveda Hotri
      'tr-3': { azimuth: 90, elevation: 0, distance: 2.6 },    // South (Dakshina) Yajurveda
      'tr-4': { azimuth: -90, elevation: 0, distance: 2.6 },   // North (Udichi) Atharvaveda
      'tr-5': { azimuth: 0, elevation: 75, distance: 3.5 },    // Smoke Ascension
      'tr-6': { azimuth: 180, elevation: 0, distance: 2.6 },   // West (Pratichi) Samaveda
      'tr-7': { azimuth: 0, elevation: -55, distance: 1.2 },   // Central Agni Kunda Infrasound
      'tr-8': { azimuth: 180, elevation: 35, distance: 4.2 }   // Vedic Swaha Echo
    }
  },
  {
    id: 'orchestral_symphonic',
    name: 'Orchestral Hall Symphonic',
    sanskritTitle: 'सभामण्डप (Mahasabha)',
    description: 'Master symphonic acoustic hall layout with broad frontal stereo staging (-75° to +75°), elevated winds and choir (+25° elevation), high ceiling reflections, and distant rear auditorium ambiance.',
    icon: '🏛️',
    roomDimensions: { width: 24, depth: 38, height: 18 },
    rt60ReverbSec: 2.2,
    acousticDiffusion: 0.78,
    hypersonicReflectionBoost: 1.25,
    trackPlacements: {
      'tr-1': { azimuth: -25, elevation: 0, distance: 4.0 },
      'tr-2': { azimuth: 0, elevation: 20, distance: 4.2 },
      'tr-3': { azimuth: -50, elevation: 0, distance: 5.2 },
      'tr-4': { azimuth: 25, elevation: 12, distance: 4.5 },
      'tr-5': { azimuth: 55, elevation: 35, distance: 6.0 },
      'tr-6': { azimuth: 45, elevation: 0, distance: 4.2 },
      'tr-7': { azimuth: 0, elevation: -25, distance: 3.5 },
      'tr-8': { azimuth: 180, elevation: 40, distance: 7.8 }
    }
  }
];

// Default track coordinates initial seed
export const DEFAULT_TRACK_SPATIAL: Record<string, SpatialCoordinates> = {
  'tr-1': { azimuth: -25, elevation: 0, distance: 2.5, binauralHrtf: true, spread: 0.25 },
  'tr-2': { azimuth: 0, elevation: 15, distance: 2.0, binauralHrtf: true, spread: 0.2 },
  'tr-3': { azimuth: -40, elevation: 0, distance: 2.8, binauralHrtf: true, spread: 0.3 },
  'tr-4': { azimuth: 40, elevation: 5, distance: 2.8, binauralHrtf: true, spread: 0.3 },
  'tr-5': { azimuth: 0, elevation: 60, distance: 3.8, binauralHrtf: true, spread: 0.5 },
  'tr-6': { azimuth: 0, elevation: -10, distance: 1.8, binauralHrtf: true, spread: 0.2 },
  'tr-7': { azimuth: 0, elevation: -30, distance: 1.5, binauralHrtf: true, spread: 0.15 },
  'tr-8': { azimuth: 180, elevation: 20, distance: 4.5, binauralHrtf: true, spread: 0.6 }
};
