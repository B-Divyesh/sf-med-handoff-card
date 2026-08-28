import QRCode from 'qrcode'
import './style.css'
import handoffTray from './assets/handoff-tray.webp'
import { sampleData } from './demo'
import { csv, decryptExport, dueMeds, encryptExport, handoffPayload, localDate, normalizeAppData, updateDose } from './logic'
import { deleteData, loadData, saveData } from './store'
import { blankData, slots, type AppData, type DoseState, type Medication, type Slot } from './types'

const app = document.querySelector<HTMLDivElement>('#app')!
let data: AppData = blankData()
let online = navigator.onLine
let message = ''
let qr = ''
let selectedDate = localDate()
let updateReady = false
let updateRequested = false

const esc = (value: string) => value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]!))
const stateLabel: Record<DoseState, string> = { taken: 'Taken', held: 'Held', unknown: 'Unknown' }
const stateMark: Record<DoseState, string> = { taken: '✓', held: 'Ⅱ', unknown: '?' }

function currentPath() { return location.pathname.replace(/\/$/, '') || '/' }
function isDemoUrl() { return currentPath() === '/demo' || (currentPath() === '/' && new URLSearchParams(location.search).get('demo') === '1') }
let demoMode = isDemoUrl()
const themeKey = () => demoMode ? 'demo:mhc_theme' : 'mhc_theme'
let theme = localStorage.getItem(themeKey()) || 'light'
let focusAfterRender = ''
const BUILD_ID = '2026.08.28-polish.3'

async function save(next = data) {
  data = next
  if (demoMode) { message = 'Demo updated. Your real record was not changed.'; render(); return }
  try {
    await saveData(data)
    if (!message) message = 'Saved on this device.'
    render()
  } catch {
    message = 'Could not save locally. Check available device storage.'
    render()
  }
}

function isPristine(): boolean { return data.medications.length === 0 && data.logs.length === 0 && data.regimenChanges.length === 0 }

function formattedDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })
}

function htmlShell(content: string) {
  const demoBanner = demoMode ? `<aside class="demo-banner" aria-label="Demo mode"><strong>Demo — sample data, nothing is saved to your real record</strong><span>Dose changes in this demo do not change your real record.</span><div><button class="banner-button" data-action="reset-demo">Reset demo</button><button class="banner-button" data-action="start-real">Start for real</button></div></aside>` : ''
  const path = currentPath()
  const toolsHref = path === '/' && !demoMode ? '#tools' : '/#tools'
  return `${demoBanner}<header class="masthead"><a class="brand" href="/" aria-label="Med Handoff Card home"><span class="brand-mark">MH</span><span>Med Handoff<br>Card</span></a><nav aria-label="Primary"><a href="/" ${path === '/' && !demoMode ? 'aria-current="page"' : ''}>Board</a><a href="/demo" ${demoMode ? 'aria-current="page"' : ''}>Demo</a><a href="${toolsHref}">Tools</a><a href="/privacy" ${path === '/privacy' ? 'aria-current="page"' : ''}>Privacy</a></nav><button class="theme" type="button" data-action="theme">${theme === 'dark' ? '☼ Use light view' : '◐ Use night view'}</button></header><main id="main">${content}</main><footer><span>Track medication handoffs between family caregivers.</span><span><a href="/privacy">Privacy</a> <a href="/terms">Terms</a></span><small>Built by Param Factory · version ${BUILD_ID} · The app loads no analytics or code from other sites.</small></footer><div class="route-status sr-only" aria-live="polite"></div><div class="toast" aria-live="polite">${updateReady ? 'An update is ready. ' : ''}${message}${updateReady ? ' <button data-action="update">Install update</button>' : ''}</div>`
}

