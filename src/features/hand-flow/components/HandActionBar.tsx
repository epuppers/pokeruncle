import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useHandStore } from '@/stores/handStore'

import type { Action } from '@/types/poker'
import type { PostflopAction } from '@/features/postflop'
import { ActionBar } from '@/features/trainer/components/ActionBar'
import { PostflopActionBar } from '@/features/postflop/components/PostflopActionBar'

/**
 * Phase-aware action bar for the unified hand flow.
 * Renders preflop actions, postflop actions, or navigation buttons
 * depending on the current hand phase.
 */
export function HandActionBar() {
  const handPhase = useHandStore((s) => s.handPhase)
  const submitPreflopAction = useHandStore((s) => s.submitPreflopAction)
  const submitFlopAction = useHandStore((s) => s.submitFlopAction)
  const continueToFlop = useHandStore((s) => s.continueToFlop)
  const showHandSummary = useHandStore((s) => s.showHandSummary)
  const nextHand = useHandStore((s) => s.nextHand)

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

  if (phase === 'preflop-feedback') {
    if (handPhase.canContinue) {
      return (
        <ContinueButton
          label="Continue to Flop"
          icon
          onClick={() => void continueToFlop()}
        />
      )
    }
    return <ContinueButton label="Hand Summary" onClick={showHandSummary} />
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

  if (phase === 'flop-feedback') {
    return <ContinueButton label="Hand Summary" onClick={showHandSummary} />
  }

  if (phase === 'hand-summary') {
    return <ContinueButton label="Next Hand" onClick={nextHand} />
  }

  return null
}

function ContinueButton({
  label,
  onClick,
  icon,
}: {
  label: string
  onClick: () => void
  icon?: boolean
}) {
  return (
    <div className="animate-in slide-in-from-bottom-4 fade-in duration-300">
      <Button onClick={onClick} size="lg" className="w-full text-lg h-14">
        {label}
        {icon && <ArrowRight className="ml-1 size-5" />}
        <kbd className="ml-2 rounded-sm bg-black/20 px-2 py-0.5 text-sm font-mono">
          Space
        </kbd>
      </Button>
    </div>
  )
}
