import type { Cell } from '@/types/poker'
import { normalizeCell, getSortedActions } from '@/types/poker'
import { ACTION_COLORS } from '@/constants/poker'
import { actionLabel } from '@/lib/poker-glossary'
import { cn } from '@/lib/utils'

interface StrategyBarProps {
  cell: Cell
  rolledNumber?: number
}

/** Horizontal bar showing the action frequency distribution from a cell. */
export function StrategyBar({ cell, rolledNumber }: StrategyBarProps) {
  const { actions } = normalizeCell(cell)
  const sorted = getSortedActions(actions)

  return (
    <div className="w-full">
      <div className="relative flex h-12 w-full overflow-hidden rounded-lg">
        {sorted.map(([action, freq]) => (
          <div
            key={action}
            className={cn(
              ACTION_COLORS[action],
              'flex items-center justify-center text-sm font-semibold text-white',
            )}
            style={{ width: `${freq}%` }}
          >
            {freq >= 15 && (
              <span>
                {actionLabel(action)} {freq}%
              </span>
            )}
          </div>
        ))}
        {rolledNumber !== undefined && (
          <div
            className="absolute top-0 bottom-0 flex flex-col items-center"
            style={{ left: `${rolledNumber}%` }}
          >
            <div className="w-1 flex-1 -translate-x-1/2 rounded-full bg-brass shadow-[0_0_8px_var(--color-brass)]" />
            <div className="absolute -bottom-5 -translate-x-1/2 text-xs font-bold text-brass tabular-nums">
              {rolledNumber}
            </div>
          </div>
        )}
      </div>
      <div className="mt-6 flex gap-4 text-sm text-muted-foreground">
        {sorted.map(([action, freq]) => (
          <span key={action}>
            {actionLabel(action)}: {freq}%
          </span>
        ))}
      </div>
    </div>
  )
}
