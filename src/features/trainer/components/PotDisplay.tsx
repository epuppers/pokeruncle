import { cn } from '@/lib/utils'

import { formatDollars } from '@/features/trainer/lib/money'

interface PotDisplayProps {
  totalPot: number
  visible: boolean
}

/**
 * Shows the accumulated pot total at the center of the table.
 */
export function PotDisplay({ totalPot, visible }: PotDisplayProps) {
  if (!visible || totalPot <= 0) return null

  return (
    <div
      className={cn(
        'absolute left-1/2 -translate-x-1/2 z-10',
        'top-[30%] -translate-y-1/2',
        'flex items-center gap-1.5 rounded-full',
        'bg-black/40 backdrop-blur-sm px-3 py-1',
        'animate-in fade-in duration-300',
      )}
    >
      {/* Mini chip icon */}
      <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 border border-amber-200 ring-1 ring-inset ring-white/30 shadow-sm" />
      <span className="text-base font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
        Pot: {formatDollars(totalPot)}
      </span>
    </div>
  )
}
