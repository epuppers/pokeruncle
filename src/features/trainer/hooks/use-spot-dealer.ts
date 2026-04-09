import { useCallback } from 'react'

import { useTrainerStore } from '@/stores/trainerStore'
import type { Scenario } from '@/types/poker'

import { generateSpot } from '@/features/trainer/lib/spot-generator'
import type { ProviderCharts } from '@/features/trainer/types'

/** Wraps the pure spot generator with store integration. */
export function useSpotDealer(charts: ProviderCharts) {
  const provider = useTrainerStore((s) => s.provider)
  const dealSpot = useTrainerStore((s) => s.dealSpot)

  const dealNext = useCallback(
    (scenarioFilter?: Scenario) => {
      const spot = generateSpot(charts, provider, scenarioFilter)
      dealSpot(spot)
    },
    [charts, provider, dealSpot],
  )

  return { dealNext }
}
