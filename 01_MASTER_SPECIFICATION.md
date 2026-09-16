# 01_MASTER_SPECIFICATION: Nādabrahma Universal Audio Workstation
*The Ultimate Technical Blueprint for Music, Voice, Foley, and Extended Acoustic Resonance*

---

## 1. System Vision & Architecture

**Nādabrahma** bridges three creative worlds:
1. **The Classical & Sacred World:** Pure Sanskrit recitation (*Vāgdhenu*), 22 *Shrutis* Just Intonation, microtonal *Meend*, and the 72 Melakarta / 10 Thaat Raga systems.
2. **The Global Creative Production World:** Cinematic BGM, commercial & documentary voice-overs, audio-drama, foley, and sound effects across 10+ genres (Cinematic, Sci-Fi, EDM, Pop, Metal, Country, Lo-Fi, Trap, Ambient).
3. **The Multi-Model AI Orchestration World:** Seamless dispatching across **ACE Studio**, **YuE 2**, **MiniMax Music 3**, and **Stable Audio 3**, wrapped in a local **MCP Server** for autonomous AI co-production.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              NADABRAHMA SYSTEM BUS                                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  1. PRESENTATION LAYER (Web Audio API 96k + React 19 + Canvas 60fps)                   │
│     • Ableton-Style Clip Launcher Matrix + Linear Multitrack Timeline                  │
│     • Swara Piano Roll (S, r, R, g, G...) + Continuous F0 Pitch Lane (Meend in Hz)     │
│     • Director's Scene Wizard (Navarasa Compass + 15-30s Voice Drop Box)               │
│     • Raga-Tala HUD Strip (Prahar, Rasa, Sa Hz Dial, Tala Beat Beads)                  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  2. INTELLIGENCE & DISPATCH LAYER (C++ / MLX / FastMCP)                                │
│     • Local MCP Server (revision-safe DAW control via Claude/Antigravity)              │
│     • Raga-to-Western Modal Bridge (`ragaBridge` converting Swaras to Modes/Cents)     │
│     • Context-Aware Track Regeneration Engine (Takes & Guide-Mix overdubbing)          │
│     • Native Model Adapters (ACE, YuE 2, MiniMax 3, Stable Audio 3, Vāgdhenu)         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  3. DSP & AUDIO PIPELINE LAYER (audio.cpp / Metal Performance Shaders / CoreAudio)     │
│     • Automatic Per-Track 96 kHz / 32-Bit Float Super-Resolution Engine                │
│     • Hypersonic Air Synthesizer (20 kHz – 48 kHz)                                     │
│     • Somatic Infrasound Generator (10 Hz – 20 Hz)                                     │
│     • Stem Separation (BS-Roformer & Demucs) + UVR Spectral Cleanup                    │
│     • Voice Personalization (Seed-VC & RVC) + Polyphonic MIDI (BasicPitch)             │
│     • The Owl 3D HRTF Binaural Spatializer + 25-Effect Mastering Suite                 │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The 10 Universal Track Roles

When adding a track or in Director's Mode, the workstation supports 10 distinct roles, automatically routing each to its optimal engine:

1. **Lead Vocal (Precision Note-by-Note):** Driven by **ACE Studio / DiffSinger** with exact MIDI, phoneme durations, and continuous F0 curves in Hz.
2. **Sacred Sanskrit Mantra & Vedic Shloka:** Driven by **Vāgdhenu / Cowchant** with meter-aware *pārāyaṇa* chanting and zero schwa deletion.
3. **Choral Harmony & Wordless Vocalise:** Driven by **YuE 2** or **ACE Multi-Voice** for multi-part harmonies, ethereal choral textures, and wordless aalaps.
4. **Cinematic & Commercial Voice-Over:** Specialized for documentary narration, deep trailer voices, and audio-stories with automatic BGM sidechain ducking.
5. **Acoustic Drone (*Adhara Shadja*):** Native Tanpura / Shruti Box generator tuned to exact continuous $f_{Sa}$ with natural acoustic harmonics.
6. **Solo Melodic Instrument:** Sitar, Bansuri, Sarod, Veena, Cello, Violin with real-time $\pm 7$ semitone *Meend* pitch-bend support.
7. **Indian Percussion & Groove (*Tala*):** Tabla, Mridangam, Pakhawaj with multi-sampled *Bols* (`Dha`, `Dhin`, `Ge`, `Na`) locked to Teental, Rupak, or Keherwa.
8. **Modern World Beats & Urban Rhythm:** 808 Trap bass, Lo-Fi hip-hop drums, Psytrance rolling basslines via **Stable Audio 3**.
9. **Cinematic Pads & Ambient Soundscapes:** Lush orchestral washes, nature atmospheres (rain, wind, thunder), and meditative solfeggio beds (432Hz/528Hz).
10. **Risers, Drops & Foley FX:** 10 genres of transitions (Cinematic, Sci-Fi, Vedic, EDM, Metal, Pop, Country, Trap, Dark Horror, Lo-Fi) harmonically tuned to $Sa$ with pre-drop silence gaps.

