# anushprabhu.com

Portfolio and resume site for Anush Prabhu, built as a Kali/Xfce-inspired desktop on top of plain, fast HTML pages.

- Every page is real HTML at a real URL and works without JavaScript.
- **Desktop** (≥ 1024 px): windows, a terminal, a Ctrl+K launcher and Windows 11-style Snap Layouts.
- **Tablet** (600–1023 px wide): the same desktop with touch-sized controls; windows open full-screen or split two-up.
- **Phone**: pages become full-screen apps with a status bar, back bar and dock; terminal, search and recent pages open as sheets.

Plans and decisions: [`docs/MILESTONE_1.md`](docs/MILESTONE_1.md). Project rules: [`CLAUDE.md`](CLAUDE.md). History: [`CHANGELOG.md`](CHANGELOG.md).

## Run it

Requires Node 22.22 or newer.

```bash
npm install
npm run dev          # http://localhost:4322
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server with live reload |
| `npm run build` | Production build into `apps/web/dist` |
| `npm run preview` | Serve the production build on port 4323 |
| `npm run check` | Type-check (`astro check`, strict TypeScript) |
| `npm test` | Unit tests (window manager, terminal, routing) |
| `npm run e2e` | Browser tests against the production build (first run: `npx playwright install chromium` in `apps/web`) |
| `npm run budget -w apps/web` | Fails if shipped JS or home-page weight exceed the budgets (run after a build) |
| `npm run format` | Prettier |

## Using the desktop

Everything works with a mouse, a keyboard or touch.

| Keys | Action |
|---|---|
| `Ctrl+K` (`⌘K` on Mac) | Search apps and content |
| `` ` `` or `Ctrl+Alt+T` | Open or focus the terminal |
| `Alt+Z` | Snap Layouts for the focused window (or hover the maximise button, or focus it and press `↓`) |
| `Alt+Shift+←` / `→` | Snap the focused window to the left or right half |
| `Alt+Shift+↑` / `↓` | Maximise / restore (or minimise a floating window) |
| `` Alt+` `` | Cycle windows |
| `Alt+W` | Close the focused window |
| Arrow keys on a window title | Move the window |
| `Esc` | Close the open menu or search |

Alt+arrow keys alone are taken by the browser's Back/Forward, so window snapping uses Alt+Shift+arrow keys.

The session menu (power icon, top right) has **Switch to plain view**, which is remembered on this device.

## Layout

```
apps/web/                 Astro site (static output)
  src/content/            Resume content: experience, projects, skills, certifications, education, publications
  src/data/profile.ts     Name, headline, links (no phone number; email pending)
  src/pages/              One page per route
  src/components/content/ Page content, shared by plain pages and desktop windows
  src/components/desktop/ The desktop island (Preact): panel, windows, Snap Layouts, terminal, launcher
  src/lib/wm/             Window manager: state and geometry, no UI, unit-tested
  tests/                  Playwright browser tests
design/                   Milestone 1 mockups (not shipped)
docs/                     Plans and decisions
reference/                Old draft and unredacted resume (git-ignored, never published)
```
