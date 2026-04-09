import type { Cell, Position, Provider, Scenario } from '@/types/poker'
import { normalizeCell } from '@/types/poker'
import type { Chart } from '@/data/ranges'
import { getChartKey } from '@/data/ranges'

export type ProviderCharts = Record<string, Chart>

const cache = new Map<Provider, Promise<ProviderCharts>>()

/**
 * Dynamically load a provider's charts. Returns a cached promise on repeated calls.
 * Vite requires literal import paths for static analysis — hence the switch.
 */
export function loadProvider(provider: Provider): Promise<ProviderCharts> {
  const cached = cache.get(provider)
  if (cached) return cached

  const promise = loadProviderModule(provider)
  cache.set(provider, promise)
  return promise
}

async function loadProviderModule(provider: Provider): Promise<ProviderCharts> {
  switch (provider) {
    case 'pekarstas': {
      const m = await import('@/data/ranges/pekarstas')
      return m.charts
    }
    case 'greenline': {
      const m = await import('@/data/ranges/greenline')
      return m.charts
    }
    case 'gtowizard-gg-rc': {
      const m = await import('@/data/ranges/gtowizard-gg-rc')
      return m.charts
    }
  }
}

export function getChartFromLoaded(
  charts: ProviderCharts,
  hero: Position,
  scenario: Scenario,
  villain?: Position,
): Chart | null {
  const key = getChartKey(hero, scenario, villain)
  return charts[key] ?? null
}

export function getCellFromLoaded(
  charts: ProviderCharts,
  hero: Position,
  scenario: Scenario,
  hand: string,
  villain?: Position,
): Cell {
  const chart = getChartFromLoaded(charts, hero, scenario, villain)
  if (!chart) return 'fold'
  return chart[hand] ?? 'fold'
}

/** Get the correct action for a cell given a rolled number (1-100). */
export function resolveCorrectAction(cell: Cell, rolledNumber: number): string {
  const { actions } = normalizeCell(cell)

  // Build cumulative frequency bands in action order
  let cumulative = 0
  for (const [action, freq] of Object.entries(actions)) {
    if (!freq) continue
    cumulative += freq
    if (rolledNumber <= cumulative) return action
  }

  // Fallback: first action with any frequency
  const firstAction = Object.entries(actions).find(([, f]) => f && f > 0)
  return firstAction ? firstAction[0] : 'fold'
}
