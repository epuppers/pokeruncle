import { PlayingCard } from '@/features/trainer/components/PlayingCard'
import { cn } from '@/lib/utils'

import type { PostflopSpot } from '../types'
import { describeTexture } from '../lib/board-texture'
import { BoardDisplay } from './BoardDisplay'

interface PostflopTableViewProps {
  spot: PostflopSpot
}

/**
 * Simplified 2-player postflop table view.
 * Shows board cards, hero hand, pot/stack info, and board texture.
 */
export function PostflopTableView({ spot }: PostflopTableViewProps) {
  const textureDescription = describeTexture(spot.boardTexture)
  const heroLabel = spot.heroIsIP ? `${spot.hero} (IP)` : `${spot.hero} (OOP)`
  const villainLabel = spot.heroIsIP ? `${spot.villain} (OOP)` : `${spot.villain} (IP)`

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Felt table */}
      <div
        className={cn(
          'relative w-full max-w-xl aspect-[5/3] rounded-[30%/50%]',
          'bg-gradient-to-b from-emerald-900/80 to-emerald-950/90',
          'border-2 border-amber-800/40',
          'shadow-[inset_0_4px_20px_rgba(0,0,0,0.5),0_8px_32px_rgba(0,0,0,0.4)]',
          'flex flex-col items-center justify-center gap-3 p-6',
        )}
      >
        {/* Villain position label (top) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <span className="px-2.5 py-1 rounded-md bg-black/30 text-xs font-medium text-amber-200/80 border border-amber-700/20">
            {villainLabel}
          </span>
        </div>

        {/* Pot and stack info */}
        <div className="flex items-center gap-4 text-xs text-amber-200/70">
          <span>Pot: {spot.potSizeBB.toFixed(1)}bb</span>
          <span className="text-amber-700/40">|</span>
          <span>Stacks: {spot.effectiveStackBB.toFixed(0)}bb</span>
          <span className="text-amber-700/40">|</span>
          <span className="capitalize">{spot.potType === '3bet' ? '3-Bet Pot' : 'Single Raised'}</span>
        </div>

        {/* Board cards */}
        <BoardDisplay board={spot.board} />

        {/* Board texture */}
        <div className="text-xs text-amber-200/50 font-medium">
          {textureDescription} {spot.street}
        </div>

        {/* Hero position label (bottom) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <span className="px-2.5 py-1 rounded-md bg-brass/20 text-xs font-semibold text-brass border border-brass/30">
            {heroLabel} — You
          </span>
        </div>
      </div>

      {/* Hero hand — displayed below the table */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <PlayingCard card={spot.heroCards[0]} />
          <PlayingCard card={spot.heroCards[1]} />
        </div>
        <span className="text-sm font-semibold text-brass">
          {spot.heroHand}
        </span>
      </div>

      {/* Roll number */}
      <div className="text-center text-sm text-muted-foreground">
        You rolled: <span className="font-mono font-bold text-foreground">{spot.rolledNumber}</span>
      </div>
    </div>
  )
}
