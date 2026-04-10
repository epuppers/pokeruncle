import { describe, it, expect } from 'vitest'
import { generateFeedback } from './feedback-engine'
import type { Spot, SpotResult } from '@/features/trainer/types'

function makeSpot(overrides: Partial<Spot> = {}): Spot {
  return {
    kind: 'open',
    id: 'test-1',
    provider: 'pekarstas',
    hero: 'CO',
    scenario: 'RFI',
    heroHand: 'AKs',
    heroCards: [
      { rank: 'A', suit: 's' },
      { rank: 'K', suit: 's' },
    ],
    cell: 'raise',
    rolledNumber: 50,
    correctAction: 'raise',
    ...overrides,
  } as Spot
}

function makeResult(overrides: Partial<SpotResult> = {}): SpotResult {
  return {
    spotId: 'test-1',
    userAction: 'raise',
    isCorrect: true,
    decisionTimeMs: 2000,
    timestamp: Date.now(),
    ...overrides,
  }
}

describe('generateFeedback', () => {
  it('returns all required fields', () => {
    const fb = generateFeedback(makeSpot(), makeResult())
    expect(fb.headline).toBeDefined()
    expect(fb.handContext).toBeDefined()
    expect(fb.positionContext).toBeDefined()
    expect(fb.reasoning).toBeDefined()
    expect(fb.tip).toBeDefined()
  })

  it('says "Nice!" when correct', () => {
    const fb = generateFeedback(makeSpot(), makeResult({ isCorrect: true }))
    expect(fb.headline).toBe('Nice!')
  })

  it('says "Not quite." when incorrect', () => {
    const fb = generateFeedback(makeSpot(), makeResult({ isCorrect: false }))
    expect(fb.headline).toBe('Not quite.')
  })

  it('includes hand strength percentile', () => {
    const fb = generateFeedback(makeSpot({ heroHand: 'AKs' }), makeResult())
    expect(fb.handContext).toContain('premium')
    expect(fb.handContext).toContain('top 3%')
  })

  it('includes position context', () => {
    const fb = generateFeedback(makeSpot({ hero: 'UTG' as const }), makeResult())
    expect(fb.positionContext).toContain('first to act')
  })

  it('includes dollar amounts in reasoning', () => {
    const fb = generateFeedback(makeSpot(), makeResult())
    expect(fb.reasoning).toContain('$')
  })

  it('explains fold reasoning for weak hands', () => {
    const spot = makeSpot({
      heroHand: '72o',
      correctAction: 'fold',
      cell: 'fold',
    })
    const fb = generateFeedback(spot, makeResult({ userAction: 'raise', isCorrect: false }))
    expect(fb.reasoning).toContain('too weak')
  })

  it('handles vs-open scenario', () => {
    const spot: Spot = {
      kind: 'response',
      id: 'test-2',
      provider: 'pekarstas',
      hero: 'BB',
      villain: 'CO',
      scenario: 'vs-open',
      heroHand: 'ATs',
      heroCards: [
        { rank: 'A', suit: 's' },
        { rank: 'T', suit: 's' },
      ],
      cell: 'call',
      rolledNumber: 50,
      correctAction: 'call',
    }
    const fb = generateFeedback(spot, makeResult({ userAction: 'call', isCorrect: true }))
    expect(fb.reasoning).toContain('Calling')
  })

  it('handles push-fold scenario', () => {
    const spot: Spot = {
      kind: 'push-fold',
      id: 'test-3',
      provider: 'nash-pushfold',
      hero: 'BTN',
      scenario: 'push',
      heroHand: 'AKs',
      heroCards: [
        { rank: 'A', suit: 's' },
        { rank: 'K', suit: 's' },
      ],
      cell: 'allin',
      rolledNumber: 50,
      correctAction: 'allin',
      stackDepth: 10,
    }
    const fb = generateFeedback(spot, makeResult({ userAction: 'allin', isCorrect: true }))
    expect(fb.reasoning).toContain('short stack')
  })
})
