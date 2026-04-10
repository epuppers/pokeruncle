import { useEffect, useRef } from 'react'

import { useTrainerStore } from '@/stores/trainerStore'

import { buildActionSequence, STEP_TIMING_MS } from '@/features/trainer/lib/action-sequence'

/**
 * Drives the dealing animation by advancing through the action sequence
 * one step at a time with variable timing per step type.
 *
 * Only active when trainerPhase.phase === 'dealing'.
 * Each tick calls advanceDeal() which either increments stepIndex
 * or transitions to 'active' when the sequence is complete.
 */
export function useDealingSequence(): void {
  const trainerPhase = useTrainerStore((s) => s.trainerPhase)
  const advanceDeal = useTrainerStore((s) => s.advanceDeal)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (trainerPhase.phase !== 'dealing') {
      // Clear any lingering timer when we leave dealing
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    const steps = buildActionSequence(trainerPhase.spot)
    const currentStep = steps[trainerPhase.stepIndex]

    // If we somehow go out of bounds, advance immediately
    if (!currentStep) {
      advanceDeal()
      return
    }

    const delay = STEP_TIMING_MS[currentStep.style]

    timerRef.current = setTimeout(() => {
      timerRef.current = null
      advanceDeal()
    }, delay)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [trainerPhase, advanceDeal])
}
