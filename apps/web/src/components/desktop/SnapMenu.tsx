import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'
import { feasibleLayouts, isFeasible, layoutById, type LayoutId, type Rect } from '../../lib/wm/geometry'
import type { Win } from '../../lib/wm/state'
import { APPS, type AppId } from './apps'
import { Icon } from './Icon'

/** Suggested pairings shown first, each filled with real apps (Snap Layouts with app suggestions). */
const SUGGESTED: { layout: LayoutId; apps: AppId[]; label: string }[] = [
  { layout: 'halves', apps: ['terminal', 'about'], label: 'Terminal and About side by side' },
  { layout: 'main-stack', apps: ['projects', 'experience', 'contact'], label: 'Projects with Experience and Contact' },
]

export interface SnapMenuProps {
  win: Win
  work: Rect
  anchor: HTMLElement
  /** Keyboard and touch openings move focus into the menu; hover openings don't steal it. */
  takeFocus: boolean
  onPick(layout: LayoutId, zone: number): void
  onPair(layout: LayoutId, apps: AppId[]): void
  onClose(restoreFocus: boolean): void
  onPointerEnter(): void
  onPointerLeave(): void
}

export function SnapMenu(p: SnapMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const layouts = feasibleLayouts(p.work, p.win.min)
  const pairs = SUGGESTED.filter((s) => isFeasible(layoutById(s.layout), p.work))
  const title = APPS[p.win.id as AppId]?.title ?? 'window'

  useLayoutEffect(() => {
    const a = p.anchor.getBoundingClientRect()
    const width = ref.current?.offsetWidth ?? 304
    const left = Math.max(8, Math.min(a.right - width, window.innerWidth - width - 8))
    setPos({ top: a.bottom + 6, left })
  }, [p.anchor])

  useEffect(() => {
    if (p.takeFocus) ref.current?.querySelector<HTMLButtonElement>('.z')?.focus()
    const outside = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node) && !p.anchor.contains(e.target as Node)) p.onClose(false)
    }
    window.addEventListener('pointerdown', outside, true)
    return () => window.removeEventListener('pointerdown', outside, true)
  }, [])

  const onKey = (e: KeyboardEvent) => {
    const zones = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('.z') ?? [])
    const i = zones.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      p.onClose(true)
    } else if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) {
      e.preventDefault()
      const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
      zones[(i + step + zones.length) % zones.length]?.focus()
    } else if (e.key === 'Tab') {
      // Keep Tab inside the menu while it is open.
      e.preventDefault()
      zones[(i + (e.shiftKey ? -1 : 1) + zones.length) % zones.length]?.focus()
    }
  }

  return (
    <div
      ref={ref}
      class="snap-menu"
      role="dialog"
      aria-label={`Snap layouts for ${title}`}
      style={{ top: `${pos.top}px`, left: `${pos.left}px` }}
      onKeyDown={onKey as never}
      onPointerEnter={p.onPointerEnter}
      onPointerLeave={p.onPointerLeave}
    >
      <div class="snap-head">
        <strong>Snap layouts</strong>
        <span>for {title}</span>
      </div>
      <div class="layouts">
        {pairs.length > 0 && <div class="grp">Suggested</div>}
        {pairs.map((s) => {
          const layout = layoutById(s.layout)
          return (
            <div class={`layout l-${s.layout}`} role="group" aria-label={s.label} key={s.label}>
              {layout.zones.map((_, zi) => {
                const app = APPS[s.apps[zi]]
                return (
                  <button
                    type="button"
                    class="z"
                    key={zi}
                    aria-label={`${s.label}: ${app.title} in the ${layout.zoneLabels[zi]}`}
                    onClick={() => p.onPair(s.layout, s.apps)}
                  >
                    <Icon name={app.icon} size={16} />
                  </button>
                )
              })}
            </div>
          )
        })}
        <div class="grp">Layouts</div>
        {layouts.map((layout) => (
          <div class={`layout l-${layout.id}`} role="group" aria-label={layout.label} key={layout.id}>
            {layout.zones.map((_, zi) => (
              <button
                type="button"
                class="z"
                key={zi}
                aria-label={`${layout.label}: put ${title} in the ${layout.zoneLabels[zi]}`}
                onClick={() => p.onPick(layout.id, zi)}
              />
            ))}
          </div>
        ))}
      </div>
      <p class="snap-tip">Arrow keys to choose, Enter to snap, Esc to close.</p>
    </div>
  )
}
