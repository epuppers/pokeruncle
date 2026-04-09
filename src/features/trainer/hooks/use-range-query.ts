import { use, useMemo } from 'react'

import { loadProvider, getChartFromLoaded, getCellFromLoaded } from '@/features/trainer/lib/range-loader'
import type { ProviderCharts } from '@/features/trainer/lib/range-loader'
import type { Cell, Position, Provider, Scenario } from '@/types/poker'
import type { Chart } from '@/data/ranges'

interface RangeQueryResult {
  charts: ProviderCharts
  getChart: (hero: Position, scenario: Scenario, villain?: Position) => Chart | null
  getCell: (hero: Position, scenario: Scenario, hand: string, villain?: Position) => Cell
}

/**
 * Suspense-compatible hook that dynamically loads a provider's range data.
 * Suspends until the provider module is loaded, then returns query helpers.
 */
export function useRangeQuery(provider: Provider): RangeQueryResult {
  const charts = use(loadProvider(provider))

  return useMemo(
    () => ({
      charts,
      getChart: (hero: Position, scenario: Scenario, villain?: Position) =>
        getChartFromLoaded(charts, hero, scenario, villain),
      getCell: (hero: Position, scenario: Scenario, hand: string, villain?: Position) =>
        getCellFromLoaded(charts, hero, scenario, hand, villain),
    }),
    [charts],
  )
}
