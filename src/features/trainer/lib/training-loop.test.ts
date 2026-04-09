import { describe, expect, it } from 'vitest'

import { ACTIONS } from '@/types/poker'
import type { Action } from '@/types/poker'

import { loadProvider } from './range-loader'
import { generateSpot } from './spot-generator'
import type { Spot } from '@/features/trainer/types'
import type { SessionStats } from '@/features/trainer/types'

function simulateSession(
  spots: Spot[],
  chooseAction: (spot: Spot) => Action,
): SessionStats {
  let handsPlayed = 0
  let correctCount = 0
  let totalDecisionTimeMs = 0

  for (const spot of spots) {
    const userAction = chooseAction(spot)
    const isCorrect = userAction === spot.correctAction
    handsPlayed++
    if (isCorrect) correctCount++
    totalDecisionTimeMs += 500 // simulated 500ms per decision
  }

  return { handsPlayed, correctCount, totalDecisionTimeMs }
}

describe('training loop smoke test', () => {
  it('deals 20 spots and computes stats correctly (all correct)', async () => {
    const charts = await loadProvider('pekarstas')
    const spots: Spot[] = []

    for (let i = 0; i < 20; i++) {
      spots.push(generateSpot(charts, 'pekarstas'))
    }

    // Every spot has valid fields
    for (const spot of spots) {
      expect(spot.id).toBeTruthy()
      expect(spot.heroHand).toBeTruthy()
      expect(spot.rolledNumber).toBeGreaterThanOrEqual(1)
      expect(spot.rolledNumber).toBeLessThanOrEqual(100)
      expect(ACTIONS).toContain(spot.correctAction)
      expect(spot.provider).toBe('pekarstas')
    }

    // Answer all correctly
    const stats = simulateSession(spots, (spot) => spot.correctAction)
    expect(stats.handsPlayed).toBe(20)
    expect(stats.correctCount).toBe(20)
    expect(stats.totalDecisionTimeMs).toBe(10_000)
  })

  it('computes 50% accuracy when half are wrong', async () => {
    const charts = await loadProvider('pekarstas')
    const spots: Spot[] = []

    for (let i = 0; i < 20; i++) {
      spots.push(generateSpot(charts, 'pekarstas'))
    }

    let count = 0
    const stats = simulateSession(spots, (spot) => {
      count++
      // First 10 correct, last 10 wrong
      if (count <= 10) return spot.correctAction
      return spot.correctAction === 'fold' ? 'raise' : 'fold'
    })

    expect(stats.handsPlayed).toBe(20)
    expect(stats.correctCount).toBe(10)
  })

  it('deals spots from greenline provider without errors', async () => {
    const charts = await loadProvider('greenline')
    const spots: Spot[] = []

    for (let i = 0; i < 20; i++) {
      spots.push(generateSpot(charts, 'greenline'))
    }

    expect(spots).toHaveLength(20)
    for (const spot of spots) {
      expect(ACTIONS).toContain(spot.correctAction)
    }
  })
})
