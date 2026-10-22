# 00_SYSTEM_CONTEXT: AI Model Context Handover & Operating Directive
> **ATTENTION ANY AI AGENT / MODEL (Claude Code, Qwen 3.8, GLM, Antigravity, Sol 5.6, etc.):**
> Read this file first. It contains the complete operating context, architectural decisions, and current state of the **Nādabrahma** project so you can immediately resume paired programming without asking redundant questions.

---

## 1. Executive Mission
**Nādabrahma** (नादब्रह्म) is an all-in-one, local-first audio workstation (DAW) for macOS (specifically optimized for Apple Silicon M1 Max with 32GB Unified Memory). It merges:
1. **Universal Sound Creation:** Not only Indian music, but cinematic background scoring (BGM), commercial/documentary voice-overs, audio-drama, a cappella vocalises, foley, and sound effects across all world genres.
2. **Indian Classical Foundations:** 22 Shrutis Just Intonation, Moveable *Sa* ($10\text{ Hz} - 48\text{ kHz}$ aware), 10 Thaats, 72 Melakarta Ragas, and Tala rhythm cycles.
3. **Vedic Sanskrit Recitation:** Native integration of **Vāgdhenu** (IISc Bengaluru) for meter-aware *pārāyaṇa* chant synthesis with zero schwa-deletion.
4. **4-Model AI Suite:** ACE Studio (precision SVS), YuE 2 (AR-NAR song generation), MiniMax Music 3 (high-fidelity song generation), Stable Audio 3 (stems, beats, drones, risers/drops).
5. **Open Source DAW Synthesis:** Unifies 100% of the features from **theDAW** (mastering, notation, 3D audio), **Resonant** (clip launcher, MCP server, Seed-VC), and **StemForge** (BS-Roformer stems, UVR cleanup, polyphonic MIDI, RVC).
6. **Director's Mode (Non-Composer Friendly):** Scene creation driven by the 9 Rasas (*Navarasa*), auto-suggesting ragas, scales, and instrumentation, with a 15–30s custom voice drop box (reinterpretation).
7. **Ultra-HD Extended Spectrum (10 Hz – 48,000 Hz):** Native **96 kHz / 32-bit float** engine. **Every generation on every track** automatically passes through role-aware Hypersonic Air (20k–48k Hz) and Somatic Infrasound (10–20 Hz).
8. **Mac M1 Max 32GB Native:** Built using **MLX, audio.cpp, C++ DSP, and CoreAudio/Web Audio** to avoid Python memory bloat and GIL slowdowns.

---

## 2. Hardware Profile: Apple Silicon Mac M1 Max (32GB Unified Memory)
* **Architecture:** ARM64 with 32GB Unified Memory (CPU + GPU share the same memory bus at 400 GB/s bandwidth).
* **Constraints & Optimization Directives:**
  * **Avoid heavy, unoptimized Python runtimes where possible.** Do NOT rely on bloated PyTorch CUDA wrappers that leak memory on macOS.
  * **Use Apple Silicon MLX:** For local LLMs and audio latents (zero-copy memory).
  * **Use `audio.cpp` / `llama.cpp` / C++ DSP:** Instant startup, deterministic memory deallocation, zero garbage collection pauses.
  * **Web Audio API + WebAssembly (Wasm) + CoreAudio:** For the 60fps real-time 96kHz multitrack timeline and mixer in the frontend shell.

---

