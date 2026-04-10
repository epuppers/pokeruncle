import { cn } from '@/lib/utils'

import type { DealingStep } from '@/features/trainer/lib/action-sequence'

interface NarrativeLabelProps {
  steps: DealingStep[]
  revealedCount: number
  /** Static label to show when all steps are revealed (feedback phase) */
  fallbackLabel?: string
}

/**
 * Progressive narrative text that updates as the dealing sequence unfolds.
 * Rendered between the table and the action buttons — clear, readable text.
 */
export function NarrativeLabel({ steps, revealedCount, fallbackLabel }: NarrativeLabelProps) {
  // During feedback or when fully revealed, show fallback
  if (revealedCount >= steps.length && fallbackLabel) {
    return <NarrativeText text={fallbackLabel} />
  }

  // Before anything is revealed
  if (revealedCount <= 0) {
    return <NarrativeText text="A new hand begins..." />
  }

  // Show the previous step (dimmed) and the current step
  const currentStep = steps[revealedCount - 1]
  const currentText = currentStep?.narrative ?? 'A new hand begins...'
  const prevStep = revealedCount >= 2 ? steps[revealedCount - 2] : null

  return (
    <div className="flex flex-col items-center gap-0.5">
      {prevStep && (
        <p
          key={`prev-${revealedCount}`}
          className={cn(
            'text-sm text-foreground/70 text-center',
            'animate-in fade-in duration-200',
          )}
        >
          {prevStep.narrative}
        </p>
      )}
      <p
        key={`curr-${revealedCount}`}
        className={cn(
          'text-lg font-semibold text-foreground text-center',
          'animate-in fade-in duration-300',
        )}
      >
        {currentText}
      </p>
    </div>
  )
}

function NarrativeText({ text }: { text: string }) {
  return (
    <p
      className={cn(
        'text-lg font-semibold text-foreground text-center',
        'animate-in fade-in duration-300',
      )}
    >
      {text}
    </p>
  )
}
