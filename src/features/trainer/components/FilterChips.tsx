import { cn } from '@/lib/utils'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

export function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  )
}

export function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border px-3 py-1 text-sm transition-colors',
        active
          ? 'border-brass bg-brass/20 text-brass'
          : 'border-border bg-background text-muted-foreground hover:bg-accent/30',
      )}
    >
      {label}
    </button>
  )
}

export function ToggleChipWithTip({
  label,
  tip,
  active,
  onClick,
}: {
  label: string
  tip: string
  active: boolean
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            'rounded-md border px-3 py-1 text-sm transition-colors',
            active
              ? 'border-brass bg-brass/20 text-brass'
              : 'border-border bg-background text-muted-foreground hover:bg-accent/30',
          )}
        >
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[220px]">
        <p>{tip}</p>
      </TooltipContent>
    </Tooltip>
  )
}
