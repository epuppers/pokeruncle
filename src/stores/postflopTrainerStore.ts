import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { useSettingsStore } from '@/stores/settingsStore'
import { recordPostflopSpotResult } from '@/features/postflop/lib/postflop-persistence'

import type {
  PostflopAction,
  PostflopSessionStats,
  PostflopSpot,
  PostflopSpotResult,
  PostflopTrainerPhase,
} from '@/features/postflop/types'

interface PostflopTrainerState {
  // Persisted
  nodeKeyFilter: string | null
  setNodeKeyFilter: (key: string | null) => void

  // Session-scoped
  trainerPhase: PostflopTrainerPhase
  sessionStats: PostflopSessionStats

  // Actions
  dealSpot: (spot: PostflopSpot) => void
  submitAction: (userAction: PostflopAction) => void
  nextSpot: () => void
  resetSession: () => void
}

const INITIAL_STATS: PostflopSessionStats = {
  handsPlayed: 0,
  correctCount: 0,
  totalDecisionTimeMs: 0,
}

export const usePostflopTrainerStore = create(
  persist<PostflopTrainerState>(
    (set, get) => ({
      nodeKeyFilter: null,
      setNodeKeyFilter: (key) => set({ nodeKeyFilter: key }),

      trainerPhase: { phase: 'idle' },
      sessionStats: { ...INITIAL_STATS },

      dealSpot: (spot: PostflopSpot) => {
        set({
          trainerPhase: {
            phase: 'street-decision',
            spot,
            startedAt: Date.now(),
          },
        })
      },

      submitAction: (userAction: PostflopAction) => {
        const { trainerPhase, sessionStats } = get()
        if (trainerPhase.phase !== 'street-decision') return

        const { spot, startedAt } = trainerPhase
        const isCorrect = userAction === spot.correctAction
        const decisionTimeMs = Date.now() - startedAt

        // Compute frequency deviation: how far off was the user's action?
        const correctFreq = spot.correctStrategy[spot.correctAction] ?? 0
        const userFreq = spot.correctStrategy[userAction] ?? 0
        const frequencyDeviation = Math.abs(correctFreq - userFreq) / 100

        const result: PostflopSpotResult = {
          spotId: spot.id,
          userAction,
          isCorrect,
          frequencyDeviation,
          decisionTimeMs,
          timestamp: Date.now(),
        }

        // Fire-and-forget DB persistence
        const { trainingStrictness } = useSettingsStore.getState()
        recordPostflopSpotResult(spot, userAction, decisionTimeMs, trainingStrictness).catch(
          (err: unknown) => {
            console.error('Failed to persist postflop spot result', err)
          },
        )

        set({
          trainerPhase: { phase: 'feedback', spot, result },
          sessionStats: {
            handsPlayed: sessionStats.handsPlayed + 1,
            correctCount: sessionStats.correctCount + (isCorrect ? 1 : 0),
            totalDecisionTimeMs: sessionStats.totalDecisionTimeMs + decisionTimeMs,
          },
        })
      },

      nextSpot: () => {
        set({ trainerPhase: { phase: 'idle' } })
      },

      resetSession: () =>
        set({
          trainerPhase: { phase: 'idle' },
          sessionStats: { ...INITIAL_STATS },
        }),
    }),
    {
      name: 'postflop-trainer',
      partialize: (state) => ({
        nodeKeyFilter: state.nodeKeyFilter,
      }) as PostflopTrainerState,
      merge: (persisted, current) => {
        if (
          typeof persisted === 'object' &&
          persisted !== null &&
          'nodeKeyFilter' in persisted
        ) {
          const p = persisted as { nodeKeyFilter: unknown }
          return {
            ...current,
            nodeKeyFilter: typeof p.nodeKeyFilter === 'string' ? p.nodeKeyFilter : null,
          }
        }
        return current
      },
    },
  ),
)
