import AxeBuilder from '@axe-core/playwright'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const base = process.env.QA_BASE || 'https://med-handoff-card.sociobot.in'
const evidence = '.factory/qa-evidence/polish-4/live'
const result = { base, checkedAt: new Date().toISOString(), routes: [], cold: {}, demo: {}, mobile: {}, errors: [] }
const browser = await chromium.launch({ headless: true })

function observe(page, requests) {
  page.on('console', message => { if (message.type() === 'error') result.errors.push(message.text()) })
  page.on('pageerror', error => result.errors.push(error.message))
  page.on('request', request => requests.push(request.url()))
}

try {
  await mkdir(evidence, { recursive: true })
  const routeContext = await browser.newContext()
  for (const [path, status, title] of [
    ['/', 200, 'Med Handoff Card — caregiver medication handoffs'],
    ['/demo', 200, 'Demo — Med Handoff Card'],
    ['/privacy', 200, 'Privacy — Med Handoff Card'],
    ['/terms', 200, 'Terms of use — Med Handoff Card'],
    ['/polish-4-missing', 404, 'Page not found — Med Handoff Card']
  ]) {
    const response = await routeContext.request.get(`${base}${path}`)
    assert.equal(response.status(), status)
    const document = await response.text()
    assert.match(document, /<html lang="en">/)
    assert.match(document, new RegExp(`<title>${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</title>`))
    assert.match(document, /social-card\.png/)
    result.routes.push({ path, status, title, socialCard: 'social-card.png' })
  }
  const social = await routeContext.request.get(`${base}/social-card.png`)
  assert.equal(social.status(), 200)
  assert.match(social.headers()['content-type'] || '', /^image\/png(?:;|$)/)
  await routeContext.close()

  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  const page = await desktopContext.newPage()
  const requests = []
  observe(page, requests)
  await page.goto(`${base}/`, { waitUntil: 'networkidle' })
  await assert.doesNotReject(() => page.getByRole('heading', { name: 'Track medication handoffs between family caregivers.' }).waitFor())
  await page.screenshot({ path: `${evidence}/home-cold-desktop.png`, fullPage: true })
  assert.equal(await page.locator('.plain-facts li').count(), 3)
  const socialUrl = `${base}/social-card.png`
  assert.equal(await page.locator('meta[property="og:image"]').getAttribute('content'), socialUrl)
  assert.equal(await page.locator('meta[property="og:image:type"]').getAttribute('content'), 'image/png')
  assert.equal(await page.locator('meta[name="twitter:image"]').getAttribute('content'), socialUrl)
  const socialSize = await page.evaluate(async () => new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error('Social card did not decode'))
    image.src = '/social-card.png'
  }))
  assert.deepEqual(socialSize, { width: 1200, height: 630 })
  await page.getByRole('link', { name: 'Try it with sample data' }).click()
  await page.waitForURL(/\?demo=1$/)
  await page.getByText('Demo — sample data, nothing is saved to your real record').waitFor()
  await page.getByText('Nora Ellis').waitFor()
  assert.equal(await page.locator('#regimen li').count(), 3)
  const bedtime = page.locator('.slot').filter({ has: page.getByRole('heading', { name: 'Bedtime' }) })
  await assert.doesNotReject(() => bedtime.getByText('No doses are scheduled at this time.').waitFor())
  assert.equal(await bedtime.getByText('No current medications at this time.').count(), 0)
  await page.screenshot({ path: `${evidence}/demo-bedtime-desktop.png`, fullPage: true })
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await page.getByText('Nora Ellis').waitFor()
  await page.getByRole('button', { name: 'Start for real' }).click()
  await page.getByRole('heading', { name: 'Track medication handoffs between family caregivers.' }).waitFor()
  assert.equal(await page.getByText('Nora Ellis').count(), 0)
  await page.getByRole('link', { name: 'Privacy' }).first().click()
  await page.getByRole('heading', { name: 'Privacy' }).waitFor()
  assert.equal(await page.getByRole('heading', { name: 'Privacy' }).evaluate(node => node === document.activeElement), true)
  await page.goBack()
  assert.equal(await page.getByRole('heading', { name: 'Track medication handoffs between family caregivers.' }).evaluate(node => node === document.activeElement), true)
  await page.goto(`${base}/demo`, { waitUntil: 'networkidle' })
  const light = await new AxeBuilder({ page }).analyze()
  assert.deepEqual(light.violations.filter(item => ['serious', 'critical'].includes(item.impact)), [])
  await page.getByRole('button', { name: 'Use night view' }).click()
  const dark = await new AxeBuilder({ page }).analyze()
  assert.deepEqual(dark.violations.filter(item => ['serious', 'critical'].includes(item.impact)), [])
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  await desktopContext.setOffline(true)
  await page.reload()
  await page.getByRole('heading', { name: 'Today’s handoff' }).waitFor()
  await page.getByText('Nora Ellis').waitFor()
  await desktopContext.setOffline(false)
  result.cold = { oneClickDemo: true, firstScreenFacts: 3, socialUrl, socialType: social.headers()['content-type'], socialSize, privacyFocus: true, backFocus: true }
  result.demo = {
    banner: true,
    reset: true,
    startForReal: true,
    bedtimeCopy: true,
    oldBedtimeCopyAbsent: true,
    axeSeriousCriticalLight: 0,
    axeSeriousCriticalDark: 0,
    offlineReload: true,
    externalRequests: [...new Set(requests.filter(url => new URL(url).origin !== new URL(base).origin))]
  }
  assert.deepEqual(result.demo.externalRequests, [])
  await desktopContext.close()

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const mobile = await mobileContext.newPage()
  observe(mobile, [])
  await mobile.goto(`${base}/demo`, { waitUntil: 'networkidle' })
  const width = await mobile.evaluate(() => document.documentElement.scrollWidth)
  assert.ok(width <= 390)
  await mobile.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  const zoomWidth = await mobile.evaluate(() => document.documentElement.scrollWidth)
  assert.ok(zoomWidth <= 390)
  await mobile.screenshot({ path: `${evidence}/demo-mobile-200.png`, fullPage: false })
  result.mobile = { width, zoomWidth, noHorizontalOverflow: true }
  await mobileContext.close()

  assert.deepEqual(result.errors, [])
  await writeFile(`${evidence}/live-check.json`, JSON.stringify(result, null, 2))
} catch (error) {
  result.failure = { message: error instanceof Error ? error.message : String(error) }
  await writeFile(`${evidence}/live-check.json`, JSON.stringify(result, null, 2))
  throw error
} finally {
  await browser.close()
}
