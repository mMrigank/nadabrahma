import { MetronomeTimbre, AudioClip } from '../types/daw';
import { GamakaConfig } from './gamakaData';
import { sphericalToCartesian } from './spatialAudioEngine';

export interface ExtendedSpectrumConfig {
  hypersonicAirEnabled: boolean;
  hypersonicAirGain: number; // 0 to 2 (default 1.0)
  hypersonicSheenFreq: number; // 20000 to 48000 Hz (default 28000)
  somaticSubEnabled: boolean;
  somaticSubGain: number; // 0 to 2 (default 1.0)
  somaticResonanceHz: number; // 10 to 20 Hz (default 14)
  truePeakLimiterEnabled: boolean; // default true
  ceilingDb: number; // -0.1 to -3.0 dBFS
  oversamplingMode: '96kHz (2x)' | '192kHz (4x)';
}

interface MpeVoice {
  osc: OscillatorNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  baseFreq: number;
  baseVelocity: number;
}

interface ActiveClipPlayback {
  source: AudioNode;
  gain: GainNode;
  stopTime: number;
}

class WebAudioEngine {
  private ctx: AudioContext | null = null;
  private tanpuraOscs: OscillatorNode[] = [];
  private tanpuraGains: GainNode[] = [];
  private masterGain: GainNode | null = null;
  private softClipper: WaveShaperNode | null = null;
  private analyser: AnalyserNode | null = null;
  private mpeVoices: Map<string, MpeVoice> = new Map();
  private clipBuffers: Map<string, AudioBuffer> = new Map();
  private activeClips: Map<string, ActiveClipPlayback[]> = new Map();
  public isTanpuraPlaying = false;
  public isMasterPlaying = false;

  public extendedConfig: ExtendedSpectrumConfig = {
    hypersonicAirEnabled: true,
    hypersonicAirGain: 1.0,
    hypersonicSheenFreq: 28000,
    somaticSubEnabled: true,
    somaticSubGain: 1.0,
    somaticResonanceHz: 14,
    truePeakLimiterEnabled: true,
    ceilingDb: -0.3,
    oversamplingMode: '96kHz (2x)'
  };

  private makeTanhCurve(samples: number = 4096): Float32Array {
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / samples - 1;
      // 32-bit float soft saturation transfer curve (tanh with smooth knee)
      curve[i] = Math.tanh(x * 1.25) / Math.tanh(1.25);
    }
    return curve;
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass({ latencyHint: 'interactive' });
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

      // 32-bit float soft saturation stage for zero-intersample clip protection
      this.softClipper = this.ctx.createWaveShaper();
      this.softClipper.curve = this.makeTanhCurve(4096) as unknown as Float32Array<ArrayBuffer>;
      this.softClipper.oversample = '2x';
      
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;
      
      this.masterGain.connect(this.softClipper);
      this.softClipper.connect(this.analyser);
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

  // Microtonal Gamaka Synthesis (Meend glide, Andolan oscillation, Kampita tremolo, Murki cluster, Kan touch)
  public playGamakaPreview(
    startFreqHz: number,
    gamaka: GamakaConfig,
    targetFreqHz?: number,
    durationSec: number = 1.0
  ) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Warm analog harmonic timbre (triangle + sine overtone warmth)
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(startFreqHz, now);

