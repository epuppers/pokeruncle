/**
 * Generate sample postflop solution fixtures for development.
 *
 * These are APPROXIMATE strategies based on general GTO principles,
 * NOT solver output. They exist to provide realistic test data for
 * the postflop training UI.
 *
 * Usage: bun run scripts/generate-sample-solutions.ts
 */

import { writeFileSync } from 'fs'
import { join } from 'path'

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

const OUTPUT_DIR = join(import.meta.dir, '..', 'public', 'postflop-cache')
const NOW = Date.now()

// Helper: build strategy for a hand based on general GTO heuristics
function pure(action: string): ActionWeights {
  return { [action]: 100 }
}

function mix(actions: Record<string, number>): ActionWeights {
  return actions
}

// --- Solution 1: A-7-2 rainbow (dry, high, A on board) ---
// BTN open → BB call. BB is OOP. Classic "ace-high dry" flop.
// BB should check most range, occasionally bet with strong hands.
const ah7d2c: Solution = {
  solutionKey: 'BTN-open_BB-call_Ah7d2c_flop',
  nodeKey: 'BTN-open_BB-call',
  boardString: 'Ah 7d 2c',
  street: 'flop',
  potSizeBB: 6.5,
  effectiveStackBB: 97,
  strategies: {
    // Strong aces — mostly check to trap
    'AA': mix({ check: 70, 'bet-medium': 30 }),
    'AKs': mix({ check: 55, 'bet-medium': 35, 'bet-large': 10 }),
    'AQs': mix({ check: 50, 'bet-medium': 40, 'bet-small': 10 }),
    'AJs': mix({ check: 45, 'bet-small': 40, 'bet-medium': 15 }),
    'ATs': mix({ check: 50, 'bet-small': 35, 'bet-medium': 15 }),
    'A9s': mix({ check: 55, 'bet-small': 30, 'bet-medium': 15 }),
    'A8s': mix({ check: 60, 'bet-small': 30, 'bet-medium': 10 }),
    'A7s': mix({ check: 30, 'bet-medium': 50, 'bet-large': 20 }),  // Two pair
    'A6s': mix({ check: 60, 'bet-small': 30, 'bet-medium': 10 }),
    'A5s': mix({ check: 55, 'bet-small': 35, 'bet-medium': 10 }),
    'A4s': mix({ check: 55, 'bet-small': 35, 'bet-medium': 10 }),
    'A3s': mix({ check: 55, 'bet-small': 35, 'bet-medium': 10 }),
    'A2s': mix({ check: 25, 'bet-medium': 50, 'bet-large': 25 }),  // Two pair
    // Offsuit aces
    'AKo': mix({ check: 50, 'bet-medium': 40, 'bet-small': 10 }),
    'AQo': mix({ check: 50, 'bet-small': 35, 'bet-medium': 15 }),
    'AJo': mix({ check: 50, 'bet-small': 35, 'bet-medium': 15 }),
    'ATo': mix({ check: 55, 'bet-small': 35, 'bet-medium': 10 }),
    'A9o': mix({ check: 60, 'bet-small': 30, 'bet-medium': 10 }),
    // Medium pairs — check or small bet
    'KK': mix({ check: 40, 'bet-medium': 40, 'bet-large': 20 }),
    'QQ': mix({ check: 55, 'bet-small': 30, 'bet-medium': 15 }),
    'JJ': mix({ check: 60, 'bet-small': 25, 'bet-medium': 15 }),
    'TT': mix({ check: 65, 'bet-small': 25, 'bet-medium': 10 }),
    '99': mix({ check: 70, 'bet-small': 20, 'bet-medium': 10 }),
    '88': mix({ check: 75, 'bet-small': 20, fold: 5 }),
    '77': mix({ check: 20, 'bet-medium': 50, 'bet-large': 30 }),  // Set
    '66': pure('check'),
    '55': pure('check'),
    '44': pure('check'),
    '33': pure('check'),
    '22': mix({ check: 20, 'bet-medium': 50, 'bet-large': 30 }),  // Set
    // Suited connectors — mostly check, some probe bets
    'KQs': mix({ check: 60, 'bet-small': 30, 'bet-medium': 10 }),
    'KJs': mix({ check: 65, 'bet-small': 25, 'bet-medium': 10 }),
    'KTs': mix({ check: 65, 'bet-small': 25, 'bet-medium': 10 }),
    'QJs': mix({ check: 75, 'bet-small': 20, fold: 5 }),
    'QTs': mix({ check: 75, 'bet-small': 20, fold: 5 }),
    'JTs': mix({ check: 70, 'bet-small': 20, fold: 10 }),
    'T9s': mix({ check: 70, fold: 30 }),
    '98s': mix({ check: 65, fold: 35 }),
    '87s': mix({ check: 65, fold: 35 }),
    '76s': mix({ check: 60, fold: 40 }),
    '65s': mix({ check: 55, fold: 45 }),
    '54s': mix({ check: 55, fold: 45 }),
    'KQo': mix({ check: 60, 'bet-small': 30, 'bet-medium': 10 }),
    'KJo': mix({ check: 65, 'bet-small': 25, fold: 10 }),
    'QJo': mix({ check: 70, 'bet-small': 15, fold: 15 }),
    'JTo': mix({ check: 65, fold: 35 }),
  },
  exploitability: 0.3,
  solvedAt: NOW,
}

