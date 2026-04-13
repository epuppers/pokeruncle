import { db } from '@/lib/db'
import type { MasteryRecord, SpotResultRecord } from '@/lib/db'

import {
  createInitialMastery,
  evToQualityScore,
  updateMastery,
} from '@/features/trainer/lib/sm2'

import type { PostflopAction, PostflopSpot } from '../types'

/** EV loss heuristic: frequency deviation scaled to bb */
function estimatePostflopEvLoss(
  spot: PostflopSpot,
  userAction: PostflopAction,
): number {
  if (userAction === spot.correctAction) return 0

  const correctFreq = spot.correctStrategy[spot.correctAction] ?? 0
  const userFreq = spot.correctStrategy[userAction] ?? 0

  // Scale frequency gap to a bb-range loss.
  // Postflop mistakes are typically more expensive than preflop,
  // so we use a higher multiplier (pot-relative).
  const freqGap = Math.abs(correctFreq - userFreq) / 100
  const potMultiplier = spot.potSizeBB / 6.5 // normalize to a standard 6.5bb pot

  return freqGap * potMultiplier * 0.5
}

/**
 * Build a spot type key for postflop mastery tracking.
 * Format: postflop:{nodeKey}:{street}:{heroHand}
 */
function buildPostflopSpotTypeKey(spot: PostflopSpot): string {
  return `postflop:${spot.solutionKey}:${spot.heroHand}`
}

/**
 * Record a completed postflop spot result to IndexedDB and update mastery.
 * Fire-and-forget — caller should catch errors.
 */
export async function recordPostflopSpotResult(
  spot: PostflopSpot,
  userAction: PostflopAction,
  decisionTimeMs: number,
  strictness: number = 5,
  source?: SpotResultRecord['source'],
): Promise<void> {
  const evLoss = estimatePostflopEvLoss(spot, userAction)
  const qualityScore = evToQualityScore(evLoss, strictness)
  const spotTypeKey = buildPostflopSpotTypeKey(spot)

  // Write to the same spotResults table as preflop
  await db.spotResults.add({
    spotId: spot.id,
    userAction,
    isCorrect: userAction === spot.correctAction,
    evLossEstimate: evLoss,
    qualityScore,
    timestamp: Date.now(),
    decisionTimeMs,
    provider: 'postflop-cache',
    hero: spot.hero,
    villain: spot.villain,
    scenario: spot.street,
    heroHand: spot.heroHand,
    rolledNumber: spot.rolledNumber,
    correctAction: spot.correctAction,
    source,
  })

  // Update SM-2 mastery
  const existing = await db.masteryRecords.get(spotTypeKey)
  const record: MasteryRecord = existing ?? createInitialMastery(spotTypeKey)
  const updated = updateMastery(record, qualityScore)
  await db.masteryRecords.put(updated)
}
