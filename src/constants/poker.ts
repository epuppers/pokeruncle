import type { Action, Position } from '@/types/poker'

// Postflop position order (who acts first)
// SB acts first postflop, BTN acts last
export const POSTFLOP_ORDER: Position[] = ['SB', 'BB', 'UTG', 'MP', 'CO', 'BTN']

// Background colors for each action (Tailwind classes)
export const ACTION_COLORS: Record<Action, string> = {
  fold: 'bg-muted',
  call: 'bg-emerald-700',
  raise: 'bg-sky-700',
  allin: 'bg-rose-700',
}

// Text colors for each action (Tailwind classes)
export const ACTION_TEXT: Record<Action, string> = {
  fold: 'text-muted-foreground',
  call: 'text-emerald-100',
  raise: 'text-sky-100',
  allin: 'text-rose-100',
}
