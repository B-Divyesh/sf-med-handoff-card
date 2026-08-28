import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import jsQR from 'jsqr'

const origin = 'https://med-handoff-card.sociobot.in'
const browser = await chromium.launch({ headless: true })
const result = { cold: {}, demo: {}, routes: {}, accessibility: {}, mobile: {}, offline: {}, privacy: {}, errors: [], externalRequests: [] }
const assert = (value, message) => { if (!value) throw new Error(message) }
const watch = page => {
  page.on('console', message => { if (message.type() === 'error' && !message.text().includes('status of 404')) result.errors.push(message.text()) })
  page.on('pageerror', error => result.errors.push(error.message))
  page.on('request', request => { if (new URL(request.url()).origin !== origin) result.externalRequests.push(request.url()) })
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
  nav: [...document.querySelectorAll('nav a')].map(link => link.textContent?.trim()),
  footer: document.querySelector('footer')?.textContent?.replace(/\s+/g, ' ').trim(),
  theme: document.querySelector('[data-action="theme"]')?.textContent?.replace(/\s+/g, ' ').trim()
}))

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' })
  const page = await context.newPage()
  watch(page)
  await page.goto(`${origin}/?cold=polish-2-${Date.now()}`, { waitUntil: 'networkidle' })
  result.routes.home = await metadata(page)
  result.cold = await page.evaluate(() => ({
    headline: document.querySelector('h1')?.textContent?.trim(),
    audience: document.querySelector('.empty-state h1 + p')?.textContent?.trim(),
    action: document.querySelector('.first-actions a')?.textContent?.trim(),
    actionResult: document.querySelector('.first-actions span')?.textContent?.trim(),
    actionBottom: document.querySelector('.first-actions a')?.getBoundingClientRect().bottom,
    facts: [...document.querySelectorAll('.plain-facts li')].map(item => item.textContent?.trim()),
    howHeading: document.querySelector('#how-heading')?.textContent?.trim(),
    thirdStep: {
      action: document.querySelector('.how li:nth-child(3) strong')?.textContent?.trim(),
      explanation: document.querySelector('.how li:nth-child(3) span')?.textContent?.trim()
    },
    build: document.querySelector('footer small')?.textContent?.match(/version ([^ ·]+)/)?.[1]
  }))
  assert(result.cold.headline === 'Track medication handoffs between family caregivers.', 'first-screen headline differs')
  assert(result.cold.action === 'Try it with sample data' && result.cold.actionBottom < 844 && result.cold.facts.length === 3, 'first-screen action or facts failed')
  assert(result.cold.howHeading === 'Create a medication handoff in three steps', 'F-2-2 heading not live')
  assert(result.cold.thirdStep.action === 'Print, share, or back up the handoff.' && result.cold.thirdStep.explanation === 'Print for the next caregiver, show the QR code in person, or save a backup for yourself.', 'F-2-1 third step not live')
  assert(result.cold.build === '2026.08.28-polish.2', 'new build is not live')
  await page.screenshot({ path: '.factory/qa-evidence/polish-2/live/home-mobile.png', fullPage: true })

  await page.getByRole('link', { name: 'Try it with sample data' }).click()
  assert(page.url() === `${origin}/?demo=1`, 'demo did not open at the isolated query URL in one click')
  result.demo.entry = {
    banner: await page.getByLabel('Demo mode').innerText(),
    person: await page.getByText('Nora Ellis').first().innerText(),
    medications: await page.locator('#regimen li').count(),
    shiftNote: await page.locator('#shift-note').inputValue(),
    states: await page.locator('.state.selected span').allTextContents()
  }
  assert(result.demo.entry.medications === 3 && result.demo.entry.states.includes('Taken') && result.demo.entry.states.includes('Held'), 'demo sample is incomplete')
  page.once('dialog', dialog => dialog.accept('Demo-only person'))
  await page.getByRole('button', { name: 'Nora Ellis' }).click()
  await page.getByText('Demo-only person').waitFor()
  result.demo.realRecordAfterEdit = await page.evaluate(() => new Promise((resolve, reject) => {
    const open = indexedDB.open('med-handoff-card', 1)
    open.onerror = () => reject(open.error)
    open.onsuccess = () => {
      const get = open.result.transaction('records', 'readonly').objectStore('records').get('current')
      get.onerror = () => reject(get.error)
      get.onsuccess = () => resolve(get.result ?? null)
    }
  }))
  assert(result.demo.realRecordAfterEdit === null, 'demo wrote a real IndexedDB record')
  await page.getByRole('button', { name: 'Reset demo' }).click()
  assert(await page.getByText('Nora Ellis').first().isVisible(), 'demo reset did not restore sample')
  await page.screenshot({ path: '.factory/qa-evidence/polish-2/live/demo-mobile.png', fullPage: true })
  await page.getByRole('button', { name: 'Start for real' }).click()
  await page.waitForURL(`${origin}/`)
  await page.getByRole('button', { name: 'Add your first medication' }).waitFor()
  result.demo.realAfterExit = { url: page.url(), sampleCount: await page.getByText('Nora Ellis').count(), empty: await page.getByRole('button', { name: 'Add your first medication' }).isVisible() }
  assert(result.demo.realAfterExit.url === `${origin}/` && result.demo.realAfterExit.sampleCount === 0 && result.demo.realAfterExit.empty, 'leaving demo carried sample data into the real record')
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  result.mobile = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    navVisible: getComputedStyle(document.querySelector('nav')).display !== 'none',
    minTarget: Math.min(...[...document.querySelectorAll('a,button,input:not([type="hidden"]),textarea')].filter(element => {
      const style = getComputedStyle(element)
      const box = element.getBoundingClientRect()
      return style.display !== 'none' && style.visibility !== 'hidden' && box.width && box.height
    }).map(element => Math.min(element.getBoundingClientRect().width, element.getBoundingClientRect().height)))
  }))
  assert(result.mobile.scrollWidth <= result.mobile.clientWidth && result.mobile.navVisible && result.mobile.minTarget >= 44, 'mobile or 200% text layout failed')
  await context.close()
}

