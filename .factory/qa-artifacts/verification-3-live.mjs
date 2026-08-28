import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'

const base = 'https://med-handoff-card.sociobot.in'
const results = { base, checkedAt: new Date().toISOString(), scenarios: {}, defects: [] }

function observe(page, bucket) {
  page.on('console', message => { if (message.type() === 'error') bucket.errors.push(`console: ${message.text()}`) })
  page.on('pageerror', error => bucket.errors.push(`page: ${error.message}`))
  page.on('request', request => bucket.requests.push(request.url()))
  page.on('requestfailed', request => bucket.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`))
}

const browser = await chromium.launch({ headless: true })
try {
  const desktop = { errors: [], requests: [], failedRequests: [] }
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true })
  const page = await desktopContext.newPage()
  observe(page, desktop)
  const rootResponse = await page.goto(`${base}/`, { waitUntil: 'networkidle' })
  assert.equal(rootResponse.status(), 200)
  assert.equal(await page.locator('html').getAttribute('lang'), 'en')
  assert.equal(await page.locator('h1').count(), 1)
  assert.equal(await page.locator('main').count(), 1)
  assert.match(await page.title(), /Med Handoff Card —/)
  const firstRead = {
    heading: await page.locator('h1').innerText(),
    audience: await page.locator('.empty-state p').nth(1).innerText(),
    primary: await page.getByRole('link', { name: 'Try it with sample data' }).innerText(),
    primaryBottom: (await page.getByRole('link', { name: 'Try it with sample data' }).boundingBox()).y,
    facts: await page.locator('.plain-facts li').allInnerTexts()
  }
  assert.equal(firstRead.heading, 'Track medicine handoffs between family caregivers.')
  assert.match(firstRead.audience, /adult children and home caregivers/i)
  assert.equal(firstRead.primary, 'Try it with sample data')
  assert.ok(firstRead.primaryBottom < 900)
  assert.equal(firstRead.facts.length, 3)

  await page.reload({ waitUntil: 'networkidle' })
  await page.keyboard.press('Tab')
  const skipFocus = await page.evaluate(() => ({ text: document.activeElement?.textContent?.trim(), outline: getComputedStyle(document.activeElement).outlineWidth }))
  assert.equal(skipFocus.text, 'Skip to handoff board')
  assert.equal(skipFocus.outline, '3px')

  await page.getByRole('link', { name: 'Try it with sample data' }).click()
  await page.waitForURL(`${base}/demo`)
  assert.equal(await page.title(), 'Demo — Med Handoff Card')
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `${base}/demo`)
  await page.getByText('Demo — sample data, nothing is saved to your real record').waitFor()
  assert.equal(await page.locator('#regimen li').count(), 3)
  assert.equal(await page.getByText('Nora Ellis').count(), 1)

  page.once('dialog', dialog => dialog.accept('<script>not markup</script> & caregiver note'))
  await page.locator('[data-id="demo-metformin"][data-slot="Evening"][data-state="held"]').click()
  await page.getByText('Note: <script>not markup</script> & caregiver note', { exact: true }).waitFor()
  assert.equal(await page.locator('script').count(), 1)
  const reducedMotion = await page.locator('[data-id="demo-metformin"][data-slot="Evening"][data-state="held"] b').evaluate(node => getComputedStyle(node).animationName)
  assert.equal(reducedMotion, 'none')

  await page.getByRole('button', { name: 'Show QR handoff' }).click()
  await page.getByAltText('QR code containing today’s medication handoff data.').waitFor()

  const downloads = []
  page.on('download', async download => {
    const path = await download.path()
    downloads.push({ name: download.suggestedFilename(), text: path ? await readFile(path, 'utf8') : '' })
  })
  page.once('dialog', dialog => dialog.dismiss())
  await page.getByRole('button', { name: 'Export backup' }).click()
  for (let i = 0; i < 40 && downloads.length < 2; i++) await page.waitForTimeout(100)
  assert.equal(downloads.length, 2)
  assert.ok(downloads.some(item => item.name.endsWith('.csv') && item.text.includes('Metformin')))
  assert.ok(downloads.some(item => item.name.endsWith('.json') && item.text.includes('Nora Ellis')))

  const axeLight = await new AxeBuilder({ page }).analyze()
  const axeLightBlocking = axeLight.violations.filter(item => ['serious', 'critical'].includes(item.impact))
  assert.deepEqual(axeLightBlocking, [])
  await page.getByRole('button', { name: 'Switch to dark appearance' }).click()
  const axeDark = await new AxeBuilder({ page }).analyze()
  const axeDarkBlocking = axeDark.violations.filter(item => ['serious', 'critical'].includes(item.impact))
  assert.deepEqual(axeDarkBlocking, [])

  await page.screenshot({ path: '.factory/qa-artifacts/live/demo-desktop-dark.png', fullPage: true })
  await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' })
  assert.equal(await page.getByRole('heading', { name: 'Today’s handoff' }).isVisible(), true)
  assert.equal(await page.locator('#tools').isVisible(), false)
  await page.emulateMedia({ media: 'screen', reducedMotion: 'reduce' })

  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  await page.goto(`${base}/privacy`)
  await page.getByRole('heading', { name: 'Privacy, plainly.' }).waitFor()
  await page.goto(`${base}/demo?verification-3=1`)
  await desktopContext.setOffline(true)
  await page.reload()
  await page.getByRole('heading', { name: 'Today’s handoff' }).waitFor()
  await page.getByText('Nora Ellis').waitFor()
  assert.match(await page.locator('.eyebrow').first().innerText(), /offline/i)
  await page.screenshot({ path: '.factory/qa-artifacts/live/demo-offline.png', fullPage: false })
  await desktopContext.setOffline(false)

  desktop.firstRead = firstRead
  desktop.skipFocus = skipFocus
  desktop.downloads = downloads.map(({ name, text }) => ({ name, bytes: Buffer.byteLength(text) }))
  desktop.axe = { lightBlocking: axeLightBlocking, darkBlocking: axeDarkBlocking }
  desktop.reducedMotionAnimationName = reducedMotion
  desktop.offOriginRequests = [...new Set(desktop.requests.filter(url => new URL(url).origin !== base))]
  assert.deepEqual(desktop.offOriginRequests, [])
  assert.deepEqual(desktop.errors, [])
  results.scenarios.desktopDemo = desktop
  await desktopContext.close()

  const mobile = { errors: [], requests: [], failedRequests: [] }
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const mobilePage = await mobileContext.newPage()
  observe(mobilePage, mobile)
  await mobilePage.goto(`${base}/demo`, { waitUntil: 'networkidle' })
  mobile.scrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth)
  assert.ok(mobile.scrollWidth <= 390)
  mobile.undersizedTargets = await mobilePage.locator('a,button,input:not([type="hidden"]),textarea,label.file-label').evaluateAll(elements => elements.filter(element => {
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)
  }).map(element => ({ text: element.textContent?.trim(), width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })))
  assert.deepEqual(mobile.undersizedTargets, [])
  const axeMobile = await new AxeBuilder({ page: mobilePage }).analyze()
  mobile.axeBlocking = axeMobile.violations.filter(item => ['serious', 'critical'].includes(item.impact))
  assert.deepEqual(mobile.axeBlocking, [])
  await mobilePage.screenshot({ path: '.factory/qa-artifacts/live/demo-mobile.png', fullPage: true })
  await mobilePage.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  mobile.text200ScrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth)
  mobile.text200Clipped = await mobilePage.locator('main *').evaluateAll(elements => elements.filter(element => {
    const rect = element.getBoundingClientRect()
    return rect.right > document.documentElement.clientWidth + 1 || rect.left < -1
  }).slice(0, 10).map(element => ({ tag: element.tagName, text: element.textContent?.trim().slice(0, 60), left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right })))
  assert.ok(mobile.text200ScrollWidth <= 390)
  assert.deepEqual(mobile.text200Clipped, [])
  await mobilePage.screenshot({ path: '.factory/qa-artifacts/live/demo-mobile-text-200.png', fullPage: false })
  assert.deepEqual(mobile.errors, [])
  mobile.offOriginRequests = [...new Set(mobile.requests.filter(url => new URL(url).origin !== base))]
  assert.deepEqual(mobile.offOriginRequests, [])
  results.scenarios.mobile = mobile
  await mobileContext.close()

  const real = { errors: [], requests: [], failedRequests: [] }
  const realContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const realPage = await realContext.newPage()
  observe(realPage, real)
  await realPage.goto(`${base}/`)
  await realPage.getByRole('button', { name: 'Add your first medication' }).focus()
  await realPage.keyboard.press('Enter')
  assert.equal(await realPage.getByLabel('Medication name').evaluate(el => el === document.activeElement), true)
  await realPage.getByLabel('Medication name').fill('   ')
  await realPage.getByLabel('Dose / amount').fill('   ')
  await realPage.getByLabel('Morning').check()
  await realPage.getByRole('button', { name: 'Save medication' }).click()
  await realPage.getByText('Enter a medication name and dose or amount.').waitFor()
  await realPage.getByLabel('Medication name').fill('A'.repeat(80))
  await realPage.getByLabel('Dose / amount').fill('5 mg')
  await realPage.getByLabel('Directions').fill('Take with food & water <only as written>')
  await realPage.getByRole('button', { name: 'Save medication' }).click()
  assert.equal(await realPage.getByRole('heading', { name: 'Today’s handoff' }).evaluate(el => el === document.activeElement), true)
  await realPage.reload()
  await realPage.getByText('A'.repeat(80), { exact: true }).first().waitFor()
  await realPage.getByText('Take with food & water <only as written>', { exact: true }).first().waitFor()
  assert.equal(await realPage.locator('only').count(), 0)

  await realPage.locator('#shift-note').fill('S'.repeat(500))
  await realPage.locator('#shift-note').blur()
  page.once?.('dialog', () => {})
  realPage.once('dialog', dialog => dialog.accept('Held after caregiver called pharmacist <confirm> & documented.'))
  await realPage.locator('[data-action="dose"][data-state="held"]').click()
  await realPage.reload()
  assert.equal(await realPage.locator('#shift-note').inputValue(), 'S'.repeat(500))
  await realPage.getByText('Note: Held after caregiver called pharmacist <confirm> & documented.', { exact: true }).waitFor()

  await realPage.getByRole('button', { name: 'Edit' }).click()
  await realPage.getByLabel('Dose / amount').fill('10 mg')
  await realPage.getByRole('checkbox', { name: 'Morning' }).uncheck()
  await realPage.getByRole('checkbox', { name: 'Evening' }).check()
  await realPage.getByRole('button', { name: 'Save medication' }).click()
  await realPage.getByText('Was 5 mg · Morning. Now 10 mg · Evening.').waitFor()
  const readStoredRecord = () => realPage.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('med-handoff-card', 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const get = request.result.transaction('records', 'readonly').objectStore('records').get('current')
      get.onerror = () => reject(get.error)
      get.onsuccess = () => resolve(get.result)
    }
  }))
  const storedBeforeStop = await readStoredRecord()
  const changesBeforeStop = storedBeforeStop.regimenChanges.length
  realPage.once('dialog', dialog => dialog.accept())
  await realPage.getByRole('button', { name: 'Stop' }).click()
  await realPage.getByRole('heading', { name: 'Track medicine handoffs between family caregivers.' }).waitFor()
  await realPage.reload()
  await realPage.getByRole('heading', { name: 'Track medicine handoffs between family caregivers.' }).waitFor()
  const storedAfterStop = await readStoredRecord()
  const changesAfterStop = storedAfterStop.regimenChanges.length
  real.stoppedMedication = { active: storedAfterStop.medications[0].active, logsStored: storedAfterStop.logs.length, historyVisible: await realPage.locator('.history').count(), changesBeforeStop, changesAfterStop }
  real.stopRecordedAsRegimenChange = changesAfterStop > changesBeforeStop
  if (!real.stopRecordedAsRegimenChange) results.defects.push({ severity: 'high', id: 'stopped-medication-not-in-regimen-history', evidence: `Regimen-change count stayed ${changesBeforeStop} after confirming Stop and reloading.` })
  if (storedAfterStop.logs.length > 0 && await realPage.locator('.history').count() === 0) results.defects.push({ severity: 'high', id: 'last-stopped-medication-hides-existing-dose-history', evidence: `${storedAfterStop.logs.length} dose log remains in IndexedDB, but the empty-record screen renders no history section.` })
  await realPage.screenshot({ path: '.factory/qa-artifacts/live/real-after-stop.png', fullPage: true })

  const beforeInvalidImport = JSON.stringify(storedAfterStop)
  await realPage.locator('#import-file').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{"personName":"QA","shiftNote":"","medications":[{"active":true}],"logs":[]}' ) })
  await realPage.getByText(/Could not import that backup/).waitFor()
  assert.equal(JSON.stringify(await readStoredRecord()), beforeInvalidImport)
  realPage.once('dialog', dialog => dialog.accept())
  await realPage.locator('#import-file').setInputFiles({ name: 'valid-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(storedBeforeStop)) })
  await realPage.getByRole('heading', { name: 'Today’s handoff' }).waitFor()
  await realPage.reload()
  real.validImportRestored = await realPage.getByText('A'.repeat(80), { exact: true }).first().isVisible()
  assert.equal(real.validImportRestored, true)
  assert.deepEqual(real.errors, [])
  real.offOriginRequests = [...new Set(real.requests.filter(url => new URL(url).origin !== base))]
  assert.deepEqual(real.offOriginRequests, [])
  results.scenarios.realRecord = real
  await realContext.close()

  await writeFile('.factory/qa-artifacts/live/verification-3-results.json', JSON.stringify(results, null, 2))
} catch (error) {
  results.fatal = { message: error.message, stack: error.stack }
  await writeFile('.factory/qa-artifacts/live/verification-3-results.json', JSON.stringify(results, null, 2))
  throw error
} finally {
  await browser.close()
}
