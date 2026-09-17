// websocket.go implements the WebSocket handler for the Nāḍ backend.
// The WS protocol provides:
//   - Real-time generation progress (JSON events)
//   - Audio streaming (binary WAV frames on completion)
//   - Model lifecycle events (loading, ready, unloaded)
//
// Message format (client → server):
//   { "type": "generate", "payload": { "modelId": "...", "prompt": "...", ... } }
//   { "type": "cancel" }
//
// Message format (server → client):
//   { "type": "progress", "payload": { "value": 0.42 } }
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

	ctx := conn.CloseRead(context.Background())

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
			h.wsHandleGenerate(ctx, conn, msg.Payload)
		default:
			_ = wsjson.Write(ctx, conn, WSMessage{
				Type:    "error",
				Payload: mustJSON(map[string]string{"message": fmt.Sprintf("unknown message type: %s", msg.Type)}),
			})
		}
	}
}

func (h *Handler) wsHandleGenerate(ctx context.Context, conn *websocket.Conn, raw json.RawMessage) {
	var payload wsGeneratePayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		_ = wsjson.Write(ctx, conn, WSMessage{
			Type:    "error",
			Payload: mustJSON(map[string]string{"message": "invalid generate payload: " + err.Error()}),
		})
		return
	}

	if payload.DurationSec <= 0 || payload.DurationSec > 300 {
		payload.DurationSec = 30
	}

	// Notify client that generation is starting.
	_ = wsjson.Write(ctx, conn, WSMessage{
		Type:    "model_state",
		Payload: mustJSON(map[string]string{"modelId": payload.ModelID, "state": "loading"}),
	})

	genReq := models.GenerateRequest{
		ModelID:     models.ModelID(payload.ModelID),
		Prompt:      payload.Prompt,
		Tags:        payload.Tags,
		Lyrics:      payload.Lyrics,
		DurationSec: payload.DurationSec,
		SampleRate:  48000,
	}

	// Progress channel — relay values to WebSocket client in real time.
	progressCh := make(chan float64, 32)
	go func() {
		for p := range progressCh {
			_ = wsjson.Write(ctx, conn, WSMessage{
				Type:    "progress",
				Payload: mustJSON(map[string]float64{"value": p}),
			})
		}
	}()

	_ = wsjson.Write(ctx, conn, WSMessage{
		Type:    "model_state",
		Payload: mustJSON(map[string]string{"modelId": payload.ModelID, "state": "generating"}),
	})

	result, err := h.manager.Generate(ctx, genReq, progressCh)
	close(progressCh)

	if err != nil {
		slog.Error("ws: generation failed", "model", payload.ModelID, "err", err)
		_ = wsjson.Write(ctx, conn, WSMessage{
			Type:    "error",
			Payload: mustJSON(map[string]string{"message": err.Error()}),
		})
		_ = wsjson.Write(ctx, conn, WSMessage{
			Type:    "model_state",
			Payload: mustJSON(map[string]string{"modelId": payload.ModelID, "state": "unloaded"}),
		})
		return
	}

	// Signal completion then send the raw WAV bytes as a binary frame.
	_ = wsjson.Write(ctx, conn, WSMessage{Type: "complete"})
	_ = conn.Write(ctx, websocket.MessageBinary, result.AudioWAV)

	_ = wsjson.Write(ctx, conn, WSMessage{
		Type:    "model_state",
		Payload: mustJSON(map[string]string{"modelId": payload.ModelID, "state": "unloaded"}),
	})

	slog.Info("ws: audio sent to client", "model", payload.ModelID, "bytes", len(result.AudioWAV))
}

// mustJSON serialises v to json.RawMessage; panics only on programming errors.
func mustJSON(v any) json.RawMessage {
	b, err := json.Marshal(v)
	if err != nil {
		panic(fmt.Sprintf("mustJSON: %v", err))
	}
	return b
}
