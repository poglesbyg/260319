import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { writeDecision, newDecisionId, getDecisions, type Decision } from "./decision-store.js";
import { installPostCommitHook } from "./secret-scanner.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "decidex-capture-"));
  // Create a fake .git/hooks directory so hook installer works
  fs.mkdirSync(path.join(tmpDir, ".git", "hooks"), { recursive: true });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

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

describe("writeDecision — capture source", () => {
  it("writes a manually captured decision", () => {
    const id = newDecisionId();
    writeDecision(tmpDir, { ...BASE, id });
    const filePath = path.join(tmpDir, ".decisions", "src/auth/", `${id}.md`);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("round-trips source: capture", () => {
    const id = newDecisionId();
    writeDecision(tmpDir, { ...BASE, id });
    const decisions = getDecisions(tmpDir, "src/auth/");
    expect(decisions[0].source).toBe("capture");
  });

  it("manually captured decisions appear in getDecisions", () => {
    writeDecision(tmpDir, { ...BASE, id: newDecisionId() });
    writeDecision(tmpDir, { ...BASE, id: newDecisionId(), area: "src/api/", source: "generate" });

    const all = getDecisions(tmpDir, "");
    expect(all).toHaveLength(2);

    const captured = all.filter((d) => d.source === "capture");
    expect(captured).toHaveLength(1);
    expect(captured[0].text).toBe("Use JWT, not sessions");
  });
});

describe("installPostCommitHook", () => {
  it("creates a post-commit hook file", () => {
    installPostCommitHook(tmpDir);
    const hookPath = path.join(tmpDir, ".git", "hooks", "post-commit");
    expect(fs.existsSync(hookPath)).toBe(true);
  });

  it("hook file contains decidex auto-update marker", () => {
    installPostCommitHook(tmpDir);
    const content = fs.readFileSync(
      path.join(tmpDir, ".git", "hooks", "post-commit"),
      "utf8"
    );
    expect(content).toContain("decidex auto-update");
    expect(content).toContain("decidex generate --yes");
  });

  it("is idempotent — does not duplicate if called twice", () => {
    installPostCommitHook(tmpDir);
    installPostCommitHook(tmpDir);
    const content = fs.readFileSync(
      path.join(tmpDir, ".git", "hooks", "post-commit"),
      "utf8"
    );
    expect(content.split("decidex auto-update").length - 1).toBe(1);
  });

  it("appends to existing hook without overwriting", () => {
    const hookPath = path.join(tmpDir, ".git", "hooks", "post-commit");
    fs.writeFileSync(hookPath, "#!/bin/sh\necho 'existing hook'\n", { mode: 0o755 });
    installPostCommitHook(tmpDir);
    const content = fs.readFileSync(hookPath, "utf8");
    expect(content).toContain("existing hook");
    expect(content).toContain("decidex auto-update");
  });
});
