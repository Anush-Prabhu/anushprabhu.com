import { defineConfig } from 'astro/config'
import preact from '@astrojs/preact'

export default defineConfig({
  site: 'https://anushprabhu.com',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [preact()],
  // The dev toolbar overlays the phone dock; it never ships to production either way.
  devToolbar: { enabled: false },
})
