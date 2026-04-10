/**
 * Generate GTO-approximate postflop solutions using heuristics.
 *
 * This uses hand strength evaluation and board texture analysis to produce
 * realistic action distributions for every hand in the hero's range across
 * all board+node combinations in the catalog.
 *
 * These are APPROXIMATE strategies based on well-known GTO principles,
 * not solver output. The real solver pipeline (generate-postflop-configs.ts,
 * convert-postflop-solutions.ts) is ready to swap in when a working
 * solver build becomes available.
 *
 * Usage: bun run scripts/generate-heuristic-solutions.ts
 */

import { writeFileSync, readFileSync, mkdirSync, rmSync, readdirSync } from 'fs'
import { join } from 'path'

import { RANKS } from '../src/types/poker'
import { getVillainRange } from '../src/data/villain-ranges'
import { getChart } from '../src/data/ranges'
import { isIPPosition } from './lib/solver-utils'
import { NODE_BOARD_CATALOG, TOTAL_SOLUTIONS } from './lib/board-catalog'

import type { CatalogNode, BoardArchetype } from './lib/board-catalog'
import type { Position, Rank } from '../src/types/poker'
import type { Chart } from '../src/data/ranges'

// --- Types ---

interface ActionWeights {
  [action: string]: number
}

interface Solution {
  solutionKey: string
  nodeKey: string
  boardString: string
  street: string
  potSizeBB: number
  effectiveStackBB: number
  strategies: Record<string, ActionWeights>
  exploitability: number
  solvedAt: number
}

// --- Rank utilities ---

function rankValue(rank: string): number {
  const idx = RANKS.indexOf(rank as Rank)
  return idx === -1 ? 0 : 14 - idx
}

/** Parse "As 7d 2c" into [{rank, suit}, ...] */
function parseBoard(boardStr: string): Array<{ rank: string; suit: string }> {
  return boardStr.split(' ').map((card) => ({
    rank: card[0],
    suit: card[1],
  }))
}

// --- Board analysis ---

interface BoardProperties {
  highCard: number
  secondCard: number
  lowCard: number
  isPaired: boolean
  isMonotone: boolean
  isTwoTone: boolean
  isConnected: boolean
  isHighBoard: boolean
  isLowBoard: boolean
  hasAce: boolean
  boardRanks: number[]
  boardSuits: string[]
  maxGap: number // Largest gap between consecutive ranks
  wetness: number // 0-1 scale of how draw-heavy the board is
}

function analyzeBoard(boardStr: string): BoardProperties {
  const cards = parseBoard(boardStr)
  const ranks = cards.map((c) => rankValue(c.rank)).sort((a, b) => b - a)
  const suits = cards.map((c) => c.suit)

  const suitCounts = new Map<string, number>()
  for (const s of suits) suitCounts.set(s, (suitCounts.get(s) ?? 0) + 1)

  const rankCounts = new Map<number, number>()
  for (const r of ranks) rankCounts.set(r, (rankCounts.get(r) ?? 0) + 1)

  const uniqueRanks = [...new Set(ranks)].sort((a, b) => b - a)
  let maxGap = 0
  for (let i = 0; i < uniqueRanks.length - 1; i++) {
    maxGap = Math.max(maxGap, uniqueRanks[i] - uniqueRanks[i + 1])
  }

  const isPaired = [...rankCounts.values()].some((c) => c >= 2)
  const isMonotone = [...suitCounts.values()].some((c) => c >= 3)
  const isTwoTone = suitCounts.size === 2 && !isMonotone
  const isConnected = uniqueRanks.length >= 2 && uniqueRanks.some((r, i) =>
    i < uniqueRanks.length - 1 && uniqueRanks[i] - uniqueRanks[i + 1] <= 2
  )

  // Wetness: 0 (bone dry) to 1 (very wet)
  let wetness = 0
  if (isConnected) wetness += 0.3
  if (isTwoTone) wetness += 0.2
  if (isMonotone) wetness += 0.4
  if (maxGap <= 3 && uniqueRanks.length >= 3) wetness += 0.2
  wetness = Math.min(wetness, 1)

  return {
    highCard: ranks[0],
    secondCard: ranks[1],
    lowCard: ranks[ranks.length - 1],
    isPaired,
    isMonotone,
    isTwoTone,
    isConnected,
    isHighBoard: ranks[0] >= 12,
    isLowBoard: ranks[0] <= 8,
    hasAce: ranks[0] === 14,
    boardRanks: ranks,
    boardSuits: suits,
    maxGap,
    wetness,
  }
}

// --- Hand strength classification ---

