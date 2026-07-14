import * as path from "node:path";
import type { Decision, StoreStats } from "@decidex/core";

/** Resolve the repo root from a `--repo <path>` CLI arg, falling back to cwd. */
export function resolveRepoRoot(argv: string[], cwd: string): string {
  const repoArgIdx = argv.indexOf("--repo");
  return repoArgIdx !== -1 && argv[repoArgIdx + 1] ? path.resolve(cwd, argv[repoArgIdx + 1]) : cwd;
}

/** Format the text response for the get_decisions MCP tool. */
export function formatDecisionsResponse(decisions: Decision[], area: string): string {
  if (decisions.length === 0) {
    return `No decisions found for area: ${area || "(repo-wide)"}. Run \`decidex generate\` to extract decisions from git history.`;
  }

  const formatted = decisions
    .map((d) => {
      const header = `[${d.area || "repo-wide"}] ${d.text}`;
      const meta = `  confidence: ${d.confidence}/5 | tags: ${d.tags.join(", ")} | ${d.timestamp.slice(0, 10)}`;
      const rationale = d.rationale ? `  rationale: ${d.rationale}` : "";
      return [header, meta, rationale].filter(Boolean).join("\n");
    })
    .join("\n\n");

  return `Engineering decisions for ${area || "(repo-wide)"} (${decisions.length} found):\n\n${formatted}`;
}

/** Format the text response for the get_stats MCP tool. */
export function formatStatsResponse(stats: StoreStats): string {
  if (stats.total === 0) {
    return "No decisions captured yet. Run `decidex generate` to extract decisions from git history.";
  }

  const byArea = Object.entries(stats.byArea)
    .sort((a, b) => b[1] - a[1])
    .map(([area, count]) => `  ${(area || "(repo-wide)").padEnd(40)} ${count}`)
    .join("\n");

  const dateRange =
    stats.oldestTimestamp && stats.newestTimestamp
      ? `${stats.newestTimestamp.slice(0, 10)} ← newest\n  ${stats.oldestTimestamp.slice(0, 10)} ← oldest`
      : "";

  return [`Total decisions: ${stats.total}`, dateRange, "", "By area:", byArea]
    .filter((l) => l !== undefined)
    .join("\n");
}
