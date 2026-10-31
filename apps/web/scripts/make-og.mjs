// Renders public/og.png (1200×630 social preview) from a small HTML card in the site's own style.
// Run after changing the name or headline: `node scripts/make-og.mjs` (uses Playwright's Chromium).
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..', '..')
const font = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(join(root, 'node_modules', '@fontsource-variable', pkg, 'files', file)).toString('base64')}`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: D; src: url(${font('red-hat-display', 'red-hat-display-latin-wght-normal.woff2')}); font-weight: 100 900; }
@font-face { font-family: M; src: url(${font('red-hat-mono', 'red-hat-mono-latin-wght-normal.woff2')}); font-weight: 100 900; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: radial-gradient(90% 70% at 72% 18%, #15202d 0%, transparent 65%), #0f1620;
  color: #e8edf4; font-family: D, sans-serif; padding: 84px 96px; position: relative; overflow: hidden; }
body::before { content: ''; position: absolute; inset: 0; background-image: radial-gradient(rgb(255 255 255 / .04) 1px, transparent 1px); background-size: 28px 28px; }
.w { position: relative; font-family: M, monospace; font-size: 30px; line-height: 52px; color: #a7b4c6; }
.w div { position: relative; padding-left: 74px; }
.w div::before { content: ''; position: absolute; left: 12px; width: 48px; border-left: 5px solid #5b8def; }
.w .a::before { top: 26px; height: 40px; border-top: 5px solid #5b8def; }
.w .b::before { top: 0; height: 26px; border-bottom: 5px solid #5b8def; }
.w b { color: #82adff; } .w .p { color: #e8edf4; font-weight: 600; } .w .c::before { content: '$ '; color: #82adff; font-weight: 600; }
h1 { position: relative; font-weight: 800; font-size: 112px; letter-spacing: -0.02em; margin-top: 26px; line-height: 1; }
p { position: relative; font-weight: 500; font-size: 38px; line-height: 1.35; color: #a7b4c6; margin-top: 26px; max-width: 900px; }
.d { position: absolute; right: 96px; bottom: 64px; font-family: M, monospace; font-size: 26px; color: #5b8def; }
</style></head><body>
<div class="w"><div class="a">(<b>anush㉿portfolio</b>)-[<span class="p">~</span>]</div><div class="b"><span class="c">whoami</span></div></div>
<h1>Anush Prabhu</h1>
<p>Security engineering, identity automation and applied AI.</p>
<div class="d">anushprabhu.com</div>
</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.setContent(html)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: join(here, '..', 'public', 'og.png') })
await browser.close()
console.log('wrote public/og.png')
