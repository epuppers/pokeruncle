/**
 * Regenerate the postflop solution manifest from files in public/postflop-cache/.
 *
 * Usage:
 *   bun run scripts/regenerate-manifest.ts [--dir public/postflop-cache/]
 *
 * Reads all *.json files (except manifest.json), validates them, and writes
 * a new manifest.json with metadata for each solution.
 */

import { parseArgs } from 'util'
import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

interface ManifestEntry {
  solutionKey: string
  nodeKey: string
  boardString: string
  street: string
  handCount: number
}

interface Manifest {
  version: number
  solutions: ManifestEntry[]
}

function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      dir: { type: 'string', default: 'public/postflop-cache' },
    },
  })

  const dir = values.dir ?? 'public/postflop-cache'

  const files = readdirSync(dir).filter(
    (f) => f.endsWith('.json') && f !== 'manifest.json'
  )

  console.log(`Scanning ${files.length} solution files in ${dir}/`)

  const entries: ManifestEntry[] = []
  let errors = 0

  for (const filename of files) {
    try {
      const raw = readFileSync(join(dir, filename), 'utf-8')
      const solution = JSON.parse(raw) as Record<string, unknown>

      const solutionKey = solution.solutionKey as string
      const nodeKey = solution.nodeKey as string
      const boardString = solution.boardString as string
      const street = solution.street as string
      const strategies = solution.strategies as Record<string, unknown>
      const handCount = Object.keys(strategies).length

      if (!solutionKey || !nodeKey || !boardString || !street) {
        console.error(`  ✗ Invalid solution: ${filename}`)
        errors++
        continue
      }

      entries.push({ solutionKey, nodeKey, boardString, street, handCount })
      console.log(`  ✓ ${solutionKey} (${handCount} hands)`)
    } catch (e) {
      console.error(`  ✗ Error reading ${filename}: ${e instanceof Error ? e.message : String(e)}`)
      errors++
    }
  }

  // Sort by nodeKey then boardString for deterministic output
  entries.sort((a, b) => {
    const nodeCompare = a.nodeKey.localeCompare(b.nodeKey)
    if (nodeCompare !== 0) return nodeCompare
    return a.boardString.localeCompare(b.boardString)
  })

  const manifest: Manifest = {
    version: 2,
    solutions: entries,
  }

  const manifestPath = join(dir, 'manifest.json')
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8')

  console.log()
  console.log(`Manifest written: ${manifestPath}`)
  console.log(`Solutions: ${entries.length}`)
  if (errors > 0) console.log(`Errors: ${errors}`)
}

main()
