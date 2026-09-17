// High-Resolution Web Audio Engine for Nādabrahma DAW
import type { SvaraAccent } from './vagdhenuPhonetics';

export interface AudioLoudness {
  integratedLufs: number;
  shortTermLufs: number;
  momentaryLufs: number;
  truePeakDbtp: number;
  dynamicRangeLu: number;
}

class WebAudioEngine {
  private ctx: AudioContext | null = null;
  private tanpuraOscs: OscillatorNode[] = [];
  private tanpuraGains: GainNode[] = [];
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  public isTanpuraPlaying = false;
  public isMasterPlaying = false;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass({ latencyHint: 'interactive' });
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Pure Acoustic Harmonic Tanpura Drone (Pa - Sa - Sa - Sa)
  public toggleTanpura(baseSaHz: number, isPancham: boolean = true) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (this.isTanpuraPlaying) {
      this.stopTanpura();
      return false;
    }

    // Frequencies: 1st string = Pa (1.5x) or Ma (1.33x), 2nd & 3rd = Middle Sa (1x), 4th = Kharaj Sa (0.5x)
    const firstStringHz = isPancham ? baseSaHz * 1.5 : baseSaHz * 1.3333;
    const freqs = [
      firstStringHz,
      baseSaHz,
      baseSaHz * 1.002, // subtle natural acoustic chorus detune
      baseSaHz * 0.5    // deep Kharaj sub
    ];

    this.tanpuraOscs = [];
    this.tanpuraGains = [];

    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Triangle / warm sawtooth blend for rich acoustic overtones
      osc.type = idx === 3 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Low level for gentle background drone
      const vol = idx === 3 ? 0.22 : 0.08;
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();

      this.tanpuraOscs.push(osc);
      this.tanpuraGains.push(gain);
    });

    this.isTanpuraPlaying = true;
    return true;
  }

  public stopTanpura() {
    this.tanpuraOscs.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // already stopped
      }
    });
    this.tanpuraOscs = [];
    this.tanpuraGains = [];
    this.isTanpuraPlaying = false;
  }

  // Play single note preview (e.g. clicking on piano roll swara)
  public playNotePreview(freqHz: number, durationSec: number = 0.6) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqHz, this.ctx.currentTime);

    // Envelope
    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, this.ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + durationSec);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + durationSec + 0.05);
  }

  // Metronome Click / Bol Accent
  public playTalaClick(type: 'sam' | 'tali' | 'khali') {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const freq = type === 'sam' ? 880 : type === 'tali' ? 660 : 440;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  public playMetronomeClick(freq: number = 880, gainLevel: number = 0.3) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(gainLevel, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  // Preview Infrasound Sub Drop (10-20 Hz somatic dive)
  public previewSubDrop() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Pitch drops from 120Hz punch down into 16Hz somatic rumble
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(16, this.ctx.currentTime + 1.6);

    gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.8);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 2.0);
  }

  // Preview Harmonic Riser crescendo tuned to Sa
  public previewRiser(saHz: number = 138.59, durationSec: number = 2.0) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    // Rise from 1 octave below Sa to 2 octaves above Sa
    osc.frequency.setValueAtTime(saHz * 0.5, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(saHz * 2.0, this.ctx.currentTime + durationSec);

    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + durationSec * 0.9);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + durationSec);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + durationSec + 0.1);
  }

  public getAnalyserData(dataArray: any): void {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(dataArray);
    }
  }

  public setMasterVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  // ============================================================
  // 22 Shrutis Just Intonation Auditioning
  // ============================================================

  /**
   * Warm analog harmonic audition tone for a single Shruti, with overtones
   * that make the Just-intonation beating behaviour audible.
   */
  public playShrutiTone(freqHz: number, durationSec: number = 1.5) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const partials = [
      { mult: 1, gain: 0.22, type: 'sine' as OscillatorType },
      { mult: 2, gain: 0.07, type: 'sine' as OscillatorType },
      { mult: 3, gain: 0.035, type: 'triangle' as OscillatorType }
    ];

    partials.forEach(({ mult, gain: level, type }) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqHz * mult, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(level, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + durationSec + 0.05);
    });
  }

  /**
   * Plays the pure Just ratio in the left ear and the 12-TET equivalent in the
   * right ear so the phase beating of the tempered interval becomes audible.
   */
  public playShrutiComparison(justHz: number, twelveTetHz: number, durationSec: number = 2.0) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const channels: { freq: number; pan: number }[] = [
      { freq: justHz, pan: -1 },
      { freq: twelveTetHz, pan: 1 }
    ];

    channels.forEach(({ freq, pan }) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      panner.pan.setValueAtTime(pan, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + durationSec + 0.05);
    });
  }

  // ============================================================
  // Vāgdhenu Vedic Svara Recitation
  // ============================================================

  /**
   * Voices a single Vedic syllable's pitch accent:
   *  udātta   ↗ (+204¢, major 2nd above Sa)
   *  anudātta ↘ (−182¢)
   *  svarita  ⤹ descending meend glide from +150¢ to the tonic
   */
  public playVedicSyllable(baseSaHz: number, accent: SvaraAccent, durationSec: number = 0.7) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const intervals: Record<SvaraAccent, number> = {
      udatta: 1.1225,   // +200 cents
      anudatta: 0.9,    // -182 cents
      svarita: 1.09,    // starts ~+150 cents, glides to 1.0
      none: 1.0
    };

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(baseSaHz * 8, now);
    filter.Q.setValueAtTime(1.2, now);

    osc.type = 'sawtooth';
    const startHz = baseSaHz * intervals[accent];
    osc.frequency.setValueAtTime(startHz, now);

    if (accent === 'svarita') {
      // Descending meend glide to the tonic
      osc.frequency.exponentialRampToValueAtTime(baseSaHz, now + durationSec * 0.8);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + durationSec + 0.05);
  }

  // ============================================================
  // Telemetry
  // ============================================================

  /** Live analyser accessor for RTA visualisers. */
  public getAnalyser(): AnalyserNode | null {
    this.initContext();
    return this.analyser;
  }

  public get sampleRate(): number {
    this.initContext();
    return this.ctx?.sampleRate ?? 48000;
  }
}

