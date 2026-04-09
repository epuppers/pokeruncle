import { useTrainerStore } from '@/stores/trainerStore'
import { useRangeQuery } from '@/features/trainer/hooks/use-range-query'
import { TrainerProviderSelector } from './TrainerProviderSelector'
import { ChartSummary } from './ChartSummary'

export function TrainerPage() {
  const { provider } = useTrainerStore()
  const { charts } = useRangeQuery(provider)

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-lg mx-auto w-full">
      <div className="flex flex-col items-center gap-4">
        <TrainerProviderSelector />
      </div>

      <ChartSummary charts={charts} />

      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6 text-center">
        <p className="text-sm text-neutral-400">
          Training loop coming in Phase 3.
        </p>
        <p className="text-xs text-neutral-600 mt-2">
          Select a provider above to verify data loading.
        </p>
      </div>
    </div>
  )
}
