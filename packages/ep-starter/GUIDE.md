# ep-starter guide

## Herdr

Herdr is a terminal workspace manager for AI coding agents — an **agent multiplexer**.

- Background server owns real terminals; attach/detach freely
- Workspaces, tabs, panes
- Detects agents and surfaces state (`working` / `blocked` / `done` / `idle`)
- CLI + socket API for programmatic control (split, run, wait, read)

Value: **many agents and shells, still running when you leave, visible and controllable.**

See [herdr.dev/docs](https://herdr.dev/docs/) and `docs/herdr/` in the repo.

## Pi

Pi is a **minimal coding harness**.

- Small core; extend with TypeScript extensions, skills, prompts, themes
- Bundle and share as packages (npm/git)
- No baked-in sub-agents or plan mode — build or install what you need
- Interactive, print/JSON, RPC, SDK

Value: **an agent you adapt to your workflow without forking the harness.**

See [pi.dev/docs](https://pi.dev/docs/) and `docs/pi/` in the repo.

## Together

Herdr is the place agents run.  
Pi is an agent you can reshape.

Combined:

1. Several agents (Pi, Codex, Claude, shells) in one Herdr session  
2. Pi can call `herdr` to create peers, wait on them, and read output  
3. Pi extensions add tools/skills for *your* systems  
4. Layout and processes survive disconnect; the agent stays customizable  

That is the offering of using them together: **operable multi-agent work + an extensible agent in the same environment.**

## What this package does

- Explains the above (`/setup`)
- Helps you add Pi capabilities (`/scaffold` interviews you for the minimum, then the agent researches the API, tests it live, and writes the extension once it works)
- Optionally walks a concrete example (vault tools) so the path is not abstract
- Exposes `/agents` when `HERDR_ENV=1`

It is a factory on-ramp, not a replacement for Herdr or Pi docs.

## Suggested path

```bash
# 1. Herdr
curl -fsSL https://herdr.dev/install.sh | sh
herdr

# 2. Pi inside a pane
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
pi install git:github.com/conpiracy/ep-starter@main
pi
```

```
/setup
/scaffold viralbuilder   # it asks: service? outcome? env var name?
# the agent searches the docs, tests real calls, writes the extension → /reload → use
# or /setup obsidian for the (working-out-of-box) vault exercise
```

For multi-agent control from Pi, stay inside Herdr and use the Herdr skill / CLI (`docs/herdr/SKILL.md`).

## Repo map

| Path | Role |
|------|------|
| `docs/herdr`, `docs/pi` | Offline product docs |
| `skills/` | Author Herdr plugins + Pi extensions |
| `examples/` | Samples |
| `harness/templates/` | Blank scaffolds |
| `packages/ep-starter/` | This package |
