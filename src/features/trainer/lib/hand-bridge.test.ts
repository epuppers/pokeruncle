import { describe, expect, it } from 'vitest'

import type { SolutionManifest } from '@/features/postflop'

import type { Spot } from '../types'

import type { CachedSolution } from '@/features/postflop'

import {
  canContinueToPostflop,
  findMatchingSolutions,
  generatePostflopSpotForHand,
  preflopToNodeKey,
} from './hand-bridge'

// ─── Helpers ─────────────────────────────────────────────────

type ResponseSpot = Extract<Spot, { kind: 'response' }>

/** Minimal response spot for testing */
function responseSpot(
  overrides: Partial<ResponseSpot> &
    Pick<ResponseSpot, 'hero' | 'villain' | 'scenario'>,
): ResponseSpot {
  return {
    kind: 'response',
    id: 'test',
    provider: 'pekarstas',
    heroHand: 'AKs',
    heroCards: [
      { rank: 'A', suit: 's' },
      { rank: 'K', suit: 's' },
    ],
    cell: 'call',
    rolledNumber: 50,
    correctAction: 'call',
    ...overrides,
  }
}

/** Minimal open spot (RFI) for testing */
function openSpot(): Spot {
  return {
    kind: 'open',
    id: 'test',
    provider: 'pekarstas',
    hero: 'UTG',
    scenario: 'RFI',
    heroHand: 'AA',
    heroCards: [
      { rank: 'A', suit: 's' },
      { rank: 'A', suit: 'h' },
    ],
    cell: 'raise',
    rolledNumber: 50,
    correctAction: 'raise',
  }
}

/** Manifest with a few representative solutions */
const testManifest: SolutionManifest = {
  version: 1,
  solutions: [
    {
      solutionKey: 'BTN-open_BB-call_Ah7d2c_flop',
      nodeKey: 'BTN-open_BB-call',
      boardString: 'Ah 7d 2c',
      street: 'flop',
      handCount: 30,
    },
    {
      solutionKey: 'BTN-open_BB-call_Ks9h4d_flop',
      nodeKey: 'BTN-open_BB-call',
      boardString: 'Ks 9h 4d',
      street: 'flop',
      handCount: 25,
    },
    {
      solutionKey: 'BTN-open_BB-3bet_BTN-call_QhJd5c_flop',
      nodeKey: 'BTN-open_BB-3bet_BTN-call',
      boardString: 'Qh Jd 5c',
      street: 'flop',
      handCount: 40,
    },
    {
      solutionKey: 'CO-open_BB-call_Ts8s3h_flop',
      nodeKey: 'CO-open_BB-call',
      boardString: 'Ts 8s 3h',
      street: 'flop',
      handCount: 20,
    },
  ],
}

// ─── preflopToNodeKey ────────────────────────────────────────

describe('preflopToNodeKey', () => {
  it('maps BB vs-open from BTN to BTN-open_BB-call', () => {
    const spot = responseSpot({ hero: 'BB', villain: 'BTN', scenario: 'vs-open' })
    expect(preflopToNodeKey(spot)).toBe('BTN-open_BB-call')
  })

  it('maps BB vs-open from CO to CO-open_BB-call', () => {
    const spot = responseSpot({ hero: 'BB', villain: 'CO', scenario: 'vs-open' })
    expect(preflopToNodeKey(spot)).toBe('CO-open_BB-call')
  })

  it('maps BTN vs-open from CO to CO-open_BTN-call', () => {
    const spot = responseSpot({ hero: 'BTN', villain: 'CO', scenario: 'vs-open' })
    expect(preflopToNodeKey(spot)).toBe('CO-open_BTN-call')
  })

  it('maps BTN vs-3bet from BB to BTN-open_BB-3bet_BTN-call', () => {
    const spot = responseSpot({ hero: 'BTN', villain: 'BB', scenario: 'vs-3bet' })
    expect(preflopToNodeKey(spot)).toBe('BTN-open_BB-3bet_BTN-call')
  })

  it('maps CO vs-3bet from BTN to CO-open_BTN-3bet_CO-call', () => {
    const spot = responseSpot({ hero: 'CO', villain: 'BTN', scenario: 'vs-3bet' })
    expect(preflopToNodeKey(spot)).toBe('CO-open_BTN-3bet_CO-call')
  })

  it('returns null for RFI (open) spots', () => {
    expect(preflopToNodeKey(openSpot())).toBeNull()
  })

  it('returns null for vs-4bet', () => {
    const spot = responseSpot({ hero: 'BTN', villain: 'BB', scenario: 'vs-4bet' })
    expect(preflopToNodeKey(spot)).toBeNull()
  })

  it('returns null for 3bet-defense', () => {
    const spot = responseSpot({
      hero: 'BB',
      villain: 'BTN',
      scenario: '3bet-defense',
    })
    expect(preflopToNodeKey(spot)).toBeNull()
  })

  it('returns null for push-fold spots', () => {
    const spot: Spot = {
      kind: 'push-fold',
      id: 'test',
      provider: 'nash-pushfold',
      hero: 'BTN',
      scenario: 'push',
      heroHand: 'AA',
      heroCards: [
        { rank: 'A', suit: 's' },
        { rank: 'A', suit: 'h' },
      ],
      cell: 'allin',
      rolledNumber: 50,
      correctAction: 'allin',
      stackDepth: 10,
    }
    expect(preflopToNodeKey(spot)).toBeNull()
  })
})

// ─── findMatchingSolutions ───────────────────────────────────