function board() {
  if (isPristine()) return emptyBoard()
  const today = localDate()
  const dateHeading = selectedDate === today ? 'Today’s handoff' : `${formattedDate(selectedDate)} handoff`
  return `<section class="intro"><div><p class="eyebrow">${online ? 'Local handoff · ready offline' : 'Offline · changes save on this device'}</p><h1 tabindex="-1">${dateHeading}</h1><p class="recipient">For <button class="text-button" data-action="person">${esc(data.personName || 'Care recipient')}</button></p><p class="intro-copy">Record the dose state first. Leave the detail clear enough for the next caregiver.</p></div><div class="date-stamp"><label for="date">Handoff date</label><input id="date" type="date" value="${selectedDate}" max="${today}" aria-describedby="date-help"><small id="date-help">Choose today or an earlier date.</small></div></section>
    <section class="shift-note" aria-labelledby="shift-heading"><div><p class="eyebrow">Shift note</p><h2 id="shift-heading">What should the next person know?</h2></div><textarea id="shift-note" maxlength="500" placeholder="Example: New blood pressure medicine started today; hold only if prescriber said so.">${esc(data.shiftNote)}</textarea><p class="quiet">This is a caregiver record, not medical advice. Confirm unclear instructions with the prescriber or pharmacist.</p></section>
    <section aria-labelledby="dose-heading"><div class="section-heading"><div><p class="eyebrow">Dose board</p><h2 id="dose-heading">Mark each scheduled dose</h2></div><p class="quiet">${data.medications.filter(m => m.active).length} current medication${data.medications.filter(m => m.active).length === 1 ? '' : 's'}</p></div><div class="dose-grid">${slots.map(slotBoard).join('')}</div></section>
    ${regimen()} ${tools()} ${historySection()}`
}

function emptyBoard() {
  return `<section class="empty-state"><div><p class="eyebrow">Private caregiver record</p><h1 tabindex="-1">Track medication handoffs between family caregivers.</h1><p>For adult children and home caregivers who need a clear record when care changes hands.</p><div class="first-actions"><a class="primary link-button" href="/?demo=1">Try it with sample data</a><span>Open a filled sample handoff in one click.</span></div><button class="outline" data-action="add-med">Add your first medication</button><ul class="plain-facts"><li>Medication records stay in this browser.</li><li>The board works offline after your first visit.</li><li>Printing, QR handoffs, and exports are free.</li></ul></div><img src="${handoffTray}" width="900" height="900" alt="Dithered illustration of a pill organizer, blank handoff card, and pencil." fetchpriority="high" decoding="async"></section>${howItWorks()}${tools()}`
}

function howItWorks() {
  return `<section class="how" aria-labelledby="how-heading"><p class="eyebrow">How it works</p><h2 id="how-heading">Create a medication handoff in three steps</h2><ol><li><strong>Add the current medication list.</strong><span>Enter each medication, amount, and scheduled time.</span></li><li><strong>Mark each dose.</strong><span>Choose Taken, Held, or Unknown and add a note.</span></li><li><strong>Print, share, or back up the handoff.</strong><span>Print for the next caregiver, show the QR code in person, or save a backup for yourself.</span></li></ol></section>`
}

function slotBoard(slot: Slot) {
  const meds = dueMeds(data, slot)
  return `<article class="slot"><header><h3>${slot}</h3><span>${meds.length ? `${meds.length} due` : 'Nothing due'}</span></header>${meds.length ? meds.map(med => doseRow(med, slot)).join('') : '<p class="slot-empty">No current medications at this time.</p>'}</article>`
}

function doseRow(med: Medication, slot: Slot) {
  const log = data.logs.find(item => item.medicationId === med.id && item.slot === slot && item.date === selectedDate)
  const state = log?.state ?? 'unknown'
  return `<div class="dose ${state}"><div class="dose-info"><strong>${esc(med.name)}</strong><span>${esc(med.dose)}${med.instructions ? ` · ${esc(med.instructions)}` : ''}</span></div><div class="state-actions" aria-label="${esc(med.name)} at ${slot}">${(['taken', 'held', 'unknown'] as DoseState[]).map(s => `<button class="state ${s} ${state === s ? 'selected' : ''}" type="button" data-action="dose" data-id="${med.id}" data-slot="${slot}" data-state="${s}" aria-pressed="${state === s}" title="Mark ${stateLabel[s]}"><b aria-hidden="true">${stateMark[s]}</b><span>${stateLabel[s]}</span></button>`).join('')}</div>${log?.note ? `<p class="dose-note">Note: ${esc(log.note)}</p>` : ''}</div>`
}