// --- Solution 2: T-9-8 two-tone (wet, connected) ---
// BTN open → BB call. Very dynamic board with many draws.
const ts9h8h: Solution = {
  solutionKey: 'BTN-open_BB-call_Ts9h8h_flop',
  nodeKey: 'BTN-open_BB-call',
  boardString: 'Ts 9h 8h',
  street: 'flop',
  potSizeBB: 6.5,
  effectiveStackBB: 97,
  strategies: {
    'JJ': mix({ check: 30, 'bet-medium': 40, 'bet-large': 30 }),  // Overpair + OESD
    'TT': mix({ check: 20, 'bet-large': 50, raise: 30 }),  // Set
    '99': mix({ check: 20, 'bet-large': 50, raise: 30 }),  // Set
    '88': mix({ check: 20, 'bet-large': 50, raise: 30 }),  // Set
    '77': mix({ check: 40, 'bet-small': 30, fold: 30 }),
    '66': mix({ check: 30, fold: 70 }),
    '55': mix({ check: 25, fold: 75 }),
    '44': mix({ check: 20, fold: 80 }),
    '33': mix({ check: 20, fold: 80 }),
    '22': mix({ check: 20, fold: 80 }),
    'QJs': mix({ check: 30, 'bet-medium': 40, 'bet-large': 30 }),  // OESD
    'J9s': mix({ check: 40, 'bet-medium': 35, 'bet-large': 25 }),  // Pair + OESD
    'J8s': mix({ check: 45, 'bet-small': 30, 'bet-medium': 25 }),
    'JTs': mix({ check: 20, 'bet-medium': 40, 'bet-large': 40 }),  // Straight
    'T9s': mix({ check: 20, 'bet-medium': 50, 'bet-large': 30 }),  // Two pair
    'T8s': mix({ check: 25, 'bet-medium': 45, 'bet-large': 30 }),  // Two pair
    '98s': mix({ check: 25, 'bet-medium': 45, 'bet-large': 30 }),  // Two pair
    '97s': mix({ check: 50, 'bet-small': 30, fold: 20 }),
    '87s': mix({ check: 40, 'bet-small': 35, 'bet-medium': 25 }),  // Pair + draw
    '76s': mix({ check: 30, 'bet-medium': 40, 'bet-large': 30 }),  // OESD
    '65s': mix({ check: 40, 'bet-small': 30, fold: 30 }),  // Gutshot
    'ATs': mix({ check: 40, 'bet-small': 35, 'bet-medium': 25 }),
    'A9s': mix({ check: 45, 'bet-small': 30, 'bet-medium': 25 }),
    'A8s': mix({ check: 45, 'bet-small': 30, 'bet-medium': 25 }),
    'KTs': mix({ check: 45, 'bet-small': 30, 'bet-medium': 25 }),
    'K9s': mix({ check: 50, 'bet-small': 25, fold: 25 }),
    'QTs': mix({ check: 45, 'bet-small': 30, 'bet-medium': 25 }),
    'Q9s': mix({ check: 55, 'bet-small': 20, fold: 25 }),
    'KQo': mix({ check: 50, 'bet-small': 20, fold: 30 }),
    'AJo': mix({ check: 50, 'bet-small': 20, fold: 30 }),
    'ATo': mix({ check: 45, 'bet-small': 30, fold: 25 }),
  },
  exploitability: 0.3,
  solvedAt: NOW,
}

