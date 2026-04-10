import { useEffect, useMemo } from 'react'

import { useTrainerStore } from '@/stores/trainerStore'

import { useRangeQuery } from '@/features/trainer/hooks/use-range-query'
import { useSpotDealer } from '@/features/trainer/hooks/use-spot-dealer'
import { useTrainerKeyboard } from '@/features/trainer/hooks/use-trainer-keyboard'
import { useDealingSequence } from '@/features/trainer/hooks/use-dealing-sequence'
import { buildActionSequence } from '@/features/trainer/lib/action-sequence'
import { narrateScenario } from '@/features/trainer/lib/scenario-narrator'
import { ActionBar } from './ActionBar'
import { FeedbackView } from './FeedbackView'
import { NarrativeLabel } from './NarrativeLabel'
import { SessionHud } from './SessionHud'
import { TableView } from './TableView'

import type { Spot } from '@/features/trainer/types'

function useNarrativeData(spot: Spot | null, revealedSteps: number | undefined) {
  return useMemo(() => {
    if (!spot) return { steps: [], revealedCount: 0, fallbackLabel: '' }
    const steps = buildActionSequence(spot)
    const revealedCount = revealedSteps ?? steps.length
    const narration = narrateScenario(spot)
    const fallbackLabel = `${narration.summary} ${narration.potDescription} ${narration.costToPlay}`
    return { steps, revealedCount, fallbackLabel }
  }, [spot, revealedSteps])
}

export function TrainerPage() {
  const provider = useTrainerStore((s) => s.provider)
  const trainerPhase = useTrainerStore((s) => s.trainerPhase)
  const submitAction = useTrainerStore((s) => s.submitAction)
  const nextSpot = useTrainerStore((s) => s.nextSpot)

  const { charts } = useRangeQuery(provider)
  const { dealNext } = useSpotDealer(charts)

  useTrainerKeyboard(nextSpot)
  useDealingSequence()

  useEffect(() => {
    if (trainerPhase.phase === 'idle') {
      void dealNext()
    }
  }, [trainerPhase.phase, dealNext])

  const spot =
    trainerPhase.phase === 'dealing' || trainerPhase.phase === 'active' || trainerPhase.phase === 'feedback'
      ? trainerPhase.spot
      : null

  const revealedSteps = trainerPhase.phase === 'dealing' ? trainerPhase.stepIndex : undefined

  const { steps, revealedCount, fallbackLabel } = useNarrativeData(spot, revealedSteps)

  return (
    <div className="flex-1 flex flex-col gap-5 max-w-2xl mx-auto w-full">
      <SessionHud />

      {trainerPhase.phase === 'dealing' && (
        <div className="flex flex-col gap-5">
          <TableView spot={trainerPhase.spot} revealedSteps={trainerPhase.stepIndex} />
          <NarrativeLabel steps={steps} revealedCount={revealedCount} />
        </div>
      )}

      {trainerPhase.phase === 'active' && (
        <div className="flex flex-col gap-5">
          <TableView spot={trainerPhase.spot} />
          <NarrativeLabel steps={steps} revealedCount={revealedCount} fallbackLabel={fallbackLabel} />
          <ActionBar onAction={submitAction} disabled={false} spot={trainerPhase.spot} />
        </div>
      )}

      {trainerPhase.phase === 'feedback' && (
        <div className="flex flex-col gap-5">
          <TableView spot={trainerPhase.spot} />
          <FeedbackView spot={trainerPhase.spot} result={trainerPhase.result} onNext={nextSpot} />
        </div>
      )}
    </div>
  )
}
