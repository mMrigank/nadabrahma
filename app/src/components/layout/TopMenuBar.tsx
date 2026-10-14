import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Music, Mic, Layers, Disc, Volume2, 
  Scissors, Settings, FolderOpen, Save, Download, 
  HelpCircle, Eye, Sliders, ChevronRight 
} from 'lucide-react';

export interface TopMenuBarProps {
  onNewAITrack: () => void;
  onNewAudioTrack: () => void;
  onNewMidiTrack: () => void;
  onNewBusTrack?: () => void;
  onImportMedia?: () => void;
  onSaveProject?: () => void;
  onOpenProject?: () => void;
  onExportMaster?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onToggleMasterMixer?: () => void;
  onTogglePianoRoll?: () => void;
  onOpenDirectorWizard?: () => void;
  onOpenShrutiMandala?: () => void;
  onOpenSpatialAudio?: () => void;
  onOpenStemForge?: () => void;
  onOpenHardwareSettings?: () => void;
  onOpenHelp?: () => void;
}

type ActiveMenu = 'file' | 'edit' | 'view' | 'insert' | 'options' | 'help' | null;

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  onNewAITrack,
  onNewAudioTrack,
  onNewMidiTrack,
  onNewBusTrack,
  onImportMedia,
  onSaveProject,
  onOpenProject,
  onExportMaster,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onToggleMasterMixer,
  onTogglePianoRoll,
  onOpenDirectorWizard,
  onOpenShrutiMandala,
  onOpenSpatialAudio,
  onOpenStemForge,
  onOpenHardwareSettings,
  onOpenHelp,
}) => {
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Keyboard Shortcuts (Cmd+Ctrl+T for AI Track, Cmd+T for Audio, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const metaKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd+Ctrl+T -> New AI Track
      if (metaKey && (e.ctrlKey || e.altKey) && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        onNewAITrack();
        return;
      }

      // Cmd+Shift+T -> New MIDI Track
      if (metaKey && e.shiftKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        onNewMidiTrack();
        return;
      }

      // Cmd+T -> New Audio Track
      if (metaKey && !e.shiftKey && !e.ctrlKey && !e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        onNewAudioTrack();
        return;
      }

      // Cmd+S -> Save Project
      if (metaKey && !e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        onSaveProject?.();
        return;
      }

      // Escape -> close menus
      if (e.key === 'Escape') {
        setActiveMenu(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewAITrack, onNewAudioTrack, onNewMidiTrack, onSaveProject]);

  const toggleMenu = (menu: ActiveMenu) => {
    setActiveMenu(prev => (prev === menu ? null : menu));
  };

  const handleAction = (action?: () => void) => {
    setActiveMenu(null);
    action?.();
  };

  return (
    <div 
      ref={menuBarRef} 
      className="h-7 bg-[#080b11] border-b border-white/[0.08] px-2 flex items-center gap-1 select-none text-[11px] font-sans text-slate-300 relative z-[9999]"
    >
      {/* App Branding Badge */}
      <div className="flex items-center gap-1.5 pr-2 border-r border-white/[0.08] mr-1">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
        <span className="font-bold tracking-wider text-slate-200">OpenStudio</span>
        <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1 rounded border border-amber-500/20">NĀD</span>
      </div>

      {/* 1. File Menu */}
      <div className="relative">
        <button
          onClick={() => toggleMenu('file')}
          className={`px-2 py-0.5 rounded hover:bg-white/[0.08] cursor-pointer transition ${
            activeMenu === 'file' ? 'bg-white/[0.12] text-white' : 'text-slate-300'
          }`}
        >
          File
        </button>
        {activeMenu === 'file' && (
          <div className="absolute top-6 left-0 w-52 bg-[#0c1017] border border-white/[0.12] rounded-lg shadow-2xl py-1 z-[99999] text-xs">
            <button onClick={() => handleAction(onOpenProject)} className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] flex items-center justify-between text-slate-200">
              <span>Open Project...</span>
              <span className="text-[10px] text-slate-500 font-mono">Ctrl+O</span>
            </button>
            <button onClick={() => handleAction(onSaveProject)} className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] flex items-center justify-between text-slate-200">
              <span>Save Project</span>
              <span className="text-[10px] text-slate-500 font-mono">⌘S</span>
            </button>
            <div className="h-px bg-white/[0.08] my-1" />
            <button onClick={() => handleAction(onExportMaster)} className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] flex items-center justify-between text-amber-300 font-medium">
              <span>Export Master (96k/32-bit)...</span>
              <span className="text-[10px] text-amber-500/70 font-mono">⌘E</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Edit Menu */}
      <div className="relative">
        <button
          onClick={() => toggleMenu('edit')}
          className={`px-2 py-0.5 rounded hover:bg-white/[0.08] cursor-pointer transition ${
            activeMenu === 'edit' ? 'bg-white/[0.12] text-white' : 'text-slate-300'
          }`}
        >
          Edit
        </button>
        {activeMenu === 'edit' && (
          <div className="absolute top-6 left-0 w-48 bg-[#0c1017] border border-white/[0.12] rounded-lg shadow-2xl py-1 z-[99999] text-xs">
            <button 
              disabled={!canUndo} 
              onClick={() => handleAction(onUndo)} 
              className={`w-full text-left px-3 py-1.5 flex items-center justify-between ${canUndo ? 'hover:bg-white/[0.08] text-slate-200' : 'text-slate-600'}`}
            >
              <span>Undo</span>
              <span className="text-[10px] font-mono">⌘Z</span>
            </button>
            <button 
              disabled={!canRedo} 
              onClick={() => handleAction(onRedo)} 
              className={`w-full text-left px-3 py-1.5 flex items-center justify-between ${canRedo ? 'hover:bg-white/[0.08] text-slate-200' : 'text-slate-600'}`}
            >
              <span>Redo</span>
              <span className="text-[10px] font-mono">⇧⌘Z</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. View Menu */}
      <div className="relative">
        <button
          onClick={() => toggleMenu('view')}
          className={`px-2 py-0.5 rounded hover:bg-white/[0.08] cursor-pointer transition ${
            activeMenu === 'view' ? 'bg-white/[0.12] text-white' : 'text-slate-300'
          }`}
        >
          View
        </button>
        {activeMenu === 'view' && (
          <div className="absolute top-6 left-0 w-56 bg-[#0c1017] border border-white/[0.12] rounded-lg shadow-2xl py-1 z-[99999] text-xs">
            <button onClick={() => handleAction(onToggleMasterMixer)} className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] flex items-center justify-between text-slate-200">
              <span>Master Mixer Drawer</span>
              <span className="text-[10px] text-slate-500 font-mono">⌘M</span>
            </button>
            <button onClick={() => handleAction(onTogglePianoRoll)} className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] flex items-center justify-between text-slate-200">
              <span>Piano Roll / Swara Grid</span>
              <span className="text-[10px] text-slate-500 font-mono">⌘P</span>
            </button>
            <div className="h-px bg-white/[0.08] my-1" />
            <button onClick={() => handleAction(onOpenDirectorWizard)} className="w-full text-left px-3 py-1.5 hover:bg-amber-950/40 text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Director's Scene Wizard</span>
            </button>
            <button onClick={() => handleAction(onOpenShrutiMandala)} className="w-full text-left px-3 py-1.5 hover:bg-stone-900 text-amber-200 flex items-center gap-1.5">
              <span>🕉️</span>
              <span>22 Shrutis & Sa Tuning</span>
            </button>
            <button onClick={() => handleAction(onOpenSpatialAudio)} className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-cyan-400" />
              <span>3D Spatial Soundstage</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Insert Menu (Matching OpenStudio Reference Image 2) */}
      <div className="relative">
        <button
          onClick={() => toggleMenu('insert')}
          className={`px-2 py-0.5 rounded hover:bg-white/[0.08] cursor-pointer transition font-medium ${
            activeMenu === 'insert' ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30' : 'text-slate-200'
          }`}
        >
          Insert
        </button>
        {activeMenu === 'insert' && (
          <div className="absolute top-6 left-0 w-64 bg-[#0c1017] border border-white/[0.14] rounded-xl shadow-2xl py-1.5 z-[99999] text-xs backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
            {/* Media file... */}
            <button onClick={() => handleAction(onImportMedia)} className="w-full text-left px-3.5 py-1.5 hover:bg-white/[0.08] flex items-center justify-between text-slate-200 cursor-pointer">
              <span>Media file...</span>
              <span className="text-[10px] text-slate-500 font-mono">Insert</span>
            </button>

            {/* Standard Tracks */}
            <button onClick={() => handleAction(onNewAudioTrack)} className="w-full text-left px-3.5 py-1.5 hover:bg-white/[0.08] flex items-center justify-between text-slate-200 cursor-pointer">
              <span>New Audio Track</span>
              <span className="text-[10px] text-slate-500 font-mono">Cmd+T</span>
            </button>
            <button onClick={() => handleAction(onNewMidiTrack)} className="w-full text-left px-3.5 py-1.5 hover:bg-white/[0.08] flex items-center justify-between text-slate-200 cursor-pointer">
              <span>New MIDI Track</span>
              <span className="text-[10px] text-slate-500 font-mono">Cmd+Shift+T</span>
            </button>
            <button onClick={() => handleAction(onNewMidiTrack)} className="w-full text-left px-3.5 py-1.5 hover:bg-white/[0.08] flex items-center justify-between text-slate-300 cursor-pointer">
              <span>Virtual Instrument on New Track...</span>
            </button>

            <div className="h-px bg-white/[0.08] my-1" />

            {/* ✨ NEW AI TRACK (Highlight from Image 2) */}
            <button 
              onClick={() => handleAction(onNewAITrack)} 
              className="w-full text-left px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 font-semibold flex items-center justify-between cursor-pointer border-y border-amber-500/25 transition"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>New AI Track</span>
              </div>
              <span className="text-[10px] text-amber-400 font-mono">Cmd+Ctrl+T</span>
            </button>

            <div className="h-px bg-white/[0.08] my-1" />

            {/* Bus / Grouping */}
            <button onClick={() => handleAction(onNewBusTrack)} className="w-full text-left px-3.5 py-1.5 hover:bg-white/[0.08] flex items-center justify-between text-slate-300 cursor-pointer">
              <span>New Bus/Group Track</span>
            </button>
            <button onClick={() => handleAction(onNewBusTrack)} className="w-full text-left px-3.5 py-1.5 hover:bg-white/[0.08] flex items-center justify-between text-slate-400 cursor-pointer">
              <span>Create Bus from Selected Tracks</span>
            </button>
            <button onClick={() => handleAction(onNewAudioTrack)} className="w-full text-left px-3.5 py-1.5 hover:bg-white/[0.08] flex items-center justify-between text-slate-400 cursor-pointer">
              <span>Insert Multiple Tracks...</span>
            </button>

            <div className="h-px bg-white/[0.08] my-1" />

            {/* Empty Items */}
            <button onClick={() => handleAction(onNewAudioTrack)} className="w-full text-left px-3.5 py-1.5 hover:bg-white/[0.08] flex items-center justify-between text-slate-400 cursor-pointer">
              <span>Empty Item (Silent)</span>
            </button>
            <button onClick={() => handleAction(onNewMidiTrack)} className="w-full text-left px-3.5 py-1.5 hover:bg-white/[0.08] flex items-center justify-between text-slate-400 cursor-pointer">
              <span>Empty MIDI Clip</span>
            </button>

            <div className="h-px bg-white/[0.08] my-1" />

            {/* Markers */}
            <button onClick={() => setActiveMenu(null)} className="w-full text-left px-3.5 py-1.5 hover:bg-white/[0.08] flex items-center justify-between text-slate-400 cursor-pointer">
              <span>Marker at Playhead</span>
              <span className="text-[10px] font-mono text-slate-500">M</span>
            </button>
            <button onClick={() => setActiveMenu(null)} className="w-full text-left px-3.5 py-1.5 hover:bg-white/[0.08] flex items-center justify-between text-slate-400 cursor-pointer">
              <span>Marker with name...</span>
              <span className="text-[10px] font-mono text-slate-500">Shift+M</span>
            </button>
            <button onClick={() => setActiveMenu(null)} className="w-full text-left px-3.5 py-1.5 hover:bg-white/[0.08] flex items-center justify-between text-slate-400 cursor-pointer">
              <span>Region from selection</span>
              <span className="text-[10px] font-mono text-slate-500">Shift+R</span>
            </button>

            <div className="h-px bg-white/[0.08] my-1" />

            <button onClick={() => setActiveMenu(null)} className="w-full text-left px-3.5 py-1.5 hover:bg-white/[0.08] flex items-center justify-between text-slate-400 cursor-pointer">
              <span>Track Spacer Below</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. Options Menu */}
      <div className="relative">
        <button
          onClick={() => toggleMenu('options')}
          className={`px-2 py-0.5 rounded hover:bg-white/[0.08] cursor-pointer transition ${
            activeMenu === 'options' ? 'bg-white/[0.12] text-white' : 'text-slate-300'
          }`}
        >
          Options
        </button>
        {activeMenu === 'options' && (
          <div className="absolute top-6 left-0 w-52 bg-[#0c1017] border border-white/[0.12] rounded-lg shadow-2xl py-1 z-[99999] text-xs">
            <button onClick={() => handleAction(onOpenHardwareSettings)} className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] flex items-center justify-between text-slate-200">
              <span>Hardware & Audio Device...</span>
            </button>
            <button onClick={() => handleAction(onOpenStemForge)} className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] flex items-center justify-between text-slate-200">
              <span>StemForge Neural Separator...</span>
            </button>
          </div>
        )}
      </div>

      {/* 6. Help Menu */}
      <div className="relative">
        <button
          onClick={() => toggleMenu('help')}
          className={`px-2 py-0.5 rounded hover:bg-white/[0.08] cursor-pointer transition ${
            activeMenu === 'help' ? 'bg-white/[0.12] text-white' : 'text-slate-300'
          }`}
        >
          Help
        </button>
        {activeMenu === 'help' && (
          <div className="absolute top-6 left-0 w-48 bg-[#0c1017] border border-white/[0.12] rounded-lg shadow-2xl py-1 z-[99999] text-xs">
            <button onClick={() => handleAction(onOpenHelp)} className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] text-slate-200">
              User Documentation
            </button>
            <button onClick={() => handleAction(onOpenHelp)} className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] text-slate-200">
              Ragas & Shrutis Manual
            </button>
          </div>
        )}
      </div>

      {/* Right status badge */}
      <div className="ml-auto flex items-center gap-2 text-[10px] font-mono text-slate-400">
        <span>44.1 kHz · 16 bit</span>
        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">AI</span>
      </div>
    </div>
  );
};
