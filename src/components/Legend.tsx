import { cn } from '@/lib/utils'
import { ACTION_COLORS } from '@/constants/poker'

const LEGEND_ITEMS = [
  { label: 'Raise', color: ACTION_COLORS.raise },
  { label: 'Call', color: ACTION_COLORS.call },
  { label: 'All-in', color: ACTION_COLORS.allin },
  { label: 'Fold', color: ACTION_COLORS.fold },
]

export function Legend() {
  return (
    <div className="flex items-center justify-center gap-6 py-2">
      {LEGEND_ITEMS.map(({ label, color }) => (
        <div key={label} className="flex items-center gap-2">
          <div className={cn('w-4 h-4 rounded-sm', color)} aria-hidden="true" />
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
        </div>
      ))}
      {/* Mixed example: 70% weight, raise 60% / call 40% - bands from bottom */}
      <div className="flex items-center gap-2">
        <div className={cn('w-4 h-4 rounded-sm overflow-hidden relative', ACTION_COLORS.fold)}>
          <div className={cn('absolute bottom-0 left-0 w-[60%] h-[70%]', ACTION_COLORS.raise)} />
          <div className={cn('absolute bottom-0 left-[60%] w-[40%] h-[70%]', ACTION_COLORS.call)} />
        </div>
        <span className="text-xs text-muted-foreground font-medium">Mixed</span>
      </div>
    </div>
  )
}
