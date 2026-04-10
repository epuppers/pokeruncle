import type { Card, Position } from '@/types/poker'
import type { PotType, VillainRangeNode } from '@/data/villain-ranges/types'

// --- Postflop streets ---

export const POSTFLOP_STREETS = ['flop', 'turn', 'river'] as const
export type PostflopStreet = (typeof POSTFLOP_STREETS)[number]

// --- Postflop actions ---
// Richer than preflop: check, multiple bet sizes, call, raise, fold, allin

export const POSTFLOP_ACTIONS = [
  'check',
  'bet-small',
  'bet-medium',
  'bet-large',
  'call',
  'raise',
  'fold',
  'allin',
] as const
export type PostflopAction = (typeof POSTFLOP_ACTIONS)[number]

/** Human-readable labels for postflop actions */
export const POSTFLOP_ACTION_LABELS: Record<PostflopAction, string> = {
  'check': 'Check',
  'bet-small': 'Bet Small (33%)',
  'bet-medium': 'Bet Medium (66%)',
  'bet-large': 'Bet Large (100%+)',
  'call': 'Call',
  'raise': 'Raise',
  'fold': 'Fold',
  'allin': 'All-In',
}

/** Bet size as percentage of pot for each bet action */
export const BET_SIZING_PCT: Partial<Record<PostflopAction, number>> = {
  'bet-small': 33,
  'bet-medium': 66,
  'bet-large': 100,
}

// --- Action distribution ---

export type PostflopActionWeights = Partial<Record<PostflopAction, number>>

// --- Board texture bitmask ---

export const TEXTURE_MONOTONE = 0b0000_0000_0001
export const TEXTURE_TWO_TONE = 0b0000_0000_0010
export const TEXTURE_RAINBOW = 0b0000_0000_0100
export const TEXTURE_PAIRED = 0b0000_0000_1000
export const TEXTURE_TRIPS = 0b0000_0001_0000
export const TEXTURE_CONNECTED = 0b0000_0010_0000
export const TEXTURE_HIGH = 0b0000_0100_0000
export const TEXTURE_LOW = 0b0000_1000_0000
export const TEXTURE_STRAIGHT_POSSIBLE = 0b0001_0000_0000
export const TEXTURE_FLUSH_DRAW = 0b0010_0000_0000

/** Bitmask encoding board texture properties */
export type BoardTextureMask = number

// --- Postflop spot ---

export type PostflopBoard =
  | readonly [Card, Card, Card]
  | readonly [Card, Card, Card, Card]
  | readonly [Card, Card, Card, Card, Card]

/**
 * A postflop training spot — a single decision point on a given street.
 *
 * Unlike preflop spots which use the upstream Chart/Cell system, postflop
 * spots reference pre-solved strategy data with richer action distributions.
 */
export interface PostflopSpot {
  kind: 'postflop'
  id: string
  /** Which street the decision is on */
  street: PostflopStreet
  /** Community cards (3 for flop, 4 for turn, 5 for river) */
  board: PostflopBoard
  /** Hero's two hole cards */
  heroCards: readonly [Card, Card]
  /** Hero hand class (e.g. 'AKs') */
  heroHand: string
  /** Hero's position */
  hero: Position
  /** Villain's position */
  villain: Position
  /** Whether hero is in position (acts last) */
  heroIsIP: boolean
  /** The preflop action node that led to this spot */
  preflopNode: VillainRangeNode
  /** Pot type from preflop action */
  potType: PotType
  /** Current pot size in big blinds */
  potSizeBB: number
  /** Effective stack remaining in big blinds */
  effectiveStackBB: number
  /** Board texture bitmask */
  boardTexture: BoardTextureMask
  /** The solver's full strategy at this decision point */
  correctStrategy: PostflopActionWeights
  /** RNG roll 1–100 for mixed-strategy resolution */
  rolledNumber: number
  /** The correct action based on the rolled number */
  correctAction: PostflopAction
  /** Key to look up the full solution in the cache */
  solutionKey: string
}

// --- Spot result ---

export interface PostflopSpotResult {
  spotId: string
  userAction: PostflopAction
  isCorrect: boolean
  /** How far off the user's action frequency was from optimal (0–1) */
  frequencyDeviation: number
  decisionTimeMs: number
  timestamp: number
}

// --- Cached solution ---

/**
 * A pre-solved postflop solution stored in IndexedDB or loaded from build assets.
 * Contains the solver's strategy for every hand in hero's range at a specific
 * decision point (node + board combination).
 */
export interface CachedSolution {
  /** Primary key: deterministic hash of node + board + street */
  solutionKey: string
  /** The preflop node key (e.g. 'BTN-open_BB-call') */
  nodeKey: string
  /** Board as a compact string (e.g. 'Ah Kd 7c') */
  boardString: string
  /** Which street this solution covers */
  street: PostflopStreet
  /** Pot size in BB at the start of this street */
  potSizeBB: number
  /** Effective stack in BB */
  effectiveStackBB: number
  /**
   * Strategy map: hand class → action frequencies.
   * e.g. { 'AKs': { check: 40, 'bet-medium': 60 }, 'T9o': { check: 100 } }
   */
  strategies: Record<string, PostflopActionWeights>
  /** Solver exploitability metric (lower = more accurate) */
  exploitability: number
  /** When this solution was generated */
  solvedAt: number
}

// --- Postflop trainer state machine ---

export type PostflopTrainerPhase =
  | { phase: 'idle' }
  | { phase: 'dealing'; spot: PostflopSpot; stepIndex: number; totalSteps: number }
  | { phase: 'street-decision'; spot: PostflopSpot; startedAt: number }
  | { phase: 'feedback'; spot: PostflopSpot; result: PostflopSpotResult }

// --- Session stats (mirrors preflop) ---

export interface PostflopSessionStats {
  handsPlayed: number
  correctCount: number
  totalDecisionTimeMs: number
}
