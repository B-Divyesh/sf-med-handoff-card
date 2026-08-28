import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import jsQR from 'jsqr'

test('@claim:demo-isolation sample changes never enter the real record', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Add your first medication' }).click()
  await page.getByLabel('Medication name').fill('Real medication')
  await page.getByLabel('Dose / amount').fill('5 mg')
  await page.getByLabel('Morning').check()
  await page.getByRole('button', { name: 'Save medication' }).click()
  await expect(page.getByText('Real medication').first()).toBeVisible()

  await page.getByRole('link', { name: 'Demo' }).click()
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible()
  await expect(page.getByText('Nora Ellis')).toBeVisible()
  await expect(page.getByText('Metformin', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Real medication')).toHaveCount(0)
  page.once('dialog', dialog => dialog.accept('Changed only in demo'))
  await page.locator('[data-action="dose"][data-state="unknown"]').first().click()
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await expect(page.locator('[data-id="demo-metformin"][data-state="taken"]').first()).toHaveAttribute('aria-pressed', 'true')
  page.once('dialog', dialog => dialog.accept('Changed only in demo'))
  await page.locator('[data-action="dose"][data-state="unknown"]').first().click()
  await page.reload()
  await expect(page.locator('[data-id="demo-metformin"][data-state="taken"]').first()).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Start for real' }).click()
  await expect(page.getByText('Real medication').first()).toBeVisible()
  await expect(page.getByText('Nora Ellis')).toHaveCount(0)
})

test('@claim:offline-reload demo reloads after the connection is removed', async ({ page, context }) => {
  await page.goto('/demo')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
  await page.goto('/privacy')
  await expect(page.getByRole('heading', { name: 'Privacy, plainly.' })).toBeVisible()
  await page.goto('/demo?after-privacy=1')
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Today’s handoff' })).toBeVisible()
  await expect(page.getByText('Nora Ellis')).toBeVisible()
})

test('@claim:local-only complete demo flow sends no request off origin', async ({ page }) => {
  const external: string[] = []
  page.on('request', request => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') external.push(request.url())
  })
  await page.goto('/demo')
  page.once('dialog', dialog => dialog.accept('Demo note'))
  await page.locator('[data-action="dose"][data-state="taken"]').first().click()
  await page.getByRole('button', { name: 'Show QR handoff' }).click()
  await expect(page.getByAltText('QR code containing the selected medication handoff data.')).toBeVisible()
  await expect(page.locator('input[type="password"],a[href*="login"],a[href*="signin"]')).toHaveCount(0)
  expect(external).toEqual([])
})

test('@claim:json-csv-export exports a JSON backup and populated CSV', async ({ page }) => {
  const downloads: Array<{ name: string, text: string }> = []
  page.on('download', async download => { const path = await download.path(); downloads.push({ name: download.suggestedFilename(), text: path ? await readFile(path, 'utf8') : '' }) })
  await page.goto('/demo')
  page.once('dialog', dialog => dialog.dismiss())
  await page.getByRole('button', { name: 'Export backup' }).click()
  await expect.poll(() => downloads.length).toBe(2)
  expect(downloads.map(item => item.name)).toEqual(expect.arrayContaining([expect.stringMatching(/med-handoff-backup-.*\.json/), expect.stringMatching(/med-handoff-dose-log-.*\.csv/)]))
  const csv = downloads.find(item => item.name.endsWith('.csv'))!.text
  expect(csv).toContain('date,time of day,medication,dose,state,note,updated at')
  expect(csv).toContain('Metformin')
})

test('@claim:encrypted-backup creates an AES-GCM passphrase backup locally', async ({ page }) => {
  await page.goto('/demo')
  let promptCount = 0
  page.on('dialog', dialog => {
    if (dialog.type() === 'confirm') void dialog.accept()
    else void dialog.accept(promptCount++ === 0 ? 'correct horse battery staple' : 'wrong passphrase')
  })
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export backup' }).click()
  const download = await downloadPromise
  const path = await download.path()
  const text = path ? await readFile(path, 'utf8') : ''
  expect(download.suggestedFilename()).toMatch(/\.encrypted\.json$/)
  expect(JSON.parse(text)).toMatchObject({ encrypted: true, algorithm: 'AES-GCM' })
  await page.locator('#import-file').setInputFiles({ name: 'backup.encrypted.json', mimeType: 'application/json', buffer: Buffer.from(text) })
  await expect(page.locator('.toast')).toContainText('Could not import that backup')
})

