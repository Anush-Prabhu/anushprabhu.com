import { devices, expect, test, type Page } from '@playwright/test'

test.use({ ...devices['iPad Mini'], browserName: 'chromium' })

const win = (page: Page, app: string) => page.locator(`.win[data-app="${app}"]`)
const box = async (page: Page, app: string) => (await win(page, app).boundingBox())!

test('portrait tablet: About stacked above Terminal, no shortcut rail', async ({ page }) => {
  await page.goto('/')
  await expect(win(page, 'terminal')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Desktop shortcuts' })).toHaveCount(0)
  const a = await box(page, 'about')
  const t = await box(page, 'terminal')
  expect(a.y + a.height).toBeLessThanOrEqual(t.y)
  expect(a.width).toBeGreaterThan(700)
  expect(a.height).toBeGreaterThan(t.height)
})

test('landscape tablet: Terminal and About side by side', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 700 })
  await page.goto('/')
  const t = await box(page, 'terminal')
  const a = await box(page, 'about')
  expect(t.x + t.width).toBeLessThanOrEqual(a.x)
})

test('new windows open full-screen and cannot be dragged', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Apps/ }).tap()
  await page.getByRole('combobox').fill('skills')
  await page.keyboard.press('Enter')
  await expect(win(page, 'skills')).toHaveClass(/maximized/)
  const before = await box(page, 'skills')
  const bar = win(page, 'skills').locator('.tbar')
  const b = (await bar.boundingBox())!
  await page.mouse.move(b.x + 200, b.y + 20)
  await page.mouse.down()
  await page.mouse.move(b.x + 20, b.y + 300, { steps: 6 })
  await page.mouse.up()
  expect(await box(page, 'skills')).toEqual(before)
})

test('tapping maximise opens the layout menu with full screen and portrait layouts', async ({ page }) => {
  await page.goto('/')
  await win(page, 'about').getByRole('button', { name: 'Layout and full screen for About' }).tap()
  const menu = page.getByRole('dialog', { name: /Snap layouts for About/ })
  await expect(menu.getByRole('button', { name: 'Full screen' })).toBeVisible()
  await expect(menu.getByRole('group', { name: 'Top and bottom' })).toBeVisible()
  await expect(menu.getByRole('group', { name: 'Halves' })).toHaveCount(0)
  await menu.getByRole('button', { name: 'Full screen' }).tap()
  await expect(win(page, 'about')).toHaveClass(/maximized/)
})

test('rotating keeps every window on screen and usable', async ({ page }) => {
  await page.goto('/')
  await page.setViewportSize({ width: 1000, height: 700 })
  await page.setViewportSize({ width: 768, height: 1024 })
  for (const app of ['terminal', 'about']) {
    const r = await box(page, app)
    expect(r.x).toBeGreaterThanOrEqual(0)
    expect(r.x + r.width).toBeLessThanOrEqual(768)
    expect(r.y + r.height).toBeLessThanOrEqual(1024)
    expect(r.width).toBeGreaterThanOrEqual(360)
  }
})

test('window and panel controls are touch-sized', async ({ page }) => {
  await page.goto('/')
  const targets = page.locator('.panel .pbtn, .panel .task, .win .ctl button')
  const count = await targets.count()
  for (let i = 0; i < count; i++) {
    const b = (await targets.nth(i).boundingBox())!
    expect(Math.min(b.width, b.height), `target ${i}`).toBeGreaterThanOrEqual(40)
  }
})

test('shrinking a desktop window to phone width swaps to the phone layout', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/experience')
  await expect(win(page, 'experience')).toBeVisible()
  await page.setViewportSize({ width: 390, height: 800 })
  await expect(page.locator('.desktop')).toBeHidden()
  await expect(page.getByRole('heading', { level: 1, name: 'Experience' })).toBeVisible()
  await page.setViewportSize({ width: 1280, height: 800 })
  await expect(win(page, 'experience')).toBeVisible()
})
