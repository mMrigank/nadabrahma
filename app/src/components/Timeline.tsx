import React, { useState } from 'react';
import { 
  Volume2, VolumeX, Mic, RotateCcw, Sparkles, 
  ChevronRight, ChevronDown, Wand2, Plus, Zap
} from 'lucide-react';
import { Track, Tala, Raga } from '../types/daw';

interface TimelineProps {
  tracks: Track[];
  onUpdateTrack: (trackId: string, updates: Partial<Track>) => void;
  onSelectTrack: (track: Track) => void;
  selectedTrackId: string | null;
  activeTala: Tala;
  activeRaga: Raga;
  isPlaying: boolean;
  playheadPosition: number; // in bars (e.g. 0 to 32)
  onSeekPlayhead: (bar: number) => void;
  onOpenAddTrack: () => void;
  onOpenRisersDrops: () => void;
  onRegenerateTrack: (trackId: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  tracks,
  onUpdateTrack,
  onSelectTrack,
  selectedTrackId,
  activeTala,
  activeRaga,
  isPlaying,
  playheadPosition,
  onSeekPlayhead,
  onOpenAddTrack,
  onOpenRisersDrops,
  onRegenerateTrack
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<{ [group: string]: boolean }>({});
  const totalBars = 32;

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  // Group tracks by bus group
  const groupedTracks = tracks.reduce((acc, track) => {
    const group = track.busGroup;
    if (!acc[group]) acc[group] = [];
    acc[group].push(track);
    return acc;
  }, {} as { [group: string]: Track[] });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0d14] text-xs font-sans">
      
