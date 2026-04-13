import { cn } from '@/lib/utils'

interface CorrectionBannerProps {
  userActionLabel: string
  correctActionLabel: string
  className?: string
}

/**
 * Inline correction banner shown when the user picks the wrong action.
 * Prompts the user to tap the correct action to continue.
 */
export function CorrectionBanner({
  userActionLabel,
  correctActionLabel,
  className,
}: CorrectionBannerProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-incorrect/30 bg-incorrect/10 px-4 py-3 text-center',
        'animate-in fade-in slide-in-from-top-2 duration-200',
        className,
      )}
    >
      <p className="text-sm font-medium text-incorrect">
        ✕ You chose <span className="font-bold">{userActionLabel}</span>.
        {' '}Correct play: <span className="font-bold">{correctActionLabel}</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Tap the correct action to continue
      </p>
    </div>
  )
}
