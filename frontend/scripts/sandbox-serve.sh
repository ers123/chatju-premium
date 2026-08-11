#!/usr/bin/env bash
#
# Rebuild and serve the local sandbox site in one step.
#
# The sandbox build and the production build both land in frontend/out, so
# deploying to production silently replaces whatever the local test server is
# handing out. That has now bitten twice: once the local site started calling the
# production API (CORS-blocked), and once it kept serving a bundle from before a
# fix, which made a verified fix look like it had failed.
#
# Always start the local test site with this script rather than by hand.
#
#   ./scripts/sandbox-serve.sh          # rebuild + serve on :8080
#
# Requires backend/.env.staging (PayPal sandbox credentials) and a backend
# running on :3001 with those credentials. Port 8080 is not arbitrary — it is one
# of the origins allowed by the backend's CORS list.

set -euo pipefail

FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_DIR="$(cd "$FRONTEND_DIR/.." && pwd)"
SANDBOX_DIR="$REPO_DIR/out-sandbox"
PORT=8080

cd "$FRONTEND_DIR"

SANDBOX_PAYPAL_ID="$(grep '^PAYPAL_CLIENT_ID=' "$REPO_DIR/backend/.env.staging" | cut -d= -f2-)"
if [ -z "$SANDBOX_PAYPAL_ID" ]; then
  echo "PAYPAL_CLIENT_ID missing from backend/.env.staging" >&2
  exit 1
fi

echo "==> building against the local sandbox backend"
NEXT_PUBLIC_API_URL="http://localhost:3001" \
NEXT_PUBLIC_PAYPAL_CLIENT_ID="$SANDBOX_PAYPAL_ID" \
  npm run build

rm -rf "$SANDBOX_DIR"
cp -R out "$SANDBOX_DIR"

# Leave frontend/out holding the production build, so a later `wrangler pages
# deploy out` cannot ship a bundle pointed at localhost.
echo "==> restoring frontend/out to the production build"
npm run build >/dev/null

if grep -rq 'localhost:3001' out/ 2>/dev/null; then
  echo "frontend/out still references localhost — refusing to leave it deployable" >&2
  exit 1
fi
if ! grep -rq 'execute-api' "$SANDBOX_DIR" 2>/dev/null && ! grep -rq 'localhost:3001' "$SANDBOX_DIR" 2>/dev/null; then
  echo "sandbox build has no API origin baked in — check NEXT_PUBLIC_API_URL" >&2
  exit 1
fi

lsof -ti "tcp:$PORT" 2>/dev/null | xargs -r kill 2>/dev/null || true
sleep 1

cd "$SANDBOX_DIR"
echo "==> serving $SANDBOX_DIR on http://localhost:$PORT"
echo "    open http://localhost:$PORT/saju/input/  (hard-reload: Cmd+Shift+R)"
exec python3 -m http.server "$PORT"
