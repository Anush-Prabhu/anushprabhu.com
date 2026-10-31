// Campaign-aware introductions for the home page (docs/MILESTONE_1.md §11.1).
// A campaign only re-words the intro and re-orders existing content. It refers to experience and projects by id, and
// the build fails if an id doesn't exist (lib/campaigns.ts), so a campaign can never add a fact that isn't in content.
// Headlines are placeholder copy built from resume wording, pending the owner's own words.
import { profile } from './profile'

export interface Campaign {
  id: string
  /** `utm_campaign` values (lower-case) that select this campaign. */
  match: string[]
  headline: string
  featuredExperience: string[]
  featuredProjects: string[]
  primaryCta: { label: string; href: string }
  /** Suggested commands shown in the terminal. */
  terminalChips: string[]
}

export const GENERAL = 'general'

export const CAMPAIGNS: Campaign[] = [
  {
    id: GENERAL,
    match: [],
    headline: profile.headline,
    featuredExperience: ['bofa', 'jio', 'jhmi'],
    featuredProjects: ['guardrailed-rag', 'asa-ftd-scanner'],
    primaryCta: { label: 'See my experience', href: '/experience' },
    terminalChips: ['experience', 'projects', 'skills', 'research', 'contact', 'resume'],
  },
  {
    id: 'security',
    match: ['security', 'cybersecurity', 'detection', 'iam'],
    headline: 'I build detection pipelines and identity automation that hold up in production.',
    featuredExperience: ['jio', 'bofa', 'jhh'],
    featuredProjects: ['asa-ftd-scanner', 'provenance-guard'],
    primaryCta: { label: 'See my security work', href: '/experience' },
    terminalChips: ['experience', 'skills', 'certifications', 'projects', 'contact', 'resume'],
  },
  {
    id: 'research',
    match: ['research', 'academic'],
    headline: 'I work on AI systems that stay grounded in their sources, and on keeping research data private.',
    featuredExperience: ['jhmi', 'jhh'],
    featuredProjects: ['guardrailed-rag', 'takemeter'],
    primaryCta: { label: 'See my research', href: '/research' },
    terminalChips: ['research', 'projects', 'experience', 'skills', 'contact', 'resume'],
  },
  {
    id: 'product',
    match: ['product', 'pm', 'product-manager'],
    headline: 'I founded and ran a web platforms firm, and I build secure systems from requirements to delivery.',
    featuredExperience: ['prabhutech', 'bofa', 'jhmi'],
    featuredProjects: ['formidable-list-view', 'guardrailed-rag'],
    primaryCta: { label: 'See my experience', href: '/experience' },
    terminalChips: ['experience', 'projects', 'skills', 'contact', 'resume'],
  },
]
