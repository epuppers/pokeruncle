import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Spot } from '@/features/trainer/types'

import { useHandStore } from './handStore'

// Mock DB-dependent modules to avoid IndexedDB in tests
vi.mock('@/features/trainer/lib/mastery-persistence', () => ({
  recordSpotResult: vi.fn().mockResolvedValue(undefined),
}))


vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: {
    getState: () => ({ trainingStrictness: 5 }),
  },
}))

// ─── Helpers ─────────────────────────────────────────────────

function makeResponseSpot(overrides?: Partial<Extract<Spot, { kind: 'response' }>>): Extract<Spot, { kind: 'response' }> {
  return {
    kind: 'response',
    id: 'test-spot-1',
    provider: 'pekarstas',
    hero: 'BB',
    villain: 'BTN',
    scenario: 'vs-open',
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

function makeOpenSpot(): Extract<Spot, { kind: 'open' }> {
  return {
    kind: 'open',
    id: 'test-open-1',
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

// ─── Tests ───────────────────────────────────────────────────

describe('handStore', () => {
  beforeEach(() => {
    useHandStore.getState().resetSession()
  })

  describe('initial state', () => {
    it('starts in idle phase', () => {
      expect(useHandStore.getState().handPhase.phase).toBe('idle')
    })

    it('starts with zero session stats', () => {
      const stats = useHandStore.getState().sessionStats
      expect(stats.handsPlayed).toBe(0)
      expect(stats.preflopCorrect).toBe(0)
      expect(stats.postflopCorrect).toBe(0)
      expect(stats.postflopHands).toBe(0)
    })
  })

  describe('dealPreflop', () => {
    it('transitions to preflop-dealing with the spot', () => {
      const spot = makeResponseSpot()
      useHandStore.getState().dealPreflop(spot, true)

      const phase = useHandStore.getState().handPhase
      expect(phase.phase).toBe('preflop-dealing')
      if (phase.phase === 'preflop-dealing') {
        expect(phase.spot.id).toBe('test-spot-1')
      }
    })

    it('stores hasContinuation flag', () => {
      useHandStore.getState().dealPreflop(makeResponseSpot(), true)
      expect(useHandStore.getState().hasContinuation).toBe(true)

      useHandStore.getState().resetSession()
      useHandStore.getState().dealPreflop(makeOpenSpot(), false)
      expect(useHandStore.getState().hasContinuation).toBe(false)
    })
  })

  describe('startPreflopDecision', () => {
    it('transitions from preflop-dealing to preflop-decision', () => {
      useHandStore.getState().dealPreflop(makeResponseSpot(), true)
      useHandStore.getState().startPreflopDecision()

      const phase = useHandStore.getState().handPhase
      expect(phase.phase).toBe('preflop-decision')
      if (phase.phase === 'preflop-decision') {
        expect(phase.startedAt).toBeGreaterThan(0)
      }
    })

    it('does nothing if not in preflop-dealing phase', () => {
      useHandStore.getState().startPreflopDecision()
      expect(useHandStore.getState().handPhase.phase).toBe('idle')
    })
  })

  describe('submitPreflopAction', () => {
    it('transitions to preflop-feedback with correct result', () => {
      const spot = makeResponseSpot({ correctAction: 'call' })
      useHandStore.getState().dealPreflop(spot, true)
      useHandStore.getState().startPreflopDecision()
      useHandStore.getState().submitPreflopAction('call')

      const phase = useHandStore.getState().handPhase
      expect(phase.phase).toBe('preflop-feedback')
      if (phase.phase === 'preflop-feedback') {
        expect(phase.result.isCorrect).toBe(true)
        expect(phase.result.userAction).toBe('call')
      }
    })

    it('marks incorrect action as not correct', () => {
      const spot = makeResponseSpot({ correctAction: 'call' })
      useHandStore.getState().dealPreflop(spot, true)
      useHandStore.getState().startPreflopDecision()
      useHandStore.getState().submitPreflopAction('fold')

      const phase = useHandStore.getState().handPhase
      if (phase.phase === 'preflop-feedback') {
        expect(phase.result.isCorrect).toBe(false)
      }
    })

    it('sets canContinue true when correctAction is call and solutions exist', () => {
      const spot = makeResponseSpot({ correctAction: 'call' })
      useHandStore.getState().dealPreflop(spot, true)
      useHandStore.getState().startPreflopDecision()
      useHandStore.getState().submitPreflopAction('call')

      const phase = useHandStore.getState().handPhase
      if (phase.phase === 'preflop-feedback') {
        expect(phase.canContinue).toBe(true)
      }
    })

    it('sets canContinue false when correctAction is not call', () => {
      const spot = makeResponseSpot({ correctAction: 'raise' })
      useHandStore.getState().dealPreflop(spot, true)
      useHandStore.getState().startPreflopDecision()
      useHandStore.getState().submitPreflopAction('raise')

      const phase = useHandStore.getState().handPhase
      if (phase.phase === 'preflop-feedback') {
        expect(phase.canContinue).toBe(false)
      }
    })

    it('sets canContinue false when no matching solutions', () => {
      const spot = makeResponseSpot({ correctAction: 'call' })
      useHandStore.getState().dealPreflop(spot, false)
      useHandStore.getState().startPreflopDecision()
      useHandStore.getState().submitPreflopAction('call')

      const phase = useHandStore.getState().handPhase
      if (phase.phase === 'preflop-feedback') {
        expect(phase.canContinue).toBe(false)
      }
    })

    it('increments handsPlayed and preflopCorrect on correct answer', () => {
      const spot = makeResponseSpot({ correctAction: 'call' })
      useHandStore.getState().dealPreflop(spot, false)
      useHandStore.getState().startPreflopDecision()
      useHandStore.getState().submitPreflopAction('call')

      const stats = useHandStore.getState().sessionStats
      expect(stats.handsPlayed).toBe(1)
      expect(stats.preflopCorrect).toBe(1)
    })

    it('increments handsPlayed but not preflopCorrect on wrong answer', () => {
      const spot = makeResponseSpot({ correctAction: 'call' })
      useHandStore.getState().dealPreflop(spot, false)
      useHandStore.getState().startPreflopDecision()
      useHandStore.getState().submitPreflopAction('fold')

      const stats = useHandStore.getState().sessionStats
      expect(stats.handsPlayed).toBe(1)
      expect(stats.preflopCorrect).toBe(0)
    })

    it('does nothing if not in preflop-decision phase', () => {
      useHandStore.getState().submitPreflopAction('call')
      expect(useHandStore.getState().handPhase.phase).toBe('idle')
    })
  })

  describe('showHandSummary', () => {
    it('transitions from preflop-feedback to hand-summary (preflop only)', () => {
      const spot = makeResponseSpot({ correctAction: 'fold' })
      useHandStore.getState().dealPreflop(spot, false)
      useHandStore.getState().startPreflopDecision()
      useHandStore.getState().submitPreflopAction('fold')
      useHandStore.getState().showHandSummary()

      const phase = useHandStore.getState().handPhase
      expect(phase.phase).toBe('hand-summary')
      if (phase.phase === 'hand-summary') {
        expect(phase.preflopSpot.id).toBe(spot.id)
        expect(phase.preflopResult.isCorrect).toBe(true)
        expect(phase.continuation).toBeNull()
        expect(phase.postflopResult).toBeNull()
      }
    })
  })

  describe('nextHand', () => {
    it('resets to idle and clears hasContinuation', () => {
      const spot = makeResponseSpot()
      useHandStore.getState().dealPreflop(spot, true)
      useHandStore.getState().nextHand()

      expect(useHandStore.getState().handPhase.phase).toBe('idle')
      expect(useHandStore.getState().hasContinuation).toBe(false)
    })

    it('preserves session stats', () => {
      const spot = makeResponseSpot({ correctAction: 'call' })
      useHandStore.getState().dealPreflop(spot, false)
      useHandStore.getState().startPreflopDecision()
      useHandStore.getState().submitPreflopAction('call')
      useHandStore.getState().nextHand()

      expect(useHandStore.getState().sessionStats.handsPlayed).toBe(1)
    })
  })

  describe('resetSession', () => {
    it('resets phase and stats', () => {
      const spot = makeResponseSpot({ correctAction: 'call' })
      useHandStore.getState().dealPreflop(spot, true)
      useHandStore.getState().startPreflopDecision()
      useHandStore.getState().submitPreflopAction('call')
      useHandStore.getState().resetSession()

      expect(useHandStore.getState().handPhase.phase).toBe('idle')
      expect(useHandStore.getState().hasContinuation).toBe(false)
      expect(useHandStore.getState().sessionStats.handsPlayed).toBe(0)
    })
  })

  describe('session stats accumulation', () => {
    it('accumulates across multiple hands', () => {
      // Hand 1: correct
      const spot1 = makeResponseSpot({ id: 'h1', correctAction: 'call' })
      useHandStore.getState().dealPreflop(spot1, false)
      useHandStore.getState().startPreflopDecision()
      useHandStore.getState().submitPreflopAction('call')
      useHandStore.getState().nextHand()

      // Hand 2: incorrect
      const spot2 = makeResponseSpot({ id: 'h2', correctAction: 'raise' })
      useHandStore.getState().dealPreflop(spot2, false)
      useHandStore.getState().startPreflopDecision()
      useHandStore.getState().submitPreflopAction('fold')
      useHandStore.getState().nextHand()

      const stats = useHandStore.getState().sessionStats
      expect(stats.handsPlayed).toBe(2)
      expect(stats.preflopCorrect).toBe(1)
    })
  })
})
