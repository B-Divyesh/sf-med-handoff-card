import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'

test('how-to heading and third step name the caregiver actions', async ({ page }) => {
  await page.goto('/')
  const section = page.locator('.how')
  await expect(section.getByRole('heading', { name: 'Create a medication handoff in three steps' })).toBeVisible()
  await expect(section.locator('li').nth(2)).toContainText('Print, share, or back up the handoff.')
  await expect(section.locator('li').nth(2)).toContainText('Print for the next caregiver, show the QR code in person, or save a backup for yourself.')
  await expect(section).not.toContainText('Hand it over.')
})

test('public footer omits the untestable artwork provenance claim', async ({ page }) => {
  for (const path of ['/', '/demo', '/privacy', '/terms', '/404.html']) {
    await page.goto(path)
    await expect(page.getByRole('contentinfo')).not.toContainText('Original artwork was generated for Med Handoff Card')
  }
})

test('demo Bedtime states that no doses are scheduled, not that medications are absent', async ({ page }) => {
  await page.goto('/demo')
  const bedtime = page.locator('.slot').filter({ has: page.getByRole('heading', { name: 'Bedtime' }) })
  await expect(bedtime).toContainText('No doses are scheduled at this time.')
  await expect(bedtime).not.toContainText('No current medications at this time.')
})

test('every route declares a self-hosted PNG social card', async ({ page, request }) => {
  const socialCard = 'https://med-handoff-card.sociobot.in/social-card.png'
  for (const path of ['/', '/demo', '/privacy', '/terms', '/404.html']) {
    await page.goto(path)
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', socialCard)
    await expect(page.locator('meta[property="og:image:type"]')).toHaveAttribute('content', 'image/png')
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', socialCard)
  }
  const response = await request.get('/social-card.png')
  expect(response.ok()).toBe(true)
  expect(response.headers()['content-type']).toMatch(/^image\/png(?:;|$)/)
  const size = await page.evaluate(async () => new Promise<{ width: number, height: number }>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error('Social card could not be decoded'))
    image.src = '/social-card.png'
  }))
  expect(size).toEqual({ width: 1200, height: 630 })
})

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

test('dark mode has no serious axe findings', async ({ page }) => {
  await page.goto('/demo')
  await page.getByRole('button', { name: 'Use night view' }).click()
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations.filter(item => item.impact === 'serious' || item.impact === 'critical')).toEqual([])
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

test('keyboard reaches and activates Import backup', async ({ page }) => {
  await page.goto('/demo')
  const importButton = page.getByRole('button', { name: 'Import backup', exact: true })
  await page.getByRole('button', { name: 'Export backup' }).focus()
  await page.keyboard.press('Tab')
  await expect(importButton).toBeFocused()
  const chooserPromise = page.waitForEvent('filechooser')
  await page.keyboard.press('Enter')
  const chooser = await chooserPromise
  await chooser.setFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{}') })
  await expect(page.locator('.toast')).toContainText('Could not import that backup')
})

test('invalid backup, blank required fields, dialog naming, and focus recovery are safe', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Add your first medication' }).click()
  await expect(page.getByRole('dialog')).toHaveAccessibleName('Add medication')
  await page.getByLabel('Medication name').fill('   ')
  await page.getByLabel('Dose / amount').fill('   ')
  await page.getByLabel('Morning').check()
  await page.getByRole('button', { name: 'Save medication' }).click()
  await expect(page.locator('.form-error')).toHaveText('Enter a medication name and dose or amount.')
  expect(await page.getByRole('dialog').evaluate(dialog => dialog.open)).toBe(true)
  await page.keyboard.press('Escape')

  await page.locator('#import-file').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{"personName":"QA","shiftNote":"","medications":[{"active":true}],"logs":[]}' ) })
  await expect(page.locator('.toast')).toContainText('Could not import that backup')
  await expect(page.getByRole('heading', { name: 'Track medication handoffs between family caregivers.' })).toBeVisible()

  await page.getByRole('button', { name: 'Add your first medication' }).click()
  await page.getByLabel('Medication name').fill('Focus medicine')
  await page.getByLabel('Dose / amount').fill('5 mg')
  await page.getByLabel('Morning').check()
  await page.getByRole('button', { name: 'Save medication' }).click()
  await expect(page.getByRole('heading', { name: 'Today’s handoff' })).toBeFocused()
})

