import Dexie from 'dexie'

import type { Table } from 'dexie'

/** A recorded training spot result, persisted to IndexedDB. */
export interface SpotResultRecord {
  /** Auto-incremented primary key. */
  id?: number
  /** Reference to the Spot that was trained. */
  spotId: string
  /** The action the user chose. */
  userAction: string
  /** Whether the user's action matched the correct action. */
  isCorrect: boolean
  /** Estimated EV loss in big blinds (0 if correct). */
  evLossEstimate: number
  /** SM-2 quality score (0–5). */
  qualityScore: number
  /** Unix timestamp of when the spot was answered. */
  timestamp: number
  /** Milliseconds the user took to decide. */
  decisionTimeMs: number
  /** Range provider (e.g. 'pekarstas'). Added in v2. */
  provider: string
  /** Hero position. Added in v2. */
  hero: string
  /** Villain position, or null for RFI spots. Added in v2. */
  villain: string | null
  /** Scenario type. Added in v2. */
  scenario: string
  /** Hero hand class (e.g. 'AKs'). Added in v2. */
  heroHand: string
  /** RNG roll 1–100 for mixed strategy resolution. Added in v2. */
  rolledNumber: number
  /** The GTO-correct action for this spot. Added in v2. */
  correctAction: string
}

/** Per-spot-type mastery state for spaced repetition (SM-2). */
export interface MasteryRecord {
  /** Primary key: hash of (provider, hero, scenario, villain, hand_class). */
  spotTypeKey: string
  /** SM-2 ease factor. */
  easeFactor: number
  /** Review interval in days. */
  interval: number
  /** SM-2 repetition count. */
  repetitions: number
  /** Unix timestamp of when the next review is due. */
  nextReviewAt: number
  /** Unix timestamp of the last review. */
  lastReviewedAt: number
}

export class PokerTrainerDB extends Dexie {
  spotResults!: Table<SpotResultRecord>
  masteryRecords!: Table<MasteryRecord>

  constructor() {
    super('uncles-table')
    this.version(1).stores({
      spotResults: '++id, spotId, timestamp, isCorrect',
      masteryRecords: 'spotTypeKey, nextReviewAt',
    })
    this.version(2).stores({
      spotResults: '++id, spotId, timestamp, isCorrect, provider, hero, scenario, [hero+scenario], heroHand',
      masteryRecords: 'spotTypeKey, nextReviewAt',
    })
  }
}

export const db = new PokerTrainerDB()
