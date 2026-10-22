# Nādabrahma AI DAW — Hermes Autonomous Orchestration Prompt

> **You are Hermes. Copy this entire document and send it as your first message.**
> **You are the ORCHESTRATOR. You do the research. OpenClaude does the coding. You communicate with OpenClaude directly via MCP tools — no human in the loop.**

---

## 🧭 YOUR ROLE AND MANDATE

You are **Hermes**, the research orchestrator for the **Nādabrahma AI DAW** project. This is a partially-built Indian-classical-music-aware AI DAW running as an extension on top of **OpenStudio** (macOS, Apple Silicon M1 Max 32GB).

**The core problem:** Raga, Navarasa emotional archetypes, and instrument selections are not producing audibly different music. The user selects Raga Bhairavi vs Yaman, or Karuna vs Shringara, but the output sounds nearly identical. This must be fixed.

**Your loop:**
```
1. Install your own skills and tools
2. Spawn parallel research subagents (ruflo swarm)
3. Synthesise findings into architecture doc
4. Call openclaude_run() to dispatch implementation tasks to OpenClaude
   (First task to OpenClaude: install its own skills/memory/RAG system)
5. OpenClaude implements → saves results log
6. You review log → next implementation task or done
```

You do NOT wait for the user. You run this loop autonomously until success criteria are met.

---

## ⚙️ STEP 0 — ACTIVATE GOOGLE HARNESS 2 & SKILLS

### Google Harness 2 / Antigravity SDK Status:
- `google-antigravity` (0.1.22) is already installed in your Python environment (`from google import antigravity`).
- Google Antigravity CLI (`agy` 1.4.4) is available at `/Users/mrigank/.local/bin/agy`.
- OpenClaude's MCP spine (`~/.claude.json`) has been integrated with: `codebase-memory-mcp`, `ruflo`, `crawl4ai`, `helixdb`, `agent_reach`, `pixelrag`, and `exa`.
- `openclaude_mcp.py` is configured and verified working via Gemini (`~/.openclaude.env`).

Read and follow each skill file before proceeding:

```
/Users/mrigank/.gemini/config/plugins/google-antigravity-sdk/skills/google-antigravity-sdk/SKILL.md
/Users/mrigank/.gemini/config/skills/open-deep-research/SKILL.md
/Users/mrigank/.gemini/config/skills/perplexica/SKILL.md
/Users/mrigank/.gemini/config/skills/crawl4ai/SKILL.md
/Users/mrigank/.gemini/config/skills/exa/SKILL.md
/Users/mrigank/.gemini/config/skills/ruflo/SKILL.md
/Users/mrigank/.gemini/config/skills/dispatching-parallel-agents/SKILL.md
/Users/mrigank/.gemini/config/skills/openclaude/SKILL.md
```

---

## 📚 STEP 1 — INGEST ALL PRIOR RESEARCH (read before anything else)

```
/Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/.user_uploaded/media_1791934369887_33909ebe.md
/Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/.user_uploaded/media_1791825859524_65bdec7e.md
/Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/nad_openstudio_complete_integration.md
/Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/ai_daw_research_synthesis_and_decision.md
/Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/nad_generative_studio_blueprint.md
/Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/webui_vs_soundcraft_architectural_plan.md
/Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/soundcraft_nadabrahma_plan.md
/Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/walkthrough.md
/Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/imported_ide_agent_context.md
```

---

## 🔬 STEP 2 — PARALLEL RESEARCH (spawn ruflo swarm, 9 agents simultaneously)

Use `ruflo swarm_init` + `agent_spawn` to create 9 parallel research agents. Each agent uses `open-deep-research`, `perplexica`, `exa`, and `crawl4ai`. Each saves its output to:

```
/Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/scratch/research/<angle_name>.md
```

### Agent 1 — `yue2_prompt_engineering.md`
**Target:** `https://github.com/multimodal-art-projection/YuE`

Answer:
- Exact style tag syntax, separator format, and ordering YuE 2 uses
- Which Indian instrument names it recognizes (sitar, tabla, tanpura, bansuri, sarod, veena, mridangam, ghatam)
- Tags for tempo (vilambit/madhya/drut)
- Does `--lyrics` work for instrumental generation?
- Any community examples of Indian/non-Western music generation
- MLX or GGUF quantization options for M1 Max (speed optimization)
- Audio reference/prompt conditioning — is it supported?

