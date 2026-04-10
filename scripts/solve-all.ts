/**
 * Batch-solve all postflop configs with TexasSolver, then convert to CachedSolution format.
 *
 * Usage:
 *   bun run scripts/solve-all.ts [--configs postflop-solver-configs/] [--solver /path/to/console_solver]
 *
 * This orchestrates:
 *   1. Running console_solver for each .txt config file
 *   2. Converting all result files to CachedSolution JSON
 *   3. Regenerating the manifest
 */

import { parseArgs } from 'util'
import { readdirSync, existsSync } from 'fs'
import { join } from 'path'
import { $ } from 'bun'

const DEFAULT_SOLVER = '/Users/eliotpuplett/Documents/TexasSolver/build/console_solver'

function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      configs: { type: 'string', default: 'postflop-solver-configs' },
      solver: { type: 'string', default: DEFAULT_SOLVER },
      skip: { type: 'string', default: '0' },
    },
  })

  const configDir = values.configs ?? 'postflop-solver-configs'
  const solverPath = values.solver ?? DEFAULT_SOLVER

  if (!existsSync(solverPath)) {
    console.error(`Solver not found at: ${solverPath}`)
    process.exit(1)
  }

  const configFiles = readdirSync(configDir)
    .filter((f) => f.endsWith('.txt'))
    .sort()

  const skip = parseInt(values.skip ?? '0', 10)

  console.log(`Batch solving ${configFiles.length} configs (skipping first ${skip})`)
  console.log(`Solver: ${solverPath}`)
  console.log(`Configs: ${configDir}/`)
  console.log()

  solveAll(configFiles.slice(skip), configDir, solverPath)
}

async function solveAll(configFiles: string[], configDir: string, solverPath: string) {
  let solved = 0
  let failed = 0

  for (const configFile of configFiles) {
    const configPath = join(configDir, configFile)
    const resultName = configFile.replace('.txt', '_result.json')
    const resultPath = join(configDir, resultName)

    // Skip if already solved
    if (existsSync(resultPath)) {
      console.log(`  ⏭ ${configFile} (already solved)`)
      solved++
      continue
    }

    console.log(`  🔄 Solving ${configFile} (${solved + failed + 1}/${configFiles.length})...`)
    const startTime = Date.now()

    try {
      const result = await $`${solverPath} --input_file ${configPath}`.quiet()
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

      if (existsSync(resultPath)) {
        console.log(`  ✓ ${configFile} (${elapsed}s)`)
        solved++
      } else {
        console.error(`  ✗ ${configFile} — solver ran but no output produced`)
        console.error(`    stdout: ${result.stdout.toString().slice(0, 200)}`)
        failed++
      }
    } catch (e) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      console.error(`  ✗ ${configFile} — solver failed after ${elapsed}s`)
      if (e instanceof Error) {
        console.error(`    ${e.message.slice(0, 200)}`)
      }
      failed++
    }
  }

  console.log()
  console.log(`Solving complete: ${solved} solved, ${failed} failed`)
  console.log()

  // Step 2: Convert all results
  console.log('Converting solver output to CachedSolution format...')
  await $`bun run scripts/convert-postflop-solutions.ts`.quiet().then(
    (r) => console.log(r.stdout.toString()),
    (e) => console.error('Conversion failed:', e instanceof Error ? e.message : String(e))
  )

  // Step 3: Regenerate manifest
  console.log('Regenerating manifest...')
  await $`bun run scripts/regenerate-manifest.ts`.quiet().then(
    (r) => console.log(r.stdout.toString()),
    (e) => console.error('Manifest regeneration failed:', e instanceof Error ? e.message : String(e))
  )
}

main()
