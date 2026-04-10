import type { Card, Rank, Suit } from '@/types/poker'
import { RANKS } from '@/types/poker'

import type { BoardTextureMask } from '../types'
import {
  TEXTURE_CONNECTED,
  TEXTURE_FLUSH_DRAW,
  TEXTURE_HIGH,
  TEXTURE_LOW,
  TEXTURE_MONOTONE,
  TEXTURE_PAIRED,
  TEXTURE_RAINBOW,
  TEXTURE_STRAIGHT_POSSIBLE,
  TEXTURE_TRIPS,
  TEXTURE_TWO_TONE,
} from '../types'

/** Map rank to numeric value (A=14, K=13, ..., 2=2) */
function rankValue(rank: Rank): number {
  const index = RANKS.indexOf(rank)
  // RANKS is ['A','K','Q',...,'2'] so index 0 = A(14), index 12 = 2(2)
  return 14 - index
}

/** Count occurrences of each suit on the board */
function suitCounts(board: readonly Card[]): Map<Suit, number> {
  const counts = new Map<Suit, number>()
  for (const card of board) {
    counts.set(card.suit, (counts.get(card.suit) ?? 0) + 1)
  }
  return counts
}

/** Count occurrences of each rank on the board */
function rankCounts(board: readonly Card[]): Map<Rank, number> {
  const counts = new Map<Rank, number>()
  for (const card of board) {
    counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1)
  }
  return counts
}

/** Get sorted numeric rank values (descending) */
function sortedRankValues(board: readonly Card[]): number[] {
  return board.map((c) => rankValue(c.rank)).sort((a, b) => b - a)
}

/** Get unique rank values from the board */
function uniqueRankValues(board: readonly Card[]): number[] {
  return [...new Set(sortedRankValues(board))].sort((a, b) => b - a)
}

// --- Individual texture predicates ---

/** 3+ cards of the same suit */
export function isMonotone(board: readonly Card[]): boolean {
  for (const count of suitCounts(board).values()) {
    if (count >= 3) return true
  }
  return false
}

/** Exactly 2 suits present on the board */
export function isTwoTone(board: readonly Card[]): boolean {
  return suitCounts(board).size === 2 && !isMonotone(board)
}

/** All cards are different suits (only meaningful for 3 cards) */
export function isRainbow(board: readonly Card[]): boolean {
  return suitCounts(board).size >= 3 && !isMonotone(board)
}

/** Board contains at least one pair (two cards of the same rank) */
export function isPaired(board: readonly Card[]): boolean {
  for (const count of rankCounts(board).values()) {
    if (count >= 2) return true
  }
  return false
}

/** Board contains three of the same rank */
export function hasTrips(board: readonly Card[]): boolean {
  for (const count of rankCounts(board).values()) {
    if (count >= 3) return true
  }
  return false
}

/**
 * Board has 2+ cards within 2 rank gaps of each other.
 * This indicates connected texture where straight draws are likely.
 */
export function isConnected(board: readonly Card[]): boolean {
  const values = uniqueRankValues(board)
  if (values.length < 2) return false

  for (let i = 0; i < values.length - 1; i++) {
    const gap = values[i] - values[i + 1]
    if (gap <= 2) return true
  }

  // Check A-low connectivity for wheel draws (A-2-3-4-5).
  // Only trigger if A + at least two wheel cards are present,
  // so that A-2-x alone doesn't count as connected.
  if (values.includes(14)) {
    const wheelCards = values.filter((v) => v >= 2 && v <= 5)
    if (wheelCards.length >= 2) return true
  }

  return false
}

/** Highest card is A, K, or Q */
export function isHigh(board: readonly Card[]): boolean {
  const highest = Math.max(...board.map((c) => rankValue(c.rank)))
  return highest >= 12 // Q=12, K=13, A=14
}

/** Highest card is 8 or below */
export function isLow(board: readonly Card[]): boolean {
  const highest = Math.max(...board.map((c) => rankValue(c.rank)))
  return highest <= 8
}

/**
 * A straight is possible using the board cards.
 * Checks if any 5-card window contains 3+ board cards.
 */
export function isStraightPossible(board: readonly Card[]): boolean {
  const values = uniqueRankValues(board)
  if (values.length < 3) return false

  // Add ace as low (1) for wheel checking
  const extendedValues = values.includes(14) ? [...values, 1] : values
  const valueSet = new Set(extendedValues)

  // Check all possible 5-card straight windows
  for (let high = 14; high >= 5; high--) {
    let count = 0
    for (let v = high; v > high - 5; v--) {
      if (valueSet.has(v)) count++
    }
    if (count >= 3) return true
  }

  return false
}

/** 2 cards of the same suit present (flush draw possible) but not monotone */
export function hasFlushDraw(board: readonly Card[]): boolean {
  const counts = suitCounts(board)
  for (const count of counts.values()) {
    if (count === 2) return true
  }
  return false
}

// --- Main classifier ---

/**
 * Classify a board into a bitmask of texture properties.
 * Works for flop (3 cards), turn (4), or river (5).
 */
export function classifyBoard(board: readonly Card[]): BoardTextureMask {
  let mask: BoardTextureMask = 0

  if (isMonotone(board)) mask |= TEXTURE_MONOTONE
  if (isTwoTone(board)) mask |= TEXTURE_TWO_TONE
  if (isRainbow(board)) mask |= TEXTURE_RAINBOW
  if (isPaired(board)) mask |= TEXTURE_PAIRED
  if (hasTrips(board)) mask |= TEXTURE_TRIPS
  if (isConnected(board)) mask |= TEXTURE_CONNECTED
  if (isHigh(board)) mask |= TEXTURE_HIGH
  if (isLow(board)) mask |= TEXTURE_LOW
  if (isStraightPossible(board)) mask |= TEXTURE_STRAIGHT_POSSIBLE
  if (hasFlushDraw(board)) mask |= TEXTURE_FLUSH_DRAW

  return mask
}

/** Check if a board texture mask contains a specific texture flag */
export function hasTexture(mask: BoardTextureMask, flag: BoardTextureMask): boolean {
  return (mask & flag) !== 0
}

/**
 * Describe a board texture mask as a human-readable string.
 * e.g. "Dry rainbow K-high" or "Wet monotone paired"
 */
export function describeTexture(mask: BoardTextureMask): string {
  const parts: string[] = []

  // Wetness: connected + draws = wet; otherwise dry
  const isWet =
    hasTexture(mask, TEXTURE_CONNECTED) ||
    hasTexture(mask, TEXTURE_FLUSH_DRAW) ||
    hasTexture(mask, TEXTURE_STRAIGHT_POSSIBLE)
  parts.push(isWet ? 'Wet' : 'Dry')

  // Suit texture
  if (hasTexture(mask, TEXTURE_MONOTONE)) parts.push('monotone')
  else if (hasTexture(mask, TEXTURE_TWO_TONE)) parts.push('two-tone')
  else if (hasTexture(mask, TEXTURE_RAINBOW)) parts.push('rainbow')

  // Pairing
  if (hasTexture(mask, TEXTURE_TRIPS)) parts.push('trips')
  else if (hasTexture(mask, TEXTURE_PAIRED)) parts.push('paired')

  // Height
  if (hasTexture(mask, TEXTURE_HIGH)) parts.push('high')
  else if (hasTexture(mask, TEXTURE_LOW)) parts.push('low')

  return parts.join(' ')
}
