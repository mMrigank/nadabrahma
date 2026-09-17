import React from 'react';
import { X, HardDrive, Download, CheckCircle2, Box, Cpu, AlertCircle, RefreshCw } from 'lucide-react';

interface ModelLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelLibraryModal: React.FC<ModelLibraryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl glass-panel rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 font-serif">
                Local AI Model Library (MLX)
              </h2>
              <p className="text-xs text-slate-400">
                Manage your downloaded foundational models. They run natively on Apple Silicon using unified memory mapping.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {/* Disk Space Usage */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cpu className="w-8 h-8 text-slate-500" />
              <div>
                <div className="text-sm font-semibold text-slate-200">Apple M1 Max (32GB)</div>
                <div className="text-xs text-slate-400">Disk Space Used by Models: ~92.4 GB / 2TB SSD</div>
              </div>
            </div>
            <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
              <div className="h-full w-[5%] bg-amber-500 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* MiniMax 3 */}
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mt-1">
                  <Box className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-slate-200">MiniMax 3 (Acoustic Orchestration)</h3>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">Downloading</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2 max-w-md">
                    High-fidelity orchestral, synth, and acoustic instrument synthesis engine. Extremely large parameter space optimized for 96kHz.
                  </p>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                    <span>Size: 54 GB (Q8_0 GGUF)</span>
                    <span className="text-amber-400/80 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      88% Complete (Est. 12 mins left)
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <button className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-not-allowed opacity-50" disabled>
                  Pause
                </button>
              </div>
            </div>

            {/* YuE 2 */}
            <div className="p-4 rounded-xl border border-slate-700/60 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center mt-1">
                  <Box className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-slate-200">YuE 2 (Vocal & Formant Synthesis)</h3>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Ready</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2 max-w-md">
                    State-of-the-art vocal generation model handling Gamakas, vibrato, and dynamic breathiness. 
                  </p>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                    <span>Size: 18.2 GB (Q5_K_M)</span>
                    <span className="text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Fully Downloaded
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <button className="px-3 py-1.5 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 text-xs transition cursor-pointer">
                  Delete
                </button>
              </div>
            </div>

            {/* Stable Audio 3 */}
            <div className="p-4 rounded-xl border border-slate-700/60 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center mt-1">
                  <Box className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-slate-200">Stable Audio 3 (Ambient Beds)</h3>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Ready</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2 max-w-md">
                    Fast diffusion-based audio rendering for cinematic Foley, ambient pads, and textural drones.
                  </p>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                    <span>Size: 20.2 GB</span>
                    <span className="text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Fully Downloaded
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <button className="px-3 py-1.5 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 text-xs transition cursor-pointer">
                  Delete
                </button>
              </div>
            </div>

            {/* ACE */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex items-center justify-between opacity-60 hover:opacity-100 transition">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center mt-1">
                  <Box className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-slate-400">ACE Studio Voices</h3>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-400 border border-slate-700">Not Downloaded</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2 max-w-md">
                    High-quality synthetic singer profiles. Optional extension.
                  </p>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-600">
                    <span>Size: ~12 GB (Optional)</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <button className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 text-amber-500 border border-amber-600/30 text-xs transition cursor-pointer flex items-center gap-1.5">
                  <Download className="w-3 h-3" />
                  Install
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
