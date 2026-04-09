import { evaluateCards } from 'phe'

import type { Card } from '@/types/poker'
import { RANKS, SUITS } from '@/types/poker'

/** Equity calculation result with probabilities (0–1). */
export interface EquityResult {
  /** Probability of winning. */
  wins: number
  /** Probability of tying. */
  ties: number
  /** Probability of losing. */
  losses: number
  /** Number of Monte Carlo samples run. */
  samples: number
}

type Result<T> = { ok: true; value: T } | { ok: false; error: string }

function cardToString(card: Card): string {
  return `${card.rank}${card.suit}`
}

function cardsEqual(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit
}

function hasOverlap(a: readonly Card[], b: readonly Card[]): boolean {
  return a.some((cardA) => b.some((cardB) => cardsEqual(cardA, cardB)))
}

/** Build the full 52-card deck. */
function buildDeck(): Card[] {
  const deck: Card[] = []
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push({ rank, suit })
    }
  }
  return deck
}

/** Remove specific cards from the deck. */
function removeCards(deck: Card[], toRemove: readonly Card[]): Card[] {
  return deck.filter((c) => !toRemove.some((r) => cardsEqual(c, r)))
}

/** Fisher-Yates shuffle, mutates array. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

/**
 * Calculate hero's equity against a range of villain hands via Monte Carlo.
 * Uses phe for fast hand evaluation (~100M evals/sec).
 *
 * @param hero - Hero's two hole cards.
 * @param villainRange - Array of possible villain hole card pairs.
 * @param board - Community cards (0–5 cards).
 * @param iterations - Number of Monte Carlo iterations (default 10,000).
 */
export function equityVsRange(
  hero: readonly [Card, Card],
  villainRange: readonly (readonly [Card, Card])[],
  board: readonly Card[],
  iterations: number = 10_000,
): Result<EquityResult> {
  if (villainRange.length === 0) {
    return { ok: false, error: 'Villain range is empty' }
  }

  if (board.length > 5) {
    return { ok: false, error: `Board has ${board.length} cards, max is 5` }
  }

  // Filter out villain hands that overlap with hero or board cards
  const heroAndBoard: Card[] = [...hero, ...board]
  const validVillainHands = villainRange.filter(
    (villainHand) => !hasOverlap([...villainHand], heroAndBoard),
  )

  if (validVillainHands.length === 0) {
    return { ok: false, error: 'No valid villain hands after removing blockers' }
  }

  const cardsToRunOut = 5 - board.length
  let totalWins = 0
  let totalTies = 0
  let totalSamples = 0

  for (let i = 0; i < iterations; i++) {
    // Pick a random villain hand from the range
    const villainHand = validVillainHands[Math.floor(Math.random() * validVillainHands.length)]

    // Build remaining deck (remove hero, villain, and board cards)
    const deadCards: Card[] = [...hero, ...villainHand, ...board]
    const remaining = removeCards(buildDeck(), deadCards)

    // Deal remaining community cards
    shuffle(remaining)
    const runout = remaining.slice(0, cardsToRunOut)

    // Build full 7-card hands as phe strings
    const fullBoard = [...board, ...runout]
    const heroStrings = [...hero, ...fullBoard].map(cardToString)
    const villainStrings = [...villainHand, ...fullBoard].map(cardToString)

    const heroValue = evaluateCards(heroStrings)
    const villainValue = evaluateCards(villainStrings)

    // Lower value = stronger in phe
    if (heroValue < villainValue) {
      totalWins++
    } else if (heroValue === villainValue) {
      totalTies++
    }

    totalSamples++
  }

  return {
    ok: true,
    value: {
      wins: totalWins / totalSamples,
      ties: totalTies / totalSamples,
      losses: (totalSamples - totalWins - totalTies) / totalSamples,
      samples: totalSamples,
    },
  }
}
