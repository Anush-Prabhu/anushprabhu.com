import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { search, type SearchItem } from './search'
import { Icon } from './Icon'

export interface LauncherProps {
  index: SearchItem[]
  onOpen(item: SearchItem): void
  onClose(): void
  /** `sheet`: fills a phone sheet instead of floating over the desktop. */
  variant?: 'overlay' | 'sheet'
}

export function Launcher(p: LauncherProps) {
  const [query, setQuery] = useState('')
  const [sel, setSel] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const hits = useMemo(() => search(p.index, query), [p.index, query])
  const empty = !query.trim()
  /** Set when an item is opened: focus then belongs to the new window, not to whatever had it before. */
  const opened = useRef(false)

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    input.current?.focus()
    return () => {
      if (!opened.current) prev?.focus?.({ preventScroll: true })
    }
  }, [])

  const open = (item: SearchItem) => {
    opened.current = true
    p.onOpen(item)
  }
  useEffect(() => setSel(0), [query])

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      p.onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSel((s) => Math.min(s + 1, hits.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSel((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter' && hits[sel]) {
      e.preventDefault()
      open(hits[sel].item)
    } else if (e.key === 'Tab') {
      e.preventDefault()
    }
  }

  return (
    <div
      class={`pal-wrap${p.variant === 'sheet' ? ' sheet' : ''}`}
      onPointerDown={(e) => e.target === e.currentTarget && p.onClose()}
    >
      <div
        class="palette"
        // Inside a phone sheet the sheet is already the dialog; don't nest a second one.
        role={p.variant === 'sheet' ? undefined : 'dialog'}
        aria-modal={p.variant === 'sheet' ? undefined : 'true'}
        aria-label={p.variant === 'sheet' ? undefined : 'Search apps and content'}
        onKeyDown={onKey as never}
      >
        <div class="pal-in">
          <Icon name="search" />
          <input
            ref={input}
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            placeholder="Search apps, companies, skills…"
            aria-label="Search apps and content"
            role="combobox"
            aria-expanded="true"
            aria-controls="pal-list"
            aria-activedescendant={hits[sel] ? `pal-${sel}` : undefined}
            autocomplete="off"
            spellcheck={false}
          />
          <kbd>Esc</kbd>
        </div>
        <ul class="pal-list" id="pal-list" role="listbox" aria-label={empty ? 'Apps' : 'Results'}>
          {hits.length === 0 && (
            <li class="pal-empty" role="presentation">
              Nothing matches “{query.trim()}”. Try a company, a skill or a project name.
            </li>
          )}
          {hits.map((h, i) => (
            <li
              key={h.item.key}
              id={`pal-${i}`}
              role="option"
              aria-selected={i === sel}
              class={i === sel ? 'pi sel' : 'pi'}
              onPointerMove={() => setSel(i)}
              onClick={() => open(h.item)}
            >
              <span class="ic">
                <Icon name={h.item.icon} />
              </span>
              <span class="pi-text">
                <b>{h.item.title}</b>
                <span class="d">
                  {h.snippet ? (
                    <>
                      {h.snippet[0]}
                      <mark>{h.snippet[1]}</mark>
                      {h.snippet[2]}
                    </>
                  ) : (
                    h.item.description
                  )}
                </span>
              </span>
              {i === sel && <kbd>Enter</kbd>}
            </li>
          ))}
        </ul>
        <div class="pal-foot">
          <span>
            <kbd>↑ ↓</kbd> choose
          </span>
          <span>
            <kbd>Enter</kbd> open
          </span>
          <span>
            <kbd>Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  )
}
