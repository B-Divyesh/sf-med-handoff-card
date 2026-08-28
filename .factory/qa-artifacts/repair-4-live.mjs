import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'

const base = process.env.QA_BASE || 'https://med-handoff-card.sociobot.in'
const output = { base, checkedAt: new Date().toISOString(), routes: [], demo: {}, mobile: {}, real: {}, print: {}, errors: [] }
const browser = await chromium.launch({ headless: true })

const observe = (page, requests) => {
  page.on('console', message => { if (message.type() === 'error' && !message.text().includes('Failed to load resource')) output.errors.push(message.text()) })
  page.on('pageerror', error => output.errors.push(error.message))
  page.on('request', request => requests.push(request.url()))
}

try {
  const request = await browser.newContext().then(context => context.request)
  for (const [path, status] of [['/', 200], ['/demo', 200], ['/privacy', 200], ['/terms', 200], ['/repair-4-missing', 404]]) {
    const response = await request.get(`${base}${path}`)
    assert.equal(response.status(), status)
    output.routes.push({ path, status: response.status() })
  }

  const demoContext = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  const demo = await demoContext.newPage()
  const demoRequests = []
  observe(demo, demoRequests)
  await demo.goto(`${base}/demo`, { waitUntil: 'networkidle' })
  const light = await new AxeBuilder({ page: demo }).analyze()
  assert.deepEqual(light.violations.filter(item => ['serious', 'critical'].includes(item.impact)), [])
  await demo.getByRole('button', { name: 'Switch to dark appearance' }).click()
  const dark = await new AxeBuilder({ page: demo }).analyze()
  assert.deepEqual(dark.violations.filter(item => ['serious', 'critical'].includes(item.impact)), [])
  const importButton = demo.getByRole('button', { name: 'Import backup', exact: true })
  await demo.getByRole('button', { name: 'Export backup' }).focus()
  await demo.keyboard.press('Tab')
  assert.equal(await importButton.evaluate(element => element === document.activeElement), true)
  const chooserPromise = demo.waitForEvent('filechooser')
  await demo.keyboard.press('Enter')
  await (await chooserPromise).setFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{}') })
  await demo.getByText(/Could not import that backup/).waitFor()
  await demo.getByRole('button', { name: 'Show QR handoff' }).click()
  await demo.getByAltText('QR code containing the selected medication handoff data.').waitFor()
  await demo.reload()
  assert.equal(await demo.getByAltText('QR code containing the selected medication handoff data.').count(), 0)
  await demo.evaluate(() => navigator.serviceWorker.ready)
  await demo.reload()
  await demo.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  await demo.goto(`${base}/privacy`)
  await demo.goto(`${base}/demo?repair=4`)
  await demoContext.setOffline(true)
  await demo.reload()
  await demo.getByRole('heading', { name: 'Today’s handoff' }).waitFor()
  await demo.getByText('Nora Ellis').waitFor()
  await demoContext.setOffline(false)
  output.demo = {
    axeBlockingLight: 0,
    axeBlockingDark: 0,
    importKeyboardReached: true,
    qrClearedOnReload: true,
    offlineReload: true,
    offOriginRequests: [...new Set(demoRequests.filter(url => new URL(url).origin !== base))]
  }
  assert.deepEqual(output.demo.offOriginRequests, [])
  await demoContext.close()

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const mobile = await mobileContext.newPage()
  const mobileRequests = []
  observe(mobile, mobileRequests)
  await mobile.goto(`${base}/demo`, { waitUntil: 'networkidle' })
  output.mobile.scrollWidth = await mobile.evaluate(() => document.documentElement.scrollWidth)
  output.mobile.undersizedTargets = await mobile.locator('a,button,input:not([type="hidden"]),textarea').evaluateAll(elements => elements.filter(element => {
    const rect = element.getBoundingClientRect(); const style = getComputedStyle(element)
    return style.display !== 'none' && rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)
  }).map(element => element.textContent?.trim()))
  await mobile.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  output.mobile.text200ScrollWidth = await mobile.evaluate(() => document.documentElement.scrollWidth)
  assert.ok(output.mobile.scrollWidth <= 390)
  assert.ok(output.mobile.text200ScrollWidth <= 390)
  assert.deepEqual(output.mobile.undersizedTargets, [])
  await mobile.screenshot({ path: '.factory/qa-evidence/repair-4-live-mobile-200.png', fullPage: false })
  await mobileContext.close()

  const realContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const real = await realContext.newPage()
  const realRequests = []
  observe(real, realRequests)
  await real.goto(`${base}/`)
  await real.getByRole('button', { name: 'Add your first medication' }).click()
  await real.getByLabel('Medication name').fill('Repair four medicine')
  await real.getByLabel('Dose / amount').fill('5 mg')
  await real.getByRole('checkbox', { name: 'Morning' }).check()
  await real.getByRole('button', { name: 'Save medication' }).click()
  const today = await real.locator('#date').getAttribute('max')
  await real.locator('#date').fill('2099-12-31')
  assert.equal(await real.locator('#date').inputValue(), today)
  await real.getByText(/Future doses cannot be recorded/).waitFor()
  real.once('dialog', dialog => dialog.accept('Held for live repair verification'))
  await real.locator('[data-state="held"]').click()
  await real.getByRole('button', { name: 'Edit' }).click()
  await real.getByLabel('Dose / amount').fill('10 mg')
  await real.getByRole('checkbox', { name: 'Morning' }).uncheck()
  await real.getByRole('checkbox', { name: 'Evening' }).check()
  await real.getByRole('button', { name: 'Save medication' }).click()
  real.once('dialog', dialog => dialog.accept())
  await real.getByRole('button', { name: 'Stop' }).click()
  await real.reload()
  await real.getByText('Medication stopped').waitFor()
  await real.getByText('Ⅱ Held').waitFor()
  await real.getByText('“Held for live repair verification”').waitFor()
  const stored = await real.evaluate(async () => new Promise((resolve, reject) => {
    const open = indexedDB.open('med-handoff-card', 1)
    open.onerror = () => reject(open.error)
    open.onsuccess = () => {
      const get = open.result.transaction('records', 'readonly').objectStore('records').get('current')
      get.onerror = () => reject(get.error); get.onsuccess = () => resolve(get.result)
    }
  }))
  assert.equal(stored.medications[0].active, false)
  assert.equal(stored.logs.some(log => log.date === '2099-12-31'), false)
  assert.equal(stored.regimenChanges.length, 3)
  await real.screenshot({ path: '.factory/qa-evidence/repair-4-live-stopped-history.png', fullPage: true })
  output.real = { futureRejected: true, activeAfterStop: false, logs: stored.logs.length, regimenChanges: stored.regimenChanges.length, historyVisibleAfterReload: true, offOriginRequests: [...new Set(realRequests.filter(url => new URL(url).origin !== base))] }
  assert.deepEqual(output.real.offOriginRequests, [])
  await realContext.close()

  const printContext = await browser.newContext()
  const print = await printContext.newPage()
  await print.goto(`${base}/`)
  const now = new Date().toISOString(); const slots = ['Morning', 'Noon', 'Evening', 'Bedtime']
  const medications = Array.from({ length: 8 }, (_, index) => ({ id: `live-print-${index}`, name: `Medication ${index + 1}`, dose: `${index + 1}0 mg`, instructions: 'Follow the written care plan', slots: [slots[index % 4]], active: true, changedAt: now }))
  const backup = { personName: 'Live eight-medication print', shiftNote: 'Review each dose.', medications, logs: [], regimenChanges: [], updatedAt: now }
  print.once('dialog', dialog => dialog.accept())
  await print.locator('#import-file').setInputFiles({ name: 'eight.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) })
  await print.getByText('Live eight-medication print').waitFor()
  output.print.pages = {}
  for (const format of ['A4', 'Letter']) {
    const pdf = await print.pdf({ format, printBackground: true })
    output.print.pages[format] = (pdf.toString('latin1').match(/\/Type \/Page\b/g) || []).length
    assert.equal(output.print.pages[format], 1)
  }
  await printContext.close()

  assert.deepEqual(output.errors, [])
  await writeFile('.factory/qa-evidence/repair-4-live-smoke.json', JSON.stringify(output, null, 2))
} finally {
  await browser.close()
}
