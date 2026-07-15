# 🏭 ep-starter

> **Give your agents the data they need to do real work.**

ep-starter is a [Pi](https://pi.dev) package that makes it easy and reliable to
wire any data source into your agent — brand vaults, spy APIs, CRMs, analytics,
content systems — so the agent can actually *accomplish* work, not just chat.

## The problem

Agents without your data write generic output.

- A marketer asks for copy → agent invents brand voice
- A marketer asks for competitive angles → agent guesses from training data
- An operator asks for a status update → agent has no CRM or ticket context

The unlock is **reliable access**: once Obsidian, a spy API, or a CRM is a tool
call, the agent can do the job with *your* materials.

## What this package does

| Command | What it unlocks |
|---------|-----------------|
| `/setup` | Map of data sources you can connect |
| `/setup obsidian` | Brand / knowledge vault access (guided scaffold) |
| `/setup scaffold` | Pattern for any API or SaaS |
| `/scaffold <name>` | Generate a new data-source extension |
| `/agents` | Peer agents in Herdr for multi-agent work |

## Why Obsidian first

Marketers already store the good stuff in Obsidian:

- brand voice and positioning
- offers, proof, testimonials
- past winning campaigns and swipe files
- research notes and customer language

`/setup obsidian` walks you through connecting that vault. After you implement
the stubs with your agent, copywriting stops being generic AI and starts using
*your* library.

## Why spy APIs next

Same pattern, different data:

| Source | Agent can |
|--------|-----------|
| Ad spy APIs | Pull competitor creatives, angles, hooks |
| Brand vault | Match those angles to your voice and offers |
| Together | Research → draft → iterate without paste-and-pray |

```
/scaffold spy-api
# implement tools with your agent
/reload
# "pull top Meta ads for competitor X and draft 5 hooks in our brand voice"
```

## Install

```bash
npm install -g @earendil-works/pi-coding-agent
pi install git:github.com/conpiracy/ep-starter@main
pi
```

Then:

```
/setup
/setup obsidian
```

## After setup: tool-call away

Once a source is wired:

```
"Search my vault for hero claims and write 3 LinkedIn posts."
"Read the brand voice note and draft a cold email sequence."
"List notes in /proof and pull 5 testimonials for a landing page."
"Sync the vault so I have the latest campaign notes."
```

That's the product: **data in → work out**.

## Package layout

```
packages/ep-starter/
├── extension.ts              ← /setup wizard + scaffold generator
├── skills/
│   ├── obsidian-vault.md     ← when/how to use vault tools
│   └── herdr-operations.md   ← multi-agent operations
├── prompts/
│   ├── review.md
│   └── note.md               ← save findings back to the vault
├── themes/
├── scaffold/obsidian-tools/  ← reference scaffold
├── GUIDE.md                  ← full walkthrough
└── README.md
```

## The factory idea

We don't ship every integration pre-built and half-maintained.

We ship a **reliable path**:

1. Guided setup for a data source
2. Scaffold with clear tool stubs
3. You + agent implement against real credentials
4. `/reload` → source is a tool call away

Same path for Obsidian, spy APIs, CRMs, analytics, whatever the work needs.

## Requirements

- [Pi](https://pi.dev)
- Optional: [Obsidian Headless](https://obsidian.md/help/headless)
- Optional: [Herdr](https://herdr.dev) for multi-agent work

Full repo + docs: [github.com/conpiracy/ep-starter](https://github.com/conpiracy/ep-starter)

---

> **Agents don't need more chat. They need access.**
> *ep-starter — give your agents the data they need.*
