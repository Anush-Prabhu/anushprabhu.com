import type { APIRoute } from 'astro'
import { getSiteData } from '../lib/content'

// Content for the phone terminal and search sheets, fetched only when one is opened.
export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await getSiteData()), { headers: { 'Content-Type': 'application/json' } })
