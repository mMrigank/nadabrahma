import React, { useState, useEffect, useMemo } from 'react';
import {
  Cpu, HardDrive, List, Brain, Sparkles, Square, Zap, Gauge, Play, Check
} from 'lucide-react';
import {
  aiModelData,
  calculateWorkingMemoryGB,
  getOptimizedLoadedModels,
  handleOptimizeMemory,
  type AIModel,
  type AIModelSpec
} from '../lib/aiModelData';
import { Raga, Tala, Track } from '../types/daw';

interface AIModelOrchestratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseSaHz: number;
  activeRaga: Raga;
  activeTala: Tala;
  tracks: Track[];
  focusedTrackId?: string | null;
  onGenerateAIClip: (trackId: string, prompt: string, model: AIModel, durationBars: number) => void;
}

type Tab = 'models' | 'routing' | 'prompt';

const MEMORY_CEILING_GB = 18;

export const AIModelOrchestratorModal: React.FC<AIModelOrchestratorModalProps> = ({
  isOpen,
  onClose,
  baseSaHz,
  activeRaga,
  activeTala,
  tracks,
  focusedTrackId,
  onGenerateAIClip
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('models');
  const [loadedModels, setLoadedModels] = useState<AIModel[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [routing, setRouting] = useState<Record<string, AIModel>>({});
  const [promptInput, setPromptInput] = useState('');
  const [targetTrackId, setTargetTrackId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [justSynthesized, setJustSynthesized] = useState(false);

  // Seed routing from the tracks' own model bindings; focus the requested track.
  useEffect(() => {
    if (!isOpen) return;
    const seed: Record<string, AIModel> = {};
    tracks.forEach((t) => {
      seed[t.id] = t.model;
    });
    setRouting(seed);
    setTargetTrackId(focusedTrackId ?? tracks[0]?.id ?? '');
  }, [isOpen, tracks, focusedTrackId]);

  useEffect(() => {
    if (isOpen) setLoadedModels(getOptimizedLoadedModels());
  }, [isOpen]);

  const memoryUsedGB = useMemo(() => calculateWorkingMemoryGB(), [loadedModels]);

  const specById = useMemo(() => {
    const map: Record<string, AIModelSpec> = {};
    aiModelData.forEach((m) => {
      map[m.id] = m;
    });
    return map;
  }, []);

  // Dual-conditioned prompt: raga + western mode + tala + Sa Hz + DSP tokens
  const dualConditionedPrompt = useMemo(() => {
    const dspTags = ['[48k Air]', '[10Hz Sub]'];
    return [
      `[Raga:${activeRaga.name}]`,
      `[Mode:${activeRaga.westernMode}]`,
      `[Swara:${activeRaga.swaras}]`,
      `[Vadi:${activeRaga.vadi}]`,
      `[Samvadi:${activeRaga.samvadi}]`,
      `[Sa:${baseSaHz.toFixed(2)}Hz]`,
      `[Tala:${activeTala.name}/${activeTala.matras} matras]`,
      `[22 Shrutis Just Intonation]`,
      ...dspTags,
      promptInput.trim() ? `:: ${promptInput.trim()}` : ''
    ]
      .filter(Boolean)
      .join(' ');
  }, [activeRaga, activeTala, baseSaHz, promptInput]);

  const handleToggleModel = (model: AIModel) => {
    setLoadedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    await handleOptimizeMemory();
    setLoadedModels(getOptimizedLoadedModels());
    setIsOptimizing(false);
  };

  const handleGenerate = () => {
    if (!promptInput.trim() || !targetTrackId || isGenerating) return;

    setIsGenerating(true);
    setProgress(0);
    setJustSynthesized(false);

    const timer = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev + 12;
        if (next >= 100) {
          window.clearInterval(timer);
          setIsGenerating(false);
          setJustSynthesized(true);
          onGenerateAIClip(
            targetTrackId,
            dualConditionedPrompt,
            routing[targetTrackId] ?? 'soundfont_native',
            8
          );
          window.setTimeout(() => setJustSynthesized(false), 2500);
          return 100;
        }
        return next;
      });
    }, 120);
  };

  if (!isOpen) return null;

  const memoryPct = Math.min(100, (memoryUsedGB / MEMORY_CEILING_GB) * 100);
  const memoryTone =
    memoryUsedGB > 16 ? 'text-rose-400' : memoryUsedGB > 14 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-[900px] max-w-[95vw] max-h-[92vh] flex flex-col bg-[#0a0d14] border border-amber-500/30 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/40 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-amber-300 flex items-center gap-2">
              <Brain className="w-5 h-5" /> AI Model Orchestrator
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              Apple MLX / Metal · local inference · {MEMORY_CEILING_GB} GB working ceiling
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors text-amber-400"
          >
            <Square className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800/40 bg-slate-900/40 shrink-0">
          {([
            { id: 'models' as Tab, label: 'Models & MLX Engines', Icon: Cpu },
            { id: 'routing' as Tab, label: 'Track Routing Matrix', Icon: List },
            { id: 'prompt' as Tab, label: 'Prompt Playground', Icon: Sparkles }
          ]).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === id
                  ? 'bg-amber-500/10 text-amber-300 border-b-2 border-amber-500'
                  : 'text-slate-400 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ── Tab 1: Models ── */}
          {activeTab === 'models' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiModelData.map((model) => {
                  const isLoaded = loadedModels.includes(model.id);
                  return (
                    <button
                      key={model.id}
                      onClick={() => handleToggleModel(model.id)}
                      className={`text-left rounded-lg border p-3.5 transition-colors cursor-pointer ${
                        isLoaded
                          ? 'border-amber-500/40 bg-amber-500/[0.06]'
                          : 'border-slate-800/60 bg-slate-900/30 hover:border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-sm font-semibold text-slate-200">{model.name}</span>
                        <span
                          className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            isLoaded
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-800/80 text-slate-500'
                          }`}
                        >
                          {isLoaded ? 'RESIDENT' : 'DORMANT'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
                        {model.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-slate-500">
                        <span className="text-slate-400">{model.quantization}</span>
                        <span>{model.memoryFootprintGB.toFixed(1)} GB</span>
                        <span>{model.acceleration.join(' · ')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Memory budgeter */}
              <div className="rounded-lg border border-slate-800/60 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-300 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5" /> Unified Memory Footprint
                  </span>
                  <span className={`font-mono font-semibold ${memoryTone}`}>
                    {memoryUsedGB.toFixed(2)} GB / {MEMORY_CEILING_GB} GB
                  </span>
                </div>
                <div className="relative w-full h-2.5 bg-slate-800/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      memoryUsedGB > 16
                        ? 'bg-rose-500/70'
                        : memoryUsedGB > 14
                          ? 'bg-amber-500/70'
                          : 'bg-emerald-500/70'
                    }`}
                    style={{ width: `${memoryPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>
                    Headroom: {(MEMORY_CEILING_GB - memoryUsedGB).toFixed(2)} GB reserved for macOS
                  </span>
                  <span>{loadedModels.length} model(s) resident</span>
                </div>
                <button
                  onClick={handleOptimize}
                  disabled={isOptimizing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-slate-800/70 hover:bg-slate-700/70 text-slate-300 border border-slate-700/60 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Zap className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-pulse' : ''}`} />
                  {isOptimizing ? 'Purging dormant weights…' : 'Optimize Memory Residency'}
                </button>
              </div>
            </div>
          )}

          {/* ── Tab 2: Routing ── */}
          {activeTab === 'routing' && (
            <div className="space-y-3">
              {tracks.map((track) => (
                <div key={track.id} className="rounded-lg border border-slate-800/60 p-3.5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: track.color }}
                      />
                      <span className="text-sm font-semibold text-slate-200 truncate">
                        {track.name}
                      </span>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {specById[routing[track.id]]?.name ?? routing[track.id]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {aiModelData.map((m) => {
                      const assigned = routing[track.id] === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setRouting((p) => ({ ...p, [track.id]: m.id }))}
                          className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                            assigned
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800/60 text-slate-400 border border-slate-700/40 hover:bg-slate-700/60'
                          }`}
                        >
                          {m.name.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Tab 3: Prompt ── */}
          {activeTab === 'prompt' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-800/60 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Dual-Conditioned Prompt (live)</span>
                  <span className="text-slate-500">raga ↔ western · tala · Sa Hz · DSP</span>
                </div>
                <div className="bg-slate-950/60 rounded p-3 font-mono text-[11px] text-amber-200/90 leading-relaxed break-words">
                  {dualConditionedPrompt}
                </div>
              </div>

              <div className="rounded-lg border border-slate-800/60 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">Phrase Direction</span>
                  <button
                    onClick={() =>
                      setPromptInput(
                        `Slow Alap, Vadi-Samvadi meend glide lock, meditative ${activeRaga.name} theme`
                      )
                    }
                    className="px-2 py-1 rounded text-[10px] font-mono text-slate-400 hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    Use Raga Template
                  </button>
                </div>
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  rows={3}
                  placeholder="Describe the phrase to synthesise…"
                  className="w-full bg-slate-950/60 rounded border border-slate-700/40 p-2.5 font-mono text-xs text-slate-200 outline-none focus:border-amber-500/60 resize-none"
                />
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">Target</span>
                  <select
                    value={targetTrackId}
                    onChange={(e) => setTargetTrackId(e.target.value)}
                    className="flex-1 bg-slate-950/60 rounded border border-slate-700/40 px-2 py-1.5 font-mono text-xs text-slate-200 outline-none focus:border-amber-500/60 cursor-pointer"
                  >
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!promptInput.trim() || !targetTrackId || isGenerating}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    justSynthesized
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : isGenerating || !promptInput.trim() || !targetTrackId
                        ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                        : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35'
                  }`}
                >
                  {justSynthesized ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Take committed to timeline
                    </>
                  ) : isGenerating ? (
                    <>
                      <Play className="w-3.5 h-3.5 animate-pulse" /> Synthesising… {progress}%
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Synthesize Take via MLX
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800/40 px-5 py-2.5 flex items-center justify-between text-[10px] font-mono text-slate-500 shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" />
              <span className={memoryTone}>{memoryUsedGB.toFixed(1)} GB / {MEMORY_CEILING_GB} GB</span>
            </span>
            <span>{loadedModels.length} / {aiModelData.length} resident</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Raga: <span className="text-amber-300/80">{activeRaga.name}</span></span>
            <span>Tala: <span className="text-amber-300/80">{activeTala.name}</span></span>
            <span>Sa: <span className="text-amber-300/80">{baseSaHz.toFixed(2)} Hz</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};
