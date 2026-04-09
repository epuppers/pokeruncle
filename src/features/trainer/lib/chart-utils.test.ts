import { describe, expect, it } from 'vitest'

import {
  enumerateCharts,
  enumerateTournamentCharts,
  hasMixedStrategies,
  parseChartKey,
  parseTournamentChartKey,
} from './chart-utils'
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

describe('parseTournamentChartKey', () => {
  it('parses a push key without villain', () => {
    expect(parseTournamentChartKey('BTN-push-10')).toEqual({
      hero: 'BTN',
      scenario: 'push',
      stackDepth: 10,
    })
  })

  it('parses a vs-push key with villain', () => {
    expect(parseTournamentChartKey('BB-vs-push-10-BTN')).toEqual({
      hero: 'BB',
      scenario: 'vs-push',
      stackDepth: 10,
      villain: 'BTN',
    })
  })

  it('parses various stack depths', () => {
    expect(parseTournamentChartKey('SB-push-5')?.stackDepth).toBe(5)
    expect(parseTournamentChartKey('SB-push-25')?.stackDepth).toBe(25)
  })

  it('returns null for invalid stack depth', () => {
    expect(parseTournamentChartKey('BTN-push-12')).toBeNull()
  })

  it('returns null for standard chart keys', () => {
    expect(parseTournamentChartKey('UTG-RFI')).toBeNull()
    expect(parseTournamentChartKey('BB-vs-open-BTN')).toBeNull()
  })

  it('returns null for invalid keys', () => {
    expect(parseTournamentChartKey('')).toBeNull()
    expect(parseTournamentChartKey('XX-push-10')).toBeNull()
  })
})

describe('enumerateTournamentCharts', () => {
  it('returns parsed entries for tournament chart keys', () => {
    const charts: ProviderCharts = {
      'BTN-push-10': { AA: 'allin' },
      'BB-vs-push-10-BTN': { AA: 'call' },
      'UTG-RFI': { AA: 'raise' },
    }
    const result = enumerateTournamentCharts(charts)
    expect(result).toHaveLength(2)
    expect(result).toContainEqual({ hero: 'BTN', scenario: 'push', stackDepth: 10 })
    expect(result).toContainEqual({ hero: 'BB', scenario: 'vs-push', stackDepth: 10, villain: 'BTN' })
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
