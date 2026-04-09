import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface PokerTermProps {
  /** The novice-friendly display text */
  label: string
  /** Tooltip explanation shown on hover/tap */
  tip: string
  /** Optional abbreviated form shown in parentheses after the label */
  abbr?: string
  /** Additional CSS classes for the trigger span */
  className?: string
}

/**
 * Wraps a poker term with a hoverable/tappable tooltip.
 * Shows the full label inline with a dotted underline hint.
 * On hover/tap, displays the explanation.
 */
export function PokerTerm({ label, tip, abbr, className }: PokerTermProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'cursor-help border-b border-dotted border-muted-foreground/50',
            className,
          )}
        >
          {label}
          {abbr ? <span className="text-muted-foreground ml-0.5">({abbr})</span> : null}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[250px]">
        <p>{tip}</p>
      </TooltipContent>
    </Tooltip>
  )
}