function regimen() {
  const meds = data.medications.filter(m => m.active)
  return `<section id="regimen" class="regimen" aria-labelledby="regimen-heading"><div class="section-heading"><div><p class="eyebrow">Current medication list</p><h2 id="regimen-heading">What is prescribed now</h2></div><button class="outline" data-action="add-med">Add medication</button></div>${meds.length ? `<ul>${meds.map(m => `<li><div><strong>${esc(m.name)}</strong><span>${esc(m.dose)} · ${m.slots.join(', ')}</span>${m.instructions ? `<small>${esc(m.instructions)}</small>` : ''}</div><div class="regimen-actions"><button data-action="edit-med" data-id="${m.id}">Edit</button><button class="danger-text" data-action="stop-med" data-id="${m.id}">Stop</button></div></li>`).join('')}</ul>` : '<p class="quiet">No current medications yet.</p>'}</section>`
}

function tools() {
  return `<section id="tools" class="tools" aria-labelledby="tools-heading"><div><p class="eyebrow">Handoff tools</p><h2 id="tools-heading">Print, share, or back up the handoff</h2><p>Print the shift card, show its QR code to another caregiver, or save your own backup.</p></div><div class="tool-actions"><button class="primary" data-action="print">Print handoff</button><button class="outline" data-action="qr">Show QR handoff</button><button class="outline" data-action="export">Export backup</button><button class="outline" data-action="import">Import backup</button><input id="import-file" type="file" accept="application/json,.json" hidden></div><p class="quiet">A QR handoff contains the selected date, current medication list, and dose states. Anyone who scans it can read it, so share it only with someone you trust.</p>${qr ? `<div class="qr-card"><img src="${qr}" width="220" height="220" alt="QR code containing the selected medication handoff data."><div><h3>Ready to scan</h3><p>Ask the recipient to scan with a trusted device. The code stays here until you hide it or close the page.</p><button class="outline" data-action="hide-qr">Hide QR code</button></div></div>` : ''}</section>`
}

function historySection() {
  const heading = selectedDate === localDate() ? 'Today’s updates' : `Updates for ${formattedDate(selectedDate)}`
  const events = [
    ...data.logs.filter(log => log.date === selectedDate).map(log => ({ at: log.updatedAt, html: (() => { const med = data.medications.find(m => m.id === log.medicationId); return `<li><b class="mini-state ${log.state}">${stateMark[log.state]} ${stateLabel[log.state]}</b> ${esc(med?.name ?? 'Removed medication')} · ${log.slot} <time datetime="${log.updatedAt}">${new Date(log.updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>${log.note ? `<span>“${esc(log.note)}”</span>` : ''}</li>` })() })),
    ...data.regimenChanges.filter(change => localDate(new Date(change.changedAt)) === selectedDate).map(change => ({ at: change.changedAt, html: regimenChangeRow(change) }))
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8)
  return `<section class="history" aria-labelledby="history-heading"><p class="eyebrow">Change record</p><h2 id="history-heading">${heading}</h2>${events.length ? `<ol>${events.map(event => event.html).join('')}</ol>` : '<p class="quiet">No dose states or medication list changes were recorded for this date.</p>'}</section>`
}

function regimenChangeRow(change: AppData['regimenChanges'][number]): string {
  const time = `<time datetime="${change.changedAt}">${new Date(change.changedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>`
  if (!change.previous.active && change.next.active) return `<li class="regimen-change"><b>Medication started</b> ${esc(change.medicationName)} ${time}<span>${esc(change.next.dose)} · ${esc(change.next.slots.join(', '))}.</span></li>`
  if (change.previous.active && !change.next.active) return `<li class="regimen-change"><b>Medication stopped</b> ${esc(change.medicationName)} ${time}<span>Last regimen: ${esc(change.previous.dose)} · ${esc(change.previous.slots.join(', '))}. Existing dose history stays in this record.</span></li>`
  return `<li class="regimen-change"><b>Medication list changed</b> ${esc(change.medicationName)} ${time}<span>Was ${esc(change.previous.dose)} · ${esc(change.previous.slots.join(', '))}. Now ${esc(change.next.dose)} · ${esc(change.next.slots.join(', '))}.</span></li>`
}

