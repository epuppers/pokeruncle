import type { Provider, Scenario } from '@/types/poker'

import { enumerateCharts } from '@/features/trainer/lib/chart-utils'
import { getCellFromLoaded, resolveCorrectAction } from '@/features/trainer/lib/range-loader'
import type { ProviderCharts } from '@/features/trainer/lib/range-loader'
import type { Spot } from '@/features/trainer/types'

/**
 * Generate a random training spot from the loaded charts.
 * Picks a random chart (optionally filtered by scenario), a random hand
 * from that chart, rolls 1-100 for mixed-strategy resolution, and computes
 * the correct action.
 */
export function generateSpot(
  charts: ProviderCharts,
  provider: Provider,
  scenarioFilter?: Scenario,
): Spot {
  const entries = enumerateCharts(charts)
  const filtered = scenarioFilter
    ? entries.filter((e) => e.scenario === scenarioFilter)
    : entries

  if (filtered.length === 0) {
    throw new Error(
      `No charts available for provider "${provider}"${scenarioFilter ? ` with scenario "${scenarioFilter}"` : ''}`,
    )
  }

  // Pick a random chart
  const entry = filtered[Math.floor(Math.random() * filtered.length)]
  const chart = charts[buildKey(entry.hero, entry.scenario, entry.villain)]

  if (!chart) {
    throw new Error(`Chart not found for key: ${buildKey(entry.hero, entry.scenario, entry.villain)}`)
  }

  // Pick a random hand from the chart (only hands that are in the chart, not folds)
  const hands = Object.keys(chart)
  if (hands.length === 0) {
    throw new Error(`Chart has no hands: ${buildKey(entry.hero, entry.scenario, entry.villain)}`)
  }

  const heroHand = hands[Math.floor(Math.random() * hands.length)]
  const cell = getCellFromLoaded(charts, entry.hero, entry.scenario, heroHand, entry.villain)
  const rolledNumber = Math.ceil(Math.random() * 100)
  const correctAction = resolveCorrectAction(cell, rolledNumber)
  const id = crypto.randomUUID()

  if (entry.scenario === 'RFI') {
    return {
      kind: 'open',
      id,
      provider,
      hero: entry.hero,
      scenario: entry.scenario,
      heroHand,
      cell,
      rolledNumber,
      correctAction,
    }
  }

  return {
    kind: 'response',
    id,
    provider,
    hero: entry.hero,
    villain: entry.villain!,
    scenario: entry.scenario,
    heroHand,
    cell,
    rolledNumber,
    correctAction,
  }
}

function buildKey(hero: string, scenario: string, villain?: string): string {
  return villain ? `${hero}-${scenario}-${villain}` : `${hero}-${scenario}`
}
