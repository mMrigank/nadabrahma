# Open-Source AI DAW — Product and Technical Research Brief

> **Purpose:** Product and engineering context for an IDE coding agent. This brief describes a globally usable, open-source AI-assisted DAW that includes Indian musical concepts as a first-class option, while supporting music and sound work for brand films, documentaries, short films, sonic branding, songs, podcasts, games, installations, and other productions.
>
> **Research caution:** Repository and paper links below are research leads, not automatic endorsements. Verify current upstream, commit health, APIs, hardware behavior, model/dataset terms, and third-party rights before integrating. Search results and project claims are not substitutes for testing.

## 1. Product direction

### The product is not an “Indian music DAW”

The DAW should be a **general-purpose creative audio workstation with AI-assisted creation and production**, designed for users around the world. Indian musical traditions are a meaningful source of features, workflows, presets, data partnerships, and domain knowledge—but not the app’s only genre, geography, or target audience.

The product must serve at least these kinds of work:

- **Brand and advertising:** sonic logos, mnemonic systems, short edits, campaign variations, stems, alternate lengths, and strict delivery specifications.
- **Film and documentary:** score sketches, cues, underscore, transitions, source audio, dialogue/music beds, scene references, picture-linked notes, and versioning.
- **Songs and artist production:** lyrics, vocals, arrangements, songwriting, stem editing, sound design, and mix preparation.
- **Short-form and creator media:** fast custom cues, loops, stingers, transitions, and social deliverables.
- **Games, installations, and interactive media:** loops, adaptive layers, one-shots, ambiences, and state-based variations.
- **Global and local musical practices:** contemporary, orchestral, electronic, folk, classical, devotional, regional, hybrid, and user-defined approaches, with cultural specificity rather than generic “world music” labeling.

### Product principles

1. **Human-directed, AI-assisted:** generation should create editable options; the person remains the arranger, editor, and decision-maker.
2. **One creative workspace:** text/audio/MIDI references, arrangement, model-generated material, edits, mixing, and export belong to one persistent project.
3. **Model-agnostic:** support interchangeable local and optional remote models. Do not let a model’s limitations define the project format or UI.
4. **Task-aware:** music composition, sound effects, ambience, vocals, MIDI, analysis, separation, and mastering are distinct tasks. Use the right model/tool for each.
5. **Broad by default, specialized by choice:** offer general workflows first, then optional cultural, language, genre, and production-specific packs and controls.
6. **Local-first where feasible:** run locally on Apple Silicon and other supported hardware when viable; explain when a model needs a cloud backend or a larger GPU.
7. **Transparent and rights-aware:** expose backend, model revision, source, license, processing history, and limits. No unauthorized named-artist voice cloning.
8. **Professional audio foundations:** transport, timeline, non-destructive editing, stable playback, automation, routing, monitoring, export, and project portability are core—not later AI add-ons.

## 2. Target users and jobs to be done

| User | Typical job | Valuable DAW capability |
|---|---|---|
| Brand/agency producer | Create a sonic identity or campaign cue in several lengths and moods | Brief-to-options workflow, motif/brand asset library, fast variants, editable stems, delivery profiles |
| Film/documentary maker | Explore and edit cues against scenes | Reference video/markers, cue cards, mood/energy/duration constraints, timeline, stems, version comparison |
| Independent musician | Build a track from lyrics, MIDI, audio references, or generated layers | Song structure, vocal workflow, model alternatives, stem editing, effects, export to established DAWs |
| Sound designer | Create a sound, ambience, transition, or designed texture | Text/audio/video-conditioned sound generation, layering, resynthesis, sample tools, library search |
| Composer/arranger | Develop controllable musical ideas | MIDI/symbolic editing, tempo/meter maps, harmony and orchestration controls, humanized performance |
| Regional/tradition-specific artist | Work with their own musical language and practice | Optional terminology, pronunciation, scales/phrases/ornaments, consultant-reviewed tools, suitable reference material |
| Educator/researcher | Demonstrate, evaluate, or prototype audio workflows | Explainable processing, reproducible runs, dataset/model provenance, benchmarks, exportable workflows |

