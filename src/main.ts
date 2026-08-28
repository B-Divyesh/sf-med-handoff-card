import QRCode from 'qrcode'
import './style.css'
import handoffTray from './assets/handoff-tray.webp'
import { sampleData } from './demo'
import { csv, decryptExport, dueMeds, encryptExport, handoffPayload, localDate, normalizeAppData, updateDose } from './logic'
import { loadData, saveData } from './store'
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
const initialParams = new URLSearchParams(location.search)
const demoMode = currentPath() === '/demo' || initialParams.get('demo') === '1'
const themeKey = demoMode ? 'demo:mhc_theme' : 'mhc_theme'
let theme = localStorage.getItem(themeKey) || 'light'
let focusAfterRender = ''

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

function empty(): boolean { return data.medications.filter(m => m.active).length === 0 }

function htmlShell(content: string) {
  const demoBanner = demoMode ? `<aside class="demo-banner" aria-label="Demo mode"><strong>Demo — sample data, nothing is saved to your real record</strong><span>Try every control without changing your real record.</span><div><button class="banner-button" data-action="reset-demo">Reset demo</button><button class="banner-button" data-action="start-real">Start for real</button></div></aside>` : ''
  return `${demoBanner}<header class="masthead"><a class="brand" href="/" aria-label="Med Handoff Card home"><span class="brand-mark">MH</span><span>Med Handoff<br>Card</span></a><nav aria-label="Primary"><a href="/" ${currentPath() === '/' && !demoMode ? 'aria-current="page"' : ''}>Board</a><a href="/demo" ${demoMode ? 'aria-current="page"' : ''}>Demo</a><a href="#tools">Tools</a><a href="/privacy" ${currentPath() === '/privacy' ? 'aria-current="page"' : ''}>Privacy</a></nav><button class="theme" type="button" data-action="theme" aria-label="Switch to ${theme === 'dark' ? 'light' : 'dark'} appearance">${theme === 'dark' ? '☼' : '◐'} <span>${theme === 'dark' ? 'Light' : 'Night'}</span></button></header><main id="main">${content}</main><footer><span>Medication records stay in this browser.</span><span><a href="/privacy">Privacy</a> <a href="/terms">Terms</a></span><small>Built by Param Factory · version 2026.08.28-repair.2 · Original artwork was generated for Med Handoff Card. The app uses no analytics or third-party runtime scripts.</small></footer><div class="route-status sr-only" aria-live="polite"></div><div class="toast" aria-live="polite">${updateReady ? 'An update is ready. ' : ''}${message}${updateReady ? ' <button data-action="update">Install update</button>' : ''}</div>`
}

function board() {
  if (empty()) return emptyBoard()
  return `<section class="intro"><div><p class="eyebrow">${online ? 'Local handoff · ready offline' : 'Offline · changes save on this device'}</p><h1 tabindex="-1">Today’s handoff</h1><p class="recipient">For <button class="text-button" data-action="person">${esc(data.personName || 'Care recipient')}</button></p><p class="intro-copy">Record the dose state first. Leave the detail clear enough for the next caregiver.</p></div><div class="date-stamp"><label for="date">Handoff date</label><input id="date" type="date" value="${selectedDate}"></div></section>
    <section class="shift-note" aria-labelledby="shift-heading"><div><p class="eyebrow">Shift note</p><h2 id="shift-heading">What should the next person know?</h2></div><textarea id="shift-note" maxlength="500" placeholder="Example: New blood pressure medicine started today; hold only if prescriber said so.">${esc(data.shiftNote)}</textarea><p class="quiet">This is a caregiver record, not medical advice. Confirm unclear instructions with the prescriber or pharmacist.</p></section>
    <section aria-labelledby="dose-heading"><div class="section-heading"><div><p class="eyebrow">Dose board</p><h2 id="dose-heading">Mark each scheduled dose</h2></div><p class="quiet">${data.medications.filter(m => m.active).length} current medicine${data.medications.filter(m => m.active).length === 1 ? '' : 's'}</p></div><div class="dose-grid">${slots.map(slotBoard).join('')}</div></section>
    ${regimen()} ${tools()} ${historySection()}`
}

