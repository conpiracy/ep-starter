#!/usr/bin/env bash
#
# my-action.sh — Template action script for a Herdr plugin
#
# Environment injected by Herdr:
#   HERDR_SOCKET_PATH         Path to the Herdr Unix socket
#   HERDR_BIN_PATH            Path to the running herdr binary
#   HERDR_ENV=1               Always set inside Herdr
#   HERDR_PLUGIN_ID           Your plugin's id
#   HERDR_PLUGIN_ROOT         Plugin directory (read-only)
#   HERDR_PLUGIN_CONFIG_DIR   User config directory (read-write)
#   HERDR_PLUGIN_STATE_DIR    Runtime state directory (read-write)
#   HERDR_PLUGIN_CONTEXT_JSON Full context JSON
#   HERDR_PLUGIN_ACTION_ID    The action being invoked
#   HERDR_WORKSPACE_ID        Current workspace (if available)
#   HERDR_TAB_ID              Current tab (if available)
#   HERDR_PANE_ID             Current pane (if available)
#
set -euo pipefail

echo "╔══════════════════════════════════════════╗"
echo "║   Plugin: ${HERDR_PLUGIN_ID}"                
echo "║   Action: ${HERDR_PLUGIN_ACTION_ID}"          
echo "╚══════════════════════════════════════════╝"
echo ""

# --- Your action logic here ---
echo "Hello from the plugin action!"
echo ""

# Call back into Herdr
"${HERDR_BIN_PATH:-herdr}" workspace list 2>/dev/null || true