function legal(kind: 'privacy' | 'terms') {
  const title = kind === 'privacy' ? 'Privacy' : 'Terms of use'
  const text = kind === 'privacy' ? `<p>Med Handoff Card stores your medications, dose states, and notes in this browser. The app does not run analytics, create an account, or send your health information to us.</p><p>Printing, QR sharing, exporting, and importing are actions you choose. Anyone who scans a QR handoff can read it. An encrypted backup requires its passphrase, which we cannot recover.</p><div class="danger-zone"><h2>Delete your local record</h2><p>Use this action to erase the medication record from this browser. Demo sample data remains separate.</p><button class="danger" data-action="delete-record">Delete this record</button></div>` : `<p>This app is a personal caregiver record. It is not medical advice, a drug-interaction checker, or an emergency service. Confirm confusing, changed, or held instructions with the prescribing clinician or pharmacist.</p><p>You are responsible for protecting printed, exported, and QR-shared information. Use of the app is provided as-is to the extent permitted by law.</p>`
  return `<section class="legal"><p class="eyebrow">Med Handoff Card</p><h1 tabindex="-1">${title}</h1>${text}<p><a href="/">Return to the handoff board</a></p></section>`
}

function notFound() {
  return `<section class="not-found"><p class="eyebrow">404 · page not found</p><h1 tabindex="-1">Page not found.</h1><p>The address may be wrong. Your medication record has not changed.</p><a class="primary link-button" href="/">Return to the handoff board</a></section>`
}

const routeMetadata = () => {
  const path = currentPath()
  if (path === '/privacy') return { title: 'Privacy — Med Handoff Card', description: 'Learn what Med Handoff Card stores in your browser and how to delete your local medication record.', canonical: '/privacy', robots: 'index,follow' }
  if (path === '/terms') return { title: 'Terms of use — Med Handoff Card', description: 'Read the terms for using Med Handoff Card as a personal caregiver medication record.', canonical: '/terms', robots: 'index,follow' }
  if (demoMode) return { title: 'Demo — Med Handoff Card', description: 'Try an isolated sample medication handoff for Nora Ellis without changing your real record.', canonical: '/demo', robots: 'noindex,follow' }
  if (path === '/') return { title: 'Med Handoff Card — caregiver medication handoffs', description: 'Track scheduled doses and leave a clear medication handoff for the next family caregiver.', canonical: '/', robots: 'index,follow' }
  return { title: 'Page not found — Med Handoff Card', description: 'The requested Med Handoff Card page could not be found.', canonical: '/404.html', robots: 'noindex,nofollow' }
}

function setMeta(selector: string, attribute: string, value: string) {
  const element = document.querySelector<HTMLMetaElement | HTMLLinkElement>(selector)
  if (element) element.setAttribute(attribute, value)
}

function render() {
  document.documentElement.dataset.theme = theme
  const path = currentPath()
  const boardPath = path === '/' || path === '/demo'
  const meta = routeMetadata()
  const absoluteCanonical = `https://med-handoff-card.sociobot.in${meta.canonical}`
  document.title = meta.title
  setMeta('meta[name="description"]', 'content', meta.description)
  setMeta('meta[name="robots"]', 'content', meta.robots)
  setMeta('link[rel="canonical"]', 'href', absoluteCanonical)
  setMeta('meta[property="og:title"]', 'content', meta.title)
  setMeta('meta[property="og:description"]', 'content', meta.description)
  setMeta('meta[property="og:url"]', 'content', absoluteCanonical)
  setMeta('meta[name="twitter:title"]', 'content', meta.title)
  setMeta('meta[name="twitter:description"]', 'content', meta.description)
  app.innerHTML = htmlShell(path === '/privacy' ? legal('privacy') : path === '/terms' ? legal('terms') : boardPath ? board() : notFound())
  if (focusAfterRender) { const target = app.querySelector<HTMLElement>(focusAfterRender); focusAfterRender = ''; queueMicrotask(() => target?.focus()) }
}

