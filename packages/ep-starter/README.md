# ep-starter

Pi package that orients you on the **Herdr + Pi** stack and walks you through building real capabilities on it.

The value is not “Obsidian support” or “a list of integrations.”  
The value is that **Herdr and Pi make serious agent work tractable** — durable multi-agent sessions, tools you own, skills and packages, control via CLI — so giving an agent systematic access to work data and peer agents stops being a research project.

ep-starter is the on-ramp and factory surface for that.

## Stack

| Piece | Job |
|-------|-----|
| **Herdr** | Workspace runtime: panes, tabs, agent state, wait/read/run |
| **Pi** | Agent you can extend: tools, skills, packages, sessions |
| **ep-starter** | `/setup`, scaffolds, skills — first builds that prove the stack |

## Commands

| Command | Role |
|---------|------|
| `/setup` | Orientation: what the stack changes, where to start |
| `/setup obsidian` | Worked example — knowledge vault as tools |
| `/setup scaffold` | Same path for any capability |
| `/scaffold <name>` | Generate an extension stub |
| `/agents` | List peer agents (when running inside Herdr) |

## Worked examples (not the product)

Examples exist so you feel the transformation:

- **Brand vault (Obsidian)** — marketers already store voice, offers, proof. Wiring it as tools shows “agent has my materials” without paste.
- **Spy / any API** — `/scaffold spy-api` shows the same path for competitor intel or internal systems.
- **Peer agents** — Herdr panes + wait/read show multi-agent work as normal ops.

After the first example, the point is: **you can keep adding capabilities the same way.**

## Install

```bash
npm install -g @earendil-works/pi-coding-agent
pi install git:github.com/conpiracy/ep-starter@main
pi
```

```
/setup
```

Prefer running Pi inside [Herdr](https://herdr.dev) so multi-agent and pane control are available.

## Package layout

```
packages/ep-starter/
├── extension.ts              /setup, /scaffold, /agents
├── skills/
│   ├── obsidian-vault.md     skill for the vault example
│   └── herdr-operations.md   skill for Herdr control
├── prompts/
├── themes/
├── scaffold/obsidian-tools/  reference stub
├── GUIDE.md
└── README.md
```

## Requirements

- [Pi](https://pi.dev)
- [Herdr](https://herdr.dev) recommended
- Optional for the vault example: [Obsidian Headless](https://obsidian.md/help/headless)

Repo: [github.com/conpiracy/ep-starter](https://github.com/conpiracy/ep-starter)
