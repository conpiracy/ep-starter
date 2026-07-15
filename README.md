# 🏭 Harness Factory (`/home/corp/lzy`)

> The factory floor for building Herdr + Pi agent harnesses.

## Quick Start

1. **Read the onboarding guide** → [`harness-factory-onboarding.md`](./harness-factory-onboarding.md)
2. **Explore the docs** → [`docs/`](./docs/)
3. **Build a harness** → scaffold in `harness/` using templates from the guide
4. **Create packages** → `packages/@lzy/` for custom pi packages

## Directory Layout

```
├── docs/                        ← Vendored documentation (herdr + pi)
│   ├── herdr/                   ← Herdr docs (agent-guide, SKILL, API refs)
│   └── pi/                      ← Pi docs (extensions, SDK, skills, packages)
├── harness/                     ← Harness scaffolds & active builds
│   └── (future builds)
├── packages/                    ← Custom pi packages
│   └── (future extensions, skills, prompts, themes)
├── harness-factory-onboarding.md ← ★ Comprehensive architecture guide
├── scripts/
│   └── refresh-docs.sh          ← Script to refresh docs from online sources
└── README.md                    ← This file
```

## Refresh Documentation

```bash
bash scripts/refresh-docs.sh
```

This re-downloads all documentation from `herdr.dev` and `pi.dev`.

## Key Files

| File | What It Is |
|------|-----------|
| `docs/herdr/agent-guide.md` | Herdr's official agent guide — teaches AI about Herdr |
| `docs/herdr/SKILL.md` | Herdr's official skill file — teaches AI to control Herdr |
| `docs/pi/extensions.txt` | Pi extension API reference |
| `docs/pi/sdk.txt` | Pi programmatic SDK guide |
| `docs/pi/packages.txt` | Pi package format specification |
| `docs/pi/skills.txt` | Pi skill system documentation |

## Herdr Workspace Status

Check current workspace status with:

```bash
# From any pane inside Herdr:
herdr workspace list
herdr pane list --workspace w1
```