## 3. Core workflow concept

The primary loop should be:

1. **Describe the brief:** purpose, audience, emotion, duration, references, delivery target, language, and exclusions.
2. **Explore:** generate a small set of meaningfully different sketches—not a large undifferentiated batch.
3. **Select and deconstruct:** place a chosen idea on the timeline; separate it into stems where possible; mark useful motifs, bars, phrases, or regions.
4. **Direct and refine:** ask for a variation, alternate ending, added layer, replacement section, vocal or sound-design pass, or MIDI arrangement.
5. **Edit:** arrange clips, draw/record MIDI and automation, edit lyrics/phonemes, use standard DSP, and audition alternatives.
6. **Mix and deliver:** control levels/effects, compare versions, validate loudness/format requirements, and export stems and masters.
7. **Preserve provenance:** save the prompt, model, version, seed, references, outputs, edits, rights notes, and parent/child relationships.

The UI should support both a **guided brief workflow** and a **direct DAW workflow**. A power user should not have to talk to an agent for basic editing; a novice should not need to understand model parameters before hearing useful choices.

## 4. Research findings that shape the product

### 4.1 Generative music should be integrated as a co-creation tool

A 2025 music-production user study recommends improvements such as stronger tempo/key control, editing, iterative regeneration, and DAW integration rather than a one-shot prompt-and-download workflow. A separate human-in-the-loop REAPER assistant paper describes grounding actions in live session state and making edits reversible. These point to a central design requirement: generation must connect to **specific clips, regions, tracks, and reversible operations**, not act as a detached audio chatbot. [web:228][web:223]

### 4.2 Global reach needs explicit evaluation and cultural care

Research on cultural representation reports substantial underrepresentation of non-Western genres in music datasets, and newer work reports quality/alignment gaps across regions and genres. This argues for avoiding a Western-default “genre list + exotic styles” approach. Treat locale, tradition, language, and musical practice as structured but user-selectable context; co-design specialized features with practitioners and evaluate each separately. [web:224][web:225][web:229]

### 4.3 Models have different jobs and limitations

- **ACE-Step 1.5** describes lyrics, multilingual generation, editing, layer, separation, and audio-analysis tasks, as well as platform-specific entry points. These are project claims and need local verification per model/version. It is a promising song-generation adapter, not a full DAW by itself. [web:22]
- **YuE2** is described by ComfyUI’s guide as generating a full song from a style prompt and lyrics. That makes it a song-generation backend, not automatically a stem-aware arranger or professional vocal editor. [web:281]
- **AudioCraft/MusicGen and AudioGen** illustrate the distinction between music generation and general text-to-sound generation. [web:265][web:264]
- **Stable Audio Open** is described as focused on short audio samples and sound-design elements, complementing rather than replacing long-form song engines. [web:267]
- **MMAudio** is a video/text-to-audio research direction useful for synchronized sound effects and ambience, not a standard music-song generator. [web:237]

Therefore, the DAW should model **capabilities and task types**, not put every backend in one undifferentiated “model” dropdown.

### 4.4 Established DAW integration matters

Research reviews identify a persistent gap between Python-based generative models and conventional DAW/plugin environments. JUCE supports cross-platform audio applications and plugin hosting/building, while toolchains and licensing differ. The product should offer export/interop early and only commit to native plugin hosting after the core project/timeline works. [web:180][web:208][web:218]

### 4.5 Provenance, licensing, and model transparency are product features

A responsible AI music review reports limited training-data disclosure and recurring uncertainty around dataset, model, and output rights. Store rights and provenance with each backend and generated asset; do not promise commercial clearance just because code or weights are downloadable. [web:235][web:236]

## 5. Architecture recommendation

### 5.1 Keep the DAW independent of model internals

The DAW owns the session, clips, timeline, routing, editing, undo/redo, audio engine, and export. Models operate as **asynchronous services/adapters** that accept typed requests and return assets plus metadata. Do not run Python inference inside the real-time audio callback.

### 5.2 Major components

