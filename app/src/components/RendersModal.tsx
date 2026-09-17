import React, { useEffect, useState, useRef } from 'react';
import { X, Folder, Play, Pause, Download, RefreshCw, CheckCircle2, Music, Layers, HardDrive, ArrowDownToLine } from 'lucide-react';
import { Track, AudioClip, AudioTake } from '../types/daw';
import { audioEngine } from '../lib/webAudioEngine';

export interface RenderFile {
  name: string;
  path: string;
  sizeBytes: number;
  modTime: string;
  url: string;
}

interface RendersModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  onMountClipToTrack: (trackId: string, clip: AudioClip, take: AudioTake) => void;
  showToast: (msg: string) => void;
  bpm?: number;
}

export const RendersModal: React.FC<RendersModalProps> = ({
  isOpen,
  onClose,
  tracks,
  onMountClipToTrack,
  showToast,
  bpm = 85
}) => {
  const [renders, setRenders] = useState<RenderFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [playingFile, setPlayingFile] = useState<string | null>(null);
  const [targetTrackId, setTargetTrackId] = useState<string>(tracks[0]?.id || 'tr-1');
  const [mountingFile, setMountingFile] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchRenders = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:9090/api/v1/renders');
      if (res.ok) {
        const data = await res.json();
        setRenders(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch renders:', res.statusText);
      }
    } catch (err) {
      console.error('Error fetching renders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRenders();
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingFile(null);
      }
    }
  }, [isOpen]);

  const handleToggleAudition = (render: RenderFile) => {
    if (playingFile === render.name) {
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingFile(null);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(render.url);
      audioRef.current = audio;
      audio.play().then(() => {
        setPlayingFile(render.name);
      }).catch(err => {
        console.error('Playback failed:', err);
        showToast('Playback failed: ' + err.message);
      });
      audio.onended = () => {
        setPlayingFile(null);
      };
    }
  };

  const handleMountToTrack = async (render: RenderFile) => {
    setMountingFile(render.name);
    try {
      showToast(`Fetching ${render.name} for timeline mounting...`);
      const res = await fetch(render.url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const arrayBuffer = await res.arrayBuffer();

      const clipId = `clip-render-${Date.now()}`;
      const decodedBuffer = await audioEngine.loadGeneratedAudio(clipId, arrayBuffer);

      // Compute bars from decoded duration
      const barDurationSec = (4 * 60 / (bpm || 85));
      const durationBars = Math.max(1, Math.round(decodedBuffer.duration / barDurationSec));

      // Sample waveform
      const rawData = decodedBuffer.getChannelData(0);
      const samples = 64;
      const blockSize = Math.floor(rawData.length / samples);
      const waveformPoints: number[] = [];
      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[i * blockSize + j]);
        }
        waveformPoints.push(Math.min(1, (sum / blockSize) * 3));
      }

      const selectedTrack = tracks.find(t => t.id === targetTrackId) || tracks[0];

      const newClip: AudioClip = {
        id: clipId,
        name: render.name.replace('.wav', ''),
        startBar: 1,
        durationBars: durationBars,
        color: selectedTrack?.color || '#b08d57',
        audioBuffer: decodedBuffer,
        waveformPoints: waveformPoints
      };

      const newTake: AudioTake = {
        id: `take-render-${Date.now()}`,
        name: render.name.replace('.wav', ''),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        durationSec: Math.round(decodedBuffer.duration),
        contextAware: true
      };

      onMountClipToTrack(targetTrackId, newClip, newTake);
      showToast(`Mounted ${render.name} onto ${selectedTrack?.name || 'Track 1'}!`);
      onClose();
    } catch (err: any) {
      console.error('Mount failed:', err);
      showToast('Mount failed: ' + (err?.message || err));
    } finally {
      setMountingFile(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-[#14121a] to-[#0d0c11] border border-amber-600/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-amber-900/30 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(217,119,6,0.2)]">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100 tracking-wide">Audio Renders Folder</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/50 font-mono">
                  {renders.length} {renders.length === 1 ? 'file' : 'files'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                All generated scores saved to disk in uncompressed 48kHz WAV format
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRenders}
              disabled={loading}
              title="Refresh Renders from disk"
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-950 hover:text-rose-200 text-slate-400 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Directory Paths Banner */}
        <div className="px-6 py-2.5 bg-amber-950/20 border-b border-amber-900/20 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-1.5 text-amber-300/90">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Obsidian DAW:</span>
            <code className="text-amber-100 bg-black/40 px-2 py-0.5 rounded border border-amber-900/40">
              /Users/mrigank/Documents/Daw/DAW/Renders
            </code>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Scratch:</span>
            <code className="text-slate-300 bg-black/40 px-2 py-0.5 rounded border border-slate-800">
              ./Renders
            </code>
          </div>
        </div>

        {/* Target Track Selector */}
        <div className="px-6 py-3 bg-black/20 border-b border-slate-800/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Target Track to Mount:</span>
          </div>
          <select
            value={targetTrackId}
            onChange={(e) => setTargetTrackId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            {tracks.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.role.replace('_', ' ')})
              </option>
            ))}
          </select>
        </div>

        {/* Renders List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 min-h-[260px]">
          {loading && renders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-sm">Reading Renders directory from disk...</p>
            </div>
          ) : renders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center gap-3">
              <Music className="w-12 h-12 text-slate-600 stroke-1" />
              <div className="text-sm font-medium text-slate-300">No Renders in Folder Yet</div>
              <p className="text-xs text-slate-500 max-w-sm">
                Generate a scene score using the Director's Scene Wizard or the AI Model Suite. Every render will immediately appear here.
              </p>
            </div>
          ) : (
            renders.map((render) => {
              const isPlaying = playingFile === render.name;
              const isMounting = mountingFile === render.name;

              return (
                <div
                  key={render.name}
                  className="group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/80 hover:border-amber-600/40 transition-all gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      onClick={() => handleToggleAudition(render)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                        isPlaying
                          ? 'bg-amber-500 text-slate-950 scale-105'
                          : 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-600/30'
                      }`}
                      title={isPlaying ? 'Pause audition' : 'Audition render'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 text-sm truncate font-mono">
                          {render.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300/90 border border-amber-800/40 font-mono">
                          WAV
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="text-amber-400/90 font-medium">{formatSize(render.sizeBytes)}</span>
                        <span>•</span>
                        <span>{formatDate(render.modTime)}</span>
                        <span>•</span>
                        <span className="text-emerald-400/90 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Saved on Disk
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <a
                      href={render.url}
                      download={render.name}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition"
                      title="Download raw audio WAV file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>

                    <button
                      onClick={() => handleMountToTrack(render)}
                      disabled={isMounting}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold transition shadow-sm cursor-pointer active:scale-95 disabled:opacity-50"
                      title="Decode and mount directly to selected track on timeline"
                    >
                      {isMounting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Mounting...</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownToLine className="w-3.5 h-3.5" />
                          <span>Mount to Timeline</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-black/40 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Nāḍ High-Resolution Super-Resolution standard active (48kHz / 96kHz 32-bit float).</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
