import { describe, expect, it } from 'vitest'

import type { PostflopSpot, PostflopSpotResult } from '../types'

import { generatePostflopFeedback } from './feedback-engine'

function makeSpot(overrides?: Partial<PostflopSpot>): PostflopSpot {
  return {
    kind: 'postflop',
    id: 'test-1',
    street: 'flop',
    board: [
      { rank: 'A', suit: 'h' },
      { rank: '7', suit: 'd' },
      { rank: '2', suit: 'c' },
    ],
    heroCards: [{ rank: 'A', suit: 's' }, { rank: 'K', suit: 's' }],
    heroHand: 'AKs',
    hero: 'BB',
    villain: 'BTN',
    heroIsIP: false,
    preflopNode: { potType: 'srp', opener: 'BTN', caller: 'BB' },
    potType: 'srp',
    potSizeBB: 6.5,
    effectiveStackBB: 97,
    boardTexture: 0b0100_0100, // HIGH + RAINBOW
    correctStrategy: { check: 55, 'bet-medium': 35, 'bet-large': 10 },
    rolledNumber: 40,
    correctAction: 'bet-medium',
    solutionKey: 'test',
    ...overrides,
  }
}

function makeResult(overrides?: Partial<PostflopSpotResult>): PostflopSpotResult {
  return {
    spotId: 'test-1',
    userAction: 'bet-medium',
    isCorrect: true,
    frequencyDeviation: 0,
    decisionTimeMs: 2000,
    timestamp: Date.now(),
    ...overrides,
  }
}

describe('generatePostflopFeedback', () => {
  it('generates feedback for a correct answer', () => {
    const feedback = generatePostflopFeedback(makeSpot(), makeResult())
    expect(feedback.headline).toBe('Nice!')
    expect(feedback.handContext).toContain('Ace-King suited')
    expect(feedback.handContext).toContain('premium')
    expect(feedback.boardContext).toContain('flop')
    expect(feedback.positionContext).toContain('out of position')
    expect(feedback.reasoning).toBeTruthy()
    expect(feedback.tip).toBeTruthy()
  })

  it('generates feedback for incorrect answer', () => {
    const feedback = generatePostflopFeedback(
      makeSpot(),
      makeResult({ userAction: 'fold', isCorrect: false }),
    )
    expect(feedback.headline).toBe('Not quite.')
    expect(feedback.reasoning).toContain('Fold')
  })

  it('includes monotone board context', () => {
    const spot = makeSpot({
      board: [
        { rank: '6', suit: 'h' },
        { rank: '5', suit: 'h' },
        { rank: '3', suit: 'h' },
      ],
      boardTexture: 0b0000_0000_0001, // MONOTONE
    })
    const feedback = generatePostflopFeedback(spot, makeResult())
    expect(feedback.boardContext).toContain('monotone')
  })

  it('includes IP position context when hero is in position', () => {
    const spot = makeSpot({ heroIsIP: true, hero: 'BTN', villain: 'BB' })
    const feedback = generatePostflopFeedback(spot, makeResult())
    expect(feedback.positionContext).toContain('in position')
  })

  it('mentions user action frequency when nonzero', () => {
    const feedback = generatePostflopFeedback(
      makeSpot(),
      makeResult({ userAction: 'check', isCorrect: false }),
    )
    expect(feedback.reasoning).toContain('55%') // check is 55% in the strategy
  })
})
