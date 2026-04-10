import { useEffect } from 'react'

import { useTrainerStore } from '@/stores/trainerStore'

import { useRangeQuery } from '@/features/trainer/hooks/use-range-query'
import { useSpotDealer } from '@/features/trainer/hooks/use-spot-dealer'
import { useTrainerKeyboard } from '@/features/trainer/hooks/use-trainer-keyboard'
import { ActionBar } from './ActionBar'
import { FeedbackView } from './FeedbackView'
import { SessionHud } from './SessionHud'
import { TableView } from './TableView'

export function TrainerPage() {
  const provider = useTrainerStore((s) => s.provider)
  const trainerPhase = useTrainerStore((s) => s.trainerPhase)
  const submitAction = useTrainerStore((s) => s.submitAction)
  const nextSpot = useTrainerStore((s) => s.nextSpot)

  const { charts } = useRangeQuery(provider)
  const { dealNext } = useSpotDealer(charts)

  useTrainerKeyboard(nextSpot)

  useEffect(() => {
    if (trainerPhase.phase === 'idle') {
      void dealNext()
    }
  }, [trainerPhase.phase, dealNext])

  return (
    <div className="flex-1 flex flex-col gap-5 max-w-2xl mx-auto w-full">
      <SessionHud />

      {trainerPhase.phase === 'active' && (
        <div className="flex flex-col gap-5">
          <TableView spot={trainerPhase.spot} />
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
