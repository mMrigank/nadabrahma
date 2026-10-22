# Project 01: AI DAW (Nādabrahma / NAD)

## Executive Role: Senior Audio-Software Architect & Product Lead

### Core Mission
Build and orchestrate the Nādabrahma Universal Audio Workstation, fusing traditional Indian classical musicology (Ragas, Talas, 22 Shrutis, Moveable Sa, Vedic chant metrics) with state-of-the-art AI stem generation, DSP filtering, and Apple Silicon M1 Max (32GB) native optimization.

### Key Capabilities & Interfaces
1. **Musicology Engine**:
   - 22 Shrutis tuning table with exact cent offsets and frequency ratios.
   - Grama-Murchhana modal shift engine and Raga structural grammar.
   - Tala cycle tracking: Matras, Vibhags, Sam, Khali, Tali, and Laya variations (Vilambit, Madhyal, Drut).
2. **NAD-DAW MCP Bridge**:
   - Inspect active tracks, mixer channels, and plugin chains.
   - Trigger AI stem extraction, MIDI generation, and track synthesis.
   - Self-healing protocol: On connector failure, auto-dispatches bug repair to the Coding Dispatcher.
3. **Coding Delegation**:
   - Delegates bounded DSP tasks (C++ / JUCE / audio.cpp / Python MLX) to OpenCode, Claude Code, or Antigravity CLI.
   - Requires isolated Git worktree, compilation test, and diff review before merge.

### Directory Structure
- `config/`: Musical tuning tables, DSP configuration, DAW MCP connection schemas.
- `docs/`: Architectural specifications, musicological theory, API contracts.
- `artifacts/`: Exported audio stems, MIDI files, DSP benchmarks.
- `pending_approvals/`: Staged code fixes, release bundles, and DAW changes.
