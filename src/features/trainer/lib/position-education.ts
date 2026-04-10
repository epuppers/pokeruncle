import type { Position } from '@/types/poker'
import { positionLabel } from '@/lib/poker-glossary'

const STORAGE_KEY = 'poker-positions-seen'

interface PositionInfo {
  /** First-encounter explanation shown prominently */
  intro: string
  /** Why this position matters strategically */
  why: string
  /** Preflop acting order (1 = first, 6 = last) */
  actOrder: number
}

export const POSITION_INFO: Record<Position, PositionInfo> = {
  UTG: {
    intro: `You're ${positionLabel('UTG')} — the first to act before the flop.`,
    why: 'You need a strong hand here because all five other players act after you. Any of them could have a big hand.',
    actOrder: 1,
  },
  MP: {
    intro: `You're in ${positionLabel('MP')} — second to act.`,
    why: 'Four players still act after you, so you need a fairly strong hand. Not as tough as first, but still cautious.',
    actOrder: 2,
  },
  CO: {
    intro: `You're the ${positionLabel('CO')} — a strong late position.`,
    why: 'Only the Dealer and the blinds act after you. You can play more hands because you have more information.',
    actOrder: 3,
  },
  BTN: {
    intro: `You're the ${positionLabel('BTN')} — the best seat at the table.`,
    why: 'After the flop, you act last. You see what everyone else does before you decide. This is a huge advantage.',
    actOrder: 4,
  },
  SB: {
    intro: `You're the ${positionLabel('SB')}.`,
    why: "You've already put $1 in. After the flop, you act first every round — a tough spot, so play carefully.",
    actOrder: 5,
  },
  BB: {
    intro: `You're the ${positionLabel('BB')}.`,
    why: "You've already put $2 in, so you're getting a discount to stay in the hand. But after the flop, you act second — still early.",
    actOrder: 6,
  },
}

/** Get the full first-encounter introduction for a position */
export function getPositionIntro(position: Position): string {
  const info = POSITION_INFO[position]
  return `${info.intro} ${info.why}`
}

/** Get the acting order label: "1st to act", "2nd to act", etc. */
export function getActingOrderLabel(position: Position): string {
  const order = POSITION_INFO[position].actOrder
  const suffix = order === 1 ? 'st' : order === 2 ? 'nd' : order === 3 ? 'rd' : 'th'
  return `${order}${suffix}`
}

/** Check if the user has seen this position before */
export function hasSeenPosition(position: Position): boolean {
  try {
    const seen = localStorage.getItem(STORAGE_KEY)
    if (!seen) return false
    const parsed: unknown = JSON.parse(seen)
    if (!Array.isArray(parsed)) return false
    return parsed.includes(position)
  } catch {
    return false
  }
}

/** Mark a position as seen */
export function markPositionSeen(position: Position): void {
  try {
    const seen = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = seen ? JSON.parse(seen) : []
    const arr = Array.isArray(parsed) ? (parsed as string[]) : []
    if (!arr.includes(position)) {
      arr.push(position)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
    }
  } catch {
    // localStorage unavailable — silently skip
  }
}
