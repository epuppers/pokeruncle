import type { Card, Position } from '@/types/poker'
import { enumerateCombos } from '@/lib/analyzer/comboCounter'

import type { CachedSolution, PostflopAction, PostflopBoard, PostflopSpot } from '../types'
import type { SolutionManifestEntry } from './solution-schema'

import { classifyBoard } from './board-texture'

/**
 * Resolve the correct action from a strategy distribution + a rolled number (1-100).
 * Actions are ordered by aggression (most aggressive first): allin, raise, bet-large,
 * bet-medium, bet-small, call, check, fold.
 *
 * The rolled number falls into action "bands" computed from frequencies.
 * e.g. { check: 60, 'bet-medium': 40 } → roll 1-40 = bet-medium, 41-100 = check
 */
const ACTION_PRIORITY: PostflopAction[] = [
  'allin', 'raise', 'bet-large', 'bet-medium', 'bet-small', 'call', 'check', 'fold',
]

export function resolvePostflopAction(
  strategy: Partial<Record<PostflopAction, number>>,
  rolledNumber: number,
): PostflopAction {
  let cumulative = 0
  for (const action of ACTION_PRIORITY) {
    const freq = strategy[action] ?? 0
    if (freq <= 0) continue
    cumulative += freq
    if (rolledNumber <= cumulative) return action
  }
  // Fallback: return the highest-frequency action
  let bestAction: PostflopAction = 'check'
  let bestFreq = 0
  for (const action of ACTION_PRIORITY) {
    const freq = strategy[action] ?? 0
    if (freq > bestFreq) {
      bestFreq = freq
      bestAction = action
    }
  }
  return bestAction
}

/** Parse a board string like "Ah 7d 2c" into Card objects */
export function parseBoardString(boardString: string): PostflopBoard {
  const rankMap: Record<string, Card['rank']> = {
    A: 'A', K: 'K', Q: 'Q', J: 'J', T: 'T',
    '9': '9', '8': '8', '7': '7', '6': '6', '5': '5',
    '4': '4', '3': '3', '2': '2',
  }
  const suitMap: Record<string, Card['suit']> = { h: 'h', d: 'd', c: 'c', s: 's' }

  const cards = boardString.trim().split(/\s+/).map((s): Card => {
    const rank = rankMap[s[0]]
    const suit = suitMap[s[1]]
    if (!rank || !suit) throw new Error(`Invalid card: "${s}"`)
    return { rank, suit }
  })

  if (cards.length < 3 || cards.length > 5) {
    throw new Error(`Invalid board length: ${cards.length}`)
  }

  return cards as unknown as PostflopBoard
}

/** Parse a node key like "BTN-open_BB-call" into positions */
function parseNodeKey(nodeKey: string): { opener: Position; caller: Position; is3bet: boolean } {
  const parts = nodeKey.split('_')
  const openerPart = parts[0]
  const opener = openerPart.split('-')[0] as Position

  if (parts.length === 3) {
    // 3bet pot: "BTN-open_BB-3bet_BTN-call"
    const callerPart = parts[2]
    const caller = callerPart.split('-')[0] as Position
    return { opener, caller, is3bet: true }
  }

  // SRP: "BTN-open_BB-call"
  const callerPart = parts[1]
  const caller = callerPart.split('-')[0] as Position
  return { opener, caller, is3bet: false }
}

/** Determine if a position is in-position relative to another postflop.
 * Postflop acting order: SB → BB → UTG → MP → CO → BTN (last = IP) */
const POSTFLOP_ORDER: Position[] = ['SB', 'BB', 'UTG', 'MP', 'CO', 'BTN']

function isInPosition(posA: Position, posB: Position): boolean {
  return POSTFLOP_ORDER.indexOf(posA) > POSTFLOP_ORDER.indexOf(posB)
}

/** Pick a random specific card combo for a hand name, avoiding board cards */
function dealHeroCards(heroHand: string, boardCards: readonly Card[]): [Card, Card] {
  const allCombos = enumerateCombos(heroHand)
  // Filter out combos that overlap with board cards
  const available = allCombos.filter((combo) =>
    combo.every((card) =>
      !boardCards.some((bc) => bc.rank === card.rank && bc.suit === card.suit)
    )
  )

  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)]
  }

  // Fallback: synthesize cards
  const rank1 = heroHand[0] as Card['rank']
  const rank2 = heroHand[1] as Card['rank']
  return [{ rank: rank1, suit: 's' }, { rank: rank2, suit: 'h' }]
}

/**
 * Generate a random postflop training spot from a cached solution.
 * Picks a random hand from the solution, rolls for mixed strategy,
 * and builds the full PostflopSpot object.
 */
export function generatePostflopSpot(
  solution: CachedSolution,
): PostflopSpot {
  const handNames = Object.keys(solution.strategies)
  if (handNames.length === 0) {
    throw new Error(`Solution has no strategies: ${solution.solutionKey}`)
  }

  // Pick a random hand
  const heroHand = handNames[Math.floor(Math.random() * handNames.length)]
  const strategy = solution.strategies[heroHand]

  // Parse the board
  const board = parseBoardString(solution.boardString)

  // Deal specific cards avoiding board cards
  const heroCards = dealHeroCards(heroHand, board)

  // Roll for mixed strategy
  const rolledNumber = Math.ceil(Math.random() * 100)
  const correctAction = resolvePostflopAction(strategy, rolledNumber)

  // Parse node for position info
  const { opener, caller, is3bet } = parseNodeKey(solution.nodeKey)

  // BB is typically the hero in these spots (defending)
  const hero = caller
  const villain = opener
  const heroIsIP = isInPosition(hero, villain)

  // Board texture
  const boardTexture = classifyBoard(board)

  return {
    kind: 'postflop',
    id: crypto.randomUUID(),
    street: solution.street,
    board,
    heroCards,
    heroHand,
    hero,
    villain,
    heroIsIP,
    preflopNode: is3bet
      ? {
          potType: '3bet' as const,
          opener,
          threeBettor: caller, // In 3bet pots, the caller is the one who 3bet
          caller: opener,      // The opener called the 3bet
        }
      : {
          potType: 'srp' as const,
          opener,
          caller,
        },
    potType: is3bet ? '3bet' : 'srp',
    potSizeBB: solution.potSizeBB,
    effectiveStackBB: solution.effectiveStackBB,
    boardTexture,
    correctStrategy: strategy,
    rolledNumber,
    correctAction,
    solutionKey: solution.solutionKey,
  }
}

/**
 * Pick a random manifest entry, optionally filtered.
 */
export function pickRandomEntry(
  entries: SolutionManifestEntry[],
  nodeKeyFilter?: string,
): SolutionManifestEntry {
  const filtered = nodeKeyFilter
    ? entries.filter((e) => e.nodeKey === nodeKeyFilter)
    : entries

  if (filtered.length === 0) {
    throw new Error(
      `No solutions available${nodeKeyFilter ? ` for node "${nodeKeyFilter}"` : ''}`,
    )
  }

  return filtered[Math.floor(Math.random() * filtered.length)]
}
