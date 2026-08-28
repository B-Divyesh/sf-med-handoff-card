import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const base = 'https://med-handoff-card.sociobot.in'
const report = {}

async function trackedPage(context) {
  const page = await context.newPage()
  const requests = []
  const errors = []
  page.on('request', request => requests.push(request.url()))
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
  page.on('pageerror', error => errors.push(`page: ${error.message}`))
  return { page, requests, errors }
}

const browser = await chromium.launch({ headless: true })
try {
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true })
    const { page, requests, errors } = await trackedPage(context)
    await page.goto(`${base}/`, { waitUntil: 'networkidle' })
    assert.equal(await page.locator('h1').innerText(), 'Track medicine handoffs between family caregivers.')
    assert.equal(await page.getByRole('link', { name: 'Try it with sample data' }).isVisible(), true)
    await page.getByRole('link', { name: 'Try it with sample data' }).click()
    assert.equal(page.url(), `${base}/demo`)
    assert.equal(await page.getByText('Demo — sample data, nothing is saved').isVisible(), true)
    assert.equal(await page.getByText('Nora Ellis').isVisible(), true)
    assert.equal(await page.getByText('Metformin', { exact: true }).first().isVisible(), true)

    page.once('dialog', dialog => dialog.accept('Independent QA note <literal>'))
    await page.locator('[data-id="demo-metformin"][data-slot="Evening"][data-state="held"]').click()
    assert.equal(await page.locator('[data-id="demo-metformin"][data-slot="Evening"][data-state="held"]').getAttribute('aria-pressed'), 'true')
    assert.equal(await page.getByText('Note: Independent QA note <literal>').isVisible(), true)
    await page.getByRole('button', { name: 'Show QR handoff' }).click()
    assert.match(await page.getByAltText('QR code containing today’s medication handoff data.').getAttribute('src'), /^data:image\/png/)

    const downloads = []
    page.on('download', async download => {
      const path = await download.path()
      downloads.push({ name: download.suggestedFilename(), text: path ? await readFile(path, 'utf8') : '' })
    })
    page.once('dialog', dialog => dialog.dismiss())
    await page.getByRole('button', { name: 'Export backup' }).click()
    await page.waitForFunction(() => document.querySelector('.toast')?.textContent?.includes('JSON backup and CSV'))
    await page.waitForTimeout(500)
    assert.equal(downloads.length, 2)
    assert.equal(downloads.some(item => item.name.endsWith('.json') && item.text.includes('Nora Ellis')), true)
    assert.equal(downloads.some(item => item.name.endsWith('.csv') && item.text.includes('Metformin')), true)

    const axe = await new AxeBuilder({ page }).analyze()
    const severe = axe.violations.filter(item => item.impact === 'serious' || item.impact === 'critical')
    assert.deepEqual(severe, [])
    await page.getByRole('button', { name: /Switch to dark appearance/ }).click()
    const darkAxe = await new AxeBuilder({ page }).analyze()
    const darkSevere = darkAxe.violations.filter(item => item.impact === 'serious' || item.impact === 'critical')
    await page.screenshot({ path: '.factory/qa-evidence/verification2-live-demo-desktop.png', fullPage: true })

    const external = [...new Set(requests.filter(url => new URL(url).origin !== base))]
    assert.deepEqual(external, [])
    assert.deepEqual(errors, [])
    report.desktopDemo = { axeSeriousCritical: severe.length, darkAxeSeriousCritical: darkSevere.map(item => ({ id: item.id, nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })), externalRequests: external, requestOrigins: [...new Set(requests.map(url => new URL(url).origin))], errors, downloads: downloads.map(item => item.name) }
    await context.close()
  }

  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    const { page, requests, errors } = await trackedPage(context)
    await page.goto(`${base}/demo`, { waitUntil: 'networkidle' })
    const layout = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }))
    assert.equal(layout.scrollWidth, layout.clientWidth)
    const targets = await page.locator('a,button,input:not([type="hidden"]),textarea,label.file-label').evaluateAll(elements => elements.filter(element => {
      const style = getComputedStyle(element)
      if (style.display === 'none' || style.visibility === 'hidden') return false
      const rect = element.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)
    }).map(element => ({ text: element.textContent?.trim(), rect: element.getBoundingClientRect().toJSON() })))
    // Record all undersized controls as independent QA evidence; do not stop
    // the remaining live workflow checks when one is found.
    const motion = await page.locator('.state.selected b').first().evaluate(element => ({ animationName: getComputedStyle(element).animationName, animationDuration: getComputedStyle(element).animationDuration }))
    assert.equal(motion.animationName, 'none')
    const axe = await new AxeBuilder({ page }).analyze()
    const severe = axe.violations.filter(item => item.impact === 'serious' || item.impact === 'critical')
    assert.deepEqual(severe, [])
    await page.screenshot({ path: '.factory/qa-evidence/verification2-live-demo-mobile.png', fullPage: true })

    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.reload()
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
    await context.setOffline(true)
    const offlineResponse = await page.reload()
    assert.equal(offlineResponse?.status(), 200)
    assert.equal(await page.getByText('Nora Ellis').isVisible(), true)
    assert.equal(await page.getByRole('heading', { name: 'Today’s handoff' }).isVisible(), true)
    assert.deepEqual(errors, [])
    report.mobileOffline = { layout, undersizedTargets: targets, axeSeriousCritical: severe.length, reducedMotion: motion, offlineStatus: offlineResponse?.status(), requestsWhileOnline: requests.length, errors }
    await context.close()
  }

  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const { page, errors } = await trackedPage(context)
    await page.goto(`${base}/`, { waitUntil: 'networkidle' })
    await page.keyboard.press('Tab')
    assert.equal(await page.locator('.skip-link').evaluate(element => element === document.activeElement), true)
    const skipFocus = await page.locator('.skip-link').evaluate(element => ({ top: getComputedStyle(element).top, outlineWidth: getComputedStyle(element).outlineWidth, outlineStyle: getComputedStyle(element).outlineStyle }))
    assert.notEqual(skipFocus.top, '-80px')
    await page.keyboard.press('Enter')
    assert.equal(await page.locator('main').isVisible(), true)
    await page.getByRole('button', { name: 'Add your first medication' }).focus()
    const actionFocus = await page.getByRole('button', { name: 'Add your first medication' }).evaluate(element => ({ outlineWidth: getComputedStyle(element).outlineWidth, outlineStyle: getComputedStyle(element).outlineStyle }))
    assert.equal(actionFocus.outlineWidth, '3px')
    await page.keyboard.press('Enter')
    assert.equal(await page.getByLabel('Medication name').evaluate(element => element === document.activeElement), true)
    await page.getByLabel('Medication name').fill('Boundary medicine <&>')
    await page.getByLabel('Dose / amount').fill('5 mg')
    await page.getByRole('button', { name: 'Save medication' }).click()
    assert.equal(await page.locator('.form-error').innerText(), 'Choose at least one time of day.')
    await page.getByLabel('Morning').check()
    await page.getByLabel('Bedtime').check()
    await page.getByRole('button', { name: 'Save medication' }).click()
    await page.getByText('Boundary medicine <&>', { exact: true }).first().waitFor()
    assert.equal(await page.getByText('Boundary medicine <&>', { exact: true }).first().isVisible(), true)
    await page.reload()
    assert.equal(await page.getByText('Boundary medicine <&>', { exact: true }).first().isVisible(), true)

    await page.locator('#shift-note').fill('New plan confirmed; call the pharmacist if anything differs.')
    await page.locator('#shift-note').blur()
    await page.waitForTimeout(150)
    page.once('dialog', dialog => dialog.accept('Held while clarification is pending.'))
    await page.locator('[data-slot="Morning"][data-state="held"]').first().click()
    await page.getByText('Note: Held while clarification is pending.').waitFor()
    await page.reload()
    assert.equal(await page.locator('#shift-note').inputValue(), 'New plan confirmed; call the pharmacist if anything differs.')
    assert.equal(await page.locator('[data-slot="Morning"][data-state="held"]').first().getAttribute('aria-pressed'), 'true')
    assert.equal(errors.length, 0)
    report.realWorkflow = { skipFocus, actionFocus, invalidScheduleRecovery: true, specialCharactersEscaped: true, persistedMedication: true, persistedShiftNote: true, persistedDose: true, errors }
    await context.close()
  }

  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const { page, errors } = await trackedPage(context)
    await page.goto(`${base}/`, { waitUntil: 'networkidle' })
    const malformed = Buffer.from(JSON.stringify({ personName: 'QA', shiftNote: '', medications: [{ active: true }], logs: [] }))
    page.once('dialog', dialog => dialog.accept())
    await page.locator('#import-file').setInputFiles({ name: 'malformed.json', mimeType: 'application/json', buffer: malformed })
    await page.waitForTimeout(500)
    await page.reload()
    await page.waitForTimeout(500)
    report.malformedImport = { bodyText: (await page.locator('body').innerText()).slice(0, 300), errors }
    await context.close()
  }

  console.log(JSON.stringify(report, null, 2))
} finally {
  await browser.close()
}
