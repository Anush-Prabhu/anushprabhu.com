import { describe, expect, it } from 'vitest'
import { DEFAULT_MIN, GAP, LAYOUTS, TITLEBAR_H, clamp, feasibleLayouts, layoutById, zoneRect } from './geometry'
import { type Action, type WmState, findWin, initialState, reduce } from './state'

const WORK = { x: 92, y: 40, w: 1340, h: 852 } // 1440×900 viewport minus panel, rail and gaps
const run = (actions: Action[], s: WmState = initialState(WORK)) => actions.reduce(reduce, s)
const win = (s: WmState, id: string) => {
  const w = findWin(s, id)
  if (!w) throw new Error(`no window ${id}`)
  return w
}

describe('geometry', () => {
  it('splits halves with one gap between zones and none at the outer edges', () => {
    const [l, r] = layoutById('halves').zones.map((z) => zoneRect(WORK, z))
    expect(l.x).toBe(WORK.x)
    expect(r.x + r.w).toBe(WORK.x + WORK.w)
    expect(r.x - (l.x + l.w)).toBe(GAP)
    expect(l.h).toBe(WORK.h)
  })

  it('offers only layouts whose zones fit the minimum window size', () => {
    expect(feasibleLayouts(WORK).map((l) => l.id)).toEqual(LAYOUTS.map((l) => l.id))
    const small = { x: 0, y: 32, w: 900, h: 560 }
    const ids = feasibleLayouts(small).map((l) => l.id)
    expect(ids).toContain('halves')
    expect(ids).not.toContain('thirds')
    expect(ids).not.toContain('quadrants')
  })

  it('clamps so the title bar can always be reached', () => {
    const r = clamp({ x: -5000, y: -300, w: 600, h: 400 }, WORK)
    expect(r.y).toBe(WORK.y)
    expect(r.x + r.w).toBeGreaterThanOrEqual(WORK.x + 100)
    const r2 = clamp({ x: 9000, y: 9000, w: 600, h: 400 }, WORK)
    expect(r2.x).toBeLessThan(WORK.x + WORK.w)
    expect(r2.y).toBeLessThanOrEqual(WORK.y + WORK.h - TITLEBAR_H)
  })
})

describe('window lifecycle', () => {
  it('opens, focuses and stacks windows', () => {
    const s = run([
      { type: 'open', id: 'a' },
      { type: 'open', id: 'b' },
    ])
    expect(s.focused).toBe('b')
    expect(win(s, 'b').z).toBeGreaterThan(win(s, 'a').z)
    const s2 = reduce(s, { type: 'focus', id: 'a' })
    expect(s2.focused).toBe('a')
    expect(win(s2, 'a').z).toBeGreaterThan(win(s2, 'b').z)
  })

  it('re-opening an open window focuses it instead of duplicating it', () => {
    const s = run([
      { type: 'open', id: 'a' },
      { type: 'open', id: 'b' },
      { type: 'open', id: 'a' },
    ])
    expect(s.windows).toHaveLength(2)
    expect(s.focused).toBe('a')
  })

  it('close moves focus to the next highest window', () => {
    const s = run([
      { type: 'open', id: 'a' },
      { type: 'open', id: 'b' },
      { type: 'close', id: 'b' },
    ])
    expect(s.focused).toBe('a')
    expect(run([{ type: 'close', id: 'a' }], s).focused).toBeNull()
  })

  it('minimise hides and focus brings back the previous mode', () => {
    let s = run([
      { type: 'open', id: 'a' },
      { type: 'snap', id: 'a', layout: 'halves', zone: 0 },
      { type: 'minimize', id: 'a' },
    ])
    expect(win(s, 'a').mode).toBe('minimized')
    expect(s.focused).toBeNull()
    s = reduce(s, { type: 'focus', id: 'a' })
    expect(win(s, 'a').mode).toBe('snapped')
    expect(s.focused).toBe('a')
  })

  it('maximise then restore returns to the exact floating rectangle', () => {
    const s0 = run([
      { type: 'open', id: 'a' },
      { type: 'move', id: 'a', x: 300, y: 200 },
    ])
    const before = win(s0, 'a').bounds
    const max = reduce(s0, { type: 'toggleMaximize', id: 'a' })
    expect(win(max, 'a').bounds).toEqual(WORK)
    const back = reduce(max, { type: 'toggleMaximize', id: 'a' })
    expect(win(back, 'a').mode).toBe('floating')
    expect(win(back, 'a').bounds).toEqual(before)
  })

  it('maximising a snapped window and un-maximising returns it to its zone', () => {
    const s = run([
      { type: 'open', id: 'a' },
      { type: 'snap', id: 'a', layout: 'halves', zone: 1 },
      { type: 'toggleMaximize', id: 'a' },
      { type: 'toggleMaximize', id: 'a' },
    ])
    expect(win(s, 'a').mode).toBe('snapped')
    expect(win(s, 'a').bounds).toEqual(zoneRect(WORK, layoutById('halves').zones[1]))
  })

  it('focusNext cycles through every visible window', () => {
    let s = run([
      { type: 'open', id: 'a' },
      { type: 'open', id: 'b' },
      { type: 'open', id: 'c' },
    ])
    const seen = new Set<string>()
    for (let i = 0; i < 3; i++) {
      s = reduce(s, { type: 'focusNext' })
      seen.add(s.focused!)
    }
    expect(seen).toEqual(new Set(['a', 'b', 'c']))
  })
})

