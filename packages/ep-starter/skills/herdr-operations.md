---
name: herdr-operations
description: >
 Control Herdr from inside Pi — split panes, delegate tasks to peer agents,
 read outputs, and orchestrate multi-agent workflows. Use when the task
 involves other agents, background work, or parallel execution.
---

# Herdr Operations

You are running inside a Herdr pane. You can control other panes via the
`herdr` CLI using tools registered by the ep-starter extension.

## Context

```bash
echo "$HERDR_WORKSPACE_ID $HERDR_TAB_ID $HERDR_PANE_ID"
```

## Available Tools

- `herdr_status()` — List all panes and agent states
- `herdr_delegate(task, agent_type, timeout?)` — Delegate to a peer agent
- `herdr_run(command, wait_for?, timeout?)` — Run a command in a new pane

## Commands

```
/agents → List peer agents in this workspace
```

## Patterns

**Split and run:** `herdr_run("npm test", "PASS|FAIL")`

**Delegate to peer:** `herdr_delegate("Review this code", "codex")`

**Parallel review:** Use the supervisor pattern — delegate to multiple agents.
