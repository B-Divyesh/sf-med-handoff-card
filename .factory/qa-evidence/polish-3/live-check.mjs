import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import jsQR from 'jsqr'

const origin = 'https://med-handoff-card.sociobot.in'
const evidence = '.factory/qa-evidence/polish-3/live'
const browser = await chromium.launch({ headless: true })
const result = {
  firstScreen: {}, demo: {}, routes: {}, accessibility: {}, mobile: {},
  offline: {}, privacy: {}, links: [], errors: [], externalRequests: []
}
const assert = (value, message) => { if (!value) throw new Error(message) }
const watch = page => {
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().includes('status of 404')) result.errors.push(message.text())
  })
  page.on('pageerror', error => result.errors.push(error.message))
  page.on('request', request => {
    if (new URL(request.url()).origin !== origin) result.externalRequests.push(request.url())
  })
}
const metadata = page => page.evaluate(() => ({
  title: document.title,
  description: document.querySelector('meta[name="description"]')?.content,
  canonical: document.querySelector('link[rel="canonical"]')?.href,
  ogTitle: document.querySelector('meta[property="og:title"]')?.content,
  twitterTitle: document.querySelector('meta[name="twitter:title"]')?.content,
  apple: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'),
  h1: document.querySelector('h1')?.textContent?.trim(),
  h1Count: document.querySelectorAll('h1').length,
  hasMain: Boolean(document.querySelector('main')),
  nav: [...document.querySelectorAll('nav a')].map(link => link.textContent?.trim()),
  footer: document.querySelector('footer')?.textContent?.replace(/\s+/g, ' ').trim(),
  theme: document.querySelector('[data-action="theme"]')?.textContent?.replace(/\s+/g, ' ').trim()
}))

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' })
  const page = await context.newPage()
  watch(page)
  await page.goto(`${origin}/?cold=polish-3-${Date.now()}`, { waitUntil: 'networkidle' })
  result.routes.home = await metadata(page)
  result.firstScreen = await page.evaluate(() => ({
    headline: document.querySelector('h1')?.textContent?.trim(),
    audience: document.querySelector('.empty-state h1 + p')?.textContent?.trim(),
    action: document.querySelector('.first-actions a')?.textContent?.trim(),
    actionResult: document.querySelector('.first-actions span')?.textContent?.trim(),
    actionBottom: document.querySelector('.first-actions a')?.getBoundingClientRect().bottom,
    facts: [...document.querySelectorAll('.plain-facts li')].map(item => ({
      text: item.textContent?.trim(), bottom: item.getBoundingClientRect().bottom
    })),
    howHeading: document.querySelector('#how-heading')?.textContent?.trim(),
    thirdStep: document.querySelector('.how li:nth-child(3)')?.textContent?.replace(/\s+/g, ' ').trim(),
    build: document.querySelector('footer small')?.textContent?.match(/version ([^ ·]+)/)?.[1]
  }))
  assert(result.firstScreen.headline === 'Track medication handoffs between family caregivers.', 'first-screen headline differs')
  assert(result.firstScreen.audience === 'For adult children and home caregivers who need a clear record when care changes hands.', 'first-screen audience differs')
  assert(result.firstScreen.action === 'Try it with sample data' && result.firstScreen.actionResult === 'Open a filled sample handoff in one click.', 'first action is unclear')
  assert(result.firstScreen.actionBottom < 844 && result.firstScreen.facts.length === 3 && result.firstScreen.facts.every(item => item.bottom < 844), 'first action or facts are below the first phone screen')
  assert(result.firstScreen.howHeading === 'Create a medication handoff in three steps', 'how-to heading regressed')
  assert(result.firstScreen.thirdStep.includes('Print, share, or back up the handoff.'), 'third handoff step regressed')
  assert(result.firstScreen.build === '2026.08.28-polish.3', 'round-three build is not live')
  await page.screenshot({ path: `${evidence}/home-mobile.png`, fullPage: true })

  await page.getByRole('link', { name: 'Try it with sample data' }).click()
  assert(page.url() === `${origin}/?demo=1`, 'demo did not open at ?demo=1 in one click')
  result.demo.entry = {
    banner: await page.getByLabel('Demo mode').innerText(),
    person: await page.getByText('Nora Ellis').first().innerText(),
    medications: await page.locator('#regimen li').count(),
    shiftNote: await page.locator('#shift-note').inputValue(),
    states: await page.locator('.state.selected span').allTextContents()
  }
  assert(result.demo.entry.banner.includes('nothing is saved to your real record') && result.demo.entry.banner.includes('Reset demo') && result.demo.entry.banner.includes('Start for real'), 'demo banner or controls are incomplete')
  assert(result.demo.entry.medications === 3 && result.demo.entry.states.includes('Taken') && result.demo.entry.states.includes('Held'), 'demo sample is incomplete')
  page.once('dialog', dialog => dialog.accept('Demo-only person'))
  await page.getByRole('button', { name: 'Nora Ellis' }).click()
  await page.getByText('Demo-only person').waitFor()
  await page.getByRole('button', { name: 'Reset demo' }).click()
  assert(await page.getByText('Nora Ellis').first().isVisible(), 'demo reset did not restore the sample')
  await page.screenshot({ path: `${evidence}/demo-mobile.png`, fullPage: true })
  await page.getByRole('button', { name: 'Start for real' }).click()
  await page.waitForURL(`${origin}/`)
  await page.getByRole('button', { name: 'Add your first medication' }).waitFor()
  result.demo.exit = {
    empty: await page.getByRole('button', { name: 'Add your first medication' }).isVisible(),
    sampleCount: await page.getByText('Nora Ellis').count()
  }
  assert(result.demo.exit.empty && result.demo.exit.sampleCount === 0, 'sample data crossed into the real record')
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  result.mobile = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    navVisible: getComputedStyle(document.querySelector('nav')).display !== 'none',
    minTarget: Math.min(...[...document.querySelectorAll('a,button,input:not([type="hidden"]),textarea')]
      .filter(element => {
        const style = getComputedStyle(element)
        const box = element.getBoundingClientRect()
        return style.display !== 'none' && style.visibility !== 'hidden' && box.width && box.height
      }).map(element => Math.min(element.getBoundingClientRect().width, element.getBoundingClientRect().height)))
  }))
  assert(result.mobile.scrollWidth <= result.mobile.clientWidth && result.mobile.navVisible && result.mobile.minTarget >= 44, 'mobile layout, navigation, or touch targets failed')
  await context.close()
}

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' })
  const page = await context.newPage()
  watch(page)
  await page.goto(`${origin}/?demo=1`, { waitUntil: 'networkidle' })
  const before = await page.evaluate(async () => (await indexedDB.databases()).map(database => database.name))
  page.once('dialog', dialog => dialog.accept('Direct-demo person'))
  await page.getByRole('button', { name: 'Nora Ellis' }).click()
  await page.getByText('Direct-demo person').waitFor()
  const after = await page.evaluate(async () => (await indexedDB.databases()).map(database => database.name))
  result.demo.directIsolation = { before, after }
  assert(!before.includes('med-handoff-card') && !after.includes('med-handoff-card'), 'direct demo opened the real record database')
  await context.close()
}

