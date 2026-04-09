import { cn } from '@/lib/utils'
import { POSITIONS } from '@/types/poker'

import type { StatsByPosition } from '../types'

interface PositionStatsProps {
  data: StatsByPosition
}

export function PositionStats({ data }: PositionStatsProps) {
  const positions = POSITIONS.filter((p) => data[p])

  if (positions.length === 0) {
    return (
      <div className="text-neutral-500 text-sm text-center py-4">
        No position data yet. Train some spots first.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="font-semibold text-white text-sm">Accuracy by Position</div>
      {positions.map((pos) => {
        const stats = data[pos]!
        return (
          <div key={pos} className="flex items-center gap-3">
            <span className="text-neutral-300 text-sm font-medium w-8">{pos}</span>
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
