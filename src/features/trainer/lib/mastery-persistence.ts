import { db } from '@/lib/db'
import type { Action, Provider } from '@/types/poker'

import type { Spot } from '@/features/trainer/types'

import { createInitialMastery, estimateEvLoss, evToQualityScore, updateMastery } from './sm2'
import { buildSpotTypeKeyFromSpot } from './spot-type-key'

import type { MasteryRecord } from '@/lib/db'

/**
 * Record a completed spot result to IndexedDB and update the mastery record.
 * This is the single entry point for persistence after each training answer.
 */
export async function recordSpotResult(
  spot: Spot,
  userAction: Action,
  decisionTimeMs: number,
): Promise<void> {
  const evLoss = estimateEvLoss(spot.cell, userAction, spot.correctAction)
  const qualityScore = evToQualityScore(evLoss)
  const spotTypeKey = buildSpotTypeKeyFromSpot(spot)

  await db.spotResults.add({
    spotId: spot.id,
    userAction,
    isCorrect: userAction === spot.correctAction,
    evLossEstimate: evLoss,
    qualityScore,
    timestamp: Date.now(),
    decisionTimeMs,
  })

  await updateSpotMastery(spotTypeKey, qualityScore)
}

/**
 * Read the existing mastery record (or create a fresh one), apply SM-2 update, and write back.
 */
async function updateSpotMastery(spotTypeKey: string, qualityScore: number): Promise<void> {
  const existing = await db.masteryRecords.get(spotTypeKey)
  const record = existing ?? createInitialMastery(spotTypeKey)
  const updated = updateMastery(record, qualityScore)
  await db.masteryRecords.put(updated)
}

/** Get all mastery records for a given provider (prefix query on spotTypeKey). */
export async function getMasteryRecordsForProvider(provider: Provider): Promise<MasteryRecord[]> {
  return db.masteryRecords.where('spotTypeKey').startsWith(`${provider}:`).toArray()
}

/** Get a single mastery record by its spot type key. */
export async function getMasteryRecord(spotTypeKey: string): Promise<MasteryRecord | undefined> {
  return db.masteryRecords.get(spotTypeKey)
}
