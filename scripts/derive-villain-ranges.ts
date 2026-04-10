/**
 * Derive villain continuing ranges from existing chart data.
 *
 * For each priority node, this reads the relevant hero chart (vs-open, vs-3bet)
 * and extracts the calling range — i.e., the hands the villain shows up with
 * on the flop after the preflop action sequence completes.
 *
 * Usage:
 *   bun run scripts/derive-villain-ranges.ts [--provider pekarstas] [--dry-run]
 */

import { parseArgs } from 'util'

import type { Position, Provider, Cell } from '../src/types/poker'
import { normalizeCell } from '../src/types/poker'
import { getChart, type Chart } from '../src/data/ranges'
import type { VillainRangeNode, VillainRangeEntry } from '../src/data/villain-ranges/types'
import { villainRangeKey } from '../src/data/villain-ranges/types'

// --- Priority nodes (same as METHODOLOGY.md) ---

const PRIORITY_NODES: VillainRangeNode[] = [
  // Single Raised Pots
  { potType: 'srp', opener: 'BTN', caller: 'BB' },
  { potType: 'srp', opener: 'CO', caller: 'BB' },
  { potType: 'srp', opener: 'CO', caller: 'BTN' },
  { potType: 'srp', opener: 'BTN', caller: 'SB' },
  { potType: 'srp', opener: 'MP', caller: 'BB' },
  { potType: 'srp', opener: 'UTG', caller: 'BB' },
  { potType: 'srp', opener: 'SB', caller: 'BB' },
  { potType: 'srp', opener: 'UTG', caller: 'BTN' },
  // 3-Bet Pots
  { potType: '3bet', opener: 'BTN', threeBettor: 'BB', caller: 'BTN' },
  { potType: '3bet', opener: 'CO', threeBettor: 'BTN', caller: 'CO' },
  { potType: '3bet', opener: 'BTN', threeBettor: 'SB', caller: 'BTN' },
  { potType: '3bet', opener: 'CO', threeBettor: 'BB', caller: 'CO' },
]

/**
 * Extract the calling range from a chart.
 *
 * For each hand in the chart, we compute how often the player calls (vs folds/raises).
 * The result is a Chart where each hand's weight reflects how often it continues
 * via calling.
 *
 * - Pure 'call' → weight 100, call 100
 * - Pure 'raise' or 'fold' → excluded
 * - Mixed with call component → weight = original weight × (call% / 100)
 */
function extractCallingRange(chart: Chart): Chart {
  const result: Chart = {}

  for (const [hand, cell] of Object.entries(chart)) {
    const normalized = normalizeCell(cell)
    const callFreq = normalized.actions.call ?? 0

    if (callFreq <= 0) continue

    // Effective weight = range weight × call frequency
    const effectiveWeight = (normalized.weight / 100) * callFreq

    if (effectiveWeight <= 0) continue

    if (effectiveWeight >= 99.5) {
      // Pure call — use simple format
      result[hand] = 'call'
    } else {
      result[hand] = { weight: Math.round(effectiveWeight), actions: { call: 100 } }
    }
  }

  return result
}

/**
 * Derive the villain's continuing range for a given node.
 *
 * For SRP (e.g. BTN opens, BB calls):
 *   → Look at caller's vs-open chart facing the opener
 *   → Extract hands where caller calls
 *
 * For 3bet pots (e.g. BTN opens, BB 3bets, BTN calls):
 *   → Look at caller's vs-3bet chart facing the 3bettor
 *   → Extract hands where caller calls the 3bet
 */
function deriveRange(node: VillainRangeNode, provider: Provider): Chart | null {
  if (node.potType === 'srp') {
    // Caller's response to opener's open
    const chart = getChart(provider, node.caller, 'vs-open', node.opener)
    if (!chart) {
      console.warn(`  ⚠ No vs-open chart for ${node.caller} vs ${node.opener} in ${provider}`)
      return null
    }
    return extractCallingRange(chart)
  }

  // 3bet pot: caller's response to the 3bet
  const chart = getChart(provider, node.caller, 'vs-3bet', node.threeBettor)
  if (!chart) {
    console.warn(`  ⚠ No vs-3bet chart for ${node.caller} vs ${node.threeBettor} in ${provider}`)
    return null
  }
  return extractCallingRange(chart)
}

