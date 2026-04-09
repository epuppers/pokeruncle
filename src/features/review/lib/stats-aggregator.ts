import type { Position, Scenario } from '@/types/poker'

import type {
  AccuracyStats,
  EnrichedSpotResult,
  HandAccuracy,
  StatsByHand,
  StatsByPosition,
  StatsByScenario,
  TimeRange,
} from '../types'

const EMPTY_STATS: AccuracyStats = {
  total: 0,
  correct: 0,
  accuracy: 0,
  avgEvLoss: 0,
  avgDecisionTimeMs: 0,
}

function buildStats(results: EnrichedSpotResult[]): AccuracyStats {
  if (results.length === 0) return { ...EMPTY_STATS }
  const correct = results.filter((r) => r.isCorrect).length
  const totalEvLoss = results.reduce((sum, r) => sum + r.evLossEstimate, 0)
  const totalTime = results.reduce((sum, r) => sum + r.decisionTimeMs, 0)
  return {
    total: results.length,
    correct,
    accuracy: Math.round((correct / results.length) * 100),
    avgEvLoss: totalEvLoss / results.length,
    avgDecisionTimeMs: totalTime / results.length,
  }
}

/** Get the Unix timestamp for the start of a time range. */
export function timeRangeToTimestamp(range: TimeRange): number {
  if (range === 'all') return 0
  const now = Date.now()
  switch (range) {
    case 'today': {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    }
    case '7d':
      return now - 7 * 24 * 60 * 60 * 1000
    case '30d':
      return now - 30 * 24 * 60 * 60 * 1000
  }
}

/** Filter results by time range. */
export function filterByTimeRange(
  results: EnrichedSpotResult[],
  range: TimeRange,
): EnrichedSpotResult[] {
  if (range === 'all') return results
  const cutoff = timeRangeToTimestamp(range)
  return results.filter((r) => r.timestamp >= cutoff)
}

/** Aggregate overall accuracy stats. */
export function aggregateOverall(results: EnrichedSpotResult[]): AccuracyStats {
  return buildStats(results)
}

/** Aggregate accuracy stats grouped by hero position. */
export function aggregateByPosition(results: EnrichedSpotResult[]): StatsByPosition {
  const groups = new Map<Position, EnrichedSpotResult[]>()
  for (const r of results) {
    const existing = groups.get(r.hero)
    if (existing) {
      existing.push(r)
    } else {
      groups.set(r.hero, [r])
    }
  }
  const out: StatsByPosition = {}
  for (const [pos, group] of groups) {
    out[pos] = buildStats(group)
  }
  return out
}

/** Aggregate accuracy stats grouped by scenario type. */
export function aggregateByScenario(results: EnrichedSpotResult[]): StatsByScenario {
  const groups = new Map<Scenario, EnrichedSpotResult[]>()
  for (const r of results) {
    const existing = groups.get(r.scenario)
    if (existing) {
      existing.push(r)
    } else {
      groups.set(r.scenario, [r])
    }
  }
  const out: StatsByScenario = {}
  for (const [sc, group] of groups) {
    out[sc] = buildStats(group)
  }
  return out
}

/** Aggregate accuracy per hand for the 13×13 grid. */
export function aggregateByHand(results: EnrichedSpotResult[]): StatsByHand {
  const groups = new Map<string, { total: number; correct: number }>()
  for (const r of results) {
    const existing = groups.get(r.heroHand)
    if (existing) {
      existing.total++
      if (r.isCorrect) existing.correct++
    } else {
      groups.set(r.heroHand, { total: 1, correct: r.isCorrect ? 1 : 0 })
    }
  }
  const out: StatsByHand = new Map()
  for (const [hand, { total, correct }] of groups) {
    const accuracy = Math.round((correct / total) * 100)
    out.set(hand, { hand, total, correct, accuracy } satisfies HandAccuracy)
  }
  return out
}
