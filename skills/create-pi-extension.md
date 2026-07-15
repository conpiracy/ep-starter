---
name: create-pi-extension
description: >
 Create, develop, and package Pi extensions and Pi packages. Use when the user
 wants to build custom tools, event handlers, slash commands, UI components,
 or full pi packages that bundle extensions + skills + prompts + themes.
---

# Creating Pi Extensions & Packages

This skill teaches you to build Pi extensions (TypeScript modules that extend
Pi's behavior) and Pi packages (npm packages that bundle extensions, skills,
prompts, and themes).

## The Extension Architecture

```
Pi agent
  core: LLM router · tool registry · session manager
  extension layer:
    pi.registerTool / pi.on / pi.registerCommand
    pi.registerShortcut / pi.registerFlag / pi.registerProvider
    custom message/entry renderers
    ctx.ui · ctx.sessionManager
  package (optional):
    extension.ts + skills/ + prompts/ + themes/
    install via npm or git (pi install / pi add)
```

## Step 1 — Quick Start: Your First Extension

Create `~/.pi/agent/extensions/my-first-ext.ts`:

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function (pi: ExtensionAPI) {
 // 1. React to events
 pi.on("session_start", async (_event, ctx) => {
 ctx.ui.notify("Extension loaded! ", "info");
 });

 // 2. Block dangerous commands
 pi.on("tool_call", async (event, ctx) => {
 if (
 event.toolName === "bash" &&
 event.input.command?.includes("rm -rf")
 ) {
 const ok = await ctx.ui.confirm(
 " Dangerous command detected",
 `Allow: ${event.input.command}`
 );
 if (!ok) return { block: true, reason: "Blocked by user" };
 }
 });

 // 3. Register a custom tool
 pi.registerTool({
 name: "greet",
 label: "Greet",
 description: "Greet someone by name",
 parameters: Type.Object({
 name: Type.String({ description: "Name to greet" }),
 }),
 async execute(toolCallId, params, signal, onUpdate, ctx) {
 return {
 content: [{ type: "text", text: `Hello, ${params.name}! ` }],
 details: { greeted: params.name },
 };
 },
 });

 // 4. Register a slash command
 pi.registerCommand("hello", {
 description: "Say hello via command",
 handler: async (args, ctx) => {
 ctx.ui.notify(`Hello ${args || "world"}!`, "info");
 },
 });
}
```

Test it:
```bash
pi -e ~/.pi/agent/extensions/my-first-ext.ts
```

For auto-loading, place it in:
- `~/.pi/agent/extensions/*.ts` — global (all projects)
- `.pi/extensions/*.ts` — project-local (after trusting the project)

## Step 2 — The Extension API Surface

### Events — Lifecycle Hooks

```typescript
pi.on("event_name", async (event, ctx) => {
 // ctx.ui — user interaction
 // ctx.sessionManager — session control
 // ctx.model — model registry
 // ctx.signal — abort signal
});
```

| Event | When It Fires |
|-------|---------------|
| `startup` | Extension loaded, before session_start |
| `session_start` | A new session starts |
| `session_switch` | User switches to another session |
| `agent_start` / `agent_finish` | Agent begins/ends a generation |
| `tool_call` | Before a tool runs (can block) |
| `tool_result` | After a tool returns |
| `model_before` / `model_after` | Before/after LLM call |
| `user_bash_command` | Before bash execution |
| `user_input` | User submits a message |
| `message` | Any message in the conversation |
| `resources_discover` | Discover project resources |
| `shutdown` | Extension being unloaded |

### Tool Registration

```typescript
pi.registerTool({
 name: "my_tool", // Snake_case, used by LLM
 label: "My Tool", // Human-readable (optional)
 description: "What this tool does", // LLM sees this
 parameters: Type.Object({ // TypeBox schema
 input: Type.String({ description: "Input description" }),
 optional: Type.Optional(Type.Number()),
 }),
 // Optional: control when tool is available
 require: {
 acceptance: "required", // "required" | "optional" | "none"
 feature: "my_tool", // Feature flag name
 },
 async execute(toolCallId, params, signal, onUpdate, ctx) {
 // toolCallId: string — unique call ID
 // params: parsed parameters
 // signal: AbortSignal — respect this for cancellation
 // onUpdate: send streaming updates
 // ctx: ExtensionCommandContext

 // Report progress
 onUpdate({ kind: "status", key: "progress", value: "Processing..." });

 // Return result
 return {
 content: [{ type: "text", text: "Done!" }],
 details: { /* structured data */ },
 };
 },
});
```

### Command Registration

```typescript
pi.registerCommand("mycommand", {
 description: "Do something awesome",
 usage: "[args]", // Shown in /help
 hidden: false, // Hide from /help
 handler: async (args, ctx) => {
 // args: string — everything after /mycommand
 // ctx: ExtensionCommandContext
 return "Command output";
 },
});
```

### User Interaction

```typescript
// Notifications
ctx.ui.notify("Message", "info" | "warn" | "error" | "success");

