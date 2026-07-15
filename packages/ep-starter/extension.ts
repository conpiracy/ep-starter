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
      "Wire a data source the agent can't reach yet. You give the minimum\n" +
      "(service, outcome, credential); the agent researches the API, tests it,\n" +
      "and writes the extension after it works. Usage: /scaffold <name>",
    usage: "<name>",
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      await runScaffoldInterview(args, ctx, pi);
    },
  });

  pi.on("session_start", async (_event, ctx) => {
    const lines = [
      "ep-starter loaded",
      "",
      "  /setup            Herdr, Pi, and using them together",
      "  /scaffold <name>  wire a source (agent researches + builds it)",
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
    `First capability on the stack — ready after /reload\n\n` +
      `Extension: ${targetExt}\n` +
      `Vault path: ${vaultPath}\n\n` +
      `What this exercise teaches:\n` +
      `  - a Pi extension you own (not a black-box plugin)\n` +
      `  - tools the agent can call after /reload\n` +
      `  - a repeatable path for the next capability\n\n` +
      `Tools (all working out of the box):\n` +
      `  obsidian_search — ripgrep/grep across .md notes, snippet previews\n` +
      `  obsidian_read / obsidian_list / obsidian_sync — file + folder + sync\n\n` +
      `Next:\n` +
      `  1. /reload (optional: ask the agent to specialize search for /brand, /offers, /proof)\n` +
      `  2. Ask for work that needs the vault (e.g. brand-aware copy)\n\n` +
      `Then repeat the path for something else:\n` +
      `  /scaffold viralbuilder | spy-api | crm | analytics\n` ,
      "success"
  );
}

// -- Scaffold guide -----------------------------------------

async function guideScaffold(ctx: ExtensionCommandContext) {
  ctx.ui.notify(
    "Add a capability the same way as the vault example\n\n" +
      "You give the minimum; the agent does the rest.\n\n" +
      "1. Name something the agent cannot do yet\n" +
      "2. /scaffold <name>  → it asks: what service? what outcome? env var name?\n" +
      "3. The agent searches for the API docs, tests live calls, and writes the\n" +
      "   extension once it works — showing you the test before /reload.\n" +
      "4. /reload\n" +
      "5. Ask for work that needs that capability\n\n" +
      "Examples of names: spy-api, crm, analytics, content-calendar, support-inbox, db-query\n\n" +
      "You never edit a stub. The agent owns research, testing, and implementation.",
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
    "  /scaffold <name>    interview, then agent researches+tests+builds it",
  ];
  if (inHerdr) {
    lines.push("  /agents             peer panes here");
  } else {
    lines.push("  (open pi inside Herdr for /agents)");
  }
  lines.push("", "https://github.com/conpiracy/ep-starter");
  ctx.ui.notify(lines.join("\n"), "info");
}

// -- Scaffold interview + agent brief -----------------------

// /scaffold collects the irreducible minimum only the user knows
// (what the service is, the outcome they want, the credential), then hands
// a brief to the agent so IT researches the API, tests it with live calls,
// and writes the extension once it actually works. The user never edits a stub.
async function runScaffoldInterview(
  args: string,
  ctx: ExtensionCommandContext,
  pi: ExtensionAPI
) {
  const ui = ctx.ui;

  let name = args.trim();
  if (!name) {
    name = ((await ui.input(
      "Name this source (e.g. viralbuilder, spy-api, hubspot-crm):"
    )) ?? "").trim();
    if (!name) {
      ui.notify("No name given. Try: /scaffold viralbuilder", "warn");
      return;
    }
  }
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(name)) {
    ui.notify(
      `Invalid name "${name}". Use letters, digits, '-' or '_'.`,
      "warn"
    );
    return;
  }

  const extDir = piExtensionsDir();
  if (!existsSync(extDir)) mkdirSync(extDir, { recursive: true });
  const targetExt = join(extDir, `${name}.ts`);
  if (existsSync(targetExt)) {
    const overwrite = await ui.confirm(
      "Extension exists",
      `${targetExt} already exists.\nRe-run the research+test+build flow and overwrite it?`
    );
    if (!overwrite) {
      ui.notify("Keeping existing extension. Nothing changed.", "info");
      return;
    }
  }

  // 1) What the service is — the one thing the agent can't guess.
  const service =
    (
      await ui.input(
        `What service/API is "${name}"?\n` +
          "One line is enough — the agent will search for the rest.\n" +
          "e.g. 'ViralBuilder ad-creative analytics', 'HubSpot CRM API'"
      )
    )?.trim() || name;

  // 2) The outcome the user wants — the work the tools should enable.
  const outcome = (
    await ui.input(
      "What do you want the agent to DO with this?\n" +
        "Describe the outcome, not the endpoints. e.g.\n" +
        "  'search competitor ads by brand and fetch creative details'\n" +
        "  'list open deals and pull contact info for each'"
    )
  )?.trim();
  if (!outcome) {
    ui.notify("No outcome given. Re-run /scaffold when you know what you want.", "warn");
    return;
  }

  // 3) The credential — the one secret only the user has.
  const defaultKey = name.toUpperCase().replace(/-/g, "_") + "_API_KEY";
  const envKey =
    (
      await ui.input(`Env var holding your API key/token? (default: ${defaultKey})`)
    )?.trim() || defaultKey;
  const keyPresent = !!process.env[envKey];
  if (!keyPresent) {
    const proceed = await ui.confirm(
      `Key not set: $${envKey}`,
      `${envKey} is not set in this Pi session's environment, so the agent can't test live calls yet.\n\n` +
        `Export it in the shell you launch pi from, then /scaffold again — OR continue now and the agent will ask you if it needs to test live. Continue?`
    );
    if (!proceed) {
      ui.notify(`Set $${envKey} and re-run /scaffold ${name}.`, "info");
      return;
    }
  }

  // 4) Optional fast-lane — docs/base URL if the user happens to know it.
  const hints = (
    await ui.input(
      "Docs URL or API base URL if you know it (blank = agent finds them):"
    )
  )?.trim() || "";

  // 5) Confirm before handing off.
  const go = await ui.confirm(
    "Hand this to the agent?",
    `The agent will:\n` +
      `  1. search for ${service} API docs\n` +
      `  2. test real calls with $${envKey}\n` +
      `  3. write ${targetExt} once it works\n` +
      `  4. show you the test + tool list before /reload\n\n` +
      `It will ask you if it gets stuck. Proceed?`
  );
  if (!go) {
    ui.notify("Cancelled. Nothing was written.", "info");
    return;
  }

  const brief = buildScaffoldBrief({
    name,
    service,
    outcome,
    envKey,
    keyPresent,
    hints,
    targetExt,
  });

  const briefPath = join(extDir, `${name}.task.md`);
  writeFileSync(briefPath, brief, "utf-8");

  ui.notify(
    `Handing off to the agent...\n` +
      `Brief saved: ${briefPath}\n` +
      `Extension will land at: ${targetExt}`,
    "info"
  );

  // Inject the brief as a user message so the agent picks it up and acts.
  const sender = (pi as any).sendUserMessage ?? (pi as any).sendMessage;
  if (typeof sender === "function") {
    try {
      await sender.call(pi, brief);
      return;
    } catch {
      /* fall through to manual prompt */
    }
  }
  // Fallback if the runtime can't inject a message: tell the user to nudge.
  ui.notify(
    `Couldn't auto-start the agent. In the prompt, say:\n` +
      `  "Follow the brief at ${briefPath}"\n` +
      `and the agent will take it from there.`,
    "warn"
  );
}

