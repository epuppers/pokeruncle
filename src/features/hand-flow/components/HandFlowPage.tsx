import { useEffect } from 'react'

import { useHandStore } from '@/stores/handStore'
import { useTrainerStore } from '@/stores/trainerStore'
import { actionLabel } from '@/lib/poker-glossary'
import { POSTFLOP_ACTION_LABELS } from '@/features/postflop'
import { useRangeQuery } from '@/features/trainer/hooks/use-range-query'

import { useHandDealer } from '../hooks/use-hand-dealer'
import { useHandDealingSequence } from '../hooks/use-hand-dealing-sequence'
import { useHandKeyboard } from '../hooks/use-hand-keyboard'
import { CorrectionBanner } from './CorrectionBanner'
import { HandActionBar } from './HandActionBar'
import { HandFlowFilters } from './HandFlowFilters'
import { HandSessionHud } from './HandSessionHud'
import { HandTable } from './HandTable'

/**
 * Unified hand flow page — a continuous game that deals preflop,
 * optionally continues to flop, corrects errors inline, and
 * auto-advances on correct answers. Route: /play
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

      {phase === 'preflop-correction' && (
        <CorrectionBanner
          userActionLabel={actionLabel(handPhase.result.userAction)}
          correctActionLabel={actionLabel(handPhase.spot.correctAction)}
        />
      )}

      {phase === 'flop-correction' && (
        <CorrectionBanner
          userActionLabel={POSTFLOP_ACTION_LABELS[handPhase.result.userAction]}
          correctActionLabel={POSTFLOP_ACTION_LABELS[handPhase.continuation.postflopSpot.correctAction]}
        />
      )}

      <HandActionBar />
    </div>
  )
}