{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  watch(page)
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.getByRole('link', { name: 'Privacy' }).first().click()
  result.routes.privacy = { ...await metadata(page), focused: await page.evaluate(() => document.activeElement === document.querySelector('h1')), announced: await page.locator('.route-status').innerText() }
  await page.screenshot({ path: '.factory/qa-evidence/polish-2/live/privacy-desktop.png', fullPage: true })
  await page.goBack()
  result.routes.backFocused = await page.evaluate(() => document.activeElement === document.querySelector('h1'))
  await page.goForward()
  result.routes.forwardFocused = await page.evaluate(() => document.activeElement === document.querySelector('h1'))
  await page.getByRole('link', { name: 'Terms' }).click()
  result.routes.terms = await metadata(page)
  const response = await page.goto(`${origin}/missing-polish-2-${Date.now()}`, { waitUntil: 'networkidle' })
  result.routes.notFound = { ...await metadata(page), status: response?.status() }
  await page.screenshot({ path: '.factory/qa-evidence/polish-2/live/not-found-desktop.png', fullPage: true })
  for (const [name, route] of Object.entries(result.routes)) {
    if (typeof route !== 'object') continue
    assert(route.h1Count === 1, `${name} does not have one h1`)
    assert(route.description && route.canonical && route.ogTitle && route.twitterTitle && route.apple === '/icons/apple-touch-icon.png', `${name} metadata is incomplete`)
    assert(route.nav?.join('|') === 'Board|Demo|Tools|Privacy', `${name} shared navigation differs`)
    assert(route.footer?.includes('Original artwork was generated') && route.theme?.includes('Use '), `${name} shared chrome differs`)
  }
  assert(result.routes.privacy.focused && result.routes.backFocused && result.routes.forwardFocused, 'route focus restoration failed')
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
  const payload = JSON.parse(decoded.data)
  result.demo.qr = { medications: payload.regimen.map(item => item.name), states: payload.doses.map(item => item.state) }
  assert(result.demo.qr.medications.join('|') === 'Metformin|Lisinopril|Vitamin D3' && result.demo.qr.states.length === 3, 'live QR contents are incomplete')
  result.accessibility.light = (await new AxeBuilder({ page }).analyze()).violations.filter(item => ['serious', 'critical'].includes(item.impact)).length
  await page.getByRole('button', { name: 'Use night view' }).click()
  result.accessibility.dark = (await new AxeBuilder({ page }).analyze()).violations.filter(item => ['serious', 'critical'].includes(item.impact)).length
  assert(result.accessibility.light === 0 && result.accessibility.dark === 0, 'serious or critical accessibility finding')
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
  result.offline = { controlled: await page.evaluate(() => Boolean(navigator.serviceWorker.controller)), sample: await page.getByText('Nora Ellis').isVisible(), status: await page.locator('.eyebrow').first().innerText() }
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
  result.privacy.deletion = { empty: await page.getByRole('button', { name: 'Add your first medication' }).isVisible(), removed: await page.getByText('Live deletion check').count() === 0 }
  assert(result.privacy.deletion.empty && result.privacy.deletion.removed, 'live record deletion failed')
  await context.close()
}

assert(result.errors.length === 0, `console errors: ${result.errors.join('; ')}`)
assert(result.externalRequests.length === 0, `external requests: ${result.externalRequests.join('; ')}`)
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
await browser.close()
