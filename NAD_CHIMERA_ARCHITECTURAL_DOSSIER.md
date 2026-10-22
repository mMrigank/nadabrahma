# Nādabrahma (NAD) DAW: Master Architectural Dossier & Implementation Blueprint
*A Unified AI Audio Workstation for Indian Classical Music, Vedic Sanskrit Chanting, and Cinematic Sound Production on Apple Silicon M1 Max*

---

## Executive Summary

**Nādabrahma** (नादब्रह्म) is a local-first, high-performance Digital Audio Workstation engineered specifically for **Apple Silicon Mac M1 Max (32GB Unified Memory)**. It bridges the gap between deep ancient musicology—Indian Classical Ragas, Talas, 22 Shrutis Just Intonation, continuous Moveable $Sa$ ($f_{Sa}$ in Hz), and Sanskrit Vedic recitation (*Vāgdhenu*)—and state-of-the-art generative audio AI models (**YuE 2**, **MiniMax 3**, **ACE Studio / DiffSinger**, **Stable Audio 3**, **Demucs v4 / BS-Roformer**).

Operating on a native **96 kHz / 32-bit float internal audio engine**, Nādabrahma introduces the **CHIMERA Orchestration Engine**, a mathematical and DSP pipeline that resolves the fundamental challenge of multi-model generative music: harmonizing, pitch-shifting, and phase-aligning heterogeneous AI stems generated at disparate tempos, keys, and acoustic textures into a cohesive, production-grade master.

---

## 1. Research & Knowledge Acquisition

### 1.1 Indian Classical Musicology & Microtonal Mechanics

#### A. Moveable Sa ($Adhara\ Shadja$) in Continuous Hertz
In Indian Classical music, pitch is not fixed to Western $A_4 = 440\text{ Hz}$ or twelve-tone equal temperament (12-TET). Instead, all swaras derive their acoustic and emotional identity from the tonic frequency $f_{Sa}$ ($Adhara\ Shadja$), continuously selectable across the human audible spectrum (standard range: $100\text{ Hz} - 320\text{ Hz}$, typically $C_3 \approx 130.81\text{ Hz}$ for male vocalists to $G_3 \approx 196.00\text{ Hz}$ for female vocalists).

Every swara frequency $f_x$ is strictly computed via acoustic ratios:
$$f_x = f_{Sa} \times R_x$$
where $R_x \in \mathbb{Q}^+$ represents the just intonation harmonic ratio.

#### B. The 22 Shrutis Just Intonation Matrix
Nādabrahma discards 12-TET approximations in favor of the authentic 22 Shrutis derived from the cycles of Fifths (3:2) and Thirds (5:4). The 22 natural ratios, cents deviations, and harmonic relationships are encoded as follows:

