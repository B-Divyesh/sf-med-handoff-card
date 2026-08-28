import type { AppData, DoseLog, DoseState, Medication, Slot } from './types'

export const localDate = (date = new Date()) => date.toLocaleDateString('en-CA')

export function doseFor(data: AppData, medicationId: string, slot: Slot, date = localDate()): DoseLog | undefined {
  return data.logs.find(log => log.medicationId === medicationId && log.slot === slot && log.date === date)
}

export function updateDose(data: AppData, medicationId: string, slot: Slot, state: DoseState, note: string, date = localDate()): AppData {
  const existing = doseFor(data, medicationId, slot, date)
  const log: DoseLog = { id: existing?.id ?? crypto.randomUUID(), medicationId, slot, date, state, note, updatedAt: new Date().toISOString() }
  return { ...data, logs: existing ? data.logs.map(item => item.id === existing.id ? log : item) : [...data.logs, log] }
}

export function dueMeds(data: AppData, slot: Slot): Medication[] {
  return data.medications.filter(med => med.active && med.slots.includes(slot))
}

export function handoffPayload(data: AppData, date = localDate()) {
  return {
    version: 1,
    date,
    person: data.personName || 'Care recipient',
    note: data.shiftNote,
    regimen: data.medications.filter(m => m.active).map(({ name, dose, instructions, slots }) => ({ name, dose, instructions, slots })),
    doses: data.logs.filter(log => log.date === date).map(({ medicationId, slot, state, note }) => ({ medicationId, slot, state, note }))
  }
}

export function csv(data: AppData): string {
  const q = (value: string) => `"${value.replaceAll('"', '""')}"`
  const header = 'date,time of day,medication,dose,state,note,updated at'
  const lines = data.logs.map(log => {
    const med = data.medications.find(item => item.id === log.medicationId)
    return [log.date, log.slot, med?.name ?? 'Removed medication', med?.dose ?? '', log.state, log.note, log.updatedAt].map(q).join(',')
  })
  return [header, ...lines].join('\n')
}

export async function encryptExport(data: AppData, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt'])
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(data)))
  const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
  return JSON.stringify({ version: 1, encrypted: true, algorithm: 'AES-GCM', salt: encode(salt), iv: encode(iv), ciphertext: encode(new Uint8Array(encrypted)) })
}

export async function decryptExport(text: string, passphrase: string): Promise<AppData> {
  const parcel = JSON.parse(text)
  if (!parcel.encrypted) return parcel as AppData
  const decode = (value: string) => Uint8Array.from(atob(value), char => char.charCodeAt(0))
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: decode(parcel.salt), iterations: 150000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt'])
  const decoded = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(parcel.iv) }, key, decode(parcel.ciphertext))
  return JSON.parse(new TextDecoder().decode(decoded)) as AppData
}
