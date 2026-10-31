// Terminal command registry. Pure: takes input + state, returns output lines and an optional effect.
// There is no shell. Input is split into words and matched against this registry, nothing else runs.

import type { SiteData } from '../../../lib/site-data'
import type { AppId } from '../apps'

export type Tone = 'dim' | 'hi' | 'dir' | 'pdf' | 'err' | 'ok' | 'accent'

export type SpanAction =
  { type: 'run'; command: string } | { type: 'open'; app: AppId; path?: string } | { type: 'link'; url: string }

export interface Span {
  text: string
  tone?: Tone
  action?: SpanAction
}
export type Line = Span[]

export type Effect = { type: 'clear' } | { type: 'open'; app: AppId; path?: string } | { type: 'cd'; cwd: string[] }

export interface Result {
  lines: Line[]
  effect?: Effect
}

export interface Ctx {
  data: SiteData
  cwd: string[]
  history: string[]
}

const t = (text: string, tone?: Tone): Span => ({ text, tone })
const run = (command: string, label = command): Span => ({
  text: label,
  tone: 'accent',
  action: { type: 'run', command },
})
const line = (...spans: (Span | string)[]): Line => spans.map((s) => (typeof s === 'string' ? t(s) : s))

/* ---------------- virtual filesystem ---------------- */

type Node =
  | { kind: 'dir'; children: Record<string, Node> }
  | { kind: 'file'; read: (d: SiteData) => Line[]; open?: { app: AppId; path?: string } }

const file = (read: (d: SiteData) => Line[], open?: { app: AppId; path?: string }): Node => ({
  kind: 'file',
  read,
  open,
})

function buildFs(d: SiteData): Node {
  const exp = Object.fromEntries(
    d.experience.map((e) => [
      `${e.id}.txt`,
      file(
        () => [
          line(t(e.role, 'hi'), t(` at ${e.company}`)),
          line(t(`${e.dates}, ${e.focus.toLowerCase()}`, 'dim')),
          ...e.points.map((p) => line(t('- '), t(p))),
          line(t(`tech: ${e.tech.join(', ')}`, 'dim')),
        ],
        { app: 'experience' },
      ),
    ]),
  )
  const proj = Object.fromEntries(
    d.projects.map((p) => [
      `${p.slug}.md`,
      file(
        () => [
          line(t(p.title, 'hi')),
          line(t(`stack: ${p.stack.join(', ')}`, 'dim')),
          line(t(p.summary)),
          p.repo
            ? line(t('code: ', 'dim'), { text: p.repo, tone: 'accent', action: { type: 'link', url: p.repo } })
            : line(t('code: private repository', 'dim')),
        ],
        { app: 'projects', path: `/projects/${p.slug}` },
      ),
    ]),
  )
  return {
    kind: 'dir',
    children: {
      about: {
        kind: 'dir',
        children: {
          'whoami.txt': file((x) => whoami(x), { app: 'about' }),
          'education.txt': file((x) => education(x), { app: 'about' }),
        },
      },
      experience: { kind: 'dir', children: exp },
      projects: { kind: 'dir', children: proj },
      research: { kind: 'dir', children: { 'publications.txt': file((x) => research(x), { app: 'research' }) } },
      skills: {
        kind: 'dir',
        children: {
          'skills.txt': file((x) => skills(x), { app: 'skills' }),
          'certifications.txt': file((x) => certifications(x), { app: 'skills' }),
        },
      },
      contact: { kind: 'dir', children: { 'contact.txt': file((x) => contact(x), { app: 'contact' }) } },
      'resume.pdf': file(() => [line(t('resume.pdf is a PDF. Try "open resume.pdf".', 'dim'))], { app: 'resume' }),
    },
  }
}

