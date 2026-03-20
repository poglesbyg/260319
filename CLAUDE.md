# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**decidex** — captures engineering decisions from git history and surfaces them in CLAUDE.md so AI coding tools never forget them.

## Commands

```bash
npm run build        # tsc -b (respects project reference ordering: core → cli)
npm test             # run all tests (vitest, 38 tests in packages/core)
npm run clean        # delete dist/ in all packages

# Per-package
npm run build -w packages/core
npm run test  -w packages/core

# Single test file
cd packages/core && npx vitest run src/decision-store.test.ts
```

## Architecture

```
decidex/
├── packages/
│   ├── core/          @decidex/core — all business logic (no CLI deps)
│   │   └── src/
│   │       ├── types.ts            Decision type, DECISION_SCHEMA_VERSION
│   │       ├── decision-store.ts   Read/write .decisions/ directory
│   │       ├── claude-md-merge.ts  Merge decisions into CLAUDE.md
│   │       ├── git-classifier.ts   LLM classification pipeline
│   │       ├── secret-scanner.ts   Pre-commit secret detection
│   │       └── index.ts            Re-exports
│   └── cli/           decidex binary
│       └── src/
│           ├── main.ts      commander entry point (generate, stats, scan)
│           ├── generate.ts  generate command orchestration
│           ├── stats.ts     stats command
│           └── git.ts       git utilities (getCommits, getRepoRoot, etc.)
└── tsconfig.json      root project references (core → cli ordering)
```

## Key Design Decisions

**Decision store format** — `.decisions/{area}/{uuid}.md` with YAML frontmatter. Body is `text\n\n**Rationale:** ...`. Parse with `parseDecision()`, write with `writeDecision()` (atomic).

**CLAUDE.md markers** — `<!-- decidex:start -->` / `<!-- decidex:end -->` are a public API. Never rename without a migration. Three states: created (no file), updated (markers present), prepended (file exists, no markers).

**ClassifierInterface** — injectable for testing. `ClaudeAPIClassifier` uses `claude-3-5-haiku-20241022`. `OllamaClassifier` uses local Ollama REST. Tests use `mockClassifier()` vitest mocks.

**Batch size** — 500 commits per API call. Retries once per batch. Atomic: collects ALL results before writing anything.

**Pre-filter** — commits with `subject + body < 20 chars` are skipped. Skip count is reported.

**Atomic writes** — `atomicWrite()` in claude-md-merge writes temp file in the SAME directory as target (not os.tmpdir), then renames. Guarantees same-filesystem rename.

## Testing

Tests live in `packages/core/src/*.test.ts`. Run with `vitest`. No test files in `packages/cli` (integration tested manually).

Use `mockClassifier(decisions)` from the test helpers pattern to inject decisions without hitting the API.
