import { describe, it, expect } from 'vitest'
import { loadProvider, getChartFromLoaded, getCellFromLoaded, resolveCorrectAction } from './range-loader'

describe('loadProvider', () => {
  it('loads pekarstas charts', async () => {
    const charts = await loadProvider('pekarstas')
    expect(Object.keys(charts).length).toBeGreaterThan(0)
  })

  it('loads greenline charts', async () => {
    const charts = await loadProvider('greenline')
    expect(Object.keys(charts).length).toBeGreaterThan(0)
  })

  it('returns the same promise on repeated calls', () => {
    const p1 = loadProvider('pekarstas')
    const p2 = loadProvider('pekarstas')
    expect(p1).toBe(p2)
  })
})

describe('getChartFromLoaded', () => {
  it('returns a chart for a valid key', async () => {
    const charts = await loadProvider('pekarstas')
    const chart = getChartFromLoaded(charts, 'BTN', 'RFI')
    expect(chart).not.toBeNull()
    expect(Object.keys(chart!).length).toBeGreaterThan(0)
  })

  it('returns null for a missing chart', async () => {
    const charts = await loadProvider('pekarstas')
    const chart = getChartFromLoaded(charts, 'BB', 'RFI')
    expect(chart).toBeNull()
  })
})

describe('getCellFromLoaded', () => {
  it('returns the cell for a hand in the chart', async () => {
    const charts = await loadProvider('pekarstas')
    const cell = getCellFromLoaded(charts, 'BTN', 'RFI', 'AA')
    expect(cell).not.toBe('fold')
  })

  it('returns fold for a hand not in the chart', async () => {
    const charts = await loadProvider('pekarstas')
    const cell = getCellFromLoaded(charts, 'UTG', 'RFI', '72o')
    expect(cell).toBe('fold')
  })
})

describe('resolveCorrectAction', () => {
  it('returns the single action for a pure-strategy cell', () => {
    expect(resolveCorrectAction('raise', 50)).toBe('raise')
  })

  it('resolves the correct band for a legacy tuple', () => {
    // ['raise', 'call'] = 50/50 split
    const action1 = resolveCorrectAction(['raise', 'call'], 30)
    const action2 = resolveCorrectAction(['raise', 'call'], 70)
    expect(action1).toBe('raise')
    expect(action2).toBe('call')
  })

  it('resolves the correct band for a weighted cell', () => {
    const cell = { weight: 100, actions: { raise: 70, call: 30 } }
    expect(resolveCorrectAction(cell, 70)).toBe('raise')
    expect(resolveCorrectAction(cell, 71)).toBe('call')
  })
})