/** Resolve a path ("projects/x.md", "../skills", "~/about") against cwd. */
export function resolvePath(root: Node, cwd: string[], path: string): { node: Node | null; parts: string[] } {
  const parts = path.startsWith('~') || path.startsWith('/') ? [] : [...cwd]
  for (const seg of path.replace(/^~\/?|^\/home\/anush\/?|^\//, '').split('/')) {
    if (!seg || seg === '.') continue
    if (seg === '..') parts.pop()
    else parts.push(seg)
  }
  let node: Node | null = root
  for (const seg of parts) {
    node = node.kind === 'dir' ? (node.children[seg] ?? null) : null
    if (!node) break
  }
  return { node, parts }
}

export const displayPath = (cwd: string[]) => (cwd.length ? `~/${cwd.join('/')}` : '~')

/* ---------------- content commands ---------------- */

const whoami = (d: SiteData): Line[] => [
  line(t(d.profile.name, 'hi')),
  line(t(d.profile.headline)),
  line(t(`${d.profile.location}. `, 'dim'), run('open about', 'Open About')),
]

const education = (d: SiteData): Line[] =>
  d.education.map((e) => line(t(e.date.padEnd(10), 'dim'), t(e.degree, 'hi'), t(`, ${e.school}`)))

const experience = (d: SiteData): Line[] => [
  ...d.experience.map((e) =>
    line(
      t(`${e.year}  `, 'dim'),
      { text: e.company, tone: 'hi', action: { type: 'run', command: `cat ~/experience/${e.id}.txt` } },
      t(`  ${e.role.toLowerCase()}`, 'dim'),
    ),
  ),
  line(
    t('Click a company for details, or ', 'dim'),
    run('open experience', 'open the Experience window'),
    t('.', 'dim'),
  ),
]

const projects = (d: SiteData): Line[] => [
  ...d.projects.map((p) =>
    line(
      { text: p.title, tone: 'hi', action: { type: 'open', app: 'projects', path: `/projects/${p.slug}` } },
      t(`  ${p.stack.join(', ')}`, 'dim'),
    ),
  ),
  line(t('Click a project to open it.', 'dim')),
]

const skills = (d: SiteData): Line[] => d.skills.map((s) => line(t(`${s.group}: `, 'dir'), t(s.items.join(', '))))

const certifications = (d: SiteData): Line[] =>
  d.certifications.map((c) => line(t('[✓] ', 'ok'), t(c.name), t(` (${c.short})`, 'dim')))

const research = (d: SiteData): Line[] => [
  ...d.publications.map((p) =>
    line(t(`${p.status}  `, 'dim'), t(p.title, 'hi'), p.isbn ? t(`  ISBN ${p.isbn}`, 'dim') : t('')),
  ),
  line(run('open research', 'Open Research'), t(' for related projects.', 'dim')),
]

const contact = (d: SiteData): Line[] => [
  line(t('linkedin  ', 'dim'), {
    text: d.profile.linkedin,
    tone: 'accent',
    action: { type: 'link', url: d.profile.linkedin },
  }),
  line(t('github    ', 'dim'), {
    text: d.profile.github,
    tone: 'accent',
    action: { type: 'link', url: d.profile.github },
  }),
  d.profile.email
    ? line(t('email     ', 'dim'), {
        text: d.profile.email,
        tone: 'accent',
        action: { type: 'link', url: `mailto:${d.profile.email}` },
      })
    : line(t('email     coming soon', 'dim')),
]

/* ---------------- registry ---------------- */

interface Command {
  summary: string
  run: (args: string[], ctx: Ctx) => Result
}

const APP_NAMES: Record<string, AppId> = {
  about: 'about',
  experience: 'experience',
  projects: 'projects',
  research: 'research',
  skills: 'skills',
  certifications: 'skills',
  contact: 'contact',
  resume: 'resume',
  terminal: 'terminal',
}

export const COMMANDS: Record<string, Command> = {
  help: {
    summary: 'list commands',
    run: () => ({
      lines: [
        ...Object.entries(COMMANDS).map(([name, c]) => line(run(name, name.padEnd(15)), t(c.summary, 'dim'))),
        line(t('Tab completes, ↑ and ↓ browse history, Ctrl+L clears.', 'dim')),
      ],
    }),
  },
  whoami: { summary: 'who I am', run: (_a, c) => ({ lines: whoami(c.data) }) },
  experience: { summary: 'where I have worked', run: (_a, c) => ({ lines: experience(c.data) }) },
  projects: { summary: 'things I have built', run: (_a, c) => ({ lines: projects(c.data) }) },
  research: { summary: 'publication and research work', run: (_a, c) => ({ lines: research(c.data) }) },
  skills: { summary: 'skills by area', run: (_a, c) => ({ lines: skills(c.data) }) },
  certifications: { summary: 'certifications', run: (_a, c) => ({ lines: certifications(c.data) }) },
  contact: { summary: 'how to reach me', run: (_a, c) => ({ lines: contact(c.data) }) },
  resume: {
    summary: 'open the resume',
    run: () => ({ lines: [line(t('Opening Resume…', 'dim'))], effect: { type: 'open', app: 'resume' } }),
  },
  ls: {
    summary: 'list files',
    run: (args, c) => {
      const target = args.find((a) => !a.startsWith('-')) ?? ''
      const { node, parts } = resolvePath(buildFs(c.data), c.cwd, target)
      if (!node) return { lines: [line(t(`ls: cannot access '${target}': no such file or directory`, 'err'))] }
      if (node.kind === 'file') return { lines: [line(t(target))] }
      const entry = (name: string, n: Node): Span => {
        const path = `~/${[...parts, name].join('/')}`
        if (n.kind === 'dir') return { text: `${name}/`, tone: 'dir', action: { type: 'run', command: `ls ${path}` } }
        return {
          text: name,
          tone: name.endsWith('.pdf') ? 'pdf' : undefined,
          action: { type: 'run', command: n.open?.app === 'resume' ? `open ${path}` : `cat ${path}` },
        }
      }
      return {
        lines: [Object.entries(node.children).flatMap(([name, n], i) => [...(i ? [t('  ')] : []), entry(name, n)])],
      }
    },
  },
  cd: {
    summary: 'change directory',
    run: (args, c) => {
      const target = args[0] ?? '~'
      const { node, parts } = resolvePath(buildFs(c.data), c.cwd, target)
      if (!node) return { lines: [line(t(`cd: no such directory: ${target}`, 'err'))] }
      if (node.kind !== 'dir') return { lines: [line(t(`cd: not a directory: ${target}`, 'err'))] }
      return { lines: [], effect: { type: 'cd', cwd: parts } }
    },
  },
  pwd: {
    summary: 'print current directory',
    run: (_a, c) => ({ lines: [line(`/home/anush${c.cwd.length ? '/' + c.cwd.join('/') : ''}`)] }),
  },
  cat: {
    summary: 'print a file',
    run: (args, c) => {
      const target = args[0]
      if (!target) return { lines: [line(t('cat: name a file, for example "cat about/whoami.txt"', 'err'))] }
      const { node } = resolvePath(buildFs(c.data), c.cwd, target)
      if (!node) return { lines: [line(t(`cat: ${target}: no such file`, 'err'))] }
      if (node.kind === 'dir') return { lines: [line(t(`cat: ${target}: is a directory. Try "ls ${target}".`, 'err'))] }
      return { lines: node.read(c.data) }
    },
  },
  open: {
    summary: 'open a window (e.g. open projects)',
    run: (args, c) => {
      const target = args[0]
      if (!target) return { lines: [line(t('open: name an app or file, for example "open experience"', 'err'))] }
      const app = APP_NAMES[target.replace(/\/$/, '')]
      if (app) return { lines: [], effect: { type: 'open', app } }
      const { node, parts } = resolvePath(buildFs(c.data), c.cwd, target)
      if (!node) return { lines: [line(t(`open: ${target}: no such file or app`, 'err'))] }
      if (node.kind === 'dir') {
        const dirApp = APP_NAMES[parts[0]]
        return dirApp
          ? { lines: [], effect: { type: 'open', app: dirApp } }
          : { lines: [line(t(`open: ${target}: nothing to open`, 'err'))] }
      }
      return node.open
        ? { lines: [], effect: { type: 'open', ...node.open } }
        : { lines: [line(t(`open: ${target}: nothing to open`, 'err'))] }
    },
  },
  history: {
    summary: 'commands you have run',
    run: (_a, c) => ({ lines: c.history.map((h, i) => line(t(String(i + 1).padStart(4) + '  ', 'dim'), t(h))) }),
  },
  theme: {
    summary: 'show the colour theme',
    run: () => ({ lines: [line(t('dark'), t('  (the only theme for now)', 'dim'))] }),
  },
  ask: {
    summary: 'ask a question about my work',
    run: () => ({
      lines: [
        line(
          t(
            'Ask Anush is not switched on yet. It will answer questions about my work with links to the source.',
            'dim',
          ),
        ),
        line(t('Until then, try ', 'dim'), run('experience'), t(' or ', 'dim'), run('projects'), t('.', 'dim')),
      ],
    }),
  },
  clear: { summary: 'clear the screen', run: () => ({ lines: [], effect: { type: 'clear' } }) },
}

/** Parse and run one input line. Unknown input is reported, never executed. */
export function execute(input: string, ctx: Ctx): Result {
  const words = input.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return { lines: [] }
  const [name, ...args] = words
  const cmd = Object.hasOwn(COMMANDS, name) ? COMMANDS[name] : undefined
  if (!cmd) {
    return {
      lines: [
        line(t(`command not found: ${name.slice(0, 40)}`, 'err')),
        line(t('Type ', 'dim'), run('help'), t(' to see what you can do.', 'dim')),
      ],
    }
  }
  return cmd.run(args, ctx)
}

/** Tab completion: complete a command name, or a path for commands that take one. */
export function complete(input: string, ctx: Ctx): { value?: string; options?: string[] } {
  const words = input.split(/\s+/)
  if (words.length === 1) {
    const opts = Object.keys(COMMANDS).filter((c) => c.startsWith(words[0]))
    return opts.length === 1 ? { value: `${opts[0]} ` } : { options: opts }
  }
  const partial = words[words.length - 1]
  const slash = partial.lastIndexOf('/')
  const dirPart = slash >= 0 ? partial.slice(0, slash + 1) : ''
  const base = slash >= 0 ? partial.slice(slash + 1) : partial
  const { node } = resolvePath(buildFs(ctx.data), ctx.cwd, dirPart)
  if (!node || node.kind !== 'dir') return {}
  const matches = Object.entries(node.children).filter(([n]) => n.startsWith(base))
  if (matches.length === 1) {
    const [name, n] = matches[0]
    words[words.length - 1] = dirPart + name + (n.kind === 'dir' ? '/' : '')
    return { value: words.join(' ') }
  }
  return { options: matches.map(([n, x]) => n + (x.kind === 'dir' ? '/' : '')) }
}
