import { expect, test, type Page } from '@playwright/test'

const win = (page: Page, app: string) => page.locator(`.win[data-app="${app}"]`)
const box = async (page: Page, app: string) => (await win(page, app).boundingBox())!

async function ready(page: Page, path = '/') {
  await page.goto(path)
  await expect(win(page, 'terminal')).toBeVisible()
}

test.describe('default arrangement', () => {
  for (const [w, h] of [
    [1024, 768],
    [1280, 800],
    [1440, 900],
    [1920, 1080],
  ]) {
    test(`terminal and About are side by side and readable at ${w}×${h}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h })
      await ready(page)
      const t = await box(page, 'terminal')
      const a = await box(page, 'about')
      expect(t.x + t.width).toBeLessThanOrEqual(a.x) // no overlap
      expect(a.x + a.width).toBeLessThanOrEqual(w)
      expect(a.y + a.height).toBeLessThanOrEqual(h)
      expect(a.width).toBeGreaterThanOrEqual(360)
      await expect(win(page, 'about').getByText('Anush Prabhu', { exact: true })).toBeVisible()
    })
  }
})

test('open, focus, minimise and close from shortcuts and panel', async ({ page }) => {
  await ready(page)
  await page
    .getByRole('navigation', { name: 'Desktop shortcuts' })
    .getByRole('button', { name: 'Skills & certs' })
    .click()
  await expect(win(page, 'skills')).toBeVisible()
  await expect(page).toHaveURL(/\/skills$/)
  await expect(win(page, 'skills')).toHaveClass(/focused/)

  await win(page, 'skills')
    .getByRole('button', { name: /Minimise/ })
    .click()
  await expect(win(page, 'skills')).toBeHidden()
  await page
    .getByRole('list', { name: 'Open windows' })
    .getByRole('button', { name: /Skills/ })
    .click()
  await expect(win(page, 'skills')).toBeVisible()

  await win(page, 'skills').getByRole('button', { name: /Close/ }).click()
  await expect(win(page, 'skills')).toHaveCount(0)
})

test('maximise and restore return to the same rectangle', async ({ page }) => {
  await ready(page)
  const before = await box(page, 'about')
  const max = win(page, 'about').getByRole('button', { name: /^Maximise About/ })
  await max.click()
  await expect(win(page, 'about')).toHaveClass(/maximized/)
  await win(page, 'about')
    .getByRole('button', { name: /^Restore About/ })
    .click()
  await expect(win(page, 'about')).not.toHaveClass(/maximized/)
  await expect.poll(() => box(page, 'about')).toEqual(before)
})

test('snap layouts work from the keyboard, with Snap Assist', async ({ page }) => {
  await ready(page)
  await win(page, 'about').click({ position: { x: 200, y: 200 } })
  await page.keyboard.press('Alt+z')
  const menu = page.getByRole('dialog', { name: /Snap layouts for About/ })
  await expect(menu).toBeVisible()
  await menu.getByRole('button', { name: /One large and two stacked: put About in the left half/ }).focus()
  await page.keyboard.press('Enter')
  await expect(menu).toBeHidden()
  await expect(page.getByText('Choose a window for this space')).toHaveCount(2)
  await page
    .getByRole('region', { name: /top right/ })
    .getByRole('button', { name: 'Terminal' })
    .click()
  await page
    .getByRole('region', { name: /bottom right/ })
    .getByRole('button', { name: 'Projects' })
    .click()
  await expect(page.getByText('Choose a window for this space')).toHaveCount(0)
  const a = await box(page, 'about')
  const t = await box(page, 'terminal')
  const p = await box(page, 'projects')
  expect(t.x).toBeGreaterThan(a.x + a.width - 1)
  expect(p.y).toBeGreaterThan(t.y + t.height - 1)
})

test('Esc closes the snap menu and returns focus to the maximise button', async ({ page }) => {
  await ready(page)
  const max = win(page, 'about').getByRole('button', { name: /^Maximise About/ })
  await max.focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('dialog', { name: /Snap layouts/ })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: /Snap layouts/ })).toBeHidden()
  await expect(max).toBeFocused()
})

test('only feasible layouts are offered on a small screen', async ({ page }) => {
  // Work area 932×552: a quarter (462×272) or a third (~305 wide) is below About's 380×300 minimum.
  await page.setViewportSize({ width: 1024, height: 600 })
  await ready(page)
  await win(page, 'about')
    .getByRole('button', { name: /^Maximise About/ })
    .focus()
  await page.keyboard.press('ArrowDown')
  const menu = page.getByRole('dialog', { name: /Snap layouts/ })
  await expect(menu.getByRole('group', { name: 'Halves' })).toBeVisible()
  await expect(menu.getByRole('group', { name: 'Three columns' })).toHaveCount(0)
  await expect(menu.getByRole('group', { name: 'Four quarters' })).toHaveCount(0)
})

test('windows cannot be lost off-screen when the browser shrinks', async ({ page }) => {
  await ready(page)
  const bar = win(page, 'terminal').locator('.tbar')
  const b = (await bar.boundingBox())!
  await page.mouse.move(b.x + 100, b.y + 15)
  await page.mouse.down()
  await page.mouse.move(1400, 880, { steps: 8 })
  await page.mouse.up()
  await page.setViewportSize({ width: 1024, height: 768 })
  await expect
    .poll(async () => {
      const r = (await bar.boundingBox())!
      return r.y >= 32 && r.y + r.height <= 768 && r.x < 1024 - 60 && r.x + r.width > 60
    })
    .toBe(true)
})

test('deep link opens the right window, and Back/Forward follow it', async ({ page }) => {
  await ready(page, '/experience')
  await expect(win(page, 'experience')).toHaveClass(/focused/)
  await page.getByRole('navigation', { name: 'Desktop shortcuts' }).getByRole('button', { name: 'Projects' }).click()
  await expect(page).toHaveURL(/\/projects$/)
  await win(page, 'projects').getByRole('link', { name: 'ICS-Shield' }).click()
  await expect(page).toHaveURL(/\/projects\/ics-shield$/)
  await expect(win(page, 'projects').locator('.h1')).toHaveText('ICS-Shield')
  await page.goBack()
  await expect(page).toHaveURL(/\/projects$/)
  await expect(win(page, 'projects').locator('.h1')).toHaveText('Projects')
  await page.goBack()
  await expect(page).toHaveURL(/\/experience$/)
  await expect(win(page, 'experience')).toHaveClass(/focused/)
  await page.goForward()
  await expect(win(page, 'projects')).toHaveClass(/focused/)
})

test('Ctrl+K searches content and opens the match', async ({ page }) => {
  await ready(page)
  await page.keyboard.press('Control+k')
  const search = page.getByRole('combobox', { name: 'Search apps and content' })
  await expect(search).toBeFocused()
  await search.fill('kerb')
  await expect(page.getByRole('option').first()).toContainText('Bank of America')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/experience#bofa$/)
  await expect(win(page, 'experience')).toHaveClass(/focused/)
})

test.describe('terminal', () => {
  test('clicking a command runs it', async ({ page }) => {
    await ready(page)
    await win(page, 'terminal').getByRole('button', { name: 'skills', exact: true }).click()
    await expect(win(page, 'terminal').getByText('Security and IAM:')).toBeVisible()
  })

  test('typed commands, history and completion', async ({ page }) => {
    await ready(page)
    const input = win(page, 'terminal').getByLabel('Type a command')
    await input.click()
    await input.fill('cert')
    await page.keyboard.press('Tab')
    await expect(input).toHaveValue('certifications ')
    await page.keyboard.press('Enter')
    await expect(win(page, 'terminal').getByText('Certified Ethical Hacker')).toBeVisible()
    await page.keyboard.press('ArrowUp')
    await expect(input).toHaveValue('certifications')
  })

  test('never executes shell syntax or renders HTML', async ({ page }) => {
    await ready(page)
    const input = win(page, 'terminal').getByLabel('Type a command')
    for (const cmd of ['rm -rf /', 'ls; cat /etc/passwd', '$(whoami)', '<img src=x onerror="window.pwned=1">']) {
      await input.fill(cmd)
      await page.keyboard.press('Enter')
    }
    await expect(win(page, 'terminal').getByText(/command not found/)).toHaveCount(4)
    expect(await page.evaluate(() => (window as unknown as { pwned?: number }).pwned)).toBeUndefined()
    await expect(win(page, 'terminal').locator('img')).toHaveCount(0)
  })

  test('open command opens a window', async ({ page }) => {
    await ready(page)
    const input = win(page, 'terminal').getByLabel('Type a command')
    await input.fill('open research')
    await page.keyboard.press('Enter')
    await expect(win(page, 'research')).toBeVisible()
    await expect(page).toHaveURL(/\/research$/)
  })
})

test('plain view is one click away and remembered', async ({ page }) => {
  await ready(page)
  await page.getByRole('button', { name: 'Session menu' }).click()
  await page.getByRole('menuitem', { name: 'Switch to plain view' }).click()
  await expect(page.locator('.desktop')).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1, name: 'Anush Prabhu' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Open desktop view' })).toBeVisible()
  await page.getByRole('button', { name: 'Open desktop view' }).click()
  await expect(win(page, 'terminal')).toBeVisible()
})
