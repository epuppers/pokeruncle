import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { PostflopAction, PostflopSpot, PostflopSpotResult } from '../types'
import { POSTFLOP_ACTION_LABELS } from '../types'
import { generatePostflopFeedback } from '../lib/feedback-engine'
import { PostflopTableView } from './PostflopTableView'

interface PostflopFeedbackViewProps {
  spot: PostflopSpot
  result: PostflopSpotResult
  onNext: () => void
}

/** Sort actions by frequency (highest first) */
function sortedStrategy(strategy: Partial<Record<PostflopAction, number>>): [PostflopAction, number][] {
  return (Object.entries(strategy) as [PostflopAction, number][])
    .filter(([, freq]) => freq > 0)
    .sort(([, a], [, b]) => b - a)
}

export function PostflopFeedbackView({ spot, result, onNext }: PostflopFeedbackViewProps) {
  const feedback = useMemo(() => generatePostflopFeedback(spot, result), [spot, result])
  const sorted = sortedStrategy(spot.correctStrategy)

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      <PostflopTableView spot={spot} />

      {/* Result banner */}
      <div className="flex flex-col items-center gap-1">
        <h2 className={cn(
          'text-2xl font-display font-bold',
          result.isCorrect ? 'text-emerald-400' : 'text-amber-400',
        )}>
          {feedback.headline}
        </h2>
        <p className="text-sm text-muted-foreground">
          You chose <span className="font-semibold text-foreground">{POSTFLOP_ACTION_LABELS[result.userAction]}</span>
          {!result.isCorrect && (
            <> — correct was <span className="font-semibold text-brass">{POSTFLOP_ACTION_LABELS[spot.correctAction]}</span></>
          )}
        </p>
      </div>

      {/* Strategy distribution */}
      <div className="rounded-lg bg-secondary/50 border border-border/50 p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Solver Strategy
        </h3>
        <div className="flex flex-col gap-1.5">
          {sorted.map(([action, freq]) => {
            const isUserAction = action === result.userAction
            const isCorrectAction = action === spot.correctAction
            return (
              <div key={action} className="flex items-center gap-2">
                <span className={cn(
                  'text-sm w-24 truncate',
                  isCorrectAction && 'font-semibold text-brass',
                  isUserAction && !isCorrectAction && 'text-muted-foreground line-through',
                )}>
                  {POSTFLOP_ACTION_LABELS[action]}
                </span>
                <div className="flex-1 h-5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      isCorrectAction ? 'bg-brass/60' : 'bg-muted-foreground/20',
                    )}
                    style={{ width: `${freq}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground w-10 text-right">
                  {freq}%
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Teaching feedback */}
      <div className="rounded-lg bg-secondary/30 border border-border/30 p-4 space-y-3">
        <p className="text-sm text-foreground/90">{feedback.handContext}</p>
        <p className="text-sm text-foreground/80">{feedback.boardContext}</p>
        <p className="text-sm text-foreground/80">{feedback.positionContext}</p>
        <p className="text-sm text-foreground/90 font-medium">{feedback.reasoning}</p>
        <p className="text-xs text-brass/80 italic">{feedback.tip}</p>
      </div>

      {/* Next button */}
      <Button
        variant="outline"
        className="h-12 text-base"
        onClick={onNext}
      >
        Next Spot
        <kbd className="ml-2 rounded-sm bg-black/20 px-1.5 py-0.5 text-xs font-mono">
          Space
        </kbd>
      </Button>
    </div>
  )
}
