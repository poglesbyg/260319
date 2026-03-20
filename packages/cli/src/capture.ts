import * as path from "node:path";
import {
  writeDecision,
  newDecisionId,
  mergeCLAUDEMD,
  getDecisions,
  injectDecisions,
  validateArea,
  type Decision,
  type InjectionTarget,
} from "@decidex/core";
import { isGitRepo, getRepoRoot, getGitAuthor } from "./git.js";

export interface CaptureOptions {
  area?: string;
  confidence?: number;
  rationale?: string;
  tags?: string[];
  tools?: string[];
}

/** Run the capture command — manually add a single engineering decision. */
export function runCapture(cwd: string, text: string, opts: CaptureOptions): void {
  if (!isGitRepo(cwd)) {
    console.error("✗ Not a git repo. Run from your project root.");
    process.exitCode = 1;
    return;
  }

  const repoRoot = getRepoRoot(cwd);

  // Validate inputs
  if (!text.trim()) {
    console.error("✗ Decision text cannot be empty.");
    process.exitCode = 1;
    return;
  }

  const area = opts.area ?? "";
  const areaCheck = validateArea(area);
  if (!areaCheck.valid) {
    console.error(`✗ Invalid area: ${areaCheck.error}`);
    process.exitCode = 1;
    return;
  }

  const confidence = (opts.confidence ?? 5) as Decision["confidence"];
  if (confidence < 1 || confidence > 5) {
    console.error("✗ Confidence must be between 1 and 5.");
    process.exitCode = 1;
    return;
  }

  const decision: Decision = {
    id: newDecisionId(),
    version: 1,
    author: getGitAuthor(repoRoot),
    timestamp: new Date().toISOString(),
    area,
    confidence,
    tags: opts.tags ?? [],
    text: text.trim(),
    rationale: opts.rationale,
    source: "capture",
  };

  writeDecision(repoRoot, decision);
  console.log(`✓ Decision captured → .decisions/${area || ""}${decision.id}.md`);

  // Update CLAUDE.md
  const claudeMDPath = path.join(repoRoot, "CLAUDE.md");
  const allDecisions = getDecisions(repoRoot, "", 20).map((d) => d.text);
  const mergeResult = mergeCLAUDEMD(claudeMDPath, allDecisions);
  const stateMsg =
    mergeResult.state === "created" ? "Created" : mergeResult.state === "updated" ? "Updated" : "Prepended to";
  console.log(`✓ ${stateMsg} ${claudeMDPath}`);

  // Update tool context files if they exist (only overwrite existing ones)
  const toolTargets: InjectionTarget[] = opts.tools as InjectionTarget[] ?? [];
  if (toolTargets.length > 0) {
    const results = injectDecisions(repoRoot, allDecisions, toolTargets);
    for (const r of results) {
      const action = r.state === "created" ? "Created" : r.state === "updated" ? "Updated" : "Prepended to";
      console.log(`✓ ${action} ${r.filePath}`);
    }
  }
}