function emptyBoard() {
  return `<section class="empty-state"><div><p class="eyebrow">Private caregiver record</p><h1 tabindex="-1">Track medicine handoffs between family caregivers.</h1><p>For adult children and home caregivers who need a clear record when care changes hands.</p><div class="first-actions"><a class="primary link-button" href="/demo">Try it with sample data</a><span>See a filled handoff board in one click.</span></div><button class="outline" data-action="add-med">Add your first medication</button><ul class="plain-facts"><li>Medication records stay in this browser.</li><li>The board works offline after your first visit.</li><li>Printing, QR handoffs, and exports are free.</li></ul></div><img src="${handoffTray}" width="900" height="900" alt="Dithered illustration of a pill organizer, blank handoff card, and pencil." fetchpriority="high" decoding="async"></section>${howItWorks()}${tools()}`
}

function howItWorks() {
  return `<section class="how" aria-labelledby="how-heading"><p class="eyebrow">How it works</p><h2 id="how-heading">Leave the next caregiver a clear record</h2><ol><li><strong>Add the current list.</strong><span>Enter each medication, amount, and scheduled time.</span></li><li><strong>Mark each dose.</strong><span>Choose Taken, Held, or Unknown and add a note.</span></li><li><strong>Hand it over.</strong><span>Print the card, show a QR handoff, or export a backup.</span></li></ol></section>`
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
  return `<section id="regimen" class="regimen" aria-labelledby="regimen-heading"><div class="section-heading"><div><p class="eyebrow">Current regimen</p><h2 id="regimen-heading">What is prescribed now</h2></div><button class="outline" data-action="add-med">Add medication</button></div>${meds.length ? `<ul>${meds.map(m => `<li><div><strong>${esc(m.name)}</strong><span>${esc(m.dose)} · ${m.slots.join(', ')}</span>${m.instructions ? `<small>${esc(m.instructions)}</small>` : ''}</div><div class="regimen-actions"><button data-action="edit-med" data-id="${m.id}">Edit</button><button class="danger-text" data-action="stop-med" data-id="${m.id}">Stop</button></div></li>`).join('')}</ul>` : '<p class="quiet">No active medications yet.</p>'}</section>`
}

function tools() {
  return `<section id="tools" class="tools" aria-labelledby="tools-heading"><div><p class="eyebrow">Handoff tools</p><h2 id="tools-heading">Leave a clear record</h2><p>Print the shift card, show its QR code to another caregiver, or save your own backup.</p></div><div class="tool-actions"><button class="primary" data-action="print">Print handoff</button><button class="outline" data-action="qr">Show QR handoff</button><button class="outline" data-action="export">Export backup</button><label class="outline file-label">Import backup<input id="import-file" type="file" accept="application/json,.json" hidden></label></div><p class="quiet">A QR handoff contains today’s active regimen and dose states. It is not encrypted; use it only with someone you trust.</p>${qr ? `<div class="qr-card"><img src="${qr}" width="220" height="220" alt="QR code containing today’s medication handoff data."><div><h3>Ready to scan</h3><p>Ask the recipient to scan with a trusted device. The code stays here until you hide it or close the page.</p><button class="outline" data-action="hide-qr">Hide QR code</button></div></div>` : ''}</section>`
}

