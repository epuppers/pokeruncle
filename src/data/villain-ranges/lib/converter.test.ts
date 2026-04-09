import { describe, it, expect } from 'vitest'

import { convertSolverOutput } from './converter'

describe('convertSolverOutput', () => {
  it('converts a pure call combo to a simple string cell', () => {
    const strategies = new Map([
      // All 6 combos of AA calling 100%
      ['AHAD', { CALL: 1.0, FOLD: 0.0 }],
      ['AHAC', { CALL: 1.0, FOLD: 0.0 }],
      ['AHAS', { CALL: 1.0, FOLD: 0.0 }],
      ['ADAC', { CALL: 1.0, FOLD: 0.0 }],
      ['ADAS', { CALL: 1.0, FOLD: 0.0 }],
      ['ACAS', { CALL: 1.0, FOLD: 0.0 }],
    ])

    const chart = convertSolverOutput(strategies)
    expect(chart['AA']).toBe('call')
  })

  it('converts a pure fold hand to sparse (not in chart)', () => {
    const strategies = new Map([
      ['2H3D', { FOLD: 1.0, CALL: 0.0 }],
      ['2D3H', { FOLD: 1.0, CALL: 0.0 }],
    ])

    const chart = convertSolverOutput(strategies)
    expect(chart['32o']).toBeUndefined()
  })

  it('converts a mixed strategy to a WeightedCell', () => {
    const strategies = new Map([
      // AKs: 80% call, 20% fold across all 4 suited combos
      ['AHKH', { CALL: 0.8, FOLD: 0.2 }],
      ['ADKD', { CALL: 0.8, FOLD: 0.2 }],
      ['ACKS', { CALL: 0.8, FOLD: 0.2 }],
      ['ASKC', { CALL: 0.8, FOLD: 0.2 }],
    ])

    const chart = convertSolverOutput(strategies)
    const cell = chart['AKs']
    expect(cell).toBeDefined()
    expect(typeof cell).toBe('object')
    if (typeof cell === 'object' && !Array.isArray(cell)) {
      expect(cell.weight).toBe(80)
      expect(cell.actions.call).toBe(100) // 100% of the non-fold portion is call
    }
  })

  it('handles mixed actions (call + raise)', () => {
    const strategies = new Map([
      // QJs: 60% call, 20% raise, 20% fold
      ['QHJH', { CALL: 0.6, RAISE: 0.2, FOLD: 0.2 }],
      ['QDJD', { CALL: 0.6, RAISE: 0.2, FOLD: 0.2 }],
      ['QCJC', { CALL: 0.6, RAISE: 0.2, FOLD: 0.2 }],
      ['QSJS', { CALL: 0.6, RAISE: 0.2, FOLD: 0.2 }],
    ])

    const chart = convertSolverOutput(strategies)
    const cell = chart['QJs']
    expect(cell).toBeDefined()
    if (typeof cell === 'object' && !Array.isArray(cell)) {
      expect(cell.weight).toBe(80) // 80% of the time this hand is in range
      // 0.6/0.8 = 75%, 0.2/0.8 = 25%
      expect(cell.actions.call).toBe(75)
      expect(cell.actions.raise).toBe(25)
    }
  })

  it('averages across combos within a hand class', () => {
    const strategies = new Map([
      // AKo: some combos call, some fold. 12 combos total for offsuit.
      // 6 combos call 100%, 6 combos fold 100% → ~50% weight
      ['AHKD', { CALL: 1.0, FOLD: 0.0 }],
      ['AHKC', { CALL: 1.0, FOLD: 0.0 }],
      ['AHKS', { CALL: 1.0, FOLD: 0.0 }],
      ['ADKH', { CALL: 1.0, FOLD: 0.0 }],
      ['ADKC', { CALL: 1.0, FOLD: 0.0 }],
      ['ADKS', { CALL: 1.0, FOLD: 0.0 }],
      ['ACKH', { FOLD: 1.0, CALL: 0.0 }],
      ['ACKD', { FOLD: 1.0, CALL: 0.0 }],
      ['ACKS', { FOLD: 1.0, CALL: 0.0 }],
      ['ASKH', { FOLD: 1.0, CALL: 0.0 }],
      ['ASKD', { FOLD: 1.0, CALL: 0.0 }],
      ['ASKC', { FOLD: 1.0, CALL: 0.0 }],
    ])

    const chart = convertSolverOutput(strategies)
    const cell = chart['AKo']
    expect(cell).toBeDefined()
    if (typeof cell === 'object' && !Array.isArray(cell)) {
      expect(cell.weight).toBe(50) // half the combos continue
      expect(cell.actions.call).toBe(100) // all continuing combos call
    }
  })

  it('maps BET to raise action', () => {
    const strategies = new Map([
      ['AHAD', { BET: 1.0, FOLD: 0.0 }],
      ['AHAC', { BET: 1.0, FOLD: 0.0 }],
      ['AHAS', { BET: 1.0, FOLD: 0.0 }],
      ['ADAC', { BET: 1.0, FOLD: 0.0 }],
      ['ADAS', { BET: 1.0, FOLD: 0.0 }],
      ['ACAS', { BET: 1.0, FOLD: 0.0 }],
    ])

    const chart = convertSolverOutput(strategies)
    expect(chart['AA']).toBe('raise')
  })

  it('respects minWeight threshold', () => {
    const strategies = new Map([
      // 98% fold, 2% call → weight = 2
      ['2H7D', { FOLD: 0.98, CALL: 0.02 }],
    ])

    // Default minWeight=1 includes it
    const chart1 = convertSolverOutput(strategies, 1)
    expect(chart1['72o']).toBeDefined()

    // minWeight=5 excludes it
    const chart2 = convertSolverOutput(strategies, 5)
    expect(chart2['72o']).toBeUndefined()
  })

  it('returns an empty chart for all-fold input', () => {
    const strategies = new Map([
      ['2H3D', { FOLD: 1.0 }],
      ['4H5D', { FOLD: 1.0 }],
    ])

    const chart = convertSolverOutput(strategies)
    expect(Object.keys(chart)).toHaveLength(0)
  })
})
