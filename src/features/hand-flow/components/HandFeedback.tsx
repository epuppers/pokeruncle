import type { HandPhase } from '@/stores/handStore'

import { FlopFeedback, PreflopFeedback } from './HandFeedbackParts'

type FeedbackPhase = Extract<HandPhase, { phase: 'preflop-feedback' | 'flop-feedback' }>

interface HandFeedbackProps {
  street: 'preflop' | 'flop'
  handPhase: FeedbackPhase
}

/**
 * Renders the appropriate feedback component based on the current street.
 * Delegates to PreflopFeedback or FlopFeedback.
 */
export function HandFeedback({ street, handPhase }: HandFeedbackProps) {
  if (street === 'preflop' && handPhase.phase === 'preflop-feedback') {
    return <PreflopFeedback spot={handPhase.spot} result={handPhase.result} />
  }

  if (street === 'flop' && handPhase.phase === 'flop-feedback') {
    return (
      <FlopFeedback
        spot={handPhase.continuation.postflopSpot}
        result={handPhase.result}
      />
    )
  }

  return null
}
