#!/usr/bin/env bash
# install_ace_step.sh — Downloads ACE-Step 1.5 GGUF weights.
# Vocal model: aalap, Hindi/Sanskrit lyrics, humming, gamaka, Indian fusion.
# Memory: ~9 GB.
set -euo pipefail

MODEL_DIR="$HOME/.nad/models/ace-step"
HF_REPO="audio-cpp/audio.cpp-gguf"
TARGET_FILE="ACE-Step1.5-GGUF/turbo/ace-step-1.5-turbo-bf16.gguf"

echo "🎤 Downloading ACE-Step 1.5 Turbo BF16 GGUF weights..."
echo "   Source: https://huggingface.co/$HF_REPO"
echo "   File: $TARGET_FILE"
echo "   Destination: $MODEL_DIR"
echo "   Expected size: ~9.4 GB"
echo ""

mkdir -p "$MODEL_DIR"

if command -v hf &>/dev/null; then
  echo "📦 Downloading via hf CLI..."
  hf download "$HF_REPO" "$TARGET_FILE" --local-dir "$MODEL_DIR"
elif command -v huggingface-cli &>/dev/null; then
  echo "📦 Downloading via huggingface-cli..."
  huggingface-cli download "$HF_REPO" "$TARGET_FILE" --local-dir "$MODEL_DIR"
else
  echo "⚠️  hf / huggingface-cli not found. Downloading via curl..."
  mkdir -p "$MODEL_DIR/$(dirname "$TARGET_FILE")"
  curl -L \
    "https://huggingface.co/$HF_REPO/resolve/main/$TARGET_FILE" \
    -o "$MODEL_DIR/$TARGET_FILE" \
    --progress-bar
fi

# Create a clean symlink at root of MODEL_DIR for convenient CLI access
if [ -f "$MODEL_DIR/$TARGET_FILE" ]; then
  ln -sf "$MODEL_DIR/$TARGET_FILE" "$MODEL_DIR/ace-step-1.5-turbo-bf16.gguf"
fi

echo ""
echo "✅ ACE-Step 1.5 GGUF weights downloaded to $MODEL_DIR"
echo "   Vocal capabilities: aalap, humming, Hindi/Sanskrit lyrics, gamaka ornaments, Indian fusion"
