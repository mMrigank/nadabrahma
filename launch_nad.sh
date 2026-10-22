#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Start Nād AI inference backend (port 9090) if not running
if ! lsof -i :9090 >/dev/null 2>&1; then
    echo "Starting Nād AI Model Backend (port 9090)..."
    "$DIR/backend/nad-backend" >/dev/null 2>&1 &
    sleep 1
fi

# 2. Launch Nād Native DAW
echo "Launching Nād DAW..."
exec "$DIR/soundcraft/target/release/soundcraft" "$@"
