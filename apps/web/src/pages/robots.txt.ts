import type { APIRoute } from 'astro'
import { site } from '../data/profile'

export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\nDisallow: /site-data.json\n\nSitemap: ${site.url}/sitemap.xml\n`, {
    headers: { 'Content-Type': 'text/plain' },
  })
