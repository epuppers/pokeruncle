import { positionLabel } from '@/lib/poker-glossary'

import type { Spot } from '@/features/trainer/types'
import { describePot, formatDollars, getCallAmount, getRaiseAmount } from './money'

export interface ScenarioNarration {
  /** Short narrative of the current situation */
  summary: string
  /** What the pot currently contains */
  potDescription: string
  /** What it costs the hero to enter/continue */
  costToPlay: string
}

/** Generate a plain-English description of the scenario for a beginner */
export function narrateScenario(spot: Spot): ScenarioNarration {
  if (spot.kind === 'push-fold') {
    return narratePushFold(spot)
  }

  switch (spot.scenario) {
    case 'RFI':
      return narrateRFI(spot)
    case 'vs-open':
      return narrateVsOpen(spot as Spot & { kind: 'response' })
    case 'vs-3bet':
      return narrateVs3Bet(spot as Spot & { kind: 'response' })
    case 'vs-4bet':
      return narrateVs4Bet(spot as Spot & { kind: 'response' })
    case '3bet-defense':
      return narrate3BetDefense(spot as Spot & { kind: 'response' })
  }
}

function narrateRFI(spot: Spot): ScenarioNarration {
  const heroName = positionLabel(spot.hero)
  const raiseAmt = formatDollars(getRaiseAmount('RFI'))

  return {
    summary: `Everyone before you has folded. You're at ${heroName} with a chance to be the first to bet.`,
    potDescription: `There's ${describePot('RFI')}.`,
    costToPlay: `You can raise to ${raiseAmt} or fold.`,
  }
}

function narrateVsOpen(spot: Spot & { kind: 'response' }): ScenarioNarration {
  const heroName = positionLabel(spot.hero)
  const villainName = positionLabel(spot.villain)
  const openAmt = formatDollars(getRaiseAmount('RFI'))
  const reraiseAmt = formatDollars(getRaiseAmount('vs-open'))
  const callAmt = formatDollars(getCallAmount('vs-open'))

  return {
    summary: `${villainName} raised to ${openAmt}. You're at ${heroName}.`,
    potDescription: `There's ${describePot('vs-open')}.`,
    costToPlay: `You can call for ${callAmt}, re-raise to ${reraiseAmt}, or fold.`,
  }
}

function narrateVs3Bet(spot: Spot & { kind: 'response' }): ScenarioNarration {
  const villainName = positionLabel(spot.villain)
  const openAmt = formatDollars(getRaiseAmount('RFI'))
  const threeBetAmt = formatDollars(getRaiseAmount('vs-open'))
  const callAmt = formatDollars(getCallAmount('vs-3bet'))
  const fourBetAmt = formatDollars(getRaiseAmount('vs-3bet'))

  return {
    summary: `You raised to ${openAmt}, but ${villainName} re-raised to ${threeBetAmt}.`,
    potDescription: `There's ${describePot('vs-3bet')}.`,
    costToPlay: `You can call ${callAmt} more, raise again to ${fourBetAmt}, or fold.`,
  }
}

function narrateVs4Bet(spot: Spot & { kind: 'response' }): ScenarioNarration {
  const villainName = positionLabel(spot.villain)
  const fourBetAmt = formatDollars(getRaiseAmount('vs-3bet'))
  const callAmt = formatDollars(getCallAmount('vs-4bet'))

  return {
    summary: `The raises keep escalating — ${villainName} raised again to ${fourBetAmt}.`,
    potDescription: `There's ${describePot('vs-4bet')}.`,
    costToPlay: `You can call for ${callAmt} more, go all-in, or fold.`,
  }
}

function narrate3BetDefense(spot: Spot & { kind: 'response' }): ScenarioNarration {
  const villainName = positionLabel(spot.villain)

  return {
    summary: `${villainName} raised, you re-raised, and they called.`,
    potDescription: `There's ${describePot('3bet-defense')}.`,
    costToPlay: `You led the aggression — now what?`,
  }
}

function narratePushFold(spot: Spot & { kind: 'push-fold' }): ScenarioNarration {
  const heroName = positionLabel(spot.hero)
  const stack = formatDollars(spot.stackDepth * 2)

  if (spot.scenario === 'push') {
    return {
      summary: `You have a short stack of ${stack} at ${heroName}. With this few chips, your only real options are all-in or fold.`,
      potDescription: `There's ${describePot('push')}.`,
      costToPlay: `Push all-in for ${stack} or fold.`,
    }
  }

  // vs-push
  const villainName = spot.villain ? positionLabel(spot.villain) : 'Another player'
  return {
    summary: `${villainName} went all-in. You're at ${heroName} with ${stack}.`,
    potDescription: `There's ${describePot('vs-push')}.`,
    costToPlay: `Call the all-in or fold.`,
  }
}