| Index | Shruti Name | Swara Abbr. | Just Ratio ($R_x$) | Ratio (Dec) | Cents (JI) | 12-TET Cents | Delta (Cents) | Harmonic Source |
|---|---|---|---|---|---|---|---|---|
| 0 | Kṣamā / Shadja | **S** | $1/1$ | 1.0000 | 0.00 | 0 | 0.00 | Tonic Base |
| 1 | Tīvrā | **r₁** | $256/243$ | 1.0535 | 90.22 | 100 | -9.78 | Pythagorean Minor 2nd |
| 2 | Kumudvatī | **r₂** | $16/15$ | 1.0667 | 111.73 | 100 | +11.73 | Diatonic Semitone |
| 3 | Mandā | **R₁** | $10/9$ | 1.1111 | 182.40 | 200 | -17.60 | Minor Whole Tone |
| 4 | Chhandovatī | **R₂** | $9/8$ | 1.1250 | 203.91 | 200 | +3.91 | Major Whole Tone |
| 5 | Dayāvatī | **g₁** | $32/27$ | 1.1852 | 294.13 | 300 | -5.87 | Pythagorean Minor 3rd |
| 6 | Rañjanī | **g₂** | $6/5$ | 1.2000 | 315.64 | 300 | +15.64 | Pure Minor Third |
| 7 | Ratikā | **G₁** | $5/4$ | 1.2500 | 386.31 | 400 | -13.69 | Pure Major Third |
| 8 | Raudrī | **G₂** | $81/64$ | 1.2656 | 407.82 | 400 | +7.82 | Pythagorean Major 3rd |
| 9 | Krodhā | **m₁** | $4/3$ | 1.3333 | 498.04 | 500 | -1.96 | Pure Fourth (Shuddha Ma) |
| 10 | Vajrikā | **m₂** | $27/20$ | 1.3500 | 519.55 | 500 | +19.55 | Acute Fourth |
| 11 | Prasāriṇī | **M₁** | $45/32$ | 1.4063 | 590.22 | 600 | -9.78 | Augmented 4th (Tivra Ma) |
| 12 | Prīti | **M₂** | $729/512$ | 1.4238 | 611.73 | 600 | +11.73 | Pythagorean Tritone |
| 13 | Mārjanī | **P** | $3/2$ | 1.5000 | 701.96 | 700 | +1.96 | Pure Fifth (Pancham) |
| 14 | Kṣiti | **d₁** | $128/81$ | 1.5802 | 792.18 | 800 | -7.82 | Pythagorean Minor 6th |
| 15 | Raktā | **d₂** | $8/5$ | 1.6000 | 813.69 | 800 | +13.69 | Pure Minor Sixth |
| 16 | Sandīpinī | **D₁** | $5/3$ | 1.6667 | 884.36 | 900 | -15.64 | Pure Major Sixth |
| 17 | Ālāpinī | **D₂** | $27/16$ | 1.6875 | 905.87 | 900 | +5.87 | Pythagorean Major 6th |
| 18 | Madantī | **n₁** | $16/9$ | 1.7778 | 996.09 | 1000 | -3.91 | Minor Seventh |
| 19 | Rohiṇī | **n₂** | $9/5$ | 1.8000 | 1017.60 | 1000 | +17.60 | Just Minor Seventh |
| 20 | Ramyā | **N₁** | $15/8$ | 1.8750 | 1088.27 | 1100 | -11.73 | Pure Major Seventh |
| 21 | Ugrā | **N₂** | $243/128$ | 1.8984 | 1109.78 | 1100 | +9.78 | Pythagorean Major 7th |

#### C. Gamaka & Meend Spline Synthesis
In Indian classical music, swaras are never isolated points; they are melodic paths. The workstation formalizes the **15 classical Gamakas** (Kampita, Sphurita, Tiripa, Nokku, Odukkal, Vali, Meend, etc.) using piecewise cubic Hermite splines ($\mathcal{C}^1$ continuous) directly over frequency in Hertz rather than MIDI semitones:
$$f(t) = h_{00}(u)f_k + h_{10}(u)(t_{k+1}-t_k)m_k + h_{01}(u)f_{k+1} + h_{11}(u)(t_{k+1}-t_k)m_{k+1}$$
where $u = \frac{t - t_k}{t_{k+1} - t_k}$, with boundary tangent slopes $m_k$ defining the oscillatory oscillation (*Andolan*) speed or glide velocity (*Meend*).

#### D. Tala Rhythm Architecture & Metric Subdivisions
Talas operate cyclically through *Avartan* (complete cycles). The metric structure is governed by:
- **Matras:** The fundamental unit beat.
- **Vibhags (Angas):** Metric groupings (e.g. Teental: 4+4+4+4; Rupak: 3+2+2; Jhaptal: 2+3+2+3).
- **Polarities:**
  - **Sam (सम):** The first beat, apex of dynamic resolution, Clap (ताली).
  - **Tali (ताली):** Metric subdivisions accented with claps.
  - **Khali (खाली):** Unstressed wave (counter-accent), indicating rhythmic asymmetry.

---

