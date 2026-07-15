#!/usr/bin/env bash
# greet.sh — Hello World Herdr plugin action
set -euo pipefail

echo "Hello from Herdr plugin"
echo ""
echo "Plugin info:"
echo "  Plugin ID:     $HERDR_PLUGIN_ID"
echo "  Plugin Root:   $HERDR_PLUGIN_ROOT"
echo "  Config Dir:    $HERDR_PLUGIN_CONFIG_DIR"
echo "  State Dir:     $HERDR_PLUGIN_STATE_DIR"
echo "  Action ID:     $HERDR_PLUGIN_ACTION_ID"
echo ""
echo "Herdr context:"
echo "  Workspace:     ${HERDR_WORKSPACE_ID:-"(none)"}"
echo "  Tab:           ${HERDR_TAB_ID:-"(none)"}"
echo "  Pane:          ${HERDR_PANE_ID:-"(none)"}"
echo "  Socket:        $HERDR_SOCKET_PATH"
echo "  Binary:        $HERDR_BIN_PATH"
echo ""
echo "Full context JSON:"
echo "$HERDR_PLUGIN_CONTEXT_JSON" | python3 -m json.tool 2>/dev/null || echo "$HERDR_PLUGIN_CONTEXT_JSON"
echo ""
echo "Calling back into Herdr to list workspaces..."
echo ""

"${HERDR_BIN_PATH:-herdr}" workspace list 2>/dev/null || echo "(workspace list failed — might not be in a session)"
