import { expect, test } from '@playwright/test'

// Any North American phone-number-shaped text. Deliberately generic: the real number must never appear in this repo.
const PHONE = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/

test.describe('resume', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('shows the full resume from site content, with email and no phone number', async ({ page }) => {
    await page.goto('/resume')
    await expect(page.getByRole('heading', { level: 1, name: 'Anush Prabhu' })).toBeVisible()
    for (const section of [
      'Technical skills',
      'Professional experience',
      'Education',
      'Certifications',
      'Projects and papers',
    ]) {
      await expect(page.getByRole('heading', { level: 2, name: section })).toBeVisible()
    }
    await expect(page.getByRole('link', { name: 'anushprabhu4@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:anushprabhu4@gmail.com',
    )
    expect(await page.locator('body').innerText()).not.toMatch(PHONE)
    await expect(page.getByRole('button', { name: 'Save as PDF' })).toBeVisible()
  })

  test('prints as a clean, black-on-white document', async ({ page }) => {
    await page.goto('/resume')
    await page.emulateMedia({ media: 'print' })
    await expect(page.locator('.plain-header')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Save as PDF' })).toBeHidden()
    const color = await page.locator('main#content .resume-head h1').evaluate((h) => getComputedStyle(h).color)
    expect(color).toBe('rgb(0, 0, 0)')
    const pdf = await page.pdf({ format: 'Letter' })
    expect(pdf.byteLength).toBeGreaterThan(10_000)
  })
})

test('printing from the desktop prints the page content, not the desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/resume')
  await expect(page.locator('.win[data-app="resume"]')).toBeVisible()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.desktop')).toBeHidden()
  await expect(page.locator('main#content .resume-head h1')).toBeVisible()
})

test.describe('contact and information pages', () => {
  test('contact shows the email, LinkedIn and GitHub', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/contact')
    await expect(page.locator('main#content').getByRole('link', { name: /anushprabhu4@gmail\.com/ })).toHaveAttribute(
      'href',
      'mailto:anushprabhu4@gmail.com',
    )
    await expect(page.locator('main#content').getByRole('link', { name: 'Message me on LinkedIn' })).toBeVisible()
  })

  for (const [path, heading] of [
    ['/privacy', 'Privacy'],
    ['/terms', 'Terms of use'],
    ['/accessibility', 'Accessibility'],
  ]) {
    test(`${path} renders and is linked from the footer`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto('/')
      await page
        .getByRole('navigation', { name: 'Site information' })
        .getByRole('link', { name: heading.split(' ')[0] })
        .click()
      await expect(page).toHaveURL(new RegExp(`${path}$`))
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    })
  }

  test('privacy page lists exactly what the browser stores', async ({ page }) => {
    await page.goto('/privacy')
    const text = await page.locator('main#content').innerText()
    for (const key of ['view', 'campaign', 'recent-apps']) expect(text).toContain(key)
    expect(text).toMatch(/no cookies/i)
  })

  test('session menu opens the information pages in the desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Session menu' }).click()
    await page.getByRole('menuitem', { name: 'Accessibility' }).click()
    await expect(page.locator('.win[data-app="accessibility"]')).toBeVisible()
    await expect(page).toHaveURL(/\/accessibility$/)
  })
})

test.describe('search engines and sharing', () => {
  test('sitemap lists every page and project but not the data file', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text()
    for (const p of [
      '/',
      '/about',
      '/experience',
      '/projects',
      '/projects/ics-shield',
      '/research',
      '/skills',
      '/contact',
      '/resume',
      '/privacy',
      '/terms',
      '/accessibility',
    ]) {
      expect(xml).toContain(`<loc>https://anushprabhu.com${p}</loc>`)
    }
    expect(xml).not.toContain('site-data')
    expect(xml).not.toContain('utm_')
  })

  test('robots.txt points to the sitemap', async ({ request }) => {
    const txt = await (await request.get('/robots.txt')).text()
    expect(txt).toContain('Sitemap: https://anushprabhu.com/sitemap.xml')
  })

  test('home page has valid Person and ProfilePage data and a social image', async ({ page, request }) => {
    await page.goto('/')
    const raw = await page.locator('script[type="application/ld+json"]').textContent()
    const graph = JSON.parse(raw!)['@graph'] as { '@type': string; sameAs?: string[]; email?: string }[]
    const person = graph.find((g) => g['@type'] === 'Person')!
    expect(person.email).toBe('mailto:anushprabhu4@gmail.com')
    expect(person.sameAs).toContain('https://github.com/Anush-Prabhu')
    expect(graph.some((g) => g['@type'] === 'ProfilePage')).toBe(true)
    expect(raw).not.toMatch(PHONE)
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://anushprabhu.com/og.png')
    expect((await request.get('/og.png')).headers()['content-type']).toContain('image/png')
  })

  test('public projects describe their source code; private ones do not pretend to', async ({ page }) => {
    await page.goto('/projects/ics-shield')
    const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!)
    expect(data['@type']).toBe('SoftwareSourceCode')
    expect(data.codeRepository).toBe('https://github.com/Anush-Prabhu/ICS-Shield')
    await page.goto('/projects/aptrust')
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0)
  })
})
