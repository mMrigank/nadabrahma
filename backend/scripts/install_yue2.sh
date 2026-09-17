#!/usr/bin/env bash
# install_yue2.sh — Downloads YuE2 3B BF16 weights via audio.cpp GGUF.
# Primary instrumental model. Memory: ~6.5 GB.
set -euo pipefail

MODEL_DIR="$HOME/.nad/models/yue2"
HF_REPO="audio-cpp/Yue2-3B-GGUF"
# BF16 weights for maximum tonal fidelity on Apple Silicon UMA
WEIGHTS_FILE="yue2-3b-bf16.gguf"

echo "🎸 Downloading YuE2 3B BF16 weights..."
echo "   Source: https://huggingface.co/$HF_REPO"
echo "   Destination: $MODEL_DIR"
echo "   Expected size: ~6.5 GB"
echo ""

mkdir -p "$MODEL_DIR"

if [ -f "$MODEL_DIR/$WEIGHTS_FILE" ]; then
  echo "✅ YuE2 BF16 weights already present. Skipping download."
  exit 0
fi

if command -v hf &>/dev/null; then
  echo "📦 Downloading via hf CLI..."
  hf download "$HF_REPO" "$WEIGHTS_FILE" --local-dir "$MODEL_DIR"
elif command -v huggingface-cli &>/dev/null; then
  echo "📦 Downloading via huggingface-cli..."
  huggingface-cli download "$HF_REPO" "$WEIGHTS_FILE" --local-dir "$MODEL_DIR"
else
  echo "📦 Downloading via curl (hf / huggingface-cli not found)..."
  curl -L \
    "https://huggingface.co/$HF_REPO/resolve/main/$WEIGHTS_FILE" \
    -o "$MODEL_DIR/$WEIGHTS_FILE" \
    --progress-bar
fi

echo ""
echo "✅ YuE2 BF16 weights downloaded to $MODEL_DIR/$WEIGHTS_FILE"
