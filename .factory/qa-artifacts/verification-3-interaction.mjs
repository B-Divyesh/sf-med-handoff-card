import { chromium } from 'playwright'
import { writeFile } from 'node:fs/promises'

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.goto('https://med-handoff-card.sociobot.in/demo', { waitUntil: 'domcontentloaded' })
  const nextPaintMs = await page.evaluate(async () => {
    const button = document.querySelector('[data-action="theme"]')
    const start = performance.now()
    button.click()
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    return performance.now() - start
  })
  await writeFile('.factory/qa-artifacts/live/verification-3-interaction.json', JSON.stringify({ interaction: 'theme switch and rerender', nextPaintMs, budgetMs: 200, note: 'Representative next-paint latency; field INP requires real-user traffic.' }, null, 2))
  await context.close()
} finally {
  await browser.close()
}
