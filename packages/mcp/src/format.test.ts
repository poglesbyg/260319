import { describe, it, expect } from "vitest";
import type { Decision, StoreStats } from "@decidex/core";
import { resolveRepoRoot, formatDecisionsResponse, formatStatsResponse } from "./format.js";

describe("resolveRepoRoot", () => {
  it("resolves a relative --repo arg against cwd", () => {
    const result = resolveRepoRoot(["node", "index.js", "--repo", "some/project"], "/home/user");
    expect(result).toBe("/home/user/some/project");
  });

  it("resolves an absolute --repo arg as-is", () => {
    const result = resolveRepoRoot(["node", "index.js", "--repo", "/abs/project"], "/home/user");
    expect(result).toBe("/abs/project");
  });

  it("falls back to cwd when --repo is absent", () => {
    expect(resolveRepoRoot(["node", "index.js"], "/home/user")).toBe("/home/user");
  });

  it("falls back to cwd when --repo has no value after it", () => {
    expect(resolveRepoRoot(["node", "index.js", "--repo"], "/home/user")).toBe("/home/user");
  });
});

const BASE_DECISION: Decision = {
  id: "abc-123",
  version: 1,
  author: "Alice",
  timestamp: "2026-01-01T00:00:00.000Z",
  area: "src/auth/",
  confidence: 5,
  tags: ["auth", "security"],
  text: "Use JWT, not sessions",
  rationale: "Stateless and scalable",
  source: "capture",
};

describe("formatDecisionsResponse", () => {
  it("returns a helpful message when there are no decisions", () => {
    const text = formatDecisionsResponse([], "src/auth/");
    expect(text).toContain("No decisions found for area: src/auth/");
    expect(text).toContain("decidex generate");
  });

  it("labels an empty area as repo-wide when there are no decisions", () => {
    expect(formatDecisionsResponse([], "")).toContain("(repo-wide)");
  });

  it("formats decisions with area, confidence, tags, date, and rationale", () => {
    const text = formatDecisionsResponse([BASE_DECISION], "src/auth/");
    expect(text).toContain("Engineering decisions for src/auth/ (1 found)");
    expect(text).toContain("[src/auth/] Use JWT, not sessions");
    expect(text).toContain("confidence: 5/5");
    expect(text).toContain("tags: auth, security");
    expect(text).toContain("2026-01-01");
    expect(text).toContain("rationale: Stateless and scalable");
  });

  it("omits the rationale line when a decision has none", () => {
    const { rationale, ...rest } = BASE_DECISION;
    const text = formatDecisionsResponse([rest as Decision], "src/auth/");
    expect(text).not.toContain("rationale:");
  });

  it("labels a repo-wide decision's area as 'repo-wide' in the header", () => {
    const text = formatDecisionsResponse([{ ...BASE_DECISION, area: "" }], "");
    expect(text).toContain("[repo-wide] Use JWT, not sessions");
  });
});

describe("formatStatsResponse", () => {
  it("returns a helpful message when there are no decisions", () => {
    const stats: StoreStats = { total: 0, byArea: {}, recentDecisions: [] };
    expect(formatStatsResponse(stats)).toContain("No decisions captured yet");
  });

  it("formats total, area breakdown, and date range", () => {
    const stats: StoreStats = {
      total: 3,
      byArea: { "src/auth/": 2, "src/api/": 1 },
      recentDecisions: [],
      oldestTimestamp: "2026-01-01T00:00:00.000Z",
      newestTimestamp: "2026-03-01T00:00:00.000Z",
    };
    const text = formatStatsResponse(stats);
    expect(text).toContain("Total decisions: 3");
    expect(text).toContain("src/auth/");
    expect(text).toContain("src/api/");
    expect(text).toContain("2026-03-01 ← newest");
    expect(text).toContain("2026-01-01 ← oldest");
  });

  it("sorts areas by count, descending", () => {
    const stats: StoreStats = {
      total: 3,
      byArea: { "src/api/": 1, "src/auth/": 2 },
      recentDecisions: [],
    };
    const text = formatStatsResponse(stats);
    expect(text.indexOf("src/auth/")).toBeLessThan(text.indexOf("src/api/"));
  });

  it("labels an empty area key as (repo-wide)", () => {
    const stats: StoreStats = { total: 1, byArea: { "": 1 }, recentDecisions: [] };
    expect(formatStatsResponse(stats)).toContain("(repo-wide)");
  });
});
