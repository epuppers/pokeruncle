import { cn } from '@/lib/utils'
import { actionLabel } from '@/lib/poker-glossary'
import { ACTION_COLORS } from '@/constants/poker'

import { useHandStore } from '@/stores/handStore'

import { POSTFLOP_ACTION_LABELS } from '@/features/postflop'
import type { PostflopSpotResult } from '@/features/postflop'
import { BoardDisplay } from '@/features/postflop/components/BoardDisplay'
import { HeroHand } from '@/features/trainer/components/HeroHand'
import { getHandFriendlyName } from '@/features/trainer/lib/hand-strength'

import type { HandContinuation } from '@/features/trainer/types'

/**
 * End-of-hand summary shown in the hand-summary phase.
 * Recaps both streets: what the user did vs what was correct.
 */
export function HandSummary() {
  const handPhase = useHandStore((s) => s.handPhase)
  if (handPhase.phase !== 'hand-summary') return null

  const { preflopSpot, preflopResult, continuation, postflopResult } = handPhase
  const handName = getHandFriendlyName(preflopSpot.heroHand)

  const streetsCorrect =
    (preflopResult.isCorrect ? 1 : 0) + (postflopResult?.isCorrect ? 1 : 0)
  const totalStreets = continuation ? 2 : 1

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-display font-bold text-foreground">Hand Summary</h2>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="capitalize">{handName}</span> from{' '}
          {preflopSpot.hero}
          {preflopSpot.kind === 'response' && ` vs ${preflopSpot.villain}`}
        </p>
      </div>

      {/* Hero cards */}
      <div className="flex justify-center">
        <HeroHand cards={preflopSpot.heroCards} />
      </div>

      {/* Street results */}
      <div className="flex flex-col gap-3">
        <StreetResult
          street="Preflop"
          userAction={actionLabel(preflopResult.userAction)}
          correctAction={actionLabel(preflopSpot.correctAction)}
          isCorrect={preflopResult.isCorrect}
          userColor={ACTION_COLORS[preflopResult.userAction]}
          correctColor={ACTION_COLORS[preflopSpot.correctAction]}
        />

        {continuation && postflopResult && (
          <PostflopStreetResult
            continuation={continuation}
            result={postflopResult}
          />
        )}
      </div>

      {/* Overall score */}
      <div
        className={cn(
          'rounded-lg px-4 py-3 text-center text-base font-semibold',
          streetsCorrect === totalStreets
            ? 'bg-correct/15 text-correct'
            : streetsCorrect === 0
              ? 'bg-incorrect/15 text-incorrect'
              : 'bg-brass/15 text-brass',
        )}
      >
        {streetsCorrect}/{totalStreets} street{totalStreets > 1 ? 's' : ''} correct
      </div>
    </div>
  )
}

function StreetResult({
  street,
  userAction,
  correctAction,
  isCorrect,
  userColor,
  correctColor,
}: {
  street: string
  userAction: string
  correctAction: string
  isCorrect: boolean
  userColor: string
  correctColor: string
}) {
  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3',
        isCorrect ? 'border-correct/30 bg-correct/5' : 'border-incorrect/30 bg-incorrect/5',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground/80">{street}</span>
        <span
          className={cn(
            'text-xs font-bold uppercase',
            isCorrect ? 'text-correct' : 'text-incorrect',
          )}
        >
          {isCorrect ? 'Correct' : 'Incorrect'}
        </span>
      </div>
      <div className="flex items-center gap-4 mt-2 text-sm">
        <span>
          You:{' '}
          <span className={cn('rounded px-2 py-0.5 text-white font-medium', userColor)}>
            {userAction}
          </span>
        </span>
        {!isCorrect && (
          <span>
            Correct:{' '}
            <span className={cn('rounded px-2 py-0.5 text-white font-medium', correctColor)}>
              {correctAction}
            </span>
          </span>
        )}
      </div>
    </div>
  )
}

function PostflopStreetResult({
  continuation,
  result,
}: {
  continuation: HandContinuation
  result: PostflopSpotResult
}) {
  const { postflopSpot } = continuation

  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3',
        result.isCorrect ? 'border-correct/30 bg-correct/5' : 'border-incorrect/30 bg-incorrect/5',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground/80">Flop</span>
        <span
          className={cn(
            'text-xs font-bold uppercase',
            result.isCorrect ? 'text-correct' : 'text-incorrect',
          )}
        >
          {result.isCorrect ? 'Correct' : 'Incorrect'}
        </span>
      </div>
      <div className="my-2">
        <BoardDisplay board={postflopSpot.board} className="justify-start" />
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span>
          You: <span className="font-medium">{POSTFLOP_ACTION_LABELS[result.userAction]}</span>
        </span>
        {!result.isCorrect && (
          <span>
            Correct:{' '}
            <span className="font-semibold text-brass">
              {POSTFLOP_ACTION_LABELS[postflopSpot.correctAction]}
            </span>
          </span>
        )}
      </div>
    </div>
  )
}