// Confirm dialog
const ok = await ctx.ui.confirm("Title", "Are you sure?", {
 detail: "This will delete everything",
 acceptLabel: "Delete",
 rejectLabel: "Cancel",
});

// Select from options
const choice = await ctx.ui.select("Pick one", [
 { label: "Option A", value: "a" },
 { label: "Option B", value: "b" },
]);

// Text input
const name = await ctx.ui.input("Enter your name");

// Set footer status
ctx.ui.setStatus("my-ext", "Processing...");

// Set a widget above the editor
ctx.ui.setWidget("my-ext", ["Line 1", "Line 2"]);
```

### Session Management

```typescript
// Fork (branch) from a conversation entry
const newSession = await ctx.newSession({
 label: "Investigation branch",
 entries: [forkEntryId],
});

// Navigate the session tree
await ctx.navigateTree(targetEntryId, {
 createBranchIfLeaf: true,
});
```

## Step 3 — Custom TUI Components

```typescript
import { type ComponentChild, render } from "@earendil-works/pi-tui";
import { Box, Text, Input, Select, Key } from "@earendil-works/pi-tui";

// Register a custom tool that shows a TUI
pi.registerTool({
 name: "show_dashboard",
 label: "Dashboard",
 description: "Show an interactive dashboard",
 parameters: Type.Object({}),
 async execute(toolCallId, params, signal, onUpdate, ctx) {
 const result = await ctx.ui.custom(async (ui) => {
 // Build interactive TUI
 const screen = Box({
 children: [
 Text(" Dashboard", { bold: true }),
 Text("Press q to quit"),
 Box({
 border: true,
 children: [
 Text("CPU: 45%"),
 Text("Memory: 62%"),
 Text("Disk: 78%"),
 ],
 }),
 ],
 });

 ui.render(screen);
 await ui.waitForKey("q");
 return "closed";
 });

 return {
 content: [{ type: "text", text: "Dashboard closed" }],
 };
 },
});
```

## Step 4 — Creating a Pi Package

A Pi package is an npm package that bundles extensions, skills, prompts, and
themes. Published to npm, installable with `pi add`.

### Package Structure

```
my-package/
├── package.json ← Pi manifest in "pi" field
├── extension.ts ← Main extension (auto-loaded)
├── skills/
│ └── my-skill.md ← Bundled skills
├── prompts/
│ ├── review.md → /review
│ └── test.md → /test
├── themes/
│ └── my-theme.json ← Theme definitions
└── README.md
```

### package.json

```json
{
 "name": "@lzy/my-harness",
 "version": "0.1.0",
 "type": "module",
 "main": "extension.ts",
 "keywords": ["pi-package"],
 "pi": {
 "name": "my-harness",
 "description": "Harness extensions for multi-agent orchestration",
 "extensions": ["./extension.ts"],
 "skills": ["./skills"],
 "prompts": ["./prompts"],
 "themes": ["./themes"]
 },
 "dependencies": {
 "@earendil-works/pi-coding-agent": "^0.80.0",
 "typebox": "^0.32.0"
 }
}
```

### Extension with Herdr Integration

A common pattern: build a Pi extension that controls Herdr:

```typescript
// extension.ts — Herdr-aware Pi extension
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execSync } from "node:child_process";

const HERDR = process.env.HERDR_BIN_PATH ?? "herdr";

