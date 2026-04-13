import { useEffect } from 'react'

import { useHandStore } from '@/stores/handStore'
import { useTrainerStore } from '@/stores/trainerStore'

import { useRangeQuery } from '@/features/trainer/hooks/use-range-query'

import { useHandDealer } from '../hooks/use-hand-dealer'
import { useHandDealingSequence } from '../hooks/use-hand-dealing-sequence'
import { useHandKeyboard } from '../hooks/use-hand-keyboard'
import { HandActionBar } from './HandActionBar'
import { HandFeedback } from './HandFeedback'
import { HandFlowFilters } from './HandFlowFilters'
import { HandSessionHud } from './HandSessionHud'
import { HandSummary } from './HandSummary'
import { HandTable } from './HandTable'

/**
 * Unified hand flow page — deals preflop, optionally continues to flop,
 * all on one persistent table. Route: /play
 */
export function HandFlowPage() {
  const provider = useTrainerStore((s) => s.provider)
  const handPhase = useHandStore((s) => s.handPhase)

  const { charts } = useRangeQuery(provider)
  const { dealNext } = useHandDealer(charts)
  const dealingStepIndex = useHandDealingSequence()
  useHandKeyboard()

  // Auto-deal when idle
  useEffect(() => {
    if (handPhase.phase === 'idle') {
      void dealNext()
    }
  }, [handPhase.phase, dealNext])

  const { phase } = handPhase

  return (
    <div className="flex-1 flex flex-col gap-5 max-w-2xl mx-auto w-full">
      <HandSessionHud />

      <HandFlowFilters />

      <HandTable dealingStepIndex={dealingStepIndex} />

      {phase === 'preflop-feedback' && (
        <HandFeedback street="preflop" handPhase={handPhase} />
      )}

      {phase === 'flop-feedback' && (
        <HandFeedback street="flop" handPhase={handPhase} />
      )}

      {phase === 'hand-summary' && <HandSummary />}

      <HandActionBar />
    </div>
  )
}
