import { cn } from '@/lib/utils'
import { ACTION_COLORS } from '@/constants/poker'
import { normalizeCell, getSortedActions } from '@/types/poker'
import { actionLabel } from '@/lib/poker-glossary'
import { Button } from '@/components/ui/button'

import { StrategyBar } from './StrategyBar'
import type { Spot, SpotResult } from '@/features/trainer/types'
import { generateFeedback } from '@/features/trainer/lib/feedback-engine'
import { getHandFriendlyName } from '@/features/trainer/lib/hand-strength'

interface FeedbackViewProps {
  spot: Spot
  result: SpotResult
  onNext: () => void
}

/** Check if the cell has a pure (single-action) strategy. */
function isPureStrategy(spot: Spot): boolean {
  const { actions } = normalizeCell(spot.cell)
  const sorted = getSortedActions(actions)
  return sorted.length === 1
}

export function FeedbackView({ spot, result, onNext }: FeedbackViewProps) {
  const pure = isPureStrategy(spot)
  const feedback = generateFeedback(spot, result)
  const handName = getHandFriendlyName(spot.heroHand)

  return (
    <div className="flex flex-col gap-4">
      {/* Correct / Incorrect banner */}
      <div
        className={cn(
          'rounded-lg px-5 py-4 text-center text-lg font-bold transition-all',
          result.isCorrect
            ? 'bg-correct/20 text-correct animate-in zoom-in-95 duration-200'
            : 'bg-incorrect/20 text-incorrect animate-in slide-in-from-left-1 duration-150',
        )}
      >
        {feedback.headline}
      </div>

      {/* Action comparison */}
      <div className="flex items-center justify-center gap-8 text-base">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-sm text-foreground/70">You chose</span>
          <span
            className={cn(
              'rounded-lg px-4 py-1.5 text-base font-semibold text-white',
              ACTION_COLORS[result.userAction],
            )}
          >
            {actionLabel(result.userAction)}
          </span>
        </div>
        <div className="text-foreground/60 text-lg">vs</div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-sm text-foreground/70">Correct play</span>
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

      {/* Hand strength context */}
      <div className="rounded-lg bg-secondary/50 px-4 py-3">
        <p className="text-sm font-medium text-foreground/90">
          <span className="capitalize">{handName}</span>
          {' — '}
          {feedback.handContext.replace(/^[^—]*—\s*/, '').replace(/^[A-Z][^.]*is\s/, '')}
        </p>
      </div>

      {/* Position + reasoning */}
      <div className="space-y-2 text-sm text-foreground/90">
        <p>{feedback.positionContext}</p>
        <p>{feedback.reasoning}</p>
      </div>

      {/* Strategy explanation — pure vs mixed */}
      {pure ? (
        <p className="text-sm text-foreground/70 text-center italic">
          This hand always {actionLabel(spot.correctAction).toLowerCase()}s in this spot.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground/70">Mixed strategy:</span>
          <StrategyBar cell={spot.cell} rolledNumber={spot.rolledNumber} />
        </div>
      )}

      {/* Tip / takeaway */}
      <div className="rounded-lg border border-brass/20 bg-brass/5 px-4 py-3">
        <p className="text-sm text-foreground/85">
          <span className="font-semibold text-brass">Tip:</span> {feedback.tip}
        </p>
      </div>

      {/* Next hand button */}
      <Button onClick={onNext} size="lg" className="w-full text-lg h-14">
        Next Hand
        <kbd className="ml-2 rounded-sm bg-black/20 px-2 py-0.5 text-sm font-mono">Space</kbd>
      </Button>
    </div>
  )
}
