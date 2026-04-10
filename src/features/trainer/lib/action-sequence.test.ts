import { describe, it, expect } from 'vitest'
import { buildActionSequence, computeTotalSteps } from './action-sequence'
import type { Spot } from '@/features/trainer/types'

// Helper to create a minimal spot for testing
function makeSpot(overrides: Partial<Spot> & Pick<Spot, 'kind'>): Spot {
  const { kind, ...rest } = overrides
  const base = {
    id: 'test-1',
    provider: 'pekarstas' as const,
    heroHand: 'AKs',
    heroCards: [
      { rank: 'A' as const, suit: 's' as const },
      { rank: 'K' as const, suit: 's' as const },
    ] as [{ rank: 'A'; suit: 's' }, { rank: 'K'; suit: 's' }],
    cell: 'raise' as const,
    rolledNumber: 50,
    correctAction: 'raise' as const,
  }

  if (kind === 'open') {
    return {
      ...base,
      hero: 'CO',
      scenario: 'RFI',
      ...rest,
      kind: 'open',
    } as Spot
  }

  if (kind === 'response') {
    return {
      ...base,
      hero: 'BB',
      villain: 'CO',
      scenario: 'vs-open',
      ...rest,
      kind: 'response',
    } as Spot
  }

  return {
    ...base,
    provider: 'nash-pushfold',
    hero: 'BTN',
    scenario: 'push',
    stackDepth: 10,
    ...rest,
    kind: 'push-fold',
  } as Spot
}

describe('buildActionSequence', () => {
  it('starts with SB and BB blinds for every spot', () => {
    const steps = buildActionSequence(makeSpot({ kind: 'open' }))
    expect(steps[0].position).toBe('SB')
    expect(steps[0].style).toBe('blind')
    expect(steps[0].label).toBe('$1')
    expect(steps[1].position).toBe('BB')
    expect(steps[1].style).toBe('blind')
    expect(steps[1].label).toBe('$2')
  })

  it('builds correct sequence for RFI from CO', () => {
    const steps = buildActionSequence(makeSpot({ kind: 'open', hero: 'CO' as const }))
    // SB, BB, UTG folds, MP folds, CO hero
    expect(steps).toHaveLength(5)
    expect(steps[2].position).toBe('UTG')
    expect(steps[2].style).toBe('fold')
    expect(steps[3].position).toBe('MP')
    expect(steps[3].style).toBe('fold')
    expect(steps[4].position).toBe('CO')
    expect(steps[4].style).toBe('hero')
  })

  it('builds correct sequence for RFI from UTG (no folds before hero)', () => {
    const steps = buildActionSequence(makeSpot({ kind: 'open', hero: 'UTG' as const }))
    // SB, BB, UTG hero — no folds
    expect(steps).toHaveLength(3)
    expect(steps[2].position).toBe('UTG')
    expect(steps[2].style).toBe('hero')
  })

  it('includes villain raise for vs-open', () => {
    const spot = makeSpot({
      kind: 'response',
      hero: 'BB' as const,
      villain: 'CO' as const,
      scenario: 'vs-open',
    })
    const steps = buildActionSequence(spot)
    const villainStep = steps.find((s) => s.position === 'CO' && s.style === 'raise')
    expect(villainStep).toBeDefined()
    expect(villainStep?.label).toContain('raises to $6')
  })

  it('includes intermediate folds between villain and hero for vs-open', () => {
    const spot = makeSpot({
      kind: 'response',
      hero: 'BB' as const,
      villain: 'CO' as const,
      scenario: 'vs-open',
    })
    const steps = buildActionSequence(spot)
    // SB blind, BB blind, UTG folds, MP folds, CO raises, BTN folds, SB folds, BB hero
    expect(steps).toHaveLength(8)
    const positions = steps.map((s) => s.position)
    expect(positions).toContain('BTN')
    expect(positions).toContain('SB')
    // BTN and SB should fold after CO raises
    const btnStep = steps.find((s) => s.position === 'BTN' && s.style === 'fold')
    expect(btnStep).toBeDefined()
  })

  it('shows dollar amounts in narratives', () => {
    const steps = buildActionSequence(makeSpot({ kind: 'open' }))
    expect(steps[0].narrative).toContain('$1')
    expect(steps[1].narrative).toContain('$2')
  })

  it('ends with hero turn for all spot types', () => {
    const openSteps = buildActionSequence(makeSpot({ kind: 'open' }))
    const responseSteps = buildActionSequence(
      makeSpot({ kind: 'response', scenario: 'vs-open' }),
    )
    const pushSteps = buildActionSequence(makeSpot({ kind: 'push-fold', scenario: 'push' }))

    expect(openSteps[openSteps.length - 1].style).toBe('hero')
    expect(responseSteps[responseSteps.length - 1].style).toBe('hero')
    expect(pushSteps[pushSteps.length - 1].style).toBe('hero')
  })
})

describe('computeTotalSteps', () => {
  it('returns the length of the action sequence', () => {
    const spot = makeSpot({ kind: 'open', hero: 'CO' as const })
    expect(computeTotalSteps(spot)).toBe(5)
  })
})
