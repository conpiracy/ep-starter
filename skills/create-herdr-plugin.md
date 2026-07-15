---
name: create-herdr-plugin
description: >
 Create, develop, test, and publish Herdr plugins. Use when the user wants to
 build a Herdr workflow plugin — anything from a simple script launcher to a
 multi-action toolbox with panes, keybindings, and event hooks.
---

# Creating Herdr Plugins

This skill teaches you how to build Herdr plugins. A Herdr plugin is a
shareable, executable workflow package — a directory with a `herdr-plugin.toml`
manifest and one or more commands (bash, node, python, rust, anything).

## The Plugin Model

```
my-plugin/
├── herdr-plugin.toml     # manifest (required)
├── index.js              # entrypoint
├── scripts/
└── assets/

Capabilities (declared in the manifest):
  actions        menu-invoked commands
  panes          overlay / popup / split terminals
  events         hooks (e.g. worktree.created)
  keybindings    bind keys to actions (in user config)
  link handlers  route URL clicks to actions
  storage        config + state dirs (plugin-owned files)
```

## How Herdr Runs a Plugin

1. Herdr reads `herdr-plugin.toml` from the plugin directory
2. Validates the manifest (id, name, version, min_herdr_version required)
3. On `plugin install` from GitHub: runs `[[build]]` commands, then registers
4. On `plugin link` (local dev): registers without building
5. When invoked (action/pane/event): injects env vars and runs the command

### Environment Variables Herdr Injects

