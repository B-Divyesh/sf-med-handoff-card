import type { AppData } from './types'
import { blankData } from './types'
import { normalizeAppData } from './logic'

export const REAL_DB = 'med-handoff-card'
const STORE = 'records'
const KEY = 'current'
let openDatabase: IDBDatabase | null = null
let openingDatabase: Promise<IDBDatabase> | null = null

function database(): Promise<IDBDatabase> {
  if (openDatabase) return Promise.resolve(openDatabase)
  if (openingDatabase) return openingDatabase
  openingDatabase = new Promise((resolve, reject) => {
    const request = indexedDB.open(REAL_DB, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onerror = () => {
      openingDatabase = null
      reject(request.error)
    }
    request.onsuccess = () => {
      openDatabase = request.result
      openingDatabase = null
      openDatabase.onversionchange = () => {
        openDatabase?.close()
        openDatabase = null
      }
      resolve(openDatabase)
    }
  })
  return openingDatabase
}

export async function loadData(): Promise<AppData> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const get = tx.objectStore(STORE).get(KEY)
    get.onsuccess = () => {
      if (!get.result) { resolve(blankData()); return }
      const stored = normalizeAppData(get.result)
      if (stored) resolve(stored)
      else reject(new Error('The saved record has an unsupported format.'))
    }
    get.onerror = () => reject(get.error)
  })
}

export function saveData(data: AppData): Promise<void> {
  data.updatedAt = new Date().toISOString()
  const write = (db: IDBDatabase) => new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(data, KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  // loadData opens the connection before the UI becomes interactive. Reusing
  // it starts this transaction in the click event's current task, so a reload
  // immediately after Save cannot overtake the durable write.
  return openDatabase ? write(openDatabase) : database().then(write)
}
