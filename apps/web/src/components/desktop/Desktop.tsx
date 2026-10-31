import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks'
import { GAP, isFeasible, layoutById, type LayoutId, type Rect } from '../../lib/wm/geometry'
import { createStore, findWin } from '../../lib/wm/state'
import type { SiteData } from '../../lib/site-data'
import { APPS, SHORTCUTS, appForPath, type AppId } from './apps'
import { AppBody, ResumeNotice, contentCache, extractContent } from './AppBody'
import { Icon } from './Icon'
import { Launcher } from './Launcher'
import { Panel } from './Panel'
import { buildIndex, type SearchItem } from './search'
import { SnapAssist } from './SnapAssist'
import { SnapMenu } from './SnapMenu'
import { Terminal } from './Terminal'
import { useWm } from './useStore'
import { Window } from './Window'
import './desktop.css'

const SNAP_CLOSE_DELAY = 300

/** Keep in sync with `client:media` in layouts/Base.astro and the CSS in styles/base.css. */
const ACTIVE_QUERY = '(min-width: 600px) and (min-height: 500px)'
const DESKTOP_QUERY = '(min-width: 1024px)'

/** desktop: full window manager · tablet: no rail, windows full-screen or split · off: phone sizes (plain pages). */
type Mode = 'desktop' | 'tablet' | 'off'
const getMode = (): Mode =>
  !window.matchMedia(ACTIVE_QUERY).matches ? 'off' : window.matchMedia(DESKTOP_QUERY).matches ? 'desktop' : 'tablet'

const CHROME: Record<Exclude<Mode, 'off'>, { panel: number; rail: number }> = {
  desktop: { panel: 32, rail: 92 },
  tablet: { panel: 44, rail: 0 },
}

const computeWork = (mode: Mode): Rect => {
  const c = CHROME[mode === 'off' ? 'tablet' : mode]
  const left = c.rail || GAP
  return { x: left, y: c.panel + GAP, w: window.innerWidth - left - GAP, h: window.innerHeight - c.panel - 2 * GAP }
}

const readPlain = () => {
  try {
    return localStorage.getItem('view') === 'plain'
  } catch {
    return false
  }
}

const currentPath = () => location.pathname.replace(/\.html$/, '') + location.hash
const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))

interface SnapState {
  id: AppId
  anchor: HTMLElement
  how: 'hover' | 'keyboard' | 'touch'
}

export interface DesktopProps {
  initialApp: AppId
  data: SiteData
}

