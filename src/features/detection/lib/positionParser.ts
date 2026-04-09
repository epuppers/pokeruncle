import type { Position } from '@/types/poker'
import { POSTFLOP_ORDER } from '@/constants/poker'

type ActionType = 'fold' | 'call' | 'raise' | 'allin' | 'check' | 'bet'

export interface ParsedAction {
  position: Position
  action: ActionType
  amount?: number
}

export interface PositionParseResult {
  oopPosition: Position | null
  ipPosition: Position | null
  potType: 'srp' | '3bet' | null
  actions: ParsedAction[]
  warnings: string[]
}

/** Bilingual action patterns (English + Russian) */
const ACTION_PATTERNS: [ActionType, RegExp][] = [
  ['allin', /(?:All[\s-]?in|Олл[\s-]?ин)/i],
  ['raise', /(?:Raise|Рейз|Raises)/i],
  ['call', /(?:Call|Колл|Calls)/i],
  ['fold', /(?:Fold|Фолд|Folds)/i],
  ['bet', /(?:Bet|Ставка|Bets)/i],
  ['check', /(?:Check|Чек|Checks)/i],
]

/** Position label pattern */
const POSITION_RE = /\b(UTG|MP|CO|BTN|SB|BB)\b/i

/** Common OCR misreads → correct position */
const OCR_FIXUPS: Record<string, Position> = {
  '8TN': 'BTN',
  'B7N': 'BTN',
  'BIN': 'BTN',
  'U7G': 'UTG',
  'UTС': 'UTG',
  'С0': 'CO',
  'C0': 'CO',
}

/**
 * Fix common OCR misreads of position labels.
 */
function fixOcrPosition(raw: string): Position | null {
  const upper = raw.toUpperCase()

  // Direct match
  if (['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'].includes(upper)) {
    return upper as Position
  }

  // Known OCR misreads
  return OCR_FIXUPS[upper] ?? null
}

/**
 * Extract an amount from text following an action word.
 */
function extractAmount(text: string): number | undefined {
  const match = text.match(/\$?([\d,.]+)/)
  if (!match) return undefined
  return parseFloat(match[1].replace(',', '.'))
}

/**
 * Parse OCR text into a list of position+action pairs.
 * Scans each line for a position label and an action word.
 */
export function parseActions(ocrText: string): ParsedAction[] {
  const actions: ParsedAction[] = []
  const lines = ocrText.split('\n')

  for (const line of lines) {
    // Try to find a position in this line
    const posMatch = line.match(POSITION_RE)
    // Also try OCR fixup patterns
    const ocrPosMatch = line.match(/\b([A-Z0-9А-Я]{2,3})\b/gi)

    let position: Position | null = null
    if (posMatch) {
      position = posMatch[1].toUpperCase() as Position
    } else if (ocrPosMatch) {
      for (const candidate of ocrPosMatch) {
        const fixed = fixOcrPosition(candidate)
        if (fixed) {
          position = fixed
          break
        }
      }
    }

    if (!position) continue

    // Try to find an action in this line
    for (const [actionType, pattern] of ACTION_PATTERNS) {
      if (pattern.test(line)) {
        const afterAction = line.slice(line.search(pattern))
        actions.push({
          position,
          action: actionType,
          amount: extractAmount(afterAction),
        })
        break
      }
    }
  }

  return actions
}

/**
 * Determine OOP/IP positions and pot type from parsed preflop actions.
 *
 * Logic:
 * - First raise = opener (RFI)
 * - If a second raise follows, it's a 3bet pot
 * - Players who didn't fold go to the flop
 * - OOP/IP determined by POSTFLOP_ORDER (SB first, BTN last)
 */
export function inferPositions(actions: ParsedAction[]): PositionParseResult {
  const warnings: string[] = []

  if (actions.length === 0) {
    return { oopPosition: null, ipPosition: null, potType: null, actions, warnings: ['No actions detected in OCR text'] }
  }

  // Count raises to determine pot type
  const raises = actions.filter((a) => a.action === 'raise' || a.action === 'allin')
  const folds = actions.filter((a) => a.action === 'fold')

  // Determine pot type
  let potType: 'srp' | '3bet' | null = null
  if (raises.length >= 2) {
    potType = '3bet'
  } else if (raises.length === 1) {
    potType = 'srp'
  }

  // Find players who went to the flop (didn't fold)
  const allPositions = new Set(actions.map((a) => a.position))
  const foldedPositions = new Set(folds.map((a) => a.position))
  const activePlayers = [...allPositions].filter((p) => !foldedPositions.has(p))

  if (activePlayers.length === 0) {
    return { oopPosition: null, ipPosition: null, potType, actions, warnings: ['All players folded — no flop'] }
  }

  if (activePlayers.length === 1) {
    warnings.push('Only one active player detected')
    return { oopPosition: activePlayers[0], ipPosition: null, potType, actions, warnings }
  }

  if (activePlayers.length > 2) {
    warnings.push('Multiway pot detected — showing heads-up approximation')
  }

  // Sort by postflop order to determine OOP/IP
  const sorted = activePlayers.sort(
    (a, b) => POSTFLOP_ORDER.indexOf(a) - POSTFLOP_ORDER.indexOf(b)
  )

  // OOP = earliest in postflop order, IP = latest
  const oopPosition = sorted[0]
  const ipPosition = sorted[sorted.length - 1]

  return { oopPosition, ipPosition, potType, actions, warnings }
}

/**
 * Parse OCR text to extract positions, pot type, and OOP/IP determination.
 */
export function parsePositions(ocrText: string): PositionParseResult {
  const actions = parseActions(ocrText)
  return inferPositions(actions)
}
