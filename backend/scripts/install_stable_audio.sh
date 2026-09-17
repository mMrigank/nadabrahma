#!/usr/bin/env bash
# install_stable_audio.sh — Downloads Stable Audio 3 MEDIUM GGUF weights.
# Used for: cinematic textures, risers/drops, ambient pads, hypersonic air, somatic sub-bass.
# NOTE: Stable Audio 3 SMALL is intentionally excluded (mushy tonal contrast).
# Memory: ~4.5 GB (Medium).
set -euo pipefail

MODEL_DIR="$HOME/.nad/models/stable-audio-3"
HF_REPO="audio-cpp/audio.cpp-gguf"
TARGET_FILE="Stable-Audio-3-Medium-GGUF/stable-audio-3-medium-f16.gguf"

echo "🌊 Downloading Stable Audio 3 MEDIUM GGUF weights..."
echo "   Source: https://huggingface.co/$HF_REPO"
echo "   File: $TARGET_FILE"
echo "   Destination: $MODEL_DIR"
echo "   Expected size: ~5.4 GB"
echo "   ⚠️  NOTE: Small variant skipped (mushy tonal contrast)"
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
  ln -sf "$MODEL_DIR/$TARGET_FILE" "$MODEL_DIR/stable-audio-3-medium.gguf"
fi

echo ""
echo "✅ Stable Audio 3 Medium GGUF downloaded to $MODEL_DIR"
echo "   Use cases: cinematic risers, somatic sub drops, ambient pads, hypersonic air textures"
