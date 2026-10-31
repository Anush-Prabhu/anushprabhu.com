import { CAMPAIGNS, GENERAL, type Campaign } from '../data/campaigns'

/** Characters allowed in a campaign value; anything else falls back to the general intro. */
const SAFE = /^[a-z0-9_-]{1,40}$/

/** `utm_campaign` value → campaign id. Only the lookup table is shipped to the browser. */
export const campaignLookup = (campaigns: Campaign[] = CAMPAIGNS): Record<string, string> =>
  Object.fromEntries(campaigns.flatMap((c) => c.match.map((m) => [m, c.id])))

/** Resolve a raw `utm_campaign` value. Unknown, missing or unsafe values give the general campaign. */
export function resolveCampaign(raw: string | null | undefined, lookup = campaignLookup()): string {
  if (!raw) return GENERAL
  const value = raw.trim().toLowerCase()
  if (!SAFE.test(value)) return GENERAL
  return Object.hasOwn(lookup, value) ? lookup[value] : GENERAL
}

export interface ContentIds {
  experience: string[]
  projects: string[]
  routes: string[]
}

/** Throws if a campaign refers to content or pages that don't exist. Runs on every build. */
export function validateCampaigns(campaigns: Campaign[], ids: ContentIds): void {
  const problems: string[] = []
  const seenMatch = new Map<string, string>()
  if (!campaigns.some((c) => c.id === GENERAL)) problems.push(`missing the "${GENERAL}" campaign`)
  for (const c of campaigns) {
    for (const e of c.featuredExperience)
      if (!ids.experience.includes(e)) problems.push(`${c.id}: unknown experience "${e}"`)
    for (const p of c.featuredProjects) if (!ids.projects.includes(p)) problems.push(`${c.id}: unknown project "${p}"`)
    if (!ids.routes.includes(c.primaryCta.href.split('#')[0]))
      problems.push(`${c.id}: CTA links to unknown page "${c.primaryCta.href}"`)
    for (const m of c.match) {
      if (!SAFE.test(m)) problems.push(`${c.id}: match value "${m}" must be lower-case letters, digits, - or _`)
      const other = seenMatch.get(m)
      if (other) problems.push(`"${m}" selects both ${other} and ${c.id}`)
      seenMatch.set(m, c.id)
    }
  }
  if (problems.length) throw new Error(`Invalid campaign config:\n- ${problems.join('\n- ')}`)
}
