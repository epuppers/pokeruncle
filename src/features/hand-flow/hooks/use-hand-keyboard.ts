import { useEffect, useMemo } from 'react'

import { useHandStore } from '@/stores/handStore'
import { useSettingsStore } from '@/stores/settingsStore'

import type { Action } from '@/types/poker'
import type { PostflopAction } from '@/features/postflop'
import type { Spot } from '@/features/trainer/types'

import { useSkipDealing } from './use-hand-dealing-sequence'

function buildPreflopKeyMap(bindings: Record<string, string>): Record<string, Action> {
  return {
    [bindings.fold]: 'fold',
    [bindings.call]: 'call',
    [bindings.raise]: 'raise',
    [bindings.allin]: 'allin',
  }
}

function getPushFoldKeyMap(
  spot: Spot & { kind: 'push-fold' },
  bindings: Record<string, string>,
): Record<string, Action> {
  if (spot.scenario === 'push') {
    return { [bindings.fold]: 'fold', [bindings.call]: 'allin' }
  }
  return { [bindings.fold]: 'fold', [bindings.call]: 'call' }
}

/** Key → postflop action mapping (matches postflop trainer) */
const POSTFLOP_KEY_MAP: Record<string, PostflopAction> = {
  '1': 'fold',
  '2': 'check',
  '3': 'bet-small',
  '4': 'bet-medium',
  '5': 'bet-large',
  '6': 'allin',
}

/**
 * Global keyboard listener for the unified hand flow.
 * Handles dealing skip, preflop/postflop actions, and correction acknowledgement.
 */
export function useHandKeyboard(): void {
  const handPhase = useHandStore((s) => s.handPhase)
  const submitPreflopAction = useHandStore((s) => s.submitPreflopAction)
  const submitFlopAction = useHandStore((s) => s.submitFlopAction)
  const acknowledgeCorrection = useHandStore((s) => s.acknowledgeCorrection)
  const advanceAfterCorrect = useHandStore((s) => s.advanceAfterCorrect)
  const keyBindings = useSettingsStore((s) => s.keyBindings)
  const skipDealing = useSkipDealing()

  const preflopKeyMap = useMemo(() => buildPreflopKeyMap(keyBindings), [keyBindings])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const phase = handPhase.phase

      // Skip dealing animation or correct-answer flash on any key
      if (phase === 'preflop-dealing' || phase === 'flop-dealing') {
        e.preventDefault()
        skipDealing()
        return
      }
      if (phase === 'preflop-correct' || phase === 'flop-correct') {
        e.preventDefault()
        advanceAfterCorrect()
        return
      }

      // Preflop action keys
      if (phase === 'preflop-decision') {
        const spot = handPhase.spot
        const activeKeyMap =
          spot.kind === 'push-fold' ? getPushFoldKeyMap(spot, keyBindings) : preflopKeyMap
        const action = activeKeyMap[e.key]
        if (action) {
          e.preventDefault()
          submitPreflopAction(action)
        }
        return
      }

      // Preflop correction — only the correct action key acknowledges
      if (phase === 'preflop-correction') {
        const spot = handPhase.spot
        const activeKeyMap =
          spot.kind === 'push-fold' ? getPushFoldKeyMap(spot, keyBindings) : preflopKeyMap
        const action = activeKeyMap[e.key]
        if (action === spot.correctAction) {
          e.preventDefault()
          acknowledgeCorrection()
        }
        return
      }

      // Postflop action keys
      if (phase === 'flop-decision') {
        const action = POSTFLOP_KEY_MAP[e.key]
        if (action) {
          e.preventDefault()
          submitFlopAction(action)
        }
        return
      }

      // Flop correction — only the correct action key acknowledges
      if (phase === 'flop-correction') {
        const action = POSTFLOP_KEY_MAP[e.key]
        if (action === handPhase.continuation.postflopSpot.correctAction) {
          e.preventDefault()
          acknowledgeCorrection()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    handPhase,
    submitPreflopAction,
    submitFlopAction,
    acknowledgeCorrection,
    advanceAfterCorrect,
    skipDealing,
    keyBindings,
    preflopKeyMap,
  ])
}
