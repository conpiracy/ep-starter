#!/usr/bin/env bash
#
# Template action script for a Herdr plugin
#
# Env injected by Herdr:
#   HERDR_SOCKET_PATH, HERDR_BIN_PATH, HERDR_ENV=1
#   HERDR_PLUGIN_ID, HERDR_PLUGIN_ROOT
#   HERDR_PLUGIN_CONFIG_DIR, HERDR_PLUGIN_STATE_DIR
#   HERDR_PLUGIN_CONTEXT_JSON, HERDR_PLUGIN_ACTION_ID
#   HERDR_WORKSPACE_ID, HERDR_TAB_ID, HERDR_PANE_ID (when available)
#
set -euo pipefail

echo "Plugin: ${HERDR_PLUGIN_ID}"
echo "Action: ${HERDR_PLUGIN_ACTION_ID}"
echo ""

# Your action logic here
echo "Hello from the plugin action."
echo ""

"${HERDR_BIN_PATH:-herdr}" workspace list 2>/dev/null || true
