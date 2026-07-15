---
name: obsidian-vault
description: >
  Access and search an Obsidian vault via the 'ob' CLI (Obsidian Headless).
  Use when the user asks about their notes, wants to search knowledge base,
  read specific notes, or sync their vault. Only use if obsidian-tools
  extension is loaded and configured.
---

# Obsidian Vault Access

This skill works with the `obsidian-tools` Pi extension. After the extension
is loaded (/reload), your agent can search, read, and manage notes in your
Obsidian vault using the tools registered by the extension.

## Commands

The `/obsidian` command provides quick access:

```
/obsidian status       → Check sync status
/obsidian sync         → Trigger sync
/obsidian list [dir]   → List notes in a folder
/obsidian search <q>   → Search notes
```

## Available Tools

The extension registers four tools the LLM can call:

- `obsidian_search(query, max_results?)` — full-text search
- `obsidian_read(path)` — read a note by relative path
- `obsidian_list(folder?, recursive?)` — list notes in a folder
- `obsidian_sync()` — trigger ob sync

## Usage Examples

Ask your agent naturally:

> "Search my vault for meeting notes from last week."
> "Read the note about project architecture."
> "List all notes in the projects folder."
> "Sync my vault to get the latest changes."
> "What notes do I have about machine learning?"
