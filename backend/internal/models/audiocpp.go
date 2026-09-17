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
	"sync"
	"time"
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

	specDir := filepath.Join(os.Getenv("HOME"), ".nad", "model_specs")
	if _, err := os.Stat(specDir); err != nil {
		specDir = filepath.Join(os.Getenv("HOME"), ".nad", "build", "audio.cpp", "model_specs")
	}

	// Prepare Renders directory
	rendersDir := "/Users/mrigank/.gemini/antigravity-ide/scratch/nadabrahma/Renders"
	_ = os.MkdirAll(rendersDir, 0755)

	outFilename := fmt.Sprintf("Render_%s.wav", time.Now().Format("20060102_150405"))
	outPath := filepath.Join(rendersDir, outFilename)

	// Replace --out argument or append it to target Renders/ folder
	var resolvedArgs []string
	hasOut := false
	for i := 0; i < len(args); i++ {
		if args[i] == "--out" {
			hasOut = true
			resolvedArgs = append(resolvedArgs, "--out", outPath)
			if i+1 < len(args) {
				i++ // skip previous value (e.g. "-")
			}
		} else {
			resolvedArgs = append(resolvedArgs, args[i])
		}
	}
	if !hasOut {
		resolvedArgs = append(resolvedArgs, "--out", outPath)
	}

	fullArgs := []string{"--model-spec-override", specDir}
	fullArgs = append(fullArgs, resolvedArgs...)

	cmd := exec.CommandContext(ctx, binary, fullArgs...)
	cmd.Env = append(os.Environ(),
		"GGML_METAL=1",        // Enable Metal GPU acceleration
		"GGML_METAL_FULL_OFFLOAD=1", // Fully offload layers to Metal
	)

	// Capture stdout (framework text logs) into a buffer.
	var stdoutBuf bytes.Buffer
	cmd.Stdout = &stdoutBuf

	// Read stderr line-by-line for progress reporting.
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return nil, fmt.Errorf("audiocpp stderr pipe: %w", err)
	}

	slog.Info("spawning audio.cpp", "binary", binary, "args", resolvedArgs, "outPath", outPath)
	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("audiocpp start: %w", err)
	}

	// Parse progress from stderr in a goroutine and capture errors.
	var lastStderr string
	var stderrMu sync.Mutex
	go func() {
		scanner := bufio.NewScanner(stderr)
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			if line != "" {
				stderrMu.Lock()
				lastStderr = line
				stderrMu.Unlock()
			}
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
			slog.Debug("audiocpp", "stderr", line)
		}
	}()

	// Wait for completion or context cancellation.
	if err := cmd.Wait(); err != nil {
		if ctx.Err() != nil {
			return nil, fmt.Errorf("generation cancelled: %w", ctx.Err())
		}
		stderrMu.Lock()
		errMsg := lastStderr
		stderrMu.Unlock()
		if errMsg != "" {
			return nil, fmt.Errorf("audiocpp exited with error: %s (%w)", errMsg, err)
		}
		return nil, fmt.Errorf("audiocpp exited with error: %w", err)
	}

	// Read the rendered WAV audio file from Renders directory
	wavBytes, err := os.ReadFile(outPath)
	if err != nil || len(wavBytes) < 44 {
		wavBytes = stdoutBuf.Bytes()
	}

	if len(wavBytes) < 44 {
		return nil, fmt.Errorf("audiocpp produced no audio output (file %s had %d bytes)", outPath, len(wavBytes))
	}

	// Mirror to Obsidian DAW Renders folder
	obsidianRenders := "/Users/mrigank/Documents/Daw/DAW/Renders"
	if mkErr := os.MkdirAll(obsidianRenders, 0755); mkErr == nil {
		_ = os.WriteFile(filepath.Join(obsidianRenders, outFilename), wavBytes, 0644)
	}

	slog.Info("audio.cpp generation complete and saved to Renders", "path", outPath, "bytes", len(wavBytes))
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
