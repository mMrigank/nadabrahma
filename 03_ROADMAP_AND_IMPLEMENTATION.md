# 03_ROADMAP_AND_IMPLEMENTATION: Development Plan & Milestone Tracker

---

## 🎯 Implementation Phases

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               DEVELOPMENT MILESTONES                                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  PHASE 1: Interactive Web DAW Frontend (HUD, Director Wizard, 5-Track Timeline)        │
│  PHASE 2: Raga, Tala & Sanskrit Ingestion Engine (22 Shrutis, ragaBridge, Vāgdhenu)    │
│  PHASE 3: Apple Silicon M1 Max Runtime & Multi-Model Dispatcher (MLX / audio.cpp)      │
│  PHASE 4: Audio Pipeline (BS-Roformer Stems, UVR Cleanup, Seed-VC / RVC)               │
│  PHASE 5: Full Mastering Suite, The Owl 3D Spatializer & Local FastMCP Server          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 1: Interactive Web DAW Frontend (Current Priority)
- [ ] Initialize React 19 / Vite 7 project with Tailwind CSS 4.
- [ ] Implement the **Raga-Tala HUD Strip**:
  - Moveable $Sa$ frequency selector ($10\text{ Hz} - 48\text{ kHz}$) with "Detect My Sa" mic button.
  - Time of Day (*Prahar*) and Emotion (*Navarasa*) dropdown filters.
  - Active Raga Selector (with Arohana/Avarohana preview).
  - Indian Tala Selector with animated rhythm beads (*Sam*, *Tali*, *Khali*).
- [ ] Implement the **Director’s Scene Wizard Modal**:
  - Visual Navarasa Compass.
  - 15–30s Voice Drop Box with reinterpretation and texture sliders.
  - One-click scene scoring.
- [ ] Implement the **5-Track Timeline & Piano Roll**:
  - Track 1 (Instrumental Bed), Track 2 (Vocals), Track 3 (Percussion), Track 4 (Ambient Drones), Track 5 (Risers & Drops).
  - Swara-labeled piano roll keys ($S, r, R, g, G, m, M, P, d, D, n, N$) with forbidden note dimming.
  - Continuous F0 *Meend* curve editing canvas.

---

### Phase 2: Raga, Tala & Sanskrit Ingestion Engine
- [ ] Create `ragaBridge.ts`:
  - 10 Thaats + 72 Melakarta Ragas dictionary with Western modal equivalents.
  - Just Intonation 22 Shrutis mathematical ratio engine.
- [ ] Implement Sanskrit G2P / IPA Normalizer:
  - Expands casual text / Hinglish into classical Sanskrit orthography and IPA tokens.
  - Eliminates schwa deletion.
- [ ] Embed **Vāgdhenu / Cowchant** client for authentic Vedic chanting generation.

---

### Phase 3: Apple Silicon M1 Max Runtime & Model Dispatcher
- [ ] Set up native **MLX** runtime for Apple Silicon unified memory.
- [ ] Integrate **audio.cpp / llama.cpp** for C++ low-latency inference.
- [ ] Implement model adapters:
  - **ACE Studio / DiffSinger** (Note-by-note F0 curve in Hz).
  - **YuE 2** (AR–NAR symbolic score tags + flow matching).
  - **MiniMax Music 3** (Commercial API adapter).
  - **Stable Audio 3** (Audio-to-audio stem generation & transition builder).
- [ ] Implement **Context-Aware Track Takes**:
  - Background guide mix bouncing and overdubbing alignment.

---

### Phase 4: Audio Separation & Voice Transformation Suite
- [ ] Integrate **BS-Roformer** and **Demucs** for local 2-stem, 4-stem, and 6-stem isolation.
- [ ] Integrate **UVR Denoise & Dereverb** (Clean Up suite).
- [ ] Integrate **Seed-VC** (consented voice transfer) & **RVC Applio** (14+ voicebanks).
- [ ] Integrate **BasicPitch** (polyphonic audio-to-MIDI) and **Web MIDI Out**.

---

### Phase 5: Mastering, The Owl 3D Spatializer & Local MCP Server
- [ ] Implement **AudioSR 96k Super-Resolution**:
  - Automatic Per-Track 96 kHz / 32-bit float extended spectrum (10 Hz – 48,000 Hz).
- [ ] Integrate **The Owl HRTF 3D Binaural Spatializer**.
- [ ] Implement mastering chain: Quick Master (Punch, Air, Drive, Ceiling) + LUFS normalization.
- [ ] Implement **FastMCP Server**:
  - Exposes tools (`create_track`, `set_raga`, `generate_vocal`, `mix`, `export`) to Claude Code / Antigravity.
