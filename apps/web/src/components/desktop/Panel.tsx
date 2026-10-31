import { useEffect, useRef, useState } from 'preact/hooks'
import type { Win } from '../../lib/wm/state'
import { APPS, type AppId } from './apps'
import { Icon } from './Icon'

export interface PanelProps {
  windows: Win[]
  focused: string | null
  titles: Record<string, string>
  github: string
  linkedin: string
  onLauncher(): void
  onTerminal(): void
  onTask(id: AppId): void
  onResume(): void
  onInfo(app: 'privacy' | 'terms' | 'accessibility'): void
  onPlainView(): void
  onReset(): void
}

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    // Tick on the minute boundary, then every minute.
    let interval: number | undefined
    const first = window.setTimeout(
      () => {
        setNow(new Date())
        interval = window.setInterval(() => setNow(new Date()), 60_000)
      },
      60_000 - (Date.now() % 60_000),
    )
    return () => {
      clearTimeout(first)
      clearInterval(interval)
    }
  }, [])
  const date = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return (
    <time class="clock" dateTime={now.toISOString()} title="Your local time">
      <span class="clock-date">{date} </span>
      {time}
    </time>
  )
}

export function Panel(p: PanelProps) {
  const [menu, setMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

  useEffect(() => {
    if (!menu) return
    menuRef.current?.querySelector<HTMLButtonElement>('[role=menuitem]')?.focus()
    const outside = (e: PointerEvent) => !menuRef.current?.contains(e.target as Node) && setMenu(false)
    window.addEventListener('pointerdown', outside, true)
    return () => window.removeEventListener('pointerdown', outside, true)
  }, [menu])

  const menuKey = (e: KeyboardEvent) => {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role=menuitem]') ?? [])
    const i = items.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'Escape') {
      e.stopPropagation()
      setMenu(false)
      menuRef.current?.querySelector<HTMLButtonElement>('.session-btn')?.focus()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus()
    }
  }
  const pick = (fn: () => void) => () => {
    setMenu(false)
    fn()
  }

  return (
    <nav class="panel" aria-label="Top panel">
      <button type="button" class="pbtn apps" onClick={p.onLauncher} aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}>
        <span class="glyph">
          <Icon name="mark" size={14} />
        </span>
        Apps <kbd>{isMac ? '⌘K' : 'Ctrl K'}</kbd>
      </button>
      <button type="button" class="pbtn" onClick={p.onTerminal} aria-label="Terminal" title="Terminal (`)">
        <Icon name="terminal" size={16} />
      </button>
      <span class="psep" aria-hidden="true" />
      <ul class="tasks" aria-label="Open windows">
        {p.windows.map((w) => {
          const def = APPS[w.id as AppId]
          const on = p.focused === w.id && w.mode !== 'minimized'
          return (
            <li key={w.id}>
              <button
                type="button"
                class={`task${on ? ' on' : ''}${w.mode === 'minimized' ? ' min' : ''}`}
                aria-pressed={on}
                title={p.titles[w.id] ?? def.title}
                onClick={() => p.onTask(w.id as AppId)}
              >
                <Icon name={def.icon} size={15} />
                <span>{def.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <div class="pright">
        <a
          class="pbtn"
          href={p.github}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub (opens in a new tab)"
        >
          <Icon name="github" size={17} />
        </a>
        <a
          class="pbtn"
          href={p.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn (opens in a new tab)"
        >
          <Icon name="linkedin" size={17} />
        </a>
        <Clock />
        <div class="session" ref={menuRef} onKeyDown={menuKey as never}>
          <button
            type="button"
            class={`pbtn session-btn${menu ? ' on' : ''}`}
            aria-label="Session menu"
            aria-haspopup="menu"
            aria-expanded={menu}
            onClick={() => setMenu((m) => !m)}
          >
            <Icon name="power" size={16} />
          </button>
          {menu && (
            <div class="session-menu" role="menu" aria-label="Session">
              <button type="button" role="menuitem" onClick={pick(p.onResume)}>
                Resume
              </button>
              <button type="button" role="menuitem" onClick={pick(p.onReset)}>
                Reset the desktop
              </button>
              <button type="button" role="menuitem" onClick={pick(p.onPlainView)}>
                Switch to plain view
              </button>
              <button type="button" role="menuitem" onClick={pick(() => p.onInfo('privacy'))}>
                Privacy
              </button>
              <button type="button" role="menuitem" onClick={pick(() => p.onInfo('accessibility'))}>
                Accessibility
              </button>
              <button type="button" role="menuitem" onClick={pick(() => p.onInfo('terms'))}>
                Terms of use
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
