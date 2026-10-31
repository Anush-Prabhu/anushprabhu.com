export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Size {
  w: number
  h: number
}

/** Space between snapped windows and between windows and the work-area edge. */
export const GAP = 8
/** Height of a window title bar; the bar must always stay reachable. */
export const TITLEBAR_H = 34
/** How much of a window must stay on-screen horizontally so it can be grabbed. */
const GRAB_MARGIN = 120
export const DEFAULT_MIN: Size = { w: 360, h: 280 }

export type LayoutId = 'halves' | 'two-thirds' | 'main-stack' | 'quadrants' | 'thirds' | 'stacked'

export interface Layout {
  id: LayoutId
  label: string
  /** Zones as fractions of the work area. */
  zones: Rect[]
  /** Zone names for screen readers, same order as `zones`. */
  zoneLabels: string[]
  /** Only offered on tall work areas (portrait tablets), where side-by-side doesn't fit. */
  portraitOnly?: boolean
}

/** A work area counts as portrait when it is nearly as tall as it is wide, or taller. */
export const isPortrait = (work: Rect) => work.h >= work.w * 0.9

export const LAYOUTS: Layout[] = [
  {
    id: 'halves',
    label: 'Halves',
    zones: [
      { x: 0, y: 0, w: 1 / 2, h: 1 },
      { x: 1 / 2, y: 0, w: 1 / 2, h: 1 },
    ],
    zoneLabels: ['left half', 'right half'],
  },
  {
    id: 'two-thirds',
    label: 'Two-thirds and one-third',
    zones: [
      { x: 0, y: 0, w: 2 / 3, h: 1 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
    ],
    zoneLabels: ['left two-thirds', 'right third'],
  },
  {
    id: 'main-stack',
    label: 'One large and two stacked',
    zones: [
      { x: 0, y: 0, w: 1 / 2, h: 1 },
      { x: 1 / 2, y: 0, w: 1 / 2, h: 1 / 2 },
      { x: 1 / 2, y: 1 / 2, w: 1 / 2, h: 1 / 2 },
    ],
    zoneLabels: ['left half', 'top right', 'bottom right'],
  },
  {
    id: 'quadrants',
    label: 'Four quarters',
    zones: [
      { x: 0, y: 0, w: 1 / 2, h: 1 / 2 },
      { x: 1 / 2, y: 0, w: 1 / 2, h: 1 / 2 },
      { x: 0, y: 1 / 2, w: 1 / 2, h: 1 / 2 },
      { x: 1 / 2, y: 1 / 2, w: 1 / 2, h: 1 / 2 },
    ],
    zoneLabels: ['top left', 'top right', 'bottom left', 'bottom right'],
  },
  {
    id: 'thirds',
    label: 'Three columns',
    zones: [
      { x: 0, y: 0, w: 1 / 3, h: 1 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
    ],
    zoneLabels: ['left third', 'middle third', 'right third'],
  },
  {
    id: 'stacked',
    label: 'Top and bottom',
    zones: [
      { x: 0, y: 0, w: 1, h: 3 / 5 },
      { x: 0, y: 3 / 5, w: 1, h: 2 / 5 },
    ],
    zoneLabels: ['top', 'bottom'],
    portraitOnly: true,
  },
]

export const layoutById = (id: LayoutId): Layout => {
  const layout = LAYOUTS.find((l) => l.id === id)
  if (!layout) throw new Error(`Unknown layout: ${id}`)
  return layout
}

const EPS = 1e-6

/** Pixel rectangle of one zone, with half a gap on every inner edge. */
export function zoneRect(work: Rect, frac: Rect, gap = GAP): Rect {
  const left = work.x + frac.x * work.w
  const top = work.y + frac.y * work.h
  const right = work.x + (frac.x + frac.w) * work.w
  const bottom = work.y + (frac.y + frac.h) * work.h
  const l = frac.x > EPS ? left + gap / 2 : left
  const t = frac.y > EPS ? top + gap / 2 : top
  const r = frac.x + frac.w < 1 - EPS ? right - gap / 2 : right
  const b = frac.y + frac.h < 1 - EPS ? bottom - gap / 2 : bottom
  return { x: Math.round(l), y: Math.round(t), w: Math.round(r - l), h: Math.round(b - t) }
}

export const fits = (r: Rect, min: Size): boolean => r.w >= min.w && r.h >= min.h

/** A layout is offered only if every zone can hold a window of `min` size in the current work area. */
export function isFeasible(layout: Layout, work: Rect, min: Size = DEFAULT_MIN): boolean {
  if (layout.portraitOnly && !isPortrait(work)) return false
  return layout.zones.every((z) => fits(zoneRect(work, z), min))
}

export const feasibleLayouts = (work: Rect, min: Size = DEFAULT_MIN): Layout[] =>
  LAYOUTS.filter((l) => isFeasible(l, work, min))

/** Keep a floating window inside the work area enough that its title bar can always be grabbed. */
export function clamp(r: Rect, work: Rect): Rect {
  const w = Math.min(r.w, work.w)
  const h = Math.min(r.h, work.h)
  const minX = work.x - w + GRAB_MARGIN
  const maxX = work.x + work.w - GRAB_MARGIN
  const minY = work.y
  const maxY = work.y + work.h - TITLEBAR_H
  return {
    x: Math.round(Math.min(Math.max(r.x, minX), maxX)),
    y: Math.round(Math.min(Math.max(r.y, minY), maxY)),
    w: Math.round(w),
    h: Math.round(h),
  }
}

/** Default floating position: centred, cascading by `index`. */
export function cascade(work: Rect, size: Size, index: number): Rect {
  const w = Math.min(size.w, work.w - 2 * GAP)
  const h = Math.min(size.h, work.h - 2 * GAP)
  const step = (index % 6) * 28
  return clamp(
    {
      x: work.x + Math.round((work.w - w) / 2) - 70 + step,
      y: work.y + Math.round((work.h - h) / 2) - 40 + step,
      w,
      h,
    },
    work,
  )
}
