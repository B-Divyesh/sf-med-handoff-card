import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import jsQR from 'jsqr'

const origin = 'https://med-handoff-card.sociobot.in'
const browser = await chromium.launch({ headless: true })
const result = { routes: {}, demo: {}, accessibility: {}, mobile: {}, offline: {}, deletion: {}, errors: [], externalRequests: [] }
const assert = (value, message) => { if (!value) throw new Error(message) }
const watch = page => {
  page.on('console', message => { if (message.type() === 'error' && !message.text().includes('status of 404')) result.errors.push(message.text()) })
  page.on('pageerror', error => result.errors.push(error.message))
  page.on('request', request => { if (new URL(request.url()).origin !== origin) result.externalRequests.push(request.url()) })
}
const meta = page => page.evaluate(() => ({
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
  await page.goto(`${origin}/?cold=${Date.now()}`, { waitUntil: 'networkidle' })
  result.routes.home = await meta(page)
  const first = await page.evaluate(() => ({
    action: document.querySelector('.first-actions a')?.textContent?.trim(),
    actionBottom: document.querySelector('.first-actions a')?.getBoundingClientRect().bottom,
    facts: [...document.querySelectorAll('.plain-facts li')].map(item => item.textContent?.trim()),
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }))
  assert(first.action === 'Try it with sample data' && first.actionBottom < 844 && first.facts.length === 3, 'cold first screen failed')
  await page.screenshot({ path: '.factory/qa-evidence/polish-1/live/screenshots/home-mobile.png', fullPage: true })
  await page.getByRole('link', { name: 'Try it with sample data' }).click()
  assert(page.url() === `${origin}/?demo=1`, 'one-click demo did not use ?demo=1')
  result.routes.demoQuery = await meta(page)
  result.demo = {
    banner: await page.getByLabel('Demo mode').innerText(),
    person: await page.getByText('Nora Ellis').first().innerText(),
    medications: await page.locator('#regimen li').count(),
    shiftNote: await page.locator('#shift-note').inputValue()
  }
  await page.screenshot({ path: '.factory/qa-evidence/polish-1/live/screenshots/demo-mobile.png', fullPage: true })
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
  assert(result.mobile.scrollWidth <= result.mobile.clientWidth && result.mobile.navVisible && result.mobile.minTarget >= 44, 'mobile layout failed')
  await context.close()
}

{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  watch(page)
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.getByRole('link', { name: 'Privacy' }).first().click()
  result.routes.privacy = { ...await meta(page), focus: await page.evaluate(() => document.activeElement === document.querySelector('h1')), announcement: await page.locator('.route-status').innerText() }
  await page.goBack()
  result.routes.backFocus = await page.evaluate(() => document.activeElement === document.querySelector('h1'))
  await page.goForward()
  result.routes.forwardFocus = await page.evaluate(() => document.activeElement === document.querySelector('h1'))
  await page.getByRole('link', { name: 'Terms' }).click()
  result.routes.terms = await meta(page)
  const response = await page.goto(`${origin}/missing-polish-1-${Date.now()}`, { waitUntil: 'networkidle' })
  result.routes.notFound = { ...await meta(page), status: response?.status() }
  await page.screenshot({ path: '.factory/qa-evidence/polish-1/live/screenshots/not-found-desktop.png', fullPage: true })
  for (const [name, route] of Object.entries(result.routes)) {
    if (typeof route !== 'object') continue
    assert(route.h1Count === 1, `${name} does not have one h1`)
    assert(route.description && route.canonical && route.ogTitle && route.twitterTitle && route.apple === '/icons/apple-touch-icon.png', `${name} metadata incomplete`)
    assert(route.nav?.join('|') === 'Board|Demo|Tools|Privacy', `${name} chrome differs`)
    assert(route.footer?.includes('Original artwork was generated') && route.theme?.includes('Use '), `${name} footer or theme differs`)
  }
  assert(result.routes.privacy.focus && result.routes.backFocus && result.routes.forwardFocus, 'route focus failed')
  assert(result.routes.notFound.status === 404 && result.routes.notFound.h1 === 'Page not found.', '404 failed')
  await context.close()
}

{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  watch(page)
  await page.goto(`${origin}/demo`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Show QR handoff' }).click()
  const image = await page.getByAltText('QR code containing the selected medication handoff data.').evaluate(async element => {
    await element.decode()
    const canvas = document.createElement('canvas')
    canvas.width = element.naturalWidth
    canvas.height = element.naturalHeight
    const context = canvas.getContext('2d')
    context.drawImage(element, 0, 0)
    return { width: canvas.width, height: canvas.height, pixels: Array.from(context.getImageData(0, 0, canvas.width, canvas.height).data) }
  })
  const decoded = jsQR(new Uint8ClampedArray(image.pixels), image.width, image.height)
  const payload = JSON.parse(decoded.data)
  result.demo.qr = { date: payload.date, regimen: payload.regimen.map(item => item.name), doses: payload.doses.map(item => `${item.medicationId}:${item.slot}:${item.state}`) }
  assert(result.demo.qr.regimen.join('|') === 'Metformin|Lisinopril|Vitamin D3' && result.demo.qr.doses.length === 3, 'QR contents failed')
  result.accessibility.light = (await new AxeBuilder({ page }).analyze()).violations.filter(item => ['serious', 'critical'].includes(item.impact)).length
  await page.getByRole('button', { name: 'Use night view' }).click()
  result.accessibility.dark = (await new AxeBuilder({ page }).analyze()).violations.filter(item => ['serious', 'critical'].includes(item.impact)).length
  assert(result.accessibility.light === 0 && result.accessibility.dark === 0, 'axe failed')
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
  await page.getByRole('heading', { name: 'Track medication handoffs between family caregivers.' }).waitFor()
  await page.reload()
  result.deletion = { empty: await page.getByRole('button', { name: 'Add your first medication' }).isVisible(), removed: await page.getByText('Live deletion check').count() === 0 }
  assert(result.deletion.empty && result.deletion.removed, 'record deletion failed')
  await context.close()
}

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  watch(page)
  await page.goto(`${origin}/demo`)
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  for (let index = 0; index < 20; index++) {
    if (await page.evaluate(() => Boolean(navigator.serviceWorker.controller))) break
    await page.waitForTimeout(250)
  }
  await context.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  result.offline = {
    controlled: await page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    h1: await page.locator('h1').innerText(),
    sample: await page.getByText('Nora Ellis').isVisible(),
    status: await page.locator('.eyebrow').first().innerText()
  }
  assert(result.offline.controlled && result.offline.sample && result.offline.status.includes('OFFLINE'), 'offline reload failed')
  await context.close()
}

{
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(`${origin}/icons/apple-touch-icon.png`)
  result.routes.appleIcon = await page.locator('img').evaluate(image => ({ width: image.naturalWidth, height: image.naturalHeight }))
  await context.close()
}
assert(result.routes.appleIcon.width === 180 && result.routes.appleIcon.height === 180, 'apple icon is not 180px')
assert(result.errors.length === 0, `console errors: ${result.errors.join('; ')}`)
assert(result.externalRequests.length === 0, `external requests: ${result.externalRequests.join('; ')}`)
console.log(JSON.stringify(result, null, 2))
await browser.close()
