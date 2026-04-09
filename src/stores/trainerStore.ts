import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { z } from 'zod/v4'
import { PROVIDERS } from '@/types/poker'
import type { Action, Provider } from '@/types/poker'

import type { SessionStats, Spot, SpotResult, TrainerPhase } from '@/features/trainer/types'

const trainerStateSchema = z.object({
  provider: z.enum(PROVIDERS),
})

interface TrainerState {
  // Persisted
  provider: Provider
  setProvider: (p: Provider) => void

  // Session-scoped (not persisted)
  trainerPhase: TrainerPhase
  sessionStats: SessionStats

  // Actions
  dealSpot: (spot: Spot) => void
  submitAction: (userAction: Action) => void
  nextSpot: () => void
  resetSession: () => void
}

const INITIAL_STATS: SessionStats = {
  handsPlayed: 0,
  correctCount: 0,
  totalDecisionTimeMs: 0,
}

export const useTrainerStore = create(
  persist<TrainerState>(
    (set, get) => ({
      provider: 'pekarstas' as Provider,
      setProvider: (provider) => set({ provider }),

      trainerPhase: { phase: 'idle' },
      sessionStats: { ...INITIAL_STATS },

      dealSpot: (spot: Spot) =>
        set({
          trainerPhase: { phase: 'active', spot, startedAt: Date.now() },
        }),

      submitAction: (userAction: Action) => {
        const { trainerPhase, sessionStats } = get()
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

        set({
          trainerPhase: { phase: 'feedback', spot, result },
          sessionStats: {
            handsPlayed: sessionStats.handsPlayed + 1,
            correctCount: sessionStats.correctCount + (isCorrect ? 1 : 0),
            totalDecisionTimeMs: sessionStats.totalDecisionTimeMs + decisionTimeMs,
          },
        })
      },

      nextSpot: () => set({ trainerPhase: { phase: 'idle' } }),

      resetSession: () =>
        set({
          trainerPhase: { phase: 'idle' },
          sessionStats: { ...INITIAL_STATS },
        }),
    }),
    {
      name: 'poker-trainer',
      partialize: (state) => ({
        provider: state.provider,
      }) as TrainerState,
      merge: (persisted, current) => {
        const result = trainerStateSchema.safeParse(persisted)
        if (result.success) {
          return { ...current, ...result.data }
        }
        console.warn('Invalid trainerStore state, using defaults')
        return current
      },
    },
  ),
)
