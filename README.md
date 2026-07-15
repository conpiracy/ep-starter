# ep-starter

Starter factory for running [Pi](https://pi.dev) inside [Herdr](https://herdr.dev).

---

## Herdr

> *One terminal for the whole herd.*  
> *To coding agents what tmux is to terminals.*

Herdr is an **agent multiplexer**. A background server owns real terminal processes; clients attach to view them. Panes keep running when you detach, close the laptop, or SSH back in later.

Unlike tmux, Herdr is built around coding agents:

- Detects agents in panes and shows state: `working`, `blocked`, `done`, `idle`
- Workspaces / tabs / panes for projects and layouts
- Mouse-first UI; prefix keybindings if you want them
- CLI and local socket API so scripts and agents can split panes, run commands, wait on state, and read output

**What you get:** many agents and shells in one place, still running when you leave, operable from outside the TUI.

Docs: [herdr.dev/docs](https://herdr.dev/docs/) · local copy: [`docs/herdr/`](./docs/herdr/)

---

## Pi

> *There are many agent harnesses, but this one is yours.*

Pi is a **minimal terminal coding harness**. Strong defaults, small core. It does not bake in sub-agents, plan mode, or permission theater. You adapt Pi to your workflow — with TypeScript extensions, skills, prompt templates, themes, and packages — instead of forking the product.

- Tools, commands, events, and TUI hooks via extensions
- Skills and prompt templates for on-demand capability
- Packages to bundle and share a setup (npm or git)
- Interactive, print/JSON, RPC, and SDK modes
- Sessions as trees (branch, rewind, share)

**What you get:** an agent you can reshape without waiting on upstream feature requests.

Docs: [pi.dev/docs](https://pi.dev/docs/) · local copy: [`docs/pi/`](./docs/pi/)

---

## Together

| | Alone | With the other |
|--|--------|----------------|
| **Herdr** | Great place to run many terminals/agents | Agents that can *drive* the workspace (split, run, wait, read peers) |
| **Pi** | Great agent to customize | Runs as a first-class process among peers, with durable panes and shared layout |

**Herdr** answers: where do agents live, how do I see them, how do they keep running, how do I control the workspace?

**Pi** answers: what can *this* agent do, and how do I change that without forking?

**Together:** a runtime where several agents (and shells) share a workspace, and at least one of them is fully extensible — so multi-agent work and custom tools are normal operations, not glue scripts.

That combination is what this repo is for.

---

## What ep-starter is

A **factory** on top of that stack:

1. **Vendored docs** — Herdr + Pi references offline ([`docs/`](./docs/))
2. **Pi package** — [`packages/ep-starter`](./packages/ep-starter): `/setup`, `/scaffold`, `/agents`
3. **Skills** — how to author Herdr plugins and Pi extensions ([`skills/`](./skills/))
4. **Templates + examples** — blank scaffolds and working samples

It does **not** sell a catalog of product integrations.  
It helps you **stand up the stack and build capabilities on it**.

Worked examples (e.g. a knowledge-vault tool stub, a Herdr plugin) exist so the path is concrete. They are exercises, not the value proposition.

---

## Quick start

```bash
# Herdr — https://herdr.dev/docs/install/
curl -fsSL https://herdr.dev/install.sh | sh
herdr

# Pi — inside a Herdr pane
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
pi install git:github.com/conpiracy/ep-starter@main
pi
```

Inside Pi:

```
/setup              # stack orientation
/scaffold <name>    # new capability stub
/agents             # peer panes (when HERDR_ENV=1)
```

---

## Layout

```
ep-starter/
├── packages/ep-starter/     Pi package (/setup, scaffolds, skills)
├── docs/herdr/              Herdr agent-guide, SKILL, API notes
├── docs/pi/                 Pi extensions, SDK, packages, …
├── skills/                  create-herdr-plugin, create-pi-extension
├── examples/                sample plugins + extensions
├── harness/templates/       copy-and-start scaffolds
└── scripts/refresh-docs.sh  re-fetch upstream docs
```

---

## Learn more

| Topic | Where |
|-------|--------|
| Herdr concepts + control | [`docs/herdr/agent-guide.md`](./docs/herdr/agent-guide.md), [`docs/herdr/SKILL.md`](./docs/herdr/SKILL.md) |
| Pi extensions / packages | [`docs/pi/extensions.txt`](./docs/pi/extensions.txt), [`docs/pi/packages.txt`](./docs/pi/packages.txt) |
| Walkthrough of this factory | [`packages/ep-starter/GUIDE.md`](./packages/ep-starter/GUIDE.md) |
| Architecture notes | [`harness-factory-onboarding.md`](./harness-factory-onboarding.md) |

---

Herdr: [herdr.dev](https://herdr.dev) · Pi: [pi.dev](https://pi.dev)
