import { cn } from '@/lib/utils'
import { ACTION_COLORS } from '@/constants/poker'

interface StrategyExplainerProps {
  /** The roll position to highlight (1-100) */
  rollNumber: number
}

const EXAMPLE_BANDS: { action: string; label: string; width: number; color: string }[] = [
  { action: 'raise', label: 'Raise', width: 60, color: ACTION_COLORS.raise },
  { action: 'fold', label: 'Fold', width: 40, color: ACTION_COLORS.fold },
]

/**
 * Visual explanation of the RNG/mixed-strategy mechanic.
 * Shows a strategy bar with labeled zones and a roll marker.
 */
export function StrategyExplainer({ rollNumber }: StrategyExplainerProps) {
  const correctAction = rollNumber <= 60 ? 'Raise' : 'Fold'

  return (
    <div className="space-y-3">
      {/* The bar */}
      <div className="relative flex h-12 w-full overflow-hidden rounded-lg">
        {EXAMPLE_BANDS.map((band) => (
          <div
            key={band.action}
            className={cn(
              band.color,
              'flex items-center justify-center text-sm font-medium text-white',
            )}
            style={{ width: `${band.width}%` }}
          >
            {band.label} {band.width}%
          </div>
        ))}
        {/* Roll marker */}
        <div
          className="absolute top-0 bottom-0 w-1 -translate-x-1/2 rounded-full bg-brass shadow-[0_0_8px_var(--color-brass)]"
          style={{ left: `${rollNumber}%` }}
        />
      </div>

      {/* Explanation */}
      <p className="text-sm text-muted-foreground text-center">
        Your number is <span className="text-brass font-bold">{rollNumber}</span>.
        Since <span className="font-medium text-foreground">Raise</span> covers 1-60%
        and <span className="font-medium text-foreground">Fold</span> covers 61-100%,
        the correct play this time is <span className="font-medium text-foreground">{correctAction}</span>.
      </p>
    </div>
  )
}
