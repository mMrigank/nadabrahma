// AI Model Definitions for Nādabrahma DAW
import type { AIModel } from '../types/daw';

export type { AIModel };

export interface AIModelSpec {
  id: AIModel;
  name: string;
  vramGB: number;
  quantization: string;
  acceleration: string[];
  description: string;
  memoryFootprintGB: number;
}

// Comprehensive hardware-quantized model definitions for all 6 audio generation engines
export const aiModelData: AIModelSpec[] = [
  {
    id: 'yue_2',
    name: 'YuE 2 (Full-Song Generation)',
    vramGB: 4.2,
    quantization: '4-bit INT4',
    acceleration: ['Apple MLX GPU', 'Apple ANE'],
    description: 'Multi-track verse/chorus generator with coherent long-form structure',
    memoryFootprintGB: 4.2
  },
  {
    id: 'minimax_3',
    name: 'MiniMax Music 01 / 3',
    vramGB: 5.1,
    quantization: '8-bit INT8',
    acceleration: ['Apple MPS', 'Apple MLX'],
    description: 'Ultra-expressive vocal phrasing and improvisation with microtonal control',
    memoryFootprintGB: 5.1
  },
  {
    id: 'ace_studio',
    name: 'ACE Studio 2.0',
    vramGB: 3.4,
    quantization: 'FP16',
    acceleration: ['Apple Metal', 'CoreAudio'],
    description: 'Formant-controlled virtual vocal synthesis with microtonal pitch bends',
    memoryFootprintGB: 3.4
  },
  {
    id: 'stable_audio_3',
    name: 'Stable Audio 3',
    vramGB: 2.8,
    quantization: '4-bit INT4',
    acceleration: ['Apple MLX GPU'],
    description: 'Extended spectrum text-to-audio acoustic textures, 48k air, and 10Hz sub drops',
    memoryFootprintGB: 2.8
  },
  {
    id: 'vagdhenu',
    name: 'Vāgdhenu Sanskrit Vedic Engine',
    vramGB: 1.8,
    quantization: 'INT8',
    acceleration: ['Apple MLX GPU', 'Apple ANE', 'CoreAudio Wasm'],
    description: 'Sacred Vedic recitation with Udātta/Anudātta/Svarita pitch accents and zero schwa-deletion',
    memoryFootprintGB: 1.8
  },
  {
    id: 'soundfont_native',
    name: 'Native Web Audio & Soundfont',
    vramGB: 0.2,
    quantization: 'PCM 96kHz / 32-bit float',
    acceleration: ['Web Audio SIMD Wasm'],
    description: '0ms latency bit-perfect deterministic offline generator',
    memoryFootprintGB: 0.2
  }
];

/**
 * Calculate current working memory usage including baseline DAW and loaded models
 */
export function calculateWorkingMemoryGB(): number {
  // Base DAW memory footprint (react, audio context, buffers, etc.)
  const baseDAWGB = 1.2;

  // In a real implementation, we'd track actual model memory usage
  // For now, we'll simulate based on loaded models
  const modelsLoaded = getOptimizedLoadedModels().length;
  const avgModelGB = 2.5; // Average across all models

  return baseDAWGB + (modelsLoaded * avgModelGB);
}

/**
 * Check if memory usage is within the safe 18GB ceiling
 */
export function isMemoryWithinSafeCeiling(): boolean {
  return calculateWorkingMemoryGB() <= 18;
}

/**
 * Get currently optimized/loaded models based on memory constraints
 */
export function getOptimizedLoadedModels(): AIModel[] {
  // In a real implementation, this would check what's actually loaded
  // For simulation, we'll return a subset that fits in memory
  const usedGB = calculateWorkingMemoryGB();
  const availableGB = 18 - usedGB;

  // Sort by memory footprint (smallest first) for optimal loading
  const sortedModels = [...aiModelData].sort((a, b) => a.memoryFootprintGB - b.memoryFootprintGB);

  const loaded: AIModel[] = [];
  let currentUsage = 0;

  for (const model of sortedModels) {
    if (currentUsage + model.memoryFootprintGB <= 16) { // Leave 2GB headroom
      loaded.push(model.id);
      currentUsage += model.memoryFootprintGB;
    } else {
      break;
    }
  }

  return loaded;
}

/**
 * Handle memory optimization by unloading dormant models
 */
export async function handleOptimizeMemory(): Promise<void> {
  // In a real implementation, this would unload models from MLX/Metal
  // For now, we'll just trigger a recalculation
  return new Promise(resolve => setTimeout(resolve, 500));
}

/**
 * Build dual-conditioned prompt combining Raga, Swaras, Vadi/Samvadi, etc.
 */
export interface RagaToWesternMap {
  [ragaId: string]: string;
}

export const RAGA_TO_WESTERN_MAP: RagaToWesternMap = {
  yaman: 'Lydian Mode (1 - 2 - 3 - #4 - 5 - 6 - 7)',
  hansadhwani: 'Major Pentatonic with Maj 7th (1 - 2 - 3 - 5 - 7)',
  darbari: 'Natural Minor (Aeolian Mode with sunken 3rd & 6th)',
  bhairavi: 'Phrygian Mode (1 - b2 - b3 - 4 - 5 - b6 - b7)',
  bhoopali: 'Major Pentatonic (1 - 2 - 3 - 5 - 6)',
  malkauns: 'Minor Pentatonic without 2nd & 5th (1 - b3 - 4 - b6 - b7)',
  durga: 'Suspended Pentatonic (1 - 2 - 4 - 5 - 6)',
  marwa: 'Lydian b2 without 5th (1 - b2 - 3 - #4 - 6 - 7)'
};

/**
 * Build dual-conditioned prompt for AI models
 */
export function buildDualConditionedPrompt(
  ragaId: string,
  swaras: string,
  vadi: string,
  samvadi: string,
  moveableSaHz: number,
  talaName: string,
  dspTokens: string[]
): string {
  const ragaName = ragaId.charAt(0).toUpperCase() + ragaId.slice(1);
  const westernMode = RAGA_TO_WESTERN_MAP[ragaId as keyof typeof RAGA_TO_WESTERN_MAP] || 'Unknown';

  const components = [
    `[Raga: ${ragaName}]`,
    `[Western: ${westernMode}]`,
    `[Swara: ${swaras}]`,
    `[Vadi: ${vadi}]`,
    `[Samvadi: ${samvadi}]`,
    `[Sa: ${moveableSaHz.toFixed(2)}Hz]`,
    `[Tala: ${talaName}]`,
    ...dspTokens
  ];

  return components.join(' ');
}