import { cn } from '@/lib/utils'
import { ACTION_COLORS } from '@/constants/poker'
import { actionLabel, positionLabel, scenarioLabel } from '@/lib/poker-glossary'

import type { EnrichedSpotResult } from '../types'

interface HandBrowserRowProps {
  result: EnrichedSpotResult
  isExpanded: boolean
  onToggle: () => void
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export function HandBrowserRow({ result, isExpanded, onToggle }: HandBrowserRowProps) {
  const timeSec = (result.decisionTimeMs / 1000).toFixed(1)

  return (
    <div
      className={cn(
        'border-b border-border/50 cursor-pointer transition-colors hover:bg-secondary/30',
        isExpanded && 'bg-secondary/20',
      )}
      onClick={onToggle}
    >
      <div className="flex items-center gap-3 px-3 py-2 text-sm">
        {/* Correct/wrong indicator */}
        <div
          className={cn(
            'w-2 h-2 rounded-full shrink-0',
            result.isCorrect ? 'bg-correct' : 'bg-incorrect',
          )}
        />

        {/* Hand */}
        <span className="font-mono font-semibold text-foreground w-10">{result.heroHand}</span>

        {/* Position + scenario */}
        <span className="text-muted-foreground w-40 truncate">
          {positionLabel(result.hero)} {scenarioLabel(result.scenario)}
          {result.villain && <span className="opacity-60"> vs {positionLabel(result.villain)}</span>}
        </span>

        {/* Actions comparison */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', ACTION_COLORS[result.userAction], 'text-white')}>
            {actionLabel(result.userAction)}
          </span>
          {!result.isCorrect && (
            <>
              <span className="text-muted-foreground/50 text-xs">&rarr;</span>
              <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', ACTION_COLORS[result.correctAction], 'text-white')}>
                {actionLabel(result.correctAction)}
              </span>
            </>
          )}
        </div>

        {/* Decision time */}
        <span className="text-muted-foreground/60 text-xs tabular-nums w-10 text-right">{timeSec}s</span>

        {/* Timestamp */}
        <span className="text-muted-foreground/60 text-xs w-28 text-right hidden sm:block">
          {formatTime(result.timestamp)}
        </span>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 text-xs text-muted-foreground space-y-1">
          <div>Roll: {result.rolledNumber} | Mistake cost: {result.evLossEstimate.toFixed(2)} bets | Score: {result.qualityScore}/5</div>
          <div>Chart pack: {result.provider}</div>
        </div>
      )}
    </div>
  )
}
