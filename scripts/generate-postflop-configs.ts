/**
 * Generate TexasSolver postflop config files for all board+node combinations.
 *
 * Usage:
 *   bun run scripts/generate-postflop-configs.ts [--provider pekarstas] [--output postflop-solver-configs/]
 *
 * Each config is a text file that TexasSolver's console_solver can read:
 *   console_solver --input_file postflop-solver-configs/BTN-open_BB-call_As7d2c.txt
 *
 * The config includes:
 *   - Both players' preflop ranges (opener from chart data, caller from derived villain ranges)
 *   - A specific board texture
 *   - Bet sizing tree and solve parameters
 */

import { parseArgs } from 'util'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

import type { Provider } from '../src/types/poker'
import { getChart } from '../src/data/ranges'
import { getVillainRange } from '../src/data/villain-ranges'

import { chartToRangeString, isIPPosition } from './lib/solver-utils'
import { NODE_BOARD_CATALOG, TOTAL_SOLUTIONS } from './lib/board-catalog'

import type { CatalogNode } from './lib/board-catalog'

// --- Config generation ---

/** Convert board string "As 7d 2c" to TexasSolver format "As,7d,2c" */
function boardToSolverFormat(boardString: string): string {
  return boardString.split(' ').join(',')
}

/** Convert board string "As 7d 2c" to compact key "As7d2c" */
function boardToCompactKey(boardString: string): string {
  return boardString.replace(/\s/g, '')
}

/**
 * TexasSolver range format:
 * - Weight 1.0: just the hand name "AA"
 * - Weight < 1.0: "AA:0.75"
 * Our chartToRangeString outputs "AA:1.0000" — strip the ":1.0000" for clean input.
 */
function cleanRangeString(rangeStr: string): string {
  return rangeStr.replace(/:1\.0000/g, '')
}

interface PotParams {
  potSizeBB: number
  effectiveStackBB: number
}

function getPotParams(node: CatalogNode): PotParams {
  if (node.potType === 'srp') {
    // SB open vs BB: pot = 4bb (SB completes to 2bb + BB 2bb), stacks = 98bb
    if (node.opener === 'SB') {
      return { potSizeBB: 5, effectiveStackBB: 97.5 }
    }
    // Standard open to 2.5bb, BB calls: pot = 6.5bb (2.5 + 2.5 + 0.5 SB + 1 BB ante-adjust)
    return { potSizeBB: 6.5, effectiveStackBB: 97 }
  }
  // 3-bet pot: open 2.5bb, 3bet ~9bb, call: pot = ~20.5bb, stacks ~89.75bb
  return { potSizeBB: 20.5, effectiveStackBB: 89.75 }
}

function generatePostflopConfig(
  node: CatalogNode,
  nodeKey: string,
  boardString: string,
  provider: Provider,
  outputDir: string,
): { filename: string; content: string } | null {
  const boardKey = boardToCompactKey(boardString)
  const filename = `${nodeKey}_${boardKey}.txt`

  // Get opener's range
  const openerChart = getChart(provider, node.opener, 'RFI')
  if (!openerChart) {
    console.warn(`  ⚠ No RFI chart for ${node.opener} in ${provider}, skipping`)
    return null
  }
  const openerRange = cleanRangeString(chartToRangeString(openerChart, ['raise', 'allin']))

  // Get caller's (villain/hero) continuing range
  const villainNode = node.potType === 'srp'
    ? { potType: 'srp' as const, opener: node.opener, caller: node.caller }
    : { potType: '3bet' as const, opener: node.opener, threeBettor: node.threeBettor, caller: node.caller }
  const callerChart = getVillainRange(villainNode)
  if (!callerChart) {
    console.warn(`  ⚠ No villain range for ${nodeKey}, skipping`)
    return null
  }
  const callerRange = cleanRangeString(chartToRangeString(callerChart))

  if (!openerRange || !callerRange) {
    console.warn(`  ⚠ Empty range for ${nodeKey}, skipping`)
    return null
  }

  // Determine IP/OOP
  const openerIsIP = isIPPosition(node.opener, node.caller)
  const ipRange = openerIsIP ? openerRange : callerRange
  const oopRange = openerIsIP ? callerRange : openerRange

  const { potSizeBB, effectiveStackBB } = getPotParams(node)
  const boardSolver = boardToSolverFormat(boardString)

  // Use integer pot and stack values (TexasSolver expects integers or simple floats)
  const potChips = Math.round(potSizeBB * 2) // Convert to chips (2 chips per bb)
  const stackChips = Math.round(effectiveStackBB * 2)

  const content = `set_pot ${potChips}
set_effective_stack ${stackChips}
set_board ${boardSolver}
set_range_ip ${ipRange}
set_range_oop ${oopRange}
set_bet_sizes oop,flop,bet,33,75
set_bet_sizes oop,flop,raise,60
set_bet_sizes oop,flop,allin
set_bet_sizes ip,flop,bet,33,75
set_bet_sizes ip,flop,raise,60
set_bet_sizes ip,flop,allin
set_bet_sizes oop,turn,bet,66
set_bet_sizes oop,turn,raise,60
set_bet_sizes oop,turn,allin
set_bet_sizes ip,turn,bet,66
set_bet_sizes ip,turn,raise,60
set_bet_sizes ip,turn,allin
set_bet_sizes oop,river,bet,66
set_bet_sizes oop,river,raise,60
set_bet_sizes oop,river,allin
set_bet_sizes ip,river,bet,66
set_bet_sizes ip,river,raise,60
set_bet_sizes ip,river,allin
set_allin_threshold 0.67
build_tree
set_thread_num 0
set_accuracy 0.5
set_max_iteration 100
set_print_interval 10
set_use_isomorphism 1
start_solve
set_dump_rounds 1
dump_result ${join(outputDir, `${nodeKey}_${boardKey}_result.json`)}
`

  return { filename, content }
}

// --- Main ---

function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      provider: { type: 'string', default: 'pekarstas' },
      output: { type: 'string', default: 'postflop-solver-configs' },
    },
  })

  const provider = (values.provider ?? 'pekarstas') as Provider
  const outputDir = values.output ?? 'postflop-solver-configs'

  mkdirSync(outputDir, { recursive: true })

  console.log(`Generating postflop TexasSolver configs`)
  console.log(`Provider: ${provider}`)
  console.log(`Output: ${outputDir}/`)
  console.log(`Total board+node combinations: ${TOTAL_SOLUTIONS}`)
  console.log()

  let generated = 0
  let skipped = 0

  for (const { node, nodeKey, boards } of NODE_BOARD_CATALOG) {
    console.log(`${nodeKey} (${boards.length} boards):`)

    for (const board of boards) {
      const result = generatePostflopConfig(node, nodeKey, board.cards, provider, outputDir)
      if (result) {
        const filepath = join(outputDir, result.filename)
        writeFileSync(filepath, result.content, 'utf-8')
        console.log(`  ✓ ${result.filename} [${board.archetype}]`)
        generated++
      } else {
        skipped++
      }
    }
  }

  console.log()
  console.log(`Generated: ${generated} configs`)
  if (skipped > 0) console.log(`Skipped: ${skipped}`)
  console.log()
  console.log(`Run each config with:`)
  console.log(`  /Users/eliotpuplett/Documents/TexasSolver/build/console_solver --input_file ${outputDir}/<config>.txt`)
}

main()
