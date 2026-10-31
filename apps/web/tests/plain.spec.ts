import { expect, test } from '@playwright/test'

const ROUTES = ['/', '/about', '/experience', '/projects', '/projects/ics-shield', '/research', '/skills', '/contact']

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  for (const route of ROUTES) {
    test(`${route} shows its content as plain HTML`, async ({ page }) => {
      await page.goto(route)
      await expect(page.locator('main#content')).toBeVisible()
      await expect(page.locator('h1')).toHaveCount(1)
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('.desktop')).toHaveCount(0)
    })
  }

  test('canonical URLs are clean and never include campaign parameters', async ({ page }) => {
    await page.goto('/?utm_source=linkedin&utm_campaign=security')
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://anushprabhu.com/')
    await page.goto('/experience')
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://anushprabhu.com/experience')
    await expect(
      page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Experience' }),
    ).toHaveAttribute('aria-current', 'page')
  })
})

test.describe('phone widths get the plain pages, not the desktop', () => {
  // 600 px and wider get the tablet desktop (tests/tablet.spec.ts).
  for (const width of [320, 390, 599]) {
    test(`no desktop and no horizontal scroll at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/experience')
      await expect(page.getByRole('heading', { level: 1, name: 'Experience' })).toBeVisible()
      await expect(page.locator('.desktop')).toHaveCount(0)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }
})
