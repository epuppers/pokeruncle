/**
 * Convert TexasSolver postflop output files into CachedSolution JSON.
 *
 * Usage:
 *   bun run scripts/convert-postflop-solutions.ts [--input postflop-solver-configs/] [--output public/postflop-cache/]
 *
 * Reads all *_result.json files from the input directory, converts each to
 * CachedSolution format, and writes to the output directory.
 *
 * TexasSolver output structure:
 *   { node_type, childrens, strategy: { strategy: { combo: [freq, ...] } }, actions: [...], player }
 *
 * The root node is OOP's decision point. After "CHECK", the next node is IP's decision.
 * We extract the hero's strategy based on who acts first (OOP hero = root, IP hero = after OOP CHECK).
 */

import { parseArgs } from 'util'
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'fs'
import { join, basename } from 'path'

import { comboToHandClass } from '../src/data/villain-ranges/lib/notation'
import { isIPPosition } from './lib/solver-utils'
import { NODE_BOARD_CATALOG } from './lib/board-catalog'

import type { PostflopAction, PostflopActionWeights } from '../src/features/postflop/types'

// --- Types for TexasSolver output ---

interface SolverActionNode {
  node_type: 'action_node'
  childrens: Record<string, SolverNode>
  strategy: { strategy: Record<string, number[]> }
  actions: string[]
  player: number // 0 = IP, 1 = OOP
}

interface SolverChanceNode {
  node_type: 'chance_node'
  deal_cards: unknown
  deal_number: number
}

type SolverNode = SolverActionNode | SolverChanceNode

interface CachedSolution {
  solutionKey: string
  nodeKey: string
  boardString: string
  street: string
  potSizeBB: number
  effectiveStackBB: number
  strategies: Record<string, PostflopActionWeights>
  exploitability: number
  solvedAt: number
}

// --- Action mapping ---

/**
 * Map a TexasSolver action label to our PostflopAction.
 * Solver uses: "CHECK", "BET X.X", "FOLD", "CALL", "RAISE X.X", "ALLIN"
 * We map BET sizes based on the percentage of pot they represent.
 */
function mapSolverAction(solverAction: string, potSize: number): PostflopAction | null {
  const normalized = solverAction.toUpperCase().trim()

  if (normalized === 'CHECK') return 'check'
  if (normalized === 'FOLD') return 'fold'
  if (normalized === 'CALL') return 'call'
  if (normalized === 'ALLIN') return 'allin'

  // BET X.X or RAISE X.X — extract the chip amount and compute pot %
  const betMatch = normalized.match(/^(BET|RAISE)\s+([\d.]+)$/)
  if (betMatch) {
    const isRaise = betMatch[1] === 'RAISE'
    if (isRaise) return 'raise'

    const chipAmount = parseFloat(betMatch[2])
    const pctOfPot = (chipAmount / potSize) * 100

    if (pctOfPot < 50) return 'bet-small'
    if (pctOfPot < 90) return 'bet-medium'
    return 'bet-large'
  }

  console.warn(`  Unknown solver action: "${solverAction}"`)
  return null
}

// --- Combo aggregation ---

interface HandClassAccumulator {
  actions: Map<PostflopAction, number>
  comboCount: number
}

/**
 * Extract and aggregate the hero's strategy from a solver action node.
 * Returns a map of hand class → PostflopActionWeights.
 */
function extractStrategy(
  node: SolverActionNode,
  potSize: number,
): Record<string, PostflopActionWeights> {
  const accumulators = new Map<string, HandClassAccumulator>()

  // Map action indices to PostflopAction
  const actionMap: (PostflopAction | null)[] = node.actions.map((a) =>
    mapSolverAction(a, potSize)
  )

  for (const [combo, frequencies] of Object.entries(node.strategy.strategy)) {
    let handClass: string
    try {
      handClass = comboToHandClass(combo)
    } catch {
      continue // Skip invalid combos (e.g., combos blocked by board cards)
    }

    let acc = accumulators.get(handClass)
    if (!acc) {
      acc = { actions: new Map(), comboCount: 0 }
      accumulators.set(handClass, acc)
    }

    for (let i = 0; i < frequencies.length && i < actionMap.length; i++) {
      const action = actionMap[i]
      if (action === null) continue
      const current = acc.actions.get(action) ?? 0
      acc.actions.set(action, current + frequencies[i])
    }
    acc.comboCount++
  }

  // Convert accumulators to PostflopActionWeights
  const strategies: Record<string, PostflopActionWeights> = {}

  for (const [handClass, acc] of accumulators) {
    if (acc.comboCount === 0) continue

    // Average frequencies across combos, then normalize to percentages
    const weights: PostflopActionWeights = {}
    let total = 0

    for (const [action, sum] of acc.actions) {
      const avg = sum / acc.comboCount
      if (avg > 0.005) { // Skip near-zero frequencies
        total += avg
      }
    }

    if (total <= 0) continue

    // Normalize to sum to 100
    let roundedTotal = 0
    const entries: [PostflopAction, number][] = []

    for (const [action, sum] of acc.actions) {
      const avg = sum / acc.comboCount
      if (avg > 0.005) {
        const pct = Math.round((avg / total) * 100)
        if (pct > 0) {
          entries.push([action, pct])
          roundedTotal += pct
        }
      }
    }

    if (entries.length === 0) continue

    // Fix rounding to sum to exactly 100
    if (roundedTotal !== 100 && entries.length > 0) {
      entries.sort((a, b) => b[1] - a[1])
      entries[0][1] += 100 - roundedTotal
    }

    for (const [action, pct] of entries) {
      weights[action] = pct
    }

    // Only include hands that have meaningful strategies (not 100% fold)
    if (!weights.fold || weights.fold < 95) {
      // Remove fold from strategy display (it's implied by absence)
      const { fold: _fold, ...nonFoldWeights } = weights
      if (Object.keys(nonFoldWeights).length > 0) {
        strategies[handClass] = nonFoldWeights
      }
    }
  }

  return strategies
}

