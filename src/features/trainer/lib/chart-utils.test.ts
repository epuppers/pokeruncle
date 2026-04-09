import { describe, expect, it } from 'vitest'

import { enumerateCharts, hasMixedStrategies, parseChartKey } from './chart-utils'
import type { ProviderCharts } from './range-loader'

describe('parseChartKey', () => {
  it('parses a simple RFI key', () => {
    expect(parseChartKey('UTG-RFI')).toEqual({ hero: 'UTG', scenario: 'RFI' })
  })

  it('parses a vs-open key with villain', () => {
    expect(parseChartKey('BB-vs-open-BTN')).toEqual({
      hero: 'BB',
      scenario: 'vs-open',
      villain: 'BTN',
    })
  })

  it('parses a vs-3bet key with villain', () => {
    expect(parseChartKey('CO-vs-3bet-BB')).toEqual({
      hero: 'CO',
      scenario: 'vs-3bet',
      villain: 'BB',
    })
  })

  it('parses a 3bet-defense key with villain', () => {
    expect(parseChartKey('SB-3bet-defense-UTG')).toEqual({
      hero: 'SB',
      scenario: '3bet-defense',
      villain: 'UTG',
    })
  })

  it('returns null for invalid keys', () => {
    expect(parseChartKey('')).toBeNull()
    expect(parseChartKey('INVALID')).toBeNull()
    expect(parseChartKey('XX-RFI')).toBeNull()
  })
})

describe('enumerateCharts', () => {
  it('returns parsed entries for all valid chart keys', () => {
    const charts: ProviderCharts = {
      'UTG-RFI': { AA: 'raise' },
      'BB-vs-open-BTN': { AKs: 'call' },
    }
    const result = enumerateCharts(charts)
    expect(result).toHaveLength(2)
    expect(result).toContainEqual({ hero: 'UTG', scenario: 'RFI' })
    expect(result).toContainEqual({ hero: 'BB', scenario: 'vs-open', villain: 'BTN' })
  })

  it('skips invalid chart keys', () => {
    const charts: ProviderCharts = {
      'UTG-RFI': { AA: 'raise' },
      'bad-key': { AA: 'raise' },
    }
    const result = enumerateCharts(charts)
    expect(result).toHaveLength(1)
  })
})

describe('hasMixedStrategies', () => {
  it('returns false for pure-strategy charts', () => {
    const charts: ProviderCharts = {
      'UTG-RFI': { AA: 'raise', KK: 'raise', '72o': 'fold' },
    }
    expect(hasMixedStrategies(charts)).toBe(false)
  })

  it('returns false for legacy tuple charts (coarse mixing)', () => {
    const charts: ProviderCharts = {
      'UTG-RFI': { AA: 'raise', ATo: ['raise', 'fold'] },
    }
    expect(hasMixedStrategies(charts)).toBe(false)
  })

  it('returns true for charts with WeightedCell mixed strategies', () => {
    const charts: ProviderCharts = {
      'UTG-RFI': {
        AA: { weight: 100, actions: { raise: 70, call: 30 } },
      },
    }
    expect(hasMixedStrategies(charts)).toBe(true)
  })

  it('returns false for WeightedCell with a single action', () => {
    const charts: ProviderCharts = {
      'UTG-RFI': {
        AA: { weight: 80, actions: { raise: 100 } },
      },
    }
    expect(hasMixedStrategies(charts)).toBe(false)
  })
})
