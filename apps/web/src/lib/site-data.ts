// Serialisable content handed to the desktop island. Built at build time by `getSiteData()`.

export interface SiteData {
  profile: {
    name: string
    user: string
    host: string
    headline: string
    location: string
    email: string | null
    github: string
    linkedin: string
    resumeUrl: string | null
  }
  experience: {
    id: string
    company: string
    short: string
    role: string
    focus: string
    dates: string
    year: string
    points: string[]
    tech: string[]
  }[]
  projects: { slug: string; title: string; stack: string[]; summary: string; repo: string | null }[]
  skills: { group: string; items: string[] }[]
  certifications: { name: string; short: string }[]
  education: { degree: string; school: string; date: string }[]
  publications: { title: string; status: string; isbn: string | null }[]
  /** Suggested terminal commands per campaign id. */
  campaignChips: Record<string, string[]>
}
