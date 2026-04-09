import type { Card } from '@/types/poker'

import { PlayingCard } from './PlayingCard'

interface HeroHandProps {
  cards: [Card, Card]
}

/**
 * Displays the hero's two hole cards side by side, slightly overlapping.
 * The visual focal point of the poker table.
 */
export function HeroHand({ cards }: HeroHandProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="flex -space-x-4 sm:-space-x-5">
        <PlayingCard card={cards[0]} className="-rotate-6 hover:rotate-0 transition-transform" />
        <PlayingCard card={cards[1]} className="rotate-6 hover:rotate-0 transition-transform" />
      </div>
    </div>
  )
}
