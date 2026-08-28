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

export interface RegimenChange {
  id: string
  medicationId: string
  medicationName: string
  previous: Pick<Medication, 'dose' | 'instructions' | 'slots' | 'active'>
  next: Pick<Medication, 'dose' | 'instructions' | 'slots' | 'active'>
  changedAt: string
}

export interface AppData {
  personName: string
  shiftNote: string
  medications: Medication[]
  logs: DoseLog[]
  regimenChanges: RegimenChange[]
  updatedAt: string
}

export const slots: Slot[] = ['Morning', 'Noon', 'Evening', 'Bedtime']
export const blankData = (): AppData => ({ personName: '', shiftNote: '', medications: [], logs: [], regimenChanges: [], updatedAt: new Date().toISOString() })
