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

  // Show the narrative of the most recently revealed step
  const currentStep = steps[revealedCount - 1]
  const text = currentStep?.narrative ?? 'A new hand begins...'

  return <NarrativeText key={revealedCount} text={text} />
}

function NarrativeText({ text }: { text: string }) {
  return (
    <p
      className={cn(
        'text-lg font-medium text-foreground/80 text-center',
        'animate-in fade-in duration-300',
      )}
    >
      {text}
    </p>
  )
}
