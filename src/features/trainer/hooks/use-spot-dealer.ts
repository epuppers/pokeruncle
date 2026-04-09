import { useCallback } from 'react'

import { useTrainerStore } from '@/stores/trainerStore'

import { getMasteryRecordsForProvider } from '@/features/trainer/lib/mastery-persistence'
import { generateSmartSpot, generateSpot } from '@/features/trainer/lib/spot-generator'
import type { ProviderCharts } from '@/features/trainer/types'

/** Wraps the spot generator with store integration and mastery-aware selection. */
export function useSpotDealer(charts: ProviderCharts) {
  const provider = useTrainerStore((s) => s.provider)
  const filters = useTrainerStore((s) => s.filters)
  const trainerMode = useTrainerStore((s) => s.trainerMode)
  const dealSpot = useTrainerStore((s) => s.dealSpot)

  const dealNext = useCallback(
    async () => {
      if (trainerMode.mode === 'drill') {
        // Drill mode: simple random within the drill's locked scenario
        const spot = generateSpot(charts, provider, trainerMode.scenario)
        dealSpot(spot)
        return
      }

      // Practice mode: mastery-aware selection
      const masteryRecords = await getMasteryRecordsForProvider(provider)
      const spot = generateSmartSpot(charts, provider, masteryRecords, filters)
      dealSpot(spot)
    },
    [charts, provider, filters, trainerMode, dealSpot],
  )

  return { dealNext }
}
