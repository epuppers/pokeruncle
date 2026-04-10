import type { Position } from '@/types/poker'
import { positionLabel } from '@/lib/poker-glossary'

import type { Spot } from '@/features/trainer/types'
import { formatDollars, getBlindAmount, getRaiseAmount } from './money'

export interface DealingStep {
  /** Which seat this action belongs to */
  position: Position
  /** Beginner-friendly label shown on the badge: "$1", "folds", "raises to $6" */
  label: string
  /** Visual style for the badge */
  style: 'blind' | 'fold' | 'raise' | 'call' | 'hero'
  /** Narrative sentence shown at top of table during dealing */
  narrative: string
}

/** Animation delay per step type in ms — includes spotlight travel + dwell time */
export const STEP_TIMING_MS: Record<DealingStep['style'], number> = {
  blind: 1200,
  fold: 1200,
  raise: 2000,
  call: 2000,
  hero: 1500,
}

/** Preflop acting order (UTG first, BB last) */
const PREFLOP_ORDER: Position[] = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB']

/**
 * Build the ordered dealing sequence for a spot.
 * Each step represents one player action that will be revealed
 * during the dealing animation.
 */
export function buildActionSequence(spot: Spot): DealingStep[] {
  const steps: DealingStep[] = []

  // Blinds always post first
  steps.push({
    position: 'SB',
    label: formatDollars(getBlindAmount('SB')),
    style: 'blind',
    narrative: `${positionLabel('SB')} posts ${formatDollars(getBlindAmount('SB'))}...`,
  })
  steps.push({
    position: 'BB',
    label: formatDollars(getBlindAmount('BB')),
    style: 'blind',
    narrative: `${positionLabel('BB')} posts ${formatDollars(getBlindAmount('BB'))}...`,
  })

  if (spot.kind === 'push-fold') {
    return buildPushFoldSequence(spot, steps)
  }

  return buildCashSequence(spot, steps)
}

/**
 * Get positions between two positions in preflop order (exclusive of both endpoints).
 * Wraps around: if from=CO and to=BB, returns [BTN, SB].
 */
function getPositionsBetween(from: Position, to: Position): Position[] {
  const fromIdx = PREFLOP_ORDER.indexOf(from)
  const toIdx = PREFLOP_ORDER.indexOf(to)
  const between: Position[] = []

  let i = (fromIdx + 1) % PREFLOP_ORDER.length
  while (i !== toIdx) {
    between.push(PREFLOP_ORDER[i])
    i = (i + 1) % PREFLOP_ORDER.length
  }
  return between
}

/** Add fold steps for positions between two seats (exclusive of both) */
function addFoldsBetween(
  from: Position,
  to: Position,
  steps: DealingStep[],
): void {
  for (const pos of getPositionsBetween(from, to)) {
    steps.push({
      position: pos,
      label: 'folds',
      style: 'fold',
      narrative: `${positionLabel(pos)} folds...`,
    })
  }
}