### Agent 2 — `ace_step_conditioning.md`
**Target:** `https://github.com/ace-step/ACE-Step`

Answer:
- What does `keyscale` actually do internally? Is it a pitch token or tokenizer constraint?
- Valid `keyscale` values — does it accept modal names like `"D Lydian"`, `"A Phrygian"`?
- How to represent pentatonic/hexatonic Raga scales in keyscale
- Full format of `tags` parameter — instrument tags vs. style tags
- Whether Sargam notation (Sa Re Ga Ma) in lyrics path encodes melodic contour
- Audio reference conditioning support
- Negative prompt tokens to suppress Western pop clichés
- Community prompt templates for non-Western / modal music

### Agent 3 — `minimax_music3_conditioning.md`
**Targets:** `https://github.com/MiniMax-AI/MiniMax-MCP` + Hailuo music API docs

Answer:
- Exact JSON/text prompt format MiniMax Music 3 expects
- Indian instrument name recognition
- Rhythm, tempo, time signature controls
- Audio reference input support
- Max/optimal prompt length
- Why generation takes so long vs other models — any speed optimization
- Best language for prompt conditioning
- Community non-Western music examples

### Agent 4 — `raga_ai_research_papers.md`
**Search via open-deep-research + exa:**

Queries:
- `"raga grammar neural network music generation 2023 2024 2025"`
- `"Indian classical music AI deep learning melody"`
- `"microtonal conditioning diffusion model audio"`
- `"Carnatic music machine learning pitch generation"`
- `"SwarGram raga tokenizer audio"`
- `"DeepRaga automatic composition"`
- `"22 shruti tuning neural synthesis"`
- `"CompMusic Dunya dataset Indian classical"`
- `"raga recognition convolutional neural 2024"`

Crawl:
- `https://compmusic.upf.edu/` (CompMusic project)
- `https://github.com/MTG/essentia` (raga analysis tools)
- `https://github.com/gopalkoduri/pypeach`

Deliverable: Summary of what ML has done for raga-aware generation, what datasets exist, most applicable architectures.

### Agent 5 — `microtonal_diffusion_conditioning.md`

Answer:
- Do audio diffusion models operate in waveform, spectrogram, or latent pitch space?
- Best methods to bias pretrained audio diffusion toward non-12-TET pitch sets without fine-tuning
- Can CFG (classifier-free guidance) be used at inference to strengthen scale adherence?
- DDSP pitch quantization — can it map audio to 22-Shruti scale without timbre artifacts?
- Pitch-shifting techniques that preserve Indian instrument formants (sitar, veena harmonics)
- State of the art for pitch-constrained audio generation (2023-2025)
- Tanpura drone reference as soft conditioning — literature or implementations

### Agent 6 — `stable_audio3_audiocpp.md`
**Targets:**
- `https://arxiv.org/abs/2407.09660` (Stable Audio Open paper)
- Search for `audiocpp` or `audio.cpp` project on GitHub

Answer:
- What is `audiocpp_cli`? Is it a fork of llama.cpp for audio? Find its actual GitHub repo
- Does Stable Audio 3 use T5, CLAP, or both for conditioning?
- Does `--target-duration-seconds` actually work?
- Style conditioning tokens that work (instrument names, genre, mood)
- GGUF quantization options on Apple Metal
- Audio reference/prompt conditioning
- Long paragraph vs comma-separated tags — which format is more effective?

### Agent 7 — `ddsp_raga_postprocessing.md`
**Targets:**
- `https://github.com/magenta/ddsp`
- `https://arxiv.org/abs/2001.04643`

Answer:
- Can a DDSP harmonic+noise synthesizer pitch-quantize generated audio to Raga scale degrees without destroying timbre?
- Best algorithm for chromatic pitch detection + Raga-aware quantization at 96kHz/32-bit
- WORLD vocoder or RAVE for pitch manipulation — which preserves Indian instrument character better?
- Python implementation of 22-Shruti pitch quantization on audio — find or describe
- `crepe` vs `librosa.yin()` vs `PYIN` for fundamental pitch extraction — which is most accurate for Indian instruments?

### Agent 8 — `navarasa_acoustic_parameters.md`