// --- Solution 3: 6h-5h-3h monotone low ---
// CO open → BB call. Monotone board favors BB's range (more suited combos).
const h6h5h3h: Solution = {
  solutionKey: 'CO-open_BB-call_6h5h3h_flop',
  nodeKey: 'CO-open_BB-call',
  boardString: '6h 5h 3h',
  street: 'flop',
  potSizeBB: 6.5,
  effectiveStackBB: 97,
  strategies: {
    'TT': mix({ check: 50, 'bet-small': 30, fold: 20 }),
    '99': mix({ check: 50, 'bet-small': 25, fold: 25 }),
    '88': mix({ check: 50, 'bet-small': 25, fold: 25 }),
    '77': mix({ check: 45, 'bet-small': 30, fold: 25 }),
    '66': mix({ check: 15, 'bet-medium': 50, 'bet-large': 35 }),  // Set
    '55': mix({ check: 15, 'bet-medium': 50, 'bet-large': 35 }),  // Set
    '44': mix({ check: 40, 'bet-small': 30, fold: 30 }),
    '33': mix({ check: 15, 'bet-medium': 50, 'bet-large': 35 }),  // Set
    '22': mix({ check: 50, fold: 50 }),
    'A5s': mix({ check: 40, 'bet-small': 35, 'bet-medium': 25 }),
    'A3s': mix({ check: 40, 'bet-small': 35, 'bet-medium': 25 }),
    'ATs': mix({ check: 55, 'bet-small': 20, fold: 25 }),
    'A9s': mix({ check: 55, 'bet-small': 20, fold: 25 }),
    'KJs': mix({ check: 55, 'bet-small': 15, fold: 30 }),
    'KTs': mix({ check: 55, 'bet-small': 15, fold: 30 }),
    'QJs': mix({ check: 50, 'bet-small': 15, fold: 35 }),
    'QTs': mix({ check: 50, 'bet-small': 15, fold: 35 }),
    'JTs': mix({ check: 50, fold: 50 }),
    'J9s': mix({ check: 50, fold: 50 }),
    'T9s': mix({ check: 50, fold: 50 }),
    '98s': mix({ check: 45, 'bet-small': 25, fold: 30 }),
    '87s': mix({ check: 35, 'bet-small': 35, 'bet-medium': 30 }),  // OESD
    '76s': mix({ check: 35, 'bet-small': 35, 'bet-medium': 30 }),  // Pair + draw
    '65s': mix({ check: 25, 'bet-medium': 45, 'bet-large': 30 }),  // Two pair
    '54s': mix({ check: 30, 'bet-small': 35, 'bet-medium': 35 }),  // Pair + OESD
  },
  exploitability: 0.3,
  solvedAt: NOW,
}

