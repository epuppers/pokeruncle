import { cn } from '@/lib/utils'
import { ACTION_COLORS } from '@/constants/poker'

import { StrategyBar } from './StrategyBar'
import type { Spot, SpotResult } from '@/features/trainer/types'

interface FeedbackViewProps {
  spot: Spot
  result: SpotResult
}

function getExplanation(spot: Spot): string {
  if (spot.kind === 'push-fold') {
    return getPushFoldExplanation(spot)
  }

  const villain = spot.kind === 'response' ? ` vs ${spot.villain}` : ''
  const base = `${spot.heroHand} from ${spot.hero}${villain}`

  switch (spot.correctAction) {
    case 'raise':
      if (spot.scenario === 'RFI') return `${base}: this hand is in your opening range.`
      if (spot.scenario === 'vs-open') return `${base}: this hand plays well as a 3-bet.`
      return `${base}: continue aggressively.`
    case 'call':
      if (spot.scenario === 'vs-open') return `${base}: flat-call to realize equity postflop.`
      if (spot.scenario === 'vs-3bet') return `${base}: call the 3-bet and play postflop.`
      return `${base}: call and see a flop.`
    case 'fold':
      return `${base}: not strong enough to continue.`
    case 'allin':
      return `${base}: push all-in for maximum pressure.`
  }
}

function getPushFoldExplanation(spot: Spot & { kind: 'push-fold' }): string {
  const villainStr = spot.villain ? ` vs ${spot.villain}` : ''
  const base = `${spot.heroHand} from ${spot.hero}${villainStr} at ${spot.stackDepth}bb`

  if (spot.scenario === 'push') {
    if (spot.correctAction === 'allin') {
      return `${base}: push all-in. At ${spot.stackDepth}bb, this hand has enough equity to shove profitably.`
    }
    return `${base}: fold. Not enough equity to push profitably at this stack depth.`
  }

  // vs-push
  if (spot.correctAction === 'call') {
    return `${base}: call the push. Your hand has sufficient equity against the pushing range.`
  }
  return `${base}: fold. Not enough equity to profitably call this push.`
}

export function FeedbackView({ spot, result }: FeedbackViewProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Correct / Incorrect banner */}
      <div
        className={cn(
          'rounded-lg px-4 py-3 text-center font-semibold',
          result.isCorrect
            ? 'bg-emerald-900/40 text-emerald-300'
            : 'bg-rose-900/40 text-rose-300',
        )}
      >
        {result.isCorrect ? 'Correct!' : 'Incorrect'}
      </div>

      {/* Action comparison */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex flex-col items-center gap-1">
          <span className="text-neutral-500">Your action</span>
          <span
            className={cn(
              'rounded px-3 py-1 text-sm font-medium text-white',
              ACTION_COLORS[result.userAction],
            )}
          >
            {result.userAction}
          </span>
        </div>
        <div className="text-neutral-600">vs</div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-neutral-500">Correct action</span>
          <span
            className={cn(
              'rounded px-3 py-1 text-sm font-medium text-white',
              ACTION_COLORS[spot.correctAction],
            )}
          >
            {spot.correctAction}
          </span>
        </div>
      </div>

      {/* Strategy distribution */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-neutral-500">Strategy distribution (roll: {spot.rolledNumber})</span>
        <StrategyBar cell={spot.cell} rolledNumber={spot.rolledNumber} />
      </div>

      {/* Explanation */}
      <p className="text-sm text-neutral-400">{getExplanation(spot)}</p>

      {/* Next spot prompt */}
      <p className="text-center text-xs text-neutral-600">
        Press <kbd className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono">Space</kbd> for next spot
      </p>
    </div>
  )
}
