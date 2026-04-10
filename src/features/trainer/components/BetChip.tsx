import { cn } from '@/lib/utils'
import type { Position } from '@/types/poker'

import { getChipPosition, getChipColor, getChipCount, POSITION_COORDS } from '@/features/trainer/lib/chip-positions'
import type { DealingStep } from '@/features/trainer/lib/action-sequence'
import { formatDollars } from '@/features/trainer/lib/money'

interface BetChipProps {
  position: Position
  amount: number
  style: DealingStep['style']
  /** Whether to animate the chip sliding in */
  animate: boolean
}

/**
 * A poker chip visual that appears in front of a player's seat,
 * pushed toward the center of the table.
 */
export function BetChip({ position, amount, style, animate }: BetChipProps) {
  if (amount <= 0) return null

  const chip = getChipPosition(position)
  const seat = POSITION_COORDS[position]
  const chipCount = getChipCount(amount)
  const colorClass = getChipColor(style, amount)

  // Offset from chip position to seat position (for slide animation origin)
  const offsetX = seat.x - chip.x
  const offsetY = seat.y - chip.y

  return (
    <div
      className={cn(
        'absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none',
        'flex flex-col items-center gap-0',
        animate ? 'animate-[chipSlide_0.35s_ease-out_forwards]' : 'opacity-100',
      )}
      style={{
        left: `${chip.x}%`,
        top: `${chip.y}%`,
        ...(animate
          ? {
              '--from-x': `${offsetX}cqw`,
              '--from-y': `${offsetY}cqh`,
            } as React.CSSProperties
          : {}),
      }}
    >
      {/* Chip stack */}
      <div className="relative">
        {Array.from({ length: chipCount }, (_, i) => (
          <div
            key={i}
            className={cn(
              'w-5 h-5 rounded-full border-2 shadow-md',
              'ring-1 ring-inset ring-white/30',
              colorClass,
              i > 0 && '-mt-3',
            )}
          />
        ))}
      </div>
      {/* Dollar label */}
      <span className="text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mt-0.5">
        {formatDollars(amount)}
      </span>
    </div>
  )
}