// --- Solution 4: K-K-7 rainbow (paired board) ---
// BTN open → BB call. Paired board — ranges interact differently.
const khKd7c: Solution = {
  solutionKey: 'BTN-open_BB-call_KhKd7c_flop',
  nodeKey: 'BTN-open_BB-call',
  boardString: 'Kh Kd 7c',
  street: 'flop',
  potSizeBB: 6.5,
  effectiveStackBB: 97,
  strategies: {
    'AA': mix({ check: 30, 'bet-small': 40, 'bet-medium': 30 }),
    'QQ': mix({ check: 45, 'bet-small': 35, 'bet-medium': 20 }),
    'JJ': mix({ check: 50, 'bet-small': 30, 'bet-medium': 20 }),
    'TT': mix({ check: 55, 'bet-small': 25, 'bet-medium': 20 }),
    '99': mix({ check: 60, 'bet-small': 25, fold: 15 }),
    '88': mix({ check: 60, 'bet-small': 20, fold: 20 }),
    '77': mix({ check: 15, 'bet-medium': 40, 'bet-large': 45 }),  // Full house
    '66': mix({ check: 65, fold: 35 }),
    '55': mix({ check: 60, fold: 40 }),
    '44': mix({ check: 55, fold: 45 }),
    '33': mix({ check: 55, fold: 45 }),
    '22': mix({ check: 55, fold: 45 }),
    'AKs': mix({ check: 15, 'bet-small': 35, 'bet-medium': 30, 'bet-large': 20 }),
    'AQs': mix({ check: 50, 'bet-small': 30, 'bet-medium': 20 }),
    'AJs': mix({ check: 50, 'bet-small': 30, 'bet-medium': 20 }),
    'ATs': mix({ check: 55, 'bet-small': 25, 'bet-medium': 20 }),
    'A9s': mix({ check: 60, 'bet-small': 20, fold: 20 }),
    'A8s': mix({ check: 60, 'bet-small': 20, fold: 20 }),
    'A7s': mix({ check: 35, 'bet-small': 35, 'bet-medium': 30 }),
    'KQs': mix({ check: 15, 'bet-small': 30, 'bet-medium': 35, 'bet-large': 20 }),
    'KJs': mix({ check: 15, 'bet-small': 30, 'bet-medium': 35, 'bet-large': 20 }),
    'KTs': mix({ check: 20, 'bet-small': 35, 'bet-medium': 30, 'bet-large': 15 }),
    'K9s': mix({ check: 25, 'bet-small': 35, 'bet-medium': 25, 'bet-large': 15 }),
    'QJs': mix({ check: 65, 'bet-small': 15, fold: 20 }),
    'QTs': mix({ check: 65, 'bet-small': 15, fold: 20 }),
    'JTs': mix({ check: 65, fold: 35 }),
    'T9s': mix({ check: 60, fold: 40 }),
    '98s': mix({ check: 55, fold: 45 }),
    '87s': mix({ check: 55, fold: 45 }),
    'AKo': mix({ check: 15, 'bet-small': 35, 'bet-medium': 30, 'bet-large': 20 }),
    'KQo': mix({ check: 20, 'bet-small': 30, 'bet-medium': 35, 'bet-large': 15 }),
  },
  exploitability: 0.3,
  solvedAt: NOW,
}