async function loadModeData() {
  const nextDemoMode = isDemoUrl()
  if (nextDemoMode === demoMode) return
  demoMode = nextDemoMode
  selectedDate = localDate()
  qr = ''
  message = ''
  theme = localStorage.getItem(themeKey()) || 'light'
  if (demoMode) data = sampleData()
  else data = await loadData()
}

async function showRoute(options: { focus?: boolean, scrollY?: number } = {}) {
  try { await loadModeData() } catch { data = blankData(); message = 'Could not read the saved record. Start a new handoff or import a valid backup.' }
  render()
  if (options.focus) {
    const heading = app.querySelector<HTMLElement>('h1')
    queueMicrotask(() => {
      heading?.focus({ preventScroll: true })
      app.querySelector<HTMLElement>('.route-status')!.textContent = `${document.title} loaded`
      if (typeof options.scrollY === 'number') scrollTo(0, options.scrollY)
      else if (location.hash) document.querySelector(location.hash)?.scrollIntoView()
      else scrollTo(0, 0)
    })
  }
}

async function navigate(url: URL) {
  history.replaceState({ ...(history.state || {}), scrollY }, '')
  history.pushState({ scrollY: 0 }, '', `${url.pathname}${url.search}${url.hash}`)
  await showRoute({ focus: true })
}

function openMedication(med?: Medication) {
  const existing = med
  const dialog = document.createElement('dialog')
  dialog.className = 'dialog'
  dialog.setAttribute('aria-labelledby', 'med-dialog-title')
  dialog.innerHTML = `<form method="dialog" id="med-form" aria-labelledby="med-dialog-title"><header><p class="eyebrow">Current medication list</p><h2 id="med-dialog-title">${existing ? 'Edit medication' : 'Add medication'}</h2></header><label>Medication name<input name="name" required maxlength="80" value="${esc(existing?.name ?? '')}" autocomplete="off"></label><label>Dose / amount<input name="dose" required maxlength="80" value="${esc(existing?.dose ?? '')}" placeholder="Example: 10 mg"></label><label>Directions <span class="optional">optional</span><input name="instructions" maxlength="160" value="${esc(existing?.instructions ?? '')}" placeholder="Example: with breakfast"></label><fieldset><legend>Scheduled time of day</legend>${slots.map(slot => `<label class="check"><input type="checkbox" name="slots" value="${slot}" ${existing?.slots.includes(slot) ? 'checked' : ''}> ${slot}</label>`).join('')}</fieldset><p class="form-error" aria-live="assertive"></p><footer><button class="outline" value="cancel">Cancel</button><button class="primary" value="save">Save medication</button></footer></form>`
  document.body.append(dialog); dialog.showModal(); dialog.querySelector<HTMLInputElement>('input[name="name"]')!.focus()
  dialog.querySelector<HTMLFormElement>('#med-form')!.addEventListener('submit', async event => {
    const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | null
    if (submitter?.value !== 'save') return
    event.preventDefault()
    const form = new FormData(event.currentTarget as HTMLFormElement)
    const chosen = form.getAll('slots').map(String) as Slot[]
    const error = dialog.querySelector('.form-error')!
    const name = String(form.get('name')).trim()
    const dose = String(form.get('dose')).trim()
    if (!name || !dose) { error.textContent = 'Enter a medication name and dose or amount.'; return }
    if (!chosen.length) { error.textContent = 'Choose at least one time of day.'; return }
    const medication: Medication = { id: existing?.id ?? crypto.randomUUID(), name, dose, instructions: String(form.get('instructions')).trim(), slots: chosen, active: true, changedAt: new Date().toISOString() }
    const changedAt = new Date().toISOString()
    const prior = existing ?? { ...medication, active: false }
    const change = !existing || existing.dose !== medication.dose || existing.instructions !== medication.instructions || existing.active !== medication.active || existing.slots.join('|') !== medication.slots.join('|') ? { id: crypto.randomUUID(), medicationId: medication.id, medicationName: medication.name, previous: { dose: prior.dose, instructions: prior.instructions, slots: prior.slots, active: prior.active }, next: { dose: medication.dose, instructions: medication.instructions, slots: medication.slots, active: medication.active }, changedAt } : null
    focusAfterRender = existing ? '#regimen-heading' : 'h1'
    message = `${medication.name} saved in the current medication list.`
    // Close the modal before rendering so focus can legally move to the
    // updated board. Browsers prevent focus from leaving an open modal.
    dialog.close()
    await save({ ...data, medications: existing ? data.medications.map(m => m.id === existing.id ? medication : m) : [...data.medications, medication], regimenChanges: change ? [...data.regimenChanges, change] : data.regimenChanges })
  })
  dialog.addEventListener('close', () => dialog.remove())
}

