# 🏭 Harness Factory — Onboarding & Architecture Guide

> **Give your agents the data they need to do real work.**
>
> This directory is the **factory floor** for wiring brand vaults, spy APIs, CRMs, and any other
> source into **Herdr + Pi** agent harnesses. Marketers use it so agents can write from real brand
> materials and research competitors; operators use it for CRM/ticket context; builders use it for
> logs and deploy status. Everything you need to understand the stack, build packages, create
> extensions, and connect data lives here — or is cached from the canonical docs online.

---

## 📋 Table of Contents

1. [The Big Picture](#the-big-picture)
2. [Directory Anatomy](#directory-anatomy)
3. [Herdr Architecture](#herdr-architecture)
4. [Pi Architecture](#pi-architecture)
5. [How Herdr + Pi Compose](#how-herdr--pi-compose)
6. [Documentation Inventory](#documentation-inventory)
7. [Building a Harness — Step by Step](#building-a-harness--step-by-step)
8. [Custom Package Scaffold](#custom-package-scaffold)
9. [Agent Skills & Integration](#agent-skills--integration)
10. [Reference & Cheat Sheets](#reference--cheat-sheets)

---

## The Big Picture

```
┌──────────────────────────────────────────────────────────────────┐
│                    🖥️  YOUR TERMINAL                             │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   herdr (TUI)                            │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │   │
│   │  │  Tab 1   │  │  Tab 2   │  │  Tab 3   │               │   │
│   │  │ ┌──────┐ │  │ ┌──────┐ │  │ ┌──────┐ │               │   │
│   │  │ │ pi   │ │  │ │ bash │ │  │ │ logs │ │               │   │
│   │  │ │(agent)│ │  │ │(ops) │ │  │ │(tail)│ │               │   │
│   │  │ └──────┘ │  │ └──────┘ │  │ └──────┘ │               │   │
│   │  │ ┌──────┐ │  │ ┌──────┐ │  │          │               │   │
│   │  │ │codex │ │  │ │claude│ │  │          │               │   │
│   │  │ │(peer)│ │  │ │(peer)│ │  │          │               │   │
│   │  │ └──────┘ │  │ └──────┘ │  │          │               │   │
│   │  └──────────┘  └──────────┘  └──────────┘               │   │
│   │  ┌─ Sidebar ──────────────────────────────────────────┐   │   │
│   │  │  w1:corp    │ pi    idle  │ codex  working         │   │   │
│   │  │  w2:scratch │ claude done │                         │   │   │
│   │  └─────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   📁 /home/corp/lzy/  ←── THE FACTORY                           │
│       ├── docs/        ←── vendored docs                        │
│       │   ├── herdr/   ←── agent-guide, SKILL, API refs         │
│       │   └── pi/      ←── extensions, SDK, skills, packages    │
│       ├── harness/     ←── harness scaffolds & templates        │
│       └── packages/    ←── custom pi packages (extensions,      │
│                           skills, prompts, themes)              │
└──────────────────────────────────────────────────────────────────┘
```

**The core insight:** Herdr is the **workspace runtime** (the multiplexer that keeps panes alive,
detects agents, surfaces state). Pi is the **agent harness** (the coding agent that runs inside a
pane, can be extended with tools/skills/extensions). Together they form a powerful multi-agent
orchestration stack.

---

## Directory Anatomy

```
/home/corp/lzy/
├── thesis.md                          ← Your original file
│
├── docs/                              ← Vendored documentation
│   ├── herdr/
│   │   ├── agent-guide.md             ★ Official agent guide (teaches AI about Herdr)
│   │   ├── SKILL.md                   ★ Official skill file (teaches AI to control Herdr)
│   │   ├── install.txt                  Install instructions
│   │   ├── quick-start.txt              Quick start guide
│   │   ├── concepts.txt                 Core concepts (session, workspace, tab, pane)
│   │   ├── agents.txt                   Agent detection & integration
│   │   ├── configuration.txt            Config file reference (keybindings, themes, UI)
│   │   ├── socket-api.txt               Local socket API for programmatic control
│   │   ├── plugins.txt                  Plugin system (executable workflow plugins)
│   │   ├── session-state.txt            Detach, restore, handoff semantics
│   │   ├── cli-reference.txt            Full CLI reference
│   │   └── how-to-work.txt              Workflows, remote, mobile access
│   │
│   └── pi/
│       ├── README.md                    Pi project README
│       ├── quickstart.txt               Install and first run
│       ├── usage.txt                    Interactive mode, slash commands, CLI
│       ├── providers.txt                Provider setup (Anthropic, OpenAI, etc.)
│       ├── extensions.txt               ★ Full extension API reference
│       ├── skills.txt                   ★ Skill system reference
│       ├── prompt-templates.txt         Slash-command prompt templates
│       ├── packages.txt                 ★ Pi package format (bundle extensions+skills)
│       ├── sdk.txt                      ★ Programmatic SDK reference
│       ├── settings.txt                 Global & project settings
│       ├── sessions.txt                 Session management & branching
│       ├── security.txt                 Trust model & sandboxing
│       ├── rpc.txt                      RPC mode for external control
│       ├── keybindings.txt              Default & custom keybindings
│       ├── themes.txt                   Built-in & custom themes
│       ├── models.txt                   Custom model entries
│       └── tui.txt                      TUI component reference
│
├── harness/                             ← Harness templates & active builds
│   └── (future: generated harnesses)
│
├── packages/                            ← Custom pi packages
│   └── (future: extensions, skills, prompts, themes)
│
└── harness-factory-onboarding.md       ← THIS FILE
```

---

## Herdr Architecture

### Concept Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                        HERDR SESSION                         │
│  (persistent background server namespace)                    │
│                                                              │
│  ┌──────────────────────────────────────┐                    │
│  │  WORKSPACE w1 "corp"                 │                    │
│  │  ┌────────────────────────────────┐  │                    │
│  │  │  TAB t1 "agents"               │  │                    │
│  │  │  ┌────────────┐ ┌────────────┐ │  │                    │
│  │  │  │ PANE p11   │ │ PANE p12   │ │  │                    │
│  │  │  │ agent: pi  │ │ agent:claude│ │  │                    │
│  │  │  │ status:idle│ │ status:work │ │  │                    │
│  │  │  └────────────┘ └────────────┘ │  │                    │
│  │  └────────────────────────────────┘  │                    │
│  │  ┌────────────────────────────────┐  │                    │
│  │  │  TAB t2 "logs"                 │  │                    │
│  │  │  ┌────────────┐                │  │                    │
│  │  │  │ PANE p21   │                │  │                    │
│  │  │  │ tail -f    │                │  │                    │
│  │  │  └────────────┘                │  │                    │
│  │  └────────────────────────────────┘  │                    │
│  └──────────────────────────────────────┘                    │
│                                                              │
│  ┌──────────────────────────────────────┐                    │
│  │  WORKSPACE w2 "scratch"              │                    │
│  │  ┌────────────────────────────────┐  │                    │
│  │  │  TAB t1 "default"              │  │                    │
│  │  │  ┌────────────┐                │  │                    │
│  │  │  │ PANE p31   │                │  │                    │
│  │  │  │ agent:codex│                │  │                    │
│  │  │  │ status:done│                │  │                    │
│  │  │  └────────────┘                │  │                    │
│  │  └────────────────────────────────┘  │                    │
│  └──────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### Agent State Machine

```
                   ┌─────────┐
                   │ unknown │  (no agent detected yet)
                   └────┬────┘
                        │ agent starts / detected
                        ▼
                   ┌─────────┐
            ┌─────│  idle   │◄────────────────────┐
            │     └────┬────┘                      │
            │          │ receives prompt / task     │
            │          ▼                            │
            │     ┌─────────┐                       │
            │     │ working │──(requires input)──┐  │
            │     └────┬────┘                    │  │
            │          │ completes                │  │
            │          ▼                          ▼  │
            │     ┌─────────┐               ┌────────┐
            │     │  done   │               │ blocked│
            │     └────┬────┘               └────┬───┘
            │          │ user sees output         │ user provides input
            └──────────┘                          │
                                                   │
                                                   └──→ back to working ──→ ...
```

### Key CLI Commands

| Command | Purpose |
|---------|---------|
| `herdr` | Launch or attach to persistent session |
| `herdr pane split --current --direction right` | Split pane right |
| `herdr pane run <id> "command"` | Send command + Enter to pane |
| `herdr pane read <id> --source recent-unwrapped --lines 120` | Read pane output |
| `herdr pane get <id>` | Get pane metadata + agent status |
| `herdr wait agent-status <id> --status working --timeout 30000` | Wait for agent state |
| `herdr pane rename <id> "label"` | Label a pane |
| `herdr workspace list` | List all workspaces |
| `herdr integration install <agent>` | Install agent integration |
| `herdr server reload-config` | Reload config without restart |
| `herdr --remote <host>` | Thin remote client |

### Socket API

Herdr exposes a local Unix socket API at `~/.config/herdr/herdr.sock`. You can call any CLI
command via the socket:

```bash
echo '{"method":"pane.list","params":{"workspace":"w1"}}' \
  | nc -U ~/.config/herdr/herdr.sock
```

The API schema is documented at `herdr api schema`.

---

## Pi Architecture

### Extension System

```
┌─────────────────────────────────────────────────────────────┐
│                        PI AGENT                              │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 CORE ENGINE                           │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │    │
│  │  │  LLM     │  │  Tools   │  │  Session Manager  │   │    │
│  │  │  Router  │  │  Registry│  │  (branching, tree)│   │    │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌── EXTENSION LAYER ───────────────────────────────────┐   │
│  │                                                       │   │
│  │  ~/.pi/agent/extensions/   or   .pi/extensions/       │   │
│  │  ├── my-tools.ts    ← registers tools via             │   │
│  │  │                     pi.registerTool({...})          │   │
│  │  ├── my-hooks.ts    ← subscribes to lifecycle via     │   │
│  │  │                     pi.on('tool_call', handler)     │   │
│  │  ├── my-ui.ts       ← custom UI components via        │   │
│  │  │                     ctx.ui.custom({...})            │   │
│  │  └── my-command.ts  ← slash commands via              │   │
│  │                        pi.registerCommand({...})       │   │
│  │                                                       │   │
│  │  ┌── SKILLS ──────────────────────────────────────┐   │   │
│  │  │  *.md files in skills dir or npx skills add    │   │   │
│  │  │  Skills teach the agent behavior/capabilities   │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                       │   │
│  │  ┌── PROMPT TEMPLATES ────────────────────────────┐   │   │
│  │  │  *.md files → /slash commands                   │   │   │
│  │  │  e.g. /review, /test, /refactor                │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                       │   │
│  │  ┌── THEMES ──────────────────────────────────────┐   │   │
│  │  │  *.json files with color definitions            │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌── PI PACKAGES ───────────────────────────────────────┐   │
│  │  Bundled: extension.ts + skills/ + prompts/ + themes/  │   │
│  │  Published as npm packages → `pi add @user/package`    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Extension Lifecycle

```
  STARTUP                    RUNNING                      SHUTDOWN
     │                          │                            │
     ▼                          ▼                            ▼
 ┌─────────┐  ┌──────────────────────────────────┐  ┌──────────────┐
 │ startup │  │  event loop:                     │  │  shutdown()  │
 │ events  │  │  • on('message')                 │  │  called on   │
 │         │  │  • on('tool_call')               │  │  each        │
 │ loaded  │  │  • on('tool_result')             │  │  extension   │
 │ ───────►│  │  • on('agent_start')             │  └──────────────┘
 │ ready   │  │  • on('model_after')             │
 └─────────┘  │  • on('user_bash_command')       │
              │  • on('user_input')              │
              └──────────────────────────────────┘
```

### Key Extension API Surface

| API | Purpose |
|-----|---------|
| `pi.registerTool(definition)` | Register a tool callable by the LLM |
| `pi.on(event, handler)` | Subscribe to lifecycle events |
| `pi.registerCommand(name, options)` | Register a `/command` |
| `pi.sendMessage(content, options?)` | Inject a message into conversation |
| `pi.setModel(model)` | Switch model mid-session |
| `pi.exec(command, args, options?)` | Run a command with output capture |
| `ctx.ui.select/confirm/input/notify` | User interaction primitives |
| `ctx.ui.custom(render)` | Custom TUI components |
| `ctx.sessionManager` | Branch, fork, navigate sessions |
| `ctx.compact()` | Trigger context compaction |

### Skill System

Skills are markdown files that teach Pi agent about a domain. They're loaded at startup:

```yaml
# In a skill file frontmatter:
---
name: my-skill
description: "Description of when the agent should use this skill"
---
```

Skills can be:
- Local files in a skills directory
- Installed via `npx skills add <repo> --skill <name> -g`
- Referenced in Pi settings under `skills` array

### Pi Package Format

A pi package is an npm package with this structure:

```
my-package/
├── package.json          # "pi" field with metadata
├── extension.ts          # Main extension entry (auto-loaded)
├── skills/
│   └── my-skill.md       # Bundled skills
├── prompts/
│   └── review.md         # Prompt templates (→ /review)
├── themes/
│   └── my-theme.json     # Theme definitions
└── README.md
```

The `package.json` `"pi"` field:

```json
{
  "name": "@my-org/my-package",
  "version": "1.0.0",
  "pi": {
    "name": "my-package",
    "description": "My custom harness extensions",
    "skills": ["skills/my-skill.md"],
    "prompts": ["prompts/review.md"],
    "themes": ["themes/my-theme.json"]
  }
}
```

Install with: `pi add @my-org/my-package`

---

## How Herdr + Pi Compose

```
┌──────────────────────────────────────────────────────────────────┐
│                    HERDR WORKSPACE                                │
│                                                                  │
│  ┌── TAB: "dev" ────────────────────────────────────────────┐   │
│  │                                                           │   │
│  │  ┌── PANE p11 ──────────────────────────────────────┐    │   │
│  │  │                                                   │    │   │
│  │  │   pi (agent harness)                              │    │   │
│  │  │   ├── Core engine (LLM, tools, sessions)          │    │   │
│  │  │   ├── Extensions:                                 │    │   │
│  │  │   │   ├── herdr-tools.ts  ← controls Herdr       │    │   │
│  │  │   │   │                     via socket/CLI        │    │   │
│  │  │   │   ├── custom-tools.ts ← your custom tools     │    │   │
│  │  │   │   └── supervisor.ts   ← coordinates peers     │    │   │
│  │  │   ├── Skills:                                      │    │   │
│  │  │   │   └── herdr-skill.md ← teaches Pi to           │    │   │
│  │  │   │                       use Herdr API            │    │   │
│  │  │   └── Packages:                                    │    │   │
│  │  │       └── @lzy/harness ← your custom package       │    │   │
│  │  │                                                   │    │   │
│  │  │   ● Can see/control sibling panes via Herdr CLI   │    │   │
│  │  │   ● Can delegate tasks to peer agents             │    │   │
│  │  │   ● Can read logs from other panes                │    │   │
│  │  │                                                   │    │   │
│  │  └───────────────────────────────────────────────────┘    │   │
│  │                                                           │   │
│  │  ┌── PANE p12 ──────────────────────────────────────┐    │   │
│  │  │                                                   │    │   │
│  │  │   codex (peer agent)                              │    │   │
│  │  │   ● Can be assigned tasks by Pi                   │    │   │
│  │  │   ● Reports done/blocked via Herdr state          │    │   │
│  │  │                                                   │    │   │
│  │  └───────────────────────────────────────────────────┘    │   │
│  │                                                           │   │
│  │  ┌── PANE p13 ──────────────────────────────────────┐    │   │
│  │  │                                                   │    │   │
│  │  │   bash (ops shell)                                │    │   │
│  │  │   ● For long-running builds, servers, watchers    │    │   │
│  │  │   ● Pi can run commands here, read output         │    │   │
│  │  │                                                   │    │   │
│  │  └───────────────────────────────────────────────────┘    │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌── TAB: "monitor" ───────────────────────────────────────┐   │   │
│  │  ┌── PANE p21 ──────────────────────────────────────┐    │   │
│  │  │  tail -f logs/app.log                            │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Multi-Agent Orchestration Pattern

```
┌──────────┐     delegates to     ┌──────────┐
│          │ ──────────────────►   │          │
│  Pi      │   "Review this PR"   │  Codex   │
│  (super.)│                      │ (reviewer)│
│          │◄────────────────────  │          │
│          │   returns findings   │          │
├──────────┤                      ├──────────┤
│ Tools:   │                      │ Tools:   │
│ • herdr  │                      │ • git    │
│   split  │                      │ • files  │
│ • herdr  │                      │ • search │
│   run    │                      └──────────┘
│ • herdr  │
│   read   │    delegates to     ┌──────────┐
│ • herdr  │ ──────────────────►  │          │
│   wait   │   "Run tests"       │  Claude  │
└──────────┘                      │ (tester) │
                                  │          │
                                  │  "Tests  │
                                  │  pass ✓" │
                                  └──────────┘
```

---

## Documentation Inventory

### Herdr Docs (13 files)

| File | Source | What it covers |
|------|--------|----------------|
| `agent-guide.md` | `herdr.dev/agent-guide.md` | ★ Teaches AI agents about Herdr — concepts, install, config, diagnosis |
| `SKILL.md` | GitHub raw `SKILL.md` | ★ Teaches AI agents to *control* Herdr — pane split/run/read/wait |
| `install.txt` | `herdr.dev/docs/install/` | Install methods for all platforms |
| `quick-start.txt` | `herdr.dev/docs/quick-start/` | First-run walkthrough |
| `concepts.txt` | `herdr.dev/docs/concepts/` | Session, workspace, tab, pane, agent states |
| `agents.txt` | `herdr.dev/docs/agents/` | Agent detection, integrations, custom labels |
| `configuration.txt` | `herdr.dev/docs/configuration/` | Config file, keybindings, themes, UI |
| `socket-api.txt` | `herdr.dev/docs/socket-api/` | Local Unix socket API reference |
| `plugins.txt` | `herdr.dev/docs/plugins/` | Executable workflow plugin system |
| `session-state.txt` | `herdr.dev/docs/session-state/` | Detach, restore, handoff semantics |
| `cli-reference.txt` | `herdr.dev/docs/cli-reference/` | Full CLI command reference |
| `how-to-work.txt` | `herdr.dev/docs/how-to-work/` | Workflows, remote, mobile access |

### Pi Docs (16 files)

| File | Source | What it covers |
|------|--------|----------------|
| `README.md` | GitHub `README.md` | Project overview and essentials |
| `quickstart.txt` | `pi.dev/docs/latest/quickstart` | Install, authenticate, first session |
| `usage.txt` | `pi.dev/docs/latest/usage` | Interactive mode, slash commands, CLI |
| `providers.txt` | `pi.dev/docs/latest/providers` | Provider setup (Anthropic, OpenAI, etc.) |
| `extensions.txt` | `pi.dev/docs/latest/extensions` | ★ Full extension API — tools, events, UI |
| `skills.txt` | `pi.dev/docs/latest/skills` | ★ Skill system — teach agents capabilities |
| `prompt-templates.txt` | `pi.dev/docs/latest/prompt-templates` | Reusable /slash prompts |
| `packages.txt` | `pi.dev/docs/latest/packages` | ★ Pi package format — bundle & share |
| `sdk.txt` | `pi.dev/docs/latest/sdk` | ★ Programmatic SDK — embed Pi anywhere |
| `settings.txt` | `pi.dev/docs/latest/settings` | Global & project settings reference |
| `sessions.txt` | `pi.dev/docs/latest/sessions` | Session management, branching, tree |
| `security.txt` | `pi.dev/docs/latest/security` | Trust model, sandbox, vulnerability reporting |
| `rpc.txt` | `pi.dev/docs/latest/rpc` | RPC mode for external control |
| `keybindings.txt` | `pi.dev/docs/latest/keybindings` | Default & custom keybindings |
| `themes.txt` | `pi.dev/docs/latest/themes` | Built-in & custom themes |
| `models.txt` | `pi.dev/docs/latest/models` | Custom model entries |
| `tui.txt` | `pi.dev/docs/latest/tui` | TUI component reference |

---

## Building a Harness — Step by Step

### Step 1: Create a New Workspace in Herdr

```bash
# From inside Herdr, create a dedicated workspace for your harness
herdr workspace create --name "my-project"
# → returns workspace ID like w3

# Create a tab layout
herdr tab create --workspace w3 --name "dev"
herdr tab create --workspace w3 --name "logs"
```

### Step 2: Spin Up Agent Panes

```bash
# Split the dev tab into a Pi pane + a peer agent pane
herdr pane split --direction right --tab w3:t1
# → returns pane ID p31

# Start Pi in the first pane
herdr pane run w3:t1:p31 "pi"

# Start a peer agent (e.g., codex) in the second
herdr pane run w3:t1:p32 "codex"
```

### Step 3: Create a Custom Pi Extension

```typescript
// harness/my-project/extensions/herdr-tools.ts
import { pi } from "@earendil-works/pi-coding-agent";

pi.registerTool({
  name: "herdr_split_pane",
  description: "Split the current Herdr pane and run a command",
  parameters: {
    type: "object",
    properties: {
      command: { type: "string" },
      direction: { type: "string", enum: ["right", "down"] },
    },
  },
  execute: async ({ command, direction }) => {
    const { execSync } = await import("child_process");
    const result = execSync(
      `herdr pane split --current --direction ${direction} --no-focus`,
      { encoding: "utf-8" }
    );
    const paneId = JSON.parse(result).pane_id;
    execSync(`herdr pane run ${paneId} "${command}"`);
    return { paneId, status: "started" };
  },
});

pi.registerTool({
  name: "herdr_wait_and_read",
  description: "Wait for a pane to finish and read its output",
  parameters: {
    type: "object",
    properties: {
      paneId: { type: "string" },
      timeout: { type: "number" },
    },
  },
  execute: async ({ paneId, timeout = 120000 }) => {
    const { execSync } = await import("child_process");
    execSync(
      `herdr wait agent-status ${paneId} --status done --timeout ${timeout}`,
      { encoding: "utf-8", stdio: "pipe" }
    );
    const output = execSync(
      `herdr pane read ${paneId} --source recent-unwrapped --lines 120`,
      { encoding: "utf-8" }
    );
    return { output };
  },
});
```

### Step 4: Add a Herdr Skill for Pi

Create `harness/my-project/skills/herdr-operations.md`:

```markdown
---
name: herdr-operations
description: "Use when the user asks you to control Herdr — split panes, run commands
  in other panes, read outputs, or orchestrate multi-agent workflows."
---

# Herdr Operations

You are running inside a Herdr pane. You can control other panes via the `herdr` CLI.

## Check Context
```bash
echo "$HERDR_WORKSPACE_ID $HERDR_TAB_ID $HERDR_PANE_ID"
```

## Split and Run
```bash
herdr pane split --current --direction right --no-focus
# Returns JSON with pane_id
herdr pane run <pane_id> "command"
```

## Wait and Read
```bash
herdr wait agent-status <pane_id> --status working --timeout 30000
herdr wait agent-status <pane_id> --status done --timeout 120000
herdr pane read <pane_id> --source recent-unwrapped --lines 120
```

## Check Agent States
```bash
herdr pane get <pane_id>
herdr workspace list
```

Do NOT run bare `herdr` (launches TUI). Use specific subcommands.
```

### Step 5: Create a Pi Package

```
packages/
└── @lzy/
    └── my-harness/
        ├── package.json
        ├── extension.ts
        ├── skills/
        │   └── herdr-operations.md
        ├── prompts/
        │   └── review.md
        └── themes/
            └── harness-theme.json
```

### Step 6: Wire It All Together

```bash
# Install the custom package into Pi
cd /home/corp/lzy/packages/@lzy/my-harness
npm link

# In your Pi session:
#   /reload          # reload extensions
#   pi add @lzy/my-harness   # if published
```

---

## Custom Package Scaffold

Here's a complete scaffold for a custom harness package:

### `packages/@lzy/my-harness/package.json`

```json
{
  "name": "@lzy/my-harness",
  "version": "0.1.0",
  "type": "module",
  "main": "extension.ts",
  "pi": {
    "name": "my-harness",
    "description": "Custom harness extensions for multi-agent orchestration",
    "skills": ["skills/herdr-operations.md"],
    "prompts": ["prompts/review.md"],
    "themes": ["themes/harness-theme.json"]
  }
}
```

### `packages/@lzy/my-harness/extension.ts`

```typescript
import { pi } from "@earendil-works/pi-coding-agent";

// ── Agent status panel widget ─────────────────────────────
pi.registerCommand({
  name: "agents",
  description: "Show all agent panes and their status in this workspace",
  execute: async () => {
    const { execSync } = await import("child_process");
    const panes = JSON.parse(
      execSync("herdr pane list --workspace $(echo $HERDR_WORKSPACE_ID)", {
        encoding: "utf-8",
      })
    );
    const lines = panes.map((p: any) =>
      `  ${p.pane_id.padEnd(8)} ${(p.agent || "bash").padEnd(12)} ${p.agent_status}`
    );
    return `**Agent Status:**\n\n${lines.join("\n")}`;
  },
});

// ── Delegate task to peer agent ──────────────────────────
pi.registerTool({
  name: "delegate",
  description: "Delegate a task to a peer agent in another pane",
  parameters: {
    type: "object",
    properties: {
      task: { type: "string", description: "The task to delegate" },
      agentType: {
        type: "string",
        enum: ["codex", "claude", "opencode"],
        description: "Which agent to use",
      },
      timeout: {
        type: "number",
        description: "Max wait time in ms",
        default: 180000,
      },
    },
    required: ["task", "agentType"],
  },
  execute: async ({ task, agentType, timeout = 180000 }) => {
    const { execSync } = await import("child_process");

    // Split a new pane for the peer agent
    const splitResult = execSync(
      "herdr pane split --current --direction right --no-focus",
      { encoding: "utf-8" }
    );
    const paneId = JSON.parse(splitResult).result.pane.pane_id;

    // Label and launch
    execSync(`herdr pane rename ${paneId} "${agentType}-delegate"`, {
      encoding: "utf-8",
    });
    execSync(`herdr pane run ${paneId} "${agentType}"`, {
      encoding: "utf-8",
    });

    // Wait for ready, then submit task
    execSync(
      `herdr wait agent-status ${paneId} --status idle --timeout 30000`,
      { encoding: "utf-8" }
    );
    execSync(`herdr pane run ${paneId} "${task}"`, { encoding: "utf-8" });

    // Wait for completion and read
    execSync(
      `herdr wait agent-status ${paneId} --status done --timeout ${timeout}`,
      { encoding: "utf-8", stdio: "pipe" }
    );
    const output = execSync(
      `herdr pane read ${paneId} --source recent-unwrapped --lines 200`,
      { encoding: "utf-8" }
    );

    return {
      delegatePaneId: paneId,
      result: output,
    };
  },
});

// ── On startup, greet with context ───────────────────────
pi.on("startup", async () => {
  const wsId = process.env.HERDR_WORKSPACE_ID || "unknown";
  const paneId = process.env.HERDR_PANE_ID || "unknown";

  await pi.sendMessage(
    `🧰 Harness active\n\nWorkspace: \`${wsId}\`\nPane: \`${paneId}\`\n\nUse \`/agents\` to see peer agents.`
  );
});
```

### `packages/@lzy/my-harness/skills/herdr-operations.md`

(See Step 4 above — the same skill file)

### `packages/@lzy/my-harness/prompts/review.md`

```markdown
---
name: review
description: "Request a code review from a peer agent"
---
Review this code for:
1. Correctness — any bugs or edge cases?
2. Style — does it follow best practices?
3. Performance — any obvious bottlenecks?
4. Security — any vulnerabilities?

Focus on actionable findings. Be specific.
```

### `packages/@lzy/my-harness/themes/harness-theme.json`

```json
{
  "name": "harness-dark",
  "type": "dark",
  "colors": {
    "background": "#0d1117",
    "foreground": "#c9d1d9",
    "primary": "#58a6ff",
    "secondary": "#3fb950",
    "accent": "#bc8cff",
    "error": "#f85149",
    "warning": "#d29922",
    "success": "#3fb950",
    "border": "#30363d",
    "selection": "#264f78"
  }
}
```

---

## Agent Skills & Integration

### Herdr SKILL.md (already installed at `docs/herdr/SKILL.md`)

This is the official skill file from the Herdr repo. It teaches any coding agent (Pi, Codex,
Claude, etc.) how to:

- **Inspect** workspace, tab, and pane topology via `herdr workspace list`, `herdr pane list`
- **Split** panes with correct geometry (`--direction right` for wide, `--direction down` for tall)
- **Launch** agents in sibling panes (pi, codex, claude, opencode, omp)
- **Wait** for agent state transitions (`idle → working → done`)
- **Read** output with the right source (`recent-unwrapped` for logs, `visible` for viewport)
- **Submit follow-ups** with `herdr pane run`
- **Coordinate** with `--no-focus` to avoid stealing user context

**How to use it:** When you create a new Pi session inside Herdr, reference this skill file:

```bash
# Either paste SKILL.md contents into Pi's custom instructions, or
# point Pi to the local copy:
#   "Read /home/corp/lzy/docs/herdr/SKILL.md to learn how to control Herdr"
```

### Pi Skills (from pi.dev/docs/latest/skills)

Pi's skill system works similarly — markdown files with YAML frontmatter that teach Pi about
a specific domain. Skills can be:

- **Global** (always loaded): `~/.pi/agent/skills/*.md`
- **Project-local**: `.pi/skills/*.md`
- **Installed via npm**: via `npx skills add <repo> --skill <name> -g`
- **Bundled in packages**: inside a pi package's `skills/` directory

To install the Herdr skill for Pi:

```bash
npx skills add ogulcancelik/herdr --skill herdr -g
```

Or reference the local copy in your Pi settings:

```json
{
  "skills": ["/home/corp/lzy/docs/herdr/SKILL.md"]
}
```

---

## Reference & Cheat Sheets

### Herdr Quick Reference

```
┌────────────────────────────────────────────────────────────┐
│                    HERDR CHEAT SHEET                        │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  NAVIGATION                                                 │
│    prefix+q        Detach session                           │
│    prefix+c        New tab                                  │
│    click tab       Switch tab                               │
│    click pane      Focus pane                               │
│    prefix+?        Show all keybindings                     │
│                                                             │
│  PANES                                                      │
│    prefix+v        Split pane right                         │
│    prefix+-        Split pane down                          │
│    drag border     Resize pane                              │
│    right-click     Context menu                             │
│    prefix+x        Close pane                               │
│                                                             │
│  CLI                                                         │
│    herdr pane split --current --direction right             │
│    herdr pane run <id> "command"                            │
│    herdr pane read <id> --source recent-unwrapped --lines N │
│    herdr pane get <id>                                      │
│    herdr pane rename <id> "label"                           │
│    herdr wait agent-status <id> --status done --timeout N   │
│    herdr wait output <id> --match "text" --timeout N        │
│    herdr workspace list                                     │
│    herdr tab list --workspace <id>                          │
│    herdr pane list --workspace <id>                         │
│    herdr integration install <agent>                        │
│    herdr agent list                                         │
│    herdr server reload-config                               │
│    herdr server stop                                        │
│                                                             │
│  AGENT STATES                                                │
│    unknown → idle → working → done → idle                   │
│                    working → blocked → working              │
│                                                             │
│  CONFIG                                                      │
│    ~/.config/herdr/config.toml                              │
│    herdr --default-config (print defaults)                  │
│                                                             │
│  LOGS                                                        │
│    ~/.config/herdr/herdr.log                                │
│    ~/.config/herdr/herdr-server.log                         │
│    ~/.config/herdr/herdr-client.log                         │
│                                                             │
│  SOCKET API                                                  │
│    ~/.config/herdr/herdr.sock                               │
│    echo '{"method":"pane.list","params":{}}' |              │
│      nc -U ~/.config/herdr/herdr.sock                       │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Pi Quick Reference

```
┌────────────────────────────────────────────────────────────┐
│                    PI CHEAT SHEET                           │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  START & STOP                                               │
│    pi                      Start interactive session        │
│    /exit                   Exit Pi                           │
│    /reload                 Hot-reload extensions            │
│                                                             │
│  SLASH COMMANDS                                              │
│    /help                   Show help                         │
│    /compact                Compact context                   │
│    /session                Session management               │
│    /model <name>           Switch model                      │
│    /settings               Open settings JSON                │
│    /login                  Authenticate with provider        │
│                                                             │
│  EXTENSION LOCATIONS                                         │
│    ~/.pi/agent/extensions/*.ts     Global extensions         │
│    .pi/extensions/*.ts             Project extensions        │
│    pi -e ./path.ts                 One-off test              │
│                                                             │
│  KEY EXTENSION APIS                                          │
│    pi.registerTool({name, description, parameters, execute}) │
│    pi.on(event, handler)                                     │
│    pi.registerCommand({name, description, execute})          │
│    pi.sendMessage(content, options?)                         │
│    pi.setModel(modelId)                                      │
│    pi.exec(command, args, options?)                          │
│    ctx.ui.select(options)                                    │
│    ctx.ui.confirm(message)                                   │
│    ctx.ui.input(prompt)                                      │
│    ctx.ui.notify(message)                                    │
│    ctx.sessionManager.fork(entryId, options?)                │
│    ctx.compact()                                             │
│                                                             │
│  IMPORTANT EVENTS                                            │
│    'startup'              Extension loaded                   │
│    'tool_call'            Before a tool runs (can block)     │
│    'tool_result'          After a tool result                │
│    'user_bash_command'    Before bash execution              │
│    'agent_start' / 'agent_finish'                            │
│    'model_before' / 'model_after'                            │
│    'message' / 'user_input'                                  │
│    'shutdown'             Extension being unloaded           │
│                                                             │
│  SKILL SYSTEM                                                │
│    ~/.pi/agent/skills/*.md          Global skills            │
│    .pi/skills/*.md                  Project skills           │
│    npx skills add <repo> --skill <name> -g                   │
│    Settings: { "skills": ["path/to/skill.md"] }              │
│                                                             │
│  PACKAGES                                                    │
│    Published as npm packages                                 │
│    package.json must have "pi" field                         │
│    pi add @user/package        Install a package             │
│    Bundles: extensions, skills, prompts, themes             │
│                                                             │
│  SDK (programmatic)                                          │
│    createAgentSession({sessionManager, modelRuntime})        │
│    session.prompt("Ask something")                           │
│    session.subscribe((event) => ...)                         │
│    SessionManager.inMemory() or SessionManager.persist()     │
│                                                             │
│  CONFIG LOCATIONS                                            │
│    ~/.pi/config.json                 Global config            │
│    .pi/config.json                   Project config           │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## Next Steps

Now that you have the documentation and architecture mapped out:

1. **Explore the docs** — Start with `docs/herdr/agent-guide.md` and `docs/herdr/SKILL.md`
   to understand Herdr from both sides (human and AI). Then dive into Pi's `extensions.txt`
   and `packages.txt`.

2. **Create a test harness** — Use the scaffold in this guide to build your first harness
   package under `packages/@lzy/`.

3. **Run a multi-agent workflow** — Open Pi in one Herdr pane, delegate a task to a peer
   agent in another pane, and read the result back.

4. **Iterate** — The factory pattern means you can rapidly create new harnesses by copying
   the scaffold, changing the extension logic, and adding custom skills/prompts.

5. **Keep docs fresh** — The canonical sources are at `herdr.dev/docs/` and `pi.dev/docs/latest/`.
   Re-download when versions change:
   ```bash
   # Refresh all docs (run from /home/corp/lzy)
   curl -fsSL https://herdr.dev/agent-guide.md -o docs/herdr/agent-guide.md
   curl -fsSL https://raw.githubusercontent.com/ogulcancelik/herdr/master/SKILL.md -o docs/herdr/SKILL.md
   # ... etc for other pages
   ```

---

> **"One terminal. The whole herd."** — Herdr
> **"There are many agent harnesses, but this one is yours."** — Pi
