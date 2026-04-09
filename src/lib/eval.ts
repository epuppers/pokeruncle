import { evaluateCards, handRank, rankDescription } from 'phe'

import type { Card } from '@/types/poker'

/** Numeric hand strength result. */
export interface HandStrength {
  /** Raw evaluation value from phe. Lower = stronger. */
  value: number
  /** Hand rank classification 0–8 (0 = straight flush, 8 = high card). */
  rank: number
  /** Human-readable rank name (e.g. "Straight Flush", "Two Pair"). */
  rankName: string
}

/** Result of comparing two hands: 1 = a wins, 0 = tie, -1 = b wins. */
export type CompareResult = -1 | 0 | 1

type Result<T> = { ok: true; value: T } | { ok: false; error: string }

function cardToString(card: Card): string {
  return `${card.rank}${card.suit}`
}

/**
 * Evaluate the numeric strength of a 5–7 card poker hand.
 * Lower value = stronger hand.
 */
export function evaluateHand(cards: readonly Card[]): Result<HandStrength> {
  if (cards.length < 5 || cards.length > 7) {
    return { ok: false, error: `Expected 5–7 cards, got ${cards.length}` }
  }

  const strings = cards.map(cardToString)
  const value = evaluateCards(strings)
  const rank = handRank(value)
  const rankName = rankDescription[rank]

  return { ok: true, value: { value, rank, rankName } }
}

/**
 * Compare two poker hands (each 5–7 cards).
 * Returns 1 if a is stronger, -1 if b is stronger, 0 if tied.
 */
export function compareHands(
  a: readonly Card[],
  b: readonly Card[],
): Result<CompareResult> {
  const evalA = evaluateHand(a)
  if (!evalA.ok) return { ok: false, error: `Hand A: ${evalA.error}` }

  const evalB = evaluateHand(b)
  if (!evalB.ok) return { ok: false, error: `Hand B: ${evalB.error}` }

  // Lower value = stronger in phe
  if (evalA.value.value < evalB.value.value) return { ok: true, value: 1 }
  if (evalA.value.value > evalB.value.value) return { ok: true, value: -1 }
  return { ok: true, value: 0 }
}