---

## 3. The Indian Classical & Frequency Bridge

* **Moveable Tonic (*Sa*):** Continuously adjustable in Hertz ($142.5\text{ Hz}$, $215.0\text{ Hz}$, etc.) with a built-in **"Detect My Sa"** mic pitch-tracker.
* **The 22 Shrutis Just Intonation Engine:** Applies pure acoustic harmonic ratios:
  $$\text{Sa}=1/1,\quad \text{re}_1=16/15,\quad \text{Re}_2=9/8,\quad \text{ga}_1=6/5,\quad \text{Ga}_3=5/4,\quad \text{ma}_1=4/3,\quad \text{Ma}_2=45/32,\quad \text{Pa}=3/2\dots$$
* **Raga-to-Western Modal Bridge (`ragaBridge`):**
  * Automatically maps Indian Ragas and Thaats to Western Modes (Bilawal $\rightarrow$ Ionian, Kalyan $\rightarrow$ Lydian, Kafi $\rightarrow$ Dorian, Bhairavi $\rightarrow$ Phrygian, Bhairav $\rightarrow$ Double Harmonic Major).
  * Injects exact scale formulas and mode tags into AI prompts to prevent tonal hallucination.
* **Tala Rhythm Clock:**
  * Slices the timeline grid into authentic metric divisions: **Teental (16)**, **Rupak (7)**, **Jhaptal (10)**, **Adi Tala (8)**, **Keherwa (8)**, **Dadra (6)**.
  * Real-time visual beat beads: *Sam* (🔴), *Tali* (🟡), and *Khali* (⚪).

---

## 4. Automatic Per-Track 96k Ultra-HD Extended Spectrum (10 Hz – 48 kHz)

Every generation on every track natively passes through:
1. **Resampling to 96 kHz / 32-bit Float:** Extends the Nyquist frequency ceiling to $48,000\text{ Hz}$.
2. **Hypersonic Air Injection (20 kHz – 48 kHz):** Synthesizes natural ultrasonic overtones for vocals, sitars, flutes, and strings, eliminating digital brickwall harshness.
3. **Somatic Infrasound Injection (10 Hz – 20 Hz):** Adds physical chest-thumping presence to the Tabla *Bayan*, Pakhawaj, and sub-drops.
4. **Spectral De-Fizzing & De-Artifacting (UVR):** Strips out diffusion noise and codec grain.
5. **Transient Punch Recovery:** Restores the first 10ms of acoustic attack on drums and plucks.

---

## 5. Director's Mode & Workflow

1. **Step 1:** Select from the **9 Rasas** (Shringara, Karuna, Veera, Raudra, Adbhuta, Shanta, Hasya, Bhayanaka, Bibhatsa).
2. **Step 2:** System auto-suggests Raga (Indian + Western mode), matching instruments, Tala, BPM, and time of day (*Prahar*).
3. **Step 3 (Track 1):** Generates a strictly instrumental foundation via YuE 2 / Stable Audio 3.
4. **Step 4 (Track 2):** User drops a 15–30s vocal sample into the **Custom Voice Drop Box** (or picks a preset). The model learns timbre and reinterprets it through the raga, locked in rhythm and harmony to Track 1.
5. **Step 5 (Context-Aware Regeneration):** Any track can be regenerated with `[ Listen to Active Mix ]`, creating non-destructive "Takes" that groove with the ensemble.
6. **Step 6 (Track 5 Risers & Drops):** Seamlessly drops bar-quantized transitions tuned to $Sa$.
