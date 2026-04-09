import type { Position, Provider, Scenario } from '@/types/poker'

import type { Spot, StackDepth, TournamentScenario } from '@/features/trainer/types'

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

/**
 * Build a spot type key for a tournament push/fold spot.
 * Includes stack depth as an extra dimension.
 *
 * Format: `provider:hero:scenario:depth:hand` or `provider:hero:scenario:depth:villain:hand`
 */
export function buildTournamentSpotTypeKey(
  provider: 'nash-pushfold',
  hero: Position,
  scenario: TournamentScenario,
  heroHand: string,
  stackDepth: StackDepth,
  villain?: Position,
): string {
  const parts: string[] = [provider, hero, scenario, String(stackDepth)]
  if (villain) parts.push(villain)
  parts.push(heroHand)
  return parts.join(':')
}

/** Convenience wrapper that extracts fields from a Spot. */
export function buildSpotTypeKeyFromSpot(spot: Spot): string {
  switch (spot.kind) {
    case 'open':
      return buildSpotTypeKey(spot.provider, spot.hero, spot.scenario, spot.heroHand)
    case 'response':
      return buildSpotTypeKey(spot.provider, spot.hero, spot.scenario, spot.heroHand, spot.villain)
    case 'push-fold':
      return buildTournamentSpotTypeKey(
        spot.provider,
        spot.hero,
        spot.scenario,
        spot.heroHand,
        spot.stackDepth,
        spot.villain,
      )
  }
}
