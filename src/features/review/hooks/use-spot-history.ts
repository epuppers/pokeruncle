import { useEffect, useState } from 'react'

import { db } from '@/lib/db'

import type { EnrichedSpotResult, ReviewFilters } from '../types'
import { timeRangeToTimestamp } from '../lib/stats-aggregator'
import { toEnriched } from '../lib/enrich-result'

const PAGE_SIZE = 25

interface SpotHistoryResult {
  results: EnrichedSpotResult[]
  totalCount: number
  isLoading: boolean
}

export function useSpotHistory(filters: ReviewFilters, page: number): SpotHistoryResult {
  const [state, setState] = useState<SpotHistoryResult>({
    results: [],
    totalCount: 0,
    isLoading: true,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      const raw = await db.spotResults.orderBy('timestamp').reverse().toArray()
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
      if (filters.timeRange !== 'all') {
        const cutoff = timeRangeToTimestamp(filters.timeRange)
        results = results.filter((r) => r.timestamp >= cutoff)
      }

      const totalCount = results.length
      const paged = results.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

      if (!cancelled) {
        setState({ results: paged, totalCount, isLoading: false })
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [filters.provider, filters.positions, filters.scenarios, filters.onlyWrong, filters.timeRange, page])

  return state
}

export { PAGE_SIZE }
