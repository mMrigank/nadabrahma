// websocket.go implements the WebSocket handler for the Nāḍ backend.
// The WS protocol provides:
//   - Real-time generation progress (JSON events)
//   - Real-time Apple Silicon Unified Memory telemetry
//   - Audio streaming (binary WAV frames on completion)
//   - Model lifecycle events (loading, ready, unloaded)
//
// Message format (client → server):
//   { "type": "generate", "payload": { "modelId": "...", "prompt": "...", ... } }
//   { "type": "cancel" }
//
// Message format (server → client):
//   { "type": "progress", "payload": { "value": 0.42, "usedGB": 24.5, "totalGB": 32.0 } }
//   { "type": "memory", "payload": { "usedGB": 24.5, "totalGB": 32.0, "pressurePct": 76.5 } }
//   { "type": "model_state", "payload": { "modelId": "...", "state": "loading" } }
//   { "type": "complete" }  — immediately followed by a binary WAV frame
//   { "type": "error", "payload": { "message": "..." } }
package server

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/nad-daw/backend/internal/memory"
	"github.com/nad-daw/backend/internal/models"
	"nhooyr.io/websocket"
	"nhooyr.io/websocket/wsjson"
)

// WSMessage is a typed JSON message on the WebSocket connection.
type WSMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

// wsGeneratePayload is the payload for a "generate" WS message from the client.
type wsGeneratePayload struct {
	ModelID     string  `json:"modelId"`
	TrackID     string  `json:"trackId"`
	Prompt      string  `json:"prompt"`
	Tags        string  `json:"tags"`
	Lyrics      string  `json:"lyrics"`
	DurationSec float64 `json:"durationSec"`
}

// safeWSConn provides thread-safe writes over the WebSocket connection.
type safeWSConn struct {
	mu   sync.Mutex
	conn *websocket.Conn
}

func (s *safeWSConn) writeJSON(ctx context.Context, v any) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return wsjson.Write(ctx, s.conn, v)
}

func (s *safeWSConn) writeBinary(ctx context.Context, data []byte) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.conn.Write(ctx, websocket.MessageBinary, data)
}

func (h *Handler) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		OriginPatterns: []string{"localhost:*", "127.0.0.1:*"},
	})
	if err != nil {
		slog.Error("ws: accept failed", "err", err)
		return
	}
	defer conn.CloseNow()

	slog.Info("ws: client connected", "remote", r.RemoteAddr)

	safe := &safeWSConn{conn: conn}
	ctx := r.Context()

	for {
		var msg WSMessage
		if err := wsjson.Read(ctx, conn, &msg); err != nil {
			if websocket.CloseStatus(err) == websocket.StatusNormalClosure ||
				websocket.CloseStatus(err) == websocket.StatusGoingAway {
				slog.Info("ws: client disconnected")
			} else {
				slog.Warn("ws: read error", "err", err)
			}
			return
		}

		switch msg.Type {
		case "generate":
			h.wsHandleGenerate(ctx, safe, msg.Payload)
		default:
			_ = safe.writeJSON(ctx, WSMessage{
				Type:    "error",
				Payload: mustJSON(map[string]string{"message": fmt.Sprintf("unknown message type: %s", msg.Type)}),
			})
		}
	}
}

func (h *Handler) wsHandleGenerate(ctx context.Context, safe *safeWSConn, raw json.RawMessage) {
	var payload wsGeneratePayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		_ = safe.writeJSON(ctx, WSMessage{
			Type:    "error",
			Payload: mustJSON(map[string]string{"message": "invalid generate payload: " + err.Error()}),
		})
		return
	}

	if payload.DurationSec <= 0 || payload.DurationSec > 300 {
		payload.DurationSec = 30
	}

	// Normalise model ID if frontend sent hyphenated or lowercase alias
	modelIDStr := payload.ModelID
	if modelIDStr == "yue-2" || modelIDStr == "yue2" {
		modelIDStr = "yue_2"
	}

	// Initial system memory snapshot
	memStats, _ := memory.Get()

	// Notify client that generation is starting.
	_ = safe.writeJSON(ctx, WSMessage{
		Type: "model_state",
		Payload: mustJSON(map[string]any{
			"modelId":     modelIDStr,
			"state":       "loading",
			"usedGB":      memStats.UsedGB,
			"totalGB":     memStats.TotalGB,
			"pressurePct": memStats.PressurePct,
		}),
	})

	genReq := models.GenerateRequest{
		ModelID:     models.ModelID(modelIDStr),
		Prompt:      payload.Prompt,
		Tags:        payload.Tags,
		Lyrics:      payload.Lyrics,
		DurationSec: payload.DurationSec,
		SampleRate:  48000,
	}

	// Progress channel & memory telemetry ticker
	progressCh := make(chan float64, 32)
	tickerCtx, cancelTicker := context.WithCancel(ctx)
	defer cancelTicker()

	go func() {
		ticker := time.NewTicker(600 * time.Millisecond)
		defer ticker.Stop()
		for {
			select {
			case <-tickerCtx.Done():
				return
			case p, ok := <-progressCh:
				if !ok {
					return
				}
				curMem, _ := memory.Get()
				_ = safe.writeJSON(ctx, WSMessage{
					Type: "progress",
					Payload: mustJSON(map[string]any{
						"value":       p,
						"usedGB":      curMem.UsedGB,
						"totalGB":     curMem.TotalGB,
						"pressurePct": curMem.PressurePct,
					}),
				})
			case <-ticker.C:
				curMem, _ := memory.Get()
				_ = safe.writeJSON(ctx, WSMessage{
					Type: "memory",
					Payload: mustJSON(map[string]any{
						"usedGB":      curMem.UsedGB,
						"totalGB":     curMem.TotalGB,
						"pressurePct": curMem.PressurePct,
					}),
				})
			}
		}
	}()

	_ = safe.writeJSON(ctx, WSMessage{
		Type: "model_state",
		Payload: mustJSON(map[string]any{
			"modelId": modelIDStr,
			"state":   "generating",
		}),
	})

	result, err := h.manager.Generate(ctx, genReq, progressCh)
	cancelTicker()
	close(progressCh)

	if err != nil {
		slog.Error("ws: generation failed", "model", modelIDStr, "err", err)
		_ = safe.writeJSON(ctx, WSMessage{
			Type:    "error",
			Payload: mustJSON(map[string]string{"message": err.Error()}),
		})
		_ = safe.writeJSON(ctx, WSMessage{
			Type:    "model_state",
			Payload: mustJSON(map[string]string{"modelId": modelIDStr, "state": "unloaded"}),
		})
		return
	}

	// Signal completion then send the raw WAV bytes as a binary frame.
	_ = safe.writeJSON(ctx, WSMessage{Type: "complete"})
	_ = safe.writeBinary(ctx, result.AudioWAV)

	_ = safe.writeJSON(ctx, WSMessage{
		Type:    "model_state",
		Payload: mustJSON(map[string]string{"modelId": modelIDStr, "state": "unloaded"}),
	})

	slog.Info("ws: audio sent to client", "model", modelIDStr, "bytes", len(result.AudioWAV))
}

// mustJSON serialises v to json.RawMessage; panics only on programming errors.
func mustJSON(v any) json.RawMessage {
	b, err := json.Marshal(v)
	if err != nil {
		panic(fmt.Sprintf("mustJSON: %v", err))
	}
	return b
}
