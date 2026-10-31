import { defineConfig } from 'astro/config'
import preact from '@astrojs/preact'

export default defineConfig({
  site: 'https://anushprabhu.com',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [preact()],
})
