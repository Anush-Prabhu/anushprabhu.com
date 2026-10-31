import { describe, expect, it } from 'vitest'
import type { SiteData } from '../../../lib/site-data'
import { complete, execute, type Ctx } from './commands'

const data: SiteData = {
  profile: {
    name: 'Anush Prabhu',
    user: 'anush',
    host: 'portfolio',
    headline: 'Headline',
    location: 'Baltimore, MD',
    email: null,
    github: 'https://github.com/Anush-Prabhu',
    linkedin: 'https://www.linkedin.com/in/anush-prabhu/',
    resumeUrl: null,
  },
  experience: [
    {
      id: 'bofa',
      company: 'Bank of America',
      short: 'Bank of America',
      role: 'Quality Specialist',
      focus: 'IAM',
      dates: 'Jul 2023 – May 2024',
      year: '2023',
      points: ['Automated gMSA'],
      tech: ['Kerberos'],
    },
  ],
  projects: [
    {
      slug: 'ics-shield',
      title: 'ICS-Shield',
      stack: ['Python'],
      summary: 'Game',
      repo: 'https://github.com/Anush-Prabhu/ICS-Shield',
    },
  ],
  skills: [{ group: 'Languages', items: ['Python'] }],
  certifications: [{ name: 'Certified Ethical Hacker', short: 'CEH' }],
  education: [{ degree: 'MSSI', school: 'JHU', date: 'May 2026' }],
  publications: [{ title: 'Paper', status: 'published', isbn: '978' }],
  campaignChips: { general: ['experience'] },
}
const ctx = (over: Partial<Ctx> = {}): Ctx => ({ data, cwd: [], history: [], ...over })
const text = (r: ReturnType<typeof execute>) => r.lines.map((l) => l.map((s) => s.text).join('')).join('\n')

describe('terminal commands', () => {
  it('help lists every command', () => {
    const out = text(execute('help', ctx()))
    for (const c of [
      'whoami',
      'ls',
      'cd',
      'cat',
      'experience',
      'projects',
      'research',
      'skills',
      'certifications',
      'resume',
      'contact',
      'clear',
      'history',
      'theme',
      'ask',
    ]) {
      expect(out).toContain(c)
    }
  })

  it('never runs unknown input, including shell syntax', () => {
    for (const input of [
      'rm -rf /',
      'ls; cat /etc/passwd',
      '$(whoami)',
      '`id`',
      '<img src=x onerror=alert(1)>',
      '__proto__',
      'constructor',
      'toString',
    ]) {
      const r = execute(input, ctx())
      expect(r.effect).toBeUndefined()
      expect(text(r)).toMatch(/command not found/)
    }
  })

  it('ls, cd, pwd and cat walk the virtual filesystem', () => {
    expect(text(execute('ls', ctx()))).toContain('experience/')
    const cd = execute('cd experience', ctx())
    expect(cd.effect).toEqual({ type: 'cd', cwd: ['experience'] })
    expect(text(execute('pwd', ctx({ cwd: ['experience'] })))).toBe('/home/anush/experience')
    expect(text(execute('cat bofa.txt', ctx({ cwd: ['experience'] })))).toContain('Automated gMSA')
    expect(text(execute('cat ../projects/ics-shield.md', ctx({ cwd: ['experience'] })))).toContain('ICS-Shield')
    expect(text(execute('cat nope', ctx()))).toMatch(/no such file/)
    expect(text(execute('cd resume.pdf', ctx()))).toMatch(/not a directory/)
  })

  it('cd .. cannot escape home', () => {
    expect(execute('cd ../../..', ctx({ cwd: ['skills'] })).effect).toEqual({ type: 'cd', cwd: [] })
  })

  it('open maps apps and files to windows', () => {
    expect(execute('open experience', ctx()).effect).toEqual({ type: 'open', app: 'experience' })
    expect(execute('open projects/ics-shield.md', ctx()).effect).toEqual({
      type: 'open',
      app: 'projects',
      path: '/projects/ics-shield',
    })
    expect(execute('open resume.pdf', ctx()).effect).toEqual({ type: 'open', app: 'resume' })
    expect(execute('open certifications', ctx()).effect).toEqual({ type: 'open', app: 'skills' })
  })

  it('contact says the email is coming when there is none', () => {
    expect(text(execute('contact', ctx()))).toContain('coming soon')
  })

  it('ask is an honest stub', () => {
    const r = execute('ask what did you do at Jio?', ctx())
    expect(r.effect).toBeUndefined()
    expect(text(r)).toContain('not switched on yet')
  })

  it('completes commands and paths', () => {
    expect(complete('exp', ctx())).toEqual({ value: 'experience ' })
    expect(complete('c', ctx()).options).toEqual(
      expect.arrayContaining(['cd', 'cat', 'certifications', 'contact', 'clear']),
    )
    expect(complete('cat proj', ctx())).toEqual({ value: 'cat projects/' })
    expect(complete('cat projects/ics', ctx())).toEqual({ value: 'cat projects/ics-shield.md' })
  })
})
