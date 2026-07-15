/**
 * simple-tool.ts — Minimal Pi extension example.
 *
 * Demonstrates: tool registration, event subscription, command registration,
 * and user interaction. A good starting point for learning the extension API.
 *
 * Place in: ~/.pi/agent/extensions/simple-tool.ts
 * Test with: pi -e ./simple-tool.ts
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function (pi: ExtensionAPI) {
  // ── 1. Listen for startup ─────────────────────────────
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("✅ Simple Tool extension loaded!", "success");
  });

  // ── 2. Register a tool the LLM can call ───────────────
  pi.registerTool({
    name: "calculate",
    label: "Calculate",
    description: "Perform basic arithmetic calculations",
    parameters: Type.Object({
      expression: Type.String({
        description: "Arithmetic expression (e.g., '2 + 2', '15 * 3')",
      }),
    }),
    async execute(toolCallId, params) {
      const { expression } = params;

      // SAFETY: Only allow safe arithmetic characters
      const sanitized = expression.replace(/[^0-9+\-*/.() ]/g, "");
      if (sanitized !== expression) {
        return {
          content: [
            {
              type: "text",
              text: "⚠️ Expression contained disallowed characters. Only numbers, +, -, *, /, ., (), and spaces are allowed.",
            },
          ],
        };
      }

      try {
        // eslint-disable-next-line no-eval
        const result = eval(sanitized);
        return {
          content: [
            {
              type: "text",
              text: `\`${expression}\` = **${result}**`,
            },
          ],
          details: { expression, result },
        };
      } catch (e: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error evaluating expression: ${e.message}`,
            },
          ],
        };
      }
    },
  });

  // ── 3. Register a /slash command ──────────────────────
  pi.registerCommand("echo", {
    description: "Echo back your input. Usage: /echo <message>",
    handler: async (args, ctx) => {
      if (!args) {
        ctx.ui.notify("Usage: /echo <message>", "warn");
        return;
      }
      ctx.ui.notify(`🔊 Echo: ${args}`, "info");
      return `🔊 ${args}`;
    },
  });

  // ── 4. Register a keyboard shortcut ───────────────────
  pi.registerShortcut("ctrl+shift+e", {
    description: "Open an echo prompt",
    handler: async (ctx) => {
      const msg = await ctx.ui.input("What should I echo?");
      if (msg) ctx.ui.notify(`🔊 ${msg}`, "info");
    },
  });

  // ── 5. Demonstrate user interaction ───────────────────
  pi.registerTool({
    name: "ask_user",
    label: "Ask User",
    description: "Ask the user a question and get their response",
    parameters: Type.Object({
      question: Type.String({ description: "The question to ask" }),
    }),
    async execute(toolCallId, params, _signal, _onUpdate, ctx) {
      const answer = await ctx.ui.input(params.question);
      return {
        content: [{ type: "text", text: `User responded: ${answer}` }],
        details: { question: params.question, answer },
      };
    },
  });

  // ── 6. Block dangerous operations (guard pattern) ─────
  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName === "bash") {
      const cmd = (event.input as any)?.command ?? "";
      if (cmd.includes("rm -rf /") || cmd.includes(":(){ :|:& };:")) {
        const ok = await ctx.ui.confirm(
          "🚨 Dangerous command detected",
          `Allow this?\n\n\`${cmd.slice(0, 200)}\``,
          { acceptLabel: "Allow", rejectLabel: "Block" }
        );
        if (!ok) {
          return { block: true, reason: "Blocked by user safety guard" };
        }
      }
    }
  });
}