### 1.2 Native Sanskrit Vedic Recitation & Hindi Vocal Synthesis (Vāgdhenu)

#### A. The Acoustic Challenges of Vedic Chanting
Standard text-to-speech (TTS) and singing voice models fail catastrophically on Vedic Sanskrit due to:
1. **Schwa-Deletion Errors:** Modern Indo-Aryan languages (Hindi, Marathi) delete implicit short 'a' vowels at word boundaries (e.g., *Rāma* becomes *Rām*). In Vedic Sanskrit, every syllable must preserve its intact vocalic nucleus; deleting a schwa corrupts the Vedic meter (*Chhandas*) and alters meaning.
2. **Vedic Pitch Accents (*Svara*):** Vedic recitation is strictly tonal, governed by three accents:
   - **Udātta (उदात्त):** High/raised pitch accent.
   - **Anudātta (अनुदात्त):** Low/grave pitch accent, marked with a horizontal line below ($\underline{\text{X}}$).
   - **Svarita (स्वरित):** Falling/circumflex pitch accent, marked with a vertical stroke above ($\acute{\text{X}}$).
3. **Sandhi (Phonetic Euphony):** Syllable fusion across word boundaries requires exact acoustic assimilation rules.

#### B. The Vāgdhenu Architecture (IISc Bengaluru Formulation)
Nādabrahma integrates the **Vāgdhenu / Cowchant** engine, designed with:
1. **Rule-Based Vedic G2P Normalizer:**
   - Deconstructs Devanagari and IAST into International Phonetic Alphabet (IPA) tokens with explicit vowel duration flags ($1\text{ matra} = \text{Hrasva} \approx 180\text{ ms}$, $2\text{ matras} = \text{Dīrgha} \approx 360\text{ ms}$, $3\text{ matras} = \text{Pluta} \approx 540\text{ ms}$).
   - Strict schwa-preservation rules enforced at phonological compilation time.
2. **Acoustic Model (Flow Matching / Non-Attentive DiT):**
   - Synthesizes mel-spectrograms conditioned on:
     - Phoneme sequence with Vedic accent tags.
     - Moveable $f_{Sa}$ tonic reference.
     - Voice timbre conditioning (15–30s custom voice clone embeddings).
3. **Neural Vocoder (96kHz BigVGAN-v2 / PeriodicWave):**
   - Direct generation of 96 kHz / 32-bit float audio waveforms with zero phase distortion and natural glottal pulses.

---

### 1.3 State-of-the-Art AI Generative Suite & Apple Silicon M1 Max Optimization

#### A. Model Matrix & Dispatch Architecture

| Model | Domain / Task | Input Representation | Native Inference Engine | M1 Max Unified RAM Allocation |
|---|---|---|---|---|
| **YuE 2** | Full Instrumental Bed / Song Foundation | ABC Notation + Symbolic Tags + Prompts | MLX / ExLlama-MLX (4-bit/8-bit) | 9.5 GB |
| **MiniMax Music 3** | High-Fidelity Vocals & Stylized Song Bed | Structured Lyrics + Genre Conditioners | High-Speed Async HTTP / Local C++ Cache | 0.8 GB (Buffers) |
| **ACE Studio / DiffSinger** | Microtonal Lead Vocal & Aalap | MusicXML / MIDI + Continuous F0 (Hz) + Phonemes | `audio.cpp` / LibTorch C++ Metal | 3.2 GB |
| **Stable Audio 3** | Stems, World Percussion, Risers, Ambient Drones | Audio Prompt + Duration + Latent Inpainting | MLX Diffusion Transformer (DiT) | 4.8 GB |
| **Demucs v4 / BS-Roformer** | Stem Separation & Isolation | 96kHz Audio Buffer | Metal Performance Shaders (MPS) C++ | 2.4 GB |
| **AudioSR 96k / HiFi-GAN** | 96kHz Extended Super-Resolution | Audio Buffer (10Hz - 24kHz) | MLX Metal Pipeline | 1.6 GB |

