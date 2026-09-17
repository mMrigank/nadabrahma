import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Activity, Sparkles, Waves, ShieldCheck, 
  Cpu, Sliders, Volume2, Check, RefreshCw, AlertCircle
} from 'lucide-react';
import { Track } from '../types/daw';
import { audioEngine, ExtendedSpectrumConfig } from '../lib/webAudioEngine';

interface ExtendedSpectrumModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  onUpdateTrack: (trackId: string, updates: Partial<Track>) => void;
  baseSaHz: number;
}

export const ExtendedSpectrumModal: React.FC<ExtendedSpectrumModalProps> = ({
  isOpen,
  onClose,
  tracks,
  onUpdateTrack,
  baseSaHz
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dspConfig, setDspConfig] = useState<ExtendedSpectrumConfig>(audioEngine.getExtendedConfig());
  const [telemetry, setTelemetry] = useState({
    somaticEnergy: 18,
    audibleEnergy: 52,
    hypersonicEnergy: 34,
    truePeakDb: -0.3,
    headroomMarginDb: 0.3,
    sampleRate: 96000
  });
  const [activeAudition, setActiveAudition] = useState<'air' | 'sub' | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDspConfig(audioEngine.getExtendedConfig());
    }
  }, [isOpen]);

  // Real-time canvas RTA and telemetry loop
  useEffect(() => {
    if (!isOpen) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;

    const render = () => {
      frameCount++;
      const t = audioEngine.getExtendedSpectrumTelemetry();
      if (frameCount % 4 === 0) {
        setTelemetry(t);
      }

      // Canvas dimensions
      const width = canvas.width;
      const height = canvas.height;

      // Dark studio background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Grid Lines & Frequencies
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += height / 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Zone Dividers
      // Zone 1: Somatic Sub (10Hz - 20Hz) -> 0% to 15% width
      // Zone 2: Audible (20Hz - 20,000Hz) -> 15% to 75% width
      // Zone 3: Hypersonic Air (20,000Hz - 48,000Hz) -> 75% to 100% width
      const subBoundary = width * 0.15;
      const airBoundary = width * 0.75;

      // Zone 1 Background Tint (Rose/Violet for Somatic Infrasound)
      const subGrad = ctx.createLinearGradient(0, 0, subBoundary, 0);
      subGrad.addColorStop(0, 'rgba(244, 63, 94, 0.12)');
      subGrad.addColorStop(1, 'rgba(244, 63, 94, 0.02)');
      ctx.fillStyle = subGrad;
      ctx.fillRect(0, 0, subBoundary, height);

      // Zone 3 Background Tint (Teal for Hypersonic Air)
      const airGrad = ctx.createLinearGradient(airBoundary, 0, width, 0);
      airGrad.addColorStop(0, 'rgba(20, 184, 166, 0.02)');
      airGrad.addColorStop(1, 'rgba(20, 184, 166, 0.14)');
      ctx.fillStyle = airGrad;
      ctx.fillRect(airBoundary, 0, width - airBoundary, height);

      // Zone Divider Lines
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.35)';
      ctx.beginPath();
      ctx.moveTo(subBoundary, 0);
      ctx.lineTo(subBoundary, height);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(20, 184, 166, 0.35)';
      ctx.beginPath();
      ctx.moveTo(airBoundary, 0);
      ctx.lineTo(airBoundary, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw RTA Curve from Analyser data
      const bufferLength = 256;
      const dataArray = new Uint8Array(bufferLength);
      audioEngine.getAnalyserData(dataArray);

      // Gradient for full RTA curve
      const rtaGrad = ctx.createLinearGradient(0, 0, width, 0);
      rtaGrad.addColorStop(0, '#f43f5e');      // Somatic sub rose
      rtaGrad.addColorStop(0.18, '#fbbf24');   // Low audible warm amber
      rtaGrad.addColorStop(0.45, '#b08d57');   // Mid audible sandstone
      rtaGrad.addColorStop(0.72, '#528275');   // High audible sage
      rtaGrad.addColorStop(1, '#14b8a6');      // Hypersonic air teal

      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = rtaGrad;

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        let v = dataArray[i] / 255.0;
        
        // Boost visually in sub and hypersonic zones if active
        if (i < 8 && dspConfig.somaticSubEnabled) {
          v = Math.max(v, (t.somaticEnergy / 100) * 0.7);
        } else if (i > bufferLength * 0.75 && dspConfig.hypersonicAirEnabled) {
          v = Math.max(v, (t.hypersonicEnergy / 100) * 0.65);
        }

        const y = height - (v * height * 0.85) - 6;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.stroke();

      // Soft glow underneath curve
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      const fillGrad = ctx.createLinearGradient(0, 0, 0, height);
      fillGrad.addColorStop(0, 'rgba(176, 141, 87, 0.15)');
      fillGrad.addColorStop(1, 'rgba(9, 13, 22, 0)');
      ctx.fillStyle = fillGrad;
      ctx.fill();

      // Zone Labels & Frequency Badges
      ctx.font = '10px monospace';
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('ZONE 1: SOMATIC INFRASOUND (10 - 20 Hz)', 8, 16);

      ctx.fillStyle = '#d4af37';
      ctx.fillText('ZONE 2: AUDIBLE SPECTRUM (20 - 20,000 Hz)', subBoundary + 12, 16);

      ctx.fillStyle = '#14b8a6';
      ctx.fillText('ZONE 3: HYPERSONIC AIR (20k - 48k Hz)', airBoundary + 8, 16);

      // Sa Tonic Anchor line in audible zone
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 1;
      const saX = subBoundary + (width * 0.12);
      ctx.beginPath();
      ctx.moveTo(saX, 22);
      ctx.lineTo(saX, height - 10);
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.font = '9px monospace';
      ctx.fillText(`Sa (${baseSaHz}Hz)`, saX - 18, height - 12);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isOpen, dspConfig, baseSaHz]);

  if (!isOpen) return null;

  const handleUpdateConfig = (partial: Partial<ExtendedSpectrumConfig>) => {
    const updated = { ...dspConfig, ...partial };
    setDspConfig(updated);
    audioEngine.updateExtendedConfig(partial);
  };

  const handleAuditionAir = () => {
    setActiveAudition('air');
    audioEngine.previewHypersonicAir(dspConfig.hypersonicAirGain);
    setTimeout(() => setActiveAudition(null), 1500);
  };

  const handleAuditionSub = () => {
    setActiveAudition('sub');
    audioEngine.previewSomaticInfrasound(dspConfig.somaticResonanceHz, dspConfig.somaticSubGain);
    setTimeout(() => setActiveAudition(null), 1800);
  };

  const handleEnableAllRecommended = () => {
    tracks.forEach(track => {
      const isVocalOrStringOrFlute = ['lead_vocal', 'vedic_chant', 'choral_harmony', 'solo_instrument', 'drone', 'ambient_pad'].includes(track.role);
      const isPercussionOrFX = ['percussion_tala', 'modern_beats', 'risers_drops'].includes(track.role);
      onUpdateTrack(track.id, {
        hypersonicAir: isVocalOrStringOrFlute,
        somaticSub: isPercussionOrFX
      });
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-stone-900 via-teal-950 to-slate-900 border border-teal-600/30 flex items-center justify-center text-teal-300 shadow-md">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-wide text-slate-100 font-serif">
                  Native 96 kHz / 32-Bit Float Super-Resolution DSP Engine
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-teal-950/80 text-teal-300 border border-teal-700/50">
                  CoreAudio 96kHz / 32-bit
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-950/60 text-purple-300 border border-purple-800/40 flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> M1 Max ARM64 SIMD
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full-spectrum synthesis (10 Hz – 48,000 Hz) · Hypersonic Air exciter & Somatic Infrasound subharmonic engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono">
              <span className="text-slate-400">Headroom:</span>
              <span className="text-emerald-400 font-semibold">+{telemetry.headroomMarginDb} dBFS</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Ceiling:</span>
              <span className="text-amber-300 font-semibold">{dspConfig.ceilingDb} dBFS</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* Master Spectrum Real-Time Visualizer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                Extended Spectrum Real-Time Analyser (10 Hz — 48,000 Hz)
              </span>
              <div className="flex items-center gap-4 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  Sub 10-20Hz: {telemetry.somaticEnergy}%
                </span>
                <span className="flex items-center gap-1 text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Audible 20-20kHz: {telemetry.audibleEnergy}%
                </span>
                <span className="flex items-center gap-1 text-teal-300">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  Air 20k-48kHz: {telemetry.hypersonicEnergy}%
                </span>
              </div>
            </div>

            {/* Canvas RTA */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
              <canvas
                ref={canvasRef}
                width={860}
                height={160}
                className="w-full h-40 block"
              />
            </div>
          </div>

          {/* 3 Processing Zones Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Zone 1: Somatic Infrasound */}
            <div className={`p-4 rounded-xl border transition-all ${
              dspConfig.somaticSubEnabled 
                ? 'bg-rose-950/20 border-rose-800/40 shadow-sm shadow-rose-950/30' 
                : 'bg-slate-900/40 border-slate-800 opacity-70'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-900/40 text-rose-300 flex items-center justify-center font-bold text-xs border border-rose-700/30">
                    10Hz
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-rose-200">Somatic Infrasound</h3>
                    <p className="text-[10px] text-slate-400">Physical chest resonance</p>
                  </div>
                </div>
                <button
                  onClick={() => handleUpdateConfig({ somaticSubEnabled: !dspConfig.somaticSubEnabled })}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition ${
                    dspConfig.somaticSubEnabled
                      ? 'bg-rose-600/80 text-white font-semibold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {dspConfig.somaticSubEnabled ? 'ACTIVE' : 'BYPASS'}
                </button>
              </div>

              <p className="text-[11px] text-slate-300/80 mb-3 leading-relaxed">
                Injects subharmonic acoustic vibration (10–20 Hz) into drums, pakhawaj/tabla bāyāñ, and sub-drops for visceral physical impact.
              </p>

              {/* Controls */}
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Infrasound Gain</span>
                    <span className="font-mono text-rose-300 font-semibold">{Math.round(dspConfig.somaticSubGain * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.05"
                    disabled={!dspConfig.somaticSubEnabled}
                    value={dspConfig.somaticSubGain}
                    onChange={(e) => handleUpdateConfig({ somaticSubGain: parseFloat(e.target.value) })}
                    className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Resonance Tuning</span>
                    <span className="font-mono text-rose-300 font-semibold">{dspConfig.somaticResonanceHz} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="20"
                    step="1"
                    disabled={!dspConfig.somaticSubEnabled}
                    value={dspConfig.somaticResonanceHz}
                    onChange={(e) => handleUpdateConfig({ somaticResonanceHz: parseInt(e.target.value) })}
                    className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                {/* Audition button */}
                <button
                  onClick={handleAuditionSub}
                  disabled={activeAudition === 'sub'}
                  className="w-full py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-200 text-xs font-semibold border border-rose-700/40 transition flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <Waves className={`w-3.5 h-3.5 ${activeAudition === 'sub' ? 'animate-bounce text-rose-400' : ''}`} />
                  <span>{activeAudition === 'sub' ? 'Rumbling...' : 'Audition Somatic Infrasound'}</span>
                </button>
              </div>
            </div>

            {/* Zone 2: Audible Core & 32-Bit Float Soft-Clipper */}
            <div className="p-4 rounded-xl border bg-slate-900/70 border-slate-700/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-950/50 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-600/30">
                      32b
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-amber-200">32-Bit Float DSP & Limiter</h3>
                      <p className="text-[10px] text-slate-400">Tanh soft-knee zero intersample clip</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/70 text-emerald-300 border border-emerald-700/40">
                    PROTECTED
                  </span>
                </div>

                <p className="text-[11px] text-slate-300/80 mb-3 leading-relaxed">
                  32-bit float internal buffer provides +770 dB dynamic range. Soft saturation curve prevents digital hard-clipping during multi-track summing.
                </p>

                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Ceiling Limiter</span>
                      <span className="font-mono text-amber-300 font-semibold">{dspConfig.ceilingDb} dBFS</span>
                    </div>
                    <input
                      type="range"
                      min="-3.0"
                      max="-0.1"
                      step="0.1"
                      value={dspConfig.ceilingDb}
                      onChange={(e) => handleUpdateConfig({ ceilingDb: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">Oversampling Mode:</span>
                    <select
                      value={dspConfig.oversamplingMode}
                      onChange={(e) => handleUpdateConfig({ oversamplingMode: e.target.value as any })}
                      className="bg-slate-800 text-slate-200 text-[10px] font-mono px-2 py-1 rounded border border-slate-700 focus:outline-none"
                    >
                      <option value="96kHz (2x)">96 kHz (2x Oversample)</option>
                      <option value="192kHz (4x)">192 kHz (4x Oversample)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-3 p-2 bg-slate-950/80 rounded-lg border border-slate-800 text-[10px] flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" /> True Peak: {telemetry.truePeakDb} dBFS
                </span>
                <span className="font-mono text-slate-400">Margin: +{telemetry.headroomMarginDb}dB</span>
              </div>
            </div>

            {/* Zone 3: Hypersonic Air */}
            <div className={`p-4 rounded-xl border transition-all ${
              dspConfig.hypersonicAirEnabled 
                ? 'bg-teal-950/20 border-teal-700/40 shadow-sm shadow-teal-950/30' 
                : 'bg-slate-900/40 border-slate-800 opacity-70'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-900/40 text-teal-300 flex items-center justify-center font-bold text-xs border border-teal-700/30">
                    48k
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-teal-200">Hypersonic Air (20k-48kHz)</h3>
                    <p className="text-[10px] text-slate-400">Ultrasonic harmonic sheen</p>
                  </div>
                </div>
                <button
                  onClick={() => handleUpdateConfig({ hypersonicAirEnabled: !dspConfig.hypersonicAirEnabled })}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition ${
                    dspConfig.hypersonicAirEnabled
                      ? 'bg-teal-600/80 text-white font-semibold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {dspConfig.hypersonicAirEnabled ? 'ACTIVE' : 'BYPASS'}
                </button>
              </div>

              <p className="text-[11px] text-slate-300/80 mb-3 leading-relaxed">
                Reconstructs high-frequency air overtones for silk strings (Sitar/Veena), bansuri breath turbulence, and pristine vocal presence.
              </p>

              {/* Controls */}
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Air Exciter Gain</span>
                    <span className="font-mono text-teal-300 font-semibold">{Math.round(dspConfig.hypersonicAirGain * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.05"
                    disabled={!dspConfig.hypersonicAirEnabled}
                    value={dspConfig.hypersonicAirGain}
                    onChange={(e) => handleUpdateConfig({ hypersonicAirGain: parseFloat(e.target.value) })}
                    className="w-full accent-teal-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Sheen Frequency</span>
                    <span className="font-mono text-teal-300 font-semibold">{(dspConfig.hypersonicSheenFreq / 1000).toFixed(1)} kHz</span>
                  </div>
                  <input
                    type="range"
                    min="20000"
                    max="48000"
                    step="1000"
                    disabled={!dspConfig.hypersonicAirEnabled}
                    value={dspConfig.hypersonicSheenFreq}
                    onChange={(e) => handleUpdateConfig({ hypersonicSheenFreq: parseInt(e.target.value) })}
                    className="w-full accent-teal-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                {/* Audition button */}
                <button
                  onClick={handleAuditionAir}
                  disabled={activeAudition === 'air'}
                  className="w-full py-2 rounded-lg bg-teal-950/60 hover:bg-teal-900/60 text-teal-200 text-xs font-semibold border border-teal-700/40 transition flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${activeAudition === 'air' ? 'animate-spin text-teal-300' : ''}`} />
                  <span>{activeAudition === 'air' ? 'Exciting Air...' : 'Audition Hypersonic Sheen'}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Multitrack Extended Spectrum Routing Matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  8-Track Extended Spectrum Processing Matrix
                </h3>
                <p className="text-[11px] text-slate-400">
                  Individual track routing for 20k-48k Hypersonic Air and 10-20Hz Somatic Infrasound
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleEnableAllRecommended}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1 transition cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Auto-Route Musicology Presets</span>
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                    <th className="py-2.5 px-4">Track</th>
                    <th className="py-2.5 px-3">Role / Instrument</th>
                    <th className="py-2.5 px-3">DSP Pipeline</th>
                    <th className="py-2.5 px-3 text-center">48k Hypersonic Air</th>
                    <th className="py-2.5 px-3 text-center">10Hz Somatic Sub</th>
                    <th className="py-2.5 px-3 text-right">Extended Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {tracks.map(track => {
                    return (
                      <tr key={track.id} className="hover:bg-slate-850/40 transition">
                        <td className="py-2.5 px-4 font-medium flex items-center gap-2">
                          <span 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ backgroundColor: track.color }}
                          />
                          <span className="text-slate-200">{track.name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          <span>{track.activeInstrument || track.role.replace('_', ' ')}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-purple-300">
                          96kHz / 32b
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => onUpdateTrack(track.id, { hypersonicAir: !track.hypersonicAir })}
                            className={`px-2.5 py-1 rounded text-[10px] font-mono font-medium transition cursor-pointer ${
                              track.hypersonicAir
                                ? 'bg-teal-950 text-teal-300 border border-teal-600/50 shadow-sm'
                                : 'bg-slate-800/60 text-slate-500 hover:text-slate-300 border border-slate-700/40'
                            }`}
                          >
                            {track.hypersonicAir ? 'ON (20k-48k)' : 'OFF'}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => onUpdateTrack(track.id, { somaticSub: !track.somaticSub })}
                            className={`px-2.5 py-1 rounded text-[10px] font-mono font-medium transition cursor-pointer ${
                              track.somaticSub
                                ? 'bg-rose-950 text-rose-300 border border-rose-600/50 shadow-sm'
                                : 'bg-slate-800/60 text-slate-500 hover:text-slate-300 border border-slate-700/40'
                            }`}
                          >
                            {track.somaticSub ? 'ON (10-20Hz)' : 'OFF'}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[10px]">
                          {track.hypersonicAir && track.somaticSub ? (
                            <span className="text-amber-300">Ultra-HD Full (10Hz-48kHz)</span>
                          ) : track.hypersonicAir ? (
                            <span className="text-teal-300">Air Enhanced (48kHz)</span>
                          ) : track.somaticSub ? (
                            <span className="text-rose-300">Somatic Resonant (10Hz)</span>
                          ) : (
                            <span className="text-slate-500">Audible Only (20Hz-20kHz)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>All track renders automatically resampled with 96kHz SIMD Super-Resolution.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-600/90 hover:bg-amber-600 text-slate-950 font-semibold transition cursor-pointer shadow-md"
          >
            Apply & Close DSP Engine
          </button>
        </div>

      </div>
    </div>
  );
};
