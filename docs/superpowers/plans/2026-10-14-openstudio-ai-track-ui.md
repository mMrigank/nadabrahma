# OpenStudio AI Track & Generation Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

---

## Architecture & Visual Mapping

This plan implements the exact workflow and visual hierarchy requested by the user based on the 4 reference screenshots:
1. **Top Menu Bar & Insert Dropdown (Image 1 & 2):**
   - Clean top menu bar: `File`, `Edit`, `View`, `Insert`, `Options`, `Help`.
   - Clicking `Insert` opens the dropdown containing:
     - `Media file...` (Insert)
     - `New Audio Track` (Cmd+T)
     - `New MIDI Track` (Cmd+Shift+T)
     - `Virtual Instrument on New Track...`
     - **`New AI Track` (Cmd+Ctrl+T)** — Inserts an AI track and immediately opens the AI Generation modal.
     - `New Bus/Group Track`, `Create Bus from Selected Tracks`, `Insert Multiple Tracks...`, `Empty Item`, `Empty MIDI Clip`.
2. **AI Generation Modal (Image 3):**
   - Clean dark modal titled `AI Generation`.
   - Status badges: `[ ✨ AI TRACK ]` and `[ 🟢 READY ]`.
   - Track title heading (`AI 1`) and subtitle: *"Generate a fresh music clip from a detailed style and arrangement prompt."*
   - Model dropdown (`ACE-Step 1.5 XL Turbo`, `Stable Audio 3 Medium`, `YuE 2 Foundation`, `MiniMax Music 3`, `VocalRender / SVS (48kHz)`).
   - Workflow dropdown (`Text to Music`, `Audio to Audio / Stem Inpainting`, `Lyrics to Singing Voice (SVS)`).
   - Model version selector (`Original — full precision`, `Q4_0 Quantized (Low VRAM)`, `Q8_0 Quantized`).
   - Hardware check card: *"Hardware check — estimated to fit"*, `[ Refresh hardware check ]`, Apple Metal · BF16, Unified memory visual bar (Estimated need vs Available now).
   - Prompt & Lyrics textareas with section tags (`[verse]`, `[chorus]`) and Indian classical raga tags.
   - `[ Close ]` and `[ Generate ]` action buttons.
3. **Interactive Timeline AI Track Header (Image 4):**
   - Yellow accent indicator bar.
   - `[ ✨ AI ]` badge + editable track name + channel config toggle `[ 🎛 ]`.
   - Controls: Volume dial `( V )`, Pan dial `( P )`, `[ M ]` (Mute), `[ S ]` (Solo), `[ FX ]` (Plugin rack), `[ ⏻ ]` (Power).
   - **Model Name Bar / Pill:** Clickable pill displaying `[ ACE-STEP / TEXT TO MUSIC ]` with `Ready` status badge.
   - **Clicking the Model Name Bar opens the AI Generation modal pre-populated for this track.**
4. **Timeline Center Watermark (Image 1):**
   - Displays *"Start creating"* with *"Drag audio files here or press Cmd+T to add a track"* when 0 tracks are present.

---

## File Structure Plan

- **`app/src/types/daw.ts`**: Add `isAITrack?: boolean`, `aiModelName?: string`, `aiWorkflow?: string`, `aiModelVersion?: string`, `aiPrompt?: string`, `aiLyrics?: string`, `aiStatusState?: 'ready' | 'generating' | 'loading' | 'error'` to `Track` interface.
- **`app/src/components/layout/TopMenuBar.tsx`**: New component implementing the clean desktop menu bar (`File`, `Edit`, `View`, `Insert`, `Options`, `Help`) and the `Insert` dropdown menu matching Image 1 & 2.
- **`app/src/components/AIGenerationModal.tsx`**: New dedicated component rendering the exact AI Generation modal layout from Image 3.
- **`app/src/components/Timeline.tsx`**: Update left track header to render the Image 4 AI track styling with the interactive `[ ACE-STEP / TEXT TO MUSIC ]` pill button and empty-state watermark from Image 1.
- **`app/src/components/HeaderHUD.tsx`**: Embed `TopMenuBar` seamlessly at the top of the DAW window.
- **`app/src/App.tsx`**: Wire up `AIGenerationModal` state, `handleCreateAITrack`, and keyboard shortcut `Cmd+Ctrl+T`.

---

## Tasks