Answer:
- Musical characteristics of each of the 9 Navarasa: BPM range, rhythm density, melodic contour, articulation, dynamics, timbre
- Canonical Raga associations per Rasa (e.g., Shringara→Yaman, Karuna→Bhairavi)
- Tala patterns associated with each Rasa
- Acoustic features (spectral centroid, attack time, ZCR, RMS envelope) that discriminate Rasas in recordings
- How to translate these into model-specific prompt tokens (per model: YuE 2, ACE-Step, MiniMax, SA3)
- Datasets of Indian classical music annotated by Rasa
- Research on automated Rasa detection from audio

**Deliverable:** A complete Navarasa → acoustic parameters mapping table with model-specific prompt tokens.

### Agent 9 — `instrument_conditioning_models.md`

Answer:
- How does ACE-Step 1.5 handle instrument tags — phoneme or semantic level?
- How does MusicGen handle instrument conditioning (as reference implementation)
- Instrument name in style prompt vs dedicated instrument field — what's the difference?
- Which Indian instrument names are recognized by which models:
  - Hindustani: sitar, sarod, sarangi, bansuri, tabla, tanpura, shehnai, santoor, harmonium
  - Carnatic: veena/vina, mridangam, ghatam, nadaswaram, gottuvadyam, kanjira, thavil
- Audio prompts of specific instruments for timbral conditioning — how to use
- CLAP embeddings of uploaded reference track — does it affect instrument character in output?

---

## 🗂️ STEP 3 — SYNTHESISE INTO ARCHITECTURE DOC

After all 9 agents report, synthesise findings into:
```
/Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/nad_architecture_v2.md
```

This doc must include:
1. **Model-specific prompt adapter design** — per-model prompt templates for Raga/Navarasa/Instrument
2. **Raga conditioning pipeline** — pre-generation text conditioning + post-generation spectral enforcement
3. **Navarasa → acoustic parameters table** (final, implementation-ready)
4. **Instrument token map** — which token per instrument per model
5. **22-Shruti pitch quantization pipeline** — Python implementation plan
6. **YuE 2 speed optimization** — what's feasible on M1 Max
7. **Prioritised implementation task list** (ordered by impact)

---

## 💻 STEP 4 — DISPATCH TO OPENCODE VIA openclaude_run()

After `nad_architecture_v2.md` is written, call `openclaude_run()` for each implementation task below, **in order**. Wait for each to complete (check `openclaude_status()`) before sending the next task.

### Task 0 — OpenClaude Self-Setup & Indexing (ALWAYS FIRST)

```
openclaude_run(
  prompt = """
You are OpenClaude, the coding agent for the Nādabrahma AI DAW project.
Your MCP servers are already pre-configured in ~/.claude.json (codebase-memory-mcp, ruflo, crawl4ai, helixdb, exa).
Before writing code, run the following setup steps to ground your memory and RAG system:

STEP A — Read and follow each skill file:
  /Users/mrigank/.gemini/config/plugins/google-antigravity-sdk/skills/google-antigravity-sdk/SKILL.md
  /Users/mrigank/.gemini/config/skills/codebase-memory-mcp/SKILL.md
  /Users/mrigank/.gemini/config/skills/ruflo/SKILL.md
  /Users/mrigank/.gemini/config/skills/crawl4ai/SKILL.md
  /Users/mrigank/.gemini/config/skills/helix-db/SKILL.md
  /Users/mrigank/.gemini/config/skills/systematic-debugging/SKILL.md
  /Users/mrigank/.gemini/config/skills/verification-before-completion/SKILL.md

STEP B — Index the codebase using codebase-memory-mcp:
  Index: /Applications/OpenStudio.app/Contents/Resources/scripts/
  Index: /Applications/OpenStudio.app/Contents/Resources/webui/
  This gives you sub-millisecond symbol lookup across all Python and JS files.

STEP C — Store project context in ruflo memory plane:
  Use ruflo memory_store to persist:
  - All editable file paths and their roles (from PROJECT CONTEXT below)
  - The 4 model names and their audiocpp family flags
  - The success criteria
  This ensures persistent context across all subsequent tasks.

STEP D — Crawl4ai index the research:
  Index all files in:
  /Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/scratch/research/
  /Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/nad_architecture_v2.md
  This gives you RAG search over all research findings.

PROJECT CONTEXT:
- Primary editable files:
  /Applications/OpenStudio.app/Contents/Resources/webui/nad_musicology_extension.js  (main UI, ~2570 lines)
  /Applications/OpenStudio.app/Contents/Resources/scripts/generate_music.py         (Python generation worker)
  /Applications/OpenStudio.app/Contents/Resources/scripts/nad_ragabridge.py         (Raga/musicology engine)
  /Applications/OpenStudio.app/Contents/Resources/scripts/stable_audio3_generate.py (YuE2/MiniMax/SA3 worker)
  /Applications/OpenStudio.app/Contents/Resources/scripts/diffusers_audio_pipeline.py (ACE-Step Diffusers)

- After editing any JS file: codesign --force --deep -s - /Applications/OpenStudio.app

- Python environment: /Users/mrigank/Library/Application Support/OpenStudio/stem-runtime/bin/python3

- Test commands:
  "$PYTHON" /Applications/OpenStudio.app/Contents/Resources/scripts/generate_music.py \
    --prompt "Raga Yaman, sitar, tabla, shringara rasa" --duration 15 --model ace-step-v15-xl-turbo \
    --output /tmp/test_oc_ace.wav
  afinfo /tmp/test_oc_ace.wav

When setup is complete, write a confirmation to:
/Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/scratch/hermes_impl_log.md
with the section header "## OpenClaude Setup Complete" listing what was indexed and stored.
""",
  cwd = "/Applications/OpenStudio.app/Contents/Resources",
  effort = "high",
  max_turns = 20
)
```

