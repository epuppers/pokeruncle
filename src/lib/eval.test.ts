import { describe, it, expect } from 'vitest'

import type { Card } from '@/types/poker'

import { compareHands, evaluateHand } from './eval'

function card(rank: Card['rank'], suit: Card['suit']): Card {
  return { rank, suit }
}

describe('evaluateHand', () => {
  it('identifies a straight flush', () => {
    const cards = [card('A', 's'), card('K', 's'), card('Q', 's'), card('J', 's'), card('T', 's')]
    const result = evaluateHand(cards)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.rank).toBe(0)
      expect(result.value.rankName).toBe('Straight Flush')
    }
  })

  it('identifies four of a kind', () => {
    const cards = [card('A', 's'), card('A', 'h'), card('A', 'd'), card('A', 'c'), card('2', 's')]
    const result = evaluateHand(cards)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.rank).toBe(1)
      expect(result.value.rankName).toBe('Four of a Kind')
    }
  })

  it('identifies a full house', () => {
    const cards = [card('A', 's'), card('A', 'h'), card('A', 'd'), card('K', 'c'), card('K', 's')]
    const result = evaluateHand(cards)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.rank).toBe(2)
    }
  })

  it('identifies a flush', () => {
    const cards = [card('A', 's'), card('J', 's'), card('9', 's'), card('5', 's'), card('3', 's')]
    const result = evaluateHand(cards)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.rank).toBe(3)
    }
  })

  it('identifies a straight', () => {
    const cards = [card('9', 's'), card('8', 'h'), card('7', 'd'), card('6', 'c'), card('5', 's')]
    const result = evaluateHand(cards)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.rank).toBe(4)
    }
  })

  it('identifies three of a kind', () => {
    const cards = [card('7', 's'), card('7', 'h'), card('7', 'd'), card('K', 'c'), card('2', 's')]
    const result = evaluateHand(cards)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.rank).toBe(5)
    }
  })

  it('identifies two pair', () => {
    const cards = [card('A', 's'), card('A', 'h'), card('K', 'd'), card('K', 'c'), card('2', 's')]
    const result = evaluateHand(cards)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.rank).toBe(6)
    }
  })

  it('identifies one pair', () => {
    const cards = [card('A', 's'), card('A', 'h'), card('K', 'd'), card('Q', 'c'), card('2', 's')]
    const result = evaluateHand(cards)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.rank).toBe(7)
    }
  })

  it('identifies high card', () => {
    const cards = [card('A', 's'), card('J', 'h'), card('9', 'd'), card('5', 'c'), card('3', 'h')]
    const result = evaluateHand(cards)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.rank).toBe(8)
      expect(result.value.rankName).toBe('High Card')
    }
  })

  it('evaluates best 5 from 7 cards', () => {
    // Hole: AA, Board: AKQJ2 — full house (AAA + KK? no, AA + AKQ board = three aces)
    // Actually: AA + A K Q J 2 = three aces with K Q kickers
    const cards = [
      card('A', 's'),
      card('A', 'h'),
      card('A', 'd'),
      card('K', 'c'),
      card('Q', 's'),
      card('J', 'h'),
      card('2', 'd'),
    ]
    const result = evaluateHand(cards)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.rank).toBe(5) // three of a kind
    }
  })

  it('returns error for fewer than 5 cards', () => {
    const cards = [card('A', 's'), card('K', 'h'), card('Q', 'd'), card('J', 'c')]
    const result = evaluateHand(cards)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('4')
    }
  })

  it('returns error for more than 7 cards', () => {
    const cards = Array.from({ length: 8 }, () => card('2', 's'))
    const result = evaluateHand(cards)
    expect(result.ok).toBe(false)
  })
})

describe('compareHands', () => {
  it('ranks straight flush over four of a kind', () => {
    const straightFlush = [
      card('A', 's'),
      card('K', 's'),
      card('Q', 's'),
      card('J', 's'),
      card('T', 's'),
    ]
    const fourOfAKind = [
      card('A', 'h'),
      card('A', 'd'),
      card('A', 'c'),
      card('A', 's'),
      card('2', 'h'),
    ]
    const result = compareHands(straightFlush, fourOfAKind)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe(1)
    }
  })

  it('returns 0 for identical hands', () => {
    const hand = [card('A', 's'), card('K', 's'), card('Q', 's'), card('J', 's'), card('T', 's')]
    const result = compareHands(hand, hand)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe(0)
    }
  })

  it('ranks weaker hand as -1', () => {
    const pair = [card('A', 's'), card('A', 'h'), card('K', 'd'), card('Q', 'c'), card('2', 's')]
    const twoPair = [
      card('A', 's'),
      card('A', 'h'),
      card('K', 'd'),
      card('K', 'c'),
      card('2', 's'),
    ]
    const result = compareHands(pair, twoPair)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe(-1)
    }
  })

  it('distinguishes ace-high flush from king-high flush', () => {
    const aceFlush = [
      card('A', 's'),
      card('J', 's'),
      card('9', 's'),
      card('5', 's'),
      card('3', 's'),
    ]
    const kingFlush = [
      card('K', 's'),
      card('J', 's'),
      card('9', 's'),
      card('5', 's'),
      card('3', 's'),
    ]
    const result = compareHands(aceFlush, kingFlush)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe(1)
    }
  })
})