test('@claim:qr-handoff creates an interpretable handoff QR in the browser', async ({ page }) => {
  await page.goto('/demo')
  await page.getByRole('button', { name: 'Show QR handoff' }).click()
  const qr = page.getByAltText('QR code containing the selected medication handoff data.')
  await expect(qr).toHaveAttribute('src', /^data:image\/png/)
  const image = await qr.evaluate(async element => {
    const source = element as HTMLImageElement
    await source.decode()
    const canvas = document.createElement('canvas')
    canvas.width = source.naturalWidth
    canvas.height = source.naturalHeight
    canvas.getContext('2d')!.drawImage(source, 0, 0)
    return { width: canvas.width, height: canvas.height, pixels: Array.from(canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data) }
  })
  const decoded = jsQR(new Uint8ClampedArray(image.pixels), image.width, image.height)
  expect(decoded?.data).toBeTruthy()
  const payload = JSON.parse(decoded!.data) as { version: number, regimen: Array<{ medicationId: string }>, doses: Array<{ medicationId: string }> }
  expect(payload.version).toBe(2)
  expect(payload.doses.every(dose => payload.regimen.some(medication => medication.medicationId === dose.medicationId))).toBe(true)
  await page.getByRole('button', { name: 'Hide QR code' }).click()
  await expect(page.getByAltText('QR code containing the selected medication handoff data.')).toHaveCount(0)
  await page.getByRole('button', { name: 'Show QR handoff' }).click()
  await expect(page.getByAltText('QR code containing the selected medication handoff data.')).toBeVisible()
  await page.reload()
  await expect(page.getByAltText('QR code containing the selected medication handoff data.')).toHaveCount(0)
})

