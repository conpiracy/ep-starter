# 🏭 ep-starter

> **Give your agents the data they need to do real work.**

Most agents are stuck in a chat box. They can write, but they can't *reach* the
things that make work useful — your brand vault, competitor intel, CRM notes,
analytics, content calendars, research docs.

**ep-starter** is the factory for wiring those sources into your agent harness
reliably. One guided setup at a time, every data source becomes a tool call.

```
  "Write three LinkedIn posts in our brand voice."
       │
       ▼
  agent reads brand notes from Obsidian ──► tool call
  agent pulls competitor ads from spy API ─► tool call
  agent drafts copy against both           ──► real work
```

## Why this exists

Agents get useful when they have **context from your world**:

| Who | Data they need | What the agent can do |
|-----|----------------|------------------------|
| **Marketers** | Brand vaults (Obsidian), swipe files, past campaigns | Write on-brand copy |
| **Marketers** | Spy / ad intel APIs | Research competitors, find angles |
| **Operators** | CRMs, Notion, sheets, tickets | Draft updates, triage, summarize |
| **Researchers** | Notes, papers, saved sources | Synthesize briefs and outlines |
| **Builders** | Repos, logs, deploy status | Ship code with full context |

Obsidian is the first showcase because marketers already live there — brand
voice, offers, proof, past winners. Wire the vault in once, and copywriting
stops being "generic AI" and starts being *your* agent with *your* materials.

Spy APIs are the same idea for competitive work: once the API is a tool, the
agent can research, compare, and draft without you pasting screenshots.

## The pattern

```
  /setup <source>
       │
       ▼
  guided wizard checks prerequisites
  generates a tool scaffold
  you + agent implement the stubs
       │
       ▼
  /reload
       │
       ▼
  "search my brand vault for hero claims"
  "pull Meta ads for competitor X"
  "draft 5 hooks from both"
       │
       ▼
  real work, tool-call away
```

You don't get a bloated plugin marketplace of half-working integrations.
You get a **reliable path** to wire any source your agent needs — and you
understand every piece because you built it with the agent.

## Quick start

```bash
# Install Pi
npm install -g @earendil-works/pi-coding-agent

# Install ep-starter
pi install git:github.com/conpiracy/ep-starter@main

# Run
pi
```

Inside Pi:

```
/setup              # see what you can connect
/setup obsidian     # first source: brand / knowledge vault
/scaffold spy-api   # next source: competitor intel, etc.
```

## Repo layout

```
ep-starter/
├── packages/ep-starter/     ← Pi package (/setup wizard, scaffolds, skills)
├── docs/                    ← Vendored Herdr + Pi docs (always local)
├── skills/                  ← Skills for building plugins & extensions
├── examples/                ← Working Herdr plugins + Pi extensions
├── harness/templates/       ← Copy-and-start scaffolds
├── packages/ep-starter/GUIDE.md
└── README.md                ← You are here
```

## What /setup does

| Command | Unlocks |
|---------|---------|
| `/setup` | Overview of connectable data sources |
| `/setup obsidian` | Brand vault / knowledge base access (scaffold) |
| `/setup scaffold` | Pattern for any API, DB, or SaaS |
| `/scaffold <name>` | Generate a new data-source extension |
| `/agents` | Peer agents in Herdr (multi-agent work) |

## First showcase: Obsidian for marketers

Marketers keep brand voice, offers, proof, and past campaigns in Obsidian.
After `/setup obsidian` and implementing the stubs with your agent:

> "Search my vault for winning hooks from last quarter."
> "Read the brand voice note and write 3 cold email openers."
> "List notes in /offers and draft a landing page section."

That's not a demo. That's an agent that can *do the job* because it has the data.

## Next sources (same path)

```
/scaffold spy-api          → Meta/TikTok ad spy tools
/scaffold crm              → HubSpot / Salesforce reads
/scaffold analytics        → GA / ad platform metrics
/scaffold content-calendar → Notion / Airtable boards
```

Each one follows the same factory path: scaffold → implement with agent →
`/reload` → tool call away.

## Requirements

- [Pi](https://pi.dev) — coding agent harness
- Optional: [Obsidian Headless](https://obsidian.md/help/headless) for vault sync
- Optional: [Herdr](https://herdr.dev) for multi-agent orchestration

## Docs

- **[GUIDE.md](./packages/ep-starter/GUIDE.md)** — full walkthrough
- **[docs/](./docs/)** — Herdr + Pi reference, offline
- **[skills/](./skills/)** — how to build more sources yourself

---

> **Agents don't need more chat. They need access.**
> Wire the data. Ship the work.
>
> *ep-starter — give your agents the data they need.*
