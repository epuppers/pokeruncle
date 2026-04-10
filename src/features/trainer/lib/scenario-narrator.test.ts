import { describe, it, expect } from 'vitest'
import { narrateScenario } from './scenario-narrator'
import type { Spot } from '@/features/trainer/types'

function makeOpenSpot(hero: 'UTG' | 'CO' | 'BTN' = 'CO'): Spot {
  return {
    kind: 'open',
    id: 'test',
    provider: 'pekarstas',
    hero,
    scenario: 'RFI',
    heroHand: 'AKs',
    heroCards: [
      { rank: 'A', suit: 's' },
      { rank: 'K', suit: 's' },
    ],
    cell: 'raise',
    rolledNumber: 50,
    correctAction: 'raise',
  }
}

function makeResponseSpot(): Spot {
  return {
    kind: 'response',
    id: 'test',
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
}

describe('narrateScenario', () => {
  it('narrates RFI with dollar amounts', () => {
    const narration = narrateScenario(makeOpenSpot())
    expect(narration.summary).toContain('Cutoff')
    expect(narration.potDescription).toContain('$3')
    expect(narration.costToPlay).toContain('$6')
  })

  it('narrates vs-open with villain name and amounts', () => {
    const narration = narrateScenario(makeResponseSpot())
    expect(narration.summary).toContain('Cutoff')
    expect(narration.summary).toContain('$6')
    expect(narration.costToPlay).toContain('call')
  })

  it('narrates push-fold with stack size', () => {
    const spot: Spot = {
      kind: 'push-fold',
      id: 'test',
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
    const narration = narrateScenario(spot)
    expect(narration.summary).toContain('$20')
    expect(narration.summary).toContain('short stack')
  })

  it('returns all three fields for every scenario type', () => {
    const narration = narrateScenario(makeOpenSpot())
    expect(narration.summary).toBeTruthy()
    expect(narration.potDescription).toBeTruthy()
    expect(narration.costToPlay).toBeTruthy()
  })
})