test('@claim:print-handoff fits eight medications on one A4 or Letter page', async ({ page }) => {
  await page.goto('/')
  const now = new Date().toISOString()
  const printSlots = ['Morning', 'Noon', 'Evening', 'Bedtime'] as const
  const medications = Array.from({ length: 8 }, (_, index) => ({
    id: `print-med-${index + 1}`,
    name: `Medication ${index + 1}`,
    dose: `${index + 1}0 mg`,
    instructions: 'Follow the written care plan',
    slots: [printSlots[index % printSlots.length]],
    active: true,
    changedAt: now
  }))
  const backup = { personName: 'Representative eight-medication case', shiftNote: 'Review each dose state at handoff.', medications, logs: [], regimenChanges: [], updatedAt: now }
  page.once('dialog', dialog => dialog.accept())
  await page.locator('#import-file').setInputFiles({ name: 'eight-medications.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) })
  await expect(page.getByText('Representative eight-medication case')).toBeVisible()
  await page.evaluate(() => { (window as typeof window & { printCalled?: boolean }).print = () => { (window as typeof window & { printCalled?: boolean }).printCalled = true } })
  await page.getByRole('button', { name: 'Print handoff' }).click()
  expect(await page.evaluate(() => (window as typeof window & { printCalled?: boolean }).printCalled)).toBe(true)
  await page.emulateMedia({ media: 'print' })
  await expect(page.getByRole('heading', { name: 'Today’s handoff' })).toBeVisible()
  await expect(page.locator('#tools')).toBeHidden()
  for (const format of ['A4', 'Letter'] as const) {
    const pdf = await page.pdf({ format, printBackground: true })
    expect((pdf.toString('latin1').match(/\/Type \/Page\b/g) || []).length).toBe(1)
  }
})

test('@claim:free-tools exposes every handoff tool without a checkout', async ({ page }) => {
  await page.goto('/demo')
  await expect(page.getByRole('button', { name: 'Print handoff' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Show QR handoff' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Export backup' })).toBeEnabled()
  await expect(page.locator('a[href*="checkout"]')).toHaveCount(0)
})

async function addMedication(page: Page, name = 'Test medicine') {
  await page.getByRole('button', { name: /Add (your first )?medication/ }).click()
  await page.getByLabel('Medication name').fill(name)
  await page.getByLabel('Dose / amount').fill('5 mg')
  await page.getByLabel('Directions').fill('with breakfast')
  await page.getByLabel('Morning').check()
  await page.getByRole('button', { name: 'Save medication' }).click()
}

test('@claim:current-medication-list retains complete regimen details after reload', async ({ page }) => {
  await page.goto('/')
  await addMedication(page, 'Current list medicine')
  await page.reload()
  await expect(page.getByText('Current list medicine').first()).toBeVisible()
  await expect(page.getByText('5 mg · Morning', { exact: true })).toBeVisible()
  await expect(page.getByText('with breakfast', { exact: true })).toBeVisible()
})

test('@claim:dose-state-notes retains a held dose and caregiver note after reload', async ({ page }) => {
  await page.goto('/')
  await addMedication(page, 'Held medicine')
  page.once('dialog', dialog => dialog.accept('Asked the pharmacist to confirm'))
  await page.locator('[data-action="dose"][data-state="held"]').click()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Held' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('“Asked the pharmacist to confirm”', { exact: true })).toBeVisible()
})

test('@claim:real-record-retention keeps a saved real medication after reload', async ({ page }) => {
  await page.goto('/')
  await addMedication(page, 'Persistent medicine')
  await page.reload()
  await expect(page.getByText('Persistent medicine').first()).toBeVisible()
})

test('@claim:regimen-history records the prior and new regimen', async ({ page }) => {
  await page.goto('/')
  await addMedication(page, 'Changing medicine')
  await expect(page.getByText('Medication started')).toBeVisible()
  await page.getByRole('button', { name: 'Edit' }).click()
  await page.getByLabel('Dose / amount').fill('10 mg')
  await page.getByRole('checkbox', { name: 'Morning' }).uncheck()
  await page.getByRole('checkbox', { name: 'Evening' }).check()
  await page.getByRole('button', { name: 'Save medication' }).click()
  await expect(page.getByText('Regimen changed')).toBeVisible()
  await expect(page.getByText('Was 5 mg · Morning. Now 10 mg · Evening.')).toBeVisible()
})

test('@claim:stopped-history retains the dose and regimen trail after the last medication stops', async ({ page }) => {
  await page.goto('/')
  await addMedication(page, 'Stopped medicine')
  page.once('dialog', dialog => dialog.accept('Waiting for a new prescription'))
  await page.locator('[data-action="dose"][data-state="held"]').click()
  await page.getByRole('button', { name: 'Edit' }).click()
  await page.getByLabel('Dose / amount').fill('10 mg')
  await page.getByRole('checkbox', { name: 'Morning' }).uncheck()
  await page.getByRole('checkbox', { name: 'Evening' }).check()
  await page.getByRole('button', { name: 'Save medication' }).click()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Stop' }).click()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Today’s handoff' })).toBeVisible()
  await expect(page.getByText('No active medications yet.')).toBeVisible()
  await expect(page.getByText('Medication stopped')).toBeVisible()
  await expect(page.getByText('Existing dose history stays in this record.')).toBeVisible()
  await expect(page.getByText('Ⅱ Held')).toBeVisible()
  await expect(page.getByText('“Waiting for a new prescription”')).toBeVisible()
  await expect(page.getByText('Was 5 mg · Morning. Now 10 mg · Evening.')).toBeVisible()
})

test('@claim:no-future-doses rejects future dates before a dose can be recorded', async ({ page }) => {
  await page.goto('/')
  await addMedication(page, 'Date-boundary medicine')
  const today = await page.locator('#date').getAttribute('max')
  await page.locator('#date').fill('2099-12-31')
  await expect(page.locator('#date')).toHaveValue(today!)
  await expect(page.locator('.toast')).toContainText('Future doses cannot be recorded')
  const stored = await page.evaluate(async () => new Promise<{ logs: Array<{ date: string }> }>((resolve, reject) => {
    const request = indexedDB.open('med-handoff-card', 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const get = request.result.transaction('records', 'readonly').objectStore('records').get('current')
      get.onerror = () => reject(get.error)
      get.onsuccess = () => resolve(get.result)
    }
  }))
  expect(stored.logs.some(log => log.date === '2099-12-31')).toBe(false)
})