function download(name: string, value: string, type = 'application/json') { const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([value], { type })); link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 500) }

async function exportData() {
  const protect = confirm('Protect the JSON backup with a passphrase? Choose Cancel for a readable JSON backup.')
  if (protect) { const pass = prompt('Create a passphrase. You must remember it to import this backup.'); if (!pass) return; download(`med-handoff-backup-${localDate()}.encrypted.json`, await encryptExport(data, pass)); message = 'Encrypted backup downloaded. Keep the passphrase separately.' }
  else { download(`med-handoff-backup-${localDate()}.json`, JSON.stringify(data, null, 2)); download(`med-handoff-dose-log-${localDate()}.csv`, csv(data), 'text/csv'); message = 'JSON backup and CSV dose log downloaded.' }
  render()
}

async function importData(file: File) { try { const text = await file.text(); const parsed = JSON.parse(text); const decrypted = parsed.encrypted ? await decryptExport(text, prompt('Enter the backup passphrase.') || '') : parsed; const imported = normalizeAppData(decrypted); if (!imported) throw new Error('That file is not a complete Med Handoff Card backup.'); if (!confirm(`Replace this device’s current record with the backup for ${imported.personName || 'this care recipient'}?`)) return; message = 'Backup restored to this device.'; await save(imported) } catch { message = 'Could not import that backup. Check the file and passphrase.'; render() } }

async function showQr() { try { qr = await QRCode.toDataURL(JSON.stringify(handoffPayload(data, selectedDate)), { errorCorrectionLevel: 'M', margin: 1, color: { dark: '#142a36', light: '#f7f0df' }, width: 440 }); message = 'QR handoff created locally.' } catch { message = 'Could not create the QR handoff.' } render() }

