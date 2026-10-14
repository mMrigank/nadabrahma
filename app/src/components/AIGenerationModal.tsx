import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, RefreshCw, Cpu, Check, AlertCircle, 
  Music, Wand2, Play, Volume2, ShieldCheck, ChevronDown 
} from 'lucide-react';
import { Track, Raga, Tala } from '../types/daw';
import { audioEngine } from '../lib/webAudioEngine';

export interface AIGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  onUpdateTrack: (trackId: string, updates: Partial<Track>) => void;
  onMountClip: (trackId: string, clipName: string, durationBars: number) => void;
  activeRaga?: Raga;
  activeTala?: Tala;
  baseSaHz?: number;
}

export const AIGenerationModal: React.FC<AIGenerationModalProps> = ({
  isOpen,
  onClose,
  track,
  onUpdateTrack,
  onMountClip,
  activeRaga,
  activeTala,
  baseSaHz = 138.59,
}) => {
  const [model, setModel] = useState<string>(track?.aiModelName || 'ACE-Step 1.5 XL Turbo');
  const [workflow, setWorkflow] = useState<string>(track?.aiWorkflow || 'Text to Music');
  const [modelVersion, setModelVersion] = useState<string>(track?.aiModelVersion || 'Original — full precision');
  const [prompt, setPrompt] = useState<string>(
    track?.aiPrompt || 'mellow melodic rock, soft acoustic guitar intro, deep groovy bass, harmonic female and male vocals'
  );
  const [lyrics, setLyrics] = useState<string>(
    track?.aiLyrics || '[verse]\nLine one\nLine two\n[chorus]\n...'
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [hardwareCheckTime, setHardwareCheckTime] = useState<string>('7:45:51 AM');
  const [availableMemoryGB, setAvailableMemoryGB] = useState<number>(14.663);
  const [neededMemoryGB, setNeededMemoryGB] = useState<number>(13.324);

  // Sync state when active track changes
  useEffect(() => {
    if (track) {
      if (track.aiModelName) setModel(track.aiModelName);
      if (track.aiWorkflow) setWorkflow(track.aiWorkflow);
      if (track.aiModelVersion) setModelVersion(track.aiModelVersion);
      if (track.aiPrompt) setPrompt(track.aiPrompt);
      if (track.aiLyrics) setLyrics(track.aiLyrics);
    }
  }, [track?.id]);

  if (!isOpen || !track) return null;

  const refreshHardwareCheck = () => {
    const now = new Date();
    setHardwareCheckTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    // Simulate real-time Apple Silicon unified memory query
    const jitter = (Math.random() - 0.5) * 0.8;
    setAvailableMemoryGB(Math.max(10, Math.round((14.663 + jitter) * 1000) / 1000));
  };

  const handleInjectRagaPrompt = () => {
    if (!activeRaga) return;
    const ragaAddition = ` ${activeRaga.name} melody (Swaras: ${activeRaga.swaras}), Moveable Sa at ${baseSaHz.toFixed(1)}Hz`;
    setPrompt(prev => prev.trim() + ',' + ragaAddition);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setProgress(5);

    // Save prompt & model metadata to track
    onUpdateTrack(track.id, {
      aiModelName: model,
      aiWorkflow: workflow,
      aiModelVersion: modelVersion,
      aiPrompt: prompt,
      aiLyrics: lyrics,
      aiStatusState: 'generating'
    });

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          setTimeout(() => {
            setIsGenerating(false);
            setProgress(100);
            onUpdateTrack(track.id, { aiStatusState: 'ready' });
            
            // Mount synthesized clip onto track timeline
            const clipTitle = `${track.name} (${model.split(' ')[0]})`;
            onMountClip(track.id, clipTitle, 8);
            
            // Play success audio chime
            audioEngine.playNotePreview(baseSaHz || 138.59, 0.4);
            onClose();
          }, 400);
          return 95;
        }
        return prev + 15;
      });
    }, 200);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100000] p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#12141a] border border-white/[0.12] rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Matching OpenStudio Image 3) */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#151821]">
          <h2 className="text-base font-semibold text-slate-100 tracking-tight">AI Generation</h2>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Top Badges & Title */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-white/[0.06] border border-white/[0.12] text-slate-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                AI TRACK
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                READY
              </span>
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight">{track.name}</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Generate a fresh music clip from a detailed style and arrangement prompt.
            </p>
          </div>

          {/* Model & Workflow Selectors (2 columns) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Model</label>
              <div className="relative">
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-[#181c26] border border-white/[0.12] rounded-lg px-3 py-2 text-slate-200 text-xs appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="ACE-Step 1.5 XL Turbo">ACE-Step 1.5 XL Turbo</option>
                  <option value="Stable Audio 3 Medium">Stable Audio 3 Medium</option>
                  <option value="YuE 2 Foundation">YuE 2 Foundation</option>
                  <option value="MiniMax Music 3">MiniMax Music 3</option>
                  <option value="VocalRender / SVS (48kHz)">VocalRender / SVS (48kHz)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Workflow</label>
              <div className="relative">
                <select
                  value={workflow}
                  onChange={(e) => setWorkflow(e.target.value)}
                  className="w-full bg-[#181c26] border border-white/[0.12] rounded-lg px-3 py-2 text-slate-200 text-xs appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Text to Music">Text to Music</option>
                  <option value="Text to Stem (BGM / Lead / Percussion)">Text to Stem (BGM / Lead / Percussion)</option>
                  <option value="Audio to Audio / Stem Inpainting">Audio to Audio / Stem Inpainting</option>
                  <option value="Lyrics to Singing Voice (SVS)">Lyrics to Singing Voice (SVS)</option>
                  <option value="Accompaniment to Vocal Overdub">Accompaniment to Vocal Overdub</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Model Version & Advisory Note */}
          <div>
            <div className="text-[11px] text-slate-400 mb-1">
              Use Original on this device. The INT8 version currently requires an NVIDIA GPU.
            </div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Model version</label>
            <div className="relative">
              <select
                value={modelVersion}
                onChange={(e) => setModelVersion(e.target.value)}
                className="w-full bg-[#181c26] border border-white/[0.12] rounded-lg px-3 py-2 text-slate-200 text-xs appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Original — full precision">Original — full precision</option>
                <option value="Q4_0 Quantized (Low VRAM / M1 Max)">Q4_0 Quantized (Low VRAM / M1 Max)</option>
                <option value="Q8_0 Quantized (High Fidelity)">Q8_0 Quantized (High Fidelity)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Uses the original model weights. Larger models may need slower CPU offloading.
            </div>
          </div>

          {/* Hardware Check Card ("Hardware check — estimated to fit") */}
          <div className="bg-[#151922] border border-white/[0.1] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 text-xs">Hardware check — estimated to fit</span>
              <button
                onClick={refreshHardwareCheck}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-[10px] font-medium transition cursor-pointer"
              >
                <RefreshCw className="w-2.5 h-2.5 text-slate-400" />
                <span>Refresh hardware check</span>
              </button>
            </div>

            <div className="text-[11px] font-mono text-emerald-400/90 flex items-center gap-1.5">
              <span>Apple Metal · BF16 · resident</span>
            </div>

            {/* Memory Bar & Numerical Readout */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                <span>Unified system memory</span>
                <span className="text-slate-400">
                  Estimated need: <strong className="text-slate-200 font-semibold">{neededMemoryGB.toFixed(3)} GiB</strong> | Available now: <strong className="text-emerald-300 font-semibold">{availableMemoryGB.toFixed(3)} GiB</strong>
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                  style={{ width: `${Math.min(100, (neededMemoryGB / 32) * 100)}%` }}
                />
              </div>
            </div>

            {/* Advisory Small Paragraphs */}
            <div className="pt-2 text-[10px] text-slate-500 space-y-1 leading-relaxed border-t border-white/[0.06]">
              <p>Checkpoint weights and duration-dependent working reserve; runtime peaks may differ.</p>
              <p>Checked at {hardwareCheckTime}. Refresh after closing other applications.</p>
              <p>Memory availability can change. Generation checks its execution policy again before loading.</p>
              <p>Other allocations can include a reusable, idle model cache. This check is advisory; the generation worker makes the final memory decision.</p>
            </div>
          </div>

          {/* PROMPT Section */}
          <div className="border border-white/[0.1] rounded-xl p-4 bg-[#141720] space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
                P R O M P T
              </span>
              {activeRaga && (
                <button
                  onClick={handleInjectRagaPrompt}
                  className="text-[10px] text-amber-300 hover:text-amber-200 flex items-center gap-1 font-mono cursor-pointer"
                >
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>+ {activeRaga.name} Prompt</span>
                </button>
              )}
            </div>

            {/* Prompt Textarea */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="w-full bg-[#181c26] border border-white/[0.12] rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none font-sans leading-relaxed"
                placeholder="Detailed style and arrangement prompt..."
              />
            </div>

            {/* Lyrics Textarea */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Lyrics</label>
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                rows={4}
                className="w-full bg-[#181c26] border border-white/[0.12] rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none font-mono leading-relaxed"
                placeholder="[verse]&#10;Lyrics line here...&#10;[chorus]..."
              />
            </div>
          </div>
        </div>

        {/* Modal Footer (Matching OpenStudio Close & Generate buttons) */}
        <div className="px-6 py-3.5 bg-[#151821] border-t border-white/[0.08] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-xs font-medium transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/60 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition cursor-pointer flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating {progress}%...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
