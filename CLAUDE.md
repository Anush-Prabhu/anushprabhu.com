# Anush Prabhu — Portfolio

Personal portfolio and resume site for Anush Prabhu (security engineering, automation, applied AI),
to be served at **anushprabhu.com**.

> **Status: Milestone 3 released as v0.3.0** (2026-10-31): phone and tablet. v0.1.0 = M1 (plan in
> `docs/MILESTONE_1.md`, visual direction in `design/hybrid.html`), v0.2.0 = M2 desktop. Do not start Milestone 4 or
> deploy without the owner's go-ahead.
>
> Before claiming work is done: `npm run check`, `npm test`, `npm run build`, `npm run budget -w apps/web`, `npm run e2e`.

## Working rules

- Plan with the owner first; answering one question is not a go-ahead to build.
- Record a decision here (and remove it from *Open questions*) before acting on it.
- Never deploy, push, create or rename repos, change git remotes, or touch DNS/Heroku without explicit approval for
  that specific action.
- Keep it lightweight: every new dependency needs a reason that a few lines of code can't cover.
- Targets in this file are floors: meet them or do better, never trade them away silently.
- Never invent professional information. Content comes from the resume or from what the owner confirms.

## Decisions

| Topic | Decision |
|---|---|
| Framework | Astro (static output) + TypeScript (strict). |
| Interactive UI | Preact islands; window manager in plain, framework-free TypeScript. Not React. |
| Kali Linux theme | **Desktop by default, content underneath.** On desktop the home page opens the Kali-style desktop with the terminal and About windows snapped side by side. Every page is still a real HTML page that works without JavaScript; the desktop is layered on top. |
| Design direction | Hybrid approved 2026-10-31 (`design/hybrid.html`, `docs/MILESTONE_1.md` §4): A's Xfce desktop and windows, B's Ctrl+K search launcher, C's phone layout. Red Hat Display/Text/Mono. Blue-slate surfaces, accent `#5B8DEF`. Signature element: the name shown as the output of a large Kali `whoami` prompt. |
| Windows features | Only Windows 11 Snap Layouts (phased: menu + Snap Assist first; drag-to-snap, snap groups, resizing later). |
| Screen sizes (M3) | **Desktop** ≥ 1024 px: full window manager. **Tablet** 600–1023 px wide and ≥ 500 px tall: same desktop island without the shortcut rail; windows open full-screen, no free dragging, two-up split via Snap Layouts (side by side in landscape, stacked top/bottom in portrait); tapping maximise opens the layout menu. **Phone** (< 600 px wide, or < 500 px tall): no window manager. Pages become full-screen "apps" with a Linux status bar, back bar and bottom dock; the home page is an app grid. Terminal, search and recent apps open as full-screen sheets whose JavaScript loads only when tapped. |
| Existing React/Vite draft | **Port content, replace code.** Moved to `reference/vite-draft/` (git-ignored) at the start of M2; its `src/data/resume.js` is reference material only. |
| Resume PDF | Public version must **not** include the phone number (redacted copy made in Milestone 5). The unredacted original lives in `reference/vite-draft/public/` and must never be committed or published. |
| Repository | `github.com/Anush-Prabhu/anushprabhu.com` (renamed from `Anush-Prabhu.github.io`, so GitHub Pages never publishes it). Push as the `Anush-Prabhu` account per command: `GH_TOKEN=$(gh auth token --user Anush-Prabhu)`; the machine's default gh account is a different one. |
| Versioning | Semantic versions as annotated git tags, recorded in `CHANGELOG.md`. `0.x` = pre-launch milestones. v0.1.0 = Milestone 1. |
| Hosting | **Heroku** (student plan) for the static site and the API. Must stay portable; Cloudflare Pages + Workers is the fallback if the student plan isn't available. |
| Domain | `anushprabhu.com`, owned by Anush. |
| Pages | `/`, `/about`, `/experience`, `/projects`, `/projects/[slug]`, `/research`, `/skills`, `/contact`, `/privacy`, `/terms`, `/accessibility`, `/404`. Each opens as a desktop window with JS, and as a plain page without. |
| Public email | **Undecided** (see *Open questions*). Must be settled before Milestone 4. |
| Ask Anush (AI) | One shared backend for the terminal `ask` command and a chat window. Providers: Anthropic, Google, xAI behind one interface with fallback; keys server-side only. Full approved content in context (no vector DB). Not connected to a paid API until the owner reviews Milestone 6. |
| Leads / CRM | Contact form and chatbot hand-off create leads through a CRM adapter (email/webhook first, a CRM later). An MCP server on the API exposes leads and site data to AI tools. Designed in Milestone 1, built later. |
| Analytics | Privacy-friendly, cookieless; tool chosen later. No fingerprinting (Fingerprint.io dropped 2026-10-31). Must comply with US, UK, Canada and EU rules; honour Global Privacy Control. |
| Bot protection | Cloudflare Turnstile + rate limiting on the API. |
| Performance and security targets | Accepted as written below, "or better". Four floors were revised and approved on 2026-10-31 to fit the desktop-by-default spec: the JS budget, forms/`form-action`, dark-only theme for now, and the list of allowed third-party origins. |
| Featured projects | **Pending**: content decided during content integration. |

