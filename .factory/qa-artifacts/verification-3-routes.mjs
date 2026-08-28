import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'

const base = 'https://med-handoff-card.sociobot.in'
const expected = [
  ['/', 200, 'Med Handoff Card — track caregiver dose handoffs'],
  ['/demo', 200, 'Demo — Med Handoff Card'],
  ['/privacy', 200, 'Privacy — Med Handoff Card'],
  ['/terms', 200, 'Terms — Med Handoff Card'],
  ['/verification-3-missing', 404, 'Page not found — Med Handoff Card']
]
const out = { routes: [], links: [], dateBoundary: {}, errors: [] }
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  page.on('console', message => { if (message.type() === 'error') out.errors.push(`${page.url()}: ${message.text()}`) })
  page.on('pageerror', error => out.errors.push(`${page.url()}: ${error.message}`))
  const hrefs = new Set()
  for (const [path, status, title] of expected) {
    const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle' })
    assert.equal(response.status(), status)
    assert.equal(await page.title(), title)
    assert.equal(await page.locator('html').getAttribute('lang'), 'en')
    assert.equal(await page.locator('h1').count(), 1)
    assert.equal(await page.locator('main').count(), 1)
    assert.equal(await page.locator('.masthead').count(), 1)
    assert.equal(await page.locator('body > footer, #app > footer').count(), 1)
    const axe = await new AxeBuilder({ page }).analyze()
    const blocking = axe.violations.filter(v => ['serious', 'critical'].includes(v.impact))
    assert.deepEqual(blocking, [])
    for (const href of await page.locator('a[href]').evaluateAll(links => links.map(link => link.getAttribute('href')))) hrefs.add(href)
    out.routes.push({ path, status: response.status(), title, h1: await page.locator('h1').innerText(), axeBlocking: blocking.length })
  }
  for (const href of [...hrefs].sort()) {
    if (!href || href.startsWith('#') || href.startsWith('mailto:')) continue
    const url = new URL(href, base)
    if (url.origin !== base) continue
    const response = await context.request.get(url.toString())
    const valid = response.status() >= 200 && response.status() < 400
    assert.equal(valid, true, `${href} returned ${response.status()}`)
    out.links.push({ href, status: response.status() })
  }

  await page.goto(`${base}/`)
  await page.getByRole('button', { name: 'Add your first medication' }).click()
  await page.getByLabel('Medication name').fill('Date-boundary medicine')
  await page.getByLabel('Dose / amount').fill('5 mg')
  await page.getByRole('checkbox', { name: 'Morning' }).check()
  await page.getByRole('button', { name: 'Save medication' }).click()
  await page.getByRole('button', { name: 'Edit' }).click()
  await page.getByLabel('Dose / amount').fill('10 mg')
  await page.getByRole('checkbox', { name: 'Morning' }).uncheck()
  await page.getByRole('checkbox', { name: 'Evening' }).check()
  await page.getByRole('button', { name: 'Save medication' }).click()
  const future = '2099-12-31'
  await page.locator('#date').fill(future)
  out.dateBoundary = {
    selected: await page.locator('#date').inputValue(),
    heading: await page.locator('h1').innerText(),
    updateHeading: await page.locator('#history-heading').innerText(),
    regimenChangeVisible: await page.getByText('Was 5 mg · Morning. Now 10 mg · Evening.').isVisible(),
    futureTakenAllowed: false
  }
  page.once('dialog', dialog => dialog.accept('Marked far in advance'))
  await page.locator('[data-slot="Evening"][data-state="taken"]').click()
  await page.waitForFunction(() => document.querySelector('[data-slot="Evening"][data-state="taken"]')?.getAttribute('aria-pressed') === 'true')
  out.dateBoundary.futureTakenAllowed = await page.locator('[data-slot="Evening"][data-state="taken"]').getAttribute('aria-pressed') === 'true'
  await page.screenshot({ path: '.factory/qa-artifacts/live/future-date.png', fullPage: false })
  out.unexpectedErrors = out.errors.filter(error => !error.includes('/verification-3-missing: Failed to load resource'))
  assert.deepEqual(out.unexpectedErrors, [])
  await context.close()
  await writeFile('.factory/qa-artifacts/live/verification-3-routes.json', JSON.stringify(out, null, 2))
} finally {
  await browser.close()
}