document.addEventListener('click', async event => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]'); if (!target) return
  const action = target.dataset.action
  if (action === 'theme') { theme = theme === 'dark' ? 'light' : 'dark'; localStorage.setItem(themeKey(), theme); render() }
  if (action === 'person') { const name = prompt('Who is this handoff for?', data.personName); if (name !== null) { save({ ...data, personName: name.trim() }); message = 'Care recipient name saved.' } }
  if (action === 'add-med') openMedication()
  if (action === 'edit-med') openMedication(data.medications.find(m => m.id === target.dataset.id))
  if (action === 'stop-med') { const med = data.medications.find(m => m.id === target.dataset.id); if (med && confirm(`Stop showing ${med.name} in the current medication list? Existing dose history will stay.`)) { const changedAt = new Date().toISOString(); const stopped = { ...med, active: false, changedAt }; const change = { id: crypto.randomUUID(), medicationId: med.id, medicationName: med.name, previous: { dose: med.dose, instructions: med.instructions, slots: med.slots, active: med.active }, next: { dose: stopped.dose, instructions: stopped.instructions, slots: stopped.slots, active: stopped.active }, changedAt }; message = `${med.name} moved out of the current medication list. Its history stays in this record.`; await save({ ...data, medications: data.medications.map(m => m.id === med.id ? stopped : m), regimenChanges: [...data.regimenChanges, change] }) } }
  if (action === 'dose') { if (selectedDate > localDate()) { selectedDate = localDate(); message = 'Future doses cannot be recorded. Choose today or an earlier date.'; render(); return } const id = target.dataset.id!, slot = target.dataset.slot as Slot, state = target.dataset.state as DoseState; const current = data.logs.find(log => log.medicationId === id && log.slot === slot && log.date === selectedDate); const note = prompt(`Optional note for ${stateLabel[state].toLowerCase()} (${slot}):`, current?.note ?? ''); if (note !== null) { message = `Marked ${stateLabel[state].toLowerCase()}.`; await save(updateDose(data, id, slot, state, note.trim(), selectedDate)) } }
  if (action === 'print') window.print()
  if (action === 'export') await exportData()
  if (action === 'import') document.querySelector<HTMLInputElement>('#import-file')?.click()
  if (action === 'qr') await showQr()
  if (action === 'hide-qr') { qr = ''; render() }
  if (action === 'reset-demo') { data = sampleData(); selectedDate = localDate(); qr = ''; message = 'Demo reset to its original sample.'; render() }
  if (action === 'start-real') await navigate(new URL('/', location.origin))
  if (action === 'delete-record' && confirm('Delete this medication record from this browser? Medications, dose states, notes, and history will be erased.')) {
    try {
      await deleteData()
      data = blankData()
      message = 'This medication record was deleted from this browser.'
      await navigate(new URL('/', location.origin))
    } catch { message = 'Could not delete this record. Check browser storage access and try again.'; render() }
  }
  if (action === 'update') { const registration = await navigator.serviceWorker.getRegistration(); if (registration?.waiting) { updateRequested = true; registration.waiting.postMessage('skip-waiting') } }
})

document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]')
  if (!anchor || anchor.target || anchor.hasAttribute('download')) return
  const url = new URL(anchor.href, location.href)
  if (url.origin !== location.origin) return
  if (url.pathname === location.pathname && url.search === location.search && url.hash) return
  event.preventDefault()
  void navigate(url)
})

document.addEventListener('input', event => { const element = event.target as HTMLInputElement; if (element.id === 'date' && element.value > localDate()) { selectedDate = localDate(); message = 'Future doses cannot be recorded. Choose today or an earlier date.'; render() } })
document.addEventListener('change', event => { const element = event.target as HTMLInputElement; if (element.id === 'date') { selectedDate = element.value && element.value <= localDate() ? element.value : localDate(); if (element.value > localDate()) message = 'Future doses cannot be recorded. Choose today or an earlier date.'; render() }; if (element.id === 'import-file' && element.files?.[0]) void importData(element.files[0]) })
document.addEventListener('blur', event => { const element = event.target as HTMLTextAreaElement; if (element.id === 'shift-note' && element.value !== data.shiftNote) { save({ ...data, shiftNote: element.value }); message = 'Shift note saved.' } }, true)
window.addEventListener('online', () => { online = true; render() }); window.addEventListener('offline', () => { online = false; render() })
window.addEventListener('popstate', event => { void showRoute({ focus: true, scrollY: typeof event.state?.scrollY === 'number' ? event.state.scrollY : 0 }) })
let scrollFrame = 0
window.addEventListener('scroll', () => {
  cancelAnimationFrame(scrollFrame)
  scrollFrame = requestAnimationFrame(() => history.replaceState({ ...(history.state || {}), scrollY }, ''))
}, { passive: true })

async function init() {
  if (demoMode) data = sampleData()
  else try { data = await loadData() } catch { message = 'Could not read the saved record. Start a new handoff or import a valid backup.' }
  history.replaceState({ ...(history.state || {}), scrollY }, '')
  render()
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').then(registration => {
    const check = () => { if (registration.waiting && navigator.serviceWorker.controller) { updateReady = true; render() } }
    check()
    registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', check))
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (updateRequested) location.reload() })
    navigator.serviceWorker.ready.then(ready => ready.active?.postMessage({ type: 'cache-assets', assets: performance.getEntriesByType('resource').map(entry => entry.name) }))
  }).catch(() => undefined)
}
void init()
