import type { ComponentChildren } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import type { Win } from '../../lib/wm/state'
import type { AppDef } from './apps'
import { Icon } from './Icon'

const HOVER_DELAY = 400
const LONG_PRESS = 500
const KEY_STEP = 24

export interface WindowProps {
  win: Win
  def: AppDef
  title: string
  focused: boolean
  /** True while this window's Snap Layouts menu is open (highlights the maximise button). */
  snapOpen: boolean
  /** Tablet mode: no dragging, and the maximise button opens the layout menu (which also has full-screen). */
  tablet: boolean
  onFocus(): void
  onClose(): void
  onMinimize(): void
  onToggleMaximize(): void
  onMove(x: number, y: number): void
  onSnapMenu(anchor: HTMLElement, how: 'hover' | 'keyboard' | 'touch'): void
  onSnapMenuLeave(): void
  children: ComponentChildren
}

export function Window(p: WindowProps) {
  const { win, def, focused } = p
  const ref = useRef<HTMLElement>(null)
  const maxBtn = useRef<HTMLButtonElement>(null)
  const hoverTimer = useRef<number | undefined>(undefined)
  const pressTimer = useRef<number | undefined>(undefined)
  const drag = useRef<{ dx: number; dy: number; frame?: number; x: number; y: number } | null>(null)
  const titleId = `win-title-${win.id}`

  useEffect(
    () => () => {
      clearTimeout(hoverTimer.current)
      clearTimeout(pressTimer.current)
    },
    [],
  )

  const startDrag = (e: PointerEvent) => {
    if (p.tablet || e.button !== 0 || (e.target as HTMLElement).closest('button')) return
    e.preventDefault()
    p.onFocus()
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    // Dragging a snapped/maximised window detaches it at its floating size, centred under the pointer.
    const width = win.mode === 'floating' ? win.bounds.w : win.restoreBounds.w
    const dx = win.mode === 'floating' ? e.clientX - win.bounds.x : Math.min(width / 2, e.clientX - win.bounds.x)
    drag.current = { dx, dy: e.clientY - win.bounds.y, x: e.clientX, y: e.clientY }
  }

  const onDrag = (e: PointerEvent) => {
    const d = drag.current
    if (!d) return
    // Ignore tiny jitter so a click on the title bar never un-snaps a window.
    if (Math.abs(e.clientX - d.x) < 3 && Math.abs(e.clientY - d.y) < 3 && d.frame === undefined) return
    d.x = e.clientX
    d.y = e.clientY
    if (d.frame !== undefined) return
    d.frame = requestAnimationFrame(() => {
      if (!drag.current) return
      drag.current.frame = undefined
      p.onMove(drag.current.x - drag.current.dx, drag.current.y - drag.current.dy)
    })
  }

  const endDrag = () => {
    if (drag.current?.frame) cancelAnimationFrame(drag.current.frame)
    drag.current = null
  }

  const onTitleKey = (e: KeyboardEvent) => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-KEY_STEP, 0],
      ArrowRight: [KEY_STEP, 0],
      ArrowUp: [0, -KEY_STEP],
      ArrowDown: [0, KEY_STEP],
    }
    const m = moves[e.key]
    if (!m || p.tablet || e.altKey || e.ctrlKey || e.metaKey) return
    e.preventDefault()
    p.onMove(win.bounds.x + m[0], win.bounds.y + m[1])
  }

  const maxEnter = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    clearTimeout(hoverTimer.current)
    hoverTimer.current = window.setTimeout(() => maxBtn.current && p.onSnapMenu(maxBtn.current, 'hover'), HOVER_DELAY)
  }
  const maxLeave = () => {
    clearTimeout(hoverTimer.current)
    p.onSnapMenuLeave()
  }
  const longPressed = useRef(false)
  const maxDown = (e: PointerEvent) => {
    longPressed.current = false
    if (e.pointerType !== 'touch') return
    pressTimer.current = window.setTimeout(() => {
      longPressed.current = true
      maxBtn.current && p.onSnapMenu(maxBtn.current, 'touch')
    }, LONG_PRESS)
  }
  const maxClick = () => {
    clearTimeout(hoverTimer.current)
    clearTimeout(pressTimer.current)
    // A completed long-press already opened the menu; the click that ends it must not also maximise.
    if (longPressed.current) {
      longPressed.current = false
      return
    }
    if (p.tablet && maxBtn.current) p.onSnapMenu(maxBtn.current, 'touch')
    else p.onToggleMaximize()
  }
  const maxKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' && maxBtn.current) {
      e.preventDefault()
      p.onSnapMenu(maxBtn.current, 'keyboard')
    }
  }

  const { x, y, w, h } = win.bounds
  const maximized = win.mode === 'maximized'
  return (
    <section
      ref={ref}
      class={`win${focused ? ' focused' : ''}${maximized ? ' maximized' : ''}${win.mode === 'snapped' ? ' snapped' : ''}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${w}px`,
        height: `${h}px`,
        zIndex: win.z,
        display: win.mode === 'minimized' ? 'none' : undefined,
      }}
      aria-labelledby={titleId}
      data-app={win.id}
      onPointerDown={() => !focused && p.onFocus()}
      onFocusIn={() => !focused && p.onFocus()}
    >
      <header
        class="tbar"
        onPointerDown={startDrag as never}
        onPointerMove={onDrag as never}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDblClick={(e) => !(e.target as HTMLElement).closest('button') && p.onToggleMaximize()}
      >
        <Icon name={def.icon} size={16} />
        <span
          class="title"
          id={titleId}
          tabIndex={0}
          role="button"
          aria-roledescription="window title"
          aria-label={p.tablet ? p.title : `${p.title}. Use arrow keys to move the window.`}
          onKeyDown={onTitleKey as never}
        >
          {p.title}
        </span>
        <div class="ctl">
          <button type="button" aria-label={`Minimise ${def.title}`} onClick={p.onMinimize}>
            <Icon name="min" size={16} />
          </button>
          <button
            ref={maxBtn}
            type="button"
            class={p.snapOpen ? 'hot' : undefined}
            aria-label={
              p.tablet
                ? `Layout and full screen for ${def.title}`
                : `${maximized ? 'Restore' : 'Maximise'} ${def.title}. Press down arrow for snap layouts.`
            }
            aria-haspopup="dialog"
            aria-expanded={p.snapOpen}
            onClick={maxClick}
            onPointerEnter={maxEnter as never}
            onPointerLeave={maxLeave}
            onPointerDown={maxDown as never}
            onKeyDown={maxKey as never}
          >
            <Icon name={maximized ? 'restore' : 'max'} size={16} />
          </button>
          <button type="button" class="close" aria-label={`Close ${def.title}`} onClick={p.onClose}>
            <Icon name="close" size={16} />
          </button>
        </div>
      </header>
      <div class="win-body" tabIndex={-1}>
        {p.children}
      </div>
    </section>
  )
}
