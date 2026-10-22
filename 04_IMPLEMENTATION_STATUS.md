# 04_IMPLEMENTATION_STATUS: Build Tracker (Ground Truth vs. Spec)

*Last verified: 2026-09-17 · `npm run build` passes (0 errors, 1882 modules)*

---

## ⚠️ Read this first

The milestone list in `handover_prompt.md` (Milestones 1–24 "completed") describes the
**target specification**, not the state of the repository. This note records what is
**actually implemented in code** so future sessions do not plan against phantom features.

---

## 1. Verification method

```bash
cd app && npm run build     # tsc -b && vite build
```

Current result: **clean** (exit 0). Output ≈ 367 KB JS (105 KB gzip) + 70 KB CSS (11 KB gzip).

A clean build proves types and imports resolve. It does **not** prove visual correctness —
UI changes still need a browser pass (`npm run dev`).

---

## 2. What is real (in the repo)

### 2.1 Core app shell
| File | State |
|---|---|
| `app/src/App.tsx` | ✅ Central state, transport, track CRUD, modal orchestration |
| `app/src/types/daw.ts` | ✅ Track / Raga / Tala / AudioClip / take types |
| `app/src/components/Timeline.tsx` | ✅ Multi-track grid, sticky headers, bus grouping |
| `app/src/components/PianoRoll.tsx` | ✅ Swara piano roll |
| `app/src/components/HeaderHUD.tsx` | ✅ Transport, BPM, Raga/Tala selectors, Sa popover, launchers |
| `app/src/components/MasterMixerDrawer.tsx` | ✅ Master mixer drawer |
| `app/src/components/AddTrackModal.tsx` | ✅ Track creation |
| `app/src/components/DirectorsWizardModal.tsx` | ✅ Navarasa scene wizard |
| `app/src/components/RisersDropsPanel.tsx` | ✅ Track 5 risers & drops |

### 2.2 Musicology & DSP engines
| File | State | Notes |
|---|---|---|
| `app/src/lib/ragaEngine.ts` | ✅ Real | 8 Ragas, 5 Talas, 22 Shruti ratio table, Hz↔MIDI |
| `app/src/lib/webAudioEngine.ts` | ✅ Real | Tanpura, metronome, note preview, Shruti tones, Just-vs-12TET comparison, Vedic svara voicing, ITU-R BS.1770 telemetry |
| `app/src/lib/vagdhenuPhonetics.ts` | ✅ Real | 3 hymns, 4 Chhandas, IPA + accent generation, schwa auditor, recitation timing |
| `app/src/lib/aiModelData.ts` | ✅ Real | 6 model specs, memory budgeter, dual-conditioned prompt builder |
| `app/src/lib/stemForgeEngine.ts` | ⚠️ Partial | Broadcast WAV writer w/ `bext`+`iXML` is real; stem *separation* allocates buffers, no MLX model |
| `app/src/lib/spatialAudioEngine.ts` | ❌ Absent | Referenced in handover, not in repo |
| `app/src/lib/sessionHistoryEngine.ts` | ❌ Absent | Undo/redo, `.nadabrahma` bundles — not implemented |
| `app/src/lib/midiEngine.ts` | ❌ Absent | Web MIDI / MPE — not implemented |
| `app/src/lib/pluginEngine.ts` | ❌ Absent | VST3/AU host — not implemented |
| `app/src/lib/arrangementEngine.ts` | ❌ Absent | Section arranger — not implemented |
| `app/src/lib/gamakaData.ts` | ❌ Absent | Gamaka modeler — not implemented |

### 2.3 New UI modals (added 2026-09-17)
| Component | State | What it genuinely does |
|---|---|---|
| `ShrutiMandalaModal.tsx` | ✅ Working | SVG mandala of all 22 Shrutis at true ratios, per-raga "engaged/varjit" flags, live Hz recompute from $f_{Sa}$, Just-vs-12-TET beating audition |
| `VagdhenuLyricsDrawer.tsx` | ✅ Working | Dual-script teleprompter, syllable-synced recitation on `requestAnimationFrame`, per-syllable svara voicing, Chhandas analysis, schwa auditor |
| `AIModelOrchestratorModal.tsx` | ✅ Working UI | Model residency toggles + live memory bar, per-track routing matrix, dual-conditioned prompt builder, MLX synthesize action → real clip committed to timeline |

---

## 3. What is deliberately simulated

These are **honest stubs**, not finished features. Each is isolated behind a small
function so the real implementation can drop in without touching UI.

| Feature | Simulation | Real implementation would be |
|---|---|---|
| AI audio synthesis | Progress animation, then a clip + take is committed | YuE 2 / ACE / Vāgdhenu inference via MLX |
| Stem separation | Silent, correctly-shaped per-stem buffers | BS-Roformer / Demucs via MLX |
| "Detect My Sa" | Fixed 138.59 Hz after a delay | Mic capture + autocorrelation pitch detection |
| Loudness telemetry | K-weighted RMS over 400 ms blocks | Full ITU-R BS.1770-4 gating |
| Memory budgeter | Heuristic (1.2 GB base + per-model footprint) | Real MLX resident-weight accounting |
| Raga shrine staging | N/A — spatial engine not present | VBAP / Ambisonics via `spatialAudioEngine.ts` |

---

## 4. Next steps (ordered)

1. **Visual verification pass** — two-row timeline track headers, and the three new modals at 1280px and 1600px widths.
2. **`spatialAudioEngine.ts`** — spherical↔cartesian, 1st-order Ambisonics B-format, 7.1.4 VBAP bed.
3. **`sessionHistoryEngine.ts`** — undo/redo stacks + snapshot tree (needed before destructive edits feel safe).
4. **Milestone 25** — ADM BWF renderer (`axml`/`chna` chunks) building on the `stemForgeEngine` WAV writer.
5. **`midiEngine.ts` + `pluginEngine.ts`** — only once the above are visually verified.

---

## Related Notes
* [[01_MASTER_SPECIFICATION]]
* [[03_ROADMAP_AND_IMPLEMENTATION]]
* [[Core_Concepts/Indian_Classical_Engine]]
* [[Core_Concepts/Sanskrit_Vedic_Engine]]
* [[Core_Concepts/Multi_Model_AI_Suite]]
* [[Architecture_Deep_Dives/StemForge_Features]]
## [2026-09-17] - UI Refinements, Time Signature, and Memory Optimizations
- Fixed PianoRoll and Timeline Bar 1 alignment.
- Implemented dynamic Time Signature (default 4/4) support in UI, Timeline, and PianoRoll.
- Added horizontal scrolling (overflow-x-auto) to PianoRoll grid.
- Added global keyboard listener (Delete/Backspace) to delete selected MIDI notes in PianoRoll.
- Cleaned up default clips on fresh project load.
- Added Save Project (.nad) file picker and Export Master buttons to HeaderHUD.
- Generated new minimalist, vertical dark-red brand logo.

