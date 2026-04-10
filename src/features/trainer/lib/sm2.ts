import { normalizeCell } from '@/types/poker'

import type { MasteryRecord } from '@/lib/db'
import type { Action, Cell } from '@/types/poker'

const DEFAULT_STRICTNESS = 5
const MIN_EASE_FACTOR = 1.3
const INITIAL_EASE_FACTOR = 2.5
const PURE_STRATEGY_EV_LOSS = 0.5
const MS_PER_DAY = 86_400_000

/**
 * Convert EV loss (in big blinds) to an SM-2 quality score (0–5).
 * Uses exponential decay: Q = max(0, floor(5 * exp(-k * ΔEV)))
 */
export function evToQualityScore(evLoss: number, k: number = DEFAULT_STRICTNESS): number {
  return Math.max(0, Math.floor(5 * Math.exp(-k * evLoss)))
}

/**
 * Estimate the EV loss for choosing `userAction` when `correctAction` was correct.
 *
 * For pure-strategy cells (single action at 100%), any wrong answer is ~0.5bb heuristic.
 * For weighted cells, EV loss is proportional to the frequency gap between correct and chosen.
 */
export function estimateEvLoss(cell: Cell, userAction: Action, correctAction: Action): number {
  if (userAction === correctAction) return 0

  const { actions } = normalizeCell(cell)
  const actionEntries = Object.entries(actions).filter(([, freq]) => (freq ?? 0) > 0)

  // Pure strategy: single action with 100% frequency
  if (actionEntries.length <= 1) {
    return PURE_STRATEGY_EV_LOSS
  }

  // Mixed strategy: loss proportional to absolute frequency gap
  const correctFreq = actions[correctAction] ?? 0
  const userFreq = actions[userAction] ?? 0
  // Scale the absolute frequency gap (0-100) into a bb-range EV loss (0-1)
  return (Math.abs(correctFreq - userFreq) / 100) * 1.0
}

/**
 * Apply the SM-2 algorithm to update a mastery record after a review.
 * Returns a new record (does not mutate the input).
 */
export function updateMastery(record: MasteryRecord, qualityScore: number): MasteryRecord {
  const now = Date.now()
  const q = Math.max(0, Math.min(5, qualityScore))

  let { easeFactor, interval, repetitions } = record

  if (q < 3) {
    // Failed: reset repetitions, short interval. EF unchanged per standard SM-2.
    repetitions = 0
    interval = 1
  } else {
    // Passed: advance interval and update ease factor
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1

    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor)
  }

  return {
    spotTypeKey: record.spotTypeKey,
    easeFactor,
    interval,
    repetitions,
    nextReviewAt: now + interval * MS_PER_DAY,
    lastReviewedAt: now,
  }
}

/** Create a fresh mastery record for a spot type that hasn't been seen before. */
export function createInitialMastery(spotTypeKey: string): MasteryRecord {
  return {
    spotTypeKey,
    easeFactor: INITIAL_EASE_FACTOR,
    interval: 1,
    repetitions: 0,
    nextReviewAt: Date.now(),
    lastReviewedAt: 0,
  }
}
