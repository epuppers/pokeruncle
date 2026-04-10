import { db } from '@/lib/db'

import type { CachedSolutionRecord } from '@/lib/db'

import type { CachedSolution } from '../types'

import {
  cachedSolutionSchema,
  solutionManifestSchema,
} from './solution-schema'

import type { SolutionManifest, SolutionManifestEntry } from './solution-schema'

const CACHE_BASE_URL = '/postflop-cache'

/** In-memory cache to avoid refetching during a session */
const memoryCache = new Map<string, CachedSolution>()
let manifestCache: SolutionManifest | null = null

// --- Manifest ---

/**
 * Load the solution manifest listing all available pre-solved solutions.
 * Fetched once per session, cached in memory.
 */
export async function loadManifest(): Promise<SolutionManifest> {
  if (manifestCache) return manifestCache

  const response = await fetch(`${CACHE_BASE_URL}/manifest.json`)
  if (!response.ok) {
    throw new Error(`Failed to load solution manifest: ${response.status}`)
  }

  const raw: unknown = await response.json()
  const parsed = cachedSolutionManifestParse(raw)
  manifestCache = parsed
  return parsed
}

function cachedSolutionManifestParse(raw: unknown): SolutionManifest {
  const result = solutionManifestSchema.safeParse(raw)
  if (!result.success) {
    throw new Error(`Invalid solution manifest: ${result.error.message}`)
  }
  return result.data
}

/** Get manifest entries, optionally filtered by node key */
export async function getAvailableSolutions(
  nodeKey?: string
): Promise<SolutionManifestEntry[]> {
  const manifest = await loadManifest()
  if (!nodeKey) return manifest.solutions
  return manifest.solutions.filter((s) => s.nodeKey === nodeKey)
}

// --- Solution loading ---

/**
 * Load a cached solution by its key.
 * Checks in order: memory cache → IndexedDB → build assets (fetch).
 * Writes to IndexedDB after fetching from build assets.
 */
export async function getSolution(solutionKey: string): Promise<CachedSolution | null> {
  // 1. Memory cache
  const cached = memoryCache.get(solutionKey)
  if (cached) return cached

  // 2. IndexedDB
  const dbRecord = await db.cachedSolutions.get(solutionKey)
  if (dbRecord) {
    const solution = dbRecordToSolution(dbRecord)
    memoryCache.set(solutionKey, solution)
    return solution
  }

  // 3. Build assets
  const fetched = await fetchSolution(solutionKey)
  if (fetched) {
    memoryCache.set(solutionKey, fetched)
    await cacheSolutionToDb(fetched)
    return fetched
  }

  return null
}

/**
 * Fetch a solution from the build assets (public/postflop-cache/).
 * Validates the JSON against the Zod schema at the trust boundary.
 */
async function fetchSolution(solutionKey: string): Promise<CachedSolution | null> {
  const url = `${CACHE_BASE_URL}/${solutionKey}.json`
  const response = await fetch(url)

  if (!response.ok) {
    if (response.status === 404) return null
    throw new Error(`Failed to fetch solution ${solutionKey}: ${response.status}`)
  }

  const raw: unknown = await response.json()
  const result = cachedSolutionSchema.safeParse(raw)

  if (!result.success) {
    console.error(`Invalid solution file ${solutionKey}:`, result.error.message)
    return null
  }

  return result.data as CachedSolution
}

/** Write a solution to IndexedDB for offline access */
async function cacheSolutionToDb(solution: CachedSolution): Promise<void> {
  await db.cachedSolutions.put({
    solutionKey: solution.solutionKey,
    nodeKey: solution.nodeKey,
    boardString: solution.boardString,
    street: solution.street,
    potSizeBB: solution.potSizeBB,
    effectiveStackBB: solution.effectiveStackBB,
    strategiesJson: JSON.stringify(solution.strategies),
    exploitability: solution.exploitability,
    solvedAt: solution.solvedAt,
  })
}

/** Convert a DB record back to a CachedSolution */
function dbRecordToSolution(record: CachedSolutionRecord): CachedSolution {
  const strategies = JSON.parse(record.strategiesJson) as CachedSolution['strategies']
  return {
    solutionKey: record.solutionKey,
    nodeKey: record.nodeKey,
    boardString: record.boardString,
    street: record.street as CachedSolution['street'],
    potSizeBB: record.potSizeBB,
    effectiveStackBB: record.effectiveStackBB,
    strategies,
    exploitability: record.exploitability,
    solvedAt: record.solvedAt,
  }
}

/** Clear the in-memory caches (useful for testing) */
export function clearCaches(): void {
  memoryCache.clear()
  manifestCache = null
}
