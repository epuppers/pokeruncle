import type { Rank, Suit } from '@/types/poker'

export const SUIT_SYMBOLS: Record<Suit, string> = {
  s: '♠',
  h: '♥',
  d: '♦',
  c: '♣',
}

export const SUIT_NAMES: Record<Suit, string> = {
  s: 'spades',
  h: 'hearts',
  d: 'diamonds',
  c: 'clubs',
}

export const RANK_NAMES: Record<Rank, string> = {
  A: 'Ace', K: 'King', Q: 'Queen', J: 'Jack', T: 'Ten',
  '9': 'Nine', '8': 'Eight', '7': 'Seven', '6': 'Six',
  '5': 'Five', '4': 'Four', '3': 'Three', '2': 'Two',
}

export const SUIT_COLORS: Record<Suit, string> = {
  s: 'text-gray-800',
  h: 'text-red-500',
  d: 'text-blue-600',
  c: 'text-emerald-600',
}

export const SUIT_BG: Record<Suit, string> = {
  s: 'bg-secondary',
  h: 'bg-red-950',
  d: 'bg-blue-950',
  c: 'bg-emerald-950',
}