// --- Parse a result file ---

function parseResultFile(
  filepath: string,
  nodeKey: string,
  boardString: string,
  potSizeBB: number,
  effectiveStackBB: number,
): CachedSolution | null {
  const raw = readFileSync(filepath, 'utf-8')
  const tree: unknown = JSON.parse(raw)

  if (typeof tree !== 'object' || tree === null) {
    console.error(`  Invalid JSON structure in ${filepath}`)
    return null
  }

  const root = tree as SolverActionNode
  if (root.node_type !== 'action_node') {
    console.error(`  Root is not an action_node in ${filepath}`)
    return null
  }

  // Determine hero player from the node
  // Hero is the caller. In the solver, player 0 = IP, player 1 = OOP.
  // We need to figure out if hero is IP or OOP based on the node.
  const parts = nodeKey.split('_')
  const opener = parts[0].replace('-open', '') as import('../src/types/poker').Position
  const callerPart = parts[parts.length - 1]
  const caller = callerPart.replace('-call', '') as import('../src/types/poker').Position
  const heroIsIP = isIPPosition(caller, opener)

  // Pot size in chips (we used 2 chips per bb in config generation)
  const potChips = potSizeBB * 2

  let heroStrategy: Record<string, PostflopActionWeights>

  if (!heroIsIP) {
    // Hero is OOP — extract root node strategy
    heroStrategy = extractStrategy(root, potChips)
  } else {
    // Hero is IP — extract strategy after OOP CHECK
    const checkChild = root.childrens['CHECK']
    if (!checkChild || checkChild.node_type !== 'action_node') {
      console.error(`  No CHECK child node found for IP hero in ${filepath}`)
      return null
    }
    heroStrategy = extractStrategy(checkChild, potChips)
  }

  const handCount = Object.keys(heroStrategy).length
  if (handCount === 0) {
    console.error(`  No valid strategies extracted from ${filepath}`)
    return null
  }

  const boardCompact = boardString.replace(/\s/g, '')
  const solutionKey = `${nodeKey}_${boardCompact}_flop`

  return {
    solutionKey,
    nodeKey,
    boardString,
    street: 'flop',
    potSizeBB,
    effectiveStackBB,
    strategies: heroStrategy,
    exploitability: 0.3, // Default; ideally parse from solver log
    solvedAt: Date.now(),
  }
}

// --- Main ---

function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      input: { type: 'string', default: 'postflop-solver-configs' },
      output: { type: 'string', default: 'public/postflop-cache' },
    },
  })

  const inputDir = values.input ?? 'postflop-solver-configs'
  const outputDir = values.output ?? 'public/postflop-cache'

  mkdirSync(outputDir, { recursive: true })

  // Build lookup from filename to node+board metadata
  const metadataMap = new Map<string, { nodeKey: string; boardString: string; potSizeBB: number; effectiveStackBB: number }>()
  for (const { nodeKey, node, boards } of NODE_BOARD_CATALOG) {
    for (const board of boards) {
      const boardCompact = board.cards.replace(/\s/g, '')
      const resultFilename = `${nodeKey}_${boardCompact}_result.json`
      const potSizeBB = node.potType === '3bet' ? 20.5 : (node.potType === 'srp' && node.opener === 'SB' ? 5 : 6.5)
      const effectiveStackBB = node.potType === '3bet' ? 89.75 : (node.potType === 'srp' && node.opener === 'SB' ? 97.5 : 97)
      metadataMap.set(resultFilename, { nodeKey, boardString: board.cards, potSizeBB, effectiveStackBB })
    }
  }

  // Find all result files
  const resultFiles = readdirSync(inputDir).filter((f) => f.endsWith('_result.json'))

  console.log(`Converting ${resultFiles.length} solver output files`)
  console.log(`Input: ${inputDir}/`)
  console.log(`Output: ${outputDir}/`)
  console.log()

  let converted = 0
  let failed = 0

  for (const filename of resultFiles) {
    const metadata = metadataMap.get(filename)
    if (!metadata) {
      console.warn(`  ⚠ No metadata for ${filename}, skipping`)
      failed++
      continue
    }

    const filepath = join(inputDir, filename)
    const solution = parseResultFile(
      filepath,
      metadata.nodeKey,
      metadata.boardString,
      metadata.potSizeBB,
      metadata.effectiveStackBB,
    )

    if (solution) {
      const outFilename = `${solution.solutionKey}.json`
      const outPath = join(outputDir, outFilename)
      writeFileSync(outPath, JSON.stringify(solution, null, 2), 'utf-8')
      const handCount = Object.keys(solution.strategies).length
      console.log(`  ✓ ${outFilename} (${handCount} hands)`)
      converted++
    } else {
      console.error(`  ✗ Failed: ${filename}`)
      failed++
    }
  }

  console.log()
  console.log(`Converted: ${converted}`)
  if (failed > 0) console.log(`Failed: ${failed}`)
}

main()
