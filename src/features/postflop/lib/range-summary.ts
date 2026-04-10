import type { VillainRangeNode } from '@/data/villain-ranges/types'

/**
 * Describe a villain's continuing range in human-readable text.
 * e.g., "BB's calling range vs BTN open (77 hands)"
 */
export function describeVillainRange(
  node: VillainRangeNode,
  handCount: number,
): string {
  if (node.potType === 'srp') {
    return `${node.caller}'s calling range vs ${node.opener} open (${handCount} hands)`
  }
  return `${node.caller}'s calling range vs ${node.threeBettor} 3-bet (${handCount} hands)`
}
