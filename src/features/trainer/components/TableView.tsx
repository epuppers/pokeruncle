import { POSITIONS } from '@/types/poker'
import type { Position } from '@/types/poker'
import { cn } from '@/lib/utils'
import { PokerTerm } from '@/components/PokerTerm'
import { POSITION_LABELS } from '@/lib/poker-glossary'

import type { Spot } from '@/features/trainer/types'
import { buildActionSequence } from '@/features/trainer/lib/action-sequence'
import type { DealingStep } from '@/features/trainer/lib/action-sequence'
import { POSITION_COORDS, computeRunningPot, parseDollarAmount } from '@/features/trainer/lib/chip-positions'
import { getActingOrderLabel, getPositionIntro, hasSeenPosition, markPositionSeen } from '@/features/trainer/lib/position-education'
import { ActionSpotlight } from './ActionSpotlight'
import { BetChip } from './BetChip'
import { CardBack } from './CardBack'
import { HeroHand } from './HeroHand'
import { PotDisplay } from './PotDisplay'

interface TableViewProps {
  spot: Spot
  /** Number of dealing steps revealed. undefined = show all (feedback/active). */
  revealedSteps?: number
}

export function TableView({ spot, revealedSteps }: TableViewProps) {
  const steps = buildActionSequence(spot)
  const revealedCount = revealedSteps ?? steps.length
  const isDealing = revealedSteps !== undefined
  const villain =
    spot.kind === 'response' ? spot.villain : spot.kind === 'push-fold' ? spot.villain : undefined

  // Current step for the spotlight
  const currentStep = isDealing && revealedCount > 0 ? steps[revealedCount - 1] : null

  // Pot total from revealed bets
  const pot = computeRunningPot(steps, revealedCount)

  // Position intro (first encounter)
  const showPositionIntro = !isDealing && !hasSeenPosition(spot.hero)
  if (!isDealing && !hasSeenPosition(spot.hero)) {
    markPositionSeen(spot.hero)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Position intro callout (first encounter only) */}
      {showPositionIntro && (
        <div className="rounded-lg bg-brass/10 border border-brass/20 px-4 py-3 text-sm text-foreground max-w-md text-center animate-in fade-in slide-in-from-top-2 duration-300">
          {getPositionIntro(spot.hero)}
        </div>
      )}

      {/* Table — the single focal point */}
      <div className="relative w-full max-w-2xl aspect-[3/2] rounded-[40%] ring-4 ring-wood bg-[radial-gradient(ellipse_at_center,var(--color-felt-light),var(--color-felt))] shadow-[inset_0_2px_20px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.3)]">

        {/* Action spotlight — glowing ring that moves seat to seat, fades out after dealing */}
        <ActionSpotlight
          position={currentStep?.position ?? spot.hero}
          stepStyle={currentStep?.style ?? 'hero'}
          visible={isDealing && !!currentStep && currentStep.style !== 'deal'}
        />

        {/* Pot display (center, above cards) */}
        <PotDisplay totalPot={pot} visible={pot > 0} />

        {/* Bet chips for each revealed blind/raise/call */}
        {steps.map((step, i) => {
          if (i >= revealedCount) return null
          if (step.style === 'fold' || step.style === 'hero' || step.style === 'dealer' || step.style === 'deal') return null
          const amount = parseDollarAmount(step.label)
          if (amount <= 0) return null
          return (
            <BetChip
              key={`chip-${spot.id}-${i}`}
              position={step.position}
              amount={amount}
              style={step.style}
              animate={isDealing}
            />
          )
        })}

        {/* Face-down card backs at dealt seats */}
        {POSITIONS.map((pos) => {
          const wasDealt = steps.some(
            (s, i) => s.position === pos && s.style === 'deal' && i < revealedCount,
          )
          // Hide card backs for the hero (their face-up cards replace these)
          // and for folded players (they've mucked)
          const hasFolded = steps.some(
            (s, i) => s.position === pos && s.style === 'fold' && i < revealedCount,
          )
          const isHeroSeat = pos === spot.hero
          if (!wasDealt) return null
          // Once all cards are dealt, hero's back is replaced by face-up cards
          if (isHeroSeat && allCardsDealt(steps, revealedCount)) return null
          return (
            <CardBack
              key={`cards-${spot.id}-${pos}`}
              position={pos}
              animate={isDealing}
              mucking={hasFolded}
            />
          )
        })}

        {/* Seat badges */}
        {POSITIONS.map((pos) => {
          // Find the last REVEALED step for this position (not the last overall)
          const revealedEntries = steps
            .map((s, i) => ({ step: s, index: i }))
            .filter((e) => e.step.position === pos && e.index < revealedCount)
          const displayEntry = revealedEntries[revealedEntries.length - 1]

          return (
            <SeatBadge
              key={`${spot.id}-${pos}`}
              position={pos}
              isHero={pos === spot.hero}
              isVillain={pos === villain}
              stepInfo={displayEntry}
            />
          )
        })}

        {/* Hero cards (center) — shown once all cards are dealt */}
        {(!isDealing || allCardsDealt(steps, revealedCount)) && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <HeroHand cards={spot.heroCards} animate={isDealing} />
          </div>
        )}
      </div>
    </div>
  )
}

