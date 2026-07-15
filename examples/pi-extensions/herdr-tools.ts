/**
 * herdr-tools.ts — Pi extension that controls Herdr.
 *
 * Tools for inspecting panes, checking agent state, splitting panes,
 * delegating tasks to peer agents, and reading their output.
 *
 * Place in: ~/.pi/agent/extensions/herdr-tools.ts
 * Test with: pi -e ./herdr-tools.ts
 * Reload: /reload
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execSync } from "node:child_process";

const HERDR = process.env.HERDR_BIN_PATH ?? "herdr";

function herdr(...args: string[]): any {
  try {
    const out = execSync(`"${HERDR}" ${args.join(" ")}`, {
      encoding: "utf-8",
      timeout: 30000,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return out.trim() ? JSON.parse(out) : null;
  } catch (err: any) {
    const stderr = err.stderr?.toString() ?? "";
    throw new Error(`herdr ${args.join(" ")} failed: ${stderr}`);
  }
}

function isInHerdr(): boolean {
  return process.env.HERDR_ENV === "1";
}

export default function (pi: ExtensionAPI) {
  if (!isInHerdr()) {
    pi.on("session_start", async (_event, ctx) => {
      ctx.ui.notify(
        "Not running inside Herdr. Herdr tools will not work.",
        "warn"
      );
    });
    return;
  }

  pi.registerTool({
    name: "herdr_status",
    label: "Herdr Status",
    description:
      "Show all Herdr panes, their agents, and statuses in the current workspace.",
    parameters: Type.Object({}),
    async execute() {
      const ws = process.env.HERDR_WORKSPACE_ID;
      const panes = herdr("pane", "list", "--workspace", ws);
      const lines = [
        `## Workspace ${ws}`,
        "",
        "| Pane ID | Agent | Status | Label |",
        "|---------|-------|--------|-------|",
      ];
      for (const p of panes) {
        lines.push(
          `| ${p.pane_id} | ${p.agent || "bash"} | ${p.agent_status} | ${p.label || ""} |`
        );
      }
      lines.push("", `Total: ${panes.length} pane(s)`);
      return {
        content: [{ type: "text", text: lines.join("\n") }],
        details: { panes },
      };
    },
  });

  pi.registerTool({
    name: "herdr_delegate",
    label: "Delegate to Peer Agent",
    description:
      "Split a new Herdr pane, start a peer agent (codex, claude, opencode, or pi), " +
      "delegate a task, and wait for the result.",
    parameters: Type.Object({
      task: Type.String({ description: "Task prompt for the peer agent" }),
      agent_type: Type.String({
        description: "Which agent to launch",
        enum: ["codex", "claude", "opencode", "pi"],
      }),
      timeout_ms: Type.Optional(
        Type.Number({ description: "Max wait time in ms", default: 180000 })
      ),
    }),
    required: ["task", "agent_type"],
    async execute(params) {
      const { task, agent_type, timeout_ms = 180000 } = params;

      const splitResult = herdr(
        "pane", "split", "--current", "--direction", "right", "--no-focus"
      );
      const paneId = splitResult.result.pane.pane_id;
      herdr("pane", "rename", paneId, `${agent_type}-delegate`);
      herdr("pane", "run", paneId, agent_type);
      herdr("wait", "agent-status", paneId, "--status", "idle", "--timeout", "30000");
      herdr("pane", "run", paneId, task);

      let timedOut = false;
      try {
        execSync(
          `"${HERDR}" wait agent-status ${paneId} --status done --timeout ${timeout_ms}`,
          { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }
        );
      } catch {
        timedOut = true;
      }

      const output = execSync(
        `"${HERDR}" pane read ${paneId} --source recent-unwrapped --lines 200`,
        { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }
      );

      return {
        content: [{
          type: "text",
          text:
            `Delegated to ${agent_type} (pane ${paneId})\n\n` +
            output.slice(0, 4000),
        }],
        details: { delegate_pane_id: paneId, agent_type, timed_out: timedOut },
      };
    },
  });

  pi.registerTool({
    name: "herdr_run",
    label: "Run in New Pane",
    description:
      "Split a new pane and run a shell command. Optionally wait for output matching a pattern.",
    parameters: Type.Object({
      command: Type.String({ description: "Shell command to run" }),
      wait_for: Type.Optional(
        Type.String({ description: "Text pattern to wait for in output" })
      ),
      timeout_ms: Type.Optional(
        Type.Number({ description: "Max wait time in ms", default: 60000 })
      ),
    }),
    required: ["command"],
    async execute(params) {
      const { command, wait_for, timeout_ms = 60000 } = params;
      const splitResult = herdr(
        "pane", "split", "--current", "--direction", "right", "--no-focus"
      );
      const paneId = splitResult.result.pane.pane_id;
      herdr("pane", "rename", paneId, "task-runner");
      herdr("pane", "run", paneId, command);

      let output = "";
      if (wait_for) {
        execSync(
          `"${HERDR}" wait output ${paneId} --match "${wait_for}" --timeout ${timeout_ms}`,
          { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }
        );
        output = execSync(
          `"${HERDR}" pane read ${paneId} --source recent-unwrapped --lines 200`,
          { encoding: "utf-8" }
        );
      }

      return {
        content: [{
          type: "text",
          text:
            `Command running in pane ${paneId}\n\`${command}\`\n\n` +
            (output ? output.slice(0, 3000) : "Pane created, command started."),
        }],
        details: { pane_id: paneId },
      };
    },
  });

  pi.registerCommand("agents", {
    description: "List all agent panes and their status in this workspace",
    handler: async (_args, ctx) => {
      try {
        const ws = process.env.HERDR_WORKSPACE_ID;
        const panes = herdr("pane", "list", "--workspace", ws);
        const lines = panes.map(
          (p: any) =>
            `${p.pane_id.padEnd(10)} ${(p.agent || "bash").padEnd(14)} ${p.agent_status}`
        );
        ctx.ui.notify(`Agents in workspace ${ws}:\n${lines.join("\n")}`, "info");
      } catch (e: any) {
        ctx.ui.notify(`Failed: ${e.message}`, "error");
      }
    },
  });

  pi.on("session_start", async (_event, ctx) => {
    const ws = process.env.HERDR_WORKSPACE_ID ?? "unknown";
    ctx.ui.notify(
      `Harness active in workspace ${ws}\n` +
        "  /agents to see peers\n" +
        '  "delegate a code review to codex"\n' +
        '  "check the status of all agents"',
      "info"
    );
  });
}