function historySection() {
  const events = [
    ...data.logs.filter(log => log.date === selectedDate).map(log => ({ at: log.updatedAt, html: (() => { const med = data.medications.find(m => m.id === log.medicationId); return `<li><b class="mini-state ${log.state}">${stateMark[log.state]} ${stateLabel[log.state]}</b> ${esc(med?.name ?? 'Removed medication')} · ${log.slot} <time datetime="${log.updatedAt}">${new Date(log.updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>${log.note ? `<span>“${esc(log.note)}”</span>` : ''}</li>` })() })),
    ...data.regimenChanges.map(change => ({ at: change.changedAt, html: `<li class="regimen-change"><b>Regimen changed</b> ${esc(change.medicationName)} <time datetime="${change.changedAt}">${new Date(change.changedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time><span>Was ${esc(change.previous.dose)} · ${esc(change.previous.slots.join(', '))}. Now ${esc(change.next.dose)} · ${esc(change.next.slots.join(', '))}.</span></li>` }))
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8)
  return `<section class="history" aria-labelledby="history-heading"><p class="eyebrow">Change record</p><h2 id="history-heading">Today’s updates</h2>${events.length ? `<ol>${events.map(event => event.html).join('')}</ol>` : '<p class="quiet">No dose states recorded yet. Unknown is a valid state until you can confirm what happened.</p>'}</section>`
}

function legal(kind: 'privacy' | 'terms') {
  const title = kind === 'privacy' ? 'Privacy, plainly.' : 'Terms for a practical handoff.'
  const text = kind === 'privacy' ? `<p>Med Handoff Card stores your medications, dose states, and notes in this browser. The app does not run analytics, create an account, or send your health information to us.</p><p>Printing, QR sharing, exporting, and importing are actions you choose. QR data is not encrypted. Encrypted export uses your passphrase locally, and we cannot recover it. Clear your browser data to remove local records.</p>` : `<p>This app is a personal caregiver record. It is not medical advice, a drug-interaction checker, or an emergency service. Confirm confusing, changed, or held instructions with the prescribing clinician or pharmacist.</p><p>You are responsible for protecting printed, exported, and QR-shared information. Use of the app is provided as-is to the extent permitted by law.</p>`
  return `<section class="legal"><p class="eyebrow">Med Handoff Card</p><h1>${title}</h1>${text}<p><a href="/">Return to the handoff board</a></p></section>`
}

function notFound() {
  return `<section class="not-found"><p class="eyebrow">404 · page not found</p><h1>This page is not on the handoff card.</h1><p>The address may be wrong. Your medication record has not changed.</p><a class="primary link-button" href="/">Return to the handoff board</a></section>`
}

function render() {
  document.documentElement.dataset.theme = theme
  const path = currentPath()
  const boardPath = path === '/' || path === '/demo'
  document.title = path === '/privacy' ? 'Privacy — Med Handoff Card' : path === '/terms' ? 'Terms — Med Handoff Card' : demoMode ? 'Demo — Med Handoff Card' : boardPath ? 'Med Handoff Card — track caregiver dose handoffs' : 'Page not found — Med Handoff Card'
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href = `https://med-handoff-card.sociobot.in${path === '/' ? '/' : path}`
  app.innerHTML = htmlShell(path === '/privacy' ? legal('privacy') : path === '/terms' ? legal('terms') : boardPath ? board() : notFound())
  if (focusAfterRender) { const target = app.querySelector<HTMLElement>(focusAfterRender); focusAfterRender = ''; queueMicrotask(() => target?.focus()) }
}