function buildScaffoldBrief(b: {
  name: string;
  service: string;
  outcome: string;
  envKey: string;
  keyPresent: boolean;
  hints: string;
  targetExt: string;
}): string {
  return [
    `# Task: wire the "${b.name}" data source as a Pi extension`,
    ``,
    `You are working from a brief collected by the ep-starter /scaffold wizard.`,
    `The user has given the minimum only they know. Everything else you discover`,
    `yourself by **researching the API and testing live calls**. Do not write a`,
    `stub and stop.`,
    ``,
    `## What the user gave you`,
    ``,
    `- Service: ${b.service}`,
    `- Outcome they want: ${b.outcome}`,
    `- Credential env var: \`${b.envKey}\` (${b.keyPresent ? "currently set in your environment" : "NOT set — see below"})`,
    b.hints ? `- Hints (docs/base URL): ${b.hints}` : `- Hints: none — find the docs yourself`,
    `- Target file: ${b.targetExt}`,
    ``,
    `## How to do this (do all of it)`,
    ``,
    `1. **Research.** Search the web for the ${b.service} API documentation and`,
    `   read it. Find the base URL, the auth scheme (header? query param? bearer?),`,
    `   and the endpoints that map to the outcome the user wants. If the user gave`,
    `   a docs URL, start there.`,
    `2. **Test live.** Use the bash tool to curl the API against real endpoints`,
    `   with \`$${b.envKey}\`. Start with the cheapest call that proves auth works`,
    `   (an /me, /account, list, or health endpoint). Iterate until a real request`,
    `   returns real data — capture the request and response. Never hardcode the`,
    `   secret; reference \`$${b.envKey}\`.`,
    `3. **If the key is missing**${b.keyPresent ? "" : " (it currently is)"}, ask the user to`,
    `   \`export ${b.envKey}=...\` in the shell they launch pi from and re-run when`,
    `   ready. Don't fake calls or invent responses.`,
    `4. **Design tools** that deliver the outcome (${b.outcome}). Give each tool a`,
    `   snake_case name prefixed with \`${b.name}_\`, a clear description for the`,
    `   LLM, and TypeBox parameters. Keep tools work-shaped (search_X, get_X,`,
    `   list_X) rather than one generic query.`,
    `5. **Write the extension** to ${b.targetExt} using \`pi.registerTool\`. Model`,
    `   it on any existing file in ~/.pi/agent/extensions/ (e.g. obsidian-tools.ts)`,
    `   or the Pi extension skill. Credentials via \`process.env.${b.envKey}\` only`,
    `   — never literals.`,
    `6. **Verify before finishing.** Show the user: (a) the curl test output that`,
    `   proved the API works, and (b) the list of tools you created with one-line`,
    `   descriptions. Ask if it's right before they /reload. Do not /reload`,
    `   yourself unless asked.`,
    `7. **If you can't find docs or can't make a call succeed**, stop and report`,
    `   what you tried — don't ship a broken or guessed extension.`,
    ``,
    `## Hard rules`,
    `- No stub \`TODO: implement\` returns. Every tool must make a real call and`,
    `  return real data by the time you're done.`,
    `- No secrets in source.`,
    `- File goes to \`${b.targetExt}\` exactly.`,
    ``,
    `When done: summarize the test results and the tools, and tell the user to`,
    `run /reload.`,
    ``,
  ].join("\n");
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
