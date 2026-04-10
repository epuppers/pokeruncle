import { cn } from '@/lib/utils'
import type { Position } from '@/types/poker'

import { POSITION_COORDS } from '@/features/trainer/lib/chip-positions'

interface CardBackProps {
  position: Position
  animate: boolean
  /** When true, cards play the muck-out animation (fold) */
  mucking?: boolean
}

/** Dealer position — cards fly from here */
const DEALER_COORDS = POSITION_COORDS.BTN

/**
 * A face-down card back that appears at a seat when cards are dealt.
 * Animates flying from the dealer (BTN) to the seat position.
 */
export function CardBack({ position, animate, mucking }: CardBackProps) {
  const coords = POSITION_COORDS[position]
  // Offset slightly from the seat badge (above it)
  const y = coords.y - 8

  // Offset from seat to dealer — the card starts at the dealer and flies to the seat
  const fromX = DEALER_COORDS.x - coords.x
  const fromY = DEALER_COORDS.y - y

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 z-[5] pointer-events-none"
      style={{ left: `${coords.x}%`, top: `${y}%` }}
    >
      <div
        className={cn(
          'flex -space-x-3',
          mucking && 'animate-[muckCards_0.5s_ease-in_forwards]',
          !mucking && animate && 'animate-[dealFly_0.45s_cubic-bezier(0.2,0.8,0.3,1)_forwards]',
          !mucking && !animate && 'opacity-100',
        )}
        style={
          !mucking && animate
            ? {
                opacity: 0,
                '--from-x': `${fromX}cqw`,
                '--from-y': `${fromY}cqh`,
                '--deal-rotate': `${fromX > 0 ? -15 : 15}deg`,
              } as React.CSSProperties
            : undefined
        }
      >
        <div className="w-6 h-8 sm:w-7 sm:h-10 rounded bg-gradient-to-br from-rose-700 to-rose-900 border border-rose-600/50 shadow-md -rotate-3" />
        <div className="w-6 h-8 sm:w-7 sm:h-10 rounded bg-gradient-to-br from-rose-700 to-rose-900 border border-rose-600/50 shadow-md rotate-3" />
      </div>
    </div>
  )
}
