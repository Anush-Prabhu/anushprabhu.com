import { useEffect, useRef, useState } from 'preact/hooks'
import type { SiteData } from '../../lib/site-data'
import { complete, displayPath, execute, type Effect, type Line, type SpanAction } from './terminal/commands'

const DEFAULT_CHIPS = ['experience', 'projects', 'skills', 'research', 'contact', 'resume']
const TYPE_MS = 28

type Entry = { kind: 'cmd'; cwd: string[]; text: string } | { kind: 'out'; line: Line } | { kind: 'welcome' }

export interface TerminalProps {
  data: SiteData
  active: boolean
  onEffect(effect: Exclude<Effect, { type: 'clear' } | { type: 'cd' }>): void
  onLink(url: string): void
  /** Phone layout: commands and prompt pinned at the bottom; the keyboard is not opened automatically. */
  docked?: boolean
  /** Suggested commands (they vary by campaign). */
  chips?: string[]
}

function Prompt({ cwd, user, host }: { cwd: string[]; user: string; host: string }) {
  return (
    <div aria-hidden="true">
      <span class="pf">┌──(</span>
      <span class="pu">
        {user}㉿{host}
      </span>
      <span class="pf">)-[</span>
      <span class="pp">{displayPath(cwd)}</span>
      <span class="pf">]</span>
    </div>
  )
}

export function Terminal(p: TerminalProps) {
  const { user, host } = p.data.profile
  const [entries, setEntries] = useState<Entry[]>([{ kind: 'welcome' }])
  const [cwd, setCwd] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [hIdx, setHIdx] = useState(-1)
  const [typing, setTyping] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const state = useRef({ cwd, history })
  state.current = { cwd, history }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [entries, input])

  useEffect(() => {
    if (p.active && !p.docked) inputRef.current?.focus({ preventScroll: true })
  }, [p.active])

  const runCommand = (text: string) => {
    const { cwd: c, history: h } = state.current
    const trimmed = text.trim()
    const nextHistory = trimmed ? [...h, trimmed] : h
    const result = execute(text, { data: p.data, cwd: c, history: nextHistory })
    setHistory(nextHistory)
    setHIdx(-1)
    if (result.effect?.type === 'clear') {
      setEntries([])
      return
    }
    setEntries((e) => [
      ...e,
      { kind: 'cmd', cwd: c, text },
      ...result.lines.map((line) => ({ kind: 'out' as const, line })),
    ])
    if (result.effect?.type === 'cd') setCwd(result.effect.cwd)
    else if (result.effect) p.onEffect(result.effect)
  }

  /** Type a command visibly, then run it, so people who click see what a command looks like. */
  const typeAndRun = (command: string) => {
    if (typing) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setInput('')
      runCommand(command)
      return
    }
    setTyping(true)
    let i = 0
    const step = () => {
      i++
      setInput(command.slice(0, i))
      if (i < command.length) window.setTimeout(step, TYPE_MS)
      else
        window.setTimeout(() => {
          setInput('')
          setTyping(false)
          runCommand(command)
          inputRef.current?.focus({ preventScroll: true })
        }, 120)
    }
    step()
  }

  const onAction = (a: SpanAction) => {
    if (a.type === 'run') typeAndRun(a.command)
    else if (a.type === 'open') p.onEffect({ type: 'open', app: a.app, path: a.path })
    else p.onLink(a.url)
  }

  const onKey = (e: KeyboardEvent) => {
    if (typing) {
      e.preventDefault()
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const text = input
      setInput('')
      runCommand(text)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const r = complete(input, { data: p.data, cwd, history })
      if (r.value !== undefined) setInput(r.value)
      else if (r.options?.length)
        setEntries((x) => [
          ...x,
          { kind: 'cmd', cwd, text: input },
          { kind: 'out', line: [{ text: r.options!.join('   '), tone: 'dim' }] },
        ])
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!history.length) return
      const i = hIdx < 0 ? history.length - 1 : Math.max(0, hIdx - 1)
      setHIdx(i)
      setInput(history[i])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (hIdx < 0) return
      const i = hIdx + 1
      setHIdx(i >= history.length ? -1 : i)
      setInput(i >= history.length ? '' : history[i])
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setEntries([])
    } else if (e.key === 'c' && e.ctrlKey && !window.getSelection()?.toString()) {
      e.preventDefault()
      setEntries((x) => [...x, { kind: 'cmd', cwd, text: `${input}^C` }])
      setInput('')
    }
  }

  const focusInput = (e: MouseEvent) => {
    if (!window.getSelection()?.toString() && !(e.target as HTMLElement).closest('button, a')) inputRef.current?.focus()
  }

  const chips = (
    <div class="chips" role="group" aria-label="Suggested commands">
      {(p.chips ?? DEFAULT_CHIPS).map((c) => (
        <button type="button" class="chip" key={c} onClick={() => typeAndRun(c)} disabled={typing}>
          {c}
        </button>
      ))}
    </div>
  )

  const log = (
    <div role="log" aria-live="polite" aria-label="Terminal output">
      {entries.map((entry, i) => {
        if (entry.kind === 'welcome')
          return (
            <div key={i} class="welcome">
              <p class="dim">
                Welcome. This works like a Kali terminal, but you never have to type: {p.docked ? 'tap' : 'click'} a
                command and it runs. Type <span class="hi">help</span> for the full list.
              </p>
              {!p.docked && chips}
            </div>
          )
        if (entry.kind === 'cmd')
          return (
            <div key={i} class="cmd-echo">
              <Prompt cwd={entry.cwd} user={user} host={host} />
              <div>
                <span class="pf" aria-hidden="true">
                  └─
                </span>
                <span class="pu" aria-hidden="true">
                  {'$ '}
                </span>
                <span class="visually-hidden">Command: </span>
                {entry.text}
              </div>
            </div>
          )
        return (
          <div key={i} class="out">
            {entry.line.map((s, j) =>
              s.action ? (
                <button
                  type="button"
                  key={j}
                  class={`term-link t-${s.tone ?? 'accent'}`}
                  onClick={() => onAction(s.action!)}
                >
                  {s.text}
                </button>
              ) : (
                <span key={j} class={s.tone ? `t-${s.tone}` : undefined}>
                  {s.text}
                </span>
              ),
            )}
          </div>
        )
      })}
    </div>
  )

  const prompt = (
    <div class="cmd-echo live">
      <Prompt cwd={cwd} user={user} host={host} />
      <label class="input-row">
        <span class="pf" aria-hidden="true">
          └─
        </span>
        <span class="pu" aria-hidden="true">
          {'$ '}
        </span>
        <span class="visually-hidden">Type a command</span>
        <input
          ref={inputRef}
          value={input}
          onInput={(e) => setInput((e.target as HTMLInputElement).value)}
          onKeyDown={onKey as never}
          spellcheck={false}
          autocapitalize="off"
          autocomplete="off"
          enterkeyhint="send"
          readOnly={typing}
        />
      </label>
    </div>
  )

  // Docked (phone): output scrolls above; suggested commands and the prompt stay pinned above the keyboard.
  if (p.docked)
    return (
      <div class="terminal docked">
        <div class="term-scroll" ref={scrollRef} onClick={focusInput as never}>
          {log}
        </div>
        <div class="term-foot">
          {chips}
          {prompt}
        </div>
      </div>
    )

  return (
    <div class="terminal" ref={scrollRef} onClick={focusInput as never}>
      {log}
      {prompt}
    </div>
  )
}
