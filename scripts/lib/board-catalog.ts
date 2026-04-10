/**
 * Board catalog for postflop solver configs.
 *
 * Each node gets a set of boards covering diverse textures.
 * Boards are chosen to avoid suit duplication with common hero hands
 * and to represent the key texture archetypes players encounter.
 */

import type { Position } from '../../src/types/poker'

export type BoardArchetype =
  | 'dry-high'
  | 'dry-low'
  | 'wet-connected'
  | 'monotone'
  | 'paired'
  | 'broadway'
  | 'medium-connected'

export interface CatalogBoard {
  cards: string
  archetype: BoardArchetype
}

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

export type CatalogNode = SRPNode | ThreeBetNode

export interface NodeBoards {
  node: CatalogNode
  nodeKey: string
  boards: CatalogBoard[]
}

export function catalogNodeKey(node: CatalogNode): string {
  if (node.potType === 'srp') {
    return `${node.opener}-open_${node.caller}-call`
  }
  return `${node.opener}-open_${node.threeBettor}-3bet_${node.caller}-call`
}

// Master board pool — each board used at most once per node
const BOARDS: Record<BoardArchetype, CatalogBoard[]> = {
  'dry-high': [
    { cards: 'As 7d 2c', archetype: 'dry-high' },
    { cards: 'Ah Td 3c', archetype: 'dry-high' },
    { cards: 'Kc 8d 3s', archetype: 'dry-high' },
    { cards: 'Ac 9h 4d', archetype: 'dry-high' },
  ],
  'dry-low': [
    { cards: '8s 5d 2c', archetype: 'dry-low' },
    { cards: '7h 4c 2d', archetype: 'dry-low' },
    { cards: '9d 3s 2h', archetype: 'dry-low' },
    { cards: '6c 4d 2s', archetype: 'dry-low' },
  ],
  'wet-connected': [
    { cards: 'Ts 9h 8d', archetype: 'wet-connected' },
    { cards: 'Jd Tc 9s', archetype: 'wet-connected' },
    { cards: '9s 8d 7c', archetype: 'wet-connected' },
    { cards: '8h 7c 6d', archetype: 'wet-connected' },
  ],
  monotone: [
    { cards: '6h 5h 3h', archetype: 'monotone' },
    { cards: 'Kd Td 4d', archetype: 'monotone' },
    { cards: 'Qs 9s 3s', archetype: 'monotone' },
    { cards: '8c 5c 2c', archetype: 'monotone' },
  ],
  paired: [
    { cards: 'Kh Kd 7c', archetype: 'paired' },
    { cards: '8s 8d 4c', archetype: 'paired' },
    { cards: 'Qs Qh 5d', archetype: 'paired' },
    { cards: '5c 5h Ts', archetype: 'paired' },
  ],
  broadway: [
    { cards: 'Qc Jh Ts', archetype: 'broadway' },
    { cards: 'Kd Qs Jh', archetype: 'broadway' },
    { cards: 'Kh Jd Tc', archetype: 'broadway' },
    { cards: 'Ah Kd Qs', archetype: 'broadway' },
  ],
  'medium-connected': [
    { cards: '8d 7s 5c', archetype: 'medium-connected' },
    { cards: '9h 7c 6d', archetype: 'medium-connected' },
    { cards: 'Tc 8h 6s', archetype: 'medium-connected' },
    { cards: '7d 6c 4s', archetype: 'medium-connected' },
  ],
}

/**
 * Select N boards from the pool, one per archetype then cycling.
 * Ensures maximum texture diversity for each node.
 */
function selectBoards(count: number, offset: number): CatalogBoard[] {
  const archetypeOrder: BoardArchetype[] = [
    'dry-high',
    'dry-low',
    'wet-connected',
    'monotone',
    'paired',
    'broadway',
    'medium-connected',
  ]

  const result: CatalogBoard[] = []
  for (let i = 0; i < count; i++) {
    const archetype = archetypeOrder[i % archetypeOrder.length]
    const pool = BOARDS[archetype]
    // Use offset to pick different boards for different nodes
    const boardIdx = (Math.floor(i / archetypeOrder.length) + offset) % pool.length
    result.push(pool[boardIdx])
  }
  return result
}

/** The full catalog: all node+board combinations to solve. */
export const NODE_BOARD_CATALOG: NodeBoards[] = [
  // --- Single Raised Pots ---
  {
    node: { potType: 'srp', opener: 'BTN', caller: 'BB' },
    nodeKey: 'BTN-open_BB-call',
    boards: selectBoards(8, 0),
  },
  {
    node: { potType: 'srp', opener: 'SB', caller: 'BB' },
    nodeKey: 'SB-open_BB-call',
    boards: selectBoards(6, 1),
  },
  {
    node: { potType: 'srp', opener: 'CO', caller: 'BB' },
    nodeKey: 'CO-open_BB-call',
    boards: selectBoards(6, 2),
  },
  {
    node: { potType: 'srp', opener: 'MP', caller: 'BB' },
    nodeKey: 'MP-open_BB-call',
    boards: selectBoards(4, 0),
  },
  {
    node: { potType: 'srp', opener: 'UTG', caller: 'BB' },
    nodeKey: 'UTG-open_BB-call',
    boards: selectBoards(4, 1),
  },
  {
    node: { potType: 'srp', opener: 'BTN', caller: 'SB' },
    nodeKey: 'BTN-open_SB-call',
    boards: selectBoards(3, 2),
  },
  {
    node: { potType: 'srp', opener: 'CO', caller: 'BTN' },
    nodeKey: 'CO-open_BTN-call',
    boards: selectBoards(2, 0),
  },
  {
    node: { potType: 'srp', opener: 'UTG', caller: 'BTN' },
    nodeKey: 'UTG-open_BTN-call',
    boards: selectBoards(2, 1),
  },
  // --- 3-Bet Pots ---
  {
    node: { potType: '3bet', opener: 'BTN', threeBettor: 'BB', caller: 'BTN' },
    nodeKey: 'BTN-open_BB-3bet_BTN-call',
    boards: selectBoards(4, 2),
  },
  {
    node: { potType: '3bet', opener: 'CO', threeBettor: 'BTN', caller: 'CO' },
    nodeKey: 'CO-open_BTN-3bet_CO-call',
    boards: selectBoards(3, 0),
  },
  {
    node: { potType: '3bet', opener: 'BTN', threeBettor: 'SB', caller: 'BTN' },
    nodeKey: 'BTN-open_SB-3bet_BTN-call',
    boards: selectBoards(4, 1),
  },
  {
    node: { potType: '3bet', opener: 'CO', threeBettor: 'BB', caller: 'CO' },
    nodeKey: 'CO-open_BB-3bet_CO-call',
    boards: selectBoards(3, 2),
  },
]

/** Total number of board+node combinations in the catalog */
export const TOTAL_SOLUTIONS = NODE_BOARD_CATALOG.reduce(
  (sum, nb) => sum + nb.boards.length,
  0
)
