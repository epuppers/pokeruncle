import { cn } from '@/lib/utils'
import { ACTION_COLORS } from '@/constants/poker'
import { normalizeCell, getSortedActions } from '@/types/poker'
import { actionLabel, positionLabel } from '@/lib/poker-glossary'
import { Button } from '@/components/ui/button'

import { StrategyBar } from './StrategyBar'
import type { Spot, SpotResult } from '@/features/trainer/types'

interface FeedbackViewProps {
  spot: Spot
  result: SpotResult
  onNext: () => void
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

/** Check if the cell has a pure (single-action) strategy. */
function isPureStrategy(spot: Spot): boolean {
  const { actions } = normalizeCell(spot.cell)
  const sorted = getSortedActions(actions)
  return sorted.length === 1
}

export function FeedbackView({ spot, result, onNext }: FeedbackViewProps) {
  const pure = isPureStrategy(spot)

  return (
    <div className="flex flex-col gap-5">
      {/* Correct / Incorrect banner */}
      <div
        className={cn(
          'rounded-lg px-5 py-4 text-center text-lg font-bold transition-all',
          result.isCorrect
            ? 'bg-correct/20 text-correct animate-in zoom-in-95 duration-200'
            : 'bg-incorrect/20 text-incorrect animate-in slide-in-from-left-1 duration-150',
        )}
      >
        {result.isCorrect ? 'Correct!' : 'Incorrect'}
      </div>

      {/* Action comparison */}
      <div className="flex items-center justify-center gap-8 text-base">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-sm text-muted-foreground">You chose</span>
          <span
            className={cn(
              'rounded-lg px-4 py-1.5 text-base font-semibold text-white',
              ACTION_COLORS[result.userAction],
            )}
          >
            {actionLabel(result.userAction)}
          </span>
        </div>
        <div className="text-muted-foreground text-lg">vs</div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-sm text-muted-foreground">Correct play</span>
          <span
            className={cn(
              'rounded-lg px-4 py-1.5 text-base font-semibold text-white',
              ACTION_COLORS[spot.correctAction],
            )}
          >
            {actionLabel(spot.correctAction)}
          </span>
        </div>
      </div>

      {/* Strategy explanation — pure vs mixed */}
      {pure ? (
        <p className="text-base text-foreground/80 text-center">
          This hand always <span className="font-semibold">{actionLabel(spot.correctAction).toLowerCase()}s</span> in this spot.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">This hand uses a mixed strategy:</span>
          <StrategyBar cell={spot.cell} rolledNumber={spot.rolledNumber} />
          <p className="text-sm text-muted-foreground">
            The correct play this time was <span className="font-semibold text-foreground">{actionLabel(spot.correctAction)}</span>.
          </p>
        </div>
      )}

      {/* Explanation */}
      <p className="text-base text-foreground/80">{getExplanation(spot)}</p>

      {/* Prominent next hand button */}
      <Button onClick={onNext} size="lg" className="w-full text-lg h-14">
        Next Hand
        <kbd className="ml-2 rounded-sm bg-black/20 px-2 py-0.5 text-sm font-mono">Space</kbd>
      </Button>
    </div>
  )
}
