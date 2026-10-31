import { defineCollection } from 'astro:content'
import { file, glob } from 'astro/loaders'
import { z } from 'astro/zod'

const month = z.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM')

const experience = defineCollection({
  loader: file('src/content/experience.json'),
  schema: z.object({
    order: z.number(),
    company: z.string(),
    /** Short name for tight spaces (terminal, home page). */
    short: z.string(),
    role: z.string(),
    focus: z.string(),
    start: month,
    end: month.nullable(),
    points: z.array(z.string()).min(1),
    /** One-line summary drawn from `points`, used on the home page. */
    highlight: z.string(),
    tech: z.array(z.string()),
  }),
})

const skills = defineCollection({
  loader: file('src/content/skills.json'),
  schema: z.object({ order: z.number(), group: z.string(), items: z.array(z.string()).min(1) }),
})

const certifications = defineCollection({
  loader: file('src/content/certifications.json'),
  schema: z.object({
    order: z.number(),
    name: z.string(),
    short: z.string(),
    group: z.enum(['Security', 'Networking', 'CodePath']),
  }),
})

const education = defineCollection({
  loader: file('src/content/education.json'),
  schema: z.object({ order: z.number(), school: z.string(), place: z.string(), degree: z.string(), date: z.string() }),
})

const publications = defineCollection({
  loader: file('src/content/publications.json'),
  schema: z.object({
    title: z.string(),
    status: z.enum(['published', 'submitted', 'preprint', 'ongoing']),
    isbn: z.string().optional(),
    teamSize: z.number().optional(),
  }),
})

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: 'src/content/projects' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    stack: z.array(z.string()),
    repo: z.url().optional(),
    summary: z.string(),
  }),
})

export const collections = { experience, skills, certifications, education, publications, projects }
