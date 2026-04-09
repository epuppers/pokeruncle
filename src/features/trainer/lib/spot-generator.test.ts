import { describe, expect, it } from 'vitest'

import { ACTIONS } from '@/types/poker'

import { resolveCorrectAction } from './range-loader'
import { generateSpot } from './spot-generator'
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
