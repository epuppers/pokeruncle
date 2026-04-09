import { useEffect } from 'react'

import { useTrainerStore } from '@/stores/trainerStore'
import type { Action } from '@/types/poker'

const KEY_TO_ACTION: Record<string, Action> = {
  '1': 'fold',
  '2': 'call',
  '3': 'raise',
  '4': 'allin',
}

/**
 * Global keyboard listener for the training loop.
 * - 1/2/3/4 submit actions during the active phase
 * - Space advances to the next spot during feedback/idle
 */
export function useTrainerKeyboard(onNextSpot: () => void) {
  const phase = useTrainerStore((s) => s.trainerPhase.phase)
  const submitAction = useTrainerStore((s) => s.submitAction)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (phase === 'active') {
        const action = KEY_TO_ACTION[e.key]
        if (action) {
          e.preventDefault()
          submitAction(action)
        }
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        if (phase === 'feedback' || phase === 'idle') {
          onNextSpot()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, submitAction, onNextSpot])
}
