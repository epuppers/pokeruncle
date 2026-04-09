import { useEffect, useState } from 'react'

import { db } from '@/lib/db'

import type {
  AccuracyStats,
  EnrichedSpotResult,
  LeakNarrative,
  ReviewFilters,
  StatsByHand,
  StatsByPosition,
  StatsByScenario,
} from '../types'
import {
  aggregateByHand,
  aggregateByPosition,
  aggregateByScenario,
  aggregateOverall,
  filterByTimeRange,
} from '../lib/stats-aggregator'
import { generateLeakNarratives } from '../lib/leak-narratives'
import { toEnriched } from '../lib/enrich-result'

interface ReviewStatsResult {
  overall: AccuracyStats
  byPosition: StatsByPosition
  byScenario: StatsByScenario
  byHand: StatsByHand
  narratives: LeakNarrative[]
  isLoading: boolean
}

export function useReviewStats(filters: ReviewFilters): ReviewStatsResult {
  const [state, setState] = useState<ReviewStatsResult>({
    overall: { total: 0, correct: 0, accuracy: 0, avgEvLoss: 0, avgDecisionTimeMs: 0 },
    byPosition: {},
    byScenario: {},
    byHand: new Map(),
    narratives: [],
    isLoading: true,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      const raw = await db.spotResults.toArray()
      if (cancelled) return

      let results: EnrichedSpotResult[] = raw
        .map(toEnriched)
        .filter((r): r is EnrichedSpotResult => r !== null)

      if (filters.provider) {
        const p = filters.provider
        results = results.filter((r) => r.provider === p)
      }
      if (filters.positions.length > 0) {
        const posSet = new Set(filters.positions)
        results = results.filter((r) => posSet.has(r.hero))
      }
      if (filters.scenarios.length > 0) {
        const scSet = new Set(filters.scenarios)
        results = results.filter((r) => scSet.has(r.scenario))
      }
      if (filters.onlyWrong) {
        results = results.filter((r) => !r.isCorrect)
      }

      results = filterByTimeRange(results, filters.timeRange)

      const overall = aggregateOverall(results)
      const byPosition = aggregateByPosition(results)
      const byScenario = aggregateByScenario(results)
      const byHand = aggregateByHand(results)
      const narratives = generateLeakNarratives(overall, byPosition, byScenario)

      if (!cancelled) {
        setState({ overall, byPosition, byScenario, byHand, narratives, isLoading: false })
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [filters.provider, filters.positions, filters.scenarios, filters.onlyWrong, filters.timeRange])

  return state
}
