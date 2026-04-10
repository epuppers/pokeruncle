import type { Card } from '@/types/poker'
import { PlayingCard } from '@/features/trainer/components/PlayingCard'
import { cn } from '@/lib/utils'

interface BoardDisplayProps {
  board: readonly Card[]
  className?: string
}

/**
 * Renders community cards (3 for flop, 4 for turn, 5 for river)
 * in a horizontal row with spacing.
 */
export function BoardDisplay({ board, className }: BoardDisplayProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      {board.map((card, i) => (
        <PlayingCard key={`${card.rank}${card.suit}-${i}`} card={card} />
      ))}
    </div>
  )
}
