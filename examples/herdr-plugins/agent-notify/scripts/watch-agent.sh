#!/usr/bin/env bash
# watch-agent.sh — Watch the current agent's status and log changes
set -euo pipefail

HERDR="${HERDR_BIN_PATH:-herdr}"
STATE_DIR="${HERDR_PLUGIN_STATE_DIR}"
PANE_ID="${HERDR_PANE_ID}"

if [ -z "$PANE_ID" ]; then
  echo "❌ No pane context. Run this from a pane with an agent."
  exit 1
fi

mkdir -p "$STATE_DIR"
LOGFILE="$STATE_DIR/watcher-${PANE_ID}.log"

echo "👀 Watching agent in pane $PANE_ID"
echo "  Logging to: $LOGFILE"
echo "  Press Ctrl+C to stop"
echo ""

LAST_STATUS=""

while true; do
  STATUS=$("$HERDR" pane get "$PANE_ID" 2>/dev/null | python3 -c "
import json, sys
try:
    p = json.load(sys.stdin)
    print(p.get('agent_status', 'unknown'))
except:
    print('error')
" 2>/dev/null || echo "error")

  if [ "$STATUS" != "$LAST_STATUS" ] && [ -n "$STATUS" ]; then
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$TIMESTAMP] $STATUS" | tee -a "$LOGFILE"
    LAST_STATUS="$STATUS"

    # Show notification on completion
    if [ "$STATUS" = "done" ]; then
      echo "✅ Agent finished!"
      "$HERDR" pane read "$PANE_ID" --source recent-unwrapped --lines 10 2>/dev/null || true
    elif [ "$STATUS" = "blocked" ]; then
      echo "⛔ Agent blocked — needs input!"
    fi
  fi

  sleep 2
done
