# ep-starter

Give agents reliable access to the data they need for actual work.

Most agents can write. Few can reach the materials that make the writing useful — brand vaults, competitor intel, CRM notes, analytics, content calendars. ep-starter is a guided path for wiring those sources into a [Pi](https://pi.dev) harness so each one becomes a tool the agent can call.

```
"Write three LinkedIn posts in our brand voice."
    → agent reads brand notes from Obsidian
    → agent pulls competitor ads from a spy API
    → agent drafts against both
```

## Who this is for

| Role | Data | What the agent does with it |
|------|------|-----------------------------|
| Marketers | Brand vaults (Obsidian), swipe files, past campaigns | On-brand copy |
| Marketers | Spy / ad intel APIs | Competitor research and angles |
| Operators | CRMs, tickets, sheets | Status updates, triage, summaries |
| Researchers | Notes, papers, saved sources | Briefs and outlines |
| Builders | Repos, logs, deploy status | Code work with full context |

Obsidian is the first walkthrough because marketers already keep brand voice, offers, proof, and past winners there. Once the vault is connected, copy stops sounding generic.

Spy APIs follow the same path for competitive work: once the API is a tool, the agent can research and draft without pasted screenshots.

## How it works

```
/setup <source>
  → checks prerequisites
  → generates a tool scaffold
  → you and the agent implement the stubs
  → /reload
  → ask for work that needs that data
```

No marketplace of half-maintained plugins. A path you own for every source.

## Install

```bash
npm install -g @earendil-works/pi-coding-agent
pi install git:github.com/conpiracy/ep-starter@main
pi
```

Inside Pi:

```
/setup              # map of connectable sources
/setup obsidian     # brand / knowledge vault
/scaffold spy-api   # competitor intel, or any other source
```

## Repo layout

```
ep-starter/
├── packages/ep-starter/     Pi package (/setup, scaffolds, skills)
├── docs/                    Local Herdr + Pi docs
├── skills/                  Skills for building plugins and extensions
├── examples/                Working Herdr plugins and Pi extensions
├── harness/templates/       Copy-and-start scaffolds
└── packages/ep-starter/GUIDE.md
```

## Commands

| Command | Purpose |
|---------|---------|
| `/setup` | Overview of connectable data sources |
| `/setup obsidian` | Brand vault / knowledge base scaffold |
| `/setup scaffold` | Pattern for any API, DB, or SaaS |
| `/scaffold <name>` | Generate a new data-source extension |
| `/agents` | Peer agents in Herdr (multi-agent work) |

## First source: Obsidian

After `/setup obsidian` and implementing the stubs with your agent:

> "Search my vault for winning hooks from last quarter."
> "Read the brand voice note and write 3 cold email openers."
> "List notes in /offers and draft a landing page section."

## Next sources (same path)

```
/scaffold spy-api          Meta/TikTok ad intel
/scaffold crm              HubSpot / Salesforce
/scaffold analytics        GA / ad platform metrics
/scaffold content-calendar Notion / Airtable boards
```

## Requirements

- [Pi](https://pi.dev)
- Optional: [Obsidian Headless](https://obsidian.md/help/headless)
- Optional: [Herdr](https://herdr.dev)

## Docs

- [GUIDE.md](./packages/ep-starter/GUIDE.md) — full walkthrough
- [docs/](./docs/) — Herdr + Pi reference (offline)
- [skills/](./skills/) — how to build more sources
