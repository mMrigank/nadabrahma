# Workflows: Local MCP Server & Agentic Music Production
*How Claude Code, Antigravity, Codex & External AI Models Act as In-App Music Producers*

---

## 1. What is the Local MCP Server?
Borrowed from the breakthrough architecture in **Resonant**, **Nādabrahma** includes a local **Model Context Protocol (MCP)** server.

Instead of only clicking buttons in a UI, you can connect your favorite AI assistant (such as **Claude Code**, **Antigravity**, or **Codex**) through MCP. The assistant can understand the DAW's state and execute revision-safe music operations on your project.

---

## 2. Tools Exposed Over MCP

| MCP Tool Name | Description | Arguments |
| :--- | :--- | :--- |
| `get_capabilities` | Returns all available DAW features, models, and ragas. | None |
| `set_raga` | Sets project $Sa$ frequency, Raga, and Tala. | `{ sa_hz: 142.5, raga: "Yaman", tala: "Teental" }` |
| `add_track` | Creates a new track with a specific role and model. | `{ role: "lead_vocal", model: "ace_studio" }` |
| `generate_clip` | Generates audio for a track using prompts or lyrics. | `{ track_id: 1, prompt: "...", lyrics: "..." }` |
| `regenerate_track` | Performs context-aware overdubbing listening to active mix. | `{ track_id: 1, context: "full_mix" }` |
| `apply_mastering` | Sets mastering preset, LUFS target, and The Owl 3D. | `{ preset: "cinematic", lufs: -14, owl_3d: true }` |
| `export_project` | Bounces the project to 96kHz / 32-bit WAV or FLAC. | `{ format: "wav_96k", stems: true }` |

---

## 3. Example Natural Language Prompt via Terminal

With Claude Code or Antigravity connected to Nādabrahma via MCP:

> **You type:**
> *"Set up a cinematic scene in Raga Hansadhwani at 142.5 Hz. Generate a gentle instrumental flute and sitar bed on Track 1, then create a wordless vocalise on Track 2 that listens to Track 1. On Track 5, add a 4-bar sci-fi warp riser that drops on Bar 17. Master the output to -14 LUFS with 3D spatialization."*

The AI assistant calls the MCP tools sequentially, executes the generation, aligns the stems, and leaves you with an editable, playing session!
