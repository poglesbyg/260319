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
- Stat value: JetBrains Mono 32px weight 300 (light weight for large numerals)
- Stat label: body 12px, `var(--text-3)`

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-20 | Initial design system created | /design-consultation based on competitive research of Cursor, Warp, Windsurf, Pieces. Differentiated via warm palette, monospace hero type, zero border-radius. |
| 2026-03-20 | JetBrains Mono as display font | Risk taken: all competitors use sans-serif heroes. Monospace signals terminal-native authenticity for a git/CLI tool. |
| 2026-03-20 | Amber accent (#D4953A) | Risk taken: competitors use cold blue-black palettes. Warm amber stands out and fits the "editorial archive" metaphor. |
| 2026-03-20 | Zero border-radius on structural elements | Risk taken: industry default is 8-16px rounded cards. Sharp edges signal no-nonsense tool, enforce the industrial aesthetic. |
