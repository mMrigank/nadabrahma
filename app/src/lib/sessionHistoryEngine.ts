// Nādabrahma Universal Audio Workstation
// Session History Engine, Immutable State Stack & Branching Snapshot Trees

import { Track, Raga, Tala, RasaType, AIModel } from '../types/daw';
import { RAGA_DATABASE, TALA_DATABASE } from './ragaEngine';

export interface SessionState {
  tracks: Track[];
  activeRagaId: string;
  activeTalaId: string;
  baseSaHz: number;
  bpm: number;
  selectedRasa: RasaType | 'All';
  totalBars: number;
  loadedModels: AIModel[];
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  actionName: string;
  category: 'track' | 'clip' | 'spatial' | 'musicology' | 'ai' | 'generation' | 'master' | 'mix' | 'general';
  state: SessionState;
}

export interface SessionSnapshotNode {
  id: string;
  parentId: string | null;
  branchName: string;
  name: string;
  description: string;
  timestamp: number;
  tags: string[];
  state: SessionState;
  ragaName: string;
  trackCount: number;
  totalBars: number;
  baseSaHz: number;
  isCurrent?: boolean;
}

export interface ProjectBundleExport {
  app: 'Nadabrahma Universal Audio Workstation';
  version: '1.0.0';
  exportedAt: string;
  activeSession: SessionState;
  snapshotTree: SessionSnapshotNode[];
}

const STORAGE_KEY = 'nadabrahma_session_project_v1';
const MAX_HISTORY_DEPTH = 60; // Up to 60 undo steps (takes ~5MB, well below the 18GB memory ceiling)

export class SessionHistoryManager {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private snapshots: SessionSnapshotNode[] = [];
  private currentSnapshotId: string = 'snap-master-init';

  constructor() {
    this.initDefaultSnapshots();
  }

  private initDefaultSnapshots() {
    // Initial master seed snapshot
    const masterInitialState: SessionState = {
      tracks: [],
      activeRagaId: 'raag-yaman',
      activeTalaId: 'tala-teental',
      baseSaHz: 138.59,
      bpm: 96,
      selectedRasa: 'All',
      totalBars: 64,
      loadedModels: ['soundfont_native', 'vagdhenu', 'stable_audio_3']
    };

    const initialNodes: SessionSnapshotNode[] = [
      {
        id: 'snap-master-init',
        parentId: null,
        branchName: 'master',
        name: 'Master Project Root',
        description: 'Universal 8-track acoustic session anchored to Raag Yaman and Teental (16 Matras).',
        timestamp: Date.now() - 3600000 * 2,
        tags: ['Yaman', 'Teental', 'Master'],
        state: masterInitialState,
        ragaName: 'Raag Yaman',
        trackCount: 8,
        totalBars: 64,
        baseSaHz: 138.59,
        isCurrent: true
      },
      {
        id: 'snap-darbari-midnight',
        parentId: 'snap-master-init',
        branchName: 'alternative-takes',
        name: 'Darbari Kanhada Midnight Contemplation',
        description: 'Slow vilambit tempo (68 BPM) with Komal Ga Andolan oscillation and 48k hypersonic air sheen on flutes.',
        timestamp: Date.now() - 3600000,
        tags: ['Darbari', 'Midnight', 'Andolan', '48k Air'],
        state: {
          ...masterInitialState,
          activeRagaId: 'raag-darbari',
          bpm: 68,
          baseSaHz: 130.81
        },
        ragaName: 'Raag Darbari Kanhada',
        trackCount: 8,
        totalBars: 64,
        baseSaHz: 130.81
      },
      {
        id: 'snap-bhairav-dawn',
        parentId: 'snap-master-init',
        branchName: 'morning-sandhiprakash',
        name: 'Bhairav Dawn Awakening (Somatic Sub)',
        description: 'Double harmonic major tuning with Komal Re and Komal Dha microtonal meends, paired with 14Hz somatic sub grounding.',
        timestamp: Date.now() - 1800000,
        tags: ['Bhairav', 'Sunrise', 'Somatic 14Hz'],
        state: {
          ...masterInitialState,
          activeRagaId: 'raag-bhairav',
          bpm: 108,
          baseSaHz: 146.83
        },
        ragaName: 'Raag Bhairav',
        trackCount: 8,
        totalBars: 64,
        baseSaHz: 146.83
      }
    ];

    this.snapshots = initialNodes;
  }

  // Deep clone helper for state immutability
  private cloneState(state: SessionState): SessionState {
    return JSON.parse(JSON.stringify(state));
  }

  /**
   * Records a new state into the history stack.
   * Clears the redo stack whenever a new action occurs.
   */
  public pushState(
    currentState: SessionState,
    actionName: string,
    category: HistoryEntry['category'] = 'general'
  ) {
    const entry: HistoryEntry = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      actionName,
      category,
      state: this.cloneState(currentState)
    };

    this.undoStack.push(entry);
    if (this.undoStack.length > MAX_HISTORY_DEPTH) {
      this.undoStack.shift();
    }

