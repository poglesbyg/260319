# decidex

**AI coding tools forget everything between sessions. decidex fixes that.**

decidex extracts engineering decisions from your git history and surfaces them in `CLAUDE.md`, Cursor rules, and GitHub Copilot instructions — so your AI tools know what you've already decided, what you've explicitly rejected, and why.

## How it works

```
git log → Claude API → .decisions/{area}/{id}.md → CLAUDE.md
                                                  → .cursor/rules/decidex.mdc
                                                  → .github/copilot-instructions.md
```

Decisions are stored as plain markdown files in `.decisions/`. Your AI tools read them via `CLAUDE.md` markers or an MCP server. New commits are classified incrementally.

## Install

```bash
npm install -g decidex
```

Or use without installing:

```bash
npx decidex generate
```

## Quickstart

```bash
# 1. Set your API key
export ANTHROPIC_API_KEY=sk-ant-...

# 2. Wire up hooks and MCP (run once per repo)
decidex init

# 3. Classify your git history
decidex generate

# 4. See what was captured
decidex stats
```

After `generate`, your `CLAUDE.md` will contain an auto-managed section like:

```markdown
<!-- decidex:start -->
## Engineering Decisions (managed by decidex)

- Use Zod for all request validation, not Yup or Joi
- REST API not GraphQL — team unfamiliar with GraphQL
- No external state management — React Context only
<!-- decidex:end -->
```

## Commands

### `decidex init`

Wire up decidex in the current repo. Run once.

- Installs a **pre-commit hook** that scans `.decisions/` files for accidental secrets
- Installs a **post-commit hook** that runs `decidex generate --yes` automatically after each commit (incremental — only new commits are classified, so it's fast)
- Writes MCP config to `.claude/mcp.json` and Claude Desktop config

```bash
decidex init
decidex init --no-hook   # skip git hooks
```

### `decidex generate`

Analyze git history and update `CLAUDE.md` with captured decisions.

```bash
decidex generate                        # analyze last 90 days, prompt for API cost
decidex generate --yes                  # skip cost prompt
decidex generate --since 2024-01-01     # since a specific date
decidex generate --dry-run              # count commits + show cost, no API call

# Free, private — uses local Ollama instead of Claude API
decidex generate --local
decidex generate --local --model llama3.2

# Also inject into Cursor, Copilot, and Windsurf
decidex generate --tools cursor,copilot,windsurf

# Watch mode: auto-runs every 60s, incremental
decidex generate --watch
```

Subsequent runs are **incremental** — only commits since the last run are classified. The first run does the full history scan.

### `decidex capture`

Manually add an engineering decision that isn't in git history.

```bash
decidex capture "Use Zod for all request validation, not Yup"
decidex capture "No Passport.js — too complex, use JWT directly" \
  --area src/auth/ \
  --rationale "Passport adds 400 lines for 50-line problem" \
  --tags auth,security \
  --confidence 5
```

Options:
- `--area <path>` — relative directory this applies to (default: repo-wide)
- `--confidence <1-5>` — how certain is this decision (default: 5 for manual)
- `--rationale <text>` — why this decision was made
- `--tags <a,b,c>` — searchable tags

### `decidex stats`

See what's been captured.

```bash
decidex stats
```

```
📊  decidex stats for my-project

Total decisions: 23
Date range:      2024-03-01 → 2026-03-20

By area:
  src/auth/                          5
  src/api/                           4
  packages/core/                     3
  (repo-wide)                        11

Most recent decisions:
  2026-03-20 [src/auth/] Use JWT, not sessions
  2026-03-19 [src/api/]  REST not GraphQL
  ...
```

## MCP Server (Claude Code integration)

The MCP server lets Claude Code query decisions for whatever file you're working on.

### Setup

After `decidex init`, `.claude/mcp.json` is written automatically. To configure manually:

**Claude Code** — add to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "decidex": {
      "command": "decidex-mcp",
      "args": ["--repo", "/path/to/your/project"]
    }
  }
}
```

**Claude Desktop** — add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "decidex": {
      "command": "decidex-mcp",
      "args": ["--repo", "/path/to/your/project"]
    }
  }
}
```

### MCP tools

Once configured, Claude Code can call:

- **`get_decisions(area, limit?)`** — returns decisions relevant to a file or directory
- **`get_stats()`** — returns total count and breakdown by area

Add this to your `CLAUDE.md` to make Claude use it automatically:

```markdown
When starting work on any file, call get_decisions with the file's directory path
to surface relevant engineering decisions before making changes.
```

## Multi-tool injection

Write decisions to Cursor, GitHub Copilot, and Windsurf context files:

```bash
decidex generate --tools cursor,copilot,windsurf
```

Creates/updates:
- `.cursor/rules/decidex.mdc` — Cursor AI rules (with `alwaysApply: true`)
- `.github/copilot-instructions.md` — GitHub Copilot instructions
- `.windsurfrules` — Windsurf rules

All files use `<!-- decidex:start -->` / `<!-- decidex:end -->` markers, so re-running is safe and user content outside the markers is preserved.

## Decision store

Decisions are stored in `.decisions/` as markdown files with YAML frontmatter:

```
.decisions/
  src/auth/
    3f2c1a4b-...uuid....md
  src/api/
    8e9d2f1c-...uuid....md
```

Each file:

```markdown
---
id: 3f2c1a4b-1234-5678-abcd-ef0123456789
version: 1
author: Alice
timestamp: 2026-03-20T14:00:00.000Z
area: src/auth/
confidence: 4
tags: ["auth", "security"]
source: generate
---

Use JWT for authentication, not sessions

**Rationale:** Stateless — scales horizontally without shared session store
```

The `.decisions/` directory should be committed to git so decisions are shared across the team.

## Local mode (Ollama)

Run entirely offline and free with a local Ollama model:

```bash
# Install Ollama: https://ollama.ai
ollama pull llama3.2

decidex generate --local
decidex generate --local --model llama3.2:latest
```

decidex recommends `llama3` or better for quality decision extraction and will warn if a weaker model is selected.

## Secret scanning

The pre-commit hook (`decidex init`) scans `.decisions/` files for accidentally committed secrets before every commit. Patterns detected:

- AWS access keys
- API keys (`sk-`, `ghp_`, `sk-ant-`, `sk-proj-`, etc.)
- Bearer tokens
- Private key headers
- Password assignments

To allowlist a false positive, add the pattern to `.decidex-secrets.allow`:

```
# One regex per line
sk-test-.*  # test keys are fine
```

## Contributing

```bash
git clone https://github.com/decidex/decidex
cd decidex
npm install
npm run build
npm test
```

Tests live in `packages/core/src/*.test.ts`. Run a single file:

```bash
cd packages/core && npx vitest run src/decision-store.test.ts
```

## License

MIT
