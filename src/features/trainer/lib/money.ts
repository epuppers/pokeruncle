import type { Action, Scenario } from '@/types/poker'

import type { TournamentScenario, StackDepth } from '@/features/trainer/types'

/** Standard $1/$2 cash game stakes */
export const STAKES = {
  smallBlind: 1,
  bigBlind: 2,
  stack: 200,
} as const

/** Format a number as a dollar amount: 1 → "$1", 18 → "$18" */
export function formatDollars(amount: number): string {
  return `$${amount}`
}

/** Get the blind amount for a given position */
export function getBlindAmount(position: 'SB' | 'BB'): number {
  return position === 'SB' ? STAKES.smallBlind : STAKES.bigBlind
}

/** Get the total pot from blinds alone */
export function getBlindPot(): number {
  return STAKES.smallBlind + STAKES.bigBlind
}

/**
 * Get the dollar amount for a raise/call in a given scenario.
 * Standard sizings: open to 3x BB ($6), 3-bet to ~3x open ($18),
 * 4-bet to ~2.5x 3-bet ($48).
 */
export function getRaiseAmount(scenario: Scenario | TournamentScenario): number {
  switch (scenario) {
    case 'RFI':
      return 6 // 3x BB
    case 'vs-open':
      return 18 // 3-bet sizing (~3x open)
    case 'vs-3bet':
      return 48 // 4-bet sizing (~2.5x 3-bet)
    case 'vs-4bet':
    case 'push':
    case 'vs-push':
      return STAKES.stack // all-in
    case '3bet-defense':
      return 18 // already 3-bet, now facing a call
  }
}

/** Get the amount it costs to call in a given scenario */
export function getCallAmount(scenario: Scenario | TournamentScenario): number {
  switch (scenario) {
    case 'RFI':
      return STAKES.bigBlind // limping (rare but exists)
    case 'vs-open':
      return 6 // calling the open raise
    case 'vs-3bet':
      return 18 // calling the 3-bet
    case 'vs-4bet':
      return 48 // calling the 4-bet
    case '3bet-defense':
      return 6 // calling the open
    case 'push':
      return STAKES.stack // push = all-in
    case 'vs-push':
      return STAKES.stack // calling a push
  }
}

/** Get the contextual dollar label for an action button */
export function getActionButtonLabel(
  action: Action,
  scenario: Scenario | TournamentScenario,
  stackDepth?: StackDepth,
): string {
  const stack = stackDepth ? stackDepth * STAKES.bigBlind : STAKES.stack

  switch (action) {
    case 'fold':
      return 'Fold'
    case 'call': {
      const amount = stackDepth ? Math.min(getCallAmount(scenario), stack) : getCallAmount(scenario)
      return `Call ${formatDollars(amount)}`
    }
    case 'raise': {
      const amount = stackDepth
        ? Math.min(getRaiseAmount(scenario), stack)
        : getRaiseAmount(scenario)
      return `Raise to ${formatDollars(amount)}`
    }
    case 'allin': {
      return `All-in ${formatDollars(stack)}`
    }
  }
}

/** Describe the pot in dollars for a given scenario */
export function describePot(scenario: Scenario | TournamentScenario): string {
  switch (scenario) {
    case 'RFI':
      return `${formatDollars(getBlindPot())} in blinds`
    case 'vs-open':
      return `about ${formatDollars(6 + getBlindPot())} in the pot`
    case 'vs-3bet':
      return `about ${formatDollars(18 + 6 + getBlindPot())} in the pot`
    case 'vs-4bet':
      return `about ${formatDollars(48 + 18 + getBlindPot())} in the pot`
    case '3bet-defense':
      return `about ${formatDollars(18 * 2 + getBlindPot())} in the pot`
    case 'push':
      return `${formatDollars(getBlindPot())} in blinds`
    case 'vs-push':
      return `an all-in and ${formatDollars(getBlindPot())} in blinds`
  }
}
