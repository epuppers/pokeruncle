import { cn } from '@/lib/utils'
import { ACTION_COLORS } from '@/constants/poker'
import { actionLabel, positionLabel } from '@/lib/poker-glossary'

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

  const villainStr = spot.kind === 'response' ? ` against ${positionLabel(spot.villain)}` : ''
  const base = `${spot.heroHand} from ${positionLabel(spot.hero)}${villainStr}`

  switch (spot.correctAction) {
    case 'raise':
      if (spot.scenario === 'RFI') return `${base}: This hand is strong enough to raise with as the first bettor.`
      if (spot.scenario === 'vs-open') return `${base}: This hand plays well as a re-raise here.`
      return `${base}: Keep the pressure on with a raise.`
    case 'call':
      if (spot.scenario === 'vs-open') return `${base}: Call and play the hand after the community cards come out.`
      if (spot.scenario === 'vs-3bet') return `${base}: Call the re-raise and see the flop.`
      return `${base}: Call and see what the board brings.`
    case 'fold':
      return `${base}: This hand isn't strong enough to continue.`
    case 'allin':
      return `${base}: Go all-in for maximum pressure.`
  }
}

function getPushFoldExplanation(spot: Spot & { kind: 'push-fold' }): string {
  const villainStr = spot.villain ? ` against ${positionLabel(spot.villain)}` : ''
  const base = `${spot.heroHand} from ${positionLabel(spot.hero)}${villainStr} at ${spot.stackDepth} big blinds`

  if (spot.scenario === 'push') {
    if (spot.correctAction === 'allin') {
      return `${base}: Go all-in. With a short stack, this hand has enough strength to push profitably.`
    }
    return `${base}: Fold. This hand isn't strong enough to risk your stack.`
  }

  if (spot.correctAction === 'call') {
    return `${base}: Call the all-in. Your hand is strong enough against the range of hands they would push with.`
  }
  return `${base}: Fold. Not strong enough to call an all-in here.`
}

function getRollExplanation(spot: Spot): string {
  const { rolledNumber, correctAction } = spot
  return `Your number was ${rolledNumber}. Based on the strategy bands below, the correct play this time is ${actionLabel(correctAction)}.`
}

export function FeedbackView({ spot, result }: FeedbackViewProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Correct / Incorrect banner */}
      <div
        className={cn(
          'rounded-lg px-4 py-3 text-center font-semibold transition-all',
          result.isCorrect
            ? 'bg-correct/20 text-correct animate-in zoom-in-95 duration-200'
            : 'bg-incorrect/20 text-incorrect animate-in slide-in-from-left-1 duration-150',
        )}
      >
        {result.isCorrect ? 'Correct!' : 'Incorrect'}
      </div>

      {/* Action comparison */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex flex-col items-center gap-1">
          <span className="text-muted-foreground">Your action</span>
          <span
            className={cn(
              'rounded px-3 py-1 text-sm font-medium text-white',
              ACTION_COLORS[result.userAction],
            )}
          >
            {actionLabel(result.userAction)}
          </span>
        </div>
        <div className="text-muted-foreground">vs</div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-muted-foreground">Correct action</span>
          <span
            className={cn(
              'rounded px-3 py-1 text-sm font-medium text-white',
              ACTION_COLORS[spot.correctAction],
            )}
          >
            {actionLabel(spot.correctAction)}
          </span>
        </div>
      </div>

      {/* Strategy distribution */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">How to play this hand</span>
        <StrategyBar cell={spot.cell} rolledNumber={spot.rolledNumber} />
      </div>

      {/* Roll explanation */}
      <p className="text-xs text-muted-foreground">{getRollExplanation(spot)}</p>

      {/* Explanation */}
      <p className="text-sm text-foreground/80">{getExplanation(spot)}</p>

      {/* Next spot prompt */}
      <p className="text-center text-xs text-muted-foreground">
        Press <kbd className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono shadow-[0_1px_0_rgba(0,0,0,0.3)]">Space</kbd> for next hand
      </p>
    </div>
  )
}
