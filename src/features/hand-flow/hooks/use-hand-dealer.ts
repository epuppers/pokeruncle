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
import type { SolutionManifest } from '@/features/postflop'

const NO_FILTERS: SpotFilters = {
  positions: [],
  scenarios: [],
  handTypes: [],
  stackDepths: [],
}

const MAX_POSTFLOP_RETRIES = 20

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
 * In postflop-drill mode, retries until a spot with postflop solutions is found.
 */
export function useHandDealer(charts: ProviderCharts) {
  const provider = useTrainerStore((s) => s.provider)
  const filters = useTrainerStore((s) => s.filters)
  const dealPreflop = useHandStore((s) => s.dealPreflop)
  const handFlowMode = useHandStore((s) => s.handFlowMode)

  const dealNext = useCallback(async () => {
    const isTournament = provider === 'nash-pushfold'

    let masteryRecords: MasteryRecord[] = []
    try {
      masteryRecords = await getMasteryRecordsForProvider(provider)
    } catch {
      // IndexedDB unavailable — use random selection
    }

    if (handFlowMode.mode === 'postflop-drill' && !isTournament) {
      await dealPostflopDrill(charts, provider, masteryRecords, filters, dealPreflop)
    } else {
      await dealNatural(charts, provider, isTournament, masteryRecords, filters, dealPreflop)
    }
  }, [charts, provider, filters, dealPreflop, handFlowMode])

  return { dealNext }
}

/** Natural mode: generate any spot, check manifest for continuation. */
async function dealNatural(
  charts: ProviderCharts,
  provider: Provider,
  isTournament: boolean,
  masteryRecords: MasteryRecord[],
  filters: SpotFilters,
  dealPreflop: (spot: Spot, hasContinuation: boolean) => void,
) {
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
}

/** Postflop-drill mode: retry until a spot with matching postflop solutions is found. */
async function dealPostflopDrill(
  charts: ProviderCharts,
  provider: Provider,
  masteryRecords: MasteryRecord[],
  filters: SpotFilters,
  dealPreflop: (spot: Spot, hasContinuation: boolean) => void,
) {
  let manifest: SolutionManifest
  try {
    manifest = await loadManifest()
  } catch {
    // Manifest unavailable — fall back to natural mode behavior
    const spot = tryGenerateSpot(charts, provider, false, masteryRecords, filters)
    if (spot) dealPreflop(spot, false)
    return
  }

  let lastSpot: Spot | null = null

  for (let i = 0; i < MAX_POSTFLOP_RETRIES; i++) {
    const spot = tryGenerateSpot(charts, provider, false, masteryRecords, filters)
    if (!spot) break

    lastSpot = spot

    if (canContinueToPostflop(spot, manifest)) {
      dealPreflop(spot, true)
      return
    }
  }

  // All retries exhausted — graceful degradation
  if (lastSpot) {
    console.warn('Postflop drill: no matching postflop solution found after retries, falling back')
    dealPreflop(lastSpot, false)
  }
}
