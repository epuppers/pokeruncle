import { useHandStore } from '@/stores/handStore'

import type { HandPhase } from '@/stores/handStore'

import { TableView } from '@/features/trainer/components/TableView'
import { FlopTable } from './FlopTable'

interface HandTableProps {
  /** Current dealing step index (undefined when not in preflop-dealing) */
  dealingStepIndex: number | undefined
}

function StreetPill({ label }: { label: string }) {
  return (
    <span className="absolute top-2 left-2 z-10 rounded-full bg-brass/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brass border border-brass/30">
      {label}
    </span>
  )
}

/**
 * Persistent table that stays mounted across all hand phases.
 * Preflop phases: renders the full 6-max TableView with dealing animation.
 * Flop phases: renders a simplified 2-player view with board cards.
 */
export function HandTable({ dealingStepIndex }: HandTableProps) {
  const handPhase = useHandStore((s) => s.handPhase)

  const preflopSpot = extractPreflopSpot(handPhase)
  const continuation = extractContinuation(handPhase)

  // Flop phases — show the flop table
  if (continuation) {
    return (
      <div key="flop" className="relative animate-in fade-in duration-300">
        <StreetPill label="Flop" />
        <FlopTable continuation={continuation} />
      </div>
    )
  }

  // Preflop phases — show the full 6-max table
  if (preflopSpot) {
    const revealedSteps =
      dealingStepIndex !== undefined ? dealingStepIndex + 1 : undefined
    return (
      <div key="preflop" className="relative animate-in fade-in duration-300">
        <StreetPill label="Preflop" />
        <TableView spot={preflopSpot} revealedSteps={revealedSteps} />
      </div>
    )
  }

  return null
}

function extractPreflopSpot(phase: HandPhase) {
  switch (phase.phase) {
    case 'preflop-dealing':
    case 'preflop-decision':
    case 'preflop-feedback':
      return phase.spot
    case 'hand-summary':
      return phase.continuation ? null : phase.preflopSpot
    default:
      return null
  }
}

function extractContinuation(phase: HandPhase) {
  switch (phase.phase) {
    case 'flop-dealing':
    case 'flop-decision':
    case 'flop-feedback':
      return phase.continuation
    case 'hand-summary':
      return phase.continuation
    default:
      return null
  }
}