function buildCashSequence(
  spot: Spot & { kind: 'open' | 'response' },
  steps: DealingStep[],
): DealingStep[] {
  const hero = spot.hero
  const heroName = positionLabel(hero)

  switch (spot.scenario) {
    case 'RFI': {
      // Positions before hero fold in order
      for (const pos of PREFLOP_ORDER) {
        if (pos === hero) break
        if (pos === 'SB' || pos === 'BB') continue // already posted blinds
        steps.push({
          position: pos,
          label: 'folds',
          style: 'fold',
          narrative: `${positionLabel(pos)} folds...`,
        })
      }
      steps.push({
        position: hero,
        label: 'your turn',
        style: 'hero',
        narrative: `Everyone folds to you at ${heroName}.`,
      })
      break
    }
    case 'vs-open': {
      const villain = spot.villain
      const villainName = positionLabel(villain)
      const raiseAmt = formatDollars(getRaiseAmount('RFI'))
      // Positions before villain fold
      for (const pos of PREFLOP_ORDER) {
        if (pos === villain) break
        if (pos === 'SB' || pos === 'BB') continue
        steps.push({
          position: pos,
          label: 'folds',
          style: 'fold',
          narrative: `${positionLabel(pos)} folds...`,
        })
      }
      // Villain raises
      steps.push({
        position: villain,
        label: `raises to ${raiseAmt}`,
        style: 'raise',
        narrative: `${villainName} raises to ${raiseAmt}...`,
      })
      // Positions between villain and hero fold
      addFoldsBetween(villain, hero, steps)
      // Hero's turn
      steps.push({
        position: hero,
        label: 'your turn',
        style: 'hero',
        narrative: `${villainName} raised. It's your turn at ${heroName}.`,
      })
      break
    }
    case 'vs-3bet': {
      const villain = spot.villain
      const villainName = positionLabel(villain)
      const openAmt = formatDollars(getRaiseAmount('RFI'))
      const threeBetAmt = formatDollars(getRaiseAmount('vs-open'))
      // Hero opened
      steps.push({
        position: hero,
        label: `raised to ${openAmt}`,
        style: 'raise',
        narrative: `You raised to ${openAmt}...`,
      })
      // Positions between hero and villain fold
      addFoldsBetween(hero, villain, steps)
      // Villain 3-bets
      steps.push({
        position: villain,
        label: `re-raises to ${threeBetAmt}`,
        style: 'raise',
        narrative: `${villainName} re-raises to ${threeBetAmt}!`,
      })
      // Everyone else between villain and hero folds
      addFoldsBetween(villain, hero, steps)
      // Hero's turn again
      steps.push({
        position: hero,
        label: 'your turn',
        style: 'hero',
        narrative: `${villainName} re-raised you. What do you do?`,
      })
      break
    }
    case 'vs-4bet': {
      const villain = spot.villain
      const villainName = positionLabel(villain)
      const fourBetAmt = formatDollars(getRaiseAmount('vs-3bet'))
      // Villain raised, everyone else folds, hero 3-bet, villain 4-bets
      steps.push({
        position: villain,
        label: `raised`,
        style: 'raise',
        narrative: `${villainName} raised...`,
      })
      addFoldsBetween(villain, hero, steps)
      steps.push({
        position: hero,
        label: `re-raised`,
        style: 'raise',
        narrative: `You re-raised...`,
      })
      // Remaining positions between hero and villain fold
      addFoldsBetween(hero, villain, steps)
      steps.push({
        position: villain,
        label: `4-bets to ${fourBetAmt}`,
        style: 'raise',
        narrative: `${villainName} raises again to ${fourBetAmt}!`,
      })
      steps.push({
        position: hero,
        label: 'your turn',
        style: 'hero',
        narrative: `The raises keep escalating. What do you do?`,
      })
      break
    }
    case '3bet-defense': {
      const villain = spot.villain
      const villainName = positionLabel(villain)
      // Villain opened, everyone else folds, hero 3-bet, villain called
      steps.push({
        position: villain,
        label: 'raised',
        style: 'raise',
        narrative: `${villainName} raised...`,
      })
      addFoldsBetween(villain, hero, steps)
      steps.push({
        position: hero,
        label: 're-raised',
        style: 'raise',
        narrative: `You re-raised...`,
      })
      addFoldsBetween(hero, villain, steps)
      steps.push({
        position: villain,
        label: 'calls',
        style: 'call',
        narrative: `${villainName} calls your re-raise.`,
      })
      steps.push({
        position: hero,
        label: 'your turn',
        style: 'hero',
        narrative: `${villainName} called your re-raise. What now?`,
      })
      break
    }
  }

  return steps
}

function buildPushFoldSequence(
  spot: Spot & { kind: 'push-fold' },
  steps: DealingStep[],
): DealingStep[] {
  const hero = spot.hero
  const heroName = positionLabel(hero)
  const stack = formatDollars(spot.stackDepth * 2) // stackDepth is in BB, $2 per BB

  if (spot.scenario === 'push') {
    steps.push({
      position: hero,
      label: 'your turn',
      style: 'hero',
      narrative: `You have ${stack} in chips. Push all-in or fold?`,
    })
  } else {
    // vs-push
    if (spot.villain) {
      const villainName = positionLabel(spot.villain)
      steps.push({
        position: spot.villain,
        label: 'ALL-IN',
        style: 'raise',
        narrative: `${villainName} goes all-in!`,
      })
    }
    steps.push({
      position: hero,
      label: 'your turn',
      style: 'hero',
      narrative: `Someone went all-in. Do you call at ${heroName}?`,
    })
  }

  return steps
}

/** Get the total number of steps in the dealing sequence */
export function computeTotalSteps(spot: Spot): number {
  return buildActionSequence(spot).length
}
