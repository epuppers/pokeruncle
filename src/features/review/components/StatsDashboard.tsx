import { useReviewStore } from '@/stores/reviewStore'

import { useReviewStats } from '../hooks/use-review-stats'
import { AccuracyGrid } from './AccuracyGrid'
import { LeakNarrativesList } from './LeakNarrativesList'
import { PositionStats } from './PositionStats'
import { ReviewFilters } from './ReviewFilters'
import { ScenarioStats } from './ScenarioStats'

export function StatsDashboard() {
  const { filters, setFilters, resetFilters } = useReviewStore()
  const { overall, byPosition, byScenario, byHand, narratives, isLoading } = useReviewStats(filters)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-neutral-700 border-t-neutral-400 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ReviewFilters filters={filters} onFiltersChange={setFilters} onReset={resetFilters} />

      {/* Overall summary */}
      {overall.total > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Spots" value={String(overall.total)} />
          <StatCard label="Accuracy" value={`${overall.accuracy}%`} />
          <StatCard label="Avg EV Loss" value={`${overall.avgEvLoss.toFixed(2)}bb`} />
          <StatCard label="Avg Time" value={`${(overall.avgDecisionTimeMs / 1000).toFixed(1)}s`} />
        </div>
      ) : (
        <div className="text-neutral-500 text-sm text-center py-8">
          No training data yet. Head to the trainer and play some spots.
        </div>
      )}

      {overall.total > 0 && (
        <>
          {/* Leak insights */}
          <LeakNarrativesList narratives={narratives} />

          {/* Stats breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <PositionStats data={byPosition} />
              <ScenarioStats data={byScenario} />
            </div>
            <AccuracyGrid data={byHand} />
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-lg px-3 py-2">
      <div className="text-neutral-500 text-xs">{label}</div>
      <div className="text-white text-lg font-semibold tabular-nums">{value}</div>
    </div>
  )
}
