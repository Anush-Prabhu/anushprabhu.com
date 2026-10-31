// Fails the build if shipped JS or the home page exceed the budgets in CLAUDE.md.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const DIST = new URL('../dist/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const JS_BUDGET = 40 * 1024
const HOME_BUDGET = 300 * 1024

const gz = (file) => gzipSync(readFileSync(file), { level: 9 }).length
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]))
const files = walk(DIST)

const js = files.filter((f) => f.endsWith('.js')).reduce((n, f) => n + gz(f), 0)
const css = files.filter((f) => f.endsWith('.css')).reduce((n, f) => n + gz(f), 0)
// Home page weight: HTML + all CSS + all JS + the Latin font files actually referenced first.
const fonts = files
  .filter((f) => /latin-wght-normal.*\.woff2$/.test(f) && !/latin-ext/.test(f))
  .reduce((n, f) => n + statSync(f).size, 0)
const home = gz(join(DIST, 'index.html')) + css + js + fonts

const kb = (n) => `${(n / 1024).toFixed(1)} KB`
console.log(`JS (gzip):          ${kb(js)}  / budget ${kb(JS_BUDGET)}`)
console.log(
  `Home page (approx): ${kb(home)} / budget ${kb(HOME_BUDGET)}  (HTML ${kb(gz(join(DIST, 'index.html')))}, CSS ${kb(css)}, fonts ${kb(fonts)})`,
)

let failed = false
if (js > JS_BUDGET) (console.error('✗ JS budget exceeded'), (failed = true))
if (home > HOME_BUDGET) (console.error('✗ Home page budget exceeded'), (failed = true))
if (failed) process.exit(1)
console.log('✓ Within budget')
