// High-Resolution Web Audio Engine for Nādabrahma DAW
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
}

export const audioEngine = new WebAudioEngine();