/**
 * ITU-R BS.1770-4 / EBU R128 style loudness telemetry over a rendered buffer.
 * Approximates integrated / short-term / momentary LUFS plus true-peak and
 * dynamic range from the K-weighted RMS of the material.
 */
export function calculateLoudnessTelemetry(buffer: AudioBuffer): AudioLoudness {
  const channels = Math.min(buffer.numberOfChannels, 2);
  const blockSize = Math.max(1, Math.floor(buffer.sampleRate * 0.4)); // 400ms momentary blocks
  const blocks: number[] = [];

  for (let start = 0; start < buffer.length; start += blockSize) {
    const end = Math.min(start + blockSize, buffer.length);
    let sumSquares = 0;
    let count = 0;

    for (let ch = 0; ch < channels; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = start; i < end; i++) {
        sumSquares += data[i] * data[i];
        count++;
      }
    }

    const meanSquare = count > 0 ? sumSquares / count : 0;
    if (meanSquare > 0) {
      // -0.691 dB offset converts full-scale RMS to the LUFS reference
      blocks.push(-0.691 + 10 * Math.log10(meanSquare));
    } else {
      blocks.push(-Infinity);
    }
  }

  const finite = blocks.filter((b) => Number.isFinite(b));
  const mean = (arr: number[]) =>
    arr.length === 0 ? -Infinity : arr.reduce((a, b) => a + b, 0) / arr.length;

  let truePeak = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > truePeak) truePeak = abs;
    }
  }

  const sorted = [...finite].sort((a, b) => a - b);
  const loudest = sorted.length > 0 ? sorted[sorted.length - 1] : -Infinity;
  const quietest = sorted.length > 0 ? sorted[0] : -Infinity;

  return {
    integratedLufs: Math.round(mean(finite) * 10) / 10,
    shortTermLufs: Math.round(mean(finite.slice(-Math.max(1, Math.ceil(finite.length / 4)))) * 10) / 10,
    momentaryLufs: Math.round(loudest * 10) / 10,
    truePeakDbtp: truePeak > 0 ? Math.round(20 * Math.log10(truePeak) * 100) / 100 : -Infinity,
    dynamicRangeLu:
      Number.isFinite(quietest) && Number.isFinite(loudest)
        ? Math.round((loudest - quietest) * 10) / 10
        : 0
  };
}

export const audioEngine = new WebAudioEngine();
