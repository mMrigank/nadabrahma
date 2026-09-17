// minimax3.go — MiniMax Music 3 GGUF adapter for audio.cpp.
// MiniMax 3 is the backup instrumental model (alternate iterations).
// Memory footprint: ~9.5 GB on Apple Silicon UMA.
package models

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
)

// MiniMax3Adapter runs MiniMax Music 3 via audio.cpp GGUF.
type MiniMax3Adapter struct {
	weightsDir string
}

func NewMiniMax3Adapter(weightsDir string) *MiniMax3Adapter {
	return &MiniMax3Adapter{weightsDir: weightsDir}
}

func (a *MiniMax3Adapter) Info() ModelInfo {
	return ModelInfo{
		ID:          ModelMiniMax3,
		Name:        "MiniMax Music 3 (GGUF)",
		MemoryGB:    9.5,
		WeightsPath: filepath.Join(a.weightsDir, "minimax3"),
		State:       StateUnloaded,
	}
}

// Generate runs MiniMax Music 3 via audio.cpp.
// MiniMax Music 3 uses a component-based GGUF package directory,
// so --model points to the directory, not a single .gguf file.
func (a *MiniMax3Adapter) Generate(ctx context.Context, req GenerateRequest, progressCh chan<- float64) ([]byte, error) {
	weightsPath := filepath.Join(a.weightsDir, "minimax3")
	if _, err := os.Stat(weightsPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("MiniMax Music 3 weights not found at %s — run backend/scripts/install_minimax3.sh", weightsPath)
	}

	// MiniMax Music 3 supports lyrics + style caption conditioning.
	// The GGUF package directory is passed as --model.
	args := []string{
		"--task", "gen",
		"--family", "minimax_music3",
		"--model", weightsPath,
		"--backend", "metal",
		"--duration-seconds", fmt.Sprintf("%.0f", req.DurationSec),
		"--out", "-",
	}

	if req.Tags != "" {
		args = append(args, "--text", req.Tags)
	}
	if req.Lyrics != "" {
		args = append(args, "--request-option", fmt.Sprintf("lyrics=%s", req.Lyrics))
	}

	return runAudioCpp(ctx, args, progressCh)
}