export default function (pi: ExtensionAPI) {
 // Tool: List all workspaces and their agents
 pi.registerTool({
 name: "herdr_status",
 description: "Show all Herdr workspaces, tabs, panes, and agent states",
 parameters: Type.Object({}),
 async execute() {
 const workspaces = JSON.parse(
 execSync(`${HERDR} workspace list`, { encoding: "utf-8" })
 );
 const lines = [];
 for (const ws of workspaces) {
 lines.push(`\n## Workspace ${ws.id}: ${ws.name}`);
 const panes = JSON.parse(
 execSync(`${HERDR} pane list --workspace ${ws.id}`, {
 encoding: "utf-8",
 })
 );
 for (const p of panes) {
 lines.push(
 ` ${p.pane_id} ${(p.agent || "bash").padEnd(12)} ${p.agent_status}`
 );
 }
 }
 return { content: [{ type: "text", text: lines.join("\n") }] };
 },
 });

 // Tool: Delegate a task to a peer agent
 pi.registerTool({
 name: "delegate",
 description: "Delegate a task to a peer agent in a new Herdr pane",
 parameters: Type.Object({
 task: Type.String({ description: "The task to delegate" }),
 agent_type: Type.String({
 description: "Which agent to use",
 enum: ["codex", "claude", "opencode", "pi"],
 }),
 timeout_ms: Type.Optional(
 Type.Number({ description: "Max wait time in ms", default: 180000 })
 ),
 }),
 required: ["task", "agent_type"],
 async execute(params) {
 const { task, agent_type, timeout_ms = 180000 } = params;

 // 1. Split a new pane
 const splitResult = execSync(
 `${HERDR} pane split --current --direction right --no-focus`,
 { encoding: "utf-8" }
 );
 const paneId = JSON.parse(splitResult).result.pane.pane_id;

 // 2. Label and launch the agent
 execSync(`${HERDR} pane rename ${paneId} "${agent_type}-delegate"`);
 execSync(`${HERDR} pane run ${paneId} "${agent_type}"`);

 // 3. Wait for idle, submit task
 execSync(
 `${HERDR} wait agent-status ${paneId} --status idle --timeout 30000`
 );
 execSync(`${HERDR} pane run ${paneId} "${task}"`);

 // 4. Wait for done, read output
 execSync(
 `${HERDR} wait agent-status ${paneId} --status done --timeout ${timeout_ms}`,
 { stdio: "pipe" }
 );
 const output = execSync(
 `${HERDR} pane read ${paneId} --source recent-unwrapped --lines 200`,
 { encoding: "utf-8" }
 );

 return {
 content: [{ type: "text", text: output }],
 details: { delegate_pane_id: paneId },
 };
 },
 });

 // Command: Show /agents status
 pi.registerCommand("agents", {
 description: "Show all agent panes and their status",
 handler: async (_args, ctx) => {
 const ws = process.env.HERDR_WORKSPACE_ID;
 if (!ws) {
 ctx.ui.notify("Not running inside Herdr", "warn");
 return;
 }
 const panes = JSON.parse(
 execSync(`${HERDR} pane list --workspace ${ws}`, { encoding: "utf-8" })
 );
 const lines = panes.map(
 (p: any) =>
 `${p.pane_id.padEnd(8)} ${(p.agent || "bash").padEnd(12)} ${p.agent_status}`
 );
 ctx.ui.notify(`Agents:\n${lines.join("\n")}`, "info");
 },
 });

 // Greeting on startup
 pi.on("session_start", async (_event, ctx) => {
 const ws = process.env.HERDR_WORKSPACE_ID ?? "unknown";
 ctx.ui.notify(
 ` Harness active in workspace ${ws}. Try /agents or ask me to delegate tasks.`,
 "info"
 );
 });
}
```

### Skill (bundled in package)

```markdown
# skills/herdr-operations.md
---
name: herdr-operations
description: >
 Control Herdr from inside Pi — split panes, run commands in other panes, read
 outputs, or orchestrate multi-agent workflows. Use when the task involves
 other agents, background work, or parallel execution.
---

## Context
- `$HERDR_WORKSPACE_ID` — current workspace
- `$HERDR_PANE_ID` — current pane
- `$HERDR_BIN_PATH` — path to herdr binary

## Commands
Split a pane: `herdr pane split --current --direction right --no-focus`
Run a command: `herdr pane run <id> "command"`
Read output: `herdr pane read <id> --source recent-unwrapped --lines N`
Wait for agent: `herdr wait agent-status <id> --status done --timeout N`
Check status: `herdr pane get <id>`
```

### Prompt Template (bundled in package)

```markdown
# prompts/review.md
---
name: review
description: "Request a code review with specific focus areas"
---
Review the following code for:

1. **Correctness** — bugs, edge cases, race conditions
2. **Security** — injection, auth, data exposure
3. **Performance** — bottlenecks, unnecessary allocations
4. **Style** — idiomatic patterns, readability

Be specific and actionable. Prioritize correctness and security above style.
```

### Theme (bundled in package)

```json
{
 "name": "harness-dark",
 "type": "dark",
 "colors": {
 "background": "#0d1117",
 "foreground": "#c9d1d9",
 "primary": "#58a6ff",
 "secondary": "#3fb950",
 "accent": "#bc8cff",
 "error": "#f85149",
 "warning": "#d29922",
 "success": "#3fb950",
 "border": "#30363d",
 "selection": "#264f78"
 }
}
```

## Step 5 — Installing and Managing Packages

```bash
# Install from npm
pi add @lzy/my-harness

