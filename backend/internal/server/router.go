// Package server implements the HTTP and WebSocket server for the Nāḍ
// backend broker. It routes REST requests and WebSocket connections
// to the model manager and prompt builder.
package server

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/nad-daw/backend/internal/memory"
	"github.com/nad-daw/backend/internal/models"
)

// Handler holds all server dependencies.
type Handler struct {
	manager *models.Manager
}

// NewHandler creates a new Handler.
func NewHandler(manager *models.Manager) *Handler {
	return &Handler{manager: manager}
}

// NewRouter builds and returns the full Chi router with all routes registered.
func NewRouter(h *Handler) http.Handler {
	r := chi.NewRouter()

	// Middleware stack
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(corsMiddleware)

	// REST API
	r.Route("/api/v1", func(r chi.Router) {
		r.Post("/generate", h.handleGenerate)
		r.Get("/models", h.handleListModels)
		r.Get("/memory", h.handleMemory)
	})

	// WebSocket endpoint for real-time progress + audio streaming
	r.Get("/ws", h.handleWebSocket)

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	return r
}

// corsMiddleware allows the Vite dev server (localhost:5173) and any
// production origin to connect. Adjust in production.
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// ---- REST Handlers ----

// GenerateRequest is the JSON body for POST /api/v1/generate.
type GenerateRequest struct {
	ModelID     string  `json:"modelId"`
	TrackID     string  `json:"trackId"`
	Prompt      string  `json:"prompt"`
	Tags        string  `json:"tags"`
	Lyrics      string  `json:"lyrics"`
	DurationSec float64 `json:"durationSec"`
}

func (h *Handler) handleGenerate(w http.ResponseWriter, r *http.Request) {
	var req GenerateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON: " + err.Error()})
		return
	}

	if req.ModelID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "modelId is required"})
		return
	}
	if req.DurationSec <= 0 || req.DurationSec > 300 {
		req.DurationSec = 30 // default 30 seconds
	}

	genReq := models.GenerateRequest{
		ModelID:     models.ModelID(req.ModelID),
		Prompt:      req.Prompt,
		Tags:        req.Tags,
		Lyrics:      req.Lyrics,
		DurationSec: req.DurationSec,
		SampleRate:  48000,
	}

	// Run generation synchronously (for REST endpoint).
	// For streaming progress, use the WebSocket endpoint instead.
	progressCh := make(chan float64, 10)
	go func() {
		// Drain progress channel (not relayed over REST, use WS for that).
		for range progressCh {
		}
	}()

	result, err := h.manager.Generate(r.Context(), genReq, progressCh)
	close(progressCh)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	// Return the WAV as binary with appropriate headers.
	w.Header().Set("Content-Type", "audio/wav")
	w.Header().Set("Content-Length", string(rune(len(result.AudioWAV))))
	w.Header().Set("X-Model-ID", string(result.ModelID))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(result.AudioWAV)
}

func (h *Handler) handleListModels(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, h.manager.Infos())
}

func (h *Handler) handleMemory(w http.ResponseWriter, r *http.Request) {
	stats, err := memory.Get()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, stats)
}

// writeJSON is a convenience helper for JSON responses.
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
