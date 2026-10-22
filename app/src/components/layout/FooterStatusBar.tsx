import React from 'react';
import { GitBranch, Radio, Sliders, CheckCircle2, Cpu, HardDrive, Activity } from 'lucide-react';
import { Raga, Track, PluginInstance, ArrangementSection } from '../../types/daw';

interface FooterStatusBarProps {
  activeRaga: Raga;
  baseSaHz: number;
  activeBranchName: string;
  lastAutoSaveTime: string;
  midiDeviceCount: number;
  masterPlugins: PluginInstance[];
  tracks: Track[];
  activeSection?: ArrangementSection | null;
  toastMessage: string | null;
  workingMemoryGB: number;
  onOpenShrutiMandala: () => void;
  onOpenSnapshots: () => void;
  onOpenMidiModal: () => void;
  onOpenPlugins: () => void;
  onOpenArranger: () => void;
  onOpenAIOrchestrator: () => void;
  onOpenSpectrumModal: () => void;
}

export const FooterStatusBar: React.FC<FooterStatusBarProps> = ({
  activeRaga,
  baseSaHz,
  activeBranchName,
  lastAutoSaveTime,
  midiDeviceCount,
  masterPlugins,
  tracks,
  activeSection,
  toastMessage,
  workingMemoryGB,
  onOpenShrutiMandala,
  onOpenSnapshots,
  onOpenMidiModal,
  onOpenPlugins,
  onOpenArranger,
  onOpenAIOrchestrator,
  onOpenSpectrumModal,
}) => {
  const activePluginCount = 
    masterPlugins.filter(p => p.enabled).length + 
    tracks.reduce((acc, t) => acc + (t.plugins?.filter(p => p.enabled).length || 0), 0);

  return (
    <footer className="h-7 shrink-0 relative z-30 border-t border-white/[0.12] bg-[#06080e] px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
      {/* Left: Modal bridge readout & Session Branch */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenShrutiMandala}
          title="Open 22 Shrutis Just Intonation & Moveable Sa Tuning Hub"
          className="flex items-center gap-1 text-amber-400 hover:underline cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
          Raga: {activeRaga.name} ({activeRaga.tradition}) • Sa: {baseSaHz.toFixed(1)}Hz
        </button>
        <span className="text-slate-600">|</span>
        <span>Western Mode: <span className="text-slate-200">{activeRaga.westernMode}</span></span>
        <span className="text-slate-600">|</span>
        <span>Vadi: <span className="text-amber-300">{activeRaga.vadi}</span> • Samvadi: <span className="text-amber-300">{activeRaga.samvadi}</span></span>
        <span className="text-slate-600">|</span>
        <button
          onClick={onOpenSnapshots}
          className="flex items-center gap-1 text-emerald-400/90 hover:text-emerald-300 hover:underline cursor-pointer transition"
          title="Open Session Snapshots & Branch Tree"
        >
          <GitBranch className="w-3 h-3 text-emerald-400" />
          Branch: <span className="text-emerald-200">{activeBranchName}</span> (Saved {lastAutoSaveTime})
        </button>
        <span className="text-slate-600">|</span>
        <button
          onClick={onOpenMidiModal}
          className="flex items-center gap-1 text-emerald-400/90 hover:text-emerald-300 hover:underline cursor-pointer transition"
          title="Open Hardware MIDI & MPE Controller"
        >
          <Radio className="w-3 h-3 text-emerald-400" />
          MIDI: <span className="text-emerald-200">{midiDeviceCount > 0 ? `${midiDeviceCount} Active` : 'Ready'}</span>
        </button>
        <span className="text-slate-600">|</span>
        <button
          onClick={onOpenPlugins}
          className="flex items-center gap-1 text-indigo-400/90 hover:text-indigo-300 hover:underline cursor-pointer transition"
          title="Open Audio Plugin Host Rack"
        >
          <Sliders className="w-3 h-3 text-indigo-400" />
          Plugins: <span className="text-indigo-200">{activePluginCount} Active</span>
        </button>
        <span className="text-slate-600">|</span>
        <button
          onClick={onOpenArranger}
          className="flex items-center gap-1 text-amber-400/90 hover:text-amber-300 hover:underline cursor-pointer transition"
          title="Open Arrangement Assistant"
        >
          <span className="text-xs">📐</span>
          Movement: <span className="text-amber-200">{activeSection ? `${activeSection.sanskritName || activeSection.name.split(' ')[0]} (b${activeSection.startBar}-${activeSection.startBar + activeSection.durationBars - 1})` : 'Full Suite'}</span>
        </button>
      </div>

      {/* Center: Live Notification Toast */}
      {toastMessage && (
        <div className="flex items-center gap-2 text-emerald-300 font-sans font-semibold text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Right: Mac M1 Max 32GB Hardware Footprint */}
      <div className="flex items-center gap-4 text-[10px]">
        <span className="flex items-center gap-1.5 text-cyan-400">
          <Cpu className="w-3 h-3" /> Apple M1 Max (32GB Unified)
        </span>
        <span className="text-slate-600">•</span>
        <button
          onClick={onOpenAIOrchestrator}
          title="Open Apple Silicon M1 Max AI Suite & Memory Budgeter"
          className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer transition"
        >
          <HardDrive className="w-3 h-3" /> {workingMemoryGB.toFixed(1)} GB / 18 GB Allocated ({(32 - workingMemoryGB).toFixed(1)} GB Free)
        </button>
        <span className="text-slate-600">•</span>
        <button
          onClick={onOpenSpectrumModal}
          title="Open Native 96kHz / 32-Bit Float DSP Engine"
          className="text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer transition"
        >
          <Activity className="w-3 h-3" />
          96 kHz / 32-bit Float CoreAudio
        </button>
      </div>
    </footer>
  );
};
