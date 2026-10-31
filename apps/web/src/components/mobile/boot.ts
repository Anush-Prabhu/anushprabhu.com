// Loaded on every page. Kept tiny: no framework. The sheets' code loads only when one is opened.

export type SheetKind = 'terminal' | 'search' | 'recent'
export interface RecentEntry {
  path: string
  title: string
}

export const RECENT_KEY = 'recent-apps'
const RECENT_MAX = 8

export function readRecent(): RecentEntry[] {
  try {
    const list = JSON.parse(sessionStorage.getItem(RECENT_KEY) ?? '[]')
    return Array.isArray(list) ? list.filter((e) => typeof e?.path === 'string' && typeof e?.title === 'string') : []
  } catch {
    return []
  }
}

function recordVisit() {
  const entry = { path: location.pathname.replace(/\.html$/, '') || '/', title: document.body.dataset.title ?? '' }
  try {
    const list = [entry, ...readRecent().filter((e) => e.path !== entry.path)].slice(0, RECENT_MAX)
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(list))
  } catch {
    /* storage unavailable: recent list just stays empty */
  }
}

async function open(kind: SheetKind, opener: HTMLElement) {
  const { openSheet } = await import('./sheet')
  openSheet(kind, opener)
}

export function boot() {
  recordVisit()

  document.addEventListener('click', (e) => {
    const trigger = (e.target as Element).closest<HTMLElement>('[data-m-open]')
    if (!trigger) return
    e.preventDefault()
    void open(trigger.dataset.mOpen as SheetKind, trigger)
  })

  // "Save as PDF": print the resume. Printing always prints the page underneath, and in the desktop view that can be a
  // different page than the URL suggests (windows change the URL), so check the content actually loaded.
  document.addEventListener('click', (e) => {
    if (!(e.target as Element).closest('[data-print]')) return
    if (document.querySelector('.plain [data-app-content="resume"]')) window.print()
    else window.open('/resume?print=1', '_blank', 'noopener')
  })
  if (new URLSearchParams(location.search).has('print') && location.pathname.replace(/\.html$/, '') === '/resume') {
    void document.fonts.ready.then(() => window.print())
  }

  // Plain view → desktop view (offered where the desktop can run, see CSS).
  document.querySelector('[data-open-desktop]')?.addEventListener('click', () => {
    try {
      localStorage.removeItem('view')
    } catch {
      /* ignore */
    }
    location.reload()
  })
}