function countHands(chart: Chart): number {
  return Object.keys(chart).length
}

// --- Output formatting ---

function cellToString(cell: Cell): string {
  if (typeof cell === 'string') return `'${cell}'`
  if (Array.isArray(cell)) return `['${cell[0]}', '${cell[1]}']`
  return `{ weight: ${cell.weight}, actions: { call: 100 } }`
}

function formatEntry(entry: VillainRangeEntry): string {
  const nodeStr =
    entry.node.potType === 'srp'
      ? `{ potType: 'srp', opener: '${entry.node.opener}', caller: '${entry.node.caller}' }`
      : `{ potType: '3bet', opener: '${entry.node.opener}', threeBettor: '${entry.node.threeBettor}', caller: '${entry.node.caller}' }`

  const rangeLines = Object.entries(entry.range)
    .map(([hand, cell]) => `      '${hand}': ${cellToString(cell)},`)
    .join('\n')

  return `  {
    node: ${nodeStr},
    range: {
${rangeLines}
    },
    metadata: {
      solver: '${entry.metadata.solver}',
      solveDate: '${entry.metadata.solveDate}',
      stackDepthBB: ${entry.metadata.stackDepthBB},
      exploitability: '${entry.metadata.exploitability ?? 'N/A — derived from chart data'}',
    },
  },`
}

// --- Main ---

function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      provider: { type: 'string', default: 'pekarstas' },
      'dry-run': { type: 'boolean', default: false },
    },
  })

  const provider = (values.provider ?? 'pekarstas') as Provider
  const dryRun = values['dry-run'] ?? false
  const today = new Date().toISOString().split('T')[0]

  console.log(`Deriving villain ranges from ${provider} chart data`)
  console.log(`Nodes: ${PRIORITY_NODES.length}`)
  if (dryRun) console.log('(dry run — not writing files)')
  console.log()

  const entries: VillainRangeEntry[] = []

  for (const node of PRIORITY_NODES) {
    const key = villainRangeKey(node)
    const range = deriveRange(node, provider)

    if (!range) {
      console.log(`  ✗ ${key} — no chart data available`)
      continue
    }

    const handCount = countHands(range)
    console.log(`  ✓ ${key} — ${handCount} hand classes`)

    entries.push({
      node,
      range,
      metadata: {
        solver: `derived from ${provider} charts`,
        solveDate: today,
        stackDepthBB: 100,
        exploitability: 'N/A — derived from chart data, not solver output',
      },
    })
  }

  console.log()
  console.log(`Successfully derived ${entries.length} / ${PRIORITY_NODES.length} ranges`)

  if (dryRun) {
    console.log('\nDry run output:\n')
    for (const entry of entries) {
      console.log(formatEntry(entry))
      console.log()
    }
    return
  }

  // Generate the full file content
  const fileContent = `import type { VillainRangeEntry } from './types'

/**
 * Villain continuing ranges for 100bb 6-max cash games.
 *
 * Derived programmatically from ${provider} provider chart data.
 * For each node, we extract the caller's hands that continue via calling
 * from the relevant vs-open or vs-3bet chart.
 *
 * Generated: ${today}
 * Provider: ${provider}
 * Script: scripts/derive-villain-ranges.ts
 *
 * To regenerate:
 *   bun run scripts/derive-villain-ranges.ts --provider ${provider}
 */
export const villainRanges: VillainRangeEntry[] = [
${entries.map(formatEntry).join('\n\n')}
]
`

  const outPath = 'src/data/villain-ranges/cash-100bb.ts'
  Bun.write(outPath, fileContent)
  console.log(`\nWrote ${outPath}`)
}

main()
