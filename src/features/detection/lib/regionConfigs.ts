import type { RegionConfig } from '@/features/notes/lib/preprocessing.types'

/**
 * Board cards sit in the middle-upper area of GGPoker screenshots.
 * May need tuning for different screenshot resolutions.
 *
 * To calibrate with a real screenshot:
 * 1. Paste a GGPoker screenshot on /notes
 * 2. Note the board card positions relative to the full image
 * 3. Adjust these fractional (0-1) coordinates:
 *    - x: left edge of the board card area
 *    - y: top edge of the board card area
 *    - width: how wide the board card area spans
 *    - height: how tall the board card area spans
 * 4. Test with detectBoardCards() to verify card detection
 */
export const BOARD_CARD_REGION: RegionConfig = {
  x: 0.2,
  y: 0.25,
  width: 0.6,
  height: 0.15,
}