#### B. Apple Silicon M1 Max (32GB) Architectural Guarantees
- **Unified Memory Architecture (UMA):** 400 GB/s bandwidth shared seamlessly between 10-core CPU and 32-core GPU. Zero CPU-to-GPU copy overhead.
- **Strict 18 GB Ceiling:** Peak total runtime memory footprint of all loaded models and active audio buffers is capped at $18\text{ GB}$, guaranteeing $14+\text{ GB}$ of headroom for macOS windowing, system processes, and browser timeline rendering.
- **Go Broker Memory Guard:** The Go backend daemon (`localhost:9090`) actively queries Darwin `host_statistics64` and terminates or unloads inactive models via dynamic LRU eviction before swapping occurs.

---

## 2. CHIMERA Orchestration Strategy

### 2.1 The Multi-Stem Alignment Dilemma
When composing with generative AI, raw outputs from diverse models (e.g. YuE 2 instrumental bed, Stable Audio 3 percussion, ACE vocal stem) exhibit severe incompatibilities:
1. **Tempo & Transient Drift:** Generated stems drift by 1–5% over time because generative latents do not maintain rigid sample-clock quantization.
2. **Tonal / Microtonal Disconnect:** Models hallucinate arbitrary keys ($E\flat$, $F\sharp$) or drift microtonally from the composer's intended $f_{Sa}$.
3. **Spectral Clashing & Harmonic Smearing:** Low-end mud and masking in the 150 Hz – 400 Hz range, plus dissonant *Vivadi* notes colliding with the Raga's prescribed scale.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CHIMERA MULTI-STEM ALIGNMENT PIPELINE                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   RAW AI STEMS                                                                         │
│   [YuE 2 Bed]        [Stable Audio Perc]     [ACE Vocal Stem]    [Vāgdhenu Chant]      │
│        │                      │                     │                   │              │
│        ▼                      ▼                     ▼                   ▼              │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │ 1. Continuous F0 & Tonality Extraction (torchcrepe / YIN / Pyin in Hz)         │   │
│   │    - Detect root key, cents offset, and scale distribution relative to f_Sa   │   │
│   └────────────────────────────────────┬───────────────────────────────────────────┘   │
│                                        │                                               │
│                                        ▼                                               │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │ 2. Microtonal Pitch Reconciliation Engine (Signalsmith DSP / WSOLA)            │   │
│   │    - Lock fundamental to target f_Sa (Hertz)                                   │   │
│   │    - Apply Raga Modal Band-pass Masking (notch out forbidden Vivadi swaras)    │   │
│   └────────────────────────────────────┬───────────────────────────────────────────┘   │
│                                        │                                               │
│                                        ▼                                               │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │ 3. Transient Detection & Dynamic Beat-Grid Quantization (TimeEngine)           │   │
│   │    - Detect percussive onsets via spectral flux and energy envelope            │   │
│   │    - Warp transient markers to Avartan / Tala beat grid (960 PPQ clock)        │   │
│   └────────────────────────────────────┬───────────────────────────────────────────┘   │
│                                        │                                               │
│                                        ▼                                               │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │ 4. Extended Spectrum Sweetening (96 kHz / 32-bit Float Pipeline)               │   │
│   │    - High-Pass Filter < 10 Hz (sub-rumble protection)                          │   │
│   │    - Inject Somatic Infrasound (10–20 Hz) on Tabla Bayan & Sub-drops           │   │
│   │    - Inject Hypersonic Air (20k–48k Hz) on Vocals, Flutes, Sitar Overtones     │   │
│   └────────────────────────────────────┬───────────────────────────────────────────┘   │
│                                        │                                               │
│                                        ▼                                               │
│                         COHESIVE MASTER DAW ARRANGEMENT                                │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Mathematical Alignment Pipeline