// --- Solution 5: 8-5-2 rainbow (dry low) ---
// SB open → BB call. Low dry board — wider range interaction.
const s8s5d2c: Solution = {
  solutionKey: 'SB-open_BB-call_8s5d2c_flop',
  nodeKey: 'SB-open_BB-call',
  boardString: '8s 5d 2c',
  street: 'flop',
  potSizeBB: 5.0,
  effectiveStackBB: 97.5,
  strategies: {
    'AA': mix({ check: 30, 'bet-small': 40, 'bet-medium': 30 }),
    'KK': mix({ check: 35, 'bet-small': 40, 'bet-medium': 25 }),
    'QQ': mix({ check: 40, 'bet-small': 35, 'bet-medium': 25 }),
    'JJ': mix({ check: 45, 'bet-small': 30, 'bet-medium': 25 }),
    'TT': mix({ check: 45, 'bet-small': 30, 'bet-medium': 25 }),
    '99': mix({ check: 50, 'bet-small': 30, 'bet-medium': 20 }),
    '88': mix({ check: 15, 'bet-medium': 50, 'bet-large': 35 }),  // Set
    '77': mix({ check: 55, 'bet-small': 25, fold: 20 }),
    '66': mix({ check: 55, 'bet-small': 20, fold: 25 }),
    '55': mix({ check: 15, 'bet-medium': 50, 'bet-large': 35 }),  // Set
    '44': mix({ check: 50, fold: 50 }),
    '33': mix({ check: 50, fold: 50 }),
    '22': mix({ check: 15, 'bet-medium': 50, 'bet-large': 35 }),  // Set
    'ATs': mix({ check: 55, 'bet-small': 25, fold: 20 }),
    'A9s': mix({ check: 55, 'bet-small': 25, fold: 20 }),
    'A8s': mix({ check: 30, 'bet-small': 40, 'bet-medium': 30 }),  // Top pair
    'A7s': mix({ check: 55, 'bet-small': 25, fold: 20 }),
    'A6s': mix({ check: 55, 'bet-small': 20, fold: 25 }),
    'A5s': mix({ check: 30, 'bet-small': 40, 'bet-medium': 30 }),  // Mid pair
    'A4s': mix({ check: 55, 'bet-small': 20, fold: 25 }),
    'A3s': mix({ check: 55, 'bet-small': 20, fold: 25 }),
    'A2s': mix({ check: 35, 'bet-small': 35, 'bet-medium': 30 }),  // Bottom pair
    'KQs': mix({ check: 55, 'bet-small': 20, fold: 25 }),
    'KJs': mix({ check: 55, 'bet-small': 15, fold: 30 }),
    'KTs': mix({ check: 55, 'bet-small': 15, fold: 30 }),
    'K9s': mix({ check: 55, fold: 45 }),
    'K8s': mix({ check: 35, 'bet-small': 35, 'bet-medium': 30 }),
    'K7s': mix({ check: 55, fold: 45 }),
    'QJs': mix({ check: 55, fold: 45 }),
    'QTs': mix({ check: 55, fold: 45 }),
    'JTs': mix({ check: 55, fold: 45 }),
    'T9s': mix({ check: 50, fold: 50 }),
    '98s': mix({ check: 40, 'bet-small': 30, 'bet-medium': 30 }),
    '87s': mix({ check: 35, 'bet-small': 35, 'bet-medium': 30 }),
    '76s': mix({ check: 45, 'bet-small': 30, fold: 25 }),
    '65s': mix({ check: 35, 'bet-small': 35, 'bet-medium': 30 }),
  },
  exploitability: 0.3,
  solvedAt: NOW,
}

// --- Solution 6: K-Q-7 two-tone (3bet pot) ---
// BTN open → BB 3bet → BTN call. 3bet pot, tighter ranges.
const kdQh7d: Solution = {
  solutionKey: 'BTN-open_BB-3bet_BTN-call_KdQh7d_flop',
  nodeKey: 'BTN-open_BB-3bet_BTN-call',
  boardString: 'Kd Qh 7d',
  street: 'flop',
  potSizeBB: 20.5,
  effectiveStackBB: 89.75,
  strategies: {
    'QQ': mix({ check: 20, 'bet-small': 30, 'bet-medium': 30, 'bet-large': 20 }),
    'JJ': mix({ check: 55, 'bet-small': 25, fold: 20 }),
    'TT': mix({ check: 55, 'bet-small': 20, fold: 25 }),
    '99': mix({ check: 50, fold: 50 }),
    '88': mix({ check: 45, fold: 55 }),
    '77': mix({ check: 15, 'bet-medium': 45, 'bet-large': 40 }),  // Set
    '66': mix({ check: 35, fold: 65 }),
    'AKs': mix({ check: 25, 'bet-small': 35, 'bet-medium': 25, 'bet-large': 15 }),
    'AQs': mix({ check: 25, 'bet-small': 35, 'bet-medium': 25, 'bet-large': 15 }),
    'AJs': mix({ check: 50, 'bet-small': 25, fold: 25 }),
    'ATs': mix({ check: 50, 'bet-small': 25, fold: 25 }),
    'A9s': mix({ check: 55, fold: 45 }),
    'A8s': mix({ check: 55, fold: 45 }),
    'A5s': mix({ check: 50, 'bet-small': 20, fold: 30 }),
    'A4s': mix({ check: 50, fold: 50 }),
    'KQs': mix({ check: 15, 'bet-small': 30, 'bet-medium': 35, 'bet-large': 20 }),
    'KJs': mix({ check: 25, 'bet-small': 40, 'bet-medium': 25, 'bet-large': 10 }),
    'KTs': mix({ check: 30, 'bet-small': 35, 'bet-medium': 25, 'bet-large': 10 }),
    'QJs': mix({ check: 35, 'bet-small': 35, 'bet-medium': 20, 'bet-large': 10 }),
    'QTs': mix({ check: 35, 'bet-small': 35, 'bet-medium': 20, 'bet-large': 10 }),
    'JTs': mix({ check: 50, 'bet-small': 25, fold: 25 }),
    'T9s': mix({ check: 50, fold: 50 }),
    'AKo': mix({ check: 25, 'bet-small': 35, 'bet-medium': 25, 'bet-large': 15 }),
    'AQo': mix({ check: 30, 'bet-small': 35, 'bet-medium': 25, 'bet-large': 10 }),
    'AJo': mix({ check: 50, 'bet-small': 25, fold: 25 }),
    'KQo': mix({ check: 20, 'bet-small': 35, 'bet-medium': 30, 'bet-large': 15 }),
  },
  exploitability: 0.3,
  solvedAt: NOW,
}

