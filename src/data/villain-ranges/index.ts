import type { Chart } from '@/data/ranges'

import type { VillainRangeNode } from './types'
import { villainRangeKey } from './types'
import { villainRanges } from './cash-100bb'

/** Pre-indexed lookup: node key → Chart */
const rangeIndex = new Map<string, Chart>(
  villainRanges.map((entry) => [villainRangeKey(entry.node), entry.range])
)

/**
 * Look up the villain's continuing range for a given preflop node.
 * Returns null if no range data exists for that node yet.
 */
export function getVillainRange(node: VillainRangeNode): Chart | null {
  return rangeIndex.get(villainRangeKey(node)) ?? null
}

/**
 * Look up villain range by its string key directly.
 * Useful when the key is already computed (e.g., from a URL param).
 */
export function getVillainRangeByKey(key: string): Chart | null {
  return rangeIndex.get(key) ?? null
}

/** Get all available villain range keys (nodes that have data). */
export function getAvailableVillainRangeKeys(): string[] {
  return [...rangeIndex.keys()]
}

export type { VillainRangeNode, VillainRangeEntry, VillainRangeMetadata } from './types'
export { villainRangeKey } from './types'