- **Desktop shell/UI:** timeline, tracks, clip editor, browser, mixer, prompt/brief panel, model/library panels, optional video preview/markers.
- **Project/session schema:** tracks and clips; media references; tempo/meter map; markers; lyrics; MIDI; automation; effect graph; model prompts/results; parent lineage; export profiles.
- **Audio engine:** reliable transport/playback, low-latency monitoring, deterministic DSP, routing, automation, bounce/export.
- **Worker/job system:** launches or connects to backends; handles memory scheduling, progress, cancellation, retry, cache, logs, and artifact import.
- **Model registry/adapters:** declare task support, controls, supported input/output formats, runtime requirements, provenance, and license metadata.
- **Analysis services:** waveform/peak and loudness, tempo/beat/key estimates, pitch/onset, speech/music classification, transcription, optional embeddings.
- **Interchange layer:** export/import audio stems, MIDI, project bundles, and optionally connect to REAPER/Ableton/Logic through file formats, scripts, OSC/MCP, or plugin bridges.
- **Optional agent/copilot:** translates user intent to proposed edits; fetches live session state; previews a plan; requires user approval for destructive or multi-step edits; supports undo.

### 5.3 Model capability contract (proposal)

```json
{
  "id": "provider/model/backend/revision",
  "tasks": ["text_to_music", "lyrics_to_song", "text_to_sound", "audio_continuation", "inpaint", "video_to_audio", "separation", "voice_conversion"],
  "inputs": {"text": true, "lyrics": false, "audio_reference": false, "video_reference": false, "midi": false, "duration_seconds": true},
  "outputs": ["audio"],
  "controls": ["seed", "duration", "guidance"],
  "execution": {"local": true, "remote": false, "apple_silicon": "verify-per-version"},
  "requirements": {"minimum_memory_gb": null, "sample_rates": [44100]},
  "rights": {"code_license": "verify", "weights_license": "verify", "commercial_use": "verify", "training_data_disclosure": "unknown"}
}
```

Capability declarations must distinguish native stems from estimated stems. If a song model returns one stereo mix, the adapter should say so. If the DAW runs a separator afterward, mark the result **separated/estimated**, preserve the original mix, and allow users to compare artifacts.

### 5.4 Audio and project principles

- Keep a documented internal sample-rate/channel policy; convert at adapter boundaries and retain original imported files.
- Use non-destructive clip operations and save source/render relationships.
- Store a generated region as a new take/alternate, not as an overwrite.
- Make model jobs cancelable and resumable where possible.
- Maintain audio playback when model workers are loading or generating.
- Add a project bundle with relative media paths for portability.
- Keep model weights out of the source repo; download only after consent and show size, license, and storage location.

## 6. Repository map by product capability

### 6.1 DAW/product architecture references

- **Nadabrahma:** https://github.com/mMrigank/nadabrahma — user’s starting repo. Direct fetch failed during this research pass; inspect the repository locally before drawing conclusions about its actual scope, code, license, UI, or status.
- **theDAW:** https://github.com/gantasmo/theDAW — current repository page describes a local music studio with prompt generation, editing/mixing, score/lyrics, DJ/VJ, plugins, model integrations, stem tools, and multiple workspaces. The scale is a feature map and architecture reference, not a recommendation to copy the whole scope. [web:178]
- **ACE-Step-DAW:** https://github.com/audiohacking/ACE-Step-DAW — search results describe a WIP DAW tied to ACE-Step; useful as a model-specific UI reference, but inspect current upstream and avoid locking the host architecture to one generator. [web:190][web:239]
- **WebDAW:** https://github.com/ai-music/webdaw — browser-based composition/production reference; inspect current maintenance and audio-engine approach. [web:202]
- **DAWZY paper:** https://arxiv.org/abs/2512.03289 — reference for session-aware, reversible natural-language actions over an existing DAW. [web:223]
- **Loop Copilot paper:** https://arxiv.org/abs/2411.12641 — example of an LLM coordinating specialized models for iterative music refinement; study interface/controllability findings rather than adopting blindly. [web:232]

### 6.2 Music/song generation