test('demo appearance preference stays in the demo storage namespace', async ({ page }) => {
  await page.goto('/demo')
  await page.getByRole('button', { name: 'Use night view' }).click()
  expect(await page.evaluate(() => localStorage.getItem('demo:mhc_theme'))).toBe('dark')
  expect(await page.evaluate(() => localStorage.getItem('mhc_theme'))).toBeNull()
  await page.getByRole('button', { name: 'Start for real' }).click()
  expect(await page.evaluate(() => localStorage.getItem('mhc_theme'))).toBeNull()
})

test('static response policy declares CSP, immutable assets, manifest MIME, and a 404', async ({ request }) => {
  const config = JSON.parse(await readFile('public/staticwebapp.config.json', 'utf8'))
  expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'")
  expect(config.routes.find((route: { route: string }) => route.route === '/assets/*').headers['Cache-Control']).toContain('immutable')
  expect(config.mimeTypes['.webmanifest']).toBe('application/manifest+json')
  expect(config.responseOverrides['404']).toMatchObject({ rewrite: '/404.html', statusCode: 404 })
  expect(config.navigationFallback.exclude).toContain('/*')
  expect(config.routes.find((route: { route: string }) => route.route === '/demo').rewrite).toBe('/demo/index.html')
  await expect((await request.get('/robots.txt')).status()).toBe(200)
  await expect((await request.get('/sitemap.xml')).status()).toBe(200)
  await expect((await request.get('/404.html')).status()).toBe(200)
  for (const path of ['/privacy/', '/terms/', '/404.html']) {
    const response = await request.get(path)
    const document = await response.text()
    expect(document).toContain('rel="apple-touch-icon" sizes="180x180"')
    expect(document).toContain('property="og:title"')
    expect(document).toContain('name="twitter:title"')
  }
})

test('real routes update metadata, share chrome, announce navigation, and restore heading focus', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Privacy' }).first().click()
  await expect(page).toHaveURL('/privacy')
  await expect(page.getByRole('heading', { name: 'Privacy' })).toBeFocused()
  await expect(page).toHaveTitle('Privacy — Med Handoff Card')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /delete your local medication record/)
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Privacy — Med Handoff Card')
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', 'Privacy — Med Handoff Card')
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/icons/apple-touch-icon.png')
  await expect(page.getByRole('button', { name: 'Use night view' })).toBeVisible()
  await expect(page.getByRole('contentinfo')).not.toContainText('Original artwork was generated for Med Handoff Card')
  await expect(page.getByRole('contentinfo')).toContainText('The app loads no analytics or code from other sites.')
  await expect(page.locator('.route-status')).toHaveText('Privacy — Med Handoff Card loaded')

  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Track medication handoffs between family caregivers.' })).toBeFocused()
  await page.goForward()
  await expect(page.getByRole('heading', { name: 'Privacy' })).toBeFocused()

  await page.getByRole('link', { name: 'Terms' }).click()
  await expect(page.getByRole('heading', { name: 'Terms of use' })).toBeFocused()
  await expect(page).toHaveTitle('Terms of use — Med Handoff Card')

  await page.goto('/404.html')
  await expect(page.getByRole('heading', { name: 'Page not found.' })).toBeVisible()
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow')
  await expect(page.getByRole('button', { name: 'Use night view' })).toBeVisible()
})

test('mobile navigation and 200 percent text do not overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await page.getByRole('link', { name: 'Privacy' }).first().click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})

test('a waiting service worker is told to activate before the app reloads', async ({ page }) => {
  const workerPath = 'dist/sw.js'
  const original = await readFile(workerPath, 'utf8')
  try {
    await page.goto('/demo')
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.reload()
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
    await writeFile(workerPath, original.replace(/med-handoff-v\d+/, `med-handoff-update-test-${Date.now()}`))
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
