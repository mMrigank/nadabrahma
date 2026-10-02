import { AIModel, TrackRole } from '../types/daw';

export interface AIModelMeta {
  id: AIModel;
  name: string;
  shortName: string;
  provider: string;
  architecture: string;
  memoryFootprintGB: number;
  quantization: string;
  hardwareEngine: 'Apple MLX (GPU / ANE)' | 'Apple MLX / audio.cpp (GPU / ANE)' | 'audio.cpp Metal (GPU / UMA)' | 'Metal Performance Shaders (MPS)' | 'Web Audio SIMD Wasm';
  strengths: string;
  category: 'Full-Song & Arrangement' | 'Vocal Nuance & Solo' | 'Microtonal Formants' | 'Extended Spectrum & FX' | 'Vedic Phonetics' | 'Zero-Latency Offline';
  recommendedTrackRoles: TrackRole[];
  typicalLatencySec: number;
  supportedSampleRate: string;
  description: string;
}

export const AI_MODELS_METADATA: Record<AIModel, AIModelMeta> = {
  yue_2: {
    id: 'yue_2',
    name: 'YuE2 3B BF16 ⭐ Primary',
    shortName: 'YuE 2',
    provider: 'Tencent & Open-Source (audio.cpp)',
    architecture: 'Dual-Track LM + Flow Matching Diffusion',
    memoryFootprintGB: 6.5,
    quantization: 'BF16 (audio.cpp + Metal — zero-copy UMA)',
    hardwareEngine: 'Apple MLX (GPU / ANE)',
    strengths: 'Full multitrack verse/chorus structure, dual-conditioned acoustics, long-context coherence',
    category: 'Full-Song & Arrangement',
    recommendedTrackRoles: ['solo_instrument', 'drone', 'ambient_pad'],
    typicalLatencySec: 1.4,
    supportedSampleRate: '48 kHz (upsampled to 96 kHz in frontend)',
    description: 'BF16 precision model via audio.cpp on Apple Silicon. Primary instrumental model. Loads on-demand, unloads immediately after generation. Zero Python overhead.'
  },
  minimax_3: {
    id: 'minimax_3',
    name: 'MiniMax Music 3 (backup)',
    shortName: 'MiniMax 3',
    provider: 'MiniMax AI (audio.cpp v0.7+)',
    architecture: 'Transformer DiT + Direct Voice Latent',
    memoryFootprintGB: 9.5,
    quantization: 'GGUF Q8 (audio.cpp + Metal)',
    hardwareEngine: 'Metal Performance Shaders (MPS)',
    strengths: 'Different sonic character for alternate iterations of instrumental tracks',
    category: 'Full-Song & Arrangement',
    recommendedTrackRoles: ['solo_instrument', 'ambient_pad'],
    typicalLatencySec: 1.8,
    supportedSampleRate: '48 kHz (upsampled to 96 kHz in frontend)',
    description: 'GGUF model via audio.cpp. Backup instrumental model for alternate sonic iterations when YuE2 output needs variety. Heavier footprint — swaps with YuE2 on demand.'
  },
  ace_studio: {
    id: 'ace_studio',
    name: 'ACE-Step 1.5 (Vocal)',
    shortName: 'ACE-Step',
    provider: 'ACE-Step Open-Source (audio.cpp)',
    architecture: 'Diffusion Transformer + Qwen3 LM Planner',
    memoryFootprintGB: 9.0,
    quantization: 'GGUF Q8 SFT variant (audio.cpp + Metal)',
    hardwareEngine: 'Apple MLX (GPU / ANE)',
    strengths: 'Aalap, humming, oohs, gamaka ornaments, Hindi lyrics, Sanskrit pronunciation, Indian fusion vocals',
    category: 'Vocal Nuance & Solo',
    recommendedTrackRoles: ['lead_vocal', 'vedic_chant', 'choral_harmony'],
    typicalLatencySec: 0.8,
    supportedSampleRate: '48 kHz (upsampled to 96 kHz in frontend)',
    description: 'GGUF SFT vocal model via audio.cpp. Handles wordless aalap/humming (empty lyrics), Hindi/Sanskrit text, and gamaka pitch oscillations. Strictly vocal — never instrumental.'
  },
  stable_audio_3: {
    id: 'stable_audio_3',
    name: 'Stable Audio 3 Medium',
    shortName: 'Stable Audio 3',
    provider: 'Stability AI (audio.cpp)',
    architecture: 'Continuous Latent Diffusion Model (Autoencoder + DiT)',
    memoryFootprintGB: 4.5,
    quantization: 'GGUF Medium (audio.cpp + Metal) — Small excluded',
    hardwareEngine: 'Apple MLX (GPU / ANE)',
    strengths: 'Cinematic risers/drops, somatic infrasound (10-20Hz), hypersonic air textures (20k-48kHz), ambient pads',
    category: 'Extended Spectrum & FX',
    recommendedTrackRoles: ['risers_drops', 'ambient_pad', 'percussion_tala'],
    typicalLatencySec: 1.1,
    supportedSampleRate: '48 kHz (upsampled to 96 kHz in frontend)',
    description: 'GGUF Medium model via audio.cpp. Small variant excluded (mushy tonal contrast). Used for extended-spectrum FX: cinematic textures, somatic sub-bass, hypersonic air sheen. On-demand only.'
  },
  vagdhenu: {
    id: 'vagdhenu',
    name: 'Vāgdhenu Sanskrit Vedic Engine',
    shortName: 'Vāgdhenu',
    provider: 'Nādabrahma Native Phonology Core',
    architecture: 'Acoustic Vedic Phoneme Formant + Prosody Model',
    memoryFootprintGB: 1.8,
    quantization: 'Q8 CoreAudio Wasm/MLX',
    hardwareEngine: 'Apple MLX / audio.cpp (GPU / ANE)',
    strengths: 'Sacred Sanskrit Vedic recitation, Udātta/Anudātta/Svarita pitch accents, zero schwa-deletion',
    category: 'Vedic Phonetics',
    recommendedTrackRoles: ['vedic_chant', 'lead_vocal'],
    typicalLatencySec: 0.4,
    supportedSampleRate: '96 kHz / 32-bit Float',
    description: 'Q8 optimized Vedic Sanskrit recitation model. Preserves ancient Chhandas meters with zero colloquial schwa truncation. Loads dynamically on-demand.'
  },
  soundfont_native: {
    id: 'soundfont_native',
    name: 'Native Web Audio & Soundfont',
    shortName: 'Soundfont Native',
    provider: 'Nādabrahma Built-in Zero-Latency Core',
    architecture: 'Wasm Multi-Sample Oscillator Matrix',
    memoryFootprintGB: 0.2,
    quantization: 'PCM 96kHz / 32-bit float',
    hardwareEngine: 'Web Audio SIMD Wasm',
    strengths: '0ms latency, zero memory pressure, 100% offline, bit-perfect deterministic playback',
    category: 'Zero-Latency Offline',
    recommendedTrackRoles: ['solo_instrument', 'percussion_tala', 'drone', 'ambient_pad'],
    typicalLatencySec: 0.01,
    supportedSampleRate: '96 kHz / 32-bit Float',
    description: 'High-efficiency multi-sample physical modeling engine providing instantaneous zero-latency playback.'
  }
};

