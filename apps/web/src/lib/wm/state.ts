import {
  type LayoutId,
  type Rect,
  type Size,
  DEFAULT_MIN,
  cascade,
  clamp,
  fits,
  layoutById,
  zoneRect,
} from './geometry'

export type Mode = 'floating' | 'maximized' | 'snapped' | 'minimized'

export interface Snap {
  layout: LayoutId
  zone: number
  group: string
}

export interface Win {
  id: string
  mode: Mode
  bounds: Rect
  /** Last floating rectangle; Restore returns here. */
  restoreBounds: Rect
  snap?: Snap
  /** Mode before minimising, so un-minimising returns to it. */
  prevMode?: Exclude<Mode, 'minimized'>
  z: number
  min: Size
}

/** Snap Assist: after snapping one window, the remaining zones of that layout wait to be filled. */
export interface Assist {
  layout: LayoutId
  group: string
  zones: (string | null)[]
}

export interface WmState {
  /** In opening order (stable order for the panel). */
  windows: Win[]
  focused: string | null
  work: Rect
  z: number
  assist: Assist | null
  groupSeq: number
}

export type Action =
  /** `maximized` opens the window full-screen (tablet), keeping a floating rectangle for Restore. */
  | { type: 'open'; id: string; min?: Size; size?: Size; maximized?: boolean }
  | { type: 'close'; id: string }
  | { type: 'focus'; id: string }
  | { type: 'focusNext' }
  | { type: 'minimize'; id: string }
  | { type: 'toggleMaximize'; id: string }
  | { type: 'restore'; id: string }
  | { type: 'move'; id: string; x: number; y: number }
  | { type: 'snap'; id: string; layout: LayoutId; zone: number; assist?: boolean }
  | { type: 'assistFill'; zone: number; id: string }
  | { type: 'assistDismiss' }
  | { type: 'setWork'; work: Rect }
  /** Tablet mode has no free-floating windows: maximise any that are floating. */
  | { type: 'maximizeFloating' }

export const DEFAULT_SIZE: Size = { w: 760, h: 540 }

export const initialState = (work: Rect): WmState => ({
  windows: [],
  focused: null,
  work,
  z: 1,
  assist: null,
  groupSeq: 0,
})

export const findWin = (s: WmState, id: string): Win | undefined => s.windows.find((w) => w.id === id)

const update = (s: WmState, id: string, patch: (w: Win) => Win): WmState => ({
  ...s,
  windows: s.windows.map((w) => (w.id === id ? patch(w) : w)),
})

/** Highest-z visible window other than `except`. */
const topVisible = (s: WmState, except?: string): string | null =>
  s.windows.filter((w) => w.mode !== 'minimized' && w.id !== except).sort((a, b) => b.z - a.z)[0]?.id ?? null

const raise = (s: WmState, id: string): WmState => {
  const z = s.z + 1
  return { ...update(s, id, (w) => ({ ...w, z })), z, focused: id }
}

/** Bounds a window should have for its mode in a given work area. */
function layoutBounds(w: Win, work: Rect): Win {
  if (w.mode === 'maximized') return { ...w, bounds: { ...work } }
  if (w.mode === 'snapped' && w.snap) {
    const r = zoneRect(work, layoutById(w.snap.layout).zones[w.snap.zone])
    // A zone that became too small for the app's content falls back to floating.
    if (!fits(r, w.min)) {
      const { snap: _drop, ...rest } = w
      return { ...rest, mode: 'floating', bounds: clamp(w.restoreBounds, work) }
    }
    return { ...w, bounds: r }
  }
  if (w.mode === 'floating') return { ...w, bounds: clamp(w.bounds, work) }
  return w
}

/** Remember the floating rectangle before leaving floating mode. */
const rememberFloating = (w: Win): Win => (w.mode === 'floating' ? { ...w, restoreBounds: w.bounds } : w)

