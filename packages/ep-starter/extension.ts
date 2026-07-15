/**
 * ep-starter — connect data sources so a Pi agent can work from real materials.
 *
 * Commands:
 *   /setup       Map of data sources + guided connect wizards
 *   /agents      Peer agents in the current Herdr workspace
 *   /scaffold    Generate a new data-source extension
 *
 * Marketers wire brand vaults (Obsidian) and spy/ad APIs.
 * Operators wire CRMs, tickets, analytics.
 * Builders wire repos, logs, deploy status.
 */

import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execSync } from "node:child_process";
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// -- Helpers ------------------------------------------------

function checkHerdr(): boolean {
  return process.env.HERDR_ENV === "1";
}

function checkObsidianHeadless(): boolean {
  try {
    execSync("ob --version 2>/dev/null", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function checkObsidianLoggedIn(): boolean {
  try {
    const out = execSync("ob login 2>&1", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return !out.includes("not logged in") && !out.includes("error");
  } catch {
    return false;
  }
}

function piExtensionsDir(): string {
  return join(homedir(), ".pi", "agent", "extensions");
}

// -- Extension ----------------------------------------------

export default function (pi: ExtensionAPI) {
  const inHerdr = checkHerdr();

  pi.registerCommand("setup", {
    description:
      "Connect data sources so the agent can work from your materials (brand vaults, spy APIs, CRMs, custom tools).",
    usage: "[obsidian|scaffold|help]",
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const topic = args.trim().toLowerCase();

      if (topic === "obsidian" || topic === "ob") {
        await guideObsidianSetup(ctx);
      } else if (topic === "scaffold") {
        await guideScaffold(ctx);
      } else if (topic === "help" || !topic) {
        await showWelcome(ctx, inHerdr);
      } else {
        ctx.ui.notify(
          `Unknown topic "${topic}". Try /setup obsidian or /setup scaffold`,
          "warn"
        );
      }
    },
  });

  if (inHerdr) {
    pi.registerCommand("agents", {
      description: "List all agent panes in the current Herdr workspace",
      handler: async (_args: string, ctx: ExtensionCommandContext) => {
        try {
          const herdr = process.env.HERDR_BIN_PATH ?? "herdr";
          const ws = process.env.HERDR_WORKSPACE_ID;
          const panes = JSON.parse(
            execSync(`${herdr} pane list --workspace ${ws}`, {
              encoding: "utf-8",
            })
          );
          const lines = [
            `Agents in workspace ${ws}`,
            "",
            `${"PANE ID".padEnd(10)} ${"AGENT".padEnd(14)} ${"STATUS".padEnd(12)} LABEL`,
            `${"-------".padEnd(10)} ${"-----".padEnd(14)} ${"------".padEnd(12)} -----`,
          ];
          for (const p of panes) {
            lines.push(
              `${p.pane_id.padEnd(10)} ${(p.agent || "bash").padEnd(14)} ${(
                p.agent_status || "?"
              ).padEnd(12)} ${p.label || ""}`
            );
          }
          ctx.ui.notify(lines.join("\n"), "info");
        } catch (e: any) {
          ctx.ui.notify(`Failed to list agents: ${e.message}`, "error");
        }
      },
    });
  }

  pi.registerCommand("scaffold", {
    description:
      "Generate a data-source extension. Usage: /scaffold <name>  e.g. spy-api, crm, analytics",
    usage: "<name>",
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const name = args.trim();
      if (!name) {
        ctx.ui.notify(
          "Usage: /scaffold <name>\nExamples: /scaffold spy-api  /scaffold crm  /scaffold analytics",
          "warn"
        );
        return;
      }

      const extDir = piExtensionsDir();
      if (!existsSync(extDir)) {
        mkdirSync(extDir, { recursive: true });
      }

      const target = join(extDir, `${name}.ts`);
      if (existsSync(target)) {
        ctx.ui.notify(
          `Extension already exists: ${target}\nEdit it or choose a different name.`,
          "warn"
        );
        return;
      }

      writeFileSync(target, generateScaffold(name), "utf-8");
      ctx.ui.notify(
        `Created ${target}\n\nEdit the stubs, then /reload.`,
        "success"
      );
    },
  });

  pi.on("session_start", async (_event, ctx) => {
    const lines = [
      "ep-starter loaded",
      "Connect data sources so the agent can work from your materials.",
      "",
      "  /setup            map of connectable sources",
      "  /setup obsidian   brand vault (first walkthrough for marketers)",
    ];
    if (inHerdr) {
      lines.push("  /agents           peer agents in this workspace");
    }
    lines.push("  /scaffold <name>  new source (spy-api, crm, ...)");
    lines.push("");
    lines.push("Guide: https://github.com/conpiracy/ep-starter");
    ctx.ui.notify(lines.join("\n"), "info");
  });
}

// -- Obsidian setup -----------------------------------------

async function guideObsidianSetup(ctx: ExtensionCommandContext) {
  const ui = ctx.ui;

  ui.notify(
    "Connect a brand / knowledge vault\n\n" +
      "Marketers keep brand voice, offers, proof, and past winners in Obsidian.\n" +
      "Once the vault is wired in, the agent can write from those materials\n" +
      "instead of inventing generic copy.\n\n" +
      "This wizard generates a tool scaffold. You and the agent implement it next.",
    "info"
  );

  const hasNode = await ui.confirm(
    "Step 1: Prerequisites",
    "Do you have Node.js 22+ installed?\nCheck with: node --version"
  );
  if (!hasNode) {
    ui.notify(
      "Install Node.js 22+ from https://nodejs.org, then run /setup obsidian again.",
      "warn"
    );
    return;
  }

  const installed = checkObsidianHeadless();
  if (!installed) {
    const installNow = await ui.confirm(
      "Step 2: Install Obsidian Headless",
      "Run: npm install -g obsidian-headless\n\n" +
        "Installs the 'ob' CLI so you can sync vaults from the command line\n" +
        "without the desktop app.\n\nInstall now?"
    );
    if (installNow) {
      try {
        ui.notify("Installing obsidian-headless...", "info");
        execSync("npm install -g obsidian-headless", {
          stdio: "pipe",
          timeout: 60000,
        });
        ui.notify("Installed.", "success");
      } catch (e: any) {
        ui.notify(
          `Install failed: ${e.message}\nTry manually: npm install -g obsidian-headless`,
          "error"
        );
        return;
      }
    } else {
      ui.notify(
        "When ready:\n  npm install -g obsidian-headless\n\nThen run /setup obsidian again.",
        "info"
      );
      return;
    }
  } else {
    ui.notify("obsidian-headless is installed.", "success");
  }

  const loggedIn = checkObsidianLoggedIn();
  if (!loggedIn) {
    const loginNow = await ui.confirm(
      "Step 3: Log in to Obsidian",
      "Run: ob login\n\n" +
        "Needs an Obsidian account with Sync or Publish.\n\n" +
        "Log in now? (prompts for email/password)"
    );
    if (loginNow) {
      ui.notify(
        "Running ob login... complete it in the terminal, then return here.",
        "info"
      );
      try {
        execSync("ob login", { stdio: "inherit", timeout: 30000 });
      } catch {
        ui.notify(
          "Login interrupted or failed. Try:\n  ob login\n\nThen /setup obsidian again.",
          "warn"
        );
        return;
      }
    } else {
      ui.notify(
        "When ready:\n  ob login\n\nThen /setup obsidian again.",
        "info"
      );
      return;
    }
  } else {
    ui.notify("Already logged in to Obsidian.", "success");
  }

  ui.notify(
    "Step 4: Check available vaults\n\n" +
      "  ob sync-list-remote\n\n" +
      "Create one if needed:\n  ob sync-create-remote --name \"My Agent Vault\"",
    "info"
  );

  const hasVault = await ui.confirm(
    "Step 4 (continued)",
    "Do you have a remote vault ready to sync?"
  );
  if (!hasVault) {
    ui.notify(
      "Create and sync:\n" +
        "  ob sync-create-remote --name \"My Vault\"\n" +
        "  cd /path/to/vault\n" +
        "  ob sync-setup --vault \"My Vault\"\n\n" +
        "Then /setup obsidian again.",
      "info"
    );
    return;
  }

  const vaultPath = await ui.input(
    "Local path to your synced vault\n(e.g. /home/you/vaults/my-vault):"
  );
  if (!vaultPath || !existsSync(vaultPath)) {
    ui.notify(
      "Path missing or empty. Set up sync first:\n" +
        "  mkdir -p /path/to/vault && cd /path/to/vault\n" +
        "  ob sync-setup --vault \"Your Vault\"\n  ob sync\n\n" +
        "Then /setup obsidian again.",
      "warn"
    );
    return;
  }

  const extDir = piExtensionsDir();
  if (!existsSync(extDir)) {
    mkdirSync(extDir, { recursive: true });
  }

  const targetExt = join(extDir, "obsidian-tools.ts");
  if (existsSync(targetExt)) {
    const overwrite = await ui.confirm(
      "Extension exists",
      "obsidian-tools.ts already exists. Overwrite?"
    );
    if (!overwrite) {
      ui.notify(
        "Keeping existing extension. Reference scaffold:\n" +
          "packages/ep-starter/scaffold/obsidian-tools/extension.ts",
        "info"
      );
      return;
    }
  }

  writeFileSync(targetExt, generateObsidianScaffold(vaultPath), "utf-8");

  ui.notify(
    `Brand vault scaffold ready\n\n` +
      `Extension: ${targetExt}\n` +
      `Vault:     ${vaultPath}\n\n` +
      `What marketers get once implemented:\n` +
      `  - search brand voice, offers, proof, past campaigns\n` +
      `  - read specific notes for copy\n` +
      `  - list folders like /offers, /proof, /campaigns\n` +
      `  - sync latest vault changes before writing\n\n` +
      `Tool stubs (implement next):\n` +
      `  obsidian_search  find notes by keyword / claim\n` +
      `  obsidian_read    pull a note by path\n` +
      `  obsidian_list    browse vault folders\n` +
      `  obsidian_sync    trigger ob sync\n\n` +
      `Next steps:\n` +
      `  1. Implement with your agent (stubs have TODOs):\n` +
      `     "Read ~/.pi/agent/extensions/obsidian-tools.ts and\n` +
      `      implement search with ripgrep for brand folders."\n` +
      `  2. /reload\n` +
      `  3. Ask for work that needs the vault:\n` +
      `     "Search my vault for hero claims and write 3 LinkedIn posts."\n` +
      `     "Read brand-voice.md and draft a cold email sequence."\n` +
      `     "List notes in /proof and pick 5 testimonials."\n\n` +
      `Other sources (same path):\n` +
      `  /scaffold spy-api    competitor intel\n` +
      `  /scaffold crm        customer context\n` +
      `  /scaffold analytics  performance data`,
    "success"
  );
}

// -- Scaffold guide -----------------------------------------

async function guideScaffold(ctx: ExtensionCommandContext) {
  ctx.ui.notify(
    "Wire any data source\n\n" +
      "Same path as Obsidian: generate a scaffold, implement tools with\n" +
      "your agent, /reload, then ask for work that needs that data.\n\n" +
      "Marketer examples:\n" +
      "  /scaffold spy-api           competitor ad / creative intel\n" +
      "  /scaffold crm               HubSpot / Salesforce context\n" +
      "  /scaffold analytics         ad + web metrics\n" +
      "  /scaffold content-calendar  Notion / Airtable boards\n\n" +
      "Operator / builder examples:\n" +
      "  /scaffold support-inbox     tickets / Intercom\n" +
      "  /scaffold db-query          warehouse or app DB\n\n" +
      "Files land in ~/.pi/agent/extensions/",
    "info"
  );
}

// -- Welcome ------------------------------------------------

async function showWelcome(ctx: ExtensionCommandContext, inHerdr: boolean) {
  const lines = [
    "ep-starter",
    "Connect data sources so the agent can work from your materials.",
    "",
    "  brand vaults · spy APIs · CRMs · analytics · more",
    "",
    "  /setup obsidian    brand vault (first walkthrough for marketers)",
    "  /setup scaffold    pattern for any data source",
  ];
  if (inHerdr) {
    lines.push("  /agents            peer agents in this workspace");
  }
  lines.push(
    "  /scaffold <name>   spy-api, crm, analytics, ...",
    "",
    "  Guide: https://github.com/conpiracy/ep-starter",
    "",
    "Typical path:",
    "",
    "  1. /setup obsidian",
    "     Connect brand voice, offers, proof, past campaigns.",
    "     Then write copy that uses those materials.",
    "",
    "  2. /scaffold spy-api",
    "     Connect competitor intel the same way.",
    "     Then research and draft without manual paste.",
    "",
    "  3. /reload and ask for work that needs the sources.",
  );
  ctx.ui.notify(lines.join("\n"), "info");
}

// -- Scaffold generators ------------------------------------

function generateScaffold(name: string): string {
  const className = name
    .split(/[-_]/)
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join("");
  const envKey = name.toUpperCase().replace(/-/g, "_") + "_API_KEY";

  return `/**
 * ${name}.ts — data-source extension for Pi
 *
 * Wire a real system (API, vault, CRM, DB) so the agent can call it as tools.
 * Marketers: spy APIs, brand vaults, content calendars.
 * Operators: CRM, tickets, analytics.
 * Builders: repos, logs, deploy status.
 *
 * 1. Put credentials in env vars (never hardcode secrets)
 * 2. Implement tools that fetch / search / write the source
 * 3. /reload and ask for work that needs this data
 *
 * Docs: docs/pi/extensions.txt
 * Guide: packages/ep-starter/GUIDE.md
 */

import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function (pi: ExtensionAPI) {
  // Replace with real data access.
  // Marketers: search_ads, get_creative, list_offers
  // Ops: get_deal, list_tickets, fetch_metrics
  pi.registerTool({
    name: "${name}_query",
    label: "${className} Query",
    description: "Query this data source. Replace with your real API/DB/vault call.",
    parameters: Type.Object({
      input: Type.String({ description: "What to fetch or search for" }),
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      // TODO: call your API / DB / file system
      // Prefer process.env.${envKey}
      return {
        content: [{
          type: "text",
          text: \`TODO: implement ${name} query for: \${params.input}\`,
        }],
        details: { input: params.input },
      };
    },
  });

  pi.registerCommand("${name}", {
    description: "Run ${name}. Usage: /${name} <args>",
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      ctx.ui.notify(\`${name}: \${args || "(no args)"}\`, "info");
    },
  });

  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify(\`${name} extension loaded\`, "success");
  });
}
`;
}

function generateObsidianScaffold(vaultPath: string): string {
  return `/**
 * obsidian-tools.ts — Obsidian vault access for Pi
 *
 * STUB: fill in the tool implementations below.
 *
 * Prerequisites:
 *   npm install -g obsidian-headless
 *   ob login
 *   cd ${vaultPath} && ob sync-setup --vault "Your Vault"
 *
 * Reference: https://obsidian.md/help/headless
 *
 * After implementing, /reload, then try:
 *   "search my vault for meeting notes"
 *   "read the note about project planning"
 *   "list all notes in the /projects folder"
 *   "sync my vault"
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const VAULT_PATH = "${vaultPath}";

function ob(...args: string[]): string {
  return execSync(["ob", ...args].join(" "), {
    encoding: "utf-8",
    cwd: VAULT_PATH,
    timeout: 30000,
  });
}

function vaultReady(): boolean {
  return existsSync(VAULT_PATH);
}

function findMarkdownFiles(dir: string, base: string = ""): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = join(base, entry);
    if (statSync(full).isDirectory()) {
      if (!entry.startsWith(".")) {
        results.push(...findMarkdownFiles(full, rel));
      }
    } else if (entry.endsWith(".md")) {
      results.push(rel);
    }
  }
  return results;
}

export default function (pi: ExtensionAPI) {
  if (!vaultReady()) {
    pi.on("session_start", async (_event, ctx) => {
      ctx.ui.notify(
        \`Obsidian vault not found at \${VAULT_PATH}\\n\` +
          "Update VAULT_PATH in the extension or set up sync.",
        "warn"
      );
    });
    return;
  }

  // TODO: implement full-text search (grep, ripgrep, or FTS index)
  pi.registerTool({
    name: "obsidian_search",
    label: "Search Obsidian Vault",
    description:
      "Search the Obsidian vault for notes matching a query. " +
      "Returns matching file paths with snippet previews.",
    parameters: Type.Object({
      query: Type.String({ description: "Search query (grep-style patterns ok)" }),
      max_results: Type.Optional(
        Type.Number({ description: "Max results", default: 10 })
      ),
      folder: Type.Optional(
        Type.String({ description: "Limit search to a subfolder" })
      ),
    }),
    required: ["query"],
    async execute(toolCallId, params) {
      const { query, max_results = 10, folder = "" } = params;
      const searchDir = folder ? join(VAULT_PATH, folder) : VAULT_PATH;

      // TODO: e.g. grep -rl or rg -l against searchDir
      return {
        content: [{
          type: "text",
          text:
            "obsidian_search is a stub.\\n\\n" +
            \`Query: "\${query}"\\n\` +
            \`Dir: \${searchDir}\\n\` +
            \`Max: \${max_results}\\n\\n\` +
            "Implement search in this file (see TODOs).",
        }],
        details: { query, folder, max_results },
      };
    },
  });

  pi.registerTool({
    name: "obsidian_read",
    label: "Read Obsidian Note",
    description: "Read a note in the Obsidian vault by relative path.",
    parameters: Type.Object({
      path: Type.String({
        description: "Relative path (e.g. 'projects/idea.md')",
      }),
    }),
    required: ["path"],
    async execute(toolCallId, params) {
      const fullPath = join(VAULT_PATH, params.path);
      if (!existsSync(fullPath)) {
        return {
          content: [{
            type: "text",
            text: \`Note not found: \${params.path}\\n\` +
              "TODO: fuzzy-match similar paths.",
          }],
        };
      }
      // TODO: strip frontmatter? resolve wikilinks?
      const content = readFileSync(fullPath, "utf-8");
      return {
        content: [{ type: "text", text: \`# \${params.path}\\n\\n\${content}\` }],
        details: { path: params.path, size: content.length },
      };
    },
  });

  pi.registerTool({
    name: "obsidian_list",
    label: "List Obsidian Notes",
    description: "List markdown notes in a vault folder.",
    parameters: Type.Object({
      folder: Type.Optional(
        Type.String({ description: "Subfolder (default: vault root)" })
      ),
      recursive: Type.Optional(
        Type.Boolean({ description: "Include subfolders", default: false })
      ),
    }),
    async execute(toolCallId, params) {
      const { folder = "" } = params;
      const targetDir = folder ? join(VAULT_PATH, folder) : VAULT_PATH;
      const files = findMarkdownFiles(targetDir);
      const truncated =
        files.length > 50
          ? [...files.slice(0, 50), \`... and \${files.length - 50} more\`]
          : files;
      return {
        content: [{
          type: "text",
          text:
            \`## Notes in \${folder || "(root)"}\\n\\n\` +
            truncated.map((f) => \`  - \${f}\`).join("\\n") +
            \`\\n\\nTotal: \${files.length} notes\`,
        }],
        details: { folder, files_count: files.length },
      };
    },
  });

  pi.registerTool({
    name: "obsidian_sync",
    label: "Sync Obsidian Vault",
    description: "Run Obsidian Headless sync for the configured vault.",
    parameters: Type.Object({
      continuous: Type.Optional(
        Type.Boolean({ description: "Watch for changes", default: false })
      ),
    }),
    async execute(toolCallId, params) {
      const { continuous = false } = params;
      try {
        const args = continuous ? ["sync", "--continuous"] : ["sync"];
        const output = ob(...args);
        return {
          content: [{
            type: "text",
            text: \`Sync completed\\n\\n\${output.slice(0, 2000)}\`,
          }],
        };
      } catch (e: any) {
        return {
          content: [{ type: "text", text: \`Sync failed: \${e.message}\` }],
        };
      }
    },
  });

  pi.registerCommand("obsidian", {
    description:
      "Vault shortcuts. Usage: /obsidian <search|sync|status|list> [query]",
    handler: async (args, ctx) => {
      const parts = args.trim().split(/\\s+/);
      const cmd = parts[0]?.toLowerCase();

      if (cmd === "status") {
        try {
          ctx.ui.notify(ob("sync-status").slice(0, 1000), "info");
        } catch (e: any) {
          ctx.ui.notify(\`Status check failed: \${e.message}\`, "error");
        }
      } else if (cmd === "sync") {
        try {
          ctx.ui.notify("Syncing vault...", "info");
          ob("sync");
          ctx.ui.notify("Sync complete", "success");
        } catch (e: any) {
          ctx.ui.notify(\`Sync failed: \${e.message}\`, "error");
        }
      } else if (cmd === "list") {
        const folder = parts.slice(1).join(" ") || "";
        const files = findMarkdownFiles(
          folder ? join(VAULT_PATH, folder) : VAULT_PATH
        );
        ctx.ui.notify(
          \`\${folder || "root"}: \${files.length} notes\\n\` +
            files.slice(0, 20).join("\\n") +
            (files.length > 20 ? \`\\n... and \${files.length - 20} more\` : ""),
          "info"
        );
      } else if (cmd === "search") {
        const query = parts.slice(1).join(" ");
        if (!query) {
          ctx.ui.notify("Usage: /obsidian search <query>", "warn");
          return;
        }
        ctx.ui.notify(
          \`Search for "\${query}" — implement in obsidian-tools.ts\`,
          "info"
        );
      } else {
        ctx.ui.notify(
          "Usage:\\n  /obsidian status\\n  /obsidian sync\\n" +
            "  /obsidian list [dir]\\n  /obsidian search <q>",
          "info"
        );
      }
    },
  });

  pi.on("session_start", async (_event, ctx) => {
    const fileCount = findMarkdownFiles(VAULT_PATH).length;
    ctx.ui.notify(
      \`Obsidian vault: \${VAULT_PATH} (\${fileCount} notes)\\n\\n\` +
        "Tools are stubs — implement TODOs in\\n" +
        "~/.pi/agent/extensions/obsidian-tools.ts then /reload.\\n\\n" +
        "Then try:\\n" +
        '  "search my vault for meeting notes"\\n' +
        '  "list notes in projects"\\n' +
        '  "sync my vault"',
      "info"
    );
  });
}
`;
}
