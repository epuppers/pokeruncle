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

// ─── Hand flow mode ────────────────────────────────────────

export type HandFlowMode = { mode: 'natural' } | { mode: 'postflop-drill' }

// ─── Phase model (discriminated union) ──────────────────────

export type HandPhase =
  | { phase: 'idle' }
  | { phase: 'preflop-dealing'; spot: Spot }
  | { phase: 'preflop-decision'; spot: Spot; startedAt: number }
  | { phase: 'preflop-feedback'; spot: Spot; result: SpotResult; canContinue: boolean }
  | { phase: 'flop-dealing'; continuation: HandContinuation }
  | { phase: 'flop-decision'; continuation: HandContinuation; startedAt: number }
  | { phase: 'flop-feedback'; continuation: HandContinuation; result: PostflopSpotResult }
  | {
      phase: 'hand-summary'
      preflopSpot: Spot
      preflopResult: SpotResult
      continuation: HandContinuation | null
      postflopResult: PostflopSpotResult | null
    }

// ─── Session stats ──────────────────────────────────────────

export interface HandSessionStats {
  handsPlayed: number
  preflopCorrect: number
  postflopCorrect: number
  postflopHands: number
  fullHandCorrect: number
  totalDecisionTimeMs: number
  sessionStartedAt: number
}

const INITIAL_STATS: HandSessionStats = {
  handsPlayed: 0,
  preflopCorrect: 0,
  postflopCorrect: 0,
  postflopHands: 0,
  fullHandCorrect: 0,
  totalDecisionTimeMs: 0,
  sessionStartedAt: Date.now(),
}

// ─── Store interface ────────────────────────────────────────

interface HandState {
  handPhase: HandPhase
  handFlowMode: HandFlowMode
  sessionStats: HandSessionStats

  /** Whether the current spot has matching postflop solutions in the manifest */
  hasContinuation: boolean

  // Actions
  setHandFlowMode: (mode: HandFlowMode) => void
  dealPreflop: (spot: Spot, hasContinuation: boolean) => void
  startPreflopDecision: () => void
  submitPreflopAction: (userAction: Action) => void
  continueToFlop: () => Promise<void>
  startFlopDecision: () => void
  submitFlopAction: (userAction: PostflopAction) => void
  showHandSummary: () => void
  nextHand: () => void
  resetSession: () => void
}

// ─── Store ──────────────────────────────────────────────────

export const useHandStore = create<HandState>()((set, get) => ({
  handPhase: { phase: 'idle' },
  handFlowMode: { mode: 'natural' },
  sessionStats: { ...INITIAL_STATS },
  hasContinuation: false,

  setHandFlowMode: (mode: HandFlowMode) => set({ handFlowMode: mode }),

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

    // Can continue only if solver says call AND postflop solutions exist
    const canContinue = hasContinuation && spot.correctAction === 'call'

    // Fire-and-forget mastery persistence
    const { trainingStrictness } = useSettingsStore.getState()
    recordSpotResult(spot, userAction, decisionTimeMs, trainingStrictness, 'hand-flow').catch(
      (err: unknown) => {
        console.error('Failed to persist preflop spot result', err)
      },
    )

    set({
      handPhase: { phase: 'preflop-feedback', spot, result, canContinue },
      sessionStats: {
        ...sessionStats,
        handsPlayed: sessionStats.handsPlayed + 1,
        preflopCorrect: sessionStats.preflopCorrect + (isCorrect ? 1 : 0),
        totalDecisionTimeMs: sessionStats.totalDecisionTimeMs + decisionTimeMs,
      },
    })
  },

  continueToFlop: async () => {
    const { handPhase } = get()
    if (handPhase.phase !== 'preflop-feedback' || !handPhase.canContinue) return
    if (handPhase.spot.kind !== 'response') return

    const { spot, result: preflopResult } = handPhase

    const manifest = await loadManifest()
    const matchingSolutions = findMatchingSolutions(spot, manifest)
    if (matchingSolutions.length === 0) return

    const entry = pickRandomEntry(matchingSolutions)
    const solution = await getSolution(entry.solutionKey)
    if (!solution) return

    // Generate postflop spot for this specific hand
    const postflopSpot = generatePostflopSpotForHand(solution, spot, spot.heroCards)
    if (!postflopSpot) {
      // Hand not in solver's postflop range — fallback to random hand from solution
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

    set({
      handPhase: { phase: 'flop-feedback', continuation, result },
      sessionStats: {
        ...sessionStats,
        postflopCorrect: sessionStats.postflopCorrect + (isCorrect ? 1 : 0),
        postflopHands: sessionStats.postflopHands + 1,
        totalDecisionTimeMs: sessionStats.totalDecisionTimeMs + decisionTimeMs,
      },
    })
  },

  showHandSummary: () => {
    const { handPhase } = get()

    if (handPhase.phase === 'flop-feedback') {
      const { sessionStats } = get()
      const bothCorrect =
        handPhase.continuation.preflopResult.isCorrect && handPhase.result.isCorrect

      set({
        handPhase: {
          phase: 'hand-summary',
          preflopSpot: handPhase.continuation.preflopSpot,
          preflopResult: handPhase.continuation.preflopResult,
          continuation: handPhase.continuation,
          postflopResult: handPhase.result,
        },
        sessionStats: {
          ...sessionStats,
          fullHandCorrect: sessionStats.fullHandCorrect + (bothCorrect ? 1 : 0),
        },
      })
      return
    }

    if (handPhase.phase === 'preflop-feedback') {
      set({
        handPhase: {
          phase: 'hand-summary',
          preflopSpot: handPhase.spot,
          preflopResult: handPhase.result,
          continuation: null,
          postflopResult: null,
        },
      })
    }
  },

  nextHand: () => {
    set({ handPhase: { phase: 'idle' }, hasContinuation: false })
  },

  resetSession: () => {
    set({
      handPhase: { phase: 'idle' },
      handFlowMode: { mode: 'natural' },
      hasContinuation: false,
      sessionStats: { ...INITIAL_STATS, sessionStartedAt: Date.now() },
    })
  },
}))
