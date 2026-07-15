/**
 * ep-starter — Pi package on-ramp for Herdr + Pi.
 *
 * Herdr: agent multiplexer (tmux for coding agents).
 * Pi: minimal harness you reshape with extensions, skills, packages.
 * Together: multi-agent workspace + an agent that is fully yours to extend.
 *
 * Commands: /setup, /scaffold, /agents (inside Herdr).
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

// Best-effort parse of `ob sync-list-remote` output into vault names.
// Output format isn't guaranteed, so stay defensive.
function parseVaultNames(out: string): string[] {
  const names: string[] = [];
  for (const raw of out.split(/\r?\n/)) {
    let line = raw.trim();
    if (!line) continue;
    line = line.replace(/^[-*+]\s+/, "").replace(/^\d+\.\s+/, "");
    if (!line) continue;
    if (/^(name|vault|id|workspace|---+)\b/i.test(line)) continue;
    names.push(line.replace(/^["']|["']$/g, ""));
  }
  return [...new Set(names)];
}

function piExtensionsDir(): string {
  return join(homedir(), ".pi", "agent", "extensions");
}

// -- Extension ----------------------------------------------

export default function (pi: ExtensionAPI) {
  const inHerdr = checkHerdr();

  pi.registerCommand("setup", {
    description:
      "What Herdr and Pi are, what they do together, how to start. Usage: /setup [obsidian|scaffold]",
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
      "Generate a capability extension stub. Usage: /scaffold <name>  e.g. spy-api, crm, analytics",
    usage: "<name>",
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const name = args.trim();
      if (!name) {
        ctx.ui.notify(
          "Usage: /scaffold <name>\nExamples: /scaffold spy-api  /scaffold crm  /scaffold analytics\n(Name a capability the agent lacks; the stub is the start of the path.)",
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
      "",
      "  /setup            Herdr, Pi, and using them together",
      "  /scaffold <name>  new Pi extension stub",
    ];
    if (inHerdr) {
      lines.push("  /agents           peer panes in this workspace");
    }
    lines.push("", "https://github.com/conpiracy/ep-starter");
    ctx.ui.notify(lines.join("\n"), "info");
  });
}

// -- Obsidian setup -----------------------------------------

async function guideObsidianSetup(ctx: ExtensionCommandContext) {
  const ui = ctx.ui;

  ui.notify(
    "Optional exercise: vault tools as a Pi extension\n\n" +
      "Practice the normal Pi path: extension → tools → /reload.\n" +
      "Uses a local vault (Obsidian Headless optional) as the data source.\n" +
      "Skip if you already know extensions; use /scaffold instead.",
    "info"
  );

  let nodeVersion: string | null = null;
  try {
    nodeVersion = execSync("node --version", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    /* node not installed */
  }
  const major = nodeVersion ? parseInt(nodeVersion.replace(/^v/, ""), 10) : 0;
  if (!Number.isFinite(major) || major < 22) {
    ui.notify(
      `Node.js 22+ is required.\n  Detected: ${nodeVersion || "(not installed)"}\n` +
        "Install from https://nodejs.org, then run /setup obsidian again.",
      "warn"
    );
    return;
  }
  ui.notify(`Node.js ${nodeVersion} detected.`, "success");

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

  // Step 4: list remote vaults and let the user pick (or create one),
  // then sync into a local path automatically — no manual shell commands.
  let remoteVaults: string[] = [];
  try {
    const out = execSync("ob sync-list-remote", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 15000,
    });
    remoteVaults = parseVaultNames(out);
  } catch {
    /* listing failed — treat as empty, fall through to create */
  }

  let vaultName: string | null = null;
  if (remoteVaults.length > 0) {
    vaultName = (await ui.select(
      "Step 4: Pick a remote vault to sync",
      remoteVaults.map((name) => ({ label: name, value: name }))
    )) ?? null;
  }

  if (!vaultName) {
    const create = await ui.confirm(
      "Step 4: No remote vault selected",
      "Create a new remote vault with:\n  ob sync-create-remote --name \"My Agent Vault\"\n\nCreate one now?"
    );
    if (!create) {
      ui.notify(
        "When you have a remote vault, run /setup obsidian again.",
        "info"
      );
      return;
    }
    const name = (await ui.input("Name for the new vault:"))?.trim();
    if (!name) {
      ui.notify("No vault name given. Run /setup obsidian again later.", "warn");
      return;
    }
    try {
      execSync(`ob sync-create-remote --name "${name.replace(/"/g, '\\"')}"`, {
        stdio: "pipe",
        timeout: 30000,
      });
      vaultName = name;
    } catch (e: any) {
      ui.notify(
        `Create failed: ${e.message}\nTry: ob sync-create-remote --name "${name}"\nThen /setup obsidian again.`,
        "error"
      );
      return;
    }
  }

  const defaultPath = join(
    homedir(),
    "vaults",
    vaultName!.toLowerCase().replace(/\s+/g, "-")
  );
  const pathInput = (await ui.input(
    `Local path to sync "${vaultName}" into\n(e.g. ${defaultPath}):`
  ))?.trim();
  const vaultPath = (pathInput || defaultPath).replace(/^~(?=$|\/|\\)/, homedir());

  if (existsSync(vaultPath)) {
    // Already present locally — reuse it.
    ui.notify(`Using existing vault at ${vaultPath}.`, "info");
  } else {
    const setup = await ui.confirm(
      "Step 4 (setup)",
      `Set up sync for "${vaultName}" at:\n  ${vaultPath}\n\nThis will run:\n  mkdir -p ${vaultPath}\n  ob sync-setup --vault "${vaultName}"\n  ob sync\nProceed?`
    );
    if (!setup) {
      ui.notify(
        "Set up sync manually in a shell, then run /setup obsidian again.",
        "info"
      );
      return;
    }
    try {
      mkdirSync(vaultPath, { recursive: true });
      execSync(`ob sync-setup --vault "${vaultName!.replace(/"/g, '\\"')}"`, {
        cwd: vaultPath,
        stdio: "pipe",
        timeout: 60000,
      });
      execSync("ob sync", {
        cwd: vaultPath,
        stdio: "pipe",
        timeout: 120000,
      });
      ui.notify(`Synced "${vaultName}" to ${vaultPath}.`, "success");
    } catch (e: any) {
      ui.notify(
        `Sync setup failed: ${e.message}\nFix in a shell:\n  cd ${vaultPath}\n  ob sync-setup --vault "${vaultName}"\n  ob sync\nThen /setup obsidian again.`,
        "error"
      );
      return;
    }
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
    `Scaffold ready — first capability on the stack\n\n` +
      `Extension: ${targetExt}\n` +
      `Vault path: ${vaultPath}\n\n` +
      `What this exercise teaches:\n` +
      `  - a Pi extension you own (not a black-box plugin)\n` +
      `  - tools the agent can call after /reload\n` +
      `  - a repeatable path for the next capability\n\n` +
      `Stubs to implement:\n` +
      `  obsidian_search / obsidian_read / obsidian_list / obsidian_sync\n\n` +
      `Next:\n` +
      `  1. Implement with the agent (TODOs in the file)\n` +
      `  2. /reload\n` +
      `  3. Ask for work that needs the vault (e.g. brand-aware copy)\n\n` +
      `Then repeat the path for something else:\n` +
      `  /scaffold spy-api | crm | analytics\n` +
      `  (same mechanism; different materials)`,
    "success"
  );
}

