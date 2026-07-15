# ep-starter Guide

## What this is

ep-starter assumes a simple claim:

**Herdr + Pi change what is practical for agents.**  
Not “more chat.” A runtime and an extensible agent so that multi-agent work, durable sessions, and *owned* tools become normal.

This guide starts with that stack. Integrations (vault, APIs, CRMs) come later as proof that the stack works.

---

## The transformation

### Without the stack

| Need | Typical reality |
|------|-----------------|
| Agent should use my notes | Paste until context dies |
| Agent should call an API | One-off script, forgotten next week |
| Two agents on one job | Two windows, no shared control |
| Background long job | Hope the laptop stays open |
| Share the setup | Dotfiles and folklore |

### With Herdr + Pi

| Need | How it works |
|------|----------------|
| Agent uses my notes | Extension tools read a vault or store you control |
| Agent calls an API | `registerTool` + env credentials; `/reload` |
| Two agents on one job | Herdr panes; wait on status; read transcripts |
| Background long job | Pane outlives the client; reattach later |
| Share the setup | Pi package + skills + this factory |

The product is that **second table**. Everything else is how you exercise it.

---

## Stack roles

```
Herdr                          Pi
─────                          ──
workspaces / tabs / panes      tools / skills / packages
agent detection + state        sessions / branching
CLI + socket control           extensions hot-reload
persist when you detach        you shape the agent
```

ep-starter sits on top: docs, `/setup`, scaffolds, and skills so the first capability you build is deliberate and repeatable.

---

## Install

```bash
# Agent
npm install -g @earendil-works/pi-coding-agent

# Factory package
pi install git:github.com/conpiracy/ep-starter@main

# Workspace runtime (recommended)
# https://herdr.dev/docs/install/
herdr
# then start pi inside a pane
```

```
/setup
```

---

## First path: feel the stack

### 1. Orientation

```
/setup
```

Explains the stack and the first build path — not a catalog of plugins.

### 2. Worked example (optional but concrete)

Marketers often keep brand materials in Obsidian. Wiring that vault as tools is a good **first exercise** because the outcome is obvious: copy that uses *your* library.

```
/setup obsidian
```

That path:

1. Checks prerequisites
2. Generates a tool stub under `~/.pi/agent/extensions/`
3. You implement with the agent
4. `/reload`
5. Ask for work that needs the vault

**What you are learning is not “Obsidian.”**  
You are learning: *I can give this agent a real capability and keep it.*

### 3. Second capability (any source)

```
/scaffold spy-api
# or: crm, analytics, support-inbox, …
```

Same path: stub → implement → reload → use.  
Competitive intel for marketers is a common second exercise; any HTTP/API/DB works.

### 4. Multi-agent (Herdr)

```
/agents
# or ask: start a peer, wait until done, read the result
```

This is the other half of the transformation: not only *what* the agent can access, but *how* work is laid out and coordinated.

---

## Mental model: mechanism vs value

| Mechanism (how) | Value (why) |
|-----------------|-------------|
| Pi extension + tools | Agent can act on systems you control |
| Skills + prompts | Capability is documented and reusable |
| Herdr panes + wait/read | Multi-agent and long jobs are operable |
| Packages | You can ship a harness, not a chat transcript |
| `/setup` + scaffolds | First build is guided; next builds are the same shape |

Obsidian, spy APIs, CRMs are **instances of the left column** chosen because the **right column** is clear for marketers and operators.

---

## Factory contents

```
repo root
├── packages/ep-starter/     this package
├── docs/herdr, docs/pi      stack references (local)
├── skills/                  author plugins + extensions
├── examples/                worked plugins/extensions
└── harness/templates/       blank scaffolds
```

Authoring skills:

- `skills/create-pi-extension.md`
- `skills/create-herdr-plugin.md`

---

## Troubleshooting

| Problem | Likely cause |
|---------|----------------|
| “This is just an Obsidian demo” | Read the stack section — examples are exercises |
| Tools missing after edit | `/reload` |
| No peer agents | Not inside Herdr (`HERDR_ENV` unset) |
| Vault example fails | Headless/login/path; optional for the stack itself |
| Don’t know what to build next | Name a job the agent can’t do yet → `/scaffold` that access |

---

## Principles

1. **Lead with the harness** — Herdr + Pi are the product surface.
2. **Examples prove the path** — not a marketplace of half-kept integrations.
3. **Own the capability** — stubs you implement beat black-box plugins.
4. **Compose** — data tools + peer agents is how real work looks.
5. **Repeat the path** — every new ability should feel like the first one.
