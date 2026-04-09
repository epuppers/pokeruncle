# Card Templates

52 PNG files for GGPoker board card template matching.

## Capture Instructions

1. Open GGPoker client, start a hand replay with board cards visible
2. Take a screenshot of the table
3. Use any image editor to crop each card tightly (no background)
4. Target dimensions: ~40x56px at 1x scale
5. Save as `{rank}_{suit}.png`

### Naming Convention

- Ranks: `A`, `K`, `Q`, `J`, `T`, `9`, `8`, `7`, `6`, `5`, `4`, `3`, `2`
- Suits: `s` (spades), `h` (hearts), `d` (diamonds), `c` (clubs)
- Examples: `A_s.png`, `7_h.png`, `2_c.png`

### Tips

- Capture from the same screenshot resolution you'll be analyzing (consistency matters)
- Crop to the card face only — exclude shadows, borders, table felt
- All 52 files should have similar dimensions
- The template matcher compares RGB pixels directly, so consistent capture conditions improve accuracy

### Tuning the Board Region

If card detection isn't finding cards, the crop region in `src/features/detection/lib/regionConfigs.ts` may need adjusting. The current defaults target standard GGPoker hand replay screenshots. To calibrate:

1. Paste a GGPoker screenshot on `/notes`
2. Note the board card positions relative to the full image
3. Adjust `BOARD_CARD_REGION` x/y/width/height (fractional 0-1 values)
