import { memo } from 'react'
import { cn } from '@/lib/utils'
import { HAND_GRID, RANKS } from '@/types/poker'

import type { StatsByHand } from '../types'

function accuracyColor(accuracy: number): string {
  if (accuracy >= 80) return 'bg-emerald-700'
  if (accuracy >= 60) return 'bg-amber-600'
  return 'bg-rose-700'
}

function accuracyTextColor(accuracy: number): string {
  if (accuracy >= 80) return 'text-emerald-100'
  if (accuracy >= 60) return 'text-amber-100'
  return 'text-rose-100'
}

interface AccuracyGridProps {
  data: StatsByHand
}

export const AccuracyGrid = memo(function AccuracyGrid({ data }: AccuracyGridProps) {
  return (
    <div className="w-full max-w-[420px] mx-auto">
      <div className="mb-2">
        <div className="font-semibold text-foreground text-sm">Accuracy by Hand</div>
        <div className="text-muted-foreground text-xs">Green = 80%+, Yellow = 60-80%, Red = below 60%</div>
      </div>

      <div
        role="grid"
        aria-label="Hand accuracy grid"
        className="relative bg-card/50 backdrop-blur-sm rounded-lg border border-border p-3"
      >
        {/* Column headers */}
        <div className="grid grid-cols-[auto_repeat(13,1fr)] gap-[2px] mb-[2px]">
          <div className="w-5 sm:w-6" />
          {RANKS.map((rank) => (
            <div
              key={rank}
              className="aspect-square flex items-center justify-center text-muted-foreground font-medium text-[9px] sm:text-[10px]"
            >
              {rank}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        {HAND_GRID.map((row, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-[auto_repeat(13,1fr)] gap-[2px] mb-[2px]">
            <div className="flex items-center justify-center text-muted-foreground font-medium w-5 sm:w-6 text-[9px] sm:text-[10px]">
              {RANKS[rowIdx]}
            </div>
            {row.map((hand) => {
              const stats = data.get(hand.name)
              const hasData = stats && stats.total > 0
              return (
                <div
                  key={hand.name}
                  className={cn(
                    'aspect-square flex flex-col items-center justify-center rounded-[2px]',
                    'text-[8px] sm:text-[10px] font-semibold tracking-tight',
                    hasData ? accuracyColor(stats.accuracy) : 'bg-muted',
                    hasData ? accuracyTextColor(stats.accuracy) : 'text-muted-foreground/50',
                  )}
                  title={
                    hasData
                      ? `${hand.name}: ${stats.accuracy}% (${stats.correct}/${stats.total})`
                      : `${hand.name}: no data`
                  }
                >
                  <span>{hand.name}</span>
                  {hasData && (
                    <span className="text-[6px] sm:text-[7px] opacity-80">{stats.accuracy}%</span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
})
