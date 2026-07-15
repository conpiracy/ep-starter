# ep-starter

A starter factory for [Herdr](https://herdr.dev) + [Pi](https://pi.dev) — the stack that makes serious agent work tractable.

Without a real harness, “give the agent my brand vault” or “run three agents on this brief” is a pile of brittle scripts, pasted context, and lost sessions. With Herdr and Pi, those become normal operations: durable panes, agent state, tools you own, skills, packages, and a session that survives detach.

**ep-starter** is the on-ramp. It documents the stack, ships scaffolds and skills, and walks you through building the first capabilities *on* that foundation — so you see the transformation, not a plugin list.

## The offering (not the demos)

| Layer | What it is | Why it matters |
|-------|------------|----------------|
| **Herdr** | Agent-aware terminal workspace | Panes stay alive; multi-agent layout; CLI/socket control; state you can wait on |
| **Pi** | Extensible coding agent | Tools, skills, packages, sessions — the agent is something you *shape* |
| **ep-starter** | Factory + guided first builds | Docs, templates, `/setup` — turn the stack into *your* harness |

Obsidian vault access, spy APIs, CRMs, and the rest are **examples of what becomes non-trivial-but-doable** once the stack is in place. They are not the product. The product is: *you can reliably extend what agents can do and how they work together.*

## What used to be hard

Before a harness like this:

- Agent “access” meant pasting notes into chat until the window filled up
- Background work meant hope the terminal stayed open
- Multi-agent work meant alt-tab and guess who finished
- Custom tools meant one-off scripts nobody reloaded cleanly
- Sharing a setup meant “clone my dotfiles and good luck”

After Herdr + Pi:

- Data access is a tool the agent calls, owned by you
- Work runs in panes that persist and report state
- Peers can be started, waited on, and read from the CLI
- Extensions hot-reload; packages bundle tools + skills + prompts
- A factory (this repo) makes the next capability a known path

That gap — paste-and-hope vs. systematic capability — is the value.

## Proof points (worked examples)

These are demos of the *path*, not a catalog of features:

| Example | Shows |
|---------|--------|
| `/setup obsidian` | Wire a real knowledge base as tools (marketers: brand voice, offers, proof) |
| `/scaffold spy-api` | Same path for competitive intel or any HTTP API |
| Herdr peer panes | Delegate, wait, read — multi-agent without babysitting |
| Skills + packages | Teach and ship capabilities instead of re-prompting |

A marketer who can give an agent the brand vault *and* spin a research peer is not “using an Obsidian plugin.” They are running a harness where non-trivial agent work is the default.

## Install

```bash
# Pi
npm install -g @earendil-works/pi-coding-agent

# This factory / package
pi install git:github.com/conpiracy/ep-starter@main

# Optional but central: Herdr workspace
# https://herdr.dev/docs/install/
```

```bash
pi          # inside a Herdr pane if you have one
/setup      # how the stack fits together + first build
```

## Repo layout

```
ep-starter/
├── packages/ep-starter/     Pi package: /setup, /scaffold, skills
├── docs/herdr/ + docs/pi/   Local stack documentation
├── skills/                  How to build plugins and extensions
├── examples/                Worked Herdr plugins + Pi extensions
├── harness/templates/       Copy-and-start scaffolds
└── packages/ep-starter/GUIDE.md
```

## Commands (inside Pi)

| Command | Role |
|---------|------|
| `/setup` | Orientation: stack, value, first path |
| `/setup obsidian` | Worked example: knowledge vault as tools |
| `/setup scaffold` | How to add *any* capability the same way |
| `/scaffold <name>` | Generate a new extension stub |
| `/agents` | Peer agents in the current Herdr workspace |

## Requirements

- [Pi](https://pi.dev) — agent harness
- [Herdr](https://herdr.dev) — strongly recommended; multi-agent + durable work
- Optional for the Obsidian example: [Obsidian Headless](https://obsidian.md/help/headless)

## Docs

- [GUIDE.md](./packages/ep-starter/GUIDE.md) — stack first, examples second
- [harness-factory-onboarding.md](./harness-factory-onboarding.md) — architecture
- [docs/](./docs/) — vendored Herdr + Pi references
