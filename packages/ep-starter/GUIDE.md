# 📖 ep-starter Guide

> **Give your agents the data they need to do real work.**

This guide is for people who want agents that can *ship work* — not just chat.
If you're a marketer, operator, researcher, or builder, the path is the same:
connect the data sources your work depends on, then let the agent use them.

---

## The idea in one picture

```
  YOUR WORLD                         AGENT WORLD
  ─────────                          ───────────

  Obsidian brand vault  ──tools──►  write on-brand copy
  Spy / ad intel APIs   ──tools──►  research competitors
  CRM / tickets         ──tools──►  draft updates, triage
  Analytics             ──tools──►  report + recommend
  Content calendars     ──tools──►  plan + produce

  ep-starter makes each of those arrows reliable.
```

Without access, agents invent. With access, agents *use your materials*.

---

## Install

```bash
npm install -g @earendil-works/pi-coding-agent
pi install git:github.com/conpiracy/ep-starter@main
pi
```

Inside Pi:

```
/setup
```

You'll see the map of what you can connect.

---

## Showcase 1: Obsidian for marketers

### Why this is the first unlock

Marketers already keep the high-value context in Obsidian:

- brand voice and positioning
- offers, ICPs, objections
- proof, testimonials, case notes
- past winners and swipe files
- research and customer language

Once the vault is a tool, prompts like this stop being fantasy:

> "Search my vault for winning hooks from Q1 and write 5 new LinkedIn openers
> in our brand voice."

### What you'll build

```
  You ask for copy
        │
        ▼
  Pi agent
        │  obsidian_search / obsidian_read
        ▼
  obsidian-tools.ts  (Pi extension you implement)
        │  local files + optional `ob` CLI
        ▼
  Your Obsidian vault
```

### Walkthrough

#### 1. Prerequisites

- Node.js 22+
- An Obsidian account with Sync (for headless vault sync) if you want remote sync

#### 2. Install Obsidian Headless (optional but recommended)

```bash
npm install -g obsidian-headless
ob login
```

Headless lets agents and servers sync vaults without the desktop app.
See: https://obsidian.md/help/headless

#### 3. Sync a vault locally

```bash
ob sync-list-remote
mkdir -p ~/vaults/brand
cd ~/vaults/brand
ob sync-setup --vault "Your Vault Name"
ob sync
```

#### 4. Run the wizard

```
/setup obsidian
```

It will:

1. Check Node / `ob` / login
2. Ask for your local vault path
3. Generate `~/.pi/agent/extensions/obsidian-tools.ts`
4. Show how to implement + reload

#### 5. Build the tools with your agent

The scaffold is intentionally a **stub**. You implement it with the agent so
the tools match *your* vault layout and workflow.

Example prompt:

> "Read ~/.pi/agent/extensions/obsidian-tools.ts and implement
> `obsidian_search` with ripgrep. Prefer folders like /brand, /offers, /proof."

| Tool | Job |
|------|-----|
| `obsidian_search` | Find notes by claim, offer, campaign, keyword |
| `obsidian_read` | Pull a specific brand / research note |
| `obsidian_list` | Browse folders (offers, proof, campaigns) |
| `obsidian_sync` | Pull latest vault changes |

#### 6. Reload and use

```
/reload
```

Then:

> "Search my vault for hero claims and write 3 cold email openers."
> "Read brand-voice.md and rewrite this landing page section."
> "List notes in /proof and pick 5 testimonials for a case study."

**That's the point:** brand data is now a tool call away.

---

## Showcase 2: Spy APIs for competitive work

Same factory path. Different data. Bigger unlock for marketers.

### Why it matters

Competitive research is tedious. Paste screenshots, hop dashboards, lose
context. Once a spy API is a tool, the agent can:

1. pull competitor creatives / hooks
2. cross-check your vault for brand fit
3. draft angles that are informed, not invented

### Scaffold it

```
/scaffold spy-api
```

This creates `~/.pi/agent/extensions/spy-api.ts`.

Then implement with your agent:

> "Implement tools for our ad spy API: search ads by brand, fetch creative
> details, and summarize hooks. Put the API key in env SPY_API_KEY."

Typical tools:

| Tool | Job |
|------|-----|
| `spy_search_ads` | Find competitor ads by brand / keyword |
| `spy_get_creative` | Fetch a specific ad / landing page |
| `spy_summarize_angles` | Extract hooks, offers, CTAs |

### Combined workflow

```
agent:
  1. spy_search_ads("competitor X")
  2. obsidian_search("brand voice")
  3. draft 5 hooks that fit both
```

That's marketers using agents to **accomplish work**, not just generate text.

---

## The general pattern (any data source)

```
/setup or /scaffold <name>
        │
        ▼
generate extension with clear tool stubs
        │
        ▼
implement with your agent against real credentials
        │
        ▼
/reload
        │
        ▼
ask for work that needs that data
```

Examples:

```
/scaffold crm              → HubSpot / Salesforce context
/scaffold analytics        → ad + web metrics
/scaffold content-calendar → Notion / Airtable boards
/scaffold support-inbox    → Intercom / Zendesk reads
```

Every source follows the same reliable path. No mystery marketplace plugins —
you own the integration.

---

## Multi-agent (optional, Herdr)

If you run inside [Herdr](https://herdr.dev), data access pairs with parallel work:

```
/agents
"delegate competitor research to codex while I draft with vault context"
```

One agent researches via spy tools. Another writes with vault tools.
You stay in one terminal.

---

## Package contents

```
packages/ep-starter/
├── extension.ts              /setup, /scaffold, /agents
├── skills/
│   ├── obsidian-vault.md
│   └── herdr-operations.md
├── prompts/
│   ├── review.md
│   └── note.md               save findings back into the vault
├── themes/
├── scaffold/obsidian-tools/
├── GUIDE.md
└── README.md
```

The wider factory (docs, examples, templates) lives at the repo root:
https://github.com/conpiracy/ep-starter

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Agent writes generic copy | Vault not connected or search not implemented |
| `ob: command not found` | `npm install -g obsidian-headless` |
| Spy tools fail auth | Put keys in env vars; never hardcode in the extension |
| Extension not loading | `/reload`; check `~/.pi/agent/extensions/` |
| Want a new source | `/scaffold <name>` and implement with the agent |

---

## Design principles

1. **Access over chat** — the bottleneck is data, not prompts.
2. **Scaffold, don't fake** — generate real stubs; implement against real systems.
3. **Own the integration** — no black-box plugins you can't fix.
4. **Work-shaped tools** — search vault, pull ads, list offers — not abstract "AI helpers."
5. **Compose sources** — vault + spy + CRM is how real jobs get done.

---

> **Agents don't need more chat. They need access.**
>
> Wire the data. Ship the work.
>
> *ep-starter*
