/**
 * ep-starter — Give your agents the data they need to do real work.
 *
 * Provides:
 *   /setup       Map of data sources + guided connect wizards
 *   /agents      List peer agents in the current Herdr workspace
 *   /scaffold    Generate a new data-source extension
 *
 * This is how marketers, operators, and builders wire brand vaults (Obsidian),
 * spy/ad intel APIs, CRMs, analytics, and other systems into the agent as
 * reliable tool calls — so the agent can accomplish work, not invent context.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  "Agents don't need more chat. They need access." — ep-starter
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

// ── Helpers ──────────────────────────────────────────────

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

// ── The Extension ────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  const inHerdr = checkHerdr();

  // ── /setup — Connect data sources your agent needs ──
  pi.registerCommand("setup", {
    description:
      "🧰 Connect data sources so your agent can do real work — brand vaults, spy APIs, CRMs, custom tools.",
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

  // ── /agents — List peer agents ──────────────────────
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
            `🧰 Agents in workspace ${ws}`,
            "",
            "```",
            `${"PANE ID".padEnd(10)} ${"AGENT".padEnd(14)} ${"STATUS".padEnd(12)} LABEL`,
            `${"───────".padEnd(10)} ${"─────".padEnd(14)} ${"──────".padEnd(12)} ─────`,
          ];
          for (const p of panes) {
            lines.push(
              `${p.pane_id.padEnd(10)} ${(p.agent || "bash").padEnd(14)} ${(
                p.agent_status || "?"
              ).padEnd(12)} ${p.label || ""}`
            );
          }
          lines.push("```");
          ctx.ui.notify(lines.join("\n"), "info");
        } catch (e: any) {
          ctx.ui.notify(`Failed to list agents: ${e.message}`, "error");
        }
      },
    });
  }

  // ── /scaffold — Generate a new data-source extension ─
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
          `Extension already exists: ${target}\nEdit it directly or choose a different name.`,
          "warn"
        );
        return;
      }

      const scaffold = generateScaffold(name);
      writeFileSync(target, scaffold, "utf-8");

      ctx.ui.notify(
        `✅ Created extension: ${target}\n\nRun /reload to load it, or edit it first.`,
        "success"
      );
    },
  });

  // ── Startup greeting ─────────────────────────────────
  pi.on("session_start", async (_event, ctx) => {
    const lines = [
      "🏭 ep-starter loaded",
      "   Give your agents the data they need to do real work.",
      "",
      "  /setup            → Map of connectable data sources",
      "  /setup obsidian   → Brand vault access (marketers' first unlock)",
    ];
    if (inHerdr) {
      lines.push("  /agents           → Peer agents in this workspace");
    }
    lines.push("  /scaffold <name>  → Wire a new source (spy-api, crm, ...)");
    lines.push("");
    lines.push("📖 Guide: https://github.com/conpiracy/ep-starter");

    ctx.ui.notify(lines.join("\n"), "info");
  });
}

// ── Guide: Obsidian Setup ────────────────────────────────

async function guideObsidianSetup(ctx: ExtensionCommandContext) {
  const ui = ctx.ui;

  ui.notify(
    "═══ 📓 Connect a brand / knowledge vault ═══\n\n" +
      "Marketers keep brand voice, offers, proof, and past winners in Obsidian.\n" +
      "Once the vault is wired in, your agent can write from *your* materials\n" +
      "instead of inventing generic copy.\n\n" +
      "This wizard sets up the path. You and the agent implement the tools next.\n" +
      "After that, vault access is a tool call away.",
    "info"
  );

  // Step 1: Check Node.js
  const hasNode = await ui.confirm(
    "Step 1: Prerequisites",
    "Do you have Node.js 22+ installed?\nCheck with: node --version"
  );
  if (!hasNode) {
    ui.notify(
      "Please install Node.js 22+ from https://nodejs.org then run /setup obsidian again.",
      "warn"
    );
    return;
  }

  // Step 2: Install obsidian-headless
  const installed = checkObsidianHeadless();
  if (!installed) {
    const installNow = await ui.confirm(
      "Step 2: Install Obsidian Headless",
      "Run: npm install -g obsidian-headless\n\n" +
        "This installs the 'ob' CLI that lets you sync vaults\n" +
        "from the command line, without the desktop app.\n\nInstall now?"
    );
    if (installNow) {
      try {
        ui.notify("Installing obsidian-headless...", "info");
        execSync("npm install -g obsidian-headless", {
          stdio: "pipe",
          timeout: 60000,
        });
        ui.notify("✅ Installed!", "success");
      } catch (e: any) {
        ui.notify(
          `Install failed: ${e.message}\nTry manually: npm install -g obsidian-headless`,
          "error"
        );
        return;
      }
    } else {
      ui.notify(
        "Run this manually when ready:\n  npm install -g obsidian-headless\n\nThen run /setup obsidian again.",
        "info"
      );
      return;
    }
  } else {
    ui.notify("✅ obsidian-headless is already installed.", "success");
  }

  // Step 3: Log in to Obsidian
  const loggedIn = checkObsidianLoggedIn();
  if (!loggedIn) {
    const loginNow = await ui.confirm(
      "Step 3: Log in to Obsidian",
      "Run: ob login\n\n" +
        "You'll need an Obsidian account with an active\n" +
        "Sync or Publish subscription.\n\n" +
        "Log in now? (will prompt for email/password)"
    );
    if (loginNow) {
      ui.notify(
        "Running ob login in a separate terminal...\n" +
          "Complete the login there, then come back.",
        "info"
      );
      try {
        execSync("ob login", { stdio: "inherit", timeout: 30000 });
      } catch {
        ui.notify(
          "Login interrupted or failed. Try manually:\n  ob login\n\nThen run /setup obsidian again.",
          "warn"
        );
        return;
      }
    } else {
      ui.notify(
        "Run manually when ready:\n  ob login\n\nThen run /setup obsidian again.",
        "info"
      );
      return;
    }
  } else {
    ui.notify("✅ Already logged in to Obsidian.", "success");
  }

  // Step 4: Show available vaults
  ui.notify(
    "Step 4: Check available vaults\n\n" +
      "Run this to see your remote vaults:\n  ob sync-list-remote\n\n" +
      "If you don't have one yet, create it:\n  ob sync-create-remote --name \"My Agent Vault\"",
    "info"
  );

  const hasVault = await ui.confirm(
    "Step 4 (cont.)",
    "Do you have a remote vault ready to sync?"
  );
  if (!hasVault) {
    ui.notify(
      "Create one with:\n  ob sync-create-remote --name \"My Vault\"\n\nThen sync it to a local directory:\n  cd /path/to/vault\n  ob sync-setup --vault \"My Vault\"\n\nAfter that, run /setup obsidian again.",
      "info"
    );
    return;
  }

  // Step 5: Confirm vault path
  const vaultPath = await ui.input(
    "Enter the local path to your synced vault\n(e.g., /home/you/vaults/my-vault):"
  );
  if (!vaultPath || !existsSync(vaultPath)) {
    ui.notify(
      "Path doesn't exist or was empty. Set up sync first:\n" +
        "  mkdir -p /path/to/vault\n" +
        "  cd /path/to/vault\n" +
        "  ob sync-setup --vault \"Your Vault\"\n  ob sync\n\nThen run /setup obsidian again.",
      "warn"
    );
    return;
  }

  // Step 6: Generate the Obsidian extension scaffold
  const extDir = piExtensionsDir();
  if (!existsSync(extDir)) {
    mkdirSync(extDir, { recursive: true });
  }

  const targetExt = join(extDir, "obsidian-tools.ts");
  const scaffold = generateObsidianScaffold(vaultPath);

  // Check if it already exists
  if (existsSync(targetExt)) {
    const overwrite = await ui.confirm(
      "Extension exists",
      `obsidian-tools.ts already exists. Overwrite?`
    );
    if (!overwrite) {
      ui.notify(
        "Keep your existing extension. The scaffold is also at:\n" +
          "packages/ep-starter/scaffold/obsidian-tools/extension.ts\n" +
          "in the ep-starter repo for reference.",
        "info"
      );
      return;
    }
  }

  writeFileSync(targetExt, scaffold, "utf-8");

  ui.notify(
    "═══════════════════════════════════════════════════════════════\n" +
      "  ✅ Brand vault scaffold ready\n\n" +
      `  Extension: ${targetExt}\n` +
      `  Vault:     ${vaultPath}\n` +
      "═══════════════════════════════════════════════════════════════\n\n" +
      "What this unlocks for marketers:\n" +
      "  • Search brand voice, offers, proof, past campaigns\n" +
      "  • Read specific notes the agent needs for copy\n" +
      "  • List folders like /offers, /proof, /campaigns\n" +
      "  • Sync latest vault changes before writing\n\n" +
      "Tools scaffolded (stubs — implement next):\n" +
      "  • obsidian_search  — find notes by keyword / claim\n" +
      "  • obsidian_read    — pull a note by path\n" +
      "  • obsidian_list    — browse vault folders\n" +
      "  • obsidian_sync    — trigger ob sync\n\n" +
      "═══ NEXT STEPS ═══\n\n" +
      "  1. Implement with your agent (the stubs have TODOs):\n" +
      '     "Read ~/.pi/agent/extensions/obsidian-tools.ts and\n' +
      '      implement search with ripgrep for brand folders."\n\n' +
      "  2. /reload\n\n" +
      "  3. Ask for real work:\n" +
      '     "Search my vault for hero claims and write 3 LinkedIn posts."\n' +
      '     "Read brand-voice.md and draft a cold email sequence."\n' +
      '     "List notes in /proof and pick 5 testimonials."\n\n' +
      "  Next data source (same path):\n" +
      "     /scaffold spy-api   → competitor intel for marketers\n" +
      "     /scaffold crm       → customer context\n" +
      "     /scaffold analytics → performance data\n\n" +
      "═══════════════════════════════════════════════════════════════\n" +
      "  Agents don't need more chat. They need access.\n" +
      "═══════════════════════════════════════════════════════════════",
    "success"
  );
}

// ── Guide: Scaffold ──────────────────────────────────────

async function guideScaffold(ctx: ExtensionCommandContext) {
  const ui = ctx.ui;
  ui.notify(
    "═══ 🏗️ Wire any data source ═══\n\n" +
      "Same path as Obsidian — generate a scaffold, implement tools\n" +
      "with your agent, /reload, then the source is a tool call away.\n\n" +
      "Marketer-shaped examples:\n" +
      "  /scaffold spy-api           → competitor ad / creative intel\n" +
      "  /scaffold crm               → HubSpot / Salesforce context\n" +
      "  /scaffold analytics         → ad + web metrics\n" +
      "  /scaffold content-calendar  → Notion / Airtable boards\n\n" +
      "Operator / builder examples:\n" +
      "  /scaffold support-inbox     → tickets / Intercom\n" +
      "  /scaffold db-query          → warehouse or app DB\n\n" +
      "Files land in ~/.pi/agent/extensions/\n" +
      "Implement stubs → /reload → ask for work that needs that data.",
    "info"
  );
}

// ── Welcome message ──────────────────────────────────────

async function showWelcome(ctx: ExtensionCommandContext, inHerdr: boolean) {
  const ui = ctx.ui;
  const lines = [
    "═══════════════════════════════════════════════════════",
    "  🏭  ep-starter",
    "      Give your agents the data they need to do real work.",
    "═══════════════════════════════════════════════════════",
    "",
    "  Agents get useful when they can reach *your* world:",
    "    brand vaults · spy APIs · CRMs · analytics · more",
    "",
    "  /setup obsidian    → Brand vault (marketers' first unlock)",
    "  /setup scaffold    → Pattern for any data source",
  ];
  if (inHerdr) {
    lines.push("  /agents            → Peer agents in this workspace");
  }
  lines.push(
    "  /scaffold <name>   → Wire spy-api, crm, analytics, ...",
    "",
    "  📖 Guide:  https://github.com/conpiracy/ep-starter",
    "",
    "───────────────────────────────────────────────────────",
    "  Path to useful agents:",
    "",
    "  1️⃣  /setup obsidian",
    "      Connect brand voice, offers, proof, past campaigns.",
    "      Then: write copy that uses *your* materials.",
    "",
    "  2️⃣  /scaffold spy-api",
    "      Connect competitor intel the same way.",
    "      Then: research + draft without paste-and-pray.",
    "",
    "  3️⃣  /reload and ask for real work.",
    "      Every source becomes a tool call away.",
    "───────────────────────────────────────────────────────",
  );
  ui.notify(lines.join("\n"), "info");
}

// ── Scaffold Generators ──────────────────────────────────

function generateScaffold(name: string): string {
  const camelName = name.replace(/[-_]\w/g, (c) => c[1].toUpperCase());
  const className = name
    .split(/[-_]/)
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join("");

  return `/**
 * ${name}.ts — Data-source extension for Pi
 *
 * Wire a real system (API, vault, CRM, DB, etc.) so the agent can use it
 * as tool calls. Marketers: spy APIs, brand vaults, content calendars.
 * Operators: CRM, tickets, analytics. Builders: repos, logs, deploy status.
 *
 * Pattern:
 *   1. Put credentials in env vars (never hardcode secrets)
 *   2. Implement tools that fetch / search / write the source
 *   3. /reload and ask for work that needs this data
 *
 * Docs: docs/pi/extensions.txt  |  Guide: packages/ep-starter/GUIDE.md
 */

