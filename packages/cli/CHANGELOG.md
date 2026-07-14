# decidex

## 0.1.2

### Patch Changes

- 8b7df8a: Fix missing README on npm — none of the three published packages had their own README.md, so npm showed "This package does not have a README" for all of them since the first release. `prepublishOnly` now copies the monorepo root README into each package before publish.
- Updated dependencies [8b7df8a]
  - @decidex/core@0.1.2

## 0.1.1

### Patch Changes

- 4bc9489: First public release: CLI (`init`, `generate`, `capture`, `stats`, `scan`), MCP server for Claude Code integration, and multi-tool injection (Cursor, Copilot, Windsurf).
- Updated dependencies [4bc9489]
  - @decidex/core@0.1.1
