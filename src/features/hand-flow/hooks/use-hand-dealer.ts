import { useCallback } from 'react'

import { useHandStore } from '@/stores/handStore'
import { useTrainerStore } from '@/stores/trainerStore'

import { loadManifest } from '@/features/postflop'
import { canContinueToPostflop } from '@/features/trainer/lib/hand-bridge'
import { getMasteryRecordsForProvider } from '@/features/trainer/lib/mastery-persistence'
import {
  generateSmartPushFoldSpot,
  generateSmartSpot,
} from '@/features/trainer/lib/spot-generator'

import type { MasteryRecord } from '@/lib/db'
import type { Provider } from '@/types/poker'
import type { ProviderCharts, Spot, SpotFilters } from '@/features/trainer/types'

const NO_FILTERS: SpotFilters = {
  positions: [],
  scenarios: [],
  handTypes: [],
  stackDepths: [],
}

/** Try to generate a spot, falling back to unfiltered if filters produce nothing. */
function tryGenerateSpot(
  charts: ProviderCharts,
  provider: Provider,
  isTournament: boolean,
  masteryRecords: MasteryRecord[],
  filters: SpotFilters,
): Spot | null {
  try {
    return isTournament
      ? generateSmartPushFoldSpot(charts, masteryRecords, filters)
      : generateSmartSpot(charts, provider, masteryRecords, filters)
  } catch {
    try {
      return isTournament
        ? generateSmartPushFoldSpot(charts, masteryRecords, NO_FILTERS)
        : generateSmartSpot(charts, provider, masteryRecords, NO_FILTERS)
    } catch {
      return null
    }
  }
}

/**
 * Generates spots and deals them into the hand store.
 * Checks the postflop manifest to determine if the hand can continue to flop.
 */
export function useHandDealer(charts: ProviderCharts) {
  const provider = useTrainerStore((s) => s.provider)
  const filters = useTrainerStore((s) => s.filters)
  const dealPreflop = useHandStore((s) => s.dealPreflop)

  const dealNext = useCallback(async () => {
    const isTournament = provider === 'nash-pushfold'

    let masteryRecords: MasteryRecord[] = []
    try {
      masteryRecords = await getMasteryRecordsForProvider(provider)
    } catch {
      // IndexedDB unavailable — use random selection
    }

    const spot = tryGenerateSpot(charts, provider, isTournament, masteryRecords, filters)
    if (!spot) return

    let hasContinuation = false
    try {
      const manifest = await loadManifest()
      hasContinuation = canContinueToPostflop(spot, manifest)
    } catch {
      // Manifest unavailable — preflop only
    }

    dealPreflop(spot, hasContinuation)
  }, [charts, provider, filters, dealPreflop])

  return { dealNext }
}
