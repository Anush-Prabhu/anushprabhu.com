import { getCollection } from 'astro:content'
import { profile } from '../data/profile'
import type { SiteData } from './site-data'

const byOrder = <T extends { data: { order: number } }>(a: T, b: T) => a.data.order - b.data.order

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const formatMonth = (ym: string | null): string => {
  if (!ym) return 'present'
  const [y, m] = ym.split('-').map(Number)
  return `${MONTHS[m - 1]} ${y}`
}
export const formatRange = (start: string, end: string | null) => `${formatMonth(start)} – ${formatMonth(end)}`

export const getExperience = async () => (await getCollection('experience')).sort(byOrder)
export const getSkills = async () => (await getCollection('skills')).sort(byOrder)
export const getCertifications = async () => (await getCollection('certifications')).sort(byOrder)
export const getEducation = async () => (await getCollection('education')).sort(byOrder)
export const getPublications = async () => getCollection('publications')
export const getProjects = async () => (await getCollection('projects')).sort(byOrder)

/** Everything the desktop island needs (terminal output, launcher search), as plain serialisable data. */
export async function getSiteData(): Promise<SiteData> {
  const [experience, projects, skills, certifications, education, publications] = await Promise.all([
    getExperience(),
    getProjects(),
    getSkills(),
    getCertifications(),
    getEducation(),
    getPublications(),
  ])
  return {
    profile: {
      name: profile.name,
      user: profile.user,
      host: profile.host,
      headline: profile.headline,
      location: profile.location,
      email: profile.email,
      github: profile.github,
      linkedin: profile.linkedin,
      resumeUrl: profile.resumeUrl,
    },
    experience: experience.map((e) => ({
      id: e.id,
      company: e.data.company,
      role: e.data.role,
      focus: e.data.focus,
      dates: formatRange(e.data.start, e.data.end),
      year: e.data.start.slice(0, 4),
      points: e.data.points,
      tech: e.data.tech,
    })),
    projects: projects.map((p) => ({
      slug: p.id,
      title: p.data.title,
      stack: p.data.stack,
      summary: p.data.summary,
      repo: p.data.repo ?? null,
    })),
    skills: skills.map((s) => ({ group: s.data.group, items: s.data.items })),
    certifications: certifications.map((c) => ({ name: c.data.name, short: c.data.short })),
    education: education.map((e) => ({ degree: e.data.degree, school: e.data.school, date: e.data.date })),
    publications: publications.map((p) => ({ title: p.data.title, status: p.data.status, isbn: p.data.isbn ?? null })),
  }
}
