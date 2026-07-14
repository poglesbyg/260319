import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { execSync } from "node:child_process";
import {
  getDecisions,
  readState,
  type ClassifiedDecision,
  type ClassifierInterface,
  type CommitEntry,
} from "@decidex/core";
import { runGenerate } from "./generate.js";

let tmpDir: string;
let logSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

function git(cmd: string): string {
  return execSync(`git ${cmd}`, { cwd: tmpDir, stdio: "pipe" }).toString().trim();
}

function commit(subject: string, body = ""): void {
  fs.writeFileSync(path.join(tmpDir, "f.txt"), `${Date.now()}-${Math.random()}`);
  git("add .");
  git(`commit -q -m "${subject}" ${body ? `-m "${body}"` : ""}`);
}

beforeEach(() => {
  tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "decidex-generate-")));
  git("init -q");
  git('config user.email "test@example.com"');
  git('config user.name "Test User"');
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  process.exitCode = undefined;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function output(): string {
  return logSpy.mock.calls.map((c) => c.join(" ")).join("\n");
}

/** A classifier that returns one fixed decision per call, and records the commits it was given. */
function fakeClassifier(decisions: ClassifiedDecision[] = []): ClassifierInterface & { calls: CommitEntry[][] } {
  const calls: CommitEntry[][] = [];
  return {
    calls,
    async classify(commits: CommitEntry[]) {
      calls.push(commits);
      return decisions;
    },
  };
}

const SAMPLE_DECISION: ClassifiedDecision = {
  area: "src/auth/",
  text: "Use JWT, not sessions",
  confidence: 5,
  rationale: "Stateless and scalable",
  tags: ["auth"],
};

describe("runGenerate — validation and empty history", () => {
  it("errors when not run inside a git repo", async () => {
    const nonRepo = fs.mkdtempSync(path.join(os.tmpdir(), "decidex-notgit-"));
    await runGenerate(nonRepo, {}, fakeClassifier());
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Not a git repo"));
    expect(process.exitCode).toBe(1);
    fs.rmSync(nonRepo, { recursive: true, force: true });
  });

  it("creates a minimal CLAUDE.md when there is no git history", async () => {
    await runGenerate(tmpDir, { yes: true }, fakeClassifier());
    expect(fs.existsSync(path.join(tmpDir, "CLAUDE.md"))).toBe(true);
    expect(output()).toContain("No git history found");
  });
});

describe("runGenerate — dry run", () => {
  it("reports the estimate and does not call the classifier or write decisions", async () => {
    commit("Use JWT, not sessions", "Stateless and scalable, no session store needed here");
    const classifier = fakeClassifier([SAMPLE_DECISION]);

    await runGenerate(tmpDir, { dryRun: true }, classifier);

    expect(output()).toContain("Dry run complete");
    expect(classifier.calls).toHaveLength(0);
    expect(fs.existsSync(path.join(tmpDir, ".decisions"))).toBe(false);
  });
});

describe("runGenerate — classification", () => {
  it("writes classified decisions to .decisions/ and updates CLAUDE.md", async () => {
    commit("Use JWT, not sessions", "Stateless and scalable, no session store needed here");
    const classifier = fakeClassifier([SAMPLE_DECISION]);

    await runGenerate(tmpDir, { yes: true }, classifier);

    const decisions = getDecisions(tmpDir, "src/auth/");
    expect(decisions).toHaveLength(1);
    expect(decisions[0].text).toBe("Use JWT, not sessions");
    expect(decisions[0].source).toBe("generate");

    const claudeMD = fs.readFileSync(path.join(tmpDir, "CLAUDE.md"), "utf8");
    expect(claudeMD).toContain("Use JWT, not sessions");
  });

  it("persists state with the HEAD commit hash after a run", async () => {
    commit("Use JWT, not sessions", "Stateless and scalable, no session store needed here");
    const headSha = git("rev-parse HEAD");
    await runGenerate(tmpDir, { yes: true }, fakeClassifier([SAMPLE_DECISION]));

    const state = readState(tmpDir);
    expect(state?.lastCommitHash).toBe(headSha);
    expect(state?.totalDecisions).toBe(1);
  });

  it("installs the pre-commit secret scanner hook", async () => {
    commit("Use JWT, not sessions", "Stateless and scalable, no session store needed here");
    await runGenerate(tmpDir, { yes: true }, fakeClassifier([SAMPLE_DECISION]));
    expect(fs.existsSync(path.join(tmpDir, ".git", "hooks", "pre-commit"))).toBe(true);
  });

  it("skips commits with messages shorter than the minimum length", async () => {
    commit("wip");
    const classifier = fakeClassifier([]);
    await runGenerate(tmpDir, { yes: true }, classifier);
    expect(classifier.calls).toHaveLength(0);
    expect(output()).toContain("Skipped");
  });
});

describe("runGenerate — incremental runs", () => {
  it("only classifies new commits on a second run", async () => {
    commit("Use JWT, not sessions", "Stateless and scalable, no session store needed here");
    await runGenerate(tmpDir, { yes: true }, fakeClassifier([SAMPLE_DECISION]));

    commit("REST API not GraphQL", "Team is unfamiliar with GraphQL tooling");
    const secondClassifier = fakeClassifier([
      { ...SAMPLE_DECISION, area: "src/api/", text: "REST API not GraphQL" },
    ]);
    await runGenerate(tmpDir, { yes: true }, secondClassifier);

    expect(secondClassifier.calls).toHaveLength(1);
    expect(secondClassifier.calls[0]).toHaveLength(1);
    expect(secondClassifier.calls[0][0].subject).toBe("REST API not GraphQL");

    const all = getDecisions(tmpDir, "");
    expect(all).toHaveLength(2);
  });

  it("reports up to date when there are no new commits since the last run", async () => {
    commit("Use JWT, not sessions", "Stateless and scalable, no session store needed here");
    await runGenerate(tmpDir, { yes: true }, fakeClassifier([SAMPLE_DECISION]));

    await runGenerate(tmpDir, {}, fakeClassifier([SAMPLE_DECISION]));
    expect(output()).toContain("up to date");
  });
});

describe("runGenerate — error handling", () => {
  it("errors out when all classification batches fail and none succeed", async () => {
    commit("Use JWT, not sessions", "Stateless and scalable, no session store needed here");
    const failingClassifier: ClassifierInterface = {
      async classify() {
        throw new Error("network down");
      },
    };

    await runGenerate(tmpDir, { yes: true }, failingClassifier);

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("All batches failed"));
    expect(process.exitCode).toBe(1);
    expect(getDecisions(tmpDir, "")).toHaveLength(0);
  });

  it("errors when ANTHROPIC_API_KEY is unset and no classifier override or --local is given", async () => {
    commit("Use JWT, not sessions", "Stateless and scalable, no session store needed here");
    vi.stubEnv("ANTHROPIC_API_KEY", "");

    await runGenerate(tmpDir, { yes: true });

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("ANTHROPIC_API_KEY"));
    expect(process.exitCode).toBe(1);
  });
});
