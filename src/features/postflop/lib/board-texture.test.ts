import { describe, expect, it } from 'vitest'

import type { Card } from '@/types/poker'

import {
  TEXTURE_CONNECTED,
  TEXTURE_FLUSH_DRAW,
  TEXTURE_HIGH,
  TEXTURE_LOW,
  TEXTURE_MONOTONE,
  TEXTURE_PAIRED,
  TEXTURE_RAINBOW,
  TEXTURE_STRAIGHT_POSSIBLE,
  TEXTURE_TWO_TONE,
} from '../types'

import {
  classifyBoard,
  describeTexture,
  hasFlushDraw,
  hasTexture,
  hasTrips,
  isConnected,
  isHigh,
  isLow,
  isMonotone,
  isPaired,
  isRainbow,
  isStraightPossible,
  isTwoTone,
} from './board-texture'

/** Helper to build a Card from a short string like 'Ah' */
function card(s: string): Card {
  const rankMap: Record<string, Card['rank']> = {
    A: 'A', K: 'K', Q: 'Q', J: 'J', T: 'T',
    '9': '9', '8': '8', '7': '7', '6': '6', '5': '5',
    '4': '4', '3': '3', '2': '2',
  }
  const suitMap: Record<string, Card['suit']> = {
    h: 'h', d: 'd', c: 'c', s: 's',
  }
  return { rank: rankMap[s[0]], suit: suitMap[s[1]] }
}

/** Build a board from short strings */
function board(...cards: string[]): Card[] {
  return cards.map(card)
}

// --- Suit texture tests ---

describe('isMonotone', () => {
  it('returns true for three cards of the same suit', () => {
    expect(isMonotone(board('Ah', 'Kh', '7h'))).toBe(true)
  })

  it('returns true for four cards with three of same suit', () => {
    expect(isMonotone(board('Ah', 'Kh', '7h', '2d'))).toBe(true)
  })

  it('returns false for two-tone flop', () => {
    expect(isMonotone(board('Ah', 'Kh', '7d'))).toBe(false)
  })

  it('returns false for rainbow flop', () => {
    expect(isMonotone(board('Ah', 'Kd', '7c'))).toBe(false)
  })
})

describe('isTwoTone', () => {
  it('returns true for two suits on flop (2+1)', () => {
    expect(isTwoTone(board('Ah', 'Kh', '7d'))).toBe(true)
  })

  it('returns false for monotone', () => {
    expect(isTwoTone(board('Ah', 'Kh', '7h'))).toBe(false)
  })

  it('returns false for rainbow', () => {
    expect(isTwoTone(board('Ah', 'Kd', '7c'))).toBe(false)
  })
})

describe('isRainbow', () => {
  it('returns true for three different suits on flop', () => {
    expect(isRainbow(board('Ah', 'Kd', '7c'))).toBe(true)
  })

  it('returns false for monotone', () => {
    expect(isRainbow(board('Ah', 'Kh', '7h'))).toBe(false)
  })

  it('returns true for 4 different suits on turn', () => {
    expect(isRainbow(board('Ah', 'Kd', '7c', '2s'))).toBe(true)
  })
})

// --- Pairing tests ---

describe('isPaired', () => {
  it('returns true when board has a pair', () => {
    expect(isPaired(board('Ah', 'Ad', '7c'))).toBe(true)
  })

  it('returns false for unpaired board', () => {
    expect(isPaired(board('Ah', 'Kd', '7c'))).toBe(false)
  })

  it('returns true for two pair on board', () => {
    expect(isPaired(board('Ah', 'Ad', '7c', '7h', '2s'))).toBe(true)
  })
})

describe('hasTrips', () => {
  it('returns true for three of same rank', () => {
    expect(hasTrips(board('Ah', 'Ad', 'Ac'))).toBe(true)
  })

  it('returns false for just a pair', () => {
    expect(hasTrips(board('Ah', 'Ad', '7c'))).toBe(false)
  })
})

// --- Connectivity tests ---

