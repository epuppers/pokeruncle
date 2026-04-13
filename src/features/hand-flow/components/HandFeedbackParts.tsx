import { useMemo } from 'react'

import { cn } from '@/lib/utils'
import { ACTION_COLORS } from '@/constants/poker'
import { normalizeCell, getSortedActions } from '@/types/poker'
import { actionLabel } from '@/lib/poker-glossary'

import type { PostflopAction } from '@/features/postflop'
import { POSTFLOP_ACTION_LABELS } from '@/features/postflop'
import { generatePostflopFeedback } from '@/features/postflop'
import { StrategyBar } from '@/features/trainer/components/StrategyBar'
import { generateFeedback } from '@/features/trainer/lib/feedback-engine'
import { getHandFriendlyName } from '@/features/trainer/lib/hand-strength'

import type { PostflopSpot, PostflopSpotResult } from '@/features/postflop'
import type { Spot, SpotResult } from '@/features/trainer/types'

interface PreflopFeedbackProps {
  spot: Spot
  result: SpotResult
}

/** Preflop feedback — adapted from FeedbackView, without the "Next Hand" button. */
export function PreflopFeedback({ spot, result }: PreflopFeedbackProps) {
  const pure = isPureStrategy(spot)
  const feedback = generateFeedback(spot, result)
  const handName = getHandFriendlyName(spot.heroHand)

  return (
    <div className="flex flex-col gap-3 animate-in fade-in duration-300">
      {/* Correct / Incorrect banner */}
      <div
        className={cn(
          'rounded-lg px-4 py-3 text-center text-lg font-bold',
          result.isCorrect
            ? 'bg-correct/20 text-correct'
            : 'bg-incorrect/20 text-incorrect',
        )}
      >
        {feedback.headline}
      </div>

      {/* Action comparison */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <ActionPill label="You chose" action={actionLabel(result.userAction)} color={ACTION_COLORS[result.userAction]} />
        <span className="text-foreground/60">vs</span>
        <ActionPill label="Correct play" action={actionLabel(spot.correctAction)} color={ACTION_COLORS[spot.correctAction]} />
      </div>

      {/* Hand context */}
      <div className="rounded-lg bg-secondary/50 px-3 py-2">
        <p className="text-sm text-foreground/90">
          <span className="capitalize">{handName}</span>
          {' — '}
          {feedback.handContext.replace(/^[^—]*—\s*/, '').replace(/^[A-Z][^.]*is\s/, '')}
        </p>
      </div>

      {/* Strategy bar */}
      {pure ? (
        <p className="text-sm text-foreground/70 text-center italic">
          This hand always {actionLabel(spot.correctAction).toLowerCase()}s in this spot.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground/70">Mixed strategy:</span>
          <StrategyBar cell={spot.cell} rolledNumber={spot.rolledNumber} />
        </div>
      )}

      {/* Tip */}
      <div className="rounded-lg border border-brass/20 bg-brass/5 px-3 py-2">
        <p className="text-sm text-foreground/85">
          <span className="font-semibold text-brass">Tip:</span> {feedback.tip}
        </p>
      </div>
    </div>
  )
}

interface FlopFeedbackProps {
  spot: PostflopSpot
  result: PostflopSpotResult
}

/** Flop feedback — adapted from PostflopFeedbackView, without the "Next Spot" button. */
export function FlopFeedback({ spot, result }: FlopFeedbackProps) {
  const feedback = useMemo(() => generatePostflopFeedback(spot, result), [spot, result])
  const sorted = sortedStrategy(spot.correctStrategy)

  return (
    <div className="flex flex-col gap-3 animate-in fade-in duration-300">
      {/* Result banner */}
      <div className="flex flex-col items-center gap-1">
        <h2
          className={cn(
            'text-xl font-display font-bold',
            result.isCorrect ? 'text-correct' : 'text-incorrect',
          )}
        >
          {feedback.headline}
        </h2>
        <p className="text-sm text-muted-foreground">
          You chose{' '}
          <span className="font-semibold text-foreground">
            {POSTFLOP_ACTION_LABELS[result.userAction]}
          </span>
          {!result.isCorrect && (
            <>
              {' — correct was '}
              <span className="font-semibold text-brass">
                {POSTFLOP_ACTION_LABELS[spot.correctAction]}
              </span>
            </>
          )}
        </p>
      </div>

      {/* Strategy distribution */}
      <div className="rounded-lg bg-secondary/50 border border-border/50 p-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Solver Strategy
        </h3>
        <div className="flex flex-col gap-1">
          {sorted.map(([action, freq]) => (
            <div key={action} className="flex items-center gap-2">
              <span
                className={cn(
                  'text-sm w-20 truncate',
                  action === spot.correctAction && 'font-semibold text-brass',
                )}
              >
                {POSTFLOP_ACTION_LABELS[action]}
              </span>
              <div className="flex-1 h-4 rounded-full bg-secondary overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    action === spot.correctAction ? 'bg-brass/60' : 'bg-muted-foreground/20',
                  )}
                  style={{ width: `${freq}%` }}
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground w-10 text-right">
                {freq}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Teaching feedback */}
      <div className="rounded-lg bg-secondary/30 border border-border/30 p-3 space-y-2">
        <p className="text-sm text-foreground/90">{feedback.reasoning}</p>
        <p className="text-xs text-brass/80 italic">{feedback.tip}</p>
      </div>
    </div>
  )
}

// --- Helpers ---

function isPureStrategy(spot: Spot): boolean {
  const { actions } = normalizeCell(spot.cell)
  return getSortedActions(actions).length === 1
}

function ActionPill({ label, action, color }: { label: string; action: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-foreground/70">{label}</span>
      <span className={cn('rounded-lg px-3 py-1 text-sm font-semibold text-white', color)}>
        {action}
      </span>
    </div>
  )
}

function sortedStrategy(
  strategy: Partial<Record<PostflopAction, number>>,
): [PostflopAction, number][] {
  return (Object.entries(strategy) as [PostflopAction, number][])
    .filter(([, freq]) => freq > 0)
    .sort(([, a], [, b]) => b - a)
}
