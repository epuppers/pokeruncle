import type { Rank, Suit } from '@/types/poker'
import { RANKS } from '@/types/poker'

/**
 * Convert a TexasSolver card string like "QD" to our Card format.
 * TexasSolver uses uppercase rank + uppercase suit: AH, KS, TD, 9C, etc.
 */
export function parseTexasSolverCard(card: string): { rank: Rank; suit: Suit } {
  if (card.length !== 2) {
    throw new Error(`Invalid card string: "${card}"`)
  }

  const rankChar = card[0].toUpperCase()
  const suitChar = card[1].toLowerCase()

  const rank = rankChar as Rank
  if (!RANKS.includes(rank)) {
    throw new Error(`Invalid rank "${rankChar}" in card "${card}"`)
  }

  const validSuits = ['s', 'h', 'd', 'c'] as const
  const suit = suitChar as Suit
  if (!(validSuits as readonly string[]).includes(suit)) {
    throw new Error(`Invalid suit "${suitChar}" in card "${card}"`)
  }

  return { rank, suit }
}

/**
 * Convert a TexasSolver two-card hand like "AHKS" or "AH KS" to
 * our hand class format: "AKs", "AKo", "AA", etc.
 *
 * TexasSolver represents specific combos (e.g., AhKs).
 * We convert to hand classes by:
 *   - Same rank → pair (e.g., "AHAD" → "AA")
 *   - Same suit → suited (e.g., "AHKH" → "AKs")
 *   - Different suit, different rank → offsuit (e.g., "AHKD" → "AKo")
 *   - Higher rank always first (e.g., "KSAH" → "AKs", not "KAs")
 */
export function comboToHandClass(combo: string): string {
  // Handle both "AHKS" (4 chars) and "AH KS" (5 chars with space)
  const cleaned = combo.replace(/\s/g, '')
  if (cleaned.length !== 4) {
    throw new Error(`Invalid combo string: "${combo}"`)
  }

  const card1 = parseTexasSolverCard(cleaned.slice(0, 2))
  const card2 = parseTexasSolverCard(cleaned.slice(2, 4))

  const rank1Idx = RANKS.indexOf(card1.rank)
  const rank2Idx = RANKS.indexOf(card2.rank)

  // Ensure higher rank comes first (lower index = higher rank)
  const highRank = rank1Idx <= rank2Idx ? card1.rank : card2.rank
  const lowRank = rank1Idx <= rank2Idx ? card2.rank : card1.rank
  const highSuit = rank1Idx <= rank2Idx ? card1.suit : card2.suit
  const lowSuit = rank1Idx <= rank2Idx ? card2.suit : card1.suit

  if (highRank === lowRank) {
    return `${highRank}${lowRank}` // pair
  }
  if (highSuit === lowSuit) {
    return `${highRank}${lowRank}s` // suited
  }
  return `${highRank}${lowRank}o` // offsuit
}

/**
 * Number of specific combos per hand class.
 * Used for weighted averaging when aggregating combos to hand classes.
 */
export function combosPerHandClass(handClass: string): number {
  if (handClass.length === 2) return 6 // pair: C(4,2) = 6
  if (handClass.endsWith('s')) return 4 // suited: 4 suit combos
  return 12 // offsuit: 4×3 = 12
}
