# 📖 ep-starter Guide

> **"Start here, build anything."**

This guide walks you through the full ep-starter workflow: install, run the
setup wizard, connect your Obsidian vault, and implement the tools so your
agent can access your notes.

---

## 🚀 Quick Install

```bash
# Install Pi (if you haven't already)
npm install -g @earendil-works/pi-coding-agent

# Install ep-starter
pi add ep-starter

# Run Pi
pi
```

Once inside Pi, run:

```
/setup
```

This shows the welcome screen with all available commands.

---

## 📓 Adding Obsidian Access

### What you'll build

```
                          ┌──────────────────┐
                          │   Pi Agent       │
                          │  (your AI)       │
                          └──────┬───────────┘
                                 │ calls tools
                                 ▼
                     ┌───────────────────────┐
                     │  obsidian-tools.ts     │  ← You implement this
                     │  (Pi Extension)        │
                     └───────┬───────────────┘
                             │ calls ob CLI
                             ▼
                     ┌───────────────────────┐
                     │  Obsidian Headless     │
                     │  (ob sync, ob publish) │
                     └───────┬───────────────┘
                             │ reads/writes
                             ▼
                     ┌───────────────────────┐
                     │  Your Obsidian Vault   │
                     │  (knowledge base)      │
                     └───────────────────────┘
```

### Step-by-step

#### 1. Install Obsidian Headless

```bash
npm install -g obsidian-headless
```

Requires Node.js 22+. Check with `node --version`.

#### 2. Log in

```bash
ob login
```

You need an Obsidian account with an active Sync or Publish subscription.

#### 3. Create a remote vault (if you don't have one)

```bash
ob sync-create-remote --name "My Agent Vault"
```

#### 4. Set up sync

```bash
mkdir -p ~/vaults/agent-vault
cd ~/vaults/agent-vault
ob sync-setup --vault "My Agent Vault"
ob sync
```

#### 5. Run the setup wizard

Inside Pi:

```
/setup obsidian
```

The wizard will:
- Check prerequisites (Node.js, ob CLI, login)
- Prompt for your vault path
- Generate `~/.pi/agent/extensions/obsidian-tools.ts`
- Explain next steps

#### 6. Implement the tools (build with your AI)

Open the generated file:

```bash
$EDITOR ~/.pi/agent/extensions/obsidian-tools.ts
```

Each tool has `// TODO` comments. Ask your AI pair to implement them:

> "Read ~/.pi/agent/extensions/obsidian-tools.ts and implement the
> obsidian_search tool using ripgrep for fast full-text search."

The four tools:

| Tool | Purpose | Implementation |
|------|---------|----------------|
| `obsidian_search` | Full-text search | `grep -rl` or `rg -l` (ripgrep) |
| `obsidian_read` | Read a note | `readFileSync` + wikilink rendering |
| `obsidian_list` | List notes | `readdirSync` recursive walk |
| `obsidian_sync` | Trigger sync | `ob sync` CLI call |

#### 7. Reload and use

```bash
# Inside Pi:
/reload
```

Now you can ask:

> "Search my vault for meeting notes from last week."
> "Read the note about project architecture."
> "List all notes in the projects folder."
> "What do I have about machine learning?"
> "Sync my vault to get the latest changes."

Each of these becomes **a tool call away**. 🎉

---

## 🔧 Extending Further

### Add more tools

```
/scaffold my-tools
```

This generates `~/.pi/agent/extensions/my-tools.ts` with a stub. Edit and
/reload.

### Create a Pi package

Once you have a useful set of tools, bundle them into a package:

```
packages/@lzy/my-harness/
├── package.json       # pi field with metadata
├── extension.ts       # Main extension
├── skills/            # Bundled skills
├── prompts/           # Prompt templates
└── themes/            # Theme definitions
```

Publish to npm and share with `pi add @lzy/my-harness`.

### Multi-agent orchestration

If you're running inside Herdr:

```
/agents                    → See peer agents
"delegate a code review to codex"  → Uses herdr_delegate tool
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| `ob: command not found` | `npm install -g obsidian-headless`, check PATH |
| `ob login` fails | Ensure you have an active Sync/Publish subscription |
| Vault not found | Check the path in `~/.pi/agent/extensions/obsidian-tools.ts` |
| Sync conflicts | Don't use desktop Sync + Headless Sync on same device |
| Extension not loading | Run `/reload` or check `~/.pi/agent/extensions/` for errors |
| Tool not working | Check stderr in the output — implement the TODO sections |

---

## 📦 Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                     HERDR (optional)                      │
│  ┌── Tab ───────────────────────────────────────────┐   │
│  │                                                    │   │
│  │  ┌──────────────────────┐  ┌──────────────────┐   │   │
│  │  │  Pi + ep-starter     │  │  Codex (peer)    │   │   │
│  │  │                      │  │                   │   │   │
│  │  │  /setup wizard       │  │  Delegated tasks  │   │   │
│  │  │  obsidian-tools.ts ──┼──┼─► ob CLI          │   │   │
│  │  │  herdr-tools.ts      │  │                   │   │   │
│  │  └──────────────────────┘  └──────────────────┘   │   │
│  └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │  Your Vault      │
                    │  (.md files)     │
                    └──────────────────┘
```

---

## 🏭 The Factory Pattern

ep-starter is a **harness factory** — it doesn't try to ship every integration
pre-built. Instead it gives you:

1. **The wizard** (`/setup`) — guides you through adding capabilities
2. **The scaffolds** — generates stub files you fill in with your AI
3. **The patterns** — extensions, skills, prompts, packages, multi-agent
4. **The docs** — everything you need is in the docs/ directory

This means you build exactly what you need, nothing you don't, and you
understand every piece because you built it.

---

> "There are many agent harnesses, but this one is yours." — Pi
> "One terminal. The whole herd." — Herdr
> "Start here, build anything." — ep-starter
