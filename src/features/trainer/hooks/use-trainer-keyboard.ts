import { useEffect } from 'react'

import { useTrainerStore } from '@/stores/trainerStore'
import type { Action } from '@/types/poker'

import type { Spot } from '@/features/trainer/types'

const KEY_TO_ACTION: Record<string, Action> = {
  '1': 'fold',
  '2': 'call',
  '3': 'raise',
  '4': 'allin',
}

function getPushFoldKeyMap(spot: Spot & { kind: 'push-fold' }): Record<string, Action> {
  if (spot.scenario === 'push') {
    return { '1': 'fold', '2': 'allin' }
  }
  // vs-push
  return { '1': 'fold', '2': 'call' }
}

/**
 * Global keyboard listener for the training loop.
 * - 1/2/3/4 submit actions during the active phase
 * - Space advances to the next spot during feedback/idle
 */
export function useTrainerKeyboard(onNextSpot: () => void) {
  const trainerPhase = useTrainerStore((s) => s.trainerPhase)
  const submitAction = useTrainerStore((s) => s.submitAction)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (trainerPhase.phase === 'active') {
        const spot = trainerPhase.spot
        const keyMap = spot.kind === 'push-fold' ? getPushFoldKeyMap(spot) : KEY_TO_ACTION
        const action = keyMap[e.key]
        if (action) {
          e.preventDefault()
          submitAction(action)
        }
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        if (trainerPhase.phase === 'feedback' || trainerPhase.phase === 'idle') {
          onNextSpot()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [trainerPhase, submitAction, onNextSpot])
}
