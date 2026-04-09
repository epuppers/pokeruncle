import { Button } from '@/components/ui/button'
import type { Action } from '@/types/poker'
import { cn } from '@/lib/utils'

import type { Spot } from '@/features/trainer/types'

interface ActionBarProps {
  onAction: (action: Action) => void
  disabled: boolean
  spot?: Spot
}

const ALL_ACTION_BUTTONS: { action: Action; label: string; shortcut: string; color: string }[] = [
  { action: 'fold', label: 'Fold', shortcut: '1', color: 'bg-neutral-700 hover:bg-neutral-600' },
  { action: 'call', label: 'Call', shortcut: '2', color: 'bg-emerald-700 hover:bg-emerald-600' },
  { action: 'raise', label: 'Raise', shortcut: '3', color: 'bg-sky-700 hover:bg-sky-600' },
  { action: 'allin', label: 'All-in', shortcut: '4', color: 'bg-rose-700 hover:bg-rose-600' },
]

function getVisibleActions(spot?: Spot): typeof ALL_ACTION_BUTTONS {
  if (spot?.kind !== 'push-fold') return ALL_ACTION_BUTTONS

  if (spot.scenario === 'push') {
    return [
      { action: 'fold', label: 'Fold', shortcut: '1', color: 'bg-neutral-700 hover:bg-neutral-600' },
      { action: 'allin', label: 'Push', shortcut: '2', color: 'bg-rose-700 hover:bg-rose-600' },
    ]
  }

  // vs-push: call or fold
  return [
    { action: 'fold', label: 'Fold', shortcut: '1', color: 'bg-neutral-700 hover:bg-neutral-600' },
    { action: 'call', label: 'Call', shortcut: '2', color: 'bg-emerald-700 hover:bg-emerald-600' },
  ]
}

export function ActionBar({ onAction, disabled, spot }: ActionBarProps) {
  const buttons = getVisibleActions(spot)

  return (
    <div className="flex gap-2">
      {buttons.map(({ action, label, shortcut, color }) => (
        <Button
          key={action}
          variant="ghost"
          className={cn(
            'flex-1 h-12 text-white font-semibold text-base',
            color,
            disabled && 'opacity-40 pointer-events-none',
          )}
          disabled={disabled}
          onClick={() => onAction(action)}
        >
          {label}
          <kbd className="ml-1.5 rounded bg-black/30 px-1.5 py-0.5 text-xs font-mono">
            {shortcut}
          </kbd>
        </Button>
      ))}
    </div>
  )
}
