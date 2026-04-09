import { POSITIONS, SCENARIOS } from '@/types/poker'
import type { Position } from '@/types/poker'

import type { ParsedChartKey } from '@/features/trainer/types'
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
