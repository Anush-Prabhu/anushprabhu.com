import { describe, expect, it } from 'vitest'
import { appForPath } from './apps'

describe('appForPath', () => {
  it('maps routes to apps, ignoring hash, query, trailing slash and .html', () => {
    expect(appForPath('/')).toBe('about')
    expect(appForPath('/about')).toBe('about')
    expect(appForPath('/experience#bofa')).toBe('experience')
    expect(appForPath('/experience.html')).toBe('experience')
    expect(appForPath('/skills/?utm_campaign=security')).toBe('skills')
    expect(appForPath('/projects/ics-shield')).toBe('projects')
    expect(appForPath('/projects')).toBe('projects')
  })

  it('returns null for unknown paths', () => {
    expect(appForPath('/nope')).toBeNull()
  })
})
