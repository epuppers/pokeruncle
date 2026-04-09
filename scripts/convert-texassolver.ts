/**
 * Convert TexasSolver output_strategy.json to our villain range format.
 *
 * Usage:
 *   bun run scripts/convert-texassolver.ts \
 *     --input solver-output/BTN-open_BB-call_result.json \
 *     --node "BTN-open_BB-call"
 *
 * The script reads the solver output JSON, extracts the root node strategy
 * (the villain's preflop decision), converts combo notation to hand classes,
 * and prints the resulting Chart as TypeScript to stdout.
 *
 * Pipe to a file or copy into cash-100bb.ts manually.
 *
 * See src/data/villain-ranges/METHODOLOGY.md for full instructions.
 */

import { parseArgs } from 'util'
import { readFileSync } from 'fs'

import { convertSolverOutput, type SolverComboStrategy } from '../src/data/villain-ranges/lib/converter'

function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      input: { type: 'string' },
      node: { type: 'string' },
      'min-weight': { type: 'string', default: '1' },
    },
  })

  if (!values.input) {
    console.error('Error: --input is required (path to TexasSolver output JSON)')
    process.exit(1)
  }

  if (!values.node) {
    console.error('Error: --node is required (e.g., "BTN-open_BB-call")')
    process.exit(1)
  }

  const minWeight = parseInt(values['min-weight'] ?? '1', 10)

  console.error(`Reading solver output: ${values.input}`)
  console.error(`Node: ${values.node}`)
  console.error(`Min weight: ${minWeight}%`)
  console.error()

  const raw = readFileSync(values.input, 'utf-8')
  const solverOutput: unknown = JSON.parse(raw)

  // TexasSolver output format varies. The strategy data is typically at the root
  // node of the game tree. We look for a strategy map keyed by combo strings.
  const comboStrategies = extractComboStrategies(solverOutput)

  if (comboStrategies.size === 0) {
    console.error('Error: No combo strategies found in solver output.')
    console.error('The solver output format may differ from what this script expects.')
    console.error('Check METHODOLOGY.md for supported formats and manual conversion instructions.')
    process.exit(1)
  }

  console.error(`Found ${comboStrategies.size} combo strategies`)

  const chart = convertSolverOutput(comboStrategies, minWeight)
  const handCount = Object.keys(chart).length

  console.error(`Converted to ${handCount} hand classes (${169 - handCount} fold)`)
  console.error()

  // Output as TypeScript object literal
  const sortedEntries = Object.entries(chart).sort(([a], [b]) => a.localeCompare(b))
  const lines = sortedEntries.map(([hand, cell]) => {
    const cellStr = formatCell(cell)
    return `    '${hand}': ${cellStr},`
  })

  console.log(`// Node: ${values.node}`)
  console.log(`// Source: ${values.input}`)
  console.log(`// Generated: ${new Date().toISOString().split('T')[0]}`)
  console.log(`{`)
  for (const line of lines) {
    console.log(line)
  }
  console.log(`}`)
}

/**
 * Extract combo → strategy map from TexasSolver JSON output.
 *
 * TexasSolver output structure varies but typically contains strategy data
 * as an object mapping combo strings to action-frequency objects.
 * This function tries multiple known paths in the JSON structure.
 */
function extractComboStrategies(output: unknown): Map<string, SolverComboStrategy> {
  const strategies = new Map<string, SolverComboStrategy>()

  if (typeof output !== 'object' || output === null) return strategies

  const obj = output as Record<string, unknown>

  // Strategy 1: Direct combo → actions map at root
  if (looksLikeComboMap(obj)) {
    return parseComboMap(obj)
  }

  // Strategy 2: Nested under a "strategy" key
  if ('strategy' in obj && typeof obj.strategy === 'object' && obj.strategy !== null) {
    const strategyObj = obj.strategy as Record<string, unknown>
    if (looksLikeComboMap(strategyObj)) {
      return parseComboMap(strategyObj)
    }
  }

  // Strategy 3: Nested under "root" → "strategy"
  if ('root' in obj && typeof obj.root === 'object' && obj.root !== null) {
    const root = obj.root as Record<string, unknown>
    if ('strategy' in root && typeof root.strategy === 'object' && root.strategy !== null) {
      return parseComboMap(root.strategy as Record<string, unknown>)
    }
  }

  return strategies
}

/** Check if an object looks like a combo → actions map (keys are 4-char card strings) */
function looksLikeComboMap(obj: Record<string, unknown>): boolean {
  const keys = Object.keys(obj).slice(0, 5)
  // Combo keys are typically 4 chars (e.g., "AHKD") or 5 with space ("AH KD")
  return keys.some((key) => {
    const cleaned = key.replace(/\s/g, '')
    return cleaned.length === 4 && /^[AKQJT98765432][SHDC][AKQJT98765432][SHDC]$/i.test(cleaned)
  })
}

/** Parse an object as a combo → strategy map */
function parseComboMap(obj: Record<string, unknown>): Map<string, SolverComboStrategy> {
  const strategies = new Map<string, SolverComboStrategy>()

  for (const [combo, value] of Object.entries(obj)) {
    if (typeof value !== 'object' || value === null) continue
    const actionMap = value as Record<string, unknown>

    const strategy: SolverComboStrategy = {}
    for (const [action, freq] of Object.entries(actionMap)) {
      if (typeof freq === 'number') {
        strategy[action] = freq
      }
    }

    if (Object.keys(strategy).length > 0) {
      // Normalize combo key: remove spaces, uppercase
      const normalizedCombo = combo.replace(/\s/g, '').toUpperCase()
      strategies.set(normalizedCombo, strategy)
    }
  }

  return strategies
}

/** Format a Cell value as a TypeScript string literal */
function formatCell(cell: unknown): string {
  if (typeof cell === 'string') {
    return `'${cell}'`
  }
  if (typeof cell === 'object' && cell !== null && !Array.isArray(cell)) {
    const wc = cell as { weight: number; actions: Record<string, number> }
    const actionEntries = Object.entries(wc.actions)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')
    return `{ weight: ${wc.weight}, actions: { ${actionEntries} } }`
  }
  return JSON.stringify(cell)
}

main()
