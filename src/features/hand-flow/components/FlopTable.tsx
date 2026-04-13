import { cn } from '@/lib/utils'

import { BoardDisplay } from '@/features/postflop/components/BoardDisplay'
import { HeroHand } from '@/features/trainer/components/HeroHand'

import type { HandContinuation } from '@/features/trainer/types'

interface FlopTableProps {
  continuation: HandContinuation
}

/**
 * Simplified 2-player flop table view.
 * Shows board cards, hero hand, position labels, and pot/stack info.
 */
export function FlopTable({ continuation }: FlopTableProps) {
  const { postflopSpot } = continuation
  const heroLabel = postflopSpot.heroIsIP
    ? `${postflopSpot.hero} (IP)`
    : `${postflopSpot.hero} (OOP)`
  const villainLabel = postflopSpot.heroIsIP
    ? `${postflopSpot.villain} (OOP)`
    : `${postflopSpot.villain} (IP)`

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={cn(
          'relative w-full max-w-2xl aspect-[3/2] rounded-[40%]',
          'ring-4 ring-wood',
          'bg-[radial-gradient(ellipse_at_center,var(--color-felt-light),var(--color-felt))]',
          'shadow-[inset_0_2px_20px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.3)]',
          'flex flex-col items-center justify-center gap-3',
        )}
      >
        {/* Villain label (top) */}
        <div className="absolute top-[12%] left-1/2 -translate-x-1/2">
          <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-xs font-semibold text-rose-300 border border-rose-500/30">
            {villainLabel}
          </span>
        </div>

        {/* Pot and stack info */}
        <div className="flex items-center gap-3 rounded-full bg-black/40 backdrop-blur-sm px-3 py-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 border border-amber-200 ring-1 ring-inset ring-white/30 shadow-sm" />
            <span className="text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
              Pot: {postflopSpot.potSizeBB.toFixed(1)}bb
            </span>
          </div>
          <span className="text-foreground/30">|</span>
          <span className="text-xs text-foreground/60">
            Stacks: {postflopSpot.effectiveStackBB.toFixed(0)}bb
          </span>
          <span className="text-foreground/30">|</span>
          <span className="text-xs text-foreground/60 capitalize">
            {postflopSpot.potType === '3bet' ? '3-Bet Pot' : 'Single Raised'}
          </span>
        </div>

        {/* Board cards */}
        <BoardDisplay
          board={postflopSpot.board}
          className="animate-in fade-in zoom-in-95 duration-500"
        />

        {/* Hero cards */}
        <HeroHand cards={[postflopSpot.heroCards[0], postflopSpot.heroCards[1]]} />

        {/* Hero label (bottom) */}
        <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2">
          <span className="px-2.5 py-1 rounded-md bg-brass/20 text-xs font-semibold text-brass border border-brass/30">
            {heroLabel} — You
          </span>
        </div>
      </div>
    </div>
  )
}
