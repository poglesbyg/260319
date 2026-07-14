import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { scanText, installPreCommitHook } from "./secret-scanner.js";

const REPO_ROOT = "/tmp/test-repo"; // no allowlist file exists here

describe("scanText", () => {
  it("returns clean for safe text", () => {
    const result = scanText("Use Zod for validation, not Yup.", REPO_ROOT);
    expect(result.clean).toBe(true);
    expect(result.findings).toHaveLength(0);
  });

  it("detects API key assignment", () => {
    const result = scanText("api_key = sk-abcdef1234567890abcdef1234567890", REPO_ROOT);
    expect(result.clean).toBe(false);
    expect(result.findings[0].name).toContain("API Key");
    expect(result.findings[0].excerpt).toContain("[REDACTED]");
  });

  it("detects AWS access key", () => {
    const result = scanText("AKIAIOSFODNN7EXAMPLE", REPO_ROOT);
    expect(result.clean).toBe(false);
    expect(result.findings[0].name).toContain("AWS");
  });

  it("detects GitHub token", () => {
    const result = scanText("token: ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij", REPO_ROOT);
    expect(result.clean).toBe(false);
  });

  it("detects Anthropic API key", () => {
    const result = scanText(
      "key = sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      REPO_ROOT
    );
    expect(result.clean).toBe(false);
    expect(result.findings[0].name).toContain("Anthropic");
  });

  it("detects password assignment", () => {
    const result = scanText("password = supersecret123", REPO_ROOT);
    expect(result.clean).toBe(false);
    expect(result.findings[0].name).toContain("Password");
  });

  it("only reports one finding per line", () => {
    // Line with multiple patterns — should only count once
    const result = scanText("api_key = secret_token_abcdefghij", REPO_ROOT);
    expect(result.findings).toHaveLength(1);
  });

  it("handles multi-line text", () => {
    const text = [
      "Use Zod for validation.",
      "api_key = sk-abcdef1234567890abcdef1234567890",
      "Don't use Prisma.",
    ].join("\n");
    const result = scanText(text, REPO_ROOT);
    expect(result.clean).toBe(false);
    expect(result.findings[0].line).toBe(2);
  });
});

describe("installPreCommitHook", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "decidex-precommit-"));
    fs.mkdirSync(path.join(tmpDir, ".git", "hooks"), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("guards the scan call with a PATH check instead of relying on npx", () => {
    installPreCommitHook(tmpDir);
    const content = fs.readFileSync(path.join(tmpDir, ".git", "hooks", "pre-commit"), "utf8");
    expect(content).toContain("command -v decidex");
    expect(content).not.toContain("npx decidex");
  });

  it("skips scanning (exit 0) rather than blocking when decidex isn't on PATH", () => {
    installPreCommitHook(tmpDir);
    const content = fs.readFileSync(path.join(tmpDir, ".git", "hooks", "pre-commit"), "utf8");
    // The guard clause must exit 0 (skip), not fall through to a blocked commit.
    const guardBlock = content.split("command -v decidex")[1].split("fi")[0];
    expect(guardBlock).toContain("exit 0");
  });
});
