import { cn } from '@/lib/utils'
import { ACTION_COLORS } from '@/constants/poker'
import { SCENARIOS } from '@/types/poker'

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

function scenarioLabel(id: string): string {
  return SCENARIOS.find((s) => s.id === id)?.label ?? id
}

export function HandBrowserRow({ result, isExpanded, onToggle }: HandBrowserRowProps) {
  const timeSec = (result.decisionTimeMs / 1000).toFixed(1)

  return (
    <div
      className={cn(
        'border-b border-neutral-800/50 cursor-pointer transition-colors hover:bg-neutral-800/30',
        isExpanded && 'bg-neutral-800/20',
      )}
      onClick={onToggle}
    >
      <div className="flex items-center gap-3 px-3 py-2 text-sm">
        {/* Correct/wrong indicator */}
        <div
          className={cn(
            'w-2 h-2 rounded-full shrink-0',
            result.isCorrect ? 'bg-emerald-500' : 'bg-rose-500',
          )}
        />

        {/* Hand */}
        <span className="font-mono font-semibold text-white w-10">{result.heroHand}</span>

        {/* Position + scenario */}
        <span className="text-neutral-400 w-32 truncate">
          {result.hero} {scenarioLabel(result.scenario)}
          {result.villain && <span className="text-neutral-600"> vs {result.villain}</span>}
        </span>

        {/* Actions comparison */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', ACTION_COLORS[result.userAction], 'text-white')}>
            {result.userAction}
          </span>
          {!result.isCorrect && (
            <>
              <span className="text-neutral-600 text-xs">→</span>
              <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', ACTION_COLORS[result.correctAction], 'text-white')}>
                {result.correctAction}
              </span>
            </>
          )}
        </div>

        {/* Decision time */}
        <span className="text-neutral-600 text-xs tabular-nums w-10 text-right">{timeSec}s</span>

        {/* Timestamp */}
        <span className="text-neutral-600 text-xs w-28 text-right hidden sm:block">
          {formatTime(result.timestamp)}
        </span>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 text-xs text-neutral-400 space-y-1">
          <div>Roll: {result.rolledNumber} | EV loss: {result.evLossEstimate.toFixed(2)}bb | Quality: {result.qualityScore}/5</div>
          <div>Provider: {result.provider}</div>
        </div>
      )}
    </div>
  )
}
