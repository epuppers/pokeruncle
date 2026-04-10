import { z } from 'zod'

import { POSTFLOP_STREETS } from '../types'

/**
 * Zod schema for validating cached solution JSON files at the trust boundary.
 * Solution files come from disk (build assets) or IndexedDB — both are untrusted.
 */

/** Action weights are partial records — not all actions appear for every hand */
const postflopActionWeightsSchema = z.record(z.string(), z.number().min(0).max(100))

/** Schema for a single solution file */
export const cachedSolutionSchema = z.object({
  solutionKey: z.string(),
  nodeKey: z.string(),
  boardString: z.string(),
  street: z.enum(POSTFLOP_STREETS),
  potSizeBB: z.number().positive(),
  effectiveStackBB: z.number().positive(),
  strategies: z.record(z.string(), postflopActionWeightsSchema),
  exploitability: z.number().min(0),
  solvedAt: z.number(),
})

/** Schema for the solution manifest (lists available solutions) */
export const solutionManifestSchema = z.object({
  version: z.number(),
  solutions: z.array(
    z.object({
      solutionKey: z.string(),
      nodeKey: z.string(),
      boardString: z.string(),
      street: z.enum(POSTFLOP_STREETS),
      handCount: z.number().int().positive(),
    })
  ),
})

export type SolutionManifestEntry = z.infer<typeof solutionManifestSchema>['solutions'][number]
export type SolutionManifest = z.infer<typeof solutionManifestSchema>
