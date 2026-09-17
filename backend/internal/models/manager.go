// Package models provides the lifecycle manager and adapters for all
// audio.cpp-backed AI generation models in the Nāḍ backend.
//
// Architecture principle: only ONE heavy model is loaded into Apple Silicon
// Unified Memory at a time. Loading a new model first gracefully unloads the
// currently resident one, then checks that the UMA ceiling (14 GB) will not
// be breached before spawning the audio.cpp child process.
package models

import (
	"context"
	"fmt"
	"log/slog"
	"sync"

	"github.com/nad-daw/backend/internal/memory"
)

// ModelID identifies a supported AI model.
type ModelID string

const (
	ModelYuE2         ModelID = "yue_2"
	ModelMiniMax3     ModelID = "minimax_3"
	ModelACEStep      ModelID = "ace_step"
	ModelStableAudio3 ModelID = "stable_audio_3" // Medium only
)

// State represents the lifecycle state of a model.
type State string

const (
	StateUnloaded   State = "unloaded"
	StateLoading    State = "loading"
	StateReady      State = "ready"
	StateGenerating State = "generating"
	StateUnloading  State = "unloading"
	StateError      State = "error"
)

// ModelInfo describes a registered model's metadata.
type ModelInfo struct {
	ID          ModelID
	Name        string
	MemoryGB    float64 // Expected peak UMA footprint when loaded
	WeightsPath string  // Absolute path to GGUF weights on disk
	State       State
}

// GenerateRequest carries all parameters needed to run inference.
type GenerateRequest struct {
	ModelID  ModelID
	Prompt   string
	Lyrics   string
	Tags     string
	DurationSec float64
	SampleRate  int // Target: 96000
}

// GenerateResult holds the completed audio payload.
type GenerateResult struct {
	ModelID    ModelID
	AudioWAV   []byte // Raw WAV bytes at 48kHz (upsampled to 96kHz in frontend)
	DurationSec float64
}

// Adapter is the interface each model adapter must implement.
type Adapter interface {
	Info() ModelInfo
	// Generate runs the model, streams progress via progressCh (0.0–1.0),
	// and returns the final WAV bytes.
	Generate(ctx context.Context, req GenerateRequest, progressCh chan<- float64) ([]byte, error)
}

// Manager is the single-active-slot model lifecycle manager.
type Manager struct {
	mu       sync.Mutex
	adapters map[ModelID]Adapter
	active   ModelID // currently loaded model ("" if none)
	states   map[ModelID]State
}

// NewManager creates a Manager and registers all supported adapters.
// weightsDir is the parent directory, e.g. ~/.nad/models.
func NewManager(weightsDir string) *Manager {
	m := &Manager{
		adapters: make(map[ModelID]Adapter),
		states:   make(map[ModelID]State),
	}
	m.register(NewYuE2Adapter(weightsDir))
	m.register(NewMiniMax3Adapter(weightsDir))
	m.register(NewACEStepAdapter(weightsDir))
	m.register(NewStableAudio3Adapter(weightsDir))
	return m
}

func (m *Manager) register(a Adapter) {
	id := a.Info().ID
	m.adapters[id] = a
	m.states[id] = StateUnloaded
}

// States returns a snapshot of all model states.
func (m *Manager) States() map[ModelID]State {
	m.mu.Lock()
	defer m.mu.Unlock()
	out := make(map[ModelID]State, len(m.states))
	for k, v := range m.states {
		out[k] = v
	}
	return out
}

// Infos returns ModelInfo for all registered models.
func (m *Manager) Infos() []ModelInfo {
	m.mu.Lock()
	defer m.mu.Unlock()
	out := make([]ModelInfo, 0, len(m.adapters))
	for id, a := range m.adapters {
		info := a.Info()
		info.State = m.states[id]
		out = append(out, info)
	}
	return out
}

// Generate runs the requested model. It handles the full lifecycle:
// 1. Unloads the currently active model if it differs from the requested one.
// 2. Checks that loading will not breach the 14 GB memory ceiling.
// 3. Marks the model as generating, runs inference, then marks it unloaded.
//
// progressCh receives float64 values in [0.0, 1.0] during generation.
func (m *Manager) Generate(ctx context.Context, req GenerateRequest, progressCh chan<- float64) (*GenerateResult, error) {
	m.mu.Lock()

	adapter, ok := m.adapters[req.ModelID]
	if !ok {
		m.mu.Unlock()
		return nil, fmt.Errorf("model %q is not registered", req.ModelID)
	}
	info := adapter.Info()

	// Unload the currently active model if it is different.
	if m.active != "" && m.active != req.ModelID {
		slog.Info("unloading current model before loading new one",
			"current", m.active, "next", req.ModelID)
		m.states[m.active] = StateUnloading
		m.active = ""
		// audio.cpp processes self-terminate when generation is complete;
		// there is no persistent resident process to kill here.
		m.states[m.active] = StateUnloaded
	}

	// Check UMA ceiling before loading.
	wouldExceed, stats, err := memory.WouldExceedCeiling(info.MemoryGB)
	if err != nil {
		m.mu.Unlock()
		return nil, fmt.Errorf("memory check failed: %w", err)
	}
	if wouldExceed {
		m.mu.Unlock()
		return nil, fmt.Errorf(
			"loading %s (%.1f GB) would exceed the %.0f GB ceiling — current usage: %.1f GB",
			info.Name, info.MemoryGB, memory.CeilingGB, stats.UsedGB,
		)
	}

	m.states[req.ModelID] = StateLoading
	m.active = req.ModelID
	m.mu.Unlock()

	slog.Info("starting generation",
		"model", req.ModelID,
		"memoryGB", info.MemoryGB,
		"systemUsedGB", stats.UsedGB,
	)

	// Run inference (audio.cpp child process spawned inside Generate).
	m.setStateUnlocked(req.ModelID, StateGenerating)
	wav, err := adapter.Generate(ctx, req, progressCh)

	// Always unload after generation — models are strictly on-demand.
	m.setStateUnlocked(req.ModelID, StateUnloaded)
	m.mu.Lock()
	m.active = ""
	m.mu.Unlock()

	if err != nil {
		return nil, fmt.Errorf("model %s generation failed: %w", req.ModelID, err)
	}

	slog.Info("generation complete, model unloaded", "model", req.ModelID)

	return &GenerateResult{
		ModelID:     req.ModelID,
		AudioWAV:    wav,
		DurationSec: req.DurationSec,
	}, nil
}

func (m *Manager) setStateUnlocked(id ModelID, s State) {
	m.mu.Lock()
	m.states[id] = s
	m.mu.Unlock()
}
