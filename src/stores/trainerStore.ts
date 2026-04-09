import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { z } from 'zod/v4'
import { POSITIONS, PROVIDERS } from '@/types/poker'
import type { Action, Position, Provider, Scenario } from '@/types/poker'

import { recordSpotResult } from '@/features/trainer/lib/mastery-persistence'
import { STACK_DEPTHS } from '@/features/trainer/types'
import type {
  SessionStats,
  Spot,
  SpotFilters,
  SpotResult,
  StackDepth,
  TournamentScenario,
  TrainerMode,
  TrainerPhase,
} from '@/features/trainer/types'

const SCENARIOS = ['RFI', 'vs-open', 'vs-3bet', 'vs-4bet', '3bet-defense'] as const
const HAND_TYPES = ['pair', 'suited', 'offsuit'] as const

const trainerStateSchema = z.object({
  provider: z.enum(PROVIDERS),
  filters: z.object({
    positions: z.array(z.enum(POSITIONS)),
    scenarios: z.array(z.enum(SCENARIOS)),
    handTypes: z.array(z.enum(HAND_TYPES)),
    stackDepths: z.array(z.number()).optional(),
  }),
})

interface TrainerState {
  // Persisted
  provider: Provider
  filters: SpotFilters
  setProvider: (p: Provider) => void
  setFilters: (f: SpotFilters) => void

  // Session-scoped (not persisted)
  trainerPhase: TrainerPhase
  trainerMode: TrainerMode
  sessionStats: SessionStats

  // Actions
  dealSpot: (spot: Spot) => void
  submitAction: (userAction: Action) => void
  nextSpot: () => void
  resetSession: () => void
  startDrill: (scenario: Scenario, hero: Position, total: number, villain?: Position) => void
  startPushFoldDrill: (
    scenario: TournamentScenario,
    hero: Position,
    total: number,
    stackDepth: StackDepth,
    villain?: Position,
  ) => void
  endDrill: () => void
}

const INITIAL_STATS: SessionStats = {
  handsPlayed: 0,
  correctCount: 0,
  totalDecisionTimeMs: 0,
}

const INITIAL_FILTERS: SpotFilters = {
  positions: [],
  scenarios: [],
  handTypes: [],
  stackDepths: [],
}

export const useTrainerStore = create(
  persist<TrainerState>(
    (set, get) => ({
      provider: 'pekarstas' as Provider,
      filters: { ...INITIAL_FILTERS },
      setProvider: (provider) => set({ provider }),
      setFilters: (filters) => set({ filters }),

      trainerPhase: { phase: 'idle' },
      trainerMode: { mode: 'practice' },
      sessionStats: { ...INITIAL_STATS },

      dealSpot: (spot: Spot) =>
        set({
          trainerPhase: { phase: 'active', spot, startedAt: Date.now() },
        }),

      submitAction: (userAction: Action) => {
        const { trainerPhase, trainerMode, sessionStats } = get()
        if (trainerPhase.phase !== 'active') return

        const { spot, startedAt } = trainerPhase
        const isCorrect = userAction === spot.correctAction
        const decisionTimeMs = Date.now() - startedAt

        const result: SpotResult = {
          spotId: spot.id,
          userAction,
          isCorrect,
          decisionTimeMs,
          timestamp: Date.now(),
        }

        // Fire-and-forget DB persistence
        recordSpotResult(spot, userAction, decisionTimeMs).catch((err: unknown) => {
          console.error('Failed to persist spot result', err)
        })

        // Decrement drill counter if in drill mode
        let nextMode: TrainerMode = trainerMode
        if (trainerMode.mode === 'drill') {
          nextMode = { ...trainerMode, remaining: trainerMode.remaining - 1 }
        } else if (trainerMode.mode === 'push-fold-drill') {
          nextMode = { ...trainerMode, remaining: trainerMode.remaining - 1 }
        }

        set({
          trainerPhase: { phase: 'feedback', spot, result },
          trainerMode: nextMode,
          sessionStats: {
            handsPlayed: sessionStats.handsPlayed + 1,
            correctCount: sessionStats.correctCount + (isCorrect ? 1 : 0),
            totalDecisionTimeMs: sessionStats.totalDecisionTimeMs + decisionTimeMs,
          },
        })
      },

      nextSpot: () => {
        const { trainerMode } = get()
        // End drill if no spots remaining
        if (
          (trainerMode.mode === 'drill' || trainerMode.mode === 'push-fold-drill') &&
          trainerMode.remaining <= 0
        ) {
          set({ trainerPhase: { phase: 'idle' }, trainerMode: { mode: 'practice' } })
          return
        }
        set({ trainerPhase: { phase: 'idle' } })
      },

      resetSession: () =>
        set({
          trainerPhase: { phase: 'idle' },
          trainerMode: { mode: 'practice' },
          sessionStats: { ...INITIAL_STATS },
        }),

      startDrill: (scenario, hero, total, villain) =>
        set({
          trainerPhase: { phase: 'idle' },
          trainerMode: { mode: 'drill', scenario, hero, villain, remaining: total, total },
          sessionStats: { ...INITIAL_STATS },
        }),

      startPushFoldDrill: (scenario, hero, total, stackDepth, villain) =>
        set({
          trainerPhase: { phase: 'idle' },
          trainerMode: {
            mode: 'push-fold-drill',
            scenario,
            hero,
            villain,
            stackDepth,
            remaining: total,
            total,
          },
          sessionStats: { ...INITIAL_STATS },
        }),

      endDrill: () =>
        set({
          trainerPhase: { phase: 'idle' },
          trainerMode: { mode: 'practice' },
        }),
    }),
    {
      name: 'poker-trainer',
      partialize: (state) => ({
        provider: state.provider,
        filters: state.filters,
      }) as TrainerState,
      merge: (persisted, current) => {
        const result = trainerStateSchema.safeParse(persisted)
        if (result.success) {
          const data = result.data
          return {
            ...current,
            provider: data.provider,
            filters: {
              positions: data.filters.positions,
              scenarios: data.filters.scenarios,
              handTypes: data.filters.handTypes,
              stackDepths: (data.filters.stackDepths ?? []).filter((d): d is StackDepth =>
                STACK_DEPTHS.includes(d as StackDepth),
              ),
            },
          }
        }
        console.warn('Invalid trainerStore state, using defaults')
        return current
      },
    },
  ),
)