import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function (pi: ExtensionAPI) {
  // ── Tool stub — replace with real data access ─────────
  // Examples for marketers: search_ads, get_creative, list_offers
  // Examples for ops: get_deal, list_tickets, fetch_metrics
  pi.registerTool({
    name: "${name}_query",
    label: "${className} Query",
    description: "Query this data source. Replace with your real API/DB/vault call.",
    parameters: Type.Object({
      input: Type.String({ description: "What to fetch or search for" }),
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      // TODO: call your API / DB / file system here
      // Prefer process.env for keys: process.env.${name.toUpperCase().replace(/-/g, "_")}_API_KEY
      // onUpdate({ kind: "status", key: "progress", value: "..." });
      return {
        content: [{
          type: "text",
          text: \`TODO: implement ${name} query for: \${params.input}\`,
        }],
        details: { input: params.input },
      };
    },
  });

  // ── Command stub ──────────────────────────────────────
  pi.registerCommand("${name}", {
    description: "Run \${name} command. Usage: /${name} <args>",
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      ctx.ui.notify(\`\${name} command ran with: \${args || "(no args)"}\`, "info");
    },
  });

  // ── Startup ───────────────────────────────────────────
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify(\`✅ \${name} extension loaded\`, "success");
  });
}
`;
}

function generateObsidianScaffold(vaultPath: string): string {
  return `/**
 * obsidian-tools.ts — Obsidian vault access for Pi
 *
 * ─── THIS IS A STUB ───
 *
 * This extension provides tools for your agent to search, read, and
 * manage your Obsidian vault via the 'ob' CLI (Obsidian Headless).
 *
 * TODO: Fill in the tool implementations below.
 *
 * Prerequisites:
 *   npm install -g obsidian-headless
 *   ob login
 *   cd ${vaultPath} && ob sync-setup --vault "Your Vault"
 *
 * Reference:
 *   https://obsidian.md/help/headless
 *   ob sync --help
 *   ob publish --help
 *
 * After implementing, run /reload, then try:
 *   "search my vault for meeting notes"
 *   "read the note about project planning"
 *   "sync my vault"
 *   "list all notes in the /projects folder"
 *
 * ═══════════════════════════════════════════════════════════
 *  🏭  Part of ep-starter — Start here, build anything.
 * ═══════════════════════════════════════════════════════════
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const VAULT_PATH = "${vaultPath}";

/**
 * Run the 'ob' CLI and return stdout.
 */
function ob(...args: string[]): string {
  return execSync(["ob", ...args].join(" "), {
    encoding: "utf-8",
    cwd: VAULT_PATH,
    timeout: 30000,
  });
}

/**
 * Check if the vault is accessible.
 */
function vaultReady(): boolean {
  return existsSync(VAULT_PATH);
}

/**
 * Walk a directory and return .md files recursively.
 */
function findMarkdownFiles(dir: string, base: string = ""): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = join(base, entry);
    if (statSync(full).isDirectory()) {
      // Skip .obsidian and hidden dirs
      if (!entry.startsWith(".")) {
        results.push(...findMarkdownFiles(full, rel));
      }
    } else if (entry.endsWith(".md")) {
      results.push(rel);
    }
  }
  return results;
}

// ── Extension ────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  if (!vaultReady()) {
    pi.on("session_start", async (_event, ctx) => {
      ctx.ui.notify(
        \`⚠️  Obsidian vault not found at \${VAULT_PATH}\n\` +
          "Update VAULT_PATH in the extension or set up sync.",
        "warn"
      );
    });
    return;
  }

  // ── Tool: obsidian_search — Full-text vault search ────
  //
  // TODO: Implement full-text search. Options:
  //   A) Use grep -r (simple, no index)
  //   B) Use ripgrep (rg) for speed
  //   C) Build a mini FTS index with node
  //
  pi.registerTool({
    name: "obsidian_search",
    label: "Search Obsidian Vault",
    description:
      "Search your Obsidian vault for notes matching a query. " +
      "Returns matching file paths with snippet previews.",
    parameters: Type.Object({
      query: Type.String({
        description: "Search query (supports grep patterns)",
      }),
      max_results: Type.Optional(
        Type.Number({ description: "Max results to return", default: 10 })
      ),
      folder: Type.Optional(
        Type.String({
          description: "Limit search to a specific subfolder",
        })
      ),
    }),
    required: ["query"],
    async execute(toolCallId, params) {
      const { query, max_results = 10, folder = "" } = params;
      const searchDir = folder ? join(VAULT_PATH, folder) : VAULT_PATH;

      // TODO: Implement search.
      // Example using grep:
      //   const results = execSync(
      //     \`grep -rl "\${query}" "\${searchDir}" --include="*.md" | head -\${max_results}\`,
      //     { encoding: "utf-8", cwd: VAULT_PATH }
      //   );

      return {
        content: [
          {
            type: "text",
            text:
              "⚠️ obsidian_search is a stub.\n\n" +
              \`Search query: "\${query}"\n\` +
              \`Search dir: \${searchDir}\n\` +
              \`Max results: \${max_results}\n\n\` +
              "TODO: Implement the search logic (see the TODO in extension.ts).",
          },
        ],
        details: { query, folder, max_results },
      };
    },
  });

  // ── Tool: obsidian_read — Read a note ─────────────────
  pi.registerTool({
    name: "obsidian_read",
    label: "Read Obsidian Note",
    description:
      "Read the contents of a specific note in your Obsidian vault by path.",
    parameters: Type.Object({
      path: Type.String({
        description:
          "Relative path to the note (e.g., 'projects/idea.md')",
      }),
    }),
    required: ["path"],
    async execute(toolCallId, params) {
      const fullPath = join(VAULT_PATH, params.path);

      if (!existsSync(fullPath)) {
        // TODO: Implement fuzzy matching to find similar paths
        return {
          content: [
            {
              type: "text",
              text: \`Note not found: \${params.path}\n\` +
                "TODO: Add fuzzy matching to find similar paths.",
            },
          ],
        };
      }

      // TODO: Read and format the note content.
      // Consider: strip frontmatter? render wikilinks? resolve embeds?
      const content = readFileSync(fullPath, "utf-8");

      return {
        content: [{ type: "text", text: \`# \${params.path}\n\n\${content}\` }],
        details: { path: params.path, size: content.length },
      };
    },
  });

  // ── Tool: obsidian_list — List notes in a folder ──────
  pi.registerTool({
    name: "obsidian_list",
    label: "List Obsidian Notes",
    description:
      "List all markdown notes in a folder within your Obsidian vault.",
    parameters: Type.Object({
      folder: Type.Optional(
        Type.String({
          description:
            "Subfolder to list (defaults to vault root)",
        })
      ),
      recursive: Type.Optional(
        Type.Boolean({
          description: "List recursively into subfolders",
          default: false,
        })
      ),
    }),
    async execute(toolCallId, params) {
      const { folder = "", recursive = false } = params;
      const targetDir = folder ? join(VAULT_PATH, folder) : VAULT_PATH;

      // TODO: Implement directory listing.
      // Currently uses a simple walk — works but may be slow on large vaults.

      const files = findMarkdownFiles(targetDir);
      const truncated = files.length > 50
        ? [...files.slice(0, 50), \`... and \${files.length - 50} more\`]
        : files;

      return {
        content: [
          {
            type: "text",
            text:
              \`## Notes in \${folder || "(root)"}\n\n\` +
              truncated.map((f) => \`  📄 \${f}\`).join("\n") +
              \`\n\nTotal: \${files.length} notes\`,
          },
        ],
        details: { folder, files_count: files.length },
      };
    },
  });

  // ── Tool: obsidian_sync — Trigger Obsidian Sync ───────
  pi.registerTool({
    name: "obsidian_sync",
    label: "Sync Obsidian Vault",
    description:
      "Trigger an Obsidian Headless sync to pull latest changes from the remote vault.",
    parameters: Type.Object({
      continuous: Type.Optional(
        Type.Boolean({
          description:
            "Run continuous sync (watches for changes)",
          default: false,
        })
      ),
    }),
    async execute(toolCallId, params) {
      const { continuous = false } = params;

      try {
        // TODO: The 'ob sync' command may prompt for confirmation.
        // Consider using --yes or --continuous flag.
        const args = continuous ? ["sync", "--continuous"] : ["sync"];
        const output = ob(...args);
        return {
          content: [
            {
              type: "text",
              text: \`✅ Sync completed\n\n\${output.slice(0, 2000)}\`,
            },
          ],
        };
      } catch (e: any) {
        return {
          content: [
            {
              type: "text",
              text: \`❌ Sync failed: \${e.message}\`,
            },
          ],
        };
      }
    },
  });

  // ── Command: /obsidian — Quick vault commands ─────────
  pi.registerCommand("obsidian", {
    description:
      "Quick Obsidian vault commands. Usage: /obsidian <search|sync|status|list> [query]",
    handler: async (args, ctx) => {
      const parts = args.trim().split(/\s+/);
      const cmd = parts[0]?.toLowerCase();

      if (cmd === "status") {
        try {
          const status = ob("sync-status");
          ctx.ui.notify(status.slice(0, 1000), "info");
        } catch (e: any) {
          ctx.ui.notify(\`Status check failed: \${e.message}\`, "error");
        }
      } else if (cmd === "sync") {
        try {
          ctx.ui.notify("Syncing vault...", "info");
          const result = ob("sync");
          ctx.ui.notify("✅ Sync complete", "success");
        } catch (e: any) {
          ctx.ui.notify(\`Sync failed: \${e.message}\`, "error");
        }
      } else if (cmd === "list") {
        const folder = parts.slice(1).join(" ") || "";
        const files = findMarkdownFiles(
          folder ? join(VAULT_PATH, folder) : VAULT_PATH
        );
        ctx.ui.notify(
          \`📂 \${folder || "root"}: \${files.length} notes\n\` +
            files.slice(0, 20).join("\n") +
            (files.length > 20 ? \`\n... and \${files.length - 20} more\` : ""),
          "info"
        );
      } else if (cmd === "search") {
        const query = parts.slice(1).join(" ");
        if (!query) {
          ctx.ui.notify("Usage: /obsidian search <query>", "warn");
          return;
        }
        // TODO: implement search
        ctx.ui.notify(
          \`Search for "\${query}" — TODO: implement in obsidian-tools.ts\`,
          "info"
        );
      } else {
        ctx.ui.notify(
          "Usage:\n  /obsidian status     → sync status\n" +
            "  /obsidian sync       → trigger sync\n" +
            "  /obsidian list [dir] → list notes\n" +
            "  /obsidian search <q> → search notes",
          "info"
        );
      }
    },
  });

  // ── Startup ───────────────────────────────────────────
  pi.on("session_start", async (_event, ctx) => {
    const fileCount = findMarkdownFiles(VAULT_PATH).length;
    ctx.ui.notify(
      \`📓 Obsidian vault loaded: \${VAULT_PATH}\n   \${fileCount} notes available.\n\n\` +
        "⚠️  The tools are stubs — they need implementation.\n" +
        "   Open ~/.pi/agent/extensions/obsidian-tools.ts\n" +
        "   Fill in the TODO sections, then /reload.\n\n" +
        "   After that, try:\n" +
        '     "search my vault for meeting notes"\n' +
        '     "list notes in projects"\n' +
        '     "sync my vault"',
      "info"
    );
  });
}
`;
}
