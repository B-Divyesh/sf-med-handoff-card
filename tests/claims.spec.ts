import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

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
  await expect(page.getByAltText('QR code containing today’s medication handoff data.')).toBeVisible()
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

test('@claim:qr-handoff creates the handoff QR in the browser', async ({ page }) => {
  await page.goto('/demo')
  await page.getByRole('button', { name: 'Show QR handoff' }).click()
  await expect(page.getByAltText('QR code containing today’s medication handoff data.')).toHaveAttribute('src', /^data:image\/png/)
  await page.getByRole('button', { name: 'Hide QR code' }).click()
  await expect(page.getByAltText('QR code containing today’s medication handoff data.')).toHaveCount(0)
})

test('@claim:print-handoff keeps the handoff and removes tools from print', async ({ page }) => {
  await page.goto('/demo')
  await page.evaluate(() => { (window as typeof window & { printCalled?: boolean }).print = () => { (window as typeof window & { printCalled?: boolean }).printCalled = true } })
  await page.getByRole('button', { name: 'Print handoff' }).click()
  expect(await page.evaluate(() => (window as typeof window & { printCalled?: boolean }).printCalled)).toBe(true)
  await page.emulateMedia({ media: 'print' })
  await expect(page.getByRole('heading', { name: 'Today’s handoff' })).toBeVisible()
  await expect(page.locator('#tools')).toBeHidden()
})

test('@claim:free-tools exposes every handoff tool without a checkout', async ({ page }) => {
  await page.goto('/demo')
  await expect(page.getByRole('button', { name: 'Print handoff' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Show QR handoff' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Export backup' })).toBeEnabled()
  await expect(page.locator('a[href*="checkout"]')).toHaveCount(0)
})
