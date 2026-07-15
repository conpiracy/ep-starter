# ep-starter

Pi package that wires data sources into your agent — brand vaults, spy APIs, CRMs, analytics, content systems — so the agent can work from real materials instead of inventing context.

## The problem

Without your data, agents produce generic output:

- Marketer asks for copy → agent invents brand voice
- Marketer asks for competitive angles → agent guesses from training data
- Operator asks for a status update → agent has no CRM or ticket context

Once Obsidian, a spy API, or a CRM is a tool, the agent can do the job with *your* materials.

## Commands

| Command | Purpose |
|---------|---------|
| `/setup` | Map of data sources you can connect |
| `/setup obsidian` | Brand / knowledge vault (guided scaffold) |
| `/setup scaffold` | Pattern for any API or SaaS |
| `/scaffold <name>` | Generate a new data-source extension |
| `/agents` | Peer agents in Herdr |

## Why Obsidian first

Marketers already store high-value context in Obsidian:

- brand voice and positioning
- offers, proof, testimonials
- past winning campaigns and swipe files
- research notes and customer language

`/setup obsidian` walks through connecting that vault. After you implement the stubs with your agent, copywriting uses your library.

## Why spy APIs next

Same path, different data:

| Source | Agent can |
|--------|-----------|
| Ad spy APIs | Pull competitor creatives, angles, hooks |
| Brand vault | Match those angles to your voice and offers |
| Together | Research → draft → iterate without manual paste |

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

## After a source is wired

```
"Search my vault for hero claims and write 3 LinkedIn posts."
"Read the brand voice note and draft a cold email sequence."
"List notes in /proof and pull 5 testimonials for a landing page."
"Sync the vault so I have the latest campaign notes."
```

## Package layout

```
packages/ep-starter/
├── extension.ts              /setup wizard + scaffold generator
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

## Factory idea

We don't ship every integration pre-built and half-maintained.

We ship a path:

1. Guided setup for a data source
2. Scaffold with clear tool stubs
3. You + agent implement against real credentials
4. `/reload` → source is available as a tool

Same path for Obsidian, spy APIs, CRMs, analytics, whatever the work needs.

## Requirements

- [Pi](https://pi.dev)
- Optional: [Obsidian Headless](https://obsidian.md/help/headless)
- Optional: [Herdr](https://herdr.dev)

Full repo: [github.com/conpiracy/ep-starter](https://github.com/conpiracy/ep-starter)
