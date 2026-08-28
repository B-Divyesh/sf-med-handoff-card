import type { AppData } from './types'
import { blankData } from './types'
import { normalizeAppData } from './logic'

export const REAL_DB = 'med-handoff-card'
const STORE = 'records'
const KEY = 'current'

export async function loadData(): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(REAL_DB, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const tx = request.result.transaction(STORE, 'readonly')
      const get = tx.objectStore(STORE).get(KEY)
      get.onsuccess = () => {
        if (!get.result) { resolve(blankData()); return }
        const stored = normalizeAppData(get.result)
        if (stored) resolve(stored)
        else reject(new Error('The saved record has an unsupported format.'))
      }
      get.onerror = () => reject(get.error)
    }
  })
}

export async function saveData(data: AppData): Promise<void> {
  data.updatedAt = new Date().toISOString()
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(REAL_DB, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const tx = request.result.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(data, KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    }
  })
}
