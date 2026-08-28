import { handoffPayload } from '../../src/logic'

const medicationId = '550e8400-e29b-41d4-a716-446655440000'
const data = {
  personName: 'Alex',
  shiftNote: '',
  updatedAt: '2026-08-28T00:00:00Z',
  medications: [{ id: medicationId, name: 'Medicine A', dose: '5 mg', instructions: '', slots: ['Morning' as const], active: true, changedAt: '2026-08-28T00:00:00Z' }],
  logs: [{ id: 'log-1', medicationId, date: '2026-08-28', slot: 'Morning' as const, state: 'taken' as const, note: '', updatedAt: '2026-08-28T08:00:00Z' }],
}

console.log(JSON.stringify(handoffPayload(data, '2026-08-28'), null, 2))
