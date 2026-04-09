import { cn } from '@/lib/utils'

import type { LeakNarrative } from '../types'

const SEVERITY_STYLES: Record<LeakNarrative['severity'], { border: string; text: string }> = {
  critical: { border: 'border-rose-700/50', text: 'text-rose-300' },
  warning: { border: 'border-amber-700/50', text: 'text-amber-300' },
  info: { border: 'border-sky-700/50', text: 'text-sky-300' },
}

interface LeakNarrativesListProps {
  narratives: LeakNarrative[]
}

export function LeakNarrativesList({ narratives }: LeakNarrativesListProps) {
  if (narratives.length === 0) {
    return (
      <div className="text-neutral-500 text-sm text-center py-4">
        Train at least 10 spots to unlock leak insights.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="font-semibold text-white text-sm">Leak Insights</div>
      {narratives.map((n, i) => {
        const style = SEVERITY_STYLES[n.severity]
        return (
          <div
            key={i}
            className={cn(
              'rounded-md border px-3 py-2 text-sm',
              'bg-neutral-900/50',
              style.border,
              style.text,
            )}
          >
            {n.message}
          </div>
        )
      })}
    </div>
  )
}