function DesktopView({ initialApp, data }: DesktopProps) {
  const [plain, setPlain] = useState(readPlain)
  const [mode, setMode] = useState<Mode>(getMode)
  const modeRef = useRef(mode)
  modeRef.current = mode
  const store = useMemo(() => createStore(computeWork(getMode())), [])
  const s = useWm(store)
  const [paths, setPaths] = useState<Partial<Record<AppId, string>>>(() => ({ [initialApp]: currentPath() || '/' }))
  const [launcher, setLauncher] = useState(false)
  const [snap, setSnap] = useState<SnapState | null>(null)
  const index = useMemo(() => buildIndex(data), [data])
  const snapTimer = useRef<number | undefined>(undefined)
  /** Next URL change should push a history entry (new window / navigation) instead of replacing. */
  const pushNext = useRef(false)
  /** The URL change came from Back/Forward: don't write history. */
  const fromPop = useRef(false)
  /** After a user-initiated open, move keyboard focus into that window. */
  const focusInto = useRef<AppId | null>(null)

  const dispatch = store.dispatch

  /* ---------- opening apps ---------- */

  const openApp = useCallback(
    (app: AppId, path?: string, opts: { push?: boolean; focus?: boolean } = {}) => {
      const def = APPS[app]
      if (def.route !== null) {
        setPaths((p) => {
          const next = path ?? p[app] ?? def.route!
          if (p[app] !== next || !findWin(store.get(), app)) pushNext.current = opts.push ?? true
          return { ...p, [app]: next }
        })
      }
      // Tablets have no free-floating windows: new windows open full-screen.
      dispatch({ type: 'open', id: app, min: def.min, size: def.size, maximized: modeRef.current === 'tablet' })
      if (opts.focus !== false) focusInto.current = app
    },
    [store],
  )

  const arrangeDefault = useCallback(
    (app: AppId, path: string) => {
      openApp('terminal', undefined, { focus: false })
      openApp(app, path, { push: false, focus: false })
      // Side by side where it fits; stacked (content on top) on portrait tablets; otherwise content full-screen.
      const work = store.get().work
      const min = {
        w: Math.max(APPS.terminal.min.w, APPS[app].min.w),
        h: Math.max(APPS.terminal.min.h, APPS[app].min.h),
      }
      if (isFeasible(layoutById('halves'), work, min)) {
        dispatch({ type: 'snap', id: 'terminal', layout: 'halves', zone: 0 })
        dispatch({ type: 'snap', id: app, layout: 'halves', zone: 1 })
      } else if (isFeasible(layoutById('stacked'), work, min)) {
        dispatch({ type: 'snap', id: app, layout: 'stacked', zone: 0 })
        dispatch({ type: 'snap', id: 'terminal', layout: 'stacked', zone: 1 })
      }
      dispatch({ type: 'focus', id: app })
    },
    [openApp],
  )

  /* ---------- mount ---------- */

  useLayoutEffect(() => {
    if (plain) {
      document.documentElement.setAttribute('data-view', 'plain')
      return
    }
    // Reuse the page's own rendered content for the first window instead of fetching it again.
    const node = document.querySelector('.plain [data-app-content]')
    const html = node && extractContent(node.outerHTML)
    if (html) contentCache.set(location.pathname.replace(/\.html$/, ''), html)
    arrangeDefault(initialApp, currentPath() || '/')
  }, [plain])

  // The plain page hides only while the desktop is actually showing (not at phone sizes).
  useLayoutEffect(() => {
    if (plain) return
    if (mode === 'off') document.documentElement.removeAttribute('data-view')
    else document.documentElement.setAttribute('data-view', 'desktop')
  }, [plain, mode])

  useEffect(() => {
    if (plain) return
    let frame = 0
    const onResize = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = getMode()
        setMode(next)
        dispatch({ type: 'setWork', work: computeWork(next) })
        if (next === 'tablet') dispatch({ type: 'maximizeFloating' })
      })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [plain])

  /* ---------- URL ↔ focused window ---------- */

  useEffect(() => {
    const f = s.focused as AppId | null
    if (!f || APPS[f].route === null) return
    const desired = paths[f] ?? APPS[f].route!
    document.title =
      f === 'about' && desired === '/'
        ? 'Anush Prabhu — security engineering, automation, applied AI'
        : `${APPS[f].title} — Anush Prabhu`
    if (fromPop.current) {
      fromPop.current = false
      pushNext.current = false
      return
    }
    if (desired !== currentPath()) {
      if (pushNext.current) history.pushState({ app: f }, '', desired)
      else history.replaceState({ app: f }, '', desired)
    }
    pushNext.current = false
  }, [s.focused, paths])

  useEffect(() => {
    const onPop = () => {
      const path = currentPath() || '/'
      const app = appForPath(path) ?? 'about'
      fromPop.current = true
      openApp(app, path, { push: false })
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [openApp])

  /* ---------- focus management ---------- */

  useEffect(() => {
    const id = focusInto.current
    if (!id || s.focused !== id) return
    focusInto.current = null
    if (id === 'terminal') return // the terminal focuses its own input
    document.querySelector<HTMLElement>(`.win[data-app="${id}"] .win-body`)?.focus({ preventScroll: true })
  })

  /* ---------- snap menu ---------- */

  const closeSnap = (restoreFocus: boolean) => {
    clearTimeout(snapTimer.current)
    setSnap((cur) => {
      if (cur && restoreFocus) cur.anchor.focus()
      return null
    })
  }
  const scheduleSnapClose = () => {
    clearTimeout(snapTimer.current)
    snapTimer.current = window.setTimeout(() => setSnap((cur) => (cur?.how === 'hover' ? null : cur)), SNAP_CLOSE_DELAY)
  }
  const openSnapFor = (id: AppId) => {
    const anchor = document.querySelector<HTMLElement>(`.win[data-app="${id}"] [aria-haspopup="dialog"]`)
    if (anchor) setSnap({ id, anchor, how: 'keyboard' })
  }

  const pickLayout = (layout: LayoutId, zone: number) => {
    if (!snap) return
    dispatch({ type: 'snap', id: snap.id, layout, zone, assist: true })
    closeSnap(false)
  }
  const pickPair = (layout: LayoutId, apps: AppId[]) => {
    apps.forEach((app) => openApp(app, undefined, { focus: false }))
    apps.forEach((app, zone) => dispatch({ type: 'snap', id: app, layout, zone }))
    dispatch({ type: 'focus', id: snap?.id && apps.includes(snap.id) ? snap.id : apps[0] })
    closeSnap(false)
  }

  /* ---------- global keyboard shortcuts ---------- */

  useEffect(() => {
    if (plain) return
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setLauncher((v) => !v)
        return
      }
      if (launcher) return
      const focused = store.get().focused as AppId | null
      if (e.key === '`' && !e.altKey && !mod && !isTyping(e.target)) {
        e.preventDefault()
        openApp('terminal')
      } else if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault()
        openApp('terminal')
      } else if (e.altKey && e.code === 'Backquote') {
        e.preventDefault()
        dispatch({ type: 'focusNext' })
      } else if (e.altKey && !mod && e.code === 'KeyZ' && focused) {
        e.preventDefault()
        openSnapFor(focused)
      } else if (e.altKey && !mod && e.code === 'KeyW' && focused) {
        e.preventDefault()
        dispatch({ type: 'close', id: focused })
      } else if (e.altKey && e.shiftKey && focused && e.key.startsWith('Arrow')) {
        e.preventDefault()
        const w = findWin(store.get(), focused)
        if (!w) return
        if (e.key === 'ArrowLeft') dispatch({ type: 'snap', id: focused, layout: 'halves', zone: 0 })
        if (e.key === 'ArrowRight') dispatch({ type: 'snap', id: focused, layout: 'halves', zone: 1 })
        if (e.key === 'ArrowUp' && w.mode !== 'maximized') dispatch({ type: 'toggleMaximize', id: focused })
        if (e.key === 'ArrowDown')
          dispatch(w.mode === 'floating' ? { type: 'minimize', id: focused } : { type: 'restore', id: focused })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [plain, launcher, openApp])

  /* ---------- session ---------- */

  const toPlain = () => {
    try {
      localStorage.setItem('view', 'plain')
    } catch {}
    setPlain(true)
    document.documentElement.setAttribute('data-view', 'plain')
    window.scrollTo(0, 0)
  }
  const reset = () => {
    for (const w of store.get().windows) dispatch({ type: 'close', id: w.id })
    setPaths({ about: '/' })
    arrangeDefault('about', '/')
    pushNext.current = true
  }

  const openSearchItem = (item: SearchItem) => {
    setLauncher(false)
    openApp(item.app, item.path)
  }

  if (plain) return null

  const visibleTitle = (id: AppId) =>
    id === 'terminal' ? `${data.profile.user}@${data.profile.host}: ~` : APPS[id].title
  const titles = Object.fromEntries(s.windows.map((w) => [w.id, visibleTitle(w.id as AppId)]))

  return (
    <div class={`desktop ${mode}`} hidden={mode === 'off'}>
      <h1 class="visually-hidden">Anush Prabhu: desktop view</h1>
      <Panel
        windows={s.windows}
        focused={s.focused}
        titles={titles}
        github={data.profile.github}
        linkedin={data.profile.linkedin}
        onLauncher={() => setLauncher(true)}
        onTerminal={() => openApp('terminal')}
        onTask={(id) => {
          const w = findWin(store.get(), id)
          if (w && s.focused === id && w.mode !== 'minimized') dispatch({ type: 'minimize', id })
          else openApp(id, undefined, { push: false })
        }}
        onResume={() => openApp('resume')}
        onPlainView={toPlain}
        onReset={reset}
      />

      {mode === 'desktop' && (
        <nav class="rail" aria-label="Desktop shortcuts">
          <ul
            onKeyDown={
              ((e: KeyboardEvent) => {
                if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
                e.preventDefault()
                const items = Array.from((e.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('button'))
                const i = items.indexOf(document.activeElement as HTMLButtonElement)
                items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus()
              }) as never
            }
          >
            {SHORTCUTS.map((id) => (
              <li key={id}>
                <button type="button" class="sc" onClick={() => openApp(id)}>
                  <span class="tile">
                    <Icon name={APPS[id].icon} size={22} />
                  </span>
                  {APPS[id].label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <main class="work" aria-label="Windows">
        {s.windows.map((w) => {
          const id = w.id as AppId
          const def = APPS[id]
          return (
            <Window
              key={id}
              win={w}
              def={def}
              title={titles[id]}
              focused={s.focused === id}
              snapOpen={snap?.id === id}
              tablet={mode === 'tablet'}
              onFocus={() => dispatch({ type: 'focus', id })}
              onClose={() => dispatch({ type: 'close', id })}
              onMinimize={() => dispatch({ type: 'minimize', id })}
              onToggleMaximize={() => dispatch({ type: 'toggleMaximize', id })}
              onMove={(x, y) => dispatch({ type: 'move', id, x, y })}
              onSnapMenu={(anchor, how) => {
                clearTimeout(snapTimer.current)
                dispatch({ type: 'focus', id })
                setSnap({ id, anchor, how })
              }}
              onSnapMenuLeave={scheduleSnapClose}
            >
              {id === 'terminal' ? (
                <Terminal
                  data={data}
                  active={s.focused === 'terminal'}
                  onEffect={(effect) => openApp(effect.app, effect.path)}
                  onLink={(url) => window.open(url, '_blank', 'noopener,noreferrer')}
                />
              ) : id === 'resume' ? (
                <ResumeNotice onOpen={(app) => openApp(app)} />
              ) : (
                <AppBody app={id} path={paths[id] ?? def.route!} onNavigate={(app, path) => openApp(app, path)} />
              )}
            </Window>
          )
        })}
      </main>

      {s.assist && (
        <SnapAssist
          assist={s.assist}
          work={s.work}
          windows={s.windows}
          onFill={(zone, app) => {
            if (!findWin(store.get(), app)) openApp(app, undefined, { focus: false })
            dispatch({ type: 'assistFill', zone, id: app })
          }}
          onDismiss={() => dispatch({ type: 'assistDismiss' })}
        />
      )}

      {snap && findWin(s, snap.id) && (
        <SnapMenu
          win={findWin(s, snap.id)!}
          work={s.work}
          anchor={snap.anchor}
          takeFocus={snap.how !== 'hover'}
          showMaximize={mode === 'tablet'}
          onToggleMaximize={() => {
            dispatch({ type: 'toggleMaximize', id: snap.id })
            closeSnap(true)
          }}
          onPick={pickLayout}
          onPair={pickPair}
          onClose={closeSnap}
          onPointerEnter={() => clearTimeout(snapTimer.current)}
          onPointerLeave={scheduleSnapClose}
        />
      )}

      {launcher && <Launcher index={index} onOpen={openSearchItem} onClose={() => setLauncher(false)} />}
    </div>
  )
}

/**
 * The desktop is browser-only. Server and first client render are both empty (so hydration matches and the
 * static HTML stays content-only); the real desktop mounts right after.
 */
export default function Desktop(props: DesktopProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted ? <DesktopView {...props} /> : null
}
