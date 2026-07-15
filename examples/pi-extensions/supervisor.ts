/**
 * supervisor.ts — Multi-agent supervisor extension for Pi.
 *
 * Coordinates multiple peer agents running in separate Herdr panes.
 * Demonstrates: tool registration, event handling, session management,
 * custom commands, and Herdr CLI integration.
 *
 * Place in: ~/.pi/agent/extensions/supervisor.ts
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execSync } from "node:child_process";

const HERDR = process.env.HERDR_BIN_PATH ?? "herdr";

function herdr(...args: string[]): any {
  const out = execSync(`"${HERDR}" ${args.join(" ")}`, {
    encoding: "utf-8",
    timeout: 30000,
  });
  return out.trim() ? JSON.parse(out) : null;
}

export default function (pi: ExtensionAPI) {
  // ── Tool: Parallel review — delegate to N agents ───────
  pi.registerTool({
    name: "parallel_review",
    label: "Parallel Review",
    description:
      "Send the same code/task to multiple peer agents in parallel and collect all their feedback.",
    parameters: Type.Object({
      task: Type.String({ description: "The code or task to review" }),
      agents: Type.Array(
        Type.String({ enum: ["codex", "claude", "opencode"] }),
        {
          description: "Which agents to use",
          minItems: 1,
          maxItems: 5,
        }
      ),
      timeout_ms: Type.Optional(Type.Number({ default: 180000 })),
    }),
    required: ["task", "agents"],
    async execute(params) {
      const { task, agents, timeout_ms = 180000 } = params;
      const results: Record<string, string> = {};
      const panes: Record<string, string> = {};

      // Launch all agents in parallel
      for (const agent of agents) {
        const split = herdr(
          "pane",
          "split",
          "--current",
          "--direction",
          "right",
          "--no-focus"
        );
        const pid = split.result.pane.pane_id;
        herdr("pane", "rename", pid, `reviewer-${agent}`);
        herdr("pane", "run", pid, agent);

        // Wait for ready
        execSync(
          `"${HERDR}" wait agent-status ${pid} --status idle --timeout 30000`,
          { stdio: "pipe" }
        );

        // Submit task
        herdr("pane", "run", pid, task);
        panes[agent] = pid;
      }

      // Collect results (wait for each)
      for (const [agent, pid] of Object.entries(panes)) {
        execSync(
          `"${HERDR}" wait agent-status ${pid} --status done --timeout ${timeout_ms}`,
          { stdio: "pipe" }
        );
        const output = execSync(
          `"${HERDR}" pane read ${pid} --source recent-unwrapped --lines 200`,
          { encoding: "utf-8" }
        );
        results[agent] = output;
      }

      // Format results
      const sections = Object.entries(results).map(
        ([agent, output]) =>
          `### ${agent}'s Review\n\n${output.slice(0, 2000)}`
      );

      return {
        content: [
          {
            type: "text",
            text: `# Parallel Review Results\n\n${sections.join("\n\n---\n\n")}`,
          },
        ],
        details: { panes, results_agents: Object.keys(results) },
      };
    },
  });

  // ── Tool: Orchestrated workflow ────────────────────────
  pi.registerTool({
    name: "orchestrate",
    label: "Orchestrate Workflow",
    description:
      "Run a multi-step workflow: one agent does step 1, passes results to step 2, etc. Each step runs in a fresh agent pane.",
    parameters: Type.Object({
      steps: Type.Array(
        Type.Object({
          name: Type.String({ description: "Step name" }),
          prompt: Type.String({ description: "What to ask the agent" }),
          agent: Type.String({
            enum: ["codex", "claude", "opencode", "pi"],
          }),
        }),
        { minItems: 1, maxItems: 5 }
      ),
    }),
    required: ["steps"],
    async execute(params) {
      const { steps } = params;
      let context = "";

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const fullPrompt = context
          ? `Context from previous step:\n${context}\n\n---\n\nNow: ${step.prompt}`
          : step.prompt;

        // Launch agent
        const split = herdr(
          "pane",
          "split",
          "--current",
          "--direction",
          "right",
          "--no-focus"
        );
        const pid = split.result.pane.pane_id;
        herdr("pane", "rename", pid, `step-${i + 1}-${step.agent}`);
        herdr("pane", "run", pid, step.agent);

        execSync(
          `"${HERDR}" wait agent-status ${pid} --status idle --timeout 30000`,
          { stdio: "pipe" }
        );
        herdr("pane", "run", pid, fullPrompt);

        execSync(
          `"${HERDR}" wait agent-status ${pid} --status done --timeout 180000`,
          { stdio: "pipe" }
        );
        context = execSync(
          `"${HERDR}" pane read ${pid} --source recent-unwrapped --lines 200`,
          { encoding: "utf-8" }
        );
      }

      return {
        content: [
          {
            type: "text",
            text: `# Orchestrated Workflow Complete\n\n## Final Result\n\n${context.slice(0, 4000)}`,
          },
        ],
        details: { steps_completed: steps.length },
      };
    },
  });

  // ── Command: /orchestrate <steps> ──────────────────────
  pi.registerCommand("orchestrate", {
    description:
      "Run an orchestrated multi-agent workflow. Usage: /orchestrate 'step1 prompt | codex' 'step2 prompt | claude'",
    handler: async (args, ctx) => {
      const lines = args.split("'").filter((s) => s.trim());
      // ... interactive orchestration
      ctx.ui.notify(`Parsed ${lines.length} step(s)`, "info");
    },
  });
}
