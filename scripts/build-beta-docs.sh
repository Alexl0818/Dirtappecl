#!/usr/bin/env bash
# Regenerates the beta launch docs as Word (.docx) and PDF into ./beta-docs/.
#
# Usage:  bash scripts/build-beta-docs.sh
#
# Requires: Node (for .docx, via the global "docx" package) and Google Chrome
# (for PDF, headless print). Both are optional independently — the script does
# whichever it can.

set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/beta-docs"
mkdir -p "$OUT"

# --- Word (.docx) ---
if command -v node >/dev/null 2>&1; then
  if ! node -e "require('docx')" >/dev/null 2>&1; then
    echo "Installing 'docx' globally…"; npm install -g docx >/dev/null 2>&1
  fi
  NODE_PATH="$(npm root -g)" node "$ROOT/scripts/build-beta-docs.mjs"
else
  echo "Node not found — skipping .docx generation."
fi

# --- PDF (headless Chrome) ---
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ -x "$CHROME" ]; then
  PROF="$(mktemp -d)"
  for name in beta-checklist beta-roadmap; do
    case "$name" in
      beta-checklist) out="HaulYard-Beta-Checklist.pdf" ;;
      beta-roadmap)   out="HaulYard-Beta-Roadmap.pdf" ;;
    esac
    "$CHROME" --headless --disable-gpu --no-pdf-header-footer \
      --user-data-dir="$PROF" \
      --print-to-pdf="$OUT/$out" "file://$ROOT/scripts/$name.html" >/dev/null 2>&1
    echo "wrote $OUT/$out"
  done
  rm -rf "$PROF"
else
  echo "Google Chrome not found — skipping PDF generation."
fi

echo "Done. Files in: $OUT"
ls -1 "$OUT"