describe('isConnected', () => {
  it('returns true for consecutive cards (8-9)', () => {
    expect(isConnected(board('9h', '8d', '2c'))).toBe(true)
  })

  it('returns true for one-gap cards (7-9)', () => {
    expect(isConnected(board('9h', '7d', '2c'))).toBe(true)
  })

  it('returns false for widely separated cards', () => {
    expect(isConnected(board('Ah', '7d', '2c'))).toBe(false)
  })

  it('returns false for A-2 alone (not enough wheel cards)', () => {
    expect(isConnected(board('Ah', '2d', '9c'))).toBe(false)
  })

  it('returns true for A-2-3 wheel connectivity', () => {
    expect(isConnected(board('Ah', '2d', '3c'))).toBe(true)
  })

  it('returns true for A-4-5 wheel connectivity', () => {
    expect(isConnected(board('Ah', '4d', '5c'))).toBe(true)
  })

  it('returns true for T-J-Q', () => {
    expect(isConnected(board('Th', 'Jd', 'Qc'))).toBe(true)
  })
})

// --- Height tests ---

describe('isHigh', () => {
  it('returns true when highest card is A', () => {
    expect(isHigh(board('Ah', '7d', '2c'))).toBe(true)
  })

  it('returns true when highest card is K', () => {
    expect(isHigh(board('Kh', '7d', '2c'))).toBe(true)
  })

  it('returns true when highest card is Q', () => {
    expect(isHigh(board('Qh', '7d', '2c'))).toBe(true)
  })

  it('returns false when highest card is J', () => {
    expect(isHigh(board('Jh', '7d', '2c'))).toBe(false)
  })
})

describe('isLow', () => {
  it('returns true when highest card is 8', () => {
    expect(isLow(board('8h', '5d', '2c'))).toBe(true)
  })

  it('returns true when highest card is 7', () => {
    expect(isLow(board('7h', '5d', '2c'))).toBe(true)
  })

  it('returns false when highest card is 9', () => {
    expect(isLow(board('9h', '5d', '2c'))).toBe(false)
  })
})

// --- Straight possibility ---

describe('isStraightPossible', () => {
  it('returns true for T-J-Q (3 in a 5-card window)', () => {
    expect(isStraightPossible(board('Th', 'Jd', 'Qc'))).toBe(true)
  })

  it('returns true for 5-6-7', () => {
    expect(isStraightPossible(board('5h', '6d', '7c'))).toBe(true)
  })

  it('returns true for A-2-3 wheel draw', () => {
    expect(isStraightPossible(board('Ah', '2d', '3c'))).toBe(true)
  })

  it('returns false for A-7-2 (too spread)', () => {
    expect(isStraightPossible(board('Ah', '7d', '2c'))).toBe(false)
  })

  it('returns true for 8-T-Q with gaps', () => {
    expect(isStraightPossible(board('8h', 'Td', 'Qc'))).toBe(true)
  })

  it('returns false for paired board with spread ranks', () => {
    expect(isStraightPossible(board('Ah', 'Ad', '2c'))).toBe(false)
  })
})

// --- Flush draw ---

describe('hasFlushDraw', () => {
  it('returns true for two cards of same suit (not monotone)', () => {
    expect(hasFlushDraw(board('Ah', 'Kh', '7d'))).toBe(true)
  })

  it('returns false for monotone (3+ of same suit)', () => {
    expect(hasFlushDraw(board('Ah', 'Kh', '7h'))).toBe(false)
  })

  it('returns false for rainbow', () => {
    expect(hasFlushDraw(board('Ah', 'Kd', '7c'))).toBe(false)
  })
})

// --- Main classifier ---

