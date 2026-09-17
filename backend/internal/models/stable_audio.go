// stable_audio.go — Stable Audio 3 MEDIUM GGUF adapter for audio.cpp.
// Used for: cinematic textures, ambient pads, risers/drops, somatic sub-bass.
// The Small variant is EXCLUDED (mushy tonal contrast).
// Memory footprint: ~4.5 GB (Medium) on Apple Silicon UMA.
package models

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
)

// StableAudio3Adapter runs Stable Audio 3 Medium via audio.cpp GGUF.
type StableAudio3Adapter struct {
	weightsDir string
}

func NewStableAudio3Adapter(weightsDir string) *StableAudio3Adapter {
	return &StableAudio3Adapter{weightsDir: weightsDir}
}

func (a *StableAudio3Adapter) Info() ModelInfo {
	return ModelInfo{
		ID:          ModelStableAudio3,
		Name:        "Stable Audio 3 Medium (GGUF)",
		MemoryGB:    4.5, // Medium model; Small variant excluded
		WeightsPath: filepath.Join(a.weightsDir, "stable-audio-3"),
		State:       StateUnloaded,
	}
}

// Generate runs Stable Audio 3 Medium via audio.cpp.
// Supports:
//   - Hypersonic air textures (20kHz–48kHz via prompt tags)
//   - Somatic infrasound pads (10Hz–20Hz sub-bass)
//   - Cinematic risers, drops, and ambient soundscapes
//   - Negative prompting to prevent muddy mids (key differentiator vs Small)
func (a *StableAudio3Adapter) Generate(ctx context.Context, req GenerateRequest, progressCh chan<- float64) ([]byte, error) {
	weightsDir := filepath.Join(a.weightsDir, "stable-audio-3")
	targetFile := filepath.Join(weightsDir, "stable-audio-3-medium.gguf")
	if _, err := os.Stat(targetFile); err == nil {
		weightsDir = targetFile
	} else if _, err := os.Stat(weightsDir); os.IsNotExist(err) {
		return nil, fmt.Errorf("Stable Audio 3 weights not found at %s — run backend/scripts/install_stable_audio.sh", weightsDir)
	}

	args := []string{
		"--task", "gen",
		"--family", "stable_audio",
		"--model", weightsDir,
		"--backend", "metal",
		"--text", req.Prompt,
		"--duration-seconds", fmt.Sprintf("%.0f", req.DurationSec),
		"--out", "-",
	}

	return runAudioCpp(ctx, args, progressCh)
}
