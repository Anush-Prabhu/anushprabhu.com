import { useEffect, useRef } from 'preact/hooks'
import { layoutById, zoneRect, type Rect } from '../../lib/wm/geometry'
import type { Assist, Win } from '../../lib/wm/state'
import { APPS, SHORTCUTS, type AppId } from './apps'
import { Icon } from './Icon'

export interface SnapAssistProps {
  assist: Assist
  work: Rect
  windows: Win[]
  onFill(zone: number, app: AppId): void
  onDismiss(): void
}

/** After snapping one window, offer the other windows (or closed apps) for each empty zone. */
export function SnapAssist(p: SnapAssistProps) {
  const ref = useRef<HTMLDivElement>(null)
  const layout = layoutById(p.assist.layout)
  const placed = new Set(p.assist.zones.filter(Boolean))
  const openIds = p.windows.map((w) => w.id as AppId).filter((id) => !placed.has(id))
  const closed = SHORTCUTS.filter((id) => !p.windows.some((w) => w.id === id) && id !== 'resume')

  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
  }, [p.assist.zones.join()])

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      p.onDismiss()
    }
  }

  return (
    <div
      ref={ref}
      class="assist-layer"
      onKeyDown={onKey as never}
      onPointerDown={(e) => e.target === e.currentTarget && p.onDismiss()}
    >
      {p.assist.zones.map((occupant, zi) => {
        if (occupant) return null
        const r = zoneRect(p.work, layout.zones[zi])
        return (
          <section
            class="assist-zone"
            key={zi}
            style={{ left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` }}
            aria-label={`Choose a window for the ${layout.zoneLabels[zi]}`}
          >
            <h2>Choose a window for this space</h2>
            {openIds.length > 0 && (
              <ul>
                {openIds.map((id) => (
                  <li key={id}>
                    <button type="button" onClick={() => p.onFill(zi, id)}>
                      <Icon name={APPS[id].icon} size={18} />
                      {APPS[id].title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {closed.length > 0 && (
              <>
                <h3>Or open</h3>
                <ul class="closed">
                  {closed.map((id) => (
                    <li key={id}>
                      <button type="button" onClick={() => p.onFill(zi, id)}>
                        <Icon name={APPS[id].icon} size={18} />
                        {APPS[id].title}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <button type="button" class="assist-skip" onClick={p.onDismiss}>
              Leave empty
            </button>
          </section>
        )
      })}
    </div>
  )
}
