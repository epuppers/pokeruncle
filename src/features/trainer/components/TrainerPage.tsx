import { useEffect } from 'react'

import { useTrainerStore } from '@/stores/trainerStore'

import { useRangeQuery } from '@/features/trainer/hooks/use-range-query'
import { useSpotDealer } from '@/features/trainer/hooks/use-spot-dealer'
import { useTrainerKeyboard } from '@/features/trainer/hooks/use-trainer-keyboard'
import { ActionBar } from './ActionBar'
import { FeedbackView } from './FeedbackView'
import { HonestyBanner } from './HonestyBanner'
import { SessionHud } from './SessionHud'
import { SpotFilters } from './SpotFilters'
import { TableView } from './TableView'
import { TrainerProviderSelector } from './TrainerProviderSelector'

export function TrainerPage() {
  const provider = useTrainerStore((s) => s.provider)
  const trainerPhase = useTrainerStore((s) => s.trainerPhase)
  const submitAction = useTrainerStore((s) => s.submitAction)
  const nextSpot = useTrainerStore((s) => s.nextSpot)

  const { charts } = useRangeQuery(provider)
  const { dealNext } = useSpotDealer(charts)

  // nextSpot sets phase to idle, which triggers the auto-deal effect below
  useTrainerKeyboard(nextSpot)

  // Auto-deal when entering idle phase (initial mount or after provider change)
  useEffect(() => {
    if (trainerPhase.phase === 'idle') {
      void dealNext()
    }
  }, [trainerPhase.phase, dealNext])

  return (
    <div className="flex-1 flex flex-col gap-5 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <TrainerProviderSelector />
      </div>

      <SpotFilters />
      <HonestyBanner charts={charts} />
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
          <FeedbackView spot={trainerPhase.spot} result={trainerPhase.result} />
        </div>
      )}
    </div>
  )
}
