# 03_ROADMAP_AND_IMPLEMENTATION: Development Plan & Milestone Tracker

> **[!IMPORTANT]**
> Checkbox state below reflects **verified repository state**, not intent.
> See [[04_IMPLEMENTATION_STATUS]] for the ground-truth audit and a list of
> deliberately simulated stubs.

---

## 🎯 Implementation Phases

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               DEVELOPMENT MILESTONES                                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  PHASE 1: Interactive Web DAW Frontend (HUD, Director Wizard, Timeline)    [~85% DONE] │
│  PHASE 2: Raga, Tala & Sanskrit Ingestion Engine (22 Shrutis, Vāgdhenu)    [~55% DONE] │
│  PHASE 3: Apple Silicon M1 Max Runtime & Multi-Model Dispatcher (MLX)      [~15% DONE] │
│  PHASE 4: Audio Pipeline (Stems, Cleanup, Voice Transform)                 [ ~8% DONE] │
│  PHASE 5: Mastering, The Owl 3D Spatializer & Local FastMCP Server         [ ~5% DONE] │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 1: Interactive Web DAW Frontend (~85%)
- [x] React 19 / Vite 8 project with Tailwind CSS 4.
- [x] **Raga-Tala HUD Strip**:
  - [x] Moveable $Sa$ frequency selector (110–240 Hz vernier) with "Detect My Sa" button *(stub — returns fixed 138.59 Hz)*.
  - [x] Emotion (*Navarasa*) dropdown filter.
  - [x] Active Raga Selector (with Swara / Western-mode preview).
  - [x] Indian Tala Selector with animated rhythm beads (*Sam*, *Tali*, *Khali*).
- [x] **Director's Scene Wizard Modal** — Navarasa compass, scene scoring.
- [x] **Multi-Track Timeline & Piano Roll**:
  - [x] Bus-grouped tracks (Vocals / Acoustics / Percussion / Orchestral / Cinematic FX).
  - [x] Swara-labeled piano roll keys.
  - [ ] Forbidden-note (varjit) dimming — *not yet enforced in the roll*.
  - [ ] Continuous F0 *Meend* curve editing canvas — *not implemented*.

---

### Phase 2: Raga, Tala & Sanskrit Ingestion Engine (~55%)
- [x] `ragaEngine.ts` — 8 Ragas + 5 Talas + full 22-Shruti ratio table with cents.
- [x] `vagdhenuPhonetics.ts` — hymns, Chhandas analyzer, IPA + Udātta/Anudātta/Svarita
      generation, schwa-deletion auditor, recitation timing.
- [x] `VagdhenuLyricsDrawer.tsx` — synchronized teleprompter with per-syllable svara audition.
- [x] `ShrutiMandalaModal.tsx` — 22-Shruti circular hub with Just-vs-12-TET beating audition.
- [ ] `ragaBridge.ts` — *absent*; dual-conditioned prompt building currently lives inline
      in `aiModelData.ts` and `AIModelOrchestratorModal.tsx`.
- [ ] `gamakaData.ts` — *absent*; Meend / Andolan / Kampita / Murki / Kan-Svara not modeled.
- [ ] 10 Thaats + 72 Melakarta dictionary — *absent* (8 Ragas only).
- [ ] Local Vāgdhenu / Cowchant inference — *absent*; only the phonology layer exists.

---

### Phase 3: Apple Silicon M1 Max Runtime & Model Dispatcher (~15%)
- [x] `aiModelData.ts` — 6 model specs with quantization / VRAM / accelerator metadata.
- [x] 18 GB working-memory ceiling budgeter + residency UI *(heuristic, not real MLX accounting)*.
- [x] `AIModelOrchestratorModal.tsx` — model residency, per-track routing matrix, prompt playground.
- [ ] Native **MLX** runtime — *absent* (pure client-side SPA, no backend).
- [ ] **audio.cpp / llama.cpp** integration — *absent*.
- [ ] Model adapters (ACE Studio, YuE 2, MiniMax 3, Stable Audio 3) — *absent*; `onGenerateAIClip`
      commits a take + clip without audio inference.
- [ ] Background guide-mix bounce for context-aware overdubs — *absent*.

---

### Phase 4: Audio Separation & Voice Transformation Suite (~8%)
- [x] `stemForgeEngine.ts` — Broadcast WAV writer with real `bext` + `iXML` chunks,
      LUFS normalisation maths, stem definitions for 4/6-stem modes.
- [x] ITU-R BS.1770-style loudness telemetry in `webAudioEngine.ts`.
- [ ] **BS-Roformer / Demucs** separation — *absent*; `separateStems()` allocates
      correctly-shaped silent buffers.
- [ ] UVR Denoise & Dereverb — *absent*.
- [ ] Seed-VC / RVC Applio — *absent*.
- [ ] BasicPitch audio-to-MIDI, Web MIDI Out — *absent*.

---

### Phase 5: Mastering, The Owl 3D Spatializer & Local MCP Server (~5%)
- [ ] `spatialAudioEngine.ts` — *absent entirely*. No spherical↔cartesian conversion,
      no Ambisonics B-format, no 7.1.4 VBAP bed, no HRTF panner.
- [ ] 96 kHz / 32-bit float super-resolution render pipeline — *partial*: the export
      writer emits 32-bit float at the source buffer's rate; no resampler to 96 kHz yet.
- [ ] Mastering chain (Quick Master: Punch, Air, Drive, Ceiling) — *absent*.
- [ ] **FastMCP Server** — *absent*.
- [ ] Milestone 25: ADM BWF (`axml` / `chna`) Atmos renderer — *not started*.

---

## Related Notes
* [[04_IMPLEMENTATION_STATUS]]
* [[01_MASTER_SPECIFICATION]]
* [[02_M1_MAX_ARCHITECTURE]]

