import React, { useState, useRef, useEffect } from 'react';
import { 
  Volume2, VolumeX, RotateCcw, 
  ChevronRight, ChevronDown, Plus, Minus, Zap,
  ZoomIn, ZoomOut, Copy, Sparkles, Wand2, X, Check, ArrowRight,
  LocateFixed, GripVertical, Scissors, Trash2, MousePointer, Move, Cpu, Compass, Radio
} from 'lucide-react';
import { Track, Tala, Raga, AudioClip, AudioTake, ArrangementSection } from '../types/daw';
import { audioEngine } from '../lib/webAudioEngine';
import { INSTRUMENT_FAMILIES, getTrackInstrumentFamily } from '../constants/instruments';

interface TimelineProps {
  tracks: Track[];
  onUpdateTrack: (trackId: string, updates: Partial<Track>) => void;
  onSelectTrack: (track: Track) => void;
  selectedTrackId: string | null;
  activeTala: Tala;
  activeRaga: Raga;
  isPlaying: boolean;
  playheadPosition: number; // in bars (e.g. 1 to totalBars)
  onSeekPlayhead: (bar: number) => void;
  onOpenAddTrack: () => void;
  onOpenRisersDrops: () => void;
  onRegenerateTrack: (trackId: string) => void;
  totalBars: number;
  onTotalBarsChange: (bars: number) => void;
  bpm: number;
  onOpenExtendedSpectrum?: () => void;
  onOpenVagdhenuLyrics?: () => void;
  onOpenShrutiMandala?: () => void;
  onOpenAIOrchestrator?: (trackId?: string) => void;
  onOpenStemForge?: (trackId?: string) => void;
  onOpenSpatialAudio?: (trackId?: string) => void;
  onOpenMidiController?: () => void;
  onOpenPlugins?: (trackId?: string) => void;
  sections?: ArrangementSection[];
  onOpenArranger?: () => void;
}

export interface TrackSelection {
  trackId: string;
  startBar: number;
  durationBars: number;
}

interface TrackPreset {
  title: string;
  description: string;
  icon: string;
}