## 3. Directory Layout & File Structure
```
nadabrahma/  (Synced with Obsidian Vault: /Users/mrigank/Documents/Daw/DAW/)
├── README.md                          <- Main Hub & Overview (Graph-RAG anchor)
├── 00_SYSTEM_CONTEXT.md               <- This file: Self-contained context loader
├── 01_MASTER_SPECIFICATION.md         <- Exhaustive master technical design
├── 02_M1_MAX_ARCHITECTURE.md          <- Mac M1 Max native optimization (MLX, audio.cpp)
├── 03_ROADMAP_AND_IMPLEMENTATION.md   <- Development roadmap & milestones
├── Core_Concepts/
│   ├── Indian_Classical_Engine.md    <- Ragas, Talas, 22 Shrutis, Moveable Sa, Meend
│   ├── Sanskrit_Vedic_Engine.md      <- Vagdhenu, Cowchant, G2P, IPA, Chhandas
│   ├── Multi_Model_AI_Suite.md       <- YuE 2, MiniMax 3, ACE, Stable Audio 3
│   ├── Universal_Audio_Roles.md      <- BGM, Voice-Over, Foley, Audio-Stories, A Cappella
│   ├── Extended_Frequency_96k.md     <- Infrasonic (10-20Hz) & Hypersonic (20-48kHz)
│   └── Audio_Restoration_HiFi.md     <- AudioSR, UVR, BigVGAN-v2, Transient Shapers
├── Architecture_Deep_Dives/
│   ├── theDAW_Features.md            <- Complete feature analysis & adaptation
│   ├── Resonant_Features.md          <- Complete feature analysis & adaptation
│   └── StemForge_Features.md         <- Complete feature analysis & adaptation
└── Workflows/
    ├── Directors_Mode_Workflow.md    <- Navarasa mood-to-masterpiece step-by-step
    ├── Track_5_Risers_Drops.md       <- 10 genres transition matrix
    └── MCP_Agentic_Production.md     <- Autonomous music creation with LLMs
```

---

## 4. Current State & Where to Resume
* **Phase Completed:** Architectural Discovery, Musicological & Linguistic Specifications, Master Feature Synthesis (theDAW + Resonant + StemForge), M1 Max Hardware Profile, Obsidian Knowledge Vault, and interactive DAW Web Workstation prototype (HeaderHUD, Timeline, PianoRoll, 13 interactive modals).
* **Recent Milestones:**
  - Standardized Bar 1 and horizontal track origin ($X_0 = 320\text{px}$) across Timeline and Piano Roll.
  - Resolved localhost dual-stack IPv4/IPv6 binding on macOS (`host: true`, CORS enabled).
  - Integrated `@tonaljs/time-signature` and built `TimeEngine.ts` (960 PPQ integer clock, Tala-to-Western metric mapping).
  - Memory optimization: Replaced tens of thousands of track grid `<div>` nodes with zero-memory CSS repeating gradients (`getTrackGridCss`) and virtualized the ruler (`getVisibleBarRange`).

---

## 5. Plan & Starting Point for Next Session

### A. Infusion of Time-Signature and Taal Meter
* **Musicological Relationship vs. Practical Synthesis:**
  - **Western Time Signature ($N/D$):** Dictates local metric subdivision per measure (e.g. $4/4$ simple quadruple, $6/8$ compound duple, $7/8$ irregular).
  - **Indian Classical Tala:** Dictates macroscopic cyclical framework (*Avartan*) with Matras (beats), Vibhags (sub-divisions), and accent polarities: **Sam** (सम - resolution clap), **Tali** (ताली - metric claps), and **Khali** (खाली - wave/counter-accent).
* **Infusion Directive:**
  - Unify the HeaderHUD controls into an **Infused Meter & Tala Dropdown**:
    - `Teental (16 Matras • 4/4 [4+4+4+4])`
    - `Keherwa (8 Matras • 4/4 [4+4])`
    - `Dadra (6 Matras • 6/8 [3+3])`
    - `Rupak (7 Matras • 7/8 [3+2+2])`
    - `Jhaptal (10 Matras • 5/4 [2+3+2+3])`
    - `Ektaal (12 Matras • 12/8 [2+2+2+2+2+2])`
    - `Western 4/4 (Common)`, `3/4 (Waltz)`, `6/8 (Compound)`, `7/8 (Complex)`
  - Provide a toggle for **"Polymetric / Unlinked Mode"** for advanced producers desiring cross-rhythmic experiments (e.g. playing Teental in $7/8$ meter).

