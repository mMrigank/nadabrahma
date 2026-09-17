// main.go — Nāḍ Backend Broker entry point.
// Starts the HTTP/WebSocket server on localhost:9090.
// Weighs ~20MB idle, enforces 14GB UMA ceiling for model loading.
package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/nad-daw/backend/internal/models"
	"github.com/nad-daw/backend/internal/server"
)

func main() {
	// Structured logging — slog is stdlib in Go 1.21+.
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))

	// Model weights directory: ~/.nad/models/
	home, err := os.UserHomeDir()
	if err != nil {
		slog.Error("cannot determine home directory", "err", err)
		os.Exit(1)
	}
	weightsDir := filepath.Join(home, ".nad", "models")

	slog.Info("Nāḍ backend starting",
		"addr", ":9090",
		"weightsDir", weightsDir,
	)

	// Build the model manager — registers all four audio.cpp adapters.
	manager := models.NewManager(weightsDir)

	// Build the HTTP handler and router.
	handler := server.NewHandler(manager)
	router := server.NewRouter(handler)

	httpServer := &http.Server{
		Addr:         ":9090",
		Handler:      router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 600 * time.Second, // Long timeout: generation can take minutes
		IdleTimeout:  120 * time.Second,
	}

	// Start serving in a goroutine.
	go func() {
		slog.Info("listening", "addr", httpServer.Addr)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "err", err)
			os.Exit(1)
		}
	}()

	// Graceful shutdown on SIGINT/SIGTERM.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down gracefully...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(ctx); err != nil {
		slog.Error("shutdown error", "err", err)
		os.Exit(1)
	}
	slog.Info("server stopped")
}
