import { describe, expect, it } from 'vitest'

import type { MasteryRecord } from '@/lib/db'
import type { WeightedCell } from '@/types/poker'

import { createInitialMastery, estimateEvLoss, evToQualityScore, updateMastery } from './sm2'

describe('evToQualityScore', () => {
  it('returns Q=5 for zero EV loss', () => {
    expect(evToQualityScore(0)).toBe(5)
  })

  it('returns Q=2 for ~0.15bb EV loss at k=5', () => {
    expect(evToQualityScore(0.15, 5)).toBe(2)
  })

  it('returns Q=0 for catastrophic EV loss', () => {
    expect(evToQualityScore(1.0, 5)).toBe(0)
  })

  it('penalizes harder as strictness k increases', () => {
    expect(evToQualityScore(0.1, 10)).toBeLessThan(evToQualityScore(0.1, 5))
  })

  it('never returns below 0', () => {
    expect(evToQualityScore(100, 5)).toBe(0)
  })

  it('uses k=5 by default', () => {
    expect(evToQualityScore(0.2)).toBe(evToQualityScore(0.2, 5))
  })
})

describe('estimateEvLoss', () => {
  it('returns 0 when user action matches correct action', () => {
    expect(estimateEvLoss('raise', 'raise', 'raise')).toBe(0)
  })

  it('returns 0.5bb for wrong answer on a pure-strategy cell', () => {
    expect(estimateEvLoss('raise', 'fold', 'raise')).toBe(0.5)
  })

  it('returns proportional loss for mixed-strategy weighted cells', () => {
    const cell: WeightedCell = {
      weight: 100,
      actions: { raise: 70, call: 30 },
    }
    // Correct = raise (70%), user = call (30%), gap = 40% → 0.4bb
    const loss = estimateEvLoss(cell, 'call', 'raise')
    expect(loss).toBeCloseTo(0.4)
  })

  it('returns higher loss when user picks an action not in the mix', () => {
    const cell: WeightedCell = {
      weight: 100,
      actions: { raise: 60, call: 40 },
    }
    // Correct = raise (60%), user = fold (0%), gap = 60% → 0.6bb
    const loss = estimateEvLoss(cell, 'fold', 'raise')
    expect(loss).toBeCloseTo(0.6)
  })

  it('handles legacy tuple cells', () => {
    const cell: ['raise', 'call'] = ['raise', 'call']
    // 50/50 split: correct = raise (50%), user = fold (0%), gap = 50%
    const loss = estimateEvLoss(cell, 'fold', 'raise')
    expect(loss).toBeCloseTo(0.5)
  })
})

describe('updateMastery', () => {
  function makeRecord(overrides?: Partial<MasteryRecord>): MasteryRecord {
    return {
      spotTypeKey: 'test:UTG:RFI:AKs',
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextReviewAt: Date.now(),
      lastReviewedAt: 0,
      ...overrides,
    }
  }

  it('sets interval to 1 on first successful review', () => {
    const updated = updateMastery(makeRecord(), 5)
    expect(updated.interval).toBe(1)
    expect(updated.repetitions).toBe(1)
  })

  it('sets interval to 6 on second successful review', () => {
    const updated = updateMastery(makeRecord({ repetitions: 1 }), 5)
    expect(updated.interval).toBe(6)
    expect(updated.repetitions).toBe(2)
  })

  it('multiplies interval by ease factor on subsequent reviews', () => {
    const record = makeRecord({ repetitions: 2, interval: 6, easeFactor: 2.5 })
    const updated = updateMastery(record, 5)
    expect(updated.interval).toBe(15) // round(6 * 2.5)
    expect(updated.repetitions).toBe(3)
  })

  it('resets repetitions and interval on failure (Q < 3)', () => {
    const record = makeRecord({ repetitions: 5, interval: 30, easeFactor: 2.5 })
    const updated = updateMastery(record, 2)
    expect(updated.repetitions).toBe(0)
    expect(updated.interval).toBe(1)
  })

  it('floors ease factor at 1.3', () => {
    const record = makeRecord({ easeFactor: 1.3 })
    const updated = updateMastery(record, 0)
    expect(updated.easeFactor).toBe(1.3)
  })

  it('increases ease factor for Q=5', () => {
    const record = makeRecord({ easeFactor: 2.5 })
    const updated = updateMastery(record, 5)
    expect(updated.easeFactor).toBeGreaterThan(2.5)
  })

  it('decreases ease factor for Q=3', () => {
    const record = makeRecord({ easeFactor: 2.5 })
    const updated = updateMastery(record, 3)
    expect(updated.easeFactor).toBeLessThan(2.5)
  })

  it('sets nextReviewAt in the future', () => {
    const now = Date.now()
    const updated = updateMastery(makeRecord(), 5)
    expect(updated.nextReviewAt).toBeGreaterThanOrEqual(now)
  })

  it('preserves the spotTypeKey', () => {
    const updated = updateMastery(makeRecord(), 5)
    expect(updated.spotTypeKey).toBe('test:UTG:RFI:AKs')
  })
})

describe('createInitialMastery', () => {
  it('creates a record with SM-2 defaults', () => {
    const record = createInitialMastery('pekarstas:UTG:RFI:AKs')
    expect(record.spotTypeKey).toBe('pekarstas:UTG:RFI:AKs')
    expect(record.easeFactor).toBe(2.5)
    expect(record.interval).toBe(1)
    expect(record.repetitions).toBe(0)
    expect(record.lastReviewedAt).toBe(0)
  })

  it('sets nextReviewAt to approximately now', () => {
    const before = Date.now()
    const record = createInitialMastery('key')
    expect(record.nextReviewAt).toBeGreaterThanOrEqual(before)
    expect(record.nextReviewAt).toBeLessThanOrEqual(Date.now())
  })
})
