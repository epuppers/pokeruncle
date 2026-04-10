import { X, Hand, Coins, TrendingUp, Flame, CircleDollarSign } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { PostflopAction } from '../types'

type ButtonVariant =
  | 'action-fold'
  | 'action-check'
  | 'action-bet-small'
  | 'action-bet-medium'
  | 'action-bet-large'
  | 'action-call'
  | 'action-raise'
  | 'action-allin'

interface PostflopButton {
  action: PostflopAction
  label: string
  shortcut: string
  variant: ButtonVariant
  icon: typeof X
}

const POSTFLOP_BUTTONS: PostflopButton[] = [
  { action: 'fold', label: 'Fold', shortcut: '1', variant: 'action-fold', icon: X },
  { action: 'check', label: 'Check', shortcut: '2', variant: 'action-check', icon: Hand },
  { action: 'bet-small', label: 'Bet 33%', shortcut: '3', variant: 'action-bet-small', icon: Coins },
  { action: 'bet-medium', label: 'Bet 66%', shortcut: '4', variant: 'action-bet-medium', icon: CircleDollarSign },
  { action: 'bet-large', label: 'Bet 100%', shortcut: '5', variant: 'action-bet-large', icon: TrendingUp },
  { action: 'allin', label: 'All-In', shortcut: '6', variant: 'action-allin', icon: Flame },
]

interface PostflopActionBarProps {
  onAction: (action: PostflopAction) => void
  disabled: boolean
  /** Which actions are available in the current strategy (show only relevant buttons) */
  availableActions?: PostflopAction[]
}

export function PostflopActionBar({ onAction, disabled, availableActions }: PostflopActionBarProps) {
  const buttons = availableActions
    ? POSTFLOP_BUTTONS.filter((b) => availableActions.includes(b.action))
    : POSTFLOP_BUTTONS

  return (
    <div className="flex flex-wrap gap-2 animate-in slide-in-from-bottom-4 fade-in duration-300">
      {buttons.map(({ action, label, shortcut, variant, icon: Icon }) => (
        <Button
          key={action}
          variant={variant}
          className={cn(
            'flex-1 min-w-[100px] h-14 text-base gap-1.5',
            disabled && 'opacity-50 pointer-events-none',
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
