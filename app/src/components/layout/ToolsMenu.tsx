import React, { useState } from 'react';
import { 
  Sparkles, ChevronDown, Activity, Cpu, Scissors, 
  Compass, GitBranch, Folder, Radio, Sliders, HardDrive 
} from 'lucide-react';

interface ToolsMenuProps {
  onNewAITrack?: () => void;
  onOpenModelLibrary?: () => void;
  onOpenExtendedSpectrum?: () => void;
  onOpenVagdhenuLyrics?: () => void;
  onOpenAIOrchestrator?: () => void;
  onOpenStemForge?: () => void;
  onOpenSpatialAudio?: () => void;
  onOpenSnapshots?: () => void;
  onOpenDirectorWizard?: () => void;
  onOpenRenders?: () => void;
  onOpenMidiController?: () => void;
  midiDeviceCount?: number;
  onOpenPlugins?: () => void;
  onOpenArranger?: () => void;
  activeMovementName?: string;
}

export const ToolsMenu: React.FC<ToolsMenuProps> = ({
  onNewAITrack,
  onOpenModelLibrary,
  onOpenExtendedSpectrum,
  onOpenVagdhenuLyrics,
  onOpenAIOrchestrator,
  onOpenStemForge,
  onOpenSpatialAudio,
  onOpenSnapshots,
  onOpenDirectorWizard,
  onOpenRenders,
  onOpenMidiController,
  midiDeviceCount = 0,
  onOpenPlugins,
  onOpenArranger,
  activeMovementName,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="flex items-center gap-1.5 select-none">
      {/* 1. Main Engines & Tools Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-900/90 hover:bg-stone-800 text-amber-200 border border-amber-500/30 transition cursor-pointer font-medium text-xs shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Tools & Engines</span>
          <ChevronDown className="w-3 h-3 text-amber-500/70" />
        </button>

        {showDropdown && (
          <div className="absolute top-10 left-0 w-64 glass-dropdown rounded-xl p-2 z-[9999] flex flex-col gap-1 border border-slate-700/80 shadow-2xl bg-[#090c13]/98 backdrop-blur-2xl text-xs">
            <div className="text-[10px] text-slate-500 font-semibold uppercase px-2 py-1 tracking-wider border-b border-slate-800/60">
              Generative AI Suites
            </div>

            {onNewAITrack && (
              <button 
                onClick={() => { onNewAITrack(); setShowDropdown(false); }} 
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition text-left cursor-pointer font-medium"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="flex-1">New AI Track (ACE-Step)</span>
                <span className="text-[9px] font-mono text-amber-400/80 px-1 py-0.5 rounded bg-black/40">⌘⌃T</span>
              </button>
            )}

            {onOpenDirectorWizard && (
              <button 
                onClick={() => { onOpenDirectorWizard(); setShowDropdown(false); }} 
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-amber-950/40 text-amber-200 transition text-left cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Director’s Scene Wizard</span>
              </button>
            )}

            {onOpenAIOrchestrator && (
              <button 
                onClick={() => { onOpenAIOrchestrator(); setShowDropdown(false); }} 
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-purple-950/40 text-purple-300 transition text-left cursor-pointer"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Apple MLX AI Suite</span>
              </button>
            )}

            {onOpenModelLibrary && (
              <button 
                onClick={() => { onOpenModelLibrary(); setShowDropdown(false); }} 
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition text-left cursor-pointer"
              >
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                <span>Local AI Models Library</span>
              </button>
            )}

            <div className="text-[10px] text-slate-500 font-semibold uppercase px-2 py-1 tracking-wider border-b border-slate-800/60 mt-1">
              Acoustic & Studio DSP
            </div>

            {onOpenStemForge && (
              <button 
                onClick={() => { onOpenStemForge(); setShowDropdown(false); }} 
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cyan-950/40 text-cyan-300 transition text-left cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>StemForge Stem Separation</span>
              </button>
            )}

            {onOpenSpatialAudio && (
              <button 
                onClick={() => { onOpenSpatialAudio(); setShowDropdown(false); }} 
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-orange-950/40 text-orange-300 transition text-left cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>3D Spatial Audio (The Owl)</span>
              </button>
            )}

            {onOpenExtendedSpectrum && (
              <button 
                onClick={() => { onOpenExtendedSpectrum(); setShowDropdown(false); }} 
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-teal-950/40 text-teal-300 transition text-left cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>96kHz / 32-bit DSP Inspector</span>
              </button>
            )}

            {onOpenVagdhenuLyrics && (
              <button 
                onClick={() => { onOpenVagdhenuLyrics(); setShowDropdown(false); }} 
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-amber-950/40 text-amber-300 transition text-left cursor-pointer"
              >
                <span className="text-xs">📿</span>
                <span>Vāgdhenu Vedic Chants</span>
              </button>
            )}

            {onOpenSnapshots && (
              <button 
                onClick={() => { onOpenSnapshots(); setShowDropdown(false); }} 
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-emerald-950/40 text-emerald-300 transition text-left cursor-pointer border-t border-slate-800/60 mt-1 pt-1.5"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Session Snapshots & Git Trees</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Quick Access Renders Folder */}
      {onOpenRenders && (
        <button
          onClick={onOpenRenders}
          title="Browse audio renders in Renders/"
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-amber-950/30 hover:bg-amber-900/50 text-amber-300 border border-amber-600/30 transition cursor-pointer font-medium text-xs shadow-sm"
        >
          <Folder className="w-3.5 h-3.5 text-amber-400" />
          <span>Renders</span>
        </button>
      )}

      {/* 3. Hardware MIDI */}
      {onOpenMidiController && (
        <button
          onClick={onOpenMidiController}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 transition cursor-pointer font-medium text-xs shadow-sm"
          title="Open Hardware MIDI & MPE Controller"
        >
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span>MIDI</span>
          {midiDeviceCount > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          )}
        </button>
      )}

      {/* 4. FX Rack Host */}
      {onOpenPlugins && (
        <button
          onClick={onOpenPlugins}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-indigo-950/30 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-500/30 transition cursor-pointer font-medium text-xs shadow-sm"
          title="Open VST3 / AU / Wasm Audio Plugin Host"
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>FX Rack</span>
        </button>
      )}

      {/* 5. Arranger */}
      {onOpenArranger && (
        <button
          onClick={onOpenArranger}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-amber-950/30 hover:bg-amber-900/50 text-amber-300 border border-amber-500/30 transition cursor-pointer font-medium text-xs shadow-sm"
          title="Arrangement Assistant"
        >
          <span className="text-xs">📐</span>
          <span>Arranger</span>
          {activeMovementName && (
            <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-200 text-[9px] font-mono truncate max-w-[60px]">
              {activeMovementName}
            </span>
          )}
        </button>
      )}
    </div>
  );
};
