// yue2.go — YuE2 3B BF16 adapter for audio.cpp.
// YuE2 is the PRIMARY instrumental generation model.
// Runs via audio.cpp with BF16 precision for full tonal fidelity.
// Memory footprint: ~6.5 GB on Apple Silicon UMA.
package models

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
)

// YuE2Adapter runs YuE2 3B in BF16 via audio.cpp.
type YuE2Adapter struct {
	weightsDir string
}

// NewYuE2Adapter creates a new YuE2 adapter.
// weightsDir is the parent directory; weights live in weightsDir/yue2/.
func NewYuE2Adapter(weightsDir string) *YuE2Adapter {
	return &YuE2Adapter{weightsDir: weightsDir}
}

func (a *YuE2Adapter) Info() ModelInfo {
	return ModelInfo{
		ID:          ModelYuE2,
		Name:        "YuE2 3B BF16",
		MemoryGB:    6.5,
		WeightsPath: filepath.Join(a.weightsDir, "yue2"),
		State:       StateUnloaded,
	}
}

// Generate runs YuE2 generation via audio.cpp and returns WAV bytes.
// The prompt must be a dual-conditioned string produced by prompt.Builder:
//   "[genre tags]\n\n[lyrics or instrumental instructions]"
func (a *YuE2Adapter) Generate(ctx context.Context, req GenerateRequest, progressCh chan<- float64) ([]byte, error) {
	weightsPath := filepath.Join(a.weightsDir, "yue2")
	if _, err := os.Stat(weightsPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("YuE2 weights not found at %s — run backend/scripts/install_yue2.sh", weightsPath)
	}

	// audio.cpp CLI for YuE2:
	// audiocpp_cli --task gen --family yue2 --model <weights_dir> \
	//              --backend metal \
	//              --request-option style="<style tags>" \
	//              --lyrics "<lyrics or instrumental text>" \
	//              --duration <seconds> \
	//              --out -
	style := req.Tags
	if style == "" {
		style = "cinematic, expressive"
	}
	lyrics := req.Lyrics
	if lyrics == "" {
		lyrics = "[Instrumental]"
	}
	args := []string{
		"--task", "gen",
		"--family", "yue2",
		"--model", weightsPath,
		"--backend", "metal",
		"--request-option", fmt.Sprintf("style=%s", style),
		"--lyrics", lyrics,
		"--duration-seconds", fmt.Sprintf("%.0f", req.DurationSec),
		"--out", "-", // stream WAV to stdout
	}

	return runAudioCpp(ctx, args, progressCh)
}
