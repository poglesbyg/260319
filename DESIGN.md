# Design System — decidex

## Product Context
- **What this is:** A CLI tool + MCP server that captures engineering decisions from git history and surfaces them in CLAUDE.md so AI coding tools never re-suggest rejected approaches or forget established decisions.
- **Who it's for:** Senior engineers using AI-assisted coding tools (Claude Code, Cursor, Copilot, Windsurf) who want persistent, queryable architectural memory.
- **Space/industry:** AI developer tooling — alongside Cursor, Warp, Windsurf, Pieces.
- **Project type:** npm CLI package with MCP server. Primary visual surfaces: npm/GitHub landing page, terminal output, README.

## Aesthetic Direction
- **Direction:** Industrial/Editorial Archive — git log meets field notes journal. Terse, serious, zero decorative flourishes.
- **Decoration level:** Minimal — typography and whitespace do all the work. Horizontal rules as section dividers, not color blocks. No glassmorphism, no gradient blobs, no rounded-card decorations.
- **Mood:** A tool that respects the engineer's time. Every pixel earns its place. Nothing aspirational, nothing friendly-corporate — just decisions, committed.
- **Differentiation from category:** Every AI dev tool (Cursor, Warp, Windsurf, Pieces) uses cold dark blue-black + Inter + rounded cards. decidex uses warm near-black + monospace hero type + amber accent + zero border-radius on structural elements.

## Typography
- **Display/Hero:** JetBrains Mono — monospace for headlines and product name. Signals terminal-native authenticity. Differentiates from every competitor using clean sans-serif heroes.
- **Body:** Instrument Sans — warm, readable, not Inter. 400/600 weights.
- **UI/Labels:** JetBrains Mono — all metadata, badges, section labels, CLI output, timestamps.
- **Code:** JetBrains Mono (same as display/labels — consistency throughout).
- **Loading:** Google Fonts CDN — `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Instrument+Sans:wght@400;500;600&display=swap`
- **Scale:**
  - Hero/Display: clamp(32px, 5vw, 56px) — JetBrains Mono 400
  - H2: clamp(20px, 3vw, 28px) — JetBrains Mono 400
  - H3/Feature title: 18px — Instrument Sans 600
  - Body: 16-17px — Instrument Sans 400, line-height 1.6
  - Small/Meta: 12-13px — JetBrains Mono 400-500
  - Label/Badge: 11px — JetBrains Mono 500, letter-spacing 0.1em

