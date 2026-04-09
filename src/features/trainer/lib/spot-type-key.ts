import type { Position, Provider, Scenario } from '@/types/poker'

import type { Spot } from '@/features/trainer/types'

/**
 * Build a deterministic, human-readable key for a spot type.
 * Used as the primary key for MasteryRecord in IndexedDB.
 *
 * Format: `provider:hero:scenario:hand` or `provider:hero:scenario:villain:hand`
 */
export function buildSpotTypeKey(
  provider: Provider,
  hero: Position,
  scenario: Scenario,
  heroHand: string,
  villain?: Position,
): string {
  const parts: string[] = [provider, hero, scenario]
  if (villain) parts.push(villain)
  parts.push(heroHand)
  return parts.join(':')
}

/** Convenience wrapper that extracts fields from a Spot. */
export function buildSpotTypeKeyFromSpot(spot: Spot): string {
  const villain = spot.kind === 'response' ? spot.villain : undefined
  return buildSpotTypeKey(spot.provider, spot.hero, spot.scenario, spot.heroHand, villain)
}