#### Step 1: Pitch Estimation & Microtonal Locking
Continuous fundamental frequency extraction is performed using an optimized C++ implementation of Pyin/Crepe. The deviation $\Delta c$ from the nearest valid Shruti frequency $f_{\text{target}}$ is computed:
$$\Delta c = 1200 \times \log_2\left(\frac{f_{\text{extracted}}}{f_{\text{target}}}\right)$$
If the pitch offset is within $\pm 75\text{ cents}$, a high-fidelity phase-vocoder shift is applied without time-scale modification.

#### Step 2: Raga Modal Filtering & Vivadi Swara Masking
To prevent dissonant AI hallucinations, each stem passes through a dynamic **Raga Modal Filter**. The filter constructs an $N$-band parametric notch bank that dynamically suppresses energy in critical bands corresponding to forbidden notes ($Vivadi$ swaras) of the active Raga:
$$H_{\text{modal}}(f) = \prod_{k \in \text{Vivadi}} \left( 1 - G_k \cdot \exp\left( -\frac{(f - f_k)^2}{2\sigma_k^2} \right) \right)$$
where $G_k \in [0.7, 0.95]$ represents the suppression depth and $\sigma_k$ matches the equivalent rectangular bandwidth (ERB).

#### Step 3: Metric Time-Warping to the Tala Grid
Using transient onset markers, the audio is segmented into rhythmic slices. Each slice is time-stretched using **Signalsmith DSP** (stretch factor $\alpha = \frac{T_{\text{target}}}{T_{\text{actual}}}$) anchored to the 960 PPQ hardware clock of the active Tala, ensuring absolute metric lock without flamming or comb-filtering.

---

### 2.3 Extended Spectrum DSP (10 Hz – 48,000 Hz at 96 kHz / 32-Bit Float)

#### A. Hypersonic Air Synthesizer (20 kHz – 48 kHz)
Standard digital audio at 44.1 kHz or 48 kHz imposes a steep brickwall anti-aliasing filter at 20 kHz – 22 kHz, eliminating the ultrasonic air that defines real acoustic sitars, flutes, and human vocal brilliance.

1. **Upsampling:** Audio is upsampled to $96\text{ kHz}$ with linear-phase polyphase FIR filters.
2. **Harmonic Generation:** A non-linear quadratic-cubic transfer function synthesizes subtle higher-order odd and even harmonics above 20 kHz:
   $$y_{\text{air}}(t) = x(t) + \beta_1 x^2(t) + \beta_2 x^3(t)$$
3. **Air Bandpass Shaping:** A 4th-order Butterworth bandpass filter isolates the $20\text{ kHz} - 45\text{ kHz}$ region, followed by a soft-knee limiter.
4. **Summation:** Injected into vocals, flutes, violins, and tanpuras at $-18\text{ dB}$ to $-12\text{ dB}$ relative to the core signal, providing unmatched psychoacoustic depth.

#### B. Somatic Infrasound Injection (10 Hz – 20 Hz)
Sub-bass frequencies between 10 Hz and 20 Hz are felt somatically through the chest cavity and skeletal system rather than heard tonally.

1. **Fundamental Extraction:** The fundamental frequency $f_0$ of the percussion (e.g. Tabla *Ge* or *Dha*) is tracked.
2. **Sub-Harmonic Generation:** A sinusoidal generator locked to exactly $\frac{f_{Sa}}{2}$ or $\frac{f_{Sa}}{4}$ (bounded strictly between $10\text{ Hz}$ and $20\text{ Hz}$) is triggered with an envelope mirroring the attack and decay of the acoustic hit.
3. **Sub-Rumble Protection:** A 24 dB/octave high-pass filter is positioned at $9\text{ Hz}$ to eliminate direct current (DC) offsets and speaker driver overload.

---

## 3. Subagent Delegation Architecture

To implement and maintain this monumental workstation, engineering tasks are delegated to 4 specialized autonomous subagents. Below are the turnkey operating prompts and task specifications:

