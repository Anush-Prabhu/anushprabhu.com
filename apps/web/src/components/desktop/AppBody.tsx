import { useEffect, useRef, useState } from 'preact/hooks'
import { appForPath, type AppId } from './apps'

/** Rendered page content, keyed by path (without hash). Shared by every window. */
export const contentCache = new Map<string, string>()

const stripHash = (path: string) => path.split('#')[0]

/** Pull the `[data-app-content]` block out of a page and demote its h1 (the desktop has its own). */
export function extractContent(html: string): string | null {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const root = doc.querySelector('[data-app-content]')
  if (!root) return null
  root.querySelectorAll('h1').forEach((h1) => {
    const h2 = doc.createElement('h2')
    h2.className = `h1 ${h1.className}`.trim()
    h2.innerHTML = h1.innerHTML
    h1.replaceWith(h2)
  })
  return root.innerHTML
}

export interface AppBodyProps {
  app: AppId
  path: string
  /** Open another app, or another page inside the same app. */
  onNavigate(app: AppId, path: string): void
}

export function AppBody({ app, path, onNavigate }: AppBodyProps) {
  const key = stripHash(path)
  const [html, setHtml] = useState<string | null>(() => contentCache.get(key) ?? null)
  const [error, setError] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cached = contentCache.get(key)
    if (cached) {
      setHtml(cached)
      return
    }
    setHtml(null)
    setError(false)
    const ctrl = new AbortController()
    fetch(key, { signal: ctrl.signal, headers: { Accept: 'text/html' } })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((text) => {
        const content = extractContent(text)
        if (!content) throw new Error('no content block')
        contentCache.set(key, content)
        setHtml(content)
      })
      .catch((e) => e.name !== 'AbortError' && setError(true))
    return () => ctrl.abort()
  }, [key])

  // Scroll to an anchor (e.g. /experience#bofa) once content is in, otherwise to the top.
  useEffect(() => {
    if (!html || !ref.current) return
    const hash = path.split('#')[1]
    const target = hash ? ref.current.querySelector(`#${CSS.escape(hash)}`) : null
    const scroller = ref.current.parentElement
    if (target) target.scrollIntoView({ block: 'start' })
    else scroller?.scrollTo({ top: 0 })
  }, [html, path])

  const onClick = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest('a')
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const url = new URL(a.href, location.href)
    if (url.origin !== location.origin) {
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      return
    }
    const target = appForPath(url.pathname)
    if (!target) return
    e.preventDefault()
    onNavigate(target, url.pathname + url.hash)
  }

  if (error)
    return (
      <div class="content app-state">
        <p>This window couldn't load its content.</p>
        <p>
          <a href={key}>Open the page directly</a>
        </p>
      </div>
    )
  if (html === null)
    return (
      <div class="content app-state" aria-busy="true">
        <p class="meta">Loading…</p>
      </div>
    )
  return (
    <div
      ref={ref}
      class="content"
      data-app={app}
      onClick={onClick as never}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export function ResumeNotice({ onOpen }: { onOpen(app: AppId): void }) {
  return (
    <div class="content">
      <h2 class="h1" style="font-size:24px">
        Resume
      </h2>
      <p style="margin-top:10px">The downloadable PDF is being prepared, with personal phone details removed.</p>
      <p>Everything on it is already here: experience, projects, skills and certifications.</p>
      <div class="actions">
        <button type="button" class="btn primary" onClick={() => onOpen('experience')}>
          Open Experience
        </button>
        <button type="button" class="btn" onClick={() => onOpen('skills')}>
          Open Skills
        </button>
      </div>
    </div>
  )
}
