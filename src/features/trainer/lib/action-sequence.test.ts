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

// The sequence always starts: dealer(1) + blinds(2) + deal(6) = 9 preamble steps
const PREAMBLE_LENGTH = 9

describe('buildActionSequence', () => {
  it('starts with dealer, then blinds, then deals cards', () => {
    const steps = buildActionSequence(makeSpot({ kind: 'open' }))
    expect(steps[0].style).toBe('dealer')
    expect(steps[0].position).toBe('BTN')
    expect(steps[1].style).toBe('blind')
    expect(steps[1].position).toBe('SB')
    expect(steps[2].style).toBe('blind')
    expect(steps[2].position).toBe('BB')
    // 6 deal steps (SB, BB, UTG, MP, CO, BTN)
    for (let i = 3; i < 9; i++) {
      expect(steps[i].style).toBe('deal')
    }
  })

  it('builds correct sequence for RFI from CO', () => {
    const steps = buildActionSequence(makeSpot({ kind: 'open', hero: 'CO' as const }))
    // preamble(9) + UTG folds + MP folds + CO hero = 12
    expect(steps).toHaveLength(PREAMBLE_LENGTH + 3)
    expect(steps[9].position).toBe('UTG')
    expect(steps[9].style).toBe('fold')
    expect(steps[10].position).toBe('MP')
    expect(steps[10].style).toBe('fold')
    expect(steps[11].position).toBe('CO')
    expect(steps[11].style).toBe('hero')
  })

  it('builds correct sequence for RFI from UTG (no folds before hero)', () => {
    const steps = buildActionSequence(makeSpot({ kind: 'open', hero: 'UTG' as const }))
    // preamble(9) + UTG hero = 10
    expect(steps).toHaveLength(PREAMBLE_LENGTH + 1)
    expect(steps[9].position).toBe('UTG')
    expect(steps[9].style).toBe('hero')
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
    // preamble(9) + UTG folds + MP folds + CO raises + BTN folds + SB folds + BB hero = 15
    expect(steps).toHaveLength(PREAMBLE_LENGTH + 6)
    const btnStep = steps.find((s) => s.position === 'BTN' && s.style === 'fold')
    expect(btnStep).toBeDefined()
  })

  it('shows dollar amounts in blind narratives', () => {
    const steps = buildActionSequence(makeSpot({ kind: 'open' }))
    expect(steps[1].narrative).toContain('$1')
    expect(steps[2].narrative).toContain('$2')
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
    // preamble(9) + UTG folds + MP folds + CO hero = 12
    expect(computeTotalSteps(spot)).toBe(12)
  })
})