const DURATION_PRESETS = [
  { label: '1.3 min (32 bars)', bars: 32 },
  { label: '2.7 min (64 bars)', bars: 64 },
  { label: '5.3 min (128 bars)', bars: 128 },
  { label: '10.7 min (256 bars)', bars: 256 },
  { label: '15 min (360 bars)', bars: 360 },
  { label: '30 min (720 bars)', bars: 720 },
  { label: '60 min / 1 Hr (1440 bars)', bars: 1440 },
];

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
  onRegenerateTrack,
  totalBars,
  onTotalBarsChange,
  bpm,
  onOpenExtendedSpectrum,
  onOpenVagdhenuLyrics,
  onOpenShrutiMandala,
  onOpenAIOrchestrator,
  onOpenStemForge,
  onOpenSpatialAudio,
  onOpenMidiController,
  onOpenPlugins,
  sections = [],
  onOpenArranger
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<{ [group: string]: boolean }>({});
  const [barWidth, setBarWidth] = useState<number>(64); // Zoom scale in pixels per bar (28px - 140px)
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Horizontal scroll tracking & viewport measurements
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const [viewportWidth, setViewportWidth] = useState<number>(1200);
  const [followPlayhead, setFollowPlayhead] = useState<boolean>(true);

  // Track selection for context-aware AI generation
  const [selection, setSelection] = useState<TrackSelection | null>(null);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [selectionDragStart, setSelectionDragStart] = useState<{ trackId: string; bar: number } | null>(null);
  const [isGeneratingSelection, setIsGeneratingSelection] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Clip Resizing & AI Extension Generation
  const [clipResizeDrag, setClipResizeDrag] = useState<{
    trackId: string;
    clip: AudioClip;
    originalDuration: number;
    currentDuration: number;
    startX: number;
  } | null>(null);

  const [generatingClipExtension, setGeneratingClipExtension] = useState<{
    clipId: string;
    trackId: string;
    extendedFromBar: number;
    extendedToBar: number;
    barsAdded: number;
  } | null>(null);

  // Tool mode: Select (pointer) vs Razor (scissors)
  const [activeTool, setActiveTool] = useState<'pointer' | 'razor'>('pointer');

  // Selected Clip ID for keyboard shortcuts (Split, Delete)
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  // Clip Drag-to-Move Repositioning
  const [clipMoveDrag, setClipMoveDrag] = useState<{
    trackId: string;
    clip: AudioClip;
    originalStartBar: number;
    currentStartBar: number;
    startX: number;
    isAltCopy: boolean;
  } | null>(null);

  // Clip Fade Drag
  const [clipFadeDrag, setClipFadeDrag] = useState<{
    trackId: string;
    clipId: string;
    type: 'in' | 'out';
    originalFadeBars: number;
    currentFadeBars: number;
    startX: number;
  } | null>(null);

  // Track ID of open instrument family popover
  const [openInstrumentDropdownTrackId, setOpenInstrumentDropdownTrackId] = useState<string | null>(null);

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  // Convert bar index to real-world minutes and seconds at current BPM
  const getBarTime = (barIdx: number, tempoBpm: number) => {
    const totalSeconds = Math.floor(barIdx * (4 * 60 / tempoBpm));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Keep scrollLeft and viewportWidth updated on user scroll or resize
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setScrollLeft(scrollContainerRef.current.scrollLeft);
      setViewportWidth(scrollContainerRef.current.clientWidth);
    }
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      setViewportWidth(scrollContainerRef.current.clientWidth);
    }
    const handleResize = () => {
      if (scrollContainerRef.current) {
        setViewportWidth(scrollContainerRef.current.clientWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Jump viewport directly to center the playhead
  const scrollToPlayhead = () => {
    if (!scrollContainerRef.current) return;
    const playheadPx = 320 + (playheadPosition - 1) * barWidth;
    const target = Math.max(0, playheadPx - 320 - (viewportWidth - 320) * 0.3);
    scrollContainerRef.current.scrollTo({
      left: target,
      behavior: 'smooth'
    });
  };

  // Auto-scroll timeline to keep playhead in view during playback (Follow Mode)
  useEffect(() => {
    if (isPlaying && followPlayhead && scrollContainerRef.current) {
      const playheadPx = 320 + (playheadPosition - 1) * barWidth;
      const container = scrollContainerRef.current;
      const currentScrollLeft = container.scrollLeft;
      const currentClientWidth = container.clientWidth;
      const visibleStart = currentScrollLeft + 320; // 320px pinned left track header
      const visibleEnd = currentScrollLeft + currentClientWidth;

      // When playhead restarts from Sam (Bar 1) or is behind pinned left headers
      if (playheadPx < visibleStart) {
        container.scrollTo({
          left: Math.max(0, playheadPx - 340),
          behavior: 'smooth'
        });
      }
      // When playhead moves past 85% of visible canvas, advance smoothly
      else if (playheadPx > visibleEnd - 160) {
        container.scrollTo({
          left: playheadPx - 340,
          behavior: 'smooth'
        });
      }
    }
  }, [isPlaying, playheadPosition, followPlayhead, barWidth]);

  // When playback starts, immediately bring playhead into view if it was off-screen
  useEffect(() => {
    if (isPlaying && followPlayhead && scrollContainerRef.current) {
      const playheadPx = 320 + (playheadPosition - 1) * barWidth;
      const container = scrollContainerRef.current;
      const currentScrollLeft = container.scrollLeft;
      const currentClientWidth = container.clientWidth;
      const visibleStart = currentScrollLeft + 320;
      const visibleEnd = currentScrollLeft + currentClientWidth;

      if (playheadPx < visibleStart || playheadPx > visibleEnd) {
        container.scrollTo({
          left: Math.max(0, playheadPx - 340),
          behavior: 'smooth'
        });
      }
    }
  }, [isPlaying]);

  // Minimum allowed timeline length so user cannot downsize beyond furthest existing clip
  const minAllowedBars = Math.max(
    16,
    ...tracks.flatMap(t => t.clips.map(c => c.startBar + c.durationBars - 1))
  );

  // Decrease / downsize timeline by N bars
  const handleDecreaseTimeline = (barsToReduce: number = 16) => {
    const newTotal = Math.max(minAllowedBars, totalBars - barsToReduce);
    onTotalBarsChange(newTotal);
  };

  // Timeline end boundary interactive cursor dragging
  const [isDraggingEndMarker, setIsDraggingEndMarker] = useState<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartBarsRef = useRef<number>(totalBars);

  const handleEndMarkerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingEndMarker(true);
    dragStartXRef.current = e.clientX;
    dragStartBarsRef.current = totalBars;
  };

  useEffect(() => {
    if (!isDraggingEndMarker) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartXRef.current;
      const deltaBars = Math.round(deltaX / barWidth);
      const newTotal = Math.max(minAllowedBars, dragStartBarsRef.current + deltaBars);
      onTotalBarsChange(newTotal);
    };

    const handleMouseUp = () => {
      setIsDraggingEndMarker(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingEndMarker, barWidth, minAllowedBars, onTotalBarsChange]);

  // Duplicate an audio clip to the next section and extend timeline automatically if needed
  const handleDuplicateClip = (e: React.MouseEvent, trackId: string, clip: AudioClip) => {
    e.stopPropagation();
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    const nextStartBar = clip.startBar + clip.durationBars;
    const newClip: AudioClip = {
      ...clip,
      id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${clip.name} (Rep)`,
      startBar: nextStartBar
    };

    // If new clip extends beyond current timeline length, expand totalBars
    if (nextStartBar + clip.durationBars > totalBars) {
      onTotalBarsChange(Math.max(totalBars + 32, nextStartBar + clip.durationBars + 8));
    }

    onUpdateTrack(trackId, {
      clips: [...track.clips, newClip]
    });
  };

  // Extend clip and trigger AI generation up until the extended bar position
  const handleExtendClip = (trackId: string, clip: AudioClip, newDurationBars: number) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;
    if (newDurationBars <= clip.durationBars) return;

    const originalDuration = clip.durationBars;
    const barsAdded = newDurationBars - originalDuration;
    const extendedFromBar = clip.startBar + originalDuration;
    const extendedToBar = clip.startBar + newDurationBars - 1;

    // Set generating state for visual feedback and extended waveform pulse
    setGeneratingClipExtension({
      clipId: clip.id,
      trackId,
      extendedFromBar,
      extendedToBar,
      barsAdded
    });

    // Acoustic preview note transient
    audioEngine.playNotePreview(261.63, 0.35);

    // Auto-expand timeline totalBars if extended clip exceeds arrangement length
    if (clip.startBar + newDurationBars > totalBars) {
      onTotalBarsChange(Math.max(totalBars + 16, clip.startBar + newDurationBars + 8));
    }

    // AI Generation continuation synthesis delay
    setTimeout(() => {
      const baseName = clip.name
        .replace(/\s*\(Ext \+\d+b\)/g, '')
        .replace(/\s*\(Shrunk \d+b\)/g, '');
      const updatedName = `${baseName} (Ext +${barsAdded}b)`;

      const updatedClips = track.clips.map(c => {
        if (c.id === clip.id) {
          return {
            ...c,
            name: updatedName,
            durationBars: newDurationBars
          };
        }
        return c;
      });

      const newTake: AudioTake = {
        id: `take-ext-${Date.now()}`,
        name: `Take ${track.takes.length + 1} (${baseName} Extended to Bar ${extendedToBar})`,
        timestamp: 'Just now',
        durationSec: Math.round(newDurationBars * (4 * 60 / bpm)),
        contextAware: true
      };

      onUpdateTrack(trackId, {
        clips: updatedClips,
        takes: [...track.takes, newTake]
      });

      setGeneratingClipExtension(null);
    }, 900);
  };

  // Shrink clip to new duration (minimum clamped to 1 bar)
  const handleShrinkClip = (trackId: string, clip: AudioClip, newDurationBars: number) => {
    const clampedDuration = Math.max(1, newDurationBars);
    if (clampedDuration === clip.durationBars) return;

    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    // Acoustic click feedback
    audioEngine.playNotePreview(440, 0.1);

    const baseName = clip.name
      .replace(/\s*\(Ext \+\d+b\)/g, '')
      .replace(/\s*\(Shrunk \d+b\)/g, '');
    const updatedName = clampedDuration < clip.durationBars 
      ? `${baseName} (Shrunk ${clampedDuration}b)`
      : baseName;

    const updatedClips = track.clips.map(c => {
      if (c.id === clip.id) {
        return {
          ...c,
          name: updatedName,
          durationBars: clampedDuration
        };
      }
      return c;
    });

    onUpdateTrack(trackId, {
      clips: updatedClips
    });
  };

  // Mouse down handler on clip's right edge handle
  const handleClipResizeMouseDown = (e: React.MouseEvent, trackId: string, clip: AudioClip) => {
    e.preventDefault();
    e.stopPropagation();

    setClipResizeDrag({
      trackId,
      clip,
      originalDuration: clip.durationBars,
      currentDuration: clip.durationBars,
      startX: e.clientX
    });
  };

  // Global mousemove and mouseup listeners for clip resizing
  useEffect(() => {
    if (!clipResizeDrag) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - clipResizeDrag.startX;
      const deltaBars = Math.round(deltaX / barWidth);
      const newDuration = Math.max(1, clipResizeDrag.originalDuration + deltaBars);
      setClipResizeDrag(prev => prev ? { ...prev, currentDuration: newDuration } : null);
    };

    const handleMouseUp = () => {
      const { trackId, clip, originalDuration, currentDuration } = clipResizeDrag;
      setClipResizeDrag(null);

      if (currentDuration > originalDuration) {
        handleExtendClip(trackId, clip, currentDuration);
      } else if (currentDuration < originalDuration) {
        handleShrinkClip(trackId, clip, currentDuration);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [clipResizeDrag, barWidth, totalBars, tracks]);

  // Split clip into two independent clips at a given bar
  const handleSplitClip = (trackId: string, clip: AudioClip, splitBar: number) => {
    if (splitBar <= clip.startBar || splitBar >= clip.startBar + clip.durationBars) return;

    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    const dur1 = splitBar - clip.startBar;
    const dur2 = clip.durationBars - dur1;
    const baseName = clip.name.replace(/\s*\(Pt \d+\)/g, '');

    const clip1: AudioClip = {
      ...clip,
      id: `${clip.id}-pt1`,
      name: `${baseName} (Pt 1)`,
      durationBars: dur1
    };

    const clip2: AudioClip = {
      ...clip,
      id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${baseName} (Pt 2)`,
      startBar: splitBar,
      durationBars: dur2
    };

    audioEngine.playNotePreview(880, 0.08); // sharp razor cut sound

    const updatedClips = track.clips.flatMap(c => c.id === clip.id ? [clip1, clip2] : [c]);

    onUpdateTrack(trackId, {
      clips: updatedClips,
      takes: [
        ...track.takes,
        {
          id: `take-split-${Date.now()}`,
          name: `Take ${track.takes.length + 1} (Split ${baseName} at Bar ${splitBar})`,
          timestamp: 'Just now',
          durationSec: Math.round(clip.durationBars * (4 * 60 / bpm)),
          contextAware: true
        }
      ]
    });

    setSelectedClipId(clip2.id);
  };

  // Delete clip from track
  const handleDeleteClip = (trackId: string, clipId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    audioEngine.playNotePreview(150, 0.1); // subtle low thud

    onUpdateTrack(trackId, {
      clips: track.clips.filter(c => c.id !== clipId)
    });

    if (selectedClipId === clipId) {
      setSelectedClipId(null);
    }
  };

  // Drag-to-Move global mousemove / mouseup listener effect
  useEffect(() => {
    if (!clipMoveDrag) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - clipMoveDrag.startX;
      const deltaBars = Math.round(deltaX / barWidth);
      const targetStartBar = Math.max(1, clipMoveDrag.originalStartBar + deltaBars);
      setClipMoveDrag(prev => prev ? { ...prev, currentStartBar: targetStartBar, isAltCopy: e.altKey } : null);
    };

    const handleMouseUp = () => {
      const { trackId, clip, originalStartBar, currentStartBar, isAltCopy } = clipMoveDrag;
      setClipMoveDrag(null);

      if (currentStartBar === originalStartBar && !isAltCopy) return;

      const track = tracks.find(t => t.id === trackId);
      if (!track) return;

      audioEngine.playNotePreview(196, 0.15); // acoustic drop sound

      if (isAltCopy) {
        const newClip: AudioClip = {
          ...clip,
          id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: `${clip.name} (Copy)`,
          startBar: currentStartBar
        };
        if (currentStartBar + clip.durationBars > totalBars) {
          onTotalBarsChange(Math.max(totalBars + 16, currentStartBar + clip.durationBars + 8));
        }
        onUpdateTrack(trackId, {
          clips: [...track.clips, newClip]
        });
      } else {
        const updatedClips = track.clips.map(c => {
          if (c.id === clip.id) {
            return { ...c, startBar: currentStartBar };
          }
          return c;
        });
        if (currentStartBar + clip.durationBars > totalBars) {
          onTotalBarsChange(Math.max(totalBars + 16, currentStartBar + clip.durationBars + 8));
        }
        onUpdateTrack(trackId, {
          clips: updatedClips
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [clipMoveDrag, barWidth, totalBars, tracks]);

  // Clip Fade Handle Mouse Events
  useEffect(() => {
    if (!clipFadeDrag) return;

    const { trackId, clipId, type, originalFadeBars, startX } = clipFadeDrag;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      // For fade in, dragging right increases fade, dragging left decreases
      // For fade out, dragging left increases fade (delta is negative), dragging right decreases
      const deltaBarsRaw = deltaX / barWidth;
      const deltaBars = type === 'in' ? deltaBarsRaw : -deltaBarsRaw;
      
      const track = tracks.find(t => t.id === trackId);
      const clip = track?.clips.find(c => c.id === clipId);
      const maxFade = clip ? clip.durationBars : 32;
      
      const newFadeBars = Math.min(maxFade, Math.max(0, originalFadeBars + deltaBars));
      
      setClipFadeDrag(prev => prev ? {
        ...prev,
        currentFadeBars: newFadeBars
      } : null);
    };

    const handleMouseUp = () => {
      const { trackId, clipId, type, currentFadeBars } = clipFadeDrag;
      setClipFadeDrag(null);

      const track = tracks.find(t => t.id === trackId);
      if (!track) return;
      const clip = track.clips.find(c => c.id === clipId);
      if (!clip) return;
      
      // Ensure fade doesn't exceed clip duration
      const validFadeBars = Math.max(0, Math.min(currentFadeBars, clip.durationBars));

      const updatedClips = track.clips.map(c => {
        if (c.id === clip.id) {
          return {
            ...c,
            ...(type === 'in' ? { fadeInBars: validFadeBars } : { fadeOutBars: validFadeBars })
          };
        }
        return c;
      });

      onUpdateTrack(trackId, { clips: updatedClips });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [clipFadeDrag, barWidth, tracks]);

  // Global Keyboard shortcuts: S/C to split, Backspace/Del to delete, V for pointer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Split selected clip at playhead
      if (e.key === 's' || e.key === 'S') {
        if (selectedClipId) {
          for (const t of tracks) {
            const found = t.clips.find(c => c.id === selectedClipId);
            if (found) {
              const playheadInt = Math.floor(playheadPosition);
              if (playheadInt > found.startBar && playheadInt < found.startBar + found.durationBars) {
                handleSplitClip(t.id, found, playheadInt);
                break;
              }
            }
          }
        }
      }

      if (e.key === 'v' || e.key === 'V') {
        setActiveTool('pointer');
      }

      if (e.key === 'c' || e.key === 'C') {
        setActiveTool('razor');
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedClipId) {
          for (const t of tracks) {
            const found = t.clips.find(c => c.id === selectedClipId);
            if (found) {
              handleDeleteClip(t.id, found.id);
              break;
            }
          }
        }
      }

      if (e.key === 'Escape') {
        setOpenInstrumentDropdownTrackId(null);
        setSelectedClipId(null);
        setActiveTool('pointer');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, playheadPosition, tracks]);

  // Canvas selection mouse interactions
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>, trackId: string) => {
    if (e.button !== 0) return; // Only left click
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedBar = Math.max(1, Math.min(totalBars, Math.floor(clickX / barWidth) + 1));

    setIsSelecting(true);
    setSelectionDragStart({ trackId, bar: clickedBar });
    setSelection({
      trackId,
      startBar: clickedBar,
      durationBars: 4 // default 4-bar phrase selection
    });
    onSeekPlayhead(clickedBar);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>, trackId: string) => {
    if (!isSelecting || !selectionDragStart || selectionDragStart.trackId !== trackId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = Math.max(0, e.clientX - rect.left);
    const currentBar = Math.max(1, Math.min(totalBars, Math.floor(currentX / barWidth) + 1));

    const start = Math.min(selectionDragStart.bar, currentBar);
    const end = Math.max(selectionDragStart.bar, currentBar);
    const duration = Math.max(1, end - start + 1);

    setSelection({
      trackId,
      startBar: start,
      durationBars: duration
    });
  };

  const handleCanvasMouseUp = () => {
    setIsSelecting(false);
    setSelectionDragStart(null);
  };

  // Generate music/SFX strictly tailored to the specific track role
  const handleGenerateForSelection = (presetTitle?: string) => {
    if (!selection) return;
    const track = tracks.find(t => t.id === selection.trackId);
    if (!track) return;

    const clipTitle = presetTitle || customPrompt || `${track.name.split(' ')[1] || 'Phrase'} Bars ${selection.startBar}-${selection.startBar + selection.durationBars - 1}`;
    
    setIsGeneratingSelection(true);

    // Audio preview click transient
    audioEngine.playNotePreview(220, 0.3);

    setTimeout(() => {
      const newClip: AudioClip = {
        id: `clip-gen-${Date.now()}`,
        name: clipTitle,
        startBar: selection.startBar,
        durationBars: selection.durationBars,
        color: track.color
      };

      // Auto-extend timeline if generated clip goes beyond current totalBars
      if (selection.startBar + selection.durationBars > totalBars) {
        onTotalBarsChange(selection.startBar + selection.durationBars + 8);
      }

      onUpdateTrack(track.id, {
        clips: [...track.clips, newClip],
        takes: [
          ...track.takes,
          {
            id: `take-${Date.now()}`,
            name: `Take ${track.takes.length + 1} (${clipTitle})`,
            timestamp: 'Just now',
            durationSec: Math.round(selection.durationBars * (4 * 60 / bpm)),
            contextAware: true
          }
        ]
      });

      setIsGeneratingSelection(false);
      setCustomPrompt('');
    }, 900);
  };

  // Get strictly track-specific presets according to track role
  const getTrackRolePresets = (track: Track): TrackPreset[] => {
    switch (track.role) {
      case 'risers_drops':
        return [
          {
            title: 'Cinematic Braam & 16Hz Sub Drop',
            description: '16Hz somatic braam hit with deep chest resonance impact',
            icon: '⚡'
          },
          {
            title: '8-Bar White Noise & Tonal Riser',
            description: 'Rising tension Shepard tone with granular hypersonic sheen',
            icon: '🌪️'
          },
          {
            title: 'Sub-Bass Impact & Metal Hit',
            description: 'Heavy cinematic downbeat impact with resonant low tail',
            icon: '💥'
          },
          {
            title: 'Reverse Reverb & Swell Transition',
            description: 'Smooth backwards wash building energy into the next section',
            icon: '⏪'
          }
        ];

      case 'lead_vocal':
      case 'vedic_chant':
        return [
          {
            title: `${activeRaga.name} Vocal Aalap & Bandish`,
            description: `Expressive lyrical vocal performance locked to ${activeRaga.name} (${activeRaga.westernMode})`,
            icon: '🎤'
          },
          {
            title: 'Vedic Sanskrit Chhandas (Zero Schwa-Deletion)',
            description: 'Sacred Sanskrit vocal cadence with authentic udātta/anudātta pitch accents',
            icon: '🕉️'
          },
          {
            title: 'Rigveda Shanti Patha & Gayatri Hymn',
            description: 'Harmonically resonant dual-vocal chant with Moveable Sa tanpura resonance',
            icon: '📜'
          },
          {
            title: 'Drut Bandish Fast Sargam Run',
            description: `Rapid 16th-note syllable vocal phrasing locked to ${activeTala.name}`,
            icon: '🎶'
          }
        ];

      case 'solo_instrument': {
        const inst = (track.activeInstrument || track.name).toLowerCase();

        if (inst.includes('sarod')) {
          return [
            {
              title: `Sarod Fretless Alap in ${activeRaga.name}`,
              description: `Deep vocal meends on steel plate with Jawa plectrum resonance`,
              icon: '🎻'
            },
            {
              title: 'Sarod Drut Jhala & Taan Strumming',
              description: 'Fast rhythmic metallic string sparkle with chikari strikes',
              icon: '⚡'
            },
            {
              title: `Microtonal Slide (${activeRaga.vadi} ↔ ${activeRaga.samvadi})`,
              description: 'Continuous fretless glide between pivotal swaras',
              icon: '〰️'
            },
            {
              title: 'Masitkhani Vilambit Gat Theme',
              description: 'Slow classical instrumental progression locked to mood',
              icon: '🎼'
            }
          ];
        }

        if (inst.includes('veena')) {
          return [
            {
              title: `Saraswati Veena Gamakas in ${activeRaga.name}`,
              description: 'Ancient 24-fret south Indian gamaka pulls with jackwood warmth',
              icon: '🪕'
            },
            {
              title: 'Tanam Rhythmic Improvisation',
              description: 'Medium tempo pulse exploration without fixed tala cycle',
              icon: '🎶'
            },
            {
              title: 'Kudam Deep Drone Resonances',
              description: 'Low-register acoustic resonance from secondary gourd',
              icon: '🕉️'
            },
            {
              title: 'Drut Kalpana Swaram Run',
              description: 'Rapid microtonal phrase cascade across octaves',
              icon: '✨'
            }
          ];
        }

        if (inst.includes('santoor')) {
          return [
            {
              title: `Kashmiri Santoor Shimmer in ${activeRaga.name}`,
              description: '100-string walnut mezrab striker tremolo with natural sustain',
              icon: '🎼'
            },
            {
              title: 'Santoor Cascading Waterfall Arpeggios',
              description: 'Rapid multi-octave hammered patterns evoking mountain dawn',
              icon: '🌊'
            },
            {
              title: 'Vilambit Alap Strum Medley',
              description: 'Gentle contemplative note clusters establishing raga rasa',
              icon: '🕊️'
            },
            {
              title: 'Drut Tarana Hammered Climax',
              description: 'Virtuoso high-speed mallet interplay landing on Sam',
              icon: '⚡'
            }
          ];
        }

        if (inst.includes('sarangi') || inst.includes('dilruba') || inst.includes('esraj')) {
          return [
            {
              title: `Sarangi Bowed Vocal Voice in ${activeRaga.name}`,
              description: '39 sympathetic strings echoing the nuances of the human larynx',
              icon: '🎻'
            },
            {
              title: 'Microtonal Meend Glissando',
              description: 'Smooth continuous bow strokes across octave boundaries',
              icon: '〰️'
            },
            {
              title: 'Vilambit Lehra for Percussion Sync',
              description: 'Hypnotic repetitive melodic loop anchoring the tala',
              icon: '🔄'
            },
            {
              title: 'Taar Saptak Murki & Gamaka',
              description: 'High octave emotional vibrato full of Karuna rasa',
              icon: '✨'
            }
          ];
        }

        if (inst.includes('shehnai') || inst.includes('nadaswaram')) {
          return [
            {
              title: `Shehnai Ceremonial Mangal Vadya in ${activeRaga.name}`,
              description: 'Double-reed acoustic projection with deep emotional pathos',
              icon: '🎺'
            },
            {
              title: 'Temple Fanfare & Rhythmic Cadence',
              description: 'Celebratory double-reed phrases locked to tala division',
              icon: '🎉'
            },
            {
              title: 'Slow Meend Glide Across Madhyam',
              description: 'Nasal acoustic timbre bending between Shuddha and Tivra Ma',
              icon: '〰️'
            },
            {
              title: 'Drut Tihai Climax Landing',
              description: 'Three-fold ceremonial crescendo arriving at Sam',
              icon: '🎯'
            }
          ];
        }

        if (inst.includes('harmonium')) {
          return [
            {
              title: `Harmonium Twin-Reed Lehra in ${activeRaga.name}`,
              description: 'Hand-pumped acoustic organ melody providing steady raga cycles',
              icon: '🎹'
            },
            {
              title: 'Vocal Accompaniment Palta Run',
              description: 'Harmonic swara patterns mirroring classical vocal lines',
              icon: '🎶'
            },
            {
              title: 'Sustained Saptak Chordal Drone',
              description: 'Air-pumped twin reeds maintaining root Sa-Pa grounding',
              icon: '🕯️'
            },
            {
              title: 'Fast Taar Saptak Taan Interplay',
              description: 'Rapid key trills and gamaka flourishes',
              icon: '⚡'
            }
          ];
        }

        if (inst.includes('duduk') || inst.includes('shakuhachi')) {
          return [
            {
              title: `Soulful Wind Meditation in ${activeRaga.name}`,
              description: 'Velvety apricot-wood reed and bamboo breath intimacy',
              icon: '🪈'
            },
            {
              title: 'Ethereal Meri/Kari Microtonal Bends',
              description: 'Head angle and breath attacks for profound microtonal shading',
              icon: '🕊️'
            },
            {
              title: 'Cinematic Solitary Motif',
              description: 'Spacious, poignant acoustic phrase with natural room reverb',
              icon: '🌄'
            },
            {
              title: 'Hypersonic Breath Noise Layer',
              description: 'Rich organic air transients in the 20k-48k Hz register',
              icon: '💨'
            }
          ];
        }

        if (inst.includes('sitar')) {
          return [
            {
              title: `Sitar Masitkhani Gat in ${activeRaga.name}`,
              description: `Traditional slow instrumental theme in ${activeTala.name}`,
              icon: '🎸'
            },
            {
              title: 'Sitar Drut Jhala & Chikari Strokes',
              description: 'Fast high-tempo rhythmic drone string sparkle',
              icon: '⚡'
            },
            {
              title: `Microtonal Meend Glide (${activeRaga.vadi} ↔ ${activeRaga.samvadi})`,
              description: 'Deep 5-Shruti bending on the main baaj string',
              icon: '〰️'
            },
            {
              title: 'Fast Sitar Taan Run',
              description: 'Dazzling spiraling scale cascade across octaves',
              icon: '✨'
            }
          ];
        }

        return [
          {
            title: `Bansuri Breathy Alap in ${activeRaga.name}`,
            description: 'Acoustic bamboo flute with 48kHz hypersonic air sheen',
            icon: '🪈'
          },
          {
            title: 'Bansuri Fast Murki & Taan Flurry',
            description: 'Light microtonal finger flutter across Madhya and Taar Saptak',
            icon: '✨'
          },
          {
            title: 'Meditative Shanta Drone Melody',
            description: 'Sustained flute tone with subtle Kampita vibrato',
            icon: '🕊️'
          },
          {
            title: 'High Octave Overblown Call',
            description: 'Piercing harmonic overtone melody above the mix',
            icon: '🌟'
          }
        ];
      }

      case 'percussion_tala': {
        const inst = (track.activeInstrument || track.name).toLowerCase();

        if (inst.includes('pakhawaj')) {
          return [
            {
              title: `Pakhawaj Chautaal Dhrupad Theka`,
              description: 'Heavy ancient temple barrel drum with asymmetrical dough heads',
              icon: '🥁'
            },
            {
              title: 'Deep Wheat-Dough Bass Boom',
              description: 'Somatic sub-frequency bayan resonance vibrating on beat 1',
              icon: '💥'
            },
            {
              title: 'Damaru Paran High-Velocity Rhythmic Fill',
              description: 'Traditional Dhrupad cadence with rolling open strokes',
              icon: '⚡'
            },
            {
              title: 'Chakradhar Paran Tihai Climax',
              description: 'Explosive triple-statement landing precisely on Sam',
              icon: '🎯'
            }
          ];
        }

        if (inst.includes('mridangam')) {
          return [
            {
              title: `Carnatic Adi Tala Korvai Climax`,
              description: 'South Indian rhythmic structure with complex mathematical subdivisions',
              icon: '🥁'
            },
            {
              title: 'Mridangam Chapu & Dheem Tonal Ring',
              description: 'Layered skin tonal resonance tuned to base Sa',
              icon: '🔔'
            },
            {
              title: 'Fast Mohra & Mukthayim Sequence',
              description: 'Rapid celebratory strokes building to dramatic conclusion',
              icon: '⚡'
            },
            {
              title: 'Solkattu Syllables + Drum Stroke Sync',
              description: 'Konnakol rhythmic speech matched to physical drum strikes',
              icon: '🎶'
            }
          ];
        }

        if (inst.includes('ghatam') || inst.includes('kanjira')) {
          return [
            {
              title: 'Resonant Clay Pot Pops & Metallic Ring',
              description: 'Baked clay-copper acoustic body with explosive belly slaps',
              icon: '🏺'
            },
            {
              title: 'Kanjira Split-Second Bass Glide',
              description: 'High tension lizard skin with thumb pressure pitch modulation',
              icon: '🥁'
            },
            {
              title: 'Fast Syncopated South Indian Tani Avartanam',
              description: 'Interlocking polyrhythms with bright jingle accents',
              icon: '⚡'
            },
            {
              title: 'Mouth Gumuki Pitch Bends',
              description: 'Low water-droplet tonal pitch bend on the rim',
              icon: '💧'
            }
          ];
        }

        if (inst.includes('dholak') || inst.includes('dhol') || inst.includes('tavil')) {
          return [
            {
              title: 'High-Energy Folk & Festive Syncopation',
              description: 'Double-headed festive drive with driving treble and open bass',
              icon: '🥁'
            },
            {
              title: 'Sufi Qawwali Clapping & Dholak Groove',
              description: 'Ecstatic forward-driving rhythm with dynamic accents',
              icon: '👏'
            },
            {
              title: 'Tavil Thimble & Stick Heavy Accent',
              description: 'Temple procession drum power with sharp percussive bite',
              icon: '💥'
            },
            {
              title: 'Double-Time Climax Rush',
              description: 'Rapid crescendo pushing tempo towards final resolution',
              icon: '⚡'
            }
          ];
        }

        return [
          {
            title: `${activeTala.name} Theka & Bayan Bends`,
            description: 'Signature rhythm with deep Dayan-Bayan modulation on Sam',
            icon: '🥁'
          },
          {
            title: 'Fast Tabla Rela Fill (16th Notes)',
            description: 'High velocity stroke cascade leading into beat 1',
            icon: '⚡'
          },
          {
            title: 'Chakradhar Tihai Climax',
            description: 'Three-fold mathematical pattern landing dead on Sam',
            icon: '🎯'
          },
          {
            title: 'Bol Padant Vocal + Tabla Sync',
            description: 'Spoken rhythm syllables combined with physical drum strikes',
            icon: '🎶'
          }
        ];
      }

      case 'ambient_pad':
        if (track.somaticSub) {
          return [
            {
              title: '16Hz Somatic Sub Bass Foundation',
              description: 'Sub-audible physical chest resonance (10–20Hz)',
              icon: '🎻'
            },
            {
              title: 'Warm Bowed Cello Pad (Moveable Sa)',
              description: 'Rich orchestral low-end tuned in Just Intonation',
              icon: '🌌'
            },
            {
              title: 'Sub-Harmonic Drone Bed',
              description: 'Deep resonant foundation locked to base frequency',
              icon: '🌊'
            }
          ];
        }
        return [
          {
            title: 'Temple Bell Resonance & Dawn Foley',
            description: 'Acoustic field recording with bronze bells and water foley',
            icon: '🔔'
          },
          {
            title: 'Himalayan Morning Breeze (48k Air)',
            description: 'Hypersonic natural environmental ambience (20k-48k Hz)',
            icon: '🌅'
          },
          {
            title: 'Sanctum Acoustic Chamber Reverb',
            description: 'Ethereal spatial room reflection pad',
            icon: '🕯️'
          }
        ];

      default:
        return [
          {
            title: `${track.name} Phrase in ${activeRaga.name}`,
            description: `Context-aware generation tuned to ${track.model.toUpperCase()}`,
            icon: '✨'
          },
          {
            title: 'Dynamic Layered Fill',
            description: `Harmonically synchronized with active Tala and Sa`,
            icon: '🎶'
          },
          {
            title: 'Rhythmic Dynamic Accent',
            description: `Dynamic performance layer tailored for ${track.role}`,
            icon: '⚡'
          }
        ];
    }
  };

  // Group tracks by bus group
  const groupedTracks = tracks.reduce((acc, track) => {
    const group = track.busGroup;
    if (!acc[group]) acc[group] = [];
    acc[group].push(track);
    return acc;
  }, {} as { [group: string]: Track[] });

  // Selected track details
  const selectedTrackObj = selection ? tracks.find(t => t.id === selection.trackId) : null;
  const trackPresets = selectedTrackObj ? getTrackRolePresets(selectedTrackObj) : [];

  const totalTimelineWidth = 320 + totalBars * barWidth + 140;
  const playheadPx = 320 + (playheadPosition - 1) * barWidth;
  const isPlayheadOffscreenLeft = playheadPx < scrollLeft + 320 - 4;
  const isPlayheadOffscreenRight = playheadPx > scrollLeft + viewportWidth + 4;

  return (
    <div 
      ref={scrollContainerRef}
      onScroll={handleScroll}
      onMouseUp={handleCanvasMouseUp}
      className="flex-1 overflow-auto bg-[#0a0d14] text-xs font-sans relative select-none"
    >
      {/* Inner horizontal layout container sized to accommodate entire extended timeline */}
      <div 
        className="flex flex-col relative w-max min-w-full"
        style={{ width: `${totalTimelineWidth}px` }}
      >
        
        {/* 1. Sticky Timeline Ruler & Section Header */}
        <div 
          className="sticky top-0 z-40 select-none w-full bg-[#090c13] flex flex-col"
          style={{ width: `${totalTimelineWidth}px` }}
        >
          {/* 1A. Arrangement Section Marker Strip */}
          {sections && sections.length > 0 && (
            <div className="h-6 border-b border-white/[0.08] flex bg-[#080b11] w-full text-[10px] font-mono">
              {/* Spacer matching track headers (w-80) */}
              <div className="w-80 shrink-0 sticky left-0 z-50 bg-[#0c1017] border-r border-white/[0.15] px-2.5 flex items-center justify-between shadow-[4px_0_14px_rgba(0,0,0,0.65)]">
                <span className="flex items-center gap-1 font-semibold text-slate-300 text-[10px]">
                  <span>📐</span>
                  <span>Sections ({sections.length})</span>
                </span>
                {onOpenArranger && (
                  <button
                    onClick={onOpenArranger}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[9px] font-semibold transition cursor-pointer"
                    title="Open Intelligent Arrangement Assistant & Section Arranger"
                  >
                    <span>Arranger</span>
                  </button>
                )}
              </div>

              {/* Sections visual track */}
              <div 
                className="flex items-center relative h-full cursor-pointer"
                style={{ width: `${totalBars * barWidth}px` }}
              >
                {sections.map(sec => {
                  const leftPx = (sec.startBar - 1) * barWidth;
                  const widthPx = sec.durationBars * barWidth;
                  const isCurrent = playheadPosition >= sec.startBar && playheadPosition < sec.startBar + sec.durationBars;
                  return (
                    <div
                      key={sec.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSeekPlayhead(sec.startBar);
                      }}
                      style={{ 
                        left: `${leftPx}px`, 
                        width: `${widthPx}px`,
                        borderLeftColor: sec.color
                      }}
                      className={`absolute top-0.5 bottom-0.5 rounded px-1.5 flex items-center justify-between border-l-2 transition overflow-hidden text-[9px] ${
                        isCurrent
                          ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm font-semibold'
                          : 'bg-slate-900/80 hover:bg-slate-850 text-slate-300 border border-white/[0.06]'
                      }`}
                      title={`${sec.name} (Bars ${sec.startBar}-${sec.startBar + sec.durationBars - 1} • ${sec.targetBpm} BPM)\nClick to seek to start of section`}
                    >
                      <div className="flex items-center gap-1 truncate">
                        <span className="truncate">{sec.sanskritName || sec.name.split(' ')[0]}</span>
                        <span className="text-[8px] opacity-75 capitalize">({sec.westernEquivalent})</span>
                      </div>
                      <span className="font-mono text-[8px] text-slate-400 shrink-0 ml-1">
                        {sec.targetBpm} BPM
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 1B. Bar Grid & Controls Header */}
          <div 
            className="h-8 border-b border-white/[0.12] flex bg-[#090c13] w-full"
            style={{ width: `${totalTimelineWidth}px` }}
          >
          
          {/* Top-Left Pinned Track Info & Zoom Toolbar Spacer */}
          <div className="w-80 shrink-0 sticky left-0 z-50 bg-[#0c1017] border-r border-white/[0.15] px-2.5 flex items-center justify-between font-mono text-[11px] text-slate-400 shadow-[4px_0_14px_rgba(0,0,0,0.65)]">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-300">Tracks ({tracks.length})</span>
              
              {/* Tool Toggle: Select (V) vs Razor (S) */}
              <div className="flex items-center gap-0.5 bg-slate-900 border border-white/[0.10] rounded p-0.5 ml-1">
                <button
                  onClick={() => setActiveTool('pointer')}
                  title="Select / Move Tool (V) - Click to select, drag clip body to reposition"
                  className={`p-0.5 px-1.5 rounded text-[9px] flex items-center gap-1 transition cursor-pointer ${
                    activeTool === 'pointer' ? 'bg-amber-500/25 text-amber-200 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MousePointer className="w-2.5 h-2.5" />
                  <span>V</span>
                </button>
                <button
                  onClick={() => setActiveTool('razor')}
                  title="Razor / Split Tool (S / C) - Click any clip to split at clicked bar"
                  className={`p-0.5 px-1.5 rounded text-[9px] flex items-center gap-1 transition cursor-pointer ${
                    activeTool === 'razor' ? 'bg-rose-500/30 text-rose-200 font-semibold ring-1 ring-rose-400/50' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Scissors className="w-2.5 h-2.5 text-rose-400" />
                  <span>S</span>
                </button>
              </div>

              <button 
                onClick={onOpenAddTrack}
                className="flex items-center gap-0.5 text-amber-400 hover:text-amber-300 transition cursor-pointer font-sans ml-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>

            {/* Follow Playhead Toggle & Zoom Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFollowPlayhead(!followPlayhead)}
                title={followPlayhead ? "Follow Playhead is ON (Auto-scroll during playback)" : "Follow Playhead is OFF (Click to enable)"}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] transition cursor-pointer ${
                  followPlayhead 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-600/40 font-semibold' 
                    : 'text-slate-500 hover:text-slate-300 border border-white/[0.08]'
                }`}
              >
                <LocateFixed className="w-2.5 h-2.5" />
                <span>Follow</span>
              </button>

              <div className="flex items-center gap-1 bg-slate-900 border border-white/[0.08] rounded px-1 py-0.5">
                <button 
                  onClick={() => setBarWidth(prev => Math.max(28, prev - 12))}
                  title="Zoom Out (View more bars)"
                  className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer transition"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <span className="text-slate-400 text-[9px] w-5 text-center font-mono">{barWidth}p</span>
                <button 
                  onClick={() => setBarWidth(prev => Math.min(140, prev + 12))}
                  title="Zoom In (Precision editing)"
                  className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer transition"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Bar Ruler Grid Canvas */}
          <div 
            className="flex items-center relative cursor-pointer select-none"
            style={{ width: `${totalBars * barWidth}px` }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const clickedBar = 1 + (clickX / barWidth);
              onSeekPlayhead(Math.max(1, Math.min(totalBars, clickedBar)));
            }}
          >
            {/* Playhead Marker in Ruler */}
            <div 
              className="absolute top-0 bottom-0 w-[2px] bg-amber-400 pointer-events-none z-30 transition-all duration-75"
              style={{ left: `${(playheadPosition - 1) * barWidth}px` }}
            >
              <div className="w-3 h-3.5 bg-amber-400 rounded-b shadow-md -translate-x-[5px] flex items-center justify-center">
                <div className="w-1 h-1 bg-slate-950 rounded-full" />
              </div>
            </div>

            {/* Off-screen Playhead Indicator (Left) */}
            {isPlayheadOffscreenLeft && (
              <button
                onClick={(e) => { e.stopPropagation(); scrollToPlayhead(); }}
                title="Playhead is behind track headers. Click to view playhead."
                className="sticky left-[328px] z-50 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-[10px] font-bold shadow-lg shadow-black/80 border border-amber-300 cursor-pointer transition animate-in fade-in slide-in-from-left-2 duration-150 my-auto ml-2 shrink-0"
              >
                <span className="text-xs font-black">◀</span>
                <span>Playhead: Bar {Math.floor(playheadPosition)}.{Math.floor((playheadPosition % 1) * 4) + 1}</span>
              </button>
            )}

            {Array.from({ length: totalBars }).map((_, barIdx) => {
              const isSam = (barIdx % 4) === 0;
              const showTime = barWidth >= 48 ? isSam : (barIdx % 8) === 0;
              return (
                <div 
                  key={barIdx} 
                  style={{ width: `${barWidth}px` }}
                  className={`h-full shrink-0 flex flex-col justify-center px-1 font-mono text-[10px] ${barIdx === 0 ? 'border-l border-r' : 'border-r'} ${
                    isSam 
                      ? 'border-white/[0.15] text-amber-200/90 font-medium bg-amber-500/[0.02]' 
                      : 'border-white/[0.05] text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between leading-none">
                    <span>{barIdx + 1}</span>
                    {showTime && (
                      <span className="text-[9px] text-slate-500 font-normal">
                        {getBarTime(barIdx, bpm)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Off-screen Playhead Indicator (Right) */}
          {isPlayheadOffscreenRight && (
            <button
              onClick={scrollToPlayhead}
              title="Playhead is ahead off-screen. Click to view playhead."
              className="fixed right-6 top-[85px] z-50 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-[10px] font-bold shadow-lg shadow-black/80 border border-amber-300 cursor-pointer transition animate-in fade-in slide-in-from-right-2 duration-150"
            >
              <span>Playhead: Bar {Math.floor(playheadPosition)}.{Math.floor((playheadPosition % 1) * 4) + 1}</span>
              <span className="text-xs font-black">▶</span>
            </button>
          )}

          {/* Inline Extend & Decrease Controls at Ruler End */}
          <div className="flex items-center px-3 bg-slate-950/80 border-r border-white/[0.15] shrink-0 gap-1.5">
            <button
              onClick={() => handleDecreaseTimeline(16)}
              disabled={totalBars <= minAllowedBars}
              title={`Decrease / Downsize Timeline (-16 Bars / ~40s) [Min: ${minAllowedBars} bars]`}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-rose-300 disabled:opacity-25 disabled:pointer-events-none border border-white/[0.12] text-[10px] font-mono cursor-pointer transition"
            >
              <Minus className="w-3 h-3" />
              <span>-16b</span>
            </button>

            <button
              onClick={() => onTotalBarsChange(totalBars + 16)}
              title="Extend Timeline (+16 Bars / ~40s)"
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-850 text-amber-300/90 border border-white/[0.12] text-[10px] font-mono cursor-pointer transition"
            >
              <Plus className="w-3 h-3" />
              <span>+16b</span>
            </button>

            {/* Quick Length Presets */}
            <select
              value={totalBars}
              onChange={(e) => onTotalBarsChange(Math.max(minAllowedBars, Number(e.target.value)))}
              className="bg-slate-900 text-slate-300 text-[10px] font-mono rounded px-1.5 py-1 border border-white/[0.12] focus:outline-none cursor-pointer"
              title="Select Total Arrangement Duration"
            >
              {DURATION_PRESETS.map(p => (
                <option key={p.bars} value={p.bars} disabled={p.bars < minAllowedBars}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

        </div>
        </div>

        {/* Global Playhead Vertical Line Across Tracks (Ducks behind sticky track headers) */}
        <div 
          className="absolute top-[56px] bottom-0 w-[1.5px] bg-amber-400/80 z-20 pointer-events-none shadow-sm shadow-amber-900/40 transition-all duration-75"
          style={{ left: `${320 + (playheadPosition - 1) * barWidth}px` }}
        />

        {/* Interactive Draggable Timeline End Boundary Handle (Downsize & Extend with Cursor) */}
        <div
          className="absolute top-0 bottom-0 z-30 flex flex-col items-center select-none"
          style={{ left: `${320 + totalBars * barWidth - 8}px`, width: '16px' }}
        >
          <div 
            onMouseDown={handleEndMarkerMouseDown}
            title={`Arrangement End Boundary (Bar ${totalBars} • ${getBarTime(totalBars, bpm)})\nDrag left with cursor to downsize, drag right to extend\n[Minimum limit: ${minAllowedBars} bars based on existing clips]`}
            className="w-full h-full flex flex-col items-center cursor-ew-resize group/endmarker relative"
          >
            {/* Top Draggable Grip Badge sitting on the Ruler */}
            <div 
              className={`sticky top-1 z-50 flex items-center gap-1 px-2 py-0.5 rounded-full border shadow-xl transition-all font-mono text-[9px] font-bold ${
                isDraggingEndMarker 
                  ? 'bg-amber-500 text-slate-950 border-amber-300 scale-105 ring-2 ring-amber-400/60' 
                  : 'bg-[#151922] text-amber-200/90 border-white/[0.20] group-hover/endmarker:border-amber-400/60 group-hover/endmarker:bg-slate-900'
              }`}
            >
              <GripVertical className="w-2.5 h-2.5 opacity-70" />
              <span>End: {totalBars}b</span>
              <span className="text-[8px] opacity-75">({getBarTime(totalBars, bpm)})</span>
            </div>

            {/* Vertical Guideline through all tracks */}
            <div 
              className={`flex-1 w-[2px] transition-colors ${
                isDraggingEndMarker
                  ? 'bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.8)]'
                  : 'bg-amber-500/40 group-hover/endmarker:bg-amber-400/80 border-r border-dashed border-amber-500/20'
              }`}
            />

            {/* Bottom Tab Marker */}
            <div 
              className={`w-3 h-3 rounded-full border shadow-sm transition-all -translate-y-1.5 ${
                isDraggingEndMarker 
                  ? 'bg-amber-400 border-white scale-125' 
                  : 'bg-slate-900 border-amber-500/50 group-hover/endmarker:border-amber-400'
              }`} 
            />
          </div>
        </div>

        {/* 2. Multitrack Rows Canvas */}
        <div 
          className="flex flex-col divide-y divide-white/[0.08] relative"
          style={{ width: `${totalTimelineWidth}px` }}
        >
          
          {tracks.map((track) => {
            const isSelected = selectedTrackId === track.id;
            const isTrackSelectionActive = selection && selection.trackId === track.id;

            return (
              <div 
                key={track.id}
                onClick={() => onSelectTrack(track)}
                className={`h-20 flex border-b border-white/[0.08] transition-colors cursor-pointer relative w-full ${
                  isSelected ? 'bg-slate-900/60 ring-1 ring-inset ring-amber-500/20' : 'bg-[#080b11] hover:bg-slate-900/30'
                }`}
                style={{ width: `${totalTimelineWidth}px` }}
              >
                {/* Track Control Header (Sticky Left on Horizontal Scroll) */}
                <div className={`w-80 shrink-0 sticky left-0 p-2 flex flex-col justify-between bg-[#0c1017] border-r border-white/[0.12] shadow-[4px_0_14px_rgba(0,0,0,0.65)] ${openInstrumentDropdownTrackId === track.id ? 'z-[60]' : 'z-50'}`}>
                  <div className="flex flex-col gap-0.5 relative">
                    {/* Row 1: Track Name + Instrument Selector */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div 
                        className="w-2 h-2 rounded-full shrink-0 shadow-sm opacity-90"
                        style={{ backgroundColor: track.color }}
                      />
                      <span className="font-semibold text-slate-300 truncate text-xs max-w-[110px]">
                        {track.name}
                      </span>

                            {/* Interactive Instrument Family Dropdown Selector */}
                            {(() => {
                              const family = getTrackInstrumentFamily(track);
                              const isDropdownOpen = openInstrumentDropdownTrackId === track.id;
                              const currentInst = family.instruments.find(i => i.name === track.activeInstrument) || family.instruments[0];

                              return (
                                <div className="relative inline-block shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenInstrumentDropdownTrackId(isDropdownOpen ? null : track.id);
                                    }}
                                    title={`Select instrument from ${family.familyTitle} (${family.indianClassicalCategory})`}
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono transition bg-slate-900/90 hover:bg-slate-800 text-amber-200/90 border border-white/[0.12] hover:border-amber-400/40 cursor-pointer"
                                  >
                                    <span>{currentInst.icon}</span>
                                    <span className="truncate max-w-[70px]">{currentInst.shortName}</span>
                                    <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                                  </button>

                                  {/* Instrument Family Dropdown Popover */}
                                  {isDropdownOpen && (
                                    <div 
                                      onClick={(e) => e.stopPropagation()}
                                      className="absolute left-0 top-6 w-64 max-h-72 overflow-y-auto bg-[#0f131c] border border-white/[0.20] rounded-lg shadow-2xl p-1 z-50 divide-y divide-white/[0.06] animate-in fade-in zoom-in-95 duration-100"
                                    >
                                      <div className="px-2 py-1 text-[9px] font-mono text-amber-400/90 flex items-center justify-between">
                                        <span>{family.familyTitle}</span>
                                        <span className="text-slate-500 text-[8px]">{family.indianClassicalCategory}</span>
                                      </div>
                                      <div className="py-0.5">
                                        {family.instruments.map((inst) => {
                                          const isSelected = track.activeInstrument === inst.name || (!track.activeInstrument && inst.id === family.instruments[0].id);

                                          return (
                                            <button
                                              key={inst.id}
                                              onClick={() => {
                                                onUpdateTrack(track.id, {
                                                  activeInstrument: inst.name
                                                });
                                                audioEngine.playNotePreview(inst.previewPitch, 0.4);
                                                setOpenInstrumentDropdownTrackId(null);
                                              }}
                                              className={`w-full text-left px-2 py-1.5 rounded flex items-start gap-2 hover:bg-white/[0.08] transition cursor-pointer ${
                                                isSelected ? 'bg-amber-500/20 text-amber-200' : 'text-slate-300'
                                              }`}
                                            >
                                              <span className="text-sm mt-0.5">{inst.icon}</span>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                  <span className="font-semibold text-[10px] truncate">{inst.name}</span>
                                                  {isSelected && <Check className="w-3 h-3 text-amber-400 shrink-0" />}
                                                </div>
                                                <p className="text-[8.5px] text-slate-400 line-clamp-2 leading-tight mt-0.5">
                                                  {inst.desc}
                                                </p>
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Row 2: All Action Badges (flex-wrap to prevent overlap) */}
                          <div className="flex items-center gap-1 flex-wrap">
                            {onOpenVagdhenuLyrics && (track.role === 'lead_vocal' || track.role === 'vedic_chant' || (track.name && track.name.toLowerCase().includes('vocal'))) && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onOpenVagdhenuLyrics(); }}
                                title="Open Vāgdhenu Vedic Lyrics & Synchronized Teleprompter"
                                className="px-1 py-px rounded text-[8px] font-medium bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-600/40 transition cursor-pointer flex items-center gap-0.5 active:scale-95"
                              >
                                <span>📿</span><span>Lyrics</span>
                              </button>
                            )}

                            {onOpenShrutiMandala && (track.id === 'tr-1' || (track.name && track.name.toLowerCase().includes('mood'))) && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onOpenShrutiMandala(); }}
                                title="Open 22 Shrutis Just Intonation & Moveable Sa Tuning Hub"
                                className="px-1 py-px rounded text-[8px] font-medium bg-stone-850 hover:bg-stone-800 text-amber-300 border border-amber-600/35 transition cursor-pointer flex items-center gap-0.5 active:scale-95"
                              >
                                <span>🕉️</span><span>Sa</span>
                              </button>
                            )}

                            {onOpenAIOrchestrator && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onOpenAIOrchestrator(track.id); }}
                                title={`AI Model: ${track.model ? track.model.toUpperCase() : 'UNKNOWN'}`}
                                className="px-1 py-px rounded text-[8px] font-mono font-medium bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-600/35 transition cursor-pointer flex items-center gap-0.5 active:scale-95"
                              >
                                <Cpu className="w-2 h-2 text-purple-400" />
                                <span>{track.model === 'yue_2' ? 'YuE' : track.model === 'minimax_3' ? 'MM3' : track.model === 'ace_studio' ? 'ACE' : track.model === 'stable_audio_3' ? 'SA3' : track.model === 'vagdhenu' ? 'Vāg' : 'SF'}</span>
                              </button>
                            )}

                            {onOpenStemForge && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onOpenStemForge(track.id); }}
                                title="StemForge AI Stem Separation"
                                className="px-1 py-px rounded text-[8px] font-mono font-medium bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-600/35 transition cursor-pointer flex items-center gap-0.5 active:scale-95"
                              >
                                <Scissors className="w-2 h-2 text-cyan-400" />
                              </button>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const nextVal = !track.hypersonicAir;
                                if (nextVal) audioEngine.previewHypersonicAir();
                                onUpdateTrack(track.id, { hypersonicAir: nextVal });
                              }}
                              title={`48k Air: ${track.hypersonicAir ? 'ON' : 'OFF'}`}
                              className={`px-1 py-px rounded font-mono text-[8px] font-medium transition cursor-pointer ${
                                track.hypersonicAir
                                  ? 'bg-teal-950/70 text-teal-300 border border-teal-500/50'
                                  : 'bg-slate-900/50 text-slate-600 border border-slate-750/30 line-through opacity-50 hover:opacity-80'
                              }`}
                            >48k</button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const nextVal = !track.somaticSub;
                                if (nextVal) audioEngine.previewSomaticInfrasound();
                                onUpdateTrack(track.id, { somaticSub: nextVal });
                              }}
                              title={`10Hz Sub: ${track.somaticSub ? 'ON' : 'OFF'}`}
                              className={`px-1 py-px rounded font-mono text-[8px] font-medium transition cursor-pointer ${
                                track.somaticSub
                                  ? 'bg-rose-950/70 text-rose-300 border border-rose-500/50'
                                  : 'bg-slate-900/50 text-slate-600 border border-slate-750/30 line-through opacity-50 hover:opacity-80'
                              }`}
                            >Sub</button>

                            {onOpenSpatialAudio && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onOpenSpatialAudio(track.id); }}
                                title={`3D: Az ${track.spatial?.azimuth ?? 0}° El ${track.spatial?.elevation ?? 0}°`}
                                className="px-1 py-px rounded font-mono text-[8px] font-medium bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-600/30 transition cursor-pointer flex items-center gap-0.5"
                              >
                                <Compass className="w-2 h-2" /><span>3D</span>
                              </button>
                            )}

                            {onOpenMidiController && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onSelectTrack(track); onOpenMidiController(); }}
                                title="MIDI & MPE"
                                className="p-0.5 rounded text-[8px] font-mono bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-600/30 transition cursor-pointer"
                              >
                                <Radio className="w-2.5 h-2.5" />
                              </button>
                            )}

                            {onOpenPlugins && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onSelectTrack(track); onOpenPlugins(track.id); }}
                                title={`FX: ${(track.plugins?.filter(p => p.enabled).length || 0)} active`}
                                className={`px-1 py-px rounded font-mono text-[8px] font-medium transition cursor-pointer ${
                                  (track.plugins?.filter(p => p.enabled).length || 0) > 0
                                    ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-500/50'
                                    : 'bg-slate-900/50 text-slate-500 border border-slate-750/30 hover:text-indigo-300'
                                }`}
                              >FX{track.plugins && track.plugins.filter(p => p.enabled).length > 0 ? ` ${track.plugins.filter(p => p.enabled).length}` : ''}</button>
                            )}

                            {onOpenExtendedSpectrum && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onOpenExtendedSpectrum(); }}
                                title="96kHz DSP Inspector"
                                className="p-0.5 text-slate-500 hover:text-amber-300 transition cursor-pointer"
                              >
                                <Zap className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Controls Row: Solo, Mute, Volume Slider with Hover-Knob, Takes */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1 font-mono text-[10px]">
                            <button
                              onClick={(e) => { e.stopPropagation(); onUpdateTrack(track.id, { soloed: !track.soloed }); }}
                              className={`px-1.5 py-0.5 rounded font-medium cursor-pointer transition ${
                                track.soloed ? 'bg-amber-600/85 text-slate-950 font-semibold' : 'bg-slate-850/80 text-slate-400/80 hover:text-slate-200 border border-white/[0.08]'
                              }`}
                            >
                              S
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); onUpdateTrack(track.id, { muted: !track.muted }); }}
                              className={`px-1.5 py-0.5 rounded font-medium cursor-pointer transition ${
                                track.muted ? 'bg-rose-900/80 text-rose-200' : 'bg-slate-850/80 text-slate-400/80 hover:text-slate-200 border border-white/[0.08]'
                              }`}
                            >
                              M
                            </button>

                            {/* Volume Slider & Mellow Button */}
                            <div className="flex items-center gap-1.5 ml-1.5 group/volume">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateTrack(track.id, { volume: track.volume > 0 ? 0 : 0.8 });
                                }}
                                title={track.volume === 0 ? "Unmute Volume" : "Mute Volume"}
                                className="p-0.5 rounded text-slate-500/65 hover:text-slate-400/90 transition cursor-pointer hover:bg-white/[0.05]"
                              >
                                {track.volume === 0 ? (
                                  <VolumeX className="w-3 h-3 text-slate-500/50" />
                                ) : (
                                  <Volume2 className="w-3 h-3 text-slate-500/70 group-hover/volume:text-slate-400/90 transition-colors" />
                                )}
                              </button>
                              <div className="relative flex items-center w-14 h-4 cursor-pointer">
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.01"
                                  value={track.volume}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => onUpdateTrack(track.id, { volume: Number(e.target.value) })}
                                  className="volume-slider w-full cursor-pointer"
                                  style={{
                                    background: `linear-gradient(to right, #b08d57 0%, #b08d57 ${track.volume * 100}%, rgba(255, 255, 255, 0.12) ${track.volume * 100}%, rgba(255, 255, 255, 0.12) 100%)`
                                  }}
                                />
                              </div>
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
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-850 hover:bg-stone-800 text-amber-200/80 border border-amber-600/30 text-[10px] font-medium cursor-pointer"
                              >
                                <Zap className="w-3 h-3 text-amber-300/80" />
                                <span>FX Builder</span>
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); onRegenerateTrack(track.id); }}
                                title="Context-Aware Overdub / Regenerate (Listens to Active Mix)"
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-amber-200 border border-white/[0.12] text-[10px] font-medium cursor-pointer transition"
                              >
                                <RotateCcw className="w-3 h-3 text-slate-400" />
                                <span>Overdub</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Track Waveform / Clips Canvas (Right - Click & Drag Selection for Music/SFX Generation) */}
                      <div 
                        className="relative h-full shrink-0 bg-slate-950/30 flex select-none"
                        style={{ width: `${totalBars * barWidth}px` }}
                        onMouseDown={(e) => handleCanvasMouseDown(e, track.id)}
                        onMouseMove={(e) => handleCanvasMouseMove(e, track.id)}
                      >
                        {/* Bar Grid Lines */}
                        {Array.from({ length: totalBars }).map((_, bIdx) => {
                          const isSam = (bIdx % 4) === 0;
                          return (
                            <div 
                              key={bIdx}
                              style={{ width: `${barWidth}px` }}
                              className={`h-full shrink-0 border-r pointer-events-none ${bIdx === 0 ? 'border-l ' : ''}${
                                isSam ? 'border-white/[0.08]' : 'border-white/[0.03]'
                              }`}
                            />
                          );
                        })}

                        {/* Clips Rendered Across Any Length */}
                        {track.clips.map((clip) => {
                          const isThisClipResizing = clipResizeDrag?.clip.id === clip.id;
                          const isThisClipGenerating = generatingClipExtension?.clipId === clip.id;
                          const isThisClipMoving = clipMoveDrag?.clip.id === clip.id;
                          const isClipSelected = selectedClipId === clip.id;

                          // Live start bar and duration factoring in active dragging
                          const activeStartBar = isThisClipMoving ? clipMoveDrag.currentStartBar : clip.startBar;
                          const activeDurationBars = isThisClipResizing 
                            ? clipResizeDrag.currentDuration 
                            : (isThisClipGenerating && generatingClipExtension
                                ? clip.durationBars + generatingClipExtension.barsAdded
                                : clip.durationBars);

                          const leftPx = (activeStartBar - 1) * barWidth;
                          const widthPx = activeDurationBars * barWidth;
                          const clipDurationSec = Math.round(activeDurationBars * (4 * 60 / bpm));
                          
                          const activeFadeInBars = clipFadeDrag?.clipId === clip.id && clipFadeDrag?.type === 'in' ? clipFadeDrag.currentFadeBars : (clip.fadeInBars || 0);
                          const activeFadeOutBars = clipFadeDrag?.clipId === clip.id && clipFadeDrag?.type === 'out' ? clipFadeDrag.currentFadeBars : (clip.fadeOutBars || 0);

                          const isExtendingLive = isThisClipResizing && clipResizeDrag.currentDuration > clipResizeDrag.originalDuration;
                          const isShrinkingLive = isThisClipResizing && clipResizeDrag.currentDuration < clipResizeDrag.originalDuration;
                          const deltaBars = isThisClipResizing ? clipResizeDrag.currentDuration - clipResizeDrag.originalDuration : 0;

                          // Click on clip body handler (Razor split vs Move drag)
                          const handleClipMouseDown = (e: React.MouseEvent) => {
                            e.stopPropagation();

                            if (activeTool === 'razor') {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const clickX = e.clientX - rect.left;
                              const barOffset = Math.floor(clickX / barWidth);
                              const targetSplitBar = clip.startBar + Math.max(1, Math.min(clip.durationBars - 1, barOffset));
                              handleSplitClip(track.id, clip, targetSplitBar);
                              return;
                            }

                            // Pointer tool: select and initiate move drag
                            setSelectedClipId(clip.id);
                            setClipMoveDrag({
                              trackId: track.id,
                              clip,
                              originalStartBar: clip.startBar,
                              currentStartBar: clip.startBar,
                              startX: e.clientX,
                              isAltCopy: e.altKey
                            });
                          };

                          return (
                            <div
                              key={clip.id}
                              onMouseDown={handleClipMouseDown}
                              className={`absolute top-1 bottom-1 rounded-lg border flex flex-col justify-between px-2 py-1 shadow-md transition-all select-none group/clip ${
                                activeTool === 'razor' ? 'cursor-crosshair' : isThisClipMoving ? 'cursor-grabbing opacity-90 scale-[1.01] shadow-2xl z-30' : 'cursor-grab z-10'
                              } ${
                                isClipSelected ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-950 z-20' : ''
                              } ${
                                isThisClipResizing 
                                  ? 'ring-2 ring-amber-400/90 shadow-2xl z-30' 
                                  : isThisClipGenerating 
                                    ? 'ring-2 ring-emerald-400/90 shadow-2xl z-30 animate-pulse' 
                                    : ''
                              }`}
                              style={{
                                left: `${leftPx}px`,
                                width: `${widthPx}px`,
                                backgroundColor: `${track.color}15`,
                                borderColor: isThisClipGenerating ? '#10b981' : isThisClipResizing ? '#d97706' : isClipSelected ? '#d97706' : `${track.color}40`
                              }}
                            >
                              {/* Live Move Dragging Tooltip */}
                              {isThisClipMoving && (
                                <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md text-[10px] font-mono whitespace-nowrap shadow-xl z-50 pointer-events-none flex items-center gap-1.5 border bg-slate-900/95 text-slate-200 border-amber-400/60 backdrop-blur-md">
                                  <Move className="w-3 h-3 text-amber-400" />
                                  <span>Move to Bar {clipMoveDrag.currentStartBar} (Bars {clipMoveDrag.currentStartBar}–{clipMoveDrag.currentStartBar + clip.durationBars - 1})</span>
                                  {clipMoveDrag.isAltCopy && (
                                    <span className="text-emerald-300 font-semibold">• [Alt] Duplicate</span>
                                  )}
                                </div>
                              )}

                              {/* Live Resize Dragging Tooltip & Status Badge */}
                              {isThisClipResizing && (
                                <div 
                                  className={`absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md text-[10px] font-mono whitespace-nowrap shadow-xl z-50 pointer-events-none flex items-center gap-1.5 border backdrop-blur-md ${
                                    isExtendingLive 
                                      ? 'bg-amber-950/95 text-amber-200 border-amber-500/60' 
                                      : isShrinkingLive 
                                        ? 'bg-rose-950/95 text-rose-200 border-rose-500/60'
                                        : 'bg-slate-900/95 text-slate-200 border-white/25'
                                  }`}
                                >
                                  {isExtendingLive ? (
                                    <>
                                      <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
                                      <span className="font-semibold text-amber-300">Extend +{deltaBars}b</span>
                                      <span className="text-slate-300">to Bar {clip.startBar + activeDurationBars - 1}</span>
                                      <span className="text-amber-400 text-[9px]">• Release to Generate AI</span>
                                    </>
                                  ) : isShrinkingLive ? (
                                    <>
                                      <span className="font-semibold text-rose-300">✂️ Shrink {deltaBars}b</span>
                                      <span className="text-slate-300">to {activeDurationBars}b</span>
                                      <span className="text-rose-400 text-[9px]">• Release to Trim</span>
                                    </>
                                  ) : (
                                    <span>Drag left to shrink • Drag right to extend & generate</span>
                                  )}
                                </div>
                              )}

                              {/* AI Synthesizing Extension Indicator Badge */}
                              {isThisClipGenerating && generatingClipExtension && (
                                <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md text-[10px] font-mono bg-emerald-950/95 text-emerald-200 border border-emerald-500/60 shadow-xl z-50 flex items-center gap-1.5 whitespace-nowrap animate-pulse backdrop-blur-md">
                                  <Wand2 className="w-3 h-3 text-emerald-400 animate-spin" />
                                  <span className="font-semibold text-emerald-300">AI Synthesizing Extension:</span>
                                  <span>Bars {generatingClipExtension.extendedFromBar}–{generatingClipExtension.extendedToBar} (+{generatingClipExtension.barsAdded}b)</span>
                                </div>
                              )}

                              {/* Clip Header: Name, Duration, Quick Action Buttons */}
                              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-200 relative z-10">
                                <span className="truncate max-w-[50%] flex items-center gap-1.5">
                                  {clip.name}
                                  {isThisClipGenerating && (
                                    <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-mono font-normal">
                                      AI Extending...
                                    </span>
                                  )}
                                </span>
                                <div className="flex items-center gap-1 font-mono text-slate-400 text-[9px]">
                                  <span className={isExtendingLive ? 'text-amber-300 font-bold' : isShrinkingLive ? 'text-rose-300 font-bold' : ''}>
                                    {activeDurationBars}b
                                  </span>
                                  <span className="text-slate-500">• {clipDurationSec}s</span>
                                  
                                  {/* Quick Razor Split Button (Halfway) */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSplitClip(track.id, clip, clip.startBar + Math.max(1, Math.floor(clip.durationBars / 2)));
                                    }}
                                    title="Split / Slice clip in half"
                                    className="opacity-0 group-hover/clip:opacity-100 p-0.5 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-amber-200 transition cursor-pointer"
                                  >
                                    <Scissors className="w-2.5 h-2.5" />
                                  </button>

                                  {/* Quick Shrink Button (-2 bars) */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleShrinkClip(track.id, clip, Math.max(1, clip.durationBars - 2));
                                    }}
                                    title="Shrink clip by 2 bars"
                                    className="opacity-0 group-hover/clip:opacity-100 p-0.5 rounded bg-slate-800/90 hover:bg-rose-950 hover:text-rose-200 text-slate-400 border border-white/10 transition cursor-pointer"
                                  >
                                    <Minus className="w-2.5 h-2.5" />
                                  </button>

                                  {/* Quick Extend & Generate Button (+4 bars) */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExtendClip(track.id, clip, clip.durationBars + 4);
                                    }}
                                    title="Extend clip by 4 bars & automatically generate continuation"
                                    className="opacity-0 group-hover/clip:opacity-100 px-1.5 py-0.5 rounded bg-amber-950/90 hover:bg-amber-800 text-amber-200 border border-amber-500/40 text-[8px] font-semibold transition cursor-pointer flex items-center gap-0.5 shadow-sm"
                                  >
                                    <Plus className="w-2 h-2" />
                                    <span>4b Gen</span>
                                  </button>

                                  {/* Duplicate / Loop Clip */}
                                  <button
                                    onClick={(e) => handleDuplicateClip(e, track.id, clip)}
                                    title="Duplicate / Loop Clip to next section"
                                    className="opacity-0 group-hover/clip:opacity-100 p-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-200 transition cursor-pointer"
                                  >
                                    <Copy className="w-2.5 h-2.5" />
                                  </button>

                                  {/* Delete Clip */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteClip(track.id, clip.id);
                                    }}
                                    title="Delete clip (or press Backspace / Del)"
                                    className="opacity-0 group-hover/clip:opacity-100 p-0.5 rounded bg-slate-800/90 hover:bg-rose-950 text-slate-400 hover:text-rose-200 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Simulated Waveform Bars with Extension Glow */}
                              <div className="flex items-center gap-0.5 h-5 opacity-75 relative z-0 overflow-hidden">
                                {Array.from({ length: Math.max(12, Math.floor(widthPx / 6)) }).map((_, wIdx) => {
                                  const originalBarsCount = Math.max(12, Math.floor((clip.durationBars * barWidth) / 6));
                                  const isInExtensionZone = isExtendingLive 
                                    ? wIdx >= originalBarsCount 
                                    : (isThisClipGenerating && wIdx >= originalBarsCount);

                                  const height = isInExtensionZone 
                                    ? 35 + Math.sin(wIdx * 1.3) * 50 
                                    : 20 + Math.sin(wIdx * 0.8) * 70;

                                  return (
                                    <div
                                      key={wIdx}
                                      className={`flex-1 rounded-sm transition-all ${
                                        isInExtensionZone ? 'animate-pulse' : ''
                                      }`}
                                      style={{
                                        height: `${Math.max(15, height)}%`,
                                        backgroundColor: isInExtensionZone ? '#f59e0b' : track.color
                                      }}
                                    />
                                  );
                                })}
                              </div>

                              {/* Visual Fade Overlay - In (Logarithmic / Exponential Curve) */}
                              {activeFadeInBars > 0 && (
                                <div 
                                  className="absolute top-0 left-0 bottom-0 pointer-events-none z-10 overflow-hidden rounded-l-lg"
                                  style={{ width: `${activeFadeInBars * barWidth}px` }}
                                >
                                  <svg
                                    className="w-full h-full"
                                    viewBox={`0 0 ${Math.max(1, activeFadeInBars * barWidth)} 100`}
                                    preserveAspectRatio="none"
                                  >
                                    <defs>
                                      <linearGradient id={`fadeInGrad-${clip.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="rgba(0,0,0,0.82)" />
                                        <stop offset="65%" stopColor="rgba(0,0,0,0.4)" />
                                        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                                      </linearGradient>
                                    </defs>
                                    <path 
                                      d={`M 0 0 L ${activeFadeInBars * barWidth} 0 C ${(activeFadeInBars * barWidth) * 0.45} 5, ${(activeFadeInBars * barWidth) * 0.1} 35, 0 100 Z`}
                                      fill={`url(#fadeInGrad-${clip.id})`}
                                    />
                                    <path 
                                      d={`M 0 100 C ${(activeFadeInBars * barWidth) * 0.1} 35, ${(activeFadeInBars * barWidth) * 0.45} 5, ${activeFadeInBars * barWidth} 0`}
                                      fill="none"
                                      stroke="rgba(251, 191, 36, 0.95)"
                                      strokeWidth="2"
                                    />
                                  </svg>
                                </div>
                              )}
                              
                              {/* Visual Fade Overlay - Out (Logarithmic / Exponential Curve) */}
                              {activeFadeOutBars > 0 && (
                                <div 
                                  className="absolute top-0 right-0 bottom-0 pointer-events-none z-10 overflow-hidden rounded-r-lg"
                                  style={{ width: `${activeFadeOutBars * barWidth}px` }}
                                >
                                  <svg
                                    className="w-full h-full"
                                    viewBox={`0 0 ${Math.max(1, activeFadeOutBars * barWidth)} 100`}
                                    preserveAspectRatio="none"
                                  >
                                    <defs>
                                      <linearGradient id={`fadeOutGrad-${clip.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="rgba(0,0,0,0)" />
                                        <stop offset="35%" stopColor="rgba(0,0,0,0.4)" />
                                        <stop offset="100%" stopColor="rgba(0,0,0,0.82)" />
                                      </linearGradient>
                                    </defs>
                                    <path 
                                      d={`M 0 0 C ${(activeFadeOutBars * barWidth) * 0.55} 5, ${(activeFadeOutBars * barWidth) * 0.9} 35, ${activeFadeOutBars * barWidth} 100 L ${activeFadeOutBars * barWidth} 0 Z`}
                                      fill={`url(#fadeOutGrad-${clip.id})`}
                                    />
                                    <path 
                                      d={`M 0 0 C ${(activeFadeOutBars * barWidth) * 0.55} 5, ${(activeFadeOutBars * barWidth) * 0.9} 35, ${activeFadeOutBars * barWidth} 100`}
                                      fill="none"
                                      stroke="rgba(251, 191, 36, 0.95)"
                                      strokeWidth="2"
                                    />
                                  </svg>
                                </div>
                              )}

                              {/* Right Edge Interactive Resize Handle (Drag to extend or shrink) */}
                              <div
                                onMouseDown={(e) => handleClipResizeMouseDown(e, track.id, clip)}
                                title="Drag left to shrink • Drag right to extend & generate AI audio"
                                className="absolute top-0 bottom-0 right-0 w-3.5 cursor-ew-resize flex items-center justify-center bg-white/0 hover:bg-amber-400/25 active:bg-amber-400/40 rounded-r-lg group-hover/clip:border-r-2 group-hover/clip:border-amber-400/80 transition-all z-20"
                              >
                                <div className="w-0.5 h-4 rounded bg-white/40 group-hover/clip:bg-amber-300 group-hover/clip:h-6 transition-all" />
                              </div>

                              {/* Interactive Fade In Handle (Positioned dynamically at fade-in end point) */}
                              <div 
                                className={`absolute top-0 z-30 transition-opacity flex items-center justify-center cursor-ew-resize ${
                                  clipFadeDrag?.clipId === clip.id && clipFadeDrag?.type === 'in' || activeFadeInBars > 0
                                    ? 'opacity-100'
                                    : 'opacity-0 group-hover/clip:opacity-100'
                                }`}
                                style={{
                                  left: `${activeFadeInBars > 0 ? activeFadeInBars * barWidth : 0}px`,
                                  transform: activeFadeInBars > 0 ? 'translateX(-50%)' : 'translateX(0)',
                                  width: '20px',
                                  height: '20px'
                                }}
                                title={`Fade In: ${activeFadeInBars.toFixed(2)} bars (drag to adjust)`}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setClipFadeDrag({
                                    trackId: track.id,
                                    clipId: clip.id,
                                    type: 'in',
                                    originalFadeBars: clip.fadeInBars || 0,
                                    currentFadeBars: clip.fadeInBars || 0,
                                    startX: e.clientX
                                  });
                                }}
                              >
                                <div className={`w-3 h-3 rounded-full border border-black shadow-md flex items-center justify-center transition-transform ${
                                  clipFadeDrag?.clipId === clip.id && clipFadeDrag?.type === 'in'
                                    ? 'bg-amber-300 scale-125 ring-2 ring-amber-400'
                                    : 'bg-amber-400 hover:scale-125 hover:bg-amber-300'
                                }`}>
                                  <div className="w-1 h-1 rounded-full bg-slate-900" />
                                </div>
                                {clipFadeDrag?.clipId === clip.id && clipFadeDrag?.type === 'in' && (
                                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-950/95 border border-amber-400/80 text-[9px] font-mono text-amber-300 font-bold whitespace-nowrap shadow-2xl pointer-events-none z-50">
                                    Fade In: {activeFadeInBars.toFixed(2)} bars
                                  </div>
                                )}
                              </div>

                              {/* Interactive Fade Out Handle (Positioned dynamically at fade-out start point) */}
                              <div 
                                className={`absolute top-0 z-30 transition-opacity flex items-center justify-center cursor-ew-resize ${
                                  clipFadeDrag?.clipId === clip.id && clipFadeDrag?.type === 'out' || activeFadeOutBars > 0
                                    ? 'opacity-100'
                                    : 'opacity-0 group-hover/clip:opacity-100'
                                }`}
                                style={{
                                  left: `${activeFadeOutBars > 0 ? (widthPx - (activeFadeOutBars * barWidth)) : (widthPx - 14)}px`,
                                  transform: activeFadeOutBars > 0 ? 'translateX(-50%)' : 'translateX(0)',
                                  width: '20px',
                                  height: '20px'
                                }}
                                title={`Fade Out: ${activeFadeOutBars.toFixed(2)} bars (drag to adjust)`}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setClipFadeDrag({
                                    trackId: track.id,
                                    clipId: clip.id,
                                    type: 'out',
                                    originalFadeBars: clip.fadeOutBars || 0,
                                    currentFadeBars: clip.fadeOutBars || 0,
                                    startX: e.clientX
                                  });
                                }}
                              >
                                <div className={`w-3 h-3 rounded-full border border-black shadow-md flex items-center justify-center transition-transform ${
                                  clipFadeDrag?.clipId === clip.id && clipFadeDrag?.type === 'out'
                                    ? 'bg-amber-300 scale-125 ring-2 ring-amber-400'
                                    : 'bg-amber-400 hover:scale-125 hover:bg-amber-300'
                                }`}>
                                  <div className="w-1 h-1 rounded-full bg-slate-900" />
                                </div>
                                {clipFadeDrag?.clipId === clip.id && clipFadeDrag?.type === 'out' && (
                                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-950/95 border border-amber-400/80 text-[9px] font-mono text-amber-300 font-bold whitespace-nowrap shadow-2xl pointer-events-none z-50">
                                    Fade Out: {activeFadeOutBars.toFixed(2)} bars
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Interactive Track Selection Box Highlight */}
                        {isTrackSelectionActive && (
                          <div 
                            onMouseDown={(e) => e.stopPropagation()}
                            className="absolute top-1 bottom-1 rounded-lg border-2 border-dashed flex items-center justify-between px-2.5 z-20 transition-all pointer-events-auto shadow-lg"
                            style={{
                              left: `${(selection.startBar - 1) * barWidth}px`,
                              width: `${selection.durationBars * barWidth}px`,
                              backgroundColor: `${track.color}85`,
                              borderColor: `${track.color}40`,
                              boxShadow: `0 0 20px ${track.color}44`
                            }}
                          >
                            <div className="flex items-center gap-1.5 bg-slate-950/95 px-2 py-0.5 rounded-md text-[10px] font-mono text-amber-200 border border-white/[0.15] shadow-md">
                              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                              <span className="font-semibold">
                                Bars {selection.startBar}–{selection.startBar + selection.durationBars - 1}
                              </span>
                              <span className="text-slate-400">
                                ({selection.durationBars}b • {Math.round(selection.durationBars * (4 * 60 / bpm))}s)
                              </span>
                            </div>

                            <button
                              onClick={(e) => { e.stopPropagation(); setSelection(null); }}
                              title="Deselect Region"
                              className="p-1 rounded bg-slate-950/90 text-slate-400 hover:text-rose-300 border border-white/[0.15] hover:bg-rose-950/50 transition cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                      </div>

                      {/* Inline Track End Adjust Slot (Decrease & Extend) */}
                      <div className="w-24 shrink-0 h-full border-r border-dashed border-white/[0.12] flex flex-row items-center justify-center gap-1 px-1 bg-slate-950/20 select-none">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDecreaseTimeline(16); }}
                          disabled={totalBars <= minAllowedBars}
                          title={`Decrease timeline (-16 Bars) [Min: ${minAllowedBars} bars]`}
                          className="flex-1 h-8 rounded hover:bg-rose-950/30 text-slate-500 hover:text-rose-300 disabled:opacity-20 disabled:pointer-events-none flex flex-col items-center justify-center transition cursor-pointer border border-transparent hover:border-rose-900/30 font-mono text-[9px]"
                        >
                          <Minus className="w-3 h-3 mb-0.5" />
                          <span>-16b</span>
                        </button>

                        <button
                          onClick={(e) => { e.stopPropagation(); onTotalBarsChange(totalBars + 16); }}
                          title="Extend timeline (+16 Bars)"
                          className="flex-1 h-8 rounded hover:bg-amber-950/30 text-slate-500 hover:text-amber-300 flex flex-col items-center justify-center transition cursor-pointer border border-transparent hover:border-amber-900/30 font-mono text-[9px]"
                        >
                          <Plus className="w-3 h-3 mb-0.5" />
                          <span>+16b</span>
                        </button>
                      </div>

                    </div>
                  );
                })}
        </div>

      </div>

      {/* 3. Floating Context-Aware AI Generation Card (Attached to Selection & Track Role) */}
      {selection && selectedTrackObj && (
        <div 
          className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl bg-slate-950/95 backdrop-blur-xl border border-white/[0.18] rounded-2xl shadow-2xl p-4 text-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-200"
          style={{
            boxShadow: `0 12px 40px -10px rgba(0, 0, 0, 0.8), 0 0 25px -5px ${selectedTrackObj.color}40`
          }}
        >
          {/* Card Header: Track Identity, Selection Range, Model Badge, Close */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.10]">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: selectedTrackObj.color }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-xs">{selectedTrackObj.name}</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-200 border border-amber-600/30 font-mono text-[9px] font-medium">
                    {selectedTrackObj.role === 'risers_drops' 
                      ? 'SFX & TRANSITIONS' 
                      : selectedTrackObj.name.toLowerCase().includes('mood')
                      ? 'MOOD INSTRUMENT'
                      : selectedTrackObj.name.toLowerCase().includes('vocal')
                      ? 'VOCALS'
                      : selectedTrackObj.role.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Target Range: <span className="text-amber-300 font-semibold">Bars {selection.startBar} – {selection.startBar + selection.durationBars - 1}</span> ({selection.durationBars} bars • {Math.round(selection.durationBars * (4 * 60 / bpm))}s) • Model: <span className="text-slate-300">{selectedTrackObj.model.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Quick Length Adjusters & Dismiss */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 bg-slate-900 border border-white/[0.10] rounded-lg p-0.5 text-[10px] font-mono">
                {[2, 4, 8, 16].map(len => (
                  <button
                    key={len}
                    onClick={() => setSelection({ ...selection, durationBars: len })}
                    className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                      selection.durationBars === len 
                        ? 'bg-amber-600/80 text-slate-950 font-bold' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {len}b
                  </button>
                ))}
              </div>

              <button
                onClick={() => setSelection(null)}
                title="Dismiss Selection"
                className="p-1 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-white/[0.10] transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Context-Aware Track Presets (e.g. Only SFX for Track 5, Mood Instrument for Track 1, Vocals for Track 2) */}
          <div className="py-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Select {selectedTrackObj.role === 'risers_drops' 
                  ? 'SFX & Tension' 
                  : selectedTrackObj.name.toLowerCase().includes('mood')
                  ? 'Mood Instrument'
                  : selectedTrackObj.name.toLowerCase().includes('vocal')
                  ? 'Vocal'
                  : selectedTrackObj.name.split('.')[1]?.trim() || selectedTrackObj.role} Style to Generate:
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Locked to {activeRaga.name} • 96kHz Native
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {trackPresets.map((preset) => (
                <button
                  key={preset.title}
                  onClick={() => handleGenerateForSelection(preset.title)}
                  disabled={isGeneratingSelection}
                  className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-850/90 border border-white/[0.08] hover:border-amber-500/40 text-left transition-all group/btn cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{preset.icon}</span>
                    <span className="font-semibold text-xs text-slate-200 group-hover/btn:text-amber-200 transition-colors">
                      {preset.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt Input & Big Action Generate Button */}
          <div className="pt-2 border-t border-white/[0.10] flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={
                  selectedTrackObj.role === 'risers_drops'
                    ? "Or type custom SFX: 'Ethereal sub riser with temple chime'..."
                    : selectedTrackObj.name.toLowerCase().includes('mood')
                    ? "Or type mood instrument prompt: 'Evocative sarod alap to lock the Yaman rasa'..."
                    : (selectedTrackObj.name && selectedTrackObj.name.toLowerCase().includes('vocal'))
                    ? "Or type vocal prompt: 'Sacred Sanskrit shanti patha with Vedic accents'..."
                    : `Or type prompt for ${selectedTrackObj.name.split('.')[1] || 'track'}...`
                }
                className="w-full bg-slate-900/90 border border-white/[0.12] rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGenerateForSelection();
                }}
              />
            </div>

            <button
              onClick={() => handleGenerateForSelection()}
              disabled={isGeneratingSelection}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-900/30 transition cursor-pointer disabled:opacity-50"
            >
              {isGeneratingSelection ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing ({selectedTrackObj.model})...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>
                    Generate {selectedTrackObj.role === 'risers_drops' 
                      ? 'SFX' 
                      : (selectedTrackObj.name && selectedTrackObj.name.toLowerCase().includes('mood'))
                      ? 'Mood Music'
                      : selectedTrackObj.name.toLowerCase().includes('vocal')
                      ? 'Vocals'
                      : selectedTrackObj.name.split(' ')[1] || 'Music'} ({selection.durationBars}b)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