### Task 1: Extend Track Type & AI Generation State Models
- [x] Add AI generation fields to `Track` in `app/src/types/daw.ts`:
  - `aiModelName`: `'ACE-Step 1.5 XL Turbo' | 'Stable Audio 3 Medium' | 'YuE 2 Foundation' | 'MiniMax Music 3' | 'VocalRender / SVS (48kHz)'`
  - `aiWorkflow`: `'Text to Music' | 'Audio to Audio' | 'Lyrics to Singing Voice (SVS)'`
  - `aiModelVersion`: `'Original — full precision' | 'Q4_0 Quantized (Low VRAM)' | 'Q8_0 Quantized'`
  - `aiPrompt`: string
  - `aiLyrics`: string
  - `aiStatusState`: `'ready' | 'generating' | 'loading' | 'error'`
- [x] Verify TypeScript types compile cleanly with `npm run build`.

### Task 2: Build the Clean Top Menu Bar & "Insert" Dropdown (`TopMenuBar.tsx`)
- [x] Create `app/src/components/layout/TopMenuBar.tsx` with:
  - Menu triggers: `File`, `Edit`, `View`, `Insert`, `Options`, `Help`.
  - Dropdown menu for `Insert` matching Image 2:
    - `Media file...` (calls file import)
    - `New Audio Track` (Cmd+T)
    - `New MIDI Track` (Cmd+Shift+T)
    - `Virtual Instrument on New Track...`
    - `New AI Track` (Cmd+Ctrl+T) (creates AI track & opens modal)
    - `New Bus/Group Track`, `Create Bus from Selected Tracks`, `Insert Multiple Tracks...`, `Empty Item`, `Empty MIDI Clip`.
  - Global keyboard listener for `Cmd+Ctrl+T` / `Ctrl+Alt+T` to trigger `New AI Track`.
  - Click-outside dismiss handler for menus.
- [x] Test component in isolation and verify `npm run build`.

### Task 3: Build the Dedicated "AI Generation" Modal (`AIGenerationModal.tsx`)
- [x] Create `app/src/components/AIGenerationModal.tsx` faithfully replicating Image 3:
  - Header with title "AI Generation" and Close `[X]` button.
  - Subhead badges: `[ ✨ AI TRACK ]` and `[ 🟢 READY ]`.
  - Track title (`AI 1` or track name) and descriptive subtitle.
  - Dropdowns for Model, Workflow, and Model Version.
  - "Hardware check — estimated to fit" card with:
    - `[ Refresh hardware check ]` button.
    - Apple Metal · BF16 status.
    - Unified system memory progress bar & numerical display (Estimated need: 13.324 GiB | Available now: 14.663 GiB).
    - Explanatory hardware guidance text.
  - PROMPT section:
    - "Prompt" textarea (pre-populated with track's prompt or default rock/acoustic/Indian raga prompt).
    - "Lyrics" textarea with `[verse]` / `[chorus]` syntax.
  - Footer actions: `[ Close ]` and blue primary `[ Generate ]` button.
  - Integration with `audioEngine` and `nadBackend` to trigger synthesis and update progress.
- [x] Verify `npm run build` passes.

### Task 4: Implement AI Track Header & Model Name Bar in `Timeline.tsx`
- [x] Update `app/src/components/Timeline.tsx`:
  - In track header: detect if track is an AI track or has an AI model assigned.
  - Render yellow accent border strip on left edge as shown in Image 4.
  - Render `[ ✨ AI ]` icon badge before track name.
  - Render Dials: Volume `( V )`, Pan `( P )`, Mute `[ M ]`, Solo `[ S ]` (yellow active), FX `[ FX ]`, Power `[ ⏻ ]`.
  - Render the **Model Name Bar / Pill**:
    - Button styled as: `[ ACE-STEP / TEXT TO MUSIC ]`
    - Status text: `Ready` (or `Generating...`)
    - `onClick`: Calls `onOpenAIGenerationModal(track.id)`.
  - Add the Image 1 Center Empty State Watermark:
    - When `tracks.length === 0`: render center logo, *"Start creating"*, *"Drag audio files here or press Cmd+T to add a track"*, *"Use Insert to import media or Ctrl+O to open a project"*.
    - Render `+ Add Track` button at top left.
- [x] Verify `npm run build` passes.

### Task 5: Integration, End-to-End Wiring & Verification
- [x] In `app/src/components/HeaderHUD.tsx`: integrate `TopMenuBar` at the top.
- [x] In `app/src/App.tsx`:
  - Add state for `isAIGenerationModalOpen` and `aiGenerationModalTrackId`.
  - Implement `handleCreateAITrack()`: adds a new track titled `AI 1` (or `AI 2`) with role `solo_instrument`/`ambient_pad`, model `ace_step`, and immediately opens the modal.
  - Wire `onOpenAIGenerationModal: (trackId: string) => void`.
  - Handle `Generate` action: synthesize audio stem, mount clip to the timeline track at Bar 1, and show completion toast.
- [x] Run full test build: `npm run build`.
- [x] Verify in browser or preview that all 4 image states work seamlessly.
