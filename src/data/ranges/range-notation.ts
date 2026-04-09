/**
 * Expands compact range notation (e.g. "22+, A2s+, KTo+") into individual
 * hand names (e.g. ["AA", "KK", ..., "22", "AKs", ..., "A2s", "KTo", ...]).
 *
 * Supported notation:
 *   "AA"       → single hand
 *   "22+"      → pair range (22 through AA)
 *   "77-TT"    → pair range (77 through TT)
 *   "A2s+"     → suited range (A2s through AKs)
 *   "K9s-KJs"  → suited sub-range
 *   "A5o+"     → offsuit range (A5o through AKo)
 *   "KTo-KQo"  → offsuit sub-range
 *
 * This is used exclusively for authoring push/fold chart data in a compact,
 * readable format. The output hand names match the upstream chart format.
 */

import { RANKS } from '@/types/poker'

function rankIndex(r: string): number {
  const idx = RANKS.indexOf(r as (typeof RANKS)[number])
  if (idx === -1) throw new Error(`Invalid rank: ${r}`)
  return idx
}

function expandSingle(token: string): string[] {
  const t = token.trim()
  if (t.length === 0) return []

  // Pair with +: "77+"
  if (t.length === 3 && t[0] === t[1] && t[2] === '+') {
    const start = rankIndex(t[0])
    const hands: string[] = []
    for (let i = start; i >= 0; i--) {
      hands.push(`${RANKS[i]}${RANKS[i]}`)
    }
    return hands
  }

  // Pair range: "55-88"
  if (t.length === 5 && t[0] === t[1] && t[2] === '-' && t[3] === t[4]) {
    const lo = rankIndex(t[0])
    const hi = rankIndex(t[3])
    const hands: string[] = []
    for (let i = lo; i >= hi; i--) {
      hands.push(`${RANKS[i]}${RANKS[i]}`)
    }
    return hands
  }

  // Suited/offsuit with +: "A2s+", "KTo+"
  if (t.length === 4 && t[3] === '+' && (t[2] === 's' || t[2] === 'o')) {
    const high = rankIndex(t[0])
    const lowStart = rankIndex(t[1])
    const suffix = t[2]
    const hands: string[] = []
    // Go from lowStart up to high+1 (one below the high card)
    for (let i = lowStart; i > high; i--) {
      hands.push(`${RANKS[high]}${RANKS[i]}${suffix}`)
    }
    return hands
  }

  // Suited/offsuit range: "K9s-KJs", "Q9o-QJo"
  if ((t.length === 7 || t.length === 7) && t[3] === '-' && t[2] === t[6] && (t[2] === 's' || t[2] === 'o')) {
    const high = rankIndex(t[0])
    const loStart = rankIndex(t[1])
    const loEnd = rankIndex(t[5])
    const suffix = t[2]
    if (t[0] !== t[4]) throw new Error(`Range high cards must match: ${t}`)
    const hands: string[] = []
    for (let i = loStart; i >= loEnd; i--) {
      hands.push(`${RANKS[high]}${RANKS[i]}${suffix}`)
    }
    return hands
  }

  // Single hand: "AA", "AKs", "72o"
  if (t.length === 2 || t.length === 3) {
    return [t]
  }

  throw new Error(`Unrecognized range notation: "${t}"`)
}

/** Expand a comma-separated range string into individual hand names. */
export function expandRange(notation: string): string[] {
  const tokens = notation.split(',')
  const hands: string[] = []
  for (const token of tokens) {
    hands.push(...expandSingle(token))
  }
  return hands
}

import type { Chart } from './index'

/** Build a push chart (all hands map to 'allin'). */
export function pushChart(notation: string): Chart {
  const hands = expandRange(notation)
  const chart: Chart = {}
  for (const hand of hands) {
    chart[hand] = 'allin'
  }
  return chart
}

/** Build a calling chart (all hands map to 'call'). */
export function callChart(notation: string): Chart {
  const hands = expandRange(notation)
  const chart: Chart = {}
  for (const hand of hands) {
    chart[hand] = 'call'
  }
  return chart
}
