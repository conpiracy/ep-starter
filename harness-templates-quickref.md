# Templates and skills quick reference

**Product:** Herdr + Pi as a harness (durable multi-agent work + extensible agent).  
**This factory:** docs, scaffolds, skills, worked examples so the first capabilities are deliberate.

Integrations (vault, APIs, CRMs) are exercises on the path — not a feature catalog.

## Layout

```
skills/
├── create-herdr-plugin.md       Build Herdr workflow plugins
└── create-pi-extension.md       Build Pi extensions / packages

packages/ep-starter/
├── extension.ts                 /setup · /scaffold · /agents
├── GUIDE.md                     Stack first, examples second
└── scaffold/                    Reference stubs

examples/                        Worked plugins and extensions
harness/templates/               Blank scaffolds
docs/herdr + docs/pi             Local stack docs
```

## Path

```
/setup                    # what the stack changes
/setup obsidian           # worked example (knowledge vault as tools)
/scaffold <name>          # next capability, same shape
# implement with the agent → /reload → use on a real job
```

## Why the examples exist

| Exercise | What it proves about the stack |
|----------|--------------------------------|
| Vault tools | Agent can own access to real materials (no paste loop) |
| Spy / API scaffold | Same path for any system with credentials |
| Herdr peer panes | Multi-agent is operable (start / wait / read) |

## Quick starts

### On-ramp

```
pi install git:github.com/conpiracy/ep-starter@main
pi
/setup
```

Prefer Pi inside Herdr for `/agents` and pane control.

### Worked example

```
/setup obsidian
# implement stubs → /reload → brand-aware job
```

### Next capability

```
/scaffold spy-api   # or crm, analytics, …
```

### Herdr plugin

```bash
cp -r harness/templates/herdr-plugin/ my-plugin
cd my-plugin && herdr plugin link .
```

## Authoring skills

> "Read skills/create-pi-extension.md and scaffold tools for X."

> "Read skills/create-herdr-plugin.md and build a plugin that …"
