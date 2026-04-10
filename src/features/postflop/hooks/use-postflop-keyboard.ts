import { useEffect } from 'react'

import { usePostflopTrainerStore } from '@/stores/postflopTrainerStore'

import type { PostflopAction } from '../types'

/** Key → postflop action mapping */
const KEY_MAP: Record<string, PostflopAction> = {
  '1': 'fold',
  '2': 'check',
  '3': 'bet-small',
  '4': 'bet-medium',
  '5': 'bet-large',
  '6': 'allin',
}

/**
 * Global keyboard listener for the postflop training loop.
 * - Number keys 1-6 submit actions during the active phase
 * - Space advances to the next spot during feedback/idle
 */
export function usePostflopKeyboard(onNextSpot: () => void) {
  const trainerPhase = usePostflopTrainerStore((s) => s.trainerPhase)
  const submitAction = usePostflopTrainerStore((s) => s.submitAction)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (trainerPhase.phase === 'street-decision') {
        const action = KEY_MAP[e.key]
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