function openMedication(med?: Medication) {
  const existing = med
  const dialog = document.createElement('dialog')
  dialog.className = 'dialog'
  dialog.setAttribute('aria-labelledby', 'med-dialog-title')
  dialog.innerHTML = `<form method="dialog" id="med-form" aria-labelledby="med-dialog-title"><header><p class="eyebrow">Current regimen</p><h2 id="med-dialog-title">${existing ? 'Edit medication' : 'Add medication'}</h2></header><label>Medication name<input name="name" required maxlength="80" value="${esc(existing?.name ?? '')}" autocomplete="off"></label><label>Dose / amount<input name="dose" required maxlength="80" value="${esc(existing?.dose ?? '')}" placeholder="Example: 10 mg"></label><label>Directions <span class="optional">optional</span><input name="instructions" maxlength="160" value="${esc(existing?.instructions ?? '')}" placeholder="Example: with breakfast"></label><fieldset><legend>Scheduled time of day</legend>${slots.map(slot => `<label class="check"><input type="checkbox" name="slots" value="${slot}" ${existing?.slots.includes(slot) ? 'checked' : ''}> ${slot}</label>`).join('')}</fieldset><p class="form-error" aria-live="assertive"></p><footer><button class="outline" value="cancel">Cancel</button><button class="primary" value="save">Save medication</button></footer></form>`
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
    const change = existing && (existing.dose !== medication.dose || existing.instructions !== medication.instructions || existing.active !== medication.active || existing.slots.join('|') !== medication.slots.join('|')) ? { id: crypto.randomUUID(), medicationId: existing.id, medicationName: existing.name, previous: { dose: existing.dose, instructions: existing.instructions, slots: existing.slots, active: existing.active }, next: { dose: medication.dose, instructions: medication.instructions, slots: medication.slots, active: medication.active }, changedAt } : null
    focusAfterRender = existing ? '#regimen-heading' : 'h1'
    message = `${medication.name} saved in the current regimen.`
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
  if (action === 'theme') { theme = theme === 'dark' ? 'light' : 'dark'; localStorage.setItem(themeKey, theme); render() }
  if (action === 'person') { const name = prompt('Who is this handoff for?', data.personName); if (name !== null) { save({ ...data, personName: name.trim() }); message = 'Care recipient name saved.' } }
  if (action === 'add-med') openMedication()
  if (action === 'edit-med') openMedication(data.medications.find(m => m.id === target.dataset.id))
  if (action === 'stop-med') { const med = data.medications.find(m => m.id === target.dataset.id); if (med && confirm(`Stop showing ${med.name} in the current regimen? Existing dose history will stay.`)) { save({ ...data, medications: data.medications.map(m => m.id === med.id ? { ...m, active: false, changedAt: new Date().toISOString() } : m) }); message = `${med.name} moved out of the current regimen.` } }
  if (action === 'dose') { const id = target.dataset.id!, slot = target.dataset.slot as Slot, state = target.dataset.state as DoseState; const current = data.logs.find(log => log.medicationId === id && log.slot === slot && log.date === selectedDate); const note = prompt(`Optional note for ${stateLabel[state].toLowerCase()} (${slot}):`, current?.note ?? ''); if (note !== null) { save(updateDose(data, id, slot, state, note.trim(), selectedDate)); message = `Marked ${stateLabel[state].toLowerCase()}.` } }
  if (action === 'print') window.print()
  if (action === 'export') await exportData()
  if (action === 'qr') await showQr()
  if (action === 'hide-qr') { qr = ''; render() }
  if (action === 'reset-demo') { data = sampleData(); selectedDate = localDate(); qr = ''; message = 'Demo reset to its original sample.'; render() }
  if (action === 'start-real') location.assign('/')
  if (action === 'update') { const registration = await navigator.serviceWorker.getRegistration(); if (registration?.waiting) { updateRequested = true; registration.waiting.postMessage('skip-waiting') } }
})

document.addEventListener('change', event => { const element = event.target as HTMLInputElement; if (element.id === 'date') { selectedDate = element.value || localDate(); render() }; if (element.id === 'import-file' && element.files?.[0]) void importData(element.files[0]) })
document.addEventListener('blur', event => { const element = event.target as HTMLTextAreaElement; if (element.id === 'shift-note' && element.value !== data.shiftNote) { save({ ...data, shiftNote: element.value }); message = 'Shift note saved.' } }, true)
window.addEventListener('online', () => { online = true; render() }); window.addEventListener('offline', () => { online = false; render() })

async function init() {
  if (demoMode) data = sampleData()
  else try { data = await loadData() } catch { message = 'Could not read the saved record. Start a new handoff or import a valid backup.' }
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
