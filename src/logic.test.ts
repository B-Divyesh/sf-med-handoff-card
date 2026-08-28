import { describe, expect, it } from 'vitest'
import { csv, dueMeds, handoffPayload, normalizeAppData, updateDose } from './logic'
import { blankData, type Medication } from './types'

const med: Medication = { id: 'a', name: 'Cedar', dose: '10 mg', instructions: 'with food', slots: ['Morning'], active: true, changedAt: '2026-08-28T09:00:00.000Z' }

describe('handoff data', () => {
  it('records one replaceable state per medication, time and day', () => {
    let data = { ...blankData(), medications: [med] }
    data = updateDose(data, 'a', 'Morning', 'unknown', '', '2026-08-28')
    data = updateDose(data, 'a', 'Morning', 'taken', 'after breakfast', '2026-08-28')
    expect(data.logs).toHaveLength(1)
    expect(data.logs[0]).toMatchObject({ state: 'taken', note: 'after breakfast' })
  })
  it('exports a small clear handoff and csv', () => {
    const data = updateDose({ ...blankData(), personName: 'Mara', medications: [med] }, 'a', 'Morning', 'held', 'call pharmacist', '2026-08-28')
    expect(dueMeds(data, 'Morning')).toEqual([med])
    expect(handoffPayload(data, '2026-08-28')).toMatchObject({ person: 'Mara', regimen: [{ medicationId: 'a', name: 'Cedar' }], doses: [{ medicationId: 'a' }] })
    expect(csv(data)).toContain('"held"')
  })
  it('rejects malformed backups and upgrades valid legacy backups safely', () => {
    expect(normalizeAppData({ personName: 'QA', shiftNote: '', medications: [{ active: true }], logs: [] })).toBeNull()
    const legacy = { ...blankData(), medications: [med], regimenChanges: undefined }
    expect(normalizeAppData(legacy)).toMatchObject({ medications: [{ name: 'Cedar' }], regimenChanges: [] })
  })
})
