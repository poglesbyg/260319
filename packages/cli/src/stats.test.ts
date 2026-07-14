import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { execSync } from "node:child_process";
import { writeDecision, newDecisionId, type Decision } from "@decidex/core";
import { runStats } from "./stats.js";

let tmpDir: string;
let logSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "decidex-stats-")));
  execSync("git init -q", { cwd: tmpDir });
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function output(): string {
  return logSpy.mock.calls.map((c) => c.join(" ")).join("\n");
}

const BASE: Omit<Decision, "id"> = {
  version: 1,
  author: "Alice",
  timestamp: "2026-01-01T00:00:00Z",
  area: "src/auth/",
  confidence: 5,
  tags: ["auth"],
  text: "Use JWT, not sessions",
  rationale: "Stateless and scalable",
  source: "capture",
};

describe("runStats", () => {
  it("errors when not run inside a git repo", () => {
    const nonRepo = fs.mkdtempSync(path.join(os.tmpdir(), "decidex-notgit-"));
    runStats(nonRepo);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Not a git repo"));
    expect(process.exitCode).toBe(1);
    fs.rmSync(nonRepo, { recursive: true, force: true });
  });

  it("reports no decisions captured yet for an empty store", () => {
    runStats(tmpDir);
    expect(output()).toContain("No decisions captured yet.");
  });

  it("reports totals, areas, and recent decisions when decisions exist", () => {
    writeDecision(tmpDir, { ...BASE, id: newDecisionId() });
    writeDecision(tmpDir, { ...BASE, id: newDecisionId(), area: "src/api/", text: "REST not GraphQL" });

    runStats(tmpDir);
    const out = output();
    expect(out).toContain("Total decisions: 2");
    expect(out).toContain("src/auth/");
    expect(out).toContain("src/api/");
    expect(out).toContain("Use JWT, not sessions");
    expect(out).toContain("REST not GraphQL");
  });

  it("labels a repo-wide area as (repo-wide)", () => {
    writeDecision(tmpDir, { ...BASE, id: newDecisionId(), area: "" });
    runStats(tmpDir);
    expect(output()).toContain("(repo-wide)");
  });
});
