import { create } from 'zustand'

import type { Action } from '@/types/poker'

import {
  generatePostflopSpot,
  getSolution,
  loadManifest,
  pickRandomEntry,
  recordPostflopSpotResult,
} from '@/features/postflop'
import type { PostflopAction, PostflopSpotResult } from '@/features/postflop'

import {
  findMatchingSolutions,
  generatePostflopSpotForHand,
} from '@/features/trainer/lib/hand-bridge'
import { recordSpotResult } from '@/features/trainer/lib/mastery-persistence'
import { useSettingsStore } from '@/stores/settingsStore'

import type { HandContinuation, Spot, SpotResult } from '@/features/trainer/types'

// ─── Phase model (discriminated union) ──────────────────────

export type HandPhase =
  | { phase: 'idle' }
  | { phase: 'preflop-dealing'; spot: Spot }
  | { phase: 'preflop-decision'; spot: Spot; startedAt: number }
  | { phase: 'preflop-correction'; spot: Spot; result: SpotResult; canContinue: boolean }
  | { phase: 'flop-dealing'; continuation: HandContinuation }
  | { phase: 'flop-decision'; continuation: HandContinuation; startedAt: number }
  | { phase: 'flop-correction'; continuation: HandContinuation; result: PostflopSpotResult }

// ─── Session stats ──────────────────────────────────────────

export interface HandSessionStats {
  handsPlayed: number
  preflopCorrect: number
  postflopCorrect: number
  postflopHands: number
  totalDecisionTimeMs: number
  sessionStartedAt: number
}

const INITIAL_STATS: HandSessionStats = {
  handsPlayed: 0,
  preflopCorrect: 0,
  postflopCorrect: 0,
  postflopHands: 0,
  totalDecisionTimeMs: 0,
  sessionStartedAt: Date.now(),
}

// ─── Store interface ────────────────────────────────────────

interface HandState {
  handPhase: HandPhase
  sessionStats: HandSessionStats

  /** Whether the current spot has matching postflop solutions in the manifest */
  hasContinuation: boolean

  // Actions
  dealPreflop: (spot: Spot, hasContinuation: boolean) => void
  startPreflopDecision: () => void
  submitPreflopAction: (userAction: Action) => void
  startFlopDecision: () => void
  submitFlopAction: (userAction: PostflopAction) => void
  acknowledgeCorrection: () => void
  nextHand: () => void
  resetSession: () => void
}

// ─── Continuation helper ────────────────────────────────────

async function loadContinuation(
  spot: Spot,
  preflopResult: SpotResult,
  set: (partial: Partial<HandState>) => void,
): Promise<void> {
  if (spot.kind !== 'response') return

  const manifest = await loadManifest()
  const matchingSolutions = findMatchingSolutions(spot, manifest)
  if (matchingSolutions.length === 0) return

  const entry = pickRandomEntry(matchingSolutions)
  const solution = await getSolution(entry.solutionKey)
  if (!solution) return

  const postflopSpot = generatePostflopSpotForHand(solution, spot, spot.heroCards)
  if (!postflopSpot) {
    const fallbackSpot = generatePostflopSpot(solution)
    const continuation: HandContinuation = {
      preflopSpot: spot,
      preflopResult,
      postflopNodeKey: entry.nodeKey,
      postflopSpot: fallbackSpot,
    }
    set({ handPhase: { phase: 'flop-dealing', continuation } })
    return
  }

  const continuation: HandContinuation = {
    preflopSpot: spot,
    preflopResult,
    postflopNodeKey: entry.nodeKey,
    postflopSpot,
  }
  set({ handPhase: { phase: 'flop-dealing', continuation } })
}

// ─── Store ──────────────────────────────────────────────────