# Install from git
pi install git:github.com/user/repo@v1

# Install local path
pi install /path/to/package

# Temporary test
pi -e ./my-extension.ts

# Reload extensions after changes
# (inside Pi) /reload
```

## Step 6 — Extension Recipes

| Recipe | What It Does | Key APIs |
|--------|-------------|----------|
| **Permission gate** | Confirm before dangerous commands | `pi.on('tool_call')`, `ctx.ui.confirm()` |
| **Git auto-stash** | Auto-stash at each turn, restore on rollback | `pi.on('user_input')`, `pi.exec()` |
| **Path protector** | Block writes to .env, node_modules/ | `pi.on('tool_call')` inspecting paths |
| **Herdr supervisor** | Orchestrate peer agents via Herdr | `pi.registerTool()`, `child_process` |
| **Custom compaction** | Summarize conversations your way | `pi.on('model_before')`, `ctx.compact()` |
| **Slack notifier** | Send agent updates to Slack | `pi.on('agent_finish')`, `fetch()` |
| **Log collector** | Collect tool outputs into a log file | `pi.on('tool_result')` |
| **Custom theme** | Full theme with custom colors | Theme JSON in package |

## Step 7 — SDK (Programmatic Usage)

For embedding Pi in other applications:

```typescript
import {
 createAgentSession,
 ModelRuntime,
 SessionManager,
} from "@earendil-works/pi-coding-agent";

const modelRuntime = await ModelRuntime.create();
const { session } = await createAgentSession({
 sessionManager: SessionManager.inMemory(),
 modelRuntime,
});

session.subscribe((event) => {
 if (
 event.type === "message_update" &&
 event.assistantMessageEvent.type === "text_delta"
 ) {
 process.stdout.write(event.assistantMessageEvent.delta);
 }
});

await session.prompt("What files are in the current directory?");
```

## Design Patterns

### Pattern 1: Guard Pattern (Block + Warn)

```typescript
pi.on("tool_call", async (event, ctx) => {
 if (event.toolName === "bash") {
 const cmd = event.input.command || "";
 if (cmd.includes("rm -rf /") || cmd.includes("> /dev/sda")) {
 return {
 block: true,
 reason: "Operation blocked: destructive system command detected",
 };
 }
 }
});
```

### Pattern 2: Context Injector (Add info to system prompt)

```typescript
pi.on("model_before", async (_event, ctx) => {
 const ws = process.env.HERDR_WORKSPACE_ID ?? "unknown";
 ctx.addSystemPrompt(
 `[Context] You are in Herdr workspace ${ws}. Use herdr_status to check peers.`
 );
});
```

### Pattern 3: Session Forker (Branch on long tasks)

```typescript
pi.registerTool({
 name: "investigate",
 description: "Fork a new session branch to investigate something",
 parameters: Type.Object({
 question: Type.String(),
 }),
 async execute(params, _signal, _onUpdate, ctx) {
 const branch = await ctx.newSession({
 label: `Investigate: ${params.question.slice(0, 50)}`,
 });
 await branch.prompt(params.question);
 return { content: [{ type: "text", text: "Branch created and running" }] };
 },
});
```

## Quick Reference

**Auto-discovery**
- `~/.pi/agent/extensions/*.ts` — global
- `.pi/extensions/*.ts` — project
- `~/.pi/agent/extensions/*/index.ts` — subdirectory

**Test**
- `pi -e ./my-ext.ts` — one-off
- `/reload` — hot-reload in session

**Core APIs**
- `pi.registerTool({ name, parameters, execute })`
- `pi.on(event, handler)`
- `pi.registerCommand(name, { description, handler })`
- `pi.sendMessage(content)`
- `pi.setModel(modelId)`
- `pi.exec(command, args)`
- `pi.registerShortcut(key, handler)`
- `pi.registerProvider(name, config)`

**Context**
- `ctx.ui.notify / confirm / select / input`
- `ctx.ui.setStatus / setWidget / custom`
- `ctx.sessionManager.fork()`
- `ctx.compact()` / `ctx.addSystemPrompt(text)`

**Package layout**
- `package.json` with `"pi"` field
- `extension.ts`, `skills/`, `prompts/`, `themes/`

**Install**
- `pi add @user/package`
- `pi install git:user/repo@ref`
- `pi install ./path`

