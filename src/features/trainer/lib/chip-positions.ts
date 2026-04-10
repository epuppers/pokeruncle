import type { Position } from '@/types/poker'

import type { DealingStep } from './action-sequence'
import { STAKES } from './money'

/** Seat positions on the table as percentage coordinates */
export const POSITION_COORDS: Record<Position, { x: number; y: number }> = {
  UTG: { x: 20, y: 18 },
  MP: { x: 80, y: 18 },
  CO: { x: 95, y: 50 },
  BTN: { x: 80, y: 82 },
  SB: { x: 20, y: 82 },
  BB: { x: 5, y: 50 },
}

const TABLE_CENTER = { x: 50, y: 50 }
const CHIP_PULL = 0.4 // how far toward center (0 = at seat, 1 = at center)

/** Compute where a bet chip should sit (40% of the way from seat to center) */
export function getChipPosition(position: Position): { x: number; y: number } {
  const seat = POSITION_COORDS[position]
  return {
    x: seat.x + (TABLE_CENTER.x - seat.x) * CHIP_PULL,
    y: seat.y + (TABLE_CENTER.y - seat.y) * CHIP_PULL,
  }
}

/** How many chip circles to render based on bet size */
export function getChipCount(amount: number): 1 | 2 | 3 {
  if (amount <= 2) return 1
  if (amount <= 10) return 2
  return 3
}

/** Tailwind bg classes for chip color by step style and amount */
export function getChipColor(style: DealingStep['style'], amount: number): string {
  if (style === 'blind') {
    return amount <= 1
      ? 'bg-gradient-to-br from-gray-100 to-gray-300 border-gray-200' // white chip for $1
      : 'bg-gradient-to-br from-red-400 to-red-600 border-red-300'     // red chip for $2
  }
  if (style === 'raise') {
    return 'bg-gradient-to-br from-sky-400 to-sky-600 border-sky-300' // blue for raises
  }
  // call
  return 'bg-gradient-to-br from-emerald-400 to-emerald-600 border-emerald-300' // green for calls
}

/** Parse the dollar amount from a step label like "$1", "$6", "raises to $6" */
export function parseDollarAmount(label: string): number {
  const match = label.match(/\$(\d+)/)
  return match ? Number(match[1]) : 0
}

/** Compute the running pot from revealed steps */
export function computeRunningPot(steps: DealingStep[], revealedCount: number): number {
  let pot = 0
  for (let i = 0; i < revealedCount && i < steps.length; i++) {
    const step = steps[i]
    if (step.style === 'blind' || step.style === 'raise' || step.style === 'call') {
      pot += parseDollarAmount(step.label)
    }
  }
  // Always include at least the blinds if we're past them
  if (pot === 0 && revealedCount >= 2) {
    pot = STAKES.smallBlind + STAKES.bigBlind
  }
  return pot
}
