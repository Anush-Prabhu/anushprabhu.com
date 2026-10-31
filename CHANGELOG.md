# Changelog

Versions follow [Semantic Versioning](https://semver.org). `0.x` releases are pre-launch milestones.

## v0.3.0 — 2026-10-31 · Milestone 3: phone and tablet

### Added
- **Phone workspace** (< 600 px wide or < 500 px tall): Linux-style status bar, full-screen pages with a back bar, home screen with search and an app grid, bottom dock (Home, Terminal, Search, Recent). Works without JavaScript except the three sheets.
- **Phone sheets** that load their code only when tapped: a terminal with commands and prompt pinned above the keyboard (the keyboard never opens by itself), full-screen search, and recently visited pages. The phone's Back button closes them.
- **Tablet mode** (600–1023 px wide, ≥ 500 px tall): the desktop without the shortcut rail, 44 px touch controls, windows open full-screen, no free dragging, two-up split: side by side in landscape, stacked top/bottom in portrait. Tapping maximise opens the layout menu, which also has Full screen.
- New "Top and bottom" snap layout, offered only on portrait screens.
- Resizing a desktop browser to phone width swaps to the phone layout and back without losing windows.
- `/site-data.json` for the phone sheets.
- Tests: 33 unit tests and 45 Playwright tests, including iPhone 13 and iPad Mini profiles, touch-target sizes, rotation and on-demand loading.

### Measured
- JS 28.3 KB gzip in total (budget 40 KB); a phone loads about 1.6 KB up front.
- Lighthouse: phone `/` and `/experience` 99 / 100 / 100 / 100; desktop `/` 100 / 100 / 100 / 100.

### Changed
- `resume` in the terminal now says plainly that the PDF is being prepared.
- Astro's dev toolbar is off (it covered the phone dock during development; it never ships).

## v0.2.0 — 2026-10-31 · Milestone 2: interactive desktop prototype

### Added
- Astro 7 + TypeScript (strict) workspace in `apps/web`, Preact islands, exact-pinned dependencies (each release at least two weeks old), self-hosted Red Hat fonts.
- Content collections built from the resume: experience, projects (one page each), skills, certifications, education, publication. No phone number; no email until one is chosen.
- Real pages for `/`, `/about`, `/experience`, `/projects`, `/projects/[slug]`, `/research`, `/skills`, `/contact` and a 404, readable without JavaScript.
- Desktop view on screens ≥ 1024 px: top panel, shortcut rail, windows (open, focus, move, minimise, maximise, restore, close), terminal + About snapped side by side by default.
- Windows 11-style Snap Layouts: hover, keyboard (`Alt+Z`, `↓` on the maximise button) or long-press; only layouts that fit are offered; suggested pairs; Snap Assist fills the remaining zones.
- Terminal with a fixed command registry (no shell), clickable commands that type themselves, history, Tab completion and a virtual filesystem.
- Ctrl+K launcher that searches apps and content.
- The URL follows the focused window; deep links and Back/Forward work. Plain view one click away.
- Tests: 29 unit tests (window manager, terminal, routing) and 29 Playwright browser tests. Budget check script.

### Measured
- JS 24.6 KB gzip (budget 40 KB); home page about 117 KB (budget 300 KB).
- Lighthouse on `/`: mobile 99 / 100 / 100 / 100, desktop 100 / 100 / 100 / 100 (performance / accessibility / best practices / SEO).

### Changed from the plan
- Window snapping shortcuts are `Alt+Shift+arrows`, not `Alt+arrows` (those are the browser's Back/Forward).
- ESLint not added yet: strict TypeScript + `astro check` + Prettier cover M2; revisit if the codebase grows.
- Layout availability follows the app's minimum size rather than fixed screen widths (e.g. four quarters appear at 1024×700 because each quarter still fits).

### Changed
- `CLAUDE.md` brought in line with the Milestone 1 decisions; four performance/security floors revised and approved (JS budget, forms, dark-only theme, allowed third-party origins).

## v0.1.0 — 2026-10-31 · Milestone 1: requirements and interface direction

### Added
- `docs/MILESTONE_1.md`: requirements review, architecture proposal, design system, desktop and mobile interaction models, Snap Layouts specification, URL architecture, outlines for Ask Anush, campaigns, consent/analytics and CRM/MCP, Milestone 2 plan.
- `design/`: static HTML mockups for three interface concepts (Xfce Refined, Tiling Console, Modern Workspace) and the approved hybrid, with a side-by-side comparison page.

### Decided
- Hybrid direction approved: A's desktop and windows, B's search launcher, C's phone layout; Red Hat type family; blue-slate surfaces with a steel-blue accent.
- Fingerprinting dropped; public resume PDF will omit the phone number; repository renamed to `anushprabhu.com`.
