import type { Action, Card, Cell, HandType, Position, Provider, Scenario } from '@/types/poker'

export type { ProviderCharts } from './lib/range-loader'

// --- Tournament push/fold types ---

export const STACK_DEPTHS = [5, 8, 10, 13, 15, 20, 25] as const
export type StackDepth = (typeof STACK_DEPTHS)[number]

export const TOURNAMENT_SCENARIOS = ['push', 'vs-push'] as const
export type TournamentScenario = (typeof TOURNAMENT_SCENARIOS)[number]

export interface TournamentScenarioConfig {
  id: TournamentScenario
  label: string
  description: string
}

export const TOURNAMENT_SCENARIO_CONFIGS: TournamentScenarioConfig[] = [
  { id: 'push', label: 'Push', description: 'Push or fold' },
  { id: 'vs-push', label: 'vs Push', description: 'Facing an all-in push' },
]

// --- Spot: a single training instance ---

export type Spot =
  | {
      kind: 'open'
      id: string
      provider: Provider
      hero: Position
      scenario: 'RFI'
      heroHand: string
      heroCards: [Card, Card]
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
      heroCards: [Card, Card]
      cell: Cell
      rolledNumber: number
      correctAction: Action
    }
  | {
      kind: 'push-fold'
      id: string
      provider: 'nash-pushfold'
      hero: Position
      scenario: TournamentScenario
      villain?: Position
      heroHand: string
      heroCards: [Card, Card]
      cell: Cell
      rolledNumber: number
      correctAction: Action
      stackDepth: StackDepth
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
  | { phase: 'dealing'; spot: Spot; stepIndex: number; totalSteps: number }
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

export interface ParsedTournamentChartKey {
  hero: Position
  scenario: TournamentScenario
  stackDepth: StackDepth
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
  /** Empty = all stack depths. Only relevant for nash-pushfold provider. */
  stackDepths: StackDepth[]
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
  | {
      mode: 'push-fold-drill'
      scenario: TournamentScenario
      hero: Position
      villain?: Position
      stackDepth: StackDepth
      remaining: number
      total: number
    }
