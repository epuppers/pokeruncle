import { useCallback, useEffect, useRef, useState } from 'react'

import { useHandStore } from '@/stores/handStore'

import { buildActionSequence, STEP_TIMING_MS } from '@/features/trainer/lib/action-sequence'

interface DealingState {
  spotId: string
  stepIndex: number
}

/**
 * Drives the preflop dealing animation for the hand flow.
 * Returns the current stepIndex (undefined when not in preflop-dealing).
 *
 * Also handles flop-dealing → startFlopDecision() with a short delay.
 */
export function useHandDealingSequence(): number | undefined {
  const handPhase = useHandStore((s) => s.handPhase)
  const startPreflopDecision = useHandStore((s) => s.startPreflopDecision)
  const startFlopDecision = useHandStore((s) => s.startFlopDecision)
  const [dealingState, setDealingState] = useState<DealingState>({ spotId: '', stepIndex: 0 })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset stepIndex when a new spot arrives — "adjust state during render" pattern
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  const currentSpotId = handPhase.phase === 'preflop-dealing' ? handPhase.spot.id : null
  if (currentSpotId !== null && currentSpotId !== dealingState.spotId) {
    setDealingState({ spotId: currentSpotId, stepIndex: 0 })
  }

  const { stepIndex } = dealingState

  // Drive preflop dealing animation
  useEffect(() => {
    if (handPhase.phase !== 'preflop-dealing') {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    const steps = buildActionSequence(handPhase.spot)

    if (stepIndex >= steps.length) {
      startPreflopDecision()
      return
    }

    const currentStep = steps[stepIndex]
    const delay = STEP_TIMING_MS[currentStep.style]

    timerRef.current = setTimeout(() => {
      timerRef.current = null
      setDealingState((prev) => ({ ...prev, stepIndex: prev.stepIndex + 1 }))
    }, delay)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [handPhase, stepIndex, startPreflopDecision])

  // Auto-transition flop-dealing → flop-decision after a short delay
  useEffect(() => {
    if (handPhase.phase !== 'flop-dealing') return

    const timer = setTimeout(() => {
      startFlopDecision()
    }, 800)

    return () => clearTimeout(timer)
  }, [handPhase.phase, startFlopDecision])

  if (handPhase.phase === 'preflop-dealing') {
    return stepIndex
  }

  return undefined
}

/** Skip dealing animation — jump straight to decision phase */
export function useSkipDealing(): () => void {
  const handPhase = useHandStore((s) => s.handPhase)
  const startPreflopDecision = useHandStore((s) => s.startPreflopDecision)
  const startFlopDecision = useHandStore((s) => s.startFlopDecision)

  const skip = useCallback(() => {
    if (handPhase.phase === 'preflop-dealing') {
      startPreflopDecision()
    } else if (handPhase.phase === 'flop-dealing') {
      startFlopDecision()
    }
  }, [handPhase.phase, startPreflopDecision, startFlopDecision])

  return skip
}
