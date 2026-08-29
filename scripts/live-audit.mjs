import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const [baseUrl, outputDir] = process.argv.slice(2)
if (!baseUrl || !outputDir) throw new Error('Usage: node scripts/live-audit.mjs <base-url> <output-dir>')
await mkdir(outputDir, { recursive: true })

const origin = new URL(baseUrl).origin
const report = { baseUrl: origin, checks: {}, errors: [] }
const browser = await chromium.launch()

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  const consoleErrors = []
  const externalRequests = []
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', error => consoleErrors.push(error.message))
  page.on('request', request => { if (new URL(request.url()).origin !== origin) externalRequests.push(request.url()) })

  await page.goto(`${origin}/`, { waitUntil: 'networkidle' })
  const firstScreen = await page.evaluate(() => ({
    title: document.title,
    headline: document.querySelector('h1')?.textContent?.trim(),
    audience: document.querySelector('.empty-state p:not(.eyebrow)')?.textContent?.trim(),
    copy: document.body.innerText,
    metadata: {
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
      twitterImage: document.querySelector('meta[name="twitter:image"]')?.getAttribute('content')
    }
  }))
  assert.equal(firstScreen.title, 'Med Handoff Card — caregiver medication handoffs')
  assert.equal(firstScreen.headline, 'Track medication handoffs between family caregivers.')
  assert.equal(firstScreen.audience, 'For adult children and home caregivers who need a clear record when another caregiver takes over.')
  assert.ok(!/\bmedicine\b|\bregimen\b|care changes hands|shift card/i.test(firstScreen.copy))
  assert.equal(firstScreen.metadata.canonical, `${origin}/`)
  assert.equal(firstScreen.metadata.ogImage, `${origin}/social-card.png`)
  assert.equal(firstScreen.metadata.twitterImage, `${origin}/social-card.png`)
  await page.screenshot({ path: `${outputDir}/home-cold-desktop.png`, fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: `${outputDir}/home-cold-mobile.png`, fullPage: true })
  const mobile = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth }))
  assert.ok(mobile.width <= mobile.viewport)

  await page.getByRole('link', { name: 'Try it with sample data' }).click()
  assert.match(page.url(), /\?demo=1$/)
  await page.getByText('Demo — sample data, nothing is saved to your real record.').waitFor()
  assert.ok(await page.getByText('Demo actions never change your real record.').isVisible())
  assert.ok(await page.getByRole('button', { name: 'Reset demo' }).isVisible())
  assert.ok(await page.getByRole('button', { name: 'Start for real' }).isVisible())
  assert.ok(await page.getByText('Nora Ellis').isVisible())
  await page.screenshot({ path: `${outputDir}/demo-one-click-mobile.png`, fullPage: true })
  await page.getByRole('button', { name: 'Start for real' }).click()

  await page.setViewportSize({ width: 1280, height: 900 })
  await page.getByRole('button', { name: 'Add your first medication' }).click()
  await page.getByLabel('Medication name').fill('Live audit medication')
  await page.getByLabel('Dose / amount').fill('5 mg')
  await page.getByLabel('Morning').check()
  await page.getByRole('button', { name: 'Save medication' }).click()
  page.once('dialog', dialog => {
    assert.match(dialog.message(), /Remove Live audit medication from the current medication list/)
    void dialog.accept()
  })
  await page.getByRole('button', { name: 'Remove from current list' }).click()
  await page.getByText('Removed from current list').waitFor()
  await page.getByText('Previously listed: 5 mg · Morning.').waitFor()
  assert.ok(!/\bregimen\b/i.test(await page.locator('body').innerText()))

  await page.getByRole('link', { name: 'Privacy' }).first().click()
  assert.equal(await page.title(), 'Privacy — Med Handoff Card')
  assert.equal(await page.getByRole('heading', { name: 'Privacy' }).evaluate(element => document.activeElement === element), true)
  await page.goBack()
  assert.equal(await page.getByRole('heading', { name: 'Today’s handoff' }).evaluate(element => document.activeElement === element), true)
  const normalConsoleErrors = [...consoleErrors]
  assert.deepEqual(normalConsoleErrors, [])

  const missingResponse = await page.request.get(`${origin}/missing-polish-five`)
  assert.equal(missingResponse.status(), 404)
  await page.goto(`${origin}/missing-polish-five`, { waitUntil: 'networkidle' })
  assert.equal(await page.title(), 'Page not found — Med Handoff Card')
  assert.ok(await page.getByRole('heading', { name: 'Page not found.' }).isVisible())

  const demoContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const demoPage = await demoContext.newPage()
  const demoErrors = []
  demoPage.on('console', message => { if (message.type() === 'error') demoErrors.push(message.text()) })
  await demoPage.goto(`${origin}/demo`, { waitUntil: 'networkidle' })
  const lightAxe = await new AxeBuilder({ page: demoPage }).analyze()
  assert.deepEqual(lightAxe.violations.filter(item => item.impact === 'serious' || item.impact === 'critical'), [])
  await demoPage.getByRole('button', { name: 'Use night view' }).click()
  const darkAxe = await new AxeBuilder({ page: demoPage }).analyze()
  assert.deepEqual(darkAxe.violations.filter(item => item.impact === 'serious' || item.impact === 'critical'), [])
  await demoPage.screenshot({ path: `${outputDir}/demo-dark-mobile.png`, fullPage: true })
  await demoPage.getByRole('button', { name: 'Use light view' }).click()
  await demoPage.evaluate(() => navigator.serviceWorker.ready)
  await demoPage.reload()
  await demoPage.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  await demoContext.setOffline(true)
  await demoPage.reload()
  assert.ok(await demoPage.getByText('Nora Ellis').isVisible())
  assert.equal(demoErrors.length, 0)
  await demoContext.close()

  assert.deepEqual(externalRequests, [])
  report.checks = {
    firstScreen,
    mobile,
    oneClickDemo: true,
    removalSafety: true,
    routingFocus: true,
    missingRoute404: true,
    sameOriginRequests: true,
    axe: { lightSeriousOrCritical: 0, darkSeriousOrCritical: 0 },
    offlineReload: true,
    normalConsoleErrors: normalConsoleErrors.length
  }
  await context.close()
} catch (error) {
  report.errors.push(error instanceof Error ? error.stack ?? error.message : String(error))
  throw error
} finally {
  await writeFile(`${outputDir}/live-audit.json`, JSON.stringify(report, null, 2))
  await browser.close()
}

console.log(JSON.stringify(report, null, 2))
