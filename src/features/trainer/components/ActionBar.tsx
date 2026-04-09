import { Button } from '@/components/ui/button'
import type { Action } from '@/types/poker'
import { cn } from '@/lib/utils'

interface ActionBarProps {
  onAction: (action: Action) => void
  disabled: boolean
}

const ACTION_BUTTONS: { action: Action; label: string; shortcut: string; color: string }[] = [
  { action: 'fold', label: 'Fold', shortcut: '1', color: 'bg-neutral-700 hover:bg-neutral-600' },
  { action: 'call', label: 'Call', shortcut: '2', color: 'bg-emerald-700 hover:bg-emerald-600' },
  { action: 'raise', label: 'Raise', shortcut: '3', color: 'bg-sky-700 hover:bg-sky-600' },
  { action: 'allin', label: 'All-in', shortcut: '4', color: 'bg-rose-700 hover:bg-rose-600' },
]

export function ActionBar({ onAction, disabled }: ActionBarProps) {
  return (
    <div className="flex gap-2">
      {ACTION_BUTTONS.map(({ action, label, shortcut, color }) => (
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
