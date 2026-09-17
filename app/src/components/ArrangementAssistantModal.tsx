import React, { useState } from 'react';
import { 
  X, Layers, Sparkles, Activity, Clock, Compass, Music, 
  ChevronRight, ArrowRight, Play, RotateCcw, Plus, Trash2,
  Sliders, ShieldCheck, CheckCircle2, Flame, Zap
} from 'lucide-react';
import { 
  ArrangementSection, ArrangementPreset, ClassicalMovementType, 
  WesternStructureType, Track, Raga, Tala, TrackRole 
} from '../types/daw';
import { 
  arrangementEngine, ARRANGEMENT_PRESETS, MOVEMENT_META 
} from '../lib/arrangementEngine';
import { INSTRUMENT_FAMILIES } from '../constants/instruments';

interface ArrangementAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: ArrangementSection[];
  onUpdateSections: (newSections: ArrangementSection[]) => void;
  onApplyFullArrangement: (newSections: ArrangementSection[], populateClips: boolean) => void;
  tracks: Track[];
  activeRaga: Raga;
  activeTala: Tala;
  baseSaHz: number;
  bpm: number;
  totalBars: number;
  onTotalBarsChange: (bars: number) => void;
}

export const ArrangementAssistantModal: React.FC<ArrangementAssistantModalProps> = ({
  isOpen,
  onClose,
  sections,
  onUpdateSections,
  onApplyFullArrangement,
  tracks,
  activeRaga,
  activeTala,
  baseSaHz,
  bpm,
  totalBars,
  onTotalBarsChange
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'bridge' | 'orchestration'>('timeline');
  const [selectedSectionId, setSelectedSectionId] = useState<string>(sections[0]?.id || '');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('khayal_64');
  const [localSections, setLocalSections] = useState<ArrangementSection[]>(sections);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const selectedSection = localSections.find(s => s.id === selectedSectionId) || localSections[0];

  const handleLoadPreset = (presetId: string) => {
    const preset = ARRANGEMENT_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(presetId);
    const newSections = arrangementEngine.instantiatePreset(preset);
    setLocalSections(newSections);
    if (selectedSectionId && !newSections.find(s => s.id === selectedSectionId)) {
      setSelectedSectionId(newSections[0].id);
    }
    if (preset.totalBars !== totalBars) {
      onTotalBarsChange(preset.totalBars);
    }
    showToast(`Loaded "${preset.name}" preset (${preset.totalBars} bars)!`);
  };

  const handleUpdateSelectedSection = (updates: Partial<ArrangementSection>) => {
    setLocalSections(prev => prev.map(s => {
      if (s.id !== selectedSection.id) return s;
      const updated = { ...s, ...updates };
      // If movement type changed, sync default colors, icons, and descriptions
      if (updates.movementType && updates.movementType !== s.movementType) {
        const meta = MOVEMENT_META[updates.movementType];
        updated.color = meta.defaultColor;
        updated.energyLevel = meta.defaultEnergy;
        updated.sanskritName = meta.sanskritName.split(' ')[0];
        updated.westernEquivalent = meta.westernEquivalent;
      }
      return updated;
    }));
  };

  const handleAddSection = () => {
    const lastSec = localSections[localSections.length - 1];
    const newStart = lastSec ? lastSec.startBar + lastSec.durationBars : 1;
    const newDuration = 16;
    const newSec: ArrangementSection = {
      id: `sec-custom-${Date.now()}`,
      name: 'Madhya Gat (Taans & Layakari)',
      sanskritName: 'मध्य गत',
      movementType: 'madhya_gat',
      westernEquivalent: 'chorus',
      startBar: newStart,
      durationBars: newDuration,
      color: MOVEMENT_META.madhya_gat.defaultColor,
      targetBpm: bpm,
      tempoRamp: 'none',
      activeRoles: ['solo_instrument', 'lead_vocal', 'percussion_tala'],
      description: 'Medium tempo structured composition with lively Taans and Layakari variations.',
      energyLevel: 3
    };
    const updated = [...localSections, newSec];
    setLocalSections(updated);
    setSelectedSectionId(newSec.id);
    if (newStart + newDuration - 1 > totalBars) {
      onTotalBarsChange(newStart + newDuration - 1);
    }
    showToast('Added new arrangement movement!');
  };

  const handleDeleteSection = (id: string) => {
    if (localSections.length <= 1) {
      showToast('Arrangement must have at least one section!');
      return;
    }
    const updated = localSections.filter(s => s.id !== id);
    setLocalSections(updated);
    setSelectedSectionId(updated[0].id);
    showToast('Removed arrangement movement.');
  };

  const handleApplyOnlySections = () => {
    onUpdateSections(localSections);
    showToast('Applied section markers to Timeline ruler!');
    onClose();
  };

  const handleApplyAndGenerateClips = () => {
    onApplyFullArrangement(localSections, true);
    showToast(`✨ Generated full multi-track arrangement across all ${tracks.length} tracks!`);
    onClose();
  };

  const totalArrangementDuration = localSections.reduce((acc, s) => Math.max(acc, s.startBar + s.durationBars - 1), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="flex flex-col w-full max-w-5xl h-[90vh] bg-[#080b12] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-100">
        
        {/* Header Strip */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-300 text-lg shadow-sm">
              📐
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-wide text-slate-100">
                  Intelligent Arrangement Assistant & Section Arranger
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] border border-amber-500/30">
                  Classical Suite Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Macro Indian Classical Movements (Alap $\to$ Jor $\to$ Gat $\to$ Jhala $\to$ Tihai) with Dual-Conditioned Western Bridge
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Raga Context Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-750 font-mono text-xs">
              <span className="text-amber-400 font-semibold">{activeRaga.name}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">{activeTala.name} ({activeTala.matras}m)</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-300">{baseSaHz.toFixed(1)}Hz</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action / Preset Bar */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-white/[0.08] bg-slate-950/40 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Suite Preset:</span>
            <select
              value={selectedPresetId}
              onChange={(e) => handleLoadPreset(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 text-xs focus:outline-none focus:border-amber-500"
            >
              {ARRANGEMENT_PRESETS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.totalBars} bars)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switchers */}
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-amber-600 text-slate-950 font-bold'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
              }`}
            >
              Timeline Arranger
            </button>
            <button
              onClick={() => setActiveTab('bridge')}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'bridge'
                  ? 'bg-amber-600 text-slate-950 font-bold'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
              }`}
            >
              Raga-to-Western Bridge
            </button>
            <button
              onClick={() => setActiveTab('orchestration')}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'orchestration'
                  ? 'bg-amber-600 text-slate-950 font-bold'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
              }`}
            >
              Instrument Orchestration
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddSection}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs transition cursor-pointer border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Add Movement</span>
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {toastMessage && (
          <div className="px-6 py-2 bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
          
          {/* TAB 1: Timeline Arranger & Inspector */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              
              {/* Macro Section Timeline Strip */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2 font-semibold text-slate-200">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span>Arrangement Timeline Overview (Bars 1 to {totalArrangementDuration})</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    {localSections.length} movements • {totalArrangementDuration} Total Bars
                  </span>
                </div>

                {/* Interactive Visual Movement Strip */}
                <div className="flex w-full h-14 rounded-xl overflow-hidden border border-white/[0.1] bg-slate-900/80 p-1 gap-1">
                  {localSections.map((sec, idx) => {
                    const isSelected = sec.id === selectedSection.id;
                    const meta = MOVEMENT_META[sec.movementType] || MOVEMENT_META.alap;
                    const widthPercent = (sec.durationBars / totalArrangementDuration) * 100;
                    return (
                      <div
                        key={sec.id}
                        onClick={() => setSelectedSectionId(sec.id)}
                        style={{ width: `${widthPercent}%` }}
                        className={`h-full rounded-lg px-2.5 py-1.5 flex flex-col justify-between cursor-pointer transition-all select-none relative overflow-hidden ${
                          isSelected 
                            ? 'ring-2 ring-amber-400 shadow-lg brightness-110' 
                            : 'hover:brightness-105 opacity-85 hover:opacity-100'
                        }`}
                      >
                        {/* Background tone */}
                        <div 
                          className="absolute inset-0 opacity-25"
                          style={{ backgroundColor: sec.color }}
                        />

                        {/* Top info */}
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="font-bold text-xs truncate text-slate-100 flex items-center gap-1">
                            <span>{meta.icon}</span>
                            <span className="truncate">{sec.sanskritName || meta.sanskritName.split(' ')[0]}</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-300">
                            {sec.durationBars}b
                          </span>
                        </div>

                        {/* Bottom info */}
                        <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="capitalize text-amber-200/90 font-medium truncate max-w-[90px]">
                            {sec.westernEquivalent}
                          </span>
                          <span className="font-mono text-[9px] text-slate-300">
                            {sec.targetBpm} BPM
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Section Inspector */}
              {selectedSection && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: selectedSection.color }}
                      />
                      <span className="font-bold text-sm text-slate-100">
                        Movement Inspector: {selectedSection.name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-750 text-[10px] font-mono text-amber-300">
                        Bars {selectedSection.startBar} - {selectedSection.startBar + selectedSection.durationBars - 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteSection(selectedSection.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-600/30 transition cursor-pointer text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Inspector Fields Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    
                    {/* Field 1: Movement Type (Indian Classical) */}
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1 font-medium">
                        Classical Movement (Laya / Form)
                      </label>
                      <select
                        value={selectedSection.movementType}
                        onChange={(e) => handleUpdateSelectedSection({ movementType: e.target.value as ClassicalMovementType })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500"
                      >
                        {Object.entries(MOVEMENT_META).map(([type, meta]) => (
                          <option key={type} value={type}>
                            {meta.icon} {meta.englishTitle}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {MOVEMENT_META[selectedSection.movementType]?.laya}
                      </span>
                    </div>

                    {/* Field 2: Western Equivalent */}
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1 font-medium">
                        Western Song Equivalent
                      </label>
                      <select
                        value={selectedSection.westernEquivalent}
                        onChange={(e) => handleUpdateSelectedSection({ westernEquivalent: e.target.value as WesternStructureType })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 capitalize"
                      >
                        <option value="intro">Intro (Ambient Pad / Theme)</option>
                        <option value="verse">Verse (Melodic Stasis / Theme)</option>
                        <option value="pre_chorus">Pre-Chorus (Rhythmic Build / Jor)</option>
                        <option value="chorus">Chorus (Hook / Antara / Gat)</option>
                        <option value="bridge">Bridge (Modulation / Sanchari)</option>
                        <option value="breakdown">Breakdown (Atmospheric Drop)</option>
                        <option value="drop">Drop (Peak Climax / Drut Jhala)</option>
                        <option value="outro">Outro (Tihai Cadence / Resolution)</option>
                      </select>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Dual-conditioned prompt bridge identifier
                      </span>
                    </div>

                    {/* Field 3: Duration & Bars */}
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1 font-medium">
                        Duration (Bars)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="4"
                          max="128"
                          step="4"
                          value={selectedSection.durationBars}
                          onChange={(e) => handleUpdateSelectedSection({ durationBars: Math.max(4, parseInt(e.target.value) || 4) })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                        />
                        <span className="text-slate-400 text-xs">bars</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Multiples of Tala cycle ({activeTala.matras} matras)
                      </span>
                    </div>

                    {/* Field 4: Target BPM & Tempo Ramp */}
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1 font-medium">
                        Target Tempo (BPM)
                      </label>
                      <input
                        type="number"
                        min="40"
                        max="240"
                        value={selectedSection.targetBpm}
                        onChange={(e) => handleUpdateSelectedSection({ targetBpm: Math.max(40, Math.min(240, parseInt(e.target.value) || 96)) })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Field 5: Tempo Transition / Laya Accelerando */}
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1 font-medium">
                        Laya Accelerando (Tempo Ramp)
                      </label>
                      <select
                        value={selectedSection.tempoRamp || 'none'}
                        onChange={(e) => handleUpdateSelectedSection({ tempoRamp: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500"
                      >
                        <option value="none">Constant Tempo (No Ramp)</option>
                        <option value="linear_accel">Linear Accelerando (Gradual Speed-up)</option>
                        <option value="exp_accel">Exponential Accelerando (Exciting Climax)</option>
                      </select>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Phase-locked to Tala Sam
                      </span>
                    </div>

                    {/* Field 6: Energy Level (1 to 5) */}
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1 font-medium">
                        Movement Energy (Intensity)
                      </label>
                      <div className="flex items-center gap-1.5 py-2">
                        {[1, 2, 3, 4, 5].map(lvl => (
                          <button
                            key={lvl}
                            onClick={() => handleUpdateSelectedSection({ energyLevel: lvl })}
                            className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center transition cursor-pointer ${
                              selectedSection.energyLevel >= lvl
                                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                                : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                        <span className="text-[10px] text-slate-400 ml-2">
                          {selectedSection.energyLevel === 1 ? 'Contemplative' :
                           selectedSection.energyLevel === 2 ? 'Flowing Pulse' :
                           selectedSection.energyLevel === 3 ? 'Medium Groove' :
                           selectedSection.energyLevel === 4 ? 'High Intensity' : 'Peak Ecstasy'}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Section Description & Characteristic Notes */}
                  <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
                    <p className="text-slate-300 leading-relaxed text-xs">
                      <span className="font-semibold text-amber-300">Musicological Profile: </span>
                      {MOVEMENT_META[selectedSection.movementType]?.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {MOVEMENT_META[selectedSection.movementType]?.characteristicFeatures.map((feat, fIdx) => (
                        <span 
                          key={fIdx}
                          className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 border border-slate-700 flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 2: Dual-Conditioned Classical-to-Western Form Bridge */}
          {activeTab === 'bridge' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <h3 className="font-bold text-slate-200 text-sm mb-1 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400" />
                  Dual-Conditioned Indian Classical $\longleftrightarrow$ Western Song Architecture Bridge
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Nādabrahma continuously bridges ancient Indian musical concepts with contemporary Western production paradigms.
                  The table below illustrates how the classical suite movements map into modern timeline sections for prompt generation and arrangement orchestration.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {Object.entries(MOVEMENT_META).map(([type, meta]) => (
                  <div 
                    key={type}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{meta.icon}</span>
                        <div>
                          <h4 className="font-bold text-slate-100 text-xs">{meta.englishTitle}</h4>
                          <span className="text-[10px] text-amber-400 font-serif">{meta.sanskritName}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono uppercase">
                          $\longleftrightarrow$ {meta.westernEquivalent}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {meta.description}
                    </p>

                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Laya: <span className="text-slate-300 font-medium">{meta.laya}</span></span>
                      <span>Meter: <span className="text-slate-300 font-medium">{meta.meterType}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Instrument Orchestration Matrix */}
          {activeTab === 'orchestration' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <h3 className="font-bold text-slate-200 text-sm mb-1 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Movement Multi-Track Instrument Orchestration Matrix
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Configure which instrument tracks participate in each classical movement. 
                  Notice that per classical performance tradition, percussion is automatically bypassed in unmetered Alap, and full rhythm sections enter during Gat and Jhala.
                </p>
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-300 font-semibold text-[11px]">
                      <th className="p-3">Track / Instrument</th>
                      <th className="p-3">Family</th>
                      {localSections.map(sec => (
                        <th key={sec.id} className="p-3 text-center border-l border-slate-800/60">
                          <div>{sec.name.split(' ')[0]}</div>
                          <span className="text-[9px] text-slate-500 font-mono">{sec.durationBars}b</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                    {tracks.map(track => {
                      return (
                        <tr key={track.id} className="hover:bg-slate-900/40">
                          <td className="p-3 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: track.color }}></span>
                            <span className="font-medium text-slate-200">{track.name}</span>
                          </td>
                          <td className="p-3 text-slate-400 text-[10px]">
                            {track.busGroup}
                          </td>
                          {localSections.map(sec => {
                            const isChecked = sec.activeRoles.includes(track.role) || 
                              (track.busGroup === 'Percussion' && sec.movementType !== 'alap');
                            const isAlapPercussion = sec.movementType === 'alap' && track.busGroup === 'Percussion';

                            return (
                              <td key={sec.id} className="p-3 text-center border-l border-slate-800/60">
                                {isAlapPercussion ? (
                                  <span className="text-[10px] text-slate-600 font-mono" title="Percussion is traditionally forbidden in unmetered Alap">
                                    Muted
                                  </span>
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setLocalSections(prev => prev.map(s => {
                                        if (s.id !== sec.id) return s;
                                        const newRoles = checked
                                          ? Array.from(new Set([...s.activeRoles, track.role]))
                                          : s.activeRoles.filter(r => r !== track.role);
                                        return { ...s, activeRoles: newRoles };
                                      }));
                                    }}
                                    className="accent-amber-500 w-4 h-4 cursor-pointer"
                                  />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer Strip */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.08] bg-slate-950/80">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Moveable $Sa$ & 22 Shrutis Just Intonation aligned • Zero Aliasing</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleApplyOnlySections}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold transition cursor-pointer border border-slate-700"
            >
              Apply Section Markers to Ruler
            </button>

            <button
              onClick={handleApplyAndGenerateClips}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Full Multi-Track Arrangement ({tracks.length} Tracks)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
