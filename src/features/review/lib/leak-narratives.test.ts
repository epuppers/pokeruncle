import { describe, expect, it } from 'vitest'

import type { AccuracyStats, StatsByPosition, StatsByScenario } from '../types'

import { generateLeakNarratives } from './leak-narratives'

function makeStats(overrides: Partial<AccuracyStats> = {}): AccuracyStats {
  return { total: 50, correct: 40, accuracy: 80, avgEvLoss: 0.1, avgDecisionTimeMs: 3000, ...overrides }
}

describe('generateLeakNarratives', () => {
  it('returns empty array when total is below minimum sample', () => {
    const overall = makeStats({ total: 5 })
    expect(generateLeakNarratives(overall, {}, {})).toEqual([])
  })

  it('flags worst position as warning when gap exceeds 15 points', () => {
    const overall = makeStats({ accuracy: 80 })
    const byPos: StatsByPosition = {
      BTN: makeStats({ accuracy: 90 }),
      SB: makeStats({ accuracy: 60 }),
    }
    const narratives = generateLeakNarratives(overall, byPos, {})
    const warnings = narratives.filter((n) => n.severity === 'warning' && n.category === 'position')
    expect(warnings).toHaveLength(1)
    expect(warnings[0].message).toContain('SB')
  })

  it('flags worst position as critical when gap exceeds 25 points', () => {
    const overall = makeStats({ accuracy: 85 })
    const byPos: StatsByPosition = {
      BTN: makeStats({ accuracy: 90 }),
      BB: makeStats({ accuracy: 55 }),
    }
    const narratives = generateLeakNarratives(overall, byPos, {})
    const criticals = narratives.filter((n) => n.severity === 'critical')
    expect(criticals.length).toBeGreaterThanOrEqual(1)
    expect(criticals[0].message).toContain('BB')
  })

  it('includes best position as info', () => {
    const overall = makeStats({ accuracy: 75 })
    const byPos: StatsByPosition = {
      BTN: makeStats({ accuracy: 90 }),
      SB: makeStats({ accuracy: 55 }),
    }
    const narratives = generateLeakNarratives(overall, byPos, {})
    const info = narratives.filter((n) => n.severity === 'info' && n.category === 'position')
    expect(info).toHaveLength(1)
    expect(info[0].message).toContain('BTN')
  })

  it('flags worst scenario', () => {
    const overall = makeStats({ accuracy: 80 })
    const bySc: StatsByScenario = {
      RFI: makeStats({ accuracy: 90 }),
      'vs-3bet': makeStats({ accuracy: 50 }),
    }
    const narratives = generateLeakNarratives(overall, {}, bySc)
    const scenarioNarrs = narratives.filter((n) => n.category === 'scenario')
    expect(scenarioNarrs).toHaveLength(1)
    expect(scenarioNarrs[0].message).toContain('vs. 3-bet')
  })

  it('includes overall milestone for high accuracy', () => {
    const overall = makeStats({ accuracy: 92 })
    const narratives = generateLeakNarratives(overall, {}, {})
    const general = narratives.filter((n) => n.category === 'general')
    expect(general.some((n) => n.message.includes('strong GTO'))).toBe(true)
  })

  it('sorts by severity: critical first, then warning, then info', () => {
    const overall = makeStats({ accuracy: 85 })
    const byPos: StatsByPosition = {
      BB: makeStats({ accuracy: 55 }),
    }
    const bySc: StatsByScenario = {
      'vs-open': makeStats({ accuracy: 60 }),
    }
    const narratives = generateLeakNarratives(overall, byPos, bySc)
    const severities = narratives.map((n) => n.severity)
    const critIdx = severities.indexOf('critical')
    const warnIdx = severities.indexOf('warning')
    const infoIdx = severities.indexOf('info')
    if (critIdx >= 0 && warnIdx >= 0) expect(critIdx).toBeLessThan(warnIdx)
    if (warnIdx >= 0 && infoIdx >= 0) expect(warnIdx).toBeLessThan(infoIdx)
  })

  it('skips position narratives for positions with too few spots', () => {
    const overall = makeStats({ accuracy: 80 })
    const byPos: StatsByPosition = {
      BTN: makeStats({ total: 5, accuracy: 20 }),
    }
    const narratives = generateLeakNarratives(overall, byPos, {})
    const posNarrs = narratives.filter((n) => n.category === 'position')
    expect(posNarrs).toHaveLength(0)
  })
})
