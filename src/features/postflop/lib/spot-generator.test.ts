import { describe, expect, it } from 'vitest'

import type { CachedSolution } from '../types'

import type { SolutionManifestEntry } from './solution-schema'
import {
  generatePostflopSpot,
  parseBoardString,
  pickRandomEntry,
  resolvePostflopAction,
} from './spot-generator'

// --- resolvePostflopAction ---

describe('resolvePostflopAction', () => {
  it('returns the only action for a pure strategy', () => {
    expect(resolvePostflopAction({ check: 100 }, 50)).toBe('check')
    expect(resolvePostflopAction({ fold: 100 }, 1)).toBe('fold')
  })

  it('resolves mixed strategy based on roll', () => {
    const strategy = { 'bet-medium': 60, check: 40 }
    // bet-medium is more aggressive, comes first in priority
    expect(resolvePostflopAction(strategy, 1)).toBe('bet-medium')
    expect(resolvePostflopAction(strategy, 60)).toBe('bet-medium')
    expect(resolvePostflopAction(strategy, 61)).toBe('check')
    expect(resolvePostflopAction(strategy, 100)).toBe('check')
  })

  it('orders by aggression: allin > raise > bet-large > bet-medium > bet-small > call > check > fold', () => {
    const strategy = { allin: 10, 'bet-small': 20, check: 30, fold: 40 }
    expect(resolvePostflopAction(strategy, 1)).toBe('allin')
    expect(resolvePostflopAction(strategy, 10)).toBe('allin')
    expect(resolvePostflopAction(strategy, 11)).toBe('bet-small')
    expect(resolvePostflopAction(strategy, 30)).toBe('bet-small')
    expect(resolvePostflopAction(strategy, 31)).toBe('check')
    expect(resolvePostflopAction(strategy, 60)).toBe('check')
    expect(resolvePostflopAction(strategy, 61)).toBe('fold')
    expect(resolvePostflopAction(strategy, 100)).toBe('fold')
  })

  it('falls back to highest frequency action if frequencies do not sum to 100', () => {
    // Frequencies sum to 80 — roll 81-100 should fall back
    const strategy = { check: 50, 'bet-small': 30 }
    expect(resolvePostflopAction(strategy, 81)).toBe('check')
  })
})

// --- parseBoardString ---

describe('parseBoardString', () => {
  it('parses a 3-card flop', () => {
    const board = parseBoardString('Ah 7d 2c')
    expect(board).toHaveLength(3)
    expect(board[0]).toEqual({ rank: 'A', suit: 'h' })
    expect(board[1]).toEqual({ rank: '7', suit: 'd' })
    expect(board[2]).toEqual({ rank: '2', suit: 'c' })
  })

  it('parses a 4-card turn', () => {
    const board = parseBoardString('Ah 7d 2c Ks')
    expect(board).toHaveLength(4)
    expect(board[3]).toEqual({ rank: 'K', suit: 's' })
  })

  it('parses a 5-card river', () => {
    const board = parseBoardString('Ah 7d 2c Ks Td')
    expect(board).toHaveLength(5)
  })

  it('throws for invalid card', () => {
    expect(() => parseBoardString('Xh 7d 2c')).toThrow('Invalid card')
  })

  it('throws for wrong number of cards', () => {
    expect(() => parseBoardString('Ah 7d')).toThrow('Invalid board length')
  })
})

// --- pickRandomEntry ---

describe('pickRandomEntry', () => {
  const entries: SolutionManifestEntry[] = [
    { solutionKey: 'a', nodeKey: 'BTN-open_BB-call', boardString: 'Ah 7d 2c', street: 'flop', handCount: 30 },
    { solutionKey: 'b', nodeKey: 'CO-open_BB-call', boardString: '6h 5h 3h', street: 'flop', handCount: 25 },
    { solutionKey: 'c', nodeKey: 'BTN-open_BB-call', boardString: 'Ts 9h 8h', street: 'flop', handCount: 30 },
  ]

  it('picks from all entries when no filter', () => {
    const entry = pickRandomEntry(entries)
    expect(entries).toContain(entry)
  })

  it('filters by nodeKey', () => {
    const entry = pickRandomEntry(entries, 'CO-open_BB-call')
    expect(entry.solutionKey).toBe('b')
  })

  it('throws when no entries match filter', () => {
    expect(() => pickRandomEntry(entries, 'nonexistent')).toThrow('No solutions available')
  })
})