// --- Solution 7: 8-7-5 rainbow (medium connected) ---
// CO open → BB call.
const d8d7s5c: Solution = {
  solutionKey: 'CO-open_BB-call_8d7s5c_flop',
  nodeKey: 'CO-open_BB-call',
  boardString: '8d 7s 5c',
  street: 'flop',
  potSizeBB: 6.5,
  effectiveStackBB: 97,
  strategies: {
    'TT': mix({ check: 40, 'bet-small': 35, 'bet-medium': 25 }),
    '99': mix({ check: 35, 'bet-small': 35, 'bet-medium': 30 }),  // Overpair
    '88': mix({ check: 15, 'bet-medium': 45, 'bet-large': 40 }),  // Set
    '77': mix({ check: 15, 'bet-medium': 45, 'bet-large': 40 }),  // Set
    '66': mix({ check: 30, 'bet-small': 35, 'bet-medium': 35 }),  // OESD
    '55': mix({ check: 15, 'bet-medium': 45, 'bet-large': 40 }),  // Set
    '44': mix({ check: 40, fold: 60 }),
    '33': mix({ check: 35, fold: 65 }),
    '22': mix({ check: 30, fold: 70 }),
    'ATs': mix({ check: 55, 'bet-small': 20, fold: 25 }),
    'A9s': mix({ check: 50, 'bet-small': 25, fold: 25 }),
    'A8s': mix({ check: 30, 'bet-small': 35, 'bet-medium': 35 }),
    'A7s': mix({ check: 35, 'bet-small': 35, 'bet-medium': 30 }),
    'A5s': mix({ check: 35, 'bet-small': 35, 'bet-medium': 30 }),
    'KJs': mix({ check: 55, 'bet-small': 15, fold: 30 }),
    'KTs': mix({ check: 55, 'bet-small': 15, fold: 30 }),
    'QJs': mix({ check: 55, fold: 45 }),
    'QTs': mix({ check: 55, fold: 45 }),
    'JTs': mix({ check: 50, 'bet-small': 20, fold: 30 }),
    'J9s': mix({ check: 45, 'bet-small': 25, fold: 30 }),
    'T9s': mix({ check: 35, 'bet-small': 35, 'bet-medium': 30 }),  // OESD
    '98s': mix({ check: 30, 'bet-small': 35, 'bet-medium': 35 }),  // Pair + draw
    '97s': mix({ check: 40, 'bet-small': 30, fold: 30 }),
    '87s': mix({ check: 25, 'bet-medium': 40, 'bet-large': 35 }),  // Two pair
    '76s': mix({ check: 30, 'bet-small': 35, 'bet-medium': 35 }),  // Pair + draw
    '65s': mix({ check: 30, 'bet-small': 35, 'bet-medium': 35 }),
    '54s': mix({ check: 30, 'bet-small': 35, 'bet-medium': 35 }),
  },
  exploitability: 0.3,
  solvedAt: NOW,
}

