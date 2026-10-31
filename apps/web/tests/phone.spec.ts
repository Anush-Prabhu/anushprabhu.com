import { devices, expect, test, type Page } from '@playwright/test'

test.use({ ...devices['iPhone 13'], browserName: 'chromium' })

const dock = (page: Page) => page.getByRole('navigation', { name: 'Phone apps' })
const sheet = (page: Page, name: string) => page.getByRole('dialog', { name, exact: true })

test('home is an app grid with a dock, and no desktop loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Anush Prabhu' })).toBeVisible()
  const grid = page.getByRole('navigation', { name: 'Apps' })
  for (const app of ['About', 'Experience', 'Projects', 'Research', 'Skills', 'Contact']) {
    await expect(grid.getByRole('link', { name: app })).toBeVisible()
  }
  await expect(dock(page)).toBeVisible()
  await expect(page.locator('.desktop')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0)
})

test('apps open full-screen with a back bar, and Back returns home', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Apps' }).getByRole('link', { name: 'Experience' }).tap()
  await expect(page).toHaveURL(/\/experience$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Experience' })).toBeVisible()
  await page.getByRole('link', { name: 'Back to home' }).tap()
  await expect(page).toHaveURL(/\/$/)
})

test('the back bar sits directly under the status bar, also while scrolling', async ({ page }) => {
  await page.goto('/experience')
  for (const y of [0, 600]) {
    await page.evaluate((top) => window.scrollTo(0, top), y)
    const header = (await page.locator('.plain-header').boundingBox())!
    const bar = (await page.locator('.frame-bar').boundingBox())!
    expect(Math.abs(bar.y - (header.y + header.height))).toBeLessThanOrEqual(1)
  }
})

test('touch targets in the dock and grid are at least 44px', async ({ page }) => {
  await page.goto('/')
  const targets = page.locator('.m-dock > *, .m-app .tile, .m-icon, .m-search')
  const count = await targets.count()
  expect(count).toBeGreaterThan(8)
  for (let i = 0; i < count; i++) {
    const b = (await targets.nth(i).boundingBox())!
    expect(Math.min(b.width, b.height), `target ${i}`).toBeGreaterThanOrEqual(44)
  }
})

test('terminal sheet: tap a command, follow a result, Back closes the sheet', async ({ page }) => {
  await page.goto('/')
  await dock(page).getByRole('button', { name: 'Terminal' }).tap()
  const term = sheet(page, 'Terminal')
  await expect(term).toBeVisible()
  await expect(page).toHaveURL(/#terminal$/)
  // The keyboard is not opened automatically.
  await expect(term.getByLabel('Type a command')).not.toBeFocused()
  await term.getByRole('button', { name: 'projects', exact: true }).tap()
  await expect(term.getByRole('button', { name: 'ICS-Shield' })).toBeVisible()
  await page.goBack()
  await expect(term).toBeHidden()
  await expect(page).toHaveURL(/\/$/)
})

test('terminal sheet links navigate to the page', async ({ page }) => {
  await page.goto('/')
  await dock(page).getByRole('button', { name: 'Terminal' }).tap()
  const term = sheet(page, 'Terminal')
  const input = term.getByLabel('Type a command')
  await input.fill('open skills')
  await input.press('Enter')
  await expect(page).toHaveURL(/\/skills$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/$/) // the #terminal entry was dropped before navigating
})

test('search sheet finds content and opens it', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Search my work' }).tap()
  const search = sheet(page, 'Search')
  await expect(search).toBeVisible()
  await search.getByRole('combobox').fill('wazuh')
  await expect(search.getByRole('option').first()).toContainText('Jio Platforms')
  await search.getByRole('option').first().tap()
  await expect(page).toHaveURL(/\/experience#jio$/)
})

test('recent sheet lists pages visited in this session', async ({ page }) => {
  await page.goto('/research')
  await page.goto('/contact')
  await dock(page).getByRole('button', { name: 'Recent' }).tap()
  const recent = sheet(page, 'Recent')
  await expect(recent.getByRole('link', { name: /Research/ })).toBeVisible()
  await expect(recent.getByRole('link', { name: /Contact/ })).toHaveAttribute('aria-current', 'page')
  await recent.getByRole('link', { name: /Research/ }).tap()
  await expect(page).toHaveURL(/\/research$/)
})

test('landscape phone keeps the phone layout', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await page.goto('/projects')
  await expect(page.locator('.desktop')).toHaveCount(0)
  await expect(dock(page)).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0)
})

test('the terminal JavaScript loads only when the terminal is opened', async ({ page }) => {
  const scripts: string[] = []
  page.on('request', (r) => r.resourceType() === 'script' && scripts.push(r.url()))
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const before = scripts.length
  await dock(page).getByRole('button', { name: 'Terminal' }).tap()
  await expect(sheet(page, 'Terminal')).toBeVisible()
  expect(scripts.length).toBeGreaterThan(before)
})
