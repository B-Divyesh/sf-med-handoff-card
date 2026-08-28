import { localDate, updateDose } from './logic'
import type { AppData, Medication } from './types'

export function sampleData(): AppData {
  const now = new Date().toISOString()
  const medications: Medication[] = [
    { id: 'demo-metformin', name: 'Metformin', dose: '500 mg', instructions: 'with food', slots: ['Morning', 'Evening'], active: true, changedAt: now },
    { id: 'demo-lisinopril', name: 'Lisinopril', dose: '10 mg', instructions: 'check the written care plan', slots: ['Morning'], active: true, changedAt: now },
    { id: 'demo-vitamin-d', name: 'Vitamin D3', dose: '1,000 IU', instructions: 'with lunch', slots: ['Noon'], active: true, changedAt: now }
  ]
  let data: AppData = {
    personName: 'Nora Ellis',
    shiftNote: 'Nora ate breakfast. The evening Metformin dose still needs confirmation.',
    medications,
    logs: [],
    updatedAt: now
  }
  data = updateDose(data, 'demo-metformin', 'Morning', 'taken', 'Taken with breakfast', localDate())
  data = updateDose(data, 'demo-lisinopril', 'Morning', 'held', 'Waiting for the nurse to confirm today’s plan', localDate())
  data = updateDose(data, 'demo-vitamin-d', 'Noon', 'taken', '', localDate())
  return data
}