// --- Solution 8: Q-J-T rainbow (broadway heavy) ---
// BTN open → BB call. Very connected broadway board.
const qcJhTs: Solution = {
  solutionKey: 'BTN-open_BB-call_QcJhTs_flop',
  nodeKey: 'BTN-open_BB-call',
  boardString: 'Qc Jh Ts',
  street: 'flop',
  potSizeBB: 6.5,
  effectiveStackBB: 97,
  strategies: {
    'AA': mix({ check: 30, 'bet-small': 30, 'bet-medium': 25, 'bet-large': 15 }),
    'KK': mix({ check: 25, 'bet-small': 35, 'bet-medium': 25, 'bet-large': 15 }),
    'QQ': mix({ check: 15, 'bet-medium': 40, 'bet-large': 45 }),  // Set
    'JJ': mix({ check: 15, 'bet-medium': 40, 'bet-large': 45 }),  // Set
    'TT': mix({ check: 15, 'bet-medium': 40, 'bet-large': 45 }),  // Set
    '99': mix({ check: 30, 'bet-small': 30, 'bet-medium': 25, fold: 15 }),
    '88': mix({ check: 30, fold: 70 }),
    '77': mix({ check: 25, fold: 75 }),
    '66': mix({ check: 20, fold: 80 }),
    '55': mix({ check: 20, fold: 80 }),
    'AKs': mix({ check: 15, 'bet-medium': 40, 'bet-large': 45 }),  // Straight
    'K9s': mix({ check: 20, 'bet-medium': 40, 'bet-large': 40 }),  // Straight
    'AKo': mix({ check: 15, 'bet-medium': 40, 'bet-large': 45 }),  // Straight
    'AQs': mix({ check: 30, 'bet-small': 35, 'bet-medium': 25, 'bet-large': 10 }),
    'AJs': mix({ check: 35, 'bet-small': 30, 'bet-medium': 25, 'bet-large': 10 }),
    'ATs': mix({ check: 35, 'bet-small': 30, 'bet-medium': 25, 'bet-large': 10 }),
    'KQs': mix({ check: 30, 'bet-small': 30, 'bet-medium': 25, 'bet-large': 15 }),
    'KJs': mix({ check: 30, 'bet-small': 30, 'bet-medium': 25, 'bet-large': 15 }),
    'KTs': mix({ check: 30, 'bet-small': 30, 'bet-medium': 25, 'bet-large': 15 }),
    'QJs': mix({ check: 20, 'bet-medium': 45, 'bet-large': 35 }),  // Two pair
    'QTs': mix({ check: 20, 'bet-medium': 45, 'bet-large': 35 }),  // Two pair
    'JTs': mix({ check: 20, 'bet-medium': 45, 'bet-large': 35 }),  // Two pair
    'Q9s': mix({ check: 45, 'bet-small': 30, fold: 25 }),
    'J9s': mix({ check: 40, 'bet-small': 30, 'bet-medium': 30 }),  // Pair + OESD
    'T9s': mix({ check: 35, 'bet-small': 30, 'bet-medium': 35 }),  // Pair + OESD
    '98s': mix({ check: 30, 'bet-small': 30, 'bet-medium': 25, fold: 15 }),  // OESD
    '87s': mix({ check: 30, 'bet-small': 25, fold: 45 }),  // Gutshot
    'AQo': mix({ check: 35, 'bet-small': 30, 'bet-medium': 25, 'bet-large': 10 }),
    'KQo': mix({ check: 35, 'bet-small': 30, 'bet-medium': 20, 'bet-large': 15 }),
    'KJo': mix({ check: 35, 'bet-small': 30, 'bet-medium': 25, fold: 10 }),
    'QJo': mix({ check: 20, 'bet-medium': 45, 'bet-large': 35 }),
    'JTo': mix({ check: 25, 'bet-medium': 40, 'bet-large': 35 }),
  },
  exploitability: 0.3,
  solvedAt: NOW,
}

// Write all solutions
const solutions = [ah7d2c, ts9h8h, h6h5h3h, khKd7c, s8s5d2c, kdQh7d, d8d7s5c, qcJhTs]

for (const sol of solutions) {
  const filename = `${sol.solutionKey}.json`
  const filepath = join(OUTPUT_DIR, filename)
  writeFileSync(filepath, JSON.stringify(sol, null, 2), 'utf-8')
  console.log(`  ✓ ${filename} (${Object.keys(sol.strategies).length} hands)`)
}

console.log(`\nGenerated ${solutions.length} solution fixtures in ${OUTPUT_DIR}`)