{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  watch(page)
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.getByRole('link', { name: 'Privacy' }).first().click()
  result.routes.privacy = {
    ...await metadata(page),
    focused: await page.evaluate(() => document.activeElement === document.querySelector('h1')),
    announced: await page.locator('.route-status').innerText()
  }
  await page.screenshot({ path: `${evidence}/privacy-desktop.png`, fullPage: true })
  await page.goBack()
  result.routes.backFocused = await page.evaluate(() => document.activeElement === document.querySelector('h1'))
  await page.goForward()
  result.routes.forwardFocused = await page.evaluate(() => document.activeElement === document.querySelector('h1'))
  await page.getByRole('link', { name: 'Terms' }).click()
  result.routes.terms = await metadata(page)
  const response = await page.goto(`${origin}/missing-polish-3-${Date.now()}`, { waitUntil: 'networkidle' })
  result.routes.notFound = { ...await metadata(page), status: response?.status() }
  await page.screenshot({ path: `${evidence}/not-found-desktop.png`, fullPage: true })
  for (const [name, route] of Object.entries(result.routes)) {
    if (typeof route !== 'object') continue
    assert(route.h1Count === 1 && route.hasMain, `${name} structure is incomplete`)
    assert(route.description && route.canonical && route.ogTitle && route.twitterTitle && route.apple === '/icons/apple-touch-icon.png', `${name} metadata is incomplete`)
    assert(route.nav?.join('|') === 'Board|Demo|Tools|Privacy', `${name} shared navigation differs`)
    assert(route.footer?.includes('The app loads no analytics or code from other sites.') && !route.footer?.includes('Original artwork was generated'), `${name} footer claim regressed`)
    assert(route.theme?.includes('Use '), `${name} view control is missing`)
  }
  assert(result.routes.privacy.focused && result.routes.backFocused && result.routes.forwardFocused, 'route focus restoration failed')
  assert(result.routes.privacy.h1 === 'Privacy' && result.routes.terms.h1 === 'Terms of use', 'legal headings regressed')
  assert(result.routes.notFound.status === 404 && result.routes.notFound.h1 === 'Page not found.', 'real 404 failed')
  await context.close()
}