/** True once every 'deal' step in the sequence has been revealed */
function allCardsDealt(steps: DealingStep[], revealedCount: number): boolean {
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].style === 'deal' && i >= revealedCount) return false
  }
  return steps.some((s) => s.style === 'deal')
}

interface SeatBadgeProps {
  position: Position
  isHero: boolean
  isVillain: boolean
  stepInfo?: { step: DealingStep; index: number }
}

function SeatBadge({ position, isHero, isVillain, stepInfo }: SeatBadgeProps) {
  const coords = POSITION_COORDS[position]
  const entry = POSITION_LABELS[position]
  const actOrder = getActingOrderLabel(position)

  // stepInfo is already filtered to revealed steps by the parent
  const isRevealed = stepInfo !== undefined
  const isFolded = isRevealed && stepInfo?.step.style === 'fold'

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
      style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
    >
      <div
        className={cn(
          'relative flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold',
          'transition-all duration-500',
          isHero && 'bg-brass/25 text-brass ring-2 ring-brass/50 scale-110',
          isVillain && 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40',
          isFolded && 'opacity-30 scale-90',
          !isHero && !isVillain && !isFolded && 'text-foreground/80',
        )}
      >
        {/* Red diagonal strikethrough when folded */}
        {isFolded && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="w-[140%] h-[3px] bg-red-500/70 rounded-full rotate-[-30deg] animate-in fade-in zoom-in-50 duration-300" />
          </div>
        )}
        {isHero && (
          <span className="text-xs font-black uppercase tracking-widest text-brass">You</span>
        )}
        <PokerTerm label={entry.label} tip={entry.tip} className="text-inherit border-0" />
        <span className="text-xs tabular-nums opacity-70">{actOrder}</span>
        {isRevealed && stepInfo && stepInfo.step.style !== 'blind' && stepInfo.step.style !== 'dealer' && stepInfo.step.style !== 'deal' && (
          <span
            className={cn(
              'text-xs font-bold uppercase tracking-wide rounded-full px-1.5 py-0.5',
              stepInfo.step.style === 'fold'
                ? 'animate-[foldFlash_0.6s_ease-out_forwards] bg-red-500/80 text-white'
                : 'animate-in fade-in zoom-in-95 duration-200',
              stepInfo.step.style === 'hero' && 'bg-brass/30 text-brass',
              stepInfo.step.style === 'raise' && 'bg-rose-500/20 text-rose-300',
              stepInfo.step.style === 'call' && 'bg-foreground/15 text-foreground/80',
            )}
          >
            {stepInfo.step.label}
          </span>
        )}
      </div>
    </div>
  )
}
