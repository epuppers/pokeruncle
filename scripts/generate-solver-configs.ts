/**
 * Generate TexasSolver input config files for all priority villain range nodes.
 *
 * Usage:
 *   bun run scripts/generate-solver-configs.ts [--provider pekarstas] [--output solver-configs/]
 *
 * This generates .txt files that can be fed to TexasSolver's console version:
 *   console_solver -i solver-configs/BTN-open_BB-call.txt
 *
 * See src/data/villain-ranges/METHODOLOGY.md for full instructions.
 */

import { parseArgs } from 'util'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

import type { Position } from '../src/types/poker'
import { getChart } from '../src/data/ranges'
import type { Provider } from '../src/types/poker'

import { chartToRangeString, isIPPosition } from './lib/solver-utils'

// --- Priority nodes ---

interface SRPNode {
  potType: 'srp'
  opener: Position
  caller: Position
}

interface ThreeBetNode {
  potType: '3bet'
  opener: Position
  threeBettor: Position
  caller: Position
}

type Node = SRPNode | ThreeBetNode

const PRIORITY_NODES: Node[] = [
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

function nodeKey(node: Node): string {
  if (node.potType === 'srp') {
    return `${node.opener}-open_${node.caller}-call`
  }
  return `${node.opener}-open_${node.threeBettor}-3bet_${node.caller}-call`
}

// --- TexasSolver config generation ---

/**
 * Generate a TexasSolver input config for a given node.
 *
 * The config sets up a preflop tree where:
 * - For SRP: opener raises, others fold, caller faces the decision
 * - For 3bet: opener raises, 3bettor 3bets, caller faces the decision
 *
 * The solver will compute the caller's optimal strategy (call/fold/raise).
 * We extract the calling range from the solution.
 */
function generateConfig(
  node: Node,
  provider: Provider,
  outputDir: string
): { filename: string; content: string } {
  const filename = `${nodeKey(node)}.txt`

  let openerRange: string
  let description: string

  if (node.potType === 'srp') {
    // Get opener's RFI range
    const rfiChart = getChart(provider, node.opener, 'RFI')
    if (!rfiChart) {
      console.warn(`No RFI chart for ${node.opener} in ${provider}`)
      openerRange = ''
    } else {
      openerRange = chartToRangeString(rfiChart, ['raise', 'allin'])
    }
    description = `${node.opener} opens, ${node.caller} faces decision (SRP)`
  } else {
    // For 3bet pots, get opener's RFI range
    const rfiChart = getChart(provider, node.opener, 'RFI')
    if (!rfiChart) {
      console.warn(`No RFI chart for ${node.opener} in ${provider}`)
      openerRange = ''
    } else {
      openerRange = chartToRangeString(rfiChart, ['raise', 'allin'])
    }
    description = `${node.opener} opens, ${node.threeBettor} 3bets, ${node.caller} faces decision (3bet pot)`
  }

  // Build the config file content
  // This is a template — TexasSolver config format reference:
  // https://github.com/bupticybee/TexasSolver/tree/console
  const content = `# TexasSolver config for: ${description}
# Node: ${nodeKey(node)}
# Provider: ${provider}
# Generated: ${new Date().toISOString().split('T')[0]}
#
# IMPORTANT: Review and adjust these parameters before running.
# The range strings below are extracted from the ${provider} provider data.
# Bet sizes, stack depth, and rake should match your study conditions.
#
# Usage: console_solver -i ${filename}

# --- Game Parameters ---
set_pot 0
set_effective_stack 100
set_board
set_range_ip ${node.potType === 'srp' && isIPPosition(node.opener, node.caller) ? openerRange : 'AA:1.0'}
set_range_oop ${node.potType === 'srp' && !isIPPosition(node.opener, node.caller) ? openerRange : 'AA:1.0'}

# --- Tree Parameters ---
# Adjust bet sizes to match your preferred tree
set_bet_sizes oop flop bet 33,75
set_bet_sizes oop flop raise 60
set_bet_sizes oop flop donk 33
set_bet_sizes ip flop bet 33,75
set_bet_sizes ip flop raise 60
set_bet_sizes oop turn bet 50,100
set_bet_sizes oop turn raise 60
set_bet_sizes oop turn donk 50
set_bet_sizes ip turn bet 50,100
set_bet_sizes ip turn raise 60
set_bet_sizes oop river bet 50,100,200
set_bet_sizes oop river raise 60
set_bet_sizes oop river donk 50,100
set_bet_sizes ip river bet 50,100,200
set_bet_sizes ip river raise 60

# --- Solve Parameters ---
set_accuracy 0.3
set_max_iteration 1000
set_use_isomorphism 1
set_thread_num 0

# --- Opener Range (for reference) ---
# Position: ${node.potType === 'srp' ? node.opener : node.opener}
# Scenario: RFI
# Range: ${openerRange || '(not found)'}

build
solve
dump_result ${join(outputDir, `${nodeKey(node)}_result.json`)}
`

  return { filename, content }
}

// --- Main ---

function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      provider: { type: 'string', default: 'pekarstas' },
      output: { type: 'string', default: 'solver-configs' },
    },
  })

  const provider = (values.provider ?? 'pekarstas') as Provider
  const outputDir = values.output ?? 'solver-configs'

  mkdirSync(outputDir, { recursive: true })

  console.log(`Generating TexasSolver configs for ${PRIORITY_NODES.length} nodes`)
  console.log(`Provider: ${provider}`)
  console.log(`Output: ${outputDir}/`)
  console.log()

  for (const node of PRIORITY_NODES) {
    const { filename, content } = generateConfig(node, provider, outputDir)
    const filepath = join(outputDir, filename)
    writeFileSync(filepath, content, 'utf-8')
    console.log(`  ✓ ${filename}`)
  }

  console.log()
  console.log(`Done. Run each config with:`)
  console.log(`  console_solver -i ${outputDir}/<config>.txt`)
}

main()