## Color
- **Approach:** Restrained — one amber accent, warm neutrals. Color is rare and meaningful.
- **Background:** `#131110` — near-black with warm undertone (not cold blue-black)
- **Background-2:** `#1C1A17` — cards, code blocks, elevated surfaces
- **Background-3:** `#242118` — deep insets, terminal background
- **Border:** `#2E2B25` — warm gray border, used everywhere structure needs delineation
- **Text:** `#EDE8E0` — off-white with warmth, not pure white
- **Text-2:** `#A89F94` — secondary text, descriptions
- **Text-3:** `#6B6158` — muted, timestamps, metadata, placeholders
- **Accent:** `#D4953A` — amber/warm gold. Used for: decision area labels, key CTAs, confidence indicators, active states, progress bars.
- **Accent-2:** `#B87A28` — accent hover/pressed state
- **Accent-bg:** `rgba(212, 149, 58, 0.08)` — accent background tint for badges, alerts
- **Success:** `#5B8C5A`
- **Error:** `#C05858`
- **Warning:** `#D4953A` (same as accent — it's a feature of warm palettes)
- **Dark mode strategy:** This IS the dark mode. The palette was designed dark-first.
- **Light mode:** Inverted warm palette — `#F4F0EA` background, `#1C1A17` text, `#B87028` accent. All CSS custom properties swap via `[data-theme="light"]`.

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable
- **Scale:** 8 / 16 / 24 / 32 / 48 / 64 / 96
- **Max content width:** 1100px

## Layout
- **Approach:** Grid-disciplined — strict alignment, predictable hierarchy. Inspired by technical documentation.
- **Grid:** Single column with max-width. Feature grids use CSS grid with `auto-fit, minmax(300px, 1fr)` and 1px gap on `var(--border)` background (creates hairline grid lines without extra markup).
- **Section rhythm:** Sections separated by `border-top: 1px solid var(--border)` — horizontal rules, never color blocks.
- **Border radius:** `0px` on all structural elements (cards, buttons, feature cells, decision cards, stat cells, terminal blocks). `4px` on form inputs only. No "rounded pill" buttons. No bubbly corners.

## Motion
- **Approach:** Minimal-functional — only transitions that aid comprehension.
- **Easing:** ease-out for entering, ease-in for exiting
- **Duration:** 120ms for state changes (color, border, opacity). No entrance animations.
- **What animates:** Button hover (bg/color), input focus (border-color), theme toggle. Nothing else.
- **prefers-reduced-motion:** Honor it — use `transition: none` for users who opt out.

## Light Mode

The palette was designed dark-first. Light mode inverts all surface and text values while keeping the same warm character. Terminal blocks stay dark in both modes — an authentic terminal always has a dark background.

### CSS Custom Properties (`[data-theme="light"]`)

```css
[data-theme="light"] {
  --bg:         #F4F0EA;   /* warm cream — not stark white */
  --bg-2:       #EDE8DF;   /* card surfaces */
  --bg-3:       #E3DDD3;   /* deep insets, form inputs */
  --border:     #C8C1B5;   /* warm gray border */
  --text:       #1C1A17;   /* near-black, warm */
  --text-2:     #4A4438;   /* medium warm brown-gray */
  --text-3:     #8A7F74;   /* muted warm gray */
  --accent:     #B87028;   /* darker amber for contrast on light bg */
  --accent-2:   #9A5E1C;   /* accent hover/pressed */
  --accent-bg:  rgba(184, 112, 40, 0.08);
  --success:    #3A7038;   /* green deepened for light bg contrast */
  --error:      #A03030;   /* red deepened for light bg contrast */
  --warning:    #B87028;   /* same as accent */
  --term-bg:    #0D0C0A;   /* STAYS DARK — terminal is always dark */
}
```

### Contrast Ratios

| Pair | Dark mode | Light mode | Grade |
|------|-----------|------------|-------|
| text / bg | 14.3:1 | 12.8:1 | AAA |
| text-2 / bg | 6.4:1 | 5.2:1 | AA |
| accent / bg | 4.8:1 | 3.9:1 | AA large only |
| success / bg | 4.5:1 | 4.2:1 | AA |
| error / bg | 4.6:1 | 4.4:1 | AA |

**Amber is AA large only in both modes.** Never use `--accent` for body-size text in either theme.

### Implementation Notes
- Toggle via `data-theme` attribute on `<html>`. JS reads/writes `localStorage("decidex-theme")`.
- All CSS custom properties respond automatically — no class switching needed.
- Transition: `background 200ms ease-out, color 200ms ease-out` on `body` only. Do not animate every element.
- Reduced motion: skip theme transition entirely.

---

## Component Reference

### Decision Card
- Background: `var(--bg-2)`, border `var(--border)`, zero border-radius
- Cards stack with `border-top: none` between adjacent cards (shared border)
- Meta row: area label in `var(--accent)`, dot separator, date in `var(--text-3)`, confidence badge
- Confidence dots: 5 dots, filled with `var(--accent)`, empty with `var(--border)`, 6×6px, square

### Badges
- Font: JetBrains Mono 11px, padding 2px 8px, zero border-radius
- `badge-accent`: `var(--accent-bg)` bg, `var(--accent)` border + text
- `badge-muted`: `var(--bg-2)` bg, `var(--border)` border, `var(--text-3)` text
- `badge-success`/`badge-error`: equivalent tint pattern

### Terminal Block
- Background: `#0D0C0A` (deeper than bg — terminal owns its depth)
- JetBrains Mono 13px, line-height 1.7
- Color roles: `t-dim` = `#6B6158`, `t-accent` = `#D4953A`, `t-green` = `#5B8C5A`, `t-red` = `#C05858`, `t-muted` = `#A89F94`

### Buttons
- `btn-primary`: `var(--accent)` bg, `#131110` text (dark text on amber — high contrast)
- `btn-ghost`: transparent bg, `var(--border)` border, `var(--text-2)` text
- `btn-danger`: transparent bg, `var(--error)` border + text
- Font: JetBrains Mono 13px, padding 10px 20px, zero border-radius

### Alert / Notice
- Left border only (2px solid semantic color) + subtle tint background
- No icon-in-circle, no right border, no top/bottom border — just the left accent line

### Stat Grid
- CSS grid with 1px gap on `var(--border)` background — hairline separators without extra markup
- Stat value: JetBrains Mono 32–40px weight 300 (light weight for large numerals). **Always add `font-variant-numeric: tabular-nums`** so numbers don't shift width as they update.
- Stat label: body 12px, `var(--text-3)`

### Progress Bar
Used by `decidex generate` progress states and any multi-step workflow UI.
- Track: `height: 4px`, `background: var(--bg-3)`, `border: 1px solid var(--border)`, zero border-radius
- Fill: `background: var(--accent)`, `transition: width 300ms ease-out`
- Label above: JetBrains Mono 12px, `var(--text-3)`
- Meta row below: JetBrains Mono 11px, `var(--text-3)`, left = step label, right = percentage
- Completed state: fill goes to 100%, meta row shows count (e.g. "14 decisions")

### Empty State
For `.decisions/` area when no decisions exist, or any empty list view.
- Container: `border: 1px dashed var(--border)` — dashed distinguishes empty from populated
- Padding: `48px 32px`, `text-align: center`
- Icon: JetBrains Mono 24px, `var(--text-3)`. Use `[ ]` or `· · ·` — no icons from external libraries
- Title: JetBrains Mono 15px, `var(--text-2)`. Describe the empty state concretely, not generically.
- Sub-text: body 14px, `var(--text-3)`. Always include the command to fix the empty state: `decidex generate`
- Primary action: `btn-ghost`, font-size 12px, min-height 36px — a smaller ghost button, not a full CTA

### Table (Decision List View)
For decision list tables in the web UI or documentation.
- `border-collapse: collapse`, `border: 1px solid var(--border)`
- `th`: JetBrains Mono 11px, `font-weight 500`, `letter-spacing 0.08em`, uppercase, `var(--text-3)`, `background: var(--bg-2)`, `border-bottom: 1px solid var(--border)`, `padding: 10px 16px`
- `td`: body 14px, `var(--text)`, `padding: 12px 16px`, `border-bottom: 1px solid var(--border)`
- Last row: no `border-bottom`
- Row hover: `background: var(--bg-2)` — subtle highlight, no color
- Date cells: JetBrains Mono 12px, `var(--text-3)`, no wrapping

### Tooltip
For confidence dots, area label abbreviations, and any metadata that needs inline explanation.
- Container: `position: absolute`, `bottom: calc(100% + 8px)`, centered on trigger
- Body: `background: var(--bg-3)`, `border: 1px solid var(--border)`, JetBrains Mono 11px, `var(--text-2)`, `padding: 6px 10px`, `white-space: nowrap`
- Arrow: CSS `::after` with `border-top-color: var(--border)` — a 4px triangle pointing down
- Show on hover: `opacity: 0 → 1`, `transition: opacity 120ms`. Never `display: none/block` — too abrupt.
- Zero border-radius everywhere. No `box-shadow`.
- Max-width: 240px for longer tooltip text. Allow wrapping.

### Code Block
For inline code snippets and fenced blocks in documentation and the web landing page.
- **Inline** (`<code>`): JetBrains Mono 0.875em, `var(--text-2)`, `background: var(--bg-2)`, `padding: 1px 5px`. No border.
- **Block** (`<pre><code>`): `background: var(--bg-3)`, `border: 1px solid var(--border)`, zero border-radius, `padding: 16px 20px`, JetBrains Mono 13px, `line-height: 1.7`, `overflow-x: auto`
- Syntax highlight roles (minimal, non-framework):
  - Keywords: `var(--accent)` — `import`, `const`, `await`, `function`
  - Strings: `var(--success)` — quoted values
  - Comments: `var(--text-3)`, `font-style: italic`
  - Default: `var(--text-2)` — everything else
- No line numbers unless the block is > 20 lines and references specific line numbers in prose

## Typography Refinements

These add precision to the existing scale — no font choices changed.

- **Tabular numerals:** All stat values, counters, batch numbers, and any element where a number can change must use `font-variant-numeric: tabular-nums`. This prevents layout shift when numbers update (e.g., batch progress `12/45` → `13/45`).
- **Inline code in body text:** JetBrains Mono 0.875em, `var(--text-2)`, `background: var(--bg-2)`, `padding: 1px 5px`. Use the Code Block component spec above.
- **CSS font-size tokens** (add to `:root` for consistency):
  ```css
  --font-size-xs: 11px;   /* badges, labels, meta */
  --font-size-sm: 13px;   /* terminal output, buttons, secondary UI */
  --font-size-base: 16px; /* body */
  --font-size-body-lg: 17px; /* hero sub-copy, feature descriptions */
  --font-size-h3: 18px;   /* Instrument Sans 600 */
  --font-size-h2: clamp(20px, 3vw, 28px);
  --font-size-h1: clamp(32px, 5vw, 56px);
  ```

---

## CLI Terminal Output

Design spec for what `decidex` prints to stdout. These rules apply to all CLI commands. The terminal color roles (`t-accent`, `t-green`, `t-red`, `t-dim`) from the Terminal Block component are the canonical palette — they apply in the actual CLI output too.

### Color Roles in CLI Context

| Role | ANSI approximate | When to use |
|------|-----------------|-------------|
| Accent (amber) | Bold yellow / `\x1b[33m` | Command name in header, area labels, key values |
| Green | `\x1b[32m` | Success checkmarks (✓), confirmed operations |
| Red | `\x1b[31m` | Error markers (✗), blocked operations |
| Dim (text-3) | `\x1b[2m` | Separators, counts, metadata, `$` prompt prefix |
| Muted (text-2) | default | General output text, file paths |

Use [chalk](https://github.com/chalk/chalk) or [picocolors](https://github.com/alexeyraspopov/picocolors). Respect `NO_COLOR`, `FORCE_COLOR`, and `chalk.level`. Do not hardcode ANSI codes directly.

### Output Format: `decidex generate`

```
$ decidex generate --yes

─────────────────────────────────────── (dim)
decidex generate (accent)  v0.1.0 (dim)
repo: (dim) decidex (muted)    since: (dim) initial commit (muted)
─────────────────────────────────────── (dim)

→ fetching commits… (dim)  47 commits found (muted)
→ pre-filtering… (dim)     3 skipped (<20 chars) (dim)

  batch 1/1 (dim) [══════════════] (accent fill, dim brackets) 44/44 (muted)

✓ (green) packages/core (accent)   Use Zod for all request/data validation
✓ (green) packages/core (accent)   Use atomic file writes for decision store
✓ (green) packages/cli (accent)    Injectable git classifier for testing
· (dim) 2 commits skipped (WIP, merge)

─────────────────────────────────────── (dim)
  14 decisions (muted)   4 areas (dim)   3 skipped (dim)

✓ (green) CLAUDE.md updated (muted)
✓ (green) .decisions/ written (14 files) (muted)
✓ (green) secret scan passed (muted)

done in 4.2s (dim)
```

### Output Format: `decidex stats`

```
$ decidex stats

decisions: 14 (accent)
  packages/core    8 (dim)
  packages/cli     3 (dim)
  packages/mcp     2 (dim)
  web              1 (dim)

rejected approaches: 5
confidence: avg 3.8 / 5 (muted)
last run: 2026-03-22 (dim)
```

### Output Format: `decidex capture`

Interactive prompts use a clean prompt prefix — no framework spinners:

```
$ decidex capture

area (leave blank for repo-wide): packages/core
decision: Use Zod for validation, not Joi or Yup
rationale (optional): Zod integrates TypeScript inference natively
tags (comma-separated): validation, dependencies

✓ (green) Decision captured → .decisions/packages/core/abc123.md
```

### Error Format

All errors follow: `(red ✗) (accent command): (muted message)`

```
✗ (red) decidex generate: (accent) API error 404 — model not found
  try: update to claude-haiku-4-5-20251001 (dim)

✗ (red) decidex scan: (accent) cannot read .decisions/path/to/file.md
  check file permissions (dim)
```

### Batch Progress Bar (ASCII)

When processing > 1 batch:
```
  batch 2/5 [══════>      ] (dim bracket, accent fill, dim remainder using space) 24%
```
- Use `═` for filled portion (`var(--accent)` / bold yellow)
- Use ` ` (space) for empty — no special character, keeps it clean
- `>` as the leading edge character (accent)
- Track width: 14 characters fixed
- Overwrite same line using `\r` — no vertical scroll during processing

### General Rules

- One blank line between logical sections (header → progress → results → summary)
- Horizontal rules: `─` × 39 characters, dim — only at start and end of command output
- No spinners (Ora, etc.) — they don't play well with piped output or CI logs
- No box-drawing decorations beyond `─` rules
- Silent mode: `--quiet` suppresses everything except errors and the final summary line
- JSON mode: `--json` emits newline-delimited JSON for programmatic consumption

---

## Landing Page Plan

### Tech Stack
Pure HTML + CSS + minimal JS. Zero build step. `index.html`, `styles.css`, ~50 lines of JS (copy button + nav scroll border). Deploy as static files.

### Font Hosting
Self-host JetBrains Mono + Instrument Sans from `/fonts/`. No Google Fonts CDN. Eliminates external network dependency and FOUC risk.

### Light Mode
Dark-only at launch. Light mode (`[data-theme="light"]`) deferred to follow-up.

### Page Structure

```
NAVIGATION (sticky top, 48px)
  Left:  "decidex" — JetBrains Mono 500, var(--accent)
  Right: GitHub [btn-ghost] | npm install [btn-primary]
  Border-bottom: 1px solid var(--border) on scroll (JS toggle)
  Mobile: hide GitHub link, keep install btn
  No blur, no glass effect.

SECTION 1 — HERO
  Primary:   "AI coding tools forget. decidex fixes that."
  Secondary: "decidex extracts engineering decisions from your git history
              and surfaces them in Claude Code, Cursor, Copilot, and Windsurf —
              so your AI tools know what you've already decided, and why."
  CTA:       Terminal Block — "npm install -g decidex" with copy button
  Sub-CTA:   "or npx decidex generate — no install needed"

SECTION 2 — HOW IT WORKS
  3-step ASCII pipeline in Terminal Block:
  "git log → Claude API → CLAUDE.md / Cursor rules / Copilot instructions"

SECTION 3 — DECISIONS IN ACTION
  Static Terminal Block showing real decidex generate output from this repo.
  (Run decidex on itself — use actual output, not fictional sample.)
  Followed by the CLAUDE.md section it produced.

SECTION 4 — FEATURE GRID (CSS grid, 3-col desktop / 2-col tablet / 1-col mobile)
  Hairline separators via 1px gap on var(--border) background.
  No icons. Monospace label + 8-word max description, engineer voice.

  Incremental        Only new commits classified. Fast after first run.
  Multi-tool         Cursor rules. Copilot instructions. Windsurf. One command.
  MCP server         Claude Code queries decisions for the file you're editing.
  Local mode         Ollama. No API key. Runs on your machine.
  Secret scanning    Pre-commit hook blocks accidental secrets in .decisions/.
  Manual capture     Decisions not in git: decidex capture "No Passport.js"

SECTION 5 — STATS DEMO (Stat Grid component)
  "23 decisions. 4 areas. 12 rejected approaches on record."
  Values from actual decidex run on this repo.

SECTION 6 — INSTALL (quickstart)
  4-step copyable Terminal Blocks (npm install, export key, decidex init, decidex generate)

FOOTER
  Left: "decidex" label + MIT license badge
  Right: GitHub link + npm version badge (live from registry, client-side fetch)
```

### Interaction States

| Element | Default | Hover | Active | Special |
|---------|---------|-------|--------|---------|
| nav install btn | amber bg | `var(--accent-2)` | pressed | — |
| nav github btn | ghost | bg tint | pressed | — |
| copy-to-clipboard | copy icon | highlight border | "Copied!" | resets 2s, label flip |
| terminal demo | static | — | — | no animation |
| footer version badge | static "v1.x.x" | — | — | live npm fetch, updates client-side |

**Copy button:** Label flips from command text → "Copied!" → reverts after 2000ms. Border color: `var(--border)` → `var(--accent)` for 2s duration.

### User Journey

| Step | User does | Should feel | Design delivers |
|------|-----------|-------------|-----------------|
| 1 | Lands | "Is this legit?" | JetBrains Mono + sharp type signals craft |
| 2 | Reads hero tagline | "That's my problem" | Direct, names the pain: AI tools forget |
| 3 | Sees install CTA | "I can try this NOW" | Copyable one-command terminal block |
| 4 | Scrolls to How It Works | "Oh, that's clever" | ASCII pipeline signals technical depth |
| 5 | Sees terminal demo | "I can picture this in my repo" | Real decidex output, not contrived |
| 6 | Reads feature grid | "It does more than I thought" | 6 terse features, no marketing fluff |
| 7 | Hits install section | "Alright, let's go" | 4-step quickstart, all copyable |

**5-second visceral:** Product name + one sharp tagline. No hero image. Terminal block owns the fold.
**5-min behavioral:** They run `npm install`. Quickstart works first try.
**Landing page is acquisition-only** — optimize for first-time convert. No logged-in state.

### Responsive Specs

| Breakpoint | Changes |
|------------|---------|
| ≥1100px | Full layout, centered |
| 768–1099px | Feature grid: 2-col. Stat grid: 3-col. |
| <768px | Feature grid: 1-col. Stat grid: 2-col. Nav: product name + install btn only. Terminal blocks: horizontal scroll. Section padding: 48px → 32px. |

### Accessibility

- All interactive elements: min 44×44px touch target
- `var(--text)` on `var(--bg)`: 14.3:1 contrast — passes AAA
- `var(--accent)` on `var(--bg)`: 4.8:1 — **AA large text only**. Do not use amber for body-size text. Labels, badges, and the product name only.
- Tab order follows visual order
- Copy button: `aria-label="Copy npm install command"`
- Terminal block: `role="region"` `aria-label="Terminal output"`
- `prefers-reduced-motion`: copy button skips transition (no label animation)
- `focus-visible`: browser default ring preserved — no `outline: none`

### Anti-Slop Rules

- No stock icons in feature grid — monospace label only
- No "powerful", "seamless", "cutting-edge" in copy
- No testimonials section unless real named engineers provided
- Hero sub-copy names specific tools: Claude Code, Cursor, Copilot, Windsurf
- Feature descriptions: max 8 words, engineer voice
- Terminal demo: real output from running decidex on this repo

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-20 | Initial design system created | /design-consultation based on competitive research of Cursor, Warp, Windsurf, Pieces. Differentiated via warm palette, monospace hero type, zero border-radius. |
| 2026-03-20 | JetBrains Mono as display font | Risk taken: all competitors use sans-serif heroes. Monospace signals terminal-native authenticity for a git/CLI tool. |
| 2026-03-20 | Amber accent (#D4953A) | Risk taken: competitors use cold blue-black palettes. Warm amber stands out and fits the "editorial archive" metaphor. |
| 2026-03-20 | Zero border-radius on structural elements | Risk taken: industry default is 8-16px rounded cards. Sharp edges signal no-nonsense tool, enforce the industrial aesthetic. |
| 2026-03-21 | Static terminal demo | Animated terminals read as AI-generated marketing. Static block with real output is more credible for developer audience. |
| 2026-03-21 | Self-host fonts | Eliminated Google Fonts CDN dependency to avoid FOUC and external request overhead. |
| 2026-03-21 | Pure HTML/CSS/JS, no framework | Zero build step for a static landing page. No auth, no dynamic routes — framework adds complexity with no value. |
| 2026-03-21 | Dark-only at launch | Light mode CSS variables defined in DESIGN.md but deferred to follow-up PR. Ship clean, expand later. |
| 2026-03-21 | Real decidex output in demo | Use actual `decidex generate` output from this repo. Engineers can smell fake demos — authenticity > narrative control. |
| 2026-03-22 | Light mode full spec | Warm-inverted palette. Terminal blocks stay dark in light mode — authentic terminal always has dark bg. Amber lightened to #B87028 for AA large contrast on cream bg. |
| 2026-03-22 | Progress bar is 4px flat track | No height, no border-radius, no gradient — matches the industrial aesthetic. `font-variant-numeric: tabular-nums` on all changing numeric values. |
| 2026-03-22 | Dashed border for empty states | Dashed vs solid border distinguishes "nothing here yet" from "content lives here." No background pattern, no illustration. |
| 2026-03-22 | CLI color palette via chalk/picocolors | Respect `NO_COLOR` and `FORCE_COLOR`. Amber = decision area labels and command names. Green = success. Never use blue in CLI output — not in the palette. |
| 2026-03-22 | ASCII progress bar, no spinner | `═` fill + space empty + `>` leading edge, 14 chars fixed width, overwrite line with `\r`. Spinners fail in CI and piped output. |
