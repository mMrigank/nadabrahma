# Nādabrahma + SoundCraft Integration Walkthrough

We have successfully integrated **SoundCraft** (`storytold/soundcraft`) into Nādabrahma, establishing a single high-performance native DAW application for Apple Silicon M1 Max.

---

## 1. Accomplishments & Architectural Milestones

### 🦀 Upgraded Rust Environment
- Upgraded the host toolchain via Homebrew to **Rust 1.99.0** / **Cargo 1.99.0**.
- Fully resolved all Rust 2024 edition requirements and modern `egui 0.36` / `craft-ui` crate dependencies.

### 🎨 Theme & Palette Harmonization
- Updated SoundCraft's native studio theme in [`theme.rs`](file:///Users/mrigank/.gemini/antigravity-ide/scratch/nadabrahma/soundcraft/crates/ui-egui/src/theme.rs) to match Nādabrahma's spiritual dark palette:
  - **Saffron Accent**: `#EB8C28` (`Color32::from_rgb(235, 140, 40)`)
  - **Golden Swara Clock Counter**: `#F5AF2D` (`Color32::from_rgb(245, 175, 45)`)
  - **Warm Amber Selection Glow**: `Color32::from_rgba_premultiplied(90, 65, 30, 100)`

### 🕉️ Nādabrahma Musicology & Data Model
- Created [`nadabrahma.rs`](file:///Users/mrigank/.gemini/antigravity-ide/scratch/nadabrahma/soundcraft/crates/model/src/nadabrahma.rs) in `crates/model`:
  - **9 Rasas** (Shringara, Hasya, Karuna, Raudra, Veera, Bhayanaka, Bibhatsa, Adbhuta, Shanta).
  - **10 Thaats & Ragas** (Yaman, Bhairav, Bhairavi, Darbari, Malkauns, Shivaranjani, etc.) with automatic Western modal scale translation (RagaBridge).
  - **Moveable Sa ($f_{Sa}$)** in continuous Hertz with preset buttons (Om 136.1 Hz, C# 138.6 Hz, D 146.8 Hz, Middle C 261.6 Hz).
  - **22 Shrutis Just Intonation** mathematical ratios and cents calculations.
  - **Tala Rhythm Metric cycles** (Teental 16, Rupak 7, Jhaptal 10, Keherwa 8, Dadra 6, Ektaal 12, Chautal 12).
  - **Indian Instrument Taxonomy** (Bansuri, Sitar, Sarod, Veena, Santoor, Tanpura, Tabla, Pakhawaj, Mridangam, Vedic Sanskrit Shloka).
  - **Engine Selector**: YuE 2, Stable Audio 3, MiniMax Music 3, ACE Studio.

### 🎛️ Dockable Right-Hand "Director & Raga HUD"
- Implemented `director_scene_scoring` in [`panels.rs`](file:///Users/mrigank/.gemini/antigravity-ide/scratch/nadabrahma/soundcraft/crates/ui-egui/src/panels.rs) and registered `Panel::Director` in [`docking.rs`](file:///Users/mrigank/.gemini/antigravity-ide/scratch/nadabrahma/soundcraft/crates/ui-egui/src/docking.rs).
- By default, projects start clean (0 tracks) with the Director sidebar docked comfortably on the right side of the canvas.

### 🎻 Per-Track Indian Instrument Dropdown & Overcoming AI Bias
- Updated `Track` struct with `indian_instrument: Option<String>` in [`track.rs`](file:///Users/mrigank/.gemini/antigravity-ide/scratch/nadabrahma/soundcraft/crates/model/src/track.rs).
- Added an **Indian Instrument Dropdown** and quick **✨ Regenerate** button directly on the track header in [`edit_window.rs`](file:///Users/mrigank/.gemini/antigravity-ide/scratch/nadabrahma/soundcraft/crates/ui-egui/src/edit_window.rs).
- When generating or re-scoring an isolated stem, Nādabrahma injects authentic acoustic priors (stroke articulations, *meend*, *gamaka*, *jawari* resonance) to counteract generic Western MIDI bias.

### ⚙️ Command Engine & Smart Stem Dispatch
- Created [`cmd/nadabrahma.rs`](file:///Users/mrigank/.gemini/antigravity-ide/scratch/nadabrahma/soundcraft/crates/engine/src/cmd/nadabrahma.rs):
  - `nadabrahma.director_score`
  - `nadabrahma.set_instrument`
  - `nadabrahma.regenerate_track`
  - `nadabrahma.set_sa_tuning`
- Generates 5 discrete smart stem tracks automatically upon scoring:
  1. *Lead Melody (Bansuri / Sitar)*
  2. *Rhythm & Tala (Tabla / Percussion)*
  3. *Acoustic Drone (Tanpura Pa-Sa)*
  4. *Vedic Chant & Vocals*
  5. *Hypersonic & Sub Atmosphere*

### 🤖 Local Python/MLX Daemon
- Created [`backend/nad_daemon.py`](file:///Users/mrigank/.gemini/antigravity-ide/scratch/nadabrahma/backend/nad_daemon.py) handling RagaBridge expansion and local model dispatch for YuE 2, Stable Audio 3, MiniMax 3, and ACE Studio (`~/.nad/models/`).

### 📡 Model Context Protocol (MCP) for Claude
- Extended [`mcp.rs`](file:///Users/mrigank/.gemini/antigravity-ide/scratch/nadabrahma/soundcraft/crates/automation/src/mcp.rs) with native tools:
  - `score_scene`: Score scenes with prompt, Raga, Rasa, Sa Hz, Tala, BPM, and engine.
  - `set_track_instrument`: Assign specific Indian instruments to tracks.
  - `regenerate_stem`: Re-score any track using its acoustic prior.

---

## 2. Verification Results

### CLI Verification Command:
```bash
cargo run -p soundcraft-cli -- run \
  --cmd 'nadabrahma.director_score={"prompt":"Dawn meditation over the Himalayas","raga":"Bhairav","sa_hz":136.1,"bpm":72.0}' \
  --inspect
```

### Verified Output:
- **Status**: `ok` (Action: `director_scene_scheduled`, 5 stem tracks created).
- **Tempo**: Synchronized to 72.0 BPM.
- **Tracks**:
  - `1`: Lead Melody (Bansuri / Sitar)
  - `2`: Rhythm & Tala (Tabla / Percussion)
  - `3`: Acoustic Drone (Tanpura Pa-Sa)
  - `4`: Vedic Chant & Vocals)
  - `5`: Hypersonic & Sub Atmosphere
- **Undo History**: Registered as `"Director Scene Scoring"`.

---

## 3. How to Launch and Use

### Launching the Native SoundCraft GUI Application:
```bash
cd /Users/mrigank/.gemini/antigravity-ide/scratch/nadabrahma/soundcraft
cargo run -p soundcraft
```

### Starting the Local AI Inference Daemon:
```bash
python3 /Users/mrigank/.gemini/antigravity-ide/scratch/nadabrahma/backend/nad_daemon.py 8765
```

### Connecting Claude Desktop via MCP:
Add to your Claude Desktop config (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "nadabrahma": {
      "command": "/Users/mrigank/.gemini/antigravity-ide/scratch/nadabrahma/soundcraft/target/debug/soundcraft-cli",
      "args": ["mcp"]
    }
  }
}
```
