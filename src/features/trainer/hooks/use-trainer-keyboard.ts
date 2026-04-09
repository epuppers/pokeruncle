import { useEffect, useMemo } from 'react'

import { useTrainerStore } from '@/stores/trainerStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { Action } from '@/types/poker'

import type { Spot } from '@/features/trainer/types'

function buildKeyMap(bindings: Record<string, string>): Record<string, Action> {
  return {
    [bindings.fold]: 'fold',
    [bindings.call]: 'call',
    [bindings.raise]: 'raise',
    [bindings.allin]: 'allin',
  }
}

function getPushFoldKeyMap(spot: Spot & { kind: 'push-fold' }, bindings: Record<string, string>): Record<string, Action> {
  if (spot.scenario === 'push') {
    return { [bindings.fold]: 'fold', [bindings.call]: 'allin' }
  }
  // vs-push
  return { [bindings.fold]: 'fold', [bindings.call]: 'call' }
}

/**
 * Global keyboard listener for the training loop.
 * Reads key bindings from the settings store.
 * - Configured keys submit actions during the active phase
 * - Next key advances to the next spot during feedback/idle
 */
export function useTrainerKeyboard(onNextSpot: () => void) {
  const trainerPhase = useTrainerStore((s) => s.trainerPhase)
  const submitAction = useTrainerStore((s) => s.submitAction)
  const keyBindings = useSettingsStore((s) => s.keyBindings)

  const keyMap = useMemo(() => buildKeyMap(keyBindings), [keyBindings])
  const nextKey = keyBindings.next

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (trainerPhase.phase === 'active') {
        const spot = trainerPhase.spot
        const activeKeyMap = spot.kind === 'push-fold' ? getPushFoldKeyMap(spot, keyBindings) : keyMap
        const action = activeKeyMap[e.key]
        if (action) {
          e.preventDefault()
          submitAction(action)
        }
      }

      if (e.key === nextKey || (nextKey === ' ' && e.code === 'Space')) {
        e.preventDefault()
        if (trainerPhase.phase === 'feedback' || trainerPhase.phase === 'idle') {
          onNextSpot()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [trainerPhase, submitAction, onNextSpot, keyMap, keyBindings, nextKey])
}
