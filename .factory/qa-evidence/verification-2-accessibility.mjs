import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const base = 'https://med-handoff-card.sociobot.in'
const browser = await chromium.launch({ headless: true })
const report = { routes: {}, links: {}, keyboard: {}, resize: {} }

try {
  for (const route of ['/', '/demo', '/privacy', '/terms', '/qa-not-found']) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const page = await context.newPage()
    const errors = []
    page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
    page.on('pageerror', error => errors.push(`page: ${error.message}`))
    const response = await page.goto(base + route, { waitUntil: 'networkidle' })
    const axe = await new AxeBuilder({ page }).analyze()
    report.routes[route] = await page.evaluate(({ status, violations, errors }) => ({
      status,
      title: document.title,
      lang: document.documentElement.lang,
      h1: [...document.querySelectorAll('h1')].map(node => node.textContent.trim()),
      mainCount: document.querySelectorAll('main').length,
      headings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(node => ({ level: Number(node.tagName.slice(1)), text: node.textContent.trim() })),
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      missingAlt: [...document.querySelectorAll('img:not([alt])')].length,
      unlabeledButtons: [...document.querySelectorAll('button')].filter(button => !button.innerText.trim() && !button.getAttribute('aria-label')).length,
      seriousCritical: violations,
      errors,
    }), {
      status: response?.status(),
      violations: axe.violations.filter(item => item.impact === 'serious' || item.impact === 'critical').map(item => item.id),
      errors,
    })
    const hrefs = await page.locator('a[href]').evaluateAll(nodes => [...new Set(nodes.map(node => node.href))])
    for (const href of hrefs) {
      if (!href.startsWith(base)) continue
      const linkResponse = await context.request.get(href)
      report.links[href] = linkResponse.status()
    }
    await context.close()
  }

  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const page = await context.newPage()
    await page.goto(base + '/', { waitUntil: 'networkidle' })
    await page.keyboard.press('Tab')
    report.keyboard.skipFirst = await page.locator('.skip-link').evaluate(node => node === document.activeElement)
    report.keyboard.skipOutline = await page.locator('.skip-link').evaluate(node => getComputedStyle(node).outline)
    await page.keyboard.press('Enter')
    report.keyboard.skipDestination = await page.evaluate(() => document.activeElement?.id)

    await page.getByRole('button', { name: 'Add your first medication' }).focus()
    report.keyboard.addOutline = await page.getByRole('button', { name: 'Add your first medication' }).evaluate(node => getComputedStyle(node).outline)
    await page.keyboard.press('Enter')
    report.keyboard.dialogInitialFocus = await page.evaluate(() => document.activeElement?.getAttribute('name'))
    report.keyboard.dialogAccessibleName = await page.locator('dialog').getAttribute('aria-label') || await page.locator('dialog').getAttribute('aria-labelledby') || ''
    await page.getByLabel('Medication name').fill('X'.repeat(80))
    await page.getByLabel('Dose / amount').fill('Y'.repeat(80))
    await page.getByRole('button', { name: 'Save medication' }).focus()
    await page.keyboard.press('Enter')
    report.keyboard.scheduleError = await page.locator('.form-error').innerText()
    report.keyboard.errorLive = await page.locator('.form-error').getAttribute('aria-live')
    await page.getByLabel('Morning').focus()
    await page.keyboard.press('Space')
    report.keyboard.spaceChecked = await page.getByLabel('Morning').isChecked()
    await page.getByRole('button', { name: 'Save medication' }).focus()
    await page.keyboard.press('Enter')
    await page.locator('.dialog').waitFor({ state: 'detached' })
    await page.getByRole('heading', { name: 'Today’s handoff' }).waitFor()
    report.keyboard.focusAfterSave = await page.evaluate(() => ({ tag: document.activeElement?.tagName, text: document.activeElement?.textContent?.trim().slice(0, 60), id: document.activeElement?.id }))
    const held = page.locator('[data-slot="Morning"][data-state="held"]').first()
    await held.focus()
    page.once('dialog', dialog => dialog.accept('Keyboard note'))
    await page.keyboard.press('Enter')
    await page.getByText('Note: Keyboard note').waitFor()
    report.keyboard.doseViaEnter = await held.getAttribute('aria-pressed')
    await context.close()
  }

  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', bypassCSP: true })
    const page = await context.newPage()
    await page.goto(base + '/demo', { waitUntil: 'networkidle' })
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
    report.resize = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      clipped: [...document.querySelectorAll('main *')].filter(node => {
        const rect = node.getBoundingClientRect()
        return rect.right > document.documentElement.clientWidth + 1 || rect.left < -1
      }).slice(0, 20).map(node => ({ tag: node.tagName, className: node.className, text: node.textContent?.trim().slice(0, 60), rect: node.getBoundingClientRect().toJSON() })),
    }))
    await page.screenshot({ path: '.factory/qa-evidence/verification-2-text-resize-200-mobile.png', fullPage: true })
    await context.close()
  }

  console.log(JSON.stringify(report, null, 2))
} finally {
  await browser.close()
}
