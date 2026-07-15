/**
 * extension.ts — main extension for your Pi package
 *
 * Entry point for the package. Extend with tools, event handlers, commands.
 *
 * Package docs: docs/pi/packages.txt
 * Extension API: docs/pi/extensions.txt
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    const ws = process.env.HERDR_WORKSPACE_ID ?? "standalone";
    ctx.ui.notify(`Package loaded in ${ws}`, "info");
  });

  pi.registerTool({
    name: "my_tool",
    label: "My Tool",
    description: "Describe what this tool does for the LLM",
    parameters: Type.Object({
      input: Type.String({ description: "Input description" }),
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      return {
        content: [{ type: "text", text: `Processed: ${params.input}` }],
        details: { input: params.input },
      };
    },
  });

  pi.registerCommand("mytool", {
    description: "Run my custom command. Usage: /mytool <args>",
    handler: async (args, ctx) => {
      ctx.ui.notify(`mytool: ${args || "(no args)"}`, "info");
    },
  });

  // Guard example — block dangerous bash
  // pi.on("tool_call", async (event, ctx) => {
  //   if (event.toolName === "bash") {
  //     const cmd = (event.input as any)?.command ?? "";
  //     if (cmd.includes("rm -rf /")) {
  //       const ok = await ctx.ui.confirm("Confirm", `Allow: ${cmd}`);
  //       if (!ok) return { block: true, reason: "Blocked" };
  //     }
  //   }
  // });
}
