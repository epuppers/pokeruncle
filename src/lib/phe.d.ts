declare module 'phe' {
  /** Evaluate 5–7 cards for hand strength. Lower value = stronger hand. */
  export function evaluateCards(cards: readonly string[]): number

  /** Same as evaluateCards but skips input validation for performance. */
  export function evaluateCardsFast(cards: readonly string[]): number

  /** Evaluate 5–7 numeric card codes for hand strength. */
  export function evaluateCardCodes(codes: readonly number[]): number

  /** Evaluate a space-separated board string (e.g. "Ah Ks Td 3c Ad"). */
  export function evaluateBoard(board: string): number

  /** Evaluate 5–7 cards and return the hand rank (0–8). */
  export function rankCards(cards: readonly string[]): number

  /** Same as rankCards but skips input validation. */
  export function rankCardsFast(cards: readonly string[]): number

  /** Evaluate card codes and return the hand rank (0–8). */
  export function rankCardCodes(codes: readonly number[]): number

  /** Evaluate a board string and return the hand rank (0–8). */
  export function rankBoard(board: string): number

  /** Convert a hand strength value to a rank classification (0–8). */
  export function handRank(value: number): number

  /** Convert a 2-char card string (e.g. "Ah") to a numeric card code. */
  export function cardCode(card: string): number

  /** Convert an array of 2-char card strings to numeric codes. */
  export function cardCodes(cards: readonly string[]): number[]

  /** Rank code mappings (e.g. { '2': 0, '3': 4, ... 'A': 48 }). */
  export const rankCodes: Readonly<Record<string, number>>

  /** Suit code mappings (e.g. { 's': 0, 'h': 1, 'd': 2, 'c': 3 }). */
  export const suitCodes: Readonly<Record<string, number>>

  /**
   * Human-readable rank descriptions indexed by rank number (0–8).
   * e.g. rankDescription[0] = "Straight Flush", rankDescription[8] = "High Card"
   */
  export const rankDescription: readonly string[]

  /** Hand rank constants. */
  export const ranks: {
    readonly STRAIGHT_FLUSH: 0
    readonly FOUR_OF_A_KIND: 1
    readonly FULL_HOUSE: 2
    readonly FLUSH: 3
    readonly STRAIGHT: 4
    readonly THREE_OF_A_KIND: 5
    readonly TWO_PAIR: 6
    readonly ONE_PAIR: 7
    readonly HIGH_CARD: 8
  }
}
