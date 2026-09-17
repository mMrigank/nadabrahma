# CHANGELOG

## 2026-09-17 — Foundational Milestone Pass (Foundation Wave)

Reconciled the repository against `handover_prompt.md`. The handover listed Milestones 1–24
as complete; audit found only the app shell + core musicology data were actually present.
This pass built out the four highest-value missing foundations.

### Added — Engine libraries
- **`app/src/lib/vagdhenuPhonetics.ts`** — Vedic phonology engine:
  - 3 authentic hymns (Gāyatrī, Asato Mā Sadgamaya, Mahā Mṛtyuñjaya) with Devanagari + IAST.
  - 4 Chhandas meters (Gāyatrī 24, Anuṣṭubh 32, Triṣṭubh 44, Jāgatī 48).
  - IAST→IPA transcription with Udātta / Anudātta / Svarita accent markers.
  - Schwa-deletion auditor and matra-based recitation timing.
- **`app/src/lib/aiModelData.ts`** — 6 model specs (YuE 2, MiniMax 3, ACE Studio 2.0,
  Stable Audio 3, Vāgdhenu, Native Soundfont) with quantization/VRAM, 18 GB working-memory
  budgeter, and a dual-conditioned Raga↔Western prompt builder.
- **`app/src/lib/stemForgeEngine.ts`** — Broadcast WAV writer producing real RIFF/WAVE with
  `bext` and `iXML` chunks (musicology payload: raga, thaat, vadi/samvadi, Sa Hz, tala,
  Chhandas, DSP tags), plus LUFS normalisation maths and 4/6-stem definitions.

### Added — UI
- **`app/src/components/ShrutiMandalaModal.tsx`** — SVG mandala of all 22 Shrutis at true
  harmonic ratios, per-raga engaged/varjit flags, live Hz recompute from $f_{Sa}$, and a
  Just-vs-12-TET stereo beating audition.
- **`app/src/components/VagdhenuLyricsDrawer.tsx`** — dual-script teleprompter with
  syllable-synced recitation, per-syllable svara audition, Chhandas analysis, schwa auditor,
  and "Send to Track 2" vocal routing.
- **`app/src/components/AIModelOrchestratorModal.tsx`** — model residency toggles with live
  memory bar, per-track routing matrix, dual-conditioned prompt playground, and an MLX
  synthesize action that commits a real take + clip to the timeline.

### Changed
- **`webAudioEngine.ts`** — added `playShrutiTone`, `playShrutiComparison` (L/R Just vs 12-TET),
  `playVedicSyllable` (accent-aware voicing), `getAnalyser`, `sampleRate`, and
  `calculateLoudnessTelemetry()` (K-weighted RMS → integrated/short-term/momentary LUFS,
  true-peak dBTP, dynamic range).
- **`App.tsx`** — three new modal states, `handleGenerateAIClip`, `handleSendVedicToTrack2`,
  `openAISuite(trackId?)`; three new floating quick-launch buttons.
- **`HeaderHUD.tsx`** — `onOpenShrutiHub` / `onOpenVagdhenu` / `onOpenAISuite` props, three
  icon launchers, and a "Open 22 Shrutis Tuning Hub" action inside the Sa popover.
- **`types/daw.ts`** — `AIModel` is now the single source of truth; `aiModelData.ts` re-exports it.

### Docs (Obsidian vault)
- Added **`04_IMPLEMENTATION_STATUS.md`** — ground-truth audit separating shipped code,
  partially-real code, and deliberately simulated stubs.
- Rewrote **`03_ROADMAP_AND_IMPLEMENTATION.md`** with honest per-phase completion
  percentages and re-checked checkboxes.
- Updated **`graph_index.json`** with nodes/edges for the new engines.

### Verification
- `npm run build` → clean (0 TypeScript errors, 1882 modules, ≈367 KB JS / 105 KB gzip).
- Dev server: all new modules transform and serve HTTP 200.
- ⚠️ **Not yet visually verified in a browser** — the new modals and the two-row timeline
  track headers still need a manual pass at 1280px and 1600px widths.

### Known simulated stubs
AI synthesis, stem separation, mic pitch detection, and the memory budgeter are honest
placeholders behind isolated functions — see [[04_IMPLEMENTATION_STATUS]] §3.
