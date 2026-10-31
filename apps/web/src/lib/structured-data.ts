// JSON-LD for search engines. Only types backed by real content on the page (docs/MILESTONE_1.md §9).
import { site, profile } from '../data/profile'

export const PERSON_ID = `${site.url}/#person`

export function personGraph(opts: { skills: string[]; education: { school: string }[] }): Record<string, unknown> {
  const person = {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: profile.name,
    url: site.url,
    description: profile.headline,
    ...(profile.email ? { email: `mailto:${profile.email}` } : {}),
    address: { '@type': 'PostalAddress', addressLocality: 'Baltimore', addressRegion: 'MD', addressCountry: 'US' },
    alumniOf: opts.education.map((e) => ({ '@type': 'CollegeOrUniversity', name: e.school })),
    knowsAbout: opts.skills,
    sameAs: [profile.github, profile.linkedin],
  }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      person,
      {
        '@type': 'WebSite',
        '@id': `${site.url}/#website`,
        url: site.url,
        name: site.title,
        publisher: { '@id': PERSON_ID },
      },
      { '@type': 'ProfilePage', '@id': `${site.url}/#profile`, url: site.url, mainEntity: { '@id': PERSON_ID } },
    ],
  }
}

export const sourceCode = (p: { title: string; summary: string; repo: string; stack: string[]; url: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareSourceCode',
  name: p.title,
  description: p.summary,
  url: p.url,
  codeRepository: p.repo,
  keywords: p.stack.join(', '),
  author: { '@type': 'Person', '@id': PERSON_ID, name: profile.name },
})

export const scholarlyArticle = (a: { title: string; isbn?: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'ScholarlyArticle',
  headline: a.title,
  author: { '@type': 'Person', '@id': PERSON_ID, name: profile.name },
  ...(a.isbn ? { isPartOf: { '@type': 'Book', isbn: a.isbn } } : {}),
})

/** Safe to inline in <script type="application/ld+json">: no "</script>" break-out. */
export const toJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\u003c')