- **ACE-Step 1.5:** https://github.com/ace-step/ACE-Step-1.5 — candidate lyrics/song generation and editing backend. Repository lists macOS launch scripts/MLX in current page fetched for this task; verify actual supported operations, Apple Silicon performance, model version, and license before shipping. [web:22]
- **YuE2 ComfyUI documentation:** https://docs.comfy.org/tutorials/audio/yue2/yue2 — full-song lyrics/style generation integration reference; useful to see how a node workflow exposes inputs. [web:281]
- **MiniMax Music 3:** investigate official repository/model card and community Apple Silicon implementations from earlier research; verify upstream identity, hardware, weights, API, and rights before integration.
- **AudioCraft:** https://github.com/facebookresearch/audiocraft — research/implementation reference for MusicGen and AudioGen, distinguishing text-to-music from text-to-sound tasks. [web:265][web:266]
- **Stable Audio Open demo/tools:** https://github.com/Stability-AI/stable-audio-open-demo and https://github.com/Stability-AI/stable-audio-tools — useful short sample/sound-design backend and evaluation lead; verify weight license and allowed use. [web:273][web:278]
- **Magenta RealTime 2:** https://magenta.withgoogle.com/magenta-realtime-2 — interactive real-time model direction for live generative layers, not a lyrics-first composition substitute. [web:56]
- **ComfyUI audio workflows:** https://docs.comfy.org/workflows/category/audio — useful research surface for model workflow integrations and visible parameter graphs; don’t use ComfyUI as a substitute for the DAW’s timeline/audio engine. [web:284]

### 6.3 Sound effects, ambience, and picture-linked audio

- **AudioGen / AudioCraft:** text-to-general-audio research implementation; potential for sound effects, textures, and ambience. [web:264][web:265]
- **Stable Audio Open:** short audio samples and sound-design generation lead. [web:267]
- **MMAudio:** https://github.com/hkchengrex/MMAudio — video/text-conditioned sound generation research lead; test alignment quality and licensing; useful to documentary/film workflow. [web:237]
- Keep SFX and music separate in the UX: different duration expectations, loopability, synchronization, metadata, and evaluation.

### 6.4 Source separation and stem editing

- **Demucs:** https://github.com/facebookresearch/demucs — established separation reference for vocals/drums/bass/other; benchmark locally and review maintenance/weights licensing. [web:259]
- **MSST research:** https://arxiv.org/abs/2607.23395 — separation-training research lead; find official implementation and terms before adoption. [web:80]
- **Demucs ONNX lead:** https://github.com/HRSadeghi/demucs-onnx — reported ONNX path with multiple runtimes including CoreML/WebGPU; verify status, quality, redistribution rights, and benchmark on target Macs. [web:262]
- **StemForge:** https://github.com/tsondo/StemForge — stem-centric workflow/UI reference from earlier research; verify current project health and platform support.

### 6.5 Mixing, effects, plugins, and mastering

- Use standard, well-tested DSP for EQ, filters, gain, pan, compression, limiting, reverb, delay, modulation, meters, automation, and routing before adding generative mixing.
- **JUCE:** https://github.com/juce-framework/JUCE — cross-platform application/plugin framework and plugin host/build reference. Review JUCE license/terms and plugin format requirements for your distribution model. [web:208][web:218]
- **Pedalboard:** Spotify’s audio FX library was discussed as an offline processing prototype. Find its official repository, verify current status/license, and assess whether it is suitable for real-time use; don’t assume offline Python FX is safe in the audio callback.
- **Matchering:** reference-mastering lead; verify official source, current API, and license before integration.
- **pyloudnorm:** loudness metering implementation lead. Use standards-aware meters, but let delivery profiles determine targets rather than hard-coding one platform value.
- **WildFX paper:** https://arxiv.org/html/2507.10534 — DAW-backed pipeline for producing multitrack/effect-graph research data; useful for thinking about reproducible FX graphs and dataset generation. [web:179]
- **Rubber Band:** https://github.com/breakfastquay/rubberband — time-stretch and pitch-shift reference. The project page states GPL licensing and commercial licensing conditions; review carefully because this can affect an app’s distribution model. [web:210][web:211]