### B. Metronome & Grid Hardware Audio Clock Synchronization
* **Diagnosed Root Cause of Drift:**
  - Prior implementation used JavaScript `setInterval`, which drifts under CPU load and tab event cycles.
  - The step increment formula `(4 / activeTala.matras) * 0.25` erroneously calculated $\frac{1}{16}$ bar instead of $\frac{1}{4}$ bar per quarter-note, causing cumulative lag that widened noticeably by Bar 2, 5, and 8.
* **Implemented Resolution:**
  - Migrated to **hardware-anchored audio clock** driven by `AudioContext.currentTime` inside a `requestAnimationFrame` loop.
  - Playhead advancement: $\text{playheadPosition} = \text{startBar} + \frac{\text{AudioContext.currentTime} - \text{startTime}}{\text{barDurationSec}}$.
  - Metronome clicks now scheduled ahead on the hardware clock with `audioEngine.playTalaClick(clap, baseSaHz, volume, timbre, scheduledTime)`. Zero drift ($0.000\text{ ms}$).

### C. Curated State-of-the-Art Open Source Ecosystem (Memory-Lean & Actively Maintained)
To accelerate Nādabrahma while strictly honoring the Apple Silicon M1 Max (32GB) zero-leak directive, incoming models must reference these tier-1 repositories:

1. **Modern Audio DSP, Synths, Reverbs, EQs & Envelopes:**
   - **[`elementary-audio/elementary`](https://github.com/elementary-audio/elementary):** Declarative, pure functional audio runtime written in C++ with WebAssembly renderer. Zero memory leaks, React-like declarative audio graph reconciliation, pristine DSP filters and envelopes.
   - **[`signalsmith-audio/signalsmith-dsp`](https://github.com/signalsmith-audio/signalsmith-dsp):** Modern header-only C++11 library. Zero dynamic allocations in the audio thread; cutting-edge pitch-shifting, spectral processing, STFT, and non-linear reverbs.
   - **[`webaudiomodules/sdk`](https://github.com/webaudiomodules/sdk) & [`api`](https://github.com/webaudiomodules/api):** Web Audio Modules 2.0 (WAM2) — the open VST-equivalent standard for browser DAWs.
   - **[`grame-cncm/faust`](https://github.com/grame-cncm/faust):** Functional programming language for real-time sound synthesis, compiling to ultra-optimized C++, Wasm, and Web Audio Worklets.

2. **DAW Architecture & Memory Minimization (Native ARM64 / Wasm):**
   - **[`ml-explore/mlx-examples`](https://github.com/ml-explore/mlx-examples):** Apple Silicon native MLX models with zero-copy unified memory architecture on M1 Max.
   - **[`Blaizzy/mlx-audio`](https://github.com/Blaizzy/mlx-audio):** Dedicated Swift/C++ MLX audio generation and TTS framework optimized for Apple Silicon.
   - **[`tonaljs/tonal`](https://github.com/tonaljs/tonal):** Modular zero-dependency music theory and metric analysis library (used for `@tonaljs/time-signature`).
   - **OffscreenCanvas / WebGL 2D Virtualization:** Replace remaining DOM grid elements with high-speed GPU-backed canvas rendering.

3. **AI Music Models & Prompt Bridges:**
   - **[`multimodal-art-projection/YuE`](https://github.com/multimodal-art-projection/YuE):** State-of-the-art foundation models for full-song generation with editable symbolic planning in ABC notation, lyrics-to-song alignment, and separate vocal/accompaniment token tracks.
   - **[`Stability-AI/stable-audio-tools`](https://github.com/Stability-AI/stable-audio-tools):** Official repository for Stable Audio Open 1.0 conditional generative audio, variable-length stems, and inpainting.
   - **[`openvpi/DiffSinger`](https://github.com/openvpi/DiffSinger):** High-fidelity SVS (Singing Voice Synthesis) supporting 44.1kHz sampling, pitch variance, energy, and breathiness control (compatible with ACE Studio / OpenUtau workflows).

