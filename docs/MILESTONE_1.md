# Milestone 1 — Requirements, Architecture and Interface Concepts

Status: **draft for review** · Date: 2026-10-31 · Owner: Anush Prabhu

This document answers section 28 of the master build prompt. Nothing here is built yet except three static design mockups in `design/`. Once you approve a direction, the agreed parts get split into the long-lived docs (`ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `WINDOW_MANAGER.md`, …) and Milestone 2 starts.

---

## 0. Decisions already made

| # | Decision | Notes |
|---|---|---|
| D1 | Astro + TypeScript, static output | Every page is real HTML at a real URL. |
| D2 | Preact islands for the desktop; window manager in plain TypeScript | Window logic is framework-free and unit-testable; Preact (~4 KB) renders it. |
| D3 | Hosting: Heroku (student plan), portable; Cloudflare as fallback | Site = static files. API = separate Hono service. Neither depends on Heroku APIs. |
| D4 | Domain `anushprabhu.com` | Canonical URLs, sitemap and OG tags use it from day one. |
| D5 | Only Windows feature: Windows 11 Snap Layouts | Restyled in our Linux visual language. Phased (see §7). |
| D6 | Design exploration in HTML mockups, not Figma | One medium, no duplicate work. |
| D7 | Real conversational chatbot ("Ask Anush"), shared by terminal `ask` and chat window | Full-context grounding, not a vector DB (see §10). |
| D8 | Chatbot providers: Anthropic, Google, xAI | Provider abstraction, server-side keys, fallback chain. |
| D9 | Lead pipeline with CRM adapter + MCP server, designed now, built later | See §11. |
| D10 | Analytics: necessary-only for v1, built to US/UK/Canada/EU rules | Consent framework exists but stays dormant until something needs it. |

---

## 1. Requirements review

### 1.1 Contradictions found and how they are resolved

| Spec says | Conflicts with | Resolution |
|---|---|---|
| Heroku hosting (§23) | "Don't add a server just because Heroku is the target" (§23), performance targets (§18) | Static site served by a tiny static server on Heroku, API as its own service. Both portable (§2.6). If the student plan isn't available, site → Cloudflare Pages, API → Cloudflare Worker, no code changes. |
| Four consent categories incl. Marketing (§14) | "No placeholder functionality disguised as working features" (rule 10) | v1 has no marketing trackers, so no Marketing toggle. The consent model supports adding it when a real tool needs it (e.g. CRM tracking). |
| GA4 initially (§15) | Necessary-only analytics (D10), no-banner goal for HR visitors | v1 uses cookieless analytics (Cloudflare Web Analytics or Plausible — pick in M7). GA4 stays an adapter option behind consent. |
| "Use FingerprintJS" (your message) | Spec §15 "no FingerprintJS by default", EU ePrivacy / UK PECR (fingerprinting needs opt-in consent) | Not included. Bot/abuse protection via Cloudflare Turnstile + rate limiting. **Open question Q1.** |
| Windows 11 Snap Layouts | "Original Linux visual identity", "avoid copying branding" | Copy the *behaviour*, not the look: Linux-style surfaces, our icons, our radii. |
| "Core content usable without JavaScript" (§27) | Desktop windows are JS | Each route renders its content as static HTML inside a window-shaped frame. JS upgrades the page into the desktop. Without JS you still get a readable, styled page (§9). |
| Workspaces removed (§5) | Earlier Kali sketch had workspaces | Removed. |
| Network indicator (§5) "don't simulate connectivity" | Decorative tray icon | Indicator shows **Ask Anush service status** (online / degraded / offline, from a real `/api/health` call). Before M6 it is hidden. |

### 1.2 Missing dependencies (need input or materials)

1. **Product/PM content.** The resume is security-heavy. A `product` campaign needs real product material (Prabhu Tech clients, decisions, outcomes). Without it, that campaign can only re-order existing content.
2. **Research content.** One publication (ISBN 978-981-99-3878-0) plus project work. Not enough for a standalone `/research` page yet — see §1.3.
3. **Project details.** Problem, architecture, results and screenshots per project. The resume only has one line each. APTrustv2 is a private repo, so its page cannot link to code.
4. **Resume PDF.** Contains your phone number. Need a web version without it (Q2).
5. **Email.** Resume says `anushprabhu4@gmail.com`; git/account email is `anushprabhu1@gmail.com` (Q3).
6. **Heroku student plan** confirmation (decides D3).
7. **Chatbot model defaults and monthly budget** (decided in M6, not now).

### 1.3 Unnecessary complexity (trimmed or deferred)

| Item | Recommendation |
|---|---|
| `/research` as its own route on day one | Keep the route (spec wants it) but render it as "Publication + research-oriented projects" until there is more. No empty sub-sections for "submitted/preprint". |
| 12 documentation files | Create each only when its milestone starts. M1 = this file. M2 adds `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `WINDOW_MANAGER.md`. |
| Snap Groups, drag-to-snap, free resize in M2 | Deferred to after the basic window manager is stable (§7.7). |
| Remembering window layouts across visits | Don't restore layouts. Remember only theme + "dismissed welcome". Always start from the clean default arrangement. |
| Vector database for AI | Not needed (§10). |
| Playwright MCP *and* Playwright tests | Keep Playwright tests (they run in CI). The Playwright MCP in `.mcp.json` (pinned to `0.0.83`) is for exploratory testing only. |

### 1.4 Architectural improvements

1. **One content source for everything.** Pages, terminal output, campaign configs and the AI knowledge pack all read from Astro content collections. Nothing is written twice.
2. **The window manager owns geometry only.** It doesn't know about pages. Apps register themselves (`id`, title, icon, min size, route). This keeps snapping testable in isolation.
3. **URL is the source of truth for "what's open".** Opening Experience pushes `/experience`; Back closes or returns. Deep links, sharing and SEO all work the same way.
4. **API is one service with modules** (`chat`, `leads`, `health`, `mcp`) rather than separate servers. One deploy, one set of secrets, can split later if needed.

---

## 2. Architecture

### 2.1 Overview

```
                       anushprabhu.com
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
  Static site (Astro build)                 API service (Hono, Node)
  /, /about, /experience,                    /api/health
  /projects/[slug], /research,               /api/chat      (stream)
  /skills, /contact, /privacy …              /api/leads     (contact form + chatbot handoff)
        │                                    /mcp           (MCP server, auth required)
        │ islands (load on demand)                 │
        ├─ desktop shell  (Preact)                 ├─ providers: anthropic | google | xai
        ├─ window manager (plain TS)               ├─ knowledge pack (built from site content)
        ├─ terminal       (Preact)                 ├─ CRM adapter: email | webhook | hubspot | …
        ├─ chat window    (Preact)                 └─ rate limit, budget, Turnstile check
        └─ analytics/consent (plain TS)
```

### 2.2 Repository layout (adjusted from the spec)

```
anushprabhu.com/
├── apps/
│   ├── web/                     # Astro site (static)
│   │   ├── public/              # fonts, icons, og images, resume (redacted)
│   │   └── src/
│   │       ├── content/         # collections: experience, projects, research, certs, education
│   │       ├── data/            # campaigns/, commands/, navigation/ (typed TS)
│   │       ├── components/
│   │       │   ├── desktop/     # panel, launcher, shortcuts, snap menu
│   │       │   ├── windows/     # window chrome, app frames
│   │       │   ├── terminal/
│   │       │   ├── chat/
│   │       │   ├── portfolio/   # page sections used by both static pages and windows
│   │       │   └── consent/
│   │       ├── lib/
│   │       │   ├── wm/          # window manager: state, reducer, layouts, snap maths (no UI)
│   │       │   ├── campaigns/   # resolver + validation
│   │       │   ├── analytics/   # typed events + adapters
│   │       │   └── api/         # typed client for the API
│   │       ├── layouts/
│   │       ├── pages/
│   │       └── styles/          # tokens.css, themes/, base.css
│   └── api/                     # Hono service
│       └── src/
│           ├── routes/          # health, chat, leads, mcp
│           ├── providers/       # anthropic.ts, google.ts, xai.ts, index.ts (interface)
│           ├── knowledge/       # loads the knowledge pack built from apps/web content
│           ├── crm/             # adapter interface + email/webhook implementations
│           └── guard/           # rate limit, budget, input validation, turnstile
├── packages/
│   └── shared/                  # types shared by web + api (content schema, API contracts)
├── tests/                       # Playwright e2e
├── docs/
├── design/                      # Milestone 1 mockups (not shipped)
├── CLAUDE.md
└── README.md
```

Why a small monorepo instead of the spec's single `src/`: the API is a different runtime with secrets, and keeping it in `apps/api` stops server code from ever being bundled into the browser. `packages/shared` keeps the chat and lead contracts identical on both sides. Tooling stays plain npm workspaces — no Turborepo/Nx.

### 2.3 Hosting portability

| Piece | Heroku (primary) | Cloudflare (fallback) | Anything else |
|---|---|---|---|
| Static site | `apps/web/dist` served by a ~20-line static server with security headers | Cloudflare Pages, `_headers` file | Netlify, Vercel, GitHub Pages, any CDN |
| API | Hono on Node (`@hono/node-server`) | Same Hono app on Workers | Vercel/Netlify functions, Fly.io, a VPS |
| Secrets | Heroku config vars | Worker secrets | env vars |
| Domain + TLS | Heroku ACM + DNS | Cloudflare DNS | provider TLS |

Rules that keep it portable: no Heroku add-on APIs in code, config only through env vars, security headers defined once in a shared file and emitted per host, rate-limit store behind an interface (in-memory → Redis/KV).

---

## 3. Figma or browser prototype

**Browser prototype.** Reasons:

- The things to validate are behaviours — snapping, focus, terminal input, how a phone keyboard interacts with the terminal. Figma can't test any of them.
- Everything in Figma would be redrawn in code anyway.
- I can't operate Figma from here; you'd be reviewing my description of a design, not the design.

Trade-off accepted: static HTML mockups are slower to sketch than Figma frames for wild variations. That's why M1 uses **static mockups with almost no JS** (cheap, three concepts), and only the chosen one becomes an interactive prototype in M2.

---

## 4. Three interface concepts

Open `design/index.html` (served locally — see the note at the end) to see all three at 1440, 768 and 390 px side by side. All text and accent colours in the three concepts were checked against WCAG AA (lowest: 4.8:1 for hint text). Each concept has a small "mockup states" bar to toggle the launcher, Snap Layouts menu and mobile app switcher.

### Concept A — "Xfce Refined"
The most recognisably Linux. A thin top panel, a few desktop shortcuts on the left, floating windows with thin borders and small radii. Terminal and profile open side by side in a 60/40 snap. Launcher is a classic Xfce-style menu dropping from the panel.

- Accent: steel blue `#5B8DEF`. Type: IBM Plex Sans + JetBrains Mono.
- Feels like: a well-kept Kali desktop.
- Risk: closest to "fake OS"; relies on polish to look premium.

### Concept B — "Tiling Console"
Inspired by tiling window managers (i3/Sway) used on many Kali setups. No floating chaos: windows tile with even gaps from the start. A slim status bar on top. The launcher is a centred command palette (like `rofi`) that also accepts commands. Profile text is set in a serif for reading comfort against monospaced chrome.

- Accent: sage `#7FB8A4`. Type: IBM Plex Mono + Source Serif 4.
- Feels like: a power-user setup; very readable.
- Risk: tiling looks less "desktop" to non-technical visitors; snapping feels native here, floating feels foreign.

### Concept C — "Modern Workspace"
A contemporary Linux desktop (GNOME-like): floating rounded panel, larger radii, a full-screen app grid as the launcher. The terminal is a **drop-down (Quake-style) console** that slides from the top panel, so the profile window gets the stage and the terminal is one key (`` ` ``) away.

- Accent: muted violet `#9D8CFF`. Type: Manrope + Fira Code.
- Feels like: a modern product; friendliest to HR.
- Risk: least "Kali"; the drop-down terminal is less visible by default.

### Chosen direction: the hybrid (`design/hybrid.html`)
**A's desktop and windows + B's command-palette launcher + C's mobile model**, chosen 2026-10-31.

What changed from the concepts while combining them:

- **Type:** Red Hat Display (name, headings), Red Hat Text (body, UI), Red Hat Mono (terminal, prompt). One family designed for a Linux company, which fits the subject better than IBM Plex and keeps the three roles visibly related.
- **Colour:** surfaces moved from neutral near-black to blue-slate (`#0F1620` desktop, `#151C26` windows, `#1B2330` chrome), as the spec asks for slate and dark-blue surfaces. Accent stays steel blue `#5B8DEF`; Kali red `#E5675F` is reserved for "root"-style highlights (e.g. `resume.pdf`).
- **The one bold element:** in the About window the name is the output of a Kali `whoami` prompt, with the `┌──(` / `└─$` frame drawn large in the accent colour. Everything else stays quiet.
- **Removed template habits:** all-caps tracked section labels → sentence case ("What I work on", "Recent work"); dot-joined role line → a sentence; "→" on links → removed; identical highlight cards → a plain list.
- **Terminal default content:** a plain-language welcome, clickable command chips, `ls` and `experience --brief`. `whoami` moved to the About window so it isn't shown twice.
- **Launcher:** empty state lists apps and actions; typing searches content ("kerb" → Bank of America, Skills) and offers "Ask Anush about …".

Contrast (computed): body text 14.6:1, secondary 8.2:1, hint text 5.0–6.0:1, accent 5.3:1, dark text on accent buttons 5.6:1. Secondary-button borders are 1.9:1. WCAG doesn't require 3:1 there because each button's label identifies it, but focus rings (5.6:1) carry the keyboard state.

Checked at 1440, 1024, 768, 390 and 320 px with no horizontal overflow. At 1024 px the terminal's `experience --brief` table switches to two columns so roles wrap under each company.

**Approved by Anush on 2026-10-31.**

---

## 5. Design system proposal

Tokens are CSS custom properties in `styles/tokens.css`; themes override only colour tokens under `[data-theme="…"]`.

### 5.1 Colour (dark theme, concept-A values)

| Token | Value | Use |
|---|---|---|
| `--bg-desktop` | `#0E1116` | Desktop background base |
| `--surface-1` | `#151A21` | Window body |
| `--surface-2` | `#1B212A` | Title bars, panel |
| `--surface-3` | `#232B36` | Hover, inputs |
| `--border` | `#2A3340` | 1 px window and control borders |
| `--border-strong` | `#3A4656` | Focused window border |
| `--text-1` | `#E6EAF0` | Primary text (14.5:1 on surface-1) |
| `--text-2` | `#A9B3C1` | Secondary text (8.2:1) |
| `--text-3` | `#7D8796` | Hints, metadata (4.8:1, meets AA for body text) |
| `--accent` | `#5B8DEF` | Links, focus, active indicators (5.4:1; dark text on accent buttons 6.0:1) |
| `--accent-weak` | `rgb(91 141 239 / 0.16)` | Selected backgrounds, snap previews |
| `--ok` / `--warn` / `--err` | `#5FB87A` / `#D9A13B` / `#E5675F` | Status only, never decoration |
| `--term-bg` | `#0B0E13` | Terminal background |

### 5.2 Typography

| Step | Size / line height | Use |
|---|---|---|
| `--fs-xs` | 12 / 16 | Panel, metadata |
| `--fs-sm` | 13 / 20 | UI controls, terminal |
| `--fs-md` | 15 / 24 | Body text |
| `--fs-lg` | 18 / 26 | Window section headings |
| `--fs-xl` | 24 / 30 | Profile role line |
| `--fs-2xl` | 34 / 40 | Name on profile window |

Two families max per concept (UI sans + mono). Fonts self-hosted in M2 (no Google Fonts request in production — privacy and performance), `font-display: swap`, subset to Latin.

### 5.3 Spacing, radius, elevation, motion

- Spacing: 4-based scale — 4, 8, 12, 16, 24, 32, 48.
- Radii: `--r-sm 4px` (controls), `--r-md 8px` (windows, A), concept C uses 12 px.
- Shadows: one window shadow `0 12px 32px rgb(0 0 0 / .45)`, focused window adds a 1 px `--border-strong`. No glows.
- Motion: `--dur-fast 120ms`, `--dur-base 180ms`, `--ease cubic-bezier(.2,.8,.2,1)`. Only opacity/transform. `prefers-reduced-motion` → all durations 0.
- Snap gap: 8 px between windows and from screen edges.

### 5.4 Icons
Original line icons, 1.75 px stroke on a 24 px grid, rounded joins, single colour (`currentColor`). App icons get a 2-tone tile (surface + accent glyph). No Kali dragon, no OffSec marks, no Microsoft glyphs.

### 5.5 Breakpoints

| Name | Width | Model |
|---|---|---|
| `phone` | < 600 px | Mobile workspace (full-screen apps) |
| `tablet` | 600–1023 px | Simplified desktop: max two windows, snap halves only |
| `desktop` | ≥ 1024 px | Full window manager + Snap Layouts |
| `wide` | ≥ 1440 px | Same, more layouts become feasible (thirds) |

### 5.6 Accessibility rules
WCAG 2.2 AA: 4.5:1 text contrast, 3:1 for UI boundaries and focus rings; 2 px accent focus ring with 2 px offset on everything focusable; 24×24 px minimum targets (44×44 on touch); no hover-only actions; visible labels on icon buttons via `aria-label` + tooltip.

---

## 6. Desktop interaction model

### 6.1 Default arrangement (first visit, ≥ 1024 px)
- Terminal snapped **left 50 %** (or 60 % on ≥ 1440 px), profile window snapped **right**.
- The terminal shows a two-line welcome and clickable command chips (`whoami`, `experience`, `projects`, `contact`, `resume`). Clicking a chip types the command, so non-technical visitors never need the keyboard.
- One-time welcome toast: "This site works like a Linux desktop. Click a button, or press Ctrl+K to search." Dismissal is remembered.

### 6.2 Top panel
Left: launcher button · Terminal shortcut · open-window buttons (focus/minimise toggles).
Right: Ask Anush status (from M6) · GitHub · LinkedIn · local clock (visitor's time zone, `Intl.DateTimeFormat`) · session menu (Resume, Theme, Privacy settings, Reset desktop).

### 6.3 Desktop shortcuts
About · Experience · Projects · Research · Skills & Certifications · Contact · Resume · Terminal. **Single click opens** (better for non-Linux users); keyboard Enter opens; arrow keys move between shortcuts.

### 6.4 Launcher
Opened by the panel button, `Ctrl+K` or the Super key where the browser allows it. Search box + app list + quick actions (Download resume, Email, Ask Anush). Typing filters apps *and* matches content ("kerberos" → Bank of America experience).

### 6.5 Keyboard map

| Keys | Action |
|---|---|
| `Ctrl+K` | Open launcher |
| `` ` `` / `Ctrl+Alt+T` | Focus or open terminal |
| `Alt+Tab` is reserved by the OS → `Alt+`` ` | Cycle windows |
| `Super/Meta+Z` → `Alt+Z` | Open Snap Layouts for focused window |
| `Alt+←/→/↑/↓` | Snap left / right / maximise / restore |
| `Esc` | Close menu or popup, never a window |
| `Ctrl+W` is reserved by the browser → `Alt+W` | Close focused window |

---

## 7. Snap Layouts specification

### 7.1 Window state model

```ts
type WindowMode = 'floating' | 'maximized' | 'snapped' | 'minimized'

interface WindowState {
  id: AppId
  mode: WindowMode
  bounds: Rect            // current on-screen rectangle
  restoreBounds: Rect     // last floating rectangle, used by Restore
  snap?: { layout: LayoutId; zone: number; groupId?: string }
  prevMode?: WindowMode   // so un-minimise returns to snapped/maximised correctly
  z: number
}
// "Focused" and "closed" are not modes: focus = top z among non-minimised;
// closed = removed from the map (restoreBounds kept in a small LRU for reopen).
```

Transitions: floating ⇄ maximised ⇄ snapped, any → minimised → prevMode. Every transition stores `restoreBounds` only when leaving `floating`.

### 7.2 Layouts (from your reference screenshot)

| Id | Zones (fractions of work area) | Min work-area width |
|---|---|---|
| `halves` | 1/2 · 1/2 | 1024 |
| `two-thirds` | 2/3 · 1/3 | 1024 |
| `main-stack` | 1/2 · (1/2 top, 1/2 bottom) | 1024, height ≥ 700 |
| `quadrants` | 4 × 1/4 | 1280, height ≥ 760 |
| `thirds` | 1/3 · 1/3 · 1/3 | 1440 |
| `suggested-*` | A layout pre-filled with app icons (Terminal + About, Projects + Ask Anush, Resume + Contact) | as its base layout |

**Feasibility rule:** a layout is shown only if every zone ≥ the minimum size of the apps that could go there (default min 360 × 280; terminal 420 × 260). Computed from the live viewport, so resizing the browser hides/shows layouts.

### 7.3 Opening the menu
- **Hover** the maximise button for 400 ms (pointer devices only), or
- **Focus** the maximise button and press `↓` / `Alt+Z`, or
- **Long-press** on touch tablets.

The menu is a `role="dialog"` popover anchored below the button. Layouts are a grid of buttons; each zone inside a layout is its own button (`aria-label="Halves layout, left zone"`). Arrow keys move between zones, Enter picks, Esc closes and returns focus to the maximise button.

### 7.4 Choosing a zone
1. The focused window moves to that zone (animated transform, 180 ms; instant with reduced motion).
2. **Snap Assist:** each empty zone shows a picker of the other open windows (thumbnails = title + icon), plus "Open app…" if fewer windows are open than zones.
3. Picking fills the zone; Esc or clicking the desktop leaves remaining zones empty.
4. Windows in the same arrangement get a shared `groupId` (used later for Snap Groups).

### 7.5 Safety rules
- A window can never end up with its title bar outside the work area. On viewport resize, snapped windows recompute from fractions; floating windows are clamped.
- Content inside a snapped window must stay usable — if a zone gets smaller than an app's minimum (e.g. after resize), that window falls back to floating at its restore size.
- Restore (double-click title bar or the maximise button while snapped) returns to `restoreBounds`.

### 7.6 Tablet and phone
- Tablet (600–1023): only `halves`, offered as two buttons in the window menu. No hover.
- Phone: no Snap Layouts. Windows are full-screen apps (§8).

### 7.7 Later phases
1. Drag-to-snap: edge → half, top → maximise, corner → quarter, with a translucent preview. (After M2.)
2. Snap Groups: hovering a panel button for a grouped window shows the group; clicking restores the whole arrangement.
3. Free resizing with a drag handle, then shared-edge resizing for snapped neighbours.

---

## 8. Tablet and mobile model

**Phone (< 600 px), "Linux mobile workspace":**
- Compact status bar: launcher button, current app title, clock.
- Home screen = app grid (the same apps as the desktop shortcuts) with Linux-style tiles; Terminal and Ask Anush pinned to a bottom dock.
- Apps open full-screen with a slim title bar (back arrow + title + app-switcher button).
- App switcher = horizontal cards of open apps (swipe or tap).
- Browser Back works because every app is a route.
- Terminal: command chips sit above the input so the software keyboard isn't required; input uses `inputmode="text"`, `autocapitalize="off"`, and the output area resizes with `visualViewport` so the keyboard never covers the prompt.

**Tablet (600–1023 px):** desktop shell with at most two visible windows; landscape defaults to Terminal | Profile halves, portrait stacks them (profile on top, terminal docked bottom 40 %).

---

## 9. URLs and no-JS behaviour

| Route | Static HTML | Desktop behaviour |
|---|---|---|
| `/` | Profile intro + featured work + links | Default arrangement (terminal + profile) |
| `/about`, `/experience`, `/projects`, `/research`, `/skills`, `/contact` | Full content inside a window-styled frame | Desktop loads with that app focused (and the terminal behind it) |
| `/projects/[slug]` | Full case study | Opens in the Projects window |
| `/privacy`, `/terms`, `/accessibility`, `/404` | Plain document layout | Same, inside a window |

How it works: each page is a normal Astro page. Its content component (e.g. `<ExperienceContent/>`) is rendered once in HTML. When the desktop island boots, it adopts that rendered content as the first window instead of fetching it again. Opening another app pushes its URL and fetches only that page's content fragment (pre-rendered at build time as `/_fragments/experience.html`). Back/forward re-sync windows to the URL.

SEO: one canonical per route; campaign parameters never change the canonical; `sitemap.xml` lists routes only; structured data `Person` + `ProfilePage` on `/`, `ScholarlyArticle` for the publication, `SoftwareSourceCode` on project pages with public repos.

---

## 10. Ask Anush — shared AI backend (outline only)

```
terminal: ask <question>  ─┐
                           ├─► POST /api/chat  { conversationId, messages[], surface: 'terminal'|'chat' }
chat window               ─┘          │
                                      ▼
                         guard: size limit, Turnstile token, rate limit (per IP + global), daily budget
                                      ▼
                         knowledge pack (JSON built at site build from content collections)
                                      ▼
                         prompt builder: system rules + full knowledge pack (cached) + conversation
                                      ▼
                         provider router: primary → fallback → fallback
                           AnthropicProvider | GoogleProvider | XaiProvider  (one interface)
                                      ▼
                         stream back: text + citations [{title, url}] (only URLs from the pack)
```

- **Grounding without a vector DB:** the knowledge pack is small (estimated < 30k tokens), so it goes into every request with provider-side prompt caching. Better recall than retrieval and simpler. Revisit if content passes ~100k tokens.
- **Provider interface:** `generate({ system, messages, maxTokens, signal }): AsyncIterable<Chunk>`. Each adapter maps to its SDK. Model ids and order come from env (`AI_PROVIDERS=anthropic,google,xai`).
- **Safety:** answers limited to the pack; private info (phone, address) excluded from the pack at build time; links validated against a route allow-list; no tool can run commands; injection attempts get a refusal + normal answer.
- **Cost controls:** per-request token cap, per-IP rate limit, global daily spend cap with a graceful "Ask Anush is resting" message.
- **Lead handoff:** if a visitor asks to get in touch, the bot offers a short form (name, email, message, consent checkbox) → `/api/leads`. The bot never collects data silently.

Not connected to any paid API until you review M6.

---

## 11. Campaigns, consent, analytics, CRM and MCP (outline)

### 11.1 Campaigns
- Typed configs in `src/data/campaigns/*.ts`: `{ id, match: { utm_campaign?: string[], utm_source?: string[] }, headline, summary, featuredProjects: Slug[], featuredExperience: Id[], primaryCta, terminalChips, askSuggestions, layout? }`.
- References are by **id/slug only** and validated at build time against the content collections — a campaign cannot introduce new facts.
- Resolver runs client-side on `/`: reads `utm_*`, whitelists characters, matches a config, falls back to `general`. Static HTML always contains the general intro (what crawlers see); canonical stays `https://anushprabhu.com/`.
- Planned starting campaigns: `general`, `security`, `product` (needs your content), `research`.

### 11.2 Consent and analytics
- v1: **cookieless analytics** only (no identifiers, no cross-site tracking) → no consent banner required for it; a "Privacy settings" panel is always reachable from the session menu and `/privacy`.
- `localStorage` holds only: theme, welcome-dismissed flag. Both are user-requested functional storage.
- Respect **Global Privacy Control** and **Do Not Track** as opt-out signals (US state laws, e.g. CPRA, treat GPC as a valid opt-out).
- The consent store (`necessary | functional | analytics | marketing`) exists in code from M7 so that when a CRM pixel or GA4 is added later, it is gated properly: EU/UK opt-in, Canada express consent for tracking, US opt-out + GPC.
- Typed events: `page_view`, `resume_download`, `contact_click`, `outbound_click{target}`, `terminal_open`, `terminal_command{name}` (command name only, never arguments), `chat_open`, `chat_message` (count only, never content), `campaign_landing{campaign}`.

### 11.3 CRM adapter and MCP server
- `CrmAdapter` interface: `createLead(lead)`, `updateLead(id, patch)`, `listLeads(filter)`. v1 implementation: **email + webhook** (works with Zapier/Make/n8n and most CRMs). Later: HubSpot, Zoho, Salesforce, Pipedrive adapters — chosen by env var.
- Lead sources: contact form, Ask Anush handoff. Each lead stores campaign (`utm_*`), source surface, consent timestamp and the privacy-policy version shown.
- **MCP server** at `/mcp` (Streamable HTTP transport, bearer-token auth, read-mostly): tools `list_leads`, `get_lead`, `update_lead_status`, `site_stats` (aggregate), `get_content` (portfolio content). Lets Claude or another agent work with your leads and site data. Write tools require an explicit scope.
- Retention: leads kept in the CRM, not on the API; API logs drop message bodies after 30 days.

---

## 12. Milestone plans

### Milestone 1 (this document) — remaining steps
1. You review this doc and the three mockups.
2. We agree the hybrid: concept parts, accent colour, fonts, launcher style, mobile model.
3. Answer open questions Q1–Q5.
4. I update this doc to "approved", split it into `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `WINDOW_MANAGER.md`, and commit as `v0.1.0`.

**M1 acceptance criteria**
- [x] Hybrid direction chosen and written down.
- [ ] Design tokens agreed (colour, type, radius, motion).
- [ ] Snap Layouts behaviour (§7) agreed, including which layouts ship in M2.
- [ ] Mobile model (§8) agreed.
- [ ] Hosting, analytics and AI provider decisions confirmed.
- [x] Open questions answered or explicitly deferred.

### Milestone 2 — Interactive desktop prototype
Scope: desktop ≥ 1024 px only (tablet/phone are M3). Placeholder-quality content from the resume.

1. Astro + TS project, npm workspaces, ESLint/Prettier, Vitest, Playwright, self-hosted fonts, tokens.
2. `lib/wm`: state, reducer, layout geometry, feasibility, clamping — **unit-tested before any UI**.
3. Desktop shell: panel, shortcuts, launcher (Ctrl+K), clock, session menu.
4. Window chrome: open, close, minimise, maximise, restore, focus, move (drag title bar), keyboard moves.
5. Snap Layouts: menu (hover/keyboard/touch), `halves`, `two-thirds`, `main-stack`, `quadrants` (when feasible), Snap Assist.
6. Terminal: command registry, `help whoami ls pwd cd cat experience projects skills certifications resume contact clear history theme`, chips, history, completion, `aria-live` output. `ask` prints "coming soon" (honest stub).
7. Profile window with resume-based placeholder content.
8. Routes `/`, `/about`, `/experience`, `/projects` with URL ↔ window sync.
9. Tests: wm unit tests; Playwright for open/close/focus, snap via keyboard, deep link, back button, terminal commands.

**M2 acceptance criteria**
- [ ] Default arrangement shows terminal + profile readable at 1024, 1280, 1440, 1920 px without manual rearranging.
- [ ] Every window action works by mouse **and** keyboard.
- [ ] Snap Layouts menu opens by hover, keyboard and long-press; only feasible layouts appear.
- [ ] Snap Assist fills remaining zones from open windows.
- [ ] No window can be lost off-screen (tested by resizing the browser to 1024 px with windows at the edges).
- [ ] `/experience` loaded directly shows the content with JS disabled and opens the Experience window with JS enabled.
- [ ] Back/forward closes/reopens windows consistently.
- [ ] Desktop island JS < 40 KB gzipped; Lighthouse performance ≥ 95 on `/`.
- [ ] Terminal never executes anything outside the registry (tested with `rm -rf /`, `;`, `$(…)`, HTML injection).

---

## 13. Open questions

| # | Question | Answer (2026-10-31) |
|---|---|---|
| Q1 | Fingerprint.io? | **Dropped.** Bots: Cloudflare Turnstile + rate limits. Campaigns: UTM parameters. |
| Q2 | Publish the resume PDF with the phone number? | **No.** Publish a web version without the phone number (made during content integration, M5). |
| Q3 | Which email goes on the site? | **Deferred.** Placeholder until decided; must be settled before M4 (contact page, structured data, CRM). |
| Q4 | Rename the repo to `anushprabhu.com`? | **Done.** Now `github.com/Anush-Prabhu/anushprabhu.com`; old name redirects. |
| Q5 | Delete the earlier Vite draft? | **Keep for now.** Revisit when M2 scaffolds Astro. |

---

### Viewing the mockups
The mockups are plain HTML in `design/`. They are served locally by the preview configuration in `.claude/launch.json` (`design-mockups`, port 4321) and open in the app's browser pane.