// --- generatePostflopSpot ---

describe('generatePostflopSpot', () => {
  const solution: CachedSolution = {
    solutionKey: 'BTN-open_BB-call_Ah7d2c_flop',
    nodeKey: 'BTN-open_BB-call',
    boardString: 'Ah 7d 2c',
    street: 'flop',
    potSizeBB: 6.5,
    effectiveStackBB: 97,
    strategies: {
      'AKs': { check: 55, 'bet-medium': 35, 'bet-large': 10 },
      'TT': { check: 65, 'bet-small': 25, 'bet-medium': 10 },
      '76s': { check: 60, fold: 40 },
    },
    exploitability: 0.3,
    solvedAt: Date.now(),
  }

  it('generates a valid postflop spot', () => {
    const spot = generatePostflopSpot(solution)

    expect(spot.kind).toBe('postflop')
    expect(spot.id).toBeTruthy()
    expect(spot.street).toBe('flop')
    expect(spot.board).toHaveLength(3)
    expect(spot.heroCards).toHaveLength(2)
    expect(['AKs', 'TT', '76s']).toContain(spot.heroHand)
    expect(spot.hero).toBe('BB')
    expect(spot.villain).toBe('BTN')
    expect(spot.heroIsIP).toBe(false) // BB is OOP vs BTN
    expect(spot.potType).toBe('srp')
    expect(spot.potSizeBB).toBe(6.5)
    expect(spot.effectiveStackBB).toBe(97)
    expect(spot.rolledNumber).toBeGreaterThanOrEqual(1)
    expect(spot.rolledNumber).toBeLessThanOrEqual(100)
    expect(spot.correctAction).toBeTruthy()
    expect(spot.solutionKey).toBe('BTN-open_BB-call_Ah7d2c_flop')
    expect(spot.boardTexture).toBeTypeOf('number')
  })

  it('hero cards do not overlap with board cards', () => {
    for (let i = 0; i < 20; i++) {
      const spot = generatePostflopSpot(solution)
      for (const heroCard of spot.heroCards) {
        for (const boardCard of spot.board) {
          const overlaps = heroCard.rank === boardCard.rank && heroCard.suit === boardCard.suit
          expect(overlaps).toBe(false)
        }
      }
    }
  })

  it('handles 3bet pot node keys correctly', () => {
    const threeBetSolution: CachedSolution = {
      solutionKey: 'BTN-open_BB-3bet_BTN-call_KdQh7d_flop',
      nodeKey: 'BTN-open_BB-3bet_BTN-call',
      boardString: 'Kd Qh 7d',
      street: 'flop',
      potSizeBB: 20.5,
      effectiveStackBB: 89.75,
      strategies: {
        'AKs': { check: 25, 'bet-small': 35, 'bet-medium': 25, 'bet-large': 15 },
        'JJ': { check: 55, 'bet-small': 25, fold: 20 },
      },
      exploitability: 0.3,
      solvedAt: Date.now(),
    }

    const spot = generatePostflopSpot(threeBetSolution)
    expect(spot.potType).toBe('3bet')
    // In "BTN-open_BB-3bet_BTN-call", BTN is the caller (called BB's 3bet)
    expect(spot.hero).toBe('BTN')
    expect(spot.villain).toBe('BTN') // opener is also BTN
  })

  it('throws if solution has no strategies', () => {
    const emptySolution: CachedSolution = {
      ...solution,
      strategies: {},
    }
    expect(() => generatePostflopSpot(emptySolution)).toThrow('no strategies')
  })
})
