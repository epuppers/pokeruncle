import { X, Coins, TrendingUp, Flame, Hand, CircleDollarSign } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useHandStore } from '@/stores/handStore'

import type { Action } from '@/types/poker'
import type { PostflopAction } from '@/features/postflop'
import { ActionBar } from '@/features/trainer/components/ActionBar'
import { PostflopActionBar } from '@/features/postflop/components/PostflopActionBar'

/**
 * Phase-aware action bar for the unified hand flow.
 * Renders normal action buttons during decisions, or correction-mode
 * buttons (only correct action enabled) during corrections.
 */
export function HandActionBar() {
  const handPhase = useHandStore((s) => s.handPhase)
  const submitPreflopAction = useHandStore((s) => s.submitPreflopAction)
  const submitFlopAction = useHandStore((s) => s.submitFlopAction)
  const acknowledgeCorrection = useHandStore((s) => s.acknowledgeCorrection)

  const { phase } = handPhase

  if (phase === 'preflop-decision') {
    return (
      <ActionBar
        onAction={(action: Action) => submitPreflopAction(action)}
        disabled={false}
        spot={handPhase.spot}
      />
    )
  }

  if (phase === 'preflop-correction') {
    return (
      <PreflopCorrectionBar
        correctAction={handPhase.spot.correctAction}
        onAcknowledge={acknowledgeCorrection}
      />
    )
  }

  if (phase === 'flop-decision') {
    const availableActions = Object.keys(
      handPhase.continuation.postflopSpot.correctStrategy,
    ) as PostflopAction[]
    return (
      <PostflopActionBar
        onAction={(action: PostflopAction) => submitFlopAction(action)}
        disabled={false}
        availableActions={availableActions}
      />
    )
  }

  if (phase === 'flop-correction') {
    const availableActions = Object.keys(
      handPhase.continuation.postflopSpot.correctStrategy,
    ) as PostflopAction[]
    return (
      <PostflopCorrectionBar
        correctAction={handPhase.continuation.postflopSpot.correctAction}
        availableActions={availableActions}
        onAcknowledge={acknowledgeCorrection}
      />
    )
  }

  return null
}

// ─── Preflop correction buttons ─────────────────────────────

const PREFLOP_BUTTONS = [
  { action: 'fold' as Action, label: 'Fold', shortcut: '1', variant: 'action-fold' as const, icon: X },
  { action: 'call' as Action, label: 'Call', shortcut: '2', variant: 'action-call' as const, icon: Coins },
  { action: 'raise' as Action, label: 'Raise', shortcut: '3', variant: 'action-raise' as const, icon: TrendingUp },
  { action: 'allin' as Action, label: 'All-In', shortcut: '4', variant: 'action-allin' as const, icon: Flame },
]

function PreflopCorrectionBar({
  correctAction,
  onAcknowledge,
}: {
  correctAction: Action
  onAcknowledge: () => void
}) {
  return (
    <div className="flex gap-2">
      {PREFLOP_BUTTONS.map(({ action, label, shortcut, variant, icon: Icon }) => {
        const isCorrect = action === correctAction
        return (
          <Button
            key={action}
            variant={variant}
            className={cn(
              'flex-1 h-16 text-lg gap-2',
              isCorrect
                ? 'ring-2 ring-correct animate-pulse'
                : 'opacity-20 pointer-events-none',
            )}
            disabled={!isCorrect}
            onClick={isCorrect ? onAcknowledge : undefined}
          >
            <Icon className="size-5" />
            {label}
            <kbd className="ml-1 rounded-sm bg-black/20 px-1.5 py-0.5 text-xs font-mono shadow-[0_1px_0_rgba(0,0,0,0.3)]">
              {shortcut}
            </kbd>
          </Button>
        )
      })}
    </div>
  )
}

// ─── Postflop correction buttons ────────────────────────────

const POSTFLOP_BUTTONS = [
  { action: 'fold' as PostflopAction, label: 'Fold', shortcut: '1', variant: 'action-fold' as const, icon: X },
  { action: 'check' as PostflopAction, label: 'Check', shortcut: '2', variant: 'action-check' as const, icon: Hand },
  { action: 'bet-small' as PostflopAction, label: 'Bet 33%', shortcut: '3', variant: 'action-bet-small' as const, icon: Coins },
  { action: 'bet-medium' as PostflopAction, label: 'Bet 66%', shortcut: '4', variant: 'action-bet-medium' as const, icon: CircleDollarSign },
  { action: 'bet-large' as PostflopAction, label: 'Bet 100%', shortcut: '5', variant: 'action-bet-large' as const, icon: TrendingUp },
  { action: 'allin' as PostflopAction, label: 'All-In', shortcut: '6', variant: 'action-allin' as const, icon: Flame },
]

function PostflopCorrectionBar({
  correctAction,
  availableActions,
  onAcknowledge,
}: {
  correctAction: PostflopAction
  availableActions: PostflopAction[]
  onAcknowledge: () => void
}) {
  const buttons = POSTFLOP_BUTTONS.filter((b) => availableActions.includes(b.action))

  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map(({ action, label, shortcut, variant, icon: Icon }) => {
        const isCorrect = action === correctAction
        return (
          <Button
            key={action}
            variant={variant}
            className={cn(
              'flex-1 min-w-[100px] h-14 text-base gap-1.5',
              isCorrect
                ? 'ring-2 ring-correct animate-pulse'
                : 'opacity-20 pointer-events-none',
            )}
            disabled={!isCorrect}
            onClick={isCorrect ? onAcknowledge : undefined}
          >
            <Icon className="size-4" />
            {label}
            <kbd className="ml-1 rounded-sm bg-black/20 px-1.5 py-0.5 text-xs font-mono shadow-[0_1px_0_rgba(0,0,0,0.3)]">
              {shortcut}
            </kbd>
          </Button>
        )
      })}
    </div>
  )
}
