import { X, Coins, TrendingUp, Flame } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { Action } from '@/types/poker'
import { cn } from '@/lib/utils'

import type { Spot } from '@/features/trainer/types'
import { getActionButtonLabel } from '@/features/trainer/lib/money'

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

function getVisibleActions(spot?: Spot): ActionButton[] {
  const scenario = spot?.scenario ?? 'RFI'
  const stackDepth = spot?.kind === 'push-fold' ? spot.stackDepth : undefined

  if (spot?.kind === 'push-fold') {
    if (spot.scenario === 'push') {
      return [
        { action: 'fold', label: getActionButtonLabel('fold', scenario, stackDepth), shortcut: '1', variant: 'action-fold', icon: X },
        { action: 'allin', label: getActionButtonLabel('allin', scenario, stackDepth), shortcut: '2', variant: 'action-allin', icon: Flame },
      ]
    }
    // vs-push: call or fold
    return [
      { action: 'fold', label: getActionButtonLabel('fold', scenario, stackDepth), shortcut: '1', variant: 'action-fold', icon: X },
      { action: 'call', label: getActionButtonLabel('call', scenario, stackDepth), shortcut: '2', variant: 'action-call', icon: Coins },
    ]
  }

  return [
    { action: 'fold', label: getActionButtonLabel('fold', scenario, stackDepth), shortcut: '1', variant: 'action-fold', icon: X },
    { action: 'call', label: getActionButtonLabel('call', scenario, stackDepth), shortcut: '2', variant: 'action-call', icon: Coins },
    { action: 'raise', label: getActionButtonLabel('raise', scenario, stackDepth), shortcut: '3', variant: 'action-raise', icon: TrendingUp },
    { action: 'allin', label: getActionButtonLabel('allin', scenario, stackDepth), shortcut: '4', variant: 'action-allin', icon: Flame },
  ]
}

export function ActionBar({ onAction, disabled, spot }: ActionBarProps) {
  const buttons = getVisibleActions(spot)

  return (
    <div className="flex gap-2 animate-in slide-in-from-bottom-4 fade-in duration-300">
      {buttons.map(({ action, label, shortcut, variant, icon: Icon }) => (
        <Button
          key={action}
          variant={variant}
          className={cn(
            'flex-1 h-16 text-lg gap-2',
            disabled && 'opacity-40 pointer-events-none',
          )}
          disabled={disabled}
          onClick={() => onAction(action)}
        >
          <Icon className="size-5" />
          {label}
          <kbd className="ml-1 rounded-sm bg-black/20 px-1.5 py-0.5 text-xs font-mono shadow-[0_1px_0_rgba(0,0,0,0.3)]">
            {shortcut}
          </kbd>
        </Button>
      ))}
    </div>
  )
}
