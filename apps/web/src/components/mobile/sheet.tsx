// Full-screen phone sheets (terminal, search, recent apps). Loaded on demand by boot.ts.
import { render } from 'preact'
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import type { SiteData } from '../../lib/site-data'
import { APPS, type AppId } from '../desktop/apps'
import { Icon } from '../desktop/Icon'
import { Launcher } from '../desktop/Launcher'
import { buildIndex } from '../desktop/search'
import { Terminal } from '../desktop/Terminal'
import { readRecent, type SheetKind } from './boot'

let dataPromise: Promise<SiteData> | null = null
const loadData = () => (dataPromise ??= fetch('/site-data.json').then((r) => r.json() as Promise<SiteData>))

const TITLES: Record<SheetKind, string> = { terminal: 'Terminal', search: 'Search', recent: 'Recent' }

/** Leave the sheet's history entry before navigating, so Back from the next page returns to this page. */
function go(path: string) {
  history.replaceState(null, '', location.pathname)
  location.assign(path)
}

const routeFor = (app: AppId, path?: string) => path ?? APPS[app].route

function Sheet({ kind: initial, onClose }: { kind: SheetKind; onClose(): void }) {
  const [kind, setKind] = useState(initial)
  const [data, setData] = useState<SiteData | null>(null)
  const [error, setError] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (kind === 'recent') return
    loadData().then(setData, () => setError(true))
  }, [kind])

  // Keep the sheet inside the visible area when the on-screen keyboard opens.
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv || !ref.current) return
    const fit = () => {
      if (!ref.current) return
      ref.current.style.height = `${vv.height}px`
      ref.current.style.top = `${vv.offsetTop}px`
    }
    fit()
    vv.addEventListener('resize', fit)
    vv.addEventListener('scroll', fit)
    return () => {
      vv.removeEventListener('resize', fit)
      vv.removeEventListener('scroll', fit)
    }
  }, [])

  useEffect(() => {
    // Move focus into the sheet. Search focuses its own input; the terminal deliberately doesn't open the keyboard.
    if (kind !== 'search') ref.current?.querySelector<HTMLElement>('.m-sheet-close')?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && kind !== 'search' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [kind])

  const index = useMemo(() => (data ? buildIndex(data).filter((i) => i.app !== 'resume') : []), [data])

  return (
    <div ref={ref} class="m-sheet" role="dialog" aria-modal="true" aria-label={TITLES[kind]}>
      <div class="m-sheet-bar">
        <button type="button" class="m-sheet-close" onClick={onClose} aria-label={`Close ${TITLES[kind]}`}>
          <Icon name="back" size={20} />
        </button>
        <h2>{TITLES[kind]}</h2>
      </div>
      <div class="m-sheet-body">
        {error && <p class="m-sheet-msg">Couldn't load. Check your connection and try again.</p>}
        {!error && kind !== 'recent' && !data && <p class="m-sheet-msg">Loading…</p>}
        {kind === 'terminal' && data && (
          <Terminal
            data={data}
            active
            docked
            onEffect={(effect) => {
              if (effect.app === 'terminal' || effect.app === 'resume') return
              const path = routeFor(effect.app, effect.path)
              if (path) go(path)
            }}
            onLink={(url) => window.open(url, '_blank', 'noopener,noreferrer')}
          />
        )}
        {kind === 'search' && data && (
          <Launcher
            index={index}
            variant="sheet"
            onClose={onClose}
            onOpen={(item) => {
              if (item.app === 'terminal') return setKind('terminal')
              const path = routeFor(item.app, item.path)
              if (path) go(path)
            }}
          />
        )}
        {kind === 'recent' && <Recent />}
      </div>
    </div>
  )
}

function Recent() {
  const here = location.pathname.replace(/\.html$/, '') || '/'
  const list = readRecent()
  if (!list.length) return <p class="m-sheet-msg">Pages you open will show up here.</p>
  return (
    <ul class="m-recent">
      {list.map((e) => (
        <li key={e.path}>
          <a
            href={e.path}
            aria-current={e.path === here ? 'page' : undefined}
            onClick={(ev) => (ev.preventDefault(), go(e.path))}
          >
            <b>{e.title || 'Home'}</b>
            <span>{e.path === '/' ? '~' : `~${e.path}`}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}

let host: HTMLElement | null = null
let opener: HTMLElement | null = null

function close() {
  if (!host) return
  render(null, host)
  document.documentElement.classList.remove('sheet-open')
  window.removeEventListener('popstate', close)
  opener?.focus()
}

export function openSheet(kind: SheetKind, trigger: HTMLElement) {
  opener = trigger
  if (!host) {
    host = document.createElement('div')
    host.id = 'm-sheet-host'
    document.body.append(host)
  }
  // One history entry per sheet, so the phone's Back button closes it.
  if (document.documentElement.classList.contains('sheet-open')) history.replaceState({ sheet: kind }, '', `#${kind}`)
  else {
    history.pushState({ sheet: kind }, '', `#${kind}`)
    window.addEventListener('popstate', close)
  }
  document.documentElement.classList.add('sheet-open')
  render(<Sheet key={kind + Date.now()} kind={kind} onClose={() => history.back()} />, host)
}