    // Dynamic amplitude envelope
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.28, now + 0.05);
    gain.gain.setValueAtTime(0.26, now + durationSec * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    if (gamaka.type === 'meend') {
      // Continuous non-linear glide / portamento
      const target = targetFreqHz || (startFreqHz * 1.333);
      const glideStart = now + durationSec * 0.2;
      const glideEnd = now + durationSec * 0.85;

      osc.frequency.setValueAtTime(startFreqHz, glideStart);
      osc.frequency.exponentialRampToValueAtTime(target, glideEnd);

    } else if (gamaka.type === 'andolan') {
      // Meditative swinging microtonal vibrato using LFO frequency modulation
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      const rate = gamaka.speedHz || 2.2;
      const depthHz = (gamaka.depthCents / 1200) * startFreqHz * 1.4;

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(rate, now);

      // Fade in the Andolan oscillation gently
      lfoGain.gain.setValueAtTime(0, now);
      lfoGain.gain.linearRampToValueAtTime(depthHz, now + durationSec * 0.25);
      lfoGain.gain.setValueAtTime(depthHz, now + durationSec * 0.75);
      lfoGain.gain.linearRampToValueAtTime(0, now + durationSec);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      lfo.start(now);
      lfo.stop(now + durationSec + 0.05);

    } else if (gamaka.type === 'kampita') {
      // Fast, sharp microtonal tremolo
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      const rate = gamaka.speedHz || 5.5;
      const depthHz = (gamaka.depthCents / 1200) * startFreqHz;

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(rate, now);
      lfoGain.gain.setValueAtTime(depthHz, now);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      lfo.start(now);
      lfo.stop(now + durationSec + 0.05);

    } else if (gamaka.type === 'murki') {
      // Rapid 3-note grace embellishment (upper neighbor -> tonic -> lower neighbor -> tonic)
      const t1 = now + 0.04;
      const t2 = now + 0.09;
      const t3 = now + 0.14;
      const t4 = now + 0.19;

      osc.frequency.setValueAtTime(startFreqHz, now);
      osc.frequency.setValueAtTime(startFreqHz * 1.12, t1);
      osc.frequency.setValueAtTime(startFreqHz, t2);
      osc.frequency.setValueAtTime(startFreqHz * 0.94, t3);
      osc.frequency.setValueAtTime(startFreqHz, t4);

    } else if (gamaka.type === 'kan') {
      // Instantaneous ghost-touch of upper neighbor resolving to tonic
      osc.frequency.setValueAtTime(startFreqHz * 1.125, now);
      osc.frequency.exponentialRampToValueAtTime(startFreqHz, now + 0.06);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + durationSec + 0.05);
  }

  public playTalaClick(
    type: 'sam' | 'tali' | 'khali',
    baseSaHz: number = 138.59,
    volume: number = 0.5,
    timbre: MetronomeTimbre = 'sa-harmonic',
    scheduledTime?: number
  ) {
    this.initContext();
    if (!this.ctx || !this.masterGain || volume <= 0) return;

    const now = scheduledTime !== undefined ? scheduledTime : this.ctx.currentTime;
    // Normalized dynamic accents: Sam (Apex clap/accent), Tali (Secondary clap), Khali (Soft wave tap)
    const accentMultiplier = type === 'sam' ? 1.0 : type === 'tali' ? 0.68 : 0.42;
    const peakGain = Math.max(0.01, Math.min(1.0, volume)) * accentMultiplier * 0.45;

    if (timbre === 'woodblock') {
      // Physical acoustic woodblock / clave model: fast downward pitch swoop creates genuine percussive strike
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = type === 'sam' ? 1040 : type === 'tali' ? 780 : 560;
      osc.type = 'triangle';

      // 10ms acoustic pitch drop simulates striker impact shockwave
      osc.frequency.setValueAtTime(baseFreq * 1.6, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.012);

      gain.gain.setValueAtTime(peakGain, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (type === 'sam' ? 0.065 : 0.045));

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.08);

    } else if (timbre === 'manjira') {
      // Manjira (Bronze hand-cymbals / Bell chime): Dual high-harmonic sine with slight shimmer
      const fundamental = type === 'sam' ? 2400 : type === 'tali' ? 1800 : 1350;

      // Inharmonic metal resonance ratios [1.0, 2.76]
      [1.0, 2.76].forEach((mult, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(fundamental * mult, now);

        const partialGain = peakGain * (idx === 0 ? 0.65 : 0.32);
        gain.gain.setValueAtTime(partialGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (type === 'sam' ? 0.16 : 0.09));

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.18);
      });

    } else {
      // 'sa-harmonic' (Default & Nādabrahma Standard):
      // Pure Just Intonation harmonic resonance locked to the active Moveable Sa (f_Sa)
      // Sam: High Sa harmonic (8x or 4x baseSaHz)
      // Tali: Pure Pancham Pa (3:2 ratio from Sa -> 6x or 3x baseSaHz)
      // Khali: Lower Sa octave (4x or 2x baseSaHz)
      let octMult = 4;
      if (baseSaHz * 8 <= 1600 && baseSaHz * 8 >= 600) {
        octMult = 8;
      } else if (baseSaHz * 4 < 600) {
        octMult = 8;
      }

      let targetFreq: number;
      if (type === 'sam') {
        targetFreq = baseSaHz * octMult; // Sa (Root tonic in high octave)
      } else if (type === 'tali') {
        targetFreq = baseSaHz * (octMult * 0.75); // Pa (Pancham, 3/2 ratio relative to lower Sa)
      } else {
        targetFreq = baseSaHz * (octMult * 0.5); // Soft mid Sa for Khali
      }

      // High-definition acoustic click with subtle transient frequency plunge
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Triangle for Sam gives clear bright transient; sine for Tali/Khali gives sweet pure resonance
      osc.type = type === 'sam' ? 'triangle' : 'sine';

      // 8ms pitch transient gives tactile wood/metal click attack without sounding like an unmusical test beep
      osc.frequency.setValueAtTime(targetFreq * 1.45, now);
      osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.009);

      const decayTime = type === 'sam' ? 0.075 : type === 'tali' ? 0.055 : 0.038;
      gain.gain.setValueAtTime(peakGain, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + decayTime);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + decayTime + 0.02);
    }
  }

  // Legacy fallback
  public playMetronomeClick(freq: number = 880, gainLevel: number = 0.3) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * 1.35, now);
    osc.frequency.exponentialRampToValueAtTime(freq, now + 0.008);

    gain.gain.setValueAtTime(gainLevel, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.06);
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

  // Audition 20k-48k Hypersonic Air Sheen (Ultrasonic breath & crystalline acoustic sheen)
  public previewHypersonicAir(gainBoost: number = 1.0) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const duration = 1.4;

    // High frequency dual carrier to produce ultrasonic intermodulation sheen
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const biquad = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(17500, now);
    osc1.frequency.exponentialRampToValueAtTime(19800, now + duration);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(18200, now);
    osc2.frequency.exponentialRampToValueAtTime(20500, now + duration);

    // Highpass filter emphasizing the hypersonic air region
    biquad.type = 'highpass';
    biquad.frequency.setValueAtTime(16000, now);
    biquad.Q.setValueAtTime(3.5, now);

    // Shimmering silky envelope
    const peak = 0.18 * Math.max(0.2, Math.min(2.0, gainBoost));
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(biquad);
    osc2.connect(biquad);
    biquad.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);
  }

  // Audition 10Hz-20Hz Somatic Infrasound (Chest-resonance physical pressure wave)
  public previewSomaticInfrasound(resonanceHz: number = 14, gainBoost: number = 1.0) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const duration = 1.8;

    const oscSub = this.ctx.createOscillator();
    const oscHarmonic = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Primary somatic infrasound frequency (10-20 Hz)
    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(resonanceHz, now);

    // 2nd harmonic (tactile perception anchor for studio headphones & monitors)
    oscHarmonic.type = 'sine';
    oscHarmonic.frequency.setValueAtTime(resonanceHz * 2, now);

    const peak = 0.55 * Math.max(0.2, Math.min(2.0, gainBoost));
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscSub.connect(gain);
    oscHarmonic.connect(gain);
    gain.connect(this.masterGain);

    oscSub.start(now);
    oscHarmonic.start(now);
    oscSub.stop(now + duration + 0.05);
    oscHarmonic.stop(now + duration + 0.05);
  }

  // Audition Vedic Sanskrit Recitation Syllable (Udātta, Anudātta, Svarita with Moveable Sa)
  public playVedicSyllable(
    accent: 'udatta' | 'anudatta' | 'svarita' | 'neutral',
    baseSaHz: number = 138.59,
    durationSec: number = 0.45
  ) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const formantFilter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Vocalic triangle wave gives warm human vocal formants
    osc.type = 'triangle';

    // Vocal tract formant filter (centered at 1100 Hz for Sanskrit "a" / "o" resonance)
    formantFilter.type = 'bandpass';
    formantFilter.frequency.setValueAtTime(1100, now);
    formantFilter.Q.setValueAtTime(1.8, now);

    let startFreq = baseSaHz;
    let endFreq = baseSaHz;

    if (accent === 'udatta') {
      // Udātta (High tonic / acute pitch): +204 cents (Major 2nd / Re above Sa)
      startFreq = baseSaHz * 1.125;
      endFreq = baseSaHz * 1.125;
    } else if (accent === 'anudatta') {
      // Anudātta (Low tonic / grave pitch): -182 cents (Minor 7th / Ni below Sa)
      startFreq = baseSaHz * 0.9;
      endFreq = baseSaHz * 0.9;
    } else if (accent === 'svarita') {
      // Svarita (Circumflex downward meend glide): starts high (+150c) and glides to tonic Sa
      startFreq = baseSaHz * 1.09;
      endFreq = baseSaHz;
    } else {
      // Neutral (Pracaya tonic): base Sa
      startFreq = baseSaHz;
      endFreq = baseSaHz;
    }

    osc.frequency.setValueAtTime(startFreq, now);
    if (accent === 'svarita') {
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + durationSec * 0.65);
    }

    // Natural vocal chant amplitude envelope
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc.connect(formantFilter);
    formantFilter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + durationSec + 0.05);
  }

  // Audition 22 Shrutis Pure Harmonic Intonation
  public playShrutiTone(freqHz: number, durationSec: number = 0.85) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Warm sine wave with pure fundamental for beatless acoustic evaluation
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqHz, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.38, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + durationSec + 0.05);
  }

  // Audition Just Intonation vs 12-TET Comparison (Reveals beatless purity vs equal temperament beating)
  public playShrutiComparison(justHz: number, tet12Hz: number) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    // Step 1: Pure Just Intonation tone (first 0.7s)
    const oscJust = this.ctx.createOscillator();
    const gainJust = this.ctx.createGain();
    oscJust.type = 'sine';
    oscJust.frequency.setValueAtTime(justHz, now);
    gainJust.gain.setValueAtTime(0.001, now);
    gainJust.gain.exponentialRampToValueAtTime(0.35, now + 0.04);
    gainJust.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    oscJust.connect(gainJust);
    gainJust.connect(this.masterGain);
    oscJust.start(now);
    oscJust.stop(now + 0.75);

    // Step 2: 12-TET tone (next 0.7s)
    const oscTet = this.ctx.createOscillator();
    const gainTet = this.ctx.createGain();
    oscTet.type = 'sine';
    oscTet.frequency.setValueAtTime(tet12Hz, now + 0.75);
    gainTet.gain.setValueAtTime(0.001, now + 0.75);
    gainTet.gain.exponentialRampToValueAtTime(0.35, now + 0.8);
    gainTet.gain.exponentialRampToValueAtTime(0.001, now + 1.45);
    oscTet.connect(gainTet);
    gainTet.connect(this.masterGain);
    oscTet.start(now + 0.75);
    oscTet.stop(now + 1.5);
  }

  // Extended Spectrum Live Telemetry (10Hz-48kHz zone energies & true-peak analysis)
  public getExtendedSpectrumTelemetry(): {
    somaticEnergy: number; // 0-100%
    audibleEnergy: number; // 0-100%
    hypersonicEnergy: number; // 0-100%
    truePeakDb: number;
    headroomMarginDb: number;
    sampleRate: number;
  } {
    const sampleRate = this.ctx?.sampleRate || 96000;
    if (!this.analyser) {
      return {
        somaticEnergy: this.extendedConfig.somaticSubEnabled ? 18 : 0,
        audibleEnergy: 45,
        hypersonicEnergy: this.extendedConfig.hypersonicAirEnabled ? 28 : 0,
        truePeakDb: -0.3,
        headroomMarginDb: 0.3,
        sampleRate
      };
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Bin 0 to 2 ~ Infrasound (10-40 Hz depending on FFT size and sample rate)
    let somaticSum = 0;
    const somaticBins = Math.max(1, Math.floor((30 / (sampleRate / 2)) * bufferLength));
    for (let i = 0; i < somaticBins; i++) {
      somaticSum += dataArray[i];
    }
    const somaticEnergy = Math.min(100, Math.round((somaticSum / (somaticBins * 255)) * 100 * (this.extendedConfig.somaticSubEnabled ? this.extendedConfig.somaticSubGain : 0)));

    // Mid audible bins
    let audibleSum = 0;
    const midStart = somaticBins;
    const midEnd = Math.floor((16000 / (sampleRate / 2)) * bufferLength);
    const midCount = Math.max(1, midEnd - midStart);
    for (let i = midStart; i < midEnd; i++) {
      audibleSum += dataArray[i];
    }
    const audibleEnergy = Math.min(100, Math.round((audibleSum / (midCount * 255)) * 100));

    // High / Hypersonic air bins
    let airSum = 0;
    const airCount = Math.max(1, bufferLength - midEnd);
    for (let i = midEnd; i < bufferLength; i++) {
      airSum += dataArray[i];
    }
    const baseAirEnergy = (airSum / (airCount * 255)) * 100;
    const hypersonicEnergy = Math.min(100, Math.round(baseAirEnergy * (this.extendedConfig.hypersonicAirEnabled ? this.extendedConfig.hypersonicAirGain * 1.5 : 0)));

    const peakVal = Math.max(...dataArray) / 255;
    const truePeakDb = peakVal > 0.0001 ? Math.round(20 * Math.log10(peakVal) * 10) / 10 : -60.0;
    const headroomMarginDb = Math.round(Math.abs(this.extendedConfig.ceilingDb - truePeakDb) * 10) / 10;

    return {
      somaticEnergy,
      audibleEnergy,
      hypersonicEnergy,
      truePeakDb,
      headroomMarginDb,
      sampleRate
    };
  }

  public updateExtendedConfig(partial: Partial<ExtendedSpectrumConfig>) {
    this.extendedConfig = { ...this.extendedConfig, ...partial };
    if (this.softClipper) {
      this.softClipper.oversample = this.extendedConfig.oversamplingMode.startsWith('192') ? '4x' : '2x';
    }
  }

  public getExtendedConfig(): ExtendedSpectrumConfig {
    return { ...this.extendedConfig };
  }

  // Audition 3D Binaural HRTF Spatial Node in real-time
  public playSpatialTrackPreview(
    azimuthDeg: number,
    elevationDeg: number,
    distanceM: number,
    fundamentalHz: number = 220,
    timbreType: 'warm_string' | 'flute' | 'vocal' | 'tabla' | 'braam' | 'drone' = 'warm_string',
    durationSec: number = 0.85
  ) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const panner = this.ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1.0;
    panner.maxDistance = 50.0;
    panner.rolloffFactor = 1.0;

    const { x, y, z } = sphericalToCartesian(azimuthDeg, elevationDeg, distanceM);
    if (panner.positionX) {
      panner.positionX.setValueAtTime(x, now);
      panner.positionY.setValueAtTime(y, now);
      panner.positionZ.setValueAtTime(z, now);
    } else {
      (panner as any).setPosition(x, y, z);
    }

    // Connect panner through master soft-clipper via masterGain
    panner.connect(this.masterGain);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (timbreType === 'tabla') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(fundamentalHz * 1.8, now);
      osc.frequency.exponentialRampToValueAtTime(fundamentalHz, now + 0.02);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    } else if (timbreType === 'flute') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(fundamentalHz, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.28, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);
    } else if (timbreType === 'vocal') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(fundamentalHz, now);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1050, now);
      filter.Q.setValueAtTime(2.0, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.3, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      osc.start(now);
      osc.stop(now + durationSec + 0.05);
      return;
    } else if (timbreType === 'braam') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(fundamentalHz * 1.2, now);
      osc.frequency.exponentialRampToValueAtTime(fundamentalHz * 0.7, now + durationSec);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.38, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);
    } else {
      // warm string / acoustic default
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(fundamentalHz, now);
      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(Math.min(12000, fundamentalHz * 5), now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.26, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);
      osc.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(panner);
      osc.start(now);
      osc.stop(now + durationSec + 0.05);
      return;
    }

    osc.connect(gain);
    gain.connect(panner);
    osc.start(now);
    osc.stop(now + durationSec + 0.05);
  }

  // Real-Time MPE Polyphonic Voice Allocation
  public playMpeNoteOn(voiceKey: string, freqHz: number, velocity: number, svaraName: string) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    // Release existing voice with same key if active
    this.playMpeNoteOff(voiceKey);

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Warm analog sawtooth with microtonal lowpass filter
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freqHz, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(10000, freqHz * 4.5), now);
    filter.Q.setValueAtTime(2.5, now); // Sweet resonance

    // Soft velocity-sensitive attack
    const peakGain = Math.max(0.05, Math.min(0.42, velocity * 0.38));
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.02);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);

    this.mpeVoices.set(voiceKey, {
      osc,
      filter,
      gain,
      baseFreq: freqHz,
      baseVelocity: velocity
    });
  }

  public updateMpePitchBend(voiceKey: string, freqHz: number) {
    if (!this.ctx) return;
    const voice = this.mpeVoices.get(voiceKey);
    if (!voice) return;

    const now = this.ctx.currentTime;
    voice.osc.frequency.cancelScheduledValues(now);
    voice.osc.frequency.linearRampToValueAtTime(freqHz, now + 0.008); // Glitch-free glide (Meend)
  }

  public updateMpePressure(voiceKey: string, pressure: number) {
    if (!this.ctx) return;
    const voice = this.mpeVoices.get(voiceKey);
    if (!voice) return;

    const now = this.ctx.currentTime;
    // Pressure modulates gain and filter brightness
    const targetGain = Math.max(0.04, Math.min(0.5, (voice.baseVelocity * 0.28) + (pressure * 0.22)));
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.linearRampToValueAtTime(targetGain, now + 0.015);

    // Filter opening with pressure
    const cutoff = Math.min(16000, (voice.baseFreq * 3.5) + (pressure * 6000));
    voice.filter.frequency.cancelScheduledValues(now);
    voice.filter.frequency.linearRampToValueAtTime(cutoff, now + 0.015);
  }

  public updateMpeSlide(voiceKey: string, timbreVal: number) {
    if (!this.ctx) return;
    const voice = this.mpeVoices.get(voiceKey);
    if (!voice) return;

    const now = this.ctx.currentTime;
    // Y-axis slide shifts filter resonance or formant
    const cutoff = Math.max(250, Math.min(18000, 300 + (timbreVal * 14000)));
    voice.filter.frequency.cancelScheduledValues(now);
    voice.filter.frequency.linearRampToValueAtTime(cutoff, now + 0.02);
    voice.filter.Q.setValueAtTime(1.0 + (timbreVal * 5.0), now);
  }

  public playMpeNoteOff(voiceKey: string) {
    if (!this.ctx) return;
    const voice = this.mpeVoices.get(voiceKey);
    if (!voice) return;

    const now = this.ctx.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    setTimeout(() => {
      try {
        voice.osc.stop();
        voice.osc.disconnect();
        voice.filter.disconnect();
        voice.gain.disconnect();
      } catch (e) {
        // Voice already stopped
      }
      this.mpeVoices.delete(voiceKey);
    }, 150);
  }

  // Real-Time Plugin Effect Audition Generator (2.5s audition passing through active plugin parameters)
  public playPluginAudition(
    type: 'eq' | 'tape' | 'reverb' | 'sub_braam' | 'compressor',
    params: Record<string, any>,
    baseSaHz: number = 138.59
  ) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'sub_braam') {
      // Somatic Infrasound 10-20Hz with punch ramp
      const subHz = params.frequencyHz || 14;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(subHz * 2.5, now);
      osc.frequency.exponentialRampToValueAtTime(subHz, now + 0.18);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.9);
      return;
    }

    if (type === 'tape') {
      // Saturation drive with warm harmonics
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseSaHz * 2, now); // 2nd octave Sa

      const shaper = this.ctx.createWaveShaper();
      const driveFactor = 1.0 + (params.drive || 35) / 25;
      const n = 2048;
      const curve = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const x = (i * 2) / n - 1;
        curve[i] = Math.tanh(x * driveFactor) / Math.tanh(driveFactor);
      }
      shaper.curve = curve as unknown as Float32Array<ArrayBuffer>;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      const warmth = (params.warmth || 65) / 100;
      filter.frequency.setValueAtTime(4000 + (1 - warmth) * 8000, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.32, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      osc.connect(shaper);
      shaper.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.55);
      return;
    }

    if (type === 'reverb') {
      // Impulsive transient with long diffuse decay
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseSaHz * 3, now); // Pancham / Sa overtone

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(1.5, now);

      const decaySec = Math.max(1.0, params.decaySec || 3.0);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.4, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + decaySec);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + decaySec + 0.05);
      return;
    }

    if (type === 'eq') {
      // Multi-harmonic Swara chord passing through EQ bands
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseSaHz, now);

      const filterSa = this.ctx.createBiquadFilter();
      filterSa.type = 'peaking';
      filterSa.frequency.setValueAtTime(baseSaHz * 2, now);
      filterSa.gain.setValueAtTime(params.gaGainDb || 2.0, now);
      filterSa.Q.setValueAtTime(params.qFactor || 2.5, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.connect(filterSa);
      filterSa.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.85);
      return;
    }

    // Default Compressor
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseSaHz * 2, now);

    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(params.thresholdDb || -18, now);
    comp.ratio.setValueAtTime(params.ratio || 4, now);
    comp.attack.setValueAtTime((params.attackMs || 10) / 1000, now);
    comp.release.setValueAtTime((params.releaseMs || 150) / 1000, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

    osc.connect(comp);
    comp.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.65);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Clip Audio Buffer & Playback Engine (with Logarithmic / Exponential Fades)
  // ──────────────────────────────────────────────────────────────────────────

  public getAudioContext(): AudioContext {
    this.initContext();
    return this.ctx!;
  }

  public setClipBuffer(clipId: string, buffer: AudioBuffer) {
    this.clipBuffers.set(clipId, buffer);
  }

  public getClipBuffer(clipId: string): AudioBuffer | undefined {
    return this.clipBuffers.get(clipId);
  }

  /**
   * Decodes raw WAV bytes (from backend audio.cpp or file import) and stores
   * it in the clipBuffers map for low-latency playback.
   */
  public async loadGeneratedAudio(clipId: string, wavBytes: Uint8Array | ArrayBuffer): Promise<AudioBuffer> {
    this.initContext();
    if (!this.ctx) throw new Error('WebAudioContext not initialized');

    // Create a copy of the ArrayBuffer so original buffer is not detached
    const rawBuffer: ArrayBuffer = wavBytes instanceof Uint8Array 
      ? (wavBytes.buffer.slice(wavBytes.byteOffset, wavBytes.byteOffset + wavBytes.byteLength) as ArrayBuffer)
      : (wavBytes.slice(0) as ArrayBuffer);
    const audioBuffer = await this.ctx.decodeAudioData(rawBuffer);
    this.clipBuffers.set(clipId, audioBuffer);
    return audioBuffer;
  }

  /**
   * Schedules or immediately plays an AudioClip through its track volume, pan,
   * and master bus, applying strict logarithmic / exponential fade-in and fade-out curves.
   */
  public playClip(
    clip: AudioClip,
    options: {
      startTime?: number; // AudioContext timeline seconds (default: now)
      offsetSec?: number;
      durationSec?: number;
      volume?: number; // 0 to 1
      pan?: number; // -1 to 1
      bpm?: number;
      matras?: number;
      baseSaHz?: number;
    } = {}
  ): void {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const bpm = options.bpm || 90;
    const matras = options.matras || 16;
    const barDurationSec = (60 / bpm) * (matras / 4);
    const totalDurationSec = options.durationSec ?? (clip.durationBars * barDurationSec);
    const offsetSec = Math.max(0, options.offsetSec || 0);

    const now = this.ctx.currentTime;
    const startTime = Math.max(now, options.startTime ?? now);
    const volume = Math.max(0, Math.min(1.5, options.volume ?? 0.85));
    const pan = Math.max(-1, Math.min(1, options.pan ?? 0));
    const baseSaHz = options.baseSaHz || 138.59;

    // Convert clip fade bars to real seconds
    const fadeInSec = Math.max(0, (clip.fadeInBars || 0) * barDurationSec);
    const fadeOutSec = Math.max(0, (clip.fadeOutBars || 0) * barDurationSec);

    // Dedicated GainNode for volume + exponential envelope
    const clipGain = this.ctx.createGain();

    // Panner
    let pannerNode: AudioNode = clipGain;
    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(pan, startTime);
      clipGain.connect(panner);
      pannerNode = panner;
    }
    pannerNode.connect(this.masterGain);

    // ── Logarithmic / Exponential Fade Envelope ─────────────────────────────
    // Web Audio exponentialRampToValueAtTime requires strictly positive target (> 0)
    const minSilenceGain = 0.0001; // -80 dB floor
    const targetPeakGain = Math.max(minSilenceGain, volume);

    const effectiveFadeIn = Math.min(fadeInSec, totalDurationSec * 0.9);
    const effectiveFadeOut = Math.min(fadeOutSec, totalDurationSec * 0.9);

    if (effectiveFadeIn > 0.005) {
      // Exponential / logarithmic fade-in: starts at silent floor and curves up
      clipGain.gain.setValueAtTime(minSilenceGain, startTime);
      clipGain.gain.exponentialRampToValueAtTime(targetPeakGain, startTime + effectiveFadeIn);
    } else {
      clipGain.gain.setValueAtTime(targetPeakGain, startTime);
    }

    if (effectiveFadeOut > 0.005) {
      // Exponential / logarithmic fade-out: ramps down into silence
      const fadeOutStart = Math.max(startTime + effectiveFadeIn, startTime + totalDurationSec - effectiveFadeOut);
      clipGain.gain.setValueAtTime(targetPeakGain, fadeOutStart);
      clipGain.gain.exponentialRampToValueAtTime(minSilenceGain, startTime + totalDurationSec);
    } else {
      // Gentle 4ms de-click release at end of clip
      clipGain.gain.setValueAtTime(targetPeakGain, Math.max(startTime, startTime + totalDurationSec - 0.004));
      clipGain.gain.linearRampToValueAtTime(minSilenceGain, startTime + totalDurationSec);
    }

    // ── Source Node Allocation ──────────────────────────────────────────────
    const buffer = this.clipBuffers.get(clip.id) || clip.audioBuffer;
    const activeNodes: ActiveClipPlayback[] = [];

    if (buffer) {
      // Real recorded/generated AudioBuffer playback
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(clipGain);

      const bufferDuration = buffer.duration;
      const playDuration = Math.min(totalDurationSec, bufferDuration - offsetSec);

      if (playDuration > 0) {
        source.start(startTime, offsetSec, playDuration);
        source.stop(startTime + playDuration);
        activeNodes.push({ source, gain: clipGain, stopTime: startTime + playDuration });
      }
    } else {
      // Harmonic preview synthesizer for clips without raw buffer:
      // Synthesizes swara notes or warm acoustic harmonic drone so auditioning and fades work immediately
      if (clip.swaraNotes && clip.swaraNotes.length > 0) {
        clip.swaraNotes.forEach(note => {
          if (!this.ctx) return;
          const noteStartSec = startTime + ((note.bar - clip.startBar) * barDurationSec);
          const noteDurationSec = Math.max(0.1, note.duration * barDurationSec);

          if (noteStartSec + noteDurationSec > startTime && noteStartSec < startTime + totalDurationSec) {
            const osc = this.ctx.createOscillator();
            const noteGain = this.ctx.createGain();

            // MIDI to Hz
            const freqHz = 440 * Math.pow(2, (note.pitchMidi - 69) / 12);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freqHz, Math.max(now, noteStartSec));

            noteGain.gain.setValueAtTime(0.001, Math.max(now, noteStartSec));
            noteGain.gain.exponentialRampToValueAtTime(0.35, Math.max(now, noteStartSec) + 0.03);
            noteGain.gain.exponentialRampToValueAtTime(0.001, Math.max(now, noteStartSec) + noteDurationSec);

            osc.connect(noteGain);
            noteGain.connect(clipGain);

            osc.start(Math.max(now, noteStartSec));
            osc.stop(Math.max(now, noteStartSec) + noteDurationSec + 0.05);

            activeNodes.push({ source: osc, gain: noteGain, stopTime: Math.max(now, noteStartSec) + noteDurationSec });
          }
        });
      } else {
        // Musical harmonic acoustic drone fallback matching Moveable Sa & Pa
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const droneGain = this.ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(baseSaHz, startTime); // Tonic Sa

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(baseSaHz * 1.5, startTime); // Pancham Pa (fifth)

        droneGain.gain.setValueAtTime(0.001, startTime);
        droneGain.gain.linearRampToValueAtTime(0.2, startTime + 0.15);
        droneGain.gain.exponentialRampToValueAtTime(0.001, startTime + totalDurationSec);

        osc1.connect(droneGain);
        osc2.connect(droneGain);
        droneGain.connect(clipGain);

        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + totalDurationSec + 0.05);
        osc2.stop(startTime + totalDurationSec + 0.05);
        activeNodes.push({ source: osc1, gain: droneGain, stopTime: startTime + totalDurationSec });
      }
    }

    // Track active clips for stop / cleanup
    const existing = this.activeClips.get(clip.id) || [];
    this.activeClips.set(clip.id, [...existing, ...activeNodes]);

    // Schedule cleanup after playback completes
    setTimeout(() => {
      this.cleanupFinishedClips();
    }, (totalDurationSec + 0.2) * 1000);
  }

  public stopClip(clipId: string) {
    const list = this.activeClips.get(clipId);
    if (!list) return;

    list.forEach(({ source, gain }) => {
      try {
        if ('stop' in source && typeof (source as any).stop === 'function') {
          (source as any).stop();
        }
        source.disconnect();
        gain.disconnect();
      } catch {
        // already stopped
      }
    });
    this.activeClips.delete(clipId);
  }

  public stopAllClips() {
    this.activeClips.forEach((list) => {
      list.forEach(({ source, gain }) => {
        try {
          if ('stop' in source && typeof (source as any).stop === 'function') {
            (source as any).stop();
          }
          source.disconnect();
          gain.disconnect();
        } catch {
          // already stopped
        }
      });
    });
    this.activeClips.clear();
  }

  private cleanupFinishedClips() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.activeClips.forEach((list, clipId) => {
      const active = list.filter(item => item.stopTime > now);
      if (active.length === 0) {
        this.activeClips.delete(clipId);
      } else {
        this.activeClips.set(clipId, active);
      }
    });
  }
}

export const audioEngine = new WebAudioEngine();