### 6.6 Search, tagging, and audio understanding

- **LAION-CLAP:** https://github.com/LAION-AI/CLAP — audio/text representations for search and downstream classification; possible basis for “find a clip like this description” or prompt/reference matching. Test domain, language, and cultural biases. [web:255]
- Add local metadata features before embeddings: duration, waveform, tempo estimate, tonal estimate, speech/music label, channel count, sample rate, user tags, and production role.
- Treat model-generated tags as uncertain suggestions; keep user edits and provenance.

### 6.7 Voice and lyrics (optional subsystem)

The DAW should not be designed around artist cloning. Vocal features should be a separate, consent-aware module for original vocals, licensed voice banks, user-owned voice references, lyric timing, vocal cleanup, and synthesis/conversion where permitted.

Earlier research leads included Amphion, GTSinger, OpenSinger/M4Singer, singing technique datasets, Hindi speech datasets, and Sanskrit chant/ASR models. Keep these as **optional voice/language packs**, not the default product identity. Crucially, speech datasets are not singing datasets; chant synthesis is not pop/film singing; and a public download does not grant rights to train a commercial voice model. Validate exact dataset/model cards and get explicit artist consent where needed.

Potential language-specific add-ons include Hindi pronunciation/G2P and Sanskrit meter-aware chanting. These can coexist with other languages through a language-pack interface rather than being hard-wired into the global project schema.

## 7. Indian musical elements as an extensible pack

Indian musical ideas should enrich the DAW without defining every user’s workflow.

### Core host features that are globally useful

- Tempo and meter maps, including changing meter and additive groupings.
- Pitch lanes, note editing, MIDI, scale/mode helpers, chord/phrase markers.
- Audio reference, phrase segmentation, loop and stem editing.
- Flexible text labels and user-defined controls.
- Regionalized input: multiple scripts, transliteration, pronunciation dictionaries, and locale settings.

### Optional Indian-practice pack

- Distinct Hindustani and Carnatic terminology and workflows, with user-selected tradition/school rather than one flattened taxonomy.
- Tonic/drone, raga metadata, tala cycle/grouping, sargam, swara, konnakol/solkattu concepts where appropriate.
- Ornamentation/pitch gestures as editable lanes (e.g., meend, gamaka, kampita) with configurable notation and examples reviewed by practitioners.
- Sanskrit chant mode with meter/akshara-aware text handling as a separate use case from Hindi lyrics.
- Regionally appropriate instrument and ensemble descriptors, with transparent definitions and no “exotic” catch-all category.

### Governance

- Co-design with musicians from relevant traditions; provide attribution and compensation for contributed recordings/annotations.
- Let users disable or customize cultural presets.
- Evaluate by tradition, language, and task; do not present one model’s failure as a property of the tradition.
- Record the source and reviewer for cultural metadata and labels.

## 8. Brief-to-audio features for creative production

### Brand film and sonic branding

- Brief fields: brand traits, audience, duration, use case, emotional arc, references, sonic elements, avoid-list, delivery format.
- Motif bank: save a melodic/rhythmic motif and generate variations while preserving recognizable features.
- Deliverable matrix: 2s/5s/10s/15s/30s cutdowns, logo sting, end card, stems, loop, and alternate instrumentation.
- Track lineage showing which motif, prompt, model, and edits produced each variation.
- Rights/provenance report and editable handoff stems.

### Documentary, short film, and picture-linked scoring

- Video/audio reference lane with markers, scene cards, notes, and cue duration/entry/exit.
- Generate cue sketches against a selected scene or mood description; support video-to-audio/SFX separately from music scoring.
- Keep dialogue/reference audio intact; generate music as a separate cue track.
- Preserve timecode/markers and export cues/stems with naming conventions.
- Mood/energy curves and arc maps are optional guides—not an automatic “score the film” black box.

### Sound design and ambience

- Dedicated sound-design browser with one-shots, textures, ambience, transitions, and foley-style assets.
- Optional video/text-conditioned generation; duration and sync controls.
- Layer and process generated sounds with standard audio tools; record exact source/model and transformation chain.