type HandStrength =
  | 'monster'     // Sets, two pair on unpaired boards, straights
  | 'top-pair'    // Top pair good kicker
  | 'overpair'    // Pair above the board
  | 'mid-pair'    // Second pair or top pair weak kicker
  | 'weak-pair'   // Bottom pair, pocket pair below board
  | 'draw'        // Flush draw, OESD, gutshot with equity
  | 'air'         // No pair, no meaningful draw

function classifyHand(
  hand: string,
  board: BoardProperties,
): HandStrength {
  const rank1Char = hand[0]
  const rank2Char = hand.length === 3 ? hand[1] : hand[1]
  const isSuited = hand.endsWith('s')
  const isPair = hand.length === 2 || (hand[0] === hand[1] && !hand.endsWith('s') && !hand.endsWith('o'))
  const r1 = rankValue(rank1Char)
  const r2 = rankValue(rank2Char)

  const highRank = Math.max(r1, r2)
  const lowRank = Math.min(r1, r2)

  const boardHigh = board.highCard
  const boardSecond = board.secondCard
  const boardLow = board.lowCard

  // --- Pairs ---
  if (isPair) {
    // Set (pair matches a board card)
    if (board.boardRanks.includes(r1)) return 'monster'
    // Overpair
    if (r1 > boardHigh) return 'overpair'
    // Between top and second card
    if (r1 > boardSecond) return 'mid-pair'
    // Below board
    return 'weak-pair'
  }

  // --- Non-pairs: check for board hits ---

  const hitsTopCard = highRank === boardHigh || lowRank === boardHigh
  const hitsSecondCard = highRank === boardSecond || lowRank === boardSecond
  const hitsBottomCard = highRank === boardLow || lowRank === boardLow

  // Two pair on unpaired board
  if (!board.isPaired) {
    const boardSet = new Set(board.boardRanks)
    if (boardSet.has(highRank) && boardSet.has(lowRank)) return 'monster'
  }

  // Top pair
  if (hitsTopCard) {
    // Good kicker (other card is T+)
    const kicker = highRank === boardHigh ? lowRank : highRank
    if (kicker >= 10) return 'top-pair'
    return 'mid-pair'
  }

  // Second pair
  if (hitsSecondCard) return 'mid-pair'

  // Bottom pair
  if (hitsBottomCard) return 'weak-pair'

  // --- Draws ---
  // Flush draw on two-tone or monotone boards
  if (isSuited && (board.isTwoTone || board.isMonotone)) return 'draw'

  // Straight draws: both cards connect with the board
  if (board.isConnected) {
    const allRanks = [...board.boardRanks, highRank, lowRank].sort((a, b) => b - a)
    const uniqueAll = [...new Set(allRanks)]
    // Check for 4+ in a 5-card window
    for (let high = 14; high >= 5; high--) {
      let count = 0
      for (let v = high; v > high - 5; v--) {
        if (uniqueAll.includes(v)) count++
      }
      if (count >= 4) return 'draw'
    }
  }

  // High card draws (overcards to the board on low boards)
  if (board.isLowBoard && highRank >= 10 && lowRank >= 10) return 'draw'

  return 'air'
}

// --- Strategy generation ---

/**
 * Generate action distribution based on hand strength, board texture,
 * and positional considerations.
 *
 * OOP (out of position) strategies: more checking, polarized betting
 * IP (in position) strategies: more betting, wider value range
 */
