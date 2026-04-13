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
  /** Which training mode produced this result. Added in v4. */
  source?: 'trainer' | 'hand-flow' | 'postflop-trainer'
}

/** A cached postflop solution stored in IndexedDB. */
export interface CachedSolutionRecord {
  /** Primary key: deterministic hash of node + board + street. */
  solutionKey: string
  /** The preflop node key (e.g. 'BTN-open_BB-call'). */
  nodeKey: string
  /** Board as a compact string (e.g. 'Ah Kd 7c'). */
  boardString: string
  /** Which street this solution covers. */
  street: string
  /** Pot size in BB at the start of this street. */
  potSizeBB: number
  /** Effective stack in BB. */
  effectiveStackBB: number
  /** Strategy map: hand class → action frequencies (stored as JSON string). */
  strategiesJson: string
  /** Solver exploitability metric. */
  exploitability: number
  /** When this solution was generated (unix timestamp). */
  solvedAt: number
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
  cachedSolutions!: Table<CachedSolutionRecord>

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
    this.version(3).stores({
      spotResults: '++id, spotId, timestamp, isCorrect, provider, hero, scenario, [hero+scenario], heroHand',
      masteryRecords: 'spotTypeKey, nextReviewAt',
      cachedSolutions: 'solutionKey, nodeKey, street',
    })
    this.version(4).stores({
      spotResults: '++id, spotId, timestamp, isCorrect, provider, hero, scenario, [hero+scenario], heroHand',
      masteryRecords: 'spotTypeKey, nextReviewAt',
      cachedSolutions: 'solutionKey, nodeKey, street',
    })
  }
}

export const db = new PokerTrainerDB()