describe('findMatchingSolutions', () => {
  it('finds all solutions for a matching SRP node', () => {
    const spot = responseSpot({ hero: 'BB', villain: 'BTN', scenario: 'vs-open' })
    const matches = findMatchingSolutions(spot, testManifest)
    expect(matches).toHaveLength(2)
    expect(matches.every((m) => m.nodeKey === 'BTN-open_BB-call')).toBe(true)
  })

  it('finds solutions for a matching 3bet node', () => {
    const spot = responseSpot({ hero: 'BTN', villain: 'BB', scenario: 'vs-3bet' })
    const matches = findMatchingSolutions(spot, testManifest)
    expect(matches).toHaveLength(1)
    expect(matches[0].nodeKey).toBe('BTN-open_BB-3bet_BTN-call')
  })

  it('returns empty for a node with no solutions', () => {
    const spot = responseSpot({ hero: 'BB', villain: 'UTG', scenario: 'vs-open' })
    const matches = findMatchingSolutions(spot, testManifest)
    expect(matches).toEqual([])
  })

  it('returns empty for scenarios that cannot continue', () => {
    expect(findMatchingSolutions(openSpot(), testManifest)).toEqual([])
  })
})

// ─── canContinueToPostflop ───────────────────────────────────

describe('canContinueToPostflop', () => {
  it('returns true when solutions exist for the spot', () => {
    const spot = responseSpot({ hero: 'BB', villain: 'BTN', scenario: 'vs-open' })
    expect(canContinueToPostflop(spot, testManifest)).toBe(true)
  })

  it('returns false when no solutions exist for the node', () => {
    const spot = responseSpot({ hero: 'SB', villain: 'CO', scenario: 'vs-open' })
    expect(canContinueToPostflop(spot, testManifest)).toBe(false)
  })

  it('returns false for RFI spots', () => {
    expect(canContinueToPostflop(openSpot(), testManifest)).toBe(false)
  })

  it('returns false for vs-4bet spots', () => {
    const spot = responseSpot({ hero: 'BTN', villain: 'BB', scenario: 'vs-4bet' })
    expect(canContinueToPostflop(spot, testManifest)).toBe(false)
  })
})

// ─── generatePostflopSpotForHand ────────────────────────────

const testSolution: CachedSolution = {
  solutionKey: 'BTN-open_BB-call_Ah7d2c_flop',
  nodeKey: 'BTN-open_BB-call',
  boardString: 'Ah 7d 2c',
  street: 'flop',
  potSizeBB: 6.5,
  effectiveStackBB: 97,
  strategies: {
    AKs: { check: 40, 'bet-medium': 60 },
    T9o: { check: 100 },
    '22': { 'bet-small': 30, check: 70 },
  },
  exploitability: 0.01,
  solvedAt: Date.now(),
}

describe('generatePostflopSpotForHand', () => {
  const spot = responseSpot({ hero: 'BB', villain: 'BTN', scenario: 'vs-open' })

  it('returns a valid PostflopSpot when heroHand is in the strategy range', () => {
    const result = generatePostflopSpotForHand(testSolution, spot, spot.heroCards)
    expect(result).not.toBeNull()
    expect(result!.kind).toBe('postflop')
    expect(result!.heroHand).toBe('AKs')
    expect(result!.hero).toBe('BB')
    expect(result!.villain).toBe('BTN')
    expect(result!.street).toBe('flop')
    expect(result!.board).toHaveLength(3)
    expect(result!.potSizeBB).toBe(6.5)
    expect(result!.solutionKey).toBe('BTN-open_BB-call_Ah7d2c_flop')
  })

  it('returns null when heroHand is not in the strategy range', () => {
    const missingSpot = responseSpot({
      hero: 'BB',
      villain: 'BTN',
      scenario: 'vs-open',
      heroHand: '72o',
    })
    const result = generatePostflopSpotForHand(testSolution, missingSpot, missingSpot.heroCards)
    expect(result).toBeNull()
  })

  it('sets heroIsIP correctly for BB vs BTN (BB is OOP)', () => {
    const result = generatePostflopSpotForHand(testSolution, spot, spot.heroCards)
    expect(result!.heroIsIP).toBe(false)
  })

  it('sets SRP pot type for vs-open scenario', () => {
    const result = generatePostflopSpotForHand(testSolution, spot, spot.heroCards)
    expect(result!.potType).toBe('srp')
    expect(result!.preflopNode).toEqual({ potType: 'srp', opener: 'BTN', caller: 'BB' })
  })

  it('sets 3bet pot type for vs-3bet scenario', () => {
    const threeBetSpot = responseSpot({ hero: 'BTN', villain: 'BB', scenario: 'vs-3bet' })
    const threeBetSolution: CachedSolution = {
      ...testSolution,
      nodeKey: 'BTN-open_BB-3bet_BTN-call',
      strategies: { AKs: { check: 50, 'bet-large': 50 } },
    }
    const result = generatePostflopSpotForHand(threeBetSolution, threeBetSpot, threeBetSpot.heroCards)
    expect(result!.potType).toBe('3bet')
    expect(result!.preflopNode).toEqual({
      potType: '3bet',
      opener: 'BTN',
      threeBettor: 'BB',
      caller: 'BTN',
    })
  })

  it('resolves correctAction from strategy and rolled number', () => {
    const result = generatePostflopSpotForHand(testSolution, spot, spot.heroCards)
    expect(result!.correctStrategy).toEqual({ check: 40, 'bet-medium': 60 })
    // correctAction should be one of the actions in the strategy
    expect(['check', 'bet-medium']).toContain(result!.correctAction)
  })
})
