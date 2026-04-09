import type { Position, Scenario } from '@/types/poker'

import type { AccuracyStats, LeakNarrative, StatsByPosition, StatsByScenario } from '../types'

/** Minimum sample size before generating a narrative for a dimension. */
const MIN_SAMPLE = 10

/** Threshold (percentage points below overall) to flag as a warning. */
const WARNING_THRESHOLD = 15

/** Threshold (percentage points below overall) to flag as critical. */
const CRITICAL_THRESHOLD = 25

const SEVERITY_ORDER: Record<LeakNarrative['severity'], number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

const SCENARIO_LABELS: Record<string, string> = {
  RFI: 'RFI',
  'vs-open': 'vs. open',
  'vs-3bet': 'vs. 3-bet',
  'vs-4bet': 'vs. 4-bet',
  '3bet-defense': '3-bet defense',
  push: 'push/fold',
  'vs-push': 'vs. push',
}

/**
 * Generate templated leak insights from aggregated stats.
 * Returns an empty array if there isn't enough data yet.
 */
export function generateLeakNarratives(
  overall: AccuracyStats,
  byPosition: StatsByPosition,
  byScenario: StatsByScenario,
): LeakNarrative[] {
  if (overall.total < MIN_SAMPLE) return []

  const narratives: LeakNarrative[] = []

  narratives.push(...positionNarratives(overall, byPosition))
  narratives.push(...scenarioNarratives(overall, byScenario))
  narratives.push(...overallNarratives(overall))

  narratives.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
  return narratives
}

function positionNarratives(
  overall: AccuracyStats,
  byPosition: StatsByPosition,
): LeakNarrative[] {
  const narratives: LeakNarrative[] = []
  let worst: { pos: Position; stats: AccuracyStats } | null = null
  let best: { pos: Position; stats: AccuracyStats } | null = null

  for (const [pos, stats] of Object.entries(byPosition) as [Position, AccuracyStats][]) {
    if (stats.total < MIN_SAMPLE) continue
    if (!worst || stats.accuracy < worst.stats.accuracy) worst = { pos, stats }
    if (!best || stats.accuracy > best.stats.accuracy) best = { pos, stats }
  }

  if (worst) {
    const gap = overall.accuracy - worst.stats.accuracy
    if (gap >= CRITICAL_THRESHOLD) {
      narratives.push({
        severity: 'critical',
        message: `Your accuracy from ${worst.pos} is ${worst.stats.accuracy}% — ${gap} points below your overall ${overall.accuracy}%. This is your biggest positional leak.`,
        category: 'position',
      })
    } else if (gap >= WARNING_THRESHOLD) {
      narratives.push({
        severity: 'warning',
        message: `Your accuracy from ${worst.pos} is ${worst.stats.accuracy}% — your weakest position at ${gap} points below overall.`,
        category: 'position',
      })
    }
  }

  if (best && best.stats.accuracy > overall.accuracy) {
    narratives.push({
      severity: 'info',
      message: `Your strongest position is ${best.pos} at ${best.stats.accuracy}% accuracy.`,
      category: 'position',
    })
  }

  return narratives
}

function scenarioNarratives(
  overall: AccuracyStats,
  byScenario: StatsByScenario,
): LeakNarrative[] {
  const narratives: LeakNarrative[] = []
  let worst: { sc: Scenario; stats: AccuracyStats } | null = null

  for (const [sc, stats] of Object.entries(byScenario) as [Scenario, AccuracyStats][]) {
    if (stats.total < MIN_SAMPLE) continue
    if (!worst || stats.accuracy < worst.stats.accuracy) worst = { sc, stats }
  }

  if (worst) {
    const gap = overall.accuracy - worst.stats.accuracy
    const label = SCENARIO_LABELS[worst.sc]
    if (gap >= CRITICAL_THRESHOLD) {
      narratives.push({
        severity: 'critical',
        message: `Your accuracy on ${label} spots is ${worst.stats.accuracy}% — ${gap} points below overall. Focus your drills here.`,
        category: 'scenario',
      })
    } else if (gap >= WARNING_THRESHOLD) {
      narratives.push({
        severity: 'warning',
        message: `Your accuracy on ${label} spots is ${worst.stats.accuracy}% — your worst scenario type.`,
        category: 'scenario',
      })
    }
  }

  return narratives
}

function overallNarratives(overall: AccuracyStats): LeakNarrative[] {
  const narratives: LeakNarrative[] = []

  if (overall.accuracy >= 90) {
    narratives.push({
      severity: 'info',
      message: `Overall ${overall.accuracy}% accuracy across ${overall.total} spots — strong GTO fundamentals.`,
      category: 'general',
    })
  } else if (overall.accuracy >= 75) {
    narratives.push({
      severity: 'info',
      message: `Overall ${overall.accuracy}% accuracy across ${overall.total} spots — solid foundation, keep drilling your weak spots.`,
      category: 'general',
    })
  } else if (overall.total >= MIN_SAMPLE) {
    narratives.push({
      severity: 'warning',
      message: `Overall ${overall.accuracy}% accuracy across ${overall.total} spots — focus on building consistency before expanding scenarios.`,
      category: 'general',
    })
  }

  if (overall.avgDecisionTimeMs > 10_000 && overall.total >= MIN_SAMPLE) {
    const avgSec = (overall.avgDecisionTimeMs / 1000).toFixed(1)
    narratives.push({
      severity: 'info',
      message: `Your average decision time is ${avgSec}s — try to build speed through repetition.`,
      category: 'general',
    })
  }

  return narratives
}