describe('classifyBoard', () => {
  it('classifies dry rainbow A-high board', () => {
    const mask = classifyBoard(board('Ah', 'Kd', '2c'))
    expect(hasTexture(mask, TEXTURE_RAINBOW)).toBe(true)
    expect(hasTexture(mask, TEXTURE_HIGH)).toBe(true)
    expect(hasTexture(mask, TEXTURE_CONNECTED)).toBe(true) // A-K are within 2
    expect(hasTexture(mask, TEXTURE_MONOTONE)).toBe(false)
    expect(hasTexture(mask, TEXTURE_PAIRED)).toBe(false)
    expect(hasTexture(mask, TEXTURE_LOW)).toBe(false)
  })

  it('classifies wet monotone low connected board', () => {
    const mask = classifyBoard(board('5h', '6h', '7h'))
    expect(hasTexture(mask, TEXTURE_MONOTONE)).toBe(true)
    expect(hasTexture(mask, TEXTURE_LOW)).toBe(true)
    expect(hasTexture(mask, TEXTURE_CONNECTED)).toBe(true)
    expect(hasTexture(mask, TEXTURE_STRAIGHT_POSSIBLE)).toBe(true)
    expect(hasTexture(mask, TEXTURE_RAINBOW)).toBe(false)
  })

  it('classifies paired two-tone high board', () => {
    const mask = classifyBoard(board('Kh', 'Kd', '7h'))
    expect(hasTexture(mask, TEXTURE_PAIRED)).toBe(true)
    expect(hasTexture(mask, TEXTURE_TWO_TONE)).toBe(true)
    expect(hasTexture(mask, TEXTURE_HIGH)).toBe(true)
    expect(hasTexture(mask, TEXTURE_FLUSH_DRAW)).toBe(true)
    expect(hasTexture(mask, TEXTURE_MONOTONE)).toBe(false)
  })

  it('classifies dry low disconnected rainbow', () => {
    // 8-3-2 has no two cards within 1 gap except 3-2 which IS connected
    // Use truly disconnected ranks: 8-5-2
    const mask = classifyBoard(board('8h', '5d', '2c'))
    expect(hasTexture(mask, TEXTURE_RAINBOW)).toBe(true)
    expect(hasTexture(mask, TEXTURE_LOW)).toBe(true)
    expect(hasTexture(mask, TEXTURE_CONNECTED)).toBe(false)
    expect(hasTexture(mask, TEXTURE_PAIRED)).toBe(false)
    expect(hasTexture(mask, TEXTURE_MONOTONE)).toBe(false)
    expect(hasTexture(mask, TEXTURE_HIGH)).toBe(false)
  })

  it('works for turn boards (4 cards)', () => {
    const mask = classifyBoard(board('Ah', 'Kh', '7d', '6d'))
    expect(hasTexture(mask, TEXTURE_FLUSH_DRAW)).toBe(true)
    expect(hasTexture(mask, TEXTURE_HIGH)).toBe(true)
    expect(hasTexture(mask, TEXTURE_CONNECTED)).toBe(true) // 7-6 and A-K
  })

  it('works for river boards (5 cards)', () => {
    const mask = classifyBoard(board('Ah', 'Kh', 'Qh', '7d', '2c'))
    expect(hasTexture(mask, TEXTURE_MONOTONE)).toBe(true)
    expect(hasTexture(mask, TEXTURE_HIGH)).toBe(true)
    expect(hasTexture(mask, TEXTURE_STRAIGHT_POSSIBLE)).toBe(true)
  })
})

// --- describeTexture ---

describe('describeTexture', () => {
  it('describes a dry rainbow high board', () => {
    const mask = TEXTURE_RAINBOW | TEXTURE_HIGH
    expect(describeTexture(mask)).toBe('Dry rainbow high')
  })

  it('describes a wet monotone connected board', () => {
    const mask = TEXTURE_MONOTONE | TEXTURE_CONNECTED | TEXTURE_LOW | TEXTURE_STRAIGHT_POSSIBLE
    expect(describeTexture(mask)).toBe('Wet monotone low')
  })

  it('describes a wet paired two-tone board', () => {
    const mask = TEXTURE_PAIRED | TEXTURE_TWO_TONE | TEXTURE_HIGH | TEXTURE_FLUSH_DRAW
    expect(describeTexture(mask)).toBe('Wet two-tone paired high')
  })
})
