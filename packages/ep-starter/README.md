# 🏭 ep-starter

> **Start here, build anything.**

ep-starter is a **harness factory** for [Pi](https://pi.dev) — a Pi package
that helps you discover, scaffold, and implement extensions to make your
coding agent truly yours.

It provides a guided setup wizard (`/setup`) that walks you through adding
capabilities like Obsidian vault access, custom tools, and multi-agent
orchestration — generating scaffold files you implement together with your AI.

## ✨ Features

| Command | What it does |
|---------|-------------|
| `/setup` | Welcome screen and command overview |
| `/setup obsidian` | 📓 **Guided wizard** — connect your Obsidian vault |
| `/setup scaffold` | 🏗️ Learn about generating extensions |
| `/scaffold <name>` | Generate a new extension scaffold file |
| `/agents` | List peer agents (in Herdr) |

## 🚀 Quick Start

```bash
# Install
pip install ep-starter  # or: pi add ep-starter

# Run Pi
pi

# Inside Pi, run the wizard:
/setup obsidian
```

The wizard will:
1. Check prerequisites (Node.js, ob CLI)
2. Install Obsidian Headless if needed
3. Help you log in and configure your vault
4. Generate an extension scaffold at `~/.pi/agent/extensions/obsidian-tools.ts`
5. Tell you how to implement and reload

## 📓 Obsidian Integration

> **Status: Scaffold 🔨** — The extension skeleton is generated for you.
> You implement the tool logic together with your AI.

After running `/setup obsidian` and implementing the stubs:

```bash
/reload   # Inside Pi
```

Then ask your agent:

> *"Search my vault for meeting notes from last week."*
> *"Read the note about project architecture."*
> *"List all notes in the projects folder."*
> *"Sync my vault to get the latest changes."*

Each becomes **a tool call away**.

## 📦 What's Inside

```
ep-starter/
├── extension.ts              ← Main extension (setup wizard + tools)
├── extensions/               ← Extra extensions
├── skills/
│   ├── obsidian-vault.md     ← Skill: accessing your vault
│   └── herdr-operations.md   ← Skill: controlling Herdr
├── prompts/
│   ├── review.md             ← /review prompt template
│   └── note.md               ← /note prompt template
├── themes/
│   └── ep-starter-dark.json  ← Dark theme
├── scaffold/
│   └── obsidian-tools/       ← Standalone scaffold copy
├── GUIDE.md                  ← Full walkthrough
└── README.md                 ← This file
```

## 🧰 Extending

```bash
/scaffold my-tools        # Generate a new extension
/reload                   # Reload extensions
```

Then build tools with your AI:

> "Implement a web-search tool using the Brave Search API."

## 🔧 Requirements

- [Pi](https://pi.dev) — `npm install -g @earendil-works/pi-coding-agent`
- For Obsidian: Node.js 22+, [obsidian-headless](https://obsidian.md/help/headless)
- For multi-agent: [Herdr](https://herdr.dev)

## 🏭 The Factory Pattern

ep-starter is a **harness factory** — it guides you through adding capabilities
rather than shipping every integration pre-built. You build exactly what you
need, nothing you don't, and you understand every piece because you built it.

The full factory (docs, templates, examples, skills) lives alongside this
package in the [ep-starter repository](https://github.com/lzy/ep-starter).

---

> *"There are many agent harnesses, but this one is yours."* — Pi
> *"Start here, build anything."* — ep-starter
