#!/usr/bin/env bash
# install_audiocpp.sh — Installs the audio.cpp CLI on Apple Silicon Mac.
# Requires: Homebrew, Xcode Command Line Tools, cmake
set -euo pipefail

INSTALL_DIR="$HOME/.nad/bin"
BUILD_DIR="$HOME/.nad/build/audio.cpp"
REPO_URL="https://github.com/0xShug0/audio.cpp.git"
BINARY="$INSTALL_DIR/audiocpp"

echo "🎵 Installing audio.cpp for Nāḍ..."
echo "   Install dir: $INSTALL_DIR"
echo ""

mkdir -p "$INSTALL_DIR" "$BUILD_DIR"

# Check dependencies
for dep in cmake git; do
  if ! command -v "$dep" &>/dev/null; then
    echo "❌ Required tool not found: $dep"
    echo "   Run: brew install cmake git"
    exit 1
  fi
done

# Check OpenMP (libomp keg-only on macOS)
if command -v brew &>/dev/null; then
  if ! brew list libomp &>/dev/null; then
    echo "📦 Installing libomp via Homebrew for OpenMP support..."
    brew install libomp
  fi
  LIBOMP_DIR="$(brew --prefix libomp)"
else
  LIBOMP_DIR="/opt/homebrew/opt/libomp"
fi

# Clone or pull latest
if [ -d "$BUILD_DIR/.git" ]; then
  echo "📦 Updating audio.cpp source..."
  git -C "$BUILD_DIR" pull --ff-only
else
  echo "📦 Cloning audio.cpp..."
  git clone --depth 1 "$REPO_URL" "$BUILD_DIR"
fi

# Build with Metal (Apple Silicon GPU acceleration) & OpenMP
echo ""
echo "🔨 Building audio.cpp with Metal & OpenMP support..."
cmake -S "$BUILD_DIR" -B "$BUILD_DIR/build" \
  -DCMAKE_BUILD_TYPE=Release \
  -DOpenMP_ROOT="$LIBOMP_DIR" \
  -DGGML_METAL=ON \
  -DGGML_METAL_EMBED_LIBRARY=ON \
  -DCMAKE_OSX_ARCHITECTURES="arm64"

cmake --build "$BUILD_DIR/build" --config Release --target audiocpp_cli -j"$(sysctl -n hw.ncpu)"

# Copy binary (CMake puts runtime targets into build/bin/)
if [ -f "$BUILD_DIR/build/bin/audiocpp_cli" ]; then
  cp "$BUILD_DIR/build/bin/audiocpp_cli" "$BINARY"
elif [ -f "$BUILD_DIR/build/audiocpp_cli" ]; then
  cp "$BUILD_DIR/build/audiocpp_cli" "$BINARY"
else
  echo "❌ Error: compiled binary audiocpp_cli not found in build directory"
  exit 1
fi
chmod +x "$BINARY"

echo ""
echo "✅ audio.cpp installed at $BINARY"
echo "   Version: $($BINARY --version 2>/dev/null || echo 'unknown')"
echo ""
echo "💡 Add to PATH (add to ~/.zshrc):"
echo "   export PATH=\"\$HOME/.nad/bin:\$PATH\""
