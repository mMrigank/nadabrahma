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
* **Phase Completed:** Architectural Discovery, Musicological & Linguistic Specifications, Master Feature Synthesis (theDAW + Resonant + StemForge), M1 Max Hardware Profile, and Obsidian Second Brain Knowledge Vault Setup.
* **Next Action for Incoming AI:**
  1. Build out the frontend interactive web prototype in React 19 / Vite with Tailwind CSS.
  2. Implement the **Raga-Tala HUD Strip** (Navarasa dropdown, $Sa$ frequency dial, Tala beat beads).
  3. Implement the **Director’s Scene Wizard** modal.
  4. Implement the **Multitrack Timeline (5 Tracks)** with Web Audio API 96kHz playback.
