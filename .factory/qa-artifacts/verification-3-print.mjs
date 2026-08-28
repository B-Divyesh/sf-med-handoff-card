import { chromium } from 'playwright'
import { readFile, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const base = process.env.QA_BASE || 'https://med-handoff-card.sociobot.in'
const now = new Date().toISOString()
const slots = ['Morning', 'Noon', 'Evening', 'Bedtime']
const medications = Array.from({ length: 8 }, (_, index) => ({
  id: `print-med-${index + 1}`,
  name: `Medication ${index + 1}`,
  dose: `${index + 1}0 mg`,
  instructions: 'Follow the written care plan',
  slots: [slots[index % slots.length]],
  active: true,
  changedAt: now
}))
const backup = { personName: 'Representative eight-medication case', shiftNote: 'Review each dose state at handoff.', medications, logs: [], regimenChanges: [], updatedAt: now }
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  page.once('dialog', dialog => dialog.accept())
  await page.locator('#import-file').setInputFiles({ name: 'eight-medications.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) })
  await page.getByText('Representative eight-medication case').waitFor()
  const outputs = []
  for (const format of ['A4', 'Letter']) {
    const path = `.factory/qa-artifacts/live/eight-medication-handoff-${format.toLowerCase()}.pdf`
    await page.pdf({ path, format, printBackground: true })
    const pdf = await readFile(path)
    const pageCount = (pdf.toString('latin1').match(/\/Type \/Page\b/g) || []).length
    assert.ok(pageCount > 0)
    outputs.push({ format, pageCount, bytes: pdf.length })
  }
  await writeFile('.factory/qa-artifacts/live/verification-3-print.json', JSON.stringify({ medicationCount: medications.length, outputs }, null, 2))
  await context.close()
} finally {
  await browser.close()
}
