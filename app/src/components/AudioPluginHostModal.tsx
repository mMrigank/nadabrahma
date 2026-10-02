import React, { useState, useEffect } from 'react';
import { 
  X, Sliders, Activity, Zap, CheckCircle2, Volume2, 
  RotateCcw, Sparkles, Layers, Disc, Flame, ShieldCheck, 
  ChevronRight, Play, Compass, HardDrive, Waves
} from 'lucide-react';
import { Track, PluginType, PluginInstance } from '../types/daw';
import { 
  pluginEngine, PLUGIN_SPECS, SACRED_SPACES, 
  DEFAULT_MASTER_PLUGINS, PLUGIN_PRESETS 
} from '../lib/pluginEngine';
import { audioEngine } from '../lib/webAudioEngine';

interface AudioPluginHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  onUpdateTrackPlugins: (trackId: string, plugins: PluginInstance[]) => void;
  masterPlugins: PluginInstance[];
  onUpdateMasterPlugins: (plugins: PluginInstance[]) => void;
  baseSaHz: number;
  initialSelectedTrackId?: string | 'master' | null;
  targetTrackId?: string | null;
  onSelectTarget?: (targetId: string | null) => void;
  activeRaga?: any;
}

export const AudioPluginHostModal: React.FC<AudioPluginHostModalProps> = ({
  isOpen,
  onClose,
  tracks,
  onUpdateTrackPlugins,
  masterPlugins,
  onUpdateMasterPlugins,
  baseSaHz,
  initialSelectedTrackId = 'master',
  targetTrackId,
  onSelectTarget
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string | 'master'>(targetTrackId || initialSelectedTrackId || 'master');
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
  const [isAuditioning, setIsAuditioning] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync initial or updated target on open
  useEffect(() => {
    if (isOpen) {
      const target = targetTrackId || initialSelectedTrackId || 'master';
      setSelectedTarget(target);
      setActiveSlotIndex(0);
    }
  }, [isOpen, targetTrackId, initialSelectedTrackId]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Get active plugins for current target
  const currentTargetTrack = selectedTarget === 'master' ? null : tracks.find(t => t.id === selectedTarget) || tracks[0];
  const currentPlugins: PluginInstance[] = selectedTarget === 'master'
    ? masterPlugins
    : currentTargetTrack?.plugins || [];

  const maxSlots = selectedTarget === 'master' ? 6 : 4;
  const activePlugin = currentPlugins.find(p => p.slotIndex === activeSlotIndex) || currentPlugins[0] || null;

  // Calculate live memory footprint
  const memoryMB = pluginEngine.calculateMemoryUsageMB(tracks, masterPlugins);

  // Update a plugin instance
  const handleUpdatePlugin = (slotIndex: number, updates: Partial<PluginInstance>) => {
    let nextPlugins = currentPlugins.map(p => {
      if (p.slotIndex === slotIndex) {
        return { ...p, ...updates };
      }
      return p;
    });

    if (selectedTarget === 'master') {
      onUpdateMasterPlugins(nextPlugins);
    } else if (currentTargetTrack) {
      onUpdateTrackPlugins(currentTargetTrack.id, nextPlugins);
    }
  };

  // Update plugin params
  const handleUpdateParams = (slotIndex: number, paramUpdates: Record<string, any>) => {
    const existing = currentPlugins.find(p => p.slotIndex === slotIndex);
    if (!existing) return;

    handleUpdatePlugin(slotIndex, {
      params: { ...existing.params, ...paramUpdates }
    });
  };

  // Add plugin to slot
  const handleAddPlugin = (type: PluginType, slotIdx: number) => {
    const newPlug = pluginEngine.createPlugin(type, selectedTarget, slotIdx);
    const filtered = currentPlugins.filter(p => p.slotIndex !== slotIdx);
    const nextPlugins = [...filtered, newPlug].sort((a, b) => a.slotIndex - b.slotIndex);

    if (selectedTarget === 'master') {
      onUpdateMasterPlugins(nextPlugins);
    } else if (currentTargetTrack) {
      onUpdateTrackPlugins(currentTargetTrack.id, nextPlugins);
    }
    setActiveSlotIndex(slotIdx);
    showToast(`Inserted ${newPlug.name} into Slot ${slotIdx + 1}!`);
  };

  // Remove plugin from slot
  const handleRemovePlugin = (slotIdx: number) => {
    const nextPlugins = currentPlugins.filter(p => p.slotIndex !== slotIdx);
    if (selectedTarget === 'master') {
      onUpdateMasterPlugins(nextPlugins);
    } else if (currentTargetTrack) {
      onUpdateTrackPlugins(currentTargetTrack.id, nextPlugins);
    }
    showToast(`Removed plugin from Slot ${slotIdx + 1}`);
  };

  // Audition Active Plugin Effect
  const handleAudition = () => {
    if (!activePlugin) return;
    setIsAuditioning(true);
    audioEngine.playPluginAudition(activePlugin.type, activePlugin.params, baseSaHz);
    showToast(`Auditioning ${activePlugin.name} effect...`);
    setTimeout(() => setIsAuditioning(false), 2600);
  };

  // Load a quick preset
  const handleLoadPreset = (presetKey: string) => {
    const preset = PLUGIN_PRESETS[presetKey];
    if (!preset) return;

    const newChain: PluginInstance[] = preset.map((item, idx) => {
      const base = pluginEngine.createPlugin(item.type, selectedTarget, idx);
      return {
        ...base,
        name: item.name,
        params: { ...base.params, ...item.params }
      };
    });

    if (selectedTarget === 'master') {
      onUpdateMasterPlugins(newChain);
    } else if (currentTargetTrack) {
      onUpdateTrackPlugins(currentTargetTrack.id, newChain);
    }
    setActiveSlotIndex(0);
    showToast(`Loaded "${preset[0].name}" preset chain!`);
  };

  // EQ Curve calculation
  const eqCurvePoints = activePlugin && activePlugin.type === 'eq'
    ? pluginEngine.calculateEqCurve(baseSaHz, activePlugin.params)
    : [];
  const svgPathData = eqCurvePoints.length > 0
    ? `M ${eqCurvePoints.map(p => `${p.x},${p.y}`).join(' L ')}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="flex flex-col w-full max-w-5xl h-[88vh] bg-[#090c14] border border-amber-500/25 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-100">
        
        {/* Header Strip */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/35 flex items-center justify-center text-purple-400 shadow-inner">
              <Sliders className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-100 tracking-tight">
                  Studio DSP Plugin Host & Wasm Sandboxing
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-950/70 text-purple-300 border border-purple-500/40 font-semibold">
                  96kHz / 32-bit Float
                </span>
              </div>
              <p className="text-xs text-slate-400">
                NādaEQ Pro • Prāṇa Tape Saturator • Mandir Convolution Reverb • Somatic Sub Braam • Vāc Opto Leveler
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Memory Sandboxing Readout */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/60 text-xs font-mono">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300">DSP Memory: <strong className="text-emerald-300">{memoryMB} MB</strong> / 120 MB</span>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Notification Toast */}
        {toastMessage && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/30 px-6 py-2 text-xs text-emerald-200 flex items-center gap-2 font-medium animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {toastMessage}
          </div>
        )}

        {/* Target Selector Navigation Bar */}
        <div className="flex items-center justify-between px-6 border-b border-white/[0.08] bg-slate-950/40 text-xs overflow-x-auto">
          <div className="flex items-center gap-1.5 py-2">
            <button
              onClick={() => {
                setSelectedTarget('master');
                setActiveSlotIndex(0);
              }}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer flex items-center gap-1.5 ${
                selectedTarget === 'master'
                  ? 'bg-amber-600 text-slate-950 font-bold shadow-md shadow-amber-600/20'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              Master Bus (6 Slots)
            </button>

            <div className="w-px h-5 bg-slate-800 mx-1"></div>

            {tracks.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedTarget(t.id);
                  setActiveSlotIndex(0);
                }}
                className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedTarget === t.id
                    ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }}></span>
                <span>{t.name}</span>
                {(t.plugins?.length || 0) > 0 && (
                  <span className="text-[10px] px-1 rounded bg-slate-800 text-amber-300 font-mono">
                    {t.plugins?.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Quick Presets Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono">Quick Chains:</span>
            <button
              onClick={() => handleLoadPreset('vocal_silk')}
              className="px-2 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-750 text-[11px] font-medium transition cursor-pointer"
            >
              Vocal Silk
            </button>
            <button
              onClick={() => handleLoadPreset('sitar_presence')}
              className="px-2 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-750 text-[11px] font-medium transition cursor-pointer"
            >
              Sitar Sparkle
            </button>
            <button
              onClick={() => handleLoadPreset('tabla_gravity')}
              className="px-2 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-750 text-[11px] font-medium transition cursor-pointer"
            >
              Tabla Gravity
            </button>
          </div>
        </div>

        {/* Main Body: Insert Rack (Left) & Active Plugin GUI (Right) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Column: Insert Slot Rack */}
          <div className="w-72 border-r border-white/[0.08] bg-slate-950/60 p-4 flex flex-col justify-between overflow-y-auto space-y-3">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Insert Slots ({currentPlugins.length}/{maxSlots})
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Serial Routing</span>
              </div>

              {Array.from({ length: maxSlots }).map((_, slotIdx) => {
                const plug = currentPlugins.find(p => p.slotIndex === slotIdx);
                const isSelected = activeSlotIndex === slotIdx;

                if (plug) {
                  return (
                    <div
                      key={plug.id}
                      onClick={() => setActiveSlotIndex(slotIdx)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'bg-slate-850/90 border-amber-500/50 shadow-md shadow-amber-500/10'
                          : 'bg-slate-900/60 hover:bg-slate-850/70 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdatePlugin(slotIdx, { enabled: !plug.enabled });
                            }}
                            title={plug.enabled ? 'Click to bypass' : 'Click to enable'}
                            className={`w-2.5 h-2.5 rounded-full transition cursor-pointer ${
                              plug.enabled ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-600'
                            }`}
                          ></button>
                          <span className="text-xs font-bold text-slate-200">
                            {slotIdx + 1}. {plug.name}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePlugin(slotIdx);
                          }}
                          className="text-slate-500 hover:text-rose-400 transition cursor-pointer p-0.5"
                          title="Remove plugin"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-serif text-amber-300/80">{plug.sanskritTitle}</span>
                        <span className="font-mono">Mix: {Math.round(plug.dryWet * 100)}%</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={slotIdx}
                    className="p-2 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/40 text-center"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Slot {slotIdx + 1}: Empty</span>
                      <div className="flex items-center gap-1">
                        {(['eq', 'tape', 'reverb', 'sub_braam', 'compressor'] as PluginType[]).map(t => (
                          <button
                            key={t}
                            onClick={() => handleAddPlugin(t, slotIdx)}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-mono transition cursor-pointer"
                            title={`Insert ${PLUGIN_SPECS[t].name}`}
                          >
                            +{t.toUpperCase().slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rack Audition & Master Bypass */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <button
                onClick={handleAudition}
                disabled={isAuditioning || !activePlugin}
                className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                  isAuditioning
                    ? 'bg-amber-600 text-slate-950 animate-pulse'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20'
                }`}
              >
                <Play className={`w-3.5 h-3.5 ${isAuditioning ? 'fill-slate-950' : 'fill-white'}`} />
                <span>{isAuditioning ? 'Auditioning DSP Node...' : '▶ Audition Active Plugin'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Active Plugin GUI */}
          <div className="flex-1 bg-[#0b0e18] p-6 overflow-y-auto space-y-6">
            {activePlugin ? (
              <div className="space-y-6">
                
                {/* Plugin Banner & Bypass Controls */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      {activePlugin.type === 'eq' && <Activity className="w-5 h-5" />}
                      {activePlugin.type === 'tape' && <Disc className="w-5 h-5" />}
                      {activePlugin.type === 'reverb' && <Compass className="w-5 h-5" />}
                      {activePlugin.type === 'sub_braam' && <Waves className="w-5 h-5" />}
                      {activePlugin.type === 'compressor' && <Sliders className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-100">
                          {PLUGIN_SPECS[activePlugin.type].name}
                        </h3>
                        <span className="text-xs font-serif text-amber-400 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-600/30">
                          {PLUGIN_SPECS[activePlugin.type].sanskritTitle}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {PLUGIN_SPECS[activePlugin.type].description}
                      </p>
                    </div>
                  </div>

                  {/* Power & Dry/Wet */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-slate-400">Dry/Wet:</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={activePlugin.dryWet}
                        onChange={(e) => handleUpdatePlugin(activePlugin.slotIndex, { dryWet: parseFloat(e.target.value) })}
                        className="w-20 accent-amber-500"
                      />
                      <span className="text-amber-300 font-bold w-9 text-right">
                        {Math.round(activePlugin.dryWet * 100)}%
                      </span>
                    </div>

                    <button
                      onClick={() => handleUpdatePlugin(activePlugin.slotIndex, { enabled: !activePlugin.enabled })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                        activePlugin.enabled
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}
                    >
                      {activePlugin.enabled ? 'ACTIVE' : 'BYPASS'}
                    </button>
                  </div>
                </div>

                {/* 1. NādaEQ Pro GUI */}
                {activePlugin.type === 'eq' && (
                  <div className="space-y-5">
                    {/* SVG Spectrum Curve Canvas */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>7-Svara Harmonic Transfer Function H(f)</span>
                        <span className="text-amber-400 font-bold">Sa = {baseSaHz.toFixed(1)} Hz</span>
                      </div>

                      <div className="relative w-full h-32 bg-[#060810] rounded-lg overflow-hidden border border-slate-850">
                        {/* 0dB Center Line */}
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-800/80"></div>
                        {/* +6dB & -6dB guides */}
                        <div className="absolute top-1/4 left-0 right-0 h-px border-t border-dashed border-slate-850/60"></div>
                        <div className="absolute top-3/4 left-0 right-0 h-px border-t border-dashed border-slate-850/60"></div>

                        <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                          <path
                            d={svgPathData}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* 7 Swara Faders */}
                    <div className="grid grid-cols-7 gap-3">
                      {[
                        { key: 'saGainDb', swara: 'S', name: 'Sa (Tonic)', ratio: '1/1' },
                        { key: 'reGainDb', swara: 'R', name: 'Re (2nd)', ratio: '9/8' },
                        { key: 'gaGainDb', swara: 'G', name: 'Ga (3rd)', ratio: '5/4' },
                        { key: 'maGainDb', swara: 'M', name: 'Ma (4th)', ratio: '4/3' },
                        { key: 'paGainDb', swara: 'P', name: 'Pa (5th)', ratio: '3/2' },
                        { key: 'dhaGainDb', swara: 'D', name: 'Dha (6th)', ratio: '5/3' },
                        { key: 'niGainDb', swara: 'N', name: 'Ni (7th)', ratio: '15/8' }
                      ].map(b => (
                        <div key={b.key} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-center space-y-2">
                          <span className="text-sm font-bold text-amber-300 font-mono block">{b.swara}</span>
                          <span className="text-[10px] text-slate-500 block">{b.ratio}</span>

                          <input
                            type="range"
                            min="-12"
                            max="12"
                            step="0.5"
                            value={activePlugin.params[b.key] || 0}
                            onChange={(e) => handleUpdateParams(activePlugin.slotIndex, { [b.key]: parseFloat(e.target.value) })}
                            className="h-24 w-full accent-amber-500 writing-mode-vertical"
                            style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                          />

                          <span className="text-xs font-mono font-bold text-slate-200 block">
                            {(activePlugin.params[b.key] || 0) > 0 ? '+' : ''}
                            {activePlugin.params[b.key] || 0} dB
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Filter Utilities */}
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                        <label className="text-slate-400 block mb-1">Low-Cut Filter (Hz):</label>
                        <input
                          type="range"
                          min="10"
                          max="120"
                          step="5"
                          value={activePlugin.params.lowCutHz || 25}
                          onChange={(e) => handleUpdateParams(activePlugin.slotIndex, { lowCutHz: parseInt(e.target.value) })}
                          className="w-full accent-amber-500"
                        />
                        <span className="font-mono text-amber-300 font-bold">{activePlugin.params.lowCutHz || 25} Hz</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                        <label className="text-slate-400 block mb-1">Q-Factor Resonance:</label>
                        <input
                          type="range"
                          min="0.5"
                          max="8.0"
                          step="0.2"
                          value={activePlugin.params.qFactor || 2.5}
                          onChange={(e) => handleUpdateParams(activePlugin.slotIndex, { qFactor: parseFloat(e.target.value) })}
                          className="w-full accent-amber-500"
                        />
                        <span className="font-mono text-amber-300 font-bold">{activePlugin.params.qFactor || 2.5} Q</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                        <label className="text-slate-400 block mb-1">48k Hypersonic Air Boost:</label>
                        <input
                          type="range"
                          min="0"
                          max="6"
                          step="0.5"
                          value={activePlugin.params.hypersonicAirBoostDb || 2.0}
                          onChange={(e) => handleUpdateParams(activePlugin.slotIndex, { hypersonicAirBoostDb: parseFloat(e.target.value) })}
                          className="w-full accent-teal-500"
                        />
                        <span className="font-mono text-teal-300 font-bold">+{activePlugin.params.hypersonicAirBoostDb || 2.0} dB</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Prāṇa Tape Saturator GUI */}
                {activePlugin.type === 'tape' && (
                  <div className="space-y-5">
                    {/* Animated Tape Deck Visualizer */}
                    <div className="p-5 rounded-xl bg-gradient-to-r from-stone-950 via-[#140e09] to-stone-950 border border-amber-800/30 flex items-center justify-around">
                      {/* Left Reel */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-20 h-20 rounded-full border-4 border-amber-600/40 bg-stone-900 flex items-center justify-center animate-spin" style={{ animationDuration: '6s' }}>
                          <Disc className="w-12 h-12 text-amber-500/70" />
                        </div>
                        <span className="text-[10px] font-mono text-amber-300">Supply Reel</span>
                      </div>

                      {/* Center VU Meter */}
                      <div className="w-48 p-3 rounded-lg bg-black/80 border border-amber-900/40 text-center">
                        <span className="text-[10px] font-mono text-slate-400 block mb-1">ANALOG TAPE FLUX</span>
                        <div className="h-4 bg-stone-900 rounded-full overflow-hidden p-0.5">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all"
                            style={{ width: `${Math.min(100, (activePlugin.params.drive || 38) * 1.8)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-400 mt-1 block">
                          +{(activePlugin.params.drive || 38) > 50 ? '3.2' : '0.4'} dB VU
                        </span>
                      </div>

                      {/* Right Reel */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-20 h-20 rounded-full border-4 border-amber-600/40 bg-stone-900 flex items-center justify-center animate-spin" style={{ animationDuration: '6s' }}>
                          <Disc className="w-12 h-12 text-amber-500/70" />
                        </div>
                        <span className="text-[10px] font-mono text-amber-300">Takeup Reel</span>
                      </div>
                    </div>

                    {/* Tape Parameters */}
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <label className="text-slate-400 block">Tape Drive Saturation:</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={activePlugin.params.drive || 38}
                          onChange={(e) => handleUpdateParams(activePlugin.slotIndex, { drive: parseInt(e.target.value) })}
                          className="w-full accent-amber-500"
                        />
                        <span className="font-mono text-amber-300 font-bold block">{activePlugin.params.drive || 38}%</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <label className="text-slate-400 block">Analog Warmth (Low Head Bump):</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={activePlugin.params.warmth || 65}
                          onChange={(e) => handleUpdateParams(activePlugin.slotIndex, { warmth: parseInt(e.target.value) })}
                          className="w-full accent-amber-500"
                        />
                        <span className="font-mono text-amber-300 font-bold block">{activePlugin.params.warmth || 65}%</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <label className="text-slate-400 block">Tape Speed:</label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {(['15 IPS', '30 IPS'] as const).map(spd => (
                            <button
                              key={spd}
                              onClick={() => handleUpdateParams(activePlugin.slotIndex, { tapeSpeed: spd })}
                              className={`py-1.5 rounded-lg font-mono font-bold text-xs transition cursor-pointer ${
                                (activePlugin.params.tapeSpeed || '30 IPS') === spd
                                  ? 'bg-amber-600 text-slate-950 shadow-md shadow-amber-600/20'
                                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {spd}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Mandir Convolution Reverb GUI */}
                {activePlugin.type === 'reverb' && (
                  <div className="space-y-5">
                    {/* Sacred Spaces IR Cards */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Select Sacred Space Impulse Response:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {SACRED_SPACES.map(s => {
                          const isSelected = (activePlugin.params.spaceId || 'brihadisvara_sanctum') === s.id;
                          return (
                            <div
                              key={s.id}
                              onClick={() => handleUpdateParams(activePlugin.slotIndex, {
                                spaceId: s.id,
                                decaySec: s.defaultDecaySec
                              })}
                              className={`p-3 rounded-xl border transition cursor-pointer ${
                                isSelected
                                  ? 'bg-slate-850 border-amber-500/50 shadow-md shadow-amber-500/10'
                                  : 'bg-slate-900/60 hover:bg-slate-850/60 border-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-slate-200">{s.name}</span>
                                <span className="text-[10px] font-mono text-amber-300 font-bold">{s.defaultDecaySec}s</span>
                              </div>
                              <p className="text-[10px] text-slate-400 leading-tight">{s.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Reverb Decay & Envelope Sliders */}
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <label className="text-slate-400 block">Reverb Decay Time:</label>
                        <input
                          type="range"
                          min="0.5"
                          max="10.0"
                          step="0.1"
                          value={activePlugin.params.decaySec || 3.8}
                          onChange={(e) => handleUpdateParams(activePlugin.slotIndex, { decaySec: parseFloat(e.target.value) })}
                          className="w-full accent-amber-500"
                        />
                        <span className="font-mono text-amber-300 font-bold block">{activePlugin.params.decaySec || 3.8}s</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <label className="text-slate-400 block">Pre-Delay (ms):</label>
                        <input
                          type="range"
                          min="0"
                          max="150"
                          step="5"
                          value={activePlugin.params.preDelayMs || 22}
                          onChange={(e) => handleUpdateParams(activePlugin.slotIndex, { preDelayMs: parseInt(e.target.value) })}
                          className="w-full accent-amber-500"
                        />
                        <span className="font-mono text-amber-300 font-bold block">{activePlugin.params.preDelayMs || 22} ms</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <label className="text-slate-400 block">Stereo Width (3D Spread):</label>
                        <input
                          type="range"
                          min="0.2"
                          max="1.5"
                          step="0.1"
                          value={activePlugin.params.stereoWidth || 1.0}
                          onChange={(e) => handleUpdateParams(activePlugin.slotIndex, { stereoWidth: parseFloat(e.target.value) })}
                          className="w-full accent-amber-500"
                        />
                        <span className="font-mono text-amber-300 font-bold block">{activePlugin.params.stereoWidth || 1.0}x</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Somatic Sub Braam GUI */}
                {activePlugin.type === 'sub_braam' && (
                  <div className="space-y-5">
                    <div className="p-5 rounded-xl bg-gradient-to-r from-rose-950/50 via-slate-900 to-rose-950/50 border border-rose-500/30 text-center space-y-3">
                      <span className="text-xs font-mono font-bold text-rose-300 uppercase tracking-wider block">
                        SOMATIC INFRASONIC RESONATOR (10 Hz — 20 Hz)
                      </span>
                      <p className="text-3xl font-extrabold font-mono text-rose-400">
                        {activePlugin.params.frequencyHz || 14} Hz
                      </p>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Delivers physical acoustic gravity to sub-bass drops and percussion. Below human hearing threshold, felt directly in the chest cavity.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <label className="text-slate-400 block">Sub Resonance Frequency:</label>
                        <input
                          type="range"
                          min="10"
                          max="20"
                          step="0.5"
                          value={activePlugin.params.frequencyHz || 14}
                          onChange={(e) => handleUpdateParams(activePlugin.slotIndex, { frequencyHz: parseFloat(e.target.value) })}
                          className="w-full accent-rose-500"
                        />
                        <span className="font-mono text-rose-300 font-bold block">{activePlugin.params.frequencyHz || 14} Hz</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <label className="text-slate-400 block">Sub Infrasound Gain:</label>
                        <input
                          type="range"
                          min="-6"
                          max="12"
                          step="0.5"
                          value={activePlugin.params.subGainDb || 3.0}
                          onChange={(e) => handleUpdateParams(activePlugin.slotIndex, { subGainDb: parseFloat(e.target.value) })}
                          className="w-full accent-rose-500"
                        />
                        <span className="font-mono text-rose-300 font-bold block">+{activePlugin.params.subGainDb || 3.0} dB</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <label className="text-slate-400 block">Punch Transient Attack:</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={activePlugin.params.punchTransient || 65}
                          onChange={(e) => handleUpdateParams(activePlugin.slotIndex, { punchTransient: parseInt(e.target.value) })}
                          className="w-full accent-rose-500"
                        />
                        <span className="font-mono text-rose-300 font-bold block">{activePlugin.params.punchTransient || 65}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Vāc Opto Leveler GUI */}
                {activePlugin.type === 'compressor' && (
                  <div className="space-y-5">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-200">OPTO GAIN REDUCTION</span>
                        <p className="text-[11px] text-slate-400">Smooth musical dynamics control with lookahead true-peak protection</p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-xs text-slate-500 block">Ceiling Margin:</span>
                        <span className="text-sm font-bold text-emerald-400">-0.3 dBTP</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <label className="text-slate-400 block">Threshold (dB):</label>
                        <input
                          type="range"
                          min="-40"
                          max="0"
                          step="1"
                          value={activePlugin.params.thresholdDb || -18}
                          onChange={(e) => handleUpdateParams(activePlugin.slotIndex, { thresholdDb: parseInt(e.target.value) })}
                          className="w-full accent-amber-500"
                        />
                        <span className="font-mono text-amber-300 font-bold block">{activePlugin.params.thresholdDb || -18} dB</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <label className="text-slate-400 block">Compression Ratio:</label>
                        <input
                          type="range"
                          min="1.5"
                          max="16.0"
                          step="0.5"
                          value={activePlugin.params.ratio || 3.5}
                          onChange={(e) => handleUpdateParams(activePlugin.slotIndex, { ratio: parseFloat(e.target.value) })}
                          className="w-full accent-amber-500"
                        />
                        <span className="font-mono text-amber-300 font-bold block">{activePlugin.params.ratio || 3.5}:1</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <label className="text-slate-400 block">Makeup Gain (dB):</label>
                        <input
                          type="range"
                          min="0"
                          max="12"
                          step="0.5"
                          value={activePlugin.params.makeupGainDb || 2.5}
                          onChange={(e) => handleUpdateParams(activePlugin.slotIndex, { makeupGainDb: parseFloat(e.target.value) })}
                          className="w-full accent-amber-500"
                        />
                        <span className="font-mono text-amber-300 font-bold block">+{activePlugin.params.makeupGainDb || 2.5} dB</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                <Sliders className="w-12 h-12 text-slate-600" />
                <h4 className="text-sm font-bold text-slate-300">No Plugin Selected</h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Click on an insert slot in the rack to the left, or use the "+Add" buttons to instantiate a new DSP processor.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.08] bg-slate-950/70 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Wasm Sandboxed • SIMD Hardware Acceleration • 96kHz / 32-bit Float</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition cursor-pointer shadow-lg shadow-amber-600/20"
            >
              Apply & Close Plugin Host
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
