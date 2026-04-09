import type { Card } from '@/types/poker'
import { SUIT_SYMBOLS, SUIT_COLORS } from '@/constants/cards'
import { cn } from '@/lib/utils'

interface PlayingCardProps {
  card: Card
  className?: string
}

/**
 * A visual playing card showing rank and suit.
 * Cream-colored face with colored suit symbols and warm shadow.
 */
export function PlayingCard({ card, className }: PlayingCardProps) {
  const suitColor = SUIT_COLORS[card.suit]
  const symbol = SUIT_SYMBOLS[card.suit]
  const displayRank = card.rank === 'T' ? '10' : card.rank

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center',
        'w-[72px] h-[100px] sm:w-[84px] sm:h-[116px]',
        'rounded-xl bg-gradient-to-br from-amber-50 to-amber-100',
        'border border-amber-200/60',
        'shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.6)]',
        className,
      )}
    >
      {/* Top-left corner: rank + suit */}
      <div className={cn('absolute top-1.5 left-2 flex flex-col items-center leading-none', suitColor)}>
        <span className="text-sm sm:text-base font-bold">{displayRank}</span>
        <span className="text-[10px] sm:text-xs">{symbol}</span>
      </div>

      {/* Center: large suit symbol */}
      <span className={cn('text-3xl sm:text-4xl', suitColor)}>
        {symbol}
      </span>

      {/* Bottom-right corner: rank + suit (rotated) */}
      <div className={cn('absolute bottom-1.5 right-2 flex flex-col items-center leading-none rotate-180', suitColor)}>
        <span className="text-sm sm:text-base font-bold">{displayRank}</span>
        <span className="text-[10px] sm:text-xs">{symbol}</span>
      </div>
    </div>
  )
}