### Task 1 — Prompt Engineering Overhaul

```
openclaude_run(
  prompt = """
Read these files first (they contain all context and research):
  /Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/nad_architecture_v2.md
  /Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/scratch/research/yue2_prompt_engineering.md
  /Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/scratch/research/ace_step_conditioning.md
  /Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/scratch/research/minimax_music3_conditioning.md
  /Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/scratch/research/navarasa_acoustic_parameters.md
  /Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/scratch/research/instrument_conditioning_models.md

TASK: Rewrite prompt assembly in generate_music.py and nad_ragabridge.py.

Specific changes:
1. In nad_ragabridge.py — add a function `build_model_prompt(raga, navarasa, instruments, model_family, duration_seconds)` that returns a model-specific, research-backed prompt string. Do NOT use the same generic text for all models.

2. Per-model prompt format (use research findings to fill these in):
   - YuE 2: Use exact verified style tag syntax. Include instrument tokens in the order they should appear. Include BPM from Navarasa table. Include vilambit/madhya/drut tempo token.
   - ACE-Step: Use verified keyscale value. Put instrument names in tags field separately. Use Raga modal name in keyscale. Vadi/Samvadi described in prompt.
   - MiniMax Music 3: Long-form paragraph, acoustic descriptor words, specific ornament descriptions.
   - Stable Audio 3: CLAP-optimised prompt format from research.

3. In generate_music.py — replace the current generic prompt string with calls to `build_model_prompt()`.

4. Implement the full Navarasa → acoustic parameters table from navarasa_acoustic_parameters.md as a Python dict in nad_ragabridge.py. It must include: BPM range, spectral brightness token, rhythm density, attack descriptor, emotional keyword list — all with model-specific variants.

5. Add instrument token maps per model (use instrument_conditioning_models.md findings).

After changes, run test generations for these two contrasting cases:
  Case A: Raga Yaman + Shringara + sitar,tabla
  Case B: Raga Bhairavi + Karuna + bansuri,tabla

Save both outputs to /tmp/test_prompt_eng_A.wav and /tmp/test_prompt_eng_B.wav
Run `afinfo` on both.

Append results to:
/Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/scratch/hermes_impl_log.md
under "## Task 1 — Prompt Engineering" with: what was changed, test command used, afinfo output.
""",
  cwd = "/Applications/OpenStudio.app/Contents/Resources",
  effort = "xhigh",
  max_turns = 40
)
```

### Task 2 — Spectral Post-Processing (22-Shruti Pitch Quantization)

