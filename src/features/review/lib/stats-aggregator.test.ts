import { describe, expect, it } from 'vitest'

import type { EnrichedSpotResult } from '../types'

import {
  aggregateByHand,
  aggregateByPosition,
  aggregateByScenario,
  aggregateOverall,
  filterByTimeRange,
} from './stats-aggregator'

function makeResult(overrides: Partial<EnrichedSpotResult> = {}): EnrichedSpotResult {
  return {
    id: 1,
    spotId: 'spot-1',
    userAction: 'raise',
    isCorrect: true,
    evLossEstimate: 0,
    qualityScore: 5,
    timestamp: Date.now(),
    decisionTimeMs: 2000,
    provider: 'pekarstas',
    hero: 'BTN',
    villain: null,
    scenario: 'RFI',
    heroHand: 'AKs',
    rolledNumber: 50,
    correctAction: 'raise',
    ...overrides,
  }
}

describe('aggregateOverall', () => {
  it('returns zero stats for empty input', () => {
    const stats = aggregateOverall([])
    expect(stats.total).toBe(0)
    expect(stats.accuracy).toBe(0)
  })

  it('computes accuracy from mixed results', () => {
    const results = [
      makeResult({ isCorrect: true, evLossEstimate: 0, decisionTimeMs: 1000 }),
      makeResult({ isCorrect: false, evLossEstimate: 0.5, decisionTimeMs: 3000 }),
      makeResult({ isCorrect: true, evLossEstimate: 0, decisionTimeMs: 2000 }),
    ]
    const stats = aggregateOverall(results)
    expect(stats.total).toBe(3)
    expect(stats.correct).toBe(2)
    expect(stats.accuracy).toBe(67)
    expect(stats.avgDecisionTimeMs).toBe(2000)
  })
})

describe('aggregateByPosition', () => {
  it('groups results by hero position', () => {
    const results = [
      makeResult({ hero: 'BTN', isCorrect: true }),
      makeResult({ hero: 'BTN', isCorrect: false }),
      makeResult({ hero: 'SB', isCorrect: true }),
    ]
    const byPos = aggregateByPosition(results)
    expect(byPos.BTN?.total).toBe(2)
    expect(byPos.BTN?.correct).toBe(1)
    expect(byPos.SB?.total).toBe(1)
    expect(byPos.SB?.accuracy).toBe(100)
    expect(byPos.UTG).toBeUndefined()
  })
})

describe('aggregateByScenario', () => {
  it('groups results by scenario type', () => {
    const results = [
      makeResult({ scenario: 'RFI', isCorrect: true }),
      makeResult({ scenario: 'vs-open', isCorrect: false }),
      makeResult({ scenario: 'vs-open', isCorrect: true }),
    ]
    const bySc = aggregateByScenario(results)
    expect(bySc.RFI?.total).toBe(1)
    expect(bySc['vs-open']?.total).toBe(2)
    expect(bySc['vs-open']?.accuracy).toBe(50)
  })
})

describe('aggregateByHand', () => {
  it('computes per-hand accuracy', () => {
    const results = [
      makeResult({ heroHand: 'AKs', isCorrect: true }),
      makeResult({ heroHand: 'AKs', isCorrect: false }),
      makeResult({ heroHand: '72o', isCorrect: false }),
    ]
    const byHand = aggregateByHand(results)
    expect(byHand.get('AKs')?.accuracy).toBe(50)
    expect(byHand.get('72o')?.accuracy).toBe(0)
    expect(byHand.get('AA')).toBeUndefined()
  })
})

describe('filterByTimeRange', () => {
  it('returns all results for "all" range', () => {
    const results = [makeResult({ timestamp: 1000 })]
    expect(filterByTimeRange(results, 'all')).toHaveLength(1)
  })

  it('filters out old results for "7d" range', () => {
    const now = Date.now()
    const results = [
      makeResult({ timestamp: now }),
      makeResult({ timestamp: now - 8 * 24 * 60 * 60 * 1000 }),
    ]
    expect(filterByTimeRange(results, '7d')).toHaveLength(1)
  })

  it('filters to today only', () => {
    const now = Date.now()
    const yesterday = now - 25 * 60 * 60 * 1000
    const results = [makeResult({ timestamp: now }), makeResult({ timestamp: yesterday })]
    expect(filterByTimeRange(results, 'today')).toHaveLength(1)
  })
})
