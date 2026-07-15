# Harness Factory — Onboarding and Architecture

Connect data sources so agents can work from real materials — brand vaults, spy APIs, CRMs, analytics — inside Herdr + Pi.

This directory is the factory floor: vendored docs, scaffolds, skills, examples, and the `ep-starter` Pi package.

---

## Table of contents

1. [Big picture](#big-picture)
2. [Directory layout](#directory-layout)
3. [Herdr](#herdr)
4. [Pi](#pi)
5. [How they compose](#how-they-compose)
6. [Documentation inventory](#documentation-inventory)
7. [Building a harness](#building-a-harness)
8. [Custom package scaffold](#custom-package-scaffold)
9. [Skills and integration](#skills-and-integration)
10. [Cheat sheets](#cheat-sheets)

---

## Big picture

```
Terminal
  └── herdr (session / workspaces / tabs / panes)
        ├── pane: pi + ep-starter   (tools, skills, data sources)
        ├── pane: peer agent        (codex / claude / …)
        └── pane: shell / logs

Factory (/home/corp/lzy or this repo)
  ├── docs/herdr + docs/pi
  ├── packages/ep-starter
  ├── skills/ + examples/ + harness/templates/
```

- **Herdr** — workspace runtime: panes stay alive, agents are detected, CLI/socket control.
- **Pi** — agent harness inside a pane: tools, skills, packages, sessions.
- **ep-starter** — guided path to wire data sources (Obsidian, spy APIs, CRMs, …) as tools.

Together they support multi-agent work that can reach *your* materials.

---

## Directory layout

```
.
├── packages/ep-starter/     Pi package: /setup, /scaffold, skills
├── docs/herdr/              Herdr agent-guide, SKILL, API refs
├── docs/pi/                 Pi extensions, SDK, skills, packages
├── skills/                  How to build Herdr plugins + Pi extensions
├── examples/                Working plugins and extensions
├── harness/templates/       Copy-and-start scaffolds
├── scripts/refresh-docs.sh
├── README.md
└── packages/ep-starter/GUIDE.md
```

---

## Herdr

### Hierarchy

```
Session
  └── Workspace (project)
        └── Tab (layout)
              └── Pane (terminal + optional agent)
```

### Agent states

```
unknown → idle → working → done → idle
                  working → blocked → working
```

- `idle` — waiting; result considered seen
- `done` — finished; result not yet seen
- `blocked` — needs input
- `working` — running

### CLI (common)

| Command | Purpose |
|---------|---------|
| `herdr` | Launch / attach session |
| `herdr pane split --current --direction right` | Split pane |
| `herdr pane run <id> "command"` | Send command + Enter |
| `herdr pane read <id> --source recent-unwrapped --lines 120` | Read output |
| `herdr pane get <id>` | Metadata + agent status |
| `herdr wait agent-status <id> --status done --timeout N` | Wait for state |
| `herdr workspace list` | List workspaces |
| `herdr integration install <agent>` | Better agent detection |

Config: `~/.config/herdr/config.toml`  
Socket: `~/.config/herdr/herdr.sock`  
Docs: `docs/herdr/`

---

## Pi

### Extension surface

| API | Purpose |
|-----|---------|
| `pi.registerTool(...)` | Tools the LLM can call |
| `pi.on(event, handler)` | Lifecycle hooks |
| `pi.registerCommand(...)` | Slash commands |
| `pi.sendMessage(...)` | Inject messages |
| `ctx.ui.notify/confirm/input` | User interaction |
| `ctx.sessionManager` | Branch / navigate sessions |

Locations:

- `~/.pi/agent/extensions/*.ts` — global
- `.pi/extensions/*.ts` — project (after trust)
- Packages via `pi install` / `package.json` `"pi"` field

Skills are markdown with frontmatter (progressive disclosure).  
Packages bundle extensions + skills + prompts + themes.

Docs: `docs/pi/`

---

## How they compose

```
Herdr workspace
  tab:dev
    pane A: Pi + ep-starter
      tools → herdr CLI (split/run/read/wait)
      tools → obsidian / spy-api / crm (your data)
    pane B: peer agent (delegated tasks)
    pane C: shell (builds, servers, logs)
```

Pattern:

1. Connect a data source (`/setup obsidian`, `/scaffold spy-api`)
2. Implement stubs with the agent
3. `/reload`
4. Ask for work that needs that data
5. Optionally delegate parallel work via Herdr panes

---

## Documentation inventory

### Herdr (`docs/herdr/`)

| File | Covers |
|------|--------|
| `agent-guide.md` | Teach humans/agents about Herdr |
| `SKILL.md` | Control Herdr from inside a pane |
| `install.txt`, `quick-start.txt`, `concepts.txt` | Basics |
| `agents.txt`, `configuration.txt` | Detection + config |
| `socket-api.txt`, `cli-reference.txt` | Programmatic control |
| `plugins.txt`, `session-state.txt`, `how-to-work.txt` | Plugins + workflows |

### Pi (`docs/pi/`)

| File | Covers |
|------|--------|
| `extensions.txt`, `skills.txt`, `packages.txt` | Customization |
| `sdk.txt`, `rpc.txt`, `tui.txt` | Programmatic use |
| `quickstart.txt`, `usage.txt`, `settings.txt` | Day-to-day |
| `sessions.txt`, `security.txt`, `providers.txt` | Sessions + safety |

Refresh:

```bash
bash scripts/refresh-docs.sh
```

---

## Building a harness

### 1. Workspace in Herdr

```bash
herdr workspace create --name "my-project"
herdr tab create --workspace w3 --name "dev"
```

### 2. Agent panes

```bash
herdr pane split --direction right --tab w3:t1
herdr pane run <pane-a> "pi"
herdr pane run <pane-b> "codex"
```

### 3. Install ep-starter

```bash
pi install git:github.com/conpiracy/ep-starter@main
# inside Pi:
/setup
/setup obsidian
```

### 4. Add more sources

```
/scaffold spy-api
/scaffold crm
```

Implement stubs, `/reload`, then ask for work that needs those sources.

### 5. Optional: Herdr plugin

```bash
cp -r harness/templates/herdr-plugin/ my-plugin
cd my-plugin
# edit herdr-plugin.toml + scripts
herdr plugin link .
```

---

## Custom package scaffold

```
packages/@you/my-harness/
├── package.json          # "pi" field
├── extension.ts
├── skills/
├── prompts/
└── themes/
```

`package.json` sketch:

```json
{
  "name": "@you/my-harness",
  "version": "0.1.0",
  "type": "module",
  "keywords": ["pi-package"],
  "pi": {
    "name": "my-harness",
    "description": "Data tools for my team",
    "extensions": ["./extension.ts"],
    "skills": ["./skills"],
    "prompts": ["./prompts"],
    "themes": ["./themes"]
  }
}
```

Template: `harness/templates/pi-package/`

---

## Skills and integration

| Path | Purpose |
|------|---------|
| `docs/herdr/SKILL.md` | Control Herdr from an agent |
| `docs/herdr/agent-guide.md` | Teach Herdr concepts |
| `skills/create-herdr-plugin.md` | Author Herdr plugins |
| `skills/create-pi-extension.md` | Author Pi extensions/packages |
| `packages/ep-starter/skills/obsidian-vault.md` | Use vault tools for copy/research |
| `packages/ep-starter/skills/herdr-operations.md` | Multi-agent ops via Herdr |

Install Herdr skill globally (optional):

```bash
npx skills add ogulcancelik/herdr --skill herdr -g
```

---

## Cheat sheets

### Herdr

```
prefix+q          detach
prefix+c          new tab
prefix+v / -      split right / down
prefix+?          list bindings

herdr pane split --current --direction right --no-focus
herdr pane run <id> "cmd"
herdr pane read <id> --source recent-unwrapped --lines N
herdr wait agent-status <id> --status done --timeout N
herdr workspace list
herdr server reload-config
```

### Pi

```
pi                      start
/reload                 hot-reload extensions
/compact                compact context

~/.pi/agent/extensions/*.ts
.pi/extensions/*.ts
pi -e ./path.ts

pi.registerTool({ name, parameters, execute })
pi.on(event, handler)
pi.registerCommand(name, { description, handler })
ctx.ui.notify / confirm / select / input

pi install git:host/user/repo@ref
```

---

## Next steps

1. Read `packages/ep-starter/GUIDE.md` for the data-source walkthrough.
2. Read `docs/herdr/agent-guide.md` and `docs/herdr/SKILL.md` for Herdr control.
3. Run `/setup obsidian` inside Pi, implement stubs, `/reload`.
4. Add the next source with `/scaffold spy-api` (or crm, analytics, …).
5. Refresh docs when versions move: `bash scripts/refresh-docs.sh`.
