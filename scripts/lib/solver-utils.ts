/**
 * Shared utilities for TexasSolver config generation scripts.
 */

import type { Position, Action } from '../../src/types/poker'
import type { Chart } from '../../src/data/ranges'

/**
 * Convert a Chart to a TexasSolver range string.
 * Format: "AA:1.0,AKs:1.0,AKo:0.5,..."
 *
 * For pure strategy cells (single action like 'raise'), weight is 1.0.
 * For weighted cells, weight is the cell's weight / 100.
 * For fold actions, the hand is excluded entirely.
 */
export function chartToRangeString(chart: Chart, includeActions?: Action[]): string {
  const parts: string[] = []

  for (const [hand, cell] of Object.entries(chart)) {
    let weight: number

    if (typeof cell === 'string') {
      if (cell === 'fold') continue
      if (includeActions && !includeActions.includes(cell)) continue
      weight = 1.0
    } else if (Array.isArray(cell)) {
      if (includeActions && !cell.some((a) => includeActions.includes(a))) continue
      weight = 1.0
    } else {
      if (cell.weight <= 0) continue
      if (includeActions) {
        const matchingFreq = includeActions.reduce(
          (sum, a) => sum + (cell.actions[a] ?? 0),
          0
        )
        if (matchingFreq <= 0) continue
        weight = (cell.weight / 100) * (matchingFreq / 100)
      } else {
        const foldFreq = cell.actions.fold ?? 0
        weight = (cell.weight / 100) * ((100 - foldFreq) / 100)
      }
    }

    if (weight <= 0) continue
    parts.push(`${hand}:${weight.toFixed(4)}`)
  }

  return parts.join(',')
}

/**
 * Convert a villain range Chart to a TexasSolver range string.
 * Villain ranges use 'call' as the action — all non-fold hands are included.
 */
export function villainChartToRangeString(chart: Chart): string {
  return chartToRangeString(chart)
}

/** Determine if position A is in position relative to position B postflop */
export function isIPPosition(posA: Position, posB: Position): boolean {
  const order: Position[] = ['SB', 'BB', 'UTG', 'MP', 'CO', 'BTN']
  return order.indexOf(posA) > order.indexOf(posB)
}
