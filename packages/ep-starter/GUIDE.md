# ep-starter Guide

How to connect data sources so a Pi agent can do work that depends on your materials — brand vaults, spy APIs, CRMs, analytics, and more.

---

## Idea

```
YOUR WORLD                         AGENT

Obsidian brand vault  ──tools──►  on-brand copy
Spy / ad intel APIs   ──tools──►  competitor research
CRM / tickets         ──tools──►  updates, triage
Analytics             ──tools──►  reports + recommendations
Content calendars     ──tools──►  plan + produce
```

Without access, agents invent. With access, they use your materials.

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

---

## Source 1: Obsidian for marketers

### Why first

Marketers keep high-value context in Obsidian:

- brand voice and positioning
- offers, ICPs, objections
- proof, testimonials, case notes
- past winners and swipe files
- research and customer language

Once the vault is a tool:

> "Search my vault for winning hooks from Q1 and write 5 new LinkedIn openers
> in our brand voice."

### Architecture

```
You ask for copy
  → Pi agent
  → obsidian_search / obsidian_read  (extension you implement)
  → local vault files (+ optional `ob` CLI for sync)
```

### Walkthrough

**1. Prerequisites**

- Node.js 22+
- Obsidian account with Sync if you want remote vault sync

**2. Install Obsidian Headless (optional, recommended)**

```bash
npm install -g obsidian-headless
ob login
```

Docs: https://obsidian.md/help/headless

**3. Sync a vault locally**

```bash
ob sync-list-remote
mkdir -p ~/vaults/brand
cd ~/vaults/brand
ob sync-setup --vault "Your Vault Name"
ob sync
```

**4. Run the wizard**

```
/setup obsidian
```

It checks Node / `ob` / login, asks for the vault path, generates
`~/.pi/agent/extensions/obsidian-tools.ts`, and lists next steps.

**5. Implement the tools with your agent**

The scaffold is a stub on purpose. Implement it so tools match *your* vault layout.

> "Read ~/.pi/agent/extensions/obsidian-tools.ts and implement
> `obsidian_search` with ripgrep. Prefer folders like /brand, /offers, /proof."

| Tool | Job |
|------|-----|
| `obsidian_search` | Find notes by claim, offer, campaign, keyword |
| `obsidian_read` | Pull a specific brand / research note |
| `obsidian_list` | Browse folders (offers, proof, campaigns) |
| `obsidian_sync` | Pull latest vault changes |

**6. Reload and use**

```
/reload
```

Examples:

> "Search my vault for hero claims and write 3 cold email openers."
> "Read brand-voice.md and rewrite this landing page section."
> "List notes in /proof and pick 5 testimonials for a case study."

---

## Source 2: Spy APIs for competitive work

Same path. Different data.

### Why it matters

Competitive research is usually manual: dashboards, screenshots, lost context.
Once a spy API is a tool, the agent can:

1. pull competitor creatives / hooks
2. cross-check your vault for brand fit
3. draft angles that are informed, not invented

### Scaffold

```
/scaffold spy-api
```

Creates `~/.pi/agent/extensions/spy-api.ts`. Then implement with your agent:

> "Implement tools for our ad spy API: search ads by brand, fetch creative
> details, and summarize hooks. Put the API key in env SPY_API_KEY."

| Tool | Job |
|------|-----|
| `spy_search_ads` | Find competitor ads by brand / keyword |
| `spy_get_creative` | Fetch a specific ad / landing page |
| `spy_summarize_angles` | Extract hooks, offers, CTAs |

### Combined workflow

```
1. spy_search_ads("competitor X")
2. obsidian_search("brand voice")
3. draft 5 hooks that fit both
```

---

## General pattern (any data source)

```
/setup or /scaffold <name>
  → generate extension with tool stubs
  → implement against real credentials
  → /reload
  → ask for work that needs that data
```

Examples:

```
/scaffold crm              HubSpot / Salesforce
/scaffold analytics        ad + web metrics
/scaffold content-calendar Notion / Airtable
/scaffold support-inbox    Intercom / Zendesk
```

---

## Multi-agent (optional, Herdr)

If you run inside [Herdr](https://herdr.dev):

```
/agents
"delegate competitor research to codex while I draft with vault context"
```

One agent researches via spy tools. Another writes with vault tools.

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
│   └── note.md
├── themes/
├── scaffold/obsidian-tools/
├── GUIDE.md
└── README.md
```

Wider factory (docs, examples, templates):
https://github.com/conpiracy/ep-starter

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Agent writes generic copy | Vault not connected or search not implemented |
| `ob: command not found` | `npm install -g obsidian-headless` |
| Spy tools fail auth | Keys in env vars; never hardcode in the extension |
| Extension not loading | `/reload`; check `~/.pi/agent/extensions/` |
| Want a new source | `/scaffold <name>` and implement with the agent |

---

## Design principles

1. **Access over chat** — the bottleneck is data, not prompts.
2. **Scaffold, don't fake** — generate real stubs; implement against real systems.
3. **Own the integration** — no black-box plugins you can't fix.
4. **Work-shaped tools** — search vault, pull ads, list offers.
5. **Compose sources** — vault + spy + CRM is how real jobs get done.