// -- Scaffold guide -----------------------------------------

async function guideScaffold(ctx: ExtensionCommandContext) {
  ctx.ui.notify(
    "Add a capability the same way as the vault example\n\n" +
      "1. Name something the agent cannot do yet\n" +
      "2. /scaffold <name>  → extension stub in ~/.pi/agent/extensions/\n" +
      "3. Implement tools with the agent (credentials in env vars)\n" +
      "4. /reload\n" +
      "5. Ask for work that needs that capability\n\n" +
      "Examples of names (not a feature list):\n" +
      "  spy-api, crm, analytics, content-calendar, support-inbox, db-query\n\n" +
      "The stack is the product. Each scaffold is another exercise on it.",
    "info"
  );
}

// -- Welcome ------------------------------------------------

async function showWelcome(ctx: ExtensionCommandContext, inHerdr: boolean) {
  const lines = [
    "Herdr — agent multiplexer",
    "  Real panes that survive detach. Agent state. CLI/socket control.",
    "  (tmux for coding agents; one terminal for the whole herd)",
    "",
    "Pi — minimal coding harness",
    "  Extend with tools, skills, packages. Adapt the agent; don't fork it.",
    "  (there are many harnesses; this one is yours)",
    "",
    "Together",
    "  Herdr is where agents live and stay running.",
    "  Pi is an agent you can reshape.",
    "  Combined: multi-agent workspace + fully extensible agent.",
    "",
    "This package",
    "  /setup scaffold     add a Pi capability",
    "  /setup obsidian     optional vault-tools exercise",
    "  /scaffold <name>    write an extension stub",
  ];
  if (inHerdr) {
    lines.push("  /agents             peer panes here");
  } else {
    lines.push("  (open pi inside Herdr for /agents)");
  }
  lines.push("", "https://github.com/conpiracy/ep-starter");
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
 * Defaults below work out of the box (search runs via ripgrep or grep).
 * Specialize the tool bodies to match your vault layout when ready.
 *
 * Setup already done by /setup obsidian:
 *   npm install -g obsidian-headless
 *   ob login
 *   ob sync-setup --vault "..."  (vault synced at ${vaultPath})
 *
 * Reference: https://obsidian.md/help/headless
 *
 * After /reload, try:
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

// Working default search — case-insensitive fixed-string match across .md
// notes. Prefers ripgrep (fast, skips hidden + .obsidian/), falls back to
// grep. Swap for an FTS index when the vault grows large.
function searchVault(
  dir: string,
  query: string,
  max: number
): Array<{ path: string; snippet: string }> {
  const esc = (s: string) => s.replace(/'/g, "'\\''");
  const q = esc(query);
  let lines: string[] = [];
  try {
    lines = (execSync(
      \`rg -F -i -n --no-heading --color=never -g '*.md' -- '\${q}' "\${dir}"\`,
      { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"], timeout: 15000 }
    ) || "").split(/\\r?\\n/).filter(Boolean);
  } catch {
    try {
      lines = (execSync(
        \`grep -rIn --include='*.md' --exclude-dir=.obsidian --color=never -F -i -- '\${q}' "\${dir}"\`,
        { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"], timeout: 20000 }
      ) || "").split(/\\r?\\n/).filter(Boolean);
    } catch {
      lines = [];
    }
  }
  const hits: Array<{ path: string; snippet: string }> = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const m = line.match(/^(.*?):(\\d+):(.*)$/);
    if (!m) continue;
    let rel = m[1];
    if (rel.startsWith(dir)) rel = rel.slice(dir.length).replace(/^[\\/\\\\]+/, "");
    rel = rel.replace(/^\\.\\//, "");
    if (seen.has(rel)) continue;
    seen.add(rel);
    hits.push({ path: rel, snippet: m[3].trim().slice(0, 160) });
    if (hits.length >= max) break;
  }
  return hits;
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

  pi.registerTool({
    name: "obsidian_search",
    label: "Search Obsidian Vault",
    description:
      "Search the Obsidian vault for notes matching a query (case-insensitive, " +
      "fixed-string). Returns matching note paths with snippet previews. " +
      "Prefers ripgrep, falls back to grep. Tailor for an FTS index if needed.",
    parameters: Type.Object({
      query: Type.String({ description: "Search query (plain text; matched as a fixed string)" }),
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

      if (!existsSync(searchDir)) {
        return {
          content: [{ type: "text", text: \`Search dir not found: \${searchDir}\` }],
        };
      }

      const hits = searchVault(searchDir, query, max_results);
      if (hits.length === 0) {
        return {
          content: [{ type: "text", text: \`No notes matched "\${query}".\` }],
          details: { query, folder, max_results },
        };
      }
      const out = hits.map((h) => \`- \${h.path}\\n    \${h.snippet}\`).join("\\n");
      return {
        content: [{
          type: "text",
          text: \`Matches for "\${query}"\\n\\n\${out}\`,
        }],
        details: { query, folder, max_results, hits },
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
        const hits = searchVault(VAULT_PATH, query, 20);
        if (hits.length === 0) {
          ctx.ui.notify(\`No notes matched "\${query}".\`, "info");
        } else {
          ctx.ui.notify(
            \`Matches for "\${query}"\\n\` +
              hits.map((h) => \`  - \${h.path}\\n      \${h.snippet}\`).join("\\n"),
            "info"
          );
        }
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
      \`Obsidian vault ready: \${VAULT_PATH} (\${fileCount} notes)\\n\\n\` +
        "Tools online: search · read · list · sync.\\n\\n" +
        "Try:\\n" +
        '  "search my vault for meeting notes"\\n' +
        '  "list notes in projects"\\n' +
        '  "sync my vault"',
      "success"
    );
  });
}
`;
}
