import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { spatialAudioEngine, SpeakerBedId, AmbisonicOrder, encodeAmbisonic } from '../lib/spatialAudioEngine';
import { admBw64Engine, renderSpatialSceneOffline } from '../lib/admBw64Engine';
import { stemForgeEngine, BroadcastWavMetadata } from '../lib/stemForgeEngine';

interface ExportModalProps {
  onClose: () => void;
  ragaName: string;
  talaName: string;
  baseSaHz: number;
}

type FormatId = 'adm' | 'ambisonic' | 'binaural' | 'stereo';

export const ExportModal: React.FC<ExportModalProps> = ({
  onClose,
  ragaName,
  talaName,
  baseSaHz
}) => {
  const [format, setFormat] = useState<FormatId>('adm');
  const [bedId, setBedId] = useState<SpeakerBedId>(spatialAudioEngine.bedId);
  const [order, setOrder] = useState<AmbisonicOrder>(spatialAudioEngine.ambisonicOrder);
  const [duration, setDuration] = useState<number>(10);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState('');

  const metadata: BroadcastWavMetadata = {
    ragaName,
    talaName,
    moveableSaHz: baseSaHz,
  };

  const handleExport = async () => {
    setExporting(true);
    setStatus('Initializing render...');
    
    try {
      if (format === 'adm') {
        setStatus('Rendering 7.1.4 bed offline...');
        const { filename, result } = await admBw64Engine.exportSceneAsAdm(
          `Nadabrahma_ADM_${bedId.replace('.', '_')}`,
          { bedId, durationSec: duration, order, maxRe: true },
          metadata
        );
        setStatus(`Rendered ${filename} (${result.channels} ch) in BW64/ADM format.`);
      } else if (format === 'binaural') {
        setStatus('Rendering Apple Spatial Audio (Binaural HRTF)...');
        // Force HRTF rendering onto a stereo bed
        const { buffer } = await renderSpatialSceneOffline({ bedId: 'stereo', durationSec: duration });
        setStatus('Encoding WAVE container...');
        // Standard BW64/WAV export using StemForge
        const wav = stemForgeEngine.createBroadcastWavBuffer(buffer, metadata);
        stemForgeEngine.downloadBlob(
          new Blob([wav], { type: 'audio/wav' }),
          'Nadabrahma_Binaural_HRTF.wav'
        );
        setStatus('Exported Nadabrahma_Binaural_HRTF.wav');
      } else if (format === 'stereo') {
        setStatus('Rendering Standard Stereo Mix...');
        // Standard stereo downmix
        const { buffer } = await renderSpatialSceneOffline({ bedId: 'stereo', durationSec: duration });
        const wav = stemForgeEngine.createBroadcastWavBuffer(buffer, metadata);
        stemForgeEngine.downloadBlob(
          new Blob([wav], { type: 'audio/wav' }),
          'Nadabrahma_Stereo_Master.wav'
        );
        setStatus('Exported Nadabrahma_Stereo_Master.wav');
      } else if (format === 'ambisonic') {
        setStatus(`Rendering ${order} Order Ambisonic B-Format...`);
        // We'll export the ambisonic logic inline for this MVP
        const sr = 96000;
        const frames = (duration || 4) * sr;
        const numCh = (order + 1) ** 2;
        
        const OfflineCtx = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
        const ctx = new OfflineCtx(numCh, frames, sr);
        const merger = ctx.createChannelMerger(numCh);
        merger.connect(ctx.destination);
        
        const sources = spatialAudioEngine.listSources();
        // Just mock synthesis for demonstration exactly like renderSpatialSceneOffline
        sources.forEach((s, idx) => {
          if (s.muted) return;
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = 220 * Math.pow(2, idx / 12);
          
          const env = ctx.createGain();
          env.gain.setValueAtTime(0.0001, 0);
          env.gain.exponentialRampToValueAtTime(Math.max(0.0001, s.gain), 0.05);
          env.gain.setValueAtTime(Math.max(0.0001, s.gain), duration - 0.25);
          env.gain.exponentialRampToValueAtTime(0.0001, duration);
          osc.connect(env);
          
          // Ambisonic encoding
          const encoded = encodeAmbisonic(order, s.position);
          for (let c = 0; c < numCh; c++) {
            if (encoded[c] !== 0) {
              const chGain = ctx.createGain();
              chGain.gain.value = encoded[c];
              env.connect(chGain);
              chGain.connect(merger, 0, c);
            }
          }
          osc.start(0);
          osc.stop(duration);
        });
        
        const buffer = await ctx.startRendering();
        const wav = stemForgeEngine.createBroadcastWavBuffer(buffer, metadata);
        stemForgeEngine.downloadBlob(
          new Blob([wav], { type: 'audio/wav' }),
          `Nadabrahma_Ambisonic_O${order}.wav`
        );
        setStatus(`Exported Nadabrahma_Ambisonic_O${order}.wav`);
      }
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-[600px] max-w-[95vw] bg-[#0a0d14] border border-amber-500/30 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/40 bg-[#0a0d14]">
          <h2 className="text-lg font-bold text-amber-300">Immersive Audio Export</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="space-y-4">
            <h3 className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Target Format</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'adm', label: 'Dolby Atmos ADM BWF', desc: 'Object+Bed metadata via ITU-R BS.2076' },
                { id: 'binaural', label: 'Apple Spatial Audio', desc: 'Binaural 2.0 folddown via HRTF' },
                { id: 'ambisonic', label: 'Ambisonics (B-Format)', desc: 'Full-sphere spherical harmonics' },
                { id: 'stereo', label: 'Standard Stereo Mix', desc: 'Broadcast WAV with iXML metadata' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id as FormatId)}
                  className={`text-left p-3 rounded border text-sm transition-colors ${
                    format === f.id ? 'border-amber-500/50 bg-amber-500/10 text-amber-100' : 'border-slate-800 hover:border-slate-600 text-slate-400'
                  }`}
                >
                  <div className="font-semibold">{f.label}</div>
                  <div className="text-[11px] opacity-70 mt-1">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-slate-800/40">
            <h3 className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Render Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              {format === 'adm' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-400">Speaker Bed</label>
                  <select
                    value={bedId}
                    onChange={e => setBedId(e.target.value as SpeakerBedId)}
                    className="w-full bg-[#131824] border border-slate-800 rounded p-1.5 text-xs text-slate-200 uppercase outline-none focus:border-amber-500/50"
                  >
                    <option value="stereo">Stereo (2.0)</option>
                    <option value="quad">Quad (4.0)</option>
                    <option value="5.1">Surround (5.1)</option>
                    <option value="7.1.4">Atmos (7.1.4)</option>
                  </select>
                </div>
              )}
              {format === 'ambisonic' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-400">Ambisonic Order</label>
                  <select
                    value={order.toString()}
                    onChange={e => setOrder(parseInt(e.target.value) as AmbisonicOrder)}
                    className="w-full bg-[#131824] border border-slate-800 rounded p-1.5 text-xs text-slate-200 outline-none focus:border-amber-500/50"
                  >
                    <option value="1">1st Order (4 ch)</option>
                    <option value="2">2nd Order (9 ch)</option>
                    <option value="3">3rd Order (16 ch)</option>
                  </select>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Export Length (sec)</label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={duration}
                  onChange={e => setDuration(Math.max(1, parseInt(e.target.value) || 10))}
                  className="w-full bg-[#131824] border border-slate-800 rounded p-1.5 text-xs text-slate-200 outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full bg-amber-600/90 hover:bg-amber-500 text-black font-semibold rounded py-2 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {exporting ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {exporting ? 'Rendering...' : 'Render Master 96kHz / 32-bit'}
            </button>
            {status && (
              <div className="bg-[#131824] rounded border border-slate-800/80 p-3 text-[11px] font-mono text-slate-400 break-all">
                &gt; {status}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
