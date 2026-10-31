import { describe, expect, it } from 'vitest'
import { CAMPAIGNS, GENERAL, type Campaign } from '../data/campaigns'
import { campaignLookup, resolveCampaign, validateCampaigns } from './campaigns'

const ids = {
  experience: ['jhh', 'jio', 'jhmi', 'bofa', 'prabhutech'],
  projects: [
    'guardrailed-rag',
    'asa-ftd-scanner',
    'provenance-guard',
    'aptrust',
    'takemeter',
    'formidable-list-view',
    'ics-shield',
  ],
  routes: ['/', '/about', '/experience', '/projects', '/research', '/skills', '/contact', '/resume'],
}

describe('resolveCampaign', () => {
  it('matches known campaigns, case-insensitively', () => {
    expect(resolveCampaign('security')).toBe('security')
    expect(resolveCampaign('Security')).toBe('security')
    expect(resolveCampaign(' research ')).toBe('research')
    expect(resolveCampaign('pm')).toBe('product')
  })

  it('falls back to general for missing, unknown and unsafe values', () => {
    for (const raw of [
      null,
      undefined,
      '',
      'spring-sale',
      '<script>alert(1)</script>',
      '../../etc',
      'a'.repeat(41),
      '__proto__',
      'constructor',
    ]) {
      expect(resolveCampaign(raw)).toBe(GENERAL)
    }
  })
})

describe('validateCampaigns', () => {
  it('accepts the real campaign config', () => {
    expect(() => validateCampaigns(CAMPAIGNS, ids)).not.toThrow()
  })

  it('rejects references to content that does not exist', () => {
    const bad: Campaign = {
      ...CAMPAIGNS[0],
      id: 'bad',
      match: ['bad'],
      featuredExperience: ['google'],
      featuredProjects: ['made-up'],
    }
    expect(() => validateCampaigns([...CAMPAIGNS, bad], ids)).toThrow(
      /unknown experience "google"[\s\S]*unknown project "made-up"/,
    )
  })

  it('rejects CTAs to unknown pages, unsafe match values and duplicate matches', () => {
    const bad: Campaign = {
      ...CAMPAIGNS[0],
      id: 'bad',
      match: ['Security!', 'security'],
      primaryCta: { label: 'x', href: '/nowhere' },
    }
    expect(() => validateCampaigns([...CAMPAIGNS, bad], ids)).toThrow(
      /unknown page[\s\S]*lower-case[\s\S]*selects both/,
    )
  })

  it('requires a general campaign', () => {
    expect(() =>
      validateCampaigns(
        CAMPAIGNS.filter((c) => c.id !== GENERAL),
        ids,
      ),
    ).toThrow(/general/)
  })

  it('only the match table is needed in the browser', () => {
    expect(campaignLookup()).toMatchObject({ security: 'security', research: 'research', product: 'product' })
  })
})
