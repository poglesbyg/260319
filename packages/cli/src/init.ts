import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { installPreCommitHook, installPostCommitHook } from "@decidex/core";
import { isGitRepo, getRepoRoot } from "./git.js";

export interface InitOptions {
  noHook?: boolean;
}

/**
 * The MCP server config block for Claude Code (.claude/settings.json)
 * and Claude Desktop (~/Library/Application Support/Claude/claude_desktop_config.json).
 */
function buildMcpConfig(repoRoot: string): object {
  return {
    command: "decidex-mcp",
    args: ["--repo", repoRoot],
  };
}

/** Path to Claude Desktop config on the current platform. */
function claudeDesktopConfigPath(): string | null {
  const platform = process.platform;
  if (platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
  }
  if (platform === "win32") {
    const appData = process.env.APPDATA;
    return appData ? path.join(appData, "Claude", "claude_desktop_config.json") : null;
  }
  // Linux
  const xdg = process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config");
  return path.join(xdg, "Claude", "claude_desktop_config.json");
}

/** Merge the decidex MCP server entry into a Claude Desktop config file. */
function upsertDesktopConfig(configPath: string, repoRoot: string): "created" | "updated" | "exists" {
  let config: Record<string, unknown> = {};

  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch {
      // treat as empty if unparseable
    }
  }

  const servers = (config.mcpServers ?? {}) as Record<string, unknown>;
  if (servers.decidex) return "exists";

  servers.decidex = buildMcpConfig(repoRoot);
  config.mcpServers = servers;

  const dir = path.dirname(configPath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, ".decidex-init.tmp");
  fs.writeFileSync(tmp, JSON.stringify(config, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, configPath);

  return fs.existsSync(configPath) ? "updated" : "created";
}

/** Run the init command — wire up decidex in this repo. */
export function runInit(cwd: string, opts: InitOptions): void {
  if (!isGitRepo(cwd)) {
    console.error("✗ Not a git repo. Run from your project root.");
    process.exitCode = 1;
    return;
  }

  const repoRoot = getRepoRoot(cwd);

  console.log(`\n→ Initializing decidex in ${repoRoot}\n`);

  // 1. Install git hooks
  if (!opts.noHook) {
    try {
      installPreCommitHook(repoRoot);
      console.log("✓ Pre-commit hook installed  (secret scanner for .decisions/)");
    } catch (err) {
      console.warn(`⚠  Pre-commit hook: ${(err as Error).message}`);
    }

    try {
      installPostCommitHook(repoRoot);
      console.log("✓ Post-commit hook installed (auto-updates CLAUDE.md after each commit)");
    } catch (err) {
      console.warn(`⚠  Post-commit hook: ${(err as Error).message}`);
    }
  }

  // 2. Configure Claude Code MCP (project-level .claude/mcp.json)
  const claudeCodeConfig = path.join(repoRoot, ".claude", "mcp.json");
  const mcpConfig = { mcpServers: { decidex: buildMcpConfig(repoRoot) } };

  if (fs.existsSync(claudeCodeConfig)) {
    try {
      const existing = JSON.parse(fs.readFileSync(claudeCodeConfig, "utf8")) as Record<string, unknown>;
      const servers = (existing.mcpServers ?? {}) as Record<string, unknown>;
      if (!servers.decidex) {
        servers.decidex = buildMcpConfig(repoRoot);
        existing.mcpServers = servers;
        fs.writeFileSync(claudeCodeConfig, JSON.stringify(existing, null, 2) + "\n", "utf8");
        console.log(`✓ Updated ${claudeCodeConfig}`);
      } else {
        console.log(`✓ Claude Code MCP already configured (${claudeCodeConfig})`);
      }
    } catch {
      console.warn(`⚠  Could not update ${claudeCodeConfig}`);
    }
  } else {
    fs.mkdirSync(path.dirname(claudeCodeConfig), { recursive: true });
    fs.writeFileSync(claudeCodeConfig, JSON.stringify(mcpConfig, null, 2) + "\n", "utf8");
    console.log(`✓ Created ${claudeCodeConfig}`);
  }

  // 3. Configure Claude Desktop (if installed)
  const desktopConfigPath = claudeDesktopConfigPath();
  if (desktopConfigPath) {
    const desktopResult = upsertDesktopConfig(desktopConfigPath, repoRoot);
    if (desktopResult === "exists") {
      console.log(`✓ Claude Desktop MCP already configured`);
    } else if (desktopResult === "updated") {
      console.log(`✓ Updated Claude Desktop config (${desktopConfigPath})`);
    } else {
      console.log(`✓ Created Claude Desktop config (${desktopConfigPath})`);
    }
  }

  // 4. Print manual config for other tools
  console.log(`
─────────────────────────────────────────────────
Manual MCP config (if auto-config didn't work):

Add to ~/.claude/settings.json or your tool's MCP config:

${JSON.stringify({ mcpServers: { decidex: buildMcpConfig(repoRoot) } }, null, 2)}
─────────────────────────────────────────────────

Next steps:
  decidex generate        Extract decisions from git history
  decidex stats           See what was captured
  decidex capture "..."   Manually add a decision
`);
}
