# Nādabrahma Project Directives & Architectural Rules

You are working on **Nādabrahma**, an all-in-one AI audio workstation optimized for **Apple Silicon Mac M1 Max (32GB Unified Memory)**.

## Mandatory Architectural Constraints:
1. **Target Hardware:** Mac M1 Max (ARM64) with 32GB Unified Memory.
   - Always prioritize **Apple MLX**, **audio.cpp**, **llama.cpp**, and **Web Audio / Wasm** over heavy, unoptimized Python packages.
   - Maintain zero memory leaks. Keep working memory footprint under 18GB to leave 14GB+ headroom for multitasking.
2. **Audio Engine Standard:** Native **96 kHz / 32-bit float** internal buffer.
   - Every audio generation on every track must automatically pass through the 96kHz super-resolution pipeline (10 Hz – 48,000 Hz).
   - Inject Hypersonic Air (20k–48k Hz) on vocals, flutes, and strings.
   - Inject Somatic Infrasound (10–20 Hz) on drums and sub-drops.
3. **Musicology Engine:**
   - Indian Classical Ragas & Talas with moveable $Sa$ in continuous Hertz ($f_{Sa}$).
   - 22 Shrutis Just Intonation tuning.
   - Native Sanskrit Vedic recitation via Vāgdhenu with zero schwa-deletion.
   - Dual-conditioned Raga-to-Western prompts (`ragaBridge`).
4. **Master Documentation & Second Brain:**
   - Obsidian Vault: `/Users/mrigank/Documents/Daw/DAW/`
   - AI Context Handover: `00_SYSTEM_CONTEXT.md`
   - Master Spec: `01_MASTER_SPECIFICATION.md`
