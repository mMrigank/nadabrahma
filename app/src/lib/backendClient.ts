/**
 * backendClient.ts — WebSocket + REST client for the Nāḍ Go backend broker.
 *
 * Connects to ws://localhost:9090/ws and provides a typed Promise-based API
 * for triggering AI music generation. The backend returns raw WAV bytes as a
 * binary WebSocket frame, which this client decodes into a Web Audio AudioBuffer
 * for immediate playback.
 *
 * Model lifecycle state is tracked and exposed so the UI can show real-time
 * memory and generation progress.
 */

import type { AIModel } from '../types/daw';

// ── Types ──────────────────────────────────────────────────────────────────

export type ModelState = 'unloaded' | 'loading' | 'ready' | 'generating' | 'unloading' | 'error';

export interface ModelStatus {
  modelId: AIModel;
  state: ModelState;
}

export interface MemoryStats {
  totalGB: number;
  usedGB: number;
  availableGB: number;
  pressurePct: number;
}

export interface GenerationRequest {
  modelId: AIModel;
  trackId: string;
  prompt: string;
  tags: string;
  lyrics: string;
  durationSec: number;
}

export interface GenerationProgress {
  value: number; // 0.0 – 1.0
}

export type BackendEventHandler = {
  onProgress?: (progress: GenerationProgress) => void;
  onModelState?: (status: ModelStatus) => void;
  onError?: (message: string) => void;
};

// ── Internal WS message types (mirrors Go server) ─────────────────────────

interface WSMessage {
  type: string;
  payload?: unknown;
}

// ── Client ────────────────────────────────────────────────────────────────

const BACKEND_WS_URL  = 'ws://localhost:9090/ws';
const BACKEND_HTTP_URL = 'http://localhost:9090';
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS  = 16000;

class NadBackendClient {
  private ws: WebSocket | null = null;
  private reconnectDelayMs = RECONNECT_BASE_MS;
  private pendingResolve: ((wav: ArrayBuffer) => void) | null = null;
  private pendingReject: ((err: Error) => void) | null = null;
  private eventHandlers: BackendEventHandler = {};
  private connected = false;

  // ── Connection ──────────────────────────────────────────────────────────

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.connected) { resolve(); return; }

      this.ws = new WebSocket(BACKEND_WS_URL);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        console.info('[Nāḍ backend] WebSocket connected');
        this.connected = true;
        this.reconnectDelayMs = RECONNECT_BASE_MS;
        resolve();
      };

      this.ws.onerror = (evt) => {
        console.error('[Nāḍ backend] WebSocket error', evt);
        if (!this.connected) reject(new Error('Failed to connect to Nāḍ backend on localhost:9090'));
      };

      this.ws.onclose = () => {
        console.warn('[Nāḍ backend] WebSocket disconnected — reconnecting...');
        this.connected = false;
        // Exponential backoff reconnect
        setTimeout(() => {
          this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, RECONNECT_MAX_MS);
          this.connect().catch(() => {}); // silent retry
        }, this.reconnectDelayMs);
      };

      this.ws.onmessage = (evt) => this.handleMessage(evt);
    });
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  setEventHandlers(handlers: BackendEventHandler) {
    this.eventHandlers = handlers;
  }

  // ── Generation ──────────────────────────────────────────────────────────

  /**
   * generateTrack sends a generation request and returns a Promise that resolves
   * with the raw WAV ArrayBuffer when the model finishes generating.
   *
   * Only one generation can be in flight at a time (single active model slot).
   */
  async generateTrack(req: GenerationRequest): Promise<ArrayBuffer> {
    if (!this.connected) {
      await this.connect();
    }

    if (this.pendingResolve) {
      throw new Error('A generation is already in progress. Wait for it to complete.');
    }

    return new Promise<ArrayBuffer>((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;

      const msg: WSMessage = {
        type: 'generate',
        payload: req,
      };

      this.ws!.send(JSON.stringify(msg));
    });
  }

  // ── Message handling ────────────────────────────────────────────────────

  private handleMessage(evt: MessageEvent) {
    // Binary frame = WAV audio
    if (evt.data instanceof ArrayBuffer) {
      const wav = evt.data as ArrayBuffer;
      if (this.pendingResolve) {
        this.pendingResolve(wav);
        this.pendingResolve = null;
        this.pendingReject = null;
      }
      return;
    }

    // JSON frame = control/progress message
    let msg: WSMessage;
    try {
      msg = JSON.parse(evt.data as string) as WSMessage;
    } catch {
      console.warn('[Nāḍ backend] received non-JSON message', evt.data);
      return;
    }

    switch (msg.type) {
      case 'progress': {
        const p = msg.payload as GenerationProgress;
        this.eventHandlers.onProgress?.(p);
        break;
      }
      case 'model_state': {
        const s = msg.payload as ModelStatus;
        this.eventHandlers.onModelState?.(s);
        break;
      }
      case 'complete':
        // The binary WAV frame follows immediately; handled above.
        break;
      case 'error': {
        const errMsg = (msg.payload as { message: string }).message;
        console.error('[Nāḍ backend] error:', errMsg);
        this.eventHandlers.onError?.(errMsg);
        if (this.pendingReject) {
          this.pendingReject(new Error(errMsg));
          this.pendingResolve = null;
          this.pendingReject = null;
        }
        break;
      }
    }
  }

  // ── REST helpers ────────────────────────────────────────────────────────

  /** Returns the current memory stats from the Go backend. */
  async getMemoryStats(): Promise<MemoryStats> {
    const res = await fetch(`${BACKEND_HTTP_URL}/api/v1/memory`);
    if (!res.ok) throw new Error(`Memory stats failed: ${res.status}`);
    return res.json() as Promise<MemoryStats>;
  }

  /** Returns all registered model metadata including their current states. */
  async getModels(): Promise<{ id: string; name: string; memoryGB: number; state: ModelState }[]> {
    const res = await fetch(`${BACKEND_HTTP_URL}/api/v1/models`);
    if (!res.ok) throw new Error(`Models list failed: ${res.status}`);
    return res.json();
  }

  /** Health check — true if the backend is reachable. */
  async isBackendReachable(): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_HTTP_URL}/health`, { signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch {
      return false;
    }
  }
}

// ── Singleton export ────────────────────────────────────────────────────────

export const nadBackend = new NadBackendClient();

/**
 * decodeWAVToAudioBuffer decodes a raw WAV ArrayBuffer into a Web Audio
 * AudioBuffer, decoded at the AudioContext's sample rate.
 * The AudioContext should be configured for 96kHz for full fidelity.
 */
export async function decodeWAVToAudioBuffer(
  wavBytes: ArrayBuffer,
  ctx: AudioContext,
): Promise<AudioBuffer> {
  return ctx.decodeAudioData(wavBytes);
}
