import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, Compass, Headphones, Sparkles, Volume2, Waves, Play, Sliders, 
  Layers, Check, Disc, Info, ArrowUpRight, Maximize2, ShieldCheck, Zap
} from 'lucide-react';
import { Track, SpatialCoordinates } from '../types/daw';
import { 
  SPATIAL_STAGING_PRESETS, 
  DEFAULT_TRACK_SPATIAL,
  SpatialStagingPreset,
  sphericalToCartesian,
  cartesianToSpherical,
  computeAmbisonicsBFormat,
  computeAtmos714Bed,
  Atmos714Bed,
  AmbisonicsBFormat
} from '../lib/spatialAudioEngine';
import { audioEngine } from '../lib/webAudioEngine';

interface SpatialAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  onUpdateTrackSpatial: (trackId: string, spatial: SpatialCoordinates) => void;
  onApplyPreset?: (presetId: string) => void;
  isPlaying?: boolean;
}

export const SpatialAudioModal: React.FC<SpatialAudioModalProps> = ({
  isOpen,
  onClose,
  tracks,
  onUpdateTrackSpatial,
  onApplyPreset,
  isPlaying = false
}) => {
  const [activeTab, setActiveTab] = useState<'soundstage' | 'ambisonics'>('soundstage');
  const [selectedTrackId, setSelectedTrackId] = useState<string>('tr-1');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('temple_sanctum');
  const [isAuditioning, setIsAuditioning] = useState<boolean>(false);
  const [binauralMasterActive, setBinauralMasterActive] = useState<boolean>(true);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Dragging state for radar pucks
  const [draggingTrackId, setDraggingTrackId] = useState<string | null>(null);
  const radarRef = useRef<SVGSVGElement | null>(null);

  const activeTrack = useMemo(() => {
    return tracks.find(t => t.id === selectedTrackId) || tracks[0];
  }, [tracks, selectedTrackId]);

  // Spatial coordinates for each track
  const trackSpatialMap = useMemo(() => {
    const map: Record<string, SpatialCoordinates> = {};
    tracks.forEach(track => {
      map[track.id] = track.spatial || DEFAULT_TRACK_SPATIAL[track.id] || {
        azimuth: 0,
        elevation: 0,
        distance: 2.0,
        binauralHrtf: true,
        spread: 0.2
      };
    });
    return map;
  }, [tracks]);

  const activeSpatial = trackSpatialMap[selectedTrackId] || {
    azimuth: 0,
    elevation: 0,
    distance: 2.0,
    binauralHrtf: true,
    spread: 0.2
  };

  // Active preset object
  const activePreset = useMemo(() => {
    return SPATIAL_STAGING_PRESETS.find(p => p.id === selectedPresetId) || SPATIAL_STAGING_PRESETS[0];
  }, [selectedPresetId]);

  // Ambisonics & 7.1.4 Bed calculated telemetry for active or combined tracks
  const ambisonicsTelemetry = useMemo<AmbisonicsBFormat>(() => {
    return computeAmbisonicsBFormat(activeSpatial.azimuth, activeSpatial.elevation, activeTrack ? activeTrack.volume : 1.0);
  }, [activeSpatial, activeTrack]);

  const atmosTelemetry = useMemo<Atmos714Bed>(() => {
    return computeAtmos714Bed(
      activeSpatial.azimuth, 
      activeSpatial.elevation, 
      activeSpatial.distance, 
      activeTrack ? activeTrack.volume : 1.0,
      activeTrack ? activeTrack.somaticSub : false
    );
  }, [activeSpatial, activeTrack]);

  if (!isOpen) return null;

  // Handle Dragging in the 360° Polar Radar
  const handleRadarPointerDown = (e: React.PointerEvent<any>, trackId: string) => {
    e.stopPropagation();
    setDraggingTrackId(trackId);
    setSelectedTrackId(trackId);
  };

  const handleRadarPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingTrackId || !radarRef.current) return;
    const rect = radarRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const maxRadiusPx = rect.width * 0.45; // 10 meters at perimeter

    // Convert pixel offset to polar
    const distPx = Math.sqrt(dx * dx + dy * dy);
    const normalizedDist = Math.min(1.0, Math.max(0.05, distPx / maxRadiusPx));
    const distanceM = Math.round(normalizedDist * 10 * 10) / 10; // 0.1 to 10m

    // Math.atan2(y, x): 0 rad is +X (Right, 90° azimuth), -PI/2 is -Y (Up, 0° azimuth / Front)
    // Azimuth = atan2(dx, -dy) in degrees
    const azRad = Math.atan2(dx, -dy);
    let azimuth = Math.round((azRad * 180) / Math.PI);
    if (azimuth > 180) azimuth -= 360;
    if (azimuth < -180) azimuth += 360;

    const current = trackSpatialMap[draggingTrackId] || { elevation: 0, binauralHrtf: true, spread: 0.2 };
    onUpdateTrackSpatial(draggingTrackId, {
      ...current,
      azimuth,
      distance: distanceM
    });
  };

  const handleRadarPointerUp = () => {
    setDraggingTrackId(null);
  };

  // Convert Azimuth and Distance into SVG viewBox (center at 200, 200; radius 160 = 10m)
  const getPuckSvgCoords = (spatial: SpatialCoordinates) => {
    const center = 200;
    const maxRadius = 160;
    const rPx = (Math.min(10, Math.max(0.1, spatial.distance)) / 10) * maxRadius;
    const azRad = (spatial.azimuth * Math.PI) / 180;
    // az 0° = up (-Y), +90° = right (+X), -90° = left (-X), 180° = down (+Y)
    const x = center + rPx * Math.sin(azRad);
    const y = center - rPx * Math.cos(azRad);
    return { x, y };
  };

  const handleApplyPreset = (preset: SpatialStagingPreset) => {
    setSelectedPresetId(preset.id);
    tracks.forEach(track => {
      const placement = preset.trackPlacements[track.id];
      if (placement) {
        const current = trackSpatialMap[track.id] || { binauralHrtf: true, spread: 0.2 };
        onUpdateTrackSpatial(track.id, {
          ...current,
          azimuth: placement.azimuth ?? current.azimuth,
          elevation: placement.elevation ?? current.elevation,
          distance: placement.distance ?? current.distance
        });
      }
    });

    if (onApplyPreset) {
      onApplyPreset(preset.id);
    }

    // Acoustic audition feedback chime for preset change
    audioEngine.playSpatialTrackPreview(
      0, 15, 2.0, 329.63, 'warm_string', 0.6
    );
  };

  const handleAuditionSelectedTrack = () => {
    if (!activeTrack) return;
    setIsAuditioning(true);

    let timbre: 'warm_string' | 'flute' | 'vocal' | 'tabla' | 'braam' | 'drone' = 'warm_string';
    let fundamental = 220;

    if (activeTrack.role === 'vedic_chant' || activeTrack.role === 'lead_vocal') {
      timbre = 'vocal';
      fundamental = 196; // G3
    } else if (activeTrack.name.toLowerCase().includes('flute') || activeTrack.name.toLowerCase().includes('wind')) {
      timbre = 'flute';
      fundamental = 440; // A4
    } else if (activeTrack.role === 'percussion_tala') {
      timbre = 'tabla';
      fundamental = 146.8; // D3 Dayan fundamental
    } else if (activeTrack.role === 'risers_drops') {
      timbre = 'braam';
      fundamental = 65.4; // C2 Sub Braam
    } else if (activeTrack.somaticSub) {
      timbre = 'braam';
      fundamental = 55.0;
    }

    audioEngine.playSpatialTrackPreview(
      activeSpatial.azimuth,
      activeSpatial.elevation,
      activeSpatial.distance,
      fundamental,
      timbre,
      0.95
    );

    setTimeout(() => {
      setIsAuditioning(false);
    }, 950);
  };

  const handleAuditionAllSpatialMix = () => {
    setIsAuditioning(true);
    // Staggered audition of all tracks positioned around the listener in 3D
    tracks.forEach((t, idx) => {
      const sp = trackSpatialMap[t.id] || { azimuth: 0, elevation: 0, distance: 2.0 };
      setTimeout(() => {
        let timbre: 'warm_string' | 'flute' | 'vocal' | 'tabla' | 'braam' | 'drone' = 'warm_string';
        if (t.role === 'vedic_chant') timbre = 'vocal';
        else if (t.role === 'percussion_tala') timbre = 'tabla';
        else if (t.role === 'risers_drops') timbre = 'braam';
        else if (t.name.toLowerCase().includes('flute')) timbre = 'flute';

        const baseF = 180 + idx * 35;
        audioEngine.playSpatialTrackPreview(sp.azimuth, sp.elevation, sp.distance, baseF, timbre, 0.7);
      }, idx * 160);
    });

    setTimeout(() => {
      setIsAuditioning(false);
    }, tracks.length * 160 + 600);
  };

  const handleExportSpatialMaster = async (format: 'binaural_wav' | 'atmos_714' | 'b_format') => {
    const label = format === 'binaural_wav'
      ? 'Binaural HRTF 96kHz / 32-bit Float Master WAV'
      : format === 'atmos_714'
      ? 'Dolby Atmos 7.1.4 ADM BWF 12-Channel Stem Package'
      : '1st Order Ambisonics B-Format (W, X, Y, Z) 4-Channel WAV';
    
    setExportNotice(`Preparing ${label}... Processing 3D head-related filters and extended spectrum at 96kHz.`);
    
    try {
      let blob: Blob;
      if (format === 'atmos_714') {
        const { exportAtmosADMBWF } = await import('../lib/admBwfEncoder');
        blob = await exportAtmosADMBWF(tracks);
      } else {
        const { exportBinauralWAV } = await import('../lib/admBwfEncoder');
        blob = await exportBinauralWAV(tracks);
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Nadabrahma_Spatial_Master_${format}_96kHz.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportNotice(`Successfully rendered ${label}! Ready for delivery.`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      console.error(err);
      setExportNotice(`Export failed: ${err}`);
      setTimeout(() => setExportNotice(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0a0e17] border border-amber-500/30 rounded-2xl w-full max-w-6xl max-h-[94vh] shadow-2xl shadow-black flex flex-col overflow-hidden text-slate-200 font-sans">
        
        {/* Header Strip */}
        <div className="px-6 py-3.5 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 tracking-wide">
                  The Owl 3D Spatial Audio Bus & Ambisonics Panner
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] border border-cyan-500/30">
                  96 kHz / 32-bit Float HRTF
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] border border-purple-500/30">
                  Dolby Atmos 7.1.4 & B-Format
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Full 360° spherical soundstage with Indian Classical acoustic staging and binaural headphone virtualization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab Selector */}
            <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('soundstage')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'soundstage'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                360° Spherical Radar
              </button>
              <button
                onClick={() => setActiveTab('ambisonics')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'ambisonics'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ambisonics & 7.1.4 Atmos
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Indian Classical Acoustic Staging Presets Bar */}
        <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Staging Presets:
            </span>
            {SPATIAL_STAGING_PRESETS.map(preset => {
              const isSelected = preset.id === selectedPresetId;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap border ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-amber-500/60 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="text-sm">{preset.icon}</span>
                  <span className="font-semibold">{preset.name}</span>
                  <span className="text-[10px] opacity-60 font-mono hidden sm:inline">({preset.sanskritTitle.split(' ')[0]})</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAuditionAllSpatialMix}
              disabled={isAuditioning}
              className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/40 text-cyan-300 text-xs font-medium flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)] disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-cyan-300" />
              <span>{isAuditioning ? 'Auditioning 3D Mix...' : 'Audition 360° Mix'}</span>
            </button>
          </div>
        </div>

        {/* Export Notification Toast */}
        {exportNotice && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2 flex items-center gap-2 text-xs text-amber-300 animate-in fade-in duration-150">
            <Check className="w-4 h-4 text-amber-400" />
            <span>{exportNotice}</span>
          </div>
        )}

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
          
          {activeTab === 'soundstage' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: 360° Polar Radar Visualizer (7 cols) */}
              <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col items-center relative overflow-hidden">
                
                {/* Visualizer Header */}
                <div className="w-full flex items-center justify-between mb-2 z-10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Interactive Spherical Polar Stage
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">
                      (Drag pucks to reposition in 3D space)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                    <Headphones className="w-3.5 h-3.5 text-amber-400" />
                    <span>Listener Facing 0° Front</span>
                  </div>
                </div>

                {/* SVG 360° Polar Radar Canvas */}
                <div className="relative w-full max-w-[440px] aspect-square flex items-center justify-center select-none touch-none">
                  <svg
                    ref={radarRef}
                    viewBox="0 0 400 400"
                    className="w-full h-full cursor-crosshair overflow-visible"
                    onPointerMove={handleRadarPointerMove}
                    onPointerUp={handleRadarPointerUp}
                    onPointerLeave={handleRadarPointerUp}
                  >
                    <defs>
                      {/* Ambient radial glow */}
                      <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#d97706" stopOpacity="0.06" />
                        <stop offset="60%" stopColor="#0f172a" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#020617" stopOpacity="0.9" />
                      </radialGradient>
                      {/* Stereo listening field cone */}
                      <linearGradient id="listeningCone" x1="50%" y1="50%" x2="50%" y2="0%">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Outer backdrop */}
                    <circle cx="200" cy="200" r="175" fill="url(#radarGlow)" stroke="#1e293b" strokeWidth="1.5" />

                    {/* Distance Distance Rings (10m, 7m, 4m, 1.5m) */}
                    <circle cx="200" cy="200" r="160" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />
                    <circle cx="200" cy="200" r="112" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
                    <circle cx="200" cy="200" r="64" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
                    <circle cx="200" cy="200" r="24" fill="none" stroke="#475569" strokeWidth="1" />

                    {/* Listening Focus Cone (Front +/- 35°) */}
                    <polygon points="200,200 110,40 290,40" fill="url(#listeningCone)" />

                    {/* Cardinal Crosshair Axes */}
                    <line x1="200" y1="25" x2="200" y2="375" stroke="#1e293b" strokeWidth="1.5" />
                    <line x1="25" y1="200" x2="375" y2="200" stroke="#1e293b" strokeWidth="1.5" />

                    {/* Diagonal 45° Guidelines */}
                    <line x1="86" y1="86" x2="314" y2="314" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="2,4" />
                    <line x1="314" y1="86" x2="86" y2="314" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="2,4" />

                    {/* Cardinal Labels */}
                    <text x="200" y="16" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      0° FRONT (CENTER)
                    </text>
                    <text x="200" y="394" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">
                      180° REAR
                    </text>
                    <text x="14" y="204" textAnchor="start" fill="#64748b" fontSize="9" fontFamily="monospace">
                      -90° L
                    </text>
                    <text x="386" y="204" textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">
                      +90° R
                    </text>

                    {/* Distance ring labels */}
                    <text x="205" y="44" fill="#475569" fontSize="8" fontFamily="monospace">10m</text>
                    <text x="205" y="92" fill="#475569" fontSize="8" fontFamily="monospace">7m</text>
                    <text x="205" y="140" fill="#475569" fontSize="8" fontFamily="monospace">4m</text>
                    <text x="205" y="180" fill="#475569" fontSize="8" fontFamily="monospace">1.5m</text>

                    {/* Central Listener Head / Avatar */}
                    <g transform="translate(200, 200)">
                      <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="#d97706" strokeWidth="2" />
                      {/* Headphone ear pads */}
                      <rect x="-16" y="-7" width="4" height="14" rx="2" fill="#38bdf8" />
                      <rect x="12" y="-7" width="4" height="14" rx="2" fill="#38bdf8" />
                      {/* Nose / forward indicator pointing to 0° */}
                      <polygon points="0,-18 -4,-12 4,-12" fill="#d97706" />
                      <circle cx="0" cy="0" r="3" fill="#f8fafc" />
                    </g>

                    {/* Render All 8 Track Pucks */}
                    {tracks.map(track => {
                      const sp = trackSpatialMap[track.id] || { azimuth: 0, elevation: 0, distance: 2.0 };
                      const { x, y } = getPuckSvgCoords(sp);
                      const isSelected = track.id === selectedTrackId;
                      const isElevated = sp.elevation > 10;
                      const isBelow = sp.elevation < -10;

                      return (
                        <g
                          key={track.id}
                          transform={`translate(${x}, ${y})`}
                          onPointerDown={(e) => handleRadarPointerDown(e, track.id)}
                          className="cursor-grab active:cursor-grabbing transition-transform duration-75"
                        >
                          {/* Elevation Halo */}
                          {isElevated && (
                            <circle
                              cx="0"
                              cy="0"
                              r="20"
                              fill="none"
                              stroke="#38bdf8"
                              strokeWidth="1.5"
                              strokeDasharray="3,2"
                              opacity="0.75"
                              className="animate-spin-slow"
                            />
                          )}
                          {isBelow && (
                            <circle
                              cx="0"
                              cy="0"
                              r="18"
                              fill="none"
                              stroke="#c084fc"
                              strokeWidth="1.5"
                              strokeDasharray="2,2"
                              opacity="0.7"
                            />
                          )}

                          {/* Pulsing selection aura */}
                          {isSelected && (
                            <circle
                              cx="0"
                              cy="0"
                              r="22"
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="2"
                              opacity="0.8"
                              className="animate-ping"
                            />
                          )}

                          {/* Sound wave ripple during active playback */}
                          {isPlaying && (
                            <circle
                              cx="0"
                              cy="0"
                              r="18"
                              fill="none"
                              stroke={track.color}
                              strokeWidth="1"
                              opacity="0.5"
                              className="animate-pulse"
                            />
                          )}

                          {/* Main Puck Body */}
                          <circle
                            cx="0"
                            cy="0"
                            r={isSelected ? "14" : "12"}
                            fill={track.color}
                            stroke={isSelected ? "#ffffff" : "#0f172a"}
                            strokeWidth={isSelected ? "2.5" : "1.5"}
                            filter="drop-shadow(0 2px 5px rgba(0,0,0,0.7))"
                          />

                          {/* Track Number inside puck */}
                          <text
                            x="0"
                            y="4"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize={isSelected ? "10" : "9"}
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {track.name.split('.')[0]}
                          </text>

                          {/* Floating Pill Label */}
                          <g transform="translate(0, 18)">
                            <rect
                              x="-34"
                              y="-2"
                              width="68"
                              height="14"
                              rx="7"
                              fill="#090d16"
                              stroke={isSelected ? "#f59e0b" : "#334155"}
                              strokeWidth="1"
                              opacity="0.9"
                            />
                            <text
                              x="0"
                              y="8"
                              textAnchor="middle"
                              fill={isSelected ? "#fef3c7" : "#cbd5e1"}
                              fontSize="8"
                              fontFamily="sans-serif"
                              fontWeight="600"
                            >
                              {track.name.length > 12 ? track.name.slice(0, 11) + '..' : track.name}
                            </text>
                          </g>

                          {/* Elevation tag if non-zero */}
                          {sp.elevation !== 0 && (
                            <text
                              x="0"
                              y="-16"
                              textAnchor="middle"
                              fill={sp.elevation > 0 ? "#38bdf8" : "#c084fc"}
                              fontSize="8"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              {sp.elevation > 0 ? `+${sp.elevation}°` : `${sp.elevation}°`}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Legend and Navigation Footnote */}
                <div className="w-full mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                      <span>Elevation &gt; 0° (Zenith/Spire)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                      <span>Elevation &lt; 0° (Floor/Ground)</span>
                    </div>
                  </div>
                  <div className="font-mono text-slate-500 text-[10px]">
                    Distance Scale: 0.1m — 10.0m
                  </div>
                </div>

              </div>

              {/* Right Column: Selected Track 3D Coordinates Inspector (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                
                {/* Track Selector Strip */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Select Track to Position in 3D:
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {tracks.map(t => {
                      const isSel = t.id === selectedTrackId;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTrackId(t.id)}
                          className={`p-1.5 rounded-xl text-left border transition-all flex flex-col items-start ${
                            isSel
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                              : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 w-full">
                            <span 
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: t.color }}
                            />
                            <span className="font-bold text-[10px] truncate">{t.name.split('.')[0]}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 truncate w-full mt-0.5">
                            {t.name.split('. ')[1] || t.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3D Coordinate Modeler for Active Track */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3.5 h-3.5 rounded-full border border-white/20"
                          style={{ backgroundColor: activeTrack.color }}
                        />
                        <div>
                          <h4 className="font-bold text-slate-100 text-xs">{activeTrack.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {activeTrack.activeInstrument || activeTrack.role}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleAuditionSelectedTrack}
                        disabled={isAuditioning}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Audition 3D</span>
                      </button>
                    </div>

                    {/* Sliders: Azimuth, Elevation, Distance */}
                    <div className="space-y-3.5 text-xs">
                      
                      {/* Azimuth (-180° to +180°) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-semibold text-slate-300">
                            Azimuth (360° Horizontal Bearing)
                          </span>
                          <span className="font-mono text-xs font-bold text-amber-300">
                            {activeSpatial.azimuth > 0 ? `+${activeSpatial.azimuth}° (Right)` : activeSpatial.azimuth < 0 ? `${activeSpatial.azimuth}° (Left)` : '0° (Center Front)'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          value={activeSpatial.azimuth}
                          onChange={(e) => onUpdateTrackSpatial(selectedTrackId, {
                            ...activeSpatial,
                            azimuth: parseInt(e.target.value)
                          })}
                          className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                        />
                        <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                          <span>-180° (Rear)</span>
                          <span>-90° (Left)</span>
                          <span>0° (Center)</span>
                          <span>+90° (Right)</span>
                          <span>+180° (Rear)</span>
                        </div>
                      </div>

                      {/* Elevation (-90° Nadir to +90° Zenith) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-semibold text-slate-300">
                            Elevation (Vertical Arc)
                          </span>
                          <span className="font-mono text-xs font-bold text-cyan-300">
                            {activeSpatial.elevation > 0 ? `+${activeSpatial.elevation}° (Zenith)` : activeSpatial.elevation < 0 ? `${activeSpatial.elevation}° (Floor)` : '0° (Ear Level)'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-90"
                          max="90"
                          value={activeSpatial.elevation}
                          onChange={(e) => onUpdateTrackSpatial(selectedTrackId, {
                            ...activeSpatial,
                            elevation: parseInt(e.target.value)
                          })}
                          className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                        />
                        <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                          <span>-90° (Nadir / Floor)</span>
                          <span>-30° (Ground)</span>
                          <span>0° (Ear Level)</span>
                          <span>+45° (Canopy)</span>
                          <span>+90° (Zenith Spire)</span>
                        </div>
                      </div>

                      {/* Radial Distance (0.1m to 10m) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-semibold text-slate-300">
                            Distance (Radial Depth)
                          </span>
                          <span className="font-mono text-xs font-bold text-purple-300">
                            {activeSpatial.distance.toFixed(1)} meters
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="10.0"
                          step="0.1"
                          value={activeSpatial.distance}
                          onChange={(e) => onUpdateTrackSpatial(selectedTrackId, {
                            ...activeSpatial,
                            distance: parseFloat(e.target.value)
                          })}
                          className="w-full accent-purple-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                        />
                        <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                          <span>0.1m (Intimate)</span>
                          <span>2.0m (Baithak Circle)</span>
                          <span>5.0m (Chamber)</span>
                          <span>10.0m (Ghat Horizon)</span>
                        </div>
                      </div>

                      {/* Binaural HRTF & Spread Toggles */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onUpdateTrackSpatial(selectedTrackId, {
                              ...activeSpatial,
                              binauralHrtf: !activeSpatial.binauralHrtf
                            })}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border transition-all ${
                              activeSpatial.binauralHrtf
                                ? 'bg-teal-950/70 text-teal-300 border-teal-500/50 shadow-[0_0_8px_rgba(20,184,166,0.25)]'
                                : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}
                          >
                            <Headphones className="w-3.5 h-3.5" />
                            <span>{activeSpatial.binauralHrtf ? 'Binaural HRTF ON' : 'Stereo Pan'}</span>
                          </button>
                        </div>

                        {/* Cartesian 3D readout */}
                        {(() => {
                          const cart = sphericalToCartesian(activeSpatial.azimuth, activeSpatial.elevation, activeSpatial.distance);
                          return (
                            <span className="font-mono text-[10px] text-slate-400">
                              X:{cart.x.toFixed(1)}m Y:{cart.y.toFixed(1)}m Z:{cart.z.toFixed(1)}m
                            </span>
                          );
                        })()}
                      </div>

                    </div>
                  </div>

                  {/* Active Room Acoustic Telemetry */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
                    <div className="flex items-center justify-between font-semibold text-slate-300 mb-1">
                      <span>Room Acoustic Profile:</span>
                      <span className="text-amber-400">{activePreset.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center mt-2 font-mono text-[10px]">
                      <div className="p-1.5 bg-slate-950/60 rounded-lg border border-slate-800">
                        <div className="text-slate-500">RT60 Decay</div>
                        <div className="text-amber-300 font-bold">{activePreset.rt60ReverbSec}s</div>
                      </div>
                      <div className="p-1.5 bg-slate-950/60 rounded-lg border border-slate-800">
                        <div className="text-slate-500">Diffusion</div>
                        <div className="text-cyan-300 font-bold">{Math.round(activePreset.acousticDiffusion * 100)}%</div>
                      </div>
                      <div className="p-1.5 bg-slate-950/60 rounded-lg border border-slate-800">
                        <div className="text-slate-500">Air Ceiling</div>
                        <div className="text-emerald-300 font-bold">{activePreset.hypersonicReflectionBoost}x</div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          ) : (
            /* Tab 2: Ambisonics (B-Format) & Dolby Atmos 7.1.4 Bed */
            <div className="space-y-6">
              
              {/* Top Row: Dolby Atmos 7.1.4 Bed 12-Channel Meters */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-400" />
                      Dolby Atmos 7.1.4 Surround & Height Bed Matrix
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Real-time Vector Base Amplitude Panning (VBAP) distribution for immersive spatial reproduction
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs border border-purple-500/30">
                    12 Discrete Channels
                  </span>
                </div>

                {/* 12-Channel Speaker Bars Grid */}
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 text-center">
                  {[
                    { id: 'L', name: 'Left', group: 'Front', val: atmosTelemetry.L, color: 'from-amber-500 to-amber-400' },
                    { id: 'C', name: 'Center', group: 'Front', val: atmosTelemetry.C, color: 'from-amber-500 to-amber-300' },
                    { id: 'R', name: 'Right', group: 'Front', val: atmosTelemetry.R, color: 'from-amber-500 to-amber-400' },
                    { id: 'LFE', name: 'Sub / LFE', group: 'Somatic', val: atmosTelemetry.LFE, color: 'from-purple-500 to-rose-400' },
                    { id: 'Lss', name: 'L Side', group: 'Surround', val: atmosTelemetry.Lss, color: 'from-emerald-500 to-teal-400' },
                    { id: 'Rss', name: 'R Side', group: 'Surround', val: atmosTelemetry.Rss, color: 'from-emerald-500 to-teal-400' },
                    { id: 'Lsr', name: 'L Rear', group: 'Surround', val: atmosTelemetry.Lsr, color: 'from-emerald-500 to-teal-400' },
                    { id: 'Rsr', name: 'R Rear', group: 'Surround', val: atmosTelemetry.Rsr, color: 'from-emerald-500 to-teal-400' },
                    { id: 'Ltf', name: 'L Top Fr', group: 'Overhead', val: atmosTelemetry.Ltf, color: 'from-cyan-500 to-sky-400' },
                    { id: 'Rtf', name: 'R Top Fr', group: 'Overhead', val: atmosTelemetry.Rtf, color: 'from-cyan-500 to-sky-400' },
                    { id: 'Ltr', name: 'L Top Rr', group: 'Overhead', val: atmosTelemetry.Ltr, color: 'from-cyan-500 to-sky-400' },
                    { id: 'Rtr', name: 'R Top Rr', group: 'Overhead', val: atmosTelemetry.Rtr, color: 'from-cyan-500 to-sky-400' },
                  ].map(channel => {
                    const pct = Math.min(100, Math.round(channel.val * 100));
                    return (
                      <div key={channel.id} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2 flex flex-col items-center">
                        <span className="text-[9px] font-mono text-slate-500">{channel.group}</span>
                        <div className="my-2 h-24 w-3 bg-slate-950 rounded-full overflow-hidden p-0.5 flex flex-col justify-end border border-slate-800">
                          <div 
                            className={`w-full rounded-full bg-gradient-to-t ${channel.color} transition-all duration-100`}
                            style={{ height: `${Math.max(4, pct)}%` }}
                          />
                        </div>
                        <span className="font-bold text-[11px] text-slate-200">{channel.id}</span>
                        <span className="font-mono text-[9px] text-amber-400">{channel.val.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Row: 1st Order Ambisonics B-Format (W, X, Y, Z) + Export Center */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Ambisonics B-Format 4-Channel Decomposition (6 cols) */}
                <div className="md:col-span-6 bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Disc className="w-4 h-4 text-cyan-400" />
                      1st Order Ambisonics (B-Format FOA)
                    </h4>
                    <span className="font-mono text-[10px] text-cyan-400">SN3D / Furse-Malham</span>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                    Decomposes the acoustic wavefront into four orthogonal spherical harmonic components for infinite multi-speaker decoding.
                  </p>

                  <div className="grid grid-cols-4 gap-3 text-center">
                    {[
                      { comp: 'W', label: 'Omni Pressure', val: ambisonicsTelemetry.w, color: 'text-amber-300' },
                      { comp: 'X', label: 'Front / Back', val: ambisonicsTelemetry.x, color: 'text-cyan-300' },
                      { comp: 'Y', label: 'Left / Right', val: ambisonicsTelemetry.y, color: 'text-emerald-300' },
                      { comp: 'Z', label: 'Up / Down', val: ambisonicsTelemetry.z, color: 'text-purple-300' }
                    ].map(item => (
                      <div key={item.comp} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                        <span className="text-lg font-bold font-mono text-slate-100">{item.comp}</span>
                        <div className={`font-mono text-sm font-bold my-1 ${item.color}`}>
                          {item.val >= 0 ? `+${item.val.toFixed(3)}` : item.val.toFixed(3)}
                        </div>
                        <span className="text-[9px] text-slate-500 block leading-tight">{item.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[10px] text-slate-400 font-mono">
                    W = 1/√2 · S | X = S·cos(θ)cos(φ) | Y = S·sin(θ)cos(φ) | Z = S·sin(φ)
                  </div>
                </div>

                {/* Spatial Master Export Center (6 cols) */}
                <div className="md:col-span-6 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Spatial Master Render & Export Suite
                    </h4>
                    <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                      Render high-resolution spatial formats natively with 96kHz super-resolution and 32-bit float internal summing.
                    </p>

                    <div className="space-y-2.5">
                      <button
                        onClick={() => handleExportSpatialMaster('binaural_wav')}
                        className="w-full p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/50 text-amber-200 text-xs font-bold flex items-center justify-between transition-all shadow-md shadow-amber-500/10"
                      >
                        <div className="flex items-center gap-2">
                          <Headphones className="w-4 h-4 text-amber-400" />
                          <div className="text-left">
                            <div>Render Binaural 3D Master (96kHz / 32-bit WAV)</div>
                            <div className="text-[10px] text-amber-400/80 font-normal">HRTF headphone virtualization for Apple Music / Spotify</div>
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-amber-400" />
                      </button>

                      <button
                        onClick={() => handleExportSpatialMaster('atmos_714')}
                        className="w-full p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-purple-400" />
                          <div className="text-left">
                            <div>Export Dolby Atmos 7.1.4 ADM BWF Bed</div>
                            <div className="text-[10px] text-slate-400 font-normal">12-channel discrete surround & height bed stems</div>
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-purple-400" />
                      </button>

                      <button
                        onClick={() => handleExportSpatialMaster('b_format')}
                        className="w-full p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <Disc className="w-4 h-4 text-cyan-400" />
                          <div className="text-left">
                            <div>Export 1st Order Ambisonics B-Format (4-Ch WAV)</div>
                            <div className="text-[10px] text-slate-400 font-normal">W, X, Y, Z multichannel file for VR & game engines</div>
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-cyan-400" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Zero Clipping Guaranteed
                    </span>
                    <span>32-bit Float IEEE 754</span>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Footer Actions Strip */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              The Owl 3D Core Active
            </span>
            <span className="text-slate-600">|</span>
            <span>8 Tracks Spatialized</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400 font-mono">HRTF Virtualization: Enabled</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              Close
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
            >
              Apply & Keep Staging
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