export function reduce(s: WmState, a: Action): WmState {
  switch (a.type) {
    case 'open': {
      const existing = findWin(s, a.id)
      if (existing) {
        const shown =
          existing.mode === 'minimized' ? update(s, a.id, (w) => ({ ...w, mode: w.prevMode ?? 'floating' })) : s
        return raise(shown, a.id)
      }
      const min = a.min ?? DEFAULT_MIN
      const bounds = cascade(s.work, a.size ?? DEFAULT_SIZE, s.windows.length)
      const win: Win = a.maximized
        ? {
            id: a.id,
            mode: 'maximized',
            prevMode: 'floating',
            bounds: { ...s.work },
            restoreBounds: bounds,
            z: s.z + 1,
            min,
          }
        : { id: a.id, mode: 'floating', bounds, restoreBounds: bounds, z: s.z + 1, min }
      return { ...s, windows: [...s.windows, win], z: s.z + 1, focused: a.id }
    }

    case 'close': {
      if (!findWin(s, a.id)) return s
      const windows = s.windows.filter((w) => w.id !== a.id)
      const next = { ...s, windows }
      const assist =
        s.assist && s.assist.zones.includes(a.id)
          ? { ...s.assist, zones: s.assist.zones.map((z) => (z === a.id ? null : z)) }
          : s.assist
      return { ...next, assist, focused: s.focused === a.id ? topVisible(next) : s.focused }
    }

    case 'focus': {
      const w = findWin(s, a.id)
      if (!w) return s
      const shown = w.mode === 'minimized' ? update(s, a.id, (x) => ({ ...x, mode: x.prevMode ?? 'floating' })) : s
      if (s.focused === a.id && w.mode !== 'minimized') return s
      return raise(shown, a.id)
    }

    case 'focusNext': {
      const visible = s.windows.filter((w) => w.mode !== 'minimized').sort((a, b) => a.z - b.z)
      if (visible.length < 2) return s
      // Bring the bottom-most window to the top: repeated presses cycle through all of them.
      return raise(s, visible[0].id)
    }

    case 'minimize': {
      const w = findWin(s, a.id)
      if (!w || w.mode === 'minimized') return s
      const next = update(s, a.id, (x) => ({ ...x, prevMode: x.mode as Win['prevMode'], mode: 'minimized' }))
      return { ...next, focused: s.focused === a.id ? topVisible(next, a.id) : s.focused }
    }

    case 'toggleMaximize': {
      const w = findWin(s, a.id)
      if (!w) return s
      if (w.mode === 'maximized') {
        const back = w.prevMode && w.prevMode !== 'maximized' ? w.prevMode : 'floating'
        const restored = update(s, a.id, (x) =>
          layoutBounds({ ...x, mode: back, bounds: back === 'floating' ? x.restoreBounds : x.bounds }, s.work),
        )
        return raise(restored, a.id)
      }
      const maxed = update(s, a.id, (x) => {
        const base = rememberFloating(x)
        return {
          ...base,
          prevMode: base.mode === 'minimized' ? 'floating' : base.mode,
          mode: 'maximized',
          bounds: { ...s.work },
        }
      })
      return raise(maxed, a.id)
    }

    case 'restore': {
      if (!findWin(s, a.id)) return s
      const restored = update(s, a.id, (x) => {
        const { snap: _drop, ...rest } = x
        return { ...rest, mode: 'floating', prevMode: undefined, bounds: clamp(x.restoreBounds, s.work) }
      })
      return raise(restored, a.id)
    }

    case 'move': {
      const w = findWin(s, a.id)
      if (!w) return s
      // Dragging a snapped or maximised window detaches it at its previous floating size.
      const size = w.mode === 'floating' ? w.bounds : w.restoreBounds
      return update(s, a.id, (x) => {
        const { snap: _drop, ...rest } = x
        const bounds = clamp({ x: a.x, y: a.y, w: size.w, h: size.h }, s.work)
        return { ...rest, mode: 'floating', prevMode: undefined, bounds, restoreBounds: bounds }
      })
    }

    case 'snap': {
      const w = findWin(s, a.id)
      if (!w) return s
      const layout = layoutById(a.layout)
      const rect = zoneRect(s.work, layout.zones[a.zone])
      const groupSeq = s.groupSeq + 1
      const group = `g${groupSeq}`
      const snapped = update({ ...s, groupSeq }, a.id, (x) => ({
        ...rememberFloating(x),
        mode: 'snapped',
        prevMode: undefined,
        snap: { layout: a.layout, zone: a.zone, group },
        bounds: rect,
      }))
      const raised = raise(snapped, a.id)
      if (!a.assist) return { ...raised, assist: null }
      // Every layout has more than one zone, so there is always something left to fill.
      const zones = layout.zones.map((_, i) => (i === a.zone ? a.id : null))
      return { ...raised, assist: { layout: a.layout, group, zones } }
    }

    case 'assistFill': {
      if (!s.assist || s.assist.zones[a.zone] !== null || !findWin(s, a.id)) return s
      const { layout, group } = s.assist
      const rect = zoneRect(s.work, layoutById(layout).zones[a.zone])
      const filled = update(s, a.id, (x) => ({
        ...rememberFloating(x.mode === 'minimized' ? { ...x, mode: x.prevMode ?? 'floating' } : x),
        mode: 'snapped',
        prevMode: undefined,
        snap: { layout, zone: a.zone, group },
        bounds: rect,
      }))
      const zones = s.assist.zones.map((z, i) => (i === a.zone ? a.id : z))
      const done = zones.every((z) => z !== null)
      return { ...raise(filled, a.id), assist: done ? null : { ...s.assist, zones } }
    }

    case 'assistDismiss':
      return s.assist ? { ...s, assist: null } : s

    case 'maximizeFloating': {
      if (!s.windows.some((w) => w.mode === 'floating')) return s
      return {
        ...s,
        windows: s.windows.map((w) =>
          w.mode === 'floating'
            ? { ...w, mode: 'maximized', prevMode: 'floating', restoreBounds: w.bounds, bounds: { ...s.work } }
            : w,
        ),
      }
    }

    case 'setWork':
      return { ...s, work: a.work, windows: s.windows.map((w) => layoutBounds(w, a.work)) }
  }
}

export interface Store {
  get(): WmState
  dispatch(a: Action): void
  subscribe(fn: () => void): () => void
}

export function createStore(work: Rect): Store {
  let state = initialState(work)
  const subs = new Set<() => void>()
  return {
    get: () => state,
    dispatch(a) {
      const next = reduce(state, a)
      if (next === state) return
      state = next
      subs.forEach((fn) => fn())
    },
    subscribe(fn) {
      subs.add(fn)
      return () => subs.delete(fn)
    },
  }
}
