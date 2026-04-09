import { X, Coins, TrendingUp, Flame } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { Action } from '@/types/poker'
import { cn } from '@/lib/utils'

import type { Spot } from '@/features/trainer/types'

interface ActionBarProps {
  onAction: (action: Action) => void
  disabled: boolean
  spot?: Spot
}

type ActionVariant = 'action-fold' | 'action-call' | 'action-raise' | 'action-allin'

interface ActionButton {
  action: Action
  label: string
  shortcut: string
  variant: ActionVariant
  icon: typeof X
}

const ALL_ACTION_BUTTONS: ActionButton[] = [
  { action: 'fold', label: 'Fold', shortcut: '1', variant: 'action-fold', icon: X },
  { action: 'call', label: 'Call', shortcut: '2', variant: 'action-call', icon: Coins },
  { action: 'raise', label: 'Raise', shortcut: '3', variant: 'action-raise', icon: TrendingUp },
  { action: 'allin', label: 'All-in', shortcut: '4', variant: 'action-allin', icon: Flame },
]

function getVisibleActions(spot?: Spot): ActionButton[] {
  if (spot?.kind !== 'push-fold') return ALL_ACTION_BUTTONS

  if (spot.scenario === 'push') {
    return [
      { action: 'fold', label: 'Fold', shortcut: '1', variant: 'action-fold', icon: X },
      { action: 'allin', label: 'Push', shortcut: '2', variant: 'action-allin', icon: Flame },
    ]
  }

  // vs-push: call or fold
  return [
    { action: 'fold', label: 'Fold', shortcut: '1', variant: 'action-fold', icon: X },
    { action: 'call', label: 'Call', shortcut: '2', variant: 'action-call', icon: Coins },
  ]
}

export function ActionBar({ onAction, disabled, spot }: ActionBarProps) {
  const buttons = getVisibleActions(spot)

  return (
    <div className="flex gap-2">
      {buttons.map(({ action, label, shortcut, variant, icon: Icon }) => (
        <Button
          key={action}
          variant={variant}
          className={cn(
            'flex-1 h-14 text-base gap-2',
            disabled && 'opacity-40 pointer-events-none',
          )}
          disabled={disabled}
          onClick={() => onAction(action)}
        >
          <Icon className="size-4" />
          {label}
          <kbd className="ml-1 rounded-sm bg-black/20 px-1.5 py-0.5 text-xs font-mono shadow-[0_1px_0_rgba(0,0,0,0.3)]">
            {shortcut}
          </kbd>
        </Button>
      ))}
    </div>
  )
}
