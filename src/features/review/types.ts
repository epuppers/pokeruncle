import type { Action, Position, Provider, Scenario } from '@/types/poker'

/** A spot result record with all context fields guaranteed present (post-v2 migration). */
export interface EnrichedSpotResult {
  id: number
  spotId: string
  userAction: Action
  isCorrect: boolean
  evLossEstimate: number
  qualityScore: number
  timestamp: number
  decisionTimeMs: number
  provider: Provider
  hero: Position
  villain: Position | null
  scenario: Scenario
  heroHand: string
  rolledNumber: number
  correctAction: Action
}

/** Aggregated accuracy statistics for a group of results. */
export interface AccuracyStats {
  total: number
  correct: number
  accuracy: number
  avgEvLoss: number
  avgDecisionTimeMs: number
}

/** Per-hand accuracy for the 13×13 grid. */
export interface HandAccuracy {
  hand: string
  total: number
  correct: number
  accuracy: number
}

export type StatsByPosition = Partial<Record<Position, AccuracyStats>>
export type StatsByScenario = Partial<Record<Scenario, AccuracyStats>>
export type StatsByHand = Map<string, HandAccuracy>

/** A templated leak insight surfaced on the stats dashboard. */
export interface LeakNarrative {
  severity: 'info' | 'warning' | 'critical'
  message: string
  category: 'position' | 'scenario' | 'general'
}

export type TimeRange = 'all' | '7d' | '30d' | 'today'

/** Filter state for the review page. */
export interface ReviewFilters {
  provider: Provider | null
  positions: Position[]
  scenarios: Scenario[]
  onlyWrong: boolean
  timeRange: TimeRange
}