## Requirements

- Content: profile summary, experience, skills, certifications, projects, research, contact, downloadable resume PDF.
- Single source of truth for content (Astro content collections / typed data); every page, the terminal, campaign
  configs and the AI knowledge pack read from it.
- Works without JavaScript; accessible; fast; indexable by search engines and link previews.
- Usable by non-technical visitors (HR, PM hiring managers): clickable terminal commands, plain-language labels,
  single-click desktop shortcuts.

## Architecture (approved in Milestone 1 — details in `docs/MILESTONE_1.md` §2)

- npm workspaces: `apps/web` (Astro, static), `apps/api` (Hono service: health, chat, leads, MCP),
  `packages/shared` (types shared by web and api).
- Astro `output: 'static'`. Content pages render full HTML; the desktop island adopts the rendered content as its
  first window. URL is the source of truth for which window is open (back/forward works).
- Window manager (`apps/web/src/lib/wm`) is UI-free and unit-tested: state, layouts, snap geometry, clamping.
- Plain CSS with custom properties (design tokens); no CSS framework.
- Self-hosted, subset fonts, `font-display: swap` (the mockups use Google Fonts; production must not).

## Design constraints

- Use the `frontend-design` skill: a design plan (palette, type, layout, principles) is agreed before any UI code.
- Follow the approved hybrid. Avoid template habits: all-caps tracked labels, dot-joined meta strings, "→" on links,
  identical card grids, accenting one phrase in a headline.
- Responsive down to 320px; no horizontal scroll at 200% zoom.
- Visible keyboard focus everywhere; respect `prefers-reduced-motion`.
- Dark theme first. Colours are tokens so a light theme can be added later; until then the site is dark regardless
  of `prefers-color-scheme`.
- Motion only where it carries meaning; one orchestrated moment at most.
- Copy: plain, active voice, specific. **Sentence case** for headings and buttons (frontend-design). This overrides
  the Title Case rule in the `web-design-guidelines` checklist.

## Accessibility

- Target **WCAG 2.2 AA**.
- Semantic landmarks, one `h1` per page, logical heading order, skip link, `lang` set.
- Contrast ≥ 4.5:1 body text, ≥ 3:1 large text and UI components; touch targets ≥ 24×24 CSS px (44×44 on touch layouts).
- The desktop, Snap Layouts menu and terminal are fully keyboard-operable, never depend on hover alone, and never
  hold content unavailable on the plain pages.
- A plain, non-desktop view of every page is always one click away (and is what visitors get without JavaScript).

## Performance targets (accepted — floors)

Measured on the production build, mobile profile (Lighthouse, simulated slow 4G):

| Metric | Target |
|---|---|
| Lighthouse Performance / Accessibility / Best Practices / SEO | ≥ 95 each |
| LCP | < 2.0 s |
| CLS | < 0.05 |
| INP | < 200 ms |
| JS needed to render content | 0 KB: content is readable before any script runs |
| Desktop island JS (gzip) | ≤ 40 KB, loaded after content renders; not loaded on phone layouts until an app needs it |
| Total page weight, home (excluding resume PDF) | < 300 KB |

