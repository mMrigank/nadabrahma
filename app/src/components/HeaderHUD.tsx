import React from 'react';
import { Raga, Tala, RasaType, MetronomeTimbre } from '../types/daw';
import { BrandHeader } from './layout/BrandHeader';
import { TransportBar } from './layout/TransportBar';
import { MusicologyBar } from './layout/MusicologyBar';
import { ToolsMenu } from './layout/ToolsMenu';
import { ProjectActions } from './layout/ProjectActions';

export interface HeaderHUDProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  baseSaHz: number;
  onSaHzChange: (hz: number) => void;
  activeRaga: Raga;
  onRagaSelect: (raga: Raga) => void;
  activeTala: Tala;
  onTalaSelect: (tala: Tala) => void;
  selectedRasa: RasaType | 'All';
  onRasaChange: (rasa: RasaType | 'All') => void;
  onNewAITrack?: () => void;
  onOpenDirectorWizard: () => void;
  onOpenAddTrack: () => void;
  onToggleMasterMixer: () => void;
  onOpenExtendedSpectrum?: () => void;
  onOpenVagdhenuLyrics?: () => void;
  onOpenShrutiMandala?: () => void;
  onOpenAIOrchestrator?: () => void;
  onOpenStemForge?: () => void;
  onOpenSpatialAudio?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  undoActionName?: string | null;
  redoActionName?: string | null;
  onOpenSnapshots?: () => void;
  activeBranchName?: string;
  onOpenMidiController?: () => void;
  midiDeviceCount?: number;
  onOpenPlugins?: () => void;
  onOpenArranger?: () => void;
  activeMovementName?: string;
  currentBeat: number;
  isMetronomeActive: boolean;
  onToggleMetronome: () => void;
  metronomeVolume: number;
  onMetronomeVolumeChange: (vol: number) => void;
  metronomeTimbre: MetronomeTimbre;
  onMetronomeTimbreChange: (timbre: MetronomeTimbre) => void;
  timeSignature?: string;
  onTimeSignatureChange?: (ts: string) => void;
  onSaveProject?: () => void;
  onExportMaster?: () => void;
  onOpenModelLibrary?: () => void;
  onOpenRenders?: () => void;
  aiStatus?: { active: boolean; model: string; progress: number; taskName: string; };
  onStop?: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  isPlaying,
  onTogglePlay,
  onStop,
  bpm,
  onBpmChange,
  timeSignature = '4/4',
  onTimeSignatureChange,
  baseSaHz,
  onSaHzChange,
  activeRaga,
  onRagaSelect,
  activeTala,
  onTalaSelect,
  selectedRasa,
  onRasaChange,
  onNewAITrack,
  onOpenDirectorWizard,
  onOpenAddTrack,
  onToggleMasterMixer,
  onOpenExtendedSpectrum,
  onOpenVagdhenuLyrics,
  onOpenShrutiMandala,
  onOpenAIOrchestrator,
  onOpenStemForge,
  onOpenSpatialAudio,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  undoActionName,
  redoActionName,
  onOpenSnapshots,
  onOpenMidiController,
  midiDeviceCount = 0,
  onOpenPlugins,
  onOpenArranger,
  activeMovementName,
  currentBeat,
  isMetronomeActive,
  onToggleMetronome,
  metronomeVolume,
  onMetronomeVolumeChange,
  metronomeTimbre,
  onMetronomeTimbreChange,
  onSaveProject,
  onExportMaster,
  onOpenModelLibrary,
  onOpenRenders,
  aiStatus,
}) => {
  return (
    <header className="glass-panel border-b border-slate-800/80 px-3 py-2 flex items-center justify-between gap-3 text-xs select-none sticky top-0 z-[200] relative bg-[#070a10]/95 backdrop-blur-2xl">
      {/* 1. NĀD Brand & Tools Menu */}
      <div className="flex items-center gap-3 shrink-0">
        <BrandHeader onOpenModelLibrary={onOpenModelLibrary} />
        <ToolsMenu
          onNewAITrack={onNewAITrack}
          onOpenModelLibrary={onOpenModelLibrary}
          onOpenExtendedSpectrum={onOpenExtendedSpectrum}
          onOpenVagdhenuLyrics={onOpenVagdhenuLyrics}
          onOpenAIOrchestrator={onOpenAIOrchestrator}
          onOpenStemForge={onOpenStemForge}
          onOpenSpatialAudio={onOpenSpatialAudio}
          onOpenSnapshots={onOpenSnapshots}
          onOpenDirectorWizard={onOpenDirectorWizard}
          onOpenRenders={onOpenRenders}
          onOpenMidiController={onOpenMidiController}
          midiDeviceCount={midiDeviceCount}
          onOpenPlugins={onOpenPlugins}
          onOpenArranger={onOpenArranger}
          activeMovementName={activeMovementName}
        />
      </div>

      {/* 2. Transport & Playback */}
      <div className="flex items-center shrink-0">
        <TransportBar
          isPlaying={isPlaying}
          onTogglePlay={onTogglePlay}
          onStop={onStop}
          bpm={bpm}
          onBpmChange={onBpmChange}
          timeSignature={timeSignature}
          onTimeSignatureChange={onTimeSignatureChange}
          isMetronomeActive={isMetronomeActive}
          onToggleMetronome={onToggleMetronome}
          metronomeVolume={metronomeVolume}
          onMetronomeVolumeChange={onMetronomeVolumeChange}
          metronomeTimbre={metronomeTimbre}
          onMetronomeTimbreChange={onMetronomeTimbreChange}
          baseSaHz={baseSaHz}
        />
      </div>

      {/* 3. Indian Classical Musicology Engine */}
      <div className="flex items-center shrink-0">
        <MusicologyBar
          baseSaHz={baseSaHz}
          onSaHzChange={onSaHzChange}
          activeRaga={activeRaga}
          onRagaSelect={onRagaSelect}
          activeTala={activeTala}
          onTalaSelect={onTalaSelect}
          selectedRasa={selectedRasa}
          onRasaChange={onRasaChange}
          currentBeat={currentBeat}
          isPlaying={isPlaying}
          onOpenShrutiMandala={onOpenShrutiMandala}
          aiStatus={aiStatus}
        />
      </div>

      {/* 4. Project Actions & Master Mixer Toggle */}
      <div className="flex items-center shrink-0">
        <ProjectActions
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
          undoActionName={undoActionName}
          redoActionName={redoActionName}
          onSaveProject={onSaveProject}
          onExportMaster={onExportMaster}
          onOpenAddTrack={onOpenAddTrack}
          onToggleMasterMixer={onToggleMasterMixer}
        />
      </div>
    </header>
  );
};
