import { useCallback } from 'react'

import { useTrainerStore } from '@/stores/trainerStore'

import { getMasteryRecordsForProvider } from '@/features/trainer/lib/mastery-persistence'
import {
  generatePushFoldSpot,
  generateSmartPushFoldSpot,
  generateSmartSpot,
  generateSpot,
} from '@/features/trainer/lib/spot-generator'
import type { ProviderCharts, SpotFilters } from '@/features/trainer/types'

const NO_FILTERS: SpotFilters = {
  positions: [],
  scenarios: [],
  handTypes: [],
  stackDepths: [],
}

/** Wraps the spot generator with store integration and mastery-aware selection. */
export function useSpotDealer(charts: ProviderCharts) {
  const provider = useTrainerStore((s) => s.provider)
  const filters = useTrainerStore((s) => s.filters)
  const trainerMode = useTrainerStore((s) => s.trainerMode)
  const dealSpot = useTrainerStore((s) => s.dealSpot)
  const setProvider = useTrainerStore((s) => s.setProvider)
  const setFilters = useTrainerStore((s) => s.setFilters)

  const dealNext = useCallback(
    async () => {
      const isTournament = provider === 'nash-pushfold'

      if (trainerMode.mode === 'drill') {
        const spot = generateSpot(charts, provider, trainerMode.scenario)
        dealSpot(spot)
        return
      }

      if (trainerMode.mode === 'push-fold-drill') {
        const drillFilters = {
          ...filters,
          positions: [trainerMode.hero],
          stackDepths: [trainerMode.stackDepth],
        }
        const spot = generatePushFoldSpot(charts, drillFilters, trainerMode.scenario)
        dealSpot(spot)
        return
      }

      let masteryRecords: Awaited<ReturnType<typeof getMasteryRecordsForProvider>> = []
      try {
        masteryRecords = await getMasteryRecordsForProvider(provider)
      } catch {
        // IndexedDB unavailable — use random selection
      }

      // Try current filters → no filters → reset provider to pekarstas
      try {
        if (isTournament) {
          dealSpot(generateSmartPushFoldSpot(charts, masteryRecords, filters))
        } else {
          dealSpot(generateSmartSpot(charts, provider, masteryRecords, filters))
        }
      } catch {
        try {
          if (isTournament) {
            dealSpot(generateSmartPushFoldSpot(charts, masteryRecords, NO_FILTERS))
          } else {
            dealSpot(generateSmartSpot(charts, provider, masteryRecords, NO_FILTERS))
          }
        } catch {
          // Charts are empty for this provider — reset to default
          setProvider('pekarstas')
          setFilters(NO_FILTERS)
        }
      }
    },
    [charts, provider, filters, trainerMode, dealSpot, setProvider, setFilters],
  )

  return { dealNext }
}