| Variable | Description |
|----------|-------------|
| `HERDR_SOCKET_PATH` | Path to the Herdr socket |
| `HERDR_BIN_PATH` | Path to the running herdr binary (prefer this) |
| `HERDR_ENV=1` | Always set when inside Herdr |
| `HERDR_PLUGIN_ID` | The plugin's id from manifest |
| `HERDR_PLUGIN_ROOT` | Plugin directory (read-only, managed checkout) |
| `HERDR_PLUGIN_CONFIG_DIR` | Config directory (user's editable config) |
| `HERDR_PLUGIN_STATE_DIR` | State directory (runtime data) |
| `HERDR_PLUGIN_CONTEXT_JSON` | Full context JSON (workspace, tab, pane, etc.) |
| `HERDR_PLUGIN_ACTION_ID` | (actions only) The action id being invoked |
| `HERDR_PLUGIN_EVENT` / `HERDR_PLUGIN_EVENT_JSON` | (events only) |
| `HERDR_PLUGIN_ENTRYPOINT_ID` | (panes only) |
| `HERDR_WORKSPACE_ID` / `HERDR_TAB_ID` / `HERDR_PANE_ID` | Where available |

## Step 1 — Understand the Manifest

```toml
id = "example.workspace-tools" # Required: dot-separated, e.g. author.name
name = "Workspace Tools" # Required: human-readable
version = "0.1.0" # Required: semver
min_herdr_version = "0.7.0" # Required: oldest compatible version
description = "Small workspace helpers" # Optional
platforms = ["linux", "macos", "windows"] # Optional, defaults to all

# Build commands (run on GitHub install only)
[[build]]
command = ["npm", "ci"]

[[build]]
command = ["npm", "run", "build"]
platforms = ["linux", "macos"]

# Actions — menu-invokable commands
[[actions]]
id = "list-workspaces" # Local id (unique inside plugin)
title = "List workspaces" # Display name in menus
contexts = ["workspace"] # Where the action is available
command = ["node", "index.js"] # argv command to run

# Event hooks — react to Herdr events
[[events]]
on = "worktree.created" # Event name
command = ["herdr", "workspace", "list"]

# Panes — open a terminal in Herdr
[[panes]]
id = "board" # Local id
title = "Project board" # Display name
placement = "overlay" # overlay, popup, split, tab, zoomed
command = ["herdr-board"] # Command to run in the pane

# Link handlers — route URL clicks to plugin actions
[[link_handlers]]
id = "github-issue"
title = "Open GitHub issue"
pattern = "^https://github\\.com/[^/]+/[^/]+/(issues|pull)/[0-9]+$"
action = "apply"
```

## Step 2 — Create a Minimal Plugin

```bash
# Create the directory
mkdir -p my-first-plugin
cd my-first-plugin

# Create the manifest
cat > herdr-plugin.toml << 'EOF'
id = "example.hello-world"
name = "Hello World"
version = "0.1.0"
min_herdr_version = "0.7.0"
description = "A minimal Herdr plugin example"
platforms = ["linux", "macos", "windows"]

[[actions]]
id = "greet"
title = "Say Hello"
contexts = ["workspace"]
command = ["bash", "greet.sh"]
EOF

# Create the action script
cat > greet.sh << 'EOF'
#!/usr/bin/env bash
echo "Hello from the plugin!"
echo "Plugin ID: $HERDR_PLUGIN_ID"
echo "Workspace: $HERDR_WORKSPACE_ID"
echo ""
echo "All context:"
echo "$HERDR_PLUGIN_CONTEXT_JSON" | python3 -m json.tool 2>/dev/null || \
 echo "$HERDR_PLUGIN_CONTEXT_JSON"
EOF
chmod +x greet.sh
```

## Step 3 — Link and Test Locally

```bash
# Link the plugin (adds to Herdr without copying)
herdr plugin link ./my-first-plugin

# List installed plugins
herdr plugin list

# List the plugin's actions
herdr plugin action list --plugin example.hello-world

# Invoke an action
herdr plugin action invoke example.hello-world.greet
```

## Step 4 — Calling Back Into Herdr from a Plugin

The key pattern: your plugin calls `$HERDR_BIN_PATH` or uses the socket API.

### Bash
```bash
#!/usr/bin/env bash
"$HERDR_BIN_PATH" workspace list
"$HERDR_BIN_PATH" pane list --workspace "$HERDR_WORKSPACE_ID"
```

### Node.js
```javascript
#!/usr/bin/env node
const { execSync } = require("node:child_process");
const herdr = process.env.HERDR_BIN_PATH ?? "herdr";

const panes = JSON.parse(
 execSync(`${herdr} pane list --workspace ${process.env.HERDR_WORKSPACE_ID}`, {
 encoding: "utf-8",
 })
);

for (const pane of panes) {
 console.log(`${pane.pane_id}\t${pane.agent ?? "bash"}\t${pane.agent_status}`);
}
```

### Python
```python
#!/usr/bin/env python3
import json, os, subprocess

herdr = os.environ.get("HERDR_BIN_PATH", "herdr")
ws = os.environ.get("HERDR_WORKSPACE_ID", "")

result = subprocess.run(
 [herdr, "pane", "list", "--workspace", ws],
 capture_output=True, text=True, check=True
)
panes = json.loads(result.stdout)
for p in panes:
 print(f"{p['pane_id']}\t{p.get('agent', 'bash')}\t{p.get('agent_status')}")
```

## Step 5 — Plugin with Panes (Overlay/Popup)

```toml
id = "example.my-panes"
name = "My Panes"
version = "0.1.0"
min_herdr_version = "0.7.0"

[[panes]]
id = "picker"
title = "File Picker"
placement = "popup"
width = "80%"
height = 20
command = ["bash", "picker.sh"]

[[panes]]
id = "dashboard"
title = "Dashboard"
placement = "overlay"
command = ["node", "dashboard.js"]
```

Open panes from the CLI:
```bash
herdr plugin pane open --plugin example.my-panes --entrypoint picker
herdr plugin pane open --plugin example.my-panes --entrypoint dashboard
```

## Step 6 — Plugin with Event Hooks

```toml
id = "example.auto-layout"
name = "Auto Layout"
version = "0.1.0"
min_herdr_version = "0.7.0"

# Run when a new worktree is created
[[events]]
on = "worktree.created"
command = ["bash", "on-worktree-created.sh"]

# Run when an agent status changes
[[events]]
on = "agent.status_changed"
command = ["bash", "on-agent-change.sh"]
```

```bash
#!/usr/bin/env bash
# on-worktree-created.sh — apply a standard layout to new worktrees
LAYOUT_ACTION="$HERDR_PLUGIN_ROOT/scripts/apply-layout.sh"
if [ -f "$LAYOUT_ACTION" ]; then
 "$HERDR_BIN_PATH" pane split --current --direction right
 "$HERDR_BIN_PATH" pane run "$HERDR_PANE_ID" "cd $HERDR_PLUGIN_CONTEXT && ls"
fi
```

## Step 7 — Plugin with Keybindings

Keybindings are configured in the user's `config.toml`, not in the manifest:

```toml
# In ~/.config/herdr/config.toml
[[keys.command]]
key = "prefix+l"
type = "plugin_action"
command = "example.workspace-tools.list-workspaces"
description = "List all workspaces"
```

But you can document suggested keybindings in your plugin's README.

## Step 8 — Link Handlers (Route URL Clicks)

```toml
[[link_handlers]]
id = "github-pr"
title = "Open GitHub PR in pane"
pattern = "^https://github\\.com/.*/pull/[0-9]+$"
action = "open-pr-pane"
```

Users trigger link handlers with **Ctrl+click** on a matching URL in any pane.

## Step 9 — Publish and Share

1. Push to a public GitHub repo
2. Tag with `herdr-plugin` topic on GitHub (auto-indexed in marketplace)
3. Users install with:
 ```bash
 herdr plugin install owner/repo[/subdir]
 ```

Example cookbook repo: `ogulcancelik/herdr-plugin-examples`

## Plugin Cookbook — Recipe Ideas

| Recipe | Description | Manifest Features |
|--------|-------------|-------------------|
| **PR reviewer** | Open a PR in a new pane with gh CLI | `[[panes]]` overlay |
| **Agent notifier** | Send desktop notifications on agent state changes | `[[events]]` on agent.status_changed |
| **Layout bootstrap** | Apply a multi-pane layout to a new worktree | `[[events]]` on worktree.created |
| **Quick commands** | Common tooling commands in the action menu | `[[actions]]` |
| **URL router** | Open specific URLs in dedicated apps/panes | `[[link_handlers]]` |
| **Session saver** | Snapshot pane layouts and restore them | `[[actions]]` + `[[panes]]` |
| **Git status widget** | Show git status in a popup | `[[panes]]` popup |
| **Log watcher** | Tail logs in an overlay pane | `[[panes]]` overlay + `[[events]]` |