## 9. Apple Silicon performance and deployment

The Mac is a target platform, not the only platform. Design a portable backend system and optimize Apple Silicon as a tested profile.

- Detect chip generation, unified memory, macOS version, backend availability, and available memory.
- Distinguish official native support (MLX/Metal/Core ML), PyTorch MPS support, CPU support, and community proof-of-concept ports.
- Keep the real-time engine responsive while models run in separate worker processes.
- Load one large model at a time by default; estimate memory and warn before concurrent loads.
- Support quantization only when quality and architecture compatibility are validated; expose quality/performance profiles.
- Cache model weights and outputs with explicit disk-location management.
- Offer “quick preview” vs “final render” settings.
- Add benchmarks per model/hardware: cold start, peak unified memory, time per output minute, cancellation, and audio-thread stability.
- Add Windows/Linux profiles over time; do not allow Apple-specific abstractions to leak into the project format.

## 10. Licensing, consent, provenance, and security

1. Verify code license, weights license, dataset license, and output terms separately.
2. Check commercial use, redistribution, derivative weights, LoRA training, attribution, and restrictions on production use.
3. Keep a software bill of materials and model/data manifest.
4. Ask before downloading large models and state size, source, license, and destination.
5. For voice cloning/conversion, require a rights/consent declaration and keep reference audio private by default.
6. Do not ship a public celebrity/artist voice catalog without permission.
7. Maintain provenance for every generated or processed artifact: source assets, prompts, model versions, adapters, and edits.
8. Treat model files and imported media as untrusted input; sandbox workers and validate file formats.
9. Make cloud backends opt-in and identify what data leaves the machine.
10. Do not claim copyright clearance or uniqueness based only on a model’s terms.

## 11. Development roadmap

### Phase 0 — repository audit and product definition

- Inspect Nadabrahma’s code, release status, modules, license, project format, audio engine, tests, and Mac behavior.
- Compare it with theDAW’s current workspaces and modules; learn from breadth but avoid feature-copy scope creep.
- Write target user journeys for a brand cue, a film cue, a sound effect, and a song.
- Agree on supported OS/hardware tiers and whether cloud providers are in scope.

### Phase 1 — reliable audio foundation

- Native-feeling timeline with import, play, cut, move, fades, gain, pan, mute/solo, loops, undo/redo, save/reopen, and WAV export.
- Session format with stable asset references and generated-take lineage.
- Core DSP mixer, meters, automation, and background task queue.
- Basic screenshot/smoke tests and a small sample project.

### Phase 2 — first generative vertical slice

- Add one music model adapter and one sound-effects adapter if platform budgets permit.
- Expose model capabilities, prompt/reference, duration, seed, and progress.
- Generate multiple takes; compare; place selected output at playhead or in a selected region.
- Save prompt/model/version/seed/provenance and support cancellation.
- Make UI text clear about one-mix output versus native multi-stems.

### Phase 3 — iterative editing and stems

- Add region continuation/inpainting only for supported backends.
- Add separation as an optional post-process with “estimated stems” labels.
- Add clip-level replacement, alternate takes, A/B comparison, and stem export.
- Add tempo/beat analysis as editable estimates.

### Phase 4 — production workflows

- Brand brief/cutdown workflow and film cue/marker workflow.
- Sound-design browser and optional video-to-audio adapter.
- Mix/export profiles and QC reports.
- Project bundle export and handoff to existing DAWs.

### Phase 5 — optional specialized packs

- Voice synthesis/conversion with consent, licensed voice libraries, Hindi/Sanskrit language tools, and other language packs.
- Indian musical concepts pack, developed with practitioners.
- Genre/region-specific datasets and benchmarks with transparent licensing.
- Agent/copilot that proposes reversible edits from live project state.

## 12. Evaluation plan

### Product quality

- Time to first playable result; time to a usable cue; number of iterations to a chosen result.
- User ability to identify and alter the relevant part without regenerating everything.
- Project save/reopen reliability; undo/redo correctness; export correctness.
- Professional user ratings for editability, predictability, creative usefulness, and audio quality.