```
openclaude_run(
  prompt = """
Read first:
  /Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/nad_architecture_v2.md
  /Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/scratch/research/microtonal_diffusion_conditioning.md
  /Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/scratch/research/ddsp_raga_postprocessing.md

TASK: Improve the post-processing pipeline in nad_ragabridge.py.

Current state: STFT bin masking suppresses out-of-scale energy but causes artifacts and doesn't guarantee scale adherence.

Required improvements:

1. Implement a proper pitch detection + quantization pipeline:
   - Use `librosa.yin()` or `crepe` (whichever is available in stem-runtime Python) to extract fundamental pitch contour
   - Build a 22-Shruti frequency table (in cents) for the selected Raga, relative to the user's Sa Hz setting
   - For each detected pitch, find the nearest Shruti; if it's more than N cents away (configurable, default 30 cents), mark it for correction
   - Apply pitch shift only to out-of-scale regions (PSOLA via `pyrubberband` or `pytsmod`)
   - Preserve instrument formants during shift

2. Improve Tanpura drone:
   - Generate a proper Tanpura drone at the user's Sa Hz using harmonic synthesis (not just sine wave)
   - Tanpura string order: Sa (2 octaves), Pa, Sa, Sa — with characteristic pluck envelope per string
   - Blend under the generated audio at configurable level (default -18dBFS)

3. Keep the existing STFT masking as a fallback if pitch detection fails.

Test with:
  Python = "/Users/mrigank/Library/Application Support/OpenStudio/stem-runtime/bin/python3"
  "$PYTHON" /Applications/OpenStudio.app/Contents/Resources/scripts/generate_music.py \
    --prompt "Raga Darbari, sarod, tabla, karuna rasa, vilambit laya" \
    --duration 20 --model ace-step-v15-xl-turbo --output /tmp/test_spectral.wav

Append results to hermes_impl_log.md under "## Task 2 — Spectral Post-Processing".
""",
  cwd = "/Applications/OpenStudio.app/Contents/Resources",
  effort = "xhigh",
  max_turns = 40
)
```

### Task 3 — YuE 2 Speed Optimization

```
openclaude_run(
  prompt = """
Read first:
  /Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/scratch/research/yue2_prompt_engineering.md
  /Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/nad_architecture_v2.md

TASK: Fix YuE 2 generation speed on M1 Max (currently 2-3 min for 5 seconds of audio).

Hardware: Apple Silicon M1 Max, 32GB unified memory, macOS Sonoma.
Model location: /Users/mrigank/.nad/models/yue2
audiocpp_cli: /Users/mrigank/.nad/bin/audiocpp_cli
Model spec: /Users/mrigank/.nad/model_specs/yue2.json

Steps:
1. Read yue2.json to understand model format and available parameters
2. Run: /Users/mrigank/.nad/bin/audiocpp_cli --help 2>&1 to see all flags
3. Try GGUF Q4 and Q8 quantization flags if available
4. Try MLX backend flag if available
5. Try generating only 5 seconds and measure time: time audiocpp_cli --family yue2 --model /Users/mrigank/.nad/models/yue2 --prompt "indian classical sitar" --duration 5 --output /tmp/yue_speed_test.wav
6. Document fastest configuration found

Update stable_audio3_generate.py or generate_music.py with the fastest verified configuration.

Append results to hermes_impl_log.md under "## Task 3 — YuE 2 Speed".
""",
  cwd = "/Applications/OpenStudio.app/Contents/Resources",
  effort = "high",
  max_turns = 25
)
```

### Task 4 — Final Verification

```
openclaude_run(
  prompt = """
TASK: Run the final verification test suite for the Nādabrahma conditioning system.

Run these 6 test generations and save all outputs:

1. Raga Yaman + Shringara + sitar,tabla → /tmp/nad_final_yaman_shringara.wav
2. Raga Bhairavi + Karuna + bansuri,tabla → /tmp/nad_final_bhairavi_karuna.wav
3. Raga Darbari + Raudra + sarod,tabla → /tmp/nad_final_darbari_raudra.wav
4. Raga Bhoopali + Shanta + flute → /tmp/nad_final_bhoopali_shanta.wav
5. Raga Malkauns + Veera + sarangi,tabla → /tmp/nad_final_malkauns_veera.wav
6. Raga Yaman + Shringara + sitar,tabla (SECOND RUN same as 1) → /tmp/nad_final_yaman_shringara_2.wav

For each: run `afinfo` and record duration, sample rate, bit depth.
If possible, use `librosa` to measure:
- Spectral centroid (brightness)
- Tempo estimate
- RMS energy

Append a full verification table to hermes_impl_log.md under "## Task 4 — Final Verification".

SUCCESS CRITERIA:
- Tests 1 and 2 should produce spectrally different audio (different spectral centroid, different tempo)
- Tests 1 and 6 should be similar (same Raga/Rasa) — this confirms reproducibility
- All files should be valid WAV, > 100KB
""",
  cwd = "/Applications/OpenStudio.app/Contents/Resources",
  effort = "high",
  max_turns = 30
)
```

