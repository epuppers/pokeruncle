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
      <div className="relative flex h-10 w-full overflow-hidden rounded-lg">
        {sorted.map(([action, freq]) => (
          <div
            key={action}
            className={cn(
              ACTION_COLORS[action],
              'flex items-center justify-center text-xs font-medium text-white',
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
            className="absolute top-0 bottom-0 w-1 -translate-x-1/2 rounded-full bg-brass shadow-[0_0_6px_var(--color-brass)]"
            style={{ left: `${rolledNumber}%` }}
            aria-label={`Roll: ${rolledNumber}`}
          />
        )}
      </div>
      <div className="mt-1.5 flex gap-3 text-xs text-muted-foreground">
        {sorted.map(([action, freq]) => (
          <span key={action}>
            {actionLabel(action)}: {freq}%
          </span>
        ))}
      </div>
    </div>
  )
}