describe('snapping', () => {
  it('snaps into a zone and restore returns to the pre-snap rectangle', () => {
    const s0 = run([
      { type: 'open', id: 'a' },
      { type: 'move', id: 'a', x: 400, y: 120 },
    ])
    const floating = win(s0, 'a').bounds
    const snapped = reduce(s0, { type: 'snap', id: 'a', layout: 'two-thirds', zone: 0 })
    expect(win(snapped, 'a').mode).toBe('snapped')
    expect(win(snapped, 'a').bounds).toEqual(zoneRect(WORK, layoutById('two-thirds').zones[0]))
    const restored = reduce(snapped, { type: 'restore', id: 'a' })
    expect(win(restored, 'a').bounds).toEqual(floating)
    expect(win(restored, 'a').snap).toBeUndefined()
  })

  it('dragging a snapped window detaches it at its floating size', () => {
    const s0 = run([{ type: 'open', id: 'a' }])
    const size = win(s0, 'a').bounds
    const s = run(
      [
        { type: 'snap', id: 'a', layout: 'halves', zone: 0 },
        { type: 'move', id: 'a', x: 500, y: 300 },
      ],
      s0,
    )
    expect(win(s, 'a').mode).toBe('floating')
    expect(win(s, 'a').bounds.w).toBe(size.w)
    expect(win(s, 'a').bounds.h).toBe(size.h)
  })

  it('Snap Assist fills the remaining zones in one group, then closes', () => {
    let s = run([
      { type: 'open', id: 'a' },
      { type: 'open', id: 'b' },
      { type: 'open', id: 'c' },
      { type: 'snap', id: 'a', layout: 'main-stack', zone: 0, assist: true },
    ])
    expect(s.assist?.zones).toEqual(['a', null, null])
    s = reduce(s, { type: 'assistFill', zone: 1, id: 'b' })
    expect(s.assist?.zones).toEqual(['a', 'b', null])
    s = reduce(s, { type: 'assistFill', zone: 2, id: 'c' })
    expect(s.assist).toBeNull()
    const groups = new Set(s.windows.map((w) => w.snap?.group))
    expect(groups.size).toBe(1)
    expect(win(s, 'c').bounds).toEqual(zoneRect(WORK, layoutById('main-stack').zones[2]))
  })

  it('ignores filling an already-filled zone', () => {
    const s = run([
      { type: 'open', id: 'a' },
      { type: 'open', id: 'b' },
      { type: 'snap', id: 'a', layout: 'halves', zone: 0, assist: true },
    ])
    expect(reduce(s, { type: 'assistFill', zone: 0, id: 'b' })).toBe(s)
  })

  it('closing a window that is part of an assist frees its zone', () => {
    const s = run([
      { type: 'open', id: 'a' },
      { type: 'open', id: 'b' },
      { type: 'snap', id: 'a', layout: 'halves', zone: 0, assist: true },
      { type: 'close', id: 'a' },
    ])
    expect(s.assist?.zones).toEqual([null, null])
  })
})

describe('viewport changes', () => {
  it('recomputes snapped windows and keeps floating ones reachable', () => {
    const s0 = run([
      { type: 'open', id: 'a' },
      { type: 'open', id: 'b' },
      { type: 'snap', id: 'a', layout: 'halves', zone: 1 },
      { type: 'move', id: 'b', x: 1300, y: 800 },
    ])
    const small = { x: 92, y: 40, w: 924, h: 720 } // 1024×768
    const s = reduce(s0, { type: 'setWork', work: small })
    expect(win(s, 'a').bounds).toEqual(zoneRect(small, layoutById('halves').zones[1]))
    const b = win(s, 'b').bounds
    expect(b.x).toBeLessThan(small.x + small.w)
    expect(b.y).toBeLessThanOrEqual(small.y + small.h - TITLEBAR_H)
  })

  it('falls back to floating when a zone becomes smaller than the app minimum', () => {
    const s0 = run([
      { type: 'open', id: 'a', min: { w: 420, h: 260 } },
      { type: 'snap', id: 'a', layout: 'thirds', zone: 0 },
    ])
    const s = reduce(s0, { type: 'setWork', work: { x: 0, y: 32, w: 1000, h: 700 } })
    expect(win(s, 'a').mode).toBe('floating')
    expect(win(s, 'a').snap).toBeUndefined()
  })

  it('maximised windows follow the work area', () => {
    const small = { x: 0, y: 32, w: 1000, h: 700 }
    const s = run([
      { type: 'open', id: 'a' },
      { type: 'toggleMaximize', id: 'a' },
      { type: 'setWork', work: small },
    ])
    expect(win(s, 'a').bounds).toEqual(small)
  })

  it('default minimum is used when an app gives none', () => {
    const s = run([{ type: 'open', id: 'a' }])
    expect(win(s, 'a').min).toEqual(DEFAULT_MIN)
  })
})
