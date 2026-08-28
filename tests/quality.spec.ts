import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'

test('desktop and mobile have one heading, no console errors, and no serious axe findings', async ({ browser }) => {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    const errors: string[] = []
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('/demo')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://med-handoff-card.sociobot.in/demo')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations.filter(item => item.impact === 'serious' || item.impact === 'critical')).toEqual([])
    expect(errors).toEqual([])
    await context.close()
  }
})

test('390px interactive targets are at least 44 by 44 CSS pixels', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/demo')
  const undersized = await page.locator('a,button,input:not([type="hidden"]),textarea,label.file-label').evaluateAll(elements => elements.filter(element => {
    const node = element as HTMLElement
    const style = getComputedStyle(node)
    if (style.display === 'none' || style.visibility === 'hidden') return false
    const rect = node.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)
  }).map(element => ({ text: (element.textContent || (element as HTMLInputElement).ariaLabel || '').trim(), rect: element.getBoundingClientRect().toJSON() })))
  expect(undersized).toEqual([])
})

test('keyboard opens the medication dialog, focuses its label, and announces errors', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Add your first medication' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('Medication name')).toBeFocused()
  await page.getByLabel('Medication name').fill('Test medicine')
  await page.getByLabel('Dose / amount').fill('10 mg')
  await page.getByRole('button', { name: 'Save medication' }).click()
  await expect(page.locator('.form-error')).toHaveText('Choose at least one time of day.')
  await expect(page.locator('.form-error')).toHaveAttribute('aria-live', 'assertive')
})

test('static response policy declares CSP, immutable assets, manifest MIME, and a 404', async ({ request }) => {
  const config = JSON.parse(await readFile('public/staticwebapp.config.json', 'utf8'))
  expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'")
  expect(config.routes.find((route: { route: string }) => route.route === '/assets/*').headers['Cache-Control']).toContain('immutable')
  expect(config.mimeTypes['.webmanifest']).toBe('application/manifest+json')
  expect(config.responseOverrides['404']).toMatchObject({ rewrite: '/404.html', statusCode: 404 })
  expect(config.navigationFallback.exclude).toContain('/*')
  expect(config.routes.find((route: { route: string }) => route.route === '/demo').rewrite).toBe('/index.html')
  await expect((await request.get('/robots.txt')).status()).toBe(200)
  await expect((await request.get('/sitemap.xml')).status()).toBe(200)
  await expect((await request.get('/404.html')).status()).toBe(200)
})

test('a waiting service worker is told to activate before the app reloads', async ({ page }) => {
  const workerPath = 'dist/sw.js'
  const original = await readFile(workerPath, 'utf8')
  try {
    await page.goto('/demo')
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.reload()
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
    await writeFile(workerPath, original.replace("med-handoff-v2", `med-handoff-v2-test-${Date.now()}`))
    await page.evaluate(async () => { const registration = await navigator.serviceWorker.getRegistration(); await registration?.update() })
    await expect(page.getByRole('button', { name: 'Install update' })).toBeVisible()
    const loaded = page.waitForEvent('load')
    await page.getByRole('button', { name: 'Install update' }).click()
    await loaded
    await expect(page.getByRole('heading', { name: 'Today’s handoff' })).toBeVisible()
  } finally {
    await writeFile(workerPath, original)
  }
})
