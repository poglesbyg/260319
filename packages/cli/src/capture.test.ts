import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { execSync } from "node:child_process";
import { runCapture } from "./capture.js";

let tmpDir: string;
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "decidex-cli-capture-")));
  execSync("git init -q", { cwd: tmpDir });
  execSync('git config user.email "test@example.com"', { cwd: tmpDir });
  execSync('git config user.name "Test User"', { cwd: tmpDir });
  vi.spyOn(console, "log").mockImplementation(() => {});
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("runCapture — validation", () => {
  it("errors when not run inside a git repo", () => {
    const nonRepo = fs.mkdtempSync(path.join(os.tmpdir(), "decidex-notgit-"));
    runCapture(nonRepo, "Use Zod", {});
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Not a git repo"));
    expect(process.exitCode).toBe(1);
    fs.rmSync(nonRepo, { recursive: true, force: true });
  });

  it("rejects empty decision text", () => {
    runCapture(tmpDir, "   ", {});
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("cannot be empty"));
    expect(process.exitCode).toBe(1);
    expect(fs.existsSync(path.join(tmpDir, ".decisions"))).toBe(false);
  });

  it("rejects an absolute area path", () => {
    runCapture(tmpDir, "Use Zod", { area: "/etc" });
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid area"));
    expect(process.exitCode).toBe(1);
  });

  it("rejects an area containing '..'", () => {
    runCapture(tmpDir, "Use Zod", { area: "../outside" });
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid area"));
    expect(process.exitCode).toBe(1);
  });

  it("rejects confidence below 1", () => {
    runCapture(tmpDir, "Use Zod", { confidence: 0 });
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Confidence must be between 1 and 5"));
    expect(process.exitCode).toBe(1);
  });

  it("rejects confidence above 5", () => {
    runCapture(tmpDir, "Use Zod", { confidence: 6 });
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Confidence must be between 1 and 5"));
    expect(process.exitCode).toBe(1);
  });
});

describe("runCapture — success path", () => {
  it("writes the decision file under the given area and updates CLAUDE.md", () => {
    runCapture(tmpDir, "Use Zod for all request validation, not Yup", {
      area: "src/api",
      rationale: "Better TS inference",
      tags: ["api", "validation"],
      confidence: 4,
    });

    const files = fs.readdirSync(path.join(tmpDir, ".decisions", "src", "api"));
    expect(files).toHaveLength(1);

    const content = fs.readFileSync(path.join(tmpDir, ".decisions", "src", "api", files[0]), "utf8");
    expect(content).toContain("Use Zod for all request validation, not Yup");
    expect(content).toContain("confidence: 4");
    expect(content).toContain('tags: ["api", "validation"]');
    expect(content).toContain("Better TS inference");
    expect(content).toContain("author: Test User");

    const claudeMD = fs.readFileSync(path.join(tmpDir, "CLAUDE.md"), "utf8");
    expect(claudeMD).toContain("Use Zod for all request validation, not Yup");
  });

  it("defaults confidence to 5 and area to repo-wide when omitted", () => {
    runCapture(tmpDir, "No Passport.js — use JWT directly", {});
    const files = fs.readdirSync(path.join(tmpDir, ".decisions"));
    const decisionFile = files.find((f) => f.endsWith(".md"));
    expect(decisionFile).toBeDefined();
    const content = fs.readFileSync(path.join(tmpDir, ".decisions", decisionFile!), "utf8");
    expect(content).toContain("confidence: 5");
    expect(content).toContain("area: ");
  });
});
