import React from 'react';
import { 
  Track, Raga, Tala, RasaType, DirectorSceneState, AIModel, 
  PluginInstance, ArrangementSection, SpatialCoordinates, AudioClip, AudioTake
} from '../../types/daw';
import { DirectorsWizardModal } from '../DirectorsWizardModal';
import { AddTrackModal } from '../AddTrackModal';
import { RisersDropsPanel } from '../RisersDropsPanel';
import { MasterMixerDrawer } from '../MasterMixerDrawer';
import { ExtendedSpectrumModal } from '../ExtendedSpectrumModal';
import { VagdhenuLyricsDrawer } from '../VagdhenuLyricsDrawer';
import { ShrutiMandalaModal } from '../ShrutiMandalaModal';
import { AIModelOrchestratorModal } from '../AIModelOrchestratorModal';
import { StemForgeModal } from '../StemForgeModal';
import { SpatialAudioModal } from '../SpatialAudioModal';
import { SessionSnapshotModal } from '../SessionSnapshotModal';
import { MidiControllerModal } from '../MidiControllerModal';
import { AudioPluginHostModal } from '../AudioPluginHostModal';
import { ArrangementAssistantModal } from '../ArrangementAssistantModal';
import { RendersModal } from '../RendersModal';
import { ModelLibraryModal } from '../ModelLibraryModal';
import { SessionState } from '../../lib/sessionHistoryEngine';

interface ModalHostProps {
  // Modal visibility states
  isDirectorWizardOpen: boolean;
  onCloseDirectorWizard: () => void;
  isAddTrackOpen: boolean;
  onCloseAddTrack: () => void;
  isRisersDropsOpen: boolean;
  onCloseRisersDrops: () => void;
  isMasterMixerOpen: boolean;
  onCloseMasterMixer: () => void;
  isSpectrumModalOpen: boolean;
  onCloseSpectrumModal: () => void;
  isVagdhenuLyricsOpen: boolean;
  onCloseVagdhenuLyrics: () => void;
  isShrutiMandalaOpen: boolean;
  onCloseShrutiMandala: () => void;
  isAIOrchestratorOpen: boolean;
  onCloseAIOrchestrator: () => void;
  isStemForgeOpen: boolean;
  onCloseStemForge: () => void;
  isSpatialAudioOpen: boolean;
  onCloseSpatialAudio: () => void;
  isSnapshotModalOpen: boolean;
  onCloseSnapshotModal: () => void;
  isMidiModalOpen: boolean;
  onCloseMidiModal: () => void;
  isPluginModalOpen: boolean;
  onClosePluginModal: () => void;
  isArrangerOpen: boolean;
  onCloseArranger: () => void;
  isRendersModalOpen: boolean;
  onCloseRendersModal: () => void;
  isModelLibraryOpen?: boolean;
  onCloseModelLibrary?: () => void;

  // Domain data & Handlers
  tracks: Track[];
  activeRaga: Raga;
  activeTala: Tala;
  baseSaHz: number;
  onSaHzChange: (hz: number) => void;
  bpm: number;
  totalBars: number;
  onTotalBarsChange: (bars: number) => void;
  selectedRasa: RasaType | 'All';
  isPlaying: boolean;
  currentBeat: number;
  selectedTrackId: string | null;
  orchestratorTrackId: string | null;
  loadedModels: AIModel[];
  pluginModalTargetTrackId: string | null;
  onSelectPluginTarget: (id: string | null) => void;
  masterPlugins: PluginInstance[];
  sections: ArrangementSection[];
  aiStatus?: { active: boolean; model: string; progress: number; taskName: string; };

  // Action callbacks
  onApplyDirectorScene: (scene: DirectorSceneState, raga: Raga) => void;
  onAddTrack: (trackData: any) => void;
  onInsertTransition: (fx: any) => void;
  onUpdateTrack: (trackId: string, updates: Partial<Track>) => void;
  onUpdateTrackSpatial: (trackId: string, spatial: SpatialCoordinates) => void;
  onApplySpatialPreset: (presetName: string) => void;
  onSendVocalPrompt: (prompt: string) => void;
  onToggleModelLoaded: (modelId: AIModel) => void;
  onOptimizeMemory: () => void;
  onImportStemsAsTracks: (newTracks: Partial<Track>[]) => void;
  onRestoreSnapshot: (snapshot: SessionState, snapshotName: string) => void;
  getCurrentSessionState: () => SessionState;
  onInsertMidiClip: (trackId: string, clip: any) => void;
  onMidiParamChange: (param: string, value: number) => void;
  onUpdateMasterPlugins: (plugins: PluginInstance[]) => void;
  onUpdateTrackPlugins: (trackId: string, plugins: PluginInstance[]) => void;
  onUpdateSections: (sections: ArrangementSection[]) => void;
  onApplyFullArrangement: (sections: ArrangementSection[], populateClips: boolean) => void;
  onMountClipToTrack: (trackId: string, clip: AudioClip, take: AudioTake) => void;
  showToast: (msg: string) => void;
  onOpenStemForge: () => void;
  onOpenSpatialAudio: () => void;
  onOpenPlugins: () => void;
}