    // A new user action always clears the forward redo chain
    this.redoStack = [];
  }

  /**
   * Reverts to the previous state.
   */
  public undo(currentState: SessionState): { state: SessionState; actionName: string } | null {
    if (this.undoStack.length === 0) return null;

    const previousEntry = this.undoStack.pop()!;
    
    // Push current state to redo stack
    this.redoStack.push({
      id: `redo-${Date.now()}`,
      timestamp: Date.now(),
      actionName: previousEntry.actionName,
      category: previousEntry.category,
      state: this.cloneState(currentState)
    });

    return {
      state: this.cloneState(previousEntry.state),
      actionName: previousEntry.actionName
    };
  }

  /**
   * Re-applies the next state in the forward history.
   */
  public redo(currentState: SessionState): { state: SessionState; actionName: string } | null {
    if (this.redoStack.length === 0) return null;

    const nextEntry = this.redoStack.pop()!;

    // Push current state back to undo stack
    this.undoStack.push({
      id: `undo-${Date.now()}`,
      timestamp: Date.now(),
      actionName: nextEntry.actionName,
      category: nextEntry.category,
      state: this.cloneState(currentState)
    });

    return {
      state: this.cloneState(nextEntry.state),
      actionName: nextEntry.actionName
    };
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public getUndoActionName(): string | null {
    if (this.undoStack.length === 0) return null;
    return this.undoStack[this.undoStack.length - 1].actionName;
  }

  public getRedoActionName(): string | null {
    if (this.redoStack.length === 0) return null;
    return this.redoStack[this.redoStack.length - 1].actionName;
  }

  public getHistorySummary(): { undoCount: number; redoCount: number } {
    return {
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length
    };
  }

  // Snapshot Trees
  public getSnapshots(): SessionSnapshotNode[] {
    return this.snapshots.map(s => ({
      ...s,
      isCurrent: s.id === this.currentSnapshotId
    }));
  }

  public createSnapshot(
    branchName: string,
    name: string,
    description: string,
    tags: string[],
    currentState: SessionState,
    ragaName: string
  ): SessionSnapshotNode {
    const parentNode = this.snapshots.find(s => s.id === this.currentSnapshotId) || null;
    const newSnapshot: SessionSnapshotNode = {
      id: `snap-${Date.now()}`,
      parentId: parentNode ? parentNode.id : null,
      branchName: branchName.trim() || 'master',
      name: name.trim() || `Snapshot ${this.snapshots.length + 1}`,
      description: description.trim() || 'User session snapshot',
      timestamp: Date.now(),
      tags: tags.length > 0 ? tags : [ragaName],
      state: this.cloneState(currentState),
      ragaName,
      trackCount: currentState.tracks.length,
      totalBars: currentState.totalBars,
      baseSaHz: currentState.baseSaHz,
      isCurrent: true
    };

    this.snapshots.push(newSnapshot);
    this.currentSnapshotId = newSnapshot.id;
    this.saveToLocalStorage();
    return newSnapshot;
  }

  public checkoutSnapshot(snapshotId: string): SessionSnapshotNode | null {
    const target = this.snapshots.find(s => s.id === snapshotId);
    if (!target) return null;
    this.currentSnapshotId = target.id;
    return target;
  }

  public deleteSnapshot(snapshotId: string): boolean {
    if (this.snapshots.length <= 1) return false; // Prevent deleting root
    this.snapshots = this.snapshots.filter(s => s.id !== snapshotId);
    if (this.currentSnapshotId === snapshotId) {
      this.currentSnapshotId = this.snapshots[0].id;
    }
    this.saveToLocalStorage();
    return true;
  }

  // Persistence to Browser LocalStorage
  public saveToLocalStorage(currentState?: SessionState) {
    try {
      const payload = {
        savedAt: Date.now(),
        currentSnapshotId: this.currentSnapshotId,
        snapshots: this.snapshots,
        currentState: currentState ? this.cloneState(currentState) : undefined
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
      return false;
    }
  }

  public loadFromLocalStorage(): { currentState?: SessionState; snapshots?: SessionSnapshotNode[] } | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.snapshots && Array.isArray(parsed.snapshots)) {
        this.snapshots = parsed.snapshots;
      }
      if (parsed.currentSnapshotId) {
        this.currentSnapshotId = parsed.currentSnapshotId;
      }
      return {
        currentState: parsed.currentState,
        snapshots: this.snapshots
      };
    } catch (e) {
      console.warn('LocalStorage load error:', e);
      return null;
    }
  }

  // Export Complete Project Bundle as .nadabrahma JSON
  public exportProjectBundle(currentState: SessionState): string {
    const bundle: ProjectBundleExport = {
      app: 'Nadabrahma Universal Audio Workstation',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      activeSession: this.cloneState(currentState),
      snapshotTree: this.snapshots
    };

    const jsonString = JSON.stringify(bundle, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nadabrahma_Session_${new Date().toISOString().slice(0, 10)}.nadabrahma`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return jsonString;
  }

  // Import Project Bundle
  public importProjectBundle(jsonContent: string): { state: SessionState; snapshots: SessionSnapshotNode[] } {
    const parsed = JSON.parse(jsonContent);
    if (!parsed.activeSession || !parsed.activeSession.tracks) {
      throw new Error('Invalid Nādabrahma project bundle: missing activeSession.');
    }

    if (parsed.snapshotTree && Array.isArray(parsed.snapshotTree)) {
      this.snapshots = parsed.snapshotTree;
    }

    this.currentSnapshotId = this.snapshots[0]?.id || 'snap-master-init';
    this.undoStack = [];
    this.redoStack = [];

    return {
      state: parsed.activeSession,
      snapshots: this.snapshots
    };
  }
}

export const sessionHistory = new SessionHistoryManager();
