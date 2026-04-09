import type { Position } from '@/types/poker'
import type { Chart } from '@/data/ranges'

/** The type of pot that results from the preflop action sequence */
export type PotType = 'srp' | '3bet'

/**
 * Identifies a preflop action sequence that leads to a postflop spot.
 * Each node describes who opened, who called (or 3bet+called), and what
 * pot type results. This is the key we use to look up villain's continuing range.
 */
export type VillainRangeNode =
  | {
      potType: 'srp'
      opener: Position
      caller: Position
    }
  | {
      potType: '3bet'
      opener: Position
      threeBettor: Position
      /** Who called the 3bet — always the original opener */
      caller: Position
    }

/** Metadata about how a villain range was generated */
export interface VillainRangeMetadata {
  solver: string
  solveDate: string
  stackDepthBB: number
  rake?: string
  exploitability?: string
}

/**
 * A villain range entry pairs a preflop node with the villain's
 * continuing range (as a standard Chart) and generation metadata.
 *
 * For SRP nodes: the range is the caller's hands that continue vs the open.
 * For 3bet nodes: the range is the 3bettor's hands that the opener calls against.
 */
export interface VillainRangeEntry {
  node: VillainRangeNode
  range: Chart
  metadata: VillainRangeMetadata
}

/**
 * Build a string key from a VillainRangeNode for lookup.
 *
 * SRP:  "BTN-open_BB-call"
 * 3bet: "BTN-open_BB-3bet_BTN-call"
 */
export function villainRangeKey(node: VillainRangeNode): string {
  if (node.potType === 'srp') {
    return `${node.opener}-open_${node.caller}-call`
  }
  return `${node.opener}-open_${node.threeBettor}-3bet_${node.caller}-call`
}
