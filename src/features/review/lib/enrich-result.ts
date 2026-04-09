import { ACTIONS, POSITIONS, PROVIDERS, type Action, type Position, type Provider, type Scenario } from '@/types/poker'

import type { SpotResultRecord } from '@/lib/db'

import type { EnrichedSpotResult } from '../types'

const SCENARIO_SET = new Set(['RFI', 'vs-open', 'vs-3bet', 'vs-4bet', '3bet-defense'])
const POSITION_SET = new Set<string>(POSITIONS)
const PROVIDER_SET = new Set<string>(PROVIDERS)
const ACTION_SET = new Set<string>(ACTIONS)

/**
 * Validate and cast a raw SpotResultRecord to EnrichedSpotResult.
 * Returns null for legacy rows that lack context fields (pre-v2 migration).
 */
export function toEnriched(row: SpotResultRecord): EnrichedSpotResult | null {
  // Legacy rows (pre-v2) lack context fields — they'll be undefined at runtime
  // even though the TS interface says they exist, because IndexedDB doesn't enforce schema
  const provider = row.provider
  const hero = row.hero
  const scenario = row.scenario
  const heroHand = row.heroHand
  const correctAction = row.correctAction
  const userAction = row.userAction
  const villain = row.villain

  if (
    typeof provider !== 'string' ||
    !PROVIDER_SET.has(provider) ||
    typeof hero !== 'string' ||
    !POSITION_SET.has(hero) ||
    typeof scenario !== 'string' ||
    !SCENARIO_SET.has(scenario) ||
    typeof heroHand !== 'string' ||
    typeof correctAction !== 'string' ||
    !ACTION_SET.has(correctAction) ||
    typeof userAction !== 'string' ||
    !ACTION_SET.has(userAction)
  ) {
    return null
  }
  return {
    id: row.id!,
    spotId: row.spotId,
    userAction: userAction as Action,
    isCorrect: row.isCorrect,
    evLossEstimate: row.evLossEstimate,
    qualityScore: row.qualityScore,
    timestamp: row.timestamp,
    decisionTimeMs: row.decisionTimeMs,
    provider: provider as Provider,
    hero: hero as Position,
    villain: typeof villain === 'string' && POSITION_SET.has(villain) ? (villain as Position) : null,
    scenario: scenario as Scenario,
    heroHand,
    rolledNumber: row.rolledNumber,
    correctAction: correctAction as Action,
  }
}
