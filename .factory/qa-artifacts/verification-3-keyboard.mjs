import { chromium } from 'playwright'
import { writeFile } from 'node:fs/promises'

const base = 'https://med-handoff-card.sociobot.in'
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  await page.goto(`${base}/demo`)
  const sequence = []
  for (let index = 0; index < 70; index++) {
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => {
      const element = document.activeElement
      if (!element) return null
      return {
        tag: element.tagName,
        text: (element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100),
        ariaLabel: element.getAttribute('aria-label'),
        id: element.id,
        dataAction: element.getAttribute('data-action'),
        outline: getComputedStyle(element).outlineWidth
      }
    })
    sequence.push(focused)
    if (index > 0 && focused?.text === 'Skip to handoff board') break
  }
  const importLabel = await page.locator('label.file-label').evaluate(element => ({
    tabIndex: element.tabIndex,
    inputHidden: element.querySelector('input')?.hidden,
    inputTabIndex: element.querySelector('input')?.tabIndex
  }))
  const importReached = sequence.some(item => item?.text === 'Import backup' || item?.id === 'import-file')
  const out = { sequence, importLabel, importReached }
  await writeFile('.factory/qa-artifacts/live/verification-3-keyboard.json', JSON.stringify(out, null, 2))
} finally {
  await browser.close()
}