export const TOTAL_UNIFIED_MEMORY_GB = 32.0;
export const MEMORY_CEILING_GB = 14.0; // 12-15GB directive: keeps working memory comfortably inside ceiling leaving 18GB+ for OS and multitasking
export const DAW_BASE_MEMORY_GB = 1.5; // Baseline DAW + Go server memory

/**
 * Calculates total working memory including DAW base footprint and loaded models
 */
export function calculateWorkingMemoryGB(loadedModelIds: AIModel[]): number {
  const modelsMemory = loadedModelIds.reduce((sum, modelId) => {
    const meta = AI_MODELS_METADATA[modelId];
    return sum + (meta ? meta.memoryFootprintGB : 0);
  }, 0);
  return Math.round((DAW_BASE_MEMORY_GB + modelsMemory) * 10) / 10;
}

/**
 * Determines whether loaded models are within the safe 18GB working ceiling
 */
export function isMemoryWithinSafeCeiling(loadedModelIds: AIModel[]): boolean {
  return calculateWorkingMemoryGB(loadedModelIds) <= MEMORY_CEILING_GB;
}

/**
 * Determines optimal resident models based on active tracks to minimize memory footprint
 */
export function getOptimizedLoadedModels(activeTracksModels: AIModel[]): AIModel[] {
  const set = new Set<AIModel>(['soundfont_native']); // Always keep soundfont loaded
  activeTracksModels.forEach(m => set.add(m));
  return Array.from(set);
}
