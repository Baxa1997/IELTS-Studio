#!/usr/bin/env bash
# Bring up a public URL for the Telegram webhook and point the bot at it.
#
# Telegram only delivers to a public https address, so local testing needs a
# tunnel. Prefers cloudflared: localtunnel dropped its connection three times in
# one afternoon of testing, and every drop is a silent failure — Telegram gets a
# 408, the update is lost, and the app just never connects.
#
#   brew install cloudflared      # once, no account needed
#   ./scripts/telegram-dev-tunnel.sh
#
# Leave it running. Ctrl-C stops the tunnel; re-run it to get a fresh URL and
# re-register in one step.
set -euo pipefail
cd "$(dirname "$0")/.."

curl -sf -o /dev/null --max-time 5 http://localhost:3000/ \
  || { echo "Start the dev server first: npm run dev"; exit 1; }

if command -v cloudflared >/dev/null 2>&1; then
  echo "Starting cloudflared…"
  cloudflared tunnel --url http://localhost:3000 > /tmp/cf.log 2>&1 &
  PID=$!
  for _ in $(seq 1 30); do
    URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/cf.log 2>/dev/null | head -1) && [ -n "$URL" ] && break
    sleep 1
  done
else
  echo "cloudflared not installed (brew install cloudflared) — falling back to localtunnel."
  npx -y localtunnel --port 3000 > /tmp/lt.log 2>&1 &
  PID=$!
  for _ in $(seq 1 30); do
    URL=$(grep -o 'https://[a-z-]*\.loca\.lt' /tmp/lt.log 2>/dev/null | tail -1) && [ -n "$URL" ] && break
    sleep 1
  done
fi

[ -n "${URL:-}" ] || { echo "No tunnel URL appeared."; exit 1; }
echo "Tunnel: $URL"
node scripts/telegram-webhook.mjs "$URL"
echo "Leave this running. Ctrl-C to stop."
wait $PID
