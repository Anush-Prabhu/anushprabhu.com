import { defineConfig, devices } from '@playwright/test'

// Runs against the production build (astro preview), the same files that get deployed.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4323',
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4323',
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
