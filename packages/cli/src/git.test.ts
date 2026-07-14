import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { execSync } from "node:child_process";
import {
  isGitRepo,
  getRepoRoot,
  getRepoName,
  getGitAuthor,
  getHeadCommit,
  getCommits,
  getCommitsSince,
} from "./git.js";

let tmpDir: string;

function git(cmd: string, cwd = tmpDir): string {
  return execSync(`git ${cmd}`, { cwd, stdio: "pipe" }).toString().trim();
}

beforeEach(() => {
  tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "decidex-git-")));
  git("init -q");
  git('config user.email "test@example.com"');
  git('config user.name "Test User"');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("isGitRepo", () => {
  it("returns true inside a git repo", () => {
    expect(isGitRepo(tmpDir)).toBe(true);
  });

  it("returns false outside a git repo", () => {
    const nonRepo = fs.mkdtempSync(path.join(os.tmpdir(), "decidex-notgit-"));
    expect(isGitRepo(nonRepo)).toBe(false);
    fs.rmSync(nonRepo, { recursive: true, force: true });
  });
});

describe("getRepoRoot", () => {
  it("returns the repo root from a nested subdirectory", () => {
    const sub = path.join(tmpDir, "a", "b");
    fs.mkdirSync(sub, { recursive: true });
    expect(getRepoRoot(sub)).toBe(tmpDir);
  });
});

describe("getRepoName", () => {
  it("falls back to the directory name when there is no remote", () => {
    expect(getRepoName(tmpDir)).toBe(path.basename(tmpDir));
  });

  it("derives the name from the origin remote URL when present", () => {
    git("remote add origin https://github.com/example/my-repo.git");
    expect(getRepoName(tmpDir)).toBe("my-repo");
  });
});

describe("getGitAuthor", () => {
  it("returns the configured user.name", () => {
    expect(getGitAuthor(tmpDir)).toBe("Test User");
  });

  it("falls back to 'unknown' when no user.name is configured anywhere", () => {
    const emptyConfig = path.join(tmpDir, "empty-gitconfig");
    fs.writeFileSync(emptyConfig, "");
    vi.stubEnv("GIT_CONFIG_GLOBAL", emptyConfig);
    vi.stubEnv("GIT_CONFIG_SYSTEM", emptyConfig);
    // Repo-local config still has user.name from beforeEach — unset it for this test.
    git("config --unset user.name");
    expect(getGitAuthor(tmpDir)).toBe("unknown");
    vi.unstubAllEnvs();
  });
});

describe("getHeadCommit", () => {
  it("returns null when the repo has no commits", () => {
    expect(getHeadCommit(tmpDir)).toBeNull();
  });

  it("returns the HEAD sha after a commit", () => {
    fs.writeFileSync(path.join(tmpDir, "f.txt"), "hi");
    git("add .");
    git('commit -q -m "first"');
    const sha = getHeadCommit(tmpDir);
    expect(sha).toMatch(/^[0-9a-f]{40}$/);
    expect(sha).toBe(git("rev-parse HEAD"));
  });
});

describe("getCommits", () => {
  it("returns an empty array for a repo with no commits", () => {
    expect(getCommits(tmpDir)).toEqual([]);
  });

  it("parses subject and body for each commit", () => {
    fs.writeFileSync(path.join(tmpDir, "f.txt"), "hi");
    git("add .");
    git('commit -q -m "Use JWT, not sessions" -m "Stateless and scalable"');

    const commits = getCommits(tmpDir);
    expect(commits).toHaveLength(1);
    expect(commits[0].subject).toBe("Use JWT, not sessions");
    expect(commits[0].body).toBe("Stateless and scalable");
    expect(commits[0].hash).toMatch(/^[0-9a-f]{40}$/);
  });

  it("returns commits in most-recent-first order", () => {
    fs.writeFileSync(path.join(tmpDir, "f.txt"), "1");
    git("add .");
    git('commit -q -m "first commit"');
    fs.writeFileSync(path.join(tmpDir, "f.txt"), "2");
    git("add .");
    git('commit -q -m "second commit"');

    const commits = getCommits(tmpDir);
    expect(commits).toHaveLength(2);
    expect(commits[0].subject).toBe("second commit");
    expect(commits[1].subject).toBe("first commit");
  });

  it("respects --since filtering out all commits when given a future date", () => {
    fs.writeFileSync(path.join(tmpDir, "f.txt"), "hi");
    git("add .");
    git('commit -q -m "some commit"');

    expect(getCommits(tmpDir, "2099-01-01")).toEqual([]);
  });
});

describe("getCommitsSince", () => {
  it("returns only commits made after the given sha", () => {
    fs.writeFileSync(path.join(tmpDir, "f.txt"), "1");
    git("add .");
    git('commit -q -m "first commit"');
    const firstSha = git("rev-parse HEAD");

    fs.writeFileSync(path.join(tmpDir, "f.txt"), "2");
    git("add .");
    git('commit -q -m "second commit"');

    const commits = getCommitsSince(tmpDir, firstSha);
    expect(commits).toHaveLength(1);
    expect(commits[0].subject).toBe("second commit");
  });

  it("returns an empty array when there are no new commits", () => {
    fs.writeFileSync(path.join(tmpDir, "f.txt"), "1");
    git("add .");
    git('commit -q -m "only commit"');
    const sha = git("rev-parse HEAD");

    expect(getCommitsSince(tmpDir, sha)).toEqual([]);
  });
});
