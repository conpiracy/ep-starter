# 🏗️ Data Sources & Templates Quick Reference

> **Give your agents the data they need to do real work.**

ep-starter is not a plugin zoo. It's a reliable path to wire any source —
brand vaults, spy APIs, CRMs, analytics — into the agent as tool calls.

## What's available

```
skills/
├── create-herdr-plugin.md       Build Herdr workflow plugins
└── create-pi-extension.md       Build Pi data-source extensions

packages/ep-starter/
├── extension.ts                 /setup · /scaffold · /agents
├── skills/obsidian-vault.md     Brand vault usage skill
├── GUIDE.md                     Full walkthrough
└── scaffold/obsidian-tools/     Reference vault scaffold

examples/
├── herdr-plugins/               Working Herdr plugins
└── pi-extensions/               Working Pi extensions

harness/templates/
├── herdr-plugin/                Copy-and-start Herdr plugin
└── pi-package/                  Copy-and-start Pi package
```

## Path: connect a source

```
/setup                    # map of sources
/setup obsidian           # brand vault (marketers first)
/scaffold spy-api         # competitor intel next
# implement stubs with your agent
/reload
# ask for real work that needs that data
```

## Why Obsidian first (marketers)

| Vault holds | Agent can |
|-------------|-----------|
| Brand voice | Write on-brand copy |
| Offers / ICPs | Target the right angle |
| Proof / testimonials | Ground claims in real material |
| Past winners | Reuse what already worked |

## Why spy APIs next (marketers)

| API holds | Agent can |
|-----------|-----------|
| Competitor ads | Research angles without dashboards |
| Creatives / hooks | Draft informed alternatives |
| + brand vault | Match intel to *your* voice |

## Quick starts

### Brand vault

```
/setup obsidian
# follow wizard → implement stubs → /reload
# "Search my vault for hero claims and write 3 LinkedIn posts."
```

### Any new source

```
/scaffold spy-api
# edit ~/.pi/agent/extensions/spy-api.ts with your agent
/reload
# "Pull top Meta ads for competitor X and draft 5 hooks."
```

### Herdr plugin

```bash
cp -r harness/templates/herdr-plugin/ my-plugin
cd my-plugin
# edit herdr-plugin.toml + scripts
herdr plugin link .
herdr plugin action invoke your-name.plugin-name.my-action
```

## Skills for building more

When you want the agent to create a new source:

> "Read skills/create-pi-extension.md and scaffold tools for our ad spy API."

> "Read skills/create-herdr-plugin.md and build a plugin that notifies Slack when agents finish."