### 3.1 Subagent 1: Indian Musicology & Microtonal Math Engine
```markdown
You are Subagent 1 (Musicology & Microtonal Math) for the Nādabrahma Universal Audio Workstation.
Your mission is to maintain and expand the mathematical foundations of Indian Classical Music across Hindustani and Carnatic traditions.

Responsibilities:
1. Maintain the 22 Shrutis Just Intonation ratio table and calculate exact frequencies relative to any moveable Sa (f_Sa in Hz).
2. Maintain the Raga database (10 Thaats, 72 Melakartas, Arohana, Avarohana, Vadi, Samvadi, Pakad, and Western mode bridge mappings).
3. Implement cubic Hermite spline generators for the 15 classical Gamakas (Meend, Kampita, Andolan) producing continuous F0 curves in Hz.
4. Formulate Tala metric structures (Avartan, Matras, Vibhags, Sam, Tali, Khali) and metric conversions to Western time signatures.

Technical Constraints:
- Zero-dependency TypeScript / C++ mathematical functions.
- Output deterministic floating-point arrays with precision < 0.001 Hz.
- Reference workspace path: `app/src/lib/ragaEngine.ts`, `app/src/lib/ragaBridge.ts`, `app/src/lib/gamakaData.ts`.
```

### 3.2 Subagent 2: Sanskrit Vedic Phonetics & Voice Synthesis
```markdown
You are Subagent 2 (Sanskrit Vedic & Vocal Synthesis) for the Nādabrahma Universal Audio Workstation.
Your mission is to architect and execute the Vedic recitation engine (Vāgdhenu / Cowchant) and vocal synthesis integrations.

Responsibilities:
1. Build and verify the Vedic G2P (Grapheme-to-Phoneme) and IPA normalizer ensuring strict zero schwa-deletion across all Sanskrit text.
2. Encode Vedic pitch accents (Udātta, Anudātta, Svarita) into continuous pitch offsets and phoneme duration tags matching Vedic Chhandas meter (Gayatri, Anushtubh, Trishtubh).
3. Implement adapters for ACE Studio and DiffSinger accepting MusicXML/phoneme streams and returning sample-accurate vocal stems.
4. Build the 15–30s Voice Drop Box feature using Seed-VC / RVC for consented timbre transfer.

Technical Constraints:
- Pure Unicode text parsing with full Devanagari and IAST diacritics support.
- Audio output rendered natively at 96 kHz / 32-bit float.
- Reference workspace path: `app/src/components/VocalEngineModal.tsx`, `Core_Concepts/Sanskrit_Vedic_Engine.md`.
```

### 3.3 Subagent 3: Apple Silicon M1 Max MLX / Audio.cpp Engine
```markdown
You are Subagent 3 (M1 Max Optimization & Audio Engine) for the Nādabrahma Universal Audio Workstation.
Your mission is to maximize inference throughput and enforce zero memory leaks on Apple Silicon M1 Max (32GB Unified Memory).

Responsibilities:
1. Optimize local model execution using Apple MLX and C++ audio.cpp / llama.cpp libraries with zero-copy unified memory.
2. Maintain the lightweight Go broker daemon (backend/main.go) on localhost:9090 with active memory monitoring and dynamic model offloading to respect the 18 GB RAM ceiling.
3. Manage quantization pipelines (4-bit / 8-bit MLX weights) for YuE 2 and Stable Audio 3.
4. Eliminate memory fragmentation and ensure instant C++ subprocess cleanup upon generation completion.

Technical Constraints:
- All native code must compile cleanly for arm64 macOS without external CUDA or bloated PyTorch dependencies.
- Memory consumption must never trigger macOS swap disk thrashing.
- Reference workspace path: `backend/`, `02_M1_MAX_ARCHITECTURE.md`.
```

