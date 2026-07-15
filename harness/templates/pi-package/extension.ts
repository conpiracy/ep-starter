/**
 * extension.ts — Main extension for your Pi package
 *
 * This is the entry point for your Pi package. It runs when Pi loads this
 * package. Extend it with custom tools, event handlers, commands, and more.
 *
 * Package docs: docs/pi/packages.txt
 * Extension API: docs/pi/extensions.txt
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function (pi: ExtensionAPI) {
  // ── Startup ────────────────────────────────────────────
  pi.on("session_start", async (_event, ctx) => {
    const ws = process.env.HERDR_WORKSPACE_ID ?? "standalone";
    ctx.ui.notify(`🧰 Harness "${pi.packageName}" loaded in ${ws}`, "info");
  });

  // ── Custom Tools ───────────────────────────────────────

  pi.registerTool({
    name: "my_tool",
    label: "My Tool",
    description: "Describe what this tool does for the LLM",
    parameters: Type.Object({
      input: Type.String({ description: "Input description" }),
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      // onUpdate({ kind: "status", key: "progress", value: "..." });
      return {
        content: [{ type: "text", text: `Processed: ${params.input}` }],
        details: { input: params.input },
      };
    },
  });

  // ── Slash Commands ─────────────────────────────────────

  pi.registerCommand("mytool", {
    description: "Run my custom command. Usage: /mytool <args>",
    handler: async (args, ctx) => {
      ctx.ui.notify(`Ran mytool with: ${args || "(no args)"}`, "info");
    },
  });

  // ── Event Hooks (examples — uncomment what you need) ──

  // Guard: block dangerous bash commands
  // pi.on("tool_call", async (event, ctx) => {
  //   if (event.toolName === "bash") {
  //     const cmd = (event.input as any)?.command ?? "";
  //     if (cmd.includes("rm -rf /")) {
  //       const ok = await ctx.ui.confirm("⚠️ Confirm", `Allow: ${cmd}`);
  //       if (!ok) return { block: true, reason: "Blocked" };
  //     }
  //   }
  // });

  // Inject context before each model call
  // pi.on("model_before", async (_event, ctx) => {
  //   ctx.addSystemPrompt("[Custom context injected by my-harness]");
  // });
}