function generateStrategy(
  strength: HandStrength,
  board: BoardProperties,
  heroIsIP: boolean,
  is3BetPot: boolean,
): ActionWeights | null {
  // Adjustment factors
  const wetAdj = board.wetness // More wet = more aggressive
  const dryAdj = 1 - board.wetness
  const ipAdj = heroIsIP ? 0.15 : 0 // IP bets more
  const threeBetAdj = is3BetPot ? 0.1 : 0 // 3bet pots have smaller bets

  switch (strength) {
    case 'monster': {
      if (heroIsIP) {
        // IP with monsters: mix of bets for value, some slow-plays on dry boards
        const slowPlayFreq = Math.round(dryAdj * 25)
        const betMedFreq = Math.round(40 + wetAdj * 15)
        const betLargeFreq = Math.round(35 - dryAdj * 10)
        return normalize({ check: slowPlayFreq, 'bet-medium': betMedFreq, 'bet-large': betLargeFreq })
      }
      // OOP with monsters: check-raise line or lead
      if (board.isPaired) {
        // Paired board: check more (trap)
        return normalize({ check: 55, 'bet-medium': 30, 'bet-large': 15 })
      }
      return normalize({ check: 35, 'bet-medium': 40, 'bet-large': 25 })
    }

    case 'overpair': {
      if (heroIsIP) {
        return normalize({
          check: Math.round(15 + dryAdj * 10),
          'bet-small': Math.round(25 + wetAdj * 10),
          'bet-medium': Math.round(45 - wetAdj * 5),
          'bet-large': Math.round(15 - dryAdj * 5),
        })
      }
      // OOP overpairs: mostly check on ace-high boards, bet on lower boards
      if (board.hasAce) {
        return normalize({ check: 60, 'bet-small': 25, 'bet-medium': 15 })
      }
      return normalize({ check: 40, 'bet-small': 35, 'bet-medium': 25 })
    }

    case 'top-pair': {
      const baseCheck = heroIsIP ? 25 : 45
      const baseBetSmall = heroIsIP ? 35 : 30
      const baseBetMed = heroIsIP ? 30 : 20
      const baseBetLarge = heroIsIP ? 10 : 5

      return normalize({
        check: Math.round(baseCheck + wetAdj * 5),
        'bet-small': Math.round(baseBetSmall - wetAdj * 5 + ipAdj * 10),
        'bet-medium': Math.round(baseBetMed + wetAdj * 10 - threeBetAdj * 5),
        'bet-large': Math.round(baseBetLarge),
      })
    }

    case 'mid-pair': {
      if (heroIsIP) {
        return normalize({
          check: Math.round(35 + dryAdj * 10),
          'bet-small': Math.round(35 + wetAdj * 5),
          'bet-medium': Math.round(20 - dryAdj * 5),
          fold: Math.round(10 + wetAdj * 5),
        })
      }
      return normalize({
        check: Math.round(55 + dryAdj * 10),
        'bet-small': Math.round(25 - dryAdj * 5),
        fold: Math.round(20 + wetAdj * 10),
      })
    }

    case 'weak-pair': {
      if (heroIsIP) {
        return normalize({
          check: Math.round(40 + dryAdj * 15),
          'bet-small': Math.round(20 + wetAdj * 5),
          fold: Math.round(40 - dryAdj * 10),
        })
      }
      const foldFreq = Math.round(30 + wetAdj * 20)
      if (foldFreq > 90) return null // Too much folding, exclude from range
      return normalize({
        check: Math.round(50 + dryAdj * 10),
        'bet-small': Math.round(15 - wetAdj * 5),
        fold: foldFreq,
      })
    }

    case 'draw': {
      if (heroIsIP) {
        // IP with draws: semi-bluff frequently
        return normalize({
          check: Math.round(25 - wetAdj * 10),
          'bet-small': Math.round(30 + wetAdj * 10),
          'bet-medium': Math.round(35 + wetAdj * 5),
          'bet-large': Math.round(10),
        })
      }
      // OOP with draws: check-call/check-raise line, some leads
      return normalize({
        check: Math.round(55 - wetAdj * 10),
        'bet-small': Math.round(25 + wetAdj * 10),
        'bet-medium': Math.round(15 + wetAdj * 5),
        fold: Math.round(5),
      })
    }

    case 'air': {
      if (heroIsIP) {
        const bluffFreq = Math.round(15 + dryAdj * 10)
        const foldFreq = Math.round(55 - dryAdj * 10)
        return normalize({
          check: Math.round(30),
          'bet-small': Math.round(bluffFreq),
          fold: foldFreq,
        })
      }
      const foldFreq = Math.round(50 + wetAdj * 15)
      if (foldFreq > 90) return null // Exclude near-pure folds
      return normalize({
        check: Math.round(45 - wetAdj * 10),
        'bet-small': Math.round(5 + dryAdj * 5),
        fold: foldFreq,
      })
    }
  }
}

/** Normalize weights to sum to 100, removing zero entries */
function normalize(weights: ActionWeights): ActionWeights {
  // Remove negative and zero entries
  const cleaned: ActionWeights = {}
  for (const [action, weight] of Object.entries(weights)) {
    if (weight > 0) cleaned[action] = weight
  }

  const total = Object.values(cleaned).reduce((sum, v) => sum + v, 0)
  if (total === 0) return { check: 100 }

  const result: ActionWeights = {}
  let roundedTotal = 0
  const entries = Object.entries(cleaned).sort((a, b) => b[1] - a[1])

  for (const [action, weight] of entries) {
    const pct = Math.round((weight / total) * 100)
    if (pct > 0) {
      result[action] = pct
      roundedTotal += pct
    }
  }

  // Fix rounding
  if (roundedTotal !== 100 && Object.keys(result).length > 0) {
    const firstKey = Object.keys(result)[0]
    result[firstKey] += 100 - roundedTotal
  }

  // Remove fold from display (implied by absence) unless it's the only action
  if (result.fold && Object.keys(result).length > 1) {
    delete result.fold
    // Renormalize without fold
    const nonFoldTotal = Object.values(result).reduce((sum, v) => sum + v, 0)
    if (nonFoldTotal > 0 && nonFoldTotal !== 100) {
      const factor = 100 / nonFoldTotal
      for (const key of Object.keys(result)) {
        result[key] = Math.round(result[key] * factor)
      }
      // Fix rounding again
      const newTotal = Object.values(result).reduce((sum, v) => sum + v, 0)
      if (newTotal !== 100) {
        const firstKey = Object.keys(result)[0]
        result[firstKey] += 100 - newTotal
      }
    }
  }

  return result
}

