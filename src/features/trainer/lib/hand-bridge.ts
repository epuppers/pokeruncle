import type { Card, Position } from '@/types/poker'

import {
  classifyBoard,
  parseBoardString,
  resolvePostflopAction,
} from '@/features/postflop'
import type {
  CachedSolution,
  PostflopSpot,
  SolutionManifest,
  SolutionManifestEntry,
} from '@/features/postflop'

import type { Spot } from '../types'

/**
 * Build the postflop node key string from a preflop spot's fields.
 *
 * SRP (vs-open):  hero called villain's open → "{villain}-open_{hero}-call"
 * 3bet (vs-3bet): hero opened, villain 3bet, hero called → "{hero}-open_{villain}-3bet_{hero}-call"
 *
 * Returns null for scenarios that can't continue to postflop
 * (RFI, vs-4bet, 3bet-defense, push-fold).
 */
export function preflopToNodeKey(spot: Spot): string | null {
  if (spot.kind === 'open' || spot.kind === 'push-fold') return null

  const { scenario, hero, villain } = spot

  switch (scenario) {
    case 'vs-open':
      return `${villain}-open_${hero}-call`
    case 'vs-3bet':
      return `${hero}-open_${villain}-3bet_${hero}-call`
    case 'vs-4bet':
    case '3bet-defense':
      return null
  }
}

/**
 * Check whether a preflop spot has any matching postflop solution
 * in the manifest.
 */
export function canContinueToPostflop(
  spot: Spot,
  manifest: SolutionManifest,
): boolean {
  return findMatchingSolutions(spot, manifest).length > 0
}

/**
 * Return all solution manifest entries whose nodeKey matches
 * this preflop spot's postflop node.
 */
export function findMatchingSolutions(
  spot: Spot,
  manifest: SolutionManifest,
): SolutionManifestEntry[] {
  const nodeKey = preflopToNodeKey(spot)
  if (!nodeKey) return []

  return manifest.solutions.filter((entry) => entry.nodeKey === nodeKey)
}

/** Postflop acting order: SB → BB → UTG → MP → CO → BTN (last = IP) */
const POSTFLOP_ORDER: Position[] = ['SB', 'BB', 'UTG', 'MP', 'CO', 'BTN']

function isInPosition(posA: Position, posB: Position): boolean {
  return POSTFLOP_ORDER.indexOf(posA) > POSTFLOP_ORDER.indexOf(posB)
}

/**
 * Generate a PostflopSpot for a *specific* hero hand from a cached solution.
 *
 * Unlike `generatePostflopSpot` (which picks a random hand), this is used
 * in the unified hand flow to continue with the same hand from preflop.
 *
 * Returns null if the heroHand is not in the solution's strategy range.
 */
export function generatePostflopSpotForHand(
  solution: CachedSolution,
  preflopSpot: Extract<Spot, { kind: 'response' }>,
  heroCards: readonly [Card, Card],
): PostflopSpot | null {
  const strategy = solution.strategies[preflopSpot.heroHand]
  if (!strategy) return null

  const board = parseBoardString(solution.boardString)
  const rolledNumber = Math.ceil(Math.random() * 100)
  const correctAction = resolvePostflopAction(strategy, rolledNumber)

  const { hero, villain } = preflopSpot
  const heroIsIP = isInPosition(hero, villain)
  const is3bet = preflopSpot.scenario === 'vs-3bet'

  return {
    kind: 'postflop',
    id: crypto.randomUUID(),
    street: solution.street,
    board,
    heroCards,
    heroHand: preflopSpot.heroHand,
    hero,
    villain,
    heroIsIP,
    preflopNode: is3bet
      ? { potType: '3bet', opener: hero, threeBettor: villain, caller: hero }
      : { potType: 'srp', opener: villain, caller: hero },
    potType: is3bet ? '3bet' : 'srp',
    potSizeBB: solution.potSizeBB,
    effectiveStackBB: solution.effectiveStackBB,
    boardTexture: classifyBoard(board),
    correctStrategy: strategy,
    rolledNumber,
    correctAction,
    solutionKey: solution.solutionKey,
  }
}
