# ep-starter (Pi package)

On-ramp package for using [Pi](https://pi.dev) with [Herdr](https://herdr.dev).

## Stack (read this first)

**Herdr** — agent multiplexer (tmux for coding agents): real panes that survive detach, agent state in the sidebar, CLI/socket so agents and scripts can control the workspace.

**Pi** — minimal coding harness you reshape with extensions, skills, prompts, themes, and packages. Defaults are strong; opinionated features stay out of core so you build or install what you need.

**Together** — agents live in a durable workspace *and* at least one of them is fully extensible. Multi-agent layout and custom tools become normal operations.

This package does not replace either product. It orients you and helps you start building on that combination.

## Commands

| Command | Purpose |
|---------|---------|
| `/setup` | What Herdr and Pi each do, and what they do together |
| `/setup obsidian` | Optional worked example: vault tools (working out of the box) |
| `/setup scaffold` | How to add a new capability the same way |
| `/scaffold <name>` | Interview for the minimum → agent researches+tests+writes the extension |
| `/agents` | List peer panes (only when running inside Herdr) |

## Install

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
pi install git:github.com/conpiracy/ep-starter@main
# Prefer: open pi inside a Herdr pane
pi
```

```
/setup
```

## Package contents

```
extension.ts           /setup, /scaffold, /agents
skills/                herdr-operations, obsidian-vault (example)
prompts/               small templates
scaffold/              reference scaffold (working defaults)
GUIDE.md               longer walkthrough
```

Full factory (docs, templates, examples): [github.com/conpiracy/ep-starter](https://github.com/conpiracy/ep-starter)
