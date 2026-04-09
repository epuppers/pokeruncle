import { POSITIONS, SCENARIOS } from '@/types/poker'
import type { Position } from '@/types/poker'

import { STACK_DEPTHS, TOURNAMENT_SCENARIOS } from '@/features/trainer/types'
import type { ParsedChartKey, ParsedTournamentChartKey, StackDepth } from '@/features/trainer/types'
import type { ProviderCharts } from '@/features/trainer/lib/range-loader'

/**
 * Parse a chart key like "UTG-RFI" or "BB-vs-open-BTN" into its components.
 * Returns null if the key doesn't match a valid pattern.
 */
export function parseChartKey(key: string): ParsedChartKey | null {
  const parts = key.split('-')
  if (parts.length < 2) return null

  const hero = parts[0] as Position
  if (!POSITIONS.includes(hero)) return null

  // Scenario may contain hyphens (e.g. "vs-open", "vs-3bet", "3bet-defense")
  // Try matching known scenarios from longest to shortest
  const rest = parts.slice(1).join('-')
  const scenarioIds = SCENARIOS.map((s) => s.id).sort((a, b) => b.length - a.length)

  for (const scenarioId of scenarioIds) {
    if (rest === scenarioId) {
      return { hero, scenario: scenarioId }
    }
    if (rest.startsWith(scenarioId + '-')) {
      const villain = rest.slice(scenarioId.length + 1) as Position
      if (POSITIONS.includes(villain)) {
        return { hero, scenario: scenarioId, villain }
      }
    }
  }

  return null
}

/** Enumerate all valid chart entries from loaded provider data. */
export function enumerateCharts(charts: ProviderCharts): ParsedChartKey[] {
  return Object.keys(charts)
    .map(parseChartKey)
    .filter((p): p is ParsedChartKey => p !== null)
}

/**
 * Parse a tournament chart key like "BTN-push-10" or "BB-vs-push-10-BTN"
 * into its components. Returns null if the key doesn't match.
 */
export function parseTournamentChartKey(key: string): ParsedTournamentChartKey | null {
  const parts = key.split('-')
  if (parts.length < 3) return null

  const hero = parts[0] as Position
  if (!POSITIONS.includes(hero)) return null

  // Try matching tournament scenarios (sorted longest first)
  const rest = parts.slice(1).join('-')
  const scenarioIds = [...TOURNAMENT_SCENARIOS].sort((a, b) => b.length - a.length)

  for (const scenarioId of scenarioIds) {
    if (!rest.startsWith(scenarioId + '-')) continue

    const afterScenario = rest.slice(scenarioId.length + 1)
    const afterParts = afterScenario.split('-')

    // First part after scenario must be a stack depth number
    const depthNum = parseInt(afterParts[0], 10)
    if (!STACK_DEPTHS.includes(depthNum as StackDepth)) continue

    const stackDepth = depthNum as StackDepth

    // Optional villain position after stack depth
    if (afterParts.length === 1) {
      return { hero, scenario: scenarioId, stackDepth }
    }
    if (afterParts.length === 2) {
      const villain = afterParts[1] as Position
      if (POSITIONS.includes(villain)) {
        return { hero, scenario: scenarioId, stackDepth, villain }
      }
    }
  }

  return null
}

/** Enumerate all valid tournament chart entries from loaded provider data. */
export function enumerateTournamentCharts(charts: ProviderCharts): ParsedTournamentChartKey[] {
  return Object.keys(charts)
    .map(parseTournamentChartKey)
    .filter((p): p is ParsedTournamentChartKey => p !== null)
}

/**
 * Check whether a provider's charts contain any true mixed strategies.
 * Returns true if at least one cell has multiple actions with non-trivial frequencies.
 * A single-action cell or a fold are not considered mixed.
 */
export function hasMixedStrategies(charts: ProviderCharts): boolean {
  for (const chart of Object.values(charts)) {
    for (const cell of Object.values(chart)) {
      if (typeof cell === 'object' && !Array.isArray(cell) && 'weight' in cell) {
        const actionCount = Object.values(cell.actions).filter((f) => f && f > 0).length
        if (actionCount > 1) return true
      }
      // Legacy tuple format counts as coarse mixing but not "true" mixed strategies
    }
  }
  return false
}
