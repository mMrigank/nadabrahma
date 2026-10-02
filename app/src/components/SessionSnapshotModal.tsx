import React, { useState, useRef, useMemo } from 'react';
import { 
  X, GitBranch, GitCommit, Clock, Check, Download, Upload, Trash2, 
  Sparkles, RefreshCw, Layers, ShieldCheck, ArrowRight, Music, Disc, 
  FolderDown, History, BookmarkPlus, Play
} from 'lucide-react';
import { 
  SessionSnapshotNode, 
  SessionState, 
  sessionHistory 
} from '../lib/sessionHistoryEngine';
import { RAGA_DATABASE } from '../lib/ragaEngine';
import { audioEngine } from '../lib/webAudioEngine';

interface SessionSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: SessionState;
  activeRagaName: string;
  onRestoreSnapshot: (state: SessionState, snapshotName: string) => void;
}

export const SessionSnapshotModal: React.FC<SessionSnapshotModalProps> = ({
  isOpen,
  onClose,
  currentState,
  activeRagaName,
  onRestoreSnapshot
}) => {
  const [snapshots, setSnapshots] = useState<SessionSnapshotNode[]>(() => sessionHistory.getSnapshots());
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>(snapshots[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'tree' | 'create' | 'export'>('tree');

  // Form for creating a new snapshot / branch
  const [newBranchName, setNewBranchName] = useState<string>('master');
  const [newSnapshotName, setNewSnapshotName] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newTags, setNewTags] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedSnapshot = useMemo(() => {
    return snapshots.find(s => s.id === selectedSnapshotId) || snapshots[0];
  }, [snapshots, selectedSnapshotId]);

  // Group snapshots by branch
  const branchGroups = useMemo(() => {
    const groups: { [branch: string]: SessionSnapshotNode[] } = {};
    snapshots.forEach(s => {
      const b = s.branchName || 'master';
      if (!groups[b]) groups[b] = [];
      groups[b].push(s);
    });
    return groups;
  }, [snapshots]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCheckout = (snapshot: SessionSnapshotNode) => {
    sessionHistory.checkoutSnapshot(snapshot.id);
    setSnapshots(sessionHistory.getSnapshots());
    setSelectedSnapshotId(snapshot.id);
    onRestoreSnapshot(snapshot.state, snapshot.name);

    // Acoustic restore confirmation chime
    audioEngine.playNotePreview(snapshot.baseSaHz || 138.59, 0.5);
    showToast(`Checked out: "${snapshot.name}" on branch [${snapshot.branchName}]`);
  };

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnapshotName.trim()) {
      showToast('Please provide a name for the snapshot.');
      return;
    }

    const tagsArray = newTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const created = sessionHistory.createSnapshot(
      newBranchName,
      newSnapshotName,
      newDescription,
      tagsArray,
      currentState,
      activeRagaName
    );

    const updated = sessionHistory.getSnapshots();
    setSnapshots(updated);
    setSelectedSnapshotId(created.id);
    setActiveTab('tree');

    // Reset form
    setNewSnapshotName('');
    setNewDescription('');
    setNewTags('');

    audioEngine.playShrutiTone(currentState.baseSaHz, 0.4);
    showToast(`Created snapshot: "${created.name}" on branch [${created.branchName}]!`);
  };

  const handleDeleteSnapshot = (id: string) => {
    const success = sessionHistory.deleteSnapshot(id);
    if (!success) {
      showToast('Cannot delete the root session snapshot.');
      return;
    }
    const updated = sessionHistory.getSnapshots();
    setSnapshots(updated);
    if (selectedSnapshotId === id) {
      setSelectedSnapshotId(updated[0]?.id || '');
    }
    showToast('Snapshot deleted.');
  };

  const handleExportProjectBundle = () => {
    sessionHistory.exportProjectBundle(currentState);
    showToast('Exported .nadabrahma session bundle to downloads!');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const { state, snapshots: loadedSnaps } = sessionHistory.importProjectBundle(text);
        setSnapshots(loadedSnaps);
        setSelectedSnapshotId(loadedSnaps[0]?.id || '');
        onRestoreSnapshot(state, 'Imported Project');
        audioEngine.previewHypersonicAir(1.0);
        showToast('Successfully loaded .nadabrahma project session bundle!');
      } catch (err: any) {
        showToast(`Import error: ${err?.message || 'Invalid format'}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="bg-[#0a0e17] border border-amber-500/30 rounded-2xl w-full max-w-5xl max-h-[92vh] shadow-2xl shadow-black flex flex-col overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              <GitBranch className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 tracking-wide">
                  Session History & Branching Version Trees
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] border border-emerald-500/30">
                  Zero Data Loss
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] border border-cyan-500/30">
                  Local Offline Storage
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Non-destructive branching snapshots, version comparison A/B, and complete project bundle archiving
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab Navigation */}
            <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('tree')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'tree'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Version Tree ({snapshots.length})
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'create'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                + New Snapshot
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'export'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Backup & Export
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2 flex items-center gap-2 text-xs text-amber-300 animate-in fade-in duration-150">
            <Check className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
          
          {activeTab === 'tree' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Visual Branching Tree (7 cols) */}
              <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Branch & Snapshot Nodes
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    Click node to inspect & checkout
                  </span>
                </div>

                {/* Branches List */}
                <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
                  {Object.entries(branchGroups).map(([branch, nodes]) => (
                    <div key={branch} className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400/90">
                        <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                        <span className="uppercase tracking-wide">branch: {branch}</span>
                        <span className="text-[10px] text-slate-600">({nodes.length} nodes)</span>
                      </div>

                      <div className="pl-4 border-l-2 border-slate-800 space-y-2 ml-2">
                        {nodes.map((node) => {
                          const isSelected = node.id === selectedSnapshotId;
                          const isCurrent = node.isCurrent;

                          return (
                            <div
                              key={node.id}
                              onClick={() => setSelectedSnapshotId(node.id)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                                isSelected
                                  ? 'bg-amber-500/15 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-750'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <GitCommit className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                                  <span className={`text-xs font-bold ${isSelected ? 'text-amber-200' : 'text-slate-200'}`}>
                                    {node.name}
                                  </span>
                                  {isCurrent && (
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] border border-emerald-500/40">
                                      Active Session
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(node.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>

                              <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                                {node.description}
                              </p>

                              {/* Snapshot Metadata Tags */}
                              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] font-mono">
                                <div className="flex items-center gap-2">
                                  <span className="text-amber-400">{node.ragaName}</span>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-cyan-400">{node.baseSaHz.toFixed(1)}Hz</span>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-slate-400">{node.trackCount} Tracks</span>
                                </div>

                                <div className="flex items-center gap-1">
                                  {node.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[9px]">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Node Details & Comparison A/B (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                
                {/* Selected Node Inspector */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block mb-0.5">
                          Branch: {selectedSnapshot.branchName}
                        </span>
                        <h4 className="text-sm font-bold text-slate-100">{selectedSnapshot.name}</h4>
                      </div>

                      {selectedSnapshot.id !== snapshots[0]?.id && (
                        <button
                          onClick={() => handleDeleteSnapshot(selectedSnapshot.id)}
                          title="Delete snapshot"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 mb-4 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                      {selectedSnapshot.description}
                    </p>

                    {/* Comparison Grid: Snapshot vs Current Session */}
                    <div className="space-y-2 mb-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        State Comparison (Snapshot vs Active):
                      </span>

                      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs space-y-2 font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Raga:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-amber-300 font-semibold">{selectedSnapshot.ragaName}</span>
                            <ArrowRight className="w-3 h-3 text-slate-600" />
                            <span className="text-slate-400">{activeRagaName}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Moveable Sa:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-300 font-semibold">{selectedSnapshot.baseSaHz.toFixed(1)} Hz</span>
                            <ArrowRight className="w-3 h-3 text-slate-600" />
                            <span className="text-slate-400">{currentState.baseSaHz.toFixed(1)} Hz</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Tracks:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-purple-300 font-semibold">{selectedSnapshot.trackCount}</span>
                            <ArrowRight className="w-3 h-3 text-slate-600" />
                            <span className="text-slate-400">{currentState.tracks.length}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Timeline Length:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-300 font-semibold">{selectedSnapshot.totalBars} bars</span>
                            <ArrowRight className="w-3 h-3 text-slate-600" />
                            <span className="text-slate-400">{currentState.totalBars} bars</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Snapshot Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {selectedSnapshot.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Checkout Action Button */}
                  <button
                    onClick={() => handleCheckout(selectedSnapshot)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                    <span>Checkout & Restore Snapshot</span>
                  </button>
                </div>

              </div>

            </div>
          )}

          {activeTab === 'create' && (
            <div className="max-w-2xl mx-auto w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
                <BookmarkPlus className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Create New Session Version Snapshot</h3>
                  <p className="text-[11px] text-slate-400">
                    Freeze the exact state of your 8+ tracks, clips, 3D spatial staging, and raga tuning into a new snapshot node
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateSnapshot} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Branch Name (e.g. master, vocal-focus, fast-tempo, ambient-drone):
                  </label>
                  <input
                    type="text"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    placeholder="master"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500/60 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Snapshot Title:
                  </label>
                  <input
                    type="text"
                    value={newSnapshotName}
                    onChange={(e) => setNewSnapshotName(e.target.value)}
                    placeholder="e.g. Yaman Alap with 48k Sheen & 3D Garbhagriha Staging"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Description & Arrangement Notes:
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={3}
                    placeholder="Explain what was modified in this version (e.g. tuned Sa to 138.59Hz, added bansuri murki on bar 17, panned sitar left -35°)."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500/60 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Tags (comma separated):
                  </label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="Yaman, Sitar, 3D, Staging, Master"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500/60 font-mono"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('tree')}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20"
                  >
                    Save Version Snapshot
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
              
              {/* Export Box */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-bold text-slate-100">Export Project Bundle</h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Download complete project session (<code className="text-amber-300">.nadabrahma</code>) containing all tracks, clip positions, audio takes, 3D spatial staging coordinates, and the complete version snapshot tree.
                  </p>
                </div>

                <button
                  onClick={handleExportProjectBundle}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <FolderDown className="w-4 h-4" />
                  <span>Download .nadabrahma Project</span>
                </button>
              </div>

              {/* Import Box */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-sm font-bold text-slate-100">Restore / Load Project</h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Restore a previously saved <code className="text-cyan-300">.nadabrahma</code> session archive from disk. All tracks, 22-Shruti tunings, and history trees will be restored with zero cloud upload.
                  </p>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".nadabrahma,.json"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>Select .nadabrahma File to Load</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Active Branch: <span className="text-amber-300 font-bold">{selectedSnapshot.branchName}</span></span>
            <span className="text-slate-600">|</span>
            <span>{snapshots.length} Snapshots Archived</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