### 3.4 Subagent 4: Chimera Multimodal Alignment & 96k Extended Spectrum DSP
```markdown
You are Subagent 4 (Chimera Alignment & Extended Spectrum DSP) for the Nādabrahma Universal Audio Workstation.
Your mission is to execute the multi-stem phase-locking, pitch-shifting, and 96kHz extended spectrum audio processing.

Responsibilities:
1. Implement the CHIMERA multi-stem alignment engine: continuous F0 tracking (torchcrepe/YIN), WSOLA pitch shifting to f_Sa, and transient time-stretching.
2. Implement the Raga Modal Filter to detect and mask forbidden (Vivadi) notes across AI-generated tracks.
3. Build the Hypersonic Air (20 kHz – 48 kHz) exciter DSP for vocals, sitar, and strings.
4. Build the Somatic Infrasound (10 Hz – 20 Hz) harmonic sub-generator for percussion and bass drops.
5. Integrate Demucs v4 / BS-Roformer stem separation sidecars and UVR spectral denoising.

Technical Constraints:
- Real-time Web Audio API / WebAssembly DSP and offline C++ batch rendering.
- Internal signal processing buffer locked strictly to 96 kHz / 32-bit float.
- Reference workspace path: `app/src/lib/webAudioEngine.ts`, `app/src/lib/timeEngine.ts`, `theDAW/`.
```

---

## 4. Synthesis with Existing Codebases

### 4.1 theDAW (`https://github.com/gantasmo/theDAW`)
The reference codebase `theDAW` provides battle-tested production patterns that have been integrated into Nādabrahma:
1. **Mastering & Chain Architecture:** Multi-band compression, limiter ceiling, stereo imaging, and LUFS normalization.
2. **Spatial Audio (The Owl HRTF):** 3D binaural positioning engine adapted for spherical placement of classical instruments (e.g. Tanpura wide background, Tabla center-intimate, Sitar slightly elevated right).
3. **Sidecar Isolation & UVR:** Python virtual environment sidecars managed via `uv` for seamless stem extraction and transient recovery.

### 4.2 Local Workspace (`nadabrahma/`) & Obsidian Vault (`/Users/mrigank/Documents/Daw/DAW/`)
The active local workstation unites the complete design into a running application:
- **Frontend (`app/`):** React 19 + Vite 8 + Web Audio Engine. Features the Raga-Tala HeaderHUD, 5-track Timeline, Swara-labeled Piano Roll with Meend curves, Director's Mode, and 13 production modals.
- **Backend (`backend/`):** High-speed, memory-lean Go daemon managing model processes, monitoring UMA memory, and coordinating audio.cpp adapters.
- **Documentation & Knowledge Vault:** Bi-directionally synchronized Markdown records (`00_SYSTEM_CONTEXT.md`, `01_MASTER_SPECIFICATION.md`, `Core_Concepts/`, `Workflows/`) ensuring seamless handover between developer and AI agents.

---

## 5. Master Roadmap & Actionable Next Steps

| Milestone | Objective | Key Deliverable | Status |
|---|---|---|---|
| **Phase 1** | Interactive Web DAW Frontend | 60fps Canvas Timeline, Piano Roll, HUD, Modals | **Complete** |
| **Phase 2** | Indian Classical & Tala Clock | 22 Shrutis, Moveable Sa, TimeEngine hardware clock | **Complete** |
| **Phase 3** | Go Broker & Memory Management | 20MB idle broker, model manager, 14GB headroom guard | **Complete** |
| **Phase 4** | CHIMERA Multi-Stem Audio Engine | Stem alignment, WSOLA pitch-shift, 96k Hypersonic/Infrasound | **Active Priority** |
| **Phase 5** | Vāgdhenu Sanskrit & Vedic Recitation | IISc Sanskrit G2P, Chhandas meter, ACE/DiffSinger bridge | **Upcoming** |
| **Phase 6** | FastMCP Autonomous AI Production | Local MCP Server exposing DAW API to Antigravity/Claude | **Upcoming** |

---
*Authored for the Nādabrahma Project — Unified Knowledge Graph & AI System Blueprint.*