{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  watch(page)
  await page.goto(`${origin}/demo`, { waitUntil: 'networkidle' })
  result.routes.demo = await metadata(page)
  await page.getByRole('button', { name: 'Show QR handoff' }).click()
  const image = await page.getByAltText('QR code containing the selected medication handoff data.').evaluate(async element => {
    await element.decode()
    const canvas = document.createElement('canvas')
    canvas.width = element.naturalWidth
    canvas.height = element.naturalHeight
    const context = canvas.getContext('2d')
    context.drawImage(element, 0, 0)
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    return { width: canvas.width, height: canvas.height, pixels: Array.from(imageData.data) }
  })
  const decoded = jsQR(new Uint8ClampedArray(image.pixels), image.width, image.height)
  assert(decoded, 'live QR could not be decoded without a key')
  const payload = JSON.parse(decoded.data)
  result.demo.qr = {
    date: payload.date,
    person: payload.person,
    medications: payload.regimen.map(item => item.name),
    doses: payload.doses.map(item => ({ medicationId: item.medicationId, slot: item.slot, state: item.state }))
  }
  assert(result.demo.qr.person === 'Nora Ellis' && result.demo.qr.medications.join('|') === 'Metformin|Lisinopril|Vitamin D3', 'live QR medication list is incomplete')
  assert(result.demo.qr.doses.map(item => item.state).join('|') === 'taken|held|taken', 'live QR dose states are incomplete')
  result.accessibility.light = (await new AxeBuilder({ page }).analyze()).violations.filter(item => ['serious', 'critical'].includes(item.impact)).length
  await page.getByRole('button', { name: 'Use night view' }).click()
  result.accessibility.dark = (await new AxeBuilder({ page }).analyze()).violations.filter(item => ['serious', 'critical'].includes(item.impact)).length
  assert(result.accessibility.light === 0 && result.accessibility.dark === 0, 'serious or critical accessibility finding')
  const hrefs = await page.locator('a[href]').evaluateAll(links => [...new Set(links.map(link => link.href))])
  for (const href of hrefs) {
    const url = new URL(href)
    if (url.origin !== origin) continue
    url.hash = ''
    const linkResponse = await context.request.get(url.href)
    result.links.push({ url: url.href, status: linkResponse.status() })
    assert(linkResponse.status() === 200, `dead link: ${url.href}`)
  }
  await context.close()
}

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  watch(page)
  await page.goto(`${origin}/demo`)
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  await context.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  result.offline = {
    controlled: await page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    sample: await page.getByText('Nora Ellis').isVisible(),
    status: await page.locator('.eyebrow').first().innerText()
  }
  assert(result.offline.controlled && result.offline.sample && result.offline.status.includes('OFFLINE'), 'offline demo reload failed')
  await context.close()
}

{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  watch(page)
  await page.goto(origin)
  await page.getByRole('button', { name: 'Add your first medication' }).click()
  await page.getByLabel('Medication name').fill('Live deletion check')
  await page.getByLabel('Dose / amount').fill('5 mg')
  await page.getByLabel('Morning').check()
  await page.getByRole('button', { name: 'Save medication' }).click()
  await page.getByRole('link', { name: 'Privacy' }).first().click()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Delete this record' }).click()
  await page.getByRole('button', { name: 'Add your first medication' }).waitFor()
  await page.reload()
  result.privacy.deletion = {
    empty: await page.getByRole('button', { name: 'Add your first medication' }).isVisible(),
    removed: await page.getByText('Live deletion check').count() === 0
  }
  assert(result.privacy.deletion.empty && result.privacy.deletion.removed, 'live record deletion failed')
  await context.close()
}

assert(result.errors.length === 0, `console errors: ${result.errors.join('; ')}`)
assert(result.externalRequests.length === 0, `external requests: ${result.externalRequests.join('; ')}`)
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
await browser.close()
