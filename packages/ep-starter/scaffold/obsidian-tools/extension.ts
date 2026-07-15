/**
 * obsidian-tools.ts — Obsidian vault access for Pi
 *
 * STUB: provide tools so the agent can search, read, and manage a vault
 * via local files and the optional `ob` CLI (Obsidian Headless).
 *
 * Prerequisites:
 *   npm install -g obsidian-headless
 *   ob login
 *   cd /path/to/vault && ob sync-setup --vault "Your Vault"
 *
 * Reference: https://obsidian.md/help/headless
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// Configure this
const VAULT_PATH = "/path/to/your/vault";

function ob(...args: string[]): string {
  return execSync(["ob", ...args].join(" "), {
    encoding: "utf-8",
    cwd: VAULT_PATH,
    timeout: 30000,
  });
}

function findMarkdownFiles(dir: string, base: string = ""): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = join(base, entry);
    if (statSync(full).isDirectory()) {
      if (!entry.startsWith(".")) results.push(...findMarkdownFiles(full, rel));
    } else if (entry.endsWith(".md")) {
      results.push(rel);
    }
  }
  return results;
}

export default function (pi: ExtensionAPI) {
  if (!existsSync(VAULT_PATH)) {
    pi.on("session_start", async (_event, ctx) => {
      ctx.ui.notify(`Vault not found at ${VAULT_PATH}`, "warn");
    });
    return;
  }

  // TODO: full-text search (grep, ripgrep, or FTS index)
  pi.registerTool({
    name: "obsidian_search",
    label: "Search Obsidian Vault",
    description: "Search the Obsidian vault for notes matching a query.",
    parameters: Type.Object({
      query: Type.String(),
      max_results: Type.Optional(Type.Number({ default: 10 })),
    }),
    required: ["query"],
    async execute(_toolCallId, params) {
      const { query, max_results = 10 } = params;
      return {
        content: [{ type: "text", text: `TODO: search vault for "${query}" (max ${max_results})` }],
        details: { query, max_results },
      };
    },
  });

  pi.registerTool({
    name: "obsidian_read",
    label: "Read Obsidian Note",
    description: "Read a note by relative path.",
    parameters: Type.Object({
      path: Type.String({ description: "Relative path (e.g. 'projects/idea.md')" }),
    }),
    required: ["path"],
    async execute(_toolCallId, params) {
      const fullPath = join(VAULT_PATH, params.path);
      if (!existsSync(fullPath)) {
        return { content: [{ type: "text", text: `Note not found: ${params.path}` }] };
      }
      const content = readFileSync(fullPath, "utf-8");
      return { content: [{ type: "text", text: `# ${params.path}\n\n${content}` }] };
    },
  });

  pi.registerTool({
    name: "obsidian_list",
    label: "List Obsidian Notes",
    description: "List notes in a folder.",
    parameters: Type.Object({
      folder: Type.Optional(Type.String({ default: "" })),
      recursive: Type.Optional(Type.Boolean({ default: false })),
    }),
    async execute(_toolCallId, params) {
      const dir = params.folder ? join(VAULT_PATH, params.folder) : VAULT_PATH;
      const files = findMarkdownFiles(dir);
      return {
        content: [{ type: "text", text: files.slice(0, 50).map((f) => `  - ${f}`).join("\n") }],
        details: { count: files.length },
      };
    },
  });

  // TODO: handle confirmation prompts from `ob sync`
  pi.registerTool({
    name: "obsidian_sync",
    label: "Sync Obsidian Vault",
    description: "Trigger ob sync.",
    parameters: Type.Object({}),
    async execute() {
      try {
        const output = ob("sync");
        return { content: [{ type: "text", text: `Sync done\n${output.slice(0, 1000)}` }] };
      } catch (e: any) {
        return { content: [{ type: "text", text: `Sync failed: ${e.message}` }] };
      }
    },
  });

  pi.on("session_start", async (_event, ctx) => {
    const count = findMarkdownFiles(VAULT_PATH).length;
    ctx.ui.notify(
      `Obsidian vault: ${count} notes\nTools are stubs — implement them, then /reload.`,
      "info"
    );
  });
}
