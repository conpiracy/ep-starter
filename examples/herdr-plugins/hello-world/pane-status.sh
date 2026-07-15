#!/usr/bin/env bash
# pane-status.sh — Show all panes and their agent states in the current workspace
set -euo pipefail

HERDR="${HERDR_BIN_PATH:-herdr}"
WS="${HERDR_WORKSPACE_ID}"

echo "📊 Pane Status for workspace ${WS:-"(current)"}"
echo ""

if [ -z "$WS" ]; then
  echo "No workspace context. Listing all workspaces:"
  "$HERDR" workspace list 2>/dev/null || echo "(not in a Herdr session)"
  exit 0
fi

"$HERDR" pane list --workspace "$WS" 2>/dev/null | python3 -c "
import json, sys
panes = json.load(sys.stdin)
print(f'{\"Pane ID\":<10} {\"Agent\":<14} {\"Status\":<12} {\"Label\":<20}')
print('-' * 56)
for p in panes:
    pid = p.get('pane_id', '?')
    agent = p.get('agent', 'bash')
    status = p.get('agent_status', 'unknown')
    label = p.get('label', '')
    print(f'{pid:<10} {agent:<14} {status:<12} {label:<20}')
print(f'\nTotal: {len(panes)} pane(s)')
"
