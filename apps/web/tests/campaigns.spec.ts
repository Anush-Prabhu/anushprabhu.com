import { expect, test, type Page } from '@playwright/test'

const lede = (page: Page) => page.locator('main#content .lede').first()
const GENERAL = 'I secure identity, detection and AI systems, and automate the work around them.'

test.describe('campaign-aware home page (plain view)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('a known campaign changes the intro, featured work and call to action', async ({ page }) => {
    await page.goto('/?utm_source=linkedin&utm_campaign=security')
    await expect(lede(page)).toHaveText(
      'I build detection pipelines and identity automation that hold up in production.',
    )
    await expect(page.getByRole('link', { name: 'See my security work' })).toBeVisible()
    const recent = page.locator('main#content [data-campaign-slot="featured"] h3')
    await expect(recent.first()).toHaveText('Jio Platforms')
  })

  test('campaign values are case-insensitive', async ({ page }) => {
    await page.goto('/?utm_campaign=Product')
    await expect(lede(page)).toContainText('founded and ran a web platforms firm')
  })

  for (const [label, query] of [
    ['missing', '/'],
    ['unknown', '/?utm_campaign=spring-sale'],
    ['unsafe', '/?utm_campaign=%3Cscript%3Ealert(1)%3C%2Fscript%3E'],
    ['prototype key', '/?utm_campaign=__proto__'],
  ]) {
    test(`${label} campaign falls back to the general intro`, async ({ page }) => {
      await page.goto(query)
      await expect(lede(page)).toHaveText(GENERAL)
    })
  }

  test('the campaign is remembered for the session, and a new tag replaces it', async ({ page }) => {
    await page.goto('/?utm_campaign=research')
    await page.goto('/experience')
    await page.goto('/')
    await expect(lede(page)).toContainText('grounded in their sources')
    await page.goto('/?utm_campaign=unknown-thing')
    await expect(lede(page)).toHaveText(GENERAL)
  })

  test('search engines see one canonical page and the general content', async ({ page }) => {
    await page.goto('/?utm_campaign=security')
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://anushprabhu.com/')
    const html = await (await page.request.get('/?utm_campaign=security')).text()
    expect(html).toContain(`<p class="lede">${GENERAL}</p>`)
  })

  test('campaign variants never add content the general page does not have', async ({ page }) => {
    await page.goto('/')
    const companies = await page
      .locator('main#content template')
      .evaluateAll((ts) =>
        ts.flatMap((t) =>
          Array.from((t as HTMLTemplateElement).content.querySelectorAll('h3')).map((h) => h.textContent),
        ),
      )
    const experience = await (await page.request.get('/site-data.json')).json()
    const known = new Set([
      ...experience.experience.map((e: { short: string }) => e.short),
      ...experience.projects.map((p: { title: string }) => p.title),
    ])
    for (const c of companies) expect(known.has(c)).toBe(true)
  })
})

test.describe('campaigns on the desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('the About window and terminal follow the campaign', async ({ page }) => {
    await page.goto('/?utm_campaign=security')
    const about = page.locator('.win[data-app="about"]')
    await expect(about.locator('.lede')).toHaveText(
      'I build detection pipelines and identity automation that hold up in production.',
    )
    await expect(
      page.locator('.win[data-app="terminal"]').getByRole('button', { name: 'certifications', exact: true }),
    ).toBeVisible()
  })
})
