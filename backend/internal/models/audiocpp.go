// audiocpp.go provides shared utilities for spawning and streaming
// audio.cpp child processes for all model adapters.
package models

import (
	"bufio"
	"bytes"
	"context"
	"fmt"
	"io"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
)

// AudioCppBinary is the name of the audio.cpp CLI binary.
// Resolved via PATH; install with: brew install audio-cpp (or build from source).
const AudioCppBinary = "audiocpp"

// runAudioCpp spawns an audio.cpp child process with the given arguments,
// streams stderr for progress updates, and returns stdout as WAV bytes.
//
// audio.cpp writes raw WAV to stdout and progress lines to stderr in the form:
//   progress: 0.42
func runAudioCpp(ctx context.Context, args []string, progressCh chan<- float64) ([]byte, error) {
	binary, err := exec.LookPath(AudioCppBinary)
	if err != nil {
		// Fallback: try common Homebrew locations on Apple Silicon
		candidates := []string{
			"/opt/homebrew/bin/audiocpp",
			"/usr/local/bin/audiocpp",
			filepath.Join(os.Getenv("HOME"), ".nad", "bin", "audiocpp"),
			filepath.Join(os.Getenv("HOME"), ".nad", "bin", "audiocpp_cli"),
			filepath.Join(os.Getenv("HOME"), ".nad", "build", "audio.cpp", "build", "bin", "audiocpp_cli"),
		}
		for _, c := range candidates {
			if _, statErr := os.Stat(c); statErr == nil {
				binary = c
				break
			}
		}
		if binary == "" {
			return nil, fmt.Errorf("audiocpp binary not found in PATH or ~/.nad/bin/. Run backend/scripts/install_audiocpp.sh")
		}
	}

	cmd := exec.CommandContext(ctx, binary, args...)
	cmd.Env = append(os.Environ(),
		"GGML_METAL=1",        // Enable Metal GPU acceleration
		"GGML_METAL_FULL_OFFLOAD=1", // Fully offload layers to Metal
	)

	// Capture stdout (WAV audio) into a buffer.
	var wavBuf bytes.Buffer
	cmd.Stdout = &wavBuf

	// Read stderr line-by-line for progress reporting.
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return nil, fmt.Errorf("audiocpp stderr pipe: %w", err)
	}

	slog.Info("spawning audio.cpp", "binary", binary, "args", args)
	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("audiocpp start: %w", err)
	}

	// Parse progress from stderr in a goroutine.
	go parseProgress(stderr, progressCh)

	// Wait for completion or context cancellation.
	if err := cmd.Wait(); err != nil {
		if ctx.Err() != nil {
			return nil, fmt.Errorf("generation cancelled: %w", ctx.Err())
		}
		return nil, fmt.Errorf("audiocpp exited with error: %w", err)
	}

	wavBytes := wavBuf.Bytes()
	if len(wavBytes) < 44 {
		return nil, fmt.Errorf("audiocpp produced no audio output (stdout was empty)")
	}

	slog.Info("audio.cpp generation complete", "wavBytes", len(wavBytes))
	return wavBytes, nil
}

// parseProgress reads audio.cpp stderr lines and sends progress values to the channel.
func parseProgress(r io.Reader, progressCh chan<- float64) {
	scanner := bufio.NewScanner(r)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		// audio.cpp progress format: "progress: 0.42" or "Progress: 42%"
		if strings.HasPrefix(line, "progress:") || strings.HasPrefix(line, "Progress:") {
			parts := strings.Fields(line)
			if len(parts) >= 2 {
				valStr := strings.TrimSuffix(parts[1], "%")
				val, err := strconv.ParseFloat(valStr, 64)
				if err == nil {
					if val > 1.0 { // percentage format
						val /= 100.0
					}
					if progressCh != nil {
						select {
						case progressCh <- val:
						default:
						}
					}
				}
			}
		}
		// Always log stderr for debugging.
		slog.Debug("audiocpp", "stderr", line)
	}
}

// weightsPath builds the full path to model weights given the base directory.
func weightsPath(weightsDir, modelSubDir, filename string) string {
	return filepath.Join(weightsDir, modelSubDir, filename)
}