// --- Solution generation ---

function getHeroRange(node: CatalogNode, provider: string): Chart | null {
  // Hero is the caller. Their range is the villain range (their continuing range).
  const villainNode = node.potType === 'srp'
    ? { potType: 'srp' as const, opener: node.opener, caller: node.caller }
    : { potType: '3bet' as const, opener: node.opener, threeBettor: node.threeBettor, caller: node.caller }
  return getVillainRange(villainNode)
}

function generateSolution(
  node: CatalogNode,
  nodeKey: string,
  boardString: string,
): Solution | null {
  const heroRange = getHeroRange(node, 'pekarstas')
  if (!heroRange) return null

  const board = analyzeBoard(boardString)
  const caller = node.potType === 'srp' ? node.caller : node.caller
  const heroIsIP = isIPPosition(caller, node.opener)
  const is3BetPot = node.potType === '3bet'

  const potSizeBB = is3BetPot ? 20.5 : (node.opener === 'SB' ? 5 : 6.5)
  const effectiveStackBB = is3BetPot ? 89.75 : (node.opener === 'SB' ? 97.5 : 97)

  const strategies: Record<string, ActionWeights> = {}

  for (const hand of Object.keys(heroRange)) {
    const strength = classifyHand(hand, board)
    const strategy = generateStrategy(strength, board, heroIsIP, is3BetPot)
    if (strategy && Object.keys(strategy).length > 0) {
      strategies[hand] = strategy
    }
  }

  if (Object.keys(strategies).length === 0) return null

  const boardCompact = boardString.replace(/\s/g, '')

  return {
    solutionKey: `${nodeKey}_${boardCompact}_flop`,
    nodeKey,
    boardString,
    street: 'flop',
    potSizeBB,
    effectiveStackBB,
    strategies,
    exploitability: 0.5, // Approximate — not solver-verified
    solvedAt: Date.now(),
  }
}

// --- Main ---

function main() {
  const outputDir = join(import.meta.dir, '..', 'public', 'postflop-cache')

  // Clear existing solutions
  mkdirSync(outputDir, { recursive: true })
  const existing = readdirSync(outputDir).filter((f) => f.endsWith('.json'))
  for (const f of existing) rmSync(join(outputDir, f))

  console.log(`Generating heuristic postflop solutions`)
  console.log(`Total board+node combinations: ${TOTAL_SOLUTIONS}`)
  console.log(`Output: ${outputDir}/`)
  console.log()

  let generated = 0
  let skipped = 0

  for (const { node, nodeKey, boards } of NODE_BOARD_CATALOG) {
    console.log(`${nodeKey} (${boards.length} boards):`)

    for (const board of boards) {
      const solution = generateSolution(node, nodeKey, board.cards)
      if (solution) {
        const filename = `${solution.solutionKey}.json`
        const filepath = join(outputDir, filename)
        writeFileSync(filepath, JSON.stringify(solution, null, 2), 'utf-8')
        const handCount = Object.keys(solution.strategies).length
        console.log(`  ✓ ${filename} (${handCount} hands) [${board.archetype}]`)
        generated++
      } else {
        console.log(`  ⚠ Skipped ${board.cards} — no hero range`)
        skipped++
      }
    }
  }

  console.log()
  console.log(`Generated: ${generated} solutions`)
  if (skipped > 0) console.log(`Skipped: ${skipped}`)

  // Also generate manifest
  console.log()
  console.log('Generating manifest...')

  const solutionFiles = readdirSync(outputDir).filter(
    (f) => f.endsWith('.json') && f !== 'manifest.json'
  )

  const manifest = {
    version: 2,
    solutions: solutionFiles.map((f) => {
      const raw = JSON.parse(
        readFileSync(join(outputDir, f), 'utf-8')
      ) as Solution
      return {
        solutionKey: raw.solutionKey,
        nodeKey: raw.nodeKey,
        boardString: raw.boardString,
        street: raw.street,
        handCount: Object.keys(raw.strategies).length,
      }
    }).sort((a, b) => {
      const nodeCompare = a.nodeKey.localeCompare(b.nodeKey)
      if (nodeCompare !== 0) return nodeCompare
      return a.boardString.localeCompare(b.boardString)
    }),
  }

  writeFileSync(
    join(outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf-8',
  )

  console.log(`Manifest written with ${manifest.solutions.length} solutions`)
}

main()