### Model/backend quality

- Task-specific: song coherence, lyric fidelity, sound-event alignment, motif preservation, loopability, edit/inpaint seam quality.
- Production suitability: duration accuracy, clipping, silence, stereo behavior, sample-rate consistency, export artifacts.
- Hardware: cold/warm startup, peak unified memory, generation speed, cancellations and crashes, audio dropouts.
- Cultural/language: separate musician review for each language/tradition and task; report uncertainty and avoid one global score.
- Fairness: compare outcomes across genres, regions, languages, and prompt types using appropriate consented/rights-cleared references.

### Data quality

- Record which evaluation examples are licensed/consented.
- Keep generated evaluation outputs separate from training/evaluation reference material.
- Track model revision, quantization, prompt, and hardware so results are reproducible.

## 13. IDE-agent instructions

- First inspect the existing Nadabrahma repository and report what it actually contains; do not infer from the project name.
- Treat this brief as direction, not permission to rewrite everything. Map current architecture and preserve working features.
- Before coding, identify the current stack, license, target Apple chip/RAM, audio engine, project schema, and test commands.
- Build one tested end-to-end vertical slice before adding agents, multiple models, or cultural packs.
- Keep real-time audio code separate from Python/model inference; never block the audio callback with I/O, locks, network requests, or model loading.
- Implement typed adapter interfaces and capability declarations. Mock backends in tests.
- Every model operation should be asynchronous, cancelable, logged, and reversible at the project level.
- Keep optional model weights out of Git. Show model size and licenses before download.
- Use standard audio formats and document conversion behavior.
- Do not hard-code Indian music as the DAW’s only purpose. Implement it as an optional, rich pack within a general global-production workflow.
- Do not hard-code “world music” as a single genre. Use precise user-controlled context and practitioner-reviewed metadata.
- Do not implement artist voice cloning without explicit rights/consent checks.
- Add tests for serialization, transport stability, adapter error/cancel paths, audio conversion, project portability, and provenance.
- Track assumptions and decisions in `docs/decisions/`.

## 14. Candidate repo review template

| Field | Review question |
|---|---|
| Role | DAW, audio engine, model, dataset, DSP, UI reference, research implementation, or bridge? |
| Upstream | Is this the official source? Is it maintained and actively released? |
| License | Code, weights, data, output terms, commercial use, attribution, redistribution? |
| Hardware | Native Apple Silicon, MPS, MLX, Core ML, CPU, CUDA, remote only? Tested on which Mac/RAM? |
| Interface | Python API, REST, CLI, plugin, node graph, file watcher, Swift/C++ library? |
| Task | Music song, instrumental, vocals, sound effects, ambience, separation, mixing, analysis? |
| Control | Lyrics, MIDI, prompt, reference audio/video, timeline region, stems, duration, seed? |
| Audio | Sample rate, channels, alignment, latency, maximum duration, file formats? |
| Resources | Model download, peak RAM, cold start, inference throughput, dependency size? |
| Data/rights | Training data disclosure, voice consent, cultural coverage, restrictions? |
| Integration | Process isolation, API stability, failure handling, UI complexity, platform conflicts? |
| Decision | Adopt, wrap as optional adapter, prototype, defer, or reject—with reason. |

## 15. First milestone recommendation

Build a small, complete, non-destructive production loop:

1. Open/create a project and import an audio reference.
2. Add markers and a short creative brief.
3. Generate a music cue from one verified backend; show progress and allow cancel.
4. Import the result as a new clip/take, compare with the reference, and edit it on the timeline.
5. Apply basic gain/EQ/fade, play without dropouts, save/reopen, and export WAV.
6. Preserve prompt, model/version, seed, source references, rights metadata, and edit lineage.
7. Repeat with a sound-design model as a separate task, not as another music “style.”
8. Test the workflow on the target Apple Silicon device and report memory, latency, and limitations.

Only after this works should the project add multi-agent orchestration, many model integrations, advanced vocal cloning, and tradition-specific composition assistance.