export const useHandStore = create<HandState>()((set, get) => ({
  handPhase: { phase: 'idle' },
  sessionStats: { ...INITIAL_STATS },
  hasContinuation: false,

  dealPreflop: (spot: Spot, hasContinuation: boolean) => {
    set({
      handPhase: { phase: 'preflop-dealing', spot },
      hasContinuation,
    })
  },

  startPreflopDecision: () => {
    const { handPhase } = get()
    if (handPhase.phase !== 'preflop-dealing') return
    set({
      handPhase: {
        phase: 'preflop-decision',
        spot: handPhase.spot,
        startedAt: Date.now(),
      },
    })
  },

  submitPreflopAction: (userAction: Action) => {
    const { handPhase, sessionStats, hasContinuation } = get()
    if (handPhase.phase !== 'preflop-decision') return

    const { spot, startedAt } = handPhase
    const isCorrect = userAction === spot.correctAction
    const decisionTimeMs = Date.now() - startedAt

    const result: SpotResult = {
      spotId: spot.id,
      userAction,
      isCorrect,
      decisionTimeMs,
      timestamp: Date.now(),
    }

    const canContinue = hasContinuation && spot.correctAction === 'call'

    // Fire-and-forget mastery persistence
    const { trainingStrictness } = useSettingsStore.getState()
    recordSpotResult(spot, userAction, decisionTimeMs, trainingStrictness, 'hand-flow').catch(
      (err: unknown) => {
        console.error('Failed to persist preflop spot result', err)
      },
    )

    const updatedStats = {
      ...sessionStats,
      handsPlayed: sessionStats.handsPlayed + 1,
      preflopCorrect: sessionStats.preflopCorrect + (isCorrect ? 1 : 0),
      totalDecisionTimeMs: sessionStats.totalDecisionTimeMs + decisionTimeMs,
    }

    if (isCorrect) {
      if (canContinue) {
        // Correct + can continue: keep table visible, async-load flop
        set({ sessionStats: updatedStats })
        void loadContinuation(spot, result, set).catch((err: unknown) => {
          console.error('Failed to load flop continuation', err)
          set({ handPhase: { phase: 'idle' }, hasContinuation: false })
        })
      } else {
        // Correct + no continuation: advance to next hand
        set({
          handPhase: { phase: 'idle' },
          hasContinuation: false,
          sessionStats: updatedStats,
        })
      }
    } else {
      // Wrong: show correction
      set({
        handPhase: { phase: 'preflop-correction', spot, result, canContinue },
        sessionStats: updatedStats,
      })
    }
  },

  startFlopDecision: () => {
    const { handPhase } = get()
    if (handPhase.phase !== 'flop-dealing') return
    set({
      handPhase: {
        phase: 'flop-decision',
        continuation: handPhase.continuation,
        startedAt: Date.now(),
      },
    })
  },

  submitFlopAction: (userAction: PostflopAction) => {
    const { handPhase, sessionStats } = get()
    if (handPhase.phase !== 'flop-decision') return

    const { continuation, startedAt } = handPhase
    const { postflopSpot } = continuation
    const isCorrect = userAction === postflopSpot.correctAction
    const decisionTimeMs = Date.now() - startedAt

    const correctFreq = postflopSpot.correctStrategy[postflopSpot.correctAction] ?? 0
    const userFreq = postflopSpot.correctStrategy[userAction] ?? 0
    const frequencyDeviation = Math.abs(correctFreq - userFreq) / 100

    const result: PostflopSpotResult = {
      spotId: postflopSpot.id,
      userAction,
      isCorrect,
      frequencyDeviation,
      decisionTimeMs,
      timestamp: Date.now(),
    }

    // Fire-and-forget mastery persistence
    const { trainingStrictness } = useSettingsStore.getState()
    recordPostflopSpotResult(postflopSpot, userAction, decisionTimeMs, trainingStrictness, 'hand-flow').catch(
      (err: unknown) => {
        console.error('Failed to persist postflop spot result', err)
      },
    )

    const updatedStats = {
      ...sessionStats,
      postflopCorrect: sessionStats.postflopCorrect + (isCorrect ? 1 : 0),
      postflopHands: sessionStats.postflopHands + 1,
      totalDecisionTimeMs: sessionStats.totalDecisionTimeMs + decisionTimeMs,
    }

    if (isCorrect) {
      set({
        handPhase: { phase: 'idle' },
        hasContinuation: false,
        sessionStats: updatedStats,
      })
    } else {
      set({
        handPhase: { phase: 'flop-correction', continuation, result },
        sessionStats: updatedStats,
      })
    }
  },

  acknowledgeCorrection: () => {
    const { handPhase } = get()

    if (handPhase.phase === 'preflop-correction') {
      if (handPhase.canContinue) {
        void loadContinuation(handPhase.spot, handPhase.result, set).catch((err: unknown) => {
          console.error('Failed to load flop continuation', err)
          set({ handPhase: { phase: 'idle' }, hasContinuation: false })
        })
      } else {
        set({ handPhase: { phase: 'idle' }, hasContinuation: false })
      }
      return
    }

    if (handPhase.phase === 'flop-correction') {
      set({ handPhase: { phase: 'idle' }, hasContinuation: false })
    }
  },

  nextHand: () => {
    set({ handPhase: { phase: 'idle' }, hasContinuation: false })
  },

  resetSession: () => {
    set({
      handPhase: { phase: 'idle' },
      hasContinuation: false,
      sessionStats: { ...INITIAL_STATS, sessionStartedAt: Date.now() },
    })
  },
}))