export const ModalHost: React.FC<ModalHostProps> = ({
  isDirectorWizardOpen,
  onCloseDirectorWizard,
  isAddTrackOpen,
  onCloseAddTrack,
  isRisersDropsOpen,
  onCloseRisersDrops,
  isMasterMixerOpen,
  onCloseMasterMixer,
  isSpectrumModalOpen,
  onCloseSpectrumModal,
  isVagdhenuLyricsOpen,
  onCloseVagdhenuLyrics,
  isShrutiMandalaOpen,
  onCloseShrutiMandala,
  isAIOrchestratorOpen,
  onCloseAIOrchestrator,
  isStemForgeOpen,
  onCloseStemForge,
  isSpatialAudioOpen,
  onCloseSpatialAudio,
  isSnapshotModalOpen,
  onCloseSnapshotModal,
  isMidiModalOpen,
  onCloseMidiModal,
  isPluginModalOpen,
  onClosePluginModal,
  isArrangerOpen,
  onCloseArranger,
  isRendersModalOpen,
  onCloseRendersModal,
  isModelLibraryOpen = false,
  onCloseModelLibrary,

  tracks,
  activeRaga,
  activeTala,
  baseSaHz,
  onSaHzChange,
  bpm,
  totalBars,
  onTotalBarsChange,
  selectedRasa,
  isPlaying,
  currentBeat,
  selectedTrackId,
  orchestratorTrackId,
  loadedModels,
  pluginModalTargetTrackId,
  onSelectPluginTarget,
  masterPlugins,
  sections,
  aiStatus,

  onApplyDirectorScene,
  onAddTrack,
  onInsertTransition,
  onUpdateTrack,
  onUpdateTrackSpatial,
  onApplySpatialPreset,
  onSendVocalPrompt,
  onToggleModelLoaded,
  onOptimizeMemory,
  onImportStemsAsTracks,
  onRestoreSnapshot,
  getCurrentSessionState,
  onInsertMidiClip,
  onMidiParamChange,
  onUpdateMasterPlugins,
  onUpdateTrackPlugins,
  onUpdateSections,
  onApplyFullArrangement,
  onMountClipToTrack,
  showToast,
  onOpenStemForge,
  onOpenSpatialAudio,
  onOpenPlugins,
}) => {
  return (
    <>
      <DirectorsWizardModal
        isOpen={isDirectorWizardOpen || !!aiStatus?.active}
        onClose={onCloseDirectorWizard}
        baseSaHz={baseSaHz}
        onApplyScene={onApplyDirectorScene}
        aiStatus={aiStatus}
      />

      <AddTrackModal
        isOpen={isAddTrackOpen}
        onClose={onCloseAddTrack}
        onAddTrack={onAddTrack}
        existingTrackCount={tracks.length}
      />

      <RisersDropsPanel
        isOpen={isRisersDropsOpen}
        onClose={onCloseRisersDrops}
        baseSaHz={baseSaHz}
        activeRaga={activeRaga}
        onInsertTransition={onInsertTransition}
      />

      <MasterMixerDrawer
        isOpen={isMasterMixerOpen}
        onClose={onCloseMasterMixer}
        isPlaying={isPlaying}
        busGroups={['Vocals', 'Acoustics', 'Percussion', 'Orchestral', 'Cinematic FX']}
        onOpenStemForge={onOpenStemForge}
        onOpenSpatialAudio={onOpenSpatialAudio}
        onOpenPlugins={onOpenPlugins}
        tracks={tracks}
        onUpdateTrackSpatial={onUpdateTrackSpatial}
      />

      <ExtendedSpectrumModal
        isOpen={isSpectrumModalOpen}
        onClose={onCloseSpectrumModal}
        tracks={tracks}
        onUpdateTrack={onUpdateTrack}
        baseSaHz={baseSaHz}
      />

      <VagdhenuLyricsDrawer
        isOpen={isVagdhenuLyricsOpen}
        onClose={onCloseVagdhenuLyrics}
        baseSaHz={baseSaHz}
        activeRagaName={activeRaga.name}
        selectedRasa={selectedRasa}
        isPlaying={isPlaying}
        currentBeat={currentBeat}
        onSendToVocalPrompt={onSendVocalPrompt}
      />

      <ShrutiMandalaModal
        isOpen={isShrutiMandalaOpen}
        onClose={onCloseShrutiMandala}
        baseSaHz={baseSaHz}
        onSaHzChange={(hz) => {
          onSaHzChange(hz);
          showToast(`Tuned Adhara Shadja to ${hz.toFixed(2)} Hz with 22 Shrutis Just Intonation!`);
        }}
        activeRagaId={activeRaga.id}
        activeRagaName={activeRaga.name}
      />

      <AIModelOrchestratorModal
        isOpen={isAIOrchestratorOpen}
        onClose={onCloseAIOrchestrator}
        tracks={tracks}
        onUpdateTrack={onUpdateTrack}
        activeRaga={activeRaga}
        activeTala={activeTala}
        baseSaHz={baseSaHz}
        initialSelectedTrackId={orchestratorTrackId}
        loadedModels={loadedModels}
        onToggleModelLoaded={onToggleModelLoaded}
        onOptimizeMemory={onOptimizeMemory}
      />

      <StemForgeModal
        isOpen={isStemForgeOpen}
        onClose={onCloseStemForge}
        tracks={tracks}
        activeRaga={activeRaga}
        activeTala={activeTala}
        baseSaHz={baseSaHz}
        bpm={bpm}
        totalBars={totalBars}
        onImportStemsAsTracks={onImportStemsAsTracks}
      />

      <SpatialAudioModal
        isOpen={isSpatialAudioOpen}
        onClose={onCloseSpatialAudio}
        tracks={tracks}
        onUpdateTrackSpatial={onUpdateTrackSpatial}
        onApplyPreset={onApplySpatialPreset}
        isPlaying={isPlaying}
      />

      <SessionSnapshotModal
        isOpen={isSnapshotModalOpen}
        onClose={onCloseSnapshotModal}
        currentState={getCurrentSessionState()}
        activeRagaName={activeRaga.name}
        onRestoreSnapshot={onRestoreSnapshot}
      />

      <MidiControllerModal
        isOpen={isMidiModalOpen}
        onClose={onCloseMidiModal}
        tracks={tracks}
        activeRaga={activeRaga}
        activeTala={activeTala}
        baseSaHz={baseSaHz}
        selectedTrackId={selectedTrackId}
        onInsertMidiClip={onInsertMidiClip}
        onParamChange={onMidiParamChange}
      />

      <AudioPluginHostModal
        isOpen={isPluginModalOpen}
        onClose={onClosePluginModal}
        tracks={tracks}
        targetTrackId={pluginModalTargetTrackId}
        onSelectTarget={onSelectPluginTarget}
        masterPlugins={masterPlugins}
        onUpdateMasterPlugins={onUpdateMasterPlugins}
        onUpdateTrackPlugins={onUpdateTrackPlugins}
        baseSaHz={baseSaHz}
        activeRaga={activeRaga}
      />

      <ArrangementAssistantModal
        isOpen={isArrangerOpen}
        onClose={onCloseArranger}
        sections={sections}
        onUpdateSections={onUpdateSections}
        onApplyFullArrangement={onApplyFullArrangement}
        tracks={tracks}
        activeRaga={activeRaga}
        activeTala={activeTala}
        baseSaHz={baseSaHz}
        bpm={bpm}
        totalBars={totalBars}
        onTotalBarsChange={onTotalBarsChange}
      />

      <RendersModal
        isOpen={isRendersModalOpen}
        onClose={onCloseRendersModal}
        tracks={tracks}
        onMountClipToTrack={onMountClipToTrack}
        showToast={showToast}
        bpm={bpm}
      />

      {onCloseModelLibrary && (
        <ModelLibraryModal
          isOpen={isModelLibraryOpen}
          onClose={onCloseModelLibrary}
        />
      )}
    </>
  );
};
