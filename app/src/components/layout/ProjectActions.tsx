import React from 'react';
import { RotateCcw, RotateCw, Download, Layers, Sliders } from 'lucide-react';

interface ProjectActionsProps {
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  undoActionName?: string | null;
  redoActionName?: string | null;
  onSaveProject?: () => void;
  onExportMaster?: () => void;
  onOpenAddTrack: () => void;
  onToggleMasterMixer: () => void;
}

export const ProjectActions: React.FC<ProjectActionsProps> = ({
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  undoActionName,
  redoActionName,
  onSaveProject,
  onExportMaster,
  onOpenAddTrack,
  onToggleMasterMixer,
}) => {
  return (
    <div className="flex items-center gap-1.5 select-none shrink-0">
      {/* Undo & Redo History */}
      <div className="flex items-center gap-1 bg-slate-950/60 p-0.5 rounded-lg border border-slate-800">
        {onUndo && (
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title={undoActionName ? `Undo: ${undoActionName} (Cmd+Z)` : 'Undo (Cmd+Z)'}
            className={`w-6 h-6 rounded flex items-center justify-center transition ${
              canUndo 
                ? 'hover:bg-slate-800 text-amber-300 cursor-pointer' 
                : 'text-slate-600 opacity-40 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}

        {onRedo && (
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title={redoActionName ? `Redo: ${redoActionName} (Cmd+Shift+Z)` : 'Redo (Cmd+Shift+Z)'}
            className={`w-6 h-6 rounded flex items-center justify-center transition ${
              canRedo 
                ? 'hover:bg-slate-800 text-amber-300 cursor-pointer' 
                : 'text-slate-600 opacity-40 cursor-not-allowed'
            }`}
          >
            <RotateCw className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Save Project */}
      {onSaveProject && (
        <button
          onClick={onSaveProject}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition cursor-pointer font-medium text-xs shadow-sm"
          title="Save Session (.nad)"
        >
          <span>💾</span>
          <span>Save</span>
        </button>
      )}

      {/* Export Master */}
      {onExportMaster && (
        <button
          onClick={onExportMaster}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 transition cursor-pointer font-medium text-xs shadow-sm"
          title="Export 96kHz Master Mix (WAV)"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export</span>
        </button>
      )}

      {/* Add Track */}
      <button
        onClick={onOpenAddTrack}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-500/40 transition cursor-pointer font-semibold text-xs shadow-sm"
        title="Add New Multitrack Channel"
      >
        <Layers className="w-3.5 h-3.5 text-amber-400" />
        <span>+ Track</span>
      </button>

      {/* Master Mixer Drawer */}
      <button
        onClick={onToggleMasterMixer}
        className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 flex items-center justify-center transition cursor-pointer shadow-sm"
        title="Master Mixer & 3D Spatial Audio Rack"
      >
        <Sliders className="w-3.5 h-3.5 text-slate-300 hover:text-amber-300" />
      </button>
    </div>
  );
};
