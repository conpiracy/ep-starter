#!/usr/bin/env bash
# Event hook: fires when any agent status changes
# Env: HERDR_PLUGIN_EVENT, HERDR_PLUGIN_EVENT_JSON
set -euo pipefail

echo "[$(date '+%H:%M:%S')] Agent status changed"
echo "  Event: $HERDR_PLUGIN_EVENT"
echo ""

echo "$HERDR_PLUGIN_EVENT_JSON" | python3 -c "
import json, sys, subprocess, os

event = json.loads(sys.stdin.read())
pane_id = event.get('pane_id', '?')
agent = event.get('agent', '?')
old_status = event.get('old_status', '?')
new_status = event.get('new_status', '?')

print(f'  Pane:   {pane_id}')
print(f'  Agent:  {agent}')
print(f'  Status: {old_status} -> {new_status}')

if new_status in ('done', 'blocked'):
    title = f'Agent {agent}'
    message = f'Pane {pane_id}: {old_status} -> {new_status}'
    try:
        if os.uname().sysname == 'Darwin':
            subprocess.run(
                ['osascript', '-e', f'display notification \"{message}\" with title \"{title}\"'],
                capture_output=True,
            )
        else:
            subprocess.run(['notify-send', title, message], capture_output=True)
    except Exception:
        pass
" 2>&1 || echo "(event parse skipped)"
