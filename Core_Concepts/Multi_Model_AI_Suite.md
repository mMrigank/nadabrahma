# Multi-Model AI Suite: YuE 2, MiniMax 3, ACE Studio & Stable Audio 3
*The Hybrid Engine: Matching Model Architecture to Musical Purpose*

---

## 1. Architectural Matrix

| Model | Architecture | Native Input | Role in Nādabrahma |
| :--- | :--- | :--- | :--- |
| **ACE Studio / DiffSinger** | Acoustic Diffusion + BigVGAN | MIDI + Phonemes + F0 (Hz) | Track 1/2: Precision note-by-note vocal synthesis |
| **YuE 2** | AR–NAR Mixture-of-Transformers | Symbolic score tags + Lyrics | Track 1/2: Full song generation & structural planning |
| **MiniMax Music 3** | Large Transformer Foundation Model | Structured lyrics + Style tags | Track 1/3: Rapid commercial backing & dynamic hooks |
| **Stable Audio 3 / Open** | Latent Diffusion Transformer (DiT) | Prompt + BPM + Timing (sec) | Track 3/4/5: Stems, beats, drones, risers, drops |
| **Vāgdhenu** | F5-TTS Flow Matching + BigVGAN-v2 | Sanskrit text / Devanagari | Track 2: Vedic meter-aware Sanskrit chanting |

---

## 2. The Smart Model Dispatcher
Nādabrahma features a central dispatcher that translates the project state:
* **Tonic $Sa$ (Hz):** Provided to ACE as continuous F0 and to YuE/MiniMax/Stable Audio as mode tuning.
* **Raga & Western Mode:** Mapped via `ragaBridge` into dual-conditioned prompts.
* **Tala & BPM:** Synchronizes all models to the exact same millisecond beat grid.

---

## 3. Context-Aware Track Regeneration (Overdubbing)
When regenerating any track:
1. The DAW creates a silent background **Guide Mix** of all active tracks.
2. It extracts rhythmic onsets (Tabla strokes) and RMS energy dynamics.
3. It passes the guide mix as an acoustic prefix / audio-to-audio conditioning so the regenerated track locks into the ensemble's groove.

---

## Related Notes
* [[01_MASTER_SPECIFICATION]]
* [[Core_Concepts/Universal_Audio_Roles]]
* [[Workflows/Track_5_Risers_Drops]]
