import type { SiteData } from '../../lib/site-data'
import { APPS, SHORTCUTS, type AppId, type IconName } from './apps'

export interface SearchItem {
  key: string
  title: string
  /** Text searched and used for the snippet. */
  body: string
  /** Shown when the query is empty or matches the title. */
  description: string
  icon: IconName
  app: AppId
  path?: string
}

export function buildIndex(d: SiteData): SearchItem[] {
  const apps = SHORTCUTS.map((id) => ({
    key: `app:${id}`,
    title: APPS[id].title,
    body: '',
    description: APPS[id].description,
    icon: APPS[id].icon,
    app: id,
  }))
  const experience = d.experience.map((e) => ({
    key: `exp:${e.id}`,
    title: e.company,
    body: [e.role, e.focus, ...e.points, ...e.tech].join(' · '),
    description: `${e.role}, ${e.dates}`,
    icon: 'briefcase' as const,
    app: 'experience' as const,
    path: `/experience#${e.id}`,
  }))
  const projects = d.projects.map((p) => ({
    key: `proj:${p.slug}`,
    title: p.title,
    body: [p.summary, ...p.stack].join(' · '),
    description: p.summary,
    icon: 'folder' as const,
    app: 'projects' as const,
    path: `/projects/${p.slug}`,
  }))
  const skills = d.skills.map((s) => ({
    key: `skill:${s.group}`,
    title: s.group,
    body: s.items.join(', '),
    description: s.items.join(', '),
    icon: 'award' as const,
    app: 'skills' as const,
  }))
  const certs = d.certifications.map((c) => ({
    key: `cert:${c.short}`,
    title: c.name,
    body: c.short,
    description: 'Certification',
    icon: 'award' as const,
    app: 'skills' as const,
  }))
  const pubs = d.publications.map((p) => ({
    key: `pub:${p.title}`,
    title: p.title,
    body: `publication ${p.status} ${p.isbn ?? ''}`,
    description: 'Publication',
    icon: 'research' as const,
    app: 'research' as const,
  }))
  return [...apps, ...experience, ...projects, ...skills, ...certs, ...pubs]
}

export interface Hit {
  item: SearchItem
  /** Snippet split around the match, for highlighting. */
  snippet: [before: string, match: string, after: string] | null
}

const SNIPPET = 70

export function search(index: SearchItem[], query: string, limit = 8): Hit[] {
  const q = query.trim().toLowerCase()
  if (!q) return index.filter((i) => i.key.startsWith('app:')).map((item) => ({ item, snippet: null }))
  const hits: (Hit & { score: number })[] = []
  for (const item of index) {
    const t = item.title.toLowerCase().indexOf(q)
    if (t >= 0) {
      hits.push({ item, snippet: null, score: t === 0 ? 0 : 1 })
      continue
    }
    const b = item.body.toLowerCase().indexOf(q)
    if (b < 0) continue
    const start = Math.max(0, b - SNIPPET / 2)
    const end = Math.min(item.body.length, b + q.length + SNIPPET / 2)
    hits.push({
      item,
      score: 2,
      snippet: [
        (start > 0 ? '…' : '') + item.body.slice(start, b),
        item.body.slice(b, b + q.length),
        item.body.slice(b + q.length, end) + (end < item.body.length ? '…' : ''),
      ],
    })
  }
  return hits.sort((a, b) => a.score - b.score).slice(0, limit)
}