All images go through `astro:assets` with explicit `width`/`height` and modern formats.

## SEO and metadata

- `site: 'https://anushprabhu.com'`; unique `<title>` and meta description per page; canonical URLs.
- Campaign (`utm_*`) parameters never change the canonical URL or create indexable variants.
- Open Graph + Twitter card tags with a static OG image per page type.
- JSON-LD `Person` + `ProfilePage` on the home page; `ScholarlyArticle` and `SoftwareSourceCode` only where real
  content supports them. `sitemap.xml` (`@astrojs/sitemap`) and `robots.txt`.
- `www` and `*.herokuapp.com` redirect (301) to the apex domain.

## Security requirements (accepted — floors)

- No secrets in the repo; Heroku config vars (or the host's equivalent) for API keys.
- Response headers set by the serving layer:
  - `Content-Security-Policy`: `default-src 'self'`, no `unsafe-inline` scripts (hash if needed),
    `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`. Allowed extra origins, each added only when
    its feature ships: the API origin (if not same-origin), Cloudflare Turnstile, the chosen analytics tool.
  - `Strict-Transport-Security` (after HTTPS is confirmed on the domain), `X-Content-Type-Options: nosniff`,
    `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying unused features,
    `Cross-Origin-Opener-Policy: same-origin`.
- HTTPS only; redirect HTTP to HTTPS.
- No other third-party runtime requests (fonts, embeds) unless approved.
- Server-side input (contact form, chat) is validated, size-limited, rate-limited and Turnstile-checked. The
  terminal never executes anything outside its command registry; there is no real shell.
- Dependencies: exact versions in the lockfile, `npm audit` clean at high/critical, a release must be at least
  two weeks old before adopting it.

## Deployment strategy (Heroku, portable)

- Heroku Node.js buildpack: `npm ci && npm run build`; Node version pinned in `engines`.
- Web: serve `apps/web/dist` with a small zero-dependency Node server (`node:http`) that sets the security
  headers, long-cache immutable hashed assets, short-cache HTML, HTTPS/host redirects and the custom 404.
- API: Hono on `@hono/node-server`, deployable unchanged to Cloudflare Workers if hosting moves.
- Config only through env vars; no Heroku-specific APIs in code.
- Custom domain `anushprabhu.com` with Heroku ACM for TLS; DNS changes made by the owner.
- CI (GitHub Actions): `astro check`, type-check, unit tests, build, Playwright smoke tests, link and accessibility checks.
- No deploys until approved.

## Tooling for Claude

- **Skills** (project, `.claude/skills/`, tracked in `skills-lock.json`):
  - `frontend-design` (Anthropic): design direction.
  - `web-design-guidelines` (Vercel): UI review checklist. Its remote rules URL is **pinned to commit
    `434b7f9`** of `vercel-labs/web-interface-guidelines` (edited after install). `npx skills update` would undo
    the pin, so re-review before updating.
  - Reviewed and not installed: Astro (too thin to add value), `wcag-accessibility-audit` (generic checklist,
    covered by this file), `seo-meta` (no such skill in `jezweb/claude-skills`).
- **MCP** (`.mcp.json`, versions pinned):
  - `git`: `mcp-server-git==2026.8.18` via `uvx`, scoped to this repo.
  - `playwright`: `@playwright/mcp@0.0.83` for browser interaction and testing of the local build.
- **Preview:** `.claude/launch.json` → `design-mockups` serves `design/` on port 4321.

## Open questions

1. **Public email:** `anushprabhu4@gmail.com` (on the resume), `anushprabhu1@gmail.com`, or a domain address
   such as `hello@anushprabhu.com`. Needed before Milestone 4.
2. **Featured projects:** which ones, with what detail (write-ups, screenshots, repo links)?
3. **Analytics tool:** GoatCounter, Plausible, Cloudflare Web Analytics or another cookieless option.
4. **Heroku student plan:** confirm availability; otherwise switch to the Cloudflare fallback.
5. **Ask Anush defaults:** primary model, fallback order and monthly budget (Milestone 6).
6. **Product/PM content:** material for a `product` campaign (Prabhu Tech clients, decisions, outcomes).
