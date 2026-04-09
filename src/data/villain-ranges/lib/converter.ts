import type { Cell, Action } from '@/types/poker'
import type { Chart } from '@/data/ranges'

import { comboToHandClass } from './notation'

/**
 * A single combo's strategy from TexasSolver output.
 * The keys are action names (e.g., "CHECK", "BET", "CALL", "FOLD", "RAISE", "ALLIN").
 * The values are frequencies (0–1).
 */
export type SolverComboStrategy = Record<string, number>

/**
 * Map TexasSolver action names to our canonical actions.
 * TexasSolver uses uppercase action names that vary by context.
 */
function mapSolverAction(solverAction: string): Action | null {
  const normalized = solverAction.toUpperCase().trim()

  // Fold
  if (normalized === 'FOLD') return 'fold'

  // Passive actions
  if (normalized === 'CALL' || normalized === 'CHECK') return 'call'

  // Aggressive actions
  if (normalized === 'RAISE' || normalized === 'BET') return 'raise'

  // Maximum aggression
  if (normalized === 'ALLIN' || normalized === 'ALL-IN' || normalized === 'ALL_IN') return 'allin'

  return null
}

/** Intermediate accumulator for averaging combo frequencies into a hand class */
interface HandClassAccumulator {
  actions: Record<Action, number>
  comboCount: number
}

/**
 * Convert TexasSolver strategy output into our Chart format.
 *
 * Takes a map of combo → action frequencies from the solver,
 * aggregates combos into hand classes (averaging frequencies),
 * and returns a sparse Chart where unlisted hands are fold.
 *
 * @param comboStrategies Map of combo string (e.g., "AHKD") to action frequency map
 * @param minWeight Minimum weight to include a hand (0–100). Hands below this are treated as fold.
 */
export function convertSolverOutput(
  comboStrategies: Map<string, SolverComboStrategy>,
  minWeight: number = 1
): Chart {
  // Phase 1: Aggregate combos into hand classes
  const accumulators = new Map<string, HandClassAccumulator>()

  for (const [combo, strategy] of comboStrategies) {
    const handClass = comboToHandClass(combo)

    let acc = accumulators.get(handClass)
    if (!acc) {
      acc = { actions: { fold: 0, call: 0, raise: 0, allin: 0 }, comboCount: 0 }
      accumulators.set(handClass, acc)
    }

    // Sum frequencies across combos for averaging later
    for (const [solverAction, freq] of Object.entries(strategy)) {
      const action = mapSolverAction(solverAction)
      if (action) {
        acc.actions[action] += freq
      }
    }
    acc.comboCount++
  }

  // Phase 2: Convert accumulators to Chart cells
  const chart: Chart = {}

  for (const [handClass, acc] of accumulators) {
    // Average the frequencies across combos
    const avgActions: Record<Action, number> = {
      fold: acc.actions.fold / acc.comboCount,
      call: acc.actions.call / acc.comboCount,
      raise: acc.actions.raise / acc.comboCount,
      allin: acc.actions.allin / acc.comboCount,
    }

    // Weight = percentage of time this hand is NOT folding (0–100)
    const foldFreq = avgActions.fold
    const weight = Math.round((1 - foldFreq) * 100)

    if (weight < minWeight) continue // too much folding, treat as fold (sparse)

    // Build action distribution for the non-fold portion
    const nonFoldTotal = 1 - foldFreq
    if (nonFoldTotal <= 0) continue

    const cell = buildCell(weight, avgActions, nonFoldTotal)
    if (cell !== null) {
      chart[handClass] = cell
    }
  }

  return chart
}

/**
 * Build the most compact Cell representation for the given frequencies.
 * Returns null if the hand should be treated as fold.
 */
function buildCell(
  weight: number,
  avgActions: Record<Action, number>,
  nonFoldTotal: number
): Cell | null {
  // Normalize non-fold actions to sum to 100
  const callPct = Math.round((avgActions.call / nonFoldTotal) * 100)
  const raisePct = Math.round((avgActions.raise / nonFoldTotal) * 100)
  const allinPct = Math.round((avgActions.allin / nonFoldTotal) * 100)

  // Find the dominant action(s)
  const allActionPcts: [Action, number][] = [
    ['call', callPct],
    ['raise', raisePct],
    ['allin', allinPct],
  ]
  const actionPcts = allActionPcts.filter(([, pct]) => pct > 0)

  if (actionPcts.length === 0) return null

  // Pure strategy: 100% weight, single action → simple string
  if (weight === 100 && actionPcts.length === 1) {
    return actionPcts[0][0]
  }

  // Mixed strategy or partial weight → full WeightedCell
  const actions: Partial<Record<Action, number>> = {}
  for (const [action, pct] of actionPcts) {
    actions[action] = pct
  }

  // Ensure percentages sum to 100 (rounding fix)
  const total = Object.values(actions).reduce((sum, v) => sum + (v ?? 0), 0)
  if (total !== 100 && actionPcts.length > 0) {
    // Adjust the largest action to compensate for rounding
    const largest = actionPcts.sort((a, b) => b[1] - a[1])[0][0]
    actions[largest] = (actions[largest] ?? 0) + (100 - total)
  }

  return { weight, actions }
}
