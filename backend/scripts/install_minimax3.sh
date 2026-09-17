#!/usr/bin/env bash
# install_minimax3.sh — Downloads MiniMax Music 3 GGUF component package.
# Backup instrumental model (alternate sonic iterations). Memory: ~9.5 GB.
# MiniMax 3 uses a component-based GGUF package (multiple files in a dir).
set -euo pipefail

MODEL_DIR="$HOME/.nad/models/minimax3"
HF_REPO="audio-cpp/MiniMax-Music3-GGUF"

echo "🎹 Downloading MiniMax Music 3 GGUF package..."
echo "   Source: https://huggingface.co/$HF_REPO"
echo "   Destination: $MODEL_DIR"
echo "   Expected size: ~9.5 GB"
echo ""

mkdir -p "$MODEL_DIR"

if command -v hf &>/dev/null; then
  echo "📦 Downloading via hf CLI..."
  hf download "$HF_REPO" --local-dir "$MODEL_DIR"
elif command -v huggingface-cli &>/dev/null; then
  echo "📦 Downloading via huggingface-cli..."
  huggingface-cli download "$HF_REPO" --local-dir "$MODEL_DIR"
else
  echo "⚠️  hf / huggingface-cli not found. Attempting direct download of known package files..."
  echo "📦 Attempting direct download of known package files..."
  for file in "config.json" "mm3-text-encoder.gguf" "mm3-flow.gguf" "mm3-vocoder.gguf"; do
    echo "   Downloading $file..."
    curl -L \
      "https://huggingface.co/$HF_REPO/resolve/main/$file" \
      -o "$MODEL_DIR/$file" \
      --progress-bar
  done
fi

echo ""
echo "✅ MiniMax Music 3 GGUF package downloaded to $MODEL_DIR"
