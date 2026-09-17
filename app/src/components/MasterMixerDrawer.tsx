import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Sliders, Volume2, Waves, Compass, Activity, Download, ShieldCheck, Sparkles, Disc, Scissors, Maximize2, Play
} from 'lucide-react';
import { audioEngine } from '../lib/webAudioEngine';
import { Track, SpatialCoordinates } from '../types/daw';

interface MasterMixerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isPlaying: boolean;
  busGroups: ('Vocals' | 'Acoustics' | 'Percussion' | 'Orchestral' | 'Cinematic FX')[];
  onOpenStemForge?: () => void;
  onOpenSpatialAudio?: () => void;
  tracks?: Track[];
  onUpdateTrackSpatial?: (trackId: string, spatial: SpatialCoordinates) => void;
  onOpenPlugins?: (trackId?: string) => void;
}

export const MasterMixerDrawer: React.FC<MasterMixerDrawerProps> = ({
  isOpen,
  onClose,
  isPlaying,
  busGroups,
  onOpenStemForge,
  onOpenSpatialAudio,
  tracks = [],
  onUpdateTrackSpatial,
  onOpenPlugins
}) => {
  // Quick Master parameters
  const [punch, setPunch] = useState(45);
  const [air, setAir] = useState(65);
  const [drive, setDrive] = useState(30);
  const [ceiling, setCeiling] = useState(-0.3);
  const [lufsTarget, setLufsTarget] = useState<'-14' | '-9' | '-24'>('-14');
  const [extendedSpectrumActive, setExtendedSpectrumActive] = useState(true);

  // The Owl 3D Spatializer coordinates
  const [spatialX, setSpatialX] = useState(0); // -1 (Left) to +1 (Right)
  const [spatialY, setSpatialY] = useState(0); // -1 (Rear) to +1 (Front)
  const [spatialElevation, setSpatialElevation] = useState(15); // degrees
  const padRef = useRef<HTMLDivElement>(null);

  // Bus Faders
  const [busVolumes, setBusVolumes] = useState<{ [key: string]: number }>({
    Vocals: 0.85,
    Acoustics: 0.80,
    Percussion: 0.90,
    Orchestral: 0.75,
    'Cinematic FX': 0.80
  });

  // Simulated live meter levels
  const [meterL, setMeterL] = useState(-18);
  const [meterR, setMeterR] = useState(-19);
  const [currentLufs, setCurrentLufs] = useState(-14.2);
  const [correlation, setCorrelation] = useState(0.92);

  // Animation frame for simulated metering when playing
  useEffect(() => {
    if (!isPlaying) {
      setMeterL(-60);
      setMeterR(-60);
      return;
    }

    let animId: number;
    const updateMeters = () => {
      const wobbleL = -14 + Math.random() * 6 - 3;
      const wobbleR = -14.5 + Math.random() * 6 - 3;
      setMeterL(wobbleL);
      setMeterR(wobbleR);
      setCurrentLufs(-14.0 + (Math.random() * 0.6 - 0.3));
      setCorrelation(0.88 + Math.random() * 0.08);
      animId = requestAnimationFrame(updateMeters);
    };

    animId = requestAnimationFrame(updateMeters);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  if (!isOpen) return null;

  const handlePadPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1 || !padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    setSpatialX(Math.max(-1, Math.min(1, x)));
    setSpatialY(Math.max(-1, Math.min(1, y)));
  };

  const handlePadPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    setSpatialX(Math.max(-1, Math.min(1, x)));
    setSpatialY(Math.max(-1, Math.min(1, y)));
  };

  const handleExport = (format: 'wav_96k' | 'wav_48k' | 'flac' | 'stems') => {
    alert(`Exporting Master in ${format.toUpperCase()} with 96kHz Extended Spectrum (10Hz - 48,000Hz). Zero aliasing, 32-bit float rendering.`);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-[#090d16] border-l border-amber-500/30 shadow-2xl shadow-black flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-amber-950/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">Mastering & 3D Spatial Suite</h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] border border-cyan-500/30">
                96 kHz / 32-bit Float
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              theDAW mastering engine & The Owl HRTF 3D binaural positioning
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs font-sans">
        
        {/* Section 1: Quick Master Knobs (Punch, Air, Drive, Ceiling) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Quick Master Macros
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono">LUFS Target:</span>
              {(['-14', '-9', '-24'] as const).map(target => (
                <button
                  key={target}
                  onClick={() => setLufsTarget(target)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                    lufsTarget === target
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {target} dB
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center">
            
            {/* Punch */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col items-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Punch</span>
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-amber-400"
                    strokeDasharray={`${punch}, 100`}
                    strokeWidth="3"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-mono text-xs font-bold text-amber-300">{punch}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={punch}
                onChange={(e) => setPunch(parseInt(e.target.value))}
                className="w-full mt-2 accent-amber-500 cursor-pointer h-1"
              />
              <span className="text-[9px] text-slate-500 mt-1">Transient attack</span>
            </div>

            {/* Air (Extended Spectrum) */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col items-center">
              <span className="text-[10px] uppercase font-semibold text-cyan-400 mb-1">Air (20k-48k)</span>
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-cyan-400"
                    strokeDasharray={`${air}, 100`}
                    strokeWidth="3"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-mono text-xs font-bold text-cyan-300">{air}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={air}
                onChange={(e) => setAir(parseInt(e.target.value))}
                className="w-full mt-2 accent-cyan-400 cursor-pointer h-1"
              />
              <span className="text-[9px] text-slate-500 mt-1">Hypersonic sheen</span>
            </div>

            {/* Drive */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col items-center">
              <span className="text-[10px] uppercase font-semibold text-orange-400 mb-1">Drive</span>
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-orange-400"
                    strokeDasharray={`${drive}, 100`}
                    strokeWidth="3"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-mono text-xs font-bold text-orange-300">{drive}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={drive}
                onChange={(e) => setDrive(parseInt(e.target.value))}
                className="w-full mt-2 accent-orange-400 cursor-pointer h-1"
              />
              <span className="text-[9px] text-slate-500 mt-1">Analog tape/tube</span>
            </div>

            {/* Ceiling */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col items-center">
              <span className="text-[10px] uppercase font-semibold text-emerald-400 mb-1">Ceiling</span>
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-400"
                    strokeDasharray="90, 100"
                    strokeWidth="3"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-mono text-xs font-bold text-emerald-300">{ceiling} dB</span>
              </div>
              <input
                type="range"
                min="-2.0"
                max="-0.1"
                step="0.1"
                value={ceiling}
                onChange={(e) => setCeiling(parseFloat(e.target.value))}
                className="w-full mt-2 accent-emerald-400 cursor-pointer h-1"
              />
              <span className="text-[9px] text-slate-500 mt-1">True peak limit</span>
            </div>
          </div>
        </div>

        {/* Section 2: Extended Spectrum (10 Hz - 48,000 Hz) Real-Time Visualizer */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400" /> Extended Spectrum (10 Hz – 48,000 Hz)
            </h3>
            <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              96kHz Native Sampling
            </span>
          </div>

          <div className="h-20 bg-slate-950 rounded-xl border border-slate-800 p-2 relative flex items-end justify-between overflow-hidden">
            {/* Infrasound Somatic Band Indicator */}
            <div className="absolute top-1 left-2 text-[9px] font-mono text-purple-400 flex items-center gap-1">
              <span>◄ 10-20 Hz (Somatic Sub)</span>
            </div>
            
            {/* Human Hearing 20Hz - 20kHz */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-500">
              Human Audible Range (20 Hz - 20,000 Hz)
            </div>

            {/* Hypersonic Air Band Indicator */}
            <div className="absolute top-1 right-2 text-[9px] font-mono text-cyan-400 flex items-center gap-1">
              <span>20k - 48k Hz (Hypersonic Air) ►</span>
            </div>

            {/* Frequency bars mock */}
            {Array.from({ length: 48 }).map((_, i) => {
              const isInfra = i < 4;
              const isHypersonic = i > 38;
              let heightPct = 20 + Math.sin(i * 0.3) * 30 + Math.random() * (isPlaying ? 35 : 5);
              if (!isPlaying) heightPct = 8;
              return (
                <div
                  key={i}
                  className={`w-1.5 rounded-t transition-all duration-75 ${
                    isInfra
                      ? 'bg-purple-500/80 shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                      : isHypersonic
                      ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]'
                      : 'bg-amber-400/60'
                  }`}
                  style={{ height: `${Math.min(95, Math.max(8, heightPct))}%` }}
                />
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span className="text-purple-400 font-mono">10 Hz</span>
            <span className="font-mono">100 Hz</span>
            <span className="font-mono">1 kHz</span>
            <span className="font-mono">10 kHz</span>
            <span className="font-mono">20 kHz</span>
            <span className="text-cyan-400 font-mono">48 kHz</span>
          </div>
        </div>

        {/* Section 3: The Owl 3D Spatializer & Binaural HRTF Pad */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-amber-400" /> The Owl 3D Spatializer (HRTF Binaural)
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                X: {spatialX.toFixed(2)} | Y: {spatialY.toFixed(2)} | Elev: {spatialElevation}°
              </span>
            </div>

            {onOpenSpatialAudio && (
              <button
                onClick={onOpenSpatialAudio}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-[0_0_8px_rgba(245,158,11,0.2)]"
              >
                <Maximize2 className="w-3 h-3 text-amber-400" />
                <span>Open 3D Radar & Ambisonics Suite</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            
            {/* 2D XY Soundstage Radar Pad */}
            <div
              ref={padRef}
              onPointerDown={handlePadPointerDown}
              onPointerMove={handlePadPointerMove}
              className="w-full h-44 bg-slate-950 rounded-xl border border-slate-800 relative cursor-crosshair overflow-hidden touch-none flex items-center justify-center select-none group"
            >
              {/* Radar Rings */}
              <div className="absolute w-36 h-36 rounded-full border border-slate-800/80"></div>
              <div className="absolute w-24 h-24 rounded-full border border-slate-800/80"></div>
              <div className="absolute w-12 h-12 rounded-full border border-slate-800/80"></div>
              
              {/* Axis cross */}
              <div className="absolute inset-x-0 top-1/2 h-px bg-slate-800"></div>
              <div className="absolute inset-y-0 left-1/2 w-px bg-slate-800"></div>

              {/* Labels */}
              <span className="absolute top-1 font-mono text-[9px] text-slate-500">FRONT (Center)</span>
              <span className="absolute bottom-1 font-mono text-[9px] text-slate-500">REAR</span>
              <span className="absolute left-2 font-mono text-[9px] text-slate-500">L</span>
              <span className="absolute right-2 font-mono text-[9px] text-slate-500">R</span>

              {/* Listener Node in Center */}
              <div className="w-3 h-3 rounded-full bg-slate-400 border-2 border-slate-900 z-10"></div>

              {/* Sound Source Puck */}
              <div
                className="absolute w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow-lg shadow-amber-500/50 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
                style={{
                  left: `${((spatialX + 1) / 2) * 100}%`,
                  top: `${((-spatialY + 1) / 2) * 100}%`
                }}
              >
                <span className="text-[8px] font-bold text-slate-950">3D</span>
              </div>
            </div>

            {/* Spatial Positioning Controls */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-300 font-medium mb-1">
                  Elevation Angle ({spatialElevation}°)
                </label>
                <input
                  type="range"
                  min="-45"
                  max="90"
                  value={spatialElevation}
                  onChange={(e) => setSpatialElevation(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
                  <span>-45° (Floor)</span>
                  <span>0° (Ear Level)</span>
                  <span>+90° (Overhead)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const az = Math.round((Math.atan2(spatialX, spatialY) * 180) / Math.PI);
                    const dist = Math.sqrt(spatialX * spatialX + spatialY * spatialY) * 3.0 + 1.0;
                    audioEngine.playSpatialTrackPreview(az, spatialElevation, dist, 220, 'warm_string', 0.8);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Audition 3D HRTF</span>
                </button>

                {onOpenSpatialAudio && (
                  <button
                    onClick={onOpenSpatialAudio}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all"
                  >
                    <span>Stage All Tracks</span>
                  </button>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                <span className="text-amber-300 font-semibold">Head-Related Transfer Function (HRTF)</span> models microsecond interaural time delays and pinna filtering for binaural 3D headphone staging.
              </div>
            </div>

          </div>
        </div>

        {/* Section 4: Live Master Metering */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Stereo True-Peak & LUFS Metering
          </h3>

          <div className="grid grid-cols-3 gap-4">
            
            {/* L / R Bars */}
            <div className="col-span-2 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-4 font-mono text-[10px] text-slate-400">L</span>
                <div className="flex-1 h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all duration-75"
                    style={{ width: `${Math.min(100, Math.max(0, (meterL + 60) * 1.66))}%` }}
                  />
                </div>
                <span className="w-12 font-mono text-[10px] text-right text-slate-300">
                  {meterL.toFixed(1)} dB
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-4 font-mono text-[10px] text-slate-400">R</span>
                <div className="flex-1 h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all duration-75"
                    style={{ width: `${Math.min(100, Math.max(0, (meterR + 60) * 1.66))}%` }}
                  />
                </div>
                <span className="w-12 font-mono text-[10px] text-right text-slate-300">
                  {meterR.toFixed(1)} dB
                </span>
              </div>
            </div>

            {/* Readouts */}
            <div className="flex items-center justify-around bg-slate-950 rounded-xl border border-slate-800/80 p-2">
              <div className="text-center">
                <div className="text-[10px] text-slate-400 font-mono">Integrated</div>
                <div className="text-xs font-mono font-bold text-amber-400">
                  {currentLufs.toFixed(1)} LUFS
                </div>
              </div>
              <div className="w-px h-6 bg-slate-800"></div>
              <div className="text-center">
                <div className="text-[10px] text-slate-400 font-mono">Correlation</div>
                <div className="text-xs font-mono font-bold text-emerald-400">
                  +{correlation.toFixed(2)}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Section 5: Export Actions */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-2">
            <Download className="w-3.5 h-3.5 text-amber-400" /> Export High-Fidelity Audio
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleExport('wav_96k')}
              className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 text-amber-200 flex flex-col items-center text-center transition-all group"
            >
              <Disc className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform text-amber-400" />
              <span className="font-bold text-xs">96kHz 32-bit</span>
              <span className="text-[10px] text-amber-400/80 mt-0.5">Extended Spectrum</span>
            </button>

            <button
              onClick={() => handleExport('wav_48k')}
              className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-800 text-slate-200 flex flex-col items-center text-center transition-all group"
            >
              <Disc className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform text-slate-400" />
              <span className="font-bold text-xs">48kHz 24-bit</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Standard Master</span>
            </button>

            <button
              onClick={() => handleExport('flac')}
              className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-800 text-slate-200 flex flex-col items-center text-center transition-all group"
            >
              <Disc className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform text-slate-400" />
              <span className="font-bold text-xs">Hi-Res FLAC</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Lossless Audio</span>
            </button>

            <button
              onClick={() => handleExport('stems')}
              className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 hover:bg-cyan-500/25 text-cyan-200 flex flex-col items-center text-center transition-all group"
            >
              <Disc className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform text-cyan-400" />
              <span className="font-bold text-xs">All Stems ZIP</span>
              <span className="text-[10px] text-cyan-400/80 mt-0.5">De-bleeded Tracks</span>
            </button>
          </div>

          {onOpenPlugins && (
            <button
              onClick={() => {
                onClose();
                onOpenPlugins();
              }}
              className="w-full mt-3 p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-500/40 hover:bg-indigo-900/70 text-indigo-200 flex items-center justify-center gap-2 transition-all cursor-pointer font-medium text-xs shadow-sm active:scale-95"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>🎛️ Master Bus Audio Plugin Rack (NādaEQ, Tape Saturator, Mandir Reverb)</span>
            </button>
          )}

          {onOpenStemForge && (
            <button
              onClick={() => {
                onClose();
                onOpenStemForge();
              }}
              className="w-full mt-3 p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900/70 text-cyan-200 flex items-center justify-center gap-2 transition-all cursor-pointer font-medium text-xs shadow-sm active:scale-95"
            >
              <Scissors className="w-3.5 h-3.5 text-cyan-400" />
              <span>Open StemForge AI Separation & Broadcast WAV (iXML/bext) Exporter</span>
            </button>
          )}
        </div>

      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>M1 Max 32GB Native audio.cpp acceleration ready</span>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
        >
          Close Drawer
        </button>
      </div>

    </div>
  );
};
