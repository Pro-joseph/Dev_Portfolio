#!/usr/bin/env bash
set -euo pipefail

# Server-side deploy script. Run from the app root (~/app) via GitHub Actions.
# Assumes the cPanel "Setup Node.js App" is configured with server.js as the
# startup file and that the app is supervised by cPanel (killing the process
# makes cPanel restart it).

cd "$(dirname "$0")/.."

echo "==> Node $(node -v)"

# node:sqlite requires Node >= 22.5
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "ERROR: node:sqlite needs Node >= 22.5 (found $(node -v))." >&2
  echo "Select Node 22 or 24 in cPanel -> Setup Node.js App, then retry." >&2
  exit 1
fi

echo "==> Pulling latest"
git pull --ff-only origin main

if [ ! -f .env.production ]; then
  echo "ERROR: .env.production is missing on the server." >&2
  echo "Create it from .env.example (DB_FILE, JWT_SECRET, NEXT_PUBLIC_API_URL, MEDIA_UPLOAD_DIR, MEDIA_QUOTA_BYTES)." >&2
  exit 1
fi

echo "==> Installing production deps"
npm ci --omit=dev

echo "==> Building"
NODE_ENV=production npm run build

echo "==> Restarting app (killing server.js; cPanel will restart it)"
# Find the server.js process for this app and stop it. cPanel's Node.js
# supervisor restarts it automatically. If the host doesn't supervise,
# replace this with a cPanel UAPI restart using an API token.
pkill -f "node .*server.js" || echo "    (no running server.js process to stop)"

echo "==> Deploy complete."