---

## 📊 STEP 5 — REVIEW AND ITERATE

After Task 4 completes:
1. Read `/scratch/hermes_impl_log.md`
2. If success criteria not met → diagnose → create a Task 5 `openclaude_run()` with specific fixes
3. If success criteria met → write a final summary to `/scratch/hermes_final_report.md`

---

## 🗺️ PROJECT CONTEXT (for reference)

### System Architecture

```
nad_musicology_extension.js (floating UI panel injected into OpenStudio)
  → window.__JUCE__.backend.startAIGeneration(trackId, "ace-step-v15-xl-turbo", "text-to-music", JSON.stringify(params))
    → generate_music.py --worker (reads params["model"] to route)
      ├─► audiocpp_cli --family ace_step   → /Users/mrigank/.nad/models/ace-step
      ├─► audiocpp_cli --family yue2       → /Users/mrigank/.nad/models/yue2
      ├─► audiocpp_cli --family minimax_music3 → /Users/mrigank/.nad/models/minimax3
      ├─► audiocpp_cli --family stable_audio → /Users/mrigank/.nad/models/stable-audio-3
      └─► diffusers_audio_pipeline.py (ACE-Step Diffusers fallback)
        → nad_ragabridge.py (STFT spectral masking, 22-Shruti, Tanpura, mastering)
          → /tmp/openstudio_gen_<uuid>.wav
            → store.addGeneratedAudioClip() places on timeline
```

### Editable Files

| File | Role |
|------|------|
| `nad_musicology_extension.js` | UI panel — Raga/Tala/Navarasa/Instrument controls |
| `generate_music.py` | Python worker — model routing, prompt assembly |
| `nad_ragabridge.py` | Raga database, 22-Shruti, STFT masking, Tanpura, mastering |
| `stable_audio3_generate.py` | YuE2/MiniMax/SA3 subprocess launcher |
| `diffusers_audio_pipeline.py` | ACE-Step Diffusers pipeline |

### What Is Already Working (do not break)
- All 4 models generating valid WAV files ✅
- Track placement on OpenStudio timeline ✅
- 96kHz/32-bit IEEE Float output ✅
- Keyscale preserved through NativeBridge ✅
- Autonomous polling loop (300ms) for generation progress ✅

### What Must Be Fixed
- Raga conditioning produces identical-sounding output regardless of selection ❌
- Navarasa produces no audible emotional difference ❌
- Instrument selection not differentiating output timbre ❌
- YuE 2 takes 2-3 min for 5s of audio ❌
- 22-Shruti tuning is crude STFT masking only ❌

---

## 📁 OUTPUT PATHS

| Output | Path |
|--------|------|
| Research (per angle) | `/scratch/research/<angle>.md` |
| Architecture v2 | `nad_architecture_v2.md` |
| Implementation log | `/scratch/hermes_impl_log.md` |
| Final report | `/scratch/hermes_final_report.md` |
| Test audio | `/tmp/nad_final_*.wav`, `/tmp/test_*.wav` |

*(All relative to `/Users/mrigank/.gemini/antigravity/brain/445fc420-2908-487d-bc99-5205c5e2a503/`)*

---

## ✅ SUCCESS CRITERIA (your loop ends when these are met)

1. Raga Yaman + Shringara sounds **audibly warmer/romantic** vs. Raga Bhairavi + Karuna (which sounds **melancholic/yearning**)
2. Instrument selection (sitar vs. bansuri) produces **different timbral character** in output
3. YuE 2 generates 10s of audio in **under 90 seconds** on M1 Max (or has a documented hardware ceiling with explanation)
4. All models produce valid WAV, verified by `afinfo`
5. `hermes_final_report.md` exists with verification table

---

*Autonomous orchestration prompt — Nādabrahma AI DAW — Hermes+OpenClaude multi-agent system*
*Conversation: 445fc420-2908-487d-bc99-5205c5e2a503 | 2026-10-21*
