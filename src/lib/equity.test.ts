import { describe, it, expect } from 'vitest'

import type { Card } from '@/types/poker'

import { equityVsRange } from './equity'

function card(rank: Card['rank'], suit: Card['suit']): Card {
  return { rank, suit }
}

describe('equityVsRange', () => {
  it('gives AA ~80% equity against KK preflop', () => {
    const hero: [Card, Card] = [card('A', 's'), card('A', 'h')]
    const villain: [Card, Card][] = [
      [card('K', 's'), card('K', 'h')],
      [card('K', 'd'), card('K', 'c')],
      [card('K', 's'), card('K', 'd')],
      [card('K', 'h'), card('K', 'c')],
    ]

    const result = equityVsRange(hero, villain, [], 20_000)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.wins).toBeGreaterThan(0.75)
      expect(result.value.wins).toBeLessThan(0.88)
      expect(result.value.wins + result.value.ties + result.value.losses).toBeCloseTo(1, 2)
    }
  })

  it('gives AA heavy edge over 72o preflop', () => {
    const hero: [Card, Card] = [card('A', 's'), card('A', 'h')]
    const villain: [Card, Card][] = [[card('7', 'd'), card('2', 'c')]]

    const result = equityVsRange(hero, villain, [], 10_000)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.wins).toBeGreaterThan(0.85)
    }
  })

  it('returns error for empty villain range', () => {
    const hero: [Card, Card] = [card('A', 's'), card('A', 'h')]
    const result = equityVsRange(hero, [], [])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('empty')
    }
  })

  it('filters out villain hands that overlap with hero cards', () => {
    const hero: [Card, Card] = [card('A', 's'), card('A', 'h')]
    // All villain hands use hero's cards — should fail after filtering
    const villain: [Card, Card][] = [[card('A', 's'), card('K', 'h')]]

    const result = equityVsRange(hero, villain, [])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('blocker')
    }
  })

  it('returns error for board with more than 5 cards', () => {
    const hero: [Card, Card] = [card('A', 's'), card('A', 'h')]
    const villain: [Card, Card][] = [[card('K', 's'), card('K', 'h')]]
    const board = [
      card('2', 's'),
      card('3', 's'),
      card('4', 's'),
      card('5', 's'),
      card('6', 's'),
      card('7', 's'),
    ]

    const result = equityVsRange(hero, villain, board)
    expect(result.ok).toBe(false)
  })
})
