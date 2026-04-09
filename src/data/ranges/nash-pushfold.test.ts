import { describe, expect, it } from 'vitest'

import { POSITIONS } from '@/types/poker'

import { STACK_DEPTHS } from '@/features/trainer/types'
import { parseTournamentChartKey } from '@/features/trainer/lib/chart-utils'

import { charts } from './nash-pushfold'

describe('nash-pushfold chart data', () => {
  it('has at least 60 charts', () => {
    expect(Object.keys(charts).length).toBeGreaterThanOrEqual(60)
  })

  it('has a push chart for every position except BB at every stack depth', () => {
    const pushPositions = POSITIONS.filter((p) => p !== 'BB')
    for (const depth of STACK_DEPTHS) {
      for (const pos of pushPositions) {
        const key = `${pos}-push-${depth}`
        expect(charts[key], `Missing push chart: ${key}`).toBeDefined()
        expect(Object.keys(charts[key]).length, `Empty push chart: ${key}`).toBeGreaterThan(0)
      }
    }
  })

  it('has calling charts for BB vs SB and BB vs BTN at every depth', () => {
    for (const depth of STACK_DEPTHS) {
      expect(charts[`BB-vs-push-${depth}-SB`], `Missing BB vs SB at ${depth}bb`).toBeDefined()
      expect(charts[`BB-vs-push-${depth}-BTN`], `Missing BB vs BTN at ${depth}bb`).toBeDefined()
    }
  })

  it('all chart keys parse as valid tournament chart keys', () => {
    for (const key of Object.keys(charts)) {
      const parsed = parseTournamentChartKey(key)
      expect(parsed, `Invalid chart key: ${key}`).not.toBeNull()
    }
  })

  it('push charts contain only allin actions', () => {
    for (const [key, chart] of Object.entries(charts)) {
      const parsed = parseTournamentChartKey(key)
      if (parsed?.scenario !== 'push') continue
      for (const [hand, cell] of Object.entries(chart)) {
        expect(cell, `${key}:${hand} should be 'allin'`).toBe('allin')
      }
    }
  })

  it('vs-push charts contain only call actions', () => {
    for (const [key, chart] of Object.entries(charts)) {
      const parsed = parseTournamentChartKey(key)
      if (parsed?.scenario !== 'vs-push') continue
      for (const [hand, cell] of Object.entries(chart)) {
        expect(cell, `${key}:${hand} should be 'call'`).toBe('call')
      }
    }
  })

  it('push ranges get wider at shorter stack depths', () => {
    // BTN push range at 5bb should be wider than at 25bb
    const btn5 = Object.keys(charts['BTN-push-5']).length
    const btn25 = Object.keys(charts['BTN-push-25']).length
    expect(btn5).toBeGreaterThan(btn25)
  })

  it('later positions have wider push ranges', () => {
    // At 10bb, BTN push range should be wider than UTG push range
    const utg10 = Object.keys(charts['UTG-push-10']).length
    const btn10 = Object.keys(charts['BTN-push-10']).length
    expect(btn10).toBeGreaterThan(utg10)
  })
})
