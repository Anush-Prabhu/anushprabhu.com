# Changelog

Versions follow [Semantic Versioning](https://semver.org). `0.x` releases are pre-launch milestones.

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