      {/* Timeline Ruler & Bar Grid Header */}
      <div className="h-8 border-b border-slate-800 flex bg-slate-950/80 sticky top-0 z-30 select-none">
        {/* Left Track Info Spacer */}
        <div className="w-80 border-r border-slate-800 px-3 flex items-center justify-between font-mono text-[11px] text-slate-400">
          <span className="font-semibold text-slate-300">Tracks ({tracks.length} / 40+ Scale)</span>
          <button 
            onClick={onOpenAddTrack}
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition cursor-pointer font-sans"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Bar Ruler Grid */}
        <div 
          className="flex-1 flex items-center relative overflow-x-auto cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickedBar = (clickX / rect.width) * totalBars;
            onSeekPlayhead(Math.max(0, Math.min(totalBars, clickedBar)));
          }}
        >
          {Array.from({ length: totalBars }).map((_, barIdx) => {
            const isSam = (barIdx % 4) === 0;
            return (
              <div 
                key={barIdx} 
                className={`flex-1 h-full border-r flex items-center px-1 font-mono text-[10px] ${
                  isSam ? 'border-amber-500/40 text-amber-300 font-bold bg-amber-500/5' : 'border-slate-800 text-slate-500'
                }`}
              >
                <span>{barIdx + 1}</span>
              </div>
            );
          })}

          {/* Red Playhead Cursor */}
          <div 
            className="absolute top-0 bottom-0 w-[2px] bg-rose-500 z-40 pointer-events-none shadow-lg shadow-rose-500/80 transition-all duration-75"
            style={{ left: `${(playheadPosition / totalBars) * 100}%` }}
          >
            <div className="w-2.5 h-2.5 bg-rose-500 rounded-b-sm -translate-x-[4px] shadow-md" />
          </div>
        </div>
      </div>

      {/* Multitrack Scrollable Canvas */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-slate-900/60 relative">
        
        {Object.entries(groupedTracks).map(([groupName, groupTracks]) => {
          const isCollapsed = !!collapsedGroups[groupName];

          return (
            <div key={groupName} className="group/bus">
              {/* Bus Group Header */}
              <div 
                onClick={() => toggleGroup(groupName)}
                className="h-6 bg-slate-900/40 hover:bg-slate-900/70 border-y border-slate-800/40 px-3 flex items-center justify-between text-[10px] font-semibold text-slate-400 cursor-pointer select-none"
              >
                <div className="flex items-center gap-1.5">
                  {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <span className="text-slate-300 tracking-wider uppercase font-bold">{groupName}</span>
                  <span className="text-slate-500">({groupTracks.length})</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  Sub-Mix Bus
                </div>
              </div>

              {/* Tracks in this Bus */}
              {!isCollapsed && groupTracks.map((track) => {
                const isSelected = selectedTrackId === track.id;

                return (
                  <div 
                    key={track.id}
                    onClick={() => onSelectTrack(track)}
                    className={`h-16 flex border-b border-slate-850/60 transition cursor-pointer ${
                      isSelected ? 'bg-slate-900/80 ring-1 ring-inset ring-amber-500/30' : 'bg-[#080b11] hover:bg-slate-900/40'
                    }`}
                  >
                    {/* Track Control Header (Left) */}
                    <div className="w-80 border-r border-slate-800/80 p-2.5 flex flex-col justify-between shrink-0 bg-[#0c1017]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: track.color }}
                          />
                          <span className="font-semibold text-slate-200 truncate max-w-[130px] text-xs">
                            {track.name}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800/90 text-slate-400 font-mono text-[9px] uppercase">
                            {track.model.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Spectrum Badges (Hypersonic & Infrasonic) */}
                        <div className="flex items-center gap-1">
                          {track.hypersonicAir && (
                            <span 
                              title="Extended Spectrum: 20k - 48k Hz Hypersonic Air Active"
                              className="px-1 py-0.2 rounded bg-cyan-500/15 text-cyan-300 font-mono text-[9px] border border-cyan-500/30 font-semibold"
                            >
                              48k Air
                            </span>
                          )}
                          {track.somaticSub && (
                            <span 
                              title="Somatic Infrasound: 10Hz - 20Hz Physical Chest Resonance Active"
                              className="px-1 py-0.2 rounded bg-pink-500/15 text-pink-300 font-mono text-[9px] border border-pink-500/30 font-semibold"
                            >
                              10Hz Sub
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Controls Row: Solo, Mute, Volume, Pan, Takes */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1 font-mono text-[10px]">
                          <button
                            onClick={(e) => { e.stopPropagation(); onUpdateTrack(track.id, { soloed: !track.soloed }); }}
                            className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                              track.soloed ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            S
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onUpdateTrack(track.id, { muted: !track.muted }); }}
                            className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                              track.muted ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            M
                          </button>

                          {/* Volume Slider */}
                          <div className="flex items-center gap-1 ml-1.5">
                            {track.volume === 0 ? <VolumeX className="w-3 h-3 text-slate-500" /> : <Volume2 className="w-3 h-3 text-slate-400" />}
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={track.volume}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => onUpdateTrack(track.id, { volume: Number(e.target.value) })}
                              className="w-14 accent-amber-500 cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Takes & Overdub / Regenerate Button */}
                        <div className="flex items-center gap-1.5">
                          {track.takes && track.takes.length > 0 && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Take {track.activeTakeIndex + 1}/{track.takes.length}
                            </span>
                          )}

                          {track.role === 'risers_drops' ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); onOpenRisersDrops(); }}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 text-[10px] font-semibold cursor-pointer"
                            >
                              <Zap className="w-3 h-3 text-yellow-400" />
                              <span>FX Builder</span>
                            </button>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); onRegenerateTrack(track.id); }}
                              title="Context-Aware Overdub / Regenerate (Listens to Active Mix)"
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 text-[10px] font-medium cursor-pointer transition"
                            >
                              <RotateCcw className="w-3 h-3 text-amber-400" />
                              <span>Overdub</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Track Waveform / Clips Canvas (Right) */}
                    <div className="flex-1 h-full relative overflow-hidden bg-slate-950/30 flex items-center">
                      {/* Bar Grid Lines */}
                      {Array.from({ length: totalBars }).map((_, bIdx) => (
                        <div 
                          key={bIdx}
                          className="flex-1 h-full border-r border-slate-900/60 pointer-events-none"
                        />
                      ))}

                      {/* Clips Rendered */}
                      {track.clips.map((clip) => {
                        const leftPercent = (clip.startBar / totalBars) * 100;
                        const widthPercent = (clip.durationBars / totalBars) * 100;

                        return (
                          <div
                            key={clip.id}
                            className="absolute top-1.5 bottom-1.5 rounded-lg border flex flex-col justify-between px-2 py-1 shadow-md overflow-hidden"
                            style={{
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                              backgroundColor: `${track.color}22`,
                              borderColor: `${track.color}88`
                            }}
                          >
                            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-200">
                              <span className="truncate">{clip.name}</span>
                              <span className="font-mono text-slate-400 text-[9px]">{clip.durationBars}b</span>
                            </div>

                            {/* Simulated Waveform Bars */}
                            <div className="flex items-center gap-0.5 h-5 opacity-70">
                              {Array.from({ length: 24 }).map((_, wIdx) => {
                                const height = 20 + Math.sin(wIdx * 0.8) * 70;
                                return (
                                  <div
                                    key={wIdx}
                                    className="flex-1 rounded-sm"
                                    style={{
                                      height: `${Math.max(15, height)}%`,
                                      backgroundColor: track.color
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

      </div>
    </div>
  );
};
