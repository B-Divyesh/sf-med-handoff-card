import { chromium } from 'playwright'
import { writeFile } from 'node:fs/promises'

const base = 'https://med-handoff-card.sociobot.in'
const browser = await chromium.launch({ headless: true })
const result = { errors: [] }
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  page.on('pageerror', error => result.errors.push(error.message))
  await page.goto(`${base}/demo`)
  await page.evaluate(() => navigator.serviceWorker.ready)
  result.controlledBeforeOffline = await page.evaluate(() => Boolean(navigator.serviceWorker.controller))
  await page.waitForTimeout(500)
  await context.setOffline(true)
  try {
    await page.goto(`${base}/demo?first-visit-offline=1`, { waitUntil: 'domcontentloaded', timeout: 10_000 })
    result.loaded = await page.getByRole('heading', { name: 'Today’s handoff' }).isVisible()
    result.sampleVisible = await page.getByText('Nora Ellis').isVisible()
  } catch (error) {
    result.loaded = false
    result.navigationError = error.message
  }
  await writeFile('.factory/qa-artifacts/live/verification-3-first-visit-offline.json', JSON.stringify(result, null, 2))
  await context.close()
} finally {
  await browser.close()
}
