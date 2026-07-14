import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { execSync } from "node:child_process";
import { runInit } from "./init.js";

let tmpDir: string;
let fakeHome: string;

function desktopConfigPath(): string {
  return path.join(fakeHome, "Library", "Application Support", "Claude", "claude_desktop_config.json");
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "decidex-init-repo-"));
  fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), "decidex-init-home-"));
  execSync("git init -q", { cwd: tmpDir });
  vi.stubEnv("HOME", fakeHome); // os.homedir() reads $HOME on POSIX
  Object.defineProperty(process, "platform", { value: "darwin" });
});

afterEach(() => {
  vi.unstubAllEnvs();
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.rmSync(fakeHome, { recursive: true, force: true });
});

describe("runInit — Claude Desktop config", () => {
  it("does not create a Claude Desktop config if one doesn't already exist (app not installed)", () => {
    runInit(tmpDir, { noHook: true });
    expect(fs.existsSync(desktopConfigPath())).toBe(false);
  });

  it("updates an existing Claude Desktop config in place, preserving unrelated keys", () => {
    const configPath = desktopConfigPath();
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify({ someOtherSetting: true }));

    runInit(tmpDir, { noHook: true });

    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(config.someOtherSetting).toBe(true);
    expect(config.mcpServers.decidex.args).toContain(fs.realpathSync(tmpDir));
  });

  it("does not touch an existing Claude Desktop config when --no-desktop is passed", () => {
    const configPath = desktopConfigPath();
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify({ someOtherSetting: true }));

    runInit(tmpDir, { noHook: true, noDesktop: true });

    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(config.mcpServers).toBeUndefined();
  });
});
