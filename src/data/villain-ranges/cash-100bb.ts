import type { VillainRangeEntry } from './types'

/**
 * Villain continuing ranges for 100bb 6-max cash games.
 *
 * Currently empty — populate by running TexasSolver and converting
 * the output with scripts/convert-texassolver.ts.
 * See METHODOLOGY.md for the full workflow.
 */
export const villainRanges: VillainRangeEntry[] = [
  // --- Single Raised Pots (8 nodes) ---
  // 1. BTN open → BB call  (highest frequency SRP)
  // 2. CO open  → BB call
  // 3. CO open  → BTN call
  // 4. BTN open → SB call
  // 5. MP open  → BB call
  // 6. UTG open → BB call
  // 7. SB open  → BB call  (blind vs blind)
  // 8. UTG open → BTN call

  // --- 3-Bet Pots (4 nodes) ---
  // 9.  BTN open → BB 3bet  → BTN call
  // 10. CO open  → BTN 3bet → CO call
  // 11. BTN open → SB 3bet  → BTN call
  // 12. CO open  → BB 3bet  → CO call
]
