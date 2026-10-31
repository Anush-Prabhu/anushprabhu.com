import type { Size } from '../../lib/wm/geometry'

export type AppId =
  | 'terminal'
  | 'about'
  | 'experience'
  | 'projects'
  | 'research'
  | 'skills'
  | 'contact'
  | 'resume'
  | 'privacy'
  | 'terms'
  | 'accessibility'

export type IconName = 'terminal' | 'user' | 'briefcase' | 'folder' | 'research' | 'award' | 'mail' | 'file'

export interface AppDef {
  id: AppId
  title: string
  /** Short label for shortcuts and the panel. */
  label: string
  icon: IconName
  /** Page that holds this app's content; null for apps with no page (the terminal). */
  route: string | null
  /** Launcher description in plain language. */
  description: string
  min: Size
  size: Size
}

export const APPS: Record<AppId, AppDef> = {
  terminal: {
    id: 'terminal',
    title: 'Terminal',
    label: 'Terminal',
    icon: 'terminal',
    route: null,
    description: 'Explore by clicking or typing commands',
    min: { w: 420, h: 260 },
    size: { w: 720, h: 480 },
  },
  about: {
    id: 'about',
    title: 'About',
    label: 'About',
    icon: 'user',
    route: '/about',
    description: 'Who I am, in one page',
    min: { w: 380, h: 300 },
    size: { w: 760, h: 620 },
  },
  experience: {
    id: 'experience',
    title: 'Experience',
    label: 'Experience',
    icon: 'briefcase',
    route: '/experience',
    description: 'Five roles, 2019 to now',
    min: { w: 400, h: 300 },
    size: { w: 820, h: 640 },
  },
  projects: {
    id: 'projects',
    title: 'Projects',
    label: 'Projects',
    icon: 'folder',
    route: '/projects',
    description: 'Seven builds, with code where it is public',
    min: { w: 380, h: 300 },
    size: { w: 780, h: 620 },
  },
  research: {
    id: 'research',
    title: 'Research',
    label: 'Research',
    icon: 'research',
    route: '/research',
    description: 'Publication and research-oriented projects',
    min: { w: 380, h: 280 },
    size: { w: 720, h: 520 },
  },
  skills: {
    id: 'skills',
    title: 'Skills and certifications',
    label: 'Skills & certs',
    icon: 'award',
    route: '/skills',
    description: 'CEH, CHFI, CCNA, CyberOps, DevNet and more',
    min: { w: 400, h: 300 },
    size: { w: 780, h: 600 },
  },
  contact: {
    id: 'contact',
    title: 'Contact',
    label: 'Contact',
    icon: 'mail',
    route: '/contact',
    description: 'LinkedIn and GitHub',
    min: { w: 360, h: 260 },
    size: { w: 600, h: 420 },
  },
  resume: {
    id: 'resume',
    title: 'Resume',
    label: 'Resume',
    icon: 'file',
    route: '/resume',
    description: 'Printable, and saves as a PDF',
    min: { w: 400, h: 300 },
    size: { w: 820, h: 680 },
  },
  privacy: {
    id: 'privacy',
    title: 'Privacy',
    label: 'Privacy',
    icon: 'file',
    route: '/privacy',
    description: 'What this site stores and why',
    min: { w: 380, h: 300 },
    size: { w: 720, h: 600 },
  },
  terms: {
    id: 'terms',
    title: 'Terms',
    label: 'Terms',
    icon: 'file',
    route: '/terms',
    description: 'Terms of use',
    min: { w: 380, h: 280 },
    size: { w: 680, h: 520 },
  },
  accessibility: {
    id: 'accessibility',
    title: 'Accessibility',
    label: 'Accessibility',
    icon: 'file',
    route: '/accessibility',
    description: 'How this site is built to be usable by everyone',
    min: { w: 380, h: 300 },
    size: { w: 720, h: 600 },
  },
}

/** Desktop shortcuts, in display order. */
export const SHORTCUTS: AppId[] = [
  'about',
  'experience',
  'projects',
  'research',
  'skills',
  'contact',
  'resume',
  'terminal',
]

/** Plain-view navigation (no-JS and narrow screens). */
export const NAV = [
  { label: 'About', route: '/about' },
  { label: 'Experience', route: '/experience' },
  { label: 'Projects', route: '/projects' },
  { label: 'Research', route: '/research' },
  { label: 'Skills', route: '/skills' },
  { label: 'Contact', route: '/contact' },
  { label: 'Resume', route: '/resume' },
]

/** Pages reachable from the session menu, footer and search, but not shortcuts. */
export const INFO_APPS: AppId[] = ['privacy', 'terms', 'accessibility']

/** Which app shows a given path. `/` is the About app's home variant. */
export function appForPath(path: string): AppId | null {
  const p =
    path
      .split(/[?#]/)[0]
      .replace(/\.html$/, '')
      .replace(/\/$/, '') || '/'
  if (p === '/' || p === '/about') return 'about'
  if (p === '/projects' || p.startsWith('/projects/')) return 'projects'
  const hit = (Object.values(APPS) as AppDef[]).find((a) => a.route === p)
  return hit?.id ?? null
}
