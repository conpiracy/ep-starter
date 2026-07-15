# 🏗️ Harness Templates & Skills Quick Reference

> Everything you need to create Herdr plugins and Pi extensions/packages.

## What's Available

```
skills/                              ← Skills that teach AI to build things
├── create-herdr-plugin.md           ★ Build Herdr workflow plugins
└── create-pi-extension.md           ★ Build Pi extensions & packages

examples/                            ← Working, copy-pasteable examples
├── herdr-plugins/
│   ├── hello-world/                 Minimal Herdr plugin (actions + env)
│   └── agent-notify/                Event hooks + state watching
└── pi-extensions/
    ├── herdr-tools.ts               ★ Control Herdr from Pi
    ├── supervisor.ts                Multi-agent orchestration
    └── simple-tool.ts               Minimal extension (tools + events)

harness/templates/                   ← Scaffold templates (copy & start)
├── herdr-plugin/                    New Herdr plugin scaffold
│   ├── herdr-plugin.toml
│   └── scripts/my-action.sh
└── pi-package/                      New Pi package scaffold
    ├── package.json
    ├── extension.ts
    ├── skills/my-skill.md
    ├── prompts/review.md + test.md
    ├── themes/harness-theme.json
    └── extensions/ (extra extensions dir)

packages/@lzy/                       ← Your published packages go here
```

## Quick Start — Herdr Plugin

```bash
# Copy the template
cp -r harness/templates/herdr-plugin/ my-awesome-plugin
cd my-awesome-plugin

# Edit the manifest
vim herdr-plugin.toml   # change id, name, description

# Create your action script
cat > scripts/my-action.sh << 'SCRIPT'
#!/usr/bin/env bash
echo "My plugin ran! Workspace: $HERDR_WORKSPACE_ID"
"${HERDR_BIN_PATH:-herdr}" workspace list
SCRIPT
chmod +x scripts/my-action.sh

# Link and test
herdr plugin link .
herdr plugin action invoke your-name.plugin-name.my-action

# Unlink when done
herdr plugin unlink your-name.plugin-name
```

## Quick Start — Pi Extension

```bash
# Create a minimal extension
cat > my-extension.ts << 'EOF'
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "hello",
    parameters: Type.Object({ name: Type.String() }),
    async execute(_, params) {
      return { content: [{ type: "text", text: `Hello ${params.name}!` }] };
    },
  });
}
EOF

# Test it
pi -e ./my-extension.ts

# Install it permanently
cp my-extension.ts ~/.pi/agent/extensions/
# Then /reload inside Pi
```

## Quick Start — Pi Package

```bash
# Copy the template
cp -r harness/templates/pi-package/ packages/@lzy/my-package
cd packages/@lzy/my-package

# Edit package.json — set name, description, pi fields
# Edit extension.ts — add your tools and commands
# Add skills, prompts, themes as needed

# Test locally
pi install ./packages/@lzy/my-package

# When ready, publish to npm
npm publish

# Users install with:
pi add @lzy/my-package
```

## Using the Skills

When you want the AI to build something for you, reference the skills:

```
I need a Herdr plugin that... 
  → The AI should read skills/create-herdr-plugin.md

I need a Pi extension that...
  → The AI should read skills/create-pi-extension.md
```

Or directly prompt:

> "Read skills/create-herdr-plugin.md and help me build a plugin that sends Slack notifications when agents finish."

> "Read skills/create-pi-extension.md and create an extension that registers a tool to query my API."
