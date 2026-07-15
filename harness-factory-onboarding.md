# Harness factory — architecture notes

Factory repo for **Herdr + Pi**. Product framing lives in the [README](./README.md). This file is structure and reference.

## Herdr (summary)

Agent multiplexer: session → workspace → tab → pane. Detects agent state. CLI/socket for control. Panes outlive the client.

Local docs: `docs/herdr/`

## Pi (summary)

Minimal coding harness. Extensions, skills, prompts, themes, packages. Sessions, compaction, multiple run modes.

Local docs: `docs/pi/`

## Together

Herdr hosts processes and multi-agent layout.  
Pi is a customizable agent inside a pane (and can drive Herdr via CLI when `HERDR_ENV=1`).

## This repo

| Path | Role |
|------|------|
| `packages/ep-starter/` | Pi package (`/setup`, `/scaffold`, `/agents`) |
| `docs/herdr`, `docs/pi` | Offline docs |
| `skills/` | Authoring Herdr plugins + Pi extensions |
| `examples/` | Samples |
| `harness/templates/` | Blank scaffolds |
| `scripts/refresh-docs.sh` | Re-fetch docs |

## Common Herdr CLI

```
herdr pane split --current --direction right --no-focus
herdr pane run <id> "cmd"
herdr pane read <id> --source recent-unwrapped --lines N
herdr wait agent-status <id> --status done --timeout N
herdr workspace list
```

## Common Pi extension surface

```
pi.registerTool({ name, parameters, execute })
pi.on(event, handler)
pi.registerCommand(name, { description, handler })
~/.pi/agent/extensions/*.ts
.pi/extensions/*.ts
/reload
```
