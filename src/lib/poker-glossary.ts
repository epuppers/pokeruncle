import type { Action, Position, Scenario } from '@/types/poker'
import type { TournamentScenario } from '@/features/trainer/types'

export interface TermEntry {
  /** Short/abbreviated form (used internally) */
  short: string
  /** Novice-friendly display name */
  label: string
  /** One-sentence explanation for tooltips */
  tip: string
}

export const POSITION_LABELS: Record<Position, TermEntry> = {
  UTG: { short: 'UTG', label: 'Under the Gun', tip: 'First to act before the flop — the toughest seat at the table' },
  MP: { short: 'MP', label: 'Middle Position', tip: 'Sits between the early and late positions' },
  CO: { short: 'CO', label: 'Cutoff', tip: 'One seat before the dealer — a strong late position' },
  BTN: { short: 'BTN', label: 'Dealer', tip: 'The best seat — you act last after the flop' },
  SB: { short: 'SB', label: 'Small Blind', tip: 'Posts a half-bet before cards are dealt' },
  BB: { short: 'BB', label: 'Big Blind', tip: 'Posts a full bet before cards are dealt' },
}

export const SCENARIO_LABELS: Record<Scenario, TermEntry> = {
  RFI: { short: 'RFI', label: 'Opening', tip: "You're the first player to raise — nobody has bet yet" },
  'vs-open': { short: 'vs Open', label: 'Facing a Raise', tip: 'Another player raised before you — call, re-raise, or fold?' },
  'vs-3bet': { short: 'vs 3bet', label: 'Facing a Re-raise', tip: 'You raised, they re-raised back. Now what?' },
  'vs-4bet': { short: 'vs 4bet', label: 'Facing a 4-Bet', tip: 'The raises keep escalating — big decision time' },
  '3bet-defense': { short: '3bet Def', label: 'After Re-raising', tip: 'You re-raised and they called — you led the aggression' },
}

export const TOURNAMENT_SCENARIO_LABELS: Record<TournamentScenario, TermEntry> = {
  push: { short: 'Push', label: 'Push or Fold', tip: 'With a short stack, your only options are to go all-in or fold' },
  'vs-push': { short: 'vs Push', label: 'Facing an All-in', tip: 'Another player went all-in — do you call or fold?' },
}

export const ACTION_LABELS: Record<Action, TermEntry> = {
  fold: { short: 'Fold', label: 'Fold', tip: 'Give up your hand and lose nothing more' },
  call: { short: 'Call', label: 'Call', tip: 'Match the current bet to stay in the hand' },
  raise: { short: 'Raise', label: 'Raise', tip: 'Increase the bet — puts pressure on other players' },
  allin: { short: 'All-in', label: 'All-in', tip: 'Bet all your chips — maximum pressure' },
}

/** Get the novice-friendly label for a position */
export function positionLabel(pos: Position): string {
  return POSITION_LABELS[pos].label
}

/** Get the novice-friendly label for a scenario */
export function scenarioLabel(scenario: Scenario): string {
  return SCENARIO_LABELS[scenario].label
}

/** Get the novice-friendly label for a tournament scenario */
export function tournamentScenarioLabel(scenario: TournamentScenario): string {
  return TOURNAMENT_SCENARIO_LABELS[scenario].label
}

/** Get the novice-friendly label for an action */
export function actionLabel(action: Action): string {
  return ACTION_LABELS[action].label
}
