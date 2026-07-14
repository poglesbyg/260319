---
"decidex": patch
"@decidex/core": patch
"@decidex/mcp": patch
---

Fix missing README on npm — none of the three published packages had their own README.md, so npm showed "This package does not have a README" for all of them since the first release. `prepublishOnly` now copies the monorepo root README into each package before publish.
