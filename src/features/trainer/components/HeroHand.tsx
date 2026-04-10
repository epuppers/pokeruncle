import { cn } from '@/lib/utils'
import type { Card } from '@/types/poker'

import { PlayingCard } from './PlayingCard'

interface HeroHandProps {
  cards: [Card, Card]
  /** When true, cards animate in with a dealing effect */
  animate?: boolean
}

/**
 * Displays the hero's two hole cards side by side, slightly overlapping.
 * The visual focal point of the poker table.
 */
export function HeroHand({ cards, animate }: HeroHandProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="flex -space-x-4 sm:-space-x-5">
        <PlayingCard
          card={cards[0]}
          className={cn(
            '-rotate-6 hover:rotate-0 transition-transform',
            animate ? 'opacity-0 animate-[dealCard_0.4s_ease-out_forwards]' : 'opacity-100',
          )}
        />
        <PlayingCard
          card={cards[1]}
          className={cn(
            'rotate-6 hover:rotate-0 transition-transform',
            animate ? 'opacity-0 animate-[dealCard_0.4s_ease-out_0.15s_forwards]' : 'opacity-100',
          )}
        />
      </div>
    </div>
  )
}
