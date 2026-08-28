export type Slot = 'Morning' | 'Noon' | 'Evening' | 'Bedtime'
export type DoseState = 'unknown' | 'taken' | 'held'

export interface Medication {
  id: string
  name: string
  dose: string
  instructions: string
  slots: Slot[]
  active: boolean
  changedAt: string
}

export interface DoseLog {
  id: string
  medicationId: string
  date: string
  slot: Slot
  state: DoseState
  note: string
  updatedAt: string
}

export interface AppData {
  personName: string
  shiftNote: string
  medications: Medication[]
  logs: DoseLog[]
  updatedAt: string
}

export const slots: Slot[] = ['Morning', 'Noon', 'Evening', 'Bedtime']
export const blankData = (): AppData => ({ personName: '', shiftNote: '', medications: [], logs: [], updatedAt: new Date().toISOString() })
