import { cn } from '@/lib/utils'
import { SCENARIOS } from '@/types/poker'

import type { StatsByScenario } from '../types'

interface ScenarioStatsProps {
  data: StatsByScenario
}

export function ScenarioStats({ data }: ScenarioStatsProps) {
  const scenarios = SCENARIOS.filter((s) => data[s.id])

  if (scenarios.length === 0) {
    return (
      <div className="text-neutral-500 text-sm text-center py-4">
        No scenario data yet. Train some spots first.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="font-semibold text-white text-sm">Accuracy by Scenario</div>
      {scenarios.map((sc) => {
        const stats = data[sc.id]!
        return (
          <div key={sc.id} className="flex items-center gap-3">
            <span className="text-neutral-300 text-sm font-medium w-24 truncate" title={sc.description}>
              {sc.label}
            </span>
            <div className="flex-1 h-5 bg-neutral-800 rounded-sm overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-sm transition-all',
                  stats.accuracy >= 80 ? 'bg-emerald-600' : stats.accuracy >= 60 ? 'bg-amber-600' : 'bg-rose-600',
                )}
                style={{ width: `${stats.accuracy}%` }}
              />
            </div>
            <span className="text-neutral-400 text-xs tabular-nums w-20 text-right">
              {stats.accuracy}% ({stats.correct}/{stats.total})
            </span>
          </div>
        )
      })}
    </div>
  )
}
