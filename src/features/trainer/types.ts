import type { Action, Cell, HandType, Position, Provider, Scenario } from '@/types/poker'

export type { ProviderCharts } from './lib/range-loader'

// --- Spot: a single training instance ---

export type Spot =
  | {
      kind: 'open'
      id: string
      provider: Provider
      hero: Position
      scenario: 'RFI'
      heroHand: string
      cell: Cell
      rolledNumber: number
      correctAction: Action
    }
  | {
      kind: 'response'
      id: string
      provider: Provider
      hero: Position
      villain: Position
      scenario: 'vs-open' | 'vs-3bet' | 'vs-4bet' | '3bet-defense'
      heroHand: string
      cell: Cell
      rolledNumber: number
      correctAction: Action
    }

// --- SpotResult: what the user submitted ---

export interface SpotResult {
  spotId: string
  userAction: Action
  isCorrect: boolean
  decisionTimeMs: number
  timestamp: number
}

// --- Training loop phase (discriminated union) ---

export type TrainerPhase =
  | { phase: 'idle' }
  | { phase: 'active'; spot: Spot; startedAt: number }
  | { phase: 'feedback'; spot: Spot; result: SpotResult }

// --- Session statistics ---

export interface SessionStats {
  handsPlayed: number
  correctCount: number
  totalDecisionTimeMs: number
}

// --- Parsed chart key ---

export interface ParsedChartKey {
  hero: Position
  scenario: Scenario
  villain?: Position
}

// --- Spot filters ---

export interface SpotFilters {
  /** Empty = all positions. */
  positions: Position[]
  /** Empty = all scenarios. */
  scenarios: Scenario[]
  /** Empty = all hand types. */
  handTypes: HandType[]
}

// --- Trainer mode ---

export type TrainerMode =
  | { mode: 'practice' }
  | {
      mode: 'drill'
      scenario: Scenario
      hero: Position
      villain?: Position
      remaining: number
      total: number
    }
