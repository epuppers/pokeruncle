import { describe, expect, it } from 'vitest'

import { ACTIONS } from '@/types/poker'

import type { MasteryRecord } from '@/lib/db'

import type { SpotFilters } from '@/features/trainer/types'

import { resolveCorrectAction } from './range-loader'
import { generateSmartSpot, generateSpot } from './spot-generator'
import type { ProviderCharts } from './range-loader'

const testCharts: ProviderCharts = {
  'UTG-RFI': {
    AA: 'raise',
    KK: 'raise',
    AKs: 'raise',
    '72o': 'fold',
  },
  'BB-vs-open-BTN': {
    AKs: 'call',
    QQ: 'raise',
    '87s': ['raise', 'fold'],
  },
}

describe('generateSpot', () => {
  it('generates a spot with all required fields', () => {
    const spot = generateSpot(testCharts, 'pekarstas')
    expect(spot.id).toBeTruthy()
    expect(spot.provider).toBe('pekarstas')
    expect(spot.heroHand).toBeTruthy()
    expect(spot.rolledNumber).toBeGreaterThanOrEqual(1)
    expect(spot.rolledNumber).toBeLessThanOrEqual(100)
    expect(ACTIONS).toContain(spot.correctAction)
  })

  it('picks a hand that exists in the chart', () => {
    for (let i = 0; i < 20; i++) {
      const spot = generateSpot(testCharts, 'pekarstas')
      if (spot.scenario === 'RFI') {
        expect(['AA', 'KK', 'AKs', '72o']).toContain(spot.heroHand)
      } else {
        expect(['AKs', 'QQ', '87s']).toContain(spot.heroHand)
      }
    }
  })

  it('computes correctAction consistent with resolveCorrectAction', () => {
    for (let i = 0; i < 20; i++) {
      const spot = generateSpot(testCharts, 'pekarstas')
      const expected = resolveCorrectAction(spot.cell, spot.rolledNumber)
      expect(spot.correctAction).toBe(expected)
    }
  })

  it('returns open kind for RFI spots', () => {
    const rfiSpot = generateSpot(testCharts, 'pekarstas', 'RFI')
    expect(rfiSpot.kind).toBe('open')
    expect(rfiSpot.scenario).toBe('RFI')
    if (rfiSpot.kind === 'open') {
      expect(rfiSpot).not.toHaveProperty('villain')
    }
  })

  it('returns response kind for vs-open spots', () => {
    const spot = generateSpot(testCharts, 'pekarstas', 'vs-open')
    expect(spot.kind).toBe('response')
    if (spot.kind === 'response') {
      expect(spot.villain).toBe('BTN')
    }
  })

  it('respects scenario filter', () => {
    for (let i = 0; i < 20; i++) {
      const spot = generateSpot(testCharts, 'pekarstas', 'RFI')
      expect(spot.scenario).toBe('RFI')
    }
  })

  it('throws for empty charts', () => {
    expect(() => generateSpot({}, 'pekarstas')).toThrow('No charts available')
  })

  it('throws for unavailable scenario filter', () => {
    expect(() => generateSpot(testCharts, 'pekarstas', 'vs-4bet')).toThrow('No charts available')
  })
})

const emptyFilters: SpotFilters = { positions: [], scenarios: [], handTypes: [] }

describe('generateSmartSpot', () => {
  it('generates a valid spot with no mastery records (all unseen)', () => {
    const spot = generateSmartSpot(testCharts, 'pekarstas', [], emptyFilters)
    expect(spot.id).toBeTruthy()
    expect(spot.provider).toBe('pekarstas')
    expect(ACTIONS).toContain(spot.correctAction)
  })

  it('prioritizes overdue spots over unseen ones', () => {
    const pastDue: MasteryRecord = {
      spotTypeKey: 'pekarstas:UTG:RFI:AA',
      easeFactor: 2.5,
      interval: 1,
      repetitions: 1,
      nextReviewAt: Date.now() - 100_000, // overdue
      lastReviewedAt: Date.now() - 200_000,
    }

    // Run multiple times — should always pick the overdue spot
    for (let i = 0; i < 10; i++) {
      const spot = generateSmartSpot(testCharts, 'pekarstas', [pastDue], emptyFilters)
      expect(spot.heroHand).toBe('AA')
      expect(spot.hero).toBe('UTG')
    }
  })

  it('picks unseen spots when nothing is due', () => {
    const future: MasteryRecord = {
      spotTypeKey: 'pekarstas:UTG:RFI:AA',
      easeFactor: 2.5,
      interval: 30,
      repetitions: 5,
      nextReviewAt: Date.now() + 86_400_000 * 30, // 30 days from now
      lastReviewedAt: Date.now(),
    }

    // With only AA mastered and far in the future, should pick other hands
    for (let i = 0; i < 10; i++) {
      const spot = generateSmartSpot(testCharts, 'pekarstas', [future], emptyFilters)
      // Should not pick the mastered-and-not-due spot when unseen spots exist
      if (spot.hero === 'UTG' && spot.scenario === 'RFI') {
        expect(spot.heroHand).not.toBe('AA')
      }
    }
  })

  it('respects position filter', () => {
    const filters: SpotFilters = { positions: ['BB'], scenarios: [], handTypes: [] }
    for (let i = 0; i < 10; i++) {
      const spot = generateSmartSpot(testCharts, 'pekarstas', [], filters)
      expect(spot.hero).toBe('BB')
    }
  })

  it('respects scenario filter', () => {
    const filters: SpotFilters = { positions: [], scenarios: ['RFI'], handTypes: [] }
    for (let i = 0; i < 10; i++) {
      const spot = generateSmartSpot(testCharts, 'pekarstas', [], filters)
      expect(spot.scenario).toBe('RFI')
    }
  })

  it('respects hand type filter', () => {
    const filters: SpotFilters = { positions: [], scenarios: [], handTypes: ['pair'] }
    // Only pairs from testCharts: AA, KK (UTG-RFI), QQ (BB-vs-open-BTN)
    for (let i = 0; i < 10; i++) {
      const spot = generateSmartSpot(testCharts, 'pekarstas', [], filters)
      expect(spot.heroHand).toMatch(/^[AKQJT98765432]{2}$/) // pair format: two same-rank chars
    }
  })

  it('throws when no spots match filters', () => {
    const filters: SpotFilters = { positions: ['MP'], scenarios: [], handTypes: [] }
    expect(() => generateSmartSpot(testCharts, 'pekarstas', [], filters)).toThrow(
      'No spots match the current filters',
    )
  })

  it('crams soonest-due when all spots are seen and none due', () => {
    const records: MasteryRecord[] = [
      'pekarstas:UTG:RFI:AA',
      'pekarstas:UTG:RFI:KK',
      'pekarstas:UTG:RFI:AKs',
      'pekarstas:UTG:RFI:72o',
    ].map((key, i) => ({
      spotTypeKey: key,
      easeFactor: 2.5,
      interval: 30,
      repetitions: 5,
      nextReviewAt: Date.now() + 86_400_000 * (i + 1), // staggered future
      lastReviewedAt: Date.now(),
    }))

    const filters: SpotFilters = { positions: ['UTG'], scenarios: ['RFI'], handTypes: [] }
    // Should pick the soonest-due (AA, index 0)
    const spot = generateSmartSpot(testCharts, 'pekarstas', records, filters)
    expect(spot.heroHand).toBe('AA')
  })
})